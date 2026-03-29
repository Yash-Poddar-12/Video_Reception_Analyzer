# TF weighting: Simple count of term occurrences
# Suitable for Naive Bayes as it directly uses term probabilities

# TF-IDF would down-weight common terms, but Naive Bayes
# inherently handles this through conditional probabilities

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
