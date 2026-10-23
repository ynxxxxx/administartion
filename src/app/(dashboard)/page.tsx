import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { adminClient } from '@/lib/db/supabase-admin';
import { requireStaffSession } from '@/lib/auth/server-guard';
import { 
  Users, 
  FileText, 
  ShieldAlert, 
  UserCheck, 
  Search, 
  ArrowRight,
  Shield,
  Activity
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function OverviewPage() {
  try {
    await requireStaffSession('moderator');
  } catch (err: any) {
    redirect('/login');
  }

  let userCount = 0;
  let activeBansCount = 0;
  let logsCount = 0;
  let staffCount = 0;
  let recentUsers: any[] = [];
  let recentAudit: any[] = [];

  try {
    const [usersRes, bansRes, logsRes, staffRes, recentUsersRes, auditRes] = await Promise.all([
      adminClient.from('profiles').select('id', { count: 'exact', head: true }),
      adminClient.from('bans').select('id', { count: 'exact', head: true }).or('expires_at.is.null,expires_at.gt.now()'),
      adminClient.from('logs').select('id', { count: 'exact', head: true }),
      adminClient.from('staff_roles').select('id', { count: 'exact', head: true }),
      adminClient.from('profiles').select('id, username, display_name, onboarded, created_at').order('created_at', { ascending: false }).limit(5),
      adminClient.from('moderation_actions').select('*').order('created_at', { ascending: false }).limit(6),
    ]);

    userCount = usersRes.count ?? 0;
    activeBansCount = bansRes.count ?? 0;
    logsCount = logsRes.count ?? 0;
    staffCount = staffRes.count ?? 0;
    recentUsers = recentUsersRes.data || [];
    recentAudit = auditRes.data || [];
  } catch (err) {
    // Graceful fallback during static build phases
  }

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto w-full">
      {/* Top Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2e2e2e]">
        <div>
          <h1 className="text-2xl font-normal tracking-[-0.007em] text-[#fafafa]">
            System <span className="text-[#3ecf8e]">Overview</span>
          </h1>
          <p className="text-sm text-[#b4b4b4] mt-1">
            Authoritative platform metrics, user registry, and security audit log.
          </p>
        </div>

        {/* Supabase Input Field */}
        <form action="/users" method="GET" className="relative w-full sm:w-80">
          <input
            name="q"
            type="text"
            placeholder="Search username or user UUID..."
            className="w-full bg-[#121212] border border-[#393939] text-sm px-3.5 py-2 pl-9 rounded-[8px] text-[#fafafa] placeholder-[#898989] focus:outline-none transition-colors"
          />
          <Search className="w-4 h-4 text-[#898989] absolute left-3 top-2.5" />
        </form>
      </div>

      {/* 4 Feature Metric Cards (Radius 16px, Border 1px #2e2e2e, Background #121212) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Users */}
        <div className="p-6 rounded-[16px] bg-[#121212] border border-[#2e2e2e] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono uppercase tracking-[0.100em] text-[#898989]">
              Registered Users
            </span>
            <Users className="w-4 h-4 text-[#3ecf8e]" />
          </div>
          <div className="text-3xl font-medium tracking-tight text-[#fafafa]">
            {userCount.toLocaleString()}
          </div>
          <div className="mt-3 text-xs text-[#898989] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3ecf8e]" />
            <span>Synced with Auth Provider</span>
          </div>
        </div>

        {/* Card 2: Active Bans */}
        <div className="p-6 rounded-[16px] bg-[#121212] border border-[#2e2e2e] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono uppercase tracking-[0.100em] text-[#898989]">
              Active Restrictions
            </span>
            <ShieldAlert className="w-4 h-4 text-[#898989]" />
          </div>
          <div className="text-3xl font-medium tracking-tight text-[#fafafa]">
            {activeBansCount.toLocaleString()}
          </div>
          <div className="mt-3 text-xs text-[#898989]">
            {activeBansCount === 0 ? 'No active user restrictions' : 'Enforced across platform'}
          </div>
        </div>

        {/* Card 3: Logs */}
        <div className="p-6 rounded-[16px] bg-[#121212] border border-[#2e2e2e] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono uppercase tracking-[0.100em] text-[#898989]">
              Diary Logs & Ratings
            </span>
            <FileText className="w-4 h-4 text-[#3ecf8e]" />
          </div>
          <div className="text-3xl font-medium tracking-tight text-[#fafafa]">
            {logsCount.toLocaleString()}
          </div>
          <div className="mt-3 text-xs text-[#898989]">
            Community activity logs
          </div>
        </div>

        {/* Card 4: Staff */}
        <div className="p-6 rounded-[16px] bg-[#121212] border border-[#2e2e2e] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono uppercase tracking-[0.100em] text-[#898989]">
              Platform Staff
            </span>
            <UserCheck className="w-4 h-4 text-[#3ecf8e]" />
          </div>
          <div className="text-3xl font-medium tracking-tight text-[#fafafa]">
            {staffCount.toLocaleString()}
          </div>
          <div className="mt-3 text-xs text-[#898989]">
            Administrators & moderators
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Recent Registrations Table */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-[16px] bg-[#121212] border border-[#2e2e2e] overflow-hidden">
            <div className="p-6 border-b border-[#2e2e2e] flex items-center justify-between">
              <div>
                <h2 className="text-base font-medium text-[#fafafa]">Recent Registrations</h2>
                <p className="text-xs text-[#898989] mt-0.5">Authoritative profiles synchronized from Supabase</p>
              </div>
              <Link
                href="/users"
                className="px-3.5 py-1.5 rounded-full border border-[#393939] hover:border-[#4d4d4d] hover:bg-[#242424] text-xs font-medium text-[#fafafa] flex items-center gap-1.5 transition-colors"
              >
                <span>View Directory</span>
                <ArrowRight className="w-3 h-3 text-[#3ecf8e]" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#2e2e2e] bg-[#121212] text-[#898989] font-mono text-xs">
                    <th className="py-3 px-6 font-normal">Profile</th>
                    <th className="py-3 px-6 font-normal">Status</th>
                    <th className="py-3 px-6 font-normal">Created</th>
                    <th className="py-3 px-6 font-normal text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2e2e2e]">
                  {recentUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-[#898989] font-mono text-xs">
                        No registered users found.
                      </td>
                    </tr>
                  ) : (
                    recentUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-[#242424] transition-colors">
                        <td className="py-3.5 px-6">
                          <div className="font-medium text-[#fafafa]">
                            {u.display_name || u.username || 'Anonymous User'}
                          </div>
                          <div className="text-xs font-mono text-[#898989] truncate max-w-[200px]">
                            {u.username ? `@${u.username}` : u.id}
                          </div>
                        </td>
                        <td className="py-3.5 px-6">
                          {u.onboarded ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono bg-[#121212] text-[#3ecf8e] border border-[#1f4b37]">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono bg-[#242424] text-[#898989] border border-[#2e2e2e]">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-6 text-[#898989] font-mono text-xs">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <Link
                            href={`/users?q=${u.id}`}
                            className="inline-flex items-center px-3 py-1 rounded-full border border-[#393939] hover:border-[#3ecf8e] hover:text-[#3ecf8e] text-xs font-medium text-[#b4b4b4] transition-colors"
                          >
                            Inspect
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Audit Trail */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-[16px] bg-[#121212] border border-[#2e2e2e] overflow-hidden">
            <div className="p-6 border-b border-[#2e2e2e] flex items-center justify-between">
              <div>
                <h2 className="text-base font-medium text-[#fafafa]">Security Audit Log</h2>
                <p className="text-xs text-[#898989] mt-0.5">Append-only moderation records</p>
              </div>
              <Link
                href="/audit"
                className="px-3.5 py-1.5 rounded-full border border-[#393939] hover:border-[#4d4d4d] hover:bg-[#242424] text-xs font-medium text-[#fafafa] flex items-center gap-1.5 transition-colors"
              >
                <span>Full Log</span>
                <ArrowRight className="w-3 h-3 text-[#3ecf8e]" />
              </Link>
            </div>

            <div className="divide-y divide-[#2e2e2e]">
              {recentAudit.length === 0 ? (
                <div className="py-10 text-center text-[#898989] font-mono text-xs">
                  Zero audit entries recorded.
                </div>
              ) : (
                recentAudit.map((log) => (
                  <div key={log.id} className="p-4 hover:bg-[#242424] transition-colors">
                    <div className="flex items-center justify-between text-xs font-mono text-[#898989] mb-1">
                      <span className="font-medium text-[#3ecf8e] uppercase tracking-wider">{log.action}</span>
                      <span>{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-sm text-[#b4b4b4]">
                      {log.reason || 'Administrative action'}
                    </p>
                    <div className="mt-2 text-xs font-mono text-[#898989]">
                      Target: {log.target_type} ({log.target_id.slice(0, 8)}...)
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
