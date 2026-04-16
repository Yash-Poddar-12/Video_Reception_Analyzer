# Video Reception Analyzer — Step-by-Step Run Guide
## MSSF (Multi-Signal Sentiment Fusion) Architecture

---

## System Overview

The project runs **three services** simultaneously:

| Service | Technology | Port | Role |
|---|---|---|---|
| **Frontend** | Next.js | `3000` | User interface |
| **Backend API** | Node.js / Express | `3001` | Orchestrates the pipeline |
| **ML Inference** | Python / FastAPI | `8000` | MSSF sentiment model |

The pipeline is:
```
User (Browser) → Frontend → Backend API → R (api_fetch.R) → YouTube API
                                       → R (preprocess.R)  → clean CSV
                                       → Python FastAPI      → MSSF inference
                            ← ← ← ← ← ← ← ← ← ← ← ← ← ← sentiment results
```

---

## Prerequisites

| Tool | Minimum Version | Install |
|---|---|---|
| Node.js | 18+ | https://nodejs.org |
| Python | 3.10+ | https://python.org |
| Rscript | 4.0+ | https://cran.r-project.org |
| YouTube Data API v3 key | — | https://console.cloud.google.com |

---

## One-Time Setup

### Step 1 — Clone & configure environment

```bash
# Navigate to project root
cd /path/to/vra

# The .env file already contains your YouTube API key.
# Verify it:
cat .env
# Should show: YOUTUBE_API_KEY=AIzaSy...
```

If you need to add/change the API key, edit `.env`:
```
YOUTUBE_API_KEY=your_actual_api_key_here
NODE_ENV=development
PORT=3001
R_EXECUTABLE=Rscript
R_SCRIPTS_PATH=r
MODELS_PATH=models
TMP_DIR=tmp
PYTHON_SERVICE_URL=http://localhost:8000
```

---

### Step 2 — Install Node.js dependencies

```bash
# Backend dependencies
cd backend
npm install
cd ..

# Frontend dependencies
cd frontend
npm install
cd ..
```

---

### Step 3 — Create Python virtual environment & install dependencies

```bash
# From project root:
python3 -m venv python/venv

# Activate the venv
source python/venv/bin/activate       # macOS / Linux
# python\venv\Scripts\activate        # Windows

# Install all ML dependencies
pip install -r python/requirements.txt
```

> ⚠️ **PyTorch + Transformers are large (~2GB).** This takes 5-15 minutes on first install.
> On macOS Apple Silicon, PyTorch will use MPS (Metal) acceleration automatically.

---

### Step 4 — Install R packages

```bash
Rscript -e "install.packages(
  c('httr','jsonlite','dplyr','ggplot2','scales','tidyr','forcats','patchwork','tm'),
  repos='https://cran.rstudio.com/'
)"
```

---

### Step 5 — Download emoji sentiment lexicon

```bash
source python/venv/bin/activate
python python/download_emoji_lexicon.py
# → Saves to: data/emoji_sentiment_data.csv
```

---

### Step 6 — Prepare training data (R data engineering layer)

The R scripts download and clean the UCI Sentiment Labelled Sentences dataset:

```bash
# Step A: Download UCI sentiment data
Rscript r/02_download_and_structure_data.R

# Step B: Apply preprocessing, output data/processed/train.csv
Rscript r/04_apply_preprocessing.R
```

After this, `data/processed/train.csv` will have columns: `text`, `label` (positive/negative).

---

### Step 7 — Train the MSSF model

```bash
source python/venv/bin/activate

# OPTION A: Demo mode (fast — 2-5 min, frozen backbone, good enough for demo)
python python/train.py --demo

# OPTION B: Full fine-tuning (recommended — 20-60 min CPU, ~5 min GPU)
python python/train.py

# Custom options:
python python/train.py --demo --epochs 3 --batch-size 16
```

After training, the checkpoint is saved to:
```
models/mssf_checkpoint/
├── config.json
├── model.safetensors        ← RoBERTa backbone
├── tokenizer.json
├── classifier_head.pt       ← MLP fusion head weights
├── model_meta.json          ← val F1, label mapping
└── training_history.json    ← loss/F1 per epoch
```

