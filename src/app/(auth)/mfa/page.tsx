'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { KeyRound, AlertCircle } from 'lucide-react';

export default function MfaPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ldiyekkmzhzmnztvdckc.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkaXlla2ttemh6bW56dHZkY2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3Njg3NTUsImV4cCI6MjEwODM0NDc1NX0.yJ-Nd3CNvirlYlVPtyc5WidHt6l_41qVKTOdJmccf-M'
  );

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
      if (factorsError || !factors.totp[0]) {
        throw new Error('No enrolled TOTP factor found. Contact an administrator to bootstrap.');
      }

      const totpFactor = factors.totp[0];
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: totpFactor.id,
      });

      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        challengeId: challengeData.id,
        code,
      });

      if (verifyError) throw verifyError;

      router.push('/');
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm border border-border bg-surface p-6">
        <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
          <KeyRound className="w-5 h-5 text-accent" />
          <h1 className="font-mono text-sm uppercase tracking-wider text-slate-100 font-semibold">
            MFA Verification (AAL2)
          </h1>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 border border-danger/40 bg-danger/10 text-danger text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block font-mono text-xs text-slate-400 mb-1" htmlFor="mfa-code">
              6-Digit Authenticator Code
            </label>
            <input
              id="mfa-code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              autoFocus
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-surface-raised border border-border px-3 py-2 text-center font-mono text-base tracking-[0.5em] text-slate-100 focus:border-accent focus:outline-none"
              placeholder="000000"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || code.length !== 6}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-600 font-mono text-xs tracking-wider uppercase transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Verifying...' : 'Authenticate Session'}
          </button>
        </form>
      </div>
    </div>
  );
}
