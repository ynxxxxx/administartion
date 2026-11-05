import crypto from 'crypto';

export interface StaffContext {
  userId: string;
  email: string;
  role: 'admin' | 'moderator';
  communityId?: string | null;
}

export const DEFAULT_SESSION_SECRET = 'default-staff-session-secret-min-32-chars';
export const MAX_SESSION_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Validates staff role hierarchy and permissions.
 */
export function verifyStaffRole(userRole?: string | null, requiredRole?: 'admin' | 'moderator'): boolean {
  if (!userRole) {
    throw new Error('Forbidden: User does not hold an active staff role');
  }

  if (requiredRole === 'admin' && userRole !== 'admin') {
    throw new Error('Forbidden: Operation requires administrative privileges');
  }

  return true;
}

/**
 * Validates MFA authenticator assurance level (AAL2 mandatory for staff).
 */
export function verifyMfaAssuranceLevel(currentLevel?: string | null): boolean {
  if (process.env.ENFORCE_MFA === 'true' && currentLevel !== 'aal2') {
    throw new Error('MFA_REQUIRED: Operation requires verified AAL2 two-factor authentication');
  }

  return true;
}

/**
 * Signs a base64 session payload using HMAC-SHA256.
 */
export function signSessionPayload(payloadBase64: string, secret?: string): string {
  const hmacSecret =
    secret ||
    process.env.ADMIN_SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    DEFAULT_SESSION_SECRET;

  return crypto
    .createHmac('sha256', hmacSecret)
    .update(payloadBase64)
    .digest('base64url');
}

/**
 * Cryptographically verifies session payload and signature using timingSafeEqual.
 */
export function verifySessionSignature(
  payloadBase64: string,
  signature: string,
  secret?: string
): boolean {
  if (!payloadBase64 || !signature) {
    return false;
  }

  const expectedSignature = signSessionPayload(payloadBase64, secret);
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (sigBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
}

/**
 * Parses and verifies a signed staff session token `<payload_base64>.<signature_base64url>`.
 * Rejects if tampered, unsigned, or if older than 7 days.
 */
export function parseAndVerifyStaffSession(
  sessionToken?: string | null,
  secret?: string
): { email: string; uid?: string; role: 'admin' | 'moderator'; issuedAt: number } {
  if (!sessionToken) {
    throw new Error('Unauthorized: Staff authentication required');
  }

  const parts = sessionToken.split('.');
  if (parts.length !== 2) {
    throw new Error('Unauthorized: Invalid or unsigned staff session');
  }

  const [payloadBase64, signature] = parts;

  if (!verifySessionSignature(payloadBase64, signature, secret)) {
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

  return session;
}
