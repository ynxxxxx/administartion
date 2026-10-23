'use server';

import { z } from 'zod';
import { requireStaffSession } from '../auth/server-guard';
import { adminClient } from '../db/supabase-admin';
import { revalidatePath } from 'next/cache';

const BanSchema = z.object({
  targetUserId: z.string().uuid({ message: 'Invalid target user ID' }),
  scope: z.enum(['global', 'community']).default('global'),
  communityId: z.string().uuid().optional().nullable(),
  reason: z.string().min(3, { message: 'Ban reason must be at least 3 characters' }).max(500),
  durationDays: z.number().int().min(0).max(3650).optional(), // 0 = permanent
});

const UnbanSchema = z.object({
  targetUserId: z.string().uuid({ message: 'Invalid target user ID' }),
  reason: z.string().min(3, { message: 'Unban reason must be at least 3 characters' }).max(500),
});

const StaffRoleSchema = z.object({
  targetUserId: z.string().uuid(),
  role: z.enum(['admin', 'moderator']),
  communityId: z.string().uuid().optional().nullable(),
  reason: z.string().min(3),
});

export type ActionResponse = {
  success: boolean;
  message?: string;
  error?: string;
  warning?: string;
};

/**
 * Server Action: Ban User
 * Calls atomic SQL procedure: private.ban_user_atomic via public.admin_ban_user RPC.
 * Atomically writes to bans + moderation_actions in a single database transaction.
 * Then calls signOut(target, 'global'). If signOut fails, returns error/warning to UI and logs it.
 * Ban is NOT undone if signOut fails.
 */
export async function banUserAction(
  _prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  // 1. Staff authentication & AAL2 MFA check
  const staff = await requireStaffSession('moderator');

  // 2. Input validation
  const parsed = BanSchema.safeParse({
    targetUserId: formData.get('targetUserId'),
    scope: formData.get('scope') || 'global',
    communityId: formData.get('communityId') || null,
    reason: formData.get('reason'),
    durationDays: Number(formData.get('durationDays') || 0),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { targetUserId, scope, communityId, reason, durationDays } = parsed.data;

  // Cannot ban yourself
  if (targetUserId === staff.userId) {
    return { success: false, error: 'Staff cannot ban their own account.' };
  }

  const expiresAt = durationDays && durationDays > 0 
    ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString()
    : null;

  try {
    // 3. Execute atomic transaction in PostgreSQL (bans + moderation_actions)
    const { error: rpcError } = await adminClient.rpc('admin_ban_user', {
      p_actor_id: staff.userId,
      p_target_user_id: targetUserId,
      p_scope: scope,
      p_reason: reason,
      p_expires_at: expiresAt,
      p_community_id: communityId,
    });

    if (rpcError) {
      return { success: false, error: `Atomic ban transaction failed: ${rpcError.message}` };
    }

    // 4. Revoke active auth sessions via Supabase Admin API
    let warningMsg: string | undefined;
    if (scope === 'global') {
      try {
        const { error: signOutError } = await adminClient.auth.admin.signOut(targetUserId, 'global');
        if (signOutError) {
          console.error(`Session revocation failed for banned user ${targetUserId}:`, signOutError);
          warningMsg = `User was successfully banned and audited, but active session revocation failed: ${signOutError.message}. The user will be blocked on subsequent token refresh.`;
        }
      } catch (err: any) {
        console.error(`Session revocation exception for banned user ${targetUserId}:`, err);
        warningMsg = `User was successfully banned and audited, but session revocation threw an error: ${err.message || err}`;
      }
    }

    revalidatePath('/users');
    revalidatePath('/audit');

    return {
      success: true,
      message: `User banned successfully (${scope}).`,
      warning: warningMsg,
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to execute ban action' };
  }
}

/**
 * Server Action: Unban User
 * Calls atomic SQL procedure: private.unban_user_atomic via public.admin_unban_user RPC.
 */
export async function unbanUserAction(
  _prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  const staff = await requireStaffSession('moderator');

  const parsed = UnbanSchema.safeParse({
    targetUserId: formData.get('targetUserId'),
    reason: formData.get('reason'),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { targetUserId, reason } = parsed.data;

  try {
    const { error: rpcError } = await adminClient.rpc('admin_unban_user', {
      p_actor_id: staff.userId,
      p_target_user_id: targetUserId,
      p_reason: reason,
    });

    if (rpcError) {
      return { success: false, error: `Atomic unban transaction failed: ${rpcError.message}` };
    }

    revalidatePath('/users');
    revalidatePath('/audit');
    return { success: true, message: 'User ban successfully revoked and recorded in audit log.' };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to revoke ban' };
  }
}

/**
 * Server Action: Assign Staff Role (Admin only)
 */
export async function assignStaffRoleAction(formData: FormData) {
  const staff = await requireStaffSession('admin');

  const parsed = StaffRoleSchema.safeParse({
    targetUserId: formData.get('targetUserId'),
    role: formData.get('role'),
    communityId: formData.get('communityId') || null,
    reason: formData.get('reason'),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { targetUserId, role, communityId, reason } = parsed.data;

  try {
    const { error: roleError } = await adminClient
      .from('staff_roles')
      .upsert({
        user_id: targetUserId,
        role,
        community_id: communityId,
      });

    if (roleError) {
      throw new Error(`Failed to assign staff role: ${roleError.message}`);
    }

    const { error: auditError } = await adminClient
      .from('moderation_actions')
      .insert({
        actor_id: staff.userId,
        action: 'role_grant',
        target_type: 'user',
        target_id: targetUserId,
        reason,
        metadata: { role, community_id: communityId },
      });

    if (auditError) {
      console.error(`Audit logging failed for role assignment:`, auditError);
    }

    revalidatePath('/staff');
    revalidatePath('/audit');
    return { success: true, message: `Staff role ${role} assigned successfully.` };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to assign staff role' };
  }
}
