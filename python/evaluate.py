"""
==============================================================================
python/evaluate.py - MSSF Model Evaluation Pipeline
==============================================================================
Runs the trained MSSF model on held-out test data and produces:

  Printed to console:
    - Overall accuracy, macro-F1, weighted-F1
    - Per-class precision / recall / F1 / support
    - Full confusion matrix (text)

  Saved to evaluation/ :
    - confusion_matrix.png         Raw normalised confusion-matrix heatmap
    - roc_curves.png               One-vs-rest ROC curves for all 3 classes
    - precision_recall_curves.png  Per-class PR curves
    - metrics_summary.json         All scalars (for R to render)
    - predictions_with_labels.csv  Full per-row results (for R plots)

Usage:
  # Evaluate on automatic 10 % test split from train.csv:
  python python/evaluate.py

  # Evaluate on an explicit test CSV  (must have 'text' and 'label' columns):
  python python/evaluate.py --test data/processed/test.csv

  # Control test split size (default 0.10):
  python python/evaluate.py --test-size 0.20

  # Skip loading a fine-tuned checkpoint (use base model):
  python python/evaluate.py --no-checkpoint
==============================================================================
"""

import argparse
import json
import os
import sys
import time

import numpy as np
import pandas as pd
import torch
import torch.nn.functional as F
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    roc_auc_score,
    roc_curve,
    precision_recall_curve,
    average_precision_score,
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import label_binarize
from torch.utils.data import DataLoader, Dataset
from tqdm import tqdm
from transformers import AutoModel, AutoTokenizer

# ---------------------------------------------------------------------------
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from model.mssf_model import (
    MODEL_NAME, LABEL2ID, ID2LABEL,
    MSSFModel, EmojiSentimentExtractor,
    compute_engagement_features,
)

# ---------------------------------------------------------------------------
PROJECT_ROOT   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHECKPOINT_DIR = os.path.join(PROJECT_ROOT, "models", "mssf_checkpoint")
DEFAULT_DATA   = os.path.join(PROJECT_ROOT, "data", "processed", "train.csv")
EVAL_DIR       = os.path.join(PROJECT_ROOT, "evaluation")
MAX_LEN        = 128
BATCH_SIZE     = 32
SEED           = 42
LABELS         = ["positive", "neutral", "negative"]   # display order

# colour palette (matches frontend + R theme)
CLR = {"positive": "#22c55e", "neutral": "#f59e0b", "negative": "#ef4444"}


# ===========================================================================
# Dataset
# ===========================================================================
class EvalDataset(Dataset):
    def __init__(self, texts, labels, tokenizer, emoji_extractor):
        self.texts          = texts
        self.labels         = labels
        self.tokenizer      = tokenizer
        self.emoji_extractor = emoji_extractor

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        text   = str(self.texts[idx])
        tokens = self.tokenizer(
            text, max_length=MAX_LEN, padding="max_length",
            truncation=True, return_tensors="pt",
        )
        emoji_vec      = torch.tensor(self.emoji_extractor.extract(text), dtype=torch.float32)
        engagement_vec = torch.zeros(2, dtype=torch.float32)   # no engagement in offline eval

        return {
            "input_ids":      tokens["input_ids"].squeeze(0),
            "attention_mask": tokens["attention_mask"].squeeze(0),
            "emoji_vec":      emoji_vec,
            "engagement_vec": engagement_vec,
            "label":          torch.tensor(self.labels[idx], dtype=torch.long),
        }


