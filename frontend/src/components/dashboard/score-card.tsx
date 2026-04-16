// ==============================================================================
// components/dashboard/score-card.tsx - Sentiment Score Display (TUBE-SENTI Theme)
// ==============================================================================

'use client';

import { Interpretation } from '@/lib/types';
import { useEffect, useState } from 'react';

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
  const [animatedScore, setAnimatedScore] = useState(0);
  
  useEffect(() => {
    // Animate score counting up
    let start = 0;
    const duration = 1500;
    const increment = score / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= score) {
        setAnimatedScore(score);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.floor(start));
      }
    }, 16);
    
    return () => clearInterval(timer);
  }, [score]);

  // Determine visual indicator based on score
  const getScoreStyle = () => {
    if (score >= 60) {
      return { icon: 'trending_up', barColor: 'bg-primary', glowColor: 'shadow-[0_0_20px_rgba(255,255,255,0.2)]' };
    } else if (score >= 40) {
      return { icon: 'trending_flat', barColor: 'bg-outline', glowColor: 'shadow-[0_0_20px_rgba(145,145,145,0.2)]' };
    } else {
      return { icon: 'trending_down', barColor: 'bg-error', glowColor: 'shadow-[0_0_20px_rgba(255,180,171,0.2)]' };
    }
  };

  const style = getScoreStyle();

  return (
    <div className="p-8 h-full flex flex-col bg-surface-container-lowest relative overflow-hidden">
      {/* Subtle background effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary opacity-[0.02] blur-3xl" />
      
      <div className="relative z-10 flex-1 flex flex-col">
        {/* Header with icon */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-[9px] uppercase tracking-[0.3em] text-on-surface-variant font-label mb-2">
              Audience Sentiment Score
            </p>
            <div className="flex items-baseline gap-3">
              <span className={`text-7xl font-headline font-extrabold tracking-tighter text-primary transition-all duration-300 ${style.glowColor}`}>
                {animatedScore}
              </span>
              <div className="flex flex-col">
                <span className="text-2xl text-on-surface-variant font-mono">/100</span>
                <span className="text-[8px] uppercase tracking-widest text-outline font-label">SCALE</span>
              </div>
            </div>
          </div>
          <div className={`w-14 h-14 border border-outline-variant/30 flex items-center justify-center ${style.glowColor}`}>
            <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              {style.icon}
            </span>
          </div>
        </div>

        {/* Animated Score Bar */}
        <div className="mb-8">
          <div className="w-full h-2 bg-surface-container-highest relative overflow-hidden">
            <div
              className={`h-full ${style.barColor} transition-all duration-1500 ease-out relative`}
              style={{ width: `${animatedScore}%` }}
            >
              {/* Animated shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>
          </div>
          {/* Scale markers */}
          <div className="flex justify-between mt-1 text-[8px] text-outline-variant font-mono">
            <span>0</span>
            <span>25</span>
            <span>50</span>
            <span>75</span>
            <span>100</span>
          </div>
        </div>

        {/* Interpretation Box */}
        <div className="mb-8 p-4 border border-outline-variant/20 bg-surface-container/50">
          <p className="text-base font-bold text-on-surface mb-1 font-headline tracking-tight uppercase">
            {interpretation.label}
          </p>
          <p className="text-[11px] text-on-surface-variant leading-relaxed">
            {interpretation.description}
          </p>
        </div>

        {/* Stats Grid - Push to bottom */}
        <div className="mt-auto grid grid-cols-2 gap-6 pt-6 border-t border-outline-variant/20">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1 h-1 bg-primary" />
              <p className="text-[8px] uppercase tracking-widest text-on-surface-variant font-label">
                Dataset Size
              </p>
            </div>
            <p className="text-2xl font-mono font-bold text-on-surface">
              {commentsAnalyzed.toLocaleString()}
            </p>
            <p className="text-[9px] text-outline-variant font-mono">comments</p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1 h-1 bg-primary" />
              <p className="text-[8px] uppercase tracking-widest text-on-surface-variant font-label">
                Execution Time
              </p>
            </div>
            <p className="text-2xl font-mono font-bold text-on-surface">
              {(processingTime / 1000).toFixed(2)}
            </p>
            <p className="text-[9px] text-outline-variant font-mono">seconds</p>
          </div>
        </div>
      </div>
    </div>
  );
}
