import React from 'react';
import { redirect } from 'next/navigation';
import { adminClient } from '@/lib/db/supabase-admin';
import { requireStaffSession } from '@/lib/auth/server-guard';
import { UserActionForm } from './user-action-form';
import { Search, ShieldAlert, CheckCircle2, AlertOctagon, User } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function UserLookupPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  try {
    await requireStaffSession('moderator');
  } catch (err: any) {
    if (err?.message?.includes('MFA')) {
      redirect('/mfa');
    }
    redirect('/login');
  }

  const resolvedParams = await searchParams;
  const query = resolvedParams?.q?.trim() || '';
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
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search by UUID or username..."
            className="w-full bg-surface border border-border px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-accent"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-surface-raised hover:bg-border text-slate-200 border border-border font-mono text-xs flex items-center gap-2 transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Lookup</span>
        </button>
      </form>

      {query && !foundUser && (
        <div className="p-4 border border-border bg-surface text-slate-400 font-mono text-xs">
          Zero user accounts discovered matching: <span className="text-slate-200">{query}</span>
        </div>
      )}

      {foundUser && (
        <div className="space-y-6">
          {/* User Dossier */}
          <div className="border border-border bg-surface p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-surface-raised border border-border flex items-center justify-center font-mono font-bold text-accent">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-mono text-base font-bold text-slate-100">
                    @{foundUser.username}
                  </h2>
                  <p className="font-mono text-[11px] text-slate-500">
                    ID: {foundUser.id}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isCurrentlyBanned ? (
                  <span className="px-2.5 py-1 bg-danger/10 border border-danger/40 text-danger font-mono text-[11px] flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    BANNED
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-success/10 border border-success/40 text-success font-mono text-[11px] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    ACCOUNT ACTIVE
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border font-mono text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Display Name</span>
                <span className="text-slate-200">{foundUser.display_name || '--'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Onboarded</span>
                <span className="text-slate-200">{foundUser.onboarded ? 'Yes' : 'No'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Flag Count</span>
                <span className="text-slate-200">{userFlags?.flag_count || 0}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Low Trust Quarantine</span>
                <span className="text-slate-200">{userFlags?.is_low_trust ? 'Active' : 'No'}</span>
              </div>
            </div>
          </div>

          {/* Action Enforcement Bar */}
          <UserActionForm userId={foundUser.id} isCurrentlyBanned={isCurrentlyBanned} />

          {/* Historical Bans */}
          <div className="border border-border bg-surface overflow-hidden">
            <div className="p-3 bg-surface-raised border-b border-border font-mono text-xs text-slate-400 font-bold uppercase">
              Account Restriction History ({userBans.length})
            </div>
            {userBans.length === 0 ? (
              <div className="p-4 text-center text-slate-500 font-mono text-xs">
                Zero historic restrictions logged for this user.
              </div>
            ) : (
              <table className="w-full table-dense">
                <thead>
                  <tr className="border-b border-border bg-surface-raised/40">
                    <th className="p-2 text-left text-slate-400 font-normal">Scope</th>
                    <th className="p-2 text-left text-slate-400 font-normal">Reason</th>
                    <th className="p-2 text-left text-slate-400 font-normal">Expires</th>
                    <th className="p-2 text-left text-slate-400 font-normal">Banned At</th>
                  </tr>
                </thead>
                <tbody>
                  {userBans.map((b) => (
                    <tr key={b.id} className="border-b border-border/40 font-mono text-xs">
                      <td className="p-2 uppercase text-slate-300">{b.scope}</td>
                      <td className="p-2 text-slate-200">{b.reason}</td>
                      <td className="p-2 text-slate-400">{b.expires_at ? new Date(b.expires_at).toLocaleDateString() : 'Permanent'}</td>
                      <td className="p-2 text-slate-500">{new Date(b.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
