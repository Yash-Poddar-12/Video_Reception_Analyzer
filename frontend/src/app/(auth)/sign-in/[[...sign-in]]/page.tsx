// ==============================================================================
// src/app/(auth)/sign-in/[[...sign-in]]/page.tsx - Sign In Page
// ==============================================================================

import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg">
      <SignIn />
    </div>
  );
}
