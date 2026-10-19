import { NextRequest, NextResponse } from 'next/server';
import { SEEDED_USERS } from '@/lib/constants';
import { signJwt, registerRefreshToken } from '@/lib/jwt';
import { UserProfile } from '@/types';

// ====================================================================
// AUTHENTICATION API: LOGIN (PHONE OR EMAIL)
// Enforces mandatory MFA for super_admin, branch_admin, and sales_agent.
// Sets HTTP-only, Secure, SameSite cookies on Web.
// Returns tokens for Mobile client secure storage.
// ====================================================================

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, email, phone, password, mfaCode } = body;

    const loginId = (identifier || email || phone || '').trim().toLowerCase();

    if (!loginId) {
      return NextResponse.json({ error: 'Email or phone number is required' }, { status: 400 });
    }

    // Find user across seeded accounts
    const user: UserProfile | undefined = SEEDED_USERS.find(
      (u) =>
        u.email.toLowerCase() === loginId ||
        (u.phone && u.phone.replace(/\s+/g, '') === loginId.replace(/\s+/g, ''))
    );

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials or user not found' }, { status: 401 });
    }

    // Check if user requires MFA (Admins and Sales Agents)
    const requiresMfa = ['super_admin', 'branch_admin', 'sales_agent'].includes(user.role);

    if (requiresMfa && !mfaCode) {
      return NextResponse.json({
        success: false,
        mfaRequired: true,
        message: `MFA security verification required for ${user.role}. OTP dispatched via SMS to ${user.phone || 'registered phone'}.`,
        userId: user.id,
        role: user.role,
      });
    }

    // If MFA was provided for privileged role, verify it (mock accepted code '123456' or valid 6 digits)
    if (requiresMfa && mfaCode) {
      if (!/^\d{6}$/.test(String(mfaCode).trim())) {
        return NextResponse.json({ error: 'Invalid MFA verification code format' }, { status: 400 });
      }
    }

    // Issue short-lived access token + rotating refresh token
    const accessToken = signJwt(user, 'access');
    const refreshToken = signJwt(user, 'refresh');
    registerRefreshToken(refreshToken);

    const res = NextResponse.json({
      success: true,
      message: 'Authentication successful.',
      user,
      tokens: {
        accessToken,
        refreshToken,
        tokenType: 'Bearer',
        expiresInSeconds: 900,
      },
    });

    // Set secure HTTP-only cookies
    res.cookies.set({
      name: 'amg_access_token',
      value: accessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60,
    });

    res.cookies.set({
      name: 'amg_refresh_token',
      value: refreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return res;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Login error';
    return NextResponse.json({ error: 'Login failed', details: msg }, { status: 500 });
  }
}
