# 🚀 Phase 5 Quick Start

## Immediate Setup (5 minutes)

```bash
# 1. Start backend (if not running)
cd backend
node server.js &

# 2. Start frontend (if not running)  
cd ../frontend
npm run dev &

# 3. Access analytics page
# Open: http://localhost:3000
# Sign in → Click "Analytics" in header
```

## What You'll See

✅ **5 Static Visualizations:**
1. Sentiment Distribution - Bar chart
2. Review Length Analysis - Density plot
3. Feature Correlation - Heatmap
4. Word Count Distribution - Box plot
5. Model Performance - Confusion matrix

✅ **Power BI Section:**
- Shows placeholder with setup instructions
- Works immediately without Power BI configured

## Optional: Power BI Setup

**⚠️ Requires Windows (Power BI Desktop is Windows-only)**

1. Install Power BI Desktop (Windows)
2. Import `data/processed/reviews_clean.csv`
3. Create R visuals using snippets in RUN-5.md
4. Publish to Power BI Service
5. Copy embed URL
6. Add to `frontend/.env.local`:
   ```
   NEXT_PUBLIC_POWERBI_EMBED_URL=https://app.powerbi.com/view?r=XXXXX
   ```
7. Restart frontend

## Full Documentation

📖 **See RUN-5.md for:**
- Complete setup instructions
- 8 Power BI R code snippets
- Troubleshooting guide
- FAQ
- Manual setup if automation fails

## Verification

```bash
# Check visualizations exist
ls -la visuals/*.png

# Check symlink
ls -la frontend/public/visuals

# Rebuild frontend (optional)
cd frontend
npm run build
```

## Need Help?

- **Visualizations missing?** Run: `bash setup_phase5.sh`
- **Analytics page 404?** Restart frontend: `npm run dev`
- **Power BI issues?** See RUN-5.md Troubleshooting section
- **Build errors?** Check Phase 4 setup: `RUN-4.md`

---

**Everything working?** ✅ Phase 5 is complete!
