'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Shield, Lock, Mail, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message);
        setIsLoading(false);
        return;
      }

      // Check MFA Assurance Level
      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aalData && aalData.nextLevel === 'aal2' && aalData.currentLevel !== 'aal2') {
        router.push('/mfa');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm border border-border bg-surface p-6 rounded-none">
        <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
          <Shield className="w-5 h-5 text-accent" />
          <h1 className="font-mono text-sm uppercase tracking-wider text-slate-100 font-semibold">
            Staff Authentication
          </h1>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 border border-danger/40 bg-danger/10 text-danger text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-mono text-xs text-slate-400 mb-1" htmlFor="email">
              Staff Email Address
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface-raised border border-border px-3 py-2 text-xs text-slate-100 focus:border-accent focus:outline-none"
                placeholder="staff@tvplatform.internal"
              />
              <Mail className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block font-mono text-xs text-slate-400 mb-1" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface-raised border border-border px-3 py-2 text-xs text-slate-100 focus:border-accent focus:outline-none"
              />
              <Lock className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-2.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-600 font-mono text-xs tracking-wider uppercase transition-colors disabled:opacity-50 mt-2"
          >
            {isLoading ? 'Authenticating...' : 'Sign In to Console'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-border/50 text-center">
          <p className="text-[11px] text-slate-500 font-mono">
            Restricted System — Access Audited and Logged
          </p>
        </div>
      </div>
    </div>
  );
}
