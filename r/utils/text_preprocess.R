# r/utils/text_preprocess.R
# Shared text preprocessing functions for Tube-Senti
# Used by both train_model.R and predict.R to ensure consistency

library(tm)

#' Preprocess a character vector of texts using tm library
#' 
#' @param texts Character vector of raw text documents
#' @return A preprocessed Corpus object
#' 
#' @details
#' This function applies the following transformations in order:
#' 1. Convert to lowercase
#' 2. Remove punctuation
#' 3. Remove numbers
#' 4. Remove English stopwords
#' 5. Strip extra whitespace
#' 
#' CRITICAL: The same preprocessing MUST be applied to both training data
#' and new prediction data. Any inconsistency will cause the DTM vocabulary
#' to mismatch, resulting in prediction errors.

preprocess_corpus <- function(texts) {
    # Create a corpus from the character vector
    corpus <- VCorpus(VectorSource(texts))
    
    # Apply transformations in sequence
    # The order matters for optimal cleaning
    
    # 1. Convert to lowercase
    corpus <- tm_map(corpus, content_transformer(tolower))
    
    # 2. Remove punctuation
    corpus <- tm_map(corpus, removePunctuation)
    
    # 3. Remove numbers
    corpus <- tm_map(corpus, removeNumbers)
    
    # 4. Remove English stopwords
    # Using the default English stopword list from tm package
    corpus <- tm_map(corpus, removeWords, stopwords("en"))
    
    # 5. Strip extra whitespace
    corpus <- tm_map(corpus, stripWhitespace)
    
    return(corpus)
}

#' Create a Document-Term Matrix from preprocessed corpus
#' 
#' @param corpus A preprocessed Corpus object
#' @param sparse_threshold Proportion threshold for removing sparse terms (default: 0.99)
#' @return A DocumentTermMatrix object
#' 
#' @details
#' Uses Term Frequency (TF) weighting. Sparse terms appearing in less than
#' (1 - sparse_threshold) proportion of documents are removed to reduce
#' dimensionality and improve model training speed.

create_dtm <- function(corpus, sparse_threshold = 0.99) {
    # Create Document-Term Matrix with TF weighting
    dtm <- DocumentTermMatrix(corpus)
    
    # Remove sparse terms to reduce dimensionality
    # Terms that appear in less than 1% of documents are removed
    dtm <- removeSparseTerms(dtm, sparse_threshold)
    
    cat("DTM created with", nrow(dtm), "documents and", ncol(dtm), "terms\n")
    
    return(dtm)
}

#' Convert DTM to a data frame for model training
#' 
#' @param dtm A DocumentTermMatrix object
#' @return A data frame with documents as rows and terms as columns

dtm_to_dataframe <- function(dtm) {
    df <- as.data.frame(as.matrix(dtm))
    return(df)
}

#' Get vocabulary (term list) from a DTM
#' 
#' @param dtm A DocumentTermMatrix object
#' @return Character vector of terms

get_vocabulary <- function(dtm) {
    return(colnames(as.matrix(dtm)))
}

cat("Text preprocessing module loaded successfully\n")