# ===========================================================================
# Model loading
# ===========================================================================
def load_model(use_checkpoint: bool, device):
    checkpoint_meta = os.path.join(CHECKPOINT_DIR, "model_meta.json")

    if use_checkpoint and os.path.exists(checkpoint_meta):
        print(f"[Eval] Loading fine-tuned checkpoint from: {CHECKPOINT_DIR}")
        tokenizer = AutoTokenizer.from_pretrained(CHECKPOINT_DIR)
        backbone  = AutoModel.from_pretrained(CHECKPOINT_DIR)
        model     = MSSFModel(text_encoder=backbone, num_labels=3)
        head_path = os.path.join(CHECKPOINT_DIR, "classifier_head.pt")
        if os.path.exists(head_path):
            model.classifier.load_state_dict(torch.load(head_path, map_location=device))
        mode = "checkpoint"
    else:
        if use_checkpoint:
            print("[Eval] WARNING: No checkpoint found — evaluating base model.")
        else:
            print("[Eval] Evaluating base pretrained model (backbone only).")
        tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
        backbone  = AutoModel.from_pretrained(MODEL_NAME)
        model     = MSSFModel(text_encoder=backbone, num_labels=3)
        mode      = "base"

    model = model.to(device)
    model.eval()
    emoji_extractor = EmojiSentimentExtractor()
    return model, tokenizer, emoji_extractor, mode


# ===========================================================================
# Data loading
# ===========================================================================
def load_test_data(data_path: str, test_size: float, explicit_test: bool):
    """Return (test_texts, test_label_ids, test_label_strs)."""
    if not os.path.exists(data_path):
        raise FileNotFoundError(
            f"Data file not found: {data_path}\n"
            "Run:  Rscript r/04_apply_preprocessing.R"
        )

    df = pd.read_csv(data_path)
    # Flexible column detection
    text_col  = next((c for c in df.columns if c.lower() in ["text","review","comment"]), None)
    label_col = next((c for c in df.columns if c.lower() in ["label","sentiment","class"]), None)
    if text_col is None or label_col is None:
        raise ValueError(f"Need 'text' and 'label' columns. Got: {list(df.columns)}")

    df = df[[text_col, label_col]].rename(columns={text_col:"text", label_col:"label"}).dropna()
    df["label"] = df["label"].astype(str).str.lower().str.strip()
    if set(df["label"].unique()).issubset({"0","1"}):
        df["label"] = df["label"].map({"1":"positive","0":"negative"})
    df = df[df["label"].isin(LABEL2ID.keys())]
    df["label_id"] = df["label"].map(LABEL2ID)

    if explicit_test:
        # whole file is the test set
        return df["text"].tolist(), df["label_id"].tolist(), df["label"].tolist()

    # split — take the held-out 10 % that was NOT used during training
    _, test_df = train_test_split(df, test_size=test_size, random_state=SEED, stratify=df["label_id"])
    print(f"[Eval] Test split: {len(test_df)} samples ({test_size*100:.0f}% of {len(df)})")
    print(f"[Eval] Label distribution:\n{test_df['label'].value_counts().to_string()}")
    return test_df["text"].tolist(), test_df["label_id"].tolist(), test_df["label"].tolist()


# ===========================================================================
# Inference
# ===========================================================================
def run_inference(model, loader, device):
    all_labels, all_preds, all_probs = [], [], []

    with torch.no_grad():
        for batch in tqdm(loader, desc="[Eval] Inferring"):
            ids   = batch["input_ids"].to(device)
            mask  = batch["attention_mask"].to(device)
            emoji = batch["emoji_vec"].to(device)
            eng   = batch["engagement_vec"].to(device)
            labs  = batch["label"]

            logits = model(ids, mask, emoji, eng)
            probs  = F.softmax(logits, dim=1).cpu().numpy()
            preds  = np.argmax(probs, axis=1)

            all_labels.extend(labs.tolist())
            all_preds.extend(preds.tolist())
            all_probs.extend(probs.tolist())

    return (
        np.array(all_labels),
        np.array(all_preds),
        np.array(all_probs),   # shape (N, 3)
    )


