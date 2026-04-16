// ==============================================================================
// app/(auth)/sign-in/[[...sign-in]]/page.tsx - Sign-In Page (TUBE-SENTI Theme)
// ==============================================================================

import { SignIn } from '@clerk/nextjs';
import AuthNav from '@/components/AuthNav';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-background text-on-background font-body relative flex flex-col">

      {/* ── Decorative Background ── */}
      {/* Ambient orbs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary opacity-[0.02] blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-primary opacity-[0.01] blur-[100px] rounded-full pointer-events-none" />
      {/* Vertical edge lines */}
      <div className="fixed top-0 left-0 w-px h-full bg-gradient-to-b from-transparent via-outline-variant/10 to-transparent pointer-events-none z-0" />
      <div className="fixed top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-outline-variant/10 to-transparent pointer-events-none z-0" />
      {/* Obsidian crystal overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-10 z-0 mix-blend-overlay">
        <div
          className="absolute inset-0 bg-cover bg-center grayscale"
          style={{
            backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuB4sAEB3uX9q-ZFFKmQ6-we90SE-dDf7P-JmtmG8ezkeWlrsoH9cFGw9pX_K7Df9kNAvzHFw_xnrGnzGbJNAPvQ8pyaoBGmSjzB5qO5WiV3Qdf5kcrl6bCJd0mmTbFGAoxBxvkN0Pt6Usi9QjfPTrBzhj9aDW8YTLJqADsVPqEUtQghIGL761H7JZLn-ZBClDXpW3untA_mDoJJL8mXpDRgdpWRJFTC8HrCj4DJ66bEcs78pEqiJuqIy7Zu7IOXvdbJONU8wbJeH7zV')`,
          }}
          aria-hidden="true"
        />
      </div>

      {/* ── Shared Nav ── */}
      <AuthNav activePage="sign-in" />

      {/* ── Main Content ── */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-8">
        <section className="w-full max-w-sm">

          {/* Header */}
          <div className="mb-6 text-left">
            <span className="text-[9px] uppercase tracking-[0.3em] font-medium text-on-surface-variant mb-2 block font-label">
              Authentication Protocol
            </span>
            <h1 className="text-4xl font-extrabold tracking-tighter text-primary font-headline leading-none">
              Access <br />Neural Node
            </h1>
          </div>

          {/* Clerk SignIn */}
          <SignIn
            appearance={{
              layout: { logoPlacement: 'none', socialButtonsVariant: 'blockButton' },
              variables: {
                colorPrimary: '#ffffff',
                colorBackground: 'rgba(30,30,30,0.65)',
                colorInputBackground: '#0e0e0e',
                colorInputText: '#e2e2e2',
                colorText: '#e2e2e2',
                colorTextSecondary: '#c6c6c6',
                colorDanger: '#ffb4ab',
                borderRadius: '0rem',
                fontFamily: 'Inter, sans-serif',
                fontSize: '12px',
                spacingUnit: '12px',
              },
              elements: {
                rootBox: 'w-full',
                card: [
                  'w-full !bg-[rgba(30,30,30,0.65)] backdrop-blur-xl',
                  '!shadow-[0_0_40px_rgba(255,255,255,0.04)]',
                  '!border !border-[rgba(71,71,71,0.2)] !p-7',
                ].join(' '),
                headerTitle: 'hidden',
                headerSubtitle: 'hidden',
                socialButtonsBlockButton: [
                  '!bg-surface-container-lowest !border !border-outline-variant/30',
                  '!text-on-surface !rounded-none hover:!bg-surface-container-low !transition-colors !py-3',
                  '!text-[10px] !uppercase !tracking-widest !font-medium',
                ].join(' '),
                socialButtonsBlockButtonText: '!text-[10px] !uppercase !tracking-widest !font-medium',
                dividerLine: '!bg-outline-variant/20',
                dividerText: '!text-[9px] !uppercase !tracking-widest !text-on-surface-variant',
                formFieldLabel: '!text-[9px] !uppercase !tracking-widest !text-on-surface-variant !font-medium',
                formFieldInput: [
                  '!bg-surface-container-lowest !border-none !outline-none',
                  '!ring-1 !ring-[rgba(71,71,71,0.3)] focus:!ring-[rgba(255,255,255,0.35)]',
                  '!text-on-surface !text-[12px] !tracking-wide !py-3.5 !px-4',
                  '!transition-all placeholder:!text-[#474747]',
                ].join(' '),
                formFieldInputShowPasswordButton: '!text-on-surface-variant hover:!text-primary',
                formFieldHintText: '!text-[9px] !text-on-surface-variant',
                formFieldAction: '!text-[9px] !uppercase !tracking-widest !text-outline hover:!text-primary',
                footerActionLink: '!text-primary !font-bold hover:!underline !underline-offset-2 !text-[10px] !tracking-wide !uppercase',
                footerActionText: '!text-[9px] !uppercase !tracking-widest !text-on-surface-variant',
                formButtonPrimary: [
                  '!bg-primary !text-on-primary !font-bold',
                  '!uppercase !tracking-[0.15em] !text-[10px] !py-4',
                  'hover:!bg-on-surface-variant !transition-colors !w-full',
                ].join(' '),
                footer: '!bg-transparent !border-t !border-outline-variant/10 !pt-3',
                footerPages: '!justify-center',
                alert: '!bg-error-container !text-on-error-container !border-none',
                alertText: '!text-[10px]',
                identityPreviewText: '!text-on-surface !text-sm',
                identityPreviewEditButton: '!text-primary',
              },
            }}
          />

          {/* Status strip */}
          <div className="mt-5 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              <span className="text-[8px] uppercase tracking-widest text-outline font-label">System Online</span>
            </div>
            <span className="text-[8px] uppercase tracking-widest text-outline font-label">v2.0.4 — Clinical Build</span>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-50 h-14 bg-surface-container-lowest shrink-0 flex justify-between items-center px-8 border-t border-outline-variant/10">
        <p className="text-[9px] uppercase tracking-widest font-medium text-outline-variant">
          © 2024 Tube-Senti. Clinical Precision.
        </p>
        <div className="flex gap-8">
          {['Privacy', 'Terms', 'Security'].map(l => (
            <a key={l} href="#" className="text-[9px] uppercase tracking-widest font-medium text-outline-variant hover:text-primary transition-colors">{l}</a>
          ))}
        </div>
      </footer>
    </div>
  );
}
