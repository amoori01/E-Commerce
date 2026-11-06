import { NextRequest, NextResponse } from 'next/server';
import { INITIAL_ORDERS } from '@/lib/constants';
import { getServerOrders, addServerOrder, findServerOrder } from '@/lib/server-orders';
import { Order } from '@/types';

// ====================================================================
// CUSTOMER CBE FT REFERENCE SUBMISSION ENDPOINT
// POST /api/payments/cbe-submit
// Per Architecture Document Section 5.2:
// Customer transfers at CBE and pastes bank FT reference number.
// ====================================================================

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderNumber, orderId, cbeFtReference, cbePayerAccount, order: clientOrder } = body as {
      orderNumber?: string;
      orderId?: string;
      cbeFtReference: string;
      cbePayerAccount?: string;
      order?: Order;
    };

    if (!cbeFtReference || !cbeFtReference.trim()) {
      return NextResponse.json(
        { error: 'CBE FT reference number is required' },
        { status: 400 }
      );
    }

    let order =
      findServerOrder(orderNumber) ||
      findServerOrder(orderId) ||
      INITIAL_ORDERS.find(
        (o) => (orderNumber && o.orderNumber === orderNumber) || (orderId && o.id === orderId)
      );

    // If not found in server cache, restore from client order
    if (!order && clientOrder) {
      order = addServerOrder(clientOrder);
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    order.cbeFtReference = cbeFtReference.trim().toUpperCase();
    if (cbePayerAccount) {
      order.cbePayerAccount = cbePayerAccount.trim();
    }
    order.paymentMethod = 'cbe_transfer';
    order.status = 'payment_pending';
    order.paymentSubmittedAt = new Date().toISOString();
    order.paymentRejectionReason = undefined;

    // Ensure it's saved in the shared repository
    addServerOrder(order);

    return NextResponse.json({
      success: true,
      message: 'CBE FT Reference submitted successfully. Awaiting Finance verification.',
      order,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to submit CBE reference';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
