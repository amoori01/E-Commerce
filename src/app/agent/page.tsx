'use client';

import React, { useState } from 'react';
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
  Printer
} from 'lucide-react';

export default function SalesAgentPage() {
  const { currentUser, activeRole, switchRole } = useAuth();
  const [quotesList, setQuotesList] = useState<Quote[]>(INITIAL_QUOTES);
  const [selectedQuote, setSelectedQuote] = useState<Quote>(INITIAL_QUOTES[0]);

  // Pricing Matrix Parameters
  const [rawMaterialCost, setRawMaterialCost] = useState<number>(8500000);
  const [fabricationHours, setFabricationHours] = useState<number>(320);
  const [hourlyMachineRate, setHourlyMachineRate] = useState<number>(3500);
  const [coatingTariff, setCoatingTariff] = useState<number>(750000);
  const [freightTariff, setFreightTariff] = useState<number>(450000);
  const [marginPercent, setMarginPercent] = useState<number>(9.5);

  const [validUntil, setValidUntil] = useState<string>(selectedQuote.quoteValidUntil || '2026-10-31');
  const [agentNotes, setAgentNotes] = useState<string>(selectedQuote.agentQuotationNotes || '');
  const [chatMessage, setChatMessage] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  // Proforma Invoice Modal State
  const [isProformaOpen, setIsProformaOpen] = useState(false);
  const [activeProformaVersion, setActiveProformaVersion] = useState<number | null>(null);

  const isSalesAgent = activeRole === 'sales_agent';

  // Live Auto-Calculation of the Quoted Price from the Engineering Pricing Matrix
  const subtotalFabrication = fabricationHours * hourlyMachineRate;
  const baseProductionCost = rawMaterialCost + subtotalFabrication + coatingTariff + freightTariff;
  const calculatedQuotedTotal = Math.round(baseProductionCost * (1 + marginPercent / 100));

  const handleSelectQuote = (q: Quote) => {
    setSelectedQuote(q);
    setValidUntil(q.quoteValidUntil || '2026-10-31');
    setAgentNotes(q.agentQuotationNotes || '');
    setIsSaved(false);
  };

  const handleSaveQuoteMatrix = async (e: React.FormEvent) => {
    e.preventDefault();
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

    setSelectedQuote((prev) => ({
      ...prev,
      status: 'draft_quote_issued',
      currentVersion: nextVersion,
      finalQuotedTotalEtb: calculatedQuotedTotal,
      quoteValidUntil: validUntil,
      agentQuotationNotes: agentNotes,
      revisions: [...(prev.revisions || []), newRevision],
    }));

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

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3500);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

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

    setSelectedQuote((prev) => ({
      ...prev,
      messages: [...prev.messages, newMsg],
    }));

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
    <div className="min-h-screen bg-slate-900 text-slate-200">
      {/* 1. ENGINEERING BLUEPRINT THEME HEADER */}
      <div className="bg-[#0B1528] border-b border-sky-950 px-4 sm:px-6 py-6 shadow-xl">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 bg-sky-600 text-white font-extrabold uppercase rounded-sm text-[10px] tracking-wider flex items-center space-x-1 shadow-sm">
                  <Cpu className="w-3 h-3" />
                  <span>Tier 2: Technical Engineering & Pricing Desk</span>
                </span>
                <span className="text-sky-400 font-mono text-[11px]">Stream B Inquiry Engine</span>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white">
                Sales Engineer Quotation & Formulation Workspace
              </h1>
              <p className="text-xs text-slate-400 max-w-2xl">
                Technical review desk for heavy structural PEB frameworks, Sinotruk commercial fleets, and bulk cryogenic gases. Formulate engineering bill of materials and price matrices.
              </p>
            </div>

            {/* Assigned Engineer Badge */}
            <div className="bg-slate-950 border border-sky-900/60 p-3 rounded-sm text-right shrink-0">
              <div className="text-[10px] uppercase font-bold text-slate-400">Assigned Sales Engineer</div>
              <div className="text-sm font-bold text-white mt-0.5">{currentUser.fullName}</div>
              <div className="text-[11px] font-mono text-sky-400">
                {currentUser.subsidiaryName || 'Heavy Steel & Transport Division'}
              </div>
            </div>
          </div>

          {/* Role Boundary Notice */}
          {!isSalesAgent && (
            <div className="bg-sky-950/80 border border-sky-600/60 p-3.5 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sky-200 text-xs">
              <div className="flex items-start space-x-2.5">
                <AlertTriangle className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">Role Boundary Notice:</strong>
                  <span>
                    Your active session is set to <strong>{currentUser.role}</strong>. Viewing sales engineer workspace in simulation mode.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => switchRole('sales_agent')}
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-sm transition-colors shrink-0 flex items-center space-x-1"
              >
                <span>Switch to Sales Agent Persona</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. BODY CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Col: Pending RFQ Inquiries Queue */}
          <div className="lg:col-span-4 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Assigned RFQ Deals ({quotesList.length})</span>
              <span className="font-mono text-sky-400">Escalated SLA</span>
            </h2>

            <div className="space-y-2">
              {quotesList.map((q) => {
                const isSelected = q.id === selectedQuote.id;
                return (
                  <div
                    key={q.id}
                    onClick={() => handleSelectQuote(q)}
                    className={`p-4 border rounded-sm cursor-pointer transition-all ${
                      isSelected
                        ? 'border-sky-500 bg-sky-950/70 shadow-sm'
                        : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono font-bold text-sky-400 text-[11px]">
                          {q.quoteNumber}
                        </span>
                        <span className="text-[9px] font-mono bg-slate-800 text-slate-300 px-1 py-0.2 rounded-sm">
                          v{q.currentVersion || 1}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-sm bg-slate-800 text-slate-300">
                        {q.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <h3 className="font-bold text-white line-clamp-1 text-xs">
                      {q.projectTitle}
                    </h3>

                    <div className="text-[11px] text-slate-400 mt-1">
                      Buyer: <strong className="text-slate-200">{q.customerCompany || q.customerName}</strong>
                    </div>

                    <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-800/80 font-mono text-[11px]">
                      <span className="text-slate-500">Pipeline Est:</span>
                      <span className="font-bold text-emerald-400">
                        ETB {(q.finalQuotedTotalEtb || q.estimatedTotalEtb || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Col: Active RFQ Quotation Form & Pricing Matrix */}
          <div className="lg:col-span-8 space-y-6">
            {/* Active RFQ Details Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-sm p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-wider block">
                      Technical Deal: {selectedQuote.quoteNumber}
                    </span>
                    <span className="px-1.5 py-0.2 bg-sky-900/60 border border-sky-700/60 text-sky-300 font-mono text-[10px] font-bold rounded-sm">
                      Current Revision v{selectedQuote.currentVersion || 1}
                    </span>
                  </div>
                  <h2 className="text-base font-extrabold text-white mt-0.5">
                    {selectedQuote.projectTitle}
                  </h2>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveProformaVersion(selectedQuote.currentVersion || 1);
                      setIsProformaOpen(true);
                    }}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-sky-900 border border-sky-800 text-sky-300 font-bold rounded-sm text-[11px] transition-colors flex items-center space-x-1 shadow-sm"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>View Proforma (v{selectedQuote.currentVersion || 1})</span>
                  </button>
                  <span className="px-2.5 py-1 bg-amber-950 border border-amber-700/60 text-amber-300 rounded-sm font-bold text-[10px] uppercase self-start sm:self-auto">
                    {selectedQuote.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              {/* Requirements Box */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Customer Blueprint & Requirements Payload:
                </span>
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-sm font-mono text-[11px] text-slate-300 whitespace-pre-line leading-relaxed">
                  {selectedQuote.customerRequirements}
                </div>
              </div>

              {/* REVISION AUDIT TIMELINE */}
              {selectedQuote.revisions && selectedQuote.revisions.length > 0 && (
                <div className="border border-slate-800 rounded-sm bg-slate-900/60 p-3 space-y-2">
                  <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px] flex items-center space-x-1.5">
                    <History className="w-3.5 h-3.5 text-sky-400" />
                    <span>Previous Revisions Audit Trail ({selectedQuote.revisions.length} Versions):</span>
                  </div>
                  <div className="space-y-1.5">
                    {selectedQuote.revisions.map((rev) => (
                      <div
                        key={rev.version}
                        className="bg-slate-950 border border-slate-800 p-2.5 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]"
                      >
                        <div>
                          <div className="font-bold text-white font-mono flex items-center space-x-2">
                            <span>Revision v{rev.version}</span>
                            <span className="text-slate-500 font-normal">
                              ({new Date(rev.timestamp).toLocaleDateString()}) - {rev.changedBy}
                            </span>
                          </div>
                          <p className="text-slate-400 text-[10px]">{rev.notes}</p>
                        </div>
                        <div className="flex items-center space-x-2.5 self-end sm:self-auto shrink-0">
                          <span className="font-mono font-bold text-emerald-400">
                            ETB {rev.quotedTotalEtb.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveProformaVersion(rev.version);
                              setIsProformaOpen(true);
                            }}
                            className="px-2 py-0.5 bg-slate-900 hover:bg-sky-900 border border-slate-700 hover:border-sky-600 text-sky-300 font-bold rounded-xs text-[10px] transition-colors flex items-center space-x-1"
                            title={`Inspect official v${rev.version} Proforma with ERCA seal`}
                          >
                            <Printer className="w-3 h-3" />
                            <span>v{rev.version} Proforma</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* DYNAMIC PRICING MATRIX CALCULATOR (Interactive Tool) */}
              <form onSubmit={handleSaveQuoteMatrix} className="border-t border-slate-800 pt-4 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-1.5 text-sky-400 font-bold text-xs uppercase tracking-wide">
                    <Calculator className="w-4 h-4" />
                    <span>Engineering Cost Model & Dynamic Pricing Matrix</span>
                  </div>
                  <div className="text-[10px] font-mono bg-sky-950 border border-sky-800/80 px-2 py-0.5 rounded-sm text-sky-300">
                    Formula: Raw Materials + (Machine Hours × Rate) + Coating + Freight + Margin %
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 bg-slate-900/80 border border-slate-800 p-3.5 rounded-sm">
                  <div>
                    <label className="block text-slate-400 text-[10px] font-bold uppercase mb-1">
                      1. Raw Material Cost (ETB):
                    </label>
                    <input
                      type="number"
                      value={rawMaterialCost}
                      onChange={(e) => setRawMaterialCost(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 px-2.5 py-1.5 rounded-sm font-mono text-white text-xs outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[10px] font-bold uppercase mb-1">
                      2. Machine Hours (hrs):
                    </label>
                    <input
                      type="number"
                      value={fabricationHours}
                      onChange={(e) => setFabricationHours(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 px-2.5 py-1.5 rounded-sm font-mono text-white text-xs outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[10px] font-bold uppercase mb-1">
                      3. Machine Rate (ETB / hr):
                    </label>
                    <input
                      type="number"
                      value={hourlyMachineRate}
                      onChange={(e) => setHourlyMachineRate(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 px-2.5 py-1.5 rounded-sm font-mono text-white text-xs outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[10px] font-bold uppercase mb-1">
                      4. Protective Coating (ETB):
                    </label>
                    <input
                      type="number"
                      value={coatingTariff}
                      onChange={(e) => setCoatingTariff(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 px-2.5 py-1.5 rounded-sm font-mono text-white text-xs outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[10px] font-bold uppercase mb-1">
                      5. Freight Tariff (ETB):
                    </label>
                    <input
                      type="number"
                      value={freightTariff}
                      onChange={(e) => setFreightTariff(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 px-2.5 py-1.5 rounded-sm font-mono text-white text-xs outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[10px] font-bold uppercase mb-1">
                      6. Target Margin (%):
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={marginPercent}
                      onChange={(e) => setMarginPercent(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 px-2.5 py-1.5 rounded-sm font-mono text-white text-xs outline-none focus:border-sky-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 text-[10px] font-bold uppercase mb-1">
                      7. Valid Guaranteed Until:
                    </label>
                    <input
                      type="date"
                      required
                      value={validUntil}
                      onChange={(e) => setValidUntil(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 px-2.5 py-1.5 rounded-sm font-mono text-white text-xs outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                {/* Mathematical Formula Breakdown Card */}
                <div className="bg-slate-950 border border-sky-900/60 rounded-sm p-3.5 space-y-2.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                    <span>Engineering Formula Breakdown</span>
                    <span className="font-mono text-sky-400">Live Auto-Computed</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[10px]">
                    <div className="bg-slate-900/70 p-2 rounded-sm border border-slate-800">
                      <div className="text-slate-500">Raw Materials</div>
                      <div className="text-white font-bold mt-0.5">ETB {rawMaterialCost.toLocaleString()}</div>
                    </div>
                    <div className="bg-slate-900/70 p-2 rounded-sm border border-slate-800">
                      <div className="text-slate-500">Machining ({fabricationHours}h × {hourlyMachineRate})</div>
                      <div className="text-sky-300 font-bold mt-0.5">ETB {subtotalFabrication.toLocaleString()}</div>
                    </div>
                    <div className="bg-slate-900/70 p-2 rounded-sm border border-slate-800">
                      <div className="text-slate-500">Protective Coating</div>
                      <div className="text-white font-bold mt-0.5">ETB {coatingTariff.toLocaleString()}</div>
                    </div>
                    <div className="bg-slate-900/70 p-2 rounded-sm border border-slate-800">
                      <div className="text-slate-500">Freight Logistics</div>
                      <div className="text-white font-bold mt-0.5">ETB {freightTariff.toLocaleString()}</div>
                    </div>
                  </div>

                  {/* Live Formula Calculated Total Banner */}
                  <div className="p-3 bg-sky-950/70 border border-sky-700/60 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-sky-400 block">
                        Calculated Final Quoted Total (ETB)
                      </span>
                      <span className="text-[11px] text-slate-300 font-mono">
                        Base Production Cost ETB {baseProductionCost.toLocaleString()} + {marginPercent}% Margin (+ETB {Math.round(baseProductionCost * (marginPercent / 100)).toLocaleString()})
                      </span>
                    </div>
                    <div className="text-xl sm:text-2xl font-extrabold font-mono text-emerald-400">
                      ETB {calculatedQuotedTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] font-bold uppercase mb-1">
                    Official Quotation Terms & Mill Delivery Schedule:
                  </label>
                  <textarea
                    rows={2}
                    value={agentNotes}
                    onChange={(e) => setAgentNotes(e.target.value)}
                    placeholder="Factory lead time, delivery tranches from Adama plant, inspection slots..."
                    className="w-full bg-slate-950 border border-slate-700 px-3 py-2 text-white text-xs rounded-sm outline-none focus:border-sky-500"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  {isSaved ? (
                    <span className="text-emerald-400 font-bold flex items-center space-x-1 text-xs">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Official Revision Issued & Dispatched to Client!</span>
                    </span>
                  ) : <span />}

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-sm transition-colors flex items-center space-x-1.5 shadow-sm"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Issue Revision v{(selectedQuote.currentVersion || 1) + 1} to Client</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Live Client Collaboration Thread */}
            <div className="bg-slate-950 border border-slate-800 rounded-sm p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-sky-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                    Client Engineering Negotiation Thread
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
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
                        className={`p-3 rounded-sm border max-w-[85%] ${
                          isAgent
                            ? 'ml-auto bg-sky-950/80 border-sky-800 text-white'
                            : 'mr-auto bg-slate-900 border-slate-800 text-slate-300'
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
                  <div className="text-center py-6 text-slate-500">
                    No active messages yet. Send a note to the client below.
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t border-slate-800">
                <input
                  type="text"
                  placeholder="Type engineering response to client..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 px-3 py-2 text-white text-xs rounded-sm outline-none focus:border-sky-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-sm transition-colors flex items-center space-x-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Bank Proforma Modal for Agent */}
        <ProformaInvoiceModal
          isOpen={isProformaOpen}
          quote={selectedQuote}
          initialVersion={activeProformaVersion}
          onClose={() => setIsProformaOpen(false)}
        />
      </div>
    </div>
  );
}
