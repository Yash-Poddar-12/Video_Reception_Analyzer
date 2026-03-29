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

# Save a light metadata file only
processed_data <- data.frame(
    doc_id = reviews$doc_id,
    sentiment = reviews$sentiment_label,
    word_count = reviews$word_count,
    char_count = reviews$char_count,
    stringsAsFactors = FALSE
)

write.csv(processed_data, "data/processed/reviews_clean.csv", row.names = FALSE)
cat("Processed metadata saved to data/processed/reviews_clean.csv\n")

# Save the sparse DTM directly
saveRDS(dtm, "data/processed/dtm.rds")
cat("DTM saved to data/processed/dtm.rds\n")

# Save vocabulary for later use in prediction
vocabulary <- get_vocabulary(dtm)
saveRDS(vocabulary, "models/vocabulary.rds")
cat("Vocabulary saved to models/vocabulary.rds with", length(vocabulary), "terms\n")
