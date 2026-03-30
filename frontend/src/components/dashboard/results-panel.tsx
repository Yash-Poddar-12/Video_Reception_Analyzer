// ==============================================================================
// components/dashboard/results-panel.tsx - Results Display Panel
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
