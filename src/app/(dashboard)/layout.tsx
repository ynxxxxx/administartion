import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Shield, Users, FileText, UserCog, Activity, LogOut } from 'lucide-react';
import { requireStaffSession } from '@/lib/auth/server-guard';

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
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Console Navigation Bar */}
      <header className="h-12 border-b border-border bg-surface px-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 text-slate-100 font-mono text-xs font-bold tracking-wider uppercase">
            <Shield className="w-4 h-4 text-accent" />
            <span>TV Platform Staff Console</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 font-mono text-xs">
            <Link
              href="/"
              className="px-3 py-1.5 text-slate-300 hover:text-white hover:bg-surface-raised transition-colors flex items-center gap-1.5"
            >
              <Activity className="w-3.5 h-3.5 text-slate-400" />
              <span>Overview</span>
            </Link>
            <Link
              href="/users"
              className="px-3 py-1.5 text-slate-300 hover:text-white hover:bg-surface-raised transition-colors flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>User Lookup</span>
            </Link>
            <Link
              href="/audit"
              className="px-3 py-1.5 text-slate-300 hover:text-white hover:bg-surface-raised transition-colors flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Audit Log</span>
            </Link>
            <Link
              href="/staff"
              className="px-3 py-1.5 text-slate-300 hover:text-white hover:bg-surface-raised transition-colors flex items-center gap-1.5"
            >
              <UserCog className="w-3.5 h-3.5 text-slate-400" />
              <span>Staff Management</span>
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 font-mono text-xs px-2.5 py-1 bg-surface-raised border border-border">
            <span className="w-2 h-2 rounded-full bg-success"></span>
            <span className="text-slate-300 uppercase tracking-wider text-[11px]">
              {staff?.role ? `ROLE: ${staff.role}` : 'STAFF ACTIVE'}
            </span>
          </div>

          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-surface-raised transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}
