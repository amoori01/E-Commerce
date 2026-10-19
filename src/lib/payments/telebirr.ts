import {
  PaymentInitiateRequest,
  PaymentInitiateResponse,
  PaymentProvider,
  PaymentVerifyRequest,
  PaymentVerifyResponse,
  WebhookProcessResult,
} from './types';

// ====================================================================
// TELEBIRR MOBILE MONEY PROVIDER (ETHIO TELECOM SWITCH ADAPTER)
// ====================================================================

export class TelebirrProvider implements PaymentProvider {
  readonly gateway = 'telebirr' as const;
  private readonly appId: string;
  private readonly appKey: string;
  private readonly shortCode: string;

  constructor() {
    this.appId = process.env.TELEBIRR_APP_ID || 'sample_telebirr_app_id';
    this.appKey = process.env.TELEBIRR_APP_KEY || 'sample_telebirr_app_key';
    this.shortCode = process.env.TELEBIRR_SHORT_CODE || '102938';
  }

  async initiatePayment(req: PaymentInitiateRequest): Promise<PaymentInitiateResponse> {
    const txRef = `TB-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    // Deep link scheme returning back to app or mobile web
    const deepLinkUrl = `telebirr://payment?appId=${this.appId}&orderId=${req.orderNumber}&amount=${req.amountEtb}&returnUrl=${encodeURIComponent(
      req.deepLinkCallbackUrl || 'amg://checkout/confirm'
    )}`;

    return {
      success: true,
      transactionReference: txRef,
      idempotencyKey: req.idempotencyKey,
      gateway: this.gateway,
      checkoutUrl: `https://telebirr.ethiotelecom.et/h5/pay?orderNumber=${req.orderNumber}`,
      deepLinkUrl,
      qrCodeData: `telebirr://pay?shortCode=${this.shortCode}&tx=${txRef}&amt=${req.amountEtb}`,
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
    // In production Telebirr signs notifications with RSA-SHA256
    // Mock / sandbox accepts valid non-empty payload
    return rawBody.length > 0;
  }

  async processWebhook(headers: Record<string, string | null>, rawBody: string): Promise<WebhookProcessResult> {
    const payload = JSON.parse(rawBody);
    const { outTradeNo, tradeNo, totalAmount, tradeStatus } = payload;

    const isSuccess = tradeStatus === 'COMPLETED' || tradeStatus === '2' || tradeStatus === 'SUCCESS';

    return {
      success: isSuccess,
      orderNumber: outTradeNo,
      transactionReference: tradeNo || `TB-${Date.now()}`,
      amountEtb: parseFloat(totalAmount) || 0,
      gateway: this.gateway,
      status: isSuccess ? 'verified' : 'failed',
    };
  }
}
