import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { adminClient } from '@/lib/db/supabase-admin';
import { requireStaffSession } from '@/lib/auth/server-guard';
import { updateReportStatusAction } from '@/lib/actions/moderation';
import { 
  Flag, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  MessageSquare,
  ShieldAlert
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ReportsQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  try {
    await requireStaffSession('moderator');
  } catch (err: any) {
    redirect('/login');
  }

  const resolvedParams = await searchParams;
  const statusFilter = resolvedParams?.status || 'all';

  let reports: any[] = [];
  let openCount = 0;
  let actionedCount = 0;
  let dismissedCount = 0;

  try {
    let query = adminClient
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data } = await query;
    reports = data || [];

    // Aggregate counts
    const [openRes, actRes, disRes] = await Promise.all([
      adminClient.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'open'),
      adminClient.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'actioned'),
      adminClient.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'dismissed'),
    ]);

    openCount = openRes.count ?? 0;
    actionedCount = actRes.count ?? 0;
    dismissedCount = disRes.count ?? 0;
  } catch (err) {
    // Graceful fallback if table is initializing
  }

  async function handleReportAction(formData: FormData) {
    'use server';
    await updateReportStatusAction(formData);
  }

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2e2e2e]">
        <div>
          <h1 className="text-2xl font-normal tracking-[-0.007em] text-[#fafafa]">
            Moderation <span className="text-[#3ecf8e]">Queue</span>
          </h1>
          <p className="text-sm text-[#b4b4b4] mt-1">
            Authoritative community safety reports, content violations, and user triage.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-full bg-[#1e1e1e] border border-[#2e2e2e] text-xs">
          {[
            { id: 'all', label: 'All' },
            { id: 'open', label: `Open (${openCount})` },
            { id: 'actioned', label: 'Actioned' },
            { id: 'dismissed', label: 'Dismissed' },
          ].map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <Link
                key={tab.id}
                href={tab.id === 'all' ? '/reports' : `/reports?status=${tab.id}`}
                className={`px-3 py-1 rounded-full transition-colors font-medium ${
                  isActive
                    ? 'bg-[#242424] text-[#fafafa] border border-[#393939]'
                    : 'text-[#898989] hover:text-[#fafafa]'
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Open Reports */}
        <div className="p-6 rounded-[16px] bg-[#121212] border border-[#2e2e2e] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono uppercase tracking-[0.100em] text-[#898989]">
              Pending Triage
            </span>
            <AlertTriangle className="w-4 h-4 text-[#f59e0b]" />
          </div>
          <div className="text-3xl font-medium tracking-tight text-[#fafafa]">
            {openCount.toLocaleString()}
          </div>
          <div className="mt-3 text-xs text-[#898989] flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${openCount > 0 ? 'bg-[#f59e0b]' : 'bg-[#3ecf8e]'}`} />
            <span>{openCount > 0 ? 'Action required by staff' : 'Moderation queue clean'}</span>
          </div>
        </div>

        {/* Actioned Reports */}
        <div className="p-6 rounded-[16px] bg-[#121212] border border-[#2e2e2e] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono uppercase tracking-[0.100em] text-[#898989]">
              Actioned & Resolved
            </span>
            <CheckCircle2 className="w-4 h-4 text-[#3ecf8e]" />
          </div>
          <div className="text-3xl font-medium tracking-tight text-[#fafafa]">
            {actionedCount.toLocaleString()}
          </div>
          <div className="mt-3 text-xs text-[#898989]">
            Enforced with restriction or content removal
          </div>
        </div>

        {/* Dismissed Reports */}
        <div className="p-6 rounded-[16px] bg-[#121212] border border-[#2e2e2e] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono uppercase tracking-[0.100em] text-[#898989]">
              Dismissed Reports
            </span>
            <XCircle className="w-4 h-4 text-[#898989]" />
          </div>
          <div className="text-3xl font-medium tracking-tight text-[#fafafa]">
            {dismissedCount.toLocaleString()}
          </div>
          <div className="mt-3 text-xs text-[#898989]">
            Reviewed and marked safe / false positive
          </div>
        </div>
      </div>

      {/* Reports Table Card */}
      <div className="rounded-[16px] bg-[#121212] border border-[#2e2e2e] overflow-hidden">
        <div className="p-6 border-b border-[#2e2e2e] flex items-center justify-between">
          <div>
            <h2 className="text-base font-medium text-[#fafafa]">Safety Incident Feed</h2>
            <p className="text-xs text-[#898989] mt-0.5">Authoritative user reports submitted via app client</p>
          </div>
          <div className="text-xs font-mono text-[#898989]">
            Displaying {reports.length} entries
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#fafafa]">
            <thead className="bg-[#181818] text-[#898989] text-xs font-mono uppercase tracking-wider border-b border-[#2e2e2e]">
              <tr>
                <th className="py-3 px-6 font-normal">Target</th>
                <th className="py-3 px-6 font-normal">Reason & Details</th>
                <th className="py-3 px-6 font-normal">Status</th>
                <th className="py-3 px-6 font-normal">Submitted</th>
                <th className="py-3 px-6 font-normal text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2e2e2e]">
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#898989] font-mono text-xs">
                    Zero reports in this filter category.
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report.id} className="hover:bg-[#1a1a1a] transition-colors">
                    {/* Target */}
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-full bg-[#242424] border border-[#2e2e2e] text-[#898989]">
                          {report.target_type === 'user' ? (
                            <User className="w-3.5 h-3.5 text-[#3ecf8e]" />
                          ) : (
                            <MessageSquare className="w-3.5 h-3.5 text-[#b4b4b4]" />
                          )}
                        </span>
                        <div>
                          <span className="font-mono text-xs text-[#fafafa] uppercase">
                            {report.target_type}
                          </span>
                          <span className="block text-[11px] font-mono text-[#898989] truncate max-w-[140px]">
                            {report.target_id}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Reason & Details */}
                    <td className="py-3.5 px-6 max-w-[340px]">
                      <div className="font-medium text-xs text-[#fafafa]">
                        {report.reason}
                      </div>
                      {report.details && (
                        <div className="text-[11px] text-[#898989] mt-0.5 truncate">
                          "{report.details}"
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-6">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono border ${
                          report.status === 'open'
                            ? 'bg-[#121212] text-[#f59e0b] border-[#5e4310]'
                            : report.status === 'actioned'
                            ? 'bg-[#121212] text-[#3ecf8e] border-[#1f4b37]'
                            : 'bg-[#181818] text-[#898989] border-[#2e2e2e]'
                        }`}
                      >
                        {report.status}
                      </span>
                    </td>

                    {/* Submitted Date */}
                    <td className="py-3.5 px-6 text-[#898989] font-mono text-xs whitespace-nowrap">
                      {new Date(report.created_at).toLocaleDateString()} {new Date(report.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-6 text-right">
                      {report.status === 'open' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <form action={handleReportAction}>
                            <input type="hidden" name="reportId" value={report.id} />
                            <input type="hidden" name="status" value="actioned" />
                            <button
                              type="submit"
                              className="px-3 py-1 rounded-full bg-[#121212] text-[#3ecf8e] border border-[#1f4b37] hover:bg-[#1f4b37]/30 text-xs font-medium transition-colors"
                            >
                              Action
                            </button>
                          </form>

                          <form action={handleReportAction}>
                            <input type="hidden" name="reportId" value={report.id} />
                            <input type="hidden" name="status" value="dismissed" />
                            <button
                              type="submit"
                              className="px-3 py-1 rounded-full bg-[#181818] text-[#898989] hover:text-[#fafafa] border border-[#2e2e2e] hover:border-[#393939] text-xs font-medium transition-colors"
                            >
                              Dismiss
                            </button>
                          </form>
                        </div>
                      ) : (
                        <span className="text-xs font-mono text-[#898989]">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
