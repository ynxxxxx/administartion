// Server-only Supabase Admin Client
// STRICT INVARIANT: This file must NEVER be imported in client components.
import 'server-only';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !serviceRoleKey) {
  // Fail fast in production if server credentials are not configured
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured.');
  }
}

export const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
