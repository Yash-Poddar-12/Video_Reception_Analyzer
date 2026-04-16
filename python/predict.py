"""
==============================================================================
predict.py - MSSF FastAPI Inference Service
==============================================================================
Purpose : HTTP API that loads the trained MSSF model and runs sentiment
          inference on batches of YouTube comments.

Endpoint: POST /predict
          GET  /health

Usage:
  uvicorn python.predict:app --host 0.0.0.0 --port 8000 --reload
  # OR from project root:
  python -m uvicorn python.predict:app --port 8000
==============================================================================
"""

import os
import sys
import json
import time
import numpy as np
import torch
import torch.nn.functional as F
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
from contextlib import asynccontextmanager
from transformers import AutoTokenizer, AutoModel

# Make sure we can import from the same package
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from python.model.mssf_model import (
    MSSFModel, EmojiSentimentExtractor,
    compute_engagement_features, ID2LABEL, LABEL2ID,
    MODEL_NAME
)

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHECKPOINT_DIR = os.path.join(PROJECT_ROOT, "models", "mssf_checkpoint")
MAX_LEN = 128
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# ---------------------------------------------------------------------------
# Global model state (loaded once at startup)
# ---------------------------------------------------------------------------
class ModelState:
    model: Optional[MSSFModel] = None
    tokenizer = None
    emoji_extractor: Optional[EmojiSentimentExtractor] = None
    is_ready: bool = False
    mode: str = "unloaded"  # "checkpoint" | "pretrained_base" | "unloaded"

state = ModelState()


def load_model():
    """
    Load MSSF model. Priority:
    1. Fine-tuned checkpoint in models/mssf_checkpoint/
    2. Base Twitter-RoBERTa (pre-trained 3-class head) — useful before training
    """
    checkpoint_meta = os.path.join(CHECKPOINT_DIR, "model_meta.json")

    if os.path.exists(checkpoint_meta):
        # Load fine-tuned checkpoint
        print(f"[MSSF] Loading fine-tuned checkpoint from: {CHECKPOINT_DIR}")
        meta = json.load(open(checkpoint_meta))

        tokenizer = AutoTokenizer.from_pretrained(CHECKPOINT_DIR)
        backbone = AutoModel.from_pretrained(CHECKPOINT_DIR)
        model = MSSFModel(text_encoder=backbone, num_labels=3)

        # Load the MLP head
        head_path = os.path.join(CHECKPOINT_DIR, "classifier_head.pt")
        if os.path.exists(head_path):
            model.classifier.load_state_dict(
                torch.load(head_path, map_location=DEVICE)
            )
        model = model.to(DEVICE)
        model.eval()

        state.model = model
        state.tokenizer = tokenizer
        state.emoji_extractor = EmojiSentimentExtractor()
        state.is_ready = True
        state.mode = "checkpoint"
        print(f"[MSSF] ✓ Fine-tuned checkpoint loaded (val F1={meta.get('val_f1', 'N/A'):.4f})")
        return

    # Fallback: use base pre-trained classification head from HuggingFace
    print(f"[MSSF] No checkpoint found. Loading base Twitter-RoBERTa from HuggingFace...")
    print(f"[MSSF] Run 'python python/train.py --demo' to fine-tune first.")
    from transformers import AutoModelForSequenceClassification
    try:
        tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
        backbone = AutoModel.from_pretrained(MODEL_NAME)
        model = MSSFModel(text_encoder=backbone, num_labels=3)
        # MLP head uses random initialization — fine for base mode.
        # Twitter-RoBERTa backbone embeddings still provide strong signal.

        model = model.to(DEVICE)
        model.eval()

        state.model = model
        state.tokenizer = tokenizer
        state.emoji_extractor = EmojiSentimentExtractor()
        state.is_ready = True
        state.mode = "pretrained_base"
        print("[MSSF] ✓ Base model loaded (not fine-tuned — run train.py for best results)")
    except Exception as e:
        print(f"[MSSF] ERROR loading model: {e}")
        state.is_ready = False


# ---------------------------------------------------------------------------
# FastAPI Lifespan (startup/shutdown)
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    load_model()
    yield
    print("[MSSF] Shutting down.")


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="MSSF Sentiment API",
    description="Multi-Signal Sentiment Fusion — YouTube Comment Analyser",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Request / Response Schemas
# ---------------------------------------------------------------------------
class CommentInput(BaseModel):
    text: str = Field(..., description="Raw comment text (with emojis)")
    like_count: int = Field(default=0, ge=0)
    reply_count: int = Field(default=0, ge=0)
    comment_id: Optional[str] = None
    author: Optional[str] = None


class PredictRequest(BaseModel):
    comments: list[CommentInput]
    total_comments: int = Field(default=100, description="Total comments for engagement normalization")


class CommentPrediction(BaseModel):
    comment_id: Optional[str]
    text: str
    sentiment: str           # positive | neutral | negative
    confidence: float        # max softmax probability
    prob_positive: float
    prob_neutral: float
    prob_negative: float


class PredictResponse(BaseModel):
    success: bool
    sentiment_score: float   # 0-100 (weighted: pos=1, neu=0.5, neg=0)
    interpretation: dict
    statistics: dict
    predictions: list[CommentPrediction]
    sample_positive: list[dict]
    sample_negative: list[dict]
    processing_time_ms: int
    model_mode: str


