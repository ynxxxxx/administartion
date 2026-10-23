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

/**
 * Server Action: Ban User
 * Atomic execution: Writes to bans -> writes to moderation_actions -> revokes auth sessions.
 * FAILS LOUDLY if audit write fails.
 */
export async function banUserAction(formData: FormData) {
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
    return { success: false, error: 'Cannot ban your own account.' };
  }

  const expiresAt = durationDays && durationDays > 0 
    ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString()
    : null;

  try {
    // 3. Insert into public.bans
    const { data: banRecord, error: banError } = await adminClient
      .from('bans')
      .insert({
        user_id: targetUserId,
        scope,
        community_id: communityId,
        reason,
        banned_by: staff.userId,
        expires_at: expiresAt,
      })
      .select('id')
      .single();

    if (banError || !banRecord) {
      throw new Error(`Failed to insert ban record: ${banError?.message}`);
    }

    // 4. Write to append-only moderation_actions table (FAIL LOUDLY IF FAILS)
    const { error: auditError } = await adminClient
      .from('moderation_actions')
      .insert({
        actor_id: staff.userId,
        action: 'ban',
        target_type: 'user',
        target_id: targetUserId,
        reason,
        metadata: {
          ban_id: banRecord.id,
          scope,
          community_id: communityId,
          expires_at: expiresAt,
        },
      });

    if (auditError) {
      // Rollback ban if audit write fails to preserve audit integrity
      await adminClient.from('bans').delete().eq('id', banRecord.id);
      throw new Error(`CRITICAL: Audit log write failed. Ban aborted: ${auditError.message}`);
    }

    // 5. Revoke active auth sessions via Admin API (Global Bans)
    if (scope === 'global') {
      try {
        await adminClient.auth.admin.signOut(targetUserId, 'global');
      } catch (err) {
        console.warn(`Could not force signOut for user ${targetUserId}:`, err);
      }
    }

    revalidatePath('/users');
    revalidatePath('/audit');
    return { success: true, message: `User banned successfully (${scope}).` };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to ban user' };
  }
}

/**
 * Server Action: Unban User
 */
export async function unbanUserAction(formData: FormData) {
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
    // 1. Delete active bans for target user
    const { error: unbanError } = await adminClient
      .from('bans')
      .delete()
      .eq('user_id', targetUserId);

    if (unbanError) {
      throw new Error(`Failed to remove ban: ${unbanError.message}`);
    }

    // 2. Append to moderation_actions (FAIL LOUDLY)
    const { error: auditError } = await adminClient
      .from('moderation_actions')
      .insert({
        actor_id: staff.userId,
        action: 'unban',
        target_type: 'user',
        target_id: targetUserId,
        reason,
        metadata: { unbanned_by: staff.userId },
      });

    if (auditError) {
      throw new Error(`CRITICAL: Audit log write failed for unban: ${auditError.message}`);
    }

    revalidatePath('/users');
    revalidatePath('/audit');
    return { success: true, message: 'User unbanned successfully.' };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to unban user' };
  }
}

/**
 * Server Action: Manage Staff Roles (Admin Only)
 */
export async function assignStaffRoleAction(formData: FormData) {
  const staff = await requireStaffSession('admin'); // STRICT ADMIN ONLY

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
    const { error: staffError } = await adminClient
      .from('staff_roles')
      .upsert({
        user_id: targetUserId,
        role,
        community_id: communityId,
      }, { onConflict: 'user_id,role,community_id' });

    if (staffError) {
      throw new Error(`Failed to assign staff role: ${staffError.message}`);
    }

    const { error: auditError } = await adminClient
      .from('moderation_actions')
      .insert({
        actor_id: staff.userId,
        action: 'assign_staff',
        target_type: 'user',
        target_id: targetUserId,
        reason,
        metadata: { role, community_id: communityId },
      });

    if (auditError) {
      throw new Error(`CRITICAL: Audit log write failed: ${auditError.message}`);
    }

    revalidatePath('/staff');
    revalidatePath('/audit');
    return { success: true, message: `Staff role (${role}) assigned successfully.` };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to assign staff role' };
  }
}
