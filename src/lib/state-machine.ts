import { OrderStatus, QuoteStatus } from '@/types';

// ====================================================================
// AMG HOLDINGS STATE MACHINE ENGINE (SRS 4.3)
// Enforces deterministic state transitions for Orders and Quotes,
// rejecting illegal state transitions and recording audit history.
// ====================================================================

// --------------------------------------------------------------------
// 1. ORDER STATE MACHINE
// --------------------------------------------------------------------
// Cart Created → Checkout Initiated → Payment Pending → Payment Verified →
// Fulfillment Processing → Shipped / Ready for Pickup → Completed
// --------------------------------------------------------------------

export const VALID_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  cart_created: ['checkout_initiated', 'cancelled'],
  checkout_initiated: ['payment_pending', 'payment_verified', 'cancelled'],
  payment_pending: ['payment_verified', 'cancelled'],
  payment_verified: ['fulfillment_processing', 'cancelled'],
  fulfillment_processing: ['ready_for_pickup', 'shipped', 'cancelled'],
  ready_for_pickup: ['completed', 'cancelled'],
  shipped: ['completed', 'cancelled'],
  completed: [], // Terminal state
  cancelled: [], // Terminal state
};

export interface OrderTransitionAudit {
  orderId: string;
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
  changedBy: string;
  timestamp: string;
  reason?: string;
}

export function validateOrderTransition(
  currentStatus: OrderStatus,
  targetStatus: OrderStatus
): { isValid: boolean; error?: string } {
  if (currentStatus === targetStatus) {
    return { isValid: true };
  }

  const allowedNext = VALID_ORDER_TRANSITIONS[currentStatus] || [];
  if (!allowedNext.includes(targetStatus)) {
    return {
      isValid: false,
      error: `Illegal Order State Transition: Cannot transition order from '${currentStatus}' to '${targetStatus}'. Allowed transitions: [${allowedNext.join(', ')}]`,
    };
  }

  return { isValid: true };
}

// --------------------------------------------------------------------
// 2. QUOTE (RFQ) STATE MACHINE
// --------------------------------------------------------------------
// Inquiry Submitted → Assigned to Agent → Draft Quote Issued →
// Customer Review → Quote Approved → Payment Processing → Fulfilled
// --------------------------------------------------------------------

export const VALID_QUOTE_TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  inquiry_submitted: ['assigned_to_agent', 'rejected'],
  assigned_to_agent: ['draft_quote_issued', 'rejected'],
  draft_quote_issued: ['customer_review', 'quote_approved', 'rejected'],
  customer_review: ['draft_quote_issued', 'quote_approved', 'rejected'],
  quote_approved: ['payment_processing', 'rejected'],
  payment_processing: ['fulfilled', 'rejected'],
  fulfilled: [], // Terminal state
  rejected: ['inquiry_submitted'], // Allow resubmission
};

export interface QuoteTransitionAudit {
  quoteId: string;
  fromStatus: QuoteStatus;
  toStatus: QuoteStatus;
  changedBy: string;
  timestamp: string;
  reason?: string;
  version?: number;
}

export function validateQuoteTransition(
  currentStatus: QuoteStatus,
  targetStatus: QuoteStatus
): { isValid: boolean; error?: string } {
  if (currentStatus === targetStatus) {
    return { isValid: true };
  }

  const allowedNext = VALID_QUOTE_TRANSITIONS[currentStatus] || [];
  if (!allowedNext.includes(targetStatus)) {
    return {
      isValid: false,
      error: `Illegal Quote State Transition: Cannot transition quote from '${currentStatus}' to '${targetStatus}'. Allowed transitions: [${allowedNext.join(', ')}]`,
    };
  }

  return { isValid: true };
}

// In-memory status audit ledgers (in cloud production these sync to database tables)
export const ORDER_AUDIT_LOGS: OrderTransitionAudit[] = [];
export const QUOTE_AUDIT_LOGS: QuoteTransitionAudit[] = [];

export function recordOrderTransition(
  orderId: string,
  fromStatus: OrderStatus,
  toStatus: OrderStatus,
  changedBy: string,
  reason?: string
): OrderTransitionAudit {
  const audit: OrderTransitionAudit = {
    orderId,
    fromStatus,
    toStatus,
    changedBy,
    timestamp: new Date().toISOString(),
    reason,
  };
  ORDER_AUDIT_LOGS.push(audit);
  return audit;
}

export function recordQuoteTransition(
  quoteId: string,
  fromStatus: QuoteStatus,
  toStatus: QuoteStatus,
  changedBy: string,
  reason?: string,
  version?: number
): QuoteTransitionAudit {
  const audit: QuoteTransitionAudit = {
    quoteId,
    fromStatus,
    toStatus,
    changedBy,
    timestamp: new Date().toISOString(),
    reason,
    version,
  };
  QUOTE_AUDIT_LOGS.push(audit);
  return audit;
}
