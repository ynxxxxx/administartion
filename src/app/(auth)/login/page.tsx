'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Terminal, AlertCircle, ShieldAlert, KeyRound, Mail, CheckCircle2 } from 'lucide-react';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailFallback, setShowEmailFallback] = useState(false);

  // Email OTP state for fallback
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ldiyekkmzhzmnztvdckc.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkaXlla2ttemh6bW56dHZkY2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3Njg3NTUsImV4cCI6MjEwODM0NDc1NX0.yJ-Nd3CNvirlYlVPtyc5WidHt6l_41qVKTOdJmccf-M'
  );

  useEffect(() => {
    const err = searchParams.get('error');
    if (err) {
      setErrorMsg(decodeURIComponent(err));
    }
  }, [searchParams]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        if (error.message.includes('provider is not enabled') || error.message.includes('Unsupported provider')) {
          setErrorMsg('Google OAuth is not enabled in your Supabase project yet. In Supabase Dashboard, go to Authentication > Providers > Google and enable it.');
        } else {
          setErrorMsg(error.message);
        }
        setIsLoading(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to initiate Google sign-in');
      setIsLoading(false);
    }
  };

  const handleFallbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    try {
      if (step === 'credentials') {
        const { error: pwdError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (pwdError) {
          setErrorMsg(pwdError.message);
          setIsLoading(false);
          return;
        }

        const { error: otpError } = await supabase.auth.signInWithOtp({
          email,
          options: { shouldCreateUser: false },
        });

        if (otpError) {
          setErrorMsg(otpError.message);
          setIsLoading(false);
          return;
        }

        setInfoMsg(`A 6-digit code has been sent to ${email}`);
        setStep('otp');
        setIsLoading(false);
      } else {
        const { data, error: verifyError } = await supabase.auth.verifyOtp({
          email,
          token: otp.trim(),
          type: 'email',
        });

        if (verifyError) {
          setErrorMsg(verifyError.message);
          setIsLoading(false);
          return;
        }

        router.push('/');
        router.refresh();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error');
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

      {/* Info Banner */}
      {infoMsg && (
        <div className="mb-6 p-3.5 rounded-[8px] border border-[#1f4b37] bg-[#121212] text-[#3ecf8e] text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="font-medium">{infoMsg}</span>
        </div>
      )}

      {/* Primary: Google OAuth Button */}
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

      {/* Emergency Fallback Section */}
      <div className="mt-8 pt-6 border-t border-[#2e2e2e]">
        <button
          type="button"
          onClick={() => setShowEmailFallback(!showEmailFallback)}
          className="text-xs text-[#898989] hover:text-[#b4b4b4] transition-colors w-full text-center flex items-center justify-center gap-1.5 font-mono text-[11px]"
        >
          <span>{showEmailFallback ? '− Hide Email Fallback' : '+ Emergency Email Access'}</span>
        </button>

        {showEmailFallback && (
          <form onSubmit={handleFallbackSubmit} className="mt-4 space-y-3.5">
            {step === 'credentials' ? (
              <>
                <div>
                  <label className="block text-xs text-[#898989] mb-1">Staff Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="staff@gmail.com"
                    className="w-full bg-[#121212] border border-[#393939] rounded-[8px] px-3.5 py-2 text-xs text-[#fafafa] placeholder-[#898989] focus:outline-none focus:border-[#3ecf8e] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#898989] mb-1">Master Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#121212] border border-[#393939] rounded-[8px] px-3.5 py-2 text-xs text-[#fafafa] placeholder-[#898989] focus:outline-none focus:border-[#3ecf8e] transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2 rounded-full border border-[#393939] hover:border-[#4d4d4d] hover:bg-[#242424] text-xs font-medium text-[#fafafa] transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Sending OTP...' : 'Send Emergency OTP'}
                </button>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs text-[#898989] mb-1">6-Digit Code</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    className="w-full bg-[#121212] border border-[#3ecf8e] rounded-[8px] px-3.5 py-2 text-center text-sm tracking-widest font-mono text-[#fafafa] focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2 rounded-full bg-[#3ecf8e] text-[#121212] hover:bg-[#00c573] text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Verifying...' : 'Verify & Enter'}
                </button>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-[420px] p-8 rounded-[16px] bg-[#121212] border border-[#2e2e2e] text-center text-xs text-[#898989]">
        Loading authentication...
      </div>
    }>
      <LoginFormContent />
    </Suspense>
  );
}