# ===========================================================================
# Metric helpers
# ===========================================================================
def compute_all_metrics(y_true, y_pred, y_prob):
    """Return a flat dict of all scalar metrics."""
    present_classes = sorted(np.unique(np.concatenate([y_true, y_pred])))
    present_names   = [ID2LABEL[c] for c in present_classes]
    report_dict     = classification_report(
        y_true, y_pred,
        labels=present_classes,
        target_names=present_names,
        output_dict=True,
        zero_division=0,
    )

    metrics = {
        "accuracy":          float(accuracy_score(y_true, y_pred)),
        "macro_f1":          float(f1_score(y_true, y_pred, average="macro",    zero_division=0)),
        "weighted_f1":       float(f1_score(y_true, y_pred, average="weighted", zero_division=0)),
        "per_class":         {},
        "n_test":            int(len(y_true)),
        "present_classes":   present_names,
    }

    for lbl in present_names:
        metrics["per_class"][lbl] = {
            "precision": float(report_dict[lbl]["precision"]),
            "recall":    float(report_dict[lbl]["recall"]),
            "f1":        float(report_dict[lbl]["f1-score"]),
            "support":   int(report_dict[lbl]["support"]),
        }

    # ROC-AUC (only if we have probabilities for present classes)
    try:
        y_bin = label_binarize(y_true, classes=list(range(len(LABEL2ID))))
        for i, lbl in ID2LABEL.items():
            if i < y_prob.shape[1] and lbl in present_names:
                metrics["per_class"][lbl]["roc_auc"] = float(
                    roc_auc_score(y_bin[:, i], y_prob[:, i])
                )
    except Exception:
        pass

    return metrics


def build_confusion_matrix(y_true, y_pred):
    present = sorted(np.unique(np.concatenate([y_true, y_pred])))
    cm      = confusion_matrix(y_true, y_pred, labels=present)
    names   = [ID2LABEL[c] for c in present]
    return cm, names


# ===========================================================================
# Plotting
# ===========================================================================
FONT = {"family": "DejaVu Sans", "size": 12}

def _fig_base():
    plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 11})


def plot_confusion_matrix(cm, class_names, out_dir):
    _fig_base()
    n      = len(class_names)
    cm_pct = cm.astype(float) / cm.sum(axis=1, keepdims=True).clip(1e-9)

    fig, axes = plt.subplots(1, 2, figsize=(14, 5))

    for ax, data, title, fmt in [
        (axes[0], cm,     "Confusion Matrix (counts)", "d"),
        (axes[1], cm_pct, "Confusion Matrix (row-normalised)", ".2f"),
    ]:
        cmap = plt.cm.Blues
        im   = ax.imshow(data, cmap=cmap, aspect="auto")
        plt.colorbar(im, ax=ax, fraction=0.046, pad=0.04)
        ax.set_xticks(range(n))
        ax.set_yticks(range(n))
        ax.set_xticklabels(class_names, fontsize=12, fontweight="bold")
        ax.set_yticklabels(class_names, fontsize=12, fontweight="bold")
        ax.set_xlabel("Predicted label", fontsize=12)
        ax.set_ylabel("True label", fontsize=12)
        ax.set_title(title, fontsize=13, fontweight="bold", pad=10)

        thresh = data.max() / 2.0
        for r in range(n):
            for c in range(n):
                val = data[r, c]
                txt = f"{val:{fmt}}" if fmt != "d" else f"{int(val)}"
                color = "white" if val > thresh else "black"
                ax.text(c, r, txt, ha="center", va="center",
                        fontsize=13, color=color, fontweight="bold")

    fig.suptitle("MSSF Model — Confusion Matrix", fontsize=15, fontweight="bold", y=1.02)
    plt.tight_layout()
    path = os.path.join(out_dir, "confusion_matrix.png")
    fig.savefig(path, dpi=150, bbox_inches="tight", facecolor="white")
    plt.close(fig)
    print(f"[Eval] Saved: {path}")


