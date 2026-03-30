// ==============================================================================
// components/dashboard/results-panel.tsx - Results Display Panel (TUBE-SENTI Theme)
// ==============================================================================

'use client';

import { PredictionResponse } from '@/lib/types';
import { ScoreCard } from './score-card';
import { SentimentChart } from './sentiment-chart';
import { SampleComments } from './sample-comments';
import { useEffect, useState } from 'react';

interface ResultsPanelProps {
  data: PredictionResponse;
}

export function ResultsPanel({ data }: ResultsPanelProps) {
  const [animate, setAnimate] = useState(false);
  
  useEffect(() => {
    // Trigger animation on mount
    setAnimate(true);
  }, []);

  return (
    <div className="space-y-0">
      {/* Terminal-style header with metadata */}
      <div className="border border-outline-variant/20 bg-surface-container-lowest p-6 font-mono text-[11px] text-on-surface-variant space-y-1">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary animate-pulse" />
            <span className="text-primary font-bold">ANALYSIS COMPLETE</span>
          </div>
          <span className="text-outline">{new Date().toISOString()}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-x-8 gap-y-1 text-[10px] pl-4 border-l-2 border-primary/30">
          <div><span className="text-outline">VIDEO_ID:</span> <span className="text-on-surface">{data.videoId}</span></div>
          <div><span className="text-outline">COMMENTS:</span> <span className="text-on-surface">{data.commentsAnalyzed}</span></div>
          <div><span className="text-outline">LATENCY:</span> <span className="text-on-surface">{(data.processingTime / 1000).toFixed(2)}s</span></div>
          <div><span className="text-outline">MODEL:</span> <span className="text-on-surface">NAIVE_BAYES_v1.0</span></div>
        </div>
      </div>

      {/* Main analytics grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
        {/* Left: Score Card - Takes 1 column */}
        <div className={`border-r border-b lg:border-b-0 border-outline-variant/20 transition-all duration-700 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '100ms' }}>
          <ScoreCard
            score={data.sentimentScore}
            interpretation={data.interpretation}
            commentsAnalyzed={data.commentsAnalyzed}
            processingTime={data.processingTime}
          />
        </div>
        
        {/* Right: Chart - Takes 2 columns */}
        <div className={`lg:col-span-2 border-b lg:border-b-0 border-outline-variant/20 transition-all duration-700 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '200ms' }}>
          <SentimentChart statistics={data.statistics} commentsAnalyzed={data.commentsAnalyzed} />
        </div>
      </div>

      {/* Sample Comments with animated reveal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border border-outline-variant/20 border-t-0">
        <div className={`border-b lg:border-b-0 lg:border-r border-outline-variant/20 transition-all duration-700 ${animate ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`} style={{ transitionDelay: '300ms' }}>
          <SampleComments
            type="positive"
            comments={data.samplePositive}
          />
        </div>
        <div className={`transition-all duration-700 ${animate ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`} style={{ transitionDelay: '400ms' }}>
          <SampleComments
            type="negative"
            comments={data.sampleNegative}
          />
        </div>
      </div>

      {/* Technical Details Footer */}
      <div className="border border-outline-variant/20 border-t-0 bg-surface-container-lowest p-6">
        <div className="flex items-start gap-6">
          <div className="w-10 h-10 border border-outline-variant/30 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-outline text-lg">info</span>
          </div>
          <div className="flex-1 space-y-3">
            <h3 className="text-[10px] uppercase tracking-widest text-on-surface-variant font-label">
              Analysis Methodology
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px] text-on-surface-variant leading-relaxed">
              <div>
                <span className="text-primary font-bold">Preprocessing:</span> Comments tokenized, stopwords removed, stemmed for feature extraction.
              </div>
              <div>
                <span className="text-primary font-bold">Classification:</span> Naive Bayes binary classifier trained on 50k+ labeled YouTube comments.
              </div>
              <div>
                <span className="text-primary font-bold">Confidence:</span> Probability scores indicate model certainty for each prediction.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
