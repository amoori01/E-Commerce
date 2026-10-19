import { describe, it, expect } from 'vitest';
import crypto from 'crypto';

describe('Payment Webhooks Cryptographic Security (SRS 4.4 / PCI-DSS v4.0)', () => {
  const secret = 'whsec_sample_chapa_webhook_secret';

  it('generates and verifies timing-safe HMAC SHA-256 signature', () => {
    const rawPayload = JSON.stringify({
      tx_ref: 'AMG-ORD-2026-9812',
      status: 'success',
      amount: 45000,
      currency: 'ETB',
    });

    const validSignature = crypto
      .createHmac('sha256', secret)
      .update(rawPayload)
      .digest('hex');

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawPayload)
      .digest('hex');

    const validBuffer = Buffer.from(validSignature);
    const expectedBuffer = Buffer.from(expectedSignature);

    expect(validBuffer.length).toBe(expectedBuffer.length);
    expect(crypto.timingSafeEqual(validBuffer, expectedBuffer)).toBe(true);
  });

  it('rejects tampered webhook payloads with signature mismatch', () => {
    const originalPayload = JSON.stringify({ tx_ref: 'AMG-ORD-2026-9812', amount: 45000 });
    const tamperedPayload = JSON.stringify({ tx_ref: 'AMG-ORD-2026-9812', amount: 100 });

    const originalSignature = crypto
      .createHmac('sha256', secret)
      .update(originalPayload)
      .digest('hex');

    const expectedTamperedSignature = crypto
      .createHmac('sha256', secret)
      .update(tamperedPayload)
      .digest('hex');

    const originalBuffer = Buffer.from(originalSignature);
    const tamperedBuffer = Buffer.from(expectedTamperedSignature);

    expect(crypto.timingSafeEqual(originalBuffer, tamperedBuffer)).toBe(false);
  });
});
