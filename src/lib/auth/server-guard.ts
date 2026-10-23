import 'server-only';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { adminClient } from '../db/supabase-admin';
import { verifyStaffRole, verifyMfaAssuranceLevel, type StaffContext } from './rbac';

export { verifyStaffRole, verifyMfaAssuranceLevel, type StaffContext };

export async function createClientFromCookies() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const anonKey = process.env.SUPABASE_ANON_KEY || '';

  return createServerClient(supabaseUrl, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {}
      },
      remove(name: string, options: any) {
        try {
          cookieStore.set({ name, value: '', ...options });
        } catch {}
      },
    },
  });
}

/**
 * Enforces staff authentication, MFA AAL2 assurance, and role scoping.
 * Must be invoked inside every server action and route handler.
 */
export async function requireStaffSession(requiredRole?: 'admin' | 'moderator'): Promise<StaffContext> {
  const client = await createClientFromCookies();
  const { data: { user }, error: authError } = await client.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized: Staff authentication required');
  }

  // 1. Verify MFA Assurance Level (aal2 required for all staff operations)
  const { data: aalData, error: aalError } = await client.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aalError) {
    throw new Error('MFA_REQUIRED: Failed to inspect assurance level');
  }
  verifyMfaAssuranceLevel(aalData?.currentLevel);

  // 2. Query staff_roles table using server client
  const { data: staffRecord, error: staffError } = await adminClient
    .from('staff_roles')
    .select('role, community_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (staffError || !staffRecord) {
    throw new Error('Forbidden: User does not hold an active staff role');
  }

  // 3. Verify role scoping
  verifyStaffRole(staffRecord.role, requiredRole);

  return {
    userId: user.id,
    email: user.email || '',
    role: staffRecord.role as 'admin' | 'moderator',
    communityId: staffRecord.community_id,
  };
}
