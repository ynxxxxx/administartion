'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Shield, Lock, Mail, AlertCircle, KeyRound, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ldiyekkmzhzmnztvdckc.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkaXlla2ttemh6bW56dHZkY2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3Njg3NTUsImV4cCI6MjEwODM0NDc1NX0.yJ-Nd3CNvirlYlVPtyc5WidHt6l_41qVKTOdJmccf-M'
  );

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    try {
      // 1. Verify password
      const { error: pwdError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (pwdError) {
        setErrorMsg(pwdError.message);
        setIsLoading(false);
        return;
      }

      // 2. Send 6-digit OTP code to staff email
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        },
      });

      if (otpError) {
        setErrorMsg(otpError.message);
        setIsLoading(false);
        return;
      }

      setInfoMsg(`A 6-digit verification code has been sent to ${email}`);
      setStep('otp');
      setIsLoading(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed');
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      // Verify Email OTP token
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp.trim(),
        type: 'email',
      });

      if (error) {
        setErrorMsg(error.message);
        setIsLoading(false);
        return;
      }

      router.push('/');
    } catch (err: any) {
      setErrorMsg(err.message || 'OTP verification failed');
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      });
      if (error) throw error;
      setInfoMsg('A new verification code was sent to your email.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to resend code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm border border-border bg-surface p-6 rounded-none">
        <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
          <Shield className="w-5 h-5 text-accent" />
          <h1 className="font-mono text-sm uppercase tracking-wider text-slate-100 font-semibold">
            {step === 'credentials' ? 'Staff Authentication' : 'Email OTP Verification'}
          </h1>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 border border-danger/40 bg-danger/10 text-danger text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {infoMsg && (
          <div className="mb-4 p-3 border border-accent/40 bg-accent/10 text-slate-200 text-xs flex items-center gap-2">
            <Mail className="w-4 h-4 text-accent flex-shrink-0" />
            <span>{infoMsg}</span>
          </div>
        )}

        {step === 'credentials' ? (
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
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
              {isLoading ? 'Sending Code...' : 'Sign In & Send Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div>
              <label className="block font-mono text-xs text-slate-400 mb-1" htmlFor="otp">
                6-Digit Email Verification Code
              </label>
              <div className="relative">
                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  autoFocus
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-surface-raised border border-border px-3 py-2 text-center font-mono text-base tracking-[0.5em] text-slate-100 focus:border-accent focus:outline-none"
                  placeholder="000000"
                />
                <KeyRound className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || otp.length !== 6}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-600 font-mono text-xs tracking-wider uppercase transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Verifying Code...' : 'Authenticate Session'}
            </button>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => { setStep('credentials'); setOtp(''); }}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 font-mono"
              >
                <ArrowLeft className="w-3 h-3" /> Back
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={handleResendOtp}
                className="text-xs text-accent hover:underline font-mono"
              >
                Resend Email Code
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-border/50 text-center">
          <p className="text-[11px] text-slate-500 font-mono">
            Restricted System — Access Audited and Logged
          </p>
        </div>
      </div>
    </div>
  );
}
