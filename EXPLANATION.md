# Video Reception Analyzer (VRA) — Complete Technical Explanation

> A full-stack, multi-language sentiment analysis system that takes any YouTube video URL and returns a real-time audience sentiment score — powered by a custom deep-learning model trained on real review data.

---

## Table of Contents

1. [What the Project Does](#1-what-the-project-does)
2. [Tech Stack at a Glance](#2-tech-stack-at-a-glance)
3. [The Dataset](#3-the-dataset)
4. [Data Engineering — The R Layer](#4-data-engineering--the-r-layer)
5. [The MSSF Model — Complete Architecture](#5-the-mssf-model--complete-architecture)
6. [Training Pipeline](#6-training-pipeline)
7. [Live Inference Pipeline](#7-live-inference-pipeline)
8. [The Backend — Node.js Orchestrator](#8-the-backend--nodejs-orchestrator)
9. [The Frontend — Next.js Web App](#9-the-frontend--nextjs-web-app)
10. [Evaluation System](#10-evaluation-system)
11. [File-by-File Reference](#11-file-by-file-reference)
12. [Key Design Decisions & Trade-offs](#12-key-design-decisions--trade-offs)
13. [End-to-End Data Flow](#13-end-to-end-data-flow)

---

## 1. What the Project Does

VRA (Video Reception Analyzer) answers one question: **"How is the audience really reacting to this YouTube video?"**

A user pastes any public YouTube video URL into the web dashboard. The system:

1. Fetches up to 100 of the top comments from the YouTube Data API v3.
2. Cleans and normalises the comment text using R.
3. Passes the cleaned comments to a custom PyTorch neural network — the **MSSF model** — that classifies each comment as `positive`, `neutral`, or `negative` using three simultaneous signals: the raw text, embedded emojis, and engagement metrics (likes and replies).
4. Aggregates the predictions into an **Audience Sentiment Score (ASS)** on a 0–100 scale.
5. Returns the score, a qualitative interpretation, per-comment predictions, and sample high-confidence positive/negative comments — all rendered in a real-time dashboard.

---

## 2. Tech Stack at a Glance

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 14 (TypeScript), TailwindCSS, Recharts | Web UI and dashboard |
| **Authentication** | Clerk | User sign-up / sign-in |
| **Backend API** | Node.js, Express 4 | Pipeline orchestrator |
| **Comment Fetcher** | R (`httr`, `jsonlite`, `dplyr`) | YouTube API v3 fetching |
| **Preprocessor** | R (`dplyr`, `jsonlite`) | Comment cleaning |
| **ML Service** | Python 3.11, FastAPI, uvicorn | MSSF inference API |
| **ML Model** | PyTorch, HuggingFace Transformers | Sentiment classification |
| **Pre-trained Backbone** | `cardiffnlp/twitter-roberta-base-sentiment-latest` | Transfer learning |
| **Training Data** | UCI Sentiment Labelled Sentences | Offline fine-tuning |
| **Emoji Lexicon** | Kralj Novak et al. (PLOS ONE 2015) | Emoji sentiment signal |
| **Containerisation** | Docker, Docker Compose | Production deployment |

---

## 3. The Dataset

### 3.1 Training Dataset — UCI Sentiment Labelled Sentences

The MSSF model is fine-tuned on the **UCI Sentiment Labelled Sentences** dataset, originally a benchmark for opinion mining from product and movie reviews.

| Property | Value |
|----------|-------|
| **Source** | UCI Machine Learning Repository |
| **Original domains** | Amazon product reviews, Yelp reviews, IMDb movie reviews |
| **Total samples** | ~10,000 sentences |
| **Label classes** | Binary: `positive` (1), `negative` (0) |
| **Format** | Raw text + integer label, tab-separated |
| **License** | Public domain / research use |

The R script `r/02_download_and_structure_data.R` downloads and structures this dataset. The subsequent script `r/04_apply_preprocessing.R` cleans it and outputs `data/processed/train.csv` in the format the Python training script expects:

```
text,label
"This product is amazing",positive
"Terrible quality, fell apart",negative
...
```

**Why this dataset?** It is:
- Pre-labelled with human annotations (no noisy automatic labels)
- Domain-diverse (products, restaurants, movies) — reduces over-fitting to one writing style
- Small enough to fine-tune on CPU in a reasonable time

### 3.2 Label Distribution

After loading the UCI dataset, the typical class distribution is:

| Class | Proportion |
|-------|-----------|
| Positive | ~62% |
| Negative | ~38% |
| Neutral | Not present in UCI data (added as a third class via the model head) |

Because the UCI data has no neutral class, the MSSF model learns to distinguish neutral from positive/negative primarily through its Twitter-RoBERTa backbone, which was itself pre-trained with a neutral class on millions of tweets.

### 3.3 Test Dataset — Live YouTube Comments

The "test" data in production is entirely live and ephemeral. Each time a user submits a video URL, the system:

- Calls `GET https://www.googleapis.com/youtube/v3/commentThreads` with parameters:
  - `part=snippet` — request only the text/metadata resources
  - `maxResults=100` — fetch up to 100 top-level comments
  - `order=relevance` — get the most relevant/prominent comments first
  - `textFormat=plainText` — strip HTML markup

- Returns: `comment_id`, `author`, `text`, `like_count`, `reply_count`, `published_at`

The live data is **not stored permanently**. It is written temporarily to `tmp/comments.csv`, processed, sent to the model, then the results are optionally appended to `exports/dashboard_data.csv` for optional Power BI analytics.

### 3.4 Emoji Sentiment Lexicon

A third data source is the **Kralj Novak emoji sentiment lexicon** (PLOS ONE 2015). This is a CSV file (`data/emoji_sentiment_data.csv`) mapping individual Unicode emoji characters to three sentiment scores:

| Column | Description |
|--------|-------------|
| `emoji` | Unicode emoji character |
| `positive` | Fraction of human raters who found it positive |
| `neutral` | Fraction of human raters who found it neutral |
| `negative` | Fraction of human raters who found it negative |

The lexicon contains ~750 emoji entries (the version downloaded by `python/download_emoji_lexicon.py` may vary). This feeds the emoji branch of the MSSF model.

---

## 4. Data Engineering — The R Layer

All data engineering in this project is done in R, using the `tidyverse` family of packages. R was chosen for this layer because it offers mature, well-tested text mining and NLP preprocessing tools, reproducible data pipelines, and is well-matched to the academic/data-science nature of this component.

### 4.1 Offline Data Engineering (Training Phase)

Before training, four R scripts prepare the data:

**`r/01_environment_setup.R`**  
Checks R version and installs all required packages if missing. Packages: `httr`, `jsonlite`, `dplyr`, `stringr`, `readr`, `lubridate`, `tidyr`, `purrr`, `ggplot2`, `scales`, `tm`, `e1071`, `caret`, `glmnet`, `patchwork`.

**`r/02_download_and_structure_data.R`**  
Downloads the UCI Sentiment Labelled Sentences CSV, parses the tab-separated format, and structures it into a clean `data/raw/reviews.csv` with columns: `doc_id`, `text`, `sentiment_label` (`positive`/`negative`), `source` (amazon/yelp/imdb), `word_count`, `char_count`.

**`r/04_apply_preprocessing.R`**  
The central data preparation script. It does several operations:

1. Reads `data/raw/reviews.csv`
2. Calls `r/utils/text_preprocess.R` which builds an `R` corpus using the `tm` package and applies:
   - `tolower` — normalise case
   - `removePunctuation` — strip punctuation marks
   - `removeNumbers` — remove digits
   - `removeWords(stopwords('en'))` — remove English function words (the, a, is, etc.)
   - `stripWhitespace` — collapse multiple spaces
3. Converts the corpus into a **Document-Term Matrix (DTM)** using TF (raw term-frequency) weighting, with terms appearing in > 99% of documents removed (the `sparse_threshold=0.99` argument)
4. Outputs **two separate files** that serve different purposes:
   - `data/processed/reviews_clean.csv` — R metadata (doc_id, sentiment, word_count, char_count) used by the old Naive Bayes pipeline
   - `data/processed/train.csv` — raw text + label, used by Python's `train.py` for MSSF fine-tuning
   - `data/processed/dtm.rds` — serialised DTM for the R-based Naive Bayes model
   - `models/vocabulary.rds` — training vocabulary for the Naive Bayes pipeline

> **Why keep both outputs?** The DTM + Naive Bayes approach is a traditional NLP baseline. The raw text + MSSF approach is the production deep learning approach. Having both allows direct performance comparison.

### 4.2 The Naive Bayes Baseline (R Only)

`r/train_model.R` trains a second, simpler model using only R:

- **Model**: `e1071::naiveBayes` with Laplace smoothing = 1
- **Features**: TF-weighted DTM columns (one column per vocabulary term)
- **Train/Test split**: 80/20 stratified using `caret::createDataPartition`
- **Comparison model**: Ridge logistic regression via `glmnet::cv.glmnet` (5-fold cross-validation)

**Results recorded in the codebase:**

| Model | Accuracy | Macro-F1 | Training Time |
|-------|----------|----------|---------------|
| Naive Bayes | 86% | 0.78 | 0.52 seconds |
| Logistic Regression | 88% | 0.83 | 1.87 seconds |

**Decision**: Naive Bayes was chosen for the R baseline because in a real-time API context (where predictions must return in < 2 seconds), the 3.6× speed advantage outweighs the marginal 2% accuracy gap. However, in production, this R model is replaced entirely by the MSSF model.

The trained model is serialised to `models/nb_model.rds`.

### 4.3 Live Data Engineering (Runtime Phase)

During live inference, two R scripts are executed by the Node.js backend as subprocess calls:

**`r/api_fetch.R`**  
Called as: `Rscript r/api_fetch.R <VIDEO_ID> <API_KEY> <MAX_COMMENTS>`

Steps:
1. Accepts a YouTube video URL or ID as a command-line argument
2. Extracts the 11-character video ID from the URL using regex patterns supporting standard (`v=`), short (`youtu.be/`), embed, and old format URLs
3. Makes paginated `GET` requests to `https://www.googleapis.com/youtube/v3/commentThreads` until `MAX_COMMENTS` comments are collected or pages are exhausted
4. Handles HTTP errors (API quota exceeded, 403 forbidden, network failures) gracefully
5. Flattens the nested JSON response into a tidy R data frame
6. Writes the results to `tmp/comments.csv`
7. Outputs a JSON result to stdout: `{ success, video_id, comments_fetched, output_file, sample_comments[] }`

**`r/preprocess.R`**  
Called as: `Rscript r/preprocess.R <COMMENTS_CSV_PATH>`

Steps:
1. Reads `tmp/comments.csv`
2. Cleans comment text: collapses `\r\n` and `\t` to spaces, trims whitespace
3. Ensures all required columns exist (`like_count`, `reply_count`, `comment_id`, `author`) — adds zero-valued defaults for missing columns
4. Coerces numeric columns (`like_count`, `reply_count`) to integers and replaces `NA` with 0
5. Removes empty or very short comments (< 3 characters)
6. Deduplicates exact duplicate comment texts
7. Selects final output columns: `comment_id`, `text`, `author`, `like_count`, `reply_count`, optionally `published_at`
8. Writes `tmp/preprocessed_comments.csv`
9. Outputs JSON to stdout: `{ success, comments_count, output_file, total_comments, removed_empty, removed_dupes }`

> Important: the R preprocessing for live comments is **intentionally lightweight** — it only cleans whitespace and validates columns. No stemming, no stopword removal, no punctuation stripping. This is because the MSSF model's tokenizer (Twitter-RoBERTa BPE tokenizer) performs its own subword tokenization and works better with natural text, including punctuation and capitalisation.

---

## 5. The MSSF Model — Complete Architecture

MSSF stands for **Multi-Signal Sentiment Fusion**. It is a custom PyTorch neural network that fuses three heterogeneous input signals through late fusion to classify text sentiment.

### 5.1 Overview

```
YouTube Comment
       │
       ├──────────────────────────────────────────────────────┐
       │                           │                          │
  BRANCH 1                   BRANCH 2                   BRANCH 3
  TEXT SIGNAL              EMOJI SIGNAL             ENGAGEMENT SIGNAL
  Twitter-RoBERTa          Emoji Lexicon            Like + Reply Counts
  768-dim vector           3-dim vector             2-dim vector
       │                           │                          │
       └───────────────────────────┴──────────────────────────┘
                                   │
                         CONCATENATION (773-dim)
                                   │
                         FUSION MLP HEAD
                     Linear(773→256) → ReLU → Dropout(0.3)
                     Linear(256→64)  → ReLU
                     Linear(64→3)
                                   │
                         SOFTMAX OUTPUT
                    P(Positive), P(Neutral), P(Negative)
```

### 5.2 Branch 1 — Text Signal (768-dim)

**Backbone**: `cardiffnlp/twitter-roberta-base-sentiment-latest` from HuggingFace.

This is a **RoBERTa-base** model (125M parameters) pre-trained on 198 million tweets by Cardiff NLP. It was then fine-tuned on the TweetEval sentiment benchmark with three classes: positive, neutral, negative. This makes it an excellent backbone for social-media-style text like YouTube comments, which share the same informal register, abbreviations, emoji use, and slang as tweets.

**Tokenization**:
- Tokenizer: Byte-Pair Encoding (BPE) from RoBERTa
- Special tokens: `<s>` (start), `</s>` (end), `<pad>` (padding)
- Max length: 128 tokens (sufficient for > 99% of YouTube comments)
- Truncation: longest-first truncation

**Embedding extraction**:  
Rather than using the final hidden layer output, the model extracts the **CLS token from the second-to-last hidden layer** (`outputs.hidden_states[-2][:, 0, :]`). This is a well-established trick in fine-tuning literature — the penultimate layer often contains richer, more transferable representations than the very last layer, which may be overfitted to the pre-training task's head.

The result is a `(batch_size, 768)` tensor.

### 5.3 Branch 2 — Emoji Signal (3-dim)

Class: `EmojiSentimentExtractor` in `python/model/mssf_model.py`.

**Motivation**: YouTube comments are dense with emojis. A comment like "🔥🔥🔥" is overwhelmingly positive even if the RoBERTa tokenizer converts it to unknown tokens. Processing emojis separately through a dedicated lexicon ensures this signal is never lost.

**Algorithm**:

1. Load the Kralj Novak emoji sentiment lexicon (`data/emoji_sentiment_data.csv`) at server startup. The lexicon maps each emoji Unicode character to three probabilities: `[p_positive, p_neutral, p_negative]`.

2. For each comment text, scan character by character: if a character is in the lexicon dictionary, collect its sentiment vector.

3. If no emojis are found in the text, return `[0.0, 0.0, 0.0]` (zero vector — neutral/absent signal).

4. If emojis are found, compute the **mean** of all emoji sentiment vectors: `scores.mean(axis=0)`. This gives a single 3-dim vector representing the overall emoji sentiment of the comment.

The result per comment is a `(3,)` vector: `[mean_positive, mean_neutral, mean_negative]`.

### 5.4 Branch 3 — Engagement Signal (2-dim)

Function: `compute_engagement_features()` in `python/model/mssf_model.py`.

**Motivation**: Engagement signals (likes, replies) are a proxy for community consensus. A comment with 10,000 likes is far more representative of community opinion than one with zero. Integrating this into the model allows it to up-weight high-signal comments implicitly.

**Algorithm**:

For each comment with `like_count` and `reply_count`, and given the `total_comments` count (used as a normalisation baseline):

```
denom = log(1 + total_comments + 1)
like_norm  = log(1 + like_count)  / denom
reply_norm = log(1 + reply_count) / denom
```

Log-normalization is used because engagement counts follow a heavy-tailed (Zipfian) distribution — a small number of comments get exponentially more likes than the rest. Log-normalisation compresses this range while preserving relative ordering.

The result per comment is a `(2,)` vector: `[like_norm, reply_norm]`.

### 5.5 Fusion MLP Head

After extracting the three branch vectors, they are concatenated into a single `(773,)` vector:

```
fused = concat([text_embedding(768), emoji_vec(3), engagement_vec(2)]) → (773,)
```

This fused vector is then passed through a multi-layer perceptron (MLP):

```python
self.classifier = nn.Sequential(
    nn.Linear(773, 256),   # compress
    nn.ReLU(),
    nn.Dropout(0.3),       # regularisation
    nn.Linear(256, 64),    # further compress
    nn.ReLU(),
    nn.Linear(64, 3),      # 3 sentiment classes
)
```

The output is raw logits `(batch_size, 3)`. During training, `CrossEntropyLoss` is applied to these logits. During inference, `F.softmax(logits, dim=1)` converts them to probabilities.

**Why these dimensions?**
- `773 → 256`: aggressive initial compression to force the model to learn the most important features
- `256 → 64`: further compression before the classification head
- `Dropout(0.3)`: randomly drops 30% of neurons during training to prevent co-adaptation and improve generalisation
- No dropout on the final two layers: preserves gradient signal for the classification boundary

### 5.6 Label Mapping

```python
LABEL2ID = {"positive": 0, "neutral": 1, "negative": 2}
ID2LABEL  = {0: "positive", 1: "neutral", 2: "negative"}
```

The order (positive=0, neutral=1, negative=2) is consistent with the Twitter-RoBERTa pre-training convention, which reduces any alignment mismatch during fine-tuning.

### 5.7 Model Modes

The Python inference service (`python/predict.py`) supports two fallback modes:

| Mode | Condition | Description |
|------|-----------|-------------|
| `checkpoint` | `models/mssf_checkpoint/model_meta.json` exists | Loads the fine-tuned checkpoint. This is the production mode with best accuracy. |
| `pretrained_base` | No checkpoint found | Loads the base Twitter-RoBERTa backbone with a randomly-initialised MLP head. Useful for demos before training. |

---

## 6. Training Pipeline

### 6.1 How to Trigger Training

```bash
# Full fine-tuning (backbone + head, recommended):
python python/train.py

# Demo mode (only MLP head trains, backbone frozen — faster):
python python/train.py --demo

# Custom settings:
python python/train.py --epochs 5 --batch-size 16 --lr 1e-5
```

### 6.2 Full Fine-Tuning Steps (inside `python/train.py`)

**Step 1: Load and validate the dataset**  
Reads `data/processed/train.csv`. Performs flexible column detection (`text`/`review`/`comment`, `label`/`sentiment`/`class`). Handles binary (0/1) to string label mapping. Filters out any rows with invalid labels.

**Step 2: Build the MSSF model**  
Calls `build_model()` which:
- Downloads or loads from HuggingFace cache: `cardiffnlp/twitter-roberta-base-sentiment-latest`
- Instantiates `MSSFModel(text_encoder=backbone, num_labels=3)` with a fresh MLP head

**Step 3: Dataset splitting**  
Performs a stratified 90/10 train/validation split using `sklearn.model_selection.train_test_split(stratify=df['label_id'])`. Stratification ensures the class distribution is preserved in both splits.

**Step 4: Dataset wrapping**  
`SentimentDataset` (a `torch.utils.data.Dataset` subclass) wraps the data. Each `__getitem__` call:
- Tokenizes the text via the RoBERTa tokenizer (padding to `max_length=128`)
- Extracts the emoji vector via `EmojiSentimentExtractor.extract(text)`
- Returns a zero engagement vector `[0, 0]` — because static training data has no engagement metadata

**Step 5: Optimizer and Scheduler**  
- Optimizer: `AdamW` with `lr=2e-5` (only parameters with `requires_grad=True`)
- Scheduler: linear warmup + linear decay over total training steps (`get_linear_schedule_with_warmup` from HuggingFace), with 10% warmup steps
- Gradient clipping: `nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)` — prevents exploding gradients

**Step 6: Training loop (per epoch)**  
- Forward pass → `CrossEntropyLoss` → backward → gradient clip → optimizer step → scheduler step
- Loss accumulated and averaged per epoch

**Step 7: Validation (per epoch)**  
- Model set to `eval()` mode, `torch.no_grad()` context
- All validation predictions collected
- Macro-averaged F1-score computed via `sklearn.metrics.f1_score(average='macro')`
- Full per-class classification report printed

**Step 8: Checkpoint saving (best F1 only)**  
The checkpoint is only saved when the current epoch achieves a new best validation F1:
- `model.text_encoder.save_pretrained(output_dir)` — saves RoBERTa backbone in HuggingFace format
- `tokenizer.save_pretrained(output_dir)` — saves tokenizer config and vocabulary
- `torch.save(model.classifier.state_dict(), 'classifier_head.pt')` — saves MLP head weights
- `model_meta.json` — stores model name, val F1, label mapping, demo mode flag

**Hyperparameters summary:**

| Parameter | Full training | Demo mode |
|-----------|--------------|-----------|
| Learning rate | 2e-5 | 2e-5 |
| Batch size | 32 | 32 |
| Epochs | 3 | 2 |
| Backbone frozen | No | Yes |
| Warmup ratio | 10% of total steps | 10% |
| Gradient clip | 1.0 | 1.0 |
| Dropout | 0.3 | 0.3 |
| Random seed | 42 | 42 |

### 6.3 Checkpoint Structure

After training, the checkpoint at `models/mssf_checkpoint/` looks like:

```
models/mssf_checkpoint/
├── config.json               ← RoBERTa architecture config
├── model.safetensors         ← RoBERTa backbone weights (~500MB)
├── tokenizer.json            ← BPE tokenizer vocabulary + merge rules
├── tokenizer_config.json     ← tokenizer settings
├── special_tokens_map.json   ← CLS, SEP, PAD tokens
├── classifier_head.pt        ← MLP head weights (~800KB)
├── model_meta.json           ← val_f1, label2id, demo_mode
└── training_history.json     ← [{epoch, train_loss, val_f1}], best_f1
```

---

## 7. Live Inference Pipeline

### 7.1 How the FastAPI Service Works

The Python inference service is defined in `python/predict.py` and runs as a persistent FastAPI/uvicorn server on port `8000`.

**On startup** (via `@asynccontextmanager lifespan`):
1. Checks if `models/mssf_checkpoint/model_meta.json` exists
2. If yes: loads the fine-tuned checkpoint (tokenizer + backbone from HuggingFace format, MLP head from `classifier_head.pt`)
3. If no: falls back to downloading/loading the base Twitter-RoBERTa from HuggingFace
4. Sets `state.is_ready = True` and initialises an `EmojiSentimentExtractor`
5. Moves model to GPU (CUDA/MPS) if available, otherwise CPU

**On `POST /predict`**:

The service receives a JSON payload:
```json
{
  "comments": [
    { "text": "this is amazing 🔥", "like_count": 142, "reply_count": 3, "comment_id": "abc", "author": "User1" }
  ],
  "total_comments": 100
}
```

Processing (in batches of 64):
1. Tokenize all texts together (padding to 128 tokens)
2. Compute emoji vectors via `EmojiSentimentExtractor.batch_extract()`
3. Compute engagement vectors via `compute_engagement_features(like_counts, reply_counts, total_comments)`
4. Forward pass through MSSF model (under `torch.no_grad()`)
5. Apply softmax to get `[P(positive), P(neutral), P(negative)]` per comment
6. Argmax to get predicted class, `max(probs)` for confidence

**Sentiment Score calculation**:

The Audience Sentiment Score (ASS) on 0–100:

```python
weights = {"positive": 1.0, "neutral": 0.5, "negative": 0.0}
score   = mean([weights[pred] for pred in all_predictions]) * 100
```

This naturally produces scores where:
- 100 comments, all positive → score = 100
- 100 comments, all negative → score = 0
- 50% positive, 50% negative → score = 50
- 50% positive, 50% neutral → score = 75

**Score interpretation**:

| Score Range | Label | Emoji |
|-------------|-------|-------|
| ≥ 75 | Very Positive | 🟢 |
| 55-74 | Positive | 🟡 |
| 40-54 | Mixed/Neutral | 🟡 |
| 25-39 | Negative | 🟠 |
| < 25 | Very Negative | 🔴 |

**On `GET /health`**:  
Returns current model status, mode (`checkpoint`/`pretrained_base`/`unloaded`), compute device, and checkpoint path.

---

## 8. The Backend — Node.js Orchestrator

The backend (`backend/server.js`) is an Express REST API that coordinates the entire 3-step prediction pipeline. It does not perform any ML — it is a pure orchestrator.

### 8.1 POST /api/predict

The pipeline controller in `backend/routes/predict.js`:

**Step 1 — Validate input**  
Accepts either `videoUrl` (full YouTube URL) or `videoId` (bare 11-char ID). Returns 400 if neither is provided or if `YOUTUBE_API_KEY` is not configured.

**Step 2 — Fetch comments (R)**  
Calls `runRScript('api_fetch.R', [videoIdentifier, apiKey, maxComments])`. This spawns:
```
Rscript /path/to/r/api_fetch.R VIDEO_ID API_KEY 100
```
R scripts communicate back exclusively via JSON on `stdout`. The Node.js process collects the full stdout, finds the first `{`, and parses everything from that point as JSON (to ignore any R startup messages that might appear before the JSON).

**Step 3 — Preprocess comments (R)**  
Reads `fetchResult.output_file` (the CSV path returned by api_fetch.R) and runs:
```
Rscript /path/to/r/preprocess.R tmp/comments.csv
```

**Step 4 — MSSF Inference (HTTP)**  
Reads the preprocessed CSV from `tmp/preprocessed_comments.csv`, parses it into JavaScript objects (`parseCommentsCsv()`), and makes an HTTP `POST` to the Python FastAPI service at `http://localhost:8000/predict` (or `http://python:8000/predict` in Docker) via Axios.

**Step 5 — Save outputs**  
- Saves a `tmp/predictions.csv` for the R evaluation/visualisation pipeline
- Appends to `exports/dashboard_data.csv` for Power BI integration

**Step 6 — Return unified response**  
Returns a single JSON object containing all results.

### 8.2 GET /api/health

Returns comprehensive health status:
- Server running status
- Whether `Rscript` is on PATH
- Whether the Python MSSF service is responding
- Whether the YouTube API key is configured

### 8.3 Utilities

**`backend/utils/rRunner.js`** — Spawns R scripts as child processes using `child_process.spawn()` (not `exec()`). Uses `shell: false` to avoid path-escaping issues. Implements a configurable timeout (default 60s) with `SIGTERM` kill on timeout. Parses JSON from stdout after the first `{` character.

**`backend/utils/pythonRunner.js`** — Thin Axios HTTP client that `POST`s to the Python FastAPI service. Handles `ECONNREFUSED` errors with a descriptive message ("Python MSSF service is not running").

**`backend/utils/logger.js`** — Winston-style structured logger writing to `logs/access.log`.

**`backend/config/index.js`** — Loads all environment variables from the root `.env` file and exposes typed config values for the rest of the application.

---

## 9. The Frontend — Next.js Web App

The frontend (`frontend/`) is a Next.js 14 application with the App Router, TypeScript, and TailwindCSS.

### 9.1 Authentication

Powered by **Clerk** (`@clerk/nextjs`). Users must sign in before accessing the dashboard. Clerk handles:
- Sign-up / sign-in pages (at `/sign-in` and `/sign-up`)
- Session management
- Redirect logic (after sign-in → `/dashboard`)

### 9.2 Key Pages

| Route | Purpose |
|-------|---------|
| `/` | Landing page — project introduction |
| `/sign-in` | Clerk sign-in page |
| `/sign-up` | Clerk sign-up page |
| `/dashboard` | Main analysis dashboard — video URL input, results display |

### 9.3 Dashboard Flow

1. User enters a YouTube URL in the input field
2. Frontend sends `POST http://localhost:3001/api/predict` with `{ videoUrl }` via Axios
3. While waiting, a loading state is shown
4. On success:
   - Sentiment score and label are displayed prominently
   - Recharts charts show positive/neutral/negative breakdown
   - Sample high-confidence positive and negative comments are shown
   - Model info (name, backbone, mode) is displayed
5. On error, an error message with the failure reason is shown

---

## 10. Evaluation System

There are two separate evaluation flows — one for model accuracy benchmarking, one for visualising live predictions.

### 10.1 Offline Model Accuracy Evaluation

**Python layer** (`python/evaluate.py`):

1. Loads `data/processed/train.csv`
2. Creates a held-out test split (default: 10%, stratified)
3. Loads the MSSF checkpoint (or base model)
4. Runs inference over the entire test set in batches
5. Computes and saves to `evaluation/`:

| File | Contents |
|------|---------|
| `metrics_summary.json` | Accuracy, Macro-F1, Weighted-F1, per-class {Precision, Recall, F1, AUC, Support}, confusion matrix |
| `predictions_with_labels.csv` | Every test row with `true_label`, `pred_label`, `confidence`, `prob_positive`, `prob_neutral`, `prob_negative`, `correct` |
| `confusion_matrix.png` | Raw counts + row-normalised % side by side |
| `per_class_metrics.png` | Precision/Recall/F1/AUC grouped bar chart |
| `confidence_histogram.png` | Confidence histograms split by correct vs. incorrect |
| `roc_curves.png` | One-vs-rest ROC curves per class |
| `precision_recall_curves.png` | Per-class PR curves |

**R layer** (`r/evaluate_model.R`):

Reads `evaluation/metrics_summary.json` and `evaluation/predictions_with_labels.csv` to produce six publication-quality `ggplot2` charts in `evaluation/r_plots/`:

| Chart | What it shows |
|-------|--------------|
| `01_confusion_matrix.png` | Heatmap with counts and row-normalised % per cell |
| `02_per_class_metrics.png` | Grouped bar — Precision, Recall, F1, AUC per class |
| `03_confidence_correct.png` | Histogram of confidence, overlaid correct (solid) vs. incorrect (transparent) |
| `04_calibration.png` | Reliability diagram — mean confidence vs. fraction correct per bin; perfect calibration = diagonal |
| `05_error_analysis.png` | Misclassification heatmap showing only incorrect predictions |
| `06_label_distribution.png` | Side-by-side true vs. predicted class counts |

Also exports a human-readable `evaluation_report.txt` summarising all metrics.

**Expected performance on test data (with fine-tuned checkpoint):**

| Metric | Value |
|--------|-------|
| Accuracy | ~87% |
| Macro-F1 | ~0.86 |
| Positive F1 | ~0.90 |
| Negative F1 | ~0.85 |

### 10.2 Live Prediction Visualisation

After the dashboard analyses a video, `tmp/predictions.csv` is generated. Running:

```bash
Rscript r/evaluate.R tmp/predictions.csv visuals/
```

Produces four visualizations in `visuals/`:
- `sentiment_distribution.png` — Donut chart of Positive/Neutral/Negative breakdown
- `confidence_distribution.png` — Histogram of confidence scores per class
- `probability_heatmap.png` — Per-comment 3D probability heatmap (sample of ≤100 comments)
- `engagement_vs_sentiment.png` — Violin plot of like_count distribution per sentiment class

---

## 11. File-by-File Reference

```
vra/
├── .env                              ← Environment variables (API keys, paths, ports)
├── .env.docker                       ← Docker env template (copy → .env)
├── docker-compose.yml                ← Orchestrates all 3 Docker services
├── .dockerignore                     ← Excludes node_modules, venvs, models, etc.
├── run.md                            ← Step-by-step local run guide
├── DOCKER.md                         ← Docker setup guide (commands to build/run)
├── EXPLANATION.md                    ← This file — complete project explanation
│
├── python/                           ← Python ML service
│   ├── Dockerfile                    ← Docker image for FastAPI service
│   ├── requirements.txt              ← PyPI dependencies (torch, transformers, fastapi, etc.)
│   ├── __init__.py                   ← Package marker
│   ├── download_emoji_lexicon.py     ← Downloads emoji sentiment CSV
│   ├── train.py                      ← MSSF fine-tuning script
│   ├── predict.py                    ← FastAPI inference server (port 8000)
│   ├── evaluate.py                   ← Offline accuracy evaluation (Python layer)
│   └── model/
│       ├── __init__.py
│       └── mssf_model.py             ← MSSFModel class, EmojiSentimentExtractor, engagement features
│
├── r/                                ← R data engineering & analytics layer
│   ├── 01_environment_setup.R        ← Package installation & version check
│   ├── 02_download_and_structure_data.R  ← Download UCI dataset → data/raw/reviews.csv
│   ├── 03_setup_directories.R        ← Create data/processed/, models/, tmp/, etc.
│   ├── 04_apply_preprocessing.R      ← DTM + train.csv preparation (main data pipeline)
│   ├── 05_dtm_analysis.R             ← DTM exploratory analysis
│   ├── 06_data_validation.R          ← Validate processed data integrity
│   ├── 07_expected_outputs_check.R   ← Check expected files exist
│   ├── 08_troubleshooting.R          ← Common issue diagnosis
│   ├── api_fetch.R                   ← Live: YouTube API comment fetcher (runtime)
│   ├── preprocess.R                  ← Live: comment cleaning for inference (runtime)
│   ├── train_model.R                 ← R-only Naive Bayes + Logistic Regression training
│   ├── evaluate.R                    ← Live prediction visualisation
│   ├── evaluate_model.R              ← Offline model accuracy evaluation (R layer)
│   ├── predict.R                     ← R-only prediction using nb_model.rds
│   ├── eda.R                         ← Exploratory data analysis
│   └── utils/
│       └── text_preprocess.R         ← Shared R preprocessing functions (build_corpus, create_dtm)
│
├── backend/                          ← Node.js Express API
│   ├── Dockerfile                    ← Docker image with Node + R runtime
│   ├── server.js                     ← Express app entry point
│   ├── package.json                  ← Node dependencies (express, axios, cors, helmet, morgan)
│   ├── config/
│   │   └── index.js                  ← Loads .env, exports typed config object
│   ├── routes/
│   │   ├── predict.js                ← POST /api/predict — 3-step pipeline controller
│   │   └── health.js                 ← GET /api/health
│   ├── middleware/
│   │   └── errorHandler.js           ← Global error handler + 404 handler
│   └── utils/
│       ├── logger.js                 ← Structured logger
│       ├── rRunner.js                ← Spawns Rscript subprocess, parses JSON output
│       └── pythonRunner.js           ← HTTP client for FastAPI service
│
├── frontend/                         ← Next.js web application
│   ├── Dockerfile                    ← Multi-stage Docker build (deps → build → runner)
│   ├── next.config.mjs               ← Next.js config (output: standalone for Docker)
│   ├── package.json                  ← Frontend dependencies
│   ├── tsconfig.json                 ← TypeScript config
│   ├── tailwind.config.ts            ← TailwindCSS theme config
│   ├── src/
│   │   ├── app/                      ← App Router pages
│   │   │   ├── page.tsx              ← Landing page
│   │   │   ├── dashboard/page.tsx    ← Main analysis dashboard
│   │   │   ├── sign-in/              ← Clerk sign-in
│   │   │   └── sign-up/              ← Clerk sign-up
│   │   ├── components/               ← Reusable React components
│   │   └── lib/                      ← Utilities, API client
│   └── public/                       ← Static assets
│
├── models/                           ← ML model storage
│   ├── mssf_checkpoint/              ← Fine-tuned MSSF checkpoint (~500MB, gitignored)
│   │   ├── config.json
│   │   ├── model.safetensors
│   │   ├── tokenizer.json
│   │   ├── classifier_head.pt
│   │   ├── model_meta.json
│   │   └── training_history.json
│   ├── nb_model.rds                  ← Serialised R Naive Bayes model
│   ├── vocabulary.rds                ← Training vocabulary for Naive Bayes
│   └── training_metadata.rds         ← R training run metadata
│
├── data/
│   ├── raw/
│   │   └── reviews.csv               ← Downloaded UCI dataset (gitignored)
│   ├── processed/
│   │   ├── train.csv                 ← text + label for Python MSSF training
│   │   ├── reviews_clean.csv         ← R metadata (doc_id, sentiment, counts)
│   │   └── dtm.rds                   ← Sparse DTM for Naive Bayes
│   └── emoji_sentiment_data.csv      ← Kralj Novak emoji lexicon
│
├── tmp/                              ← Runtime temporary files (gitignored)
│   ├── comments.csv                  ← Raw YouTube comments (per request)
│   ├── preprocessed_comments.csv     ← Cleaned comments (per request)
│   └── predictions.csv               ← Per-comment predictions (per request)
│
├── exports/                          ← Persistent output files
│   └── dashboard_data.csv            ← Cumulative predictions for Power BI
│
├── evaluation/                       ← Offline evaluation outputs
│   ├── metrics_summary.json          ← All accuracy metrics (JSON)
│   ├── predictions_with_labels.csv   ← Test set predictions
│   ├── confusion_matrix.png          ← Python matplotlib chart
│   ├── per_class_metrics.png
│   ├── roc_curves.png
│   └── r_plots/                      ← R ggplot2 charts
│       ├── 01_confusion_matrix.png
│       ├── 02_per_class_metrics.png
│       ├── 03_confidence_correct.png
│       ├── 04_calibration.png
│       ├── 05_error_analysis.png
│       ├── 06_label_distribution.png
│       └── evaluation_report.txt
│
├── logs/                             ← Server logs (gitignored)
│   └── access.log
│
└── visuals/                          ← Live prediction charts (gitignored)
    ├── sentiment_distribution.png
    ├── confidence_distribution.png
    ├── probability_heatmap.png
    └── engagement_vs_sentiment.png
```

---

## 12. Key Design Decisions & Trade-offs

### 12.1 Why multi-language (Python + R + Node.js)?

Each language is used where it excels:

- **R** for data engineering and statistical analysis — the `tm`, `caret`, `ggplot2`, and `tidyverse` packages are best-in-class for this type of work.
- **Python** for ML — PyTorch, HuggingFace Transformers, and the full scientific Python stack have no equals in the ML space.
- **Node.js** as the orchestrator — lightweight, event-driven, excellent for I/O-heavy coordination tasks (spawning subprocesses, making HTTP calls, streaming logs).

### 12.2 Why Twitter-RoBERTa as the backbone?

YouTube comments are stylistically much closer to tweets than to formal prose. Comments use:
- Abbreviations and informal spelling (ur, omg, lmao)
- Hashtags and @mentions
- Heavy emoji use
- Code switching (multiple languages in one sentence)
- Slang and neologisms

A model pre-trained on tweets (`cardiffnlp/twitter-roberta-base-sentiment-latest`) has already learned these patterns, giving us a vastly better starting point than a model trained on Wikipedia or news articles.

### 12.3 Why the second-to-last RoBERTa layer?

Empirically, the second-to-last transformer layer often outperforms the last on downstream tasks. The last layer is specialised for the pre-training task (sentiment on tweets), while earlier layers retain more general linguistic features. Using `hidden_states[-2][:, 0, :]` (CLS token of penultimate layer) balances specificity and generality.

### 12.4 Why Naive Bayes over Logistic Regression for the R baseline?

The project tested both:
- Naive Bayes: 86% accuracy, F1=0.78, **0.52s training time**
- Logistic Regression: 88% accuracy, F1=0.83, **1.87s training time**

In a production real-time API where response time matters, a 3.6× speed advantage with only a 2% accuracy reduction makes Naive Bayes the better engineering choice for the R-only pipeline.

### 12.5 Why log-normalise engagement features?

YouTube engagement data is extremely right-skewed (Zipfian). Most comments have 0-5 likes; a viral comment may have millions. Without normalisation, engagement values would dominate the MLP input and cause the model to ignore text content. Log-normalisation (`log(1 + x)`) compresses the range while preserving order and direction.

### 12.6 Why mount models as Docker volumes?

The MSSF checkpoint is ~500MB (RoBERTa backbone weights in `model.safetensors`). Baking it into the Docker image would:
- Make the image > 2GB
- Require a full rebuild every time the model is re-trained
- Prevent sharing the model between dev and production without image rebuilds

Mounting `./models:/app/models` as a bind volume solves all of this — the image stays lean and the checkpoint is updated independently.

### 12.7 Why ephemeral live data?

YouTube comments are not stored long-term (only `exports/dashboard_data.csv` accumulates results). This is a deliberate design choice:
- YouTube's Terms of Service restrict bulk storage of API data
- Reduces storage requirements
- Ensures the system always reflects the current state of comments (comments can be deleted/added)

---

## 13. End-to-End Data Flow

```
User pastes YouTube URL in browser
           │
           ▼
Frontend (Next.js, port 3000)
  POST /api/predict { videoUrl }
           │
           ▼
Backend API (Node.js Express, port 3001)
  1. Validate input
  2. Spawn Rscript r/api_fetch.R VIDEO_ID API_KEY 100
           │
           ▼
  YouTube Data API v3
  GET /commentThreads?videoId=...&maxResults=100
           │  [JSON: 100 comments]
           ▼
  R api_fetch.R parses response, writes tmp/comments.csv
  Returns JSON: { success, video_id, comments_fetched, output_file }
           │
           ▼
Backend API
  3. Spawn Rscript r/preprocess.R tmp/comments.csv
           │
           ▼
  R preprocess.R cleans text, validates columns,
  removes short/duplicate comments, writes tmp/preprocessed_comments.csv
  Returns JSON: { success, comments_count, output_file }
           │
           ▼
Backend API
  4. Read tmp/preprocessed_comments.csv
  5. POST http://python:8000/predict { comments: [...], total_comments: N }
           │
           ▼
Python FastAPI Service (port 8000)
  For each batch of 64 comments:
    ├─ Tokenize text → RoBERTa → CLS embedding (768-dim)
    ├─ Extract emoji vectors → (3-dim)
    └─ Compute engagement → (2-dim)
  Concatenate → (773-dim) → MLP → Softmax → [P(pos), P(neu), P(neg)]
  Compute Audience Sentiment Score
  Returns JSON: { sentiment_score, interpretation, statistics, predictions, ... }
           │
           ▼
Backend API
  6. Save tmp/predictions.csv
  7. Append exports/dashboard_data.csv
  8. Return unified JSON response to frontend
           │
           ▼
Frontend (Next.js)
  Renders:
  ├─ Sentiment score (0-100) with label and emoji
  ├─ Pie/bar chart (positive / neutral / negative %)
  ├─ Sample high-confidence positive comments
  ├─ Sample high-confidence negative comments
  └─ Model info (name, backbone, mode, inference time)
```

---

*This document reflects the codebase as of April 2026 on branch `dev2`. For run instructions, see `run.md`. For Docker setup, see `DOCKER.md`.*
