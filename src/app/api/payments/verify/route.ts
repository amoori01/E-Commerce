import { NextRequest, NextResponse } from 'next/server';
import { getPaymentProvider } from '@/lib/payments';
import { PaymentGateway } from '@/types';
import { INITIAL_ORDERS } from '@/lib/constants';
import { validateOrderTransition, recordOrderTransition } from '@/lib/state-machine';

// ====================================================================
// PAYMENT VERIFICATION ENDPOINT
// POST /api/payments/verify
// ====================================================================

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { transactionReference, gateway = 'telebirr', orderNumber } = body as {
      transactionReference: string;
      gateway: PaymentGateway;
      orderNumber?: string;
    };

    if (!transactionReference) {
      return NextResponse.json({ error: 'transactionReference is required' }, { status: 400 });
    }

    const provider = getPaymentProvider(gateway);
    const verification = await provider.verifyPayment({
      transactionReference,
      orderNumber,
    });

    if (verification.status === 'verified') {
      const order = INITIAL_ORDERS.find(
        (o) => o.orderNumber === orderNumber || o.orderNumber === transactionReference
      );

      if (order && (order.status === 'checkout_initiated' || order.status === 'payment_pending')) {
        const prev = order.status;
        const val = validateOrderTransition(prev, 'payment_verified');
        if (val.isValid) {
          order.status = 'payment_verified';
          recordOrderTransition(
            order.id,
            prev,
            'payment_verified',
            `${gateway}_gateway`,
            `Payment verified with reference ${transactionReference}`
          );

          // Fast-forward to fulfillment processing per state machine
          order.status = 'fulfillment_processing';
          recordOrderTransition(
            order.id,
            'payment_verified',
            'fulfillment_processing',
            'system_auto',
            'Stock allocated and routed to branch fulfillment queue'
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      verification,
      message: `Transaction ${transactionReference} verified successfully.`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Payment verification error';
    return NextResponse.json({ error: 'Verification failed', details: msg }, { status: 500 });
  }
}
