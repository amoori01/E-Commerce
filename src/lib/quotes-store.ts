import { INITIAL_QUOTES } from './constants';
import { Quote } from '@/types';

// Global singleton preserving quotes across API routes in Node server lifecycle
declare global {
  var __amg_live_quotes: Quote[] | undefined;
}

export function getLiveQuotes(): Quote[] {
  if (!global.__amg_live_quotes) {
    global.__amg_live_quotes = [...INITIAL_QUOTES];
  }
  return global.__amg_live_quotes;
}

export function addLiveQuote(quote: Quote): void {
  const quotes = getLiveQuotes();
  const existingIdx = quotes.findIndex((q) => q.id === quote.id || q.quoteNumber === quote.quoteNumber);
  if (existingIdx >= 0) {
    quotes[existingIdx] = { ...quotes[existingIdx], ...quote };
  } else {
    quotes.unshift(quote);
  }
}

export function findQuote(identifier: string): Quote | undefined {
  const quotes = getLiveQuotes();
  return quotes.find((q) => q.id === identifier || q.quoteNumber === identifier);
}

export function updateQuote(identifier: string, updates: Partial<Quote>): Quote | null {
  const quotes = getLiveQuotes();
  const idx = quotes.findIndex((q) => q.id === identifier || q.quoteNumber === identifier);
  if (idx >= 0) {
    quotes[idx] = { ...quotes[idx], ...updates };
    return quotes[idx];
  }
  return null;
}
