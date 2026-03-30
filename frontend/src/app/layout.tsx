// ==============================================================================
// app/layout.tsx - Root Layout with Clerk Provider (TUBE-SENTI Theme)
// ==============================================================================

import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

export const metadata: Metadata = {
  title: 'TUBE-SENTI | Clinical Sentiment Analysis',
  description: 'Real-time YouTube sentiment extraction utilizing Naive Bayes machine learning models. Transform chaotic comment streams into structured probabilistic data with clinical precision.',
  keywords: ['YouTube', 'sentiment analysis', 'Naive Bayes', 'machine learning', 'video analytics'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Manrope:wght@700;800&family=Inter:wght@400;500;600&family=Roboto+Mono:wght@400;500&display=swap"
            rel="stylesheet"
          />
          <link
            href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,300,0,0&display=swap"
            rel="stylesheet"
          />
        </head>
        <body className="bg-background text-on-background font-body">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
