// ==============================================================================
// lib/types.ts - TypeScript Type Definitions
// ==============================================================================

export interface SampleComment {
  text: string;
  confidence: number;
}

export interface Statistics {
  positive: number;
  negative: number;
  neutral: number;
  positivePercent: number;
  negativePercent: number;
  neutralPercent: number;
}

export interface Interpretation {
  label: string;
  description: string;
  color: string;
}

export interface PredictionResponse {
  success: boolean;
  videoId: string;
  sentimentScore: number;
  interpretation: Interpretation;
  commentsAnalyzed: number;
  processingTime: number;
  statistics: Statistics;
  samplePositive: SampleComment[];
  sampleNegative: SampleComment[];
  predictions?: Array<{
    text: string;
    sentiment: string;
    probability: number;
  }>;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  checks: {
    server: boolean;
    rscript: boolean;
    model: boolean;
    youtubeApi: boolean;
  };
  version: string;
  environment: string;
}

export interface ApiError {
  success: false;
  error: string;
  details?: unknown;
}
