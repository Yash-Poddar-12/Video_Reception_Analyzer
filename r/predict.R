#!/usr/bin/env Rscript
# ==============================================================================
# predict.R - Sentiment Prediction Script
# ==============================================================================
# Purpose: Predict sentiment for YouTube comments using the trained NB model
#
# Usage: Rscript r/predict.R [COMMENTS_CSV_PATH]
#
# Arguments:
#   COMMENTS_CSV_PATH - Path to comments CSV (default: tmp/comments.csv)
#
# Output: JSON to stdout with predictions and sentiment score
# ==============================================================================

library(tm)
library(e1071)
library(jsonlite)
library(dplyr)

# ==============================================================================
# Parse Command Line Arguments
# ==============================================================================
args <- commandArgs(trailingOnly = TRUE)
# Convert backward slashes to forward slashes for cross-platform compatibility
comments_path <- ifelse(length(args) >= 1, gsub("\\\\", "/", args[1]), "tmp/comments.csv")

cat("Loading comments from:", comments_path, "\n", file = stderr())

# ==============================================================================
# Load Model and Vocabulary
# ==============================================================================
cat("Loading model and vocabulary...\n", file = stderr())

# Check if model exists
if (!file.exists("models/nb_model.rds")) {
    cat(toJSON(list(
        success = FALSE,
        error = "Model file not found: models/nb_model.rds"
    ), auto_unbox = TRUE))
    quit(status = 1)
}

# Load trained model
nb_model <- readRDS("models/nb_model.rds")

# Load vocabulary (list of terms the model was trained on)
if (file.exists("models/vocabulary.rds")) {
    vocabulary <- readRDS("models/vocabulary.rds")
} else {
    # Extract vocabulary from model
    vocabulary <- names(nb_model$tables)
}

cat("Model loaded. Vocabulary size:", length(vocabulary), "\n", file = stderr())

# ==============================================================================
# Preprocessing Function (same as training)
# ==============================================================================
preprocess_text <- function(texts) {
    # Create corpus
    corpus <- VCorpus(VectorSource(texts))
    
    # Apply same transformations as training
    corpus <- tm_map(corpus, content_transformer(tolower))
    corpus <- tm_map(corpus, removePunctuation)
    corpus <- tm_map(corpus, removeNumbers)
    corpus <- tm_map(corpus, removeWords, stopwords("english"))
    corpus <- tm_map(corpus, stripWhitespace)
    
    # Create DTM
    dtm <- DocumentTermMatrix(corpus)
    
    # Convert to matrix
    dtm_matrix <- as.matrix(dtm)
    
    return(list(corpus = corpus, dtm = dtm, matrix = dtm_matrix))
}

# ==============================================================================
# Align DTM to Training Vocabulary
# ==============================================================================
align_to_vocabulary <- function(dtm_matrix, vocabulary) {
    # Create empty matrix with vocabulary columns
    aligned <- matrix(0, nrow = nrow(dtm_matrix), ncol = length(vocabulary))
    colnames(aligned) <- vocabulary
    
    # Fill in values for terms that exist in both
    common_terms <- intersect(colnames(dtm_matrix), vocabulary)
    aligned[, common_terms] <- dtm_matrix[, common_terms]
    
    return(as.data.frame(aligned))
}

# ==============================================================================
# Main Prediction Function
# ==============================================================================
predict_sentiment <- function(comments_df) {
    # Extract text
    texts <- comments_df$text
    
    cat("Preprocessing", length(texts), "comments...\n", file = stderr())
    
    # Preprocess
    processed <- preprocess_text(texts)
    
    # Align to training vocabulary
    features <- align_to_vocabulary(processed$matrix, vocabulary)
    
    cat("Predicting sentiment...\n", file = stderr())
    
    # Predict
    predictions <- predict(nb_model, features, type = "class")
    probabilities <- predict(nb_model, features, type = "raw")
    
    # Create results dataframe
    results <- data.frame(
        comment_id = comments_df$comment_id,
        text = texts,
        prediction = as.character(predictions),
        prob_negative = probabilities[, "negative"],
        prob_positive = probabilities[, "positive"],
        confidence = pmax(probabilities[, "negative"], probabilities[, "positive"]),
        stringsAsFactors = FALSE
    )
    
    return(results)
}

