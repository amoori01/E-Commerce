import { describe, it, expect } from 'vitest';
import { encryptToString, decryptFromString } from '@/lib/crypto';
import { signJwt, verifyJwt } from '@/lib/jwt';
import { validateOrderTransition, validateQuoteTransition } from '@/lib/state-machine';
import { enforceAbac } from '@/lib/auth-guard';
import { getPaymentProvider } from '@/lib/payments';
import { SEEDED_USERS } from '@/lib/constants';

describe('P0: Enterprise Security & AES-256 Encryption (OWASP ASVS v4.0)', () => {
  it('encrypts sensitive PII string and successfully decrypts back to original', () => {
    const sensitivePii = 'TIN: 0044819231 | Bank A/C: 1000293847581 | Contact: +251 91 120 0001';
    const encrypted = encryptToString(sensitivePii);

    expect(encrypted).not.toBe(sensitivePii);
    expect(encrypted.split(':')).toHaveLength(3); // iv:tag:ciphertext

    const decrypted = decryptFromString(encrypted);
    expect(decrypted).toBe(sensitivePii);
  });

  it('rejects tampered ciphertext during AES-256-GCM authentication verification', () => {
    const original = 'Confidential Industrial B2B Pricing Matrix';
    const encrypted = encryptToString(original);
    const [iv, tag, ciphertext] = encrypted.split(':');

    // Tamper with the ciphertext
    const tamperedCiphertext = ciphertext.substring(0, ciphertext.length - 2) + 'ff';
    const tampered = `${iv}:${tag}:${tamperedCiphertext}`;

    expect(() => decryptFromString(tampered)).toThrow();
  });
});

describe('P0: Short-Lived JWT & Rotating Refresh Tokens', () => {
  const testUser = SEEDED_USERS[0];

  it('signs and verifies valid JWT access token', () => {
    const token = signJwt(testUser, 'access', 900);
    const payload = verifyJwt(token);

    expect(payload).not.toBeNull();
    expect(payload?.sub).toBe(testUser.id);
    expect(payload?.email).toBe(testUser.email);
    expect(payload?.role).toBe('super_admin');
    expect(payload?.type).toBe('access');
  });

  it('rejects expired JWT tokens', () => {
    // Generate token that expired 10 seconds ago
    const expiredToken = signJwt(testUser, 'access', -10);
    const payload = verifyJwt(expiredToken);

    expect(payload).toBeNull();
  });
});

describe('P0: Order & Quote Deterministic State Machines (SRS 4.3)', () => {
  it('accepts legitimate sequential order transitions', () => {
    expect(validateOrderTransition('cart_created', 'checkout_initiated').isValid).toBe(true);
    expect(validateOrderTransition('checkout_initiated', 'payment_pending').isValid).toBe(true);
    expect(validateOrderTransition('payment_pending', 'payment_verified').isValid).toBe(true);
    expect(validateOrderTransition('payment_verified', 'fulfillment_processing').isValid).toBe(true);
    expect(validateOrderTransition('fulfillment_processing', 'ready_for_pickup').isValid).toBe(true);
    expect(validateOrderTransition('ready_for_pickup', 'completed').isValid).toBe(true);
  });

  it('rejects illegal order jumps (e.g. from cart_created straight to completed)', () => {
    const result = validateOrderTransition('cart_created', 'completed');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Illegal Order State Transition');
  });

  it('validates quote escalation pipeline transitions', () => {
    expect(validateQuoteTransition('inquiry_submitted', 'assigned_to_agent').isValid).toBe(true);
    expect(validateQuoteTransition('assigned_to_agent', 'draft_quote_issued').isValid).toBe(true);
    expect(validateQuoteTransition('draft_quote_issued', 'customer_review').isValid).toBe(true);
    expect(validateQuoteTransition('customer_review', 'quote_approved').isValid).toBe(true);
    expect(validateQuoteTransition('quote_approved', 'payment_processing').isValid).toBe(true);
    expect(validateQuoteTransition('payment_processing', 'fulfilled').isValid).toBe(true);
  });

  it('rejects illegal quote jump (e.g. inquiry_submitted straight to fulfilled)', () => {
    const result = validateQuoteTransition('inquiry_submitted', 'fulfilled');
    expect(result.isValid).toBe(false);
  });
});

