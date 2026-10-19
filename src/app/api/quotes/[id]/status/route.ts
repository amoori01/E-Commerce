import { NextRequest, NextResponse } from 'next/server';
import { validateQuoteTransition, recordQuoteTransition } from '@/lib/state-machine';
import { INITIAL_QUOTES } from '@/lib/constants';
import { QuoteStatus } from '@/types';
import { authenticateRequest, enforceAbac } from '@/lib/auth-guard';

// ====================================================================
// QUOTE STATE MACHINE TRANSITION ENDPOINT
// PATCH /api/quotes/[id]/status
// Validates transitions and logs revision history.
// ====================================================================

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = authenticateRequest(req);

    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { targetStatus, reason, quotedTotalEtb, validUntil } = body as {
      targetStatus: QuoteStatus;
      reason?: string;
      quotedTotalEtb?: number;
      validUntil?: string;
    };

    if (!targetStatus) {
      return NextResponse.json({ error: 'targetStatus is required' }, { status: 400 });
    }

    const quote = INITIAL_QUOTES.find((q) => q.id === id || q.quoteNumber === id);
    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    // ABAC Check
    const abac = enforceAbac(auth.user, {
      customerId: quote.customerId,
      subsidiaryId: quote.subsidiaryId,
      assignedAgentId: quote.assignedAgentId,
    }, 'write');

    if (!abac.allowed) {
      return NextResponse.json({ error: abac.reason }, { status: 403 });
    }

    // State machine check
    const validation = validateQuoteTransition(quote.status, targetStatus);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'State machine transition rejected', details: validation.error },
        { status: 400 }
      );
    }

    const previousStatus = quote.status;
    quote.status = targetStatus;

    if (quotedTotalEtb !== undefined) {
      quote.finalQuotedTotalEtb = quotedTotalEtb;
    }
    if (validUntil) {
      quote.quoteValidUntil = validUntil;
    }

    // Increment revision version if draft is issued or revised
    if (targetStatus === 'draft_quote_issued') {
      quote.currentVersion = (quote.currentVersion || 1) + 1;
      quote.revisions.unshift({
        version: quote.currentVersion,
        timestamp: new Date().toISOString(),
        quotedTotalEtb: quotedTotalEtb || quote.finalQuotedTotalEtb || 0,
        validUntil: validUntil || quote.quoteValidUntil || '14 Days from issuance',
        notes: reason || 'Draft quotation revised by sales engineer.',
        status: 'draft',
        changedBy: auth.user.fullName,
      });
    }

    // Record audit trail
    const auditRecord = recordQuoteTransition(
      quote.id,
      previousStatus,
      targetStatus,
      auth.user.email,
      reason,
      quote.currentVersion
    );

    return NextResponse.json({
      success: true,
      quoteId: quote.id,
      quoteNumber: quote.quoteNumber,
      previousStatus,
      newStatus: targetStatus,
      currentVersion: quote.currentVersion,
      auditRecord,
      message: `Quote transitioned from '${previousStatus}' to '${targetStatus}'.`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Transition error';
    return NextResponse.json({ error: 'Failed to transition quote status', details: msg }, { status: 500 });
  }
}
