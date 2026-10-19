import { NextRequest, NextResponse } from 'next/server';
import { INITIAL_QUOTES, INITIAL_ORDERS, BRANCHES } from '@/lib/constants';
import { authenticateRequest, enforceAbac } from '@/lib/auth-guard';
import { recordQuoteTransition, recordOrderTransition } from '@/lib/state-machine';
import { Order } from '@/types';

// ====================================================================
// SALES AGENT WORKFLOW: CONVERT APPROVED QUOTE TO ORDER (R1.3 & R3.2)
// POST /api/quotes/convert-to-order
// Converts an approved RFQ quote into an active firm order.
// ====================================================================

export async function POST(req: NextRequest) {
  try {
    const auth = authenticateRequest(req);
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Only sales agents, branch admins, or super admins can convert quotes to orders
    if (!['sales_agent', 'branch_admin', 'super_admin'].includes(auth.user.role)) {
      return NextResponse.json(
        { error: 'Only authorized sales agents or branch admins can convert quotes to orders' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { quoteId, fulfillmentBranchId, deliveryType = 'branch_pickup', deliveryAddress } = body;

    if (!quoteId) {
      return NextResponse.json({ error: 'quoteId is required' }, { status: 400 });
    }

    const quote = INITIAL_QUOTES.find((q) => q.id === quoteId || q.quoteNumber === quoteId);
    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    // ABAC Check
    const abac = enforceAbac(auth.user, {
      subsidiaryId: quote.subsidiaryId,
      assignedAgentId: quote.assignedAgentId,
    }, 'write');

    if (!abac.allowed) {
      return NextResponse.json({ error: abac.reason }, { status: 403 });
    }

    // Check quote status
    if (quote.status !== 'quote_approved') {
      return NextResponse.json(
        { error: `Only approved quotes can be converted to orders. Current status: '${quote.status}'` },
        { status: 400 }
      );
    }

    // Determine fulfillment branch
    const branch = BRANCHES.find((b) => b.id === fulfillmentBranchId) || BRANCHES[0];

    // Compute financial totals
    const subtotal = quote.finalQuotedTotalEtb || quote.estimatedTotalEtb || 100000;
    const tax = subtotal * 0.15; // 15% VAT
    const totalAmount = subtotal + tax;

    const orderNumber = `AMG-ORD-FROM-RFQ-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder: Order = {
      id: `ord-rfq-${Date.now()}`,
      orderNumber,
      customerId: quote.customerId,
      customerName: quote.customerName,
      customerCompany: quote.customerCompany,
      fulfillmentBranchId: branch.id,
      fulfillmentBranchName: branch.name,
      status: 'fulfillment_processing',
      deliveryType,
      deliveryAddress: deliveryType === 'freight_delivery' ? (deliveryAddress || quote.deliveryDestination) : undefined,
      subtotalEtb: subtotal,
      taxEtb: tax,
      totalAmountEtb: totalAmount,
      paymentMethod: 'bank_transfer',
      createdAt: new Date().toISOString(),
      items: quote.items.map((i, idx) => ({
        id: `ord-item-${idx + 1}`,
        productId: i.productId || `custom-prod-${idx + 1}`,
        productName: i.customProductName,
        sku: `AMG-RFQ-${i.customProductName.substring(0, 10).replace(/\s+/g, '-').toUpperCase()}`,
        quantity: i.quantity,
        unitPriceEtb: i.quotedUnitPriceEtb || (subtotal / Math.max(1, i.quantity)),
        totalPriceEtb: i.quotedTotalPriceEtb || subtotal,
      })),
    };

    INITIAL_ORDERS.unshift(newOrder);

    // Transition quote status to 'payment_processing'
    const prevQuoteStatus = quote.status;
    quote.status = 'payment_processing';
    recordQuoteTransition(
      quote.id,
      prevQuoteStatus,
      'payment_processing',
      auth.user.email,
      `Converted to active order ${orderNumber}`
    );

    recordOrderTransition(
      newOrder.id,
      'checkout_initiated',
      'fulfillment_processing',
      auth.user.email,
      `Firm order created from approved RFQ ${quote.quoteNumber}`
    );

    return NextResponse.json({
      success: true,
      message: `Quote ${quote.quoteNumber} converted to Order ${orderNumber}.`,
      order: newOrder,
      quoteStatus: quote.status,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Conversion error';
    return NextResponse.json({ error: 'Failed to convert quote to order', details: msg }, { status: 500 });
  }
}
