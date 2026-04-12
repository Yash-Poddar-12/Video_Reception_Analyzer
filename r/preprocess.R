#!/usr/bin/env Rscript
# ==============================================================================
# preprocess.R - R Data Engineering Layer (MSSF Pipeline)
# ==============================================================================
# Purpose: Clean and normalize raw YouTube comments CSV produced by api_fetch.R
#          so it is ready for the Python MSSF inference service.
#
# Role in Pipeline:
#   api_fetch.R  →  preprocess.R  →  Python MSSF service
#
# Usage: Rscript r/preprocess.R [COMMENTS_CSV_PATH]
#
# Arguments:
#   COMMENTS_CSV_PATH - Path to raw comments CSV (default: tmp/comments.csv)
#
# Output:
#   tmp/preprocessed_comments.csv  (cleaned, ready for Python)
#   JSON to stdout: { success, comments_count, output_file }
# ==============================================================================

library(jsonlite)
library(dplyr)

# ==============================================================================
# Parse Command Line Arguments
# ==============================================================================
args <- commandArgs(trailingOnly = TRUE)
input_path <- ifelse(length(args) >= 1, gsub("\\\\", "/", args[1]), "tmp/comments.csv")

cat("Preprocessing comments from:", input_path, "\n", file = stderr())

# ==============================================================================
# Preprocessing Functions
# ==============================================================================

#' Clean raw comment text
#'  - Collapse newlines to space
#'  - Remove excessive whitespace
#'  - Remove NULL / NA
clean_text <- function(text) {
    text <- gsub("[\r\n\t]+", " ", text)    # Newlines → space
    text <- gsub("\\s{2,}", " ", text)       # Collapse multi-spaces
    text <- trimws(text)                      # Strip leading/trailing whitespace
    return(text)
}

#' Extract and log emoji counts per comment (for EDA logging only —
#' actual emoji sentiment is computed by the Python branch)
count_emojis <- function(text) {
    # Simple heuristic: characters with code points > 0x1F000 are likely emoji
    chars <- strsplit(text, "")[[1]]
    codepoints <- utf8ToInt(paste(chars[nchar(chars) == 1], collapse = ""))
    sum(codepoints > 0x1F000, na.rm = TRUE)
}

# ==============================================================================
# Main Execution
# ==============================================================================
tryCatch({
    # ── 1. Load raw comments ──────────────────────────────────────────────────
    if (!file.exists(input_path)) {
        cat(toJSON(list(
            success = FALSE,
            error = paste("Comments file not found:", input_path)
        ), auto_unbox = TRUE))
        quit(status = 1)
    }

    df <- read.csv(input_path, stringsAsFactors = FALSE, encoding = "UTF-8")

    if (nrow(df) == 0) {
        cat(toJSON(list(success = FALSE, error = "No comments in file"), auto_unbox = TRUE))
        quit(status = 1)
    }

    cat("Loaded", nrow(df), "raw comments\n", file = stderr())

    # ── 2. Clean text ─────────────────────────────────────────────────────────
    df$text <- sapply(df$text, clean_text)

    # ── 3. Ensure required columns exist (add defaults if missing) ────────────
    if (!"like_count" %in% names(df)) {
        df$like_count <- 0L
        cat("  like_count column missing — defaulted to 0\n", file = stderr())
    }
    if (!"reply_count" %in% names(df)) {
        df$reply_count <- 0L
        cat("  reply_count column missing — defaulted to 0\n", file = stderr())
    }
    if (!"comment_id" %in% names(df)) {
        df$comment_id <- paste0("c", seq_len(nrow(df)))
    }
    if (!"author" %in% names(df)) {
        df$author <- "unknown"
    }

    # ── 4. Coerce numeric columns ─────────────────────────────────────────────
    df$like_count  <- suppressWarnings(as.integer(df$like_count))
    df$reply_count <- suppressWarnings(as.integer(df$reply_count))
    df$like_count[is.na(df$like_count)]   <- 0L
    df$reply_count[is.na(df$reply_count)] <- 0L

    # ── 5. Remove empty / very short comments (< 3 chars after cleaning) ──────
    original_count <- nrow(df)
    df <- df[nchar(df$text, type = "chars") >= 3, ]
    removed <- original_count - nrow(df)
    if (removed > 0) {
        cat("  Removed", removed, "empty/short comments\n", file = stderr())
    }

    # ── 6. Deduplicate exact duplicates ───────────────────────────────────────
    before_dedup <- nrow(df)
    df <- df[!duplicated(df$text), ]
    deduped <- before_dedup - nrow(df)
    if (deduped > 0) {
        cat("  Removed", deduped, "duplicate comments\n", file = stderr())
    }

    # ── 7. Select and order output columns ────────────────────────────────────
    output_cols <- c("comment_id", "text", "author", "like_count", "reply_count")
    if ("published_at" %in% names(df)) output_cols <- c(output_cols, "published_at")
    df <- df[, output_cols, drop = FALSE]

    # ── 8. Save preprocessed CSV ──────────────────────────────────────────────
    dir.create("tmp", showWarnings = FALSE, recursive = TRUE)
    output_path <- "tmp/preprocessed_comments.csv"
    write.csv(df, output_path, row.names = FALSE, fileEncoding = "UTF-8")

    cat("Preprocessed", nrow(df), "comments saved to:", output_path, "\n", file = stderr())

    # ── 9. Output result JSON ─────────────────────────────────────────────────
    result <- list(
        success         = TRUE,
        comments_count  = nrow(df),
        output_file     = output_path,
        total_comments  = nrow(df),
        removed_empty   = removed,
        removed_dupes   = deduped
    )

    cat(toJSON(result, auto_unbox = TRUE, pretty = TRUE))

}, error = function(e) {
    cat(toJSON(list(
        success = FALSE,
        error   = as.character(e$message)
    ), auto_unbox = TRUE))
    quit(status = 1)
})
