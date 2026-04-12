"""
==============================================================================
model/mssf_model.py - Multi-Signal Sentiment Fusion (MSSF) Model
==============================================================================
Architecture:
  Branch 1: Twitter-RoBERTa (768-dim CLS embedding)
  Branch 2: Emoji Sentiment Lexicon (3-dim vector)
  Branch 3: Engagement Features (2-dim: like_norm, reply_norm)

  Fusion: Concatenate → MLP (773 → 256 → 64 → 3)
  Output: Softmax over [Positive, Neutral, Negative]
==============================================================================
"""

import torch
import torch.nn as nn
from transformers import AutoTokenizer, AutoModel
import pandas as pd
import numpy as np
import emoji
import os
import re

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
MODEL_NAME = "cardiffnlp/twitter-roberta-base-sentiment-latest"
EMOJI_LEXICON_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "data", "emoji_sentiment_data.csv"
)

# Label mapping  (consistent with training data: 0=positive, 1=neutral, 2=negative)
LABEL2ID = {"positive": 0, "neutral": 1, "negative": 2}
ID2LABEL = {0: "positive", 1: "neutral", 2: "negative"}


# ---------------------------------------------------------------------------
# Emoji Sentiment Branch Helper
# ---------------------------------------------------------------------------
class EmojiSentimentExtractor:
    """
    Converts a raw text string into a 3-dim emoji sentiment vector
    [mean_positive, mean_neutral, mean_negative] using the Kralj Novak
    emoji-sentiment lexicon (PLOS ONE 2015).
    """

    def __init__(self, lexicon_path: str = EMOJI_LEXICON_PATH):
        self.lexicon: dict[str, list[float]] = {}
        self._load_lexicon(lexicon_path)

    def _load_lexicon(self, path: str):
        if not os.path.exists(path):
            print(f"[MSSF] WARNING: Emoji lexicon not found at {path}. Emoji branch will return zeros.")
            return
        df = pd.read_csv(path)
        # Expected columns: Emoji, Occurrences, Position, Negative, Neutral, Positive
        # Normalize column names to lowercase
        df.columns = [c.lower().strip() for c in df.columns]

        # Support both column naming conventions
        if "emoji" in df.columns:
            emoji_col = "emoji"
        elif "unicode codepoint" in df.columns:
            emoji_col = "unicode codepoint"
        else:
            print(f"[MSSF] WARNING: Could not find emoji column in lexicon CSV. Columns: {list(df.columns)}")
            return

        for _, row in df.iterrows():
            try:
                em = str(row[emoji_col])
                pos = float(row.get("positive", 0))
                neu = float(row.get("neutral", 0))
                neg = float(row.get("negative", 0))
                self.lexicon[em] = [pos, neu, neg]
            except Exception:
                pass

        print(f"[MSSF] Emoji lexicon loaded: {len(self.lexicon)} entries")

    def extract(self, text: str) -> list[float]:
        """Return [mean_pos, mean_neu, mean_neg] for all emojis in text."""
        # Extract all emoji characters from the text
        chars = [ch for ch in text if ch in self.lexicon]
        if not chars:
            return [0.0, 0.0, 0.0]
        scores = np.array([self.lexicon[ch] for ch in chars])  # (N, 3)
        return scores.mean(axis=0).tolist()

    def batch_extract(self, texts: list[str]) -> torch.Tensor:
        """Return (B, 3) tensor of emoji sentiment vectors."""
        vecs = [self.extract(t) for t in texts]
        return torch.tensor(vecs, dtype=torch.float32)


# ---------------------------------------------------------------------------
# Engagement Feature Helper
# ---------------------------------------------------------------------------
def compute_engagement_features(
    like_counts: list[int],
    reply_counts: list[int],
    total_comments: int = 100,
) -> torch.Tensor:
    """
    Log-normalize engagement counts against total comment pool.
    Returns (B, 2) tensor of [like_norm, reply_norm].
    """
    denom = np.log1p(total_comments + 1)
    feats = []
    for lk, rp in zip(like_counts, reply_counts):
        like_norm = np.log1p(lk) / denom
        reply_norm = np.log1p(rp) / denom
        feats.append([like_norm, reply_norm])
    return torch.tensor(feats, dtype=torch.float32)


# ---------------------------------------------------------------------------
# MSSF PyTorch Model
# ---------------------------------------------------------------------------
class MSSFModel(nn.Module):
    """
    Multi-Signal Sentiment Fusion model.

    text_dim       = 768  (CLS from second-to-last RoBERTa layer)
    emoji_dim      = 3    (pos/neu/neg from lexicon)
    engagement_dim = 2    (like_norm, reply_norm)
    total_input    = 773
    """

    def __init__(self, text_encoder: nn.Module, num_labels: int = 3):
        super().__init__()
        self.text_encoder = text_encoder

        self.classifier = nn.Sequential(
            nn.Linear(773, 256),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(256, 64),
            nn.ReLU(),
            nn.Linear(64, num_labels),
        )

    def forward(
        self,
        input_ids: torch.Tensor,
        attention_mask: torch.Tensor,
        emoji_vec: torch.Tensor,
        engagement_vec: torch.Tensor,
    ) -> torch.Tensor:
        outputs = self.text_encoder(
            input_ids=input_ids,
            attention_mask=attention_mask,
            output_hidden_states=True,
        )
        # CLS token from second-to-last hidden layer — richer than last layer
        text_embedding = outputs.hidden_states[-2][:, 0, :]  # (B, 768)

        # Ensure emoji/engagement vecs are on same device
        emoji_vec = emoji_vec.to(text_embedding.device)
        engagement_vec = engagement_vec.to(text_embedding.device)

        fused = torch.cat([text_embedding, emoji_vec, engagement_vec], dim=1)  # (B, 773)
        logits = self.classifier(fused)
        return logits


# ---------------------------------------------------------------------------
# Factory: build model + tokenizer
# ---------------------------------------------------------------------------
def build_model(num_labels: int = 3) -> tuple:
    """
    Returns (model, tokenizer, emoji_extractor).
    Loads Twitter-RoBERTa backbone with a fresh 3-class MLP head.
    """
    print(f"[MSSF] Loading tokenizer and backbone from: {MODEL_NAME}")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    backbone = AutoModel.from_pretrained(MODEL_NAME)

    model = MSSFModel(text_encoder=backbone, num_labels=num_labels)
    emoji_extractor = EmojiSentimentExtractor()
    return model, tokenizer, emoji_extractor
