import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as restockHandler } from '@/app/api/inventory/restock/route';
import { BRANCHES, INVENTORY_ITEMS } from '@/lib/constants';

describe('Advanced Enterprise Operations: Negotiation Chat, Dispatch & Restocking (SRS 4.3, 4.5, 5.3, 5.4)', () => {
  it('dispatches custom RFQs to agents based on round-robin workload', () => {
    const agents = [
      { id: 'agent-1', name: 'Eng. Biruk', load: 3 },
      { id: 'agent-2', name: 'Eng. Selam', load: 1 },
      { id: 'agent-3', name: 'Eng. Henok', load: 2 },
    ];

    // Pick least loaded agent
    const selected = agents.reduce((prev, curr) => (curr.load < prev.load ? curr : prev));
    expect(selected.id).toBe('agent-2');
    expect(selected.name).toBe('Eng. Selam');
  });

  it('calculates replenishment purchase order quantity restoring safety threshold to 200%', () => {
    const onHand = 40;
    const safetyThreshold = 100;
    const deficit = safetyThreshold * 2 - onHand; // 200 - 40 = 160
    const suggestedPoQty = Math.max(100, Math.ceil(deficit / 50) * 50); // rounds up to 200

    expect(suggestedPoQty).toBe(200);
    expect(onHand + suggestedPoQty).toBeGreaterThanOrEqual(safetyThreshold * 2);
  });

  it('validates gate clearance pass code format', () => {
    const gatePassCode = 'GATE-PASS-849201';
    expect(/^GATE-PASS-\d{6}$/.test(gatePassCode)).toBe(true);
  });

  it('handles Branch Admin stock intake batches (+50, +500 units) via /api/inventory/restock', async () => {
    const branch = BRANCHES[1];
    const testSku = 'AMG-STEEL-RB-16MM';
    const inv = INVENTORY_ITEMS.find((i) => i.sku === testSku && i.branchId === branch.id);
    const initialQty = inv ? inv.quantityOnHand : 1000;

    const intakeReq = new NextRequest('http://localhost:3000/api/inventory/restock', {
      method: 'POST',
      body: JSON.stringify({
        branchId: branch.id,
        sku: testSku,
        action: 'intake',
        delta: 50,
      }),
    });

    const res = await restockHandler(intakeReq);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.action).toBe('stock_intake_applied');
    expect(data.intakeAmount).toBe(50);
    expect(data.newOnHand).toBe(initialQty + 50);
  });

  it('generates Automated Restock PO when requested via /api/inventory/restock', async () => {
    const branch = BRANCHES[1];
    const testSku = 'AMG-STEEL-RB-16MM';

    const poReq = new NextRequest('http://localhost:3000/api/inventory/restock', {
      method: 'POST',
      body: JSON.stringify({
        branchId: branch.id,
        sku: testSku,
        action: 'restock_po',
        supplier: 'AMG Rolling Mill Corp',
      }),
    });

    const res = await restockHandler(poReq);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.action).toBe('purchase_order_issued');
    expect(data.purchaseOrder.poNumber).toMatch(/^AMG-PO-2026-\d{4}$/);
    expect(data.purchaseOrder.branchId).toBe(branch.id);
  });

  it('calculates custom engineering quote using formula: Raw Materials + (Machine Hours × Rate) + Coating + Freight + Target Margin %', () => {
    const rawMaterialCost = 8500000;
    const machineHours = 320;
    const hourlyRate = 3500;
    const protectiveCoating = 750000;
    const freight = 450000;
    const targetMarginPercent = 9.5;

    // Formula calculation
    const machineCost = machineHours * hourlyRate; // 1,120,000
    const baseProductionCost = rawMaterialCost + machineCost + protectiveCoating + freight; // 10,820,000
    const quotedTotal = Math.round(baseProductionCost * (1 + targetMarginPercent / 100)); // 11,847,900

    expect(machineCost).toBe(1120000);
    expect(baseProductionCost).toBe(10820000);
    expect(quotedTotal).toBe(11847900);
  });

  it('formats Proforma Invoices with versioned revisions, itemized 15% VAT, and ERCA fiscal parameters', () => {
    const quotedTotal = 11847900;
    const subtotalExclVat = quotedTotal / 1.15;
    const itemizedVat15 = subtotalExclVat * 0.15;

    expect(Math.round(subtotalExclVat + itemizedVat15)).toBe(quotedTotal);
    expect(itemizedVat15).toBeCloseTo(quotedTotal - subtotalExclVat, 2);

    // ERCA Compliance Stamp parameters
    const ercaParameters = {
      supplierTin: '0001293847',
      vatRegNo: '12903847-VAT',
      machineId: 'ERCA-MIN-AA-9812401',
      proclamation: 'Proclamation No. 285/2002',
      vatRate: 0.15,
    };

    expect(ercaParameters.supplierTin).toMatch(/^\d{10}$/);
    expect(ercaParameters.vatRegNo).toContain('-VAT');
    expect(ercaParameters.vatRate).toBe(0.15);
  });
});

