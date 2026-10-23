import 'server-only';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { adminClient } from '../db/supabase-admin';
import { verifyStaffRole, verifyMfaAssuranceLevel, type StaffContext } from './rbac';

export { verifyStaffRole, verifyMfaAssuranceLevel, type StaffContext };

export async function createClientFromCookies() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ldiyekkmzhzmnztvdckc.supabase.co';
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkaXlla2ttemh6bW56dHZkY2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3Njg3NTUsImV4cCI6MjEwODM0NDc1NX0.yJ-Nd3CNvirlYlVPtyc5WidHt6l_41qVKTOdJmccf-M';

  return createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {}
      },
    },
  });
}

/**
 * Enforces staff authentication, role scoping, and Gmail/Google identity.
 * Must be invoked inside every server action and protected page.
 */
export async function requireStaffSession(requiredRole?: 'admin' | 'moderator'): Promise<StaffContext> {
  const client = await createClientFromCookies();
  const { data: { user }, error: authError } = await client.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized: Staff authentication required');
  }

  const userEmail = (user.email || '').toLowerCase().trim();

  // 1. Enforce Google / Gmail
  if (!userEmail.endsWith('@gmail.com') && !userEmail.endsWith('@googlemail.com')) {
    throw new Error('Forbidden: Only authorized Google staff accounts may access this portal');
  }

  // 2. Query staff_roles table
  let { data: staffRecord, error: staffError } = await adminClient
    .from('staff_roles')
    .select('role, community_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!staffRecord) {
    // Auto-bootstrap primary administrator
    if (userEmail === 'younesbouziane38@gmail.com') {
      await adminClient.from('staff_roles').upsert({
        user_id: user.id,
        role: 'admin',
      });
      staffRecord = { role: 'admin', community_id: null };
    }
  }

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
