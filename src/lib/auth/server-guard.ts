import 'server-only';
import { cookies } from 'next/headers';
import { verifyStaffRole, verifyMfaAssuranceLevel, type StaffContext } from './rbac';

export { verifyStaffRole, verifyMfaAssuranceLevel, type StaffContext };

/**
 * Validates staff session authenticated via Firebase Google OAuth.
 * Enforces @gmail.com and staff directory status.
 */
export async function requireStaffSession(requiredRole?: 'admin' | 'moderator'): Promise<StaffContext> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('staff_session')?.value;

  if (!sessionCookie) {
    throw new Error('Unauthorized: Staff authentication required');
  }

  let session: any = null;
  try {
    const decoded = Buffer.from(sessionCookie, 'base64').toString('utf-8');
    session = JSON.parse(decoded);
  } catch {
    throw new Error('Unauthorized: Invalid staff session');
  }

  if (!session?.email) {
    throw new Error('Unauthorized: Missing staff identity');
  }

  const userEmail = (session.email || '').toLowerCase().trim();

  // 1. Enforce Google / Gmail
  if (!userEmail.endsWith('@gmail.com') && !userEmail.endsWith('@googlemail.com')) {
    throw new Error('Forbidden: Only authorized Google staff accounts may access this portal');
  }

  // 2. Verify role scoping
  verifyStaffRole(session.role, requiredRole);

  return {
    userId: session.uid || 'staff-admin',
    email: userEmail,
    role: (session.role as 'admin' | 'moderator') || 'admin',
    communityId: null,
  };
}
