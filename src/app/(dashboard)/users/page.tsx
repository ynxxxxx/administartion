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
      redirect('/login');
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
    <div className="space-y-6 pb-8">
      {/* Search Header Card */}
      <div className="p-6 rounded-[16px] bg-[#121212] border border-[#2e2e2e]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-medium text-[#fafafa] tracking-tight flex items-center gap-2">
              <User className="w-5 h-5 text-[#3ecf8e]" />
              <span>User Intelligence & Moderation</span>
            </h1>
            <p className="text-sm text-[#898989] mt-1">
              Inspect user trust flags, TV diary records, and enforce administrative interventions.
            </p>
          </div>

          <form method="GET" className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-[#898989] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="q"
                defaultValue={query}
                placeholder="Lookup username or UUID..."
                className="w-full bg-[#121212] border border-[#393939] rounded-[8px] pl-9 pr-4 py-2 text-sm text-[#fafafa] placeholder-[#898989] focus:outline-none focus:border-[#3ecf8e] transition-colors"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-full bg-[#3ecf8e] text-[#121212] hover:bg-[#00c573] text-sm font-semibold transition-colors shrink-0"
            >
              Search
            </button>
          </form>
        </div>

        {!query && (
          <div className="mt-4 pt-4 border-t border-[#2e2e2e] flex items-center gap-2 text-xs text-[#898989]">
            <span>Suggestions:</span>
            {['alice', 'bob', 'charlie'].map((name) => (
              <a
                key={name}
                href={`/users?q=${name}`}
                className="px-2.5 py-0.5 rounded-full bg-[#242424] border border-[#2e2e2e] text-[#b4b4b4] hover:text-[#fafafa] hover:border-[#393939] transition-colors font-mono text-[11px]"
              >
                @{name}
              </a>
            ))}
          </div>
        )}
      </div>

      {query && !foundUser && (
        <div className="p-12 rounded-[16px] bg-[#121212] border border-[#2e2e2e] text-center text-[#898989] text-sm">
          <AlertCircle className="w-8 h-8 text-[#4d4d4d] mx-auto mb-2" />
          <span>Zero accounts discovered matching search term: </span>
          <strong className="text-[#fafafa] font-mono">{query}</strong>
        </div>
      )}

      {/* User Found Grid */}
      {foundUser && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Profile & Activity */}
          <div className="lg:col-span-7 space-y-6">
            <div className="p-6 rounded-[16px] bg-[#121212] border border-[#2e2e2e]">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-[16px] bg-[#242424] border border-[#2e2e2e] flex items-center justify-center font-medium text-lg text-[#fafafa]">
                    {foundUser.username ? foundUser.username[0].toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-medium text-[#fafafa] tracking-tight">
                        @{foundUser.username}
                      </h2>
                      {foundUser.onboarded && (
                        <span title="Onboarded"><BadgeCheck className="w-4 h-4 text-[#3ecf8e]" /></span>
                      )}
                    </div>
                    <p className="text-xs text-[#898989] font-mono mt-0.5">ID: {foundUser.id}</p>
                  </div>
                </div>

                {isCurrentlyBanned ? (
                  <span className="px-3 py-1 rounded-full bg-[#121212] border border-red-900/50 text-red-400 text-xs font-mono flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    BANNED
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-[#121212] border border-[#1f4b37] text-[#3ecf8e] text-xs font-mono flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    ACTIVE
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-[#2e2e2e] text-xs">
                <div className="p-3 rounded-[8px] bg-[#242424]/40 border border-[#2e2e2e]">
                  <span className="text-[11px] text-[#898989] block mb-1">Display Name</span>
                  <span className="font-medium text-[#fafafa]">{foundUser.display_name || '--'}</span>
                </div>
                <div className="p-3 rounded-[8px] bg-[#242424]/40 border border-[#2e2e2e]">
                  <span className="text-[11px] text-[#898989] block mb-1">Account Flags</span>
                  <span className="font-medium text-[#fafafa]">{userFlags?.flag_count || 0}</span>
                </div>
                <div className="p-3 rounded-[8px] bg-[#242424]/40 border border-[#2e2e2e]">
                  <span className="text-[11px] text-[#898989] block mb-1">Trust Status</span>
                  <span className={`font-medium ${userFlags?.is_low_trust ? 'text-amber-400' : 'text-[#3ecf8e]'}`}>
                    {userFlags?.is_low_trust ? 'Quarantined' : 'Normal'}
                  </span>
                </div>
                <div className="p-3 rounded-[8px] bg-[#242424]/40 border border-[#2e2e2e]">
                  <span className="text-[11px] text-[#898989] block mb-1">Member Since</span>
                  <span className="font-medium text-[#fafafa]">
                    {new Date(foundUser.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* TV Activity Card */}
            <div className="p-6 rounded-[16px] bg-[#121212] border border-[#2e2e2e]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4 text-[#3ecf8e]" />
                  <h3 className="text-sm font-medium text-[#fafafa]">Recent Diary Logs & Reviews</h3>
                </div>
                <span className="text-xs text-[#898989] font-mono">{userLogs.length} Entries</span>
              </div>

              {userLogs.length === 0 ? (
                <div className="py-8 text-center text-[#898989] text-xs">
                  Zero diary logs recorded.
                </div>
              ) : (
                <div className="space-y-2">
                  {userLogs.map((log) => (
                    <div key={log.id} className="p-3.5 rounded-[8px] bg-[#242424]/30 border border-[#2e2e2e] space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-[#fafafa]">{log.show_name}</span>
                        <div className="flex items-center gap-2">
                          {log.rating && (
                            <span className="flex items-center gap-0.5 text-amber-400 text-xs font-mono font-medium">
                              <Star className="w-3 h-3 fill-amber-400" />
                              <span>{log.rating}</span>
                            </span>
                          )}
                          <span className="text-[#898989] text-[11px]">
                            {new Date(log.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      {log.review_text && (
                        <p className="text-xs text-[#b4b4b4] line-clamp-2 leading-relaxed">
                          "{log.review_text}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Moderation & Restrictions */}
          <div className="lg:col-span-5 space-y-6">
            <UserActionForm userId={foundUser.id} isCurrentlyBanned={isCurrentlyBanned} />

            <div className="p-6 rounded-[16px] bg-[#121212] border border-[#2e2e2e]">
              <div className="flex items-center gap-2 mb-4">
                <History className="w-4 h-4 text-[#898989]" />
                <h3 className="text-sm font-medium text-[#fafafa]">
                  Restriction History ({userBans.length})
                </h3>
              </div>

              {userBans.length === 0 ? (
                <div className="py-6 text-center text-[#898989] text-xs">
                  Zero restrictions recorded.
                </div>
              ) : (
                <div className="space-y-2">
                  {userBans.map((ban) => (
                    <div key={ban.id} className="p-3 rounded-[8px] bg-[#242424]/30 border border-[#2e2e2e] text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="uppercase text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#121212] text-red-400 border border-red-950">
                          {ban.scope} Ban
                        </span>
                        <span className="text-[11px] text-[#898989]">
                          {new Date(ban.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-[#b4b4b4]">"{ban.reason}"</p>
                      <div className="text-[10px] text-[#898989] font-mono">
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
