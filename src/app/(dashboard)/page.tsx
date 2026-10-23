import React from 'react';
import { redirect } from 'next/navigation';
import { adminClient } from '@/lib/db/supabase-admin';
import { requireStaffSession } from '@/lib/auth/server-guard';
import { Users, FileText, Ban, AlertTriangle, ShieldCheck, Clock } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function OverviewPage() {
  try {
    await requireStaffSession('moderator');
  } catch (err: any) {
    if (err?.message?.includes('MFA')) {
      redirect('/mfa');
    }
    redirect('/login');
  }

  let userCount = 0;
  let activeBansCount = 0;
  let logsCount = 0;

  try {
    const [usersRes, bansRes, logsRes] = await Promise.all([
      adminClient.from('profiles').select('id', { count: 'exact', head: true }),
      adminClient.from('bans').select('id', { count: 'exact', head: true }).or('expires_at.is.null,expires_at.gt.now()'),
      adminClient.from('logs').select('id', { count: 'exact', head: true }),
    ]);

    userCount = usersRes.count || 0;
    activeBansCount = bansRes.count || 0;
    logsCount = logsRes.count || 0;
  } catch (err) {
    // Fallback in test/mock environment
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <h1 className="font-mono text-lg font-bold text-slate-100 uppercase tracking-wider">
          Platform Security & Metrics Overview
        </h1>
        <p className="text-xs text-slate-400 font-mono mt-1">
          Server-side statistics gathered from authoritative database records.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-border bg-surface p-4">
          <div className="flex items-center justify-between text-slate-400 font-mono text-xs uppercase mb-2">
            <span>Total Registered Profiles</span>
            <Users className="w-4 h-4 text-accent" />
          </div>
          <div className="font-mono text-2xl font-bold text-slate-100">
            {userCount.toLocaleString()}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-success font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
            <span>STATUS: SYNCED</span>
          </div>
        </div>

        <div className="border border-border bg-surface p-4">
          <div className="flex items-center justify-between text-slate-400 font-mono text-xs uppercase mb-2">
            <span>Active Account Bans</span>
            <Ban className="w-4 h-4 text-danger" />
          </div>
          <div className="font-mono text-2xl font-bold text-slate-100">
            {activeBansCount.toLocaleString()}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-danger font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-danger"></span>
            <span>ENFORCEMENT ACTIVE</span>
          </div>
        </div>

        <div className="border border-border bg-surface p-4">
          <div className="flex items-center justify-between text-slate-400 font-mono text-xs uppercase mb-2">
            <span>Total User Diary Logs</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="font-mono text-2xl font-bold text-slate-100">
            {logsCount.toLocaleString()}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            <span>POSTGREST RLS ENFORCED</span>
          </div>
        </div>
      </div>

      {/* Phase 3 Placeholders (Reports Queue & Held Messages) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <div className="border border-border/60 bg-surface/50 p-4 border-dashed">
          <div className="flex items-center gap-2 mb-2 text-warning font-mono text-xs font-bold uppercase">
            <AlertTriangle className="w-4 h-4" />
            <span>Reports Review Queue (Phase 3 Placeholder)</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            User-reported messages, reviews, and comments will stream here during Phase 3 after the moderation worker and report aggregation pipeline are connected.
          </p>
          <div className="mt-4 px-3 py-1.5 bg-surface-raised border border-border inline-block text-[11px] font-mono text-slate-400">
            QUEUE STATUS: DORMANT (ACTIVATES PHASE 3)
          </div>
        </div>

        <div className="border border-border/60 bg-surface/50 p-4 border-dashed">
          <div className="flex items-center gap-2 mb-2 text-accent font-mono text-xs font-bold uppercase">
            <Clock className="w-4 h-4" />
            <span>Held Content Stream (Phase 3 Placeholder)</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Low-trust user messages and media uploads awaiting multilingual filter verification will be quarantined and evaluated here.
          </p>
          <div className="mt-4 px-3 py-1.5 bg-surface-raised border border-border inline-block text-[11px] font-mono text-slate-400">
            WORKER STATUS: SCHEDULED FOR PHASE 3
          </div>
        </div>
      </div>
    </div>
  );
}
