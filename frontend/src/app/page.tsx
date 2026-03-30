// ==============================================================================
// app/page.tsx - Landing Page (TUBE-SENTI Theme)
// ==============================================================================

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="bg-background text-on-background font-body min-h-screen">

      {/* ── TopAppBar ── */}
      <header className="fixed top-0 w-full z-50 bg-background/40 backdrop-blur-xl border-b border-outline-variant/20 shadow-[0_0_40px_rgba(255,255,255,0.04)]">
        <nav className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary flex items-center justify-center">
              <div className="w-3 h-3 border-2 border-on-primary" />
            </div>
            <span className="text-xl font-bold tracking-tighter text-primary font-headline">
              TUBE-SENTI
            </span>
          </div>

          {/* Nav actions */}
          <div className="flex items-center gap-8">
            <Link
              href="/sign-in"
              className="text-[12px] uppercase tracking-widest font-medium text-on-surface-variant hover:text-primary transition-colors duration-300"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="bg-primary text-on-primary px-5 py-2 text-[12px] uppercase tracking-widest font-bold scale-95 hover:scale-100 transition-transform duration-200"
            >
              Sign Up
            </Link>
          </div>
        </nav>
      </header>

      <main className="pt-24">

        {/* ── Hero Section ── */}
        <section className="relative min-h-[921px] flex flex-col items-start justify-center px-6 max-w-7xl mx-auto overflow-hidden">
          {/* Copy */}
          <div className="z-10 w-full md:w-2/3 mt-20">
            <span className="inline-block px-3 py-1 mb-6 border border-outline-variant/30 text-[10px] tracking-[0.2em] uppercase font-medium text-on-surface-variant">
              Clinical Sentiment Engine v1.0.4
            </span>

            <h1 className="text-6xl md:text-8xl font-headline font-extrabold tracking-tighter leading-[0.9] text-primary mb-8">
              FROM DIGITAL NOISE <br />
              TO{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-on-surface-variant">
                ALGORITH SIGNAL
              </span>
            </h1>

            <p className="text-lg md:text-xl text-on-surface-variant max-w-xl mb-12 leading-relaxed">
              Real-time YouTube sentiment extraction utilizing Naive Bayes machine learning
              models. Transform chaotic comment streams into structured probabilistic data
              with clinical precision.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/sign-up"
                className="bg-primary text-on-primary px-8 py-4 font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-opacity"
              >
                Initialize Engine
              </Link>
              <a
                href="#features"
                className="border border-outline-variant/40 text-primary px-8 py-4 font-bold uppercase tracking-widest text-sm hover:bg-surface-container-low transition-colors"
              >
                View Documentation
              </a>
            </div>
          </div>

          {/* Visual: Sentiment Distribution Widget */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-full md:w-1/2 h-[600px] pointer-events-none opacity-40 md:opacity-100 flex items-center justify-center">
            <div className="relative w-[500px] h-[500px] border border-outline-variant/20 p-8 flex flex-col justify-between bg-surface-container-lowest shadow-[0_0_100px_rgba(255,255,255,0.02)]">

              {/* Header row */}
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">
                    Model Confidence
                  </p>
                  <p className="text-3xl font-headline font-bold">98.42%</p>
                </div>
                <span className="material-symbols-outlined text-primary scale-125">analytics</span>
              </div>

              {/* Terminal Output Mockup */}
              <div className="font-mono text-[11px] space-y-2 opacity-80 border-l border-outline-variant/40 pl-4 py-4">
                <p className="text-on-surface-variant">&gt; Fetching API_V3_YOUTUBE...</p>
                <p className="text-primary">&gt; Processed 4,209 tokens</p>
                <p className="text-primary">
                  &gt; Classification:{' '}
                  <span className="bg-primary text-on-primary px-1">POSITIVE</span> (0.892)
                </p>
                <p className="text-on-surface-variant">&gt; Recalibrating Naive Bayes priors...</p>
                <p className="text-primary">&gt; Delta: -0.0021ms</p>
              </div>

              {/* Bar Chart */}
              <div className="grid grid-cols-12 gap-1 items-end h-24">
                {[20, 40, 35, 85, 100, 90, 60, 45, 30, 25, 15, 10].map((h, i) => (
                  <div
                    key={i}
                    className={`w-full transition-all ${
                      h >= 85 ? 'bg-primary' : 'bg-surface-container-highest'
                    }`}
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Features Grid ── */}
        <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
          <div className="mb-20 space-y-4">
            <h2 className="text-[10px] uppercase tracking-[0.4em] font-medium text-on-surface-variant border-l-2 border-primary pl-4">
              Core Infrastructure
            </h2>
            <h3 className="text-4xl font-headline font-bold tracking-tight">
              Technical Specifications
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-outline-variant/20">
            {features.map((feat, idx) => (
              <div
                key={feat.title}
                className={`group p-10 hover:bg-surface-container-low transition-colors duration-500 ${
                  idx < 2 ? 'border-b md:border-b-0 md:border-r border-outline-variant/20' : ''
                }`}
              >
                <div className="mb-12 text-primary">
                  <span
                    className="material-symbols-outlined text-4xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {feat.icon}
                  </span>
                </div>
                <h4 className="text-xl font-bold mb-4 tracking-tight">{feat.title}</h4>
                <p className="text-on-surface-variant text-sm leading-relaxed mb-8">
                  {feat.description}
                </p>
                <div className="w-full h-[1px] bg-outline-variant/20 group-hover:bg-primary transition-colors" />
              </div>
            ))}
          </div>
        </section>

        {/* ── Real-Time Telemetry Section ── */}
        <section className="py-24 bg-surface-container-lowest">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            {/* Left text */}
            <div>
              <h2 className="text-5xl font-headline font-extrabold tracking-tighter mb-8">
                REAL-TIME <br /> TELEMETRY
              </h2>
              <p className="text-on-surface-variant mb-12">
                Our engine processes live interactions as they occur. By using a
                Clinically-Tuned Naive Bayes model, we remove the bias often found in
                generic LLM sentiment analysis.
              </p>
              <ul className="space-y-6">
                {telemetryStats.map((stat) => (
                  <li key={stat} className="flex items-center gap-4 group">
                    <span className="w-12 h-[1px] bg-outline group-hover:w-16 group-hover:bg-primary transition-all" />
                    <span className="text-[12px] uppercase tracking-widest font-bold">{stat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: Mock dashboard panel */}
            <div className="relative aspect-square border border-outline-variant/20 p-4 bg-background overflow-hidden">
              {/* Simulated chart grid */}
              <div className="w-full h-full flex flex-col justify-between p-4">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">
                      Live Stream
                    </p>
                    <p className="font-mono text-lg">YT_COMMENTS_FEED</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">
                      Throughput
                    </p>
                    <p className="font-mono text-lg text-primary">2,847 / min</p>
                  </div>
                </div>

                {/* Fake area chart lines */}
                <div className="flex-1 relative border-b border-l border-outline-variant/30 mb-2">
                  <svg className="w-full h-full" viewBox="0 0 100 60" preserveAspectRatio="none">
                    <polyline
                      points="0,50 10,42 20,38 30,20 40,15 50,22 60,12 70,8 80,14 90,6 100,10"
                      fill="none"
                      stroke="rgba(255,255,255,0.7)"
                      strokeWidth="0.8"
                    />
                    <polyline
                      points="0,55 10,52 20,48 30,45 40,50 50,42 60,46 70,40 80,43 90,38 100,41"
                      fill="none"
                      stroke="rgba(180,180,180,0.4)"
                      strokeWidth="0.6"
                      strokeDasharray="2 1"
                    />
                    <polygon
                      points="0,50 10,42 20,38 30,20 40,15 50,22 60,12 70,8 80,14 90,6 100,10 100,60 0,60"
                      fill="rgba(255,255,255,0.04)"
                    />
                  </svg>
                </div>

                {/* X axis labels */}
                <div className="flex justify-between px-1">
                  {['0s', '10s', '20s', '30s', '40s', '50s', '60s'].map((l) => (
                    <span key={l} className="text-[8px] font-mono text-on-surface-variant">{l}</span>
                  ))}
                </div>
              </div>

              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent pointer-events-none" />

              {/* Info card overlay */}
              <div className="absolute bottom-8 left-8 right-8 p-6 glass-panel border border-outline-variant/20">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">
                      Current Stream
                    </p>
                    <p className="font-mono text-lg">ID: 0x9482_ALPHA</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">
                      Status
                    </p>
                    <p className="font-mono text-lg text-primary">ACTIVE</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats Bar ── */}
        <section className="border-y border-outline-variant/20 py-12 px-6">
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-3xl md:text-4xl font-headline font-extrabold tracking-tighter mb-1">
                  {s.value}
                </p>
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA Section ── */}
        <section className="py-40 px-6 text-center max-w-4xl mx-auto">
          <h2 className="text-5xl md:text-7xl font-headline font-extrabold tracking-tighter mb-12">
            DECODE THE CHATTER
          </h2>
          <p className="text-on-surface-variant text-lg mb-12 max-w-2xl mx-auto">
            Ready to deploy clinical sentiment analysis to your YouTube workflow? Initialize
            the engine and begin extracting actionable signal today.
          </p>
          <div className="flex justify-center gap-6 flex-wrap">
            <Link
              href="/sign-up"
              className="bg-primary text-on-primary px-12 py-5 font-bold uppercase tracking-widest text-sm hover:invert transition-all"
            >
              Start Analysis
            </Link>
            <Link
              href="/sign-in"
              className="border border-outline-variant/40 text-primary px-12 py-5 font-bold uppercase tracking-widest text-sm hover:bg-surface-container-low transition-colors"
            >
              Sign In
            </Link>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="w-full border-t border-outline-variant/20 bg-surface-container-lowest">
        <div className="flex flex-col md:flex-row justify-between items-center px-8 py-12 w-full max-w-7xl mx-auto gap-6">
          <div className="flex flex-col gap-2 items-center md:items-start">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 bg-primary flex items-center justify-center">
                <div className="w-2.5 h-2.5 border-2 border-on-primary" />
              </div>
              <span className="text-sm font-bold tracking-tighter text-primary font-headline">
                TUBE-SENTI
              </span>
            </div>
            <p className="text-[10px] uppercase tracking-widest font-medium text-on-surface-variant">
              © 2024 TUBE-SENTI. Clinical Precision in Sentiment Analysis.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-8">
            {footerLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-[10px] uppercase tracking-widest font-medium text-on-surface-variant hover:text-primary transition-colors duration-300"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── Data ─────────────────────────────────────────────────────────────────────

const features = [
  {
    icon: 'neurology',
    title: 'Naive Bayes ML',
    description:
      'High-speed probabilistic classification model optimized for short-form text and social nomenclature. Precise linguistic tokenization.',
  },
  {
    icon: 'api',
    title: 'YouTube V3 Integration',
    description:
      'Direct authenticated pipeline to the YouTube Data API. Seamless comment thread extraction across infinite video parameters.',
  },
  {
    icon: 'dashboard',
    title: 'Power BI Ecosystem',
    description:
      'Native export capabilities for enterprise-grade visualization. Connect raw sentiment scores directly to your Power BI workspace.',
  },
];

const telemetryStats = ['Latency < 50ms', 'Scalable Cluster Support', 'Regex Filtering Engine'];

const stats = [
  { value: '98.4%', label: 'Model Accuracy' },
  { value: '<50ms', label: 'Avg Latency' },
  { value: '4.2M+', label: 'Comments Analyzed' },
  { value: '12K+', label: 'Active Users' },
];

const footerLinks = [
  { label: 'Documentation', href: '#' },
  { label: 'Naive Bayes Model', href: '#' },
  { label: 'API', href: '#' },
  { label: 'Terms of Service', href: '#' },
  { label: 'Privacy Policy', href: '#' },
];
