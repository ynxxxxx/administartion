'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MfaRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-slate-400 font-mono text-xs">
      Redirecting to Authentication...
    </div>
  );
}
