import React from 'react';
import { adminClient } from '@/lib/db/supabase-admin';
import { assignStaffRoleAction } from '@/lib/actions/moderation';
import { requireStaffSession } from '@/lib/auth/server-guard';
import { UserCog, ShieldCheck, AlertCircle } from 'lucide-react';

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
    errorMsg = err.message || 'Access restricted to Platform Administrators';
  }

  if (!isAuthorizedAdmin) {
    return (
      <div className="p-6 border border-warning/40 bg-warning/10 text-warning font-mono text-xs max-w-xl">
        <div className="flex items-center gap-2 font-bold uppercase mb-2">
          <AlertCircle className="w-4 h-4" />
          <span>Access Restricted</span>
        </div>
        <p>Staff role assignment and elevation requires full Platform Administrator credentials.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <h1 className="font-mono text-lg font-bold text-slate-100 uppercase tracking-wider">
          Staff RBAC & Delegated Authority
        </h1>
        <p className="text-xs text-slate-400 font-mono mt-1">
          Assign moderator or administrative authority to authenticated profiles.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 border border-danger/40 bg-danger/10 text-danger font-mono text-xs">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Role Assignment Form */}
        <div className="border border-border bg-surface p-4">
          <div className="flex items-center gap-2 mb-4 border-b border-border pb-2">
            <UserCog className="w-4 h-4 text-accent" />
            <span className="font-mono text-xs uppercase font-bold text-slate-200">
              Grant Staff Authority
            </span>
          </div>

          <form action={async (formData: FormData) => { "use server"; await assignStaffRoleAction(formData); }} className="space-y-4 font-mono text-xs">
            <div>
              <label className="block text-slate-400 text-[11px] mb-1">Target User ID (UUID)</label>
              <input
                name="targetUserId"
                required
                placeholder="00000000-0000-0000-0000-000000000000"
                className="w-full bg-surface-raised border border-border p-2 text-xs text-slate-100 focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-[11px] mb-1">Staff Tier</label>
              <select
                name="role"
                className="w-full bg-surface-raised border border-border p-2 text-xs text-slate-100 focus:border-accent focus:outline-none"
              >
                <option value="moderator">Community Moderator (Content & Ban Actions)</option>
                <option value="admin">Platform Administrator (Full Access + Staff RBAC)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 text-[11px] mb-1">Mandatory Authorization Reason</label>
              <textarea
                name="reason"
                required
                minLength={3}
                rows={2}
                placeholder="e.g. Onboarded to support team."
                className="w-full bg-surface-raised border border-border p-2 text-xs text-slate-100 focus:border-accent focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-600 uppercase tracking-wider"
            >
              Assign Role & Write Audit Record
            </button>
          </form>
        </div>

        {/* Current Staff List */}
        <div className="md:col-span-2 border border-border bg-surface p-4">
          <h2 className="font-mono text-xs uppercase font-bold text-slate-200 mb-3 border-b border-border pb-2">
            Active Staff Directory ({staffList.length})
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full table-dense">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Scope</th>
                  <th>Granted</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map((member) => (
                  <tr key={member.id}>
                    <td className="font-mono text-slate-400 text-[11px] truncate max-w-[120px]">
                      {member.user_id}
                    </td>
                    <td className="font-mono text-slate-100">
                      @{member.profiles?.username || 'unregistered'}
                    </td>
                    <td className="font-mono uppercase font-bold text-accent">
                      {member.role}
                    </td>
                    <td className="font-mono text-slate-400 text-[11px]">
                      {member.community_id ? 'Scoped' : 'Global'}
                    </td>
                    <td className="font-mono text-slate-400 text-[11px]">
                      {new Date(member.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
