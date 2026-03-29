## 🧠 Agent Instructions

You are an AI coding agent responsible for implementing Phase 1 of the Tube-Senti project.

### Goals:
- Set up R environment
- Download Stanford IMDB dataset
- Preprocess text using tm library
- Create Document-Term Matrix
- Save outputs in correct directory structure

### Rules:
- Follow the project structure strictly
- Write clean, modular R code
- Create files exactly as specified
- Ensure reproducibility
- Log progress step-by-step

### Output:
- All required R scripts
- Data files
- Folder structure

# Phase 1: Data Acquisition and Preprocessing

## Overview

This phase establishes the foundation for the Tube-Senti project by setting up the development environment, acquiring the Stanford Large Movie Dataset, and implementing the complete text preprocessing pipeline using R's `tm` library.
v
**Phase Duration:** One-time setup phase  
**Primary Language:** R (≥ 4.3.x)  
**Key Deliverables:** 
- Configured R environment with all required packages
- Downloaded and structured Stanford Large Movie Dataset
- Preprocessed corpus ready for model training
- Document-Term Matrix (DTM) for feature extraction

---

## Table of Contents

1. [Objectives](#1-objectives)
2. [Prerequisites](#2-prerequisites)
3. [Environment Setup](#3-environment-setup)
4. [Stanford Large Movie Dataset](#4-stanford-large-movie-dataset)
5. [Project Directory Structure](#5-project-directory-structure)
6. [Text Preprocessing Pipeline](#6-text-preprocessing-pipeline)
7. [Document-Term Matrix Construction](#7-document-term-matrix-construction)
8. [Data Validation and Quality Checks](#8-data-validation-and-quality-checks)
9. [Expected Outputs](#9-expected-outputs)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Objectives

By the end of Phase 1, you will have:

1. **Installed and configured R** (version ≥ 4.3.x) with all necessary packages for text mining and machine learning
2. **Downloaded the Stanford Large Movie Dataset** containing 50,000 labeled movie reviews for sentiment analysis
3. **Implemented a complete text preprocessing pipeline** using the `tm` library including:
   - Lowercase conversion
   - Punctuation removal
   - Number removal
   - English stopword removal
   - Whitespace stripping
4. **Constructed a Document-Term Matrix (DTM)** using Term Frequency (TF) weighting for feature extraction
5. **Validated data quality** to ensure the dataset meets rubric requirements (≥10,000 rows, ≥8 attributes, 2+ data types)

---

## 2. Prerequisites

### System Requirements

| Requirement | Specification |
|-------------|---------------|
| **Operating System** | Windows 10/11, macOS 10.15+, or Linux (Ubuntu 20.04+) |
| **RAM** | Minimum 8GB (16GB recommended for large corpus processing) |
| **Disk Space** | At least 5GB free for dataset and processed files |
| **R Version** | ≥ 4.3.x |
| **RStudio** | Optional but recommended (version 2023.06+) |

### Knowledge Prerequisites

- Basic understanding of R syntax and data structures
- Familiarity with text mining concepts (corpus, tokenization, DTM)
- Understanding of sentiment analysis fundamentals

---

## 3. Environment Setup

### 3.1 Install R

**Windows:**
1. Download R from https://cran.r-project.org/bin/windows/base/
2. Run the installer with default options
3. Add R to system PATH: `C:\Program Files\R\R-4.3.x\bin`

**macOS:**
1. Download R from https://cran.r-project.org/bin/macosx/
2. Install the `.pkg` file
3. R is automatically added to PATH at `/usr/local/bin/R`

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install r-base r-base-dev
```

### 3.2 Install Required R Packages

Open R or RStudio and run the following:

```r
# Core packages for text mining and ML
install.packages(c(
    "httr",       # HTTP requests to YouTube Data API v3
    "jsonlite",   # Parsing JSON API responses into R data frames
    "tm",         # Text mining corpus, stopword removal, tokenization
    "e1071",      # Naive Bayes classifier implementation
    "ggplot2",    # All EDA visualizations and custom Power BI visuals
    "wordcloud",  # Word frequency visualizations
    "dplyr",      # Data manipulation and transformation
    "tidytext",   # Tidy text mining utilities
    "caret",      # Model evaluation, confusion matrix, F1-score
    "rvest",      # Web scraping (supplementary data acquisition)
    "reshape2"    # Data reshaping for visualization inputs
))

# Verify installation
required_packages <- c("httr", "jsonlite", "tm", "e1071", "ggplot2", 
                       "wordcloud", "dplyr", "tidytext", "caret", 
                       "rvest", "reshape2")

for (pkg in required_packages) {
    if (!require(pkg, character.only = TRUE)) {
        stop(paste("Package", pkg, "failed to install"))
    } else {
        cat(paste("✓", pkg, "loaded successfully\n"))
    }
}
```

### 3.3 Package Purposes

| Package | Purpose in Tube-Senti |
|---------|----------------------|
| `httr` | HTTP requests to YouTube Data API v3 |
| `jsonlite` | Parsing JSON API responses into R data frames |
| `tm` | Text mining corpus, stopword removal, tokenization |
| `e1071` | Naive Bayes classifier implementation |
| `ggplot2` | All EDA visualizations and custom Power BI visuals |
| `wordcloud` | Word frequency visualizations |
| `dplyr` | Data manipulation and transformation |
| `tidytext` | Tidy text mining utilities |
| `caret` | Model evaluation, confusion matrix, F1-score |
| `rvest` | Web scraping (supplementary data acquisition) |
| `reshape2` | Data reshaping for visualization inputs |

---

## 4. Stanford Large Movie Dataset

### 4.1 Dataset Overview

The **Stanford Large Movie Review Dataset** (also known as the IMDB Dataset) is a benchmark dataset for binary sentiment classification. It was published by Andrew Maas et al. at Stanford University.

| Property | Value |
|----------|-------|
| **Source** | Stanford AI Lab / ACL 2011 |
| **URL** | https://ai.stanford.edu/~amaas/data/sentiment/ |
| **Total Reviews** | 50,000 |
| **Training Set** | 25,000 reviews (12,500 positive, 12,500 negative) |
| **Test Set** | 25,000 reviews (12,500 positive, 12,500 negative) |
| **Labels** | Binary (Positive: rating ≥ 7, Negative: rating ≤ 4) |
| **Format** | Individual text files organized in directories |
| **License** | Academic use permitted |

### 4.2 Why Stanford Large Movie Dataset?

1. **Academic credibility**: Published in a peer-reviewed ACL paper, widely cited in NLP research
2. **Appropriate size**: 50,000 reviews exceeds the rubric requirement of ≥10,000 rows
3. **Balanced classes**: Equal distribution of positive and negative reviews
4. **Clean labels**: Reviews are labeled based on IMDB ratings (1-10 scale), ensuring label quality
5. **Domain relevance**: Movie reviews contain sentiment expressions similar to YouTube comments

### 4.3 Downloading the Dataset

```r
# Create data directories
dir.create("data/raw", recursive = TRUE, showWarnings = FALSE)
dir.create("data/processed", recursive = TRUE, showWarnings = FALSE)

# Download the Stanford Large Movie Dataset
download_url <- "https://ai.stanford.edu/~amaas/data/sentiment/aclImdb_v1.tar.gz"
dest_file <- "data/raw/aclImdb_v1.tar.gz"

if (!file.exists(dest_file)) {
    download.file(download_url, dest_file, mode = "wb")
    cat("Dataset downloaded successfully\n")
}

# Extract the archive
untar(dest_file, exdir = "data/raw")
cat("Dataset extracted to data/raw/aclImdb/\n")
```

### 4.4 Loading and Structuring the Data

The Stanford dataset is organized as individual text files. We need to consolidate these into a single data frame:

```r
library(dplyr)
library(tidytext)

# Function to read all reviews from a directory
read_reviews <- function(path, sentiment_label) {
    files <- list.files(path, pattern = "\\.txt$", full.names = TRUE)
    
    reviews <- lapply(files, function(f) {
        # Extract rating from filename (e.g., "123_8.txt" -> rating = 8)
        filename <- basename(f)
        rating <- as.integer(gsub(".*_(\\d+)\\.txt", "\\1", filename))
        
        data.frame(
            review_id = gsub("\\.txt$", "", filename),
            text = paste(readLines(f, warn = FALSE), collapse = " "),
            sentiment = sentiment_label,
            rating = rating,
            stringsAsFactors = FALSE
        )
    })
    
    bind_rows(reviews)
}

# Load training data
train_pos <- read_reviews("data/raw/aclImdb/train/pos", "positive")
train_neg <- read_reviews("data/raw/aclImdb/train/neg", "negative")
train_data <- bind_rows(train_pos, train_neg)

# Load test data
test_pos <- read_reviews("data/raw/aclImdb/test/pos", "positive")
test_neg <- read_reviews("data/raw/aclImdb/test/neg", "negative")
test_data <- bind_rows(test_pos, test_neg)

# Combine all data
all_reviews <- bind_rows(
    train_data %>% mutate(split = "train"),
    test_data %>% mutate(split = "test")
)

cat("Total reviews loaded:", nrow(all_reviews), "\n")
cat("Training reviews:", nrow(train_data), "\n")
cat("Test reviews:", nrow(test_data), "\n")
```

### 4.5 Feature Engineering

Add additional features required by the rubric (≥8 attributes):

```r
# Add computed features
all_reviews <- all_reviews %>%
    mutate(
        # Text length features
        char_count = nchar(text),
        word_count = sapply(strsplit(text, "\\s+"), length),
        sentence_count = sapply(strsplit(text, "[.!?]+"), length),
        
        # Average word length
        avg_word_length = char_count / pmax(word_count, 1),
        
        # Sentiment as factor for ML
        sentiment_label = factor(sentiment, levels = c("negative", "positive")),
        
        # Binary sentiment (0 = negative, 1 = positive)
        sentiment_binary = ifelse(sentiment == "positive", 1, 0),
        
        # Unique identifier
        doc_id = row_number()
    )

# View the final structure
str(all_reviews)
```

### 4.6 Dataset Structure (Final)

| Column | Data Type | Description |
|--------|-----------|-------------|
| `doc_id` | Integer | Unique document identifier |
| `review_id` | Character | Original filename-based ID |
| `text` | Character | Raw review text |
| `sentiment` | Character | "positive" or "negative" |
| `sentiment_label` | Factor | Sentiment as factor for ML |
| `sentiment_binary` | Integer | 0 (negative) or 1 (positive) |
| `rating` | Integer | IMDB rating (1-10) |
| `char_count` | Integer | Number of characters |
| `word_count` | Integer | Number of words |
| `sentence_count` | Integer | Number of sentences |
| `avg_word_length` | Numeric | Average word length |
| `split` | Character | "train" or "test" |

**Total attributes: 12** (exceeds rubric requirement of ≥8)  
**Data types: 4** (Integer, Character, Factor, Numeric) – exceeds rubric requirement of 2+

### 4.7 Save Raw Processed Data

```r
# Save as CSV for subsequent phases
write.csv(all_reviews, "data/raw/reviews.csv", row.names = FALSE)
cat("Raw data saved to data/raw/reviews.csv\n")

# Summary statistics
cat("\n=== Dataset Summary ===\n")
cat("Total rows:", nrow(all_reviews), "\n")
cat("Total columns:", ncol(all_reviews), "\n")
cat("Positive reviews:", sum(all_reviews$sentiment == "positive"), "\n")
cat("Negative reviews:", sum(all_reviews$sentiment == "negative"), "\n")
cat("Average word count:", round(mean(all_reviews$word_count), 2), "\n")
cat("Median word count:", median(all_reviews$word_count), "\n")
```

---

## 5. Project Directory Structure

Create the complete project directory structure as specified in the README:

```r
# Create all required directories
directories <- c(
    "r",
    "r/utils",
    "models",
    "data/raw",
    "data/processed",
    "visuals",
    "powerbi",
    "backend",
    "backend/routes",
    "backend/middleware",
    "frontend",
    "frontend/app",
    "frontend/app/dashboard",
    "frontend/app/sign-in",
    "frontend/app/sign-up",
    "frontend/components",
    "logs",
    "tmp"
)

for (dir in directories) {
    dir.create(dir, recursive = TRUE, showWarnings = FALSE)
    cat("Created:", dir, "\n")
}
```

**Expected directory tree:**

```
tube-senti/
├── README.md
├── .gitignore
├── .env.example
├── r/
│   ├── train_model.R          → One-time model training script
│   ├── api_fetch.R            → YouTube API data ingestion
│   ├── predict.R              → Real-time prediction on new data
│   ├── eda.R                  → EDA and ggplot2 visualizations
│   └── utils/
│       └── text_preprocess.R  → Shared preprocessing functions
├── models/
│   └── nb_model.rds           → Trained Naive Bayes model (gitignored)
├── data/
│   ├── raw/                   → Original Stanford dataset files
│   │   ├── aclImdb/           → Extracted dataset directory
│   │   └── reviews.csv        → Consolidated reviews
│   └── processed/             → Cleaned, feature-engineered data
│       └── reviews_clean.csv
├── visuals/                   → Exported ggplot2 PNGs for Power BI
├── powerbi/
│   └── tube_senti_dashboard.pbix
├── backend/                   → Node.js + Express server
├── frontend/                  → Next.js application
├── logs/                      → API call logs (gitignored)
└── tmp/                       → Temporary files (gitignored)
```

---

## 6. Text Preprocessing Pipeline

### 6.1 Create Shared Preprocessing Module

Create `r/utils/text_preprocess.R` for reusable preprocessing functions:

```r
# r/utils/text_preprocess.R
# Shared text preprocessing functions for Tube-Senti
# Used by both train_model.R and predict.R to ensure consistency

library(tm)

#' Preprocess a character vector of texts using tm library
#' 
#' @param texts Character vector of raw text documents
#' @return A preprocessed Corpus object
#' 
#' @details
#' This function applies the following transformations in order:
#' 1. Convert to lowercase
#' 2. Remove punctuation
#' 3. Remove numbers
#' 4. Remove English stopwords
#' 5. Strip extra whitespace
#' 
#' CRITICAL: The same preprocessing MUST be applied to both training data
#' and new prediction data. Any inconsistency will cause the DTM vocabulary
#' to mismatch, resulting in prediction errors.

preprocess_corpus <- function(texts) {
    # Create a corpus from the character vector
    corpus <- VCorpus(VectorSource(texts))
    
    # Apply transformations in sequence
    # The order matters for optimal cleaning
    
    # 1. Convert to lowercase
    corpus <- tm_map(corpus, content_transformer(tolower))
    
    # 2. Remove punctuation
    corpus <- tm_map(corpus, removePunctuation)
    
    # 3. Remove numbers
    corpus <- tm_map(corpus, removeNumbers)
    
    # 4. Remove English stopwords
    # Using the default English stopword list from tm package
    corpus <- tm_map(corpus, removeWords, stopwords("en"))
    
    # 5. Strip extra whitespace
    corpus <- tm_map(corpus, stripWhitespace)
    
    return(corpus)
}

#' Create a Document-Term Matrix from preprocessed corpus
#' 
#' @param corpus A preprocessed Corpus object
#' @param sparse_threshold Proportion threshold for removing sparse terms (default: 0.99)
#' @return A DocumentTermMatrix object
#' 
#' @details
#' Uses Term Frequency (TF) weighting. Sparse terms appearing in less than
#' (1 - sparse_threshold) proportion of documents are removed to reduce
#' dimensionality and improve model training speed.

create_dtm <- function(corpus, sparse_threshold = 0.99) {
    # Create Document-Term Matrix with TF weighting
    dtm <- DocumentTermMatrix(corpus)
    
    # Remove sparse terms to reduce dimensionality
    # Terms that appear in less than 1% of documents are removed
    dtm <- removeSparseTerms(dtm, sparse_threshold)
    
    cat("DTM created with", nrow(dtm), "documents and", ncol(dtm), "terms\n")
    
    return(dtm)
}

#' Convert DTM to a data frame for model training
#' 
#' @param dtm A DocumentTermMatrix object
#' @return A data frame with documents as rows and terms as columns

dtm_to_dataframe <- function(dtm) {
    df <- as.data.frame(as.matrix(dtm))
    return(df)
}

#' Get vocabulary (term list) from a DTM
#' 
#' @param dtm A DocumentTermMatrix object
#' @return Character vector of terms

get_vocabulary <- function(dtm) {
    return(colnames(as.matrix(dtm)))
}

cat("Text preprocessing module loaded successfully\n")
```

### 6.2 Understanding Each Preprocessing Step

#### Step 1: Lowercase Conversion

```r
# Why: Ensures "Great", "great", and "GREAT" are treated as the same word
# Implementation: content_transformer(tolower)

# Example:
# "This movie is GREAT!" → "this movie is great!"
```

#### Step 2: Punctuation Removal

```r
# Why: Punctuation doesn't contribute to sentiment classification
#      and would create separate tokens (e.g., "great!" vs "great")
# Implementation: removePunctuation

# Example:
# "this movie is great!" → "this movie is great"
```

#### Step 3: Number Removal

```r
# Why: Numbers rarely carry sentiment information in reviews
#      Removes years, ratings mentioned in text, etc.
# Implementation: removeNumbers

# Example:
# "this 2024 movie is great" → "this  movie is great"
```

#### Step 4: Stopword Removal

```r
# Why: Common words like "the", "is", "a" don't carry sentiment
#      Reduces DTM dimensionality significantly
# Implementation: removeWords with stopwords("en")

# English stopwords include: a, an, the, is, are, was, were, be, been,
# being, have, has, had, do, does, did, will, would, could, should, etc.

# Example:
# "this movie is great" → "movie great"
```

#### Step 5: Whitespace Stripping

```r
# Why: Previous steps may leave multiple spaces
#      Clean whitespace ensures proper tokenization
# Implementation: stripWhitespace

# Example:
# "movie  great" → "movie great"
```

### 6.3 Apply Preprocessing to Dataset

```r
# Load the raw data
reviews <- read.csv("data/raw/reviews.csv", stringsAsFactors = FALSE)

# Source the preprocessing module
source("r/utils/text_preprocess.R")

# Apply preprocessing
cat("Preprocessing", nrow(reviews), "documents...\n")
corpus <- preprocess_corpus(reviews$text)

# Create DTM
cat("Creating Document-Term Matrix...\n")
dtm <- create_dtm(corpus, sparse_threshold = 0.99)

# Convert to data frame
dtm_df <- dtm_to_dataframe(dtm)

# Add sentiment labels back
dtm_df$sentiment <- reviews$sentiment_label

# Save processed data
processed_data <- cbind(
    doc_id = reviews$doc_id,
    sentiment = reviews$sentiment_label,
    word_count = reviews$word_count,
    char_count = reviews$char_count,
    dtm_df
)

write.csv(processed_data, "data/processed/reviews_clean.csv", row.names = FALSE)
cat("Processed data saved to data/processed/reviews_clean.csv\n")

# Save vocabulary for later use in prediction
vocabulary <- get_vocabulary(dtm)
saveRDS(vocabulary, "models/vocabulary.rds")
cat("Vocabulary saved to models/vocabulary.rds with", length(vocabulary), "terms\n")
```

---

## 7. Document-Term Matrix Construction

### 7.1 Understanding the DTM

The Document-Term Matrix (DTM) is the core data structure for text classification:

```
              term1   term2   term3   term4   ...   termN
document1       3       0       1       2     ...     0
document2       0       1       0       1     ...     1
document3       1       2       1       0     ...     0
...
documentM       0       0       2       1     ...     1
```

- **Rows**: Each row represents one document (review)
- **Columns**: Each column represents one unique term (word)
- **Values**: Term frequency (TF) – how many times the term appears in the document

### 7.2 TF Weighting

Tube-Senti uses **Term Frequency (TF)** weighting rather than TF-IDF:

```r
# TF weighting: Simple count of term occurrences
# Suitable for Naive Bayes as it directly uses term probabilities

# TF-IDF would down-weight common terms, but Naive Bayes
# inherently handles this through conditional probabilities
```

### 7.3 Sparsity Reduction

```r
# The raw DTM may have 50,000+ unique terms
# Most terms appear in very few documents (sparse)
# We remove terms appearing in < 1% of documents

dtm_raw <- DocumentTermMatrix(corpus)
cat("Raw DTM dimensions:", dim(dtm_raw), "\n")
# Example: 50000 documents × 85000 terms

dtm_sparse <- removeSparseTerms(dtm_raw, 0.99)
cat("After sparsity reduction:", dim(dtm_sparse), "\n")
# Example: 50000 documents × 3000 terms

# This dramatically reduces memory usage and training time
# while preserving the most informative features
```

### 7.4 DTM Statistics

```r
# Analyze the DTM
cat("\n=== DTM Statistics ===\n")
cat("Number of documents:", nrow(dtm), "\n")
cat("Number of terms:", ncol(dtm), "\n")
cat("Sparsity:", round(100 * (1 - nnzero(dtm) / (nrow(dtm) * ncol(dtm))), 2), "%\n")

# Most frequent terms
term_freq <- colSums(as.matrix(dtm))
top_terms <- sort(term_freq, decreasing = TRUE)[1:20]
cat("\nTop 20 most frequent terms:\n")
print(top_terms)
```

---

## 8. Data Validation and Quality Checks

### 8.1 Rubric Compliance Check

```r
# Validate dataset meets rubric requirements

cat("\n=== Rubric Compliance Check ===\n")

# Requirement 1: ≥10,000 rows
rows <- nrow(reviews)
cat("Rows:", rows, ifelse(rows >= 10000, "✓ PASS", "✗ FAIL"), "\n")

# Requirement 2: ≥8 attributes
cols <- ncol(reviews)
cat("Attributes:", cols, ifelse(cols >= 8, "✓ PASS", "✗ FAIL"), "\n")

# Requirement 3: 2+ data types
types <- length(unique(sapply(reviews, class)))
cat("Data types:", types, ifelse(types >= 2, "✓ PASS", "✗ FAIL"), "\n")

# Requirement 4: Non-Kaggle source
cat("Source: Stanford AI Lab (Non-Kaggle) ✓ PASS\n")

# Requirement 5: Real-world domain
cat("Domain: Social Media Analytics / Sentiment Analysis ✓ PASS\n")
```

### 8.2 Data Quality Checks

```r
# Check for missing values
cat("\n=== Data Quality Checks ===\n")
missing_counts <- colSums(is.na(reviews))
cat("Missing values per column:\n")
print(missing_counts[missing_counts > 0])
if (all(missing_counts == 0)) {
    cat("No missing values found ✓\n")
}

# Check class balance
cat("\nClass distribution:\n")
print(table(reviews$sentiment))
cat("Class balance ratio:", 
    round(min(table(reviews$sentiment)) / max(table(reviews$sentiment)), 3), "\n")

# Check for duplicates
duplicates <- sum(duplicated(reviews$text))
cat("\nDuplicate reviews:", duplicates, "\n")
if (duplicates > 0) {
    cat("Warning: Consider removing duplicates before training\n")
}

# Text length distribution
cat("\nText length statistics:\n")
cat("Min word count:", min(reviews$word_count), "\n")
cat("Max word count:", max(reviews$word_count), "\n")
cat("Mean word count:", round(mean(reviews$word_count), 2), "\n")
cat("Median word count:", median(reviews$word_count), "\n")
```

### 8.3 Corpus Quality Check

```r
# Verify preprocessing worked correctly
cat("\n=== Corpus Quality Check ===\n")

# Sample before and after preprocessing
sample_idx <- sample(1:nrow(reviews), 3)
for (i in sample_idx) {
    cat("\n--- Document", i, "---\n")
    cat("BEFORE:", substr(reviews$text[i], 1, 200), "...\n")
    cat("AFTER:", content(corpus[[i]]), "\n")
}
```

---

## 9. Expected Outputs

After completing Phase 1, you should have:

### 9.1 Files Created

| File | Location | Description |
|------|----------|-------------|
| `reviews.csv` | `data/raw/` | Raw consolidated reviews (50,000 rows) |
| `reviews_clean.csv` | `data/processed/` | Preprocessed data with DTM features |
| `vocabulary.rds` | `models/` | Saved vocabulary for prediction consistency |
| `text_preprocess.R` | `r/utils/` | Reusable preprocessing module |

### 9.2 Dataset Statistics

| Metric | Expected Value |
|--------|----------------|
| Total documents | 50,000 |
| Positive reviews | 25,000 |
| Negative reviews | 25,000 |
| Vocabulary size (after sparsity reduction) | ~2,000-5,000 terms |
| Average document length | ~200-300 words |

### 9.3 Verification Commands

```r
# Verify all outputs exist
files_to_check <- c(
    "data/raw/reviews.csv",
    "data/processed/reviews_clean.csv",
    "models/vocabulary.rds",
    "r/utils/text_preprocess.R"
)

for (f in files_to_check) {
    exists <- file.exists(f)
    cat(f, ":", ifelse(exists, "✓ EXISTS", "✗ MISSING"), "\n")
}
```

---

## 10. Troubleshooting

### Common Issues

#### Issue 1: Package Installation Fails

```r
# If tm package fails to install on Linux
# Install system dependencies first:
# sudo apt-get install libxml2-dev libcurl4-openssl-dev

# Then retry:
install.packages("tm", dependencies = TRUE)
```

#### Issue 2: Memory Error During DTM Creation

```r
# For large corpora, increase R memory limit (Windows only)
memory.limit(size = 16000)  # 16GB

# Or process in batches
batch_size <- 10000
n_batches <- ceiling(nrow(reviews) / batch_size)
```

#### Issue 3: Encoding Issues in Text

```r
# Force UTF-8 encoding
reviews$text <- iconv(reviews$text, to = "UTF-8", sub = "")

# Remove non-printable characters
reviews$text <- gsub("[^[:print:]]", "", reviews$text)
```

#### Issue 4: Download Fails

```r
# If download.file fails, try with different method
download.file(download_url, dest_file, mode = "wb", method = "curl")

# Or download manually from browser and place in data/raw/
```

---

## Summary

Phase 1 establishes the data foundation for Tube-Senti:

1. ✅ R environment configured with all 11 required packages
2. ✅ Stanford Large Movie Dataset (50,000 reviews) downloaded and structured
3. ✅ Text preprocessing pipeline implemented using `tm` library
4. ✅ Document-Term Matrix created with TF weighting
5. ✅ Data validated against rubric requirements

**Next Phase:** Phase 2 – Model Training and Evaluation

---

*Phase 1 document for Tube-Senti: Real-Time Video Reception Analyzer*
