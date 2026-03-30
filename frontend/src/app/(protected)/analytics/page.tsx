'use client';

import Image from "next/image";
import { Header } from "@/components/layout/header";

/**
 * Analytics Dashboard Page (TUBE-SENTI Theme)
 * 
 * Displays Power BI embedded dashboard and static R visualizations
 * for sentiment analysis insights.
 */

const VISUALIZATIONS = [
  {
    id: "sentiment_distribution",
    title: "Sentiment Distribution",
    description: "Bar chart showing distribution of positive, negative, and neutral sentiments",
    filename: "sentiment_distribution.png",
    icon: "pie_chart",
  },
  {
    id: "review_length_density",
    title: "Review Length Analysis",
    description: "Density plot showing the distribution of review lengths by sentiment",
    filename: "review_length_density.png",
    icon: "bar_chart",
  },
  {
    id: "correlation_heatmap",
    title: "Feature Correlation",
    description: "Heatmap showing correlations between numerical features",
    filename: "correlation_heatmap.png",
    icon: "grid_view",
  },
  {
    id: "wordcount_boxplot",
    title: "Word Count Distribution",
    description: "Box plot comparing word counts across sentiment categories",
    filename: "wordcount_boxplot.png",
    icon: "chat",
  },
  {
    id: "model_performance",
    title: "Model Performance",
    description: "Confusion matrix and performance metrics for sentiment classification",
    filename: "model_performance.png",
    icon: "trending_up",
  },
];