def plot_roc_curves(y_true, y_prob, class_names, out_dir):
    _fig_base()
    y_bin = label_binarize(y_true, classes=list(range(len(LABEL2ID))))
    n_cls = y_prob.shape[1]

    fig, ax = plt.subplots(figsize=(8, 6))
    for i, lbl in enumerate(class_names):
        if i >= n_cls:
            continue
        col_idx = LABEL2ID.get(lbl, i)
        if col_idx >= y_prob.shape[1] or col_idx >= y_bin.shape[1]:
            continue
        fpr, tpr, _ = roc_curve(y_bin[:, col_idx], y_prob[:, col_idx])
        auc  = roc_auc_score(y_bin[:, col_idx], y_prob[:, col_idx])
        color = CLR.get(lbl, "#6366f1")
        ax.plot(fpr, tpr, lw=2.5, color=color, label=f"{lbl.capitalize()}  (AUC = {auc:.3f})")

    ax.plot([0,1],[0,1], "k--", lw=1)
    ax.set_xlim([-0.01, 1.01])
    ax.set_ylim([-0.01, 1.02])
    ax.set_xlabel("False Positive Rate", fontsize=12)
    ax.set_ylabel("True Positive Rate", fontsize=12)
    ax.set_title("MSSF — One-vs-Rest ROC Curves", fontsize=13, fontweight="bold")
    ax.legend(fontsize=11, loc="lower right")
    ax.grid(alpha=0.3)
    plt.tight_layout()
    path = os.path.join(out_dir, "roc_curves.png")
    fig.savefig(path, dpi=150, bbox_inches="tight", facecolor="white")
    plt.close(fig)
    print(f"[Eval] Saved: {path}")


def plot_pr_curves(y_true, y_prob, class_names, out_dir):
    _fig_base()
    y_bin = label_binarize(y_true, classes=list(range(len(LABEL2ID))))
    n_cls = y_prob.shape[1]

    fig, ax = plt.subplots(figsize=(8, 6))
    for i, lbl in enumerate(class_names):
        if i >= n_cls:
            continue
        col_idx = LABEL2ID.get(lbl, i)
        if col_idx >= y_prob.shape[1] or col_idx >= y_bin.shape[1]:
            continue
        prec, rec, _ = precision_recall_curve(y_bin[:, col_idx], y_prob[:, col_idx])
        ap = average_precision_score(y_bin[:, col_idx], y_prob[:, col_idx])
        color = CLR.get(lbl, "#6366f1")
        ax.plot(rec, prec, lw=2.5, color=color, label=f"{lbl.capitalize()}  (AP = {ap:.3f})")

    ax.set_xlim([-0.01, 1.01])
    ax.set_ylim([-0.01, 1.02])
    ax.set_xlabel("Recall", fontsize=12)
    ax.set_ylabel("Precision", fontsize=12)
    ax.set_title("MSSF — Precision–Recall Curves", fontsize=13, fontweight="bold")
    ax.legend(fontsize=11, loc="upper right")
    ax.grid(alpha=0.3)
    plt.tight_layout()
    path = os.path.join(out_dir, "precision_recall_curves.png")
    fig.savefig(path, dpi=150, bbox_inches="tight", facecolor="white")
    plt.close(fig)
    print(f"[Eval] Saved: {path}")


def plot_confidence_hist(all_probs, y_pred, out_dir):
    _fig_base()
    confidences = all_probs.max(axis=1)
    pred_labels = [ID2LABEL[p] for p in y_pred]

    df = pd.DataFrame({"confidence": confidences, "sentiment": pred_labels})
    present = [l for l in LABELS if l in df["sentiment"].unique()]

    fig, axes = plt.subplots(1, len(present), figsize=(5 * len(present), 4), sharey=False)
    if len(present) == 1:
        axes = [axes]

    for ax, lbl in zip(axes, present):
        sub  = df[df["sentiment"] == lbl]["confidence"]
        color = CLR.get(lbl, "#6366f1")
        ax.hist(sub, bins=30, color=color, edgecolor="white", alpha=0.88)
        ax.axvline(sub.mean(), color="black", linestyle="--", lw=1.5,
                   label=f"Mean {sub.mean():.3f}")
        ax.set_title(f"{lbl.capitalize()}\n(n={len(sub)})", fontweight="bold")
        ax.set_xlabel("Confidence (max softmax)")
        ax.set_ylabel("Count")
        ax.legend(fontsize=9)
        ax.grid(axis="y", alpha=0.3)

    fig.suptitle("MSSF — Confidence Distribution by Predicted Class",
                 fontsize=13, fontweight="bold")
    plt.tight_layout()
    path = os.path.join(out_dir, "confidence_histogram.png")
    fig.savefig(path, dpi=150, bbox_inches="tight", facecolor="white")
    plt.close(fig)
    print(f"[Eval] Saved: {path}")


