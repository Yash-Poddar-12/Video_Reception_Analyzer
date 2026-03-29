'use client';

// ==============================================================================
// src/app/(protected)/analytics/page.tsx - Power BI Dashboard Embed
// ==============================================================================

import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, ExternalLink, TrendingUp, PieChart, Activity } from 'lucide-react';

const POWERBI_EMBED_URL = process.env.NEXT_PUBLIC_POWERBI_EMBED_URL;

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen gradient-bg">
      <Header />

      <main className="container py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Advanced Analytics
          </h1>
          <p className="text-gray-600">
            Deep dive into sentiment patterns and model performance metrics
          </p>
        </div>

        {/* Power BI Dashboard Embed */}
        <Card className="overflow-hidden mb-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <CardTitle>Interactive Dashboard</CardTitle>
            </div>
            {POWERBI_EMBED_URL && (
              <a
                href={POWERBI_EMBED_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-sm text-primary hover:underline"
              >
                Open in Power BI
                <ExternalLink className="h-4 w-4 ml-1" />
              </a>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {POWERBI_EMBED_URL ? (
              <div className="aspect-video w-full">
                <iframe
                  title="Tube-Senti Analytics Dashboard"
                  src={POWERBI_EMBED_URL}
                  className="w-full h-full border-0"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="p-12 text-center text-gray-500">
                <BarChart3 className="h-20 w-20 mx-auto mb-4 opacity-30" />
                <h3 className="text-lg font-semibold mb-2">
                  Power BI Dashboard Not Configured
                </h3>
                <p className="text-sm mb-4 max-w-md mx-auto">
                  To enable the interactive dashboard, publish your Power BI
                  report and set the embed URL in your environment variables.
                </p>
                <div className="bg-gray-100 rounded-lg p-4 max-w-xl mx-auto text-left">
                  <p className="text-xs font-mono mb-2">
                    NEXT_PUBLIC_POWERBI_EMBED_URL=https://app.powerbi.com/...
                  </p>
                  <p className="text-xs text-gray-600">
                    See <strong>RUN-5.md</strong> for detailed setup
                    instructions
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Static Visualization Gallery */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Visualization Gallery
          </h2>
          <p className="text-gray-600 mb-6">
            Static visualizations generated from exploratory data analysis
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <VisualizationCard
            title="Sentiment Distribution"
            description="Class balance of positive vs negative reviews"
            image="/visuals/sentiment_distribution.png"
            icon={<PieChart className="h-5 w-5" />}
          />
          <VisualizationCard
            title="Review Length Density"
            description="Character count distribution by sentiment"
            image="/visuals/review_length_density.png"
            icon={<TrendingUp className="h-5 w-5" />}
          />
          <VisualizationCard
            title="Positive Word Cloud"
            description="Top 100 most frequent positive terms"
            image="/visuals/wordcloud_positive.png"
            icon={<Activity className="h-5 w-5" />}
          />
          <VisualizationCard
            title="Negative Word Cloud"
            description="Top 100 most frequent negative terms"
            image="/visuals/wordcloud_negative.png"
            icon={<Activity className="h-5 w-5" />}
          />
          <VisualizationCard
            title="Word Count Distribution"
            description="Box plot comparison by sentiment"
            image="/visuals/wordcount_boxplot.png"
            icon={<BarChart3 className="h-5 w-5" />}
          />
          <VisualizationCard
            title="Top Terms Analysis"
            description="20 most frequent terms across dataset"
            image="/visuals/top_terms_barchart.png"
            icon={<BarChart3 className="h-5 w-5" />}
          />
          <VisualizationCard
            title="Correlation Heatmap"
            description="Feature correlation matrix"
            image="/visuals/correlation_heatmap.png"
            icon={<Activity className="h-5 w-5" />}
          />
          <VisualizationCard
            title="Model Performance"
            description="Naive Bayes accuracy and F1-score"
            image="/visuals/model_performance.png"
            icon={<TrendingUp className="h-5 w-5" />}
          />
          <VisualizationCard
            title="Confusion Matrix"
            description="Model prediction accuracy breakdown"
            image="/visuals/confusion_matrix.png"
            icon={<BarChart3 className="h-5 w-5" />}
          />
        </div>

        {/* Info Section */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <BarChart3 className="h-6 w-6 text-blue-600 mt-1" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">
                  About These Visualizations
                </h3>
                <p className="text-sm text-blue-800 mb-3">
                  These charts are generated from the training dataset (50,000+
                  movie reviews) and provide insights into the model's behavior
                  and the underlying data patterns.
                </p>
                <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                  <li>
                    <strong>Word Clouds:</strong> Show the most influential
                    terms for each sentiment
                  </li>
                  <li>
                    <strong>Distribution Plots:</strong> Reveal data balance and
                    review characteristics
                  </li>
                  <li>
                    <strong>Performance Metrics:</strong> Model accuracy on test
                    set (85-88%)
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

interface VisualizationCardProps {
  title: string;
  description: string;
  image: string;
  icon: React.ReactNode;
}

function VisualizationCard({
  title,
  description,
  image,
  icon,
}: VisualizationCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-2 mb-2">
          <div className="text-primary">{icon}</div>
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
        <p className="text-xs text-gray-600">{description}</p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative overflow-hidden bg-gray-100">
          <img
            src={image}
            alt={title}
            className="w-full h-48 object-contain p-2 group-hover:scale-105 transition-transform duration-200"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src =
                'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f1f5f9" width="400" height="300"/%3E%3Ctext fill="%23cbd5e1" font-family="sans-serif" font-size="18" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EVisualization Pending%3C/text%3E%3C/svg%3E';
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
