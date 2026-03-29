'use client';

// ==============================================================================
// src/components/auth/user-button.tsx - User Button Wrapper
// ==============================================================================

import { UserButton as ClerkUserButton } from '@clerk/nextjs';

export function UserButton() {
  return <ClerkUserButton afterSignOutUrl="/" />;
}
