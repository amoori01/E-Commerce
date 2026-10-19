// ====================================================================
// AMG HOLDINGS PAYMENT PROVIDER INTERFACE & DOMAIN TYPES (SRS 4.4)
// Standardized abstraction layer for Chapa, Telebirr, CBE Birr, and Bank Transfer.
// Enforces idempotency keys, signature verification, and deep linking.
// ====================================================================

import { PaymentGateway } from '@/types';

export interface PaymentInitiateRequest {
  orderId: string;
  orderNumber: string;
  amountEtb: number;
  currency: 'ETB';
  customerEmail: string;
  customerPhone?: string;
  customerName: string;
  idempotencyKey: string;
  returnUrl?: string; // Web checkout return
  callbackUrl?: string; // Server-to-server webhook
  deepLinkCallbackUrl?: string; // Mobile wallet app callback (e.g. amg://checkout/confirm)
}

export interface PaymentInitiateResponse {
  success: boolean;
  transactionReference: string;
  idempotencyKey: string;
  gateway: PaymentGateway;
  checkoutUrl?: string; // Redirect URL for web (Chapa / Telebirr H5)
  deepLinkUrl?: string; // Direct app scheme (e.g. telebirr:// or cbebirr://)
  qrCodeData?: string; // QR code data for mobile scan
  instructions?: string; // For manual bank wire
  expiresAt: string;
}

export interface PaymentVerifyRequest {
  transactionReference: string;
  idempotencyKey?: string;
  orderNumber?: string;
}

export interface PaymentVerifyResponse {
  success: boolean;
  gateway: PaymentGateway;
  transactionReference: string;
  amountEtb: number;
  status: 'verified' | 'pending' | 'failed';
  verifiedAt?: string;
  rawResponse?: Record<string, unknown>;
}

export interface WebhookProcessResult {
  success: boolean;
  orderNumber: string;
  transactionReference: string;
  amountEtb: number;
  gateway: PaymentGateway;
  status: 'verified' | 'failed';
}

export interface PaymentProvider {
  readonly gateway: PaymentGateway;
  initiatePayment(req: PaymentInitiateRequest): Promise<PaymentInitiateResponse>;
  verifyPayment(req: PaymentVerifyRequest): Promise<PaymentVerifyResponse>;
  verifyWebhookSignature(headers: Record<string, string | null>, rawBody: string): boolean;
  processWebhook(headers: Record<string, string | null>, rawBody: string): Promise<WebhookProcessResult>;
}
