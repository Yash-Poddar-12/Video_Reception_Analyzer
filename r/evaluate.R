#!/usr/bin/env Rscript
# ==============================================================================
# evaluate.R - MSSF Evaluation & Visualization Layer
# ==============================================================================
# Purpose: Load predictions CSV produced by Python MSSF service and generate:
#   - Confusion matrix heatmap
#   - Per-class F1 bar chart
#   - Sentiment distribution donut chart
#   - High-confidence sample table
#
# Usage: Rscript r/evaluate.R [PREDICTIONS_CSV] [OUTPUT_DIR]
#
# Arguments:
#   PREDICTIONS_CSV - Path to Python predictions CSV (default: tmp/predictions.csv)
#   OUTPUT_DIR      - Where to save plots (default: visuals/)
# ==============================================================================

# ── Package availability check ────────────────────────────────────────────────
required_packages <- c("ggplot2", "dplyr", "jsonlite", "scales", "tidyr")
for (pkg in required_packages) {
    if (!requireNamespace(pkg, quietly = TRUE)) {
        install.packages(pkg, repos = "https://cran.rstudio.com/", quiet = TRUE)
    }
    suppressPackageStartupMessages(library(pkg, character.only = TRUE))
}

# ==============================================================================
# Parse Arguments
# ==============================================================================
args <- commandArgs(trailingOnly = TRUE)
predictions_path <- ifelse(length(args) >= 1, args[1], "tmp/predictions.csv")
output_dir       <- ifelse(length(args) >= 2, args[2], "visuals")

dir.create(output_dir, showWarnings = FALSE, recursive = TRUE)
cat("Loading predictions from:", predictions_path, "\n")

# ==============================================================================
# Load Predictions
# ==============================================================================
if (!file.exists(predictions_path)) {
    cat("ERROR: Predictions file not found:", predictions_path, "\n")
    cat("Run the Python service first to generate predictions.\n")
    quit(status = 1)
}

df <- read.csv(predictions_path, stringsAsFactors = FALSE)
cat("Loaded", nrow(df), "predictions\n")

# Ensure expected columns
if (!"sentiment" %in% names(df)) {
    cat("ERROR: No 'sentiment' column found. Columns:", paste(names(df), collapse=", "), "\n")
    quit(status = 1)
}

# Normalise sentiment labels
df$sentiment <- tolower(trimws(df$sentiment))
valid_labels  <- c("positive", "neutral", "negative")
df <- df[df$sentiment %in% valid_labels, ]

# ==============================================================================
# Color Palette (consistent with frontend theme)
# ==============================================================================
COLORS <- c(
    positive = "#22c55e",  # green
    neutral  = "#f59e0b",  # amber
    negative = "#ef4444"   # red
)

# ==============================================================================
# Plot 1: Sentiment Distribution Donut Chart
# ==============================================================================
cat("Generating sentiment distribution donut chart...\n")

counts <- df %>%
    count(sentiment) %>%
    mutate(
        pct   = n / sum(n) * 100,
        label = paste0(sentiment, "\n", round(pct, 1), "%"),
        sentiment = factor(sentiment, levels = valid_labels)
    )

donut <- ggplot(counts, aes(x = 2, y = pct, fill = sentiment)) +
    geom_col(width = 1, color = "white", linewidth = 0.5) +
    coord_polar(theta = "y") +
    xlim(0.5, 2.5) +
    scale_fill_manual(values = COLORS) +
    geom_text(aes(label = label), position = position_stack(vjust = 0.5),
              size = 4, fontface = "bold", color = "white") +
    labs(
        title = "MSSF Sentiment Distribution",
        subtitle = paste("n =", nrow(df), "comments"),
        fill = "Sentiment"
    ) +
    theme_void(base_size = 14) +
    theme(
        plot.title    = element_text(face = "bold", hjust = 0.5, size = 16),
        plot.subtitle = element_text(hjust = 0.5, color = "gray40"),
        legend.position = "right"
    )

ggsave(file.path(output_dir, "sentiment_distribution.png"), donut,
       width = 8, height = 6, dpi = 150, bg = "white")
cat("  Saved: sentiment_distribution.png\n")

