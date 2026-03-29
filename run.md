# 🚀 Tube-Senti: Project Setup and Execution Guide

This document provides complete instructions for setting up and running the Tube-Senti Video Reception Analyzer project.

---

## 📋 Table of Contents

1. [System Requirements](#system-requirements)
2. [Project Overview](#project-overview)
3. [Installation Steps](#installation-steps)
4. [Configuration](#configuration)
5. [Running the Project](#running-the-project)
6. [Testing the Application](#testing-the-application)
7. [Project Structure](#project-structure)
8. [Troubleshooting](#troubleshooting)

---

## System Requirements

### Required Software

- **Node.js**: v18.0.0 or higher (v25.0.0 confirmed working)
- **npm**: v8.0.0 or higher (v11.6.2 confirmed working)
- **R**: v4.0.0 or higher (v4.5.2 confirmed working)
- **Rscript**: Must be available in PATH
- **Git**: For version control

### Operating System
- ✅ macOS (tested)
- ✅ Linux
- ✅ Windows (with appropriate path configurations)

---

## Project Overview

**Tube-Senti** is a full-stack sentiment analysis platform that:

1. **Phase 1**: Downloads and preprocesses sentiment training data
2. **Phase 2**: Trains a Naive Bayes model on 50K+ movie reviews
3. **Phase 3**: Provides a REST API backend (Node.js/Express) to fetch YouTube comments and predict sentiment
4. **Phase 4**: Delivers an interactive frontend (Next.js) with authentication (Clerk)
5. **Phase 5**: (Planned) Power BI dashboard integration

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **ML Training** | R (e1071, tm, caret) | Model training and serialization |
| **Prediction Engine** | R (e1071, tm, jsonlite) | Real-time sentiment inference |
| **Backend API** | Node.js, Express | REST endpoints, R script orchestration |
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS | User interface and visualization |
| **Authentication** | Clerk | User authentication and authorization |
| **Data Source** | YouTube Data API v3 | Live comment fetching |

---

## Installation Steps

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd vra
```

### Step 2: Install R Packages

The project requires several R packages. Install them using the R console or command line:

```r
# Open R console or run:
Rscript -e "install.packages(c('tm', 'e1071', 'caret', 'dplyr', 'jsonlite', 'httr', 'ggplot2', 'glmnet'), repos='https://cloud.r-project.org')"
```

**Required R Packages:**
- `tm` - Text mining framework
- `e1071` - Naive Bayes implementation
- `caret` - Machine learning training utilities
- `dplyr` - Data manipulation
- `jsonlite` - JSON parsing
- `httr` - HTTP requests (for YouTube API)
- `ggplot2` - Visualizations
- `glmnet` - Logistic regression comparison

### Step 3: Install Backend Dependencies

```bash
cd backend
npm install
cd ..
```

**Backend Dependencies:**
- `express` - Web framework
- `cors` - Cross-origin resource sharing
- `helmet` - Security headers
- `morgan` - HTTP request logging
- `dotenv` - Environment variable management

### Step 4: Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

**Frontend Dependencies:**
- `next` - React framework
- `@clerk/nextjs` - Authentication
- `axios` - HTTP client
- `recharts` - Chart library
- `tailwindcss` - CSS framework
- `lucide-react` - Icon library

### Step 5: Create Required Directories

```bash
# Create necessary directories if they don't exist
mkdir -p data/raw data/processed models tmp logs visuals
```

---

## Configuration

### Backend Configuration

Create a `.env` file in the **project root** directory:

```bash
# .env file (root directory)

# Backend Server
NODE_ENV=development
PORT=3001

# R Configuration
R_EXECUTABLE=Rscript
R_SCRIPTS_PATH=r
MODELS_PATH=models
TMP_DIR=tmp

# YouTube API
YOUTUBE_API_KEY=your_youtube_api_key_here

# API Settings
API_TIMEOUT=30000
R_SCRIPT_TIMEOUT=60000
MAX_COMMENTS=100

# CORS
CORS_ORIGINS=http://localhost:3000
```

**To get a YouTube API Key:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable "YouTube Data API v3"
4. Create credentials (API Key)
5. Copy the API key to your `.env` file

### Frontend Configuration

Create a `.env` file in the **frontend** directory:

```bash
# frontend/.env

# Clerk Authentication (get from clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**To get Clerk Keys:**
1. Sign up at [clerk.com](https://clerk.com)
2. Create a new application
3. Copy the publishable and secret keys
4. Paste them in `frontend/.env`

---

## Running the Project

### Phase 1: Data Acquisition & Preprocessing

**Goal**: Download and preprocess the training dataset.

```bash
# Run the data acquisition and preprocessing scripts
cd r
Rscript 01_environment_setup.R
Rscript 02_download_and_structure_data.R
Rscript 04_apply_preprocessing.R
cd ..
```

**Expected Output:**
- `data/raw/` - Downloaded movie review dataset
- `data/processed/reviews_clean.csv` - Cleaned reviews
- `data/processed/dtm.rds` - Document-Term Matrix

**Time**: 10-20 minutes (downloads ~80MB dataset)

### Phase 2: Model Training & Evaluation

**Goal**: Train the Naive Bayes sentiment classifier.

```bash
cd r
Rscript train_model.R
cd ..
```

**Expected Output:**
- `models/nb_model.rds` - Trained Naive Bayes model (57KB)
- `models/training_metadata.rds` - Model metadata
- `models/vocabulary.rds` - Training vocabulary (6KB)
- `visuals/confusion_matrix.png` - Performance visualization
- `visuals/model_comparison_performance.png`
- `visuals/model_comparison_time.png`

**Performance Metrics (Expected):**
- Accuracy: ~85-88%
- Macro F1-Score: ~0.85-0.88
- Training Time: 5-15 seconds

**Time**: 2-5 minutes

### Phase 3: Backend API Server

**Goal**: Start the Express backend server.

```bash
# From project root
cd backend
npm start

# OR for development with auto-reload:
npm run dev
```

**Expected Output:**
```
╔════════════════════════════════════════════════════════════════════╗
║                   TUBE-SENTI BACKEND SERVER                       ║
╠════════════════════════════════════════════════════════════════════╣
║  Status:      Running                                              ║
║  Port:        3001                                                 ║
║  Environment: development                                          ║
╠════════════════════════════════════════════════════════════════════╣
║  Endpoints:                                                        ║
║    POST /api/predict  - Analyze video sentiment                    ║
║    GET  /api/health   - Health check                               ║
╚════════════════════════════════════════════════════════════════════╝
```

**Test the health endpoint:**
```bash
curl http://localhost:3001/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-03-29T16:00:00.000Z",
  "r_available": true,
  "model_loaded": true
}
```

### Phase 4: Frontend Application

**Goal**: Start the Next.js frontend.

**Open a new terminal window:**

```bash
# From project root
cd frontend
npm run dev
```

**Expected Output:**
```
  ▲ Next.js 14.2.35
  - Local:        http://localhost:3000
  - Ready in 2.5s
```

**Access the application:**
- Open browser to: `http://localhost:3000`
- Sign up for a new account (via Clerk)
- Navigate to Dashboard
- Enter a YouTube video URL to analyze sentiment

---

## Testing the Application

### Manual Testing Flow

1. **Backend Health Check**
   ```bash
   curl http://localhost:3001/api/health
   ```

2. **Test Sentiment Prediction** (requires YouTube API key)
   ```bash
   curl -X POST http://localhost:3001/api/predict \
     -H "Content-Type: application/json" \
     -d '{"videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
   ```

3. **Frontend User Flow**
   - Visit `http://localhost:3000`
   - Click "Get Started Free" or "Sign In"
   - Complete Clerk authentication
   - On Dashboard, paste a YouTube URL
   - Click "Analyze Sentiment"
   - View results (sentiment score, breakdown, sample comments)

### Test YouTube Videos

Use these public videos for testing:

| Video Type | URL | Expected Sentiment |
|------------|-----|-------------------|
| Very Positive | Rick Astley - Never Gonna Give You Up | 75-85% positive |
| Mixed | Controversial tech review | 45-55% mixed |
| Negative | Product complaint video | 25-40% negative |

**Note**: Results depend on actual comments at the time of analysis.

---

## Project Structure

```
vra/
├── backend/                   # Node.js Express API
│   ├── config/               # Configuration files
│   ├── middleware/           # Error handlers
│   ├── routes/               # API route handlers
│   │   ├── health.js        # Health check endpoint
│   │   └── predict.js       # Prediction endpoint
│   ├── utils/               # Utilities
│   │   ├── logger.js        # Winston logger
│   │   └── rRunner.js       # R script executor
│   ├── server.js            # Express app entry point
│   └── package.json         # Backend dependencies
│
├── frontend/                 # Next.js frontend
│   ├── src/
│   │   ├── app/             # Next.js 14 app router
│   │   │   ├── (auth)/      # Auth pages (sign-in, sign-up)
│   │   │   ├── (protected)/ # Protected routes (dashboard)
│   │   │   ├── layout.tsx   # Root layout
│   │   │   └── page.tsx     # Landing page
│   │   ├── components/      # React components
│   │   │   ├── ui/          # Reusable UI components
│   │   │   ├── dashboard/   # Dashboard-specific components
│   │   │   └── layout/      # Header, footer
│   │   ├── lib/             # Utilities and API client
│   │   └── middleware.ts    # Clerk auth middleware
│   └── package.json         # Frontend dependencies
│
├── r/                        # R scripts
│   ├── train_model.R        # Phase 2: Model training
│   ├── predict.R            # Sentiment prediction
│   ├── api_fetch.R          # YouTube comment fetcher
│   └── utils/               # R utility functions
│       └── text_preprocess.R
│
├── models/                   # Trained ML models
│   ├── nb_model.rds         # Naive Bayes model
│   ├── training_metadata.rds
│   └── vocabulary.rds       # Training vocabulary
│
├── data/                     # Training data (gitignored)
│   ├── raw/                 # Original dataset
│   └── processed/           # Preprocessed data
│
├── tmp/                      # Temporary comment files
├── logs/                     # Server logs
├── visuals/                  # Generated plots
├── .env                      # Environment variables (root)
└── run.md                    # This file
```

---

## Troubleshooting

### Issue: R packages not found

**Error**: `Error in library(tm) : there is no package called 'tm'`

**Solution**:
```r
Rscript -e "install.packages(c('tm', 'e1071', 'caret', 'dplyr', 'jsonlite', 'httr', 'ggplot2', 'glmnet'), repos='https://cloud.r-project.org')"
```

### Issue: Backend can't find Rscript

**Error**: `Failed to start R script: spawn Rscript ENOENT`

**Solution**:
1. Check if Rscript is in PATH: `which Rscript`
2. If on Windows, set in `.env`: `R_EXECUTABLE=Rscript.exe`
3. Or use full path: `R_EXECUTABLE=C:/Program Files/R/R-4.5.2/bin/Rscript.exe`

### Issue: YouTube API quota exceeded

**Error**: `quotaExceeded: The request cannot be completed because you have exceeded your quota`

**Solution**:
- Wait 24 hours for quota reset (10,000 units/day free tier)
- Or create a new Google Cloud project with a new API key
- Reduce MAX_COMMENTS in `.env` (e.g., `MAX_COMMENTS=50`)

### Issue: Frontend can't connect to backend

**Error**: `Backend service is unavailable` or CORS error

**Solution**:
1. Verify backend is running: `curl http://localhost:3001/api/health`
2. Check CORS_ORIGINS in `.env`: `CORS_ORIGINS=http://localhost:3000`
3. Ensure NEXT_PUBLIC_API_URL in frontend/.env: `NEXT_PUBLIC_API_URL=http://localhost:3001`

### Issue: Clerk authentication not working

**Error**: Clerk keys error or redirect loop

**Solution**:
1. Verify Clerk keys in `frontend/.env`
2. Check key prefixes: `pk_test_` (publishable) and `sk_test_` (secret)
3. Ensure sign-in/sign-up URLs are correct
4. Clear browser cookies and restart Next.js dev server

### Issue: Model file not found

**Error**: `Model file not found: models/nb_model.rds`

**Solution**:
Run Phase 2 model training first:
```bash
cd r
Rscript train_model.R
```

### Issue: No data directory

**Error**: Dataset files not found

**Solution**:
Run Phase 1 data acquisition:
```bash
cd r
Rscript 01_environment_setup.R
Rscript 02_download_and_structure_data.R
Rscript 04_apply_preprocessing.R
```

### Issue: Port already in use

**Error**: `Error: listen EADDRINUSE: address already in use :::3001`

**Solution**:
```bash
# Find and kill process using port 3001
lsof -ti:3001 | xargs kill -9

# Or change port in .env:
PORT=3002
```

---

## Performance Notes

### Expected Response Times

| Operation | Time |
|-----------|------|
| Health check | < 50ms |
| Fetch 100 comments | 2-5 seconds |
| Predict sentiment | 1-3 seconds |
| Full prediction pipeline | 3-8 seconds |

### Resource Usage

- **RAM**: ~200MB (backend) + ~300MB (frontend)
- **Disk**: ~150MB (models + node_modules + training data)
- **Network**: ~100KB per prediction (YouTube API)

---

## API Reference

### Backend Endpoints

#### Health Check
```
GET /api/health
Response: { status: "ok", r_available: true, model_loaded: true }
```

#### Predict Sentiment
```
POST /api/predict
Body: { "videoUrl": "https://www.youtube.com/watch?v=VIDEO_ID" }
Response: {
  "success": true,
  "videoId": "VIDEO_ID",
  "commentsAnalyzed": 100,
  "sentimentScore": 72.5,
  "interpretation": {
    "label": "Very Positive",
    "description": "The audience has a very positive reception to this video.",
    "emoji": "🟢"
  },
  "statistics": {
    "positive_count": 72,
    "negative_count": 28,
    "positive_percentage": 72.5,
    "negative_percentage": 27.5
  },
  "samplePositive": [...],
  "sampleNegative": [...],
  "predictions": [...]
}
```

---

## Next Steps

- **Phase 5**: Integrate Power BI dashboard for advanced visualizations
- **Enhancement**: Add multi-language support
- **Optimization**: Implement caching for frequently analyzed videos
- **Feature**: Real-time streaming analysis of live video comments

---

## Support

For issues or questions:
- Check the troubleshooting section above
- Review phase documentation files (PHASE_1-4.md)
- Contact: Aayush Sood (23BDS0177) or Yash Poddar (23BDS0195)

---

## License

Academic project for VIT Vellore - Programming for Data Science (BCSE207L)

---

**Last Updated**: March 29, 2026
**Version**: 1.0.0