> 💡 **You can skip Step 7 entirely for demo purposes.** The Python service falls back to the base Twitter-RoBERTa model from HuggingFace automatically if no checkpoint is found.

---

### Step 8 — Evaluate model accuracy on test data

This runs the trained MSSF model against the held-out 10 % of `data/processed/train.csv` (the exact split **not seen during training**) and produces a full evaluation report.

```bash
source python/venv/bin/activate

# Step A — Python evaluation (metrics + Python plots)
python python/evaluate.py

# Options:
python python/evaluate.py --test-size 0.20          # use 20% for testing
python python/evaluate.py --test data/processed/test.csv  # explicit test file
python python/evaluate.py --no-checkpoint           # evaluate base model only
```

This saves to `evaluation/`:
```
evaluation/
├── metrics_summary.json          ← all scalars (accuracy, F1, AUC per class)
├── predictions_with_labels.csv   ← per-row: true label, predicted label, probs
├── confusion_matrix.png          ← counts + row-normalised % side by side
├── per_class_metrics.png         ← Precision / Recall / F1 / AUC bars
├── confidence_histogram.png      ← confidence split by correct vs incorrect
├── roc_curves.png                ← one-vs-rest ROC for all 3 classes
└── precision_recall_curves.png   ← per-class PR curves
```

```bash
# Step B — R evaluation layer (publication-quality ggplot2 visuals + report)
Rscript r/evaluate_model.R

# Optionally specify paths explicitly:
Rscript r/evaluate_model.R evaluation/metrics_summary.json \
                            evaluation/predictions_with_labels.csv \
                            evaluation/r_plots
```

This saves to `evaluation/r_plots/`:
```
evaluation/r_plots/
├── 01_confusion_matrix.png     ← styled heatmap (counts + row %)
├── 02_per_class_metrics.png    ← grouped bar: Precision/Recall/F1/AUC
├── 03_confidence_correct.png   ← confidence split: correct vs wrong predictions
├── 04_calibration.png          ← reliability diagram (is the model overconfident?)
├── 05_error_analysis.png       ← which true class gets misclassified as what
├── 06_label_distribution.png   ← true vs predicted class distribution
└── evaluation_report.txt       ← full human-readable text report
```

Sample console output:
```
========================================================
  MSSF EVALUATION REPORT  (CHECKPOINT)
========================================================
  Test samples :  5,000
  Accuracy     :  0.8740  (87.40%)
  Macro-F1     :  0.8612
  Weighted-F1  :  0.8739
--------------------------------------------------------
  Class        Precision     Recall       F1    Support
  ------------------------------------------------------
  positive        0.8901     0.9020   0.8960      2500
  negative        0.8600     0.8460   0.8529      2500
--------------------------------------------------------
```

> ⚠️ **Run Step 6 and Step 7 before evaluating.** The evaluation script needs `data/processed/train.csv` and ideally a fine-tuned checkpoint.

---

## Running the Application

Open **3 separate terminal windows/tabs**.

### Terminal 1 — Python MSSF Service

```bash
cd /path/to/vra
source python/venv/bin/activate
uvicorn python.predict:app --host 0.0.0.0 --port 8000 --reload
```

Expected output:
```
[MSSF] Loading tokenizer and backbone from: cardiffnlp/twitter-roberta-base-sentiment-latest
[MSSF] Emoji lexicon loaded: 65 entries
[MSSF] ✓ Fine-tuned checkpoint loaded (or base model if no checkpoint)
INFO:     Uvicorn running on http://0.0.0.0:8000
```

Verify it's healthy:
```bash
curl http://localhost:8000/health
# → {"status":"ok","model_mode":"checkpoint","device":"cpu"}
```

---

### Terminal 2 — Node.js Backend

```bash
cd /path/to/vra/backend
npm run dev
# OR: node server.js
```

Expected output:
```
╔═════════════════════════════════════════╗
║         TUBE-SENTI BACKEND SERVER       ║
╠═════════════════════════════════════════╣
║  Status:      Running                   ║
║  Port:        3001                      ║
╚═════════════════════════════════════════╝
```

