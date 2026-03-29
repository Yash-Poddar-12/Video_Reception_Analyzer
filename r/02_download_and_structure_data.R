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
