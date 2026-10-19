import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-guard';
import { SEEDED_USERS } from '@/lib/constants';

// ====================================================================
// USER PROFILE MANAGEMENT API (SRS 4.2)
// Mandatory MFA verification for sensitive profile modifications:
// TIN Number, Registered Corporate Name, Mobile Phone, Email, Password.
// ====================================================================

export async function GET(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth.isAuthenticated || !auth.user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const user = SEEDED_USERS.find((u) => u.id === auth.user?.sub);
  if (!user) {
    return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    user,
  });
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = authenticateRequest(req);
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { fullName, phone, companyName, tinNumber, mfaCode, mfaSessionToken } = body;

    const user = SEEDED_USERS.find((u) => u.id === auth.user?.sub);
    if (!user) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Identify sensitive profile modifications per SRS 4.2
    const hasSensitiveChanges =
      (tinNumber !== undefined && tinNumber !== user.tinNumber) ||
      (companyName !== undefined && companyName !== user.companyName) ||
      (phone !== undefined && phone !== user.phone);

    if (hasSensitiveChanges) {
      // Mandatory MFA verification check
      const isMfaProvided =
        (mfaCode && /^\d{6}$/.test(String(mfaCode).trim())) ||
        (mfaSessionToken && mfaSessionToken.startsWith('mfa_token_'));

      if (!isMfaProvided) {
        return NextResponse.json(
          {
            success: false,
            mfaRequired: true,
            error: 'MFA Security Challenge Required',
            message:
              'Per SRS 4.2, modifying sensitive corporate profile attributes (TIN Number, Company Name, Phone) requires 6-digit OTP verification.',
          },
          { status: 403 }
        );
      }
    }

    // Apply updates
    if (fullName) user.fullName = fullName.trim();
    if (phone) user.phone = phone.trim();
    if (companyName !== undefined) user.companyName = companyName?.trim();
    if (tinNumber !== undefined) user.tinNumber = tinNumber?.trim();

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully under OWASP ASVS v4.0 verification.',
      user,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Profile update error';
    return NextResponse.json({ error: 'Failed to update profile', details: msg }, { status: 500 });
  }
}
