import { NextRequest, NextResponse } from 'next/server';
import { CreateRfqQuoteDto, validateCreateRfqDto } from '@/dtos';
import { createAdminClient } from '@/lib/supabase/admin';
import { INITIAL_QUOTES } from '@/lib/constants';

// ====================================================================
// STREAM B: AGENT-ASSISTED CUSTOM QUOTATION (RFQ) API ENDPOINT
// ====================================================================

export async function POST(req: NextRequest) {
  try {
    const body: CreateRfqQuoteDto = await req.json();

    // 1. DTO Validation
    const validation = validateCreateRfqDto(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'RFQ validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    const quoteNumber = `RFQ-2026-AMG-00${Math.floor(100 + Math.random() * 900)}`;

    const newQuote = {
      id: `quote-${Date.now()}`,
      quoteNumber,
      customerId: body.customerId,
      customerName: 'Procurement Representative',
      subsidiaryId: body.subsidiaryId,
      subsidiaryName: 'AMG Industrial Division',
      status: 'inquiry_submitted' as const,
      currentVersion: 1,
      revisions: [
        {
          version: 1,
          timestamp: new Date().toISOString(),
          quotedTotalEtb: 0,
          validUntil: 'Pending Formulation',
          notes: 'Initial inquiry submission with technical requirements payload.',
          status: 'draft' as const,
          changedBy: 'Procurement Officer (Client)',
        },
      ],
      projectTitle: body.projectTitle,
      deliveryDestination: body.deliveryDestination,
      targetDeliveryDate: body.targetDeliveryDate,
      customerRequirements: body.customerRequirements,
      createdAt: new Date().toISOString(),
      items: body.items.map((i, idx) => ({
        id: `qi-new-${idx + 1}`,
        productId: i.productId,
        customProductName: i.customProductName,
        requestedSpecs: i.requestedSpecs || {},
        quantity: i.quantity,
        unitMeasurement: i.unitMeasurement,
      })),
      messages: [
        {
          id: `msg-${Date.now()}`,
          quoteId: `quote-${Date.now()}`,
          senderId: body.customerId,
          senderName: 'Client Buyer',
          senderRole: 'customer' as const,
          message: 'Engineering specification inquiry submitted for technical review.',
          createdAt: new Date().toISOString(),
        },
      ],
    };

    // In production with live Supabase credentials:
    // const supabase = createAdminClient();
    // await supabase.from('quotes').insert({ ... });

    return NextResponse.json({
      success: true,
      quote: newQuote,
      message: 'RFQ inquiry successfully registered and dispatched to dedicated sales engineering desk.',
    });
  } catch (err: any) {
    console.error('[QUOTES API ERROR]', err);
    return NextResponse.json(
      { error: 'Failed to submit RFQ', details: err.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get('customerId');
  const agentId = searchParams.get('agentId');

  let quotes = [...INITIAL_QUOTES];

  if (customerId) {
    quotes = quotes.filter((q) => q.customerId === customerId);
  }
  if (agentId) {
    quotes = quotes.filter((q) => q.assignedAgentId === agentId);
  }

  return NextResponse.json({
    success: true,
    count: quotes.length,
    quotes,
  });
}
