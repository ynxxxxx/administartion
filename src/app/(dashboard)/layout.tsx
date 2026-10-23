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
    <div className="min-h-screen w-full bg-[#121212] text-[#fafafa] flex flex-col md:flex-row antialiased">
      {/* Midnight IDE Sidebar */}
      <Sidebar staffRole={staff?.role} userEmail={staff?.email} />

      {/* Main Full-Width Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#121212]">
        {/* Top Navigation Bar (64px, 1px bottom border #2e2e2e) */}
        <header className="h-16 px-6 lg:px-8 border-b border-[#2e2e2e] bg-[#121212] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[#898989]">Console</span>
            <span className="text-[#4d4d4d]">/</span>
            <span className="text-[#fafafa] font-medium">Administration</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Supabase Status Pill */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#242424] border border-[#2e2e2e] text-xs font-mono text-[#b4b4b4]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3ecf8e]" />
              <span>PostgreSQL Cluster Live</span>
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
