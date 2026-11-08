import { NextResponse } from 'next/server';
import { getLiveQuotes } from '@/lib/quotes-store';

export async function POST() {
  if (global.__amg_live_quotes) {
    global.__amg_live_quotes = [];
  }
  if ((global as any).__amg_chat_store) {
    (global as any).__amg_chat_store = {};
  }
  return NextResponse.json({
    success: true,
    message: 'All RFQ deals and inquiries have been cleared. Ready for fresh customer testing.',
  });
}
