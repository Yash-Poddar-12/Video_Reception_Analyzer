'use client';

// ==============================================================================
// src/components/layout/footer.tsx - Footer Component
// ==============================================================================

export function Footer() {
  return (
    <footer className="border-t bg-white/80 py-6">
      <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
        <p className="text-sm text-gray-500">
          © {new Date().getFullYear()} Tube-Senti. All rights reserved.
        </p>
        <p className="text-xs text-gray-400">
          Powered by Naive Bayes sentiment analysis
        </p>
      </div>
    </footer>
  );
}
