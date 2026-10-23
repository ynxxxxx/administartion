// Server-only Supabase Admin Client
// STRICT INVARIANT: This file must NEVER be imported in client components.
import 'server-only';
import { createClient } from '@supabase/supabase-js';

const isBuildPhase =
  process.env.NEXT_PHASE === 'phase-production-build' ||
  process.env.NEXT_PHASE === 'phase-export' ||
  process.env.npm_lifecycle_event === 'build';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  if (isBuildPhase) {
    // Permitted strictly during static build and page collection phase
  } else if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'FATAL CONFIGURATION ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set at runtime in production. Silent placeholders are strictly disallowed.'
    );
  } else if (process.env.NODE_ENV !== 'test') {
    throw new Error(
      'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.'
    );
  }
}

export const adminClient = createClient(
  supabaseUrl || 'https://build-placeholder.supabase.co',
  serviceRoleKey || 'build-placeholder-service-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
