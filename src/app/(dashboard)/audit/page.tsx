import React from 'react';
import { redirect } from 'next/navigation';
import { adminClient } from '@/lib/db/supabase-admin';
import { requireStaffSession } from '@/lib/auth/server-guard';
import { FileText, ShieldAlert } from 'lucide-react';

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
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <h1 className="font-mono text-lg font-bold text-slate-100 uppercase tracking-wider">
          Tamper-Resistant Moderation Audit Log
        </h1>
        <p className="text-xs text-slate-400 font-mono mt-1">
          Append-only cryptographic record of staff interventions, bans, unbans, and role modifications.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 border border-danger/40 bg-danger/10 text-danger font-mono text-xs">
          Error querying audit log: {errorMsg}
        </div>
      )}

      <div className="border border-border bg-surface overflow-hidden">
        <div className="p-3 bg-surface-raised border-b border-border flex items-center justify-between text-xs font-mono text-slate-400">
          <span>Displaying Latest {auditLogs.length} Records</span>
          <span className="text-success flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-success"></span>
            APPEND-ONLY TAMPER-RESISTANT
          </span>
        </div>

        {auditLogs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 font-mono text-xs">
            No moderation actions recorded in the platform audit trail yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-dense">
              <thead>
                <tr className="border-b border-border bg-surface-raised/40 font-mono text-[11px] text-slate-400">
                  <th className="p-2.5 text-left font-normal">Timestamp</th>
                  <th className="p-2.5 text-left font-normal">Staff Actor</th>
                  <th className="p-2.5 text-left font-normal">Action</th>
                  <th className="p-2.5 text-left font-normal">Target Type</th>
                  <th className="p-2.5 text-left font-normal">Target Identifier</th>
                  <th className="p-2.5 text-left font-normal">Audit Reason</th>
                </tr>
              </thead>
              <tbody className="font-mono text-xs divide-y divide-border/30">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-raised/30 transition-colors">
                    <td className="p-2.5 text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="p-2.5 text-accent font-semibold text-[11px]">
                      {log.actor_id}
                    </td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 uppercase text-[10px] bg-surface-raised border border-border text-slate-300">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-2.5 text-slate-300 uppercase text-[11px]">
                      {log.target_type}
                    </td>
                    <td className="p-2.5 text-slate-400 text-[11px]">
                      {log.target_id || '--'}
                    </td>
                    <td className="p-2.5 text-slate-200">
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
