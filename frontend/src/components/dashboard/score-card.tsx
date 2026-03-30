// ==============================================================================
// components/dashboard/score-card.tsx - Sentiment Score Display
// ==============================================================================

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Interpretation } from '@/lib/types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ScoreCardProps {
  score: number;
  interpretation: Interpretation;
  commentsAnalyzed: number;
  processingTime: number;
}

export function ScoreCard({
  score,
  interpretation,
  commentsAnalyzed,
  processingTime,
}: ScoreCardProps) {
  // Determine color scheme based on score
  const getColorClasses = () => {
    if (score >= 60) {
      return {
        bg: 'bg-green-50',
        text: 'text-green-700',
        icon: 'text-green-600',
        Icon: TrendingUp,
      };
    } else if (score >= 40) {
      return {
        bg: 'bg-yellow-50',
        text: 'text-yellow-700',
        icon: 'text-yellow-600',
        Icon: Minus,
      };
    } else {
      return {
        bg: 'bg-red-50',
        text: 'text-red-700',
        icon: 'text-red-600',
        Icon: TrendingDown,
      };
    }
  };

  const colors = getColorClasses();
  const { Icon } = colors;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Sentiment Score</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score Display */}
        <div className={`${colors.bg} rounded-lg p-6 text-center`}>
          <div className="flex items-center justify-center mb-2">
            <Icon className={`h-8 w-8 ${colors.icon}`} />
          </div>
          <div className={`text-6xl font-bold ${colors.text} mb-2`}>
            {score}
          </div>
          <div className="text-sm text-gray-600">out of 100</div>
        </div>

        {/* Interpretation */}
        <div className="text-center">
          <div className="text-xl font-semibold text-gray-800 mb-2">
            {interpretation.label}
          </div>
          <p className="text-gray-600 text-sm mb-4">
            {interpretation.description}
          </p>
        </div>

        {/* Stats */}
        <div className="flex justify-center space-x-6 text-sm text-gray-500 pt-4 border-t">
          <div className="text-center">
            <div className="font-medium text-gray-900">{commentsAnalyzed}</div>
            <div>comments</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-gray-900">
              {(processingTime / 1000).toFixed(1)}s
            </div>
            <div>analysis time</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
