import { NextRequest, NextResponse } from 'next/server';
import { revokeRefreshToken } from '@/lib/jwt';

// ====================================================================
// AUTHENTICATION API: LOGOUT
// Clears session cookies and revokes active refresh token.
// ====================================================================

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get('amg_refresh_token')?.value;
  if (refreshToken) {
    revokeRefreshToken(refreshToken);
  }

  const res = NextResponse.json({
    success: true,
    message: 'Logged out successfully. Secure sessions cleared.',
  });

  res.cookies.delete('amg_access_token');
  res.cookies.delete('amg_refresh_token');

  return res;
}
