'use client';

// ==============================================================================
// src/app/(protected)/dashboard/page.tsx - Main Dashboard
// ==============================================================================

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
