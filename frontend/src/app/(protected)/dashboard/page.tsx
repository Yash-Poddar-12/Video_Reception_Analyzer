// ==============================================================================
// app/(protected)/dashboard/page.tsx - Dashboard Page (TUBE-SENTI Theme)
// ==============================================================================

'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { VideoForm } from '@/components/dashboard/video-form';
import { ResultsPanel } from '@/components/dashboard/results-panel';
import { LoadingOverlay } from '@/components/ui/loading';
import { analyzeSentiment } from '@/lib/api';
import { PredictionResponse } from '@/lib/types';

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
    <div className="min-h-screen bg-background text-on-background font-body relative">
      {/* Decorative Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary opacity-[0.015] blur-[120px] rounded-full" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-primary opacity-[0.01] blur-[100px] rounded-full" />
      </div>
      <div className="fixed top-0 left-0 w-px h-full bg-gradient-to-b from-transparent via-outline-variant/10 to-transparent pointer-events-none z-0" />
      <div className="fixed top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-outline-variant/10 to-transparent pointer-events-none z-0" />

      <Header />

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Page Header */}
        <div className="mb-12">
          <span className="inline-block text-[10px] uppercase tracking-[0.3em] font-medium text-on-surface-variant mb-3 font-label">
            Analysis Console
          </span>
          <h1 className="text-4xl md:text-5xl font-headline font-extrabold tracking-tighter text-primary mb-4">
            SENTIMENT ANALYSIS
          </h1>
          <p className="text-on-surface-variant max-w-xl">
            Extract probabilistic sentiment data from YouTube comment streams using our Naive Bayes classification engine.
          </p>
        </div>

        {/* Video Form */}
        <div className="mb-12">
          <VideoForm onSubmit={handleAnalyze} isLoading={isLoading} />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-10 border border-error/30 bg-error-container/10 p-6 flex items-start gap-4">
            <div className="w-10 h-10 border border-error/40 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-error text-xl">error</span>
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-error mb-1">
                Analysis Failed
              </h3>
              <p className="text-on-error-container text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Results */}
        {results && <ResultsPanel data={results} />}
      </main>

      {/* Loading Overlay */}
      {isLoading && <LoadingOverlay message="Processing comment stream..." />}
    </div>
  );
}
