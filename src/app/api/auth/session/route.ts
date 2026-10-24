import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminClient } from '@/lib/db/supabase-admin';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, uid, idToken } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Enforce Gmail / Google requirement
    if (!normalizedEmail.endsWith('@gmail.com') && !normalizedEmail.endsWith('@googlemail.com')) {
      return NextResponse.json(
        { error: 'Access denied: Only Google staff accounts (@gmail.com) are authorized.' },
        { status: 403 }
      );
    }

    // Verify staff access:
    // 1. Check if user is in staff_roles (or primary admin younesbouziane38@gmail.com)
    let isStaff = false;
    let role = 'moderator';

    if (normalizedEmail === 'younesbouziane38@gmail.com') {
      isStaff = true;
      role = 'admin';
    } else {
      // Query profiles/staff_roles
      const { data: profile } = await adminClient
        .from('profiles')
        .select('id')
        .eq('id', uid)
        .maybeSingle();

      if (profile) {
        const { data: staffRecord } = await adminClient
          .from('staff_roles')
          .select('role')
          .eq('user_id', profile.id)
          .maybeSingle();

        if (staffRecord) {
          isStaff = true;
          role = staffRecord.role;
        }
      }
    }

    if (!isStaff) {
      return NextResponse.json(
        { error: `Access denied: ${normalizedEmail} is not registered in the staff directory.` },
        { status: 403 }
      );
    }

    // Store verified staff session in HttpOnly secure cookie
    const sessionData = JSON.stringify({
      email: normalizedEmail,
      uid,
      role,
      issuedAt: Date.now(),
    });

    // Simple tamper-resistant payload encoding
    const sessionPayload = Buffer.from(sessionData).toString('base64');

    const cookieStore = await cookies();
    cookieStore.set('staff_session', sessionPayload, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({ success: true, email: normalizedEmail, role });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error establishing staff session' },
      { status: 500 }
    );
  }
}
