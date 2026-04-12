# ==============================================================================
# 04_apply_preprocessing.R (MSSF-ready)
# ==============================================================================
# Outputs:
#   data/processed/reviews_clean.csv  - R metadata (doc_id, sentiment, counts)
#   data/processed/train.csv          - Python MSSF training data (text, label)
#   data/processed/dtm.rds            - Sparse DTM for EDA / old NB comparison
#   models/vocabulary.rds             - Training vocabulary
# ==============================================================================

# Ensure output directories exist
dir.create("data/processed", recursive = TRUE, showWarnings = FALSE)
dir.create("models",         recursive = TRUE, showWarnings = FALSE)

# Load the raw data
if (!file.exists("data/raw/reviews.csv")) {
    stop("Raw data not found. Run 02_download_and_structure_data.R first.")
}
reviews <- read.csv("data/raw/reviews.csv", stringsAsFactors = FALSE)
cat("Loaded", nrow(reviews), "reviews\n")

# Source the preprocessing module
source("r/utils/text_preprocess.R")

# Apply preprocessing
cat("Preprocessing", nrow(reviews), "documents...\n")
corpus <- preprocess_corpus(reviews$text)

# Create DTM
cat("Creating Document-Term Matrix...\n")
dtm <- create_dtm(corpus, sparse_threshold = 0.99)

# ── 1. R metadata CSV (unchanged format) ─────────────────────────────────────
processed_data <- data.frame(
    doc_id     = reviews$doc_id,
    sentiment  = reviews$sentiment_label,
    word_count = reviews$word_count,
    char_count = reviews$char_count,
    stringsAsFactors = FALSE
)
write.csv(processed_data, "data/processed/reviews_clean.csv", row.names = FALSE)
cat("Processed metadata saved to data/processed/reviews_clean.csv\n")

# ── 2. Python MSSF train.csv (text + label) ───────────────────────────────────
# Normalise label: the column may be a factor with levels negative/positive,
# or a character. Map to clean "positive" / "negative" strings.
label_col <- if ("sentiment" %in% names(reviews)) reviews$sentiment else as.character(reviews$sentiment_label)
label_col <- trimws(tolower(as.character(label_col)))

# Map binary (0/1) to string labels if needed
if (all(label_col %in% c("0", "1"))) {
    label_col <- ifelse(label_col == "1", "positive", "negative")
}

train_csv <- data.frame(
    text  = reviews$text,
    label = label_col,
    stringsAsFactors = FALSE
)
# Keep only valid labels and drop empty text
train_csv <- train_csv[train_csv$label %in% c("positive", "negative", "neutral"), ]
train_csv <- train_csv[nchar(trimws(train_csv$text)) > 2, ]

write.csv(train_csv, "data/processed/train.csv", row.names = FALSE)
cat("Python MSSF training data saved to data/processed/train.csv\n")
cat("  Rows:", nrow(train_csv), "\n")
cat("  Label distribution:\n")
print(table(train_csv$label))

# ── 3. DTM and vocabulary ──────────────────────────────────────────────────────
saveRDS(dtm, "data/processed/dtm.rds")
cat("DTM saved to data/processed/dtm.rds\n")

vocabulary <- get_vocabulary(dtm)
saveRDS(vocabulary, "models/vocabulary.rds")
cat("Vocabulary saved to models/vocabulary.rds with", length(vocabulary), "terms\n")
