// ==============================================================================
// lib/types.ts - TypeScript Type Definitions (MSSF v2)
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
  emoji: string;
}

export interface ModelInfo {
  name: string;
  backbone: string;
  branches: string[];
  mode: string;
  inferenceMs: number;
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
  modelInfo?: ModelInfo;
  predictions?: Array<{
    comment_id?: string;
    text: string;
    sentiment: string;
    confidence: number;
    prob_positive: number;
    prob_neutral: number;
    prob_negative: number;
  }>;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  checks: {
    server: boolean;
    rscript: boolean;
    mssfModel: boolean;
    youtubeApi: boolean;
  };
  services?: {
    node: string;
    python: string;
  };
  architecture?: string;
  version: string;
  environment: string;
}

export interface ApiError {
  success: false;
  error: string;
  details?: unknown;
}
