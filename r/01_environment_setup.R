options(repos = c(CRAN = "https://cloud.r-project.org"))

# Core packages for text mining and ML
install.packages(c(
    "httr",       # HTTP requests to YouTube Data API v3
    "jsonlite",   # Parsing JSON API responses into R data frames
    "tm",         # Text mining corpus, stopword removal, tokenization
    "e1071",      # Naive Bayes classifier implementation
    "ggplot2",    # All EDA visualizations and custom Power BI visuals
    "wordcloud",  # Word frequency visualizations
    "dplyr",      # Data manipulation and transformation
    "tidytext",   # Tidy text mining utilities
    "caret",      # Model evaluation, confusion matrix, F1-score
    "rvest",      # Web scraping (supplementary data acquisition)
    "reshape2"    # Data reshaping for visualization inputs
))

# Verify installation
required_packages <- c("httr", "jsonlite", "tm", "e1071", "ggplot2", 
                       "wordcloud", "dplyr", "tidytext", "caret", 
                       "rvest", "reshape2")

for (pkg in required_packages) {
    if (!require(pkg, character.only = TRUE)) {
        stop(paste("Package", pkg, "failed to install"))
    } else {
        cat(paste("✓", pkg, "loaded successfully\n"))
    }
}
