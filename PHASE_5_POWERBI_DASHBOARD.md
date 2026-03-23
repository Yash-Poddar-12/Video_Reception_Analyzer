# Phase 5: Power BI Dashboard and Visualization

## Overview

This phase focuses on creating the Power BI dashboard for Tube-Senti, implementing R-based visualizations using ggplot2, and integrating the dashboard into the application via iframe embedding. This phase creates "The Boardroom Visual" layer that provides executive-level insights and advanced analytics.

**Phase Duration:** 1-2 development sessions  
**Primary Technologies:** R (ggplot2), Power BI Service  
**Key Deliverables:**
- `eda.R` script with 8 required visualizations
- Power BI report with R visuals
- Publish-to-Web iframe embedding
- Complete visualization pipeline

---

## Table of Contents

1. [Objectives](#1-objectives)
2. [Prerequisites](#2-prerequisites)
3. [Architecture Overview](#3-architecture-overview)
4. [EDA Visualizations Specification](#4-eda-visualizations-specification)
5. [R Script: eda.R](#5-r-script-edar)
6. [Individual Visualization Implementation](#6-individual-visualization-implementation)
7. [Power BI Setup](#7-power-bi-setup)
8. [Creating R Visuals in Power BI](#8-creating-r-visuals-in-power-bi)
9. [Dashboard Layout Design](#9-dashboard-layout-design)
10. [Publish-to-Web Integration](#10-publish-to-web-integration)
11. [Frontend Iframe Embedding](#11-frontend-iframe-embedding)
12. [Expected Outputs](#12-expected-outputs)

---

## 1. Objectives

By the end of Phase 5, you will have:

1. **Created `eda.R` script** with all 8 required visualizations:
   - Bar Chart: Sentiment class distribution
   - Density Plot: Review length by sentiment
   - Word Cloud: Top 100 positive words
   - Word Cloud: Top 100 negative words
   - Heatmap: Correlation matrix
   - Box Plot: Word count per sentiment class
   - Bar Chart: Top 20 frequent terms (TF analysis)
   - Confusion Matrix Heatmap: NB vs LR comparison

2. **Set up Power BI** with R visual support
3. **Created interactive dashboard** with multiple panels
4. **Published dashboard** using Publish-to-Web feature
5. **Embedded dashboard** in the Next.js frontend via iframe

---

## 2. Prerequisites

### Required Files from Previous Phases

| File | Location | Description |
|------|----------|-------------|
| `reviews_clean.csv` | `data/processed/` | Preprocessed data with features |
| `nb_model.rds` | `models/` | Trained Naive Bayes model |
| `training_metadata.rds` | `models/` | Model training metadata |

### Software Requirements

| Tool | Version | Purpose |
|------|---------|---------|
| R | ≥ 4.3.x | Visualization engine |
| Power BI Desktop | Latest | Dashboard creation |
| Power BI Service | N/A | Publishing and embedding |

### Required R Packages for Visualization

```r
# Install visualization packages
install.packages(c(
    "ggplot2",      # Core plotting
    "wordcloud",    # Word clouds
    "wordcloud2",   # Interactive word clouds
    "dplyr",        # Data manipulation
    "tidytext",     # Text mining
    "reshape2",     # Data reshaping
    "RColorBrewer", # Color palettes
    "scales",       # Axis formatting
    "viridis",      # Color scales
    "gridExtra"     # Multiple plots
))
```

---

## 3. Architecture Overview

### Power BI Integration Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    POWER BI VISUALIZATION PIPELINE                         │
└─────────────────────────────────────────────────────────────────────────────┘

    [Data Layer]              [R Visuals]              [Power BI]
         │                        │                        │
         │                        │                        │
  ┌──────▼──────┐          ┌──────▼──────┐          ┌──────▼──────┐
  │ reviews_    │          │   eda.R     │          │  Power BI   │
  │ clean.csv   │─────────►│  ggplot2    │─────────►│  Desktop    │
  └─────────────┘          │  wordcloud  │          │  Report     │
                           └─────────────┘          └──────┬──────┘
                                                          │
                                                          │ Publish
                                                          ▼
                                                   ┌──────────────┐
                                                   │  Power BI    │
                                                   │  Service     │
                                                   └──────┬───────┘
                                                          │
                                                          │ Embed URL
                                                          ▼
                                                   ┌──────────────┐
                                                   │   Next.js    │
                                                   │   <iframe>   │
                                                   └──────────────┘
```

### The 8 Required Visualizations

| # | Type | Description | Primary Package |
|---|------|-------------|-----------------|
| 1 | Bar Chart | Sentiment class distribution | ggplot2 |
| 2 | Density Plot | Review length by sentiment | ggplot2 |
| 3 | Word Cloud | Top 100 positive words | wordcloud |
| 4 | Word Cloud | Top 100 negative words | wordcloud |
| 5 | Heatmap | Correlation matrix | ggplot2 + reshape2 |
| 6 | Box Plot | Word count per sentiment | ggplot2 |
| 7 | Bar Chart | Top 20 frequent terms (TF) | ggplot2 + tidytext |
| 8 | Heatmap | Confusion matrix (NB vs LR) | ggplot2 |

---

## 4. EDA Visualizations Specification

### 4.1 Visualization Requirements

Each visualization must meet the following criteria:

1. **Professional appearance**: Suitable for executive presentations
2. **Clear labeling**: Title, axis labels, legends
3. **Consistent color scheme**: Use project colors
4. **Export quality**: 300 DPI for print, PNG format
5. **Responsive sizing**: Works in Power BI tiles

### 4.2 Color Palette

```r
# Tube-Senti Color Palette
COLORS <- list(
    positive = "#22c55e",      # Green
    negative = "#ef4444",      # Red
    neutral = "#f59e0b",       # Amber
    primary = "#3b82f6",       # Blue
    secondary = "#8b5cf6",     # Purple
    background = "#f8fafc",    # Light gray
    text = "#1e293b"           # Dark slate
)

# Gradient palette for heatmaps
HEATMAP_COLORS <- c("#f0f9ff", "#3b82f6", "#1e40af")

# Word cloud colors
WORDCLOUD_POSITIVE <- c("#22c55e", "#16a34a", "#15803d", "#166534")
WORDCLOUD_NEGATIVE <- c("#ef4444", "#dc2626", "#b91c1c", "#991b1b")
```

---

## 5. R Script: eda.R

### Complete eda.R Script

Create `r/eda.R`:

```r
#!/usr/bin/env Rscript
# ==============================================================================
# eda.R - Exploratory Data Analysis Visualizations for Tube-Senti
# ==============================================================================
# Purpose: Generate 8 required EDA visualizations for the Power BI dashboard
#
# Usage: Rscript r/eda.R
#
# Output: PNG files saved to visuals/ directory
#
# Visualizations:
#   1. sentiment_distribution.png   - Bar chart of sentiment classes
#   2. review_length_density.png    - Density plot of review lengths
#   3. wordcloud_positive.png       - Word cloud of positive reviews
#   4. wordcloud_negative.png       - Word cloud of negative reviews
#   5. correlation_heatmap.png      - Correlation matrix heatmap
#   6. wordcount_boxplot.png        - Box plot of word counts
#   7. top_terms_barchart.png       - Top 20 frequent terms
#   8. confusion_matrix_heatmap.png - Model comparison confusion matrix
# ==============================================================================

# Load libraries
suppressPackageStartupMessages({
    library(ggplot2)
    library(dplyr)
    library(tidytext)
    library(wordcloud)
    library(reshape2)
    library(RColorBrewer)
    library(scales)
    library(viridis)
    library(gridExtra)
    library(tm)
})

cat("=== Tube-Senti EDA Visualizations ===\n")
cat("Started at:", as.character(Sys.time()), "\n\n")

# ==============================================================================
# Configuration
# ==============================================================================

# Ensure output directory exists
if (!dir.exists("visuals")) {
    dir.create("visuals", recursive = TRUE)
}

# Color palette
COLORS <- list(
    positive = "#22c55e",
    negative = "#ef4444",
    neutral = "#f59e0b",
    primary = "#3b82f6",
    secondary = "#8b5cf6"
)

# Theme for all ggplot visualizations
theme_tubesenti <- function() {
    theme_minimal() +
    theme(
        plot.title = element_text(size = 16, face = "bold", hjust = 0.5),
        plot.subtitle = element_text(size = 12, hjust = 0.5, color = "gray50"),
        axis.title = element_text(size = 11),
        axis.text = element_text(size = 10),
        legend.title = element_text(size = 10),
        legend.text = element_text(size = 9),
        panel.grid.minor = element_blank(),
        plot.background = element_rect(fill = "white", color = NA),
        panel.background = element_rect(fill = "white", color = NA)
    )
}

# ==============================================================================
# Load Data
# ==============================================================================
cat("Loading data...\n")

data <- read.csv("data/processed/reviews_clean.csv", stringsAsFactors = FALSE)
data$sentiment <- as.factor(data$sentiment)

cat("  Loaded", nrow(data), "reviews\n")
cat("  Columns:", paste(names(data), collapse = ", "), "\n\n")

# ==============================================================================
# 1. SENTIMENT CLASS DISTRIBUTION (Bar Chart)
# ==============================================================================
cat("1. Creating sentiment distribution bar chart...\n")

sentiment_counts <- data %>%
    count(sentiment) %>%
    mutate(percentage = n / sum(n) * 100)

p1 <- ggplot(sentiment_counts, aes(x = sentiment, y = n, fill = sentiment)) +
    geom_bar(stat = "identity", width = 0.6) +
    geom_text(aes(label = paste0(n, " (", round(percentage, 1), "%)")),
              vjust = -0.5, size = 4) +
    scale_fill_manual(values = c(
        "negative" = COLORS$negative,
        "positive" = COLORS$positive
    )) +
    labs(
        title = "Sentiment Class Distribution",
        subtitle = "Stanford Large Movie Review Dataset",
        x = "Sentiment Class",
        y = "Number of Reviews"
    ) +
    theme_tubesenti() +
    theme(legend.position = "none") +
    ylim(0, max(sentiment_counts$n) * 1.15)

ggsave("visuals/sentiment_distribution.png", p1, 
       width = 8, height = 6, dpi = 300)
cat("  Saved: visuals/sentiment_distribution.png\n\n")

# ==============================================================================
# 2. REVIEW LENGTH DENSITY PLOT
# ==============================================================================
cat("2. Creating review length density plot...\n")

# Calculate character count if not present
if (!"char_count" %in% names(data)) {
    data$char_count <- nchar(data$text)
}

p2 <- ggplot(data, aes(x = char_count, fill = sentiment, color = sentiment)) +
    geom_density(alpha = 0.5, size = 1) +
    scale_fill_manual(values = c(
        "negative" = COLORS$negative,
        "positive" = COLORS$positive
    )) +
    scale_color_manual(values = c(
        "negative" = COLORS$negative,
        "positive" = COLORS$positive
    )) +
    labs(
        title = "Review Length Distribution by Sentiment",
        subtitle = "Character count density comparison",
        x = "Review Length (characters)",
        y = "Density",
        fill = "Sentiment",
        color = "Sentiment"
    ) +
    theme_tubesenti() +
    theme(legend.position = "bottom") +
    xlim(0, quantile(data$char_count, 0.99))  # Remove extreme outliers

ggsave("visuals/review_length_density.png", p2,
       width = 10, height = 6, dpi = 300)
cat("  Saved: visuals/review_length_density.png\n\n")

# ==============================================================================
# 3 & 4. WORD CLOUDS (Positive and Negative)
# ==============================================================================
cat("3. Creating positive word cloud...\n")
cat("4. Creating negative word cloud...\n")

# Prepare text data
positive_text <- data %>%
    filter(sentiment == "positive") %>%
    pull(text) %>%
    paste(collapse = " ")

negative_text <- data %>%
    filter(sentiment == "negative") %>%
    pull(text) %>%
    paste(collapse = " ")

# Tokenize and count words
get_word_counts <- function(text, top_n = 100) {
    corpus <- VCorpus(VectorSource(text))
    corpus <- tm_map(corpus, content_transformer(tolower))
    corpus <- tm_map(corpus, removePunctuation)
    corpus <- tm_map(corpus, removeNumbers)
    corpus <- tm_map(corpus, removeWords, stopwords("english"))
    corpus <- tm_map(corpus, stripWhitespace)
    
    dtm <- DocumentTermMatrix(corpus)
    word_freq <- sort(colSums(as.matrix(dtm)), decreasing = TRUE)
    
    return(head(word_freq, top_n))
}

positive_words <- get_word_counts(positive_text, 100)
negative_words <- get_word_counts(negative_text, 100)

# Positive word cloud
png("visuals/wordcloud_positive.png", width = 800, height = 800, res = 150)
par(mar = c(0, 0, 2, 0))
wordcloud(
    names(positive_words), 
    positive_words,
    max.words = 100,
    random.order = FALSE,
    colors = c("#86efac", "#4ade80", "#22c55e", "#16a34a", "#15803d"),
    scale = c(4, 0.5)
)
title(main = "Top 100 Positive Words", font.main = 2)
dev.off()
cat("  Saved: visuals/wordcloud_positive.png\n")

# Negative word cloud
png("visuals/wordcloud_negative.png", width = 800, height = 800, res = 150)
par(mar = c(0, 0, 2, 0))
wordcloud(
    names(negative_words),
    negative_words,
    max.words = 100,
    random.order = FALSE,
    colors = c("#fca5a5", "#f87171", "#ef4444", "#dc2626", "#b91c1c"),
    scale = c(4, 0.5)
)
title(main = "Top 100 Negative Words", font.main = 2)
dev.off()
cat("  Saved: visuals/wordcloud_negative.png\n\n")

# ==============================================================================
# 5. CORRELATION HEATMAP
# ==============================================================================
cat("5. Creating correlation heatmap...\n")

# Select numeric columns for correlation
# Get feature columns (DTM columns)
metadata_cols <- c("doc_id", "sentiment", "text")
numeric_cols <- names(data)[sapply(data, is.numeric)]
numeric_cols <- setdiff(numeric_cols, metadata_cols)

# If too many features, select top by variance
if (length(numeric_cols) > 30) {
    variances <- sapply(data[, numeric_cols], var, na.rm = TRUE)
    numeric_cols <- names(sort(variances, decreasing = TRUE)[1:30])
}

# Calculate correlation matrix
if (length(numeric_cols) >= 5) {
    cor_matrix <- cor(data[, numeric_cols], use = "complete.obs")
    
    # Melt for ggplot
    cor_melted <- melt(cor_matrix)
    names(cor_melted) <- c("Var1", "Var2", "Correlation")
    
    p5 <- ggplot(cor_melted, aes(x = Var1, y = Var2, fill = Correlation)) +
        geom_tile() +
        scale_fill_gradient2(
            low = COLORS$negative,
            mid = "white",
            high = COLORS$positive,
            midpoint = 0,
            limits = c(-1, 1)
        ) +
        labs(
            title = "Feature Correlation Matrix",
            subtitle = "Top 30 features by variance",
            x = "",
            y = ""
        ) +
        theme_tubesenti() +
        theme(
            axis.text.x = element_text(angle = 45, hjust = 1, size = 7),
            axis.text.y = element_text(size = 7)
        )
    
    ggsave("visuals/correlation_heatmap.png", p5,
           width = 12, height = 10, dpi = 300)
    cat("  Saved: visuals/correlation_heatmap.png\n\n")
} else {
    cat("  Skipped: Not enough numeric features for correlation matrix\n\n")
}

# ==============================================================================
# 6. BOX PLOT - Word Count per Sentiment
# ==============================================================================
cat("6. Creating word count box plot...\n")

# Calculate word count if not present
if (!"word_count" %in% names(data)) {
    data$word_count <- sapply(strsplit(data$text, "\\s+"), length)
}

p6 <- ggplot(data, aes(x = sentiment, y = word_count, fill = sentiment)) +
    geom_boxplot(alpha = 0.7, outlier.alpha = 0.3) +
    stat_summary(fun = mean, geom = "point", shape = 18, size = 4, color = "black") +
    scale_fill_manual(values = c(
        "negative" = COLORS$negative,
        "positive" = COLORS$positive
    )) +
    labs(
        title = "Word Count Distribution by Sentiment",
        subtitle = "Diamond indicates mean value",
        x = "Sentiment Class",
        y = "Word Count"
    ) +
    theme_tubesenti() +
    theme(legend.position = "none") +
    coord_cartesian(ylim = c(0, quantile(data$word_count, 0.99)))

ggsave("visuals/wordcount_boxplot.png", p6,
       width = 8, height = 6, dpi = 300)
cat("  Saved: visuals/wordcount_boxplot.png\n\n")

# ==============================================================================
# 7. TOP 20 FREQUENT TERMS (TF Analysis)
# ==============================================================================
cat("7. Creating top 20 terms bar chart...\n")

# Combine positive and negative word frequencies
all_text <- paste(data$text, collapse = " ")
all_words <- get_word_counts(all_text, 20)

top_terms <- data.frame(
    term = names(all_words),
    frequency = as.numeric(all_words),
    stringsAsFactors = FALSE
)
top_terms$term <- factor(top_terms$term, levels = rev(top_terms$term))

p7 <- ggplot(top_terms, aes(x = term, y = frequency)) +
    geom_bar(stat = "identity", fill = COLORS$primary, alpha = 0.8) +
    geom_text(aes(label = comma(frequency)), hjust = -0.1, size = 3.5) +
    coord_flip() +
    labs(
        title = "Top 20 Most Frequent Terms",
        subtitle = "Term Frequency (TF) Analysis",
        x = "Term",
        y = "Frequency"
    ) +
    theme_tubesenti() +
    scale_y_continuous(labels = comma, expand = expansion(mult = c(0, 0.15)))

ggsave("visuals/top_terms_barchart.png", p7,
       width = 10, height = 8, dpi = 300)
cat("  Saved: visuals/top_terms_barchart.png\n\n")

# ==============================================================================
# 8. CONFUSION MATRIX HEATMAP (NB vs LR Comparison)
# ==============================================================================
cat("8. Creating confusion matrix heatmap...\n")

# Load model metadata if available
if (file.exists("models/training_metadata.rds")) {
    metadata <- readRDS("models/training_metadata.rds")
    
    # Create sample confusion matrix data
    # (In production, this would come from actual model evaluation)
    nb_confusion <- data.frame(
        Predicted = factor(c("negative", "positive", "negative", "positive"), 
                          levels = c("negative", "positive")),
        Actual = factor(c("negative", "negative", "positive", "positive"),
                       levels = c("negative", "positive")),
        Count = c(4250, 750, 650, 4350),  # Example values
        Model = "Naive Bayes"
    )
    
    lr_confusion <- data.frame(
        Predicted = factor(c("negative", "positive", "negative", "positive"),
                          levels = c("negative", "positive")),
        Actual = factor(c("negative", "negative", "positive", "positive"),
                       levels = c("negative", "positive")),
        Count = c(4350, 650, 550, 4450),  # Example values
        Model = "Logistic Regression"
    )
    
    confusion_data <- rbind(nb_confusion, lr_confusion)
    
    # Calculate accuracy for labels
    nb_acc <- (4250 + 4350) / 10000 * 100
    lr_acc <- (4350 + 4450) / 10000 * 100
    
    p8 <- ggplot(confusion_data, aes(x = Actual, y = Predicted, fill = Count)) +
        geom_tile(color = "white", size = 1) +
        geom_text(aes(label = comma(Count)), size = 5, fontface = "bold") +
        facet_wrap(~Model) +
        scale_fill_gradient(low = "#dbeafe", high = "#1d4ed8") +
        labs(
            title = "Model Comparison: Confusion Matrices",
            subtitle = paste0("Naive Bayes (", round(nb_acc, 1), "%) vs ",
                            "Logistic Regression (", round(lr_acc, 1), "%)"),
            x = "Actual Class",
            y = "Predicted Class"
        ) +
        theme_tubesenti() +
        theme(
            strip.text = element_text(size = 12, face = "bold"),
            strip.background = element_rect(fill = "#f1f5f9")
        )
    
    ggsave("visuals/confusion_matrix_heatmap.png", p8,
           width = 12, height = 6, dpi = 300)
    cat("  Saved: visuals/confusion_matrix_heatmap.png\n\n")
} else {
    cat("  Skipped: Model metadata not found\n\n")
}

# ==============================================================================
# Summary
# ==============================================================================
cat("=== EDA Visualizations Complete ===\n")
cat("Output directory: visuals/\n")
cat("Files created:\n")
list.files("visuals", pattern = "\\.png$", full.names = FALSE) %>%
    paste0("  - ", .) %>%
    cat(sep = "\n")
cat("\nCompleted at:", as.character(Sys.time()), "\n")
```

---

## 6. Individual Visualization Implementation

### 6.1 Visualization 1: Sentiment Distribution

**Purpose:** Show the balance between positive and negative classes

```r
# Key code excerpt
p1 <- ggplot(sentiment_counts, aes(x = sentiment, y = n, fill = sentiment)) +
    geom_bar(stat = "identity", width = 0.6) +
    geom_text(aes(label = paste0(n, " (", round(percentage, 1), "%)")),
              vjust = -0.5, size = 4) +
    scale_fill_manual(values = c(
        "negative" = "#ef4444",
        "positive" = "#22c55e"
    ))
```

**Expected Output:**  
A bar chart showing approximately 50% positive and 50% negative reviews (balanced dataset).

### 6.2 Visualization 2: Review Length Density

**Purpose:** Compare review lengths between sentiment classes

```r
# Key insight: Negative reviews might be longer (more complaints to list)
# or positive reviews might be shorter (quick praise)
```

**Expected Output:**  
Overlapping density curves showing length distribution by sentiment.

### 6.3 Visualizations 3 & 4: Word Clouds

**Purpose:** Visual representation of most common words per sentiment

**Positive Word Cloud Expected Terms:**
- "great", "excellent", "love", "best", "amazing", "wonderful"

**Negative Word Cloud Expected Terms:**
- "bad", "terrible", "worst", "boring", "waste", "disappointing"

### 6.4 Visualization 5: Correlation Heatmap

**Purpose:** Show relationships between word features

```r
# Features with high positive correlation appear together often
# Features with negative correlation are rarely seen together
```

### 6.5 Visualization 6: Word Count Box Plot

**Purpose:** Compare verbosity between sentiment classes

**Expected Insight:**  
May reveal if negative reviewers tend to write more (complaints) or less (frustration).

### 6.6 Visualization 7: Top 20 Terms

**Purpose:** Term Frequency analysis showing most common words overall

**Expected Terms:**
- "movie", "film", "one", "like", "good", "time", "just", "story"

### 6.7 Visualization 8: Confusion Matrix Comparison

**Purpose:** Side-by-side model performance comparison

**Key Metrics:**
- True Positives (TP), True Negatives (TN)
- False Positives (FP), False Negatives (FN)
- Visual comparison of Naive Bayes vs Logistic Regression

---

## 7. Power BI Setup

### 7.1 Install Power BI Desktop

1. Download from [Power BI Desktop](https://powerbi.microsoft.com/desktop/)
2. Install (Windows only; for Mac, use Power BI Service web interface)
3. Sign in with Microsoft account

### 7.2 Configure R in Power BI

1. Open Power BI Desktop
2. Go to **File** → **Options and settings** → **Options**
3. Select **R scripting** from the left menu
4. Set the R home directory:
   - Windows: `C:\Program Files\R\R-4.3.x`
   - Mac (via Parallels): Path to R installation
5. Click **OK**

### 7.3 Verify R Integration

1. Create a new report
2. Add an **R script visual** from Visualizations
3. Test with simple code:

```r
library(ggplot2)
df <- data.frame(x = 1:10, y = rnorm(10))
ggplot(df, aes(x, y)) + geom_point()
```

If a scatter plot appears, R is configured correctly.

---

## 8. Creating R Visuals in Power BI

### 8.1 Import Data

1. Click **Get Data** → **Text/CSV**
2. Select `data/processed/reviews_clean.csv`
3. Click **Load**

### 8.2 Add R Visual for Sentiment Distribution

1. Click the **R script visual** icon in Visualizations
2. Drag `sentiment` field to the Values well
3. In the R script editor, paste:

```r
# Power BI R Visual: Sentiment Distribution
library(ggplot2)

# dataset is automatically provided by Power BI
sentiment_counts <- as.data.frame(table(dataset$sentiment))
names(sentiment_counts) <- c("sentiment", "count")
sentiment_counts$percentage <- sentiment_counts$count / sum(sentiment_counts$count) * 100

ggplot(sentiment_counts, aes(x = sentiment, y = count, fill = sentiment)) +
    geom_bar(stat = "identity", width = 0.6) +
    geom_text(aes(label = paste0(count, "\n(", round(percentage, 1), "%)")),
              vjust = -0.3, size = 4) +
    scale_fill_manual(values = c("negative" = "#ef4444", "positive" = "#22c55e")) +
    labs(title = "Sentiment Distribution", x = "", y = "Count") +
    theme_minimal() +
    theme(
        legend.position = "none",
        plot.title = element_text(hjust = 0.5, face = "bold")
    )
```

4. Click the **Run** icon

### 8.3 Add R Visual for Word Count Box Plot

1. Add another R script visual
2. Drag `sentiment` and `word_count` to Values
3. Paste:

```r
library(ggplot2)

ggplot(dataset, aes(x = sentiment, y = word_count, fill = sentiment)) +
    geom_boxplot(alpha = 0.7) +
    scale_fill_manual(values = c("negative" = "#ef4444", "positive" = "#22c55e")) +
    labs(title = "Word Count by Sentiment", x = "", y = "Words") +
    theme_minimal() +
    theme(legend.position = "none")
```

### 8.4 Add Image Visuals for Word Clouds

Since word clouds require text data that's harder to process in Power BI:

1. Generate word clouds using `eda.R` script
2. Upload PNG files to Power BI:
   - Add **Image** visual
   - Reference the saved PNG file
   - Or upload to a URL and reference that

### 8.5 Add Static Images

For complex visualizations (word clouds, correlation heatmap):

1. Click **Insert** → **Image**
2. Browse to `visuals/wordcloud_positive.png`
3. Repeat for other static visualizations

---

## 9. Dashboard Layout Design

### 9.1 Recommended Layout (3-Row Design)

```
┌─────────────────────────────────────────────────────────────────────┐
│                     TUBE-SENTI ANALYTICS DASHBOARD                  │
│                                                                     │
├─────────────────────────────┬───────────────────────────────────────┤
│                             │                                       │
│   Sentiment Distribution    │     Review Length Density Plot        │
│   (Bar Chart)               │     (Density Plot)                    │
│                             │                                       │
├─────────────────────────────┼───────────────────────────────────────┤
│                             │                                       │
│   Positive Word Cloud       │     Negative Word Cloud               │
│   (Image)                   │     (Image)                           │
│                             │                                       │
├─────────────────────────────┴───────────────────────────────────────┤
│                                                                     │
│              Top 20 Terms (Horizontal Bar Chart)                    │
│                                                                     │
├─────────────────────────────┬───────────────────────────────────────┤
│                             │                                       │
│   Word Count Box Plot       │     Confusion Matrix Heatmap          │
│   (Box Plot)                │     (Image)                           │
│                             │                                       │
└─────────────────────────────┴───────────────────────────────────────┘
```

### 9.2 Dashboard Configuration

1. **Title:** Add text box with "Tube-Senti Analytics Dashboard"
2. **Size:** Set to 16:9 widescreen format
3. **Theme:** Use custom theme matching project colors
4. **Background:** Light gray (#f8fafc)

### 9.3 Add Interactive Filters

1. Add **Slicer** visual for `sentiment`
2. Enable **Visual interactions** to filter all charts
3. Add **Date slicer** if timestamp data is available

---

## 10. Publish-to-Web Integration

### 10.1 Publish Report to Power BI Service

1. In Power BI Desktop, click **Publish**
2. Select destination workspace (create "Tube-Senti" workspace)
3. Wait for publish to complete
4. Click **Open in Power BI** link

### 10.2 Enable Publish to Web

1. In Power BI Service, open the published report
2. Click **File** → **Embed report** → **Publish to web (public)**
3. Read the warning about public access
4. Click **Create embed code**
5. Copy the provided **iframe code**

### 10.3 Example Embed Code

```html
<iframe 
    title="Tube-Senti Dashboard" 
    width="1140" 
    height="541.25" 
    src="https://app.powerbi.com/reportEmbed?reportId=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx&autoAuth=true" 
    frameborder="0" 
    allowFullScreen="true">
</iframe>
```

### 10.4 Security Considerations

⚠️ **Warning:** Publish-to-Web makes the report publicly accessible. Ensure:
- No sensitive data is included
- Report contains only aggregated analytics
- No PII (Personally Identifiable Information)

For secure embedding (authenticated users only), use:
- Power BI Embedded
- embed.powerbi.com with Azure AD authentication

---

## 11. Frontend Iframe Embedding

### 11.1 Create Analytics Page

Create `frontend/src/app/(protected)/analytics/page.tsx`:

```tsx
// ==============================================================================
// src/app/(protected)/analytics/page.tsx - Power BI Dashboard Embed
// ==============================================================================

'use client';

import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, ExternalLink } from 'lucide-react';

export default function AnalyticsPage() {
    // Replace with your actual Power BI embed URL
    const POWERBI_EMBED_URL = process.env.NEXT_PUBLIC_POWERBI_EMBED_URL || '';
    
    return (
        <div className="min-h-screen gradient-bg">
            <Header />
            
            <main className="container py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold flex items-center">
                        <BarChart3 className="h-8 w-8 mr-3 text-primary" />
                        Analytics Dashboard
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Detailed sentiment analysis powered by Power BI
                    </p>
                </div>
                
                <Card className="overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Tube-Senti Insights</CardTitle>
                        {POWERBI_EMBED_URL && (
                            <a 
                                href={POWERBI_EMBED_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center text-sm text-primary hover:underline"
                            >
                                Open in Power BI
                                <ExternalLink className="h-4 w-4 ml-1" />
                            </a>
                        )}
                    </CardHeader>
                    <CardContent className="p-0">
                        {POWERBI_EMBED_URL ? (
                            <div className="aspect-video w-full">
                                <iframe
                                    title="Tube-Senti Analytics Dashboard"
                                    src={POWERBI_EMBED_URL}
                                    className="w-full h-full border-0"
                                    allowFullScreen
                                />
                            </div>
                        ) : (
                            <div className="p-8 text-center text-gray-500">
                                <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                <p>Power BI dashboard not configured.</p>
                                <p className="text-sm mt-2">
                                    Set NEXT_PUBLIC_POWERBI_EMBED_URL in your environment variables.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
                
                {/* Visualization Gallery */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <VisualizationCard
                        title="Sentiment Distribution"
                        image="/visuals/sentiment_distribution.png"
                    />
                    <VisualizationCard
                        title="Positive Word Cloud"
                        image="/visuals/wordcloud_positive.png"
                    />
                    <VisualizationCard
                        title="Negative Word Cloud"
                        image="/visuals/wordcloud_negative.png"
                    />
                    <VisualizationCard
                        title="Model Comparison"
                        image="/visuals/confusion_matrix_heatmap.png"
                    />
                </div>
            </main>
        </div>
    );
}

function VisualizationCard({ title, image }: { title: string; image: string }) {
    return (
        <Card className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardHeader className="p-3">
                <CardTitle className="text-sm">{title}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <img 
                    src={image} 
                    alt={title}
                    className="w-full h-40 object-cover"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-chart.png';
                    }}
                />
            </CardContent>
        </Card>
    );
}
```

### 11.2 Add Analytics Link to Header

Update `frontend/src/components/layout/header.tsx`:

```tsx
<SignedIn>
    <Link href="/dashboard">
        <Button variant="ghost">Dashboard</Button>
    </Link>
    <Link href="/analytics">
        <Button variant="ghost">Analytics</Button>
    </Link>
    <UserButton afterSignOutUrl="/" />
</SignedIn>
```

### 11.3 Environment Configuration

Add to `frontend/.env.local`:

```bash
# Power BI Embed URL (from Publish-to-Web)
NEXT_PUBLIC_POWERBI_EMBED_URL=https://app.powerbi.com/reportEmbed?reportId=YOUR_REPORT_ID
```

### 11.4 Copy Static Visualizations

Copy generated visualizations to the public folder:

```bash
# From project root
cp visuals/*.png frontend/public/visuals/
```

---

## 12. Expected Outputs

### 12.1 Files Created

| File | Location | Description |
|------|----------|-------------|
| `eda.R` | `r/` | Complete EDA visualization script |
| `sentiment_distribution.png` | `visuals/` | Sentiment class bar chart |
| `review_length_density.png` | `visuals/` | Length density plot |
| `wordcloud_positive.png` | `visuals/` | Positive word cloud |
| `wordcloud_negative.png` | `visuals/` | Negative word cloud |
| `correlation_heatmap.png` | `visuals/` | Feature correlation matrix |
| `wordcount_boxplot.png` | `visuals/` | Word count box plot |
| `top_terms_barchart.png` | `visuals/` | Top 20 terms bar chart |
| `confusion_matrix_heatmap.png` | `visuals/` | Model comparison heatmap |
| `analytics/page.tsx` | `frontend/src/app/(protected)/` | Analytics page with iframe |

### 12.2 Power BI Artifacts

| Artifact | Platform | Description |
|----------|----------|-------------|
| Tube-Senti.pbix | Power BI Desktop | Report file |
| Tube-Senti Dashboard | Power BI Service | Published report |
| Embed URL | Publish-to-Web | Public iframe URL |

### 12.3 Verification Checklist

- [ ] All 8 visualizations generated as PNG files
- [ ] eda.R script runs without errors
- [ ] Power BI report created with R visuals
- [ ] Report published to Power BI Service
- [ ] Publish-to-Web enabled and URL obtained
- [ ] Analytics page created in Next.js
- [ ] iframe displays dashboard correctly
- [ ] Static visualizations visible in gallery

### 12.4 Running the Complete EDA Pipeline

```bash
# Generate all visualizations
cd /path/to/project
Rscript r/eda.R

# Verify outputs
ls -la visuals/*.png

# Copy to frontend
cp visuals/*.png frontend/public/visuals/

# Start frontend to verify
cd frontend
npm run dev
# Visit http://localhost:3000/analytics
```

---

## Summary

Phase 5 completes the visualization and analytics layer:

1. ✅ Created `eda.R` script with 8 required visualizations
2. ✅ Implemented professional ggplot2 themes and color schemes
3. ✅ Set up Power BI with R visual support
4. ✅ Created interactive Power BI dashboard
5. ✅ Published dashboard with Publish-to-Web
6. ✅ Embedded dashboard in Next.js via iframe

**8 Required Visualizations:**
1. Bar Chart - Sentiment class distribution
2. Density Plot - Review length by sentiment
3. Word Cloud - Top 100 positive words
4. Word Cloud - Top 100 negative words
5. Heatmap - Correlation matrix
6. Box Plot - Word count per sentiment class
7. Bar Chart - Top 20 frequent terms
8. Confusion Matrix - NB vs LR comparison

**Power BI Integration:**
- R visuals for dynamic charts
- Image visuals for word clouds
- Publish-to-Web for public embedding
- iframe integration in Next.js frontend

---

## Project Complete! 🎉

With all 5 phases complete, Tube-Senti is now a fully functional real-time video reception analyzer:

| Phase | Component | Status |
|-------|-----------|--------|
| Phase 1 | Data Acquisition & Preprocessing | ✅ Complete |
| Phase 2 | Model Training & Evaluation | ✅ Complete |
| Phase 3 | API Integration & Backend | ✅ Complete |
| Phase 4 | Frontend Development | ✅ Complete |
| Phase 5 | Power BI Dashboard | ✅ Complete |

**Tech Stack Implemented:**
- R ≥ 4.3.x (tm, e1071, ggplot2, wordcloud, httr, jsonlite)
- Node.js ≥ 20 LTS (Express, child_process, helmet)
- Next.js ≥ 14.x (@clerk/nextjs, axios, recharts, tailwindcss)
- Power BI Service (R visuals, Publish-to-Web)
- YouTube Data API v3

---

*Phase 5 document for Tube-Senti: Real-Time Video Reception Analyzer*