def plot_per_class_metrics(metrics, out_dir):
    _fig_base()
    per_class = metrics["per_class"]
    labels    = list(per_class.keys())
    metric_names = ["precision", "recall", "f1"]
    x = np.arange(len(labels))
    width = 0.25

    fig, ax = plt.subplots(figsize=(9, 5))
    bars_config = [
        ("precision", "#6366f1", -width),
        ("recall",    "#f59e0b",  0),
        ("f1",        "#22c55e",  width),
    ]
    for met, color, offset in bars_config:
        vals = [per_class[l].get(met, 0) for l in labels]
        rects = ax.bar(x + offset, vals, width - 0.02, label=met.capitalize(),
                       color=color, edgecolor="white", linewidth=0.5)
        ax.bar_label(rects, fmt="%.2f", padding=2, fontsize=9)

    ax.set_xticks(x)
    ax.set_xticklabels([l.capitalize() for l in labels], fontsize=12, fontweight="bold")
    ax.set_ylim(0, 1.15)
    ax.set_ylabel("Score", fontsize=12)
    ax.set_xlabel("Sentiment Class", fontsize=12)
    ax.set_title("MSSF — Per-Class Precision / Recall / F1", fontsize=13, fontweight="bold")
    ax.legend(fontsize=11)
    ax.grid(axis="y", alpha=0.3)
    ax.yaxis.set_major_formatter(mticker.PercentFormatter(1.0))

    # Annotate overall scores
    txt = (f"Accuracy: {metrics['accuracy']:.3f} | "
           f"Macro-F1: {metrics['macro_f1']:.3f} | "
           f"Weighted-F1: {metrics['weighted_f1']:.3f}")
    ax.text(0.5, -0.16, txt, ha="center", va="top", transform=ax.transAxes,
            fontsize=10, color="#374151")

    plt.tight_layout()
    path = os.path.join(out_dir, "per_class_metrics.png")
    fig.savefig(path, dpi=150, bbox_inches="tight", facecolor="white")
    plt.close(fig)
    print(f"[Eval] Saved: {path}")


# ===========================================================================
# Console report
# ===========================================================================
def print_report(metrics, cm, cm_names, model_mode, elapsed):
    w = 56
    print("\n" + "="*w)
    print(f"  MSSF EVALUATION REPORT  ({model_mode.upper()})")
    print("="*w)
    print(f"  Test samples : {metrics['n_test']:,}")
    print(f"  Elapsed      : {elapsed:.1f}s")
    print(f"  Accuracy     : {metrics['accuracy']:.4f}  ({metrics['accuracy']*100:.2f}%)")
    print(f"  Macro-F1     : {metrics['macro_f1']:.4f}")
    print(f"  Weighted-F1  : {metrics['weighted_f1']:.4f}")
    print("-"*w)
    print(f"  {'Class':<12} {'Precision':>10} {'Recall':>10} {'F1':>8} {'Support':>10}")
    print(f"  {'-'*54}")
    for lbl, vals in metrics["per_class"].items():
        roc = f"  AUC={vals['roc_auc']:.3f}" if "roc_auc" in vals else ""
        print(f"  {lbl:<12} {vals['precision']:>10.4f} {vals['recall']:>10.4f} "
              f"{vals['f1']:>8.4f} {vals['support']:>10}{roc}")
    print("-"*w)
    print("\n  Confusion Matrix:")
    header = " " * 14 + "  ".join(f"{n[:8]:>8}" for n in cm_names)
    print("  " + header)
    for i, row in enumerate(cm):
        row_str = "  ".join(f"{v:>8}" for v in row)
        print(f"  {cm_names[i][:12]:<12}  {row_str}")
    print("="*w + "\n")


