'use client';

import React, { useActionState, useState } from 'react';
import { banUserAction, unbanUserAction, type ActionResponse } from '@/lib/actions/moderation';
import { ShieldAlert, CheckCircle2, AlertTriangle, Ban, Undo2 } from 'lucide-react';

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
    <div className="p-6 rounded-[16px] bg-[#121212] border border-[#2e2e2e]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Ban className="w-4 h-4 text-[#3ecf8e]" />
          <div>
            <h3 className="text-sm font-medium text-[#fafafa] tracking-tight">Administrative Intervention</h3>
            <p className="text-xs text-[#898989]">Atomic enforcement with audit logging</p>
          </div>
        </div>
        <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-[#242424] border border-[#2e2e2e] text-[#b4b4b4]">
          AAL2
        </span>
      </div>

      {activeState?.error && (
        <div className="mb-4 p-3 rounded-[8px] border border-red-900/50 bg-[#121212] text-red-400 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{activeState.error}</span>
        </div>
      )}

      {activeState?.warning && (
        <div className="mb-4 p-3 rounded-[8px] border border-amber-900/50 bg-[#121212] text-amber-400 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{activeState.warning}</span>
        </div>
      )}

      {activeState?.success && !activeState?.warning && (
        <div className="mb-4 p-3 rounded-[8px] border border-[#1f4b37] bg-[#121212] text-[#3ecf8e] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{activeState.message || 'Action executed successfully.'}</span>
        </div>
      )}

      {isCurrentlyBanned ? (
        <form action={unbanAction} className="space-y-4">
          <input type="hidden" name="targetUserId" value={userId} />
          <div>
            <label className="block text-xs text-[#898989] mb-1.5">
              Pardon Justification (Audit Log Entry)
            </label>
            <input
              type="text"
              name="reason"
              required
              placeholder="State reason for restoring privileges..."
              className="w-full bg-[#121212] border border-[#393939] rounded-[8px] px-3.5 py-2 text-xs text-[#fafafa] placeholder-[#898989] focus:outline-none focus:border-[#3ecf8e] transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={isUnbanPending}
            className="w-full py-2.5 rounded-full bg-[#3ecf8e] hover:bg-[#00c573] text-[#121212] text-xs font-semibold tracking-tight flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <Undo2 className="w-4 h-4" />
            <span>{isUnbanPending ? 'Pardoning...' : 'Pardon Account'}</span>
          </button>
        </form>
      ) : (
        <form action={banAction} className="space-y-4">
          <input type="hidden" name="targetUserId" value={userId} />
          <input type="hidden" name="scope" value={selectedScope} />
          <input type="hidden" name="durationDays" value={selectedDuration} />

          <div>
            <label className="block text-xs text-[#898989] mb-1.5">
              Restriction Scope
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-[8px] bg-[#242424] border border-[#2e2e2e]">
              <button
                type="button"
                onClick={() => setSelectedScope('global')}
                className={`py-1 text-xs font-medium rounded-full transition-colors ${
                  selectedScope === 'global'
                    ? 'bg-[#121212] text-[#fafafa] border border-[#393939]'
                    : 'text-[#898989] hover:text-[#fafafa]'
                }`}
              >
                Global Ban
              </button>
              <button
                type="button"
                onClick={() => setSelectedScope('community')}
                className={`py-1 text-xs font-medium rounded-full transition-colors ${
                  selectedScope === 'community'
                    ? 'bg-[#121212] text-[#fafafa] border border-[#393939]'
                    : 'text-[#898989] hover:text-[#fafafa]'
                }`}
              >
                Community Only
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#898989] mb-1.5">
              Duration Preset
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: '24h', days: 1 },
                { label: '7d', days: 7 },
                { label: '30d', days: 30 },
                { label: 'Perm', days: 0 },
              ].map((preset) => (
                <button
                  key={preset.days}
                  type="button"
                  onClick={() => setSelectedDuration(preset.days)}
                  className={`py-1.5 text-xs font-mono rounded-[8px] border transition-colors ${
                    selectedDuration === preset.days
                      ? 'bg-[#121212] border-[#3ecf8e] text-[#3ecf8e]'
                      : 'bg-[#242424] border-[#2e2e2e] text-[#898989] hover:text-[#fafafa]'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#898989] mb-1.5">
              Reason (Audit Entry)
            </label>
            <input
              type="text"
              name="reason"
              required
              placeholder="e.g. Terms violation..."
              className="w-full bg-[#121212] border border-[#393939] rounded-[8px] px-3.5 py-2 text-xs text-[#fafafa] placeholder-[#898989] focus:outline-none focus:border-[#3ecf8e] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isBanPending}
            className="w-full py-2.5 rounded-full bg-red-600 hover:bg-red-500 text-[#fafafa] text-xs font-semibold tracking-tight flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <Ban className="w-4 h-4" />
            <span>
              {isBanPending
                ? 'Enforcing Restriction...'
                : 'Enforce Restriction'}
            </span>
          </button>
        </form>
      )}
    </div>
  );
}
