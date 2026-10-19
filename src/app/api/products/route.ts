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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      sku,
      subsidiaryId,
      categoryId,
      description,
      transactionStream = 'direct_checkout',
      unitPriceEtb = 0,
      unitMeasurement = 'pcs',
      moq = 1,
      technicalSpecs = {},
      datasheetUrl,
    } = body;

    if (!name || !sku || !subsidiaryId) {
      return NextResponse.json(
        { error: 'Product name, SKU, and subsidiaryId are required' },
        { status: 400 }
      );
    }

    // Check duplicate SKU
    if (PRODUCTS.some((p) => p.sku.toLowerCase() === sku.toLowerCase().trim())) {
      return NextResponse.json(
        { error: `Product with SKU "${sku}" already exists` },
        { status: 409 }
      );
    }

    const { SUBSIDIARIES, CATEGORIES } = await import('@/lib/constants');
    const sub = SUBSIDIARIES.find((s) => s.id === subsidiaryId) || SUBSIDIARIES[0];
    const cat = CATEGORIES.find((c) => c.id === categoryId) || CATEGORIES[0];
    const isDirect = transactionStream === 'direct_checkout' || transactionStream === 'DIRECT';

    const newProduct = {
      id: crypto.randomUUID(),
      subsidiaryId: sub.id,
      subsidiaryCode: sub.code,
      subsidiaryName: sub.name,
      categoryId: cat?.id || 'c1111111-1111-1111-1111-111111111111',
      categoryName: cat?.name || 'General Industrial',
      sku: sku.trim().toUpperCase(),
      name: name.trim(),
      slug: name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      description: description?.trim() || `${sub.name} industrial supply.`,
      transactionStream: isDirect ? ('direct_checkout' as const) : ('assisted_quote' as const),
      fulfillmentStream: isDirect ? ('DIRECT' as const) : ('QUOTE' as const),
      unitPriceEtb: isDirect ? Number(unitPriceEtb) || 0 : 0,
      currency: 'ETB',
      unitMeasurement: unitMeasurement || 'pcs',
      moq: Math.max(1, Number(moq) || 1),
      technicalSpecs: typeof technicalSpecs === 'object' ? technicalSpecs : {},
      datasheetUrl: datasheetUrl || undefined,
      isFeatured: false,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to in-memory store
    PRODUCTS.unshift(newProduct as any);

    // Persist to Supabase if configured
    try {
      const { createAdminClient } = await import('@/lib/supabase/admin');
      const supabase = createAdminClient();
      await supabase.from('products').insert([
        {
          id: newProduct.id,
          subsidiary_id: newProduct.subsidiaryId,
          category_id: newProduct.categoryId,
          sku: newProduct.sku,
          name: newProduct.name,
          slug: newProduct.slug,
          description: newProduct.description,
          transaction_stream: newProduct.transactionStream,
          unit_price_etb: newProduct.unitPriceEtb,
          currency: 'ETB',
          unit_measurement: newProduct.unitMeasurement,
          moq: newProduct.moq,
          technical_specs: newProduct.technicalSpecs,
          is_active: true,
        },
      ]);
    } catch (dbErr) {
      console.warn('Supabase DB persistence skipped or error:', dbErr);
    }

    return NextResponse.json(
      {
        success: true,
        message: `Product "${newProduct.name}" created successfully.`,
        product: newProduct,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create product';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