# ===========================================================================
# main
# ===========================================================================
def main():
    parser = argparse.ArgumentParser(description="Evaluate MSSF Sentiment Model")
    parser.add_argument("--data",          default=DEFAULT_DATA,
                        help="Path to train.csv (or a dedicated test CSV)")
    parser.add_argument("--test",          default=None,
                        help="Explicit test CSV (skips test-split from train.csv)")
    parser.add_argument("--test-size",     type=float, default=0.10,
                        help="Fraction held out as test (default 0.10 = same as training split)")
    parser.add_argument("--no-checkpoint", action="store_true",
                        help="Force evaluation on base pretrained model")
    parser.add_argument("--output",        default=EVAL_DIR,
                        help="Output directory for plots/JSON")
    parser.add_argument("--batch-size",    type=int, default=BATCH_SIZE)
    args = parser.parse_args()

    os.makedirs(args.output, exist_ok=True)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[Eval] Device : {device}")

    # ── 1. Load model ──────────────────────────────────────────────────────
    model, tokenizer, emoji_extractor, mode = load_model(
        use_checkpoint=not args.no_checkpoint, device=device
    )
    print(f"[Eval] Model mode : {mode}")

    # ── 2. Load test data ──────────────────────────────────────────────────
    explicit = args.test is not None
    data_src = args.test if explicit else args.data
    texts, label_ids, label_strs = load_test_data(data_src, args.test_size, explicit)
    print(f"[Eval] Evaluating on {len(texts):,} samples")

    # ── 3. Inference ───────────────────────────────────────────────────────
    dataset = EvalDataset(texts, label_ids, tokenizer, emoji_extractor)
    loader  = DataLoader(dataset, batch_size=args.batch_size, shuffle=False, num_workers=0)

    t0 = time.time()
    y_true, y_pred, y_prob = run_inference(model, loader, device)
    elapsed = time.time() - t0

    # ── 4. Metrics ─────────────────────────────────────────────────────────
    metrics            = compute_all_metrics(y_true, y_pred, y_prob)
    cm, cm_names       = build_confusion_matrix(y_true, y_pred)
    metrics["model_mode"] = mode

    print_report(metrics, cm, cm_names, mode, elapsed)

    # ── 5. Save metrics JSON (for R) ───────────────────────────────────────
    metrics_path = os.path.join(args.output, "metrics_summary.json")
    # add confusion matrix to JSON
    metrics["confusion_matrix"] = {
        "matrix": cm.tolist(),
        "labels": cm_names,
    }
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)
    print(f"[Eval] Saved: {metrics_path}")

    # ── 6. Save per-row CSV (for R plots) ─────────────────────────────────
    out_df = pd.DataFrame({
        "text":          texts,
        "true_label":    label_strs,
        "pred_label":    [ID2LABEL[p] for p in y_pred],
        "correct":       y_true == y_pred,
        "confidence":    y_prob.max(axis=1),
        "prob_positive": y_prob[:, LABEL2ID["positive"]],
        "prob_neutral":  y_prob[:, LABEL2ID["neutral"]],
        "prob_negative": y_prob[:, LABEL2ID["negative"]],
    })
    csv_path = os.path.join(args.output, "predictions_with_labels.csv")
    out_df.to_csv(csv_path, index=False)
    print(f"[Eval] Saved: {csv_path}")

    # ── 7. Plots ───────────────────────────────────────────────────────────
    print("\n[Eval] Generating plots...")
    plot_confusion_matrix(cm, cm_names, args.output)
    plot_per_class_metrics(metrics, args.output)
    plot_confidence_hist(y_prob, y_pred, args.output)

    if len(cm_names) > 1:
        try:
            plot_roc_curves(y_true, y_prob, cm_names, args.output)
            plot_pr_curves(y_true, y_prob, cm_names, args.output)
        except Exception as e:
            print(f"[Eval] ROC/PR plot skipped: {e}")

    print(f"\n[Eval] ✓ All outputs saved to: {args.output}/")
    print(f"[Eval] Run R visuals with:")
    print(f"       Rscript r/evaluate_model.R {args.output}/metrics_summary.json "
          f"{args.output}/predictions_with_labels.csv")


if __name__ == "__main__":
    main()
