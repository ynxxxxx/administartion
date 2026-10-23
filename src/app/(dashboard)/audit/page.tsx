import React from 'react';
import { adminClient } from '@/lib/db/supabase-admin';
import { FileText, ShieldAlert } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AuditLogPage() {
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
          Immutable Moderation Audit Log
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
            APPEND-ONLY IMMUTABLE
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
                <tr>
                  <th>Timestamp (UTC)</th>
                  <th>Action</th>
                  <th>Actor (Staff ID)</th>
                  <th>Target Type</th>
                  <th>Target ID</th>
                  <th>Mandatory Reason</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="font-mono text-slate-300">
                      {new Date(log.created_at).toISOString().replace('T', ' ').substring(0, 19)}
                    </td>
                    <td className="font-mono uppercase font-bold text-accent">
                      {log.action}
                    </td>
                    <td className="font-mono text-slate-400 text-[11px] truncate max-w-[140px]">
                      {log.actor_id || 'System'}
                    </td>
                    <td className="font-mono text-slate-300 uppercase">
                      {log.target_type}
                    </td>
                    <td className="font-mono text-slate-400 text-[11px] truncate max-w-[140px]">
                      {log.target_id}
                    </td>
                    <td className="text-slate-200 max-w-sm">
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
