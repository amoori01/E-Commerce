import { NextRequest, NextResponse } from 'next/server';
import { getPaymentProvider } from '@/lib/payments';
import { INITIAL_ORDERS } from '@/lib/constants';
import { validateOrderTransition, recordOrderTransition } from '@/lib/state-machine';

// ====================================================================
// CBE BIRR PAYMENT WEBHOOK NOTIFICATION (COMMERCIAL BANK OF ETHIOPIA)
// POST /api/webhooks/cbe-birr
// ====================================================================

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const headersMap: Record<string, string | null> = {
      'x-cbe-birr-signature': req.headers.get('x-cbe-birr-signature'),
      authorization: req.headers.get('authorization'),
    };

    const provider = getPaymentProvider('cbe_birr');
    const result = await provider.processWebhook(headersMap, rawBody);

    if (result.success && result.status === 'verified') {
      const order = INITIAL_ORDERS.find((o) => o.orderNumber === result.orderNumber);
      if (order && (order.status === 'checkout_initiated' || order.status === 'payment_pending')) {
        const prev = order.status;
        const val = validateOrderTransition(prev, 'payment_verified');
        if (val.isValid) {
          order.status = 'payment_verified';
          recordOrderTransition(
            order.id,
            prev,
            'payment_verified',
            'cbe_birr_webhook',
            `CBE Birr transaction verified: ${result.transactionReference}`
          );

          order.status = 'fulfillment_processing';
          recordOrderTransition(
            order.id,
            'payment_verified',
            'fulfillment_processing',
            'system_auto',
            'Auto-transitioned to fulfillment'
          );
        }
      }
    }

    return NextResponse.json({
      code: 0,
      message: 'CBE Birr notification received and processed.',
      orderNumber: result.orderNumber,
      transactionReference: result.transactionReference,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'CBE Birr webhook error';
    return NextResponse.json({ code: 500, error: msg }, { status: 500 });
  }
}
