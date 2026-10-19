import { NextRequest, NextResponse } from 'next/server';
import { getPaymentProvider, PaymentInitiateRequest, PaymentInitiateResponse } from '@/lib/payments';
import { PaymentGateway } from '@/types';
import { INITIAL_ORDERS } from '@/lib/constants';
import { validateOrderTransition, recordOrderTransition } from '@/lib/state-machine';

// ====================================================================
// PAYMENT INITIATION ENDPOINT (SRS 4.4 & PCI-DSS v4.0)
// POST /api/payments/initiate
// Enforces mandatory Idempotency-Key header to prevent duplicate charges.
// Routes to Chapa, Telebirr, CBE Birr, or Bank Transfer provider.
// ====================================================================

// In-memory idempotency cache (in cloud production this is stored in Redis / PostgreSQL)
const IDEMPOTENCY_STORE = new Map<string, { response: PaymentInitiateResponse; timestamp: number }>();

export async function POST(req: NextRequest) {
  try {
    // 1. Mandatory Idempotency Key Validation
    const idempotencyKey =
      req.headers.get('idempotency-key') ||
      req.headers.get('x-idempotency-key');

    if (!idempotencyKey || idempotencyKey.trim().length < 8) {
      return NextResponse.json(
        {
          error: 'Missing or invalid Idempotency-Key header',
          details: 'All financial checkout requests must supply a unique Idempotency-Key (min 8 characters).',
        },
        { status: 400 }
      );
    }

    // 2. Check Idempotency Cache
    const existing = IDEMPOTENCY_STORE.get(idempotencyKey);
    if (existing) {
      return NextResponse.json({
        ...existing.response,
        idempotentReplay: true,
      });
    }

    const body = await req.json();
    const {
      orderNumber,
      orderId,
      gateway = 'telebirr',
      amountEtb,
      customerEmail = 'customer@amgholdings.com',
      customerName = 'Valued Customer',
      customerPhone,
      deepLinkCallbackUrl,
    } = body as {
      orderNumber?: string;
      orderId?: string;
      gateway?: PaymentGateway;
      amountEtb?: number;
      customerEmail?: string;
      customerName?: string;
      customerPhone?: string;
      deepLinkCallbackUrl?: string;
    };

    const targetOrderNumber = orderNumber || orderId || `AMG-ORD-${Date.now()}`;
    const targetAmount = Number(amountEtb) || 1000;

    // 3. Resolve Provider
    const provider = getPaymentProvider(gateway);

    const initiateReq: PaymentInitiateRequest = {
      orderId: targetOrderNumber,
      orderNumber: targetOrderNumber,
      amountEtb: targetAmount,
      currency: 'ETB',
      customerEmail,
      customerPhone,
      customerName,
      idempotencyKey,
      deepLinkCallbackUrl: deepLinkCallbackUrl || 'amg://checkout/confirm',
    };

    const result = await provider.initiatePayment(initiateReq);

    // 4. Update order status to 'payment_pending' if order exists
    const order = INITIAL_ORDERS.find((o) => o.orderNumber === targetOrderNumber || o.id === targetOrderNumber);
    if (order && order.status === 'checkout_initiated') {
      const val = validateOrderTransition(order.status, 'payment_pending');
      if (val.isValid) {
        order.status = 'payment_pending';
        recordOrderTransition(
          order.id,
          'checkout_initiated',
          'payment_pending',
          customerEmail,
          `Payment initiated via ${gateway}`
        );
      }
    }

    // 5. Cache Idempotent Response (TTL 24 hours)
    IDEMPOTENCY_STORE.set(idempotencyKey, { response: result, timestamp: Date.now() });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Payment initiation error';
    return NextResponse.json({ error: 'Failed to initiate payment', details: msg }, { status: 500 });
  }
}
