import { NextRequest, NextResponse } from 'next/server';

// ====================================================================
// REAL-TIME NEGOTIATION & MESSAGING API (SRS 4.1 / 4.3)
// Live WebSocket / SSE / Polling fallback communication channel
// between procurement buyer and assigned sales engineering agent.
// ====================================================================

interface ChatMessageRecord {
  id: string;
  quoteId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  message: string;
  createdAt: string;
}

// In-memory chat storage by quoteId
const CHAT_STORE: Record<string, ChatMessageRecord[]> = {
  'q1': [
    {
      id: 'msg-seed-1',
      quoteId: 'q1',
      senderId: 'e1111111-1111-1111-1111-111111111111',
      senderName: 'Alemayehu Tadesse',
      senderRole: 'customer',
      message: 'Can the 24m structural rafters be hot-dip galvanized rather than standard red oxide primer?',
      createdAt: '2026-10-12T10:15:00Z',
    },
    {
      id: 'msg-seed-2',
      quoteId: 'q1',
      senderId: 'e2222222-2222-2222-2222-222222222222',
      senderName: 'Eng. Biruk Kebede',
      senderRole: 'sales_agent',
      message: 'Yes, we can apply 85-micron hot-dip galvanizing per ASTM A123. I updated the coating tariff in Revision 2.',
      createdAt: '2026-10-12T10:45:00Z',
    },
  ],
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const quoteId = searchParams.get('quoteId') || 'q1';

  const messages = CHAT_STORE[quoteId] || [];

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

    const newRecord: ChatMessageRecord = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      quoteId,
      senderId: senderId || 'user-anon',
      senderName: senderName || 'Procurement User',
      senderRole: senderRole || 'customer',
      message: message.trim(),
      createdAt: new Date().toISOString(),
    };

    if (!CHAT_STORE[quoteId]) {
      CHAT_STORE[quoteId] = [];
    }
    CHAT_STORE[quoteId].push(newRecord);

    return NextResponse.json({
      success: true,
      data: newRecord,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Chat error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