Verify the full stack health:
```bash
curl http://localhost:3001/api/health
# → { "status": "healthy", "checks": { "server": true, "rscript": true, "mssfModel": true, "youtubeApi": true } }
```

---

### Terminal 3 — Frontend

```bash
cd /path/to/vra/frontend
npm run dev
```

Open browser at: **http://localhost:3000**

---

## Running a Full Prediction

### Via the UI (recommended)

1. Open http://localhost:3000
2. Sign in (or sign up)
3. Go to Dashboard
4. Paste a YouTube video URL, e.g.:
   ```
   https://www.youtube.com/watch?v=dQw4w9WgXcQ
   ```
5. Click **Analyze**
6. Wait ~30-90 seconds (first run is slower — model is loaded into memory)

### Via cURL (for testing)

```bash
curl -X POST http://localhost:3001/api/predict \
  -H "Content-Type: application/json" \
  -d '{"videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

Expected response:
```json
{
  "success": true,
  "videoId": "dQw4w9WgXcQ",
  "commentsAnalyzed": 100,
  "sentimentScore": 72.5,
  "interpretation": { "label": "Very Positive", "emoji": "🟢", "description": "..." },
  "statistics": {
    "positive": 68, "neutral": 15, "negative": 17,
    "positivePercent": 68.0, "neutralPercent": 15.0, "negativePercent": 17.0
  },
  "modelInfo": {
    "name": "MSSF (Multi-Signal Sentiment Fusion)",
    "backbone": "cardiffnlp/twitter-roberta-base-sentiment-latest",
    "branches": ["Twitter-RoBERTa (768d)", "Emoji Lexicon (3d)", "Engagement (2d)"],
    "mode": "checkpoint"
  }
}
```

---

## Evaluation Pipelines

There are **two separate evaluation flows** — one for offline model accuracy, one for live prediction visualisation.

---

### A) Model Accuracy Evaluation (offline, on test data)

Use this to benchmark the trained model on the held-out IMDB test split.

```bash
# 1. Python — runs inference, computes all metrics, saves JSON + PNGs
source python/venv/bin/activate
python python/evaluate.py

# 2. R — reads Python output, produces ggplot2 visuals + text report
Rscript r/evaluate_model.R
```

**Python outputs** → `evaluation/`
| File | Contents |
|---|---|
| `metrics_summary.json` | Accuracy, Macro-F1, Weighted-F1, per-class Precision/Recall/F1/AUC, confusion matrix |
| `predictions_with_labels.csv` | Every test row with true label, predicted label, confidence, and all class probabilities |
| `confusion_matrix.png` | Raw counts + row-normalised % side by side |
| `per_class_metrics.png` | Precision / Recall / F1 / AUC grouped bar chart |
| `confidence_histogram.png` | Confidence histograms split by correct vs incorrect |
| `roc_curves.png` | One-vs-rest ROC curves with AUC for all 3 classes |
| `precision_recall_curves.png` | Per-class precision–recall curves with AP scores |

**R outputs** → `evaluation/r_plots/`
| File | Contents |
|---|---|
| `01_confusion_matrix.png` | Styled heatmap with counts and row % |
| `02_per_class_metrics.png` | Grouped bar chart with value labels |
| `03_confidence_correct.png` | Correct vs incorrect predictions overlaid |
| `04_calibration.png` | Reliability diagram — is the model over/under confident? |
| `05_error_analysis.png` | Misclassification heatmap (errors only) |
| `06_label_distribution.png` | True vs predicted class counts compared |
| `evaluation_report.txt` | Full human-readable text summary |

---

### B) Live Prediction Visualisation (after running the app)

Once you have analysed a YouTube video via the dashboard, the system saves `tmp/predictions.csv`.

```bash
# R visualizations of live YouTube predictions
Rscript r/evaluate.R tmp/predictions.csv visuals/
```

Outputs in `visuals/`:
- `sentiment_distribution.png` — Donut chart of Pos/Neu/Neg breakdown
- `confidence_distribution.png` — Histogram of model confidence per class
- `probability_heatmap.png` — Per-comment probability heatmap (sample of 100)
- `engagement_vs_sentiment.png` — Violin plot: like_count vs sentiment class

---

## Architecture Reference

```
Youtube Comment JSON
       │