describe('P0: Attribute-Based Access Control (ABAC Data Isolation)', () => {
  it('allows super_admin full access across any subsidiary or branch', () => {
    const superAdminPayload = {
      sub: 'u1',
      email: 'admin@amg.et',
      role: 'super_admin' as const,
      fullName: 'Super Admin',
      iat: Date.now(),
      exp: Date.now() + 1000,
      type: 'access' as const,
    };

    const res = enforceAbac(superAdminPayload, {
      subsidiaryId: 'foreign-sub-99',
      branchId: 'foreign-branch-88',
    });
    expect(res.allowed).toBe(true);
  });

  it('denies branch_admin access to orders from a different branch or subsidiary', () => {
    const branchAdminPayload = {
      sub: 'u2',
      email: 'branch@amg.et',
      role: 'branch_admin' as const,
      subsidiaryId: 'sub-roofing',
      branchId: 'branch-adama',
      fullName: 'Adama Admin',
      iat: Date.now(),
      exp: Date.now() + 1000,
      type: 'access' as const,
    };

    // Attempt to access Dire Dawa branch
    const deniedBranch = enforceAbac(branchAdminPayload, {
      subsidiaryId: 'sub-roofing',
      fulfillmentBranchId: 'branch-diredawa',
    });
    expect(deniedBranch.allowed).toBe(false);
    expect(deniedBranch.reason).toContain('ABAC Access Denied');

    // Attempt to access steel subsidiary
    const deniedSub = enforceAbac(branchAdminPayload, {
      subsidiaryId: 'sub-steel',
      fulfillmentBranchId: 'branch-adama',
    });
    expect(deniedSub.allowed).toBe(false);
  });

  it('denies customer access to another buyer order', () => {
    const customerPayload = {
      sub: 'cust-1',
      email: 'cust1@test.et',
      role: 'customer' as const,
      fullName: 'Customer One',
      iat: Date.now(),
      exp: Date.now() + 1000,
      type: 'access' as const,
    };

    const check = enforceAbac(customerPayload, { customerId: 'cust-2' });
    expect(check.allowed).toBe(false);
  });
});

describe('P0: Localized Payment Provider Adapters (Chapa, Telebirr, CBE Birr, Wire)', () => {
  it('resolves correct adapter and initiates Telebirr transaction with deep link', async () => {
    const provider = getPaymentProvider('telebirr');
    expect(provider.gateway).toBe('telebirr');

    const result = await provider.initiatePayment({
      orderId: 'ORD-TB-01',
      orderNumber: 'ORD-TB-01',
      amountEtb: 15000,
      currency: 'ETB',
      customerEmail: 'buyer@test.et',
      customerName: 'Abebe',
      idempotencyKey: 'idemp-tb-991283',
      deepLinkCallbackUrl: 'amg://checkout/confirm',
    });

    expect(result.success).toBe(true);
    expect(result.deepLinkUrl).toContain('telebirr://');
    expect(result.qrCodeData).toContain('telebirr://pay');
  });

  it('resolves CBE Birr provider and provides USSD/app payload', async () => {
    const provider = getPaymentProvider('cbe_birr');
    expect(provider.gateway).toBe('cbe_birr');

    const result = await provider.initiatePayment({
      orderId: 'ORD-CBE-01',
      orderNumber: 'ORD-CBE-01',
      amountEtb: 45000,
      currency: 'ETB',
      customerEmail: 'cbebuyer@test.et',
      customerName: 'Solomon',
      idempotencyKey: 'idemp-cbe-847291',
    });

    expect(result.success).toBe(true);
    expect(result.deepLinkUrl).toContain('cbebirr://');
    expect(result.qrCodeData).toContain('cbebirr://ussd');
  });
});
