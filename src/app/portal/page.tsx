'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { INITIAL_ORDERS, INITIAL_QUOTES } from '@/lib/constants';
import { Order, Quote } from '@/types';
import { ProformaInvoiceModal } from '@/components/modals/ProformaInvoiceModal';
import {
  Building2,
  FileText,
  ShoppingCart,
  Clock,
  CheckCircle,
  Truck,
  Download,
  MessageSquare,
  ShieldCheck,
  Send,
  Printer,
  FileCheck2,
  AlertCircle,
  ArrowRight,
  History,
  GitBranch,
  X
} from 'lucide-react';

export default function CustomerPortalPage() {
  const { currentUser, activeRole, switchRole } = useAuth();
  const { wishlistProducts, toggleWishlist } = require('@/lib/wishlist-context').useWishlist();
  const { addToCart, openRfq } = require('@/lib/cart-context').useCart();

  const [activeTab, setActiveTab] = useState<'quotes' | 'orders' | 'wishlist' | 'addresses' | 'profile'>('quotes');
  const [quotesList, setQuotesList] = useState<Quote[]>(INITIAL_QUOTES);
  const [approvalMessage, setApprovalMessage] = useState<string | null>(null);

  // Address state
  const { INITIAL_ADDRESSES } = require('@/lib/constants');
  const [addresses, setAddresses] = useState<import('@/types').UserAddress[]>(INITIAL_ADDRESSES);
  const [newAddressTitle, setNewAddressTitle] = useState('');
  const [newAddressCity, setNewAddressCity] = useState('');
  const [newAddressDetails, setNewAddressDetails] = useState('');
  const [newAddressPhone, setNewAddressPhone] = useState(currentUser.phone || '+251 91 123 4567');
  const [isAddingAddress, setIsAddingAddress] = useState(false);

  // Proforma Invoice Modal State
  const [selectedProformaQuote, setSelectedProformaQuote] = useState<Quote | null>(null);
  const [selectedProformaOrder, setSelectedProformaOrder] = useState<Order | null>(null);
  const [isProformaOpen, setIsProformaOpen] = useState(false);

  // Revision Request Drawer State
  const [revisionQuoteId, setRevisionQuoteId] = useState<string | null>(null);
  const [revisionNotes, setRevisionNotes] = useState('');

  // Real-time Negotiation Chat State (SRS 4.5)
  const [chatQuote, setChatQuote] = useState<Quote | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  const router = useRouter();
  const isCustomer = activeRole === 'customer';

  const roleRedirectMap: Record<string, { url: string; title: string }> = {
    super_admin: { url: '/admin', title: 'Corporate Super Admin Portal' },
    branch_admin: { url: '/branch-admin', title: 'Branch Depot Admin Portal' },
    sales_agent: { url: '/agent', title: 'Sales Engineering Workspace' },
  };

  useEffect(() => {
    if (!isCustomer && roleRedirectMap[activeRole]) {
      const timer = setTimeout(() => {
        router.push(roleRedirectMap[activeRole].url);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isCustomer, activeRole, router]);

  const myOrders = INITIAL_ORDERS.filter((o) => o.customerId === currentUser.id || currentUser.role === 'customer');
  const myQuotes = quotesList.filter((q) => q.customerId === currentUser.id || currentUser.role === 'customer');

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddressTitle || !newAddressCity || !newAddressDetails) return;
    const newAddr: import('@/types').UserAddress = {
      id: `addr-${Date.now()}`,
      userId: currentUser.id,
      title: newAddressTitle,
      recipientName: currentUser.fullName,
      phone: newAddressPhone,
      city: newAddressCity,
      detailedAddress: newAddressDetails,
      isDefault: addresses.length === 0,
    };
    setAddresses((prev) => [...prev, newAddr]);
    setNewAddressTitle('');
    setNewAddressCity('');
    setNewAddressDetails('');
    setIsAddingAddress(false);
  };

  const handleApproveQuote = (quoteId: string) => {
    setQuotesList((prev) =>
      prev.map((q) => (q.id === quoteId ? { ...q, status: 'quote_approved' } : q))
    );
    setApprovalMessage('Official quotation accepted & authorized! Sales engineering team notified for contract issuance.');
    setTimeout(() => setApprovalMessage(null), 4000);
  };

  const handleOpenRevisionModal = (quoteId: string) => {
    setRevisionQuoteId(quoteId);
    setRevisionNotes('');
  };

  const handleSubmitRevision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionQuoteId) return;

    setQuotesList((prev) =>
      prev.map((q) => {
        if (q.id === revisionQuoteId) {
          const newVersion = (q.currentVersion || 1) + 1;
          const updatedRevisions = [
            ...(q.revisions || []),
            {
              version: newVersion,
              timestamp: new Date().toISOString(),
              quotedTotalEtb: q.finalQuotedTotalEtb || q.estimatedTotalEtb || 0,
              validUntil: q.quoteValidUntil || '2026-11-30',
              notes: `Client Revision Request: ${revisionNotes}`,
              status: 'draft' as const,
              changedBy: `${currentUser.fullName} (${currentUser.companyName || 'Buyer'})`,
            },
          ];

          return {
            ...q,
            status: 'inquiry_submitted',
            currentVersion: newVersion,
            revisions: updatedRevisions,
            customerRequirements: `${q.customerRequirements}\n\n[Revision ${newVersion} Requested]: ${revisionNotes}`,
          };
        }
        return q;
      })
    );

    setRevisionQuoteId(null);
    setApprovalMessage('Technical revision request dispatched to assigned sales engineer.');
    setTimeout(() => setApprovalMessage(null), 4000);
  };

  const handleOpenChat = async (q: Quote) => {
    setChatQuote(q);
    setChatMessages(q.messages || []);
    setIsChatLoading(true);
    try {
      const res = await fetch(`/api/chat?quoteId=${q.id}`);
      const data = await res.json();
      if (data.success && data.messages.length > 0) {
        setChatMessages(data.messages);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleSendPortalChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !chatQuote) return;

    const text = chatInput.trim();
    setChatInput('');

    const newMsg = {
      id: `msg-${Date.now()}`,
      quoteId: chatQuote.id,
      senderId: currentUser.id,
      senderName: currentUser.fullName,
      senderRole: currentUser.role,
      message: text,
      createdAt: new Date().toISOString(),
    };

    setChatMessages((prev) => [...prev, newMsg]);

    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteId: chatQuote.id,
          senderId: currentUser.id,
          senderName: currentUser.fullName,
          senderRole: currentUser.role,
          message: text,
        }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  if (!isCustomer) {
    const dest = roleRedirectMap[activeRole] || { url: '/admin', title: 'Management Workspace' };
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4 bg-slate-50">
        <div className="max-w-md w-full bg-white border border-slate-300 rounded-sm p-6 shadow-modal text-center space-y-4">
          <div className="w-12 h-12 bg-amber-100 border border-amber-300 text-amber-800 rounded-full flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900">
              Customer Orders Portal: Role Restricted
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              You are signed in as <strong className="text-slate-900 capitalize font-mono">{activeRole.replace('_', ' ')}</strong> ({currentUser.fullName}).
              Order placement, proforma review, and buying accounts are reserved for verified commercial customers.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3 rounded-sm text-xs text-slate-700 text-left space-y-1">
            <div className="font-semibold text-slate-900 text-[11px] uppercase tracking-wider">
              Management Access:
            </div>
            <div className="text-[11px] text-slate-600">
              • To manage fulfillment, inventory, or quotes, open your designated workspace below.
            </div>
            <div className="text-[11px] text-slate-600">
              • To test order placement and view proformas, switch to a Customer account.
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Link
              href={dest.url}
              className="w-full py-2 bg-amg-navy hover:bg-amg-navy-900 text-white font-bold rounded-sm text-xs transition-colors flex items-center justify-center space-x-1.5 shadow-sm"
            >
              <span>Go to {dest.title}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              type="button"
              onClick={() => switchRole('customer')}
              className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-sm text-xs transition-colors flex items-center justify-center space-x-1.5 shadow-sm"
            >
              <Building2 className="w-4 h-4" />
              <span>Switch to Customer Persona (MIDROC Corporate)</span>
            </button>
          </div>

          <div className="text-[10px] text-slate-400 font-mono">
            Auto-navigating to your workspace in 2 seconds...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* 1. CORPORATE PROCUREMENT THEME HEADER (AMG Heritage Navy & Crimson) */}
      <div className="bg-gradient-to-r from-amg-navy to-amg-navy-950 text-white px-4 sm:px-6 py-6 border-b border-amg-navy-900 shadow-md">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 bg-amg-red text-white font-extrabold uppercase rounded-sm text-[10px] tracking-wider flex items-center space-x-1 shadow-sm">
                  <Building2 className="w-3 h-3" />
                  <span>Tier 1: Corporate B2B Procurement Desk</span>
                </span>
                <span className="text-slate-300 font-mono text-[11px]">
                  TIN: {currentUser.tinNumber || '0019283746'}
                </span>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white">
                Buyer Procurement & Quotation Review Desk
              </h1>
              <p className="text-xs text-slate-300 max-w-2xl">
                Authorized purchasing portal for <strong>{currentUser.companyName || currentUser.fullName}</strong>. Review formal engineering quotations, inspect revision versioning, track delivery progress, and generate bank-grade proforma invoices.
              </p>
            </div>

            {/* Corporate Entity Card */}
            <div className="bg-amg-navy-900/90 border border-amg-navy-700 p-3 rounded-sm text-right shrink-0">
              <div className="text-[10px] uppercase font-bold text-slate-400">Procuring Entity</div>
              <div className="text-sm font-bold text-white mt-0.5">
                {currentUser.companyName || currentUser.fullName}
              </div>
              <div className="text-[11px] text-emerald-400 font-mono mt-0.5">
                ERCA Tax Compliant • Corporate Credit Tier A
              </div>
            </div>
          </div>

          {/* Role Boundary Notice */}
          {!isCustomer && (
            <div className="bg-blue-950/70 border border-blue-600/60 p-3 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-blue-200 text-xs">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-blue-300 shrink-0 mt-0.5" />
                <div>
                  <strong>Role Perspective Notice:</strong> Viewing buyer procurement workspace as <strong>{currentUser.role}</strong>.
                </div>
              </div>
              <button
                type="button"
                onClick={() => switchRole('customer')}
                className="px-3 py-1.5 bg-amg-red hover:bg-red-800 text-white font-bold text-xs rounded-sm transition-colors shrink-0 flex items-center space-x-1"
              >
                <span>Switch to Corporate Buyer Persona</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. BODY CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-xs">
        {approvalMessage && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-3.5 rounded-sm flex items-center space-x-2 font-semibold text-xs shadow-sm">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{approvalMessage}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-slate-300 space-x-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('quotes')}
            className={`px-4 py-2.5 font-bold transition-all border-b-2 -mb-px text-xs shrink-0 ${
              activeTab === 'quotes'
                ? 'border-amg-red text-amg-red bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            My Engineering RFQ Inquiries ({myQuotes.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2.5 font-bold transition-all border-b-2 -mb-px text-xs shrink-0 ${
              activeTab === 'orders'
                ? 'border-amg-red text-amg-red bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Direct Purchase Orders ({myOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('wishlist')}
            className={`px-4 py-2.5 font-bold transition-all border-b-2 -mb-px text-xs shrink-0 ${
              activeTab === 'wishlist'
                ? 'border-amg-red text-amg-red bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Saved Wishlist ({wishlistProducts.length})
          </button>
          <button
            onClick={() => setActiveTab('addresses')}
            className={`px-4 py-2.5 font-bold transition-all border-b-2 -mb-px text-xs shrink-0 ${
              activeTab === 'addresses'
                ? 'border-amg-red text-amg-red bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Delivery Site Addresses ({addresses.length})
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2.5 font-bold transition-all border-b-2 -mb-px text-xs shrink-0 ${
              activeTab === 'profile'
                ? 'border-amg-red text-amg-red bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Tax & Legal TIN Credentials
          </button>
        </div>

        {/* TAB 1: QUOTES */}
        {activeTab === 'quotes' && (
          <div className="space-y-6">
            {myQuotes.map((q) => (
              <div
                key={q.id}
                className="bg-white border border-slate-300 rounded-sm shadow-crisp p-5 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-amg-red text-[11px]">
                        {q.quoteNumber} • {q.subsidiaryName}
                      </span>
                      <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 font-mono text-[10px] font-bold rounded-sm">
                        Rev v{q.currentVersion || 1}
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                      {q.projectTitle}
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-sm font-bold text-[10px] uppercase self-start sm:self-auto">
                    Status: {q.status.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Specs and Official Quotation Notes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500">
                      Your Structural Specification Request:
                    </span>
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-sm font-mono text-[11px] text-slate-700 whitespace-pre-line leading-relaxed">
                      {q.customerRequirements}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500">
                      Sales Engineer Official Quotation Terms:
                    </span>
                    <div className="bg-amg-navy-50/70 border border-amg-navy-200 p-3 rounded-sm text-[11px] text-slate-800 leading-relaxed">
                      <p className="font-medium">
                        {q.agentQuotationNotes || 'Engineering review currently in progress by technical team.'}
                      </p>
                      {q.assignedAgentName && (
                        <div className="text-[10px] text-amg-navy font-semibold mt-2">
                          Assigned Lead Engineer: {q.assignedAgentName}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* REVISION HISTORY AUDIT ACCORDION */}
                {q.revisions && q.revisions.length > 0 && (
                  <div className="border border-slate-200 rounded-sm bg-slate-50 p-3 space-y-2">
                    <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px] flex items-center space-x-1.5">
                      <History className="w-3.5 h-3.5 text-amg-navy" />
                      <span>Quotation Revision Version History ({q.revisions.length} Revisions Logged)</span>
                    </div>
                    <div className="space-y-1.5">
                      {q.revisions.map((rev) => (
                        <div
                          key={rev.version}
                          className="bg-white border border-slate-200 p-2.5 rounded-sm flex flex-col sm:flex-row justify-between items-start sm:items-center text-[11px] gap-2"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-slate-900 font-mono">Revision v{rev.version}</span>
                              <span className="text-slate-400 font-mono text-[10px]">
                                {new Date(rev.timestamp).toLocaleDateString()}
                              </span>
                              <span className="text-[10px] text-slate-500">by {rev.changedBy}</span>
                            </div>
                            <p className="text-slate-600 text-[10px] italic">{rev.notes}</p>
                          </div>
                          <div className="font-mono font-bold text-amg-navy text-right">
                            ETB {rev.quotedTotalEtb.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Price Matrix Review & Action Controls */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">
                      Official Quoted Total (ETB)
                    </span>
                    <div className="text-xl font-extrabold font-mono text-amg-navy">
                      ETB {(q.finalQuotedTotalEtb || q.estimatedTotalEtb || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    {q.quoteValidUntil && (
                      <span className="text-[10px] text-slate-500">
                        Price lock guaranteed through: <strong className="font-mono text-slate-800">{q.quoteValidUntil}</strong>
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Live Negotiation Chat Button (SRS 4.5) */}
                    <button
                      type="button"
                      onClick={() => handleOpenChat(q)}
                      className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-sm transition-colors flex items-center space-x-1.5 shadow-sm"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Negotiate with Engineer</span>
                    </button>

                    {/* Official Proforma Invoice Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProformaQuote(q);
                        setSelectedProformaOrder(null);
                        setIsProformaOpen(true);
                      }}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold text-xs rounded-sm transition-colors flex items-center space-x-1.5"
                    >
                      <Printer className="w-3.5 h-3.5 text-amg-navy" />
                      <span>Bank Proforma Invoice</span>
                    </button>

                    {q.status === 'draft_quote_issued' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenRevisionModal(q.id)}
                          className="px-3.5 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-sm transition-colors"
                        >
                          Request Revision (v{(q.currentVersion || 1) + 1})
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApproveQuote(q.id)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-sm transition-colors flex items-center space-x-1.5 shadow-sm"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Accept & Authorize Contract</span>
                        </button>
                      </>
                    )}
                    {q.status === 'quote_approved' && (
                      <span className="px-3.5 py-2 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-sm flex items-center space-x-1.5">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span>Quotation Authorized & In Production Queue</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 2: ORDERS (STREAM A) */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {myOrders.map((ord) => (
              <div
                key={ord.id}
                className="bg-white border border-slate-300 rounded-sm shadow-crisp p-5 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
                  <div>
                    <span className="font-mono font-bold text-amg-navy text-[11px] block">
                      {ord.orderNumber}
                    </span>
                    <div className="text-slate-500 text-[11px]">
                      Fulfillment Hub: <strong className="text-slate-800">{ord.fulfillmentBranchName}</strong> • Delivery: <strong className="capitalize">{ord.deliveryType.replace('_', ' ')}</strong>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-sm font-bold text-[10px] uppercase">
                      {ord.status.replace(/_/g, ' ')}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProformaOrder(ord);
                        setSelectedProformaQuote(null);
                        setIsProformaOpen(true);
                      }}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-amg-navy hover:text-white border border-slate-300 rounded-sm font-bold text-[10px] text-slate-700 transition-colors flex items-center space-x-1"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Proforma / VAT Receipt</span>
                    </button>
                  </div>
                </div>

                {/* Delivery Progress Stepper */}
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                    Fulfillment Milestone Pipeline:
                  </span>
                  <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-semibold">
                    <div className="bg-emerald-100 text-emerald-800 p-1.5 rounded-sm">
                      1. Payment Cleared
                    </div>
                    <div className="bg-emerald-100 text-emerald-800 p-1.5 rounded-sm">
                      2. Warehouse Staged
                    </div>
                    <div className="bg-blue-100 text-blue-800 p-1.5 rounded-sm">
                      3. Dispatch / Transit
                    </div>
                    <div className="bg-slate-200 text-slate-600 p-1.5 rounded-sm">
                      4. Gate Handover
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-1 text-xs">
                  {ord.items.map((i) => (
                    <div key={i.id} className="flex justify-between py-1 border-b border-slate-100">
                      <span className="font-medium text-slate-800">{i.quantity}x {i.productName} ({i.sku})</span>
                      <span className="font-mono font-bold">ETB {i.totalPriceEtb.toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-[11px] text-slate-500">
                    Payment Gateway: <strong className="uppercase font-mono text-slate-700">{ord.paymentMethod}</strong>
                  </span>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase block">Total Paid (Incl. 15% VAT)</span>
                    <span className="text-base font-extrabold font-mono text-amg-navy">
                      ETB {ord.totalAmountEtb.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB: WISHLIST */}
        {activeTab === 'wishlist' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                Bookmarked Industrial Products & Engineering Items ({wishlistProducts.length})
              </h2>
            </div>

            {wishlistProducts.length === 0 ? (
              <div className="bg-white border border-slate-300 rounded-sm p-8 text-center space-y-2">
                <p className="text-slate-600 font-medium">Your project wishlist is currently empty.</p>
                <p className="text-slate-500 text-[11px]">
                  Browse the multi-subsidiary catalog and click the bookmark/heart icon on any industrial product.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {wishlistProducts.map((p: any) => (
                  <div
                    key={p.id}
                    className="bg-white border border-slate-300 rounded-sm p-4 space-y-3 flex flex-col justify-between shadow-sm"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                          {p.subsidiaryName}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleWishlist(p)}
                          className="text-red-600 hover:underline text-[10px] font-bold"
                        >
                          Remove
                        </button>
                      </div>
                      <h4 className="font-bold text-slate-900 text-xs leading-snug">{p.name}</h4>
                      <p className="text-slate-500 font-mono text-[11px]">SKU: {p.sku}</p>
                      <div className="text-amg-navy font-mono font-bold text-sm">
                        {p.unitPriceEtb > 0
                          ? `ETB ${p.unitPriceEtb.toLocaleString()} / ${p.unitMeasurement}`
                          : 'Custom Quote via RFQ'}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex gap-2">
                      {p.transactionStream === 'direct_checkout' ? (
                        <button
                          type="button"
                          onClick={() => addToCart(p, 1)}
                          className="flex-1 py-1.5 bg-amg-navy hover:bg-amg-navy-900 text-white font-bold text-xs rounded-sm transition-colors"
                        >
                          Add to Order
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openRfq(p)}
                          className="flex-1 py-1.5 bg-amg-red hover:bg-red-800 text-white font-bold text-xs rounded-sm transition-colors"
                        >
                          Request RFQ
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: DELIVERY ADDRESSES */}
        {activeTab === 'addresses' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                Registered Factory & Construction Site Delivery Locations ({addresses.length})
              </h2>
              <button
                type="button"
                onClick={() => setIsAddingAddress(!isAddingAddress)}
                className="px-3 py-1.5 bg-amg-navy text-white font-bold text-xs rounded-sm hover:bg-amg-navy-900 transition-colors"
              >
                {isAddingAddress ? 'Cancel' : '+ Add New Construction Site'}
              </button>
            </div>

            {isAddingAddress && (
              <form onSubmit={handleAddAddress} className="bg-white border border-slate-300 p-4 rounded-sm space-y-3 max-w-xl">
                <h3 className="font-bold text-xs text-slate-900">Add Project Site Coordinates / Address</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Site / Depot Title</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Hawassa Industrial Park Gate 2"
                      value={newAddressTitle}
                      onChange={(e) => setNewAddressTitle(e.target.value)}
                      className="w-full border border-slate-300 px-2.5 py-1.5 text-xs rounded-sm focus:border-amg-navy outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">City / Region Hub</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Hawassa, Sidama"
                      value={newAddressCity}
                      onChange={(e) => setNewAddressCity(e.target.value)}
                      className="w-full border border-slate-300 px-2.5 py-1.5 text-xs rounded-sm focus:border-amg-navy outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Detailed Road / Plot Coordinates</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Plot 18, Commercial Freight Berth, Gate 3"
                    value={newAddressDetails}
                    onChange={(e) => setNewAddressDetails(e.target.value)}
                    className="w-full border border-slate-300 px-2.5 py-1.5 text-xs rounded-sm focus:border-amg-navy outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Site Contact Phone</label>
                  <input
                    required
                    type="text"
                    value={newAddressPhone}
                    onChange={(e) => setNewAddressPhone(e.target.value)}
                    className="w-full border border-slate-300 px-2.5 py-1.5 text-xs rounded-sm focus:border-amg-navy outline-none"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-amg-navy text-white font-bold text-xs rounded-sm hover:bg-amg-navy-900"
                  >
                    Save Site Location
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="bg-white border border-slate-300 rounded-sm p-4 space-y-2 shadow-sm"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs text-slate-900">{addr.title}</span>
                    {addr.isDefault && (
                      <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-sm">
                        Default Delivery Site
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 text-xs">{addr.detailedAddress}, {addr.city}</p>
                  <div className="text-[11px] text-slate-500 flex justify-between pt-1 border-t border-slate-100">
                    <span>Contact: {addr.recipientName}</span>
                    <span className="font-mono">{addr.phone}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: PROFILE */}
        {activeTab === 'profile' && (
          <div className="bg-white border border-slate-300 rounded-sm shadow-crisp p-5 space-y-4 max-w-2xl">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Corporate Taxpayer Identification (ERCA Compliant)
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Registered Corporate Legal Entity:
                </label>
                <input
                  type="text"
                  readOnly
                  value={currentUser.companyName || 'MIDROC Construction Ethiopia PLC'}
                  className="w-full border border-slate-300 bg-slate-50 px-3 py-2 rounded-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Tax Identification Number (TIN):
                </label>
                <input
                  type="text"
                  readOnly
                  value={currentUser.tinNumber || '0019283746'}
                  className="w-full border border-slate-300 bg-slate-50 px-3 py-2 rounded-sm font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Authorized Procurement Officer:
                </label>
                <input
                  type="text"
                  readOnly
                  value={`${currentUser.fullName} (${currentUser.email})`}
                  className="w-full border border-slate-300 bg-slate-50 px-3 py-2 rounded-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* Modal: Request Technical Revision */}
        {revisionQuoteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white border border-slate-300 rounded-sm shadow-modal max-w-md w-full p-5 space-y-4 text-xs">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <h4 className="font-bold text-slate-900 text-sm">
                  Request Specification / Pricing Revision
                </h4>
                <button
                  onClick={() => setRevisionQuoteId(null)}
                  className="text-slate-400 hover:text-slate-700 font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmitRevision} className="space-y-3">
                <p className="text-slate-600 text-xs leading-relaxed">
                  Provide instructions to the dedicated sales engineering team (e.g. adjust steel thickness, split delivery into multiple plant shipments, or request alternate commercial terms):
                </p>

                <textarea
                  required
                  rows={4}
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  placeholder="Detail changes required for the next official revision..."
                  className="w-full border border-slate-300 p-2.5 rounded-sm outline-none focus:border-amg-navy text-xs font-mono"
                />

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setRevisionQuoteId(null)}
                    className="px-3 py-1.5 border border-slate-300 text-slate-700 font-semibold rounded-sm hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-amg-navy hover:bg-amg-navy-900 text-white font-bold rounded-sm shadow-sm"
                  >
                    Dispatch Revision Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Bank Proforma Invoice Modal */}
        <ProformaInvoiceModal
          isOpen={isProformaOpen}
          quote={selectedProformaQuote}
          order={selectedProformaOrder}
          onClose={() => setIsProformaOpen(false)}
        />

        {/* Real-Time Engineering Negotiation Chat Modal (SRS 4.5) */}
        {chatQuote && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white border border-slate-300 rounded-sm shadow-modal max-w-lg w-full flex flex-col h-[520px] overflow-hidden text-xs">
              {/* Header */}
              <div className="px-5 py-3.5 bg-[#0B1528] text-white flex items-center justify-between border-b border-sky-950">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-sky-400" />
                  <div>
                    <h3 className="font-bold text-xs uppercase">
                      Engineering Negotiation Channel: {chatQuote.quoteNumber}
                    </h3>
                    <span className="text-[10px] text-sky-300 block font-normal">
                      Assigned Lead Engineer: {chatQuote.assignedAgentName || 'AMG Senior Technical Sales Specialist'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setChatQuote(null)}
                  className="text-slate-400 hover:text-white font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                {isChatLoading ? (
                  <div className="text-center py-8 text-slate-500 font-mono">
                    Connecting to encrypted sales engineering channel...
                  </div>
                ) : chatMessages.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    No negotiation messages logged yet. Send a message to inquire about delivery schedules, technical revisions, or commercial terms.
                  </div>
                ) : (
                  chatMessages.map((msg: any) => {
                    const isMe = msg.senderRole === 'customer';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <span className="text-[10px] font-bold text-slate-500 mb-0.5">
                          {msg.senderName} ({msg.senderRole === 'customer' ? 'Buyer' : 'Sales Engineer'})
                        </span>
                        <div
                          className={`max-w-[85%] p-3 rounded-sm text-xs leading-relaxed ${
                            isMe
                              ? 'bg-amg-navy text-white rounded-br-none'
                              : 'bg-white border border-slate-300 text-slate-800 rounded-bl-none shadow-sm'
                          }`}
                        >
                          {msg.message}
                        </div>
                        <span className="text-[9px] font-mono text-slate-400 mt-0.5">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Input Box */}
              <form onSubmit={handleSendPortalChatMessage} className="p-3 bg-white border-t border-slate-200 flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Type inquiry to assigned sales engineer..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 border border-slate-300 px-3 py-2 text-xs rounded-sm focus:border-amg-navy outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-amg-navy hover:bg-amg-navy-900 text-white font-bold text-xs rounded-sm transition-colors flex items-center space-x-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
