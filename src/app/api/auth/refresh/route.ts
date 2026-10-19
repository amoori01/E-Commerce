import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt, signJwt, revokeRefreshToken, registerRefreshToken, isRefreshTokenActive } from '@/lib/jwt';
import { SEEDED_USERS } from '@/lib/constants';

// ====================================================================
// AUTHENTICATION API: REFRESH TOKEN (ROTATING REFRESH TOKEN PATTERN)
// ====================================================================

export async function POST(req: NextRequest) {
  try {
    let refreshToken: string | null = null;

    // Check JSON body
    try {
      const body = await req.json();
      refreshToken = body.refreshToken;
    } catch {
      // Body might be empty, try cookies
    }

    // Check cookie
    if (!refreshToken) {
      const cookie = req.cookies.get('amg_refresh_token');
      if (cookie) refreshToken = cookie.value;
    }

    if (!refreshToken) {
      return NextResponse.json({ error: 'Refresh token is required' }, { status: 400 });
    }

    const payload = verifyJwt(refreshToken);
    if (!payload || payload.type !== 'refresh') {
      return NextResponse.json({ error: 'Invalid or expired refresh token' }, { status: 401 });
    }

    // Revoke old refresh token (Token Rotation prevents replay attacks)
    revokeRefreshToken(refreshToken);

    const user = SEEDED_USERS.find((u) => u.id === payload.sub);
    if (!user) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Issue new pair
    const newAccessToken = signJwt(user, 'access');
    const newRefreshToken = signJwt(user, 'refresh');
    registerRefreshToken(newRefreshToken);

    const res = NextResponse.json({
      success: true,
      tokens: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresInSeconds: 900,
      },
    });

    res.cookies.set({
      name: 'amg_access_token',
      value: newAccessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60,
    });

    res.cookies.set({
      name: 'amg_refresh_token',
      value: newRefreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return res;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Token refresh error';
    return NextResponse.json({ error: 'Token refresh failed', details: msg }, { status: 500 });
  }
}
