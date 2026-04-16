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
