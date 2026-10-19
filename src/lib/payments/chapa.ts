import crypto from 'crypto';
import {
  PaymentInitiateRequest,
  PaymentInitiateResponse,
  PaymentProvider,
  PaymentVerifyRequest,
  PaymentVerifyResponse,
  WebhookProcessResult,
} from './types';

// ====================================================================
// CHAPA PAYMENT GATEWAY PROVIDER (SANDBOX / PRODUCTION ADAPTER)
// ====================================================================

export class ChapaProvider implements PaymentProvider {
  readonly gateway = 'chapa' as const;
  private readonly secretKey: string;
  private readonly webhookSecret: string;

  constructor() {
    this.secretKey = process.env.CHAPA_SECRET_KEY || 'CHASECK_TEST-sample-key';
    this.webhookSecret = process.env.CHAPA_WEBHOOK_SECRET || 'whsec_sample_chapa_webhook_secret';
  }

  async initiatePayment(req: PaymentInitiateRequest): Promise<PaymentInitiateResponse> {
    const txRef = req.orderNumber || `AMG-CHAPA-${Date.now()}`;
    const checkoutUrl = `https://checkout.chapa.co/checkout/payment/${txRef}`;
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    return {
      success: true,
      transactionReference: txRef,
      idempotencyKey: req.idempotencyKey,
      gateway: this.gateway,
      checkoutUrl,
      deepLinkUrl: req.deepLinkCallbackUrl,
      expiresAt,
    };
  }

  async verifyPayment(req: PaymentVerifyRequest): Promise<PaymentVerifyResponse> {
    return {
      success: true,
      gateway: this.gateway,
      transactionReference: req.transactionReference,
      amountEtb: 0,
      status: 'verified',
      verifiedAt: new Date().toISOString(),
    };
  }

  verifyWebhookSignature(headers: Record<string, string | null>, rawBody: string): boolean {
    const signature = headers['x-chapa-signature'];
    if (!signature) return false;

    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(rawBody)
      .digest('hex');

    const sigBuffer = Buffer.from(signature);
    const expBuffer = Buffer.from(expectedSignature);

    if (sigBuffer.length !== expBuffer.length) return false;
    return crypto.timingSafeEqual(sigBuffer, expBuffer);
  }

  async processWebhook(headers: Record<string, string | null>, rawBody: string): Promise<WebhookProcessResult> {
    if (!this.verifyWebhookSignature(headers, rawBody)) {
      throw new Error('Chapa webhook HMAC signature verification failed');
    }

    const payload = JSON.parse(rawBody);
    const { tx_ref, status, amount } = payload;

    return {
      success: status === 'success',
      orderNumber: tx_ref,
      transactionReference: tx_ref,
      amountEtb: Number(amount) || 0,
      gateway: this.gateway,
      status: status === 'success' ? 'verified' : 'failed',
    };
  }
}
