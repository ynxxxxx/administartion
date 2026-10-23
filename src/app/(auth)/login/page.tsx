'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Terminal, Lock, Mail, AlertCircle, KeyRound, ArrowLeft } from 'lucide-react';

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
      setInfoMsg('A fresh verification code was sent to your email.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to resend code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#121212]">
      <div className="w-full max-w-sm rounded-[16px] bg-[#121212] border border-[#2e2e2e] p-6 sm:p-8">
        
        {/* Supabase Midnight Header */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#2e2e2e]">
          <div className="w-8 h-8 rounded-md bg-[#121212] border border-[#3ecf8e] flex items-center justify-center text-[#3ecf8e]">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-normal text-[#fafafa] tracking-[-0.007em]">
              Staff <span className="text-[#3ecf8e]">Console</span>
            </h1>
            <p className="text-xs text-[#898989]">
              {step === 'credentials' ? 'Authoritative Access' : 'Email Verification Code'}
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-[8px] border border-[#1f4b37] bg-[#121212] text-[#fafafa] text-xs flex items-center gap-2 font-mono">
            <AlertCircle className="w-4 h-4 text-[#ff453a] flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {infoMsg && (
          <div className="mb-4 p-3 rounded-[8px] border border-[#1f4b37] bg-[#121212] text-[#fafafa] text-xs flex items-center gap-2 font-mono">
            <Mail className="w-4 h-4 text-[#3ecf8e] flex-shrink-0" />
            <span>{infoMsg}</span>
          </div>
        )}

        {step === 'credentials' ? (
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-[#898989] mb-1.5" htmlFor="email">
                Staff Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#121212] border border-[#393939] px-3.5 py-2 text-sm text-[#fafafa] rounded-[8px] placeholder-[#898989] focus:outline-none transition-colors"
                  placeholder="staff@tvplatform.internal"
                />
                <Mail className="w-4 h-4 text-[#898989] absolute right-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-[#898989] mb-1.5" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#121212] border border-[#393939] px-3.5 py-2 text-sm text-[#fafafa] rounded-[8px] placeholder-[#898989] focus:outline-none transition-colors"
                />
                <Lock className="w-4 h-4 text-[#898989] absolute right-3 top-2.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-[#3ecf8e] hover:bg-[#00c573] text-[#121212] hover:border-[#1f4b37] border border-[#3ecf8e] rounded-full text-sm font-medium transition-colors disabled:opacity-50 mt-2"
            >
              {isLoading ? 'Sending Code...' : 'Sign In & Send Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-[#898989] mb-1.5" htmlFor="otp">
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
                  className="w-full bg-[#121212] border border-[#393939] px-3 py-2 text-center font-mono text-base tracking-[0.5em] text-[#fafafa] rounded-[8px] focus:outline-none transition-colors"
                  placeholder="000000"
                />
                <KeyRound className="w-4 h-4 text-[#898989] absolute right-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || otp.length !== 6}
              className="w-full py-2.5 px-4 bg-[#3ecf8e] hover:bg-[#00c573] text-[#121212] hover:border-[#1f4b37] border border-[#3ecf8e] rounded-full text-sm font-medium transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Verifying Code...' : 'Authenticate Session'}
            </button>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => { setStep('credentials'); setOtp(''); }}
                className="text-xs text-[#898989] hover:text-[#fafafa] flex items-center gap-1 font-mono transition-colors"
              >
                <ArrowLeft className="w-3 h-3" /> Back
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={handleResendOtp}
                className="text-xs text-[#3ecf8e] hover:text-[#00c573] hover:underline font-mono transition-colors"
              >
                Resend Email Code
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-[#2e2e2e] text-center">
          <p className="text-[11px] text-[#898989] font-mono">
            Midnight IDE · Audited & Logged
          </p>
        </div>
      </div>
    </div>
  );
}
