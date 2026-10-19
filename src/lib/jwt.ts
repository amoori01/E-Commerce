import crypto from 'crypto';
import { UserProfile, UserRole } from '@/types';

// ====================================================================
// AMG HOLDINGS ENTERPRISE TOKEN SERVICE (JWT & ROTATING REFRESH TOKENS)
// Short-lived access tokens (15 minutes) + Rotating refresh tokens (7 days)
// ====================================================================

const JWT_SECRET = process.env.JWT_SECRET || 'amg_holdings_enterprise_jwt_super_secret_key_32_characters_minimum';

export interface JwtPayload {
  sub: string; // User Profile ID
  email: string;
  role: UserRole;
  subsidiaryId?: string;
  subsidiaryName?: string;
  branchId?: string;
  fullName: string;
  iat: number;
  exp: number;
  type: 'access' | 'refresh';
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

/**
 * Signs a payload into a standard JWT string using HMAC-SHA256.
 */
export function signJwt(
  user: UserProfile,
  type: 'access' | 'refresh' = 'access',
  customTtlSeconds?: number
): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  // Default TTL: 15 minutes for access tokens, 7 days for refresh tokens
  const ttl = customTtlSeconds ?? (type === 'access' ? 15 * 60 : 7 * 24 * 60 * 60);

  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    subsidiaryId: user.subsidiaryId,
    branchId: user.branchId,
    fullName: user.fullName,
    iat: now,
    exp: now + ttl,
    type,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(signatureInput)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${signatureInput}.${signature}`;
}

/**
 * Verifies a JWT token signature and expiration, returning decoded payload or null.
 */
export function verifyJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;
    const signatureInput = `${encodedHeader}.${encodedPayload}`;

    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(signatureInput)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    // Timing-safe comparison to prevent timing side-channel attacks
    const sigBuffer = Buffer.from(signature);
    const expBuffer = Buffer.from(expectedSignature);

    if (sigBuffer.length !== expBuffer.length || !crypto.timingSafeEqual(sigBuffer, expBuffer)) {
      return null;
    }

    const payload: JwtPayload = JSON.parse(base64UrlDecode(encodedPayload));

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

// In-memory active refresh token registry for revocation & rotation
const ACTIVE_REFRESH_TOKENS = new Set<string>();

export function registerRefreshToken(token: string): void {
  ACTIVE_REFRESH_TOKENS.add(token);
}

export function revokeRefreshToken(token: string): boolean {
  return ACTIVE_REFRESH_TOKENS.delete(token);
}

export function isRefreshTokenActive(token: string): boolean {
  return ACTIVE_REFRESH_TOKENS.has(token);
}
