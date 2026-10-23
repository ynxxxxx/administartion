import React from 'react';
import { redirect } from 'next/navigation';
import { adminClient } from '@/lib/db/supabase-admin';
import { assignStaffRoleAction } from '@/lib/actions/moderation';
import { requireStaffSession } from '@/lib/auth/server-guard';
import { UserCog, ShieldCheck, AlertCircle, KeyRound, UserCheck, Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function StaffManagementPage() {
  let isAuthorizedAdmin = false;
  let staffList: any[] = [];
  let errorMsg = '';

  try {
    const caller = await requireStaffSession('admin');
    isAuthorizedAdmin = caller.role === 'admin';

    const { data, error } = await adminClient
      .from('staff_roles')
      .select('*, profiles(username, display_name)');

    if (error) {
      errorMsg = error.message;
    } else {
      staffList = data || [];
    }
  } catch (err: any) {
    if (err?.message?.includes('MFA')) {
      redirect('/mfa');
    }
    errorMsg = err.message || 'Access restricted to Platform Administrators';
  }

  if (!isAuthorizedAdmin) {
    return (
      <div className="apple-card p-8 text-center max-w-lg mx-auto my-12">
        <AlertCircle className="w-10 h-10 text-apple-amber mx-auto mb-3" />
        <h2 className="text-sm font-semibold text-white tracking-tight">Access Restricted</h2>
        <p className="text-xs text-zinc-400 mt-1">
          Staff role assignment and elevation requires full Platform Administrator credentials and AAL2 assurance.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-4">
      
      {/* Header Bento */}
      <div className="apple-card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-apple-blue/10 border border-apple-blue/20 flex items-center justify-center text-apple-blue">
              <UserCog className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-base font-semibold text-white tracking-tight">
                Staff RBAC & Delegated Authority
              </h1>
              <p className="text-xs text-zinc-400">
                Grant moderator or administrative privileges with mandatory AAL2 MFA requirement.
              </p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full bg-apple-blue/10 border border-apple-blue/20 text-apple-blue text-xs font-semibold">
            Admin Authority Active
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-2xl border border-apple-red/30 bg-apple-red/10 text-apple-red text-xs font-medium">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        
        {/* Active Staff Roster Bento (Cols 1-7) */}
        <div className="lg:col-span-7 apple-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-white tracking-tight flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-apple-green" />
              <span>Active Staff Members ({staffList.length})</span>
            </h3>
            <span className="text-[10px] text-zinc-500 font-mono">Realtime Postgres Query</span>
          </div>

          <div className="space-y-2.5">
            {staffList.map((member) => (
              <div key={member.id} className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center font-bold text-xs text-white">
                    {member.profiles?.username ? member.profiles.username[0].toUpperCase() : 'S'}
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-white block">
                      @{member.profiles?.username || 'user'}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {member.user_id}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase border ${
                    member.role === 'admin'
                      ? 'bg-apple-purple/10 border-apple-purple/20 text-apple-purple'
                      : 'bg-apple-blue/10 border-apple-blue/20 text-apple-blue'
                  }`}>
                    {member.role}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-apple-green" title="AAL2 MFA Active" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Role Delegation Form Bento (Cols 8-12) */}
        <div className="lg:col-span-5 apple-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-7 h-7 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-apple-blue">
              <Plus className="w-3.5 h-3.5" />
            </span>
            <h3 className="text-xs font-semibold text-white tracking-tight">Assign Staff Role</h3>
          </div>

          <form action={async (formData) => { "use server"; await assignStaffRoleAction(formData); }} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Target User UUID
              </label>
              <input
                type="text"
                name="targetUserId"
                required
                placeholder="00000000-0000-0000-0000-000000000000"
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-apple-blue font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Designated Privilege Level
              </label>
              <select
                name="role"
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-apple-blue"
              >
                <option value="moderator" className="bg-[#18181e] text-white">Moderator (Community & User Bans)</option>
                <option value="admin" className="bg-[#18181e] text-white">Platform Administrator (Full Rights)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Elevation Rationale (Permanent Audit Entry)
              </label>
              <input
                type="text"
                name="reason"
                required
                placeholder="e.g., Appointed Community Moderator..."
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-apple-blue"
              />
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-2.5 rounded-xl bg-apple-blue hover:brightness-110 text-white text-xs font-semibold tracking-tight shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Grant Role & Enforce AAL2</span>
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
