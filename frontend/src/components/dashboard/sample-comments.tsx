'use client';

// ==============================================================================
// src/components/dashboard/sample-comments.tsx - Sample Comments Display
// ==============================================================================

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SampleComment } from '@/lib/types';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

interface SampleCommentsProps {
  type: 'positive' | 'negative';
  comments: SampleComment[];
}

export function SampleComments({ type, comments }: SampleCommentsProps) {
  const isPositive = type === 'positive';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-lg">
          {isPositive ? (
            <>
              <ThumbsUp className="h-5 w-5 mr-2 text-green-600" />
              <span className="text-green-700">Top Positive Comments</span>
            </>
          ) : (
            <>
              <ThumbsDown className="h-5 w-5 mr-2 text-red-600" />
              <span className="text-red-700">Top Negative Comments</span>
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {comments.length > 0 ? (
          <ul className="space-y-3">
            {comments.map((comment, index) => (
              <li
                key={index}
                className={`p-3 rounded-lg text-sm ${
                  isPositive ? 'bg-green-50' : 'bg-red-50'
                }`}
              >
                <p className="text-gray-700">&quot;{comment.text}&quot;</p>
                <p className="text-xs text-gray-500 mt-1">
                  Confidence: {(comment.confidence * 100).toFixed(1)}%
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm">No {type} comments found</p>
        )}
      </CardContent>
    </Card>
  );
}
