#!/bin/bash
# ==============================================================================
# setup_phase5.sh - Phase 5 Setup Script
# ==============================================================================
# Purpose: Generate visualizations and prepare for Power BI integration
# Usage: bash setup_phase5.sh
# ==============================================================================

set -e

echo "=============================================="
echo "  Tube-Senti Phase 5 Setup"
echo "  Power BI Dashboard Integration"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if running from project root
if [ ! -f "run.md" ]; then
    echo -e "${RED}Error: Please run from project root${NC}"
    exit 1
fi

echo "Step 1: Checking prerequisites..."
echo "----------------------------------------"

# Check R packages
echo "Checking R visualization packages..."
Rscript -e "
packages <- c('ggplot2', 'wordcloud', 'dplyr', 'tidytext', 'reshape2', 'RColorBrewer', 'scales', 'viridis', 'gridExtra', 'tm')
missing <- packages[!(packages %in% installed.packages()[,'Package'])]
if(length(missing) > 0) {
    cat('Missing packages:', paste(missing, collapse=', '), '\n')
    cat('Installing...\n')
    install.packages(missing, repos='https://cloud.r-project.org', quiet=TRUE)
    cat('✓ Packages installed\n')
} else {
    cat('✓ All visualization packages installed\n')
}
"

# Check if data exists
if [ ! -f "data/processed/reviews_clean.csv" ]; then
    echo -e "${YELLOW}⚠ Training data not found${NC}"
    echo "Run Phase 1 data acquisition first:"
    echo "  cd r && Rscript 02_download_and_structure_data.R && Rscript 04_apply_preprocessing.R"
    exit 1
else
    echo -e "${GREEN}✓ Training data found${NC}"
fi

# Check if model exists
if [ ! -f "models/nb_model.rds" ]; then
    echo -e "${YELLOW}⚠ Model not found${NC}"
    echo "Run Phase 2 model training first:"
    echo "  cd r && Rscript train_model.R"
    exit 1
else
    echo -e "${GREEN}✓ Model found${NC}"
fi

echo ""
echo "Step 2: Generating visualizations..."
echo "----------------------------------------"
cd r
Rscript eda.R
cd ..

echo ""
echo "Step 3: Setting up frontend integration..."
echo "----------------------------------------"

# Create symlink from frontend/public to visuals
if [ ! -L "frontend/public/visuals" ]; then
    cd frontend/public
    ln -s ../../visuals visuals
    cd ../..
    echo -e "${GREEN}✓ Created visuals symlink${NC}"
else
    echo -e "${GREEN}✓ Visuals symlink already exists${NC}"
fi

# Check environment variables
if ! grep -q "NEXT_PUBLIC_POWERBI_EMBED_URL" frontend/.env 2>/dev/null; then
    echo -e "${YELLOW}⚠ Adding Power BI configuration to frontend/.env${NC}"
    echo "" >> frontend/.env
    echo "# Power BI Dashboard (Phase 5)" >> frontend/.env
    echo "NEXT_PUBLIC_POWERBI_EMBED_URL=" >> frontend/.env
fi

echo ""
echo "=============================================="
echo -e "${GREEN}✓ Phase 5 Setup Complete!${NC}"
echo "=============================================="
echo ""
echo "Generated visualizations:"
ls -1 visuals/*.png 2>/dev/null | while read file; do
    echo "  ✓ $(basename $file)"
done

echo ""
echo "Next steps:"
echo ""
echo "1. View visualizations locally:"
echo "   Open visuals/ directory"
echo ""
echo "2. Set up Power BI (Windows required):"
echo "   - Download Power BI Desktop"
echo "   - Import data/processed/reviews_clean.csv"
echo "   - Add R visuals (see PHASE_5 documentation)"
echo "   - Publish to Power BI Service"
echo ""
echo "3. Get embed URL:"
echo "   - In Power BI Service, click 'Publish to web'"
echo "   - Copy embed URL"
echo "   - Add to frontend/.env:"
echo "     NEXT_PUBLIC_POWERBI_EMBED_URL=your_url_here"
echo ""
echo "4. View analytics page:"
echo "   - Start frontend: cd frontend && npm run dev"
echo "   - Visit: http://localhost:3000/analytics"
echo ""
echo "For detailed instructions, see RUN-5.md"
echo "=============================================="
