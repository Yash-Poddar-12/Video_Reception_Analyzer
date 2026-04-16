// ==============================================================================
// lib/api.ts - API Client
// ==============================================================================

import axios, { AxiosError } from 'axios';
import { PredictionResponse, HealthResponse, ApiError } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  timeout: 120000, // 120 second timeout — MSSF transformer inference is slower than NB
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Analyze sentiment for a YouTube video
 */
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

/**
 * Check backend health status
 */
export async function checkHealth(): Promise<HealthResponse> {
  try {
    const response = await api.get<HealthResponse>('/api/health');
    return response.data;
  } catch {
    throw new Error('Backend service is unavailable');
  }
}
