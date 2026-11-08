'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { INITIAL_QUOTES } from '@/lib/constants';
import { Quote } from '@/types';
import { ProformaInvoiceModal } from '@/components/modals/ProformaInvoiceModal';
import {
  FileText,
  Send,
  MessageSquare,
  CheckCircle2,
  Clock,
  Calculator,
  User,
  MapPin,
  Calendar,
  Building2,
  Check,
  Cpu,
  Layers,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  History,
  Printer,
  Search,
  RotateCcw
} from 'lucide-react';

export default function SalesAgentPage() {
  const { currentUser, activeRole, switchRole } = useAuth();
  const [quotesList, setQuotesList] = useState<Quote[]>(INITIAL_QUOTES);
  const [filterTab, setFilterTab] = useState<'all' | 'assigned' | 'inquiries'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Live quotes synchronization from server API and client storage
  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        let combined: Quote[] = [...INITIAL_QUOTES];

        // 1. Fetch from server API
        try {
          const res = await fetch('/api/quotes');
          if (res.ok) {
            const data = await res.json();
            if (data.quotes && Array.isArray(data.quotes)) {
              for (const q of data.quotes) {
                const idx = combined.findIndex((c) => c.id === q.id || c.quoteNumber === q.quoteNumber);
                if (idx >= 0) {
                  combined[idx] = { ...combined[idx], ...q };
                } else {
                  combined.unshift(q);
                }
              }
            }
          }
        } catch (e) {}

        // 2. Fetch from client localStorage
        if (typeof window !== 'undefined') {
          // Auto-purge stale demo data on first load of clean testing environment
          if (localStorage.getItem('amg_data_version') !== 'v2') {
            localStorage.removeItem('amg_live_quotes');
            localStorage.removeItem('amg_live_orders');
            localStorage.setItem('amg_data_version', 'v2');
          }

          const local = localStorage.getItem('amg_live_quotes');
          if (local) {
            try {
              const parsed = JSON.parse(local);
              if (Array.isArray(parsed)) {
                for (const p of parsed) {
                  const idx = combined.findIndex((c) => c.id === p.id || c.quoteNumber === p.quoteNumber);
                  if (idx >= 0) {
                    combined[idx] = { ...combined[idx], ...p };
                  } else {
                    combined.unshift(p);
                  }
                }
              }
            } catch (e) {}
          }
        }

        setQuotesList(combined);
      } catch (e) {}
    };

    fetchQuotes();
    const handleUpdate = () => fetchQuotes();
    window.addEventListener('amg_quotes_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('amg_quotes_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Filter deals for sales engineer workspace:
  // Shows assigned quotes and all unassigned client inquiries across subsidiaries
  const eligibleQuotes = quotesList.filter((q) => {
    if (currentUser.role === 'super_admin' || currentUser.role === 'sales_agent') return true;
    if (q.assignedAgentId === currentUser.id) return true;
    if (!q.assignedAgentId) return true;
    return true; // allow full visibility in agent workspace simulation
  });

  const myAgentQuotes = eligibleQuotes.filter((q) => {
    if (filterTab === 'assigned' && q.assignedAgentId !== currentUser.id) return false;
    if (filterTab === 'inquiries' && !(q.status === 'inquiry_submitted' || !q.assignedAgentId)) return false;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const matchNumber = q.quoteNumber.toLowerCase().includes(query);
      const matchCustomer = (q.customerName || '').toLowerCase().includes(query);
      const matchCompany = (q.customerCompany || '').toLowerCase().includes(query);
      const matchTitle = (q.projectTitle || '').toLowerCase().includes(query);
      return matchNumber || matchCustomer || matchCompany || matchTitle;
    }
    return true;
  });

  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(
    myAgentQuotes[0] || null
  );

  useEffect(() => {
    if (myAgentQuotes.length > 0) {
      if (!selectedQuote || !myAgentQuotes.some((q) => q.id === selectedQuote?.id)) {
        setSelectedQuote(myAgentQuotes[0]);
        handleSelectQuote(myAgentQuotes[0]);
      }
    } else {
      setSelectedQuote(null);
    }
  }, [currentUser.id, filterTab, searchQuery, quotesList.length]);

  // Pricing Matrix Parameters
  const [rawMaterialCost, setRawMaterialCost] = useState<number>(6500000);
  const [fabricationHours, setFabricationHours] = useState<number>(180);
  const [hourlyMachineRate, setHourlyMachineRate] = useState<number>(3500);
  const [coatingTariff, setCoatingTariff] = useState<number>(450000);
  const [freightTariff, setFreightTariff] = useState<number>(350000);
  const [marginPercent, setMarginPercent] = useState<number>(10.0);

  const [validUntil, setValidUntil] = useState<string>('2026-11-30');
  const [agentNotes, setAgentNotes] = useState<string>('');
  const [chatMessage, setChatMessage] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  // Proforma Invoice Modal State
  const [isProformaOpen, setIsProformaOpen] = useState(false);
  const [activeProformaVersion, setActiveProformaVersion] = useState<number | null>(null);

  const isSalesAgent = activeRole === 'sales_agent';

  // Order Conversion & Notification State
  const [isConvertingOrder, setIsConvertingOrder] = useState(false);
  const [convertedOrderSuccess, setConvertedOrderSuccess] = useState<string | null>(null);

  const handleResetAllQuotes = async () => {
    if (!confirm('Clear all demo RFQ deals and inquiries to test fresh from customer?')) return;
    try {
      await fetch('/api/quotes/reset', { method: 'POST' });
    } catch (e) {}
    if (typeof window !== 'undefined') {
      localStorage.removeItem('amg_live_quotes');
      window.dispatchEvent(new Event('amg_quotes_updated'));
    }
    setQuotesList([]);
    setSelectedQuote(null);
  };

  // Live Auto-Calculation of the Quoted Price from the Engineering Pricing Matrix
  const subtotalFabrication = fabricationHours * hourlyMachineRate;
  const baseProductionCost = rawMaterialCost + subtotalFabrication + coatingTariff + freightTariff;
  const calculatedQuotedTotal = Math.round(baseProductionCost * (1 + marginPercent / 100));

  const handleSelectQuote = (q: Quote) => {
    setSelectedQuote(q);
    setValidUntil(q.quoteValidUntil || '2026-10-31');
    setAgentNotes(q.agentQuotationNotes || '');
    setIsSaved(false);
    setConvertedOrderSuccess(null);

    // Adapt engineering cost model dynamically to quote baseline
    if (q.finalQuotedTotalEtb && q.finalQuotedTotalEtb > 0) {
      const total = q.finalQuotedTotalEtb;
      setRawMaterialCost(Math.round(total * 0.65));
      setFabricationHours(Math.max(40, Math.round((total * 0.15) / 3500)));
      setCoatingTariff(Math.round(total * 0.05));
      setFreightTariff(Math.round(total * 0.05));
      setMarginPercent(10.0);
    } else if (q.estimatedTotalEtb && q.estimatedTotalEtb > 0) {
      const total = q.estimatedTotalEtb;
      setRawMaterialCost(Math.round(total * 0.65));
      setFabricationHours(Math.max(40, Math.round((total * 0.15) / 3500)));
      setCoatingTariff(Math.round(total * 0.05));
      setFreightTariff(Math.round(total * 0.05));
      setMarginPercent(10.0);
    } else {
      setRawMaterialCost(6500000);
      setFabricationHours(180);
      setHourlyMachineRate(3500);
      setCoatingTariff(450000);
      setFreightTariff(350000);
      setMarginPercent(10.0);
    }
  };

  const handleConvertToOrder = async (quote: Quote) => {
    setIsConvertingOrder(true);
    setConvertedOrderSuccess(null);
    try {
      const res = await fetch('/api/quotes/convert-to-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'sales_agent',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          quoteId: quote.id,
          fulfillmentBranchId: (quote as any).fulfillmentBranchId || (quote as any).branchId || 'a1111111-1111-1111-1111-111111111111',
          deliveryType: 'branch_pickup',
          deliveryAddress: quote.deliveryDestination,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setConvertedOrderSuccess(
          `Contract approved! Converted to Order ${data.order?.orderNumber || ''} and dispatched to regional branch depot.`
        );
        const updatedQuote: Quote = {
          ...quote,
          status: 'payment_processing',
        };
        setSelectedQuote(updatedQuote);
        setQuotesList((prev) =>
          prev.map((item) => (item.id === quote.id ? updatedQuote : item))
        );
        window.dispatchEvent(new Event('amg_quotes_updated'));
      } else {
        alert(data.error || 'Failed to convert quote to order.');
      }
    } catch (e: any) {
      alert(`Conversion error: ${e.message}`);
    } finally {
      setIsConvertingOrder(false);
    }
  };

  const handleSaveQuoteMatrix = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuote) return;
    const nextVersion = (selectedQuote.currentVersion || 1) + 1;
    const formulaSummary = `Formula applied: [Raw Materials: ETB ${rawMaterialCost.toLocaleString()}] + [Machining: ${fabricationHours}hrs @ ETB ${hourlyMachineRate}/hr] + [Coating: ETB ${coatingTariff.toLocaleString()}] + [Freight: ETB ${freightTariff.toLocaleString()}] + [Target Margin: ${marginPercent}%].`;
    const newRevision = {
      version: nextVersion,
      timestamp: new Date().toISOString(),
      quotedTotalEtb: calculatedQuotedTotal,
      validUntil: validUntil,
      notes: agentNotes ? `${agentNotes} | ${formulaSummary}` : `Revision ${nextVersion}: ${formulaSummary}`,
      status: 'draft' as const,
      changedBy: `${currentUser.fullName} (Sales Engineer)`,
    };

    setQuotesList((prev) =>
      prev.map((q) =>
        q.id === selectedQuote.id
          ? {
              ...q,
              status: 'draft_quote_issued',
              currentVersion: nextVersion,
              finalQuotedTotalEtb: calculatedQuotedTotal,
              quoteValidUntil: validUntil,
              agentQuotationNotes: agentNotes,
              revisions: [...(q.revisions || []), newRevision],
            }
          : q
      )
    );

    setSelectedQuote((prev) =>
      !prev
        ? null
        : {
            ...prev,
            status: 'draft_quote_issued',
            currentVersion: nextVersion,
            finalQuotedTotalEtb: calculatedQuotedTotal,
            quoteValidUntil: validUntil,
            agentQuotationNotes: agentNotes,
            revisions: [...(prev.revisions || []), newRevision],
          }
    );

    try {
      const quoteIdentifier = selectedQuote.quoteNumber || selectedQuote.id;
      await fetch(`/api/quotes/${encodeURIComponent(quoteIdentifier)}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'sales_agent',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          targetStatus: 'draft_quote_issued',
          reason: `Engineering pricing matrix formulated: ${formulaSummary}`,
          quotedTotalEtb: calculatedQuotedTotal,
          validUntil: validUntil,
        }),
      });
    } catch (err) {
      console.warn('Quote state machine sync warning:', err);
    }

    if (typeof window !== 'undefined') {
      try {
        const local = JSON.parse(localStorage.getItem('amg_live_quotes') || '[]');
        const updated = local.map((q: any) =>
          q.id === selectedQuote.id || q.quoteNumber === selectedQuote.quoteNumber
            ? {
                ...q,
                status: 'draft_quote_issued',
                currentVersion: nextVersion,
                finalQuotedTotalEtb: calculatedQuotedTotal,
                quoteValidUntil: validUntil,
                agentQuotationNotes: agentNotes,
                revisions: [...(q.revisions || []), newRevision],
              }
            : q
        );
        localStorage.setItem('amg_live_quotes', JSON.stringify(updated));
        window.dispatchEvent(new Event('amg_quotes_updated'));
      } catch (e) {}
    }

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3500);
  };

  const handleClaimQuote = (q: Quote) => {
    const updatedQuote: Quote = {
      ...q,
      assignedAgentId: currentUser.id,
      assignedAgentName: currentUser.fullName,
      status: q.status === 'inquiry_submitted' ? 'assigned_to_agent' : q.status,
    };

    setQuotesList((prev) =>
      prev.map((item) => (item.id === q.id ? updatedQuote : item))
    );
    setSelectedQuote(updatedQuote);
    handleSelectQuote(updatedQuote);

    // Switch to assigned deals so the newly claimed deal remains actively visible and highlighted
    if (filterTab === 'inquiries') {
      setFilterTab('assigned');
    }

    // Call API to persist assignment
    fetch(`/api/quotes/${encodeURIComponent(q.quoteNumber || q.id)}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'sales_agent',
        'x-user-id': currentUser.id,
      },
      body: JSON.stringify({
        targetStatus: 'assigned_to_agent',
        reason: `Claimed by lead sales engineer ${currentUser.fullName} for cost matrix formulation.`,
      }),
    }).catch(() => {});

    if (typeof window !== 'undefined') {
      try {
        const local = JSON.parse(localStorage.getItem('amg_live_quotes') || '[]');
        const idx = local.findIndex((item: any) => item.id === q.id || item.quoteNumber === q.quoteNumber);
        if (idx >= 0) {
          local[idx] = { ...local[idx], ...updatedQuote };
        } else {
          local.unshift(updatedQuote);
        }
        localStorage.setItem('amg_live_quotes', JSON.stringify(local));
        window.dispatchEvent(new Event('amg_quotes_updated'));
      } catch (e) {}
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !selectedQuote) return;

    const outgoingText = chatMessage.trim();
    setChatMessage('');

    const newMsg = {
      id: `msg-${Date.now()}`,
      quoteId: selectedQuote.id,
      senderId: currentUser.id,
      senderName: currentUser.fullName,
      senderRole: currentUser.role,
      message: outgoingText,
      createdAt: new Date().toISOString(),
    };

    setSelectedQuote((prev) =>
      !prev
        ? null
        : {
            ...prev,
            messages: [...(prev.messages || []), newMsg],
          }
    );

    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteId: selectedQuote.id,
          senderId: currentUser.id,
          senderName: currentUser.fullName,
          senderRole: currentUser.role,
          message: outgoingText,
        }),
      });
    } catch (e) {
      console.error('Failed to sync chat message:', e);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0B0B0C] text-[#0B0B0C] dark:text-[#E4E4E7] transition-colors pb-20">
      {/* 1. EXECUTIVE THEME HERO BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <div className="bg-gradient-to-br from-[#FCFCFD] via-white to-[#F4F6F8] dark:from-[#0B0B0C] dark:via-[#0E0E10] dark:to-[#0B0B0C] text-slate-900 dark:text-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-[#1A1A1D] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.06)] dark:shadow-2xl relative overflow-hidden group hover:border-slate-300 dark:hover:border-[#C6F432]/30 transition-all duration-300">
          {/* Ambient Lime & Sunlit Emerald Glows */}
          <div className="absolute -top-32 -right-32 w-[28rem] h-[28rem] bg-gradient-to-bl from-[#C6F432]/30 via-emerald-300/20 to-transparent dark:from-[#C6F432]/10 dark:to-transparent rounded-full blur-3xl pointer-events-none group-hover:scale-105 transition-all duration-700" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-gradient-to-tr from-[#C6F432]/20 via-teal-200/15 to-transparent dark:from-[#C6F432]/5 dark:to-transparent rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 bg-white/90 dark:bg-[#141416] border border-slate-200/90 dark:border-[#2A2A2E] rounded-full text-xs font-medium text-slate-900 dark:text-[#E4E4E7] shadow-xs backdrop-blur-md">
                  <span className="w-2 h-2 rounded-full bg-[#16A34A] dark:bg-[#C6F432] inline-block shadow-[0_0_8px_rgba(22,163,74,0.6)] dark:shadow-[0_0_8px_#C6F432] animate-pulse" />
                  <span className="font-semibold tracking-wide">Tier 2: Technical Engineering &amp; Pricing Desk</span>
                  <span className="text-slate-300 dark:text-[#52525B]">|</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#C6F432]/25 dark:bg-[#C6F432]/10 text-emerald-900 dark:text-[#C6F432] border border-[#C6F432]/40">Stream B Engine</span>
                </div>
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-white/80 dark:bg-[#141416] border border-slate-200/80 dark:border-[#2A2A2E] rounded-full text-[11px] text-slate-600 dark:text-[#A1A1AA] shadow-xs">
                  <Cpu className="w-3.5 h-3.5 text-[#16A34A] dark:text-[#C6F432]" />
                  <span>Dynamic Cost Matrix</span>
                </div>
              </div>

              <h1 className="text-2xl sm:text-4xl font-serif font-black tracking-tight leading-tight text-slate-950 dark:text-white drop-shadow-xs">
                Sales Engineer Quotation &amp; Formulation Workspace
              </h1>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-[#A1A1AA] font-sans leading-relaxed max-w-2xl font-normal">
                Technical review desk for heavy structural PEB frameworks, Sinotruk commercial fleets, and bulk cryogenic gases. Formulate engineering bill of materials and price matrices.
              </p>
            </div>

            {/* Assigned Engineer Persona Card & Reset Action */}
            <div className="flex items-center space-x-3 shrink-0">
              <button
                type="button"
                onClick={handleResetAllQuotes}
                className="px-3.5 py-2 bg-white/90 dark:bg-[#141416]/90 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-slate-200 dark:border-[#2A2A2E] hover:border-rose-300 dark:hover:border-rose-700 text-slate-700 dark:text-[#A1A1AA] hover:text-rose-600 dark:hover:text-rose-400 rounded-2xl text-[11px] font-bold transition-all flex items-center space-x-1.5 shadow-xs backdrop-blur-md cursor-pointer"
                title="Purge all demo test deals to start clean from customer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Pipeline</span>
              </button>

              <div className="flex items-center space-x-3 bg-white/90 dark:bg-[#141416]/90 p-3.5 rounded-2xl border border-slate-200 dark:border-[#2A2A2E] shadow-sm backdrop-blur-md">
                <div className="w-10 h-10 rounded-full bg-slate-950 dark:bg-[#1A1A1D] text-[#C6F432] font-bold flex items-center justify-center text-sm border border-slate-800 dark:border-[#2A2A2E] shadow-xs">
                  {currentUser.fullName[0]}
                </div>
                <div className="text-left text-xs">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Assigned Engineer</div>
                  <div className="font-bold text-slate-950 dark:text-white leading-tight">{currentUser.fullName}</div>
                  <div className="text-[10px] text-emerald-900 dark:text-[#C6F432] font-semibold">
                    {currentUser.subsidiaryName || 'Heavy Steel & Transport Division'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Role Boundary Notice */}
          {!isSalesAgent && (
            <div className="mt-6 pt-4 border-t border-slate-200/80 dark:border-[#1F1F24] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 dark:text-amber-200 text-xs">
              <div className="flex items-center space-x-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  Your active session is set to <strong>{currentUser.role}</strong>. Viewing sales engineer workspace in simulation mode.
                </span>
              </div>
              <button
                type="button"
                onClick={() => switchRole('sales_agent')}
                className="px-3.5 py-1.5 bg-[#C6F432] hover:bg-[#D7F860] text-[#0B0B0C] font-bold text-xs rounded-full transition-all shrink-0 flex items-center space-x-1 shadow-sm"
              >
                <span>Switch to Sales Agent Persona</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 2. BODY CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Col: Pending RFQ Inquiries Queue */}
          <div className="lg:col-span-4 space-y-3">
            <div className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA] flex items-center justify-between px-1">
                <span>Assigned RFQ Deals ({myAgentQuotes.length})</span>
                <span className="font-mono text-emerald-600 dark:text-[#C6F432]">Escalated SLA</span>
              </h2>

              {/* Filter Tabs */}
              <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-[#141416] p-1 rounded-xl border border-slate-200 dark:border-[#222225] text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setFilterTab('all')}
                  className={`py-1.5 rounded-lg transition-all text-center ${
                    filterTab === 'all'
                      ? 'bg-white dark:bg-[#1E1E22] text-[#0B0B0C] dark:text-white font-bold shadow-xs'
                      : 'text-slate-500 dark:text-[#71717A] hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  All ({eligibleQuotes.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab('assigned')}
                  className={`py-1.5 rounded-lg transition-all text-center ${
                    filterTab === 'assigned'
                      ? 'bg-white dark:bg-[#1E1E22] text-[#0B0B0C] dark:text-white font-bold shadow-xs'
                      : 'text-slate-500 dark:text-[#71717A] hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  My Deals ({eligibleQuotes.filter((q) => q.assignedAgentId === currentUser.id).length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab('inquiries')}
                  className={`py-1.5 rounded-lg transition-all text-center relative ${
                    filterTab === 'inquiries'
                      ? 'bg-white dark:bg-[#1E1E22] text-[#0B0B0C] dark:text-white font-bold shadow-xs ring-1 ring-[#C6F432]/50'
                      : 'text-slate-500 dark:text-[#71717A] hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>New Inquiries ({eligibleQuotes.filter((q) => !q.assignedAgentId || q.status === 'inquiry_submitted').length})</span>
                  {eligibleQuotes.some((q) => !q.assignedAgentId || q.status === 'inquiry_submitted') && (
                    <span className="w-2 h-2 rounded-full bg-[#16A34A] dark:bg-[#C6F432] absolute top-1 right-1 animate-pulse" />
                  )}
                </button>
              </div>

              {/* Instant Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by RFQ# (e.g. 00975), client, or project..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white dark:bg-[#141416] border border-slate-200 dark:border-[#222225] rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#C6F432]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[10px] font-bold"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2.5">
              {myAgentQuotes.length === 0 ? (
                <div className="p-6 bg-white dark:bg-[#141416] border border-slate-200 dark:border-[#222225] rounded-2xl text-center space-y-2">
                  <p className="font-bold text-slate-800 dark:text-white">No Deals In This View</p>
                  <p className="text-[11px] text-slate-500">
                    {filterTab === 'inquiries'
                      ? 'All customer RFQs have been assigned to an engineer.'
                      : 'You have no active quotations pending your review in this queue.'}
                  </p>
                </div>
              ) : (
                myAgentQuotes.map((q) => {
                  const isSelected = q.id === selectedQuote?.id;
                  const isUnassigned = !q.assignedAgentId;
                  return (
                    <div
                      key={q.id}
                      onClick={() => handleSelectQuote(q)}
                      className={`p-4 border rounded-2xl cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[#C6F432] bg-white dark:bg-[#1A1A1D] shadow-[0_4px_20px_rgba(198,244,50,0.15)] ring-1 ring-[#C6F432]'
                          : 'border-slate-200 dark:border-[#222225] bg-white dark:bg-[#141416] hover:border-slate-400 dark:hover:border-[#2A2A2E]'
                      }`}
                    >
                    <div className="flex justify-between items-start mb-1.5">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono font-bold text-[#0B0B0C] dark:text-[#C6F432] text-[11px]">
                          {q.quoteNumber}
                        </span>
                        <span className="text-[9px] font-mono bg-slate-100 dark:bg-[#222225] text-slate-600 dark:text-[#A1A1AA] px-1.5 py-0.5 rounded-full font-bold">
                          v{q.currentVersion || 1}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {isUnassigned && (
                          <span className="px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wider rounded-md bg-[#C6F432]/20 text-emerald-900 dark:text-[#C6F432] border border-[#C6F432]/40">
                            New Inquiry
                          </span>
                        )}
                        <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full bg-slate-100 dark:bg-[#222225] text-slate-700 dark:text-[#E4E4E7] border border-slate-200 dark:border-[#2A2A2E]">
                          {q.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>

                    <h3 className="font-bold text-[#0B0B0C] dark:text-white line-clamp-1 text-xs">
                      {q.projectTitle}
                    </h3>

                    <div className="text-[11px] text-slate-500 dark:text-[#A1A1AA] mt-1">
                      Buyer: <strong className="text-slate-800 dark:text-white">{q.customerCompany || q.customerName}</strong>
                    </div>

                    <div className="flex justify-between items-center pt-2.5 mt-2.5 border-t border-slate-100 dark:border-[#222225] font-mono text-[11px]">
                      <div>
                        <span className="text-slate-400">Pipeline Est: </span>
                        <span className="font-bold text-emerald-600 dark:text-[#C6F432]">
                          ETB {(q.finalQuotedTotalEtb || q.estimatedTotalEtb || 0).toLocaleString()}
                        </span>
                      </div>
                      {isUnassigned && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClaimQuote(q);
                          }}
                          className="px-2.5 py-1 bg-[#C6F432] hover:bg-[#D7F860] text-[#0B0B0C] font-extrabold text-[10px] rounded-full transition-all flex items-center space-x-1 shadow-xs"
                        >
                          <Check className="w-3 h-3" />
                          <span>Claim</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              }))}
            </div>
          </div>

          {/* Right Col: Active RFQ Quotation Form & Pricing Matrix */}
          <div className="lg:col-span-8 space-y-6">
            {!selectedQuote ? (
              <div className="bg-white dark:bg-[#141416] border border-slate-200 dark:border-[#222225] rounded-3xl p-12 text-center space-y-4 shadow-xs">
                <div className="w-16 h-16 bg-slate-100 dark:bg-[#1A1A1D] rounded-2xl flex items-center justify-center mx-auto text-slate-400 border border-slate-200 dark:border-[#2A2A2E]">
                  <FileText className="w-8 h-8 text-[#16A34A] dark:text-[#C6F432]" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    No RFQ Deal Selected
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-[#A1A1AA] max-w-md mx-auto leading-relaxed">
                    The engineering pipeline is currently clear. Submit a new custom quote inquiry from the customer portal to test the end-to-end quotation, formulation, and order conversion flow.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Active RFQ Details Card */}
                <div className="bg-white dark:bg-[#141416] border border-slate-200 dark:border-[#222225] rounded-3xl p-6 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-slate-100 dark:border-[#222225] gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-[#C6F432] uppercase tracking-wider block">
                      Technical Deal: {selectedQuote.quoteNumber}
                    </span>
                    <span className="px-2 py-0.5 bg-[#C6F432]/10 border border-[#C6F432]/30 text-emerald-900 dark:text-[#C6F432] font-mono text-[10px] font-bold rounded-full">
                      Current Revision v{selectedQuote.currentVersion || 1}
                    </span>
                  </div>
                  <h2 className="text-base font-extrabold text-slate-950 dark:text-white mt-1">
                    {selectedQuote.projectTitle}
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {!selectedQuote.assignedAgentId && (
                    <button
                      type="button"
                      onClick={() => handleClaimQuote(selectedQuote)}
                      className="px-3 py-1.5 bg-[#C6F432] hover:bg-[#D7F860] text-[#0B0B0C] font-extrabold rounded-full text-[11px] transition-colors flex items-center space-x-1 shadow-sm cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Claim &amp; Formulate</span>
                    </button>
                  )}
                  {selectedQuote.status === 'quote_approved' && (
                    <button
                      type="button"
                      disabled={isConvertingOrder}
                      onClick={() => handleConvertToOrder(selectedQuote)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-full text-[11px] transition-colors flex items-center space-x-1.5 shadow-sm cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isConvertingOrder ? 'Converting...' : 'Convert to Active Order & Route'}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveProformaVersion(selectedQuote.currentVersion || 1);
                      setIsProformaOpen(true);
                    }}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-[#1A1A1D] dark:hover:bg-[#222225] border border-slate-700 dark:border-[#2A2A2E] text-white dark:text-[#C6F432] font-bold rounded-full text-[11px] transition-colors flex items-center space-x-1 shadow-sm"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>View Proforma (v{selectedQuote.currentVersion || 1})</span>
                  </button>
                  <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 rounded-full font-bold text-[10px] uppercase self-start sm:self-auto">
                    {selectedQuote.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              {convertedOrderSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl flex items-center space-x-2 text-emerald-800 dark:text-emerald-200 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{convertedOrderSuccess}</span>
                </div>
              )}

              {/* Requirements Box */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-[#A1A1AA] tracking-wider">
                  Customer Blueprint &amp; Requirements Payload:
                </span>
                <div className="bg-slate-50 dark:bg-[#0E0E10] border border-slate-200 dark:border-[#222225] p-4 rounded-2xl font-mono text-[11px] text-slate-800 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                  {selectedQuote.customerRequirements}
                </div>
              </div>

              {/* REVISION AUDIT TIMELINE */}
              {selectedQuote.revisions && selectedQuote.revisions.length > 0 && (
                <div className="border border-slate-200 dark:border-[#222225] rounded-2xl bg-slate-50/70 dark:bg-[#0E0E10]/60 p-4 space-y-2.5">
                  <div className="font-bold text-slate-700 dark:text-[#E4E4E7] uppercase tracking-wider text-[10px] flex items-center space-x-1.5">
                    <History className="w-3.5 h-3.5 text-emerald-600 dark:text-[#C6F432]" />
                    <span>Previous Revisions Audit Trail ({selectedQuote.revisions.length} Versions):</span>
                  </div>
                  <div className="space-y-2">
                    {selectedQuote.revisions.map((rev) => (
                      <div
                        key={rev.version}
                        className="bg-white dark:bg-[#141416] border border-slate-200 dark:border-[#222225] p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]"
                      >
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white font-mono flex items-center space-x-2">
                            <span>Revision v{rev.version}</span>
                            <span className="text-slate-500 font-normal">
                              ({new Date(rev.timestamp).toLocaleDateString()}) - {rev.changedBy}
                            </span>
                          </div>
                          <p className="text-slate-500 dark:text-[#A1A1AA] text-[10px] mt-0.5">{rev.notes}</p>
                        </div>
                        <div className="flex items-center space-x-2.5 self-end sm:self-auto shrink-0">
                          <span className="font-mono font-bold text-emerald-600 dark:text-[#C6F432]">
                            ETB {rev.quotedTotalEtb.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveProformaVersion(rev.version);
                              setIsProformaOpen(true);
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-[#1A1A1D] dark:hover:bg-[#222225] border border-slate-300 dark:border-[#2A2A2E] text-slate-800 dark:text-white font-bold rounded-full text-[10px] transition-colors flex items-center space-x-1"
                            title={`Inspect official v${rev.version} Proforma with ERCA seal`}
                          >
                            <Printer className="w-3 h-3 text-emerald-600 dark:text-[#C6F432]" />
                            <span>v{rev.version} Proforma</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* DYNAMIC PRICING MATRIX CALCULATOR (Interactive Tool) */}
              <form onSubmit={handleSaveQuoteMatrix} className="border-t border-slate-100 dark:border-[#222225] pt-4 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-1.5 text-emerald-700 dark:text-[#C6F432] font-bold text-xs uppercase tracking-wide">
                    <Calculator className="w-4 h-4" />
                    <span>Engineering Cost Model &amp; Dynamic Pricing Matrix</span>
                  </div>
                  <div className="text-[10px] font-mono bg-slate-100 dark:bg-[#1A1A1D] border border-slate-200 dark:border-[#2A2A2E] px-2.5 py-1 rounded-full text-slate-600 dark:text-[#A1A1AA]">
                    Formula: Raw Materials + (Machine Hours × Rate) + Coating + Freight + Margin %
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 bg-slate-50 dark:bg-[#0E0E10] border border-slate-200 dark:border-[#222225] p-4 rounded-2xl">
                  <div>
                    <label className="block text-slate-500 dark:text-[#A1A1AA] text-[10px] font-bold uppercase mb-1">
                      1. Raw Material Cost (ETB):
                    </label>
                    <input
                      type="number"
                      value={rawMaterialCost}
                      onChange={(e) => setRawMaterialCost(Number(e.target.value))}
                      className="w-full bg-white dark:bg-[#141416] border border-slate-200 dark:border-[#2A2A2E] px-3 py-2 rounded-xl font-mono text-slate-900 dark:text-white text-xs outline-none focus:border-[#C6F432]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 dark:text-[#A1A1AA] text-[10px] font-bold uppercase mb-1">
                      2. Machine Hours (hrs):
                    </label>
                    <input
                      type="number"
                      value={fabricationHours}
                      onChange={(e) => setFabricationHours(Number(e.target.value))}
                      className="w-full bg-white dark:bg-[#141416] border border-slate-200 dark:border-[#2A2A2E] px-3 py-2 rounded-xl font-mono text-slate-900 dark:text-white text-xs outline-none focus:border-[#C6F432]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 dark:text-[#A1A1AA] text-[10px] font-bold uppercase mb-1">
                      3. Machine Rate (ETB / hr):
                    </label>
                    <input
                      type="number"
                      value={hourlyMachineRate}
                      onChange={(e) => setHourlyMachineRate(Number(e.target.value))}
                      className="w-full bg-white dark:bg-[#141416] border border-slate-200 dark:border-[#2A2A2E] px-3 py-2 rounded-xl font-mono text-slate-900 dark:text-white text-xs outline-none focus:border-[#C6F432]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 dark:text-[#A1A1AA] text-[10px] font-bold uppercase mb-1">
                      4. Protective Coating (ETB):
                    </label>
                    <input
                      type="number"
                      value={coatingTariff}
                      onChange={(e) => setCoatingTariff(Number(e.target.value))}
                      className="w-full bg-white dark:bg-[#141416] border border-slate-200 dark:border-[#2A2A2E] px-3 py-2 rounded-xl font-mono text-slate-900 dark:text-white text-xs outline-none focus:border-[#C6F432]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 dark:text-[#A1A1AA] text-[10px] font-bold uppercase mb-1">
                      5. Freight Tariff (ETB):
                    </label>
                    <input
                      type="number"
                      value={freightTariff}
                      onChange={(e) => setFreightTariff(Number(e.target.value))}
                      className="w-full bg-white dark:bg-[#141416] border border-slate-200 dark:border-[#2A2A2E] px-3 py-2 rounded-xl font-mono text-slate-900 dark:text-white text-xs outline-none focus:border-[#C6F432]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 dark:text-[#A1A1AA] text-[10px] font-bold uppercase mb-1">
                      6. Target Margin (%):
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={marginPercent}
                      onChange={(e) => setMarginPercent(Number(e.target.value))}
                      className="w-full bg-white dark:bg-[#141416] border border-slate-200 dark:border-[#2A2A2E] px-3 py-2 rounded-xl font-mono text-slate-900 dark:text-white text-xs outline-none focus:border-[#C6F432]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-500 dark:text-[#A1A1AA] text-[10px] font-bold uppercase mb-1">
                      7. Valid Guaranteed Until:
                    </label>
                    <input
                      type="date"
                      required
                      value={validUntil}
                      onChange={(e) => setValidUntil(e.target.value)}
                      className="w-full bg-white dark:bg-[#141416] border border-slate-200 dark:border-[#2A2A2E] px-3 py-2 rounded-xl font-mono text-slate-900 dark:text-white text-xs outline-none focus:border-[#C6F432]"
                    />
                  </div>
                </div>

                {/* Mathematical Formula Breakdown Card */}
                <div className="bg-slate-950 dark:bg-[#0E0E10] border border-[#2A2A2E] rounded-2xl p-4 space-y-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                    <span>Engineering Formula Breakdown</span>
                    <span className="font-mono text-[#C6F432]">Live Auto-Computed</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[10px]">
                    <div className="bg-[#141416] p-2.5 rounded-xl border border-[#222225]">
                      <div className="text-slate-400">Raw Materials</div>
                      <div className="text-white font-bold mt-0.5">ETB {rawMaterialCost.toLocaleString()}</div>
                    </div>
                    <div className="bg-[#141416] p-2.5 rounded-xl border border-[#222225]">
                      <div className="text-slate-400">Machining ({fabricationHours}h × {hourlyMachineRate})</div>
                      <div className="text-[#C6F432] font-bold mt-0.5">ETB {subtotalFabrication.toLocaleString()}</div>
                    </div>
                    <div className="bg-[#141416] p-2.5 rounded-xl border border-[#222225]">
                      <div className="text-slate-400">Protective Coating</div>
                      <div className="text-white font-bold mt-0.5">ETB {coatingTariff.toLocaleString()}</div>
                    </div>
                    <div className="bg-[#141416] p-2.5 rounded-xl border border-[#222225]">
                      <div className="text-slate-400">Freight Logistics</div>
                      <div className="text-white font-bold mt-0.5">ETB {freightTariff.toLocaleString()}</div>
                    </div>
                  </div>

                  {/* Live Formula Calculated Total Banner */}
                  <div className="p-3.5 bg-[#141416] border border-[#C6F432]/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-[#C6F432] block">
                        Calculated Final Quoted Total (ETB)
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Base Cost ETB {baseProductionCost.toLocaleString()} + {marginPercent}% Margin (+ETB {Math.round(baseProductionCost * (marginPercent / 100)).toLocaleString()})
                      </span>
                    </div>
                    <div className="text-xl sm:text-2xl font-extrabold font-mono text-[#C6F432]">
                      ETB {calculatedQuotedTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 dark:text-[#A1A1AA] text-[10px] font-bold uppercase mb-1">
                    Official Quotation Terms &amp; Mill Delivery Schedule:
                  </label>
                  <textarea
                    rows={2}
                    value={agentNotes}
                    onChange={(e) => setAgentNotes(e.target.value)}
                    placeholder="Factory lead time, delivery tranches from Adama plant, inspection slots..."
                    className="w-full bg-slate-50 dark:bg-[#0E0E10] border border-slate-200 dark:border-[#2A2A2E] px-3.5 py-2.5 text-slate-900 dark:text-white text-xs rounded-2xl outline-none focus:border-[#C6F432]"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  {isSaved ? (
                    <span className="text-emerald-600 dark:text-[#C6F432] font-bold flex items-center space-x-1 text-xs">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Official Revision Issued &amp; Dispatched to Client!</span>
                    </span>
                  ) : <span />}

                  <button
                    type="submit"
                    className="px-6 py-3 bg-[#C6F432] hover:bg-[#D7F860] text-[#0B0B0C] font-bold text-xs rounded-full transition-all flex items-center space-x-1.5 shadow-md hover:shadow-lg"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Issue Revision v{(selectedQuote.currentVersion || 1) + 1} to Client</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Live Client Collaboration Thread */}
            <div className="bg-white dark:bg-[#141416] border border-slate-200 dark:border-[#222225] rounded-3xl p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-[#222225]">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-[#C6F432]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-950 dark:text-white">
                    Client Engineering Negotiation Thread
                  </h3>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-[#71717A] font-mono">
                  {selectedQuote.messages?.length || 0} Messages
                </span>
              </div>

              <div className="space-y-3 max-h-60 overflow-y-auto p-1">
                {selectedQuote.messages && selectedQuote.messages.length > 0 ? (
                  selectedQuote.messages.map((m) => {
                    const isAgent = m.senderRole === 'sales_agent' || m.senderRole === 'super_admin';
                    return (
                      <div
                        key={m.id}
                        className={`p-3.5 rounded-2xl border max-w-[85%] ${
                          isAgent
                            ? 'ml-auto bg-slate-950 text-white border-slate-800'
                            : 'mr-auto bg-slate-50 dark:bg-[#0E0E10] border-slate-200 dark:border-[#222225] text-slate-800 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400 mb-1">
                          <span>{m.senderName} ({isAgent ? 'Sales Engineer' : 'Buyer'})</span>
                          <span className="font-mono">{new Date(m.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs leading-relaxed">{m.message}</p>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-slate-400">
                    No active messages yet. Send a note to the client below.
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t border-slate-100 dark:border-[#222225]">
                <input
                  type="text"
                  placeholder="Type engineering response to client..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  className="flex-1 bg-slate-50 dark:bg-[#0E0E10] border border-slate-200 dark:border-[#222225] px-4 py-2 text-slate-900 dark:text-white text-xs rounded-full outline-none focus:border-[#C6F432]"
                />
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#C6F432] hover:bg-[#D7F860] text-[#0B0B0C] font-bold text-xs rounded-full transition-all flex items-center space-x-1 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
              </>
            )}
          </div>
        </div>

        {/* Bank Proforma Modal for Agent */}
        {selectedQuote && (
          <ProformaInvoiceModal
            isOpen={isProformaOpen}
            quote={selectedQuote}
            initialVersion={activeProformaVersion}
            onClose={() => setIsProformaOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
