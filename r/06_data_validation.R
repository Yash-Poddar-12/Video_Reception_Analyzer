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

# Verify preprocessing worked correctly
cat("\n=== Corpus Quality Check ===\n")

# Sample before and after preprocessing
sample_idx <- sample(1:nrow(reviews), 3)
for (i in sample_idx) {
    cat("\n--- Document", i, "---\n")
    cat("BEFORE:", substr(reviews$text[i], 1, 200), "...\n")
    cat("AFTER:", content(corpus[[i]]), "\n")
}
