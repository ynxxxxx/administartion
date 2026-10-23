'use client';

import React, { useActionState } from 'react';
import { banUserAction, unbanUserAction, type ActionResponse } from '@/lib/actions/moderation';
import { AlertOctagon, CheckCircle2, AlertTriangle } from 'lucide-react';

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

  const activeState = isCurrentlyBanned ? unbanState : banState;

  return (
    <div className="border border-border bg-surface p-6">
      <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
        <AlertOctagon className="w-4 h-4 text-warning" />
        <span>Enforce Administrative Intervention</span>
      </h3>

      {/* Action Feedback Alerts */}
      {activeState?.error && (
        <div className="mb-4 p-3 border border-danger/40 bg-danger/10 text-danger font-mono text-xs flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 shrink-0" />
          <span>{activeState.error}</span>
        </div>
      )}

      {activeState?.warning && (
        <div className="mb-4 p-3 border border-warning/40 bg-warning/10 text-warning font-mono text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{activeState.warning}</span>
        </div>
      )}

      {activeState?.success && !activeState?.warning && (
        <div className="mb-4 p-3 border border-success/40 bg-success/10 text-success font-mono text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{activeState.message || 'Action executed successfully.'}</span>
        </div>
      )}

      {isCurrentlyBanned ? (
        <form action={unbanAction} className="space-y-4 max-w-xl">
          <input type="hidden" name="targetUserId" value={userId} />
          <div>
            <label className="block font-mono text-[11px] text-slate-400 mb-1">
              Revocation Justification (Recorded in Tamper-Resistant Audit Log)
            </label>
            <input
              type="text"
              name="reason"
              required
              placeholder="Enter audit reason for pardon..."
              className="w-full bg-surface-raised border border-border px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-accent"
            />
          </div>
          <button
            type="submit"
            disabled={isUnbanPending}
            className="px-4 py-2 bg-success text-slate-950 font-mono text-xs font-bold hover:bg-success/90 transition-colors disabled:opacity-50"
          >
            {isUnbanPending ? 'Executing Unban...' : 'Confirm Account Pardon & Unban'}
          </button>
        </form>
      ) : (
        <form action={banAction} className="space-y-4 max-w-xl">
          <input type="hidden" name="targetUserId" value={userId} />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-[11px] text-slate-400 mb-1">
                Enforcement Scope
              </label>
              <select
                name="scope"
                className="w-full bg-surface-raised border border-border px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-accent"
              >
                <option value="global">Global Platform Ban</option>
                <option value="community">Community Scoped</option>
              </select>
            </div>
            <div>
              <label className="block font-mono text-[11px] text-slate-400 mb-1">
                Duration (Days, 0 = Permanent)
              </label>
              <input
                type="number"
                name="durationDays"
                defaultValue={0}
                min={0}
                max={3650}
                className="w-full bg-surface-raised border border-border px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div>
            <label className="block font-mono text-[11px] text-slate-400 mb-1">
              Enforcement Reason (Mandatory Audit Trail Entry)
            </label>
            <input
              type="text"
              name="reason"
              required
              placeholder="Provide detailed violation rationale..."
              className="w-full bg-surface-raised border border-border px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-accent"
            />
          </div>

          <button
            type="submit"
            disabled={isBanPending}
            className="px-4 py-2 bg-danger text-white font-mono text-xs font-bold hover:bg-danger/90 transition-colors disabled:opacity-50"
          >
            {isBanPending ? 'Enforcing Ban...' : 'Execute Ban & Revoke All Active Sessions'}
          </button>
        </form>
      )}
    </div>
  );
}
