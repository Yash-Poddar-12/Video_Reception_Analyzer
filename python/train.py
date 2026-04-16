"""
==============================================================================
train.py - MSSF Training Script
==============================================================================
Purpose : Fine-tune Twitter-RoBERTa + train MLP fusion head on the UCI
          Sentiment Labelled Sentences dataset (and optionally Amazon Reviews).

Input   : data/processed/train.csv  (must contain columns: text, label)
           label values: "positive", "neutral", "negative"

Output  : models/mssf_checkpoint/   (saved via Hugging Face + PyTorch)

Usage:
  # Full fine-tuning (20-60 min on CPU, ~5 min with GPU):
  python python/train.py

  # Demo mode — trains MLP head only, backbone frozen (2-3 min on CPU):
  python python/train.py --demo

  # Specify data path:
  python python/train.py --data data/processed/train.csv
==============================================================================
"""

import argparse
import os
import sys
import json
import pandas as pd
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from transformers import AutoTokenizer, AutoModel, get_linear_schedule_with_warmup
from torch.optim import AdamW
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, f1_score
from tqdm import tqdm

# Make sure we can import from the same package
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from model.mssf_model import (
    MSSFModel, EmojiSentimentExtractor,
    compute_engagement_features, build_model,
    MODEL_NAME, LABEL2ID, ID2LABEL
)

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
CHECKPOINT_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "models", "mssf_checkpoint"
)
DEFAULT_DATA = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "data", "processed", "train.csv"
)
MAX_LEN = 128
BATCH_SIZE = 32
EPOCHS_FULL = 3          # Full fine-tuning epochs
EPOCHS_DEMO = 2          # Demo (frozen backbone) epochs
LR = 2e-5
SEED = 42


# ---------------------------------------------------------------------------
# Dataset
# ---------------------------------------------------------------------------
class SentimentDataset(Dataset):
    def __init__(self, texts, labels, tokenizer, emoji_extractor, max_len=MAX_LEN):
        self.texts = texts
        self.labels = labels
        self.tokenizer = tokenizer
        self.emoji_extractor = emoji_extractor
        self.max_len = max_len

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        text = str(self.texts[idx])
        label = self.labels[idx]

        tokens = self.tokenizer(
            text,
            max_length=self.max_len,
            padding="max_length",
            truncation=True,
            return_tensors="pt",
        )

        emoji_vec = torch.tensor(
            self.emoji_extractor.extract(text), dtype=torch.float32
        )
        # During training on static data: engagement = zeros always
        engagement_vec = torch.zeros(2, dtype=torch.float32)

        return {
            "input_ids": tokens["input_ids"].squeeze(0),
            "attention_mask": tokens["attention_mask"].squeeze(0),
            "emoji_vec": emoji_vec,
            "engagement_vec": engagement_vec,
            "label": torch.tensor(label, dtype=torch.long),
        }


# ---------------------------------------------------------------------------
# Load & Validate Dataset
# ---------------------------------------------------------------------------
def load_dataset(data_path: str) -> pd.DataFrame:
    if not os.path.exists(data_path):
        raise FileNotFoundError(
            f"Training data not found: {data_path}\n"
            "Run the R preprocessing pipeline first:\n"
            "  Rscript r/04_apply_preprocessing.R"
        )

    df = pd.read_csv(data_path)

    # Flexible column detection
    text_col = next((c for c in df.columns if c.lower() in ["text", "review", "comment"]), None)
    label_col = next((c for c in df.columns if c.lower() in ["label", "sentiment", "class"]), None)

    if text_col is None or label_col is None:
        raise ValueError(
            f"CSV must have 'text' and 'label' columns. Found: {list(df.columns)}"
        )

    df = df[[text_col, label_col]].rename(columns={text_col: "text", label_col: "label"})
    df = df.dropna()

    # Normalise labels to lowercase
    df["label"] = df["label"].astype(str).str.lower().str.strip()

    # Map numeric labels (0/1) to sentiment strings if needed
    if set(df["label"].unique()).issubset({"0", "1"}):
        print("[Train] Detected binary labels (0/1). Mapping: 1→positive, 0→negative")
        df["label"] = df["label"].map({"1": "positive", "0": "negative"})

    # Keep only valid labels
    df = df[df["label"].isin(LABEL2ID.keys())]

    # Map to integer IDs
    df["label_id"] = df["label"].map(LABEL2ID)

    print(f"[Train] Loaded {len(df)} samples")
    print(f"[Train] Label distribution:\n{df['label'].value_counts().to_string()}")

    return df


# ---------------------------------------------------------------------------
# Training Loop
# ---------------------------------------------------------------------------
def train_epoch(model, loader, optimizer, scheduler, device):
    model.train()
    total_loss = 0
    criterion = nn.CrossEntropyLoss()

    for batch in tqdm(loader, desc="  Training", leave=False):
        optimizer.zero_grad()

        input_ids = batch["input_ids"].to(device)
        attention_mask = batch["attention_mask"].to(device)
        emoji_vec = batch["emoji_vec"].to(device)
        engagement_vec = batch["engagement_vec"].to(device)
        labels = batch["label"].to(device)

        logits = model(input_ids, attention_mask, emoji_vec, engagement_vec)
        loss = criterion(logits, labels)
        loss.backward()

        nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
        optimizer.step()
        scheduler.step()

        total_loss += loss.item()

    return total_loss / max(len(loader), 1)


