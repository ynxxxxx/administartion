import React from 'react';
import { adminClient } from '@/lib/db/supabase-admin';
import { banUserAction, unbanUserAction } from '@/lib/actions/moderation';
import { Search, ShieldAlert, CheckCircle2, AlertOctagon, User } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function UserLookupPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const query = searchParams?.q?.trim() || '';
  let foundUser: any = null;
  let userBans: any[] = [];
  let userFlags: any = null;

  if (query) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(query);

    let profileQuery = adminClient.from('profiles').select('*');
    if (isUuid) {
      profileQuery = profileQuery.eq('id', query);
    } else {
      profileQuery = profileQuery.ilike('username', query);
    }

    const { data: profile } = await profileQuery.maybeSingle();

    if (profile) {
      foundUser = profile;

      const [bansRes, flagsRes] = await Promise.all([
        adminClient.from('bans').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }),
        adminClient.from('user_flags').select('*').eq('user_id', profile.id).maybeSingle(),
      ]);

      userBans = bansRes.data || [];
      userFlags = flagsRes.data || null;
    }
  }

  const isCurrentlyBanned = userBans.some(
    (b) => b.scope === 'global' && (!b.expires_at || new Date(b.expires_at) > new Date())
  );

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <h1 className="font-mono text-lg font-bold text-slate-100 uppercase tracking-wider">
          User Lookup & Moderation Action
        </h1>
        <p className="text-xs text-slate-400 font-mono mt-1">
          Inspect user account flags, ban history, and enforce account restrictions.
        </p>
      </div>

      {/* Search Input */}
      <form method="GET" className="max-w-xl flex gap-2">
        <div className="relative flex-1">
          <input
            name="q"
            defaultValue={query}
            placeholder="Search by username (e.g. alice) or UUID..."
            className="w-full bg-surface border border-border px-3 py-2 text-xs text-slate-100 focus:border-accent focus:outline-none font-mono"
          />
          <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-600 font-mono text-xs uppercase"
        >
          Lookup User
        </button>
      </form>

      {query && !foundUser && (
        <div className="p-4 border border-border bg-surface text-slate-400 font-mono text-xs">
          No profile discovered matching: <span className="text-slate-200">{query}</span>
        </div>
      )}

      {foundUser && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* User Profile Card */}
          <div className="border border-border bg-surface p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-accent" />
                <span className="font-mono text-xs uppercase font-bold text-slate-200">
                  Profile Details
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                {isCurrentlyBanned ? (
                  <span className="text-danger flex items-center gap-1 font-bold">
                    <span className="w-2 h-2 rounded-full bg-danger"></span>
                    STATUS: BANNED
                  </span>
                ) : (
                  <span className="text-success flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-success"></span>
                    STATUS: ACTIVE
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div>
                <span className="text-slate-400">User ID: </span>
                <span className="text-slate-200 break-all">{foundUser.id}</span>
              </div>
              <div>
                <span className="text-slate-400">Username: </span>
                <span className="text-slate-100 font-bold">@{foundUser.username || 'unregistered'}</span>
              </div>
              <div>
                <span className="text-slate-400">Display Name: </span>
                <span className="text-slate-200">{foundUser.display_name || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400">Trust Level: </span>
                <span className="text-accent font-bold">Level {userFlags?.trust_level ?? 0}</span>
              </div>
              <div>
                <span className="text-slate-400">Created: </span>
                <span className="text-slate-300">{new Date(foundUser.created_at).toLocaleString()}</span>
              </div>
            </div>

            {/* Moderation Actions Form */}
            <div className="pt-4 border-t border-border">
              {isCurrentlyBanned ? (
                <form action={async (formData: FormData) => { "use server"; await unbanUserAction(formData); }} className="space-y-3">
                  <input type="hidden" name="targetUserId" value={foundUser.id} />
                  <div>
                    <label className="block text-slate-400 font-mono text-[11px] mb-1">
                      Unban Reason (Mandatory Audit Requirement)
                    </label>
                    <textarea
                      name="reason"
                      required
                      minLength={3}
                      className="w-full bg-surface-raised border border-border p-2 text-xs text-slate-100 focus:border-accent focus:outline-none"
                      rows={2}
                      placeholder="e.g. Completed appeal review and approved reinstatement."
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-100 border border-emerald-700 font-mono text-xs uppercase transition-colors"
                  >
                    Lift Ban & Reinstate User
                  </button>
                </form>
              ) : (
                <form action={async (formData: FormData) => { "use server"; await banUserAction(formData); }} className="space-y-3">
                  <input type="hidden" name="targetUserId" value={foundUser.id} />
                  <div>
                    <label className="block text-slate-400 font-mono text-[11px] mb-1">
                      Ban Scope
                    </label>
                    <select
                      name="scope"
                      className="w-full bg-surface-raised border border-border px-2 py-1.5 text-xs text-slate-100 focus:border-accent focus:outline-none"
                    >
                      <option value="global">Global (Platform-Wide Suspension)</option>
                      <option value="community">Community Scoped</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 font-mono text-[11px] mb-1">
                      Duration in Days (0 = Permanent)
                    </label>
                    <input
                      name="durationDays"
                      type="number"
                      defaultValue={0}
                      min={0}
                      className="w-full bg-surface-raised border border-border px-2 py-1.5 text-xs text-slate-100 focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-mono text-[11px] mb-1">
                      Mandatory Violation Reason
                    </label>
                    <textarea
                      name="reason"
                      required
                      minLength={3}
                      className="w-full bg-surface-raised border border-border p-2 text-xs text-slate-100 focus:border-accent focus:outline-none"
                      rows={2}
                      placeholder="e.g. Terms of Service violation: harassment in community chat."
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-rose-950/80 hover:bg-rose-900 text-rose-100 border border-rose-800 font-mono text-xs uppercase tracking-wider transition-colors"
                  >
                    Enforce Ban & Terminate Sessions
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Ban History Log Table */}
          <div className="md:col-span-2 border border-border bg-surface p-4">
            <h2 className="font-mono text-xs uppercase font-bold text-slate-200 mb-3 border-b border-border pb-2">
              Historical Account Restrictions ({userBans.length})
            </h2>

            {userBans.length === 0 ? (
              <p className="text-xs text-slate-500 font-mono py-4">No historical bans recorded for this user account.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-dense">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Scope</th>
                      <th>Reason</th>
                      <th>Expires</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userBans.map((ban) => (
                      <tr key={ban.id}>
                        <td className="font-mono">{new Date(ban.created_at).toLocaleDateString()}</td>
                        <td className="font-mono uppercase text-slate-300">{ban.scope}</td>
                        <td className="max-w-xs truncate text-slate-200">{ban.reason}</td>
                        <td className="font-mono text-slate-400">
                          {ban.expires_at ? new Date(ban.expires_at).toLocaleDateString() : 'Permanent'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
