import React from 'react';
import { redirect } from 'next/navigation';
import { adminClient } from '@/lib/db/supabase-admin';
import { requireStaffSession } from '@/lib/auth/server-guard';
import { ShieldCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AuditLogPage() {
  try {
    await requireStaffSession('moderator');
  } catch (err: any) {
    if (err?.message?.includes('MFA')) {
      redirect('/login');
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
    <div className="space-y-6 pb-8">
      {/* Header Card */}
      <div className="p-6 rounded-[16px] bg-[#121212] border border-[#2e2e2e]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-[#3ecf8e]" />
            <div>
              <h1 className="text-xl font-medium text-[#fafafa] tracking-tight">
                Moderation Audit Trail
              </h1>
              <p className="text-sm text-[#898989]">
                Append-only database record of staff interventions, bans, pardons, and role changes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-[#121212] border border-[#1f4b37] text-[#3ecf8e] text-xs font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3ecf8e]" />
              <span>APPEND-ONLY</span>
            </span>
            <span className="px-3 py-1 rounded-full bg-[#242424] border border-[#2e2e2e] text-[#b4b4b4] text-xs font-mono">
              {auditLogs.length} Events
            </span>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-[8px] border border-red-900/50 bg-[#121212] text-red-400 text-xs font-medium">
          Error querying audit log: {errorMsg}
        </div>
      )}

      {/* Main Table Card */}
      <div className="p-6 rounded-[16px] bg-[#121212] border border-[#2e2e2e] overflow-hidden">
        {auditLogs.length === 0 ? (
          <div className="py-12 text-center text-[#898989] text-xs">
            Zero moderation actions recorded in the platform audit trail yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#2e2e2e] text-[#898989] text-[11px] font-medium">
                  <th className="pb-3 pl-2 font-normal">Timestamp</th>
                  <th className="pb-3 font-normal">Staff Actor</th>
                  <th className="pb-3 font-normal">Action Type</th>
                  <th className="pb-3 font-normal">Target Entity</th>
                  <th className="pb-3 font-normal">Target ID</th>
                  <th className="pb-3 pr-2 font-normal">Audit Justification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2e2e2e]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#242424]/40 transition-colors">
                    <td className="py-3 pl-2 text-[#898989] whitespace-nowrap text-[11px] font-mono">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 font-mono text-[#fafafa] font-medium text-[11px]">
                      {log.actor_id}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase border ${
                        log.action === 'ban' 
                          ? 'bg-[#121212] border-red-900/50 text-red-400'
                          : log.action === 'unban'
                          ? 'bg-[#121212] border-[#1f4b37] text-[#3ecf8e]'
                          : 'bg-[#242424] border-[#2e2e2e] text-[#b4b4b4]'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 uppercase text-[#b4b4b4] text-[11px]">
                      {log.target_type}
                    </td>
                    <td className="py-3 font-mono text-[#898989] text-[11px]">
                      {log.target_id || '--'}
                    </td>
                    <td className="py-3 pr-2 text-[#fafafa] text-xs">
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
