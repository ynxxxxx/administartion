import React from 'react';
import { redirect } from 'next/navigation';
import { requireStaffSession } from '@/lib/auth/server-guard';
import { Sidebar } from '@/components/sidebar';

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
      redirect('/login');
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#09090b] text-zinc-100 flex flex-col md:flex-row antialiased">
      {/* Sleek Minimalist Sidebar */}
      <Sidebar staffRole={staff?.role} userEmail={staff?.email} />

      {/* Main Full-Width Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#09090b]">
        {/* Top Minimal Navigation Bar */}
        <header className="h-14 px-6 lg:px-8 border-b border-zinc-800/80 bg-[#09090b]/80 backdrop-blur flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-500 font-mono">Console</span>
            <span className="text-zinc-600">/</span>
            <span className="text-zinc-200 font-medium">Administration</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-zinc-800 bg-zinc-900/60 text-[11px] font-mono text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Production Node</span>
            </div>
          </div>
        </header>

        {/* Full Width Scrollable Content Canvas */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
