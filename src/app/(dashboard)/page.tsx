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
  Shield
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
    <div className="space-y-6 max-w-[1600px] mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800/80">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-100">System Overview</h1>
          <p className="text-xs text-zinc-400 mt-0.5">Authoritative platform metrics and user registry.</p>
        </div>

        <form action="/users" method="GET" className="relative w-full sm:w-80">
          <input
            name="q"
            type="text"
            placeholder="Search username or user UUID..."
            className="w-full bg-[#111113] border border-zinc-800 text-xs px-3 py-1.5 pl-8 rounded text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
          />
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
        </form>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Users */}
        <div className="p-4 rounded-lg bg-[#111113] border border-zinc-800">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Registered Users</span>
            <Users className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-zinc-100">
            {userCount.toLocaleString()}
          </div>
          <div className="mt-2 text-[11px] text-zinc-500 font-mono">
            Synced with Supabase Auth
          </div>
        </div>

        {/* Card 2: Active Bans */}
        <div className="p-4 rounded-lg bg-[#111113] border border-zinc-800">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Active Bans</span>
            <ShieldAlert className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-zinc-100">
            {activeBansCount.toLocaleString()}
          </div>
          <div className="mt-2 text-[11px] text-zinc-500 font-mono">
            {activeBansCount === 0 ? 'No active restrictions' : 'Enforced across platform'}
          </div>
        </div>

        {/* Card 3: Logs */}
        <div className="p-4 rounded-lg bg-[#111113] border border-zinc-800">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Diary Logs & Ratings</span>
            <FileText className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-zinc-100">
            {logsCount.toLocaleString()}
          </div>
          <div className="mt-2 text-[11px] text-zinc-500 font-mono">
            Public social logs
          </div>
        </div>

        {/* Card 4: Staff */}
        <div className="p-4 rounded-lg bg-[#111113] border border-zinc-800">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Staff Members</span>
            <UserCheck className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-zinc-100">
            {staffCount.toLocaleString()}
          </div>
          <div className="mt-2 text-[11px] text-zinc-500 font-mono">
            Role-based access assigned
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Recent Users Table */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-lg bg-[#111113] border border-zinc-800 overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-zinc-100">Recent Registrations</h2>
                <p className="text-xs text-zinc-500">Latest profiles created on platform</p>
              </div>
              <Link
                href="/users"
                className="text-xs text-zinc-400 hover:text-zinc-100 flex items-center gap-1 font-mono transition-colors"
              >
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800/80 bg-zinc-900/40 text-zinc-400 font-mono text-[11px]">
                    <th className="py-2.5 px-4 font-medium">User</th>
                    <th className="py-2.5 px-4 font-medium">Status</th>
                    <th className="py-2.5 px-4 font-medium">Created</th>
                    <th className="py-2.5 px-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {recentUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-zinc-500 font-mono">
                        No user profiles found.
                      </td>
                    </tr>
                  ) : (
                    recentUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-medium text-zinc-200">
                            {u.display_name || u.username || 'Anonymous User'}
                          </div>
                          <div className="text-[11px] font-mono text-zinc-500 truncate max-w-[200px]">
                            {u.username ? `@${u.username}` : u.id}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {u.onboarded ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700/50">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-800/60 text-zinc-500 border border-zinc-800">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-zinc-400 font-mono text-[11px]">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            href={`/users?q=${u.id}`}
                            className="text-xs px-2.5 py-1 rounded border border-zinc-700 bg-zinc-800/60 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors"
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

        {/* Right Column: Moderation Audit Log */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-lg bg-[#111113] border border-zinc-800 overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-zinc-100">Audit Trail</h2>
                <p className="text-xs text-zinc-500">Append-only moderation activity</p>
              </div>
              <Link
                href="/audit"
                className="text-xs text-zinc-400 hover:text-zinc-100 flex items-center gap-1 font-mono transition-colors"
              >
                Full Log <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="divide-y divide-zinc-800/50">
              {recentAudit.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 font-mono text-xs">
                  Zero audit actions recorded.
                </div>
              ) : (
                recentAudit.map((log) => (
                  <div key={log.id} className="p-3.5 hover:bg-zinc-800/20 transition-colors">
                    <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-1">
                      <span className="font-semibold text-zinc-300 uppercase tracking-wider">{log.action}</span>
                      <span>{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-xs text-zinc-400">
                      {log.reason || 'No reason provided'}
                    </p>
                    <div className="mt-1.5 text-[10px] font-mono text-zinc-500">
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