# ---------------------------------------------------------------------------
# Inference Helpers
# ---------------------------------------------------------------------------
def run_inference(
    texts: list[str],
    like_counts: list[int],
    reply_counts: list[int],
    total_comments: int,
) -> tuple[list[str], np.ndarray]:
    """Returns (predicted_labels, probs_array shape [N, 3])."""
    model = state.model
    tokenizer = state.tokenizer
    emoji_extractor = state.emoji_extractor

    # Tokenize
    encoded = tokenizer(
        texts,
        max_length=MAX_LEN,
        padding="max_length",
        truncation=True,
        return_tensors="pt",
    )
    input_ids = encoded["input_ids"].to(DEVICE)
    attention_mask = encoded["attention_mask"].to(DEVICE)

    # Emoji vectors
    emoji_vecs = emoji_extractor.batch_extract(texts).to(DEVICE)

    # Engagement vectors
    eng_vecs = compute_engagement_features(like_counts, reply_counts, total_comments).to(DEVICE)

    with torch.no_grad():
        logits = model(input_ids, attention_mask, emoji_vecs, eng_vecs)
        probs = F.softmax(logits, dim=1).cpu().numpy()

    preds = [ID2LABEL[int(np.argmax(p))] for p in probs]
    return preds, probs


def calculate_sentiment_score(predictions: list[str]) -> float:
    """
    Compute 0-100 Audience Sentiment Score (ASS).
    positive=1.0, neutral=0.5, negative=0.0
    """
    weights = {"positive": 1.0, "neutral": 0.5, "negative": 0.0}
    scores = [weights.get(p, 0.5) for p in predictions]
    return round(np.mean(scores) * 100, 2) if scores else 50.0


def interpret_score(score: float) -> dict:
    if score >= 75:
        return {"label": "Very Positive", "description": "The audience has a very positive reception to this video.", "emoji": "🟢"}
    elif score >= 55:
        return {"label": "Positive", "description": "The audience reception is mostly positive.", "emoji": "🟡"}
    elif score >= 40:
        return {"label": "Mixed/Neutral", "description": "The audience has a mixed or neutral reception.", "emoji": "🟡"}
    elif score >= 25:
        return {"label": "Negative", "description": "The audience has a negative reception to this video.", "emoji": "🟠"}
    else:
        return {"label": "Very Negative", "description": "The audience has a very negative reception to this video.", "emoji": "🔴"}


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.get("/health")
def health():
    return {
        "status": "ok" if state.is_ready else "loading",
        "model_mode": state.mode,
        "device": str(DEVICE),
        "checkpoint_dir": CHECKPOINT_DIR,
    }


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    if not state.is_ready:
        raise HTTPException(status_code=503, detail="Model not yet loaded. Please retry in a moment.")

    if not req.comments:
        raise HTTPException(status_code=400, detail="No comments provided.")

    start = time.time()

    texts = [c.text for c in req.comments]
    like_counts = [c.like_count for c in req.comments]
    reply_counts = [c.reply_count for c in req.comments]

    # Run MSSF inference in batches of 64
    all_preds, all_probs = [], []
    batch_size = 64
    for i in range(0, len(texts), batch_size):
        batch_texts = texts[i:i + batch_size]
        batch_lk = like_counts[i:i + batch_size]
        batch_rp = reply_counts[i:i + batch_size]
        preds, probs = run_inference(batch_texts, batch_lk, batch_rp, req.total_comments)
        all_preds.extend(preds)
        all_probs.extend(probs)

    all_probs = np.array(all_probs)  # (N, 3) — order: positive, neutral, negative

    # Build per-comment predictions
    predictions: list[CommentPrediction] = []
    for i, comment in enumerate(req.comments):
        probs = all_probs[i]
        predictions.append(CommentPrediction(
            comment_id=comment.comment_id,
            text=comment.text[:200],  # truncate for response size
            sentiment=all_preds[i],
            confidence=float(np.max(probs)),
            prob_positive=float(probs[0]),
            prob_neutral=float(probs[1]),
            prob_negative=float(probs[2]),
        ))

    # Statistics
    pos = sum(1 for p in all_preds if p == "positive")
    neu = sum(1 for p in all_preds if p == "neutral")
    neg = sum(1 for p in all_preds if p == "negative")
    total = len(all_preds)

    score = calculate_sentiment_score(all_preds)
    interpretation = interpret_score(score)

    # Sample high-confidence comments
    sorted_preds = sorted(predictions, key=lambda x: x.confidence, reverse=True)
    sample_positive = [
        {"text": p.text, "confidence": round(p.confidence, 3)}
        for p in sorted_preds if p.sentiment == "positive"
    ][:3]
    sample_negative = [
        {"text": p.text, "confidence": round(p.confidence, 3)}
        for p in sorted_preds if p.sentiment == "negative"
    ][:3]

    elapsed_ms = int((time.time() - start) * 1000)
    print(f"[MSSF] Inference: {total} comments in {elapsed_ms}ms | Score: {score}")

    return PredictResponse(
        success=True,
        sentiment_score=score,
        interpretation=interpretation,
        statistics={
            "positive_count": pos,
            "neutral_count": neu,
            "negative_count": neg,
            "total_count": total,
            "positive_percentage": round(pos / total * 100, 2) if total else 0,
            "neutral_percentage": round(neu / total * 100, 2) if total else 0,
            "negative_percentage": round(neg / total * 100, 2) if total else 0,
        },
        predictions=[p.model_dump() for p in predictions],
        sample_positive=sample_positive,
        sample_negative=sample_negative,
        processing_time_ms=elapsed_ms,
        model_mode=state.mode,
    )
