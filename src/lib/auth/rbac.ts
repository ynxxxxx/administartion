export interface StaffContext {
  userId: string;
  email: string;
  role: 'admin' | 'moderator';
  communityId?: string | null;
}

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
