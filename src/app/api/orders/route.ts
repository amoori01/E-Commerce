import { NextRequest, NextResponse } from 'next/server';
import { CreateOrderDto, validateCreateOrderDto } from '@/dtos';
import { createAdminClient } from '@/lib/supabase/admin';
import { INITIAL_ORDERS, PRODUCTS, SEEDED_USERS, BRANCHES } from '@/lib/constants';
import { getServerOrders, addServerOrder } from '@/lib/server-orders';

// ====================================================================
// STREAM A: DIRECT SELF-SERVICE ORDERS API ENDPOINT
// ====================================================================

export async function POST(req: NextRequest) {
  try {
    const body: CreateOrderDto = await req.json();

    // 1. DTO Validation
    const validation = validateCreateOrderDto(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Order validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    // 2. Financial Computation
    const subtotal = body.items.reduce(
      (sum, item) => sum + item.unitPriceEtb * item.quantity,
      0
    );
    const tax = subtotal * 0.15; // 15% Ethiopian VAT
    const totalAmount = subtotal + tax;

    const orderNumber = `AMG-ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    // Look up customer details
    const customer = SEEDED_USERS.find((u) => u.id === body.customerId);
    const customerName = customer
      ? customer.companyName ? `${customer.fullName} (${customer.companyName})` : customer.fullName
      : 'Verified Corporate Buyer';

    // Look up branch details
    const branch = BRANCHES.find((b) => b.id === body.fulfillmentBranchId);
    const fulfillmentBranchName = branch ? branch.name : 'Addis Ababa Central Hub';

    const newOrder = {
      id: `ord-${Date.now()}`,
      orderNumber,
      customerId: body.customerId,
      customerName,
      fulfillmentBranchId: body.fulfillmentBranchId,
      fulfillmentBranchName,
      status: 'payment_pending' as const,
      deliveryType: body.deliveryType,
      deliveryAddress: body.deliveryAddress,
      subtotalEtb: subtotal,
      taxEtb: tax,
      totalAmountEtb: totalAmount,
      paymentMethod: body.paymentMethod || 'cbe_transfer',
      cbeFtReference: (body as any).cbeFtReference,
      cbePayerAccount: (body as any).cbePayerAccount,
      reservationExpiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours for CBE bank verification
      createdAt: new Date().toISOString(),
      items: body.items.map((i, idx) => {
        const product = PRODUCTS.find((p) => p.id === i.productId);
        return {
          id: `item-${idx + 1}`,
          productId: i.productId,
          productName: product ? product.name : `Industrial Consignment Item (${i.productId})`,
          sku: product ? product.sku : `AMG-ITEM-${i.productId.substring(0, 8)}`,
          quantity: i.quantity,
          unitPriceEtb: i.unitPriceEtb,
          totalPriceEtb: i.unitPriceEtb * i.quantity,
        };
      }),
    };

    INITIAL_ORDERS.unshift(newOrder as any);
    addServerOrder(newOrder as any);

    return NextResponse.json({
      success: true,
      order: newOrder,
      message: 'Direct order registered with CBE payment pending. Stock reserved awaiting Finance verification.',
    });
  } catch (err: any) {
    console.error('[ORDERS API ERROR]', err);
    return NextResponse.json(
      { error: 'Failed to create order', details: err.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get('customerId');
  const branchId = searchParams.get('branchId');

  let orders = [...getServerOrders()];

  if (customerId) {
    orders = orders.filter((o) => o.customerId === customerId);
  }
  if (branchId) {
    orders = orders.filter((o) => o.fulfillmentBranchId === branchId);
  }

  return NextResponse.json({
    success: true,
    count: orders.length,
    orders,
  });
}
