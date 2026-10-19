import { NextRequest, NextResponse } from 'next/server';
import { INVENTORY_ITEMS, BRANCHES } from '@/lib/constants';

// ====================================================================
// AUTOMATED INVENTORY RESTOCKING & SUPPLIER PO GENERATOR (SRS 5.3)
// Scans depot stock levels against safetyStockThreshold,
// triggers automated purchase replenishment requisitions,
// and alerts branch procurement managers.
// ====================================================================

interface RestockOrder {
  poNumber: string;
  branchId: string;
  branchName: string;
  productId: string;
  sku: string;
  productName: string;
  currentOnHand: number;
  safetyThreshold: number;
  suggestedRestockQty: number;
  supplier: string;
  urgency: 'CRITICAL_STOCKOUT_RISK' | 'PREVENTATIVE_ORDER';
  createdAt: string;
  status: 'PURCHASE_ORDER_ISSUED' | 'MILL_ALLOCATED';
}

const GENERATED_PURCHASE_ORDERS: RestockOrder[] = [];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get('branchId');

  // Evaluate items needing restock
  let items = INVENTORY_ITEMS;
  if (branchId) {
    items = items.filter((i) => i.branchId === branchId);
  }

  const triggeredOrders = items
    .filter((i) => i.quantityOnHand <= i.safetyStockThreshold)
    .map((i) => {
      const deficit = i.safetyStockThreshold * 2 - i.quantityOnHand;
      const suggestedQty = Math.max(100, Math.ceil(deficit / 50) * 50);

      return {
        poNumber: `AMG-PO-2026-${i.sku.substring(0, 8)}-${Math.floor(100 + Math.random() * 900)}`,
        branchId: i.branchId,
        branchName: i.branchName,
        productId: i.productId,
        sku: i.sku,
        productName: i.productName,
        currentOnHand: i.quantityOnHand,
        safetyThreshold: i.safetyStockThreshold,
        suggestedRestockQty: suggestedQty,
        supplier: i.subsidiaryName.includes('Steel')
          ? 'AMG Rolling Mills & Blast Furnace Complex'
          : 'AMG Manufacturing & Packaging Works',
        urgency: i.quantityOnHand === 0 ? 'CRITICAL_STOCKOUT_RISK' : 'PREVENTATIVE_ORDER',
        createdAt: new Date().toISOString(),
        status: 'PURCHASE_ORDER_ISSUED' as const,
      };
    });

  return NextResponse.json({
    success: true,
    evaluationTimestamp: new Date().toISOString(),
    lowStockItemsCount: triggeredOrders.length,
    restockOrders: triggeredOrders,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { branchId, sku, restockQty, supplier } = body;

    const poNumber = `AMG-PO-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newPO: RestockOrder = {
      poNumber,
      branchId: branchId || BRANCHES[1].id,
      branchName: 'Adama Industrial Park Hub',
      productId: 'prod-custom',
      sku: sku || 'AMG-STEEL-16MM',
      productName: 'Raw Rolling Billet / Coil Consignment',
      currentOnHand: 0,
      safetyThreshold: 200,
      suggestedRestockQty: Number(restockQty) || 500,
      supplier: supplier || 'AMG Central Plant Logistics',
      urgency: 'PREVENTATIVE_ORDER',
      createdAt: new Date().toISOString(),
      status: 'PURCHASE_ORDER_ISSUED',
    };

    GENERATED_PURCHASE_ORDERS.push(newPO);

    return NextResponse.json({
      success: true,
      message: `Purchase Requisition ${poNumber} issued to parent plant foundry.`,
      purchaseOrder: newPO,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Restock order error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
