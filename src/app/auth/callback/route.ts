import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { adminClient } from '@/lib/db/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const error_description = requestUrl.searchParams.get('error_description');

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error_description || error)}`, requestUrl.origin)
    );
  }

  if (!code) {
    return NextResponse.redirect(new URL('/login', requestUrl.origin));
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ldiyekkmzhzmnztvdckc.supabase.co',
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkaXlla2ttemh6bW56dHZkY2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3Njg3NTUsImV4cCI6MjEwODM0NDc1NX0.yJ-Nd3CNvirlYlVPtyc5WidHt6l_41qVKTOdJmccf-M',
    {
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
    }
  );

  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError || !data.user) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(exchangeError?.message || 'Authentication exchange failed')}`, requestUrl.origin)
    );
  }

  const user = data.user;
  const userEmail = (user.email || '').toLowerCase().trim();

  // Enforce Gmail / Google requirement: "only gmail of staff can login"
  const isGmail = userEmail.endsWith('@gmail.com') || userEmail.endsWith('@googlemail.com');
  if (!isGmail) {
    await supabase.auth.signOut();
    return NextResponse.redirect(
      new URL('/login?error=Access+denied:+Only+authorized+staff+Google+accounts+can+access+the+admin+portal.', requestUrl.origin)
    );
  }

  // Verify staff role
  let { data: staffRecord } = await adminClient
    .from('staff_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!staffRecord) {
    // If this is the primary administrator email, auto-assign admin role
    if (userEmail === 'younesbouziane38@gmail.com') {
      await adminClient.from('staff_roles').upsert({
        user_id: user.id,
        role: 'admin',
      });
      staffRecord = { role: 'admin' };
    } else {
      // Check if an existing staff role exists under a previous user account with the same email
      try {
        const { data: usersList } = await adminClient.auth.admin.listUsers();
        const oldUser = usersList?.users?.find(
          (u) => u.email?.toLowerCase() === userEmail && u.id !== user.id
        );
        if (oldUser) {
          const { data: oldStaff } = await adminClient
            .from('staff_roles')
            .select('role, community_id')
            .eq('user_id', oldUser.id)
            .maybeSingle();

          if (oldStaff) {
            await adminClient.from('staff_roles').upsert({
              user_id: user.id,
              role: oldStaff.role,
              community_id: oldStaff.community_id,
            });
            staffRecord = oldStaff;
          }
        }
      } catch {}
    }
  }

  if (!staffRecord) {
    // Non-staff Google account
    await supabase.auth.signOut();
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent('Access denied: ' + userEmail + ' is not registered in the staff directory.')}`, requestUrl.origin)
    );
  }

  // Successfully authenticated staff member
  return NextResponse.redirect(new URL('/', requestUrl.origin));
}
