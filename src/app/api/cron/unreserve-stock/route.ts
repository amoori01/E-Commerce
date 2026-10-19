import { NextRequest, NextResponse } from 'next/server';
import { INITIAL_ORDERS, INVENTORY_ITEMS } from '@/lib/constants';
import { validateOrderTransition, recordOrderTransition } from '@/lib/state-machine';

// ====================================================================
// CRON WORKER: 30-MINUTE STOCK UN-RESERVATION ENGINE (SRS 4.3)
// Triggered every 5-10 minutes.
// Identifies orders in 'payment_pending' older than 30 minutes,
// rolls back reserved stock quantities, and transitions order status to 'cancelled'.
// ====================================================================

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'amg-cron-secret-2026';

    if (authHeader && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized cron worker call' }, { status: 401 });
    }

    const now = Date.now();
    const timeoutThresholdMs = 30 * 60 * 1000; // 30 minutes
    const cutoffTime = now - timeoutThresholdMs;

    const unreservedOrders: {
      orderId: string;
      orderNumber: string;
      releasedItems: { productId: string; quantity: number }[];
    }[] = [];

    // Find pending orders exceeding timeout
    for (const order of INITIAL_ORDERS) {
      if (order.status === 'payment_pending' || order.status === 'checkout_initiated') {
        const orderTime = new Date(order.createdAt).getTime();
        if (orderTime < cutoffTime) {
          const prev = order.status;
          const val = validateOrderTransition(prev, 'cancelled');
          if (val.isValid) {
            order.status = 'cancelled';
            recordOrderTransition(
              order.id,
              prev,
              'cancelled',
              'cron_unreserve_worker',
              'Payment window exceeded 30 minutes: auto-released cart and un-reserved branch stock'
            );

            // Roll back inventory reservation counters
            for (const item of order.items) {
              const inv = INVENTORY_ITEMS.find((i) => i.productId === item.productId);
              if (inv) {
                inv.quantityReserved = Math.max(0, inv.quantityReserved - item.quantity);
              }
            }

            unreservedOrders.push({
              orderId: order.id,
              orderNumber: order.orderNumber,
              releasedItems: order.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
            });
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      worker: 'amg_stock_unreservation_worker',
      timestamp: new Date().toISOString(),
      timeoutMinutes: 30,
      unreservedOrdersCount: unreservedOrders.length,
      unreservedOrders,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Cron worker failed';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