┌──────┴──────────────────────────────┐
▼              ▼                      ▼
TEXT BRANCH    EMOJI BRANCH     ENGAGEMENT BRANCH
Twitter-       emoji-sentiment   [like_count,
RoBERTa        lexicon lookup     reply_count]
768-dim        3-dim vec         2-dim vec
└──────┬──────────────────────────────┘
       │  Concatenate (773-dim)
       ▼
  Linear(773→256) → ReLU → Dropout(0.3)
  Linear(256→64)  → ReLU
  Linear(64→3)    → Softmax
       ▼
  P(Positive), P(Neutral), P(Negative)
```

| File | Role |
|---|---|
| `r/02_download_and_structure_data.R` | Download + structure IMDB data |
| `r/04_apply_preprocessing.R` | Preprocess text → `data/processed/train.csv` |
| `r/api_fetch.R` | Fetch YouTube comments via Data API v3 |
| `r/preprocess.R` | Clean live comments, write preprocessed CSV |
| `r/evaluate.R` | Visualise live prediction CSV (post-dashboard) |
| `r/evaluate_model.R` | **Model accuracy evaluation** — reads `evaluation/` outputs |
| `python/model/mssf_model.py` | MSSF PyTorch model definition |
| `python/train.py` | Fine-tuning script (Twitter-RoBERTa + MLP head) |
| `python/evaluate.py` | **Model accuracy evaluation** — metrics, confusion matrix, ROC |
| `python/predict.py` | FastAPI inference service |
| `python/download_emoji_lexicon.py` | Downloads/creates emoji sentiment lexicon |
| `backend/server.js` | Express REST API orchestrator |
| `backend/routes/predict.js` | 3-step pipeline controller |
| `backend/utils/pythonRunner.js` | HTTP client for Python FastAPI |
| `frontend/` | Next.js user interface |

---

## Troubleshooting

### "Python MSSF service is not running"
The Python FastAPI service must be started **before** the backend. Run Terminal 1 first.

### "Connection refused / timeout downloading RoBERTa"
The model is downloaded from HuggingFace on first run. Ensure internet connectivity.
It caches in `~/.cache/huggingface/`. This only happens once.

### R script errors
```bash
# Check R is on PATH:
which Rscript
# If not found, add R to PATH or set R_EXECUTABLE in .env to the full path:
# R_EXECUTABLE=/usr/local/bin/Rscript
```

### "No training data found"
```bash
# Run R data pipeline first:
Rscript r/02_download_and_structure_data.R
Rscript r/04_apply_preprocessing.R
```

### Model running slowly
On CPU only, inference takes 5-15 seconds for 100 comments.
If you have a GPU or Apple Silicon, it will use it automatically (MPS/CUDA).

---

## Quick Reference — All Commands

```bash
# ── One-time setup ──────────────────────────────────────────────────────────
python3 -m venv python/venv && source python/venv/bin/activate
pip install -r python/requirements.txt
python python/download_emoji_lexicon.py
Rscript r/02_download_and_structure_data.R
Rscript r/04_apply_preprocessing.R
python python/train.py --demo           # Quick demo training (~3 min)
# OR full fine-tuning:
python python/train.py                  # Full training (~20-60 min CPU)

# ── Evaluate model accuracy on test data ────────────────────────────────────
source python/venv/bin/activate
python python/evaluate.py               # Runs on 10% held-out test split
Rscript r/evaluate_model.R              # R plots from Python output

# Custom options:
python python/evaluate.py --test-size 0.20          # 20% test split
python python/evaluate.py --no-checkpoint           # base model only

# ── Start services (3 separate terminals) ───────────────────────────────────
# Terminal 1: Python ML service
source python/venv/bin/activate && uvicorn python.predict:app --port 8000

# Terminal 2: Node.js backend
cd backend && npm run dev

# Terminal 3: Next.js frontend
cd frontend && npm run dev

# ── After analyzing a YouTube video — visualise live predictions ─────────────
Rscript r/evaluate.R tmp/predictions.csv visuals/
```
