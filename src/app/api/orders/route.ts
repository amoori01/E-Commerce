import { NextRequest, NextResponse } from 'next/server';
import { CreateOrderDto, validateCreateOrderDto } from '@/dtos';
import { createAdminClient } from '@/lib/supabase/admin';
import { INITIAL_ORDERS } from '@/lib/constants';

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

    const newOrder = {
      id: `ord-${Date.now()}`,
      orderNumber,
      customerId: body.customerId,
      customerName: 'Verified Corporate Buyer',
      fulfillmentBranchId: body.fulfillmentBranchId,
      fulfillmentBranchName: 'Regional Plant Hub',
      status: 'fulfillment_processing' as const,
      deliveryType: body.deliveryType,
      deliveryAddress: body.deliveryAddress,
      subtotalEtb: subtotal,
      taxEtb: tax,
      totalAmountEtb: totalAmount,
      paymentMethod: body.paymentMethod,
      createdAt: new Date().toISOString(),
      items: body.items.map((i, idx) => ({
        id: `item-${idx + 1}`,
        productId: i.productId,
        productName: `Industrial Consignment Item (${i.productId})`,
        sku: `AMG-ITEM-${i.productId.substring(0, 8)}`,
        quantity: i.quantity,
        unitPriceEtb: i.unitPriceEtb,
        totalPriceEtb: i.unitPriceEtb * i.quantity,
      })),
    };

    // In production with live Supabase credentials:
    // const supabase = createAdminClient();
    // await supabase.from('orders').insert({ ... });

    return NextResponse.json({
      success: true,
      order: newOrder,
      message: 'Direct order registered and routed to branch fulfillment queue.',
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

  let orders = [...INITIAL_ORDERS];

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
