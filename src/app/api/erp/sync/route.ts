import { NextRequest, NextResponse } from 'next/server';
import { ErpSyncMessage } from '@/types';

// ====================================================================
// ENTERPRISE SALES MANAGEMENT SYSTEM (SMS) BI-DIRECTIONAL SYNC (SRS 4.5)
// Message Broker with Exponential Backoff & Dead-Letter Queue (DLQ)
// ====================================================================

// In-memory queue state simulating Redis / RabbitMQ
const ERP_MESSAGE_QUEUE: ErpSyncMessage[] = [
  {
    id: 'msg-sync-101',
    event: 'ORDER_SYNC',
    entityId: 'AMG-ORD-2026-1049',
    payload: {
      orderNumber: 'AMG-ORD-2026-1049',
      branchId: 'a1111111-1111-1111-1111-111111111111',
      totalEtb: 145000,
      vat15Etb: 21750,
      timestamp: new Date().toISOString(),
    },
    status: 'PROCESSED',
    retryCount: 0,
    maxRetries: 3,
    lastAttemptAt: new Date().toISOString(),
  },
  {
    id: 'msg-sync-102',
    event: 'INVENTORY_RECONCILE',
    entityId: 'AMG-STEEL-RB-16MM',
    payload: {
      sku: 'AMG-STEEL-RB-16MM',
      branchId: 'a2222222-2222-2222-2222-222222222222',
      deltaQty: -120,
      physicalAuditLedgerId: 'AUD-ADAMA-99',
    },
    status: 'PROCESSED',
    retryCount: 1,
    maxRetries: 3,
    lastAttemptAt: new Date().toISOString(),
  },
  {
    id: 'msg-sync-103',
    event: 'ORDER_SYNC',
    entityId: 'AMG-ORD-2026-FAIL01',
    payload: {
      orderNumber: 'AMG-ORD-2026-FAIL01',
      branchId: 'a4444444-4444-4444-4444-444444444444',
      totalEtb: 620000,
    },
    status: 'DEAD_LETTER',
    retryCount: 3,
    maxRetries: 3,
    lastAttemptAt: new Date().toISOString(),
    errorMessage: 'ERP Endpoint Connection Timeout (3 attempts exhausted)',
  },
];

export async function GET() {
  const pendingCount = ERP_MESSAGE_QUEUE.filter((m) => m.status === 'PENDING').length;
  const deadLetterCount = ERP_MESSAGE_QUEUE.filter((m) => m.status === 'DEAD_LETTER').length;
  const processedCount = ERP_MESSAGE_QUEUE.filter((m) => m.status === 'PROCESSED').length;

  return NextResponse.json({
    success: true,
    telemetry: {
      totalQueued: ERP_MESSAGE_QUEUE.length,
      pendingCount,
      deadLetterCount,
      processedCount,
      broker: 'RabbitMQ / Redis Mirroring (Simulated AMQP)',
    },
    messages: ERP_MESSAGE_QUEUE,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, messageId, event, entityId, payload } = body;

    // 1. DISPATCH NEW EVENT TO QUEUE
    if (action === 'enqueue') {
      const newMsg: ErpSyncMessage = {
        id: `msg-sync-${Date.now()}`,
        event: event || 'ORDER_SYNC',
        entityId: entityId || 'unknown',
        payload: payload || {},
        status: 'PENDING',
        retryCount: 0,
        maxRetries: 3,
      };

      // Process immediately (simulated worker)
      const simulatedSuccess = Math.random() > 0.1; // 90% success rate
      if (simulatedSuccess) {
        newMsg.status = 'PROCESSED';
        newMsg.lastAttemptAt = new Date().toISOString();
      } else {
        newMsg.status = 'FAILED_RETRYING';
        newMsg.retryCount = 1;
        newMsg.errorMessage = 'Network socket reset by peer';
      }

      ERP_MESSAGE_QUEUE.unshift(newMsg);

      return NextResponse.json({
        success: true,
        message: 'Dispatched to ERP sync broker queue.',
        syncMessage: newMsg,
      });
    }

    // 2. RETRY DEAD-LETTER MESSAGE
    if (action === 'retry_dlq') {
      const msg = ERP_MESSAGE_QUEUE.find((m) => m.id === messageId);
      if (!msg) {
        return NextResponse.json({ error: 'Message not found' }, { status: 404 });
      }

      // Calculate exponential backoff simulation
      const backoffDelayMs = 1000 * Math.pow(2, msg.retryCount);
      msg.status = 'PROCESSED';
      msg.errorMessage = undefined;
      msg.lastAttemptAt = new Date().toISOString();

      return NextResponse.json({
        success: true,
        message: `Dead-letter message ${messageId} reconciled and committed to ERP ledger after ${backoffDelayMs}ms exponential backoff schedule.`,
        syncMessage: msg,
      });
    }

    // 3. RETRY ALL DLQ MESSAGES (SUPER ADMIN RECONCILIATION)
    if (action === 'retry_all_dlq') {
      let recovered = 0;
      for (const m of ERP_MESSAGE_QUEUE) {
        if (m.status === 'DEAD_LETTER') {
          m.status = 'PROCESSED';
          m.errorMessage = undefined;
          m.lastAttemptAt = new Date().toISOString();
          recovered += 1;
        }
      }

      return NextResponse.json({
        success: true,
        message: `Reconciled and flushed ${recovered} dead-letter messages to master ERP ledger.`,
        recoveredCount: recovered,
      });
    }

    return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'ERP sync error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
