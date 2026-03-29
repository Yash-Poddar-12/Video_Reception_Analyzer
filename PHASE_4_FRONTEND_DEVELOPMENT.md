## Agent Instructions

You are an AI coding agent implementing Phase 4 of the Tube-Senti project.

### Current project state
- Phase 1 is complete.
- Phase 2 is complete.
- Phase 3 is complete and the backend is healthy at `http://localhost:3001`.

### Important constraints
- This project is running on Windows.
- Use the existing project root and create the frontend inside `frontend/`.
- Do NOT assume a clean empty `frontend/` folder.
- If legacy placeholder frontend folders/files exist from earlier phases, remove or replace them before scaffolding the Next.js app.
- Use Windows/PowerShell-friendly commands.
- Keep all paths relative to the project root.
- Keep the implementation close to the markdown, but fix anything needed for Windows or TypeScript compatibility.

### Expected outputs
- A Next.js 14 frontend in `frontend/`
- Clerk sign-in/sign-up pages
- Protected dashboard route
- Video input form
- Results panel with charts and sample comments
- API client pointing to `http://localhost:3001`

# Phase 4: Frontend Development

## Overview

This phase focuses on building the Next.js frontend application for Tube-Senti, including Clerk authentication integration, the dashboard UI components, and real-time sentiment visualization. This phase creates "The Face" layer that users interact with to analyze YouTube video sentiment.

**Phase Duration:** 2-3 development sessions  
**Primary Technology:** Next.js 14.x with TypeScript  
**Key Deliverables:**
- Complete Next.js application with App Router
- Clerk authentication flow (sign-up, sign-in, protected routes)
- Dashboard UI with video input and results display
- Real-time sentiment visualization using Recharts
- Responsive design with Tailwind CSS

---

## Table of Contents

