import React from 'react';
import { redirect } from 'next/navigation';
import { adminClient } from '@/lib/db/supabase-admin';
import { requireStaffSession } from '@/lib/auth/server-guard';
import { ShieldCheck, FileText, Lock, Filter, Clock, User } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AuditLogPage() {
  try {
    await requireStaffSession('moderator');
  } catch (err: any) {
    if (err?.message?.includes('MFA')) {
      redirect('/mfa');
    }
    redirect('/login');
  }

  let auditLogs: any[] = [];
  let errorMsg = '';

  try {
    const { data, error } = await adminClient
      .from('moderation_actions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      errorMsg = error.message;
    } else {
      auditLogs = data || [];
    }
  } catch (err: any) {
    errorMsg = err.message || 'Failed to load audit records';
  }

  return (
    <div className="space-y-3 pb-4">
      
      {/* Header Bento Card */}
      <div className="apple-card p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-apple-purple/10 border border-apple-purple/20 flex items-center justify-center text-apple-purple">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-base font-semibold text-white tracking-tight">
                Tamper-Resistant Moderation Audit Trail
              </h1>
              <p className="text-xs text-zinc-400">
                Cryptographic append-only database record of staff interventions, bans, pardons, and role elevations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-apple-green/10 border border-apple-green/20 text-apple-green text-xs font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-apple-green" />
              <span>APPEND-ONLY ENFORCED</span>
            </span>
            <span className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-zinc-300 text-xs font-medium">
              {auditLogs.length} Events Logged
            </span>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl border border-apple-red/30 bg-apple-red/10 text-apple-red text-xs font-medium">
          Error querying audit log: {errorMsg}
        </div>
      )}

      {/* Main Table Bento Card */}
      <div className="apple-card p-5 overflow-hidden">
        {auditLogs.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 text-xs">
            Zero moderation actions recorded in the platform audit trail yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] text-zinc-500 text-[11px] font-medium">
                  <th className="pb-3 pl-2 font-normal">Timestamp</th>
                  <th className="pb-3 font-normal">Staff Actor</th>
                  <th className="pb-3 font-normal">Action Type</th>
                  <th className="pb-3 font-normal">Target Entity</th>
                  <th className="pb-3 font-normal">Target ID</th>
                  <th className="pb-3 pr-2 font-normal">Audit Justification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 pl-2 text-zinc-400 whitespace-nowrap text-[11px]">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 font-mono text-apple-blue font-semibold text-[11px]">
                      {log.actor_id}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase border ${
                        log.action === 'ban' 
                          ? 'bg-apple-red/10 border-apple-red/20 text-apple-red'
                          : log.action === 'unban'
                          ? 'bg-apple-green/10 border-apple-green/20 text-apple-green'
                          : 'bg-apple-blue/10 border-apple-blue/20 text-apple-blue'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 uppercase text-zinc-300 text-[11px]">
                      {log.target_type}
                    </td>
                    <td className="py-3 font-mono text-zinc-400 text-[11px]">
                      {log.target_id || '--'}
                    </td>
                    <td className="py-3 pr-2 text-zinc-200 text-xs">
                      {log.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
