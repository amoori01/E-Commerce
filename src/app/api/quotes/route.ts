import { NextRequest, NextResponse } from 'next/server';
import { CreateRfqQuoteDto, validateCreateRfqDto } from '@/dtos';
import { INITIAL_QUOTES } from '@/lib/constants';
import { Quote } from '@/types';

// ====================================================================
// STREAM B: AGENT-ASSISTED CUSTOM QUOTATION (RFQ) API ENDPOINT
// Live memory store synchronized with client storage
// ====================================================================

// Global memory cache preserving live RFQ submissions across API requests
const LIVE_QUOTES: Quote[] = [...INITIAL_QUOTES];

export async function POST(req: NextRequest) {
  try {
    const body: CreateRfqQuoteDto & { customerName?: string; customerCompany?: string; subsidiaryName?: string } = await req.json();

    // 1. DTO Validation
    const validation = validateCreateRfqDto(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'RFQ validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    const quoteNumber = `RFQ-2026-AMG-00${Math.floor(100 + Math.random() * 900)}`;

    const newQuote: Quote = {
      id: `quote-${Date.now()}`,
      quoteNumber,
      customerId: body.customerId,
      customerName: body.customerName || 'Procurement Representative',
      customerCompany: body.customerCompany || 'Commercial Client',
      subsidiaryId: body.subsidiaryId,
      subsidiaryName: body.subsidiaryName || 'AMG Industrial Division',
      status: 'inquiry_submitted',
      currentVersion: 1,
      revisions: [
        {
          version: 1,
          timestamp: new Date().toISOString(),
          quotedTotalEtb: 0,
          validUntil: 'Pending Formulation',
          notes: 'Initial inquiry submission with technical requirements payload.',
          status: 'draft',
          changedBy: body.customerName || 'Procurement Officer (Client)',
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
          senderName: body.customerName || 'Client Buyer',
          senderRole: 'customer',
          message: 'Engineering specification inquiry submitted for technical review.',
          createdAt: new Date().toISOString(),
        },
      ],
    };

    // Store in global server memory
    LIVE_QUOTES.unshift(newQuote);

    return NextResponse.json({
      success: true,
      ok: true,
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
  const subsidiaryId = searchParams.get('subsidiaryId');

  let quotes = [...LIVE_QUOTES];

  if (customerId) {
    quotes = quotes.filter((q) => q.customerId === customerId);
  }
  if (agentId) {
    quotes = quotes.filter((q) => q.assignedAgentId === agentId);
  }
  if (subsidiaryId) {
    quotes = quotes.filter((q) => q.subsidiaryId === subsidiaryId);
  }

  return NextResponse.json({
    success: true,
    count: quotes.length,
    quotes,
  });
}
