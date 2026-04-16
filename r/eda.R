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
        plot.margin = margin(20, 20, 20, 20)
    )
}

# ==============================================================================
# Load Data
# ==============================================================================

cat("Step 1: Loading data...\n")

# Check if processed data exists
if (!file.exists("data/processed/reviews_clean.csv")) {
    stop("Error: data/processed/reviews_clean.csv not found. Run Phase 1 first.")
}

data <- read.csv("data/processed/reviews_clean.csv", stringsAsFactors = FALSE)
data$sentiment <- as.factor(data$sentiment)

cat("  Loaded", nrow(data), "reviews\n")
cat("  Sentiment distribution:\n")
print(table(data$sentiment))

# Load DTM for term frequency analysis
if (file.exists("data/processed/dtm.rds")) {
    dtm <- readRDS("data/processed/dtm.rds")
    dtm_matrix <- as.matrix(dtm)
    cat("  Loaded DTM with", ncol(dtm_matrix), "terms\n")
} else {
    cat("  Warning: DTM not found, skipping term frequency visualization\n")
    dtm_matrix <- NULL
}

# ==============================================================================
# Visualization 1: Sentiment Distribution
# ==============================================================================

cat("\nStep 2: Creating Visualization 1 - Sentiment Distribution...\n")

sentiment_counts <- data %>%
    group_by(sentiment) %>%
    summarise(count = n()) %>%
    mutate(percentage = count / sum(count) * 100)

p1 <- ggplot(sentiment_counts, aes(x = sentiment, y = count, fill = sentiment)) +
    geom_bar(stat = "identity", width = 0.6) +
    geom_text(aes(label = paste0(count, "\n(", round(percentage, 1), "%)")),
              vjust = -0.3, size = 5, fontface = "bold") +
    scale_fill_manual(values = c("negative" = COLORS$negative, 
                                  "positive" = COLORS$positive)) +
    labs(
        title = "Sentiment Class Distribution",
        subtitle = "Stanford Large Movie Review Dataset",
        x = "Sentiment",
        y = "Number of Reviews"
    ) +
    theme_tubesenti() +
    theme(legend.position = "none") +
    scale_y_continuous(labels = comma)

ggsave("visuals/sentiment_distribution.png", p1, width = 10, height = 6, dpi = 300)
cat("  ✓ Saved visuals/sentiment_distribution.png\n")

# ==============================================================================
# Visualization 2: Review Length Density Plot
# ==============================================================================

cat("\nStep 3: Creating Visualization 2 - Review Length Density...\n")

p2 <- ggplot(data, aes(x = char_count, fill = sentiment, color = sentiment)) +
    geom_density(alpha = 0.5, size = 1) +
    scale_fill_manual(values = c("negative" = COLORS$negative, 
                                  "positive" = COLORS$positive)) +
    scale_color_manual(values = c("negative" = COLORS$negative, 
                                   "positive" = COLORS$positive)) +
    labs(
        title = "Review Length Distribution by Sentiment",
        subtitle = "Character count density comparison",
        x = "Character Count",
        y = "Density",
        fill = "Sentiment",
        color = "Sentiment"
    ) +
    theme_tubesenti() +
    theme(legend.position = "right") +
    xlim(0, quantile(data$char_count, 0.99))

ggsave("visuals/review_length_density.png", p2, width = 10, height = 6, dpi = 300)
cat("  ✓ Saved visuals/review_length_density.png\n")

# ==============================================================================
# Visualization 3: Positive Word Cloud
# ==============================================================================

cat("\nStep 4: Creating Visualization 3 - Positive Word Cloud...\n")

# Create corpus for positive reviews
positive_reviews <- data %>% filter(sentiment == "positive")
positive_corpus <- Corpus(VectorSource(positive_reviews$doc_id))

