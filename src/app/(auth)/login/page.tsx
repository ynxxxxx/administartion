'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase/client';
import { Terminal, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg('');

    try {
      // 1. Firebase Google Sign-In Popup (instant, zero complex redirects)
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const email = (user.email || '').toLowerCase().trim();

      // 2. Enforce Gmail
      if (!email.endsWith('@gmail.com') && !email.endsWith('@googlemail.com')) {
        await auth.signOut();
        setErrorMsg('Access denied: Only Google staff accounts (@gmail.com) are permitted.');
        setIsLoading(false);
        return;
      }

      // 3. Obtain Firebase ID token and establish secure staff session
      const idToken = await user.getIdToken();
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          uid: user.uid,
          idToken,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        await auth.signOut();
        setErrorMsg(data.error || 'Access denied: You are not authorized as platform staff.');
        setIsLoading(false);
        return;
      }

      // 4. Redirect to Dashboard
      router.push('/');
      router.refresh();
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Sign-in cancelled. Please click the button to log in with Google.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setErrorMsg('Google Sign-in is not enabled in your Firebase console. Go to Firebase Console > Authentication > Sign-in method and enable Google.');
      } else {
        setErrorMsg(err.message || 'Google sign-in failed');
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[420px] p-8 rounded-[16px] bg-[#121212] border border-[#2e2e2e]">
      {/* Brand Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-7 h-7 rounded-full bg-[#121212] border border-[#2e2e2e] flex items-center justify-center text-[#3ecf8e]">
            <Terminal className="w-3.5 h-3.5" />
          </span>
          <span className="text-xs font-mono tracking-widest text-[#898989] uppercase">
            Platform Administration
          </span>
        </div>
        <h1 className="text-xl font-medium text-[#fafafa] tracking-tight">
          Staff Authentication
        </h1>
        <p className="text-xs text-[#898989] mt-1">
          Restricted to authorized Google staff accounts.
        </p>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="mb-6 p-3.5 rounded-[8px] border border-red-900/50 bg-[#121212] text-red-400 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{errorMsg}</span>
        </div>
      )}

      {/* Primary: Google Sign-In Button */}
      <div className="space-y-4">
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-full bg-[#fafafa] text-[#121212] hover:bg-[#e4e4e4] text-sm font-medium tracking-tight flex items-center justify-center gap-3 transition-colors disabled:opacity-50"
        >
          {/* Google Color G SVG */}
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{isLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
        </button>

        <div className="flex items-center gap-2 pt-2 text-[11px] text-[#898989] justify-center">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3ecf8e]" />
          <span>Restricted to @gmail.com staff accounts</span>
        </div>
      </div>
    </div>
  );
}
