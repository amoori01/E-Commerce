import { NextRequest, NextResponse } from 'next/server';
import { validateOrderTransition, recordOrderTransition } from '@/lib/state-machine';
import { INITIAL_ORDERS } from '@/lib/constants';
import { OrderStatus } from '@/types';
import { authenticateRequest, enforceAbac } from '@/lib/auth-guard';

// ====================================================================
// ORDER STATE MACHINE TRANSITION ENDPOINT
// PATCH /api/orders/[id]/status
// Validates transitions and logs audit records.
// ====================================================================

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = authenticateRequest(req);

    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { targetStatus, reason } = body as { targetStatus: OrderStatus; reason?: string };

    if (!targetStatus) {
      return NextResponse.json({ error: 'targetStatus is required' }, { status: 400 });
    }

    const order = INITIAL_ORDERS.find((o) => o.id === id || o.orderNumber === id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // ABAC check
    const abac = enforceAbac(auth.user, {
      customerId: order.customerId,
      fulfillmentBranchId: order.fulfillmentBranchId,
    }, 'write');

    if (!abac.allowed) {
      return NextResponse.json({ error: abac.reason }, { status: 403 });
    }

    // Validate state machine transition
    const validation = validateOrderTransition(order.status, targetStatus);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'State machine transition rejected', details: validation.error },
        { status: 400 }
      );
    }

    const previousStatus = order.status;
    order.status = targetStatus;

    // Record audit trail
    const auditRecord = recordOrderTransition(
      order.id,
      previousStatus,
      targetStatus,
      auth.user.email,
      reason || 'Manual transition via API'
    );

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      previousStatus,
      newStatus: targetStatus,
      auditRecord,
      message: `Order transitioned from '${previousStatus}' to '${targetStatus}'.`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Transition error';
    return NextResponse.json({ error: 'Failed to transition order status', details: msg }, { status: 500 });
  }
}
