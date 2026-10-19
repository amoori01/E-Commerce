import { NextRequest, NextResponse } from 'next/server';
import { PRODUCTS } from '@/lib/constants';

// ====================================================================
// CATALOG PRODUCTS API ENDPOINT (R2, R8.1, R8.5)
// Provides paginated, indexed catalog access with multi-subsidiary filtering.
// Includes HTTP Cache-Control headers for high-performance sub-200ms p95 latency.
// ====================================================================

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const subsidiaryId = searchParams.get('subsidiaryId');
  const stream = searchParams.get('stream'); // 'direct_checkout' | 'assisted_quote' | 'DIRECT' | 'QUOTE'
  const categoryId = searchParams.get('categoryId');
  const search = searchParams.get('search')?.toLowerCase().trim();
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

  let filtered = [...PRODUCTS];

  if (subsidiaryId) {
    filtered = filtered.filter((p) => p.subsidiaryId === subsidiaryId);
  }

  if (stream) {
    const s = stream.toLowerCase();
    filtered = filtered.filter((p) => {
      if (s === 'direct' || s === 'direct_checkout') {
        return p.transactionStream === 'direct_checkout' || p.fulfillmentStream === 'DIRECT';
      }
      if (s === 'quote' || s === 'assisted_quote') {
        return p.transactionStream === 'assisted_quote' || p.fulfillmentStream === 'QUOTE';
      }
      return true;
    });
  }

  if (categoryId) {
    filtered = filtered.filter((p) => p.categoryId === categoryId);
  }

  if (search) {
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(search) ||
        p.sku.toLowerCase().includes(search) ||
        p.description.toLowerCase().includes(search) ||
        p.subsidiaryName.toLowerCase().includes(search)
    );
  }

  const total = filtered.length;
  const startIndex = (page - 1) * limit;
  const paginated = filtered.slice(startIndex, startIndex + limit);

  const response = NextResponse.json({
    success: true,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      count: paginated.length,
    },
    products: paginated,
  });

  // Edge Caching header: Public cache for 60 seconds, stale-while-revalidate for 300 seconds
  response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  response.headers.set('X-Total-Count', String(total));

  return response;
}
