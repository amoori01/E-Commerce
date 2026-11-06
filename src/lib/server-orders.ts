import { INITIAL_ORDERS as SEED_ORDERS } from '@/lib/constants';
import { Order } from '@/types';

// ====================================================================
// SHARED GLOBAL SERVER-SIDE IN-MEMORY ORDERS REPOSITORY
// Guarantees all API routes (/api/orders, /api/payments/*, /api/orders/*)
// share the same live orders state across all Next.js route bundles.
// ====================================================================

declare global {
  // eslint-disable-next-line no-var
  var __amg_global_orders: Order[] | undefined;
}

export function getServerOrders(): Order[] {
  if (typeof globalThis !== 'undefined') {
    if (!globalThis.__amg_global_orders) {
      // Initialize with seed orders
      globalThis.__amg_global_orders = [...SEED_ORDERS];
    }
    return globalThis.__amg_global_orders;
  }
  return SEED_ORDERS;
}

export function addServerOrder(order: Order): Order {
  const list = getServerOrders();
  const existingIdx = list.findIndex(
    (o) => o.id === order.id || o.orderNumber === order.orderNumber
  );
  if (existingIdx >= 0) {
    list[existingIdx] = { ...list[existingIdx], ...order };
    return list[existingIdx];
  } else {
    list.unshift(order);
    return order;
  }
}

export function findServerOrder(
  idOrNumber?: string,
  predicate?: (o: Order) => boolean
): Order | undefined {
  const list = getServerOrders();
  if (predicate) {
    const found = list.find(predicate);
    if (found) return found;
  }
  if (!idOrNumber) return undefined;
  const target = idOrNumber.trim().toLowerCase();
  return list.find(
    (o) =>
      o.id.toLowerCase() === target ||
      o.orderNumber.toLowerCase() === target
  );
}

export function clearServerOrders(): void {
  if (typeof globalThis !== 'undefined') {
    globalThis.__amg_global_orders = [];
  }
}
