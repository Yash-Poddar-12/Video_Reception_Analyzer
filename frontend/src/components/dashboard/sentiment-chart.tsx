// ==============================================================================
// components/dashboard/sentiment-chart.tsx - Sentiment Distribution Chart (TUBE-SENTI Theme)
// ==============================================================================

'use client';

import { Statistics } from '@/lib/types';
import { useEffect, useState } from 'react';

interface SentimentChartProps {
  statistics: Statistics;
  commentsAnalyzed: number;
}

export function SentimentChart({ statistics, commentsAnalyzed }: SentimentChartProps) {
  const [animatedValues, setAnimatedValues] = useState({ positive: 0, negative: 0 });
  const total = (statistics.positive ?? 0) + (statistics.negative ?? 0) + (statistics.neutral ?? 0);
  
  // Calculate percentages if not provided
  const calculatePercent = (value: number) => {
    return total > 0 ? (value / total) * 100 : 0;
  };

  const data = [
    {
      name: 'Positive',
      value: statistics.positive ?? 0,
      percent: statistics.positivePercent ?? calculatePercent(statistics.positive ?? 0),
      color: 'bg-primary',
      borderColor: 'border-primary',
      textColor: 'text-primary',
      bgLight: 'bg-primary/10',
    },
    {
      name: 'Negative',
      value: statistics.negative ?? 0,
      percent: statistics.negativePercent ?? calculatePercent(statistics.negative ?? 0),
      color: 'bg-error',
      borderColor: 'border-error',
      textColor: 'text-error',
      bgLight: 'bg-error/10',
    },
  ];

  useEffect(() => {
    // Animate values counting up
    let positiveStart = 0;
    let negativeStart = 0;
    const duration = 1500;
    const positiveIncrement = (statistics.positive ?? 0) / (duration / 16);
    const negativeIncrement = (statistics.negative ?? 0) / (duration / 16);
    
    const timer = setInterval(() => {
      positiveStart += positiveIncrement;
      negativeStart += negativeIncrement;
      
      if (positiveStart >= (statistics.positive ?? 0) && negativeStart >= (statistics.negative ?? 0)) {
        setAnimatedValues({ 
          positive: statistics.positive ?? 0, 
          negative: statistics.negative ?? 0 
        });
        clearInterval(timer);
      } else {
        setAnimatedValues({
          positive: Math.min(Math.floor(positiveStart), statistics.positive ?? 0),
          negative: Math.min(Math.floor(negativeStart), statistics.negative ?? 0),
        });
      }
    }, 16);
    
    return () => clearInterval(timer);
  }, [statistics]);

  return (
    <div className="p-8 h-full flex flex-col bg-surface-container-lowest relative overflow-hidden">
      {/* Subtle background effect */}
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary opacity-[0.02] blur-3xl" />
      
      <div className="relative z-10 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-[9px] uppercase tracking-[0.3em] text-on-surface-variant font-label mb-2">
              Distribution Analysis
            </p>
            <p className="text-2xl font-headline font-bold tracking-tight text-on-surface">
              Sentiment Breakdown
            </p>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-on-surface-variant">
            <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              analytics
            </span>
            <span>{commentsAnalyzed} total</span>
          </div>
        </div>

        {/* Large Horizontal Bar Visualization */}
        <div className="mb-8">
          <div className="flex h-6 overflow-hidden border border-outline-variant/20 relative">
            {data.map((item) => (
              <div
                key={item.name}
                className={`${item.color} transition-all duration-1500 ease-out relative group cursor-pointer hover:opacity-90`}
                style={{ width: `${item.percent}%` }}
              >
                {/* Animated shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                {/* Hover tooltip */}
                {item.percent > 10 && (
                  <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-on-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.percent.toFixed(1)}%
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* Labels under bar */}
          <div className="flex mt-2">
            {data.map((item) => (
              <div
                key={item.name}
                className="transition-all duration-1500"
                style={{ width: `${item.percent}%` }}
              >
                {item.percent > 15 && (
                  <span className={`text-[9px] uppercase tracking-widest font-label ${item.textColor}`}>
                    {item.name}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {data.map((item) => (
            <div
              key={item.name}
              className={`p-5 border ${item.borderColor}/20 ${item.bgLight} transition-all relative overflow-hidden group`}
            >
              {/* Background decoration */}
              <div className={`absolute top-0 right-0 w-16 h-16 ${item.color} opacity-5 transform rotate-12`} />
              
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-2 h-2 ${item.color}`} />
                  <span className="text-[9px] uppercase tracking-widest text-on-surface-variant font-label">
                    {item.name}
                  </span>
                </div>
                
                <div className="flex items-baseline gap-2 mb-2">
                  <p className={`text-4xl font-mono font-bold ${item.textColor} transition-all duration-300 group-hover:scale-105`}>
                    {item.name === 'Positive' ? animatedValues.positive : animatedValues.negative}
                  </p>
                  <span className="text-sm text-on-surface-variant font-mono">comments</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className={`flex-1 h-1 bg-surface-container-highest overflow-hidden`}>
                    <div 
                      className={`h-full ${item.color} transition-all duration-1500`}
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                  <span className={`text-lg font-mono font-bold ${item.textColor}`}>
                    {item.percent.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Confidence Metrics */}
        <div className="mt-auto pt-6 border-t border-outline-variant/20">
          <div className="flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary animate-pulse" />
              <span className="text-on-surface-variant font-label uppercase tracking-widest">
                Classification Model
              </span>
            </div>
            <span className="text-outline-variant font-mono">NAIVE BAYES • BINARY</span>
          </div>
        </div>
      </div>
    </div>
  );
}
