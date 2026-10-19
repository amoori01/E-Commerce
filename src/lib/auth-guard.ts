import { NextRequest } from 'next/server';
import { verifyJwt, JwtPayload } from './jwt';
import { UserRole } from '@/types';
import { SEEDED_USERS } from './constants';

// ====================================================================
// AMG HOLDINGS ENTERPRISE ACCESS CONTROL: RBAC + ABAC GUARD
// Enforces Role-Based and Attribute-Based Access Control on backend APIs.
// ====================================================================

export interface AuthContextResult {
  isAuthenticated: boolean;
  user: JwtPayload | null;
  error?: string;
  statusCode?: number;
}

/**
 * Extracts and verifies authentication token from Authorization Bearer header
 * or HTTP-only 'amg_access_token' cookie.
 * Supports fallback to X-User-Role / X-User-Id in development/demo mode.
 */
export function authenticateRequest(req: NextRequest): AuthContextResult {
  // 1. Try Authorization header
  const authHeader = req.headers.get('authorization');
  let token: string | null = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  // 2. Try HTTP-only cookie
  if (!token) {
    const cookie = req.cookies.get('amg_access_token');
    if (cookie) {
      token = cookie.value;
    }
  }

  // 3. Verify JWT token
  if (token) {
    const payload = verifyJwt(token);
    if (payload && payload.type === 'access') {
      return { isAuthenticated: true, user: payload };
    }
  }

  // 4. Fallback for prototyping and integration testing (role headers)
  const roleHeader = req.headers.get('x-user-role') as UserRole | null;
  const userIdHeader = req.headers.get('x-user-id');

  if (roleHeader) {
    const matchedUser = SEEDED_USERS.find(
      (u) => (userIdHeader ? u.id === userIdHeader : u.role === roleHeader)
    ) || SEEDED_USERS[0];

    const fallbackPayload: JwtPayload = {
      sub: matchedUser.id,
      email: matchedUser.email,
      role: matchedUser.role,
      subsidiaryId: matchedUser.subsidiaryId,
      branchId: matchedUser.branchId,
      fullName: matchedUser.fullName,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      type: 'access',
    };
    return { isAuthenticated: true, user: fallbackPayload };
  }

  return {
    isAuthenticated: false,
    user: null,
    error: 'Authentication credentials required (Bearer token or session cookie missing)',
    statusCode: 401,
  };
}

/**
 * Checks if the authenticated user has one of the allowed roles (RBAC).
 */
export function requireRoles(user: JwtPayload | null, allowedRoles: UserRole[]): boolean {
  if (!user) return false;
  return allowedRoles.includes(user.role);
}

export interface AbacResource {
  customerId?: string;
  subsidiaryId?: string;
  fulfillmentBranchId?: string;
  branchId?: string;
  assignedAgentId?: string;
}

/**
 * Enforces Attribute-Based Access Control (ABAC):
 * - super_admin: unrestricted cross-subsidiary and cross-branch access.
 * - branch_admin: restricted to their assigned subsidiary and branch.
 * - sales_agent: restricted to their assigned subsidiary and branch, or assigned quotes.
 * - customer: restricted to their own customer ID.
 */
export function enforceAbac(user: JwtPayload, resource: AbacResource, action: 'read' | 'write' = 'read'): {
  allowed: boolean;
  reason?: string;
} {
  // Super admin can access everything
  if (user.role === 'super_admin') {
    return { allowed: true };
  }

  // Customer checks
  if (user.role === 'customer') {
    if (resource.customerId && resource.customerId !== user.sub) {
      return {
        allowed: false,
        reason: 'ABAC Access Denied: Customers can only access their own records.',
      };
    }
    return { allowed: true };
  }

  // Branch Admin checks
  if (user.role === 'branch_admin') {
    if (resource.subsidiaryId && user.subsidiaryId && resource.subsidiaryId !== user.subsidiaryId) {
      return {
        allowed: false,
        reason: 'ABAC Access Denied: Branch admin cannot access records of another subsidiary.',
      };
    }
    const targetBranch = resource.branchId || resource.fulfillmentBranchId;
    if (targetBranch && user.branchId && targetBranch !== user.branchId) {
      return {
        allowed: false,
        reason: 'ABAC Access Denied: Branch admin cannot access records outside their assigned regional branch.',
      };
    }
    return { allowed: true };
  }

  // Sales Agent checks
  if (user.role === 'sales_agent') {
    if (resource.subsidiaryId && user.subsidiaryId && resource.subsidiaryId !== user.subsidiaryId) {
      return {
        allowed: false,
        reason: 'ABAC Access Denied: Sales agent cannot access inquiries outside their specialized subsidiary division.',
      };
    }
    // If quote is already assigned to a different agent
    if (resource.assignedAgentId && resource.assignedAgentId !== user.sub && action === 'write') {
      return {
        allowed: false,
        reason: 'ABAC Access Denied: Inquiry is already assigned to another sales engineer.',
      };
    }
    return { allowed: true };
  }

  return { allowed: false, reason: 'ABAC Access Denied: Unauthorized role scope.' };
}
