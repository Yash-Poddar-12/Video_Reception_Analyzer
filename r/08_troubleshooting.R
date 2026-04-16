# If tm package fails to install on Linux
# Install system dependencies first:
# sudo apt-get install libxml2-dev libcurl4-openssl-dev

# Then retry:
install.packages("tm", dependencies = TRUE)

# For large corpora, increase R memory limit (Windows only)
memory.limit(size = 16000)  # 16GB

# Or process in batches
batch_size <- 10000
n_batches <- ceiling(nrow(reviews) / batch_size)

# Force UTF-8 encoding
reviews$text <- iconv(reviews$text, to = "UTF-8", sub = "")

# Remove non-printable characters
reviews$text <- gsub("[^[:print:]]", "", reviews$text)

# If download.file fails, try with different method
download.file(download_url, dest_file, mode = "wb", method = "curl")

# Or download manually from browser and place in data/raw/
