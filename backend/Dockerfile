# ==============================================================================
# Backend Node.js/Express server + R runtime
# ==============================================================================
FROM node:20-slim

WORKDIR /app

# ── Install R and required system libraries ───────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
    r-base \
    r-base-dev \
    libcurl4-openssl-dev \
    libssl-dev \
    libxml2-dev \
    libfontconfig1-dev \
    libharfbuzz-dev \
    libfribidi-dev \
    libfreetype6-dev \
    libpng-dev \
    libtiff5-dev \
    libjpeg-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# ── Install required R packages ───────────────────────────────────────────────
# Install in one R session so library paths are consistent
RUN Rscript -e "\
    options(repos = c(CRAN = 'https://cloud.r-project.org')); \
    install.packages(c( \
        'httr', 'jsonlite', 'dplyr', 'stringr', 'readr', \
        'lubridate', 'tidyr', 'purrr', 'ggplot2', 'scales' \
    ), dependencies = TRUE) \
"

# ── Install Node dependencies ─────────────────────────────────────────────────
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production

# ── Copy application files ────────────────────────────────────────────────────
COPY backend/ ./backend/
COPY r/ ./r/

# Create shared runtime directories
RUN mkdir -p tmp logs exports data/raw data/processed

# ── Environment ───────────────────────────────────────────────────────────────
ENV NODE_ENV=production
ENV R_EXECUTABLE=Rscript
ENV R_SCRIPTS_PATH=/app/r
ENV MODELS_PATH=/app/models
ENV TMP_DIR=/app/tmp

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:3001/api/health || exit 1

WORKDIR /app/backend
CMD ["node", "server.js"]