# ==============================================================================
# Calculate Audience Sentiment Score (ASS)
# ==============================================================================
calculate_ass <- function(predictions) {
    # Count predictions
    counts <- table(predictions)
    total <- length(predictions)
    
    # Calculate proportions
    p_positive <- ifelse("positive" %in% names(counts), counts["positive"] / total, 0)
    p_negative <- ifelse("negative" %in% names(counts), counts["negative"] / total, 0)
    
    # ASS Formula: positive=1.0, negative=0.0
    # For binary, this is simply the proportion of positive predictions
    ass <- as.numeric(p_positive) * 100
    
    return(list(
        score = round(ass, 2),
        positive_count = as.integer(ifelse("positive" %in% names(counts), counts["positive"], 0)),
        negative_count = as.integer(ifelse("negative" %in% names(counts), counts["negative"], 0)),
        total_count = total,
        positive_percentage = round(as.numeric(p_positive) * 100, 2),
        negative_percentage = round(as.numeric(p_negative) * 100, 2)
    ))
}

# ==============================================================================
# Interpret ASS Score
# ==============================================================================
interpret_score <- function(score) {
    if (score >= 75) {
        return(list(
            label = "Very Positive",
            description = "The audience has a very positive reception to this video.",
            emoji = "🟢"
        ))
    } else if (score >= 50) {
        return(list(
            label = "Mixed/Neutral",
            description = "The audience has a mixed or neutral reception.",
            emoji = "🟡"
        ))
    } else if (score >= 25) {
        return(list(
            label = "Negative",
            description = "The audience has a negative reception to this video.",
            emoji = "🟠"
        ))
    } else {
        return(list(
            label = "Very Negative",
            description = "The audience has a very negative reception to this video.",
            emoji = "🔴"
        ))
    }
}

# ==============================================================================
# Main Execution
# ==============================================================================
tryCatch({
    # Check if comments file exists
    if (!file.exists(comments_path)) {
        cat(toJSON(list(
            success = FALSE,
            error = paste("Comments file not found:", comments_path)
        ), auto_unbox = TRUE))
        quit(status = 1)
    }
    
    # Load comments
    comments_df <- read.csv(comments_path, stringsAsFactors = FALSE)
    
    if (nrow(comments_df) == 0) {
        cat(toJSON(list(
            success = FALSE,
            error = "No comments found in file"
        ), auto_unbox = TRUE))
        quit(status = 1)
    }
    
    cat("Loaded", nrow(comments_df), "comments\n", file = stderr())
    
    # Predict sentiment
    results <- predict_sentiment(comments_df)
    
    # Calculate ASS
    ass <- calculate_ass(results$prediction)
    interpretation <- interpret_score(ass$score)
    
    # Get sample predictions (top positive and negative)
    top_positive <- results %>%
        filter(prediction == "positive") %>%
        arrange(desc(prob_positive)) %>%
        head(3) %>%
        select(text, confidence)
    
    top_negative <- results %>%
        filter(prediction == "negative") %>%
        arrange(desc(prob_negative)) %>%
        head(3) %>%
        select(text, confidence)
    
    # Build output JSON
    output <- list(
        success = TRUE,
        sentiment_score = ass$score,
        interpretation = interpretation,
        statistics = ass,
        sample_positive = if(nrow(top_positive) > 0) {
            lapply(1:nrow(top_positive), function(i) {
                list(text = top_positive$text[i], confidence = round(top_positive$confidence[i], 3))
            })
        } else { list() },
        sample_negative = if(nrow(top_negative) > 0) {
            lapply(1:nrow(top_negative), function(i) {
                list(text = top_negative$text[i], confidence = round(top_negative$confidence[i], 3))
            })
        } else { list() },
        predictions = lapply(1:nrow(results), function(i) {
            list(
                comment_id = results$comment_id[i],
                text = substr(results$text[i], 1, 100),  # Truncate for JSON size
                sentiment = results$prediction[i],
                confidence = round(results$confidence[i], 3)
            )
        })
    )
    
    # Output JSON to stdout
    cat(toJSON(output, auto_unbox = TRUE, pretty = TRUE))
    
}, error = function(e) {
    cat(toJSON(list(
        success = FALSE,
        error = as.character(e$message)
    ), auto_unbox = TRUE))
    quit(status = 1)
})
