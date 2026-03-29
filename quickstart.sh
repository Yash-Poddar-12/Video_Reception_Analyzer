#!/bin/bash
# =============================================================================
# Tube-Senti Quick Start Script
# =============================================================================
# Purpose: Install dependencies and start the application
# Usage: bash quickstart.sh
# =============================================================================

set -e  # Exit on error

echo "=============================================="
echo "  Tube-Senti Quick Start Installer"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running from project root
if [ ! -f "run.md" ]; then
    echo -e "${RED}Error: Please run this script from the project root directory${NC}"
    exit 1
fi

echo "Step 1/6: Checking system requirements..."
echo "----------------------------------------"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not found${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org"
    exit 1
else
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓ Node.js${NC} $NODE_VERSION"
fi

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm not found${NC}"
    exit 1
else
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✓ npm${NC} $NPM_VERSION"
fi

# Check R
if ! command -v Rscript &> /dev/null; then
    echo -e "${RED}✗ R/Rscript not found${NC}"
    echo "Please install R 4.0+ from https://www.r-project.org"
    exit 1
else
    R_VERSION=$(Rscript --version 2>&1 | head -1)
    echo -e "${GREEN}✓ R${NC} $R_VERSION"
fi

echo ""
echo "Step 2/6: Installing R packages..."
echo "----------------------------------------"
echo "This may take 5-10 minutes on first run..."

Rscript -e "
packages <- c('tm', 'e1071', 'caret', 'dplyr', 'jsonlite', 'httr', 'ggplot2', 'glmnet')
new_packages <- packages[!(packages %in% installed.packages()[,'Package'])]
if(length(new_packages) > 0) {
    cat('Installing:', paste(new_packages, collapse=', '), '\n')
    install.packages(new_packages, repos='https://cloud.r-project.org', quiet=TRUE)
} else {
    cat('All R packages already installed\n')
}
cat('✓ R packages ready\n')
"

echo ""
echo "Step 3/6: Installing backend dependencies..."
echo "----------------------------------------"
cd backend
npm install --silent
echo -e "${GREEN}✓ Backend dependencies installed${NC}"
cd ..

echo ""
echo "Step 4/6: Installing frontend dependencies..."
echo "----------------------------------------"
cd frontend
npm install --silent
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
cd ..

echo ""
echo "Step 5/6: Creating required directories..."
echo "----------------------------------------"
mkdir -p data/raw data/processed models tmp logs visuals
echo -e "${GREEN}✓ Directories created${NC}"

echo ""
echo "Step 6/6: Checking configuration..."
echo "----------------------------------------"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠ .env file not found${NC}"
    echo "Creating template .env file..."
    cat > .env << 'EOF'
# Backend Server
NODE_ENV=development
PORT=3001

# R Configuration
R_EXECUTABLE=Rscript
R_SCRIPTS_PATH=r
MODELS_PATH=models
TMP_DIR=tmp

# YouTube API (Required for comment fetching)
YOUTUBE_API_KEY=your_youtube_api_key_here

# API Settings
API_TIMEOUT=30000
R_SCRIPT_TIMEOUT=60000
MAX_COMMENTS=100

# CORS
CORS_ORIGINS=http://localhost:3000
EOF
    echo -e "${YELLOW}⚠ Please edit .env and add your YouTube API key${NC}"
else
    echo -e "${GREEN}✓ .env file exists${NC}"
fi

# Check if frontend/.env exists
if [ ! -f "frontend/.env" ]; then
    echo -e "${YELLOW}⚠ frontend/.env file not found${NC}"
    echo "Creating template frontend/.env file..."
    cat > frontend/.env << 'EOF'
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:3001
EOF
    echo -e "${YELLOW}⚠ Please edit frontend/.env and add your Clerk keys${NC}"
else
    echo -e "${GREEN}✓ frontend/.env file exists${NC}"
fi

# Check if model exists
if [ -f "models/nb_model.rds" ]; then
    echo -e "${GREEN}✓ Trained model found${NC}"
else
    echo -e "${YELLOW}⚠ Model not found - you'll need to run Phase 2 training${NC}"
    echo "  Run: cd r && Rscript train_model.R"
fi

echo ""
echo "=============================================="
echo -e "${GREEN}✓ Installation Complete!${NC}"
echo "=============================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Configure API keys (if not done):"
echo "   - Edit .env for YouTube API key"
echo "   - Edit frontend/.env for Clerk keys"
echo ""
echo "2. Train the model (if needed):"
echo "   cd r && Rscript train_model.R && cd .."
echo ""
echo "3. Start the backend (in one terminal):"
echo "   cd backend && npm start"
echo ""
echo "4. Start the frontend (in another terminal):"
echo "   cd frontend && npm run dev"
echo ""
echo "5. Open your browser:"
echo "   http://localhost:3000"
echo ""
echo "For detailed instructions, see run.md"
echo "=============================================="
