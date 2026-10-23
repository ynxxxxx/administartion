/**
 * Security Build Check: Prevent Leaking Secrets to Client Bundles
 * Ensures no client component references server-only secrets or service keys.
 */

const fs = require('fs');
const path = require('path');

const FORBIDDEN_PATTERNS = [
  /SUPABASE_SERVICE_ROLE_KEY/i,
  /service_role/i,
  /ADMIN_SESSION_SECRET/i,
  /MODERATION_SHARED_SECRET/i
];

function checkDirectory(dir) {
  let hasViolation = false;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.next') {
        if (checkDirectory(fullPath)) hasViolation = true;
      }
    } else if (/\.(js|jsx|ts|tsx)$/.test(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const isClientComponent = content.includes("'use client'") || content.includes('"use client"');

      if (isClientComponent) {
        for (const pattern of FORBIDDEN_PATTERNS) {
          if (pattern.test(content)) {
            console.error(`SECURITY ERROR: Client component "${fullPath}" references forbidden secret pattern "${pattern}"!`);
            hasViolation = true;
          }
        }
      }
    }
  }

  return hasViolation;
}

const srcDir = path.join(__dirname, '..', 'src');
console.log('Running client bundle security check on:', srcDir);
if (fs.existsSync(srcDir)) {
  const violation = checkDirectory(srcDir);
  if (violation) {
    console.error('FATAL: Build aborted due to secret reference in client bundle.');
    process.exit(1);
  }
}
console.log('OK: Zero server secrets discovered in client component bundles.');
process.exit(0);
