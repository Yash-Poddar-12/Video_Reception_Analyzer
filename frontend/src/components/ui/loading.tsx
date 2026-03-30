// ==============================================================================
// components/ui/loading.tsx - Loading Spinner Component (TUBE-SENTI Theme)
// ==============================================================================

import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingSpinner({ className, size = 'md' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-2',
  };

  return (
    <div
      className={cn(
        'rounded-full border-on-surface-variant/30 border-t-primary animate-spin',
        sizeClasses[size],
        className
      )}
    />
  );
}

interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message = 'Loading...' }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="border border-outline-variant/20 bg-surface-container-lowest p-12 flex flex-col items-center gap-8 shadow-[0_0_60px_rgba(255,255,255,0.03)] min-w-[400px]">
        {/* Animated spinner with rotating border */}
        <div className="relative w-20 h-20">
          {/* Outer border frame */}
          <div className="absolute inset-0 border border-outline-variant/30" />
          {/* Rotating border */}
          <div className="absolute inset-0 border-2 border-transparent border-t-primary animate-spin" style={{ borderRadius: 0 }} />
          {/* Inner pulsing dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 bg-primary animate-pulse" />
          </div>
        </div>
        
        {/* Message */}
        <div className="text-center space-y-2">
          <p className="text-sm font-bold uppercase tracking-widest text-on-surface">
            {message}
          </p>
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-label">
            Please wait...
          </p>
        </div>

        {/* Terminal-style progress indicators */}
        <div className="w-full space-y-1 font-mono text-[10px] text-on-surface-variant">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-primary animate-pulse" />
            <span>&gt; Fetching comment stream...</span>
          </div>
          <div className="flex items-center gap-2 opacity-60">
            <div className="w-1.5 h-1.5 bg-outline-variant" />
            <span>&gt; Preprocessing tokens...</span>
          </div>
          <div className="flex items-center gap-2 opacity-40">
            <div className="w-1.5 h-1.5 bg-outline-variant" />
            <span>&gt; Running Naive Bayes classifier...</span>
          </div>
        </div>
      </div>
    </div>
  );
}
