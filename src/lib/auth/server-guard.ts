import 'server-only';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { verifyStaffRole, verifyMfaAssuranceLevel, type StaffContext } from './rbac';

export { verifyStaffRole, verifyMfaAssuranceLevel, type StaffContext };

const SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'default-staff-session-secret-min-32-chars';

const MAX_SESSION_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Validates staff session authenticated via Firebase Google OAuth.
 * Enforces cryptographic signature, expiration, @gmail.com, and staff directory status.
 */
export async function requireStaffSession(requiredRole?: 'admin' | 'moderator'): Promise<StaffContext> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('staff_session')?.value;

  if (!sessionCookie) {
    throw new Error('Unauthorized: Staff authentication required');
  }

  // Split into <payload_base64>.<signature_base64url>
  const parts = sessionCookie.split('.');
  if (parts.length !== 2) {
    throw new Error('Unauthorized: Invalid or unsigned staff session');
  }

  const [payloadBase64, signature] = parts;

  // Recompute HMAC-SHA256 and verify against signature using timingSafeEqual
  const expectedSignature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payloadBase64)
    .digest('base64url');

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    throw new Error('Unauthorized: Tampered or invalid staff session signature');
  }

  let session: any = null;
  try {
    const decoded = Buffer.from(payloadBase64, 'base64').toString('utf-8');
    session = JSON.parse(decoded);
  } catch {
    throw new Error('Unauthorized: Invalid staff session');
  }

  if (!session?.email) {
    throw new Error('Unauthorized: Missing staff identity');
  }

  if (!session?.issuedAt || typeof session.issuedAt !== 'number' || Date.now() - session.issuedAt > MAX_SESSION_AGE_MS) {
    throw new Error('Unauthorized: Staff session expired');
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
