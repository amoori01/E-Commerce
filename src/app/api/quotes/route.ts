import { NextRequest, NextResponse } from 'next/server';
import { CreateRfqQuoteDto, validateCreateRfqDto } from '@/dtos';
import { Quote } from '@/types';
import { getLiveQuotes, addLiveQuote, findQuote, addQuoteMessage, updateQuote } from '@/lib/quotes-store';

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

    // Store in global singleton memory
    addLiveQuote(newQuote);

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

  const chatStore = (global as any).__amg_chat_store || {};
  let quotes = getLiveQuotes().map((q) => {
    // Merge latest chat messages into quote
    const chatMsgs = [
      ...(chatStore[q.id] || []),
      ...(chatStore[q.quoteNumber] || []),
    ];
    if (chatMsgs.length > 0) {
      const existing = q.messages || [];
      const map = new Map<string, any>();
      existing.forEach((m) => map.set(m.id, m));
      chatMsgs.forEach((m) => map.set(m.id, m));
      const merged = Array.from(map.values()).sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      return { ...q, messages: merged };
    }
    return q;
  });

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

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { quoteId, action, counterOffer, updates } = body;

    if (!quoteId) {
      return NextResponse.json({ error: 'quoteId is required' }, { status: 400 });
    }

    const quote = findQuote(quoteId);
    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    if (action === 'propose_counter_offer') {
      if (!counterOffer || !counterOffer.targetPriceEtb) {
        return NextResponse.json({ error: 'Valid counterOffer payload required' }, { status: 400 });
      }

      quote.pendingCounterOffer = {
        ...counterOffer,
        status: 'pending',
        requestedAt: new Date().toISOString(),
      };

      // Add audit/negotiation chat message
      const chatMsg = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        quoteId: quote.id,
        senderId: counterOffer.requestedBy || 'customer',
        senderName: counterOffer.requestedBy || 'Procurement Buyer',
        senderRole: 'customer' as const,
        message: `💼 [PRICE NEGOTIATION COUNTER-OFFER]: Buyer requested a ${counterOffer.discountPercent}% price reduction from ETB ${counterOffer.originalPriceEtb.toLocaleString()} down to ETB ${counterOffer.targetPriceEtb.toLocaleString()} (Target savings: ETB ${counterOffer.savingsEtb.toLocaleString()}). Commercial reason: "${counterOffer.reason}".`,
        createdAt: new Date().toISOString(),
      };

      addQuoteMessage(quote.id, chatMsg);
      const chatStore = (global as any).__amg_chat_store || {};
      if (!chatStore[quote.id]) chatStore[quote.id] = [];
      chatStore[quote.id].push(chatMsg);
      if (quote.quoteNumber) {
        if (!chatStore[quote.quoteNumber]) chatStore[quote.quoteNumber] = [];
        chatStore[quote.quoteNumber].push(chatMsg);
      }
      (global as any).__amg_chat_store = chatStore;

      return NextResponse.json({
        success: true,
        quote,
        message: 'Counter-offer registered and sales engineering desk notified.',
      });
    }

    if (action === 'accept_counter_offer') {
      const co = quote.pendingCounterOffer;
      if (!co) {
        return NextResponse.json({ error: 'No pending counter offer on quote' }, { status: 400 });
      }

      const nextVersion = (quote.currentVersion || 1) + 1;
      const acceptedPrice = co.targetPriceEtb;
      const agentName = body.salesAgentName || 'Assigned Sales Engineer';

      quote.finalQuotedTotalEtb = acceptedPrice;
      quote.currentVersion = nextVersion;
      quote.status = 'draft_quote_issued';
      quote.pendingCounterOffer = {
        ...co,
        status: 'accepted',
      };

      const newRevision = {
        version: nextVersion,
        timestamp: new Date().toISOString(),
        quotedTotalEtb: acceptedPrice,
        validUntil: quote.quoteValidUntil || '2026-11-30',
        notes: `Accepted Buyer Price Negotiation: -${co.discountPercent}% requested discount approved (Savings: ETB ${co.savingsEtb.toLocaleString()}).`,
        status: 'draft' as const,
        changedBy: `${agentName} (Sales Engineer)`,
      };
      quote.revisions = [...(quote.revisions || []), newRevision];

      // Add chat confirmation
      const chatMsg = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        quoteId: quote.id,
        senderId: 'sales-agent',
        senderName: agentName,
        senderRole: 'sales_agent' as const,
        message: `✅ [NEGOTIATION ACCEPTED]: Sales engineering desk has accepted your requested ${co.discountPercent}% price reduction! Revision v${nextVersion} is issued at ETB ${acceptedPrice.toLocaleString()}. Official Bank Proforma Invoice regenerated and ready for your authorization.`,
        createdAt: new Date().toISOString(),
      };

      addQuoteMessage(quote.id, chatMsg);
      const chatStore = (global as any).__amg_chat_store || {};
      if (!chatStore[quote.id]) chatStore[quote.id] = [];
      chatStore[quote.id].push(chatMsg);
      if (quote.quoteNumber) {
        if (!chatStore[quote.quoteNumber]) chatStore[quote.quoteNumber] = [];
        chatStore[quote.quoteNumber].push(chatMsg);
      }
      (global as any).__amg_chat_store = chatStore;

      return NextResponse.json({
        success: true,
        quote,
        message: 'Counter-offer accepted and Revision v' + nextVersion + ' issued.',
      });
    }

    if (updates) {
      const updated = updateQuote(quoteId, updates);
      return NextResponse.json({ success: true, quote: updated });
    }

    return NextResponse.json({ error: 'Unrecognized action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
