# Phase 3: API Integration and Backend Development

## Overview

This phase focuses on building the complete backend infrastructure for Tube-Senti, including YouTube Data API v3 integration for fetching comments, the Node.js + Express REST API server, and R script orchestration via `child_process`. This phase creates "The Router" layer that connects the R-based ML brain to the frontend interface.

**Phase Duration:** 2-3 development sessions  
**Primary Languages:** JavaScript (Node.js), R  
**Key Deliverables:**
- `api_fetch.R` - YouTube API comment fetching script
- `predict.R` - Real-time sentiment prediction script
- Node.js Express backend server with REST endpoints
- Complete prediction pipeline integration

---

## Table of Contents

1. [Objectives](#1-objectives)
2. [Prerequisites](#2-prerequisites)
3. [Architecture Overview](#3-architecture-overview)
4. [YouTube Data API v3 Setup](#4-youtube-data-api-v3-setup)
5. [R Script: api_fetch.R](#5-r-script-api_fetchr)
6. [R Script: predict.R](#6-r-script-predictr)
7. [Node.js Backend Setup](#7-nodejs-backend-setup)
8. [Express Server Implementation](#8-express-server-implementation)
9. [R Script Orchestration](#9-r-script-orchestration)
10. [API Endpoints](#10-api-endpoints)
11. [Error Handling and Logging](#11-error-handling-and-logging)
12. [Testing the Backend](#12-testing-the-backend)
13. [Expected Outputs](#13-expected-outputs)

---

## 1. Objectives

By the end of Phase 3, you will have:

1. **Set up YouTube Data API v3** credentials and understand quota management
2. **Created `api_fetch.R`** that:
   - Accepts a video URL/ID as input
   - Fetches comments using `httr` for HTTP requests
   - Parses JSON responses using `jsonlite`
   - Outputs comments to `/tmp/comments.csv`
3. **Created `predict.R`** that:
   - Loads the trained Naive Bayes model (`nb_model.rds`)
   - Preprocesses new comment text using the same `tm` pipeline
   - Computes the Audience Sentiment Score (ASS)
   - Returns JSON output with sentiment predictions
4. **Built a Node.js + Express backend** that:
   - Exposes REST API endpoints
   - Spawns R scripts using `child_process`
   - Handles errors and returns appropriate HTTP responses
5. **Integrated the complete prediction pipeline** from video URL to sentiment score

---

## 2. Prerequisites

### Required Files from Previous Phases

| File | Location | Description |
|------|----------|-------------|
| `nb_model.rds` | `models/` | Trained Naive Bayes model |
| `vocabulary.rds` | `models/` | Saved vocabulary for preprocessing |
| `training_metadata.rds` | `models/` | Model metadata |
| `text_preprocess.R` | `r/utils/` | Preprocessing utility functions |

### Software Requirements

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | ≥ 20.x LTS | Backend runtime |
| npm | ≥ 10.x | Package management |
| R | ≥ 4.3.x | R script execution |
| Rscript | (bundled with R) | CLI for R scripts |

### API Credentials Required

- YouTube Data API v3 key (from Google Cloud Console)

---

## 3. Architecture Overview

### The Data Flow Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TUBE-SENTI BACKEND PIPELINE                        │
└─────────────────────────────────────────────────────────────────────────────┘

    [Frontend]                [Node.js Backend]                [R Layer]
        │                           │                              │
        │  POST /api/predict        │                              │
        │  { videoUrl }             │                              │
        ├──────────────────────────►│                              │
        │                           │  child_process.spawn         │
        │                           │  Rscript api_fetch.R         │
        │                           ├─────────────────────────────►│
        │                           │                              │ ── httr::GET
        │                           │                              │    YouTube API
        │                           │                              │    ▼
        │                           │                              │ ── Parse JSON
        │                           │                              │    ▼
        │                           │              /tmp/comments.csv│ ── Write CSV
        │                           │◄─────────────────────────────┤
        │                           │                              │
        │                           │  child_process.spawn         │
        │                           │  Rscript predict.R           │
        │                           ├─────────────────────────────►│
        │                           │                              │ ── Load model
        │                           │                              │    ▼
        │                           │                              │ ── Preprocess
        │                           │                              │    ▼
        │                           │                              │ ── Predict
        │                           │                              │    ▼
        │                           │            { JSON results }  │ ── Output JSON
        │                           │◄─────────────────────────────┤
        │                           │                              │
        │  { sentimentScore,        │                              │
        │    predictions,           │                              │
        │    summary }              │                              │
        │◄──────────────────────────┤                              │
        │                           │                              │
```

### Component Responsibilities

| Component | Role | Files |
|-----------|------|-------|
| **Node.js Express** | "The Router" - REST API, R script orchestration | `backend/server.js`, `backend/routes/` |
| **api_fetch.R** | YouTube comment fetching | `r/api_fetch.R` |
| **predict.R** | Sentiment prediction | `r/predict.R` |
| **child_process** | R script execution from Node.js | Built-in Node.js module |

---

## 4. YouTube Data API v3 Setup

### 4.1 Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Name: `tube-senti` (or similar)

### 4.2 Enable YouTube Data API v3

1. Navigate to **APIs & Services** → **Library**
2. Search for "YouTube Data API v3"
3. Click **Enable**

### 4.3 Create API Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **API Key**
3. Copy the generated API key
4. (Optional) Restrict the key:
   - **Application restrictions**: HTTP referrers or IP addresses
   - **API restrictions**: YouTube Data API v3 only

### 4.4 Understanding API Quotas

YouTube Data API v3 has a default quota of **10,000 units/day**:

| Operation | Cost | Description |
|-----------|------|-------------|
| `commentThreads.list` | 1 unit | Fetch comment threads |
| `comments.list` | 1 unit | Fetch replies |
| 100 comments | ~2 units | 2 API calls (100 per page) |

**Recommendation**: Limit to 100-500 comments per video to conserve quota.

### 4.5 Environment Configuration

Create `.env` file in project root:

```bash
# .env
YOUTUBE_API_KEY=your_api_key_here
NODE_ENV=development
PORT=3001
R_EXECUTABLE=/usr/local/bin/Rscript  # Adjust for your system
```

---

## 5. R Script: api_fetch.R

### 5.1 Purpose

`api_fetch.R` connects to YouTube Data API v3 to fetch comments for a given video.

**Input:** Video ID (passed as command-line argument)  
**Output:** `/tmp/comments.csv` with columns: `comment_id`, `text`, `author`, `published_at`, `like_count`

### 5.2 Required R Packages

```r
# Install if not already present
install.packages(c("httr", "jsonlite", "dplyr"))
```

### 5.3 Complete api_fetch.R Script

Create `r/api_fetch.R`:

```r
#!/usr/bin/env Rscript
# ==============================================================================
# api_fetch.R - YouTube Comment Fetcher
# ==============================================================================
# Purpose: Fetch comments from a YouTube video using the YouTube Data API v3
#
# Usage: Rscript r/api_fetch.R <VIDEO_ID> <API_KEY> [MAX_COMMENTS]
#
# Arguments:
#   VIDEO_ID     - YouTube video ID (e.g., "dQw4w9WgXcQ")
#   API_KEY      - YouTube Data API v3 key
#   MAX_COMMENTS - Maximum comments to fetch (default: 100)
#
# Output: /tmp/comments.csv
# ==============================================================================

library(httr)
library(jsonlite)
library(dplyr)

# ==============================================================================
# Parse Command Line Arguments
# ==============================================================================
args <- commandArgs(trailingOnly = TRUE)

if (length(args) < 2) {
    cat(toJSON(list(
        success = FALSE,
        error = "Usage: Rscript api_fetch.R <VIDEO_ID> <API_KEY> [MAX_COMMENTS]"
    ), auto_unbox = TRUE))
    quit(status = 1)
}

VIDEO_ID <- args[1]
API_KEY <- args[2]
MAX_COMMENTS <- ifelse(length(args) >= 3, as.integer(args[3]), 100)

cat("Fetching comments for video:", VIDEO_ID, "\n", file = stderr())
cat("Max comments:", MAX_COMMENTS, "\n", file = stderr())

# ==============================================================================
# YouTube API Configuration
# ==============================================================================
BASE_URL <- "https://www.googleapis.com/youtube/v3/commentThreads"

# ==============================================================================
# Fetch Comments Function
# ==============================================================================
fetch_comments <- function(video_id, api_key, max_comments = 100) {
    all_comments <- list()
    next_page_token <- NULL
    comments_fetched <- 0
    
    while (comments_fetched < max_comments) {
        # Calculate how many to fetch this iteration (max 100 per request)
        remaining <- max_comments - comments_fetched
        results_per_page <- min(100, remaining)
        
        # Build query parameters
        params <- list(
            part = "snippet",
            videoId = video_id,
            key = api_key,
            maxResults = results_per_page,
            order = "relevance",
            textFormat = "plainText"
        )
        
        # Add page token if continuing pagination
        if (!is.null(next_page_token)) {
            params$pageToken <- next_page_token
        }
        
        # Make API request
        response <- tryCatch({
            GET(BASE_URL, query = params)
        }, error = function(e) {
            return(NULL)
        })
        
        # Check for request errors
        if (is.null(response)) {
            cat("Error: Network request failed\n", file = stderr())
            break
        }
        
        if (status_code(response) != 200) {
            error_content <- content(response, "text", encoding = "UTF-8")
            cat("API Error:", status_code(response), "\n", file = stderr())
            cat("Response:", error_content, "\n", file = stderr())
            break
        }
        
        # Parse response
        data <- content(response, "text", encoding = "UTF-8")
        parsed <- fromJSON(data, flatten = TRUE)
        
        # Check if items exist
        if (is.null(parsed$items) || length(parsed$items) == 0) {
            cat("No more comments found\n", file = stderr())
            break
        }
        
        # Extract comment data
        items <- parsed$items
        
        comments_batch <- data.frame(
            comment_id = items$id,
            text = items$snippet.topLevelComment.snippet.textDisplay,
            author = items$snippet.topLevelComment.snippet.authorDisplayName,
            published_at = items$snippet.topLevelComment.snippet.publishedAt,
            like_count = items$snippet.topLevelComment.snippet.likeCount,
            stringsAsFactors = FALSE
        )
        
        all_comments[[length(all_comments) + 1]] <- comments_batch
        comments_fetched <- comments_fetched + nrow(comments_batch)
        
        cat("Fetched", comments_fetched, "comments so far\n", file = stderr())
        
        # Check for next page
        next_page_token <- parsed$nextPageToken
        if (is.null(next_page_token)) {
            cat("No more pages available\n", file = stderr())
            break
        }
    }
    
    # Combine all batches
    if (length(all_comments) == 0) {
        return(NULL)
    }
    
    result <- bind_rows(all_comments)
    return(result)
}

# ==============================================================================
# Extract Video ID from URL (if full URL provided)
# ==============================================================================
extract_video_id <- function(input) {
    # If already a video ID (11 characters), return as-is
    if (nchar(input) == 11 && !grepl("http|www|youtube", input)) {
        return(input)
    }
    
    # Try to extract from various URL formats
    patterns <- c(
        "v=([a-zA-Z0-9_-]{11})",           # Standard URL
        "youtu\\.be/([a-zA-Z0-9_-]{11})",  # Short URL
        "embed/([a-zA-Z0-9_-]{11})",       # Embed URL
        "/v/([a-zA-Z0-9_-]{11})"           # Old format
    )
    
    for (pattern in patterns) {
        match <- regmatches(input, regexpr(pattern, input, perl = TRUE))
        if (length(match) > 0 && nchar(match) > 0) {
            # Extract the capture group (video ID)
            id <- gsub(".*=|.*/", "", match)
            if (nchar(id) == 11) {
                return(id)
            }
        }
    }
    
    # If no match found, return input as-is (might be a video ID)
    return(input)
}

# ==============================================================================
# Main Execution
# ==============================================================================
tryCatch({
    # Extract video ID if URL was provided
    video_id <- extract_video_id(VIDEO_ID)
    cat("Extracted video ID:", video_id, "\n", file = stderr())
    
    # Fetch comments
    comments <- fetch_comments(video_id, API_KEY, MAX_COMMENTS)
    
    if (is.null(comments) || nrow(comments) == 0) {
        cat(toJSON(list(
            success = FALSE,
            error = "No comments found for this video",
            video_id = video_id
        ), auto_unbox = TRUE))
        quit(status = 1)
    }
    
    # Clean comment text (remove newlines, excessive whitespace)
    comments$text <- gsub("[\r\n]+", " ", comments$text)
    comments$text <- gsub("\\s+", " ", comments$text)
    comments$text <- trimws(comments$text)
    
    # Save to CSV
    output_path <- "/tmp/comments.csv"
    write.csv(comments, output_path, row.names = FALSE)
    
    cat("Comments saved to:", output_path, "\n", file = stderr())
    
    # Output success JSON to stdout
    result <- list(
        success = TRUE,
        video_id = video_id,
        comments_fetched = nrow(comments),
        output_file = output_path,
        sample_comments = head(comments$text, 3)
    )
    
    cat(toJSON(result, auto_unbox = TRUE, pretty = TRUE))
    
}, error = function(e) {
    cat(toJSON(list(
        success = FALSE,
        error = as.character(e$message)
    ), auto_unbox = TRUE))
    quit(status = 1)
})
```

### 5.4 Testing api_fetch.R

```bash
# Test the script directly
Rscript r/api_fetch.R "dQw4w9WgXcQ" "YOUR_API_KEY" 50

# Expected output (stdout):
# {
#   "success": true,
#   "video_id": "dQw4w9WgXcQ",
#   "comments_fetched": 50,
#   "output_file": "/tmp/comments.csv",
#   "sample_comments": ["Great video!", "Love this song", "Classic!"]
# }

# Check the output file
head /tmp/comments.csv
```

---

## 6. R Script: predict.R

### 6.1 Purpose

`predict.R` loads the trained model and predicts sentiment for comments.

**Input:** Path to comments CSV (or uses `/tmp/comments.csv` by default)  
**Output:** JSON with predictions and Audience Sentiment Score (ASS)

### 6.2 Audience Sentiment Score (ASS) Formula

The README specifies the following formula for computing the overall sentiment score:

```
ASS = (P_positive × 1.0) + (P_neutral × 0.5) + (P_negative × 0.0)

Where:
- P_positive = proportion of positive predictions
- P_neutral = proportion of neutral predictions (if using 3-class)
- P_negative = proportion of negative predictions

For binary classification (positive/negative):
ASS = P_positive × 100

Score Interpretation:
- 75-100: Very Positive Reception
- 50-74: Mixed/Neutral Reception
- 25-49: Negative Reception
- 0-24: Very Negative Reception
```

### 6.3 Complete predict.R Script

Create `r/predict.R`:

```r
#!/usr/bin/env Rscript
# ==============================================================================
# predict.R - Sentiment Prediction Script
# ==============================================================================
# Purpose: Predict sentiment for YouTube comments using the trained NB model
#
# Usage: Rscript r/predict.R [COMMENTS_CSV_PATH]
#
# Arguments:
#   COMMENTS_CSV_PATH - Path to comments CSV (default: /tmp/comments.csv)
#
# Output: JSON to stdout with predictions and sentiment score
# ==============================================================================

library(tm)
library(e1071)
library(jsonlite)
library(dplyr)

# ==============================================================================
# Parse Command Line Arguments
# ==============================================================================
args <- commandArgs(trailingOnly = TRUE)
comments_path <- ifelse(length(args) >= 1, args[1], "/tmp/comments.csv")

cat("Loading comments from:", comments_path, "\n", file = stderr())

# ==============================================================================
# Load Model and Vocabulary
# ==============================================================================
cat("Loading model and vocabulary...\n", file = stderr())

# Check if model exists
if (!file.exists("models/nb_model.rds")) {
    cat(toJSON(list(
        success = FALSE,
        error = "Model file not found: models/nb_model.rds"
    ), auto_unbox = TRUE))
    quit(status = 1)
}

# Load trained model
nb_model <- readRDS("models/nb_model.rds")

# Load vocabulary (list of terms the model was trained on)
if (file.exists("models/vocabulary.rds")) {
    vocabulary <- readRDS("models/vocabulary.rds")
} else {
    # Extract vocabulary from model
    vocabulary <- names(nb_model$tables)
}

cat("Model loaded. Vocabulary size:", length(vocabulary), "\n", file = stderr())

# ==============================================================================
# Preprocessing Function (same as training)
# ==============================================================================
preprocess_text <- function(texts) {
    # Create corpus
    corpus <- VCorpus(VectorSource(texts))
    
    # Apply same transformations as training
    corpus <- tm_map(corpus, content_transformer(tolower))
    corpus <- tm_map(corpus, removePunctuation)
    corpus <- tm_map(corpus, removeNumbers)
    corpus <- tm_map(corpus, removeWords, stopwords("english"))
    corpus <- tm_map(corpus, stripWhitespace)
    
    # Create DTM
    dtm <- DocumentTermMatrix(corpus)
    
    # Convert to matrix
    dtm_matrix <- as.matrix(dtm)
    
    return(list(corpus = corpus, dtm = dtm, matrix = dtm_matrix))
}

# ==============================================================================
# Align DTM to Training Vocabulary
# ==============================================================================
align_to_vocabulary <- function(dtm_matrix, vocabulary) {
    # Create empty matrix with vocabulary columns
    aligned <- matrix(0, nrow = nrow(dtm_matrix), ncol = length(vocabulary))
    colnames(aligned) <- vocabulary
    
    # Fill in values for terms that exist in both
    common_terms <- intersect(colnames(dtm_matrix), vocabulary)
    aligned[, common_terms] <- dtm_matrix[, common_terms]
    
    return(as.data.frame(aligned))
}

# ==============================================================================
# Main Prediction Function
# ==============================================================================
predict_sentiment <- function(comments_df) {
    # Extract text
    texts <- comments_df$text
    
    cat("Preprocessing", length(texts), "comments...\n", file = stderr())
    
    # Preprocess
    processed <- preprocess_text(texts)
    
    # Align to training vocabulary
    features <- align_to_vocabulary(processed$matrix, vocabulary)
    
    cat("Predicting sentiment...\n", file = stderr())
    
    # Predict
    predictions <- predict(nb_model, features, type = "class")
    probabilities <- predict(nb_model, features, type = "raw")
    
    # Create results dataframe
    results <- data.frame(
        comment_id = comments_df$comment_id,
        text = texts,
        prediction = as.character(predictions),
        prob_negative = probabilities[, "negative"],
        prob_positive = probabilities[, "positive"],
        confidence = pmax(probabilities[, "negative"], probabilities[, "positive"]),
        stringsAsFactors = FALSE
    )
    
    return(results)
}

# ==============================================================================
# Calculate Audience Sentiment Score (ASS)
# ==============================================================================
calculate_ass <- function(predictions) {
    # Count predictions
    counts <- table(predictions)
    total <- length(predictions)
    
    # Calculate proportions
    p_positive <- ifelse("positive" %in% names(counts), counts["positive"] / total, 0)
    p_negative <- ifelse("negative" %in% names(counts), counts["negative"] / total, 0)
    
    # ASS Formula: positive=1.0, negative=0.0
    # For binary, this is simply the proportion of positive predictions
    ass <- as.numeric(p_positive) * 100
    
    return(list(
        score = round(ass, 2),
        positive_count = as.integer(ifelse("positive" %in% names(counts), counts["positive"], 0)),
        negative_count = as.integer(ifelse("negative" %in% names(counts), counts["negative"], 0)),
        total_count = total,
        positive_percentage = round(as.numeric(p_positive) * 100, 2),
        negative_percentage = round(as.numeric(p_negative) * 100, 2)
    ))
}

# ==============================================================================
# Interpret ASS Score
# ==============================================================================
interpret_score <- function(score) {
    if (score >= 75) {
        return(list(
            label = "Very Positive",
            description = "The audience has a very positive reception to this video.",
            emoji = "🟢"
        ))
    } else if (score >= 50) {
        return(list(
            label = "Mixed/Neutral",
            description = "The audience has a mixed or neutral reception.",
            emoji = "🟡"
        ))
    } else if (score >= 25) {
        return(list(
            label = "Negative",
            description = "The audience has a negative reception to this video.",
            emoji = "🟠"
        ))
    } else {
        return(list(
            label = "Very Negative",
            description = "The audience has a very negative reception to this video.",
            emoji = "🔴"
        ))
    }
}

# ==============================================================================
# Main Execution
# ==============================================================================
tryCatch({
    # Check if comments file exists
    if (!file.exists(comments_path)) {
        cat(toJSON(list(
            success = FALSE,
            error = paste("Comments file not found:", comments_path)
        ), auto_unbox = TRUE))
        quit(status = 1)
    }
    
    # Load comments
    comments_df <- read.csv(comments_path, stringsAsFactors = FALSE)
    
    if (nrow(comments_df) == 0) {
        cat(toJSON(list(
            success = FALSE,
            error = "No comments found in file"
        ), auto_unbox = TRUE))
        quit(status = 1)
    }
    
    cat("Loaded", nrow(comments_df), "comments\n", file = stderr())
    
    # Predict sentiment
    results <- predict_sentiment(comments_df)
    
    # Calculate ASS
    ass <- calculate_ass(results$prediction)
    interpretation <- interpret_score(ass$score)
    
    # Get sample predictions (top positive and negative)
    top_positive <- results %>%
        filter(prediction == "positive") %>%
        arrange(desc(prob_positive)) %>%
        head(3) %>%
        select(text, confidence)
    
    top_negative <- results %>%
        filter(prediction == "negative") %>%
        arrange(desc(prob_negative)) %>%
        head(3) %>%
        select(text, confidence)
    
    # Build output JSON
    output <- list(
        success = TRUE,
        sentiment_score = ass$score,
        interpretation = interpretation,
        statistics = ass,
        sample_positive = if(nrow(top_positive) > 0) {
            lapply(1:nrow(top_positive), function(i) {
                list(text = top_positive$text[i], confidence = round(top_positive$confidence[i], 3))
            })
        } else { list() },
        sample_negative = if(nrow(top_negative) > 0) {
            lapply(1:nrow(top_negative), function(i) {
                list(text = top_negative$text[i], confidence = round(top_negative$confidence[i], 3))
            })
        } else { list() },
        predictions = lapply(1:nrow(results), function(i) {
            list(
                comment_id = results$comment_id[i],
                text = substr(results$text[i], 1, 100),  # Truncate for JSON size
                sentiment = results$prediction[i],
                confidence = round(results$confidence[i], 3)
            )
        })
    )
    
    # Output JSON to stdout
    cat(toJSON(output, auto_unbox = TRUE, pretty = TRUE))
    
}, error = function(e) {
    cat(toJSON(list(
        success = FALSE,
        error = as.character(e$message)
    ), auto_unbox = TRUE))
    quit(status = 1)
})
```

### 6.4 Testing predict.R

```bash
# First, create a test comments file
echo 'comment_id,text,author,published_at,like_count
1,"This movie was absolutely fantastic! Best film ever!","User1","2024-01-01",10
2,"Terrible waste of time. Boring and predictable.","User2","2024-01-02",5
3,"It was okay, nothing special but entertaining.","User3","2024-01-03",3' > /tmp/test_comments.csv

# Run prediction
Rscript r/predict.R /tmp/test_comments.csv

# Expected output:
# {
#   "success": true,
#   "sentiment_score": 66.67,
#   "interpretation": {
#     "label": "Mixed/Neutral",
#     "description": "The audience has a mixed or neutral reception.",
#     "emoji": "🟡"
#   },
#   "statistics": { ... },
#   "predictions": [ ... ]
# }
```

---

## 7. Node.js Backend Setup

### 7.1 Initialize Node.js Project

```bash
# Navigate to backend directory
mkdir -p backend
cd backend

# Initialize npm project
npm init -y

# Update package.json
npm pkg set name="tube-senti-backend"
npm pkg set version="1.0.0"
npm pkg set main="server.js"
npm pkg set scripts.start="node server.js"
npm pkg set scripts.dev="nodemon server.js"
```

### 7.2 Install Dependencies

```bash
# Core dependencies
npm install express cors dotenv morgan helmet

# Development dependencies
npm install --save-dev nodemon
```

### Package Descriptions

| Package | Version | Purpose |
|---------|---------|---------|
| `express` | ^4.18.x | Web framework for REST API |
| `cors` | ^2.8.x | Cross-Origin Resource Sharing middleware |
| `dotenv` | ^16.x | Environment variable management |
| `morgan` | ^1.10.x | HTTP request logging |
| `helmet` | ^7.x | Security headers middleware |
| `nodemon` | ^3.x | Development auto-reload (dev dependency) |

### 7.3 Project Structure

```
backend/
├── server.js           # Main entry point
├── routes/
│   ├── predict.js      # /api/predict endpoint
│   └── health.js       # /api/health endpoint
├── utils/
│   ├── rRunner.js      # R script execution utility
│   └── logger.js       # Logging configuration
├── config/
│   └── index.js        # Configuration loader
├── middleware/
│   └── errorHandler.js # Global error handler
├── package.json
└── .env                # Environment variables (not committed)
```

---

## 8. Express Server Implementation

### 8.1 Configuration (config/index.js)

Create `backend/config/index.js`:

```javascript
// ==============================================================================
// config/index.js - Application Configuration
// ==============================================================================

require('dotenv').config({ path: '../.env' });

module.exports = {
    // Server configuration
    port: process.env.PORT || 3001,
    nodeEnv: process.env.NODE_ENV || 'development',
    
    // R configuration
    rExecutable: process.env.R_EXECUTABLE || 'Rscript',
    rScriptsPath: process.env.R_SCRIPTS_PATH || '../r',
    modelsPath: process.env.MODELS_PATH || '../models',
    
    // YouTube API
    youtubeApiKey: process.env.YOUTUBE_API_KEY,
    
    // Timeouts (in milliseconds)
    apiTimeout: parseInt(process.env.API_TIMEOUT) || 30000,
    rScriptTimeout: parseInt(process.env.R_SCRIPT_TIMEOUT) || 60000,
    
    // Limits
    maxComments: parseInt(process.env.MAX_COMMENTS) || 100,
    
    // CORS
    corsOrigins: process.env.CORS_ORIGINS 
        ? process.env.CORS_ORIGINS.split(',') 
        : ['http://localhost:3000'],
};
```

### 8.2 R Script Runner (utils/rRunner.js)

Create `backend/utils/rRunner.js`:

```javascript
// ==============================================================================
// utils/rRunner.js - R Script Execution Utility
// ==============================================================================

const { spawn } = require('child_process');
const path = require('path');
const config = require('../config');

/**
 * Execute an R script and return the result
 * @param {string} scriptName - Name of the R script (e.g., 'api_fetch.R')
 * @param {string[]} args - Command line arguments to pass
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<object>} - Parsed JSON output from R script
 */
function runRScript(scriptName, args = [], timeout = config.rScriptTimeout) {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(config.rScriptsPath, scriptName);
        const startTime = Date.now();
        
        console.log(`[R Runner] Executing: ${scriptPath} ${args.join(' ')}`);
        
        // Spawn R process
        const process = spawn(config.rExecutable, [scriptPath, ...args], {
            cwd: path.resolve(__dirname, '../..'),  // Project root
            env: { ...process.env },
        });
        
        let stdout = '';
        let stderr = '';
        
        // Collect stdout (JSON output)
        process.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        
        // Collect stderr (logging/progress)
        process.stderr.on('data', (data) => {
            stderr += data.toString();
            console.log(`[R] ${data.toString().trim()}`);
        });
        
        // Handle timeout
        const timeoutId = setTimeout(() => {
            process.kill('SIGTERM');
            reject(new Error(`R script timed out after ${timeout}ms`));
        }, timeout);
        
        // Handle completion
        process.on('close', (code) => {
            clearTimeout(timeoutId);
            const duration = Date.now() - startTime;
            console.log(`[R Runner] Script completed in ${duration}ms with code ${code}`);
            
            if (code !== 0) {
                reject(new Error(`R script exited with code ${code}: ${stderr}`));
                return;
            }
            
            // Parse JSON output
            try {
                const result = JSON.parse(stdout);
                resolve(result);
            } catch (parseError) {
                reject(new Error(`Failed to parse R output: ${stdout}`));
            }
        });
        
        // Handle errors
        process.on('error', (err) => {
            clearTimeout(timeoutId);
            reject(new Error(`Failed to start R script: ${err.message}`));
        });
    });
}

module.exports = { runRScript };
```

### 8.3 Logger (utils/logger.js)

Create `backend/utils/logger.js`:

```javascript
// ==============================================================================
// utils/logger.js - Logging Utility
// ==============================================================================

const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Log file streams
const accessLog = fs.createWriteStream(path.join(logsDir, 'access.log'), { flags: 'a' });
const errorLog = fs.createWriteStream(path.join(logsDir, 'error.log'), { flags: 'a' });

/**
 * Log levels
 */
const LOG_LEVELS = {
    ERROR: 'ERROR',
    WARN: 'WARN',
    INFO: 'INFO',
    DEBUG: 'DEBUG',
};

/**
 * Format log message
 */
function formatMessage(level, message, meta = {}) {
    return JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        message,
        ...meta,
    });
}

/**
 * Logger object
 */
const logger = {
    info: (message, meta) => {
        const formatted = formatMessage(LOG_LEVELS.INFO, message, meta);
        console.log(formatted);
        accessLog.write(formatted + '\n');
    },
    
    error: (message, meta) => {
        const formatted = formatMessage(LOG_LEVELS.ERROR, message, meta);
        console.error(formatted);
        errorLog.write(formatted + '\n');
    },
    
    warn: (message, meta) => {
        const formatted = formatMessage(LOG_LEVELS.WARN, message, meta);
        console.warn(formatted);
        accessLog.write(formatted + '\n');
    },
    
    debug: (message, meta) => {
        if (process.env.NODE_ENV === 'development') {
            const formatted = formatMessage(LOG_LEVELS.DEBUG, message, meta);
            console.log(formatted);
        }
    },
};

module.exports = logger;
```

### 8.4 Error Handler Middleware (middleware/errorHandler.js)

Create `backend/middleware/errorHandler.js`:

```javascript
// ==============================================================================
// middleware/errorHandler.js - Global Error Handler
// ==============================================================================

const logger = require('../utils/logger');

/**
 * Global error handling middleware
 */
function errorHandler(err, req, res, next) {
    // Log the error
    logger.error('Unhandled error', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
    });
    
    // Determine status code
    const statusCode = err.statusCode || 500;
    
    // Send error response
    res.status(statusCode).json({
        success: false,
        error: process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : err.message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    });
}

/**
 * 404 Not Found handler
 */
function notFoundHandler(req, res) {
    res.status(404).json({
        success: false,
        error: `Not found: ${req.method} ${req.path}`,
    });
}

module.exports = { errorHandler, notFoundHandler };
```

---

## 9. R Script Orchestration

### 9.1 Predict Route (routes/predict.js)

Create `backend/routes/predict.js`:

```javascript
// ==============================================================================
// routes/predict.js - Prediction Endpoint
// ==============================================================================

const express = require('express');
const router = express.Router();
const { runRScript } = require('../utils/rRunner');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * POST /api/predict
 * 
 * Request body:
 * {
 *   "videoUrl": "https://www.youtube.com/watch?v=VIDEO_ID"
 *   // OR
 *   "videoId": "VIDEO_ID"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "sentimentScore": 72.5,
 *   "interpretation": { ... },
 *   "statistics": { ... },
 *   "predictions": [ ... ]
 * }
 */
router.post('/', async (req, res, next) => {
    const startTime = Date.now();
    
    try {
        // Extract video identifier from request
        const { videoUrl, videoId } = req.body;
        
        if (!videoUrl && !videoId) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameter: videoUrl or videoId',
            });
        }
        
        const videoIdentifier = videoId || videoUrl;
        logger.info('Prediction request received', { videoIdentifier });
        
        // Check for API key
        if (!config.youtubeApiKey) {
            return res.status(500).json({
                success: false,
                error: 'YouTube API key not configured',
            });
        }
        
        // Step 1: Fetch comments via api_fetch.R
        logger.info('Step 1: Fetching comments...', { videoIdentifier });
        
        const fetchResult = await runRScript('api_fetch.R', [
            videoIdentifier,
            config.youtubeApiKey,
            config.maxComments.toString(),
        ]);
        
        if (!fetchResult.success) {
            return res.status(400).json({
                success: false,
                error: fetchResult.error || 'Failed to fetch comments',
                step: 'fetch',
            });
        }
        
        logger.info('Comments fetched', { 
            count: fetchResult.comments_fetched,
            videoId: fetchResult.video_id,
        });
        
        // Step 2: Predict sentiment via predict.R
        logger.info('Step 2: Predicting sentiment...');
        
        const predictResult = await runRScript('predict.R', [
            fetchResult.output_file,  // /tmp/comments.csv
        ]);
        
        if (!predictResult.success) {
            return res.status(500).json({
                success: false,
                error: predictResult.error || 'Failed to predict sentiment',
                step: 'predict',
            });
        }
        
        // Calculate response time
        const duration = Date.now() - startTime;
        
        logger.info('Prediction complete', {
            videoId: fetchResult.video_id,
            sentimentScore: predictResult.sentiment_score,
            commentsAnalyzed: fetchResult.comments_fetched,
            duration: `${duration}ms`,
        });
        
        // Return combined result
        res.json({
            success: true,
            videoId: fetchResult.video_id,
            commentsAnalyzed: fetchResult.comments_fetched,
            sentimentScore: predictResult.sentiment_score,
            interpretation: predictResult.interpretation,
            statistics: predictResult.statistics,
            samplePositive: predictResult.sample_positive,
            sampleNegative: predictResult.sample_negative,
            predictions: predictResult.predictions,
            processingTime: duration,
        });
        
    } catch (error) {
        logger.error('Prediction failed', { error: error.message });
        next(error);
    }
});

module.exports = router;
```

### 9.2 Health Route (routes/health.js)

Create `backend/routes/health.js`:

```javascript
// ==============================================================================
// routes/health.js - Health Check Endpoint
// ==============================================================================

const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const config = require('../config');

/**
 * GET /api/health
 * 
 * Response:
 * {
 *   "status": "healthy",
 *   "timestamp": "2024-01-01T00:00:00.000Z",
 *   "checks": {
 *     "server": true,
 *     "rscript": true,
 *     "model": true,
 *     "youtubeApi": true
 *   }
 * }
 */
router.get('/', async (req, res) => {
    const checks = {
        server: true,
        rscript: false,
        model: false,
        youtubeApi: false,
    };
    
    // Check R installation
    try {
        await new Promise((resolve, reject) => {
            const process = spawn(config.rExecutable, ['--version']);
            process.on('close', (code) => {
                if (code === 0) resolve();
                else reject(new Error('R not found'));
            });
            process.on('error', reject);
        });
        checks.rscript = true;
    } catch (e) {
        checks.rscript = false;
    }
    
    // Check model file
    const modelPath = path.join(config.modelsPath, 'nb_model.rds');
    checks.model = fs.existsSync(modelPath);
    
    // Check YouTube API key configured
    checks.youtubeApi = !!config.youtubeApiKey;
    
    // Determine overall status
    const allPassing = Object.values(checks).every(v => v);
    const status = allPassing ? 'healthy' : 'degraded';
    
    res.status(allPassing ? 200 : 503).json({
        status,
        timestamp: new Date().toISOString(),
        checks,
        version: process.env.npm_package_version || '1.0.0',
        environment: config.nodeEnv,
    });
});

module.exports = router;
```

### 8.5 Main Server (server.js)

Create `backend/server.js`:

```javascript
// ==============================================================================
// server.js - Tube-Senti Backend Server
// ==============================================================================
// Purpose: Express REST API server that orchestrates R scripts for sentiment
//          prediction of YouTube video comments.
//
// Endpoints:
//   POST /api/predict  - Full prediction pipeline (fetch + predict)
//   GET  /api/health   - Server health check
//
// Usage: npm start (production) or npm run dev (development)
// ==============================================================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

// Load configuration
const config = require('./config');
const logger = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Import routes
const predictRouter = require('./routes/predict');
const healthRouter = require('./routes/health');

// ==============================================================================
// Initialize Express App
// ==============================================================================
const app = express();

// ==============================================================================
// Middleware Stack
// ==============================================================================

// Security headers
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS configuration
app.use(cors({
    origin: config.corsOrigins,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Request logging
const accessLogStream = fs.createWriteStream(
    path.join(__dirname, '../logs/access.log'),
    { flags: 'a' }
);
app.use(morgan('combined', { stream: accessLogStream }));
app.use(morgan('dev'));  // Console logging in development

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ==============================================================================
// Routes
// ==============================================================================

// API routes
app.use('/api/predict', predictRouter);
app.use('/api/health', healthRouter);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'Tube-Senti Backend API',
        version: '1.0.0',
        endpoints: {
            predict: 'POST /api/predict',
            health: 'GET /api/health',
        },
    });
});

// ==============================================================================
// Error Handling
// ==============================================================================
app.use(notFoundHandler);
app.use(errorHandler);

// ==============================================================================
// Start Server
// ==============================================================================
const server = app.listen(config.port, () => {
    logger.info(`Tube-Senti backend started`, {
        port: config.port,
        environment: config.nodeEnv,
        cors: config.corsOrigins,
    });
    
    console.log(`
╔════════════════════════════════════════════════════════════════════╗
║                   TUBE-SENTI BACKEND SERVER                       ║
╠════════════════════════════════════════════════════════════════════╣
║  Status:      Running                                              ║
║  Port:        ${config.port}                                              ║
║  Environment: ${config.nodeEnv.padEnd(52)}║
╠════════════════════════════════════════════════════════════════════╣
║  Endpoints:                                                        ║
║    POST /api/predict  - Analyze video sentiment                    ║
║    GET  /api/health   - Health check                               ║
╚════════════════════════════════════════════════════════════════════╝
    `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
        logger.info('Server closed');
        process.exit(0);
    });
});

module.exports = app;
```

---

## 10. API Endpoints

### 10.1 POST /api/predict

**Full Prediction Pipeline**

```bash
# Request
curl -X POST http://localhost:3001/api/predict \
  -H "Content-Type: application/json" \
  -d '{"videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'

# Alternative with video ID
curl -X POST http://localhost:3001/api/predict \
  -H "Content-Type: application/json" \
  -d '{"videoId": "dQw4w9WgXcQ"}'
```

**Response:**

```json
{
  "success": true,
  "videoId": "dQw4w9WgXcQ",
  "commentsAnalyzed": 100,
  "sentimentScore": 78.5,
  "interpretation": {
    "label": "Very Positive",
    "description": "The audience has a very positive reception to this video.",
    "emoji": "🟢"
  },
  "statistics": {
    "score": 78.5,
    "positive_count": 78,
    "negative_count": 22,
    "total_count": 100,
    "positive_percentage": 78.5,
    "negative_percentage": 21.5
  },
  "samplePositive": [
    { "text": "This is amazing!", "confidence": 0.95 },
    { "text": "Love this video", "confidence": 0.92 }
  ],
  "sampleNegative": [
    { "text": "Waste of time", "confidence": 0.88 }
  ],
  "predictions": [...],
  "processingTime": 2450
}
```

### 10.2 GET /api/health

**Health Check**

```bash
curl http://localhost:3001/api/health
```

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T12:00:00.000Z",
  "checks": {
    "server": true,
    "rscript": true,
    "model": true,
    "youtubeApi": true
  },
  "version": "1.0.0",
  "environment": "development"
}
```

---

## 11. Error Handling and Logging

### 11.1 Error Response Format

All errors follow a consistent format:

```json
{
  "success": false,
  "error": "Error message description",
  "step": "fetch|predict" // (optional) which step failed
}
```

### 11.2 HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Successful prediction |
| 400 | Invalid request (missing parameters, invalid video) |
| 404 | Endpoint not found |
| 500 | Internal server error (R script failure, model error) |
| 503 | Service unavailable (health check failure) |

### 11.3 Log Files

| File | Content |
|------|---------|
| `logs/access.log` | All HTTP requests (Apache combined format) |
| `logs/error.log` | Error-level events only |

---

## 12. Testing the Backend

### 12.1 Start the Server

```bash
cd backend

# Development mode (auto-reload)
npm run dev

# Production mode
npm start
```

### 12.2 Test Health Endpoint

```bash
curl http://localhost:3001/api/health | jq
```

### 12.3 Test Prediction Endpoint

```bash
# Test with a real YouTube video
curl -X POST http://localhost:3001/api/predict \
  -H "Content-Type: application/json" \
  -d '{"videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}' \
  | jq
```

### 12.4 Expected Timeline

| Step | Duration |
|------|----------|
| API fetch | 1-3 seconds (network dependent) |
| Prediction | 0.5-2 seconds |
| **Total** | **2-5 seconds** |

---

## 13. Expected Outputs

### 13.1 Files Created

| File | Location | Description |
|------|----------|-------------|
| `api_fetch.R` | `r/` | YouTube comment fetcher |
| `predict.R` | `r/` | Sentiment prediction script |
| `server.js` | `backend/` | Express server entry point |
| `routes/predict.js` | `backend/routes/` | Prediction endpoint |
| `routes/health.js` | `backend/routes/` | Health check endpoint |
| `utils/rRunner.js` | `backend/utils/` | R script execution utility |
| `utils/logger.js` | `backend/utils/` | Logging utility |
| `config/index.js` | `backend/config/` | Configuration loader |
| `middleware/errorHandler.js` | `backend/middleware/` | Error handling |
| `package.json` | `backend/` | Node.js dependencies |

### 13.2 Running Services

| Service | Port | Description |
|---------|------|-------------|
| Express API | 3001 | REST API server |

### 13.3 Verification Checklist

```bash
# 1. Check R scripts are executable
ls -la r/*.R

# 2. Check backend dependencies installed
cd backend && npm list --depth=0

# 3. Verify server starts
npm run dev

# 4. Test health endpoint
curl http://localhost:3001/api/health

# 5. Test prediction (requires API key)
curl -X POST http://localhost:3001/api/predict \
  -H "Content-Type: application/json" \
  -d '{"videoId": "VIDEO_ID_HERE"}'
```

---

## Summary

Phase 3 completes the backend infrastructure:

1. ✅ YouTube Data API v3 configured with quota awareness
2. ✅ `api_fetch.R` fetches comments using httr/jsonlite
3. ✅ `predict.R` loads model and computes ASS score
4. ✅ Node.js Express server with security middleware
5. ✅ R script orchestration via child_process
6. ✅ Complete REST API with error handling and logging

**API Endpoints:**
- `POST /api/predict` - Full pipeline (fetch → predict)
- `GET /api/health` - Server health check

**Key Integration:** Node.js spawns R scripts, parses JSON output, and returns unified REST responses.

**Next Phase:** Phase 4 – Frontend Development

---

*Phase 3 document for Tube-Senti: Real-Time Video Reception Analyzer*
