import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { SEEDED_USERS } from '@/lib/constants';
import { signJwt, registerRefreshToken } from '@/lib/jwt';
import { UserProfile, UserRole } from '@/types';

// ====================================================================
// AUTHENTICATION API: REGISTER (PHONE OR EMAIL)
// Supports B2B/B2C Customer onboarding with phone or email.
// ====================================================================

// In-memory registered user directory extending seeded users
const USER_DIRECTORY: UserProfile[] = [...SEEDED_USERS];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, phone, fullName, password, companyName, tinNumber, role = 'customer' } = body;

    // 1. Validation
    if (!fullName || fullName.trim().length < 2) {
      return NextResponse.json({ error: 'Full name must be at least 2 characters' }, { status: 400 });
    }

    if (!email && !phone) {
      return NextResponse.json({ error: 'Either email or mobile phone number is required' }, { status: 400 });
    }

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json({ error: 'Invalid email address format' }, { status: 400 });
      }
      const existingEmail = USER_DIRECTORY.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (existingEmail) {
        return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
      }
    }

    if (phone) {
      const phoneRegex = /^\+?251\s?[79]\d{8}$|^0?[79]\d{8}$/;
      if (!phoneRegex.test(phone.replace(/\s+/g, ''))) {
        return NextResponse.json({ error: 'Invalid Ethiopian phone number (e.g. +251 91 123 4567)' }, { status: 400 });
      }
    }

    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    // 2. Create User Profile
    const newUserId = `u-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const newUser: UserProfile = {
      id: newUserId,
      email: email || `${phone.replace(/\D/g, '')}@telebirr.user`,
      phone,
      fullName: fullName.trim(),
      role: role as UserRole,
      companyName: companyName?.trim() || undefined,
      tinNumber: tinNumber?.trim() || undefined,
      isVerified: true,
    };

    USER_DIRECTORY.push(newUser);

    // 3. Issue Tokens
    const accessToken = signJwt(newUser, 'access');
    const refreshToken = signJwt(newUser, 'refresh');
    registerRefreshToken(refreshToken);

    const res = NextResponse.json({
      success: true,
      message: 'Account registered successfully.',
      user: newUser,
      tokens: {
        accessToken,
        refreshToken,
        expiresInSeconds: 900,
      },
    });

    // 4. Set HTTP-only secure cookie for web
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
    const msg = err instanceof Error ? err.message : 'Registration error';
    return NextResponse.json({ error: 'Registration failed', details: msg }, { status: 500 });
  }
}
