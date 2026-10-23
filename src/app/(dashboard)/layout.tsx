import React from 'react';
import { redirect } from 'next/navigation';
import { requireStaffSession } from '@/lib/auth/server-guard';
import { AppleDock } from '@/components/apple-dock';
import { ShieldCheck, Database, Search, Command } from 'lucide-react';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let staff: any = null;
  try {
    staff = await requireStaffSession();
  } catch (err: any) {
    if (process.env.NEXT_PHASE !== 'phase-production-build') {
      if (err?.message?.includes('MFA')) {
        redirect('/mfa');
      }
      redirect('/login');
    }
  }

  return (
    <div className="min-h-screen bg-[#070709] text-zinc-100 p-2 md:p-4 lg:p-6 flex items-center justify-center font-sans antialiased">
      {/* VisionOS / Apple Glass Bento Window Container */}
      <div className="w-full max-w-[1580px] min-h-[920px] bg-[#0c0c0f]/95 rounded-[36px] border border-white/[0.14] shadow-[0_24px_80px_rgba(0,0,0,0.85),inset_0_1px_0_0_rgba(255,255,255,0.12)] p-3 md:p-4 flex flex-row gap-3 overflow-hidden">
        
        {/* Left Thin Apple Dock Rail */}
        <AppleDock staffRole={staff?.role} userEmail={staff?.email} />

        {/* Main Content Stage */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          
          {/* Top Subtle Apple Header Bar */}
          <header className="h-12 px-4 rounded-[20px] bg-[#121216]/80 backdrop-blur-xl border border-white/[0.08] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold tracking-tight text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-apple-blue shadow-glow" />
                <span>TV Platform Administration Console</span>
              </span>
              <span className="text-zinc-600 text-xs">/</span>
              <span className="text-xs text-zinc-400 font-medium">Apple Ecosystem Edition</span>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Backend Link Status Pill */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] font-medium text-zinc-300">
                <span className="w-1.5 h-1.5 rounded-full bg-apple-green animate-pulse" />
                <Database className="w-3 h-3 text-zinc-400" />
                <span>Supabase Live</span>
              </div>

              {/* MFA AAL2 Assurance Pill */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-apple-blue/10 border border-apple-blue/20 text-[11px] font-medium text-apple-blue">
                <ShieldCheck className="w-3 h-3" />
                <span>AAL2 MFA Active</span>
              </div>

              {/* Quick Search Pill */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] text-zinc-400">
                <Search className="w-3 h-3" />
                <span>Spotlight</span>
                <kbd className="px-1 py-0.2 bg-white/10 rounded text-[9px] font-mono text-zinc-300">⌘K</kbd>
              </div>
            </div>
          </header>

          {/* Main Dynamic Bento Canvas */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden">
            {children}
          </main>
        </div>

      </div>
    </div>
  );
}