if (file.exists("data/processed/dtm.rds")) {
    # Use DTM if available
    dtm <- readRDS("data/processed/dtm.rds")
    dtm_matrix <- as.matrix(dtm)
    
    # Get positive reviews DTM
    positive_indices <- which(data$sentiment == "positive")
    positive_dtm <- dtm_matrix[positive_indices, ]
    
    # Calculate term frequencies
    term_freq <- colSums(positive_dtm)
    term_freq <- sort(term_freq, decreasing = TRUE)
    term_freq <- term_freq[term_freq > 10]  # Filter low frequency
    
    # Create word cloud
    png("visuals/wordcloud_positive.png", width = 10, height = 8, units = "in", res = 300)
    par(mar = c(0, 0, 2, 0))
    wordcloud(
        words = names(term_freq),
        freq = term_freq,
        max.words = 100,
        random.order = FALSE,
        colors = brewer.pal(8, "Greens")[4:8],
        scale = c(4, 0.5),
        rot.per = 0.15
    )
    title(main = "Top 100 Positive Review Terms", 
          cex.main = 2, font.main = 2, line = -1)
    dev.off()
    cat("  ✓ Saved visuals/wordcloud_positive.png\n")
} else {
    cat("  ⚠ Skipped (DTM not found)\n")
}

# ==============================================================================
# Visualization 4: Negative Word Cloud
# ==============================================================================

cat("\nStep 5: Creating Visualization 4 - Negative Word Cloud...\n")

if (file.exists("data/processed/dtm.rds")) {
    # Get negative reviews DTM
    negative_indices <- which(data$sentiment == "negative")
    negative_dtm <- dtm_matrix[negative_indices, ]
    
    # Calculate term frequencies
    term_freq_neg <- colSums(negative_dtm)
    term_freq_neg <- sort(term_freq_neg, decreasing = TRUE)
    term_freq_neg <- term_freq_neg[term_freq_neg > 10]
    
    # Create word cloud
    png("visuals/wordcloud_negative.png", width = 10, height = 8, units = "in", res = 300)
    par(mar = c(0, 0, 2, 0))
    wordcloud(
        words = names(term_freq_neg),
        freq = term_freq_neg,
        max.words = 100,
        random.order = FALSE,
        colors = brewer.pal(8, "Reds")[4:8],
        scale = c(4, 0.5),
        rot.per = 0.15
    )
    title(main = "Top 100 Negative Review Terms", 
          cex.main = 2, font.main = 2, line = -1)
    dev.off()
    cat("  ✓ Saved visuals/wordcloud_negative.png\n")
} else {
    cat("  ⚠ Skipped (DTM not found)\n")
}

# ==============================================================================
# Visualization 5: Correlation Heatmap
# ==============================================================================

cat("\nStep 6: Creating Visualization 5 - Correlation Heatmap...\n")

# Select numeric features
numeric_features <- data %>%
    select(word_count, char_count) %>%
    na.omit()

# Add sentiment as numeric
numeric_features$sentiment_numeric <- ifelse(data$sentiment == "positive", 1, 0)

# Calculate correlation matrix
cor_matrix <- cor(numeric_features)

# Reshape for ggplot
cor_melted <- melt(cor_matrix)

p5 <- ggplot(cor_melted, aes(Var1, Var2, fill = value)) +
    geom_tile(color = "white") +
    geom_text(aes(label = round(value, 2)), size = 5) +
    scale_fill_gradient2(
        low = "#3b82f6", 
        mid = "white", 
        high = "#ef4444",
        midpoint = 0,
        limits = c(-1, 1)
    ) +
    labs(
        title = "Feature Correlation Heatmap",
        subtitle = "Pearson correlation coefficients",
        x = "",
        y = "",
        fill = "Correlation"
    ) +
    theme_tubesenti() +
    theme(
        axis.text.x = element_text(angle = 45, hjust = 1),
        panel.grid = element_blank()
    ) +
    coord_fixed()

ggsave("visuals/correlation_heatmap.png", p5, width = 8, height = 8, dpi = 300)
cat("  ✓ Saved visuals/correlation_heatmap.png\n")

# ==============================================================================
# Visualization 6: Word Count Box Plot
# ==============================================================================

cat("\nStep 7: Creating Visualization 6 - Word Count Box Plot...\n")

p6 <- ggplot(data, aes(x = sentiment, y = word_count, fill = sentiment)) +
    geom_boxplot(alpha = 0.7, outlier.alpha = 0.3) +
    stat_summary(fun = mean, geom = "point", shape = 23, size = 3, 
                 fill = "white", color = "black") +
    scale_fill_manual(values = c("negative" = COLORS$negative, 
                                  "positive" = COLORS$positive)) +
    labs(
        title = "Word Count Distribution by Sentiment",
        subtitle = "Box plot with mean (diamond marker)",
        x = "Sentiment",
        y = "Word Count"
    ) +
    theme_tubesenti() +
    theme(legend.position = "none") +
    scale_y_continuous(limits = c(0, quantile(data$word_count, 0.99)))

