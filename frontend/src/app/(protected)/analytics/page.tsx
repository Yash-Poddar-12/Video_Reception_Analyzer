'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, BarChart3, PieChart, TrendingUp, MessageCircle, Activity, Globe } from "lucide-react";
import Image from "next/image";

/**
 * Analytics Dashboard Page
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
    icon: PieChart,
  },
  {
    id: "review_length_density",
    title: "Review Length Analysis",
    description: "Density plot showing the distribution of review lengths by sentiment",
    filename: "review_length_density.png",
    icon: BarChart3,
  },
  {
    id: "correlation_heatmap",
    title: "Feature Correlation",
    description: "Heatmap showing correlations between numerical features",
    filename: "correlation_heatmap.png",
    icon: Activity,
  },
  {
    id: "wordcount_boxplot",
    title: "Word Count Distribution",
    description: "Box plot comparing word counts across sentiment categories",
    filename: "wordcount_boxplot.png",
    icon: MessageCircle,
  },
  {
    id: "model_performance",
    title: "Model Performance",
    description: "Confusion matrix and performance metrics for sentiment classification",
    filename: "model_performance.png",
    icon: TrendingUp,
  },
];

export default function AnalyticsPage() {
  const powerBIUrl = process.env.NEXT_PUBLIC_POWERBI_EMBED_URL;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
            Analytics Dashboard
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Comprehensive sentiment analysis visualizations and insights powered by R and Power BI
          </p>
        </div>

        {/* Power BI Embed Section */}
        <Card className="shadow-lg border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-6 w-6" />
                  Interactive Power BI Dashboard
                </CardTitle>
                <CardDescription className="mt-2">
                  {powerBIUrl
                    ? "Explore interactive visualizations with drill-down capabilities"
                    : "Configure Power BI to enable interactive analytics"}
                </CardDescription>
              </div>
              {powerBIUrl && (
                <a
                  href={powerBIUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                >
                  Open in Power BI
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {powerBIUrl ? (
              <div className="w-full aspect-video bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden shadow-inner">
                <iframe
                  src={powerBIUrl}
                  className="w-full h-full border-0"
                  title="Power BI Dashboard"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="w-full aspect-video bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-lg flex flex-col items-center justify-center p-8 text-center">
                <Globe className="h-16 w-16 text-slate-400 dark:text-slate-500 mb-4" />
                <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">
                  Power BI Not Configured
                </h3>
                <p className="text-slate-600 dark:text-slate-300 max-w-md mb-4">
                  To enable the interactive dashboard, publish your Power BI report and add the embed URL
                  to your environment configuration.
                </p>
                <div className="text-sm text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-4 py-2 rounded font-mono">
                  NEXT_PUBLIC_POWERBI_EMBED_URL=your_url_here
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
                  See RUN-5.md for detailed setup instructions
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Static Visualizations Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Static Visualizations
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Generated with R • High-resolution PNG
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {VISUALIZATIONS.map((viz) => {
              const Icon = viz.icon;
              return (
                <Card
                  key={viz.id}
                  className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-blue-200 dark:hover:border-blue-700"
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      {viz.title}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {viz.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative w-full aspect-video bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden shadow-md">
                      <Image
                        src={`/visuals/${viz.filename}`}
                        alt={viz.title}
                        fill
                        className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                        priority={viz.id === "sentiment_distribution"}
                        onError={(e) => {
                          // Fallback for missing images
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `
                              <div class="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                                <svg class="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p class="text-sm">Visualization not found</p>
                                <p class="text-xs mt-1">Run: bash setup_phase5.sh</p>
                              </div>
                            `;
                          }
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Info Section */}
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-blue-900 dark:text-blue-100">
              About These Visualizations
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
            <p>
              <strong>Static visualizations</strong> are generated using R scripts from the training data.
              They provide insights into sentiment distribution, review characteristics, and model performance.
            </p>
            <p>
              <strong>Power BI dashboard</strong> offers interactive exploration with filtering, drill-down,
              and real-time data refresh capabilities. Requires Windows and Power BI Desktop for setup.
            </p>
            <p className="pt-2 border-t border-blue-200 dark:border-blue-700">
              📖 For setup instructions and R code snippets, see <code className="px-2 py-1 bg-white dark:bg-slate-800 rounded">RUN-5.md</code>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
