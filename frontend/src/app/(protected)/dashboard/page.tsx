// ==============================================================================
// app/(protected)/dashboard/page.tsx - Dashboard Page
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Sentiment Analysis Dashboard
          </h1>
          <p className="text-gray-600">
            Analyze YouTube video comments and get instant sentiment insights
          </p>
        </div>

        {/* Video Form */}
        <div className="mb-8">
          <VideoForm onSubmit={handleAnalyze} isLoading={isLoading} />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Analysis Failed</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Results */}
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