def eval_epoch(model, loader, device):
    model.eval()
    all_preds, all_labels = [], []

    with torch.no_grad():
        for batch in tqdm(loader, desc="  Evaluating", leave=False):
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            emoji_vec = batch["emoji_vec"].to(device)
            engagement_vec = batch["engagement_vec"].to(device)
            labels = batch["label"]

            logits = model(input_ids, attention_mask, emoji_vec, engagement_vec)
            preds = torch.argmax(logits, dim=1).cpu()
            all_preds.extend(preds.tolist())
            all_labels.extend(labels.tolist())

    f1 = f1_score(all_labels, all_preds, average="macro", zero_division=0)

    # Only report on classes actually present in this split
    present_ids   = sorted(set(all_labels) | set(all_preds))
    present_names = [ID2LABEL[i] for i in present_ids]

    report = classification_report(
        all_labels, all_preds,
        labels=present_ids,
        target_names=present_names,
        zero_division=0,
    )
    return f1, report


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(description="Train MSSF Sentiment Model")
    parser.add_argument("--data", default=DEFAULT_DATA, help="Path to train.csv")
    parser.add_argument(
        "--demo", action="store_true",
        help="Demo mode: freeze backbone, only train MLP head (faster)"
    )
    parser.add_argument("--epochs", type=int, default=None, help="Override epoch count")
    parser.add_argument("--batch-size", type=int, default=BATCH_SIZE)
    parser.add_argument("--lr", type=float, default=LR)
    parser.add_argument("--output", default=CHECKPOINT_DIR)
    args = parser.parse_args()

    torch.manual_seed(SEED)
    np.random.seed(SEED)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[Train] Device: {device}")
    print(f"[Train] Mode: {'DEMO (frozen backbone)' if args.demo else 'FULL fine-tuning'}")

    # Build model
    model, tokenizer, emoji_extractor = build_model()

    if args.demo:
        # Freeze the RoBERTa backbone — only MLP head trains
        for param in model.text_encoder.parameters():
            param.requires_grad = False
        print("[Train] Backbone frozen. Training MLP head only.")

    model = model.to(device)

    # Load data
    df = load_dataset(args.data)
    train_df, val_df = train_test_split(df, test_size=0.1, random_state=SEED, stratify=df["label_id"])

    epochs = args.epochs or (EPOCHS_DEMO if args.demo else EPOCHS_FULL)

    train_ds = SentimentDataset(
        train_df["text"].tolist(), train_df["label_id"].tolist(),
        tokenizer, emoji_extractor
    )
    val_ds = SentimentDataset(
        val_df["text"].tolist(), val_df["label_id"].tolist(),
        tokenizer, emoji_extractor
    )

    train_loader = DataLoader(train_ds, batch_size=args.batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_ds, batch_size=args.batch_size, shuffle=False, num_workers=0)

    # Optimizer + scheduler
    optimizer = AdamW(filter(lambda p: p.requires_grad, model.parameters()), lr=args.lr)
    total_steps = len(train_loader) * epochs
    scheduler = get_linear_schedule_with_warmup(
        optimizer,
        num_warmup_steps=int(0.1 * total_steps),
        num_training_steps=total_steps,
    )

    print(f"\n[Train] Training for {epochs} epoch(s) on {len(train_df)} samples")
    print(f"[Train] Validation on {len(val_df)} samples\n")

    best_f1 = 0.0
    history = []

    for epoch in range(1, epochs + 1):
        print(f"Epoch {epoch}/{epochs}")
        train_loss = train_epoch(model, train_loader, optimizer, scheduler, device)
        val_f1, val_report = eval_epoch(model, val_loader, device)

        print(f"  Train Loss: {train_loss:.4f} | Val F1 (macro): {val_f1:.4f}")
        print(f"  Classification Report:\n{val_report}")

        history.append({"epoch": epoch, "train_loss": train_loss, "val_f1": val_f1})

        if val_f1 > best_f1:
            best_f1 = val_f1
            _save_checkpoint(model, tokenizer, args.output, val_f1, args.demo)
            print(f"  ✓ Checkpoint saved (F1={val_f1:.4f})")

    print(f"\n[Train] Training complete. Best val F1: {best_f1:.4f}")
    print(f"[Train] Checkpoint: {args.output}")

    # Save training history
    with open(os.path.join(args.output, "training_history.json"), "w") as f:
        json.dump({"history": history, "best_f1": best_f1, "demo": args.demo}, f, indent=2)


def _save_checkpoint(model, tokenizer, output_dir: str, val_f1: float, demo_mode: bool):
    os.makedirs(output_dir, exist_ok=True)
    # Save backbone via HuggingFace convention
    model.text_encoder.save_pretrained(output_dir)
    tokenizer.save_pretrained(output_dir)
    # Save classifier head + metadata separately
    torch.save(model.classifier.state_dict(), os.path.join(output_dir, "classifier_head.pt"))
    meta = {
        "model_name": MODEL_NAME,
        "val_f1": val_f1,
        "label2id": LABEL2ID,
        "id2label": ID2LABEL,
        "demo_mode": demo_mode,
    }
    with open(os.path.join(output_dir, "model_meta.json"), "w") as f:
        json.dump(meta, f, indent=2)


if __name__ == "__main__":
    main()
