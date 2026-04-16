# RUN-4.md - Phase 4 Setup and Execution Guide

## 📋 Overview

This guide explains how to set up and run the **Phase 4 Frontend** for the Tube-Senti project. By following these steps, you'll have a fully functional Next.js dashboard with Clerk authentication that connects to your backend API for real-time YouTube sentiment analysis.

---

## ✅ Prerequisites Verification

Before starting, ensure these phases are complete:

### Phase 1-3 Status
- ✅ Backend API running on `http://localhost:3001`
- ✅ R models (`nb_model.rds`, `vocabulary.rds`) exist in `models/` directory
- ✅ YouTube API key configured in `backend/.env`

### Software Requirements
- **Node.js**: ≥ 20.x LTS ([download](https://nodejs.org/))
- **npm**: ≥ 10.x (comes with Node.js)
- **R**: ≥ 4.3.x (for backend)
- **Git**: For version control

Verify your versions:
```bash
node --version   # Should be v20.x or higher
npm --version    # Should be 10.x or higher
```

---

## 🔧 Step 1: Clerk Authentication Setup

Clerk provides the authentication layer for the frontend. You need to create a free account and get API keys.

### 1.1 Create Clerk Account

1. Go to [https://clerk.com](https://clerk.com)
2. Click **"Sign Up"** in the top right
3. Create an account using your email or GitHub

### 1.2 Create a New Application

1. Once logged in, click **"+ Create application"**
2. Fill in the details:
   - **Application name**: `Tube-Senti` (or your preferred name)
   - **Sign-in options**: Select **Email** and optionally **Google OAuth**
3. Click **"Create application"**

### 1.3 Get Your API Keys

1. After creating the app, you'll be on the **API Keys** page
2. Copy the following values:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (starts with `pk_test_...`)
   - `CLERK_SECRET_KEY` (starts with `sk_test_...`)
3. Keep these safe - you'll need them in the next step

### 1.4 Configure Clerk Settings (Optional but Recommended)

1. Go to **User & Authentication** → **Email, Phone, Username**
2. Ensure **Email address** is enabled
3. Go to **User & Authentication** → **Social Connections**
4. Enable **Google** if you want OAuth login
5. Go to **Paths** and verify:
   - Sign-in path: `/sign-in`
   - Sign-up path: `/sign-up`
   - After sign-in: `/dashboard`
   - After sign-up: `/dashboard`

---

## 🔑 Step 2: Environment Configuration

### 2.1 Configure Frontend Environment

Navigate to the frontend directory and update the `.env.local` file:

```bash
cd /path/to/project/frontend
```

Edit `frontend/.env.local` (it already exists with template values):

```bash
# Replace YOUR_KEY_HERE with actual keys from Clerk dashboard
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
CLERK_SECRET_KEY=sk_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# These should already be correct
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Backend API URL (should be correct already)
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**⚠️ Important**: 
- Never commit `.env.local` to version control
- The `.env.local` file is already gitignored

### 2.2 Verify Backend Environment

Ensure `backend/.env` has these variables:

```bash
YOUTUBE_API_KEY=YOUR_YOUTUBE_API_KEY
NODE_ENV=development
PORT=3001
R_EXECUTABLE=Rscript
R_SCRIPTS_PATH=r
MODELS_PATH=models
TMP_DIR=tmp
```

---

## 📦 Step 3: Install Dependencies

Dependencies are already installed during setup, but if you need to reinstall:

```bash
cd frontend
npm install --legacy-peer-deps
```

**Note**: The `--legacy-peer-deps` flag resolves a peer dependency conflict between Next.js 14 and Clerk.

---

## 🚀 Step 4: Start the Application

### 4.1 Start Backend Server

Open a terminal and start the backend:

```bash
cd backend
npm start
```

You should see:
```
╔════════════════════════════════════════════════════════════════════╗
║                   TUBE-SENTI BACKEND SERVER                       ║
╠════════════════════════════════════════════════════════════════════╣
║  Status:      Running                                              ║
║  Port:        3001                                                 ║
║  Environment: development                                          ║
╚════════════════════════════════════════════════════════════════════╝
```

**Verify backend health:**
```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-03-30T...",
  "checks": {
    "server": true,
    "rscript": true,
    "model": true,
    "youtubeApi": true
  }
}
```

### 4.2 Start Frontend Development Server

Open a **new terminal** (keep backend running) and start the frontend:

```bash
cd frontend
npm run dev
```

You should see:
```
▲ Next.js 14.2.35
- Local:        http://localhost:3000
- Ready in 2.3s
```

---

## 🎯 Step 5: Test the Application

### 5.1 Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

### 5.2 Test Authentication Flow

1. **Landing Page**: You should see the Tube-Senti homepage with:
   - Hero section with "Understand Your Audience In Seconds"
   - Feature cards (Real-Time Analysis, Visual Insights, Secure & Private)
   - "Get Started" and "Sign In" buttons

2. **Sign Up**:
   - Click **"Get Started"** or **"Sign Up"**
   - Fill in your email and password
   - Complete the Clerk sign-up flow
   - You should be redirected to `/dashboard`

3. **Sign In** (for existing users):
   - Click **"Sign In"**
   - Enter your credentials
   - You should be redirected to `/dashboard`

### 5.3 Test Sentiment Analysis

1. **Navigate to Dashboard**: 
   - After signing in, you should see the dashboard with a video input form

2. **Analyze a Video**:
   - Paste a YouTube URL (example: `https://www.youtube.com/watch?v=jNQXAC9IVRw`)
   - Click **"Analyze Sentiment"**
   - A loading overlay should appear with "Analyzing video comments..."

3. **View Results**:
   - After 4-10 seconds, results should display:
     - **Sentiment Score Card** (0-100 score with color coding)
     - **Sentiment Distribution Chart** (pie chart with positive/negative/neutral percentages)
     - **Top Positive Comments** (sample comments with confidence scores)
     - **Top Negative Comments** (sample comments with confidence scores)

4. **Verify Data is Real**:
   - All displayed data should come from the actual video
   - No fake/mock data should appear
   - Comments should be real comments from the YouTube video

### 5.4 Test Error Handling

1. **Invalid URL**:
   - Enter an invalid URL like `not-a-url`
   - Click "Analyze Sentiment"
   - You should see: "Invalid YouTube URL format"

2. **Backend Offline**:
   - Stop the backend server
   - Try to analyze a video
   - You should see an error message: "Backend service is unavailable"
   - Restart the backend to continue testing

---

## 📱 Step 6: Test Responsive Design

Test the application on different screen sizes:

### Desktop (1280px+)
- All components should be side-by-side
- Score card and chart in a 2-column grid
- Comment samples in a 2-column grid

### Tablet (768px - 1279px)
- Components should stack in a readable layout
- Charts remain visible and functional

### Mobile (375px - 767px)
- All components stack vertically
- Touch-friendly buttons and inputs
- Text remains readable

**Quick test in browser:**
1. Open Developer Tools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test various screen sizes

---

## 🐛 Troubleshooting

### Issue: "Cannot find module '@clerk/nextjs'"

**Solution:**
```bash
cd frontend
npm install @clerk/nextjs --legacy-peer-deps
```

### Issue: Backend returns "Backend service is unavailable"

**Causes:**
1. Backend not running
2. Wrong port (should be 3001)
3. CORS issues

**Solution:**
```bash
# Check if backend is running
curl http://localhost:3001/api/health

# If not running, start it
cd backend
npm start
```

### Issue: "Invalid Clerk API keys"

**Solution:**
1. Verify keys in `frontend/.env.local`
2. Ensure no extra spaces or quotes
3. Keys should start with:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...`
   - `CLERK_SECRET_KEY=sk_test_...`
4. Restart the frontend dev server after changing env vars

### Issue: YouTube API quota exceeded

**Symptoms:**
- Backend returns error about quota
- Analysis fails after several requests

**Solution:**
1. YouTube API has daily quota limits (free tier)
2. Wait 24 hours for quota reset
3. Or create a new Google Cloud project with new API key

### Issue: Charts not displaying

**Solution:**
```bash
cd frontend
npm install recharts --legacy-peer-deps
npm run dev
```

### Issue: Clerk redirect loop

**Solution:**
1. Go to Clerk Dashboard → Paths
2. Verify paths match:
   - Sign-in: `/sign-in`
   - Sign-up: `/sign-up`
   - After sign-in: `/dashboard`
3. Clear browser cookies for `localhost:3000`
4. Try again

---

## 📂 Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── (auth)/                 # Auth pages (public)
│   │   │   ├── sign-in/
│   │   │   └── sign-up/
│   │   ├── (protected)/            # Protected routes
│   │   │   └── dashboard/page.tsx  # Main dashboard
│   │   ├── layout.tsx              # Root layout with Clerk
│   │   ├── page.tsx                # Landing page
│   │   └── globals.css             # Global styles
│   ├── components/
│   │   ├── ui/                     # Base UI components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   └── loading.tsx
│   │   ├── layout/                 # Layout components
│   │   │   └── header.tsx
│   │   └── dashboard/              # Dashboard components
│   │       ├── video-form.tsx
│   │       ├── results-panel.tsx
│   │       ├── score-card.tsx
│   │       ├── sentiment-chart.tsx
│   │       └── sample-comments.tsx
│   ├── lib/
│   │   ├── api.ts                  # API client
│   │   ├── types.ts                # TypeScript types
│   │   └── utils.ts                # Utility functions
│   └── middleware.ts               # Clerk auth middleware
├── .env.local                       # Environment variables (DO NOT COMMIT)
├── next.config.js
├── package.json
└── tailwind.config.ts
```

---

## 🔒 Security Notes

1. **Never commit `.env.local`** - It contains secret keys
2. **Clerk keys are sensitive** - Don't share them publicly
3. **YouTube API key** - Already secured in backend `.env`
4. **CORS is configured** - Backend only accepts requests from `localhost:3000`

---

## 🎨 Features Implemented

### ✅ Authentication
- [x] Clerk sign-up and sign-in pages
- [x] Protected dashboard route
- [x] User profile button in header
- [x] Automatic redirect after authentication

### ✅ Dashboard
- [x] YouTube URL input form with validation
- [x] Real-time sentiment analysis
- [x] Loading states with overlay
- [x] Error handling and display

### ✅ Visualizations
- [x] Sentiment score card (0-100 with color coding)
- [x] Pie chart showing sentiment distribution
- [x] Top positive comments with confidence scores
- [x] Top negative comments with confidence scores

### ✅ Responsive Design
- [x] Mobile-friendly (375px+)
- [x] Tablet optimized (768px+)
- [x] Desktop layout (1280px+)

### ✅ No Fake Data
- [x] All data comes from real API responses
- [x] No mock/placeholder content
- [x] Real YouTube comments displayed

---

## 🚦 Running in Production

For production deployment:

1. **Build the frontend:**
```bash
cd frontend
npm run build
npm run start
```

2. **Update environment variables:**
   - Replace test Clerk keys with production keys
   - Update `NEXT_PUBLIC_API_URL` to production backend URL
   - Ensure backend is deployed and accessible

3. **Deploy to hosting:**
   - Vercel (recommended for Next.js)
   - Netlify
   - AWS Amplify
   - Your own server

---

## 📞 Support

If you encounter issues:

1. Check this troubleshooting section
2. Verify all prerequisites are met
3. Ensure backend is running and healthy
4. Check browser console for error messages
5. Verify Clerk keys are correct

---

## 🎉 Success Checklist

- [ ] Backend running on port 3001
- [ ] Frontend running on port 3000
- [ ] Clerk account created with API keys
- [ ] `.env.local` configured with correct keys
- [ ] Can access landing page at `http://localhost:3000`
- [ ] Can sign up and create an account
- [ ] Can sign in with existing account
- [ ] Dashboard loads after authentication
- [ ] Can paste YouTube URL and analyze
- [ ] Results display with score, chart, and comments
- [ ] All data is real (no fake data)
- [ ] Responsive design works on mobile

**If all boxes are checked, Phase 4 is complete! 🎊**

---

*Phase 4 Implementation Guide for Tube-Senti*  
*Version 1.0 - 2026-03-30*