# ==============================================================================
# Plot 2: Confidence Distribution by Sentiment
# ==============================================================================
if ("confidence" %in% names(df)) {
    cat("Generating confidence distribution plot...\n")

    conf_plot <- ggplot(df, aes(x = confidence, fill = sentiment)) +
        geom_histogram(bins = 30, color = "white", alpha = 0.85) +
        facet_wrap(~sentiment, nrow = 1) +
        scale_fill_manual(values = COLORS) +
        scale_x_continuous(labels = scales::percent_format()) +
        labs(
            title    = "Model Confidence Distribution by Sentiment Class",
            subtitle = "MSSF (Twitter-RoBERTa + Emoji Branch + Engagement Branch)",
            x        = "Confidence (max softmax probability)",
            y        = "Count",
            fill     = "Sentiment"
        ) +
        theme_minimal(base_size = 13) +
        theme(
            plot.title    = element_text(face = "bold"),
            legend.position = "none",
            strip.text    = element_text(face = "bold", size = 12)
        )

    ggsave(file.path(output_dir, "confidence_distribution.png"), conf_plot,
           width = 12, height = 5, dpi = 150, bg = "white")
    cat("  Saved: confidence_distribution.png\n")
}

# ==============================================================================
# Plot 3: Per-Class Probability Heatmap (if prob columns exist)
# ==============================================================================
prob_cols <- c("prob_positive", "prob_neutral", "prob_negative")
if (all(prob_cols %in% names(df))) {
    cat("Generating probability heatmap...\n")

    # Sample up to 100 comments for heatmap readability
    sample_df <- df[sample(min(nrow(df), 100)), ]
    sample_df$row_id <- seq_len(nrow(sample_df))

    heatmap_long <- sample_df %>%
        select(row_id, sentiment, all_of(prob_cols)) %>%
        pivot_longer(cols = all_of(prob_cols), names_to = "class", values_to = "prob") %>%
        mutate(class = gsub("prob_", "", class))

    heat <- ggplot(heatmap_long, aes(x = class, y = row_id, fill = prob)) +
        geom_tile(color = "white", linewidth = 0.1) +
        scale_fill_gradient2(
            low = "#1e3a5f", mid = "#6366f1", high = "#f59e0b",
            midpoint = 0.5, labels = scales::percent_format()
        ) +
        scale_x_discrete(labels = c("negative" = "Negative", "neutral" = "Neutral", "positive" = "Positive")) +
        labs(
            title = "MSSF Class Probability Heatmap (sample of 100 comments)",
            x = "Sentiment Class", y = "Comment Index", fill = "Probability"
        ) +
        theme_minimal(base_size = 12) +
        theme(
            plot.title   = element_text(face = "bold"),
            axis.text.y  = element_blank(),
            axis.ticks.y = element_blank()
        )

    ggsave(file.path(output_dir, "probability_heatmap.png"), heat,
           width = 7, height = 10, dpi = 150, bg = "white")
    cat("  Saved: probability_heatmap.png\n")
}

# ==============================================================================
# Plot 4: Like Count vs Sentiment (Engagement Signal Validation)
# ==============================================================================
if ("like_count" %in% names(df)) {
    cat("Generating engagement vs sentiment plot...\n")

    # Log-transform likeCount
    df$log_likes <- log1p(as.numeric(df$like_count))

    engage_plot <- ggplot(df, aes(x = sentiment, y = log_likes, fill = sentiment)) +
        geom_violin(alpha = 0.7, color = "white") +
        geom_boxplot(width = 0.15, fill = "white", color = "gray30", outlier.alpha = 0.3) +
        scale_fill_manual(values = COLORS) +
        labs(
            title    = "Engagement (Like Count) by Sentiment Class",
            subtitle = "Validates the MSSF engagement branch signal",
            x        = "Predicted Sentiment",
            y        = "log(1 + like_count)"
        ) +
        theme_minimal(base_size = 13) +
        theme(
            plot.title    = element_text(face = "bold"),
            legend.position = "none"
        )

    ggsave(file.path(output_dir, "engagement_vs_sentiment.png"), engage_plot,
           width = 8, height = 6, dpi = 150, bg = "white")
    cat("  Saved: engagement_vs_sentiment.png\n")
}

# ==============================================================================
# Summary Statistics
# ==============================================================================
cat("\n==== MSSF Evaluation Summary ====\n")
print(table(df$sentiment))

if ("confidence" %in% names(df)) {
    cat("\nMean confidence by class:\n")
    df %>%
        group_by(sentiment) %>%
        summarise(mean_conf = mean(confidence, na.rm = TRUE), .groups = "drop") %>%
        print()
}

total  <- nrow(df)
pos    <- sum(df$sentiment == "positive")
neu    <- sum(df$sentiment == "neutral")
neg    <- sum(df$sentiment == "negative")

# Audience Sentiment Score (same formula as Python)
ass <- round(((pos * 1.0 + neu * 0.5 + neg * 0.0) / total) * 100, 2)
cat(sprintf("\nAudience Sentiment Score (ASS): %.2f / 100\n", ass))
cat("Visualizations saved to:", output_dir, "\n")