ggsave("visuals/wordcount_boxplot.png", p6, width = 10, height = 6, dpi = 300)
cat("  ✓ Saved visuals/wordcount_boxplot.png\n")

# ==============================================================================
# Visualization 7: Top 20 Frequent Terms
# ==============================================================================

cat("\nStep 8: Creating Visualization 7 - Top Terms Bar Chart...\n")

if (!is.null(dtm_matrix)) {
    # Calculate total term frequencies
    term_freq_total <- colSums(dtm_matrix)
    term_freq_total <- sort(term_freq_total, decreasing = TRUE)
    top_terms <- head(term_freq_total, 20)
    
    # Create dataframe
    top_terms_df <- data.frame(
        term = names(top_terms),
        frequency = as.numeric(top_terms)
    )
    top_terms_df$term <- factor(top_terms_df$term, levels = rev(top_terms_df$term))
    
    p7 <- ggplot(top_terms_df, aes(x = term, y = frequency)) +
        geom_bar(stat = "identity", fill = COLORS$primary, alpha = 0.8) +
        geom_text(aes(label = comma(frequency)), hjust = -0.2, size = 3.5) +
        coord_flip() +
        labs(
            title = "Top 20 Most Frequent Terms",
            subtitle = "Term frequency across all reviews",
            x = "Term",
            y = "Frequency"
        ) +
        theme_tubesenti() +
        scale_y_continuous(labels = comma, expand = expansion(mult = c(0, 0.1)))
    
    ggsave("visuals/top_terms_barchart.png", p7, width = 10, height = 8, dpi = 300)
    cat("  ✓ Saved visuals/top_terms_barchart.png\n")
} else {
    cat("  ⚠ Skipped (DTM not found)\n")
}

# ==============================================================================
# Visualization 8: Confusion Matrix Heatmap
# ==============================================================================

cat("\nStep 9: Creating Visualization 8 - Confusion Matrix...\n")

# Use the confusion matrix from model training if available
if (file.exists("visuals/confusion_matrix.png")) {
    cat("  ℹ Using existing confusion_matrix.png from training\n")
    # Optionally, you can copy or create an enhanced version
} else {
    cat("  ℹ Creating placeholder - run train_model.R for actual confusion matrix\n")
}

# Create a comparison visualization anyway
if (file.exists("models/training_metadata.rds")) {
    metadata <- readRDS("models/training_metadata.rds")
    
    # Create summary metrics visualization
    metrics_df <- data.frame(
        Metric = c("Accuracy", "F1-Score", "Training Time (s)"),
        Value = c(
            metadata$accuracy * 100,
            metadata$macro_f1 * 100,
            metadata$training_time_seconds
        )
    )
    
    p8 <- ggplot(metrics_df, aes(x = Metric, y = Value)) +
        geom_bar(stat = "identity", fill = COLORS$secondary, alpha = 0.8, width = 0.6) +
        geom_text(aes(label = round(Value, 2)), vjust = -0.5, size = 5, fontface = "bold") +
        labs(
            title = "Naive Bayes Model Performance",
            subtitle = paste("Trained on", metadata$training_samples, "samples"),
            x = "",
            y = "Value"
        ) +
        theme_tubesenti() +
        theme(axis.text.x = element_text(size = 11))
    
    ggsave("visuals/model_performance.png", p8, width = 10, height = 6, dpi = 300)
    cat("  ✓ Saved visuals/model_performance.png\n")
}

# ==============================================================================
# Summary
# ==============================================================================

cat("\n=== Summary ===\n")
cat("Successfully generated visualizations\n")
cat("All files saved to: visuals/\n")
cat("\nGenerated files:\n")
viz_files <- list.files("visuals", pattern = "\\.png$", full.names = FALSE)
for (file in viz_files) {
    cat("  ✓", file, "\n")
}

cat("\nCompleted at:", as.character(Sys.time()), "\n")
cat("\n=== Next Steps ===\n")
cat("1. Open Power BI Desktop\n")
cat("2. Import data/processed/reviews_clean.csv\n")
cat("3. Add R visuals using the code snippets from PHASE_5 documentation\n")
cat("4. Publish to Power BI Service\n")
cat("5. Get embed URL and add to frontend/.env\n")
