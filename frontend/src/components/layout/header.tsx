// ==============================================================================
// components/layout/header.tsx - Header Component (TUBE-SENTI Theme)
// ==============================================================================

'use client';

import Link from 'next/link';
import { useAuth, UserButton } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';

export function Header() {
  const { isSignedIn } = useAuth();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 h-16 bg-background/90 backdrop-blur-xl border-b border-outline-variant/10">
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-5 h-5 bg-primary flex items-center justify-center">
            <div className="w-2.5 h-2.5 border-2 border-on-primary" />
          </div>
          <span className="text-base font-bold tracking-tighter text-primary font-headline uppercase">
            Tube-Senti
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-6">
          {isSignedIn ? (
            <>
              <Link
                href="/dashboard"
                className={`text-[11px] font-label uppercase tracking-widest transition-colors ${
                  pathname === '/dashboard'
                    ? 'text-primary font-bold'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/analytics"
                className={`text-[11px] font-label uppercase tracking-widest transition-colors ${
                  pathname === '/analytics'
                    ? 'text-primary font-bold'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
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
            <>
              <Link
                href="/sign-in"
                className="text-[11px] font-label uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="px-5 py-1.5 text-[11px] font-bold uppercase tracking-widest bg-primary text-on-primary hover:opacity-90 transition-all"
              >
                Get Started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
