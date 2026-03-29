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
