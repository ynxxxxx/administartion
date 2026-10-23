import React from 'react';
import { redirect } from 'next/navigation';
import { adminClient } from '@/lib/db/supabase-admin';
import { requireStaffSession } from '@/lib/auth/server-guard';
import { UserActionForm } from './user-action-form';
import { 
  Search, 
  ShieldAlert, 
  CheckCircle2, 
  User, 
  Calendar, 
  Tv, 
  Star, 
  AlertCircle, 
  History, 
  Film, 
  BadgeCheck 
} from 'lucide-react';

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
  let userLogs: any[] = [];

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

      const [bansRes, flagsRes, logsRes] = await Promise.all([
        adminClient.from('bans').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }),
        adminClient.from('user_flags').select('*').eq('user_id', profile.id).maybeSingle(),
        adminClient.from('logs').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(5),
      ]);

      userBans = bansRes.data || [];
      userFlags = flagsRes.data || null;
      userLogs = logsRes.data || [];
    }
  }

  const isCurrentlyBanned = userBans.some(
    (b) => b.scope === 'global' && (!b.expires_at || new Date(b.expires_at) > new Date())
  );

  return (
    <div className="space-y-3 pb-4">
      
      {/* 1. TOP SPOTLIGHT SEARCH BENTO */}
      <div className="apple-card p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
              <User className="w-4 h-4 text-apple-blue" />
              <span>User Intelligence & Moderation</span>
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Inspect user trust flags, TV diary records, and enforce administrative interventions.
            </p>
          </div>

          {/* Apple Spotlight Search Form */}
          <form method="GET" className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-80">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="q"
                defaultValue={query}
                placeholder="Lookup username or UUID..."
                className="w-full bg-white/[0.04] border border-white/10 rounded-full pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-apple-blue focus:ring-1 focus:ring-apple-blue"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-all active:scale-95 shrink-0"
            >
              Search
            </button>
          </form>
        </div>

        {/* Quick Suggestion Pills */}
        {!query && (
          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center gap-2 text-xs text-zinc-500">
            <span>Quick Query Examples:</span>
            {['alice', 'bob', 'charlie', 'dave'].map((name) => (
              <a
                key={name}
                href={`/users?q=${name}`}
                className="px-2.5 py-0.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/10 transition-colors text-[11px]"
              >
                @{name}
              </a>
            ))}
          </div>
        )}
      </div>

      {query && !foundUser && (
        <div className="apple-card p-12 text-center text-zinc-400 text-xs">
          <AlertCircle className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
          <span>Zero accounts discovered matching search term: </span>
          <strong className="text-white font-mono">{query}</strong>
        </div>
      )}

      {/* 2. USER FOUND: BENTO GRID DETAILS */}
      {foundUser && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          
          {/* Left Column (Cols 1-7): User Profile & TV History */}
          <div className="lg:col-span-7 space-y-3">
            
            {/* User Identity Bento Card */}
            <div className="apple-card p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/15 to-white/5 border border-white/15 flex items-center justify-center font-bold text-lg text-white shadow-inner">
                    {foundUser.username ? foundUser.username[0].toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h2 className="text-base font-bold text-white tracking-tight">
                        @{foundUser.username}
                      </h2>
                      {foundUser.onboarded && (
                        <span title="Onboarded"><BadgeCheck className="w-4 h-4 text-apple-blue" /></span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 font-mono">ID: {foundUser.id}</p>
                  </div>
                </div>

                {isCurrentlyBanned ? (
                  <span className="px-3 py-1 rounded-full bg-apple-red/10 border border-apple-red/30 text-apple-red text-[11px] font-semibold flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    BANNED ACCOUNT
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-apple-green/10 border border-apple-green/30 text-apple-green text-[11px] font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    ACCOUNT ACTIVE
                  </span>
                )}
              </div>

              {/* Identity Detail Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-white/[0.06] text-xs">
                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <span className="text-[10px] text-zinc-500 block mb-0.5">Display Name</span>
                  <span className="font-medium text-zinc-200">{foundUser.display_name || '--'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <span className="text-[10px] text-zinc-500 block mb-0.5">Account Flags</span>
                  <span className="font-medium text-zinc-200">{userFlags?.flag_count || 0} Flags</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <span className="text-[10px] text-zinc-500 block mb-0.5">Trust Quarantine</span>
                  <span className={`font-medium ${userFlags?.is_low_trust ? 'text-apple-amber' : 'text-zinc-200'}`}>
                    {userFlags?.is_low_trust ? 'Quarantined' : 'Normal'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <span className="text-[10px] text-zinc-500 block mb-0.5">Member Since</span>
                  <span className="font-medium text-zinc-200">
                    {new Date(foundUser.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* TV Activity & Diary History Bento Card */}
            <div className="apple-card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-apple-teal">
                    <Film className="w-3.5 h-3.5" />
                  </span>
                  <h3 className="text-xs font-semibold text-white tracking-tight">Recent Diary Logs & Reviews</h3>
                </div>
                <span className="text-[11px] text-zinc-500 font-mono">{userLogs.length} Entries</span>
              </div>

              {userLogs.length === 0 ? (
                <div className="p-6 text-center text-zinc-500 text-xs">
                  User has not published any public diary reviews yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {userLogs.map((log) => (
                    <div key={log.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-zinc-200">{log.show_name}</span>
                        <div className="flex items-center gap-2">
                          {log.rating && (
                            <span className="flex items-center gap-0.5 text-apple-amber text-[11px] font-bold">
                              <Star className="w-3 h-3 fill-apple-amber" />
                              <span>{log.rating}</span>
                            </span>
                          )}
                          <span className="text-[10px] text-zinc-500">
                            {new Date(log.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      {log.review_text && (
                        <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                          "{log.review_text}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Column (Cols 8-12): Moderation Intervention & Ban History */}
          <div className="lg:col-span-5 space-y-3">
            
            {/* Moderation Action Center */}
            <UserActionForm userId={foundUser.id} isCurrentlyBanned={isCurrentlyBanned} />

            {/* Historical Restrictions Bento Card */}
            <div className="apple-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-400">
                  <History className="w-3.5 h-3.5" />
                </span>
                <h3 className="text-xs font-semibold text-white tracking-tight">
                  Account Restriction History ({userBans.length})
                </h3>
              </div>

              {userBans.length === 0 ? (
                <div className="p-4 text-center text-zinc-500 text-xs">
                  Zero previous enforcement penalties logged.
                </div>
              ) : (
                <div className="space-y-2">
                  {userBans.map((ban) => (
                    <div key={ban.id} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="uppercase text-[9px] font-bold px-2 py-0.5 rounded-full bg-apple-red/10 text-apple-red border border-apple-red/20">
                          {ban.scope} Ban
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          {new Date(ban.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-300">"{ban.reason}"</p>
                      <div className="text-[10px] text-zinc-500">
                        Expires: {ban.expires_at ? new Date(ban.expires_at).toLocaleDateString() : 'Permanent'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
