import { NextResponse } from 'next/server';
import { clearServerOrders } from '@/lib/server-orders';

export async function POST() {
  if (global.__amg_live_quotes) {
    global.__amg_live_quotes = [];
  }
  if ((global as any).__amg_chat_store) {
    (global as any).__amg_chat_store = {};
  }
  clearServerOrders();
  return NextResponse.json({
    success: true,
    message: 'All RFQ deals, inquiries, chat messages, and converted orders have been cleared. Ready for fresh customer testing.',
  });
}
