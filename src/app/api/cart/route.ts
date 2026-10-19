import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-guard';
import { CartItem } from '@/types';

// ====================================================================
// SERVER-SIDE PERSISTED CART API (R6.3)
// Synchronizes shopping cart state in real-time between Web & Mobile.
// ====================================================================

// In-memory cart store per user ID (in cloud production backed by PostgreSQL / Supabase)
const SERVER_CART_STORE = new Map<string, CartItem[]>();

export async function GET(req: NextRequest) {
  try {
    const auth = authenticateRequest(req);
    const { searchParams } = new URL(req.url);
    const userId = auth.user?.sub || searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User identification required' }, { status: 400 });
    }

    const items = SERVER_CART_STORE.get(userId) || [];

    return NextResponse.json({
      success: true,
      userId,
      items,
      count: items.reduce((sum, i) => sum + i.quantity, 0),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Cart retrieval error';
    return NextResponse.json({ error: 'Failed to retrieve server cart', details: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = authenticateRequest(req);
    const body = await req.json();
    const userId = auth.user?.sub || body.userId;

    if (!userId) {
      return NextResponse.json({ error: 'User identification required' }, { status: 400 });
    }

    const items: CartItem[] = Array.isArray(body.items) ? body.items : [];
    SERVER_CART_STORE.set(userId, items);

    return NextResponse.json({
      success: true,
      userId,
      items,
      count: items.reduce((sum, i) => sum + i.quantity, 0),
      syncedAt: new Date().toISOString(),
      message: 'Cart synchronized across web and mobile sessions.',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Cart sync error';
    return NextResponse.json({ error: 'Failed to sync cart', details: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = authenticateRequest(req);
    const { searchParams } = new URL(req.url);
    const userId = auth.user?.sub || searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User identification required' }, { status: 400 });
    }

    SERVER_CART_STORE.delete(userId);

    return NextResponse.json({
      success: true,
      userId,
      items: [],
      message: 'Cart cleared from server persistence.',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Cart clear error';
    return NextResponse.json({ error: 'Failed to clear cart', details: msg }, { status: 500 });
  }
}
