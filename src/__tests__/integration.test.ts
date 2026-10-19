import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getProducts } from '@/app/api/products/route';
import { GET as getHealth } from '@/app/api/health/route';
import { POST as posTransaction } from '@/app/api/erp/pos-transaction/route';
import { POST as initiatePayment } from '@/app/api/payments/initiate/route';
import { POST as syncCart, GET as getCart } from '@/app/api/cart/route';
import { BRANCHES, PRODUCTS, INVENTORY_ITEMS } from '@/lib/constants';

describe('Integration Test Suite: Catalog, Sync, Cart & Payments', () => {
  it('returns paginated and filtered catalog products with edge cache headers', async () => {
    const req = new NextRequest('http://localhost:3000/api/products?stream=direct&limit=5');
    const res = await getProducts(req);

    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.products.length).toBeLessThanOrEqual(5);
    expect(data.meta.total).toBeGreaterThan(0);
    expect(res.headers.get('Cache-Control')).toContain('public');
  });

  it('filters catalog products by search query', async () => {
    const req = new NextRequest('http://localhost:3000/api/products?search=Roofing');
    const res = await getProducts(req);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.products.length).toBeGreaterThan(0);
    expect(data.products[0].name.toLowerCase()).toContain('roof');
  });

  it('reports healthy telemetry on /api/health', async () => {
    const res = await getHealth();
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.status).toBe('healthy');
    expect(data.services.database.status).toBe('connected');
    expect(data.services.stockWorker.status).toBe('active');
  });

  it('processes physical branch POS sale and decrements branch inventory', async () => {
    const branch = BRANCHES[1]; // Adama Hub
    const testSku = 'AMG-STEEL-RB-16MM';
    const inv = INVENTORY_ITEMS.find((i) => i.sku === testSku && i.branchId === branch.id);
    const initialQty = inv ? inv.quantityOnHand : 1000;

    const payload = {
      branchId: branch.id,
      cashierId: 'cashier-01',
      posTerminalId: 'POS-ADAMA-1',
      branchInvoiceNumber: `INV-POS-${Date.now()}`,
      items: [{ sku: testSku, quantity: 5, unitPriceEtb: 4120 }],
      paymentType: 'POS_CARD' as const,
      transactionTimestamp: new Date().toISOString(),
    };

    const req = new NextRequest('http://localhost:3000/api/erp/pos-transaction', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const res = await posTransaction(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.erpSyncEvent.event).toBe('PHYSICAL_POS_SALE');

    if (inv) {
      expect(inv.quantityOnHand).toBe(initialQty - 5);
    }
  });

  it('synchronizes and persists cart server-side for authenticated users', async () => {
    const userId = 'u-test-cart-user';
    const sampleProduct = PRODUCTS[0];

    const postReq = new NextRequest('http://localhost:3000/api/cart', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        items: [{ product: sampleProduct, quantity: 15 }],
      }),
    });

    const postRes = await syncCart(postReq);
    expect(postRes.status).toBe(200);

    const getReq = new NextRequest(`http://localhost:3000/api/cart?userId=${userId}`);
    const getRes = await getCart(getReq);
    expect(getRes.status).toBe(200);

    const getData = await getRes.json();
    expect(getData.count).toBe(15);
    expect(getData.items[0].product.id).toBe(sampleProduct.id);
  });

  it('enforces idempotency key on payment initiation and returns cached response on replay', async () => {
    const key = `idemp-test-${Date.now()}`;
    const payload = {
      orderNumber: `AMG-ORD-TEST-${Date.now()}`,
      amountEtb: 25000,
      gateway: 'telebirr',
      customerEmail: 'buyer@test.et',
    };

    const req1 = new NextRequest('http://localhost:3000/api/payments/initiate', {
      method: 'POST',
      headers: { 'Idempotency-Key': key },
      body: JSON.stringify(payload),
    });

    const res1 = await initiatePayment(req1);
    expect(res1.status).toBe(200);
    const data1 = await res1.json();
    expect(data1.success).toBe(true);

    // Replay with identical key
    const req2 = new NextRequest('http://localhost:3000/api/payments/initiate', {
      method: 'POST',
      headers: { 'Idempotency-Key': key },
      body: JSON.stringify(payload),
    });

    const res2 = await initiatePayment(req2);
    expect(res2.status).toBe(200);
    const data2 = await res2.json();
    expect(data2.idempotentReplay).toBe(true);
    expect(data2.transactionReference).toBe(data1.transactionReference);
  });
});
