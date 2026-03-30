// ==============================================================================
// components/dashboard/sample-comments.tsx - Sample Comments Display (TUBE-SENTI Theme)
// ==============================================================================

'use client';

import { SampleComment } from '@/lib/types';

interface SampleCommentsProps {
  type: 'positive' | 'negative';
  comments: SampleComment[];
}

export function SampleComments({ type, comments }: SampleCommentsProps) {
  const isPositive = type === 'positive';

  return (
    <div className="p-8 h-full bg-surface-container-lowest flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-outline-variant/20">
        <div className={`w-10 h-10 border flex items-center justify-center ${
          isPositive ? 'border-primary/40 bg-primary/5' : 'border-error/40 bg-error/5'
        }`}>
          <span
            className={`material-symbols-outlined text-lg ${isPositive ? 'text-primary' : 'text-error'}`}
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {isPositive ? 'thumb_up' : 'thumb_down'}
          </span>
        </div>
        <div className="flex-1">
          <p className={`text-base font-bold tracking-tight font-headline ${
            isPositive ? 'text-primary' : 'text-error'
          }`}>
            {isPositive ? 'Positive' : 'Negative'} Samples
          </p>
          <p className="text-[9px] uppercase tracking-widest text-on-surface-variant font-label">
            Ranked by Confidence Score
          </p>
        </div>
        <div className={`px-3 py-1 border ${
          isPositive ? 'border-primary/30 bg-primary/10' : 'border-error/30 bg-error/10'
        }`}>
          <span className={`text-xs font-mono font-bold ${isPositive ? 'text-primary' : 'text-error'}`}>
            TOP {comments.length}
          </span>
        </div>
      </div>

      {/* Comments List */}
      {comments.length > 0 ? (
        <ul className="space-y-4 flex-1">
          {comments.map((comment, index) => (
            <li
              key={index}
              className={`group relative`}
            >
              {/* Rank Badge */}
              <div className="flex gap-3">
                <div className={`w-7 h-7 flex items-center justify-center border ${
                  isPositive ? 'border-primary/30 bg-primary/5' : 'border-error/30 bg-error/5'
                } shrink-0`}>
                  <span className={`text-xs font-mono font-bold ${
                    isPositive ? 'text-primary' : 'text-error'
                  }`}>
                    {index + 1}
                  </span>
                </div>

                <div className="flex-1">
                  {/* Comment Text */}
                  <div className={`p-4 border-l-2 bg-surface-container-low/30 group-hover:bg-surface-container-low transition-colors ${
                    isPositive ? 'border-primary/60' : 'border-error/60'
                  }`}>
                    <p className="text-sm text-on-surface leading-relaxed mb-3">
                      &ldquo;{comment.text}&rdquo;
                    </p>
                    
                    {/* Confidence Bar */}
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] uppercase tracking-widest text-on-surface-variant font-label shrink-0">
                        Confidence
                      </span>
                      <div className={`flex-1 h-1.5 bg-surface-container-highest overflow-hidden`}>
                        <div
                          className={`h-full ${isPositive ? 'bg-primary' : 'bg-error'} transition-all duration-500`}
                          style={{ width: `${comment.confidence * 100}%` }}
                        />
                      </div>
                      <span className={`text-xs font-mono font-bold ${
                        isPositive ? 'text-primary' : 'text-error'
                      }`}>
                        {(comment.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center py-12 text-center border border-outline-variant/10 bg-surface-container/20">
          <div className="w-16 h-16 border border-outline-variant/20 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-3xl text-outline-variant">
              chat_bubble_outline
            </span>
          </div>
          <p className="text-sm text-on-surface-variant font-bold mb-1">
            No {type} comments detected
          </p>
          <p className="text-[10px] uppercase tracking-widest text-outline font-label">
            Insufficient data
          </p>
        </div>
      )}
    </div>
  );
}
