#!/usr/bin/env Rscript
# ==============================================================================
# api_fetch.R - YouTube Comment Fetcher
# ==============================================================================
# Purpose: Fetch comments from a YouTube video using the YouTube Data API v3
#
# Usage: Rscript r/api_fetch.R <VIDEO_ID> <API_KEY> [MAX_COMMENTS]
#
# Arguments:
#   VIDEO_ID     - YouTube video ID (e.g., "dQw4w9WgXcQ")
#   API_KEY      - YouTube Data API v3 key
#   MAX_COMMENTS - Maximum comments to fetch (default: 100)
#
# Output: tmp/comments.csv
# ==============================================================================

library(httr)
library(jsonlite)
library(dplyr)

# ==============================================================================
# Parse Command Line Arguments
# ==============================================================================
args <- commandArgs(trailingOnly = TRUE)

if (length(args) < 2) {
    cat(toJSON(list(
        success = FALSE,
        error = "Usage: Rscript api_fetch.R <VIDEO_ID> <API_KEY> [MAX_COMMENTS]"
    ), auto_unbox = TRUE))
    quit(status = 1)
}

VIDEO_ID <- args[1]
API_KEY <- args[2]
MAX_COMMENTS <- ifelse(length(args) >= 3, as.integer(args[3]), 100)

cat("Fetching comments for video:", VIDEO_ID, "\n", file = stderr())
cat("Max comments:", MAX_COMMENTS, "\n", file = stderr())

# ==============================================================================
# YouTube API Configuration
# ==============================================================================
BASE_URL <- "https://www.googleapis.com/youtube/v3/commentThreads"

# ==============================================================================
# Fetch Comments Function
# ==============================================================================
fetch_comments <- function(video_id, api_key, max_comments = 100) {
    all_comments <- list()
    next_page_token <- NULL
    comments_fetched <- 0
    
    while (comments_fetched < max_comments) {
        # Calculate how many to fetch this iteration (max 100 per request)
        remaining <- max_comments - comments_fetched
        results_per_page <- min(100, remaining)
        
        # Build query parameters
        params <- list(
            part = "snippet",
            videoId = video_id,
            key = api_key,
            maxResults = results_per_page,
            order = "relevance",
            textFormat = "plainText"
        )
        
        # Add page token if continuing pagination
        if (!is.null(next_page_token)) {
            params$pageToken <- next_page_token
        }
        
        # Make API request
        response <- tryCatch({
            GET(BASE_URL, query = params)
        }, error = function(e) {
            return(NULL)
        })
        
        # Check for request errors
        if (is.null(response)) {
            cat("Error: Network request failed\n", file = stderr())
            break
        }
        
        if (status_code(response) != 200) {
            error_content <- content(response, "text", encoding = "UTF-8")
            cat("API Error:", status_code(response), "\n", file = stderr())
            cat("Response:", error_content, "\n", file = stderr())
            break
        }
        
        # Parse response
        data <- content(response, "text", encoding = "UTF-8")
        parsed <- fromJSON(data, flatten = TRUE)
        
        # Check if items exist
        if (is.null(parsed$items) || length(parsed$items) == 0) {
            cat("No more comments found\n", file = stderr())
            break
        }
        
        # Extract comment data
        items <- parsed$items
        
        comments_batch <- data.frame(
            comment_id = items$id,
            text = items$snippet.topLevelComment.snippet.textDisplay,
            author = items$snippet.topLevelComment.snippet.authorDisplayName,
            published_at = items$snippet.topLevelComment.snippet.publishedAt,
            like_count = items$snippet.topLevelComment.snippet.likeCount,
            stringsAsFactors = FALSE
        )
        
        all_comments[[length(all_comments) + 1]] <- comments_batch
        comments_fetched <- comments_fetched + nrow(comments_batch)
        
        cat("Fetched", comments_fetched, "comments so far\n", file = stderr())
        
        # Check for next page
        next_page_token <- parsed$nextPageToken
        if (is.null(next_page_token)) {
            cat("No more pages available\n", file = stderr())
            break
        }
    }
    
    # Combine all batches
    if (length(all_comments) == 0) {
        return(NULL)
    }
    
    result <- bind_rows(all_comments)
    return(result)
}

# ==============================================================================
# Extract Video ID from URL (if full URL provided)
# ==============================================================================
extract_video_id <- function(input) {
    # If already a video ID (11 characters), return as-is
    if (nchar(input) == 11 && !grepl("http|www|youtube", input)) {
        return(input)
    }
    
    # Try to extract from various URL formats
    patterns <- c(
        "v=([a-zA-Z0-9_-]{11})",           # Standard URL
        "youtu\\.be/([a-zA-Z0-9_-]{11})",  # Short URL
        "embed/([a-zA-Z0-9_-]{11})",       # Embed URL
        "/v/([a-zA-Z0-9_-]{11})"           # Old format
    )
    
    for (pattern in patterns) {
        match <- regmatches(input, regexpr(pattern, input, perl = TRUE))
        if (length(match) > 0 && nchar(match) > 0) {
            # Extract the capture group (video ID)
            id <- gsub(".*=|.*/", "", match)
            if (nchar(id) == 11) {
                return(id)
            }
        }
    }
    
    # If no match found, return input as-is (might be a video ID)
    return(input)
}

# ==============================================================================
# Main Execution
# ==============================================================================
tryCatch({
    # Extract video ID if URL was provided
    video_id <- extract_video_id(VIDEO_ID)
    cat("Extracted video ID:", video_id, "\n", file = stderr())
    
    # Fetch comments
    comments <- fetch_comments(video_id, API_KEY, MAX_COMMENTS)
    
    if (is.null(comments) || nrow(comments) == 0) {
        cat(toJSON(list(
            success = FALSE,
            error = "No comments found for this video",
            video_id = video_id
        ), auto_unbox = TRUE))
        quit(status = 1)
    }
    
    # Clean comment text (remove newlines, excessive whitespace)
    comments$text <- gsub("[\r\n]+", " ", comments$text)
    comments$text <- gsub("\\s+", " ", comments$text)
    comments$text <- trimws(comments$text)
    
    # Save to CSV
    output_path <- file.path("tmp", "comments.csv")
    dir.create("tmp", showWarnings = FALSE, recursive = TRUE)
    write.csv(comments, output_path, row.names = FALSE)
    
    cat("Comments saved to:", output_path, "\n", file = stderr())
    
    # Output success JSON to stdout
    result <- list(
        success = TRUE,
        video_id = video_id,
        comments_fetched = nrow(comments),
        output_file = output_path,
        sample_comments = head(comments$text, 3)
    )
    
    cat(toJSON(result, auto_unbox = TRUE, pretty = TRUE))
    
}, error = function(e) {
    cat(toJSON(list(
        success = FALSE,
        error = as.character(e$message)
    ), auto_unbox = TRUE))
    quit(status = 1)
})
