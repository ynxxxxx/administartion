/**
 * Core RBAC & MFA Verification Logic (Real Guard Code)
 */

function verifyStaffRole(userRole, requiredRole) {
  if (!userRole) {
    throw new Error('Forbidden: User does not hold an active staff role');
  }

  if (requiredRole === 'admin' && userRole !== 'admin') {
    throw new Error('Forbidden: Operation requires administrative privileges');
  }

  return true;
}

function verifyMfaAssuranceLevel(currentLevel) {
  if (currentLevel !== 'aal2') {
    throw new Error('MFA_REQUIRED: Operation requires verified AAL2 two-factor authentication');
  }

  return true;
}

module.exports = {
  verifyStaffRole,
  verifyMfaAssuranceLevel,
};
