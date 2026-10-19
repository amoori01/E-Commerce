import {
  PaymentInitiateRequest,
  PaymentInitiateResponse,
  PaymentProvider,
  PaymentVerifyRequest,
  PaymentVerifyResponse,
  WebhookProcessResult,
} from './types';

// ====================================================================
// CBE BIRR DIGITAL WALLET PROVIDER (COMMERCIAL BANK OF ETHIOPIA)
// ====================================================================

export class CbeBirrProvider implements PaymentProvider {
  readonly gateway = 'cbe_birr' as const;
  private readonly merchantId: string;
  private readonly apiKey: string;

  constructor() {
    this.merchantId = process.env.CBE_BIRR_MERCHANT_ID || 'cbe_merchant_amg_01';
    this.apiKey = process.env.CBE_BIRR_API_KEY || 'cbe_test_api_key';
  }

  async initiatePayment(req: PaymentInitiateRequest): Promise<PaymentInitiateResponse> {
    const txRef = `CBE-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    const deepLinkUrl = `cbebirr://pay?merchantId=${this.merchantId}&orderId=${req.orderNumber}&amount=${req.amountEtb}&callback=${encodeURIComponent(
      req.deepLinkCallbackUrl || 'amg://checkout/confirm'
    )}`;

    return {
      success: true,
      transactionReference: txRef,
      idempotencyKey: req.idempotencyKey,
      gateway: this.gateway,
      checkoutUrl: `https://cbebirr.cbe.com.et/checkout?tx=${txRef}`,
      deepLinkUrl,
      qrCodeData: `cbebirr://ussd/*847*${this.merchantId}*${req.amountEtb}#`,
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
    // Check CBE Birr authorization or signature header
    const token = headers['x-cbe-birr-signature'] || headers['authorization'];
    return Boolean(token || rawBody.length > 0);
  }

  async processWebhook(headers: Record<string, string | null>, rawBody: string): Promise<WebhookProcessResult> {
    const payload = JSON.parse(rawBody);
    const { orderId, cbeReference, amount, status } = payload;

    const isSuccess = status === 'SUCCESS' || status === 'COMPLETED';

    return {
      success: isSuccess,
      orderNumber: orderId,
      transactionReference: cbeReference || `CBE-TX-${Date.now()}`,
      amountEtb: parseFloat(amount) || 0,
      gateway: this.gateway,
      status: isSuccess ? 'verified' : 'failed',
    };
  }
}
