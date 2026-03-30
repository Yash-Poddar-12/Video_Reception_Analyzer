// ==============================================================================
// components/layout/header.tsx - Header Component
// ==============================================================================

'use client';

import Link from 'next/link';
import { useAuth, UserButton } from '@clerk/nextjs';
import { BarChart3, LineChart } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  const { isSignedIn } = useAuth();

  return (
    <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
          <BarChart3 className="h-6 w-6 text-blue-600" />
          <span className="font-bold text-xl text-gray-900">Tube-Senti</span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center space-x-4">
          {isSignedIn ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <Link href="/analytics">
                <Button variant="ghost" className="flex items-center gap-2">
                  <LineChart className="h-4 w-4" />
                  Analytics
                </Button>
              </Link>
              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: 'h-10 w-10',
                  },
                }}
              />
            </>
          ) : (
            <>
              <Link href="/sign-in">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/sign-up">
                <Button>Get Started</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
