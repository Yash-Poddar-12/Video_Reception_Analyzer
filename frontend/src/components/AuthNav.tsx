// ==============================================================================
// components/AuthNav.tsx - Shared navigation with Clerk auth gating
// ==============================================================================

import { auth } from '@clerk/nextjs/server';
import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';

interface AuthNavProps {
  activePage?: 'sign-in' | 'sign-up' | 'home';
}

export default async function AuthNav({ activePage }: AuthNavProps) {
  const { userId } = await auth();
  const isSignedIn = !!userId;

  return (
    <nav className="relative z-50 h-16 bg-background/90 backdrop-blur-xl flex justify-between items-center px-8 border-b border-outline-variant/10 shrink-0">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2">
        <div className="w-5 h-5 bg-primary flex items-center justify-center">
          <div className="w-2.5 h-2.5 border-2 border-on-primary" />
        </div>
        <span className="text-base font-bold tracking-tighter text-primary font-headline uppercase">
          Tube-Senti
        </span>
      </Link>

      {/* Right side */}
      <div className="flex items-center gap-6">
        {isSignedIn ? (
          /* ── Signed In: show app links + avatar ── */
          <>
            <Link
              href="/dashboard"
              className="text-on-surface-variant hover:text-primary transition-colors text-[11px] font-label uppercase tracking-widest"
            >
              Dashboard
            </Link>
            <Link
              href="/analytics"
              className="text-on-surface-variant hover:text-primary transition-colors text-[11px] font-label uppercase tracking-widest"
            >
              Analytics
            </Link>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: 'w-7 h-7 ring-1 ring-outline-variant/40',
                  userButtonPopoverCard: '!bg-surface-container-low !border !border-outline-variant/20 !shadow-2xl',
                  userButtonPopoverActionButton: '!text-on-surface hover:!bg-surface-container',
                  userButtonPopoverActionButtonText: '!text-[11px] !uppercase !tracking-widest !font-label',
                  userButtonPopoverFooter: '!hidden',
                },
              }}
            />
          </>
        ) : (
          /* ── Signed Out: show sign-in / sign-up ── */
          <>
            <Link
              href="/sign-in"
              className={`text-[11px] font-label uppercase tracking-widest transition-colors ${
                activePage === 'sign-in'
                  ? 'text-primary font-bold'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className={`px-5 py-1.5 text-[11px] font-bold uppercase tracking-widest transition-all duration-200 hover:opacity-90 ${
                activePage === 'sign-up'
                  ? 'bg-on-surface-variant text-on-surface'
                  : 'bg-primary text-on-primary'
              }`}
            >
              Get Started
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
