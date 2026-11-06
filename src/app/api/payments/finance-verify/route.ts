import { NextRequest, NextResponse } from 'next/server';
import { INITIAL_ORDERS } from '@/lib/constants';
import { getServerOrders, addServerOrder, findServerOrder } from '@/lib/server-orders';
import { Order } from '@/types';

// ====================================================================
// FINANCE VERIFICATION API ENDPOINT
// POST /api/payments/finance-verify
// Per Architecture Document Section 5.1 & 5.2:
// Finance approves or rejects CBE FT reference submitted by customer.
// ====================================================================

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      orderId,
      orderNumber,
      action, // 'approve' | 'reject'
      verifiedBy = 'Helen Girmachew (Finance Lead)',
      rejectionReason,
      order: clientOrder,
    } = body as {
      orderId?: string;
      orderNumber?: string;
      action: 'approve' | 'reject';
      verifiedBy?: string;
      rejectionReason?: string;
      order?: Order;
    };

    if (!orderId && !orderNumber && !clientOrder) {
      return NextResponse.json(
        { error: 'Either orderId or orderNumber is required' },
        { status: 400 }
      );
    }

    if (!action || (action !== 'approve' && action !== 'reject')) {
      return NextResponse.json(
        { error: 'Action must be either "approve" or "reject"' },
        { status: 400 }
      );
    }

    // Look up order in shared server repository
    let order =
      findServerOrder(orderId) ||
      findServerOrder(orderNumber) ||
      INITIAL_ORDERS.find(
        (o) => (orderId && o.id === orderId) || (orderNumber && o.orderNumber === orderNumber)
      );

    // If order was passed from client localStorage or freshly created
    if (!order && clientOrder) {
      order = addServerOrder(clientOrder);
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const now = new Date().toISOString();

    if (action === 'approve') {
      order.status = 'fulfillment_processing';
      order.paymentVerifiedAt = now;
      order.paymentVerifiedBy = verifiedBy;
      order.paymentRejectionReason = undefined;

      return NextResponse.json({
        success: true,
        message: `CBE payment for order ${order.orderNumber} successfully verified. Stock allocated and moved to fulfillment processing.`,
        order,
      });
    } else {
      // Reject: customer can resubmit reference
      order.status = 'payment_pending';
      order.paymentRejectionReason = rejectionReason || 'CBE FT reference could not be matched with bank ledger statement';

      return NextResponse.json({
        success: true,
        message: `CBE payment for order ${order.orderNumber} rejected. Customer requested to resubmit valid FT code.`,
        order,
      });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Finance verification failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');

  let orders = [...INITIAL_ORDERS];
  if (status) {
    orders = orders.filter((o) => o.status === status);
  }

  return NextResponse.json({
    success: true,
    totalCount: orders.length,
    orders,
  });
}
