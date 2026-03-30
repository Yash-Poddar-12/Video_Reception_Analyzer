// ==============================================================================
// app/page.tsx - Landing Page
// ==============================================================================

import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { BarChart3, Zap, Shield } from 'lucide-react';
import type { ReactNode } from 'react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-6">
            Understand Your Audience
            <br />
            <span className="text-blue-600">In Seconds</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Tube-Senti uses advanced AI to analyze YouTube comments and give you
            instant insights into how your audience truly feels about your content.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/sign-up">
              <Button size="lg">
                Get Started Free
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button size="lg" variant="outline">
                Sign In
              </Button>
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose Tube-Senti?
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <FeatureCard
              icon={<Zap className="h-8 w-8 text-yellow-500" />}
              title="Real-Time Analysis"
              description="Get sentiment scores in under 5 seconds with our optimized ML pipeline."
            />
            <FeatureCard
              icon={<BarChart3 className="h-8 w-8 text-blue-500" />}
              title="Visual Insights"
              description="Beautiful charts and visualizations make data easy to understand."
            />
            <FeatureCard
              icon={<Shield className="h-8 w-8 text-green-500" />}
              title="Secure & Private"
              description="Your data is never stored. Analysis happens in real-time and is immediately discarded."
            />
          </div>
        </section>
      </main>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
