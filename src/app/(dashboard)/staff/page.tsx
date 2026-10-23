import React from 'react';
import { redirect } from 'next/navigation';
import { adminClient } from '@/lib/db/supabase-admin';
import { assignStaffRoleAction } from '@/lib/actions/moderation';
import { requireStaffSession } from '@/lib/auth/server-guard';
import { UserCog, AlertCircle, KeyRound, UserCheck, Plus } from 'lucide-react';

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
      redirect('/login');
    }
    errorMsg = err.message || 'Access restricted to Platform Administrators';
  }

  if (!isAuthorizedAdmin) {
    return (
      <div className="p-8 rounded-[16px] bg-[#121212] border border-[#2e2e2e] text-center max-w-lg mx-auto my-12">
        <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
        <h2 className="text-base font-medium text-[#fafafa] tracking-tight">Access Restricted</h2>
        <p className="text-xs text-[#898989] mt-1">
          Staff role assignment requires Platform Administrator credentials.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header Bento */}
      <div className="p-6 rounded-[16px] bg-[#121212] border border-[#2e2e2e]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserCog className="w-5 h-5 text-[#3ecf8e]" />
            <div>
              <h1 className="text-xl font-medium text-[#fafafa] tracking-tight">
                Staff RBAC & Privileges
              </h1>
              <p className="text-sm text-[#898989]">
                Manage administrator and moderator privileges.
              </p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full bg-[#121212] border border-[#1f4b37] text-[#3ecf8e] text-xs font-mono">
            Admin Authorized
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-[8px] border border-red-900/50 bg-[#121212] text-red-400 text-xs font-medium">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Active Staff Roster */}
        <div className="lg:col-span-7 p-6 rounded-[16px] bg-[#121212] border border-[#2e2e2e]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[#fafafa] tracking-tight flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#3ecf8e]" />
              <span>Active Staff Members ({staffList.length})</span>
            </h3>
            <span className="text-xs text-[#898989] font-mono">Realtime Roster</span>
          </div>

          <div className="space-y-2">
            {staffList.map((member) => (
              <div key={member.id} className="p-3.5 rounded-[8px] bg-[#242424]/30 border border-[#2e2e2e] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-[8px] bg-[#242424] border border-[#2e2e2e] flex items-center justify-center font-medium text-xs text-[#fafafa]">
                    {member.profiles?.username ? member.profiles.username[0].toUpperCase() : 'S'}
                  </div>
                  <div>
                    <span className="text-xs font-medium text-[#fafafa] block">
                      @{member.profiles?.username || 'user'}
                    </span>
                    <span className="text-[11px] text-[#898989] font-mono">
                      {member.user_id}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase border ${
                    member.role === 'admin'
                      ? 'bg-[#121212] border-[#3ecf8e] text-[#3ecf8e]'
                      : 'bg-[#242424] border-[#2e2e2e] text-[#b4b4b4]'
                  }`}>
                    {member.role}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3ecf8e]" title="Active" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Role Delegation Form */}
        <div className="lg:col-span-5 p-6 rounded-[16px] bg-[#121212] border border-[#2e2e2e]">
          <div className="flex items-center gap-2 mb-4">
            <Plus className="w-4 h-4 text-[#3ecf8e]" />
            <h3 className="text-sm font-medium text-[#fafafa] tracking-tight">Assign Staff Role</h3>
          </div>

          <form action={async (formData) => { "use server"; await assignStaffRoleAction(formData); }} className="space-y-4">
            <div>
              <label className="block text-xs text-[#898989] mb-1.5">
                Target User UUID
              </label>
              <input
                type="text"
                name="targetUserId"
                required
                placeholder="00000000-0000-0000-0000-000000000000"
                className="w-full bg-[#121212] border border-[#393939] rounded-[8px] px-3 py-2 text-xs text-[#fafafa] placeholder-[#898989] focus:outline-none focus:border-[#3ecf8e] font-mono transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-[#898989] mb-1.5">
                Privilege Level
              </label>
              <select
                name="role"
                className="w-full bg-[#121212] border border-[#393939] rounded-[8px] px-3 py-2 text-xs text-[#fafafa] focus:outline-none focus:border-[#3ecf8e] transition-colors"
              >
                <option value="moderator" className="bg-[#121212] text-[#fafafa]">Moderator (Community & User Bans)</option>
                <option value="admin" className="bg-[#121212] text-[#fafafa]">Platform Administrator (Full Rights)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-[#898989] mb-1.5">
                Elevation Rationale
              </label>
              <input
                type="text"
                name="reason"
                required
                placeholder="e.g., Appointed Moderator..."
                className="w-full bg-[#121212] border border-[#393939] rounded-[8px] px-3 py-2 text-xs text-[#fafafa] placeholder-[#898989] focus:outline-none focus:border-[#3ecf8e] transition-colors"
              />
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-2.5 rounded-full bg-[#3ecf8e] text-[#121212] hover:bg-[#00c573] text-xs font-semibold tracking-tight flex items-center justify-center gap-2 transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Grant Role</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