1. [Objectives](#1-objectives)
2. [Prerequisites](#2-prerequisites)
3. [Architecture Overview](#3-architecture-overview)
4. [Next.js Project Setup](#4-nextjs-project-setup)
5. [Clerk Authentication Setup](#5-clerk-authentication-setup)
6. [Project Structure](#6-project-structure)
7. [Layout and Styling](#7-layout-and-styling)
8. [Dashboard Components](#8-dashboard-components)
9. [API Integration](#9-api-integration)
10. [Sentiment Visualization](#10-sentiment-visualization)
11. [Protected Routes](#11-protected-routes)
12. [Testing the Frontend](#12-testing-the-frontend)
13. [Expected Outputs](#13-expected-outputs)

---

## 1. Objectives

By the end of Phase 4, you will have:

1. **Set up a Next.js 14.x application** using the App Router architecture
2. **Integrated Clerk authentication** with:
   - Sign-up and sign-in pages
   - User profile management
   - Protected dashboard route
3. **Built the dashboard interface** including:
   - Video URL input form
   - Loading state during analysis
   - Sentiment score display with interpretation
   - Sample positive/negative comments
4. **Implemented sentiment visualizations** using:
   - Donut chart for sentiment distribution
   - Bar chart for sentiment breakdown
   - Real-time score gauge
5. **Styled the application** using Tailwind CSS with a responsive design

---

## 2. Prerequisites

### Required from Previous Phases

| Dependency | Status | Description |
|------------|--------|-------------|
 Backend API | Healthy | POST /api/predict works correctly |
| Backend Health | Healthy | GET /api/health returns healthy |

### Software Requirements

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | ≥ 20.x LTS | Runtime |
| npm | ≥ 10.x | Package management |

### External Services

| Service | Purpose | Setup |
|---------|---------|-------|
| Clerk | Authentication | Create account at clerk.com |

---

## 3. Architecture Overview

### Frontend Component Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TUBE-SENTI FRONTEND                                │
└─────────────────────────────────────────────────────────────────────────────┘

                           ┌─────────────────────┐
                           │    Next.js App      │
                           │   (App Router)      │
                           └──────────┬──────────┘
                                      │
           ┌──────────────────────────┼──────────────────────────┐
           │                          │                          │
    ┌──────▼──────┐           ┌───────▼───────┐          ┌───────▼───────┐
    │  Public     │           │  Auth Pages   │          │  Protected    │
    │  Pages      │           │  (Clerk)      │          │  Routes       │
    │             │           │               │          │               │
    │  - Home     │           │  - Sign In    │          │  - Dashboard  │
    │  - About    │           │  - Sign Up    │          │  - History    │
    └─────────────┘           └───────────────┘          └───────┬───────┘
                                                                 │
                                                    ┌────────────┴────────────┐
                                                    │                         │
                                             ┌──────▼──────┐          ┌───────▼───────┐
                                             │  VideoForm  │          │  ResultsPanel │
                                             │  Component  │          │  Component    │
                                             └──────┬──────┘          └───────┬───────┘
                                                    │                         │
                                             ┌──────▼──────┐          ┌───────▼───────┐
                                             │   axios     │          │   Recharts    │
                                             │  API calls  │          │   Visuals     │
                                             └─────────────┘          └───────────────┘
```

### Data Flow

```
User Input → VideoForm → axios POST → Backend API → R Scripts → Response
                                                                   │
                                                                   ▼
                                          ┌─────────────────────────────────┐
                                          │        ResultsPanel             │
                                          │  ┌───────────┬────────────────┐ │
                                          │  │ ScoreCard │ SentimentChart │ │
                                          │  ├───────────┴────────────────┤ │
                                          │  │      SampleComments        │ │
                                          │  └────────────────────────────┘ │
                                          └─────────────────────────────────┘
```

---

## 4. Next.js Project Setup

### 4.1 Create Next.js Application

```bash
# Navigate to the project root
cd "C:\Users\admin\Desktop\SEM_6\PROG DS PROJECT"

# If frontend already contains legacy placeholder files from earlier phases,
# remove or replace them before scaffolding the Next.js app.

cd frontend

# Create Next.js app with TypeScript and Tailwind
npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

**Options to select during setup:**
- Would you like to use TypeScript? **Yes**
- Would you like to use ESLint? **Yes**
- Would you like to use Tailwind CSS? **Yes**
- Would you like to use `src/` directory? **Yes**
- Would you like to use App Router? **Yes**
- Would you like to customize the default import alias? **Yes** → `@/*`

### 4.2 Install Additional Dependencies

```bash
# Authentication
npm install @clerk/nextjs

# HTTP client
npm install axios

# Charts and visualization
npm install recharts

# UI utilities
npm install clsx tailwind-merge
npm install @radix-ui/react-slot
npm install class-variance-authority
npm install lucide-react  # Icons

# Form handling
npm install react-hook-form
npm install @hookform/resolvers
npm install zod  # Validation
```

### 4.3 Update package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start -p 3000",
    "lint": "next lint"
  }
}
```

---

## 5. Clerk Authentication Setup

### 5.1 Create Clerk Account and Application

1. Go to [clerk.com](https://clerk.com) and sign up
2. Create a new application
3. Name it "Tube-Senti" or similar
4. Select authentication methods:
   - Email/Password ✓
   - Google OAuth (optional)
   - GitHub OAuth (optional)

### 5.2 Get Clerk API Keys

From the Clerk Dashboard:

1. Go to **API Keys**
2. Copy:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`

### 5.3 Configure Environment Variables

Create `frontend/.env.local`:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxx

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 5.4 Configure Clerk Provider

Create `frontend/src/app/layout.tsx`:

```tsx
// ==============================================================================
// src/app/layout.tsx - Root Layout with Clerk Provider
// ==============================================================================

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Tube-Senti | Video Sentiment Analyzer',
  description: 'Real-time YouTube video sentiment analysis powered by AI',
};

export default function RootLayout({
  children,
}: {
  import type { ReactNode } from 'react';
  ...
  children: ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
```

### 5.5 Create Clerk Middleware

Create `frontend/src/middleware.ts`:

```typescript
// ==============================================================================
// src/middleware.ts - Clerk Authentication Middleware
// ==============================================================================

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define protected routes
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
```

---

## 6. Project Structure

### Complete Directory Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── sign-in/
│   │   │   │   └── [[...sign-in]]/
│   │   │   │       └── page.tsx
│   │   │   └── sign-up/
│   │   │       └── [[...sign-up]]/
│   │   │           └── page.tsx
│   │   ├── (protected)/
│   │   │   └── dashboard/
│   │   │       └── page.tsx
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   └── loading.tsx
│   │   ├── layout/
│   │   │   ├── header.tsx
│   │   │   └── footer.tsx
│   │   ├── dashboard/
│   │   │   ├── video-form.tsx
│   │   │   ├── results-panel.tsx
│   │   │   ├── score-card.tsx
│   │   │   ├── sentiment-chart.tsx
│   │   │   └── sample-comments.tsx
│   │   └── auth/
│   │       └── user-button.tsx
│   ├── lib/
│   │   ├── api.ts
│   │   ├── utils.ts
│   │   └── types.ts
│   └── middleware.ts
├── public/
│   └── images/
├── .env.local
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 7. Layout and Styling

### 7.1 Global Styles (globals.css)

Update `frontend/src/app/globals.css`:

```css
/* ==============================================================================
 * globals.css - Global Styles
 * ============================================================================== */

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
    
    /* Sentiment colors */
    --positive: 142 76% 36%;
    --negative: 0 84% 60%;
    --neutral: 45 93% 47%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

@layer components {
  .gradient-bg {
    @apply bg-gradient-to-br from-blue-50 via-white to-purple-50;
  }
  
  .card-shadow {
    @apply shadow-lg shadow-gray-200/50;
  }
}
```

### 7.2 Tailwind Configuration

Update `frontend/tailwind.config.ts`:

```typescript
// ==============================================================================
// tailwind.config.ts - Tailwind CSS Configuration
// ==============================================================================

import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        positive: 'hsl(var(--positive))',
        negative: 'hsl(var(--negative))',
        neutral: 'hsl(var(--neutral))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
};

export default config;
```

### 7.3 Utility Functions

Create `frontend/src/lib/utils.ts`:

```typescript
// ==============================================================================
// src/lib/utils.ts - Utility Functions
// ==============================================================================

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function extractVideoId(input: string): string | null {
  // Already a video ID (11 characters)
  if (input.length === 11 && !input.includes('/')) {
    return input;
  }

  // Extract from various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

export function formatScore(score: number): string {
  return score.toFixed(1);
}

export function getScoreColor(score: number): string {
  if (score >= 75) return 'text-green-600';
  if (score >= 50) return 'text-yellow-600';
  if (score >= 25) return 'text-orange-600';
  return 'text-red-600';
}

export function getScoreBgColor(score: number): string {
  if (score >= 75) return 'bg-green-100';
  if (score >= 50) return 'bg-yellow-100';
  if (score >= 25) return 'bg-orange-100';
  return 'bg-red-100';
}
```

### 7.4 TypeScript Types

Create `frontend/src/lib/types.ts`:

```typescript
// ==============================================================================
// src/lib/types.ts - TypeScript Type Definitions
// ==============================================================================

export interface SentimentInterpretation {
  label: string;
  description: string;
  emoji: string;
}

export interface SentimentStatistics {
  score: number;
  positive_count: number;
  negative_count: number;
  total_count: number;
  positive_percentage: number;
  negative_percentage: number;
}

export interface SampleComment {
  text: string;
  confidence: number;
}

export interface CommentPrediction {
  comment_id: string;
  text: string;
  sentiment: 'positive' | 'negative';
  confidence: number;
}

export interface PredictionResponse {
  success: boolean;
  videoId: string;
  commentsAnalyzed: number;
  sentimentScore: number;
  interpretation: SentimentInterpretation;
  statistics: SentimentStatistics;
  samplePositive: SampleComment[];
  sampleNegative: SampleComment[];
  predictions: CommentPrediction[];
  processingTime: number;
}

export interface HealthResponse {
  status: 'healthy' | 'degraded';
  timestamp: string;
  checks: {
    server: boolean;
    rscript: boolean;
    model: boolean;
    youtubeApi: boolean;
  };
}

export interface ApiError {
  success: false;
  error: string;
  step?: string;
}
```

---

## 8. Dashboard Components

### 8.1 UI Components

Create `frontend/src/components/ui/button.tsx`:

```tsx
// ==============================================================================
// src/components/ui/button.tsx - Button Component
// ==============================================================================

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        outline: 'border border-input bg-background hover:bg-accent',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
```

Create `frontend/src/components/ui/card.tsx`:

```tsx
// ==============================================================================
// src/components/ui/card.tsx - Card Component
// ==============================================================================

import * as React from 'react';
import { cn } from '@/lib/utils';

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-lg border bg-card text-card-foreground shadow-sm',
      className
    )}
    {...props}
  />
));
Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-2xl font-semibold leading-none tracking-tight', className)}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

export { Card, CardHeader, CardTitle, CardDescription, CardContent };
```

Create `frontend/src/components/ui/loading.tsx`:

```tsx
// ==============================================================================
// src/components/ui/loading.tsx - Loading Spinner Component
// ==============================================================================

import { cn } from '@/lib/utils';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Loading({ size = 'md', className }: LoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-gray-300 border-t-primary',
        sizeClasses[size],
        className
      )}
    />
  );
}

export function LoadingOverlay({ message = 'Analyzing...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 flex flex-col items-center space-y-4">
        <Loading size="lg" />
        <p className="text-lg font-medium text-gray-700">{message}</p>
        <p className="text-sm text-gray-500">This may take a few seconds...</p>
      </div>
    </div>
  );
}
```

### 8.2 Layout Components

Create `frontend/src/components/layout/header.tsx`:

```tsx
// ==============================================================================
// src/components/layout/header.tsx - Header Component
// ==============================================================================

'use client';

import Link from 'next/link';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { BarChart3 } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">Tube-Senti</span>
        </Link>
        
        <nav className="flex items-center space-x-4">
          <SignedIn>
            <Link href="/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          
          <SignedOut>
            <Link href="/sign-in">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button>Get Started</Button>
            </Link>
          </SignedOut>
        </nav>
      </div>
    </header>
  );
}
```

### 8.3 Video Form Component

Create `frontend/src/components/dashboard/video-form.tsx`:

```tsx
// ==============================================================================
// src/components/dashboard/video-form.tsx - Video URL Input Form
// ==============================================================================

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loading } from '@/components/ui/loading';
import { Search, Youtube } from 'lucide-react';

const formSchema = z.object({
  videoUrl: z.string().min(1, 'Please enter a YouTube URL or video ID'),
});

type FormData = z.infer<typeof formSchema>;

interface VideoFormProps {
  onSubmit: (videoUrl: string) => Promise<void>;
  isLoading: boolean;
}

export function VideoForm({ onSubmit, isLoading }: VideoFormProps) {
  const [inputValue, setInputValue] = useState('');
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const handleFormSubmit = async (data: FormData) => {
    await onSubmit(data.videoUrl);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
          <Youtube className="h-6 w-6 text-red-600" />
        </div>
        <CardTitle>Analyze Video Sentiment</CardTitle>
        <CardDescription>
          Enter a YouTube video URL to analyze audience sentiment from comments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="relative">
            <input
              {...register('videoUrl')}
              type="text"
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              disabled={isLoading}
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
          
          {errors.videoUrl && (
            <p className="text-sm text-red-500">{errors.videoUrl.message}</p>
          )}
          
          <Button 
            type="submit" 
            className="w-full" 
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loading size="sm" className="mr-2" />
                Analyzing Comments...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Analyze Sentiment
              </>
            )}
          </Button>
          
          <p className="text-xs text-center text-gray-500">
            Supports standard YouTube URLs and video IDs
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
```

### 8.4 Score Card Component

Create `frontend/src/components/dashboard/score-card.tsx`:

```tsx
// ==============================================================================
// src/components/dashboard/score-card.tsx - Sentiment Score Display
// ==============================================================================

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SentimentInterpretation } from '@/lib/types';
import { formatScore, getScoreColor, getScoreBgColor } from '@/lib/utils';

interface ScoreCardProps {
  score: number;
  interpretation: SentimentInterpretation;
  commentsAnalyzed: number;
  processingTime: number;
}

export function ScoreCard({ 
  score, 
  interpretation, 
  commentsAnalyzed,
  processingTime 
}: ScoreCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className={getScoreBgColor(score)}>
        <CardTitle className="text-center">
          <span className="text-6xl">{interpretation.emoji}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 text-center">
        <div className={`text-5xl font-bold mb-2 ${getScoreColor(score)}`}>
          {formatScore(score)}
        </div>
        <div className="text-xl font-semibold text-gray-800 mb-2">
          {interpretation.label}
        </div>
        <p className="text-gray-600 text-sm mb-4">
          {interpretation.description}
        </p>
        <div className="flex justify-center space-x-6 text-sm text-gray-500">
          <div>
            <span className="font-medium">{commentsAnalyzed}</span> comments
          </div>
          <div>
            <span className="font-medium">{(processingTime / 1000).toFixed(1)}s</span> analysis time
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### 8.5 Results Panel Component

Create `frontend/src/components/dashboard/results-panel.tsx`:

```tsx
// ==============================================================================
// src/components/dashboard/results-panel.tsx - Results Display Panel
// ==============================================================================

'use client';

import { PredictionResponse } from '@/lib/types';
import { ScoreCard } from './score-card';
import { SentimentChart } from './sentiment-chart';
import { SampleComments } from './sample-comments';

interface ResultsPanelProps {
  data: PredictionResponse;
}

export function ResultsPanel({ data }: ResultsPanelProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Score and Chart Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ScoreCard
          score={data.sentimentScore}
          interpretation={data.interpretation}
          commentsAnalyzed={data.commentsAnalyzed}
          processingTime={data.processingTime}
        />
        <SentimentChart statistics={data.statistics} />
      </div>
      
      {/* Sample Comments Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SampleComments
          type="positive"
          comments={data.samplePositive}
        />
        <SampleComments
          type="negative"
          comments={data.sampleNegative}
        />
      </div>
    </div>
  );
}
```

### 8.6 Sample Comments Component

Create `frontend/src/components/dashboard/sample-comments.tsx`:

```tsx
// ==============================================================================
// src/components/dashboard/sample-comments.tsx - Sample Comments Display
// ==============================================================================

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SampleComment } from '@/lib/types';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

interface SampleCommentsProps {
  type: 'positive' | 'negative';
  comments: SampleComment[];
}

export function SampleComments({ type, comments }: SampleCommentsProps) {
  const isPositive = type === 'positive';
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-lg">
          {isPositive ? (
            <>
              <ThumbsUp className="h-5 w-5 mr-2 text-green-600" />
              <span className="text-green-700">Top Positive Comments</span>
            </>
          ) : (
            <>
              <ThumbsDown className="h-5 w-5 mr-2 text-red-600" />
              <span className="text-red-700">Top Negative Comments</span>
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {comments.length > 0 ? (
          <ul className="space-y-3">
            {comments.map((comment, index) => (
              <li
                key={index}
                className={`p-3 rounded-lg text-sm ${
                  isPositive ? 'bg-green-50' : 'bg-red-50'
                }`}
              >
                <p className="text-gray-700">&quot;{comment.text}&quot;</p>
                <p className="text-xs text-gray-500 mt-1">
                  Confidence: {(comment.confidence * 100).toFixed(1)}%
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm">No {type} comments found</p>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## 9. API Integration

Create `frontend/src/lib/api.ts`:

```typescript
// ==============================================================================
// src/lib/api.ts - API Client
// ==============================================================================

import axios, { AxiosError } from 'axios';
import { PredictionResponse, HealthResponse, ApiError } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000, // 60 second timeout for predictions
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function analyzeSentiment(
  videoUrl: string
): Promise<PredictionResponse> {
  try {
    const response = await api.post<PredictionResponse>('/api/predict', {
      videoUrl,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiError>;
      throw new Error(
        axiosError.response?.data?.error || 'Failed to analyze sentiment'
      );
    }
    throw error;
  }
}

export async function checkHealth(): Promise<HealthResponse> {
  try {
    const response = await api.get<HealthResponse>('/api/health');
    return response.data;
  } catch (error) {
    throw new Error('Backend service is unavailable');
  }
}
```

---

## 10. Sentiment Visualization

### 10.1 Sentiment Chart Component

Create `frontend/src/components/dashboard/sentiment-chart.tsx`:

```tsx
// ==============================================================================
// src/components/dashboard/sentiment-chart.tsx - Sentiment Distribution Chart
// ==============================================================================

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SentimentStatistics } from '@/lib/types';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

interface SentimentChartProps {
  statistics: SentimentStatistics;
}

const COLORS = {
  positive: '#22c55e', // green-500
  negative: '#ef4444', // red-500
};

export function SentimentChart({ statistics }: SentimentChartProps) {
  const data = [
    {
      name: 'Positive',
      value: statistics.positive_count,
      percentage: statistics.positive_percentage,
    },
    {
      name: 'Negative',
      value: statistics.negative_count,
      percentage: statistics.negative_percentage,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Sentiment Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.name === 'Positive' ? COLORS.positive : COLORS.negative}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [
                  `${value} comments`,
                  name,
                ]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Statistics Summary */}
        <div className="mt-4 grid grid-cols-2 gap-4 text-center">
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {statistics.positive_count}
            </div>
            <div className="text-sm text-green-700">Positive</div>
          </div>
          <div className="p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {statistics.negative_count}
            </div>
            <div className="text-sm text-red-700">Negative</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 11. Protected Routes

### 11.1 Auth Pages

Create `frontend/src/app/(auth)/sign-in/[[...sign-in]]/page.tsx`:

```tsx
// ==============================================================================
// src/app/(auth)/sign-in/[[...sign-in]]/page.tsx - Sign In Page
// ==============================================================================

import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg">
      <SignIn />
    </div>
  );
}
```

Create `frontend/src/app/(auth)/sign-up/[[...sign-up]]/page.tsx`:

```tsx
// ==============================================================================
// src/app/(auth)/sign-up/[[...sign-up]]/page.tsx - Sign Up Page
// ==============================================================================

import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg">
      <SignUp />
    </div>
  );
}
```

### 11.2 Dashboard Page

Create `frontend/src/app/(protected)/dashboard/page.tsx`:

```tsx
// ==============================================================================
// src/app/(protected)/dashboard/page.tsx - Main Dashboard
// ==============================================================================

'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { VideoForm } from '@/components/dashboard/video-form';
import { ResultsPanel } from '@/components/dashboard/results-panel';
import { LoadingOverlay } from '@/components/ui/loading';
import { analyzeSentiment } from '@/lib/api';
import { PredictionResponse } from '@/lib/types';
import { AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<PredictionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (videoUrl: string) => {
    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const data = await analyzeSentiment(videoUrl);
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg">
      <Header />
      
      <main className="container py-8">
        {/* Video Input Form */}
        <VideoForm onSubmit={handleAnalyze} isLoading={isLoading} />

        {/* Error Display */}
        {error && (
          <div className="mt-6 max-w-2xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3" />
              <div>
                <h3 className="font-medium text-red-800">Analysis Failed</h3>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Results Display */}
        {results && (
          <div className="mt-8">
            <ResultsPanel data={results} />
          </div>
        )}
      </main>

      {/* Loading Overlay */}
      {isLoading && <LoadingOverlay message="Analyzing video comments..." />}
    </div>
  );
}
```

### 11.3 Home Page

Update `frontend/src/app/page.tsx`:

```tsx
// ==============================================================================
// src/app/page.tsx - Landing Page
// ==============================================================================

import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { BarChart3, Zap, Shield, TrendingUp } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen gradient-bg">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="container py-20 text-center">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-6">
            Understand Your Audience
            <br />
            <span className="text-primary">In Seconds</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Tube-Senti uses advanced AI to analyze YouTube comments and give you
            instant insights into how your audience truly feels about your content.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/sign-up">
              <Button size="lg">
                Get Started Free
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button size="lg" variant="outline">
                Sign In
              </Button>
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section className="container py-16">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose Tube-Senti?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Zap className="h-8 w-8 text-yellow-500" />}
              title="Real-Time Analysis"
              description="Get sentiment scores in under 5 seconds with our optimized ML pipeline."
            />
            <FeatureCard
              icon={<BarChart3 className="h-8 w-8 text-blue-500" />}
              title="Visual Insights"
              description="Beautiful charts and visualizations make data easy to understand."
            />
            <FeatureCard
              icon={<Shield className="h-8 w-8 text-green-500" />}
              title="Secure & Private"
              description="Your data is never stored. Analysis happens in real-time and is immediately discarded."
            />
          </div>
        </section>
      </main>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  import type { ReactNode } from 'react';
  ...
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
```

---

## 12. Testing the Frontend

### 12.1 Start Development Server

```bash
cd frontend
npm run dev
```

### 12.2 Test Authentication Flow

1. Visit `http://localhost:3000`
2. Click "Get Started" or "Sign Up"
3. Create an account via Clerk
4. Verify redirect to `/dashboard`

### 12.3 Test Sentiment Analysis

1. Ensure backend is running on port 3001
2. Navigate to dashboard
3. Enter a YouTube video URL
4. Verify:
   - Loading state appears
   - Results display with score, chart, and comments
   - Error handling works for invalid URLs

### 12.4 Responsive Testing

Test on multiple screen sizes:
- Mobile: 375px
- Tablet: 768px
- Desktop: 1280px

---

## 13. Expected Outputs

### 13.1 Files Created

| File | Location | Description |
|------|----------|-------------|
| `layout.tsx` | `src/app/` | Root layout with Clerk provider |
| `page.tsx` | `src/app/` | Landing page |
| `middleware.ts` | `src/` | Clerk auth middleware |
| `sign-in/page.tsx` | `src/app/(auth)/` | Sign-in page |
| `sign-up/page.tsx` | `src/app/(auth)/` | Sign-up page |
| `dashboard/page.tsx` | `src/app/(protected)/` | Main dashboard |
| `video-form.tsx` | `src/components/dashboard/` | Video input form |
| `results-panel.tsx` | `src/components/dashboard/` | Results container |
| `score-card.tsx` | `src/components/dashboard/` | Sentiment score display |
| `sentiment-chart.tsx` | `src/components/dashboard/` | Recharts pie chart |
| `sample-comments.tsx` | `src/components/dashboard/` | Comment samples |
| `header.tsx` | `src/components/layout/` | Navigation header |
| `button.tsx` | `src/components/ui/` | Button component |
| `card.tsx` | `src/components/ui/` | Card component |
| `loading.tsx` | `src/components/ui/` | Loading spinner |
| `api.ts` | `src/lib/` | API client |
| `utils.ts` | `src/lib/` | Utility functions |
| `types.ts` | `src/lib/` | TypeScript types |
| `globals.css` | `src/app/` | Global styles |
| `tailwind.config.ts` | `frontend/` | Tailwind configuration |

### 13.2 Running Services

| Service | Port | Description |
|---------|------|-------------|
| Next.js Frontend | 3000 | Development server |
| Backend API | 3001 | REST API server |

### 13.3 Verification Checklist

- [ ] Landing page renders with features
- [ ] Sign-up flow works via Clerk
- [ ] Sign-in flow works via Clerk
- [ ] Dashboard is protected (redirects to sign-in)
- [ ] Video form accepts YouTube URLs
- [ ] Loading state shows during analysis
- [ ] Results display with score, chart, comments
- [ ] Error messages show for invalid inputs
- [ ] Responsive design works on mobile

---

## Summary

Phase 4 completes the frontend interface:

1. ✅ Next.js 14 application with App Router
2. ✅ Clerk authentication (sign-up, sign-in, protected routes)
3. ✅ Dashboard with video input form
4. ✅ Real-time sentiment visualization with Recharts
5. ✅ Responsive design with Tailwind CSS

**Key Components:**
- `VideoForm` - URL input and validation
- `ScoreCard` - Sentiment score display
- `SentimentChart` - Pie chart visualization
- `SampleComments` - Top positive/negative comments

**Next Phase:** Phase 5 – Power BI Dashboard and Visualization

---

*Phase 4 document for Tube-Senti: Real-Time Video Reception Analyzer*
