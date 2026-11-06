import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as verifyPost } from '@/app/api/payments/finance-verify/route';
import { POST as submitPost } from '@/app/api/payments/cbe-submit/route';
import { addServerOrder } from '@/lib/server-orders';
import { Order } from '@/types';

describe('CBE Bank Transfer & Finance Verification Architecture (SAD 5.2)', () => {
  const sampleOrder: Order = {
    id: 'ord-test-01',
    orderNumber: 'AMG-ORD-2026-TEST',
    customerId: 'e4444444-4444-4444-4444-444444444444',
    customerName: 'Almaz Worku',
    fulfillmentBranchId: 'a1111111-1111-1111-1111-111111111111',
    fulfillmentBranchName: 'Addis Ababa Central Hub',
    status: 'payment_pending',
    deliveryType: 'branch_pickup',
    subtotalEtb: 37000.0,
    taxEtb: 5550.0,
    totalAmountEtb: 42550.0,
    paymentMethod: 'cbe_transfer',
    createdAt: new Date().toISOString(),
    items: [],
  };

  beforeEach(() => {
    addServerOrder({ ...sampleOrder });
  });

  it('allows a customer to submit a CBE FT reference code for an order', async () => {
    const testOrder = { ...sampleOrder };
    const ftCode = 'FT26110699281799';

    const req = new NextRequest('http://localhost:3000/api/payments/cbe-submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderNumber: testOrder.orderNumber,
        cbeFtReference: ftCode,
        cbePayerAccount: '1000998877665',
      }),
    });

    const res = await submitPost(req);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.order.cbeFtReference).toBe(ftCode);
    expect(data.order.status).toBe('payment_pending');
  });

  it('allows Finance role to verify and approve a submitted CBE payment', async () => {
    const testOrder = { ...sampleOrder, status: 'payment_pending' as const, cbeFtReference: 'FT26110699281799' };
    addServerOrder(testOrder);

    const req = new NextRequest('http://localhost:3000/api/payments/finance-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderNumber: testOrder.orderNumber,
        action: 'approve',
        verifiedBy: 'Helen Girmachew (Finance Lead)',
      }),
    });

    const res = await verifyPost(req);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.order.status).toBe('fulfillment_processing');
    expect(data.order.paymentVerifiedBy).toContain('Helen Girmachew');
    expect(data.order.paymentVerifiedAt).toBeDefined();
  });

  it('allows Finance role to reject mismatched CBE FT references', async () => {
    const testOrder = { ...sampleOrder, status: 'payment_pending' as const, cbeFtReference: 'FT_WRONG_CODE_123' };
    addServerOrder(testOrder);

    const req = new NextRequest('http://localhost:3000/api/payments/finance-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderNumber: testOrder.orderNumber,
        action: 'reject',
        rejectionReason: 'Reference code not found in CBE daily statement',
        verifiedBy: 'Helen Girmachew (Finance Lead)',
      }),
    });

    const res = await verifyPost(req);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.order.status).toBe('payment_pending');
    expect(data.order.paymentRejectionReason).toContain('Reference code not found');
  });
});
