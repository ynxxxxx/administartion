'use client';

import React, { useActionState, useState } from 'react';
import { banUserAction, unbanUserAction, type ActionResponse } from '@/lib/actions/moderation';
import { ShieldAlert, CheckCircle2, AlertTriangle, Ban, Undo2, Lock, Sparkles } from 'lucide-react';

interface UserActionFormProps {
  userId: string;
  isCurrentlyBanned: boolean;
}

export function UserActionForm({ userId, isCurrentlyBanned }: UserActionFormProps) {
  const [banState, banAction, isBanPending] = useActionState<ActionResponse | null, FormData>(
    banUserAction,
    null
  );

  const [unbanState, unbanAction, isUnbanPending] = useActionState<ActionResponse | null, FormData>(
    unbanUserAction,
    null
  );

  const [selectedDuration, setSelectedDuration] = useState<number>(0);
  const [selectedScope, setSelectedScope] = useState<'global' | 'community'>('global');

  const activeState = isCurrentlyBanned ? unbanState : banState;

  return (
    <div className="apple-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-apple-red/10 border border-apple-red/20 flex items-center justify-center text-apple-red">
            <Ban className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight">Administrative Intervention</h3>
            <p className="text-[11px] text-zinc-400">Atomic enforcement with cryptographic audit logging</p>
          </div>
        </div>
        <span className="text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-zinc-300">
          AAL2 Enforced
        </span>
      </div>

      {/* Action State Feedback Banners */}
      {activeState?.error && (
        <div className="mb-4 p-3.5 rounded-2xl border border-apple-red/30 bg-apple-red/10 text-apple-red text-xs flex items-center gap-2.5">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span className="font-medium">{activeState.error}</span>
        </div>
      )}

      {activeState?.warning && (
        <div className="mb-4 p-3.5 rounded-2xl border border-apple-amber/30 bg-apple-amber/10 text-apple-amber text-xs flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="font-medium">{activeState.warning}</span>
        </div>
      )}

      {activeState?.success && !activeState?.warning && (
        <div className="mb-4 p-3.5 rounded-2xl border border-apple-green/30 bg-apple-green/10 text-apple-green text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="font-medium">{activeState.message || 'Action executed successfully.'}</span>
        </div>
      )}

      {isCurrentlyBanned ? (
        <form action={unbanAction} className="space-y-4">
          <input type="hidden" name="targetUserId" value={userId} />
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1.5">
              Pardon Justification (Recorded in Tamper-Resistant Audit Log)
            </label>
            <input
              type="text"
              name="reason"
              required
              placeholder="State reason for restoring account privileges..."
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-apple-green focus:ring-1 focus:ring-apple-green"
            />
          </div>
          <button
            type="submit"
            disabled={isUnbanPending}
            className="w-full py-2.5 rounded-xl bg-apple-green hover:brightness-110 text-black text-xs font-semibold tracking-tight shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <Undo2 className="w-4 h-4" />
            <span>{isUnbanPending ? 'Pardoning Account...' : 'Confirm Account Pardon & Revoke Ban'}</span>
          </button>
        </form>
      ) : (
        <form action={banAction} className="space-y-4">
          <input type="hidden" name="targetUserId" value={userId} />
          <input type="hidden" name="scope" value={selectedScope} />
          <input type="hidden" name="durationDays" value={selectedDuration} />

          {/* Scope Segmented Pill */}
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1.5">
              Restriction Scope
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <button
                type="button"
                onClick={() => setSelectedScope('global')}
                className={`py-1.5 text-xs font-medium rounded-lg transition-all ${
                  selectedScope === 'global'
                    ? 'bg-white/15 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Global Platform Ban
              </button>
              <button
                type="button"
                onClick={() => setSelectedScope('community')}
                className={`py-1.5 text-xs font-medium rounded-lg transition-all ${
                  selectedScope === 'community'
                    ? 'bg-white/15 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Community Scoped Only
              </button>
            </div>
          </div>

          {/* Duration Preset Pills */}
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1.5">
              Restriction Duration
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: '24 Hours', days: 1 },
                { label: '7 Days', days: 7 },
                { label: '30 Days', days: 30 },
                { label: 'Permanent', days: 0 },
              ].map((preset) => (
                <button
                  key={preset.days}
                  type="button"
                  onClick={() => setSelectedDuration(preset.days)}
                  className={`py-1.5 text-xs font-medium rounded-xl border transition-all ${
                    selectedDuration === preset.days
                      ? 'bg-apple-red/15 border-apple-red/40 text-apple-red font-semibold'
                      : 'bg-white/[0.03] border-white/[0.06] text-zinc-400 hover:text-white'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Violation Reason */}
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1.5">
              Violation Rationale (Permanent Audit Entry)
            </label>
            <input
              type="text"
              name="reason"
              required
              placeholder="e.g., Harassment in comment section, spamming diary logs..."
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-apple-red focus:ring-1 focus:ring-apple-red"
            />
          </div>

          {/* Enforce Ban Submit Button */}
          <button
            type="submit"
            disabled={isBanPending}
            className="w-full py-2.5 rounded-xl bg-apple-red hover:brightness-110 text-white text-xs font-semibold tracking-tight shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <Ban className="w-4 h-4" />
            <span>
              {isBanPending
                ? 'Enforcing Restriction & Revoking Auth...'
                : 'Enforce Ban & Revoke Active Sessions'}
            </span>
          </button>
        </form>
      )}
    </div>
  );
}
