'use client';

// ==============================================================================
// src/components/dashboard/score-card.tsx - Sentiment Score Display
// ==============================================================================

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
  processingTime,
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
