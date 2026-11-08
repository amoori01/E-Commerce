import { NextRequest, NextResponse } from 'next/server';
import { findQuote, addQuoteMessage } from '@/lib/quotes-store';

// ====================================================================
// REAL-TIME NEGOTIATION & MESSAGING API (SRS 4.1 / 4.3)
// Live synchronized communication channel between procurement buyer
// and assigned lead sales engineering desk.
// ====================================================================

export interface ChatMessageRecord {
  id: string;
  quoteId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  message: string;
  createdAt: string;
}

declare global {
  var __amg_chat_store: Record<string, ChatMessageRecord[]> | undefined;
}

function getStore(): Record<string, ChatMessageRecord[]> {
  if (!global.__amg_chat_store) {
    global.__amg_chat_store = {};
  }
  return global.__amg_chat_store;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const quoteId = searchParams.get('quoteId');

  if (!quoteId) {
    return NextResponse.json({ success: true, count: 0, messages: [] });
  }

  const store = getStore();
  const quote = findQuote(quoteId);

  // Gather messages from all matching keys
  const keysToInspect = new Set<string>([quoteId]);
  if (quote) {
    if (quote.id) keysToInspect.add(quote.id);
    if (quote.quoteNumber) keysToInspect.add(quote.quoteNumber);
  }

  const messageMap = new Map<string, ChatMessageRecord>();

  // 1. Initial messages attached to quote object
  if (quote && quote.messages && Array.isArray(quote.messages)) {
    for (const m of quote.messages) {
      if (m && m.id) messageMap.set(m.id, m as ChatMessageRecord);
    }
  }

  // 2. Dynamic live messages from memory store
  for (const k of keysToInspect) {
    const list = store[k] || [];
    for (const m of list) {
      if (m && m.id) messageMap.set(m.id, m);
    }
  }

  const messages = Array.from(messageMap.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return NextResponse.json({
    success: true,
    quoteId,
    count: messages.length,
    messages,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { quoteId, senderId, senderName, senderRole, message } = body;

    if (!quoteId || !message?.trim()) {
      return NextResponse.json(
        { error: 'quoteId and non-empty message are required' },
        { status: 400 }
      );
    }

    const store = getStore();
    const quote = findQuote(quoteId);

    const newRecord: ChatMessageRecord = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      quoteId,
      senderId: senderId || 'user-anon',
      senderName: senderName || 'Procurement User',
      senderRole: senderRole || 'customer',
      message: message.trim(),
      createdAt: new Date().toISOString(),
    };

    // Save under the provided quoteId
    if (!store[quoteId]) store[quoteId] = [];
    store[quoteId].push(newRecord);

    // If quote exists, save under both id and quoteNumber for bidirectional resolution
    if (quote) {
      if (quote.id && !store[quote.id]) store[quote.id] = [];
      if (quote.id && quote.id !== quoteId) store[quote.id].push(newRecord);

      if (quote.quoteNumber && !store[quote.quoteNumber]) store[quote.quoteNumber] = [];
      if (quote.quoteNumber && quote.quoteNumber !== quoteId) store[quote.quoteNumber].push(newRecord);

      addQuoteMessage(quote.id, newRecord);
    }

    return NextResponse.json({
      success: true,
      data: newRecord,
      message: newRecord,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Chat error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