export default function AnalyticsPage() {
  const powerBIUrl = process.env.NEXT_PUBLIC_POWERBI_EMBED_URL;

  return (
    <div className="min-h-screen bg-background text-on-background font-body relative">
      {/* Decorative Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/3 -right-20 w-96 h-96 bg-primary opacity-[0.015] blur-[120px] rounded-full" />
        <div className="absolute bottom-1/3 -left-20 w-80 h-80 bg-primary opacity-[0.01] blur-[100px] rounded-full" />
      </div>
      <div className="fixed top-0 left-0 w-px h-full bg-gradient-to-b from-transparent via-outline-variant/10 to-transparent pointer-events-none z-0" />
      <div className="fixed top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-outline-variant/10 to-transparent pointer-events-none z-0" />

      <Header />

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-16">
          <span className="inline-block text-[10px] uppercase tracking-[0.3em] font-medium text-on-surface-variant mb-3 font-label">
            Data Visualization Module
          </span>
          <h1 className="text-4xl md:text-5xl font-headline font-extrabold tracking-tighter text-primary mb-4">
            ANALYTICS DASHBOARD
          </h1>
          <p className="text-on-surface-variant max-w-2xl">
            Comprehensive sentiment analysis visualizations and insights powered by R statistical computing and Microsoft Power BI.
          </p>
        </div>

        {/* Power BI Embed Section */}
        <section className="mb-16">
          <div className="border border-outline-variant/20 bg-surface-container-lowest">
            {/* Card Header */}
            <div className="p-6 border-b border-outline-variant/20 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 border border-outline-variant/40 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    globe
                  </span>
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-on-surface font-headline">
                    Interactive Power BI Dashboard
                  </h2>
                  <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-label">
                    {powerBIUrl
                      ? "Drill-down enabled"
                      : "Configuration required"}
                  </p>
                </div>
              </div>
              {powerBIUrl && (
                <a
                  href={powerBIUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-primary hover:opacity-80 transition-opacity"
                >
                  Open in Power BI
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                </a>
              )}
            </div>

            {/* Card Content */}
            <div className="p-6">
              {powerBIUrl ? (
                <div className="w-full aspect-video bg-surface-container overflow-hidden border border-outline-variant/20">
                  <iframe
                    src={powerBIUrl}
                    className="w-full h-full border-0"
                    title="Power BI Dashboard"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="w-full aspect-video bg-surface-container flex flex-col items-center justify-center p-8 text-center border border-outline-variant/20">
                  <div className="w-16 h-16 border border-outline-variant/30 flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-3xl text-outline">globe</span>
                  </div>
                  <h3 className="text-lg font-bold tracking-tight text-on-surface font-headline mb-2">
                    Power BI Not Configured
                  </h3>
                  <p className="text-sm text-on-surface-variant max-w-md mb-6">
                    To enable the interactive dashboard, publish your Power BI report and add the embed URL
                    to your environment configuration.
                  </p>
                  <div className="text-xs text-on-surface-variant bg-surface-container-lowest px-4 py-3 font-mono border border-outline-variant/20">
                    NEXT_PUBLIC_POWERBI_EMBED_URL=your_url_here
                  </div>
                  <p className="text-[10px] uppercase tracking-widest text-outline mt-4 font-label">
                    See RUN-5.md for setup instructions
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Static Visualizations Section */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-2 h-10 bg-primary" />
              <div>
                <h2 className="text-2xl font-headline font-bold tracking-tight text-on-surface">
                  Static Visualizations
                </h2>
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-label">
                  Generated with R • High-resolution PNG
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border border-outline-variant/20">
            {VISUALIZATIONS.map((viz, idx) => (
              <div
                key={viz.id}
                className={`group bg-surface-container-lowest hover:bg-surface-container-low transition-colors ${
                  idx < VISUALIZATIONS.length - 1 ? 'border-b md:border-b lg:border-b-0' : ''
                } ${
                  (idx + 1) % 3 !== 0 ? 'lg:border-r' : ''
                } ${
                  (idx + 1) % 2 !== 0 && idx < VISUALIZATIONS.length - 1 ? 'md:border-r lg:border-r-0' : ''
                } border-outline-variant/20`}
              >
                {/* Card Header */}
                <div className="p-5 border-b border-outline-variant/20">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {viz.icon}
                    </span>
                    <h3 className="text-sm font-bold tracking-tight text-on-surface font-headline">
                      {viz.title}
                    </h3>
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    {viz.description}
                  </p>
                </div>

                {/* Card Content */}
                <div className="p-4">
                  <div className="relative w-full aspect-video bg-surface-container overflow-hidden border border-outline-variant/20 group-hover:border-outline-variant/40 transition-colors">
                    <Image
                      src={`/visuals/${viz.filename}`}
                      alt={viz.title}
                      fill
                      className="object-contain p-2 group-hover:scale-[1.02] transition-transform duration-300"
                      priority={viz.id === "sentiment_distribution"}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `
                            <div class="w-full h-full flex flex-col items-center justify-center text-outline">
                              <span class="material-symbols-outlined text-3xl mb-2">image_not_supported</span>
                              <p class="text-[10px] uppercase tracking-widest">Visualization not found</p>
                              <p class="text-[9px] mt-1 text-outline-variant">Run: bash setup_phase5.sh</p>
                            </div>
                          `;
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Info Section */}
        <section className="border border-outline-variant/20 bg-surface-container-lowest p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 border border-outline-variant/40 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                info
              </span>
            </div>
            <h3 className="text-lg font-bold tracking-tight text-on-surface font-headline">
              About These Visualizations
            </h3>
          </div>

          <div className="space-y-4 text-sm text-on-surface-variant leading-relaxed">
            <p>
              <span className="text-primary font-bold">Static visualizations</span> are generated using R scripts from the training data.
              They provide insights into sentiment distribution, review characteristics, and model performance.
            </p>
            <p>
              <span className="text-primary font-bold">Power BI dashboard</span> offers interactive exploration with filtering, drill-down,
              and real-time data refresh capabilities. Requires Windows and Power BI Desktop for setup.
            </p>
            <div className="pt-4 border-t border-outline-variant/20 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-base">menu_book</span>
              <p className="text-on-surface-variant">
                For setup instructions and R code snippets, see{' '}
                <code className="px-2 py-1 bg-surface-container text-primary font-mono text-xs">RUN-5.md</code>
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
