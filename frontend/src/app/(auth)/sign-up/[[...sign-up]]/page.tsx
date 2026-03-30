// ==============================================================================
// app/(auth)/sign-up/[[...sign-up]]/page.tsx - Sign-Up Page (TUBE-SENTI Theme)
// ==============================================================================

import { SignUp } from '@clerk/nextjs';
import AuthNav from '@/components/AuthNav';

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-background text-on-background font-body relative flex flex-col">

      {/* ── Decorative Background ── */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] opacity-[0.07] bg-[radial-gradient(circle_at_center,#353535_0%,transparent_70%)]" />
      </div>
      <div className="fixed top-0 left-0 w-px h-full bg-gradient-to-b from-transparent via-outline-variant/10 to-transparent pointer-events-none z-0" />
      <div className="fixed top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-outline-variant/10 to-transparent pointer-events-none z-0" />

      {/* ── Shared Nav ── */}
      <AuthNav activePage="sign-up" />

      {/* ── Main Content ── */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-sm">

          {/* Header */}
          <div className="text-center mb-6">
            <span className="text-[9px] uppercase tracking-[0.2em] text-on-surface-variant font-medium font-label block mb-1.5">
              Authentication Layer
            </span>
            <h1 className="text-4xl font-extrabold tracking-tighter text-primary font-headline leading-none">
              Initialize Access
            </h1>
          </div>

          {/* Clerk SignUp */}
          <SignUp
            appearance={{
              layout: { logoPlacement: 'none', socialButtonsVariant: 'blockButton' },
              variables: {
                colorPrimary: '#ffffff',
                colorBackground: '#0e0e0e',
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
                  'w-full !bg-[#0e0e0e]',
                  '!shadow-[0_0_40px_rgba(255,255,255,0.04)]',
                  '!border-[0.5px] !border-[rgba(71,71,71,0.2)] !p-7',
                ].join(' '),
                headerTitle: 'hidden',
                headerSubtitle: 'hidden',
                socialButtonsBlockButton: [
                  '!bg-surface-container !border !border-outline-variant/30',
                  '!text-on-surface !rounded-none hover:!bg-surface-container-low !transition-colors !py-3',
                  '!text-[10px] !uppercase !tracking-widest !font-medium',
                ].join(' '),
                socialButtonsBlockButtonText: '!text-[10px] !uppercase !tracking-widest !font-medium',
                dividerLine: '!bg-outline-variant/20',
                dividerText: '!text-[9px] !uppercase !tracking-widest !text-on-surface-variant',
                formFieldLabel: '!text-[9px] !uppercase !tracking-widest !text-on-surface-variant !font-medium',
                formFieldInput: [
                  '!bg-surface-container-lowest !border-none !outline-none',
                  '!ring-1 !ring-[rgba(71,71,71,0.2)] focus:!ring-[rgba(255,255,255,0.4)]',
                  '!text-on-surface !text-[12px] !tracking-wide !py-3.5 !px-4',
                  '!transition-all placeholder:!text-[#353535]',
                ].join(' '),
                formFieldInputShowPasswordButton: '!text-on-surface-variant hover:!text-primary',
                formFieldHintText: '!text-[9px] !text-on-surface-variant',
                formFieldAction: '!text-[9px] !uppercase !tracking-widest !text-outline hover:!text-primary',
                footerActionLink: '!text-primary !font-bold hover:!underline !underline-offset-2 !text-[10px] !tracking-wide !uppercase',
                footerActionText: '!text-[9px] !uppercase !tracking-widest !text-on-surface-variant',
                formButtonPrimary: [
                  '!bg-primary !text-on-primary !font-bold !font-headline',
                  '!uppercase !tracking-tight !py-4 !w-full',
                  'hover:!scale-[0.98] active:!scale-[0.95] !transition-all !duration-150',
                ].join(' '),
                footer: '!bg-transparent !border-t !border-outline-variant/10 !pt-3',
                footerPages: '!justify-center',
                alert: '!bg-error-container !text-on-error-container !border-none',
                alertText: '!text-[10px]',
              },
            }}
          />
        </div>
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
