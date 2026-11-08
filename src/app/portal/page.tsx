'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { INITIAL_ORDERS, INITIAL_QUOTES } from '@/lib/constants';
import { Order, Quote } from '@/types';
import { ProformaInvoiceModal } from '@/components/modals/ProformaInvoiceModal';
import { QrCodeView } from '@/components/ui/QrCodeView';
import UserProfileView from '@/components/profile/UserProfileView';
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
  X,
  QrCode,
  RotateCcw,
  Tag,
  Sliders,
  Percent,
  TrendingDown,
  Copy,
  CreditCard,
  Check,
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

  // Price Negotiation & Counter-Offer State (SRS 4.1 / 4.5)
  const [negotiatingQuote, setNegotiatingQuote] = useState<Quote | null>(null);
  const [counterDiscountPercent, setCounterDiscountPercent] = useState<number>(10);
  const [counterTargetPrice, setCounterTargetPrice] = useState<number>(0);
  const [counterReason, setCounterReason] = useState<string>('Budget limit constraint');
  const [isSubmittingCounter, setIsSubmittingCounter] = useState(false);

  // CBE Bank Payment & Settlement Modal State
  const [payingQuote, setPayingQuote] = useState<Quote | null>(null);
  const [cbeFtCode, setCbeFtCode] = useState<string>('');
  const [cbePayerAccount, setCbePayerAccount] = useState<string>('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [isCopiedAccount, setIsCopiedAccount] = useState(false);

  const router = useRouter();
  const isCustomer = activeRole === 'customer';

  const roleRedirectMap: Record<string, { url: string; title: string }> = {
    super_admin: { url: '/admin', title: 'Corporate Super Admin Portal' },
    branch_admin: { url: '/branch-admin', title: 'Branch Depot Admin Portal' },
    sales_agent: { url: '/agent', title: 'Sales Engineering Workspace' },
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam && ['quotes', 'orders', 'wishlist', 'addresses', 'profile'].includes(tabParam)) {
        setActiveTab(tabParam as any);
      }
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'profile') return;
    if (!isCustomer && roleRedirectMap[activeRole]) {
      const timer = setTimeout(() => {
        router.push(roleRedirectMap[activeRole].url);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isCustomer, activeRole, router, activeTab]);

  const [portalOrders, setPortalOrders] = useState<Order[]>(INITIAL_ORDERS);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/orders');
        let combined: Order[] = [];
        if (res.ok) {
          const data = await res.json();
          if (data.orders && Array.isArray(data.orders)) {
            combined = [...data.orders];
          }
        }
        if (typeof window !== 'undefined') {
          if (localStorage.getItem('amg_data_version') !== 'v2') {
            localStorage.removeItem('amg_live_quotes');
            localStorage.removeItem('amg_live_orders');
            localStorage.setItem('amg_data_version', 'v2');
          }
          const local = localStorage.getItem('amg_live_orders');
          if (local) {
            try {
              const parsed = JSON.parse(local);
              if (Array.isArray(parsed)) {
                for (const p of parsed) {
                  const idx = combined.findIndex((c) => c.id === p.id || c.orderNumber === p.orderNumber);
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
        setPortalOrders(combined);
      } catch (e) {}
    };

    fetchOrders();
    const handleUpdate = () => fetchOrders();
    window.addEventListener('amg_orders_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('amg_orders_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        let combined: Quote[] = [...INITIAL_QUOTES];

        // 1. Fetch live quotes from server API
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

  // Real-time Chat Live Polling (every 2.5s while chat modal is active)
  useEffect(() => {
    if (!chatQuote) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/chat?quoteId=${encodeURIComponent(chatQuote.id)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.messages)) {
            setChatMessages(data.messages);
            setQuotesList((prev) =>
              prev.map((q) =>
                q.id === chatQuote.id || q.quoteNumber === chatQuote.quoteNumber
                  ? { ...q, messages: data.messages }
                  : q
              )
            );
          }
        }
      } catch (err) {}
    }, 2500);

    return () => clearInterval(interval);
  }, [chatQuote?.id, chatQuote?.quoteNumber]);

  // Strictly isolate orders and quotes to the authenticated user ID
  const myOrders = portalOrders.filter((o) => o.customerId === currentUser.id);
  const myQuotes = quotesList.filter((q) => q.customerId === currentUser.id);

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

  const handleOpenPaymentModal = (q: Quote) => {
    setPayingQuote(q);
    setCbeFtCode(q.cbeFtReference || '');
    setCbePayerAccount(q.cbePayerAccount || currentUser.companyName || currentUser.fullName || '');
    setIsCopiedAccount(false);
  };

  const handleApproveQuote = async (quoteId: string) => {
    const target = quotesList.find((q) => q.id === quoteId);
    setQuotesList((prev) =>
      prev.map((q) => (q.id === quoteId ? { ...q, status: 'quote_approved' } : q))
    );

    if (typeof window !== 'undefined') {
      try {
        const local = JSON.parse(localStorage.getItem('amg_live_quotes') || '[]');
        const updated = local.map((q: any) =>
          q.id === quoteId ? { ...q, status: 'quote_approved' } : q
        );
        localStorage.setItem('amg_live_quotes', JSON.stringify(updated));
        window.dispatchEvent(new Event('amg_quotes_updated'));
      } catch (e) {}
    }

    try {
      await fetch(`/api/quotes/${encodeURIComponent(quoteId)}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser.role,
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          targetStatus: 'quote_approved',
          reason: 'Quotation accepted and authorized by procurement officer.',
        }),
      });
    } catch (e) {}

    setApprovalMessage('Official quotation accepted & contract authorized! Please submit your CBE bank transfer reference to begin fulfillment.');
    setTimeout(() => setApprovalMessage(null), 5000);

    if (target) {
      handleOpenPaymentModal({ ...target, status: 'quote_approved' });
    }
  };

  const handleSubmitCbePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingQuote || !cbeFtCode.trim()) {
      alert('Please enter a valid CBE Bank FT Reference Number');
      return;
    }
    setIsSubmittingPayment(true);
    const ftUpper = cbeFtCode.trim().toUpperCase();
    const subtotal = payingQuote.finalQuotedTotalEtb || payingQuote.estimatedTotalEtb || 0;
    const tax = subtotal * 0.15;
    const totalAmount = subtotal + tax;

    let targetOrderNumber = payingQuote.convertedOrderNumber || '';
    let targetOrderId = '';

    // 1. Convert quote to firm order via API if needed
    try {
      const convertRes = await fetch('/api/quotes/convert-to-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'sales_agent',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          quoteId: payingQuote.id,
          fulfillmentBranchId: (payingQuote as any).fulfillmentBranchId || 'a1111111-1111-1111-1111-111111111111',
          deliveryType: 'branch_pickup',
          deliveryAddress: payingQuote.deliveryDestination,
        }),
      });
      const convertData = await convertRes.json();
      if (convertData?.order) {
        targetOrderNumber = convertData.order.orderNumber;
        targetOrderId = convertData.order.id;
      }
    } catch (e) {}

    if (!targetOrderNumber) {
      targetOrderNumber = `AMG-ORD-FROM-RFQ-${Math.floor(1000 + Math.random() * 9000)}`;
      targetOrderId = `ord-rfq-${Date.now()}`;
    }

    const firmOrder: Order = {
      id: targetOrderId,
      orderNumber: targetOrderNumber,
      customerId: currentUser.id,
      customerName: currentUser.fullName,
      customerCompany: currentUser.companyName,
      fulfillmentBranchId: 'a1111111-1111-1111-1111-111111111111',
      fulfillmentBranchName: 'Addis Ababa Central Hub',
      status: 'payment_pending',
      deliveryType: 'branch_pickup',
      deliveryAddress: payingQuote.deliveryDestination,
      subtotalEtb: subtotal,
      taxEtb: tax,
      totalAmountEtb: totalAmount,
      paymentMethod: 'cbe_transfer',
      cbeFtReference: ftUpper,
      cbePayerAccount: cbePayerAccount.trim(),
      paymentSubmittedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      items: payingQuote.items.map((i, idx) => ({
        id: `ord-item-${idx + 1}`,
        productId: i.productId || `custom-prod-${idx + 1}`,
        productName: i.customProductName,
        sku: `AMG-RFQ-${i.customProductName.substring(0, 10).replace(/\\s+/g, '-').toUpperCase()}`,
        quantity: i.quantity,
        unitPriceEtb: i.quotedUnitPriceEtb || (subtotal / Math.max(1, i.quantity)),
        totalPriceEtb: i.quotedTotalPriceEtb || subtotal,
      })),
    };

    // 2. Submit CBE FT reference to payments API
    try {
      await fetch('/api/payments/cbe-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: targetOrderId,
          orderNumber: targetOrderNumber,
          cbeFtReference: ftUpper,
          cbePayerAccount: cbePayerAccount.trim(),
          order: firmOrder,
        }),
      });
    } catch (e) {}

    // 3. Post audit chat message to collaboration thread
    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteId: payingQuote.id,
          senderId: currentUser.id,
          senderName: currentUser.fullName,
          senderRole: currentUser.role,
          message: `💳 [CBE BANK PAYMENT SUBMITTED]: Buyer submitted CBE bank transfer transaction reference ${ftUpper} for ETB ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}. Awaiting Finance verification against core bank statement.`,
        }),
      });
    } catch (e) {}

    // 4. Update quote and order in state and local storage
    const updatedQuote: Quote = {
      ...payingQuote,
      status: 'payment_processing',
      cbeFtReference: ftUpper,
      cbePayerAccount: cbePayerAccount.trim(),
      paymentSubmittedAt: new Date().toISOString(),
      convertedOrderNumber: targetOrderNumber,
    };

    setQuotesList((prev) =>
      prev.map((q) =>
        q.id === payingQuote.id || q.quoteNumber === payingQuote.quoteNumber ? updatedQuote : q
      )
    );

    setPortalOrders((prev) => [firmOrder, ...prev.filter((o) => o.orderNumber !== targetOrderNumber)]);

    if (typeof window !== 'undefined') {
      try {
        const localQuotes = JSON.parse(localStorage.getItem('amg_live_quotes') || '[]');
        const updatedQ = localQuotes.map((item: any) =>
          item.id === payingQuote.id || item.quoteNumber === payingQuote.quoteNumber ? updatedQuote : item
        );
        localStorage.setItem('amg_live_quotes', JSON.stringify(updatedQ));
        window.dispatchEvent(new Event('amg_quotes_updated'));

        const localOrders = JSON.parse(localStorage.getItem('amg_live_orders') || '[]');
        localOrders.unshift(firmOrder);
        localStorage.setItem('amg_live_orders', JSON.stringify(localOrders));
        window.dispatchEvent(new Event('amg_orders_updated'));
      } catch (e) {}
    }

    setIsSubmittingPayment(false);
    setPayingQuote(null);
    setApprovalMessage(`CBE Payment Reference ${ftUpper} submitted! AMG Finance Officer is auditing the CBE statement.`);
    setTimeout(() => setApprovalMessage(null), 6000);
  };

  const handleOpenRevisionModal = (quoteId: string) => {
    setRevisionQuoteId(quoteId);
    setRevisionNotes('');
  };

  const handleSubmitRevision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionQuoteId) return;

    let updatedList: Quote[] = [];
    setQuotesList((prev) => {
      updatedList = prev.map((q) => {
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
      });
      return updatedList;
    });

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('amg_live_quotes', JSON.stringify(updatedList));
        window.dispatchEvent(new Event('amg_quotes_updated'));
      } catch (e) {}
    }

    setRevisionQuoteId(null);
    setApprovalMessage('Technical revision request dispatched to assigned sales engineer.');
    setTimeout(() => setApprovalMessage(null), 4000);
  };

  // Price Negotiation & Counter-Offer Logic
  const handleOpenNegotiation = (q: Quote) => {
    const baseTotal = q.finalQuotedTotalEtb || q.estimatedTotalEtb || 0;
    const defaultDiscount = 10;
    const target = Math.round(baseTotal * (1 - defaultDiscount / 100));
    setNegotiatingQuote(q);
    setCounterDiscountPercent(defaultDiscount);
    setCounterTargetPrice(target);
    setCounterReason('Commercial budget ceiling limitation - requesting 10% volume discount to finalize contract');
  };

  const handleApplyDiscountPercent = (percent: number) => {
    if (!negotiatingQuote) return;
    const baseTotal = negotiatingQuote.finalQuotedTotalEtb || negotiatingQuote.estimatedTotalEtb || 0;
    setCounterDiscountPercent(percent);
    setCounterTargetPrice(Math.round(baseTotal * (1 - percent / 100)));
  };

  const handleCustomTargetPriceChange = (val: number) => {
    if (!negotiatingQuote) return;
    const baseTotal = negotiatingQuote.finalQuotedTotalEtb || negotiatingQuote.estimatedTotalEtb || 0;
    setCounterTargetPrice(val);
    if (baseTotal > 0) {
      const pct = Math.max(0, Math.min(90, Math.round(((baseTotal - val) / baseTotal) * 100)));
      setCounterDiscountPercent(pct);
    }
  };

  const handleSubmitCounterOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!negotiatingQuote || !counterTargetPrice) return;
    setIsSubmittingCounter(true);

    const basePrice = negotiatingQuote.finalQuotedTotalEtb || negotiatingQuote.estimatedTotalEtb || 0;
    const savings = Math.max(0, basePrice - counterTargetPrice);

    const counterPayload = {
      targetPriceEtb: counterTargetPrice,
      originalPriceEtb: basePrice,
      discountPercent: counterDiscountPercent,
      savingsEtb: savings,
      reason: counterReason,
      requestedBy: currentUser.fullName,
      requestedAt: new Date().toISOString(),
      status: 'pending' as const,
    };

    const updatedQuote: Quote = {
      ...negotiatingQuote,
      pendingCounterOffer: counterPayload,
    };

    setQuotesList((prev) =>
      prev.map((q) =>
        q.id === negotiatingQuote.id || q.quoteNumber === negotiatingQuote.quoteNumber
          ? updatedQuote
          : q
      )
    );

    if (typeof window !== 'undefined') {
      try {
        const local = JSON.parse(localStorage.getItem('amg_live_quotes') || '[]');
        const updated = local.map((q: any) =>
          q.id === negotiatingQuote.id || q.quoteNumber === negotiatingQuote.quoteNumber
            ? updatedQuote
            : q
        );
        localStorage.setItem('amg_live_quotes', JSON.stringify(updated));
        window.dispatchEvent(new Event('amg_quotes_updated'));
      } catch (e) {}
    }

    try {
      await fetch('/api/quotes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteId: negotiatingQuote.id,
          action: 'propose_counter_offer',
          counterOffer: counterPayload,
        }),
      });
    } catch (e) {}

    setIsSubmittingCounter(false);
    setNegotiatingQuote(null);
    setApprovalMessage(`Price reduction proposal submitted! Sales engineer notified to formulate Revision v${(negotiatingQuote.currentVersion || 1) + 1}.`);
    setTimeout(() => setApprovalMessage(null), 5000);

    // Open chat channel immediately with the updated quote
    handleOpenChat(updatedQuote);
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

    const updatedMessages = [...chatMessages, newMsg];
    setChatMessages(updatedMessages);

    // Sync into quotesList
    setQuotesList((prev) =>
      prev.map((q) =>
        q.id === chatQuote.id || q.quoteNumber === chatQuote.quoteNumber
          ? { ...q, messages: updatedMessages }
          : q
      )
    );

    // Sync into client localStorage and broadcast update
    if (typeof window !== 'undefined') {
      try {
        const local = JSON.parse(localStorage.getItem('amg_live_quotes') || '[]');
        const updated = local.map((q: any) =>
          q.id === chatQuote.id || q.quoteNumber === chatQuote.quoteNumber
            ? { ...q, messages: updatedMessages }
            : q
        );
        localStorage.setItem('amg_live_quotes', JSON.stringify(updated));
        window.dispatchEvent(new Event('amg_quotes_updated'));
      } catch (e) {}
    }

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

  if (!isCustomer && activeTab !== 'profile') {
    const dest = roleRedirectMap[activeRole] || { url: '/admin', title: 'Management Workspace' };
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4 bg-[#FAFAFA] dark:bg-[#0B0B0C]">
        <div className="max-w-md w-full bg-white dark:bg-[#141416] border border-slate-200 dark:border-[#2A2A2E] rounded-3xl p-8 shadow-2xl text-center space-y-5">
          <div className="w-14 h-14 bg-slate-950 dark:bg-[#1A1A1D] border border-slate-800 dark:border-[#2A2A2E] text-[#C6F432] rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-serif font-black tracking-tight text-slate-950 dark:text-white">
              Customer Orders Portal: Role Restricted
            </h2>
            <p className="text-xs text-slate-600 dark:text-[#A1A1AA] leading-relaxed">
              You are signed in as <strong className="text-slate-950 dark:text-white capitalize font-mono">{activeRole.replace('_', ' ')}</strong> ({currentUser.fullName}).
              Order placement, proforma review, and buying accounts are reserved for verified commercial customers.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-[#0E0E10] border border-slate-200 dark:border-[#222225] p-3.5 rounded-2xl text-xs text-slate-700 dark:text-slate-300 text-left space-y-1.5">
            <div className="font-bold text-slate-900 dark:text-white text-[11px] uppercase tracking-wider flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C6F432]" />
              <span>Management Access Directive:</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-[#A1A1AA]">
              • To manage fulfillment, inventory, or quotes, open your designated workspace below.
            </div>
            <div className="text-[11px] text-slate-500 dark:text-[#A1A1AA]">
              • To edit your personal profile, tax TIN, or security credentials, open Corporate Profile.
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2.5">
            <Link
              href={dest.url}
              className="w-full py-3 bg-[#C6F432] hover:bg-[#D7F860] text-[#0B0B0C] font-bold rounded-full text-xs transition-all flex items-center justify-center space-x-1.5 shadow-sm"
            >
              <span>Go to {dest.title}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className="w-full py-3 bg-white dark:bg-[#1A1A1D] hover:bg-slate-50 dark:hover:bg-[#222225] text-slate-900 dark:text-white border border-slate-300 dark:border-[#2A2A2E] font-bold rounded-full text-xs transition-colors flex items-center justify-center space-x-1.5 shadow-xs"
            >
              <Building2 className="w-4 h-4 text-[#C6F432]" />
              <span>Open Corporate Profile & Tax Credentials</span>
            </button>
            <button
              type="button"
              onClick={() => switchRole('customer')}
              className="w-full py-2.5 text-slate-600 dark:text-[#A1A1AA] hover:text-slate-900 dark:hover:text-white text-[11px] font-semibold transition-colors"
            >
              Switch to Customer Persona (MIDROC Corporate)
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
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0B0B0C] text-[#0B0B0C] dark:text-white transition-colors pb-20">
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
                  <span className="font-semibold tracking-wide">
                    {currentUser.customerType === 'b2c' ? 'Retail B2C Direct Shopper Desk' : 'Tier 1: Corporate B2B Procurement Desk'}
                  </span>
                  <span className="text-slate-300 dark:text-[#52525B]">|</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#C6F432]/25 dark:bg-[#C6F432]/10 text-emerald-900 dark:text-[#C6F432] border border-[#C6F432]/40">
                    {currentUser.customerType === 'b2c' ? 'Direct Consumer' : `TIN: ${currentUser.tinNumber || '0019283746'}`}
                  </span>
                </div>
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-white/80 dark:bg-[#141416] border border-slate-200/80 dark:border-[#2A2A2E] rounded-full text-[11px] text-slate-600 dark:text-[#A1A1AA] shadow-xs">
                  <Building2 className="w-3.5 h-3.5 text-[#16A34A] dark:text-[#C6F432]" />
                  <span>
                    {currentUser.customerType === 'b2c' ? 'Verified Retail Individual Shopper' : 'ERCA Verified Commercial Buyer'}
                  </span>
                </div>
              </div>

              <h1 className="text-2xl sm:text-4xl font-serif font-black tracking-tight leading-tight text-slate-950 dark:text-white drop-shadow-xs">
                Buyer Procurement &amp; Quotation Review Desk
              </h1>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-[#A1A1AA] font-sans leading-relaxed max-w-2xl font-normal">
                {currentUser.customerType === 'b2c' ? (
                  <>
                    Personal retail purchasing desk for <strong>{currentUser.fullName}</strong>. Track self-service Stream A direct orders, inspect delivery status, and review Telebirr / CBE payment receipts.
                  </>
                ) : (
                  <>
                    Authorized purchasing portal for <strong>{currentUser.companyName || currentUser.fullName}</strong>. Review formal engineering quotations, inspect revision versioning, track delivery progress, and generate bank-grade proforma invoices.
                  </>
                )}
              </p>
            </div>

            {/* Corporate / Retail Entity Persona Card */}
            <div className="flex items-center space-x-3 bg-white/90 dark:bg-[#141416]/90 p-3.5 rounded-2xl border border-slate-200 dark:border-[#2A2A2E] shadow-sm backdrop-blur-md shrink-0">
              <div className="w-10 h-10 rounded-full bg-slate-950 dark:bg-[#1A1A1D] text-[#C6F432] font-bold flex items-center justify-center text-sm border border-slate-800 dark:border-[#2A2A2E] shadow-xs">
                {currentUser.fullName[0]}
              </div>
              <div className="text-left text-xs">
                <div className="text-[10px] uppercase font-bold text-slate-400">
                  {currentUser.customerType === 'b2c' ? 'Personal Account' : 'Procuring Entity'}
                </div>
                <div className="font-bold text-slate-950 dark:text-white leading-tight">
                  {currentUser.companyName || currentUser.fullName}
                </div>
                <div className="text-[10px] text-emerald-900 dark:text-[#C6F432] font-semibold mt-0.5">
                  {currentUser.customerType === 'b2c' ? 'Verified Individual • Direct Pay' : 'ERCA Tax Compliant • Credit Tier A'}
                </div>
              </div>
            </div>
          </div>

          {/* Role Boundary Notice */}
          {!isCustomer && (
            <div className="mt-6 pt-4 border-t border-slate-200/80 dark:border-[#1F1F24] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-blue-900 dark:text-blue-200 text-xs">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-blue-500 shrink-0" />
                <span>
                  <strong>Role Perspective Notice:</strong> Viewing buyer procurement workspace as <strong>{currentUser.role}</strong>.
                </span>
              </div>
              <button
                type="button"
                onClick={() => switchRole('customer')}
                className="px-3.5 py-1.5 bg-[#C6F432] hover:bg-[#D7F860] text-[#0B0B0C] font-bold text-xs rounded-full transition-all shrink-0 flex items-center space-x-1 shadow-sm"
              >
                <span>Switch to Corporate Buyer Persona</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 2. BODY CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-xs">
        {approvalMessage && (
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/60 text-emerald-800 dark:text-emerald-200 p-4 rounded-2xl flex items-center space-x-2 font-semibold text-xs shadow-xs">
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{approvalMessage}</span>
          </div>
        )}

        {/* Navigation Tabs (Super Admin Pill Style) */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          {[
            { id: 'quotes', label: `My Engineering RFQs (${myQuotes.length})` },
            { id: 'orders', label: `Direct Purchase Orders (${myOrders.length})` },
            { id: 'wishlist', label: `Saved Wishlist (${wishlistProducts.length})` },
            { id: 'addresses', label: `Delivery Site Addresses (${addresses.length})` },
            { id: 'profile', label: 'Corporate Profile & Tax Credentials' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 font-semibold transition-all rounded-full whitespace-nowrap text-xs flex items-center space-x-1.5 ${
                  isActive
                    ? 'bg-[#C6F432] text-[#0B0B0C] font-bold shadow-[0_0_12px_rgba(198,244,50,0.25)] border border-[#C6F432]'
                    : 'bg-white dark:bg-[#141416] text-[#71717A] dark:text-[#A1A1AA] border border-[#E4E4E7] dark:border-[#2A2A2E] hover:text-[#0B0B0C] dark:hover:text-white hover:border-[#C6F432]/50'
                }`}
              >
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#0B0B0C]" />}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: QUOTES */}
        {activeTab === 'quotes' && (
          <div className="space-y-6">
            {myQuotes.length === 0 ? (
              <div className="bg-white dark:bg-[#141416] border border-slate-200 dark:border-[#2A2A2E] rounded-3xl p-10 text-center space-y-4 shadow-xs">
                <div className="w-14 h-14 bg-slate-100 dark:bg-[#1A1A1D] text-slate-400 rounded-2xl flex items-center justify-center mx-auto border border-slate-200 dark:border-[#2A2A2E]">
                  <FileText className="w-7 h-7 text-[#16A34A] dark:text-[#C6F432]" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    No Engineering RFQs on Record
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-[#A1A1AA] max-w-md mx-auto">
                    {currentUser.customerType === 'b2c'
                      ? 'You are signed in as Ahmed (Individual Retail Customer). When you need custom architectural steel fabrication, custom roofing, or bulk engineering orders, click below to request a formal quote.'
                      : 'You do not have any active engineering quotations pending technical review or approval.'}
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => openRfq()}
                    className="px-5 py-2.5 bg-[#C6F432] hover:bg-[#D7F860] text-[#0B0B0C] font-bold text-xs rounded-full shadow-sm transition-all"
                  >
                    Request Custom Quote (RFQ)
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#141416] p-4 rounded-2xl border border-slate-200 dark:border-[#2A2A2E] shadow-xs">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-xs">Active Quotation Records</h3>
                    <p className="text-[11px] text-slate-500 dark:text-[#A1A1AA]">Track technical formulation status and approve proforma contract terms.</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => openRfq()}
                      className="px-3.5 py-1.5 bg-[#C6F432] hover:bg-[#D7F860] text-[#0B0B0C] font-bold text-xs rounded-full shadow-xs transition-all flex items-center space-x-1"
                    >
                      <span>+ Request Custom RFQ</span>
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!confirm('Clear all demo test RFQs to start fresh from customer?')) return;
                        try {
                          await fetch('/api/quotes/reset', { method: 'POST' });
                        } catch (e) {}
                        localStorage.removeItem('amg_live_quotes');
                        window.dispatchEvent(new Event('amg_quotes_updated'));
                        setQuotesList([]);
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#1A1A1D] dark:hover:bg-[#222225] border border-slate-300 dark:border-[#2A2A2E] text-slate-600 dark:text-[#A1A1AA] hover:text-rose-600 rounded-full text-xs font-semibold transition-all flex items-center space-x-1"
                      title="Clear test RFQs"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset RFQs</span>
                    </button>
                  </div>
                </div>

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
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-sm flex flex-col justify-between gap-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
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
                        <span>Negotiate / Chat</span>
                      </button>

                      {/* Propose Lower Price / Discount Button */}
                      {q.status === 'draft_quote_issued' && (
                        <button
                          type="button"
                          onClick={() => handleOpenNegotiation(q)}
                          className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-sm transition-colors flex items-center space-x-1.5 shadow-sm"
                        >
                          <Tag className="w-3.5 h-3.5" />
                          <span>{q.pendingCounterOffer?.status === 'pending' ? 'Adjust Counter-Offer' : 'Ask for Lower Price / Discount'}</span>
                        </button>
                      )}

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
                            Request Specs Revision (v{(q.currentVersion || 1) + 1})
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApproveQuote(q.id)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-sm transition-colors flex items-center space-x-1.5 shadow-sm"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>Accept &amp; Authorize Contract</span>
                          </button>
                        </>
                      )}
                      {(q.status === 'quote_approved' || q.status === 'payment_processing') && (
                        <div className="flex flex-wrap items-center gap-2">
                          {q.cbeFtReference ? (
                            <div className="flex items-center gap-2">
                              <span className="px-3.5 py-2 bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs rounded-sm flex items-center space-x-1.5">
                                <Clock className="w-4 h-4 text-amber-700 animate-spin" />
                                <span>CBE Transfer Submitted ({q.cbeFtReference}) • Finance Verifying</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleOpenPaymentModal(q)}
                                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold text-xs rounded-sm transition-colors"
                              >
                                Update FT Ref
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenPaymentModal(q)}
                              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs rounded-sm transition-all flex items-center space-x-2 shadow-md ring-2 ring-emerald-400/40 animate-pulse cursor-pointer"
                            >
                              <Building2 className="w-4 h-4 text-[#C6F432]" />
                              <span>Pay Invoice via CBE Bank Transfer</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Negotiation Status Cards */}
                  {q.pendingCounterOffer && q.pendingCounterOffer.status === 'pending' && (
                    <div className="mt-1 p-3 bg-amber-500/10 border border-amber-500/30 rounded-md text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping shrink-0" />
                        <div>
                          <strong className="font-bold">Price Negotiation In Progress:</strong> Proposed target price{' '}
                          <span className="font-mono font-bold text-amber-800">
                            ETB {q.pendingCounterOffer.targetPriceEtb.toLocaleString()}
                          </span>{' '}
                          (-{q.pendingCounterOffer.discountPercent}% / Save ETB {q.pendingCounterOffer.savingsEtb.toLocaleString()}).
                          <span className="block text-[11px] text-amber-700">Reason: &quot;{q.pendingCounterOffer.reason}&quot;</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenChat(q)}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded text-[11px] shrink-0"
                      >
                        Open Live Chat
                      </button>
                    </div>
                  )}

                  {q.pendingCounterOffer && q.pendingCounterOffer.status === 'accepted' && (
                    <div className="mt-1 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-md text-xs text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <strong className="font-bold">Requested Discount Approved!</strong> Sales engineer accepted your -{q.pendingCounterOffer.discountPercent}% counter-offer. Revision v{q.currentVersion} has been issued at{' '}
                          <span className="font-mono font-bold">ETB {(q.finalQuotedTotalEtb || 0).toLocaleString()}</span>.
                          <span className="block text-[11px] text-emerald-700 mt-0.5">Authorize contract and submit your CBE Bank transfer to initiate manufacturing/dispatch.</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {q.status !== 'quote_approved' && q.status !== 'payment_processing' ? (
                          <button
                            type="button"
                            onClick={() => handleApproveQuote(q.id)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-sm text-xs transition-colors flex items-center space-x-1 shadow-sm"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Accept &amp; Pay via CBE</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenPaymentModal(q)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-sm text-xs transition-colors flex items-center space-x-1 shadow-sm"
                          >
                            <Building2 className="w-3.5 h-3.5 text-[#C6F432]" />
                            <span>{q.cbeFtReference ? 'Update CBE Payment' : 'Pay via CBE Bank Transfer'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ORDERS (STREAM A) */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {myOrders.length === 0 ? (
              <div className="bg-white dark:bg-[#141416] border border-slate-200 dark:border-[#2A2A2E] rounded-3xl p-10 text-center space-y-4 shadow-xs">
                <div className="w-14 h-14 bg-slate-100 dark:bg-[#1A1A1D] text-slate-400 rounded-2xl flex items-center justify-center mx-auto border border-slate-200 dark:border-[#2A2A2E]">
                  <ShoppingCart className="w-7 h-7 text-[#16A34A] dark:text-[#C6F432]" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    No Direct Purchase Orders Yet
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-[#A1A1AA] max-w-md mx-auto">
                    You have not placed any self-service Stream A direct checkout orders yet. Browse our catalog to place your first order.
                  </p>
                </div>
                <div className="pt-2">
                  <Link
                    href="/"
                    className="inline-flex px-5 py-2.5 bg-[#C6F432] hover:bg-[#D7F860] text-[#0B0B0C] font-bold text-xs rounded-full shadow-sm transition-all"
                  >
                    Browse Product Catalog
                  </Link>
                </div>
              </div>
            ) : (
              myOrders.map((ord) => (
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

                {/* Official Depot Gate Clearance Pass Banner */}
                {ord.gatePassCode && (
                  <div className="bg-[#0B0B0C] text-white border-2 border-[#C6F432] p-5 rounded-2xl shadow-xl space-y-3 relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#222225] pb-3">
                      <div className="flex items-center space-x-2 text-[#C6F432]">
                        <QrCode className="w-5 h-5 text-[#C6F432]" />
                        <span className="font-bold text-sm tracking-wide">
                          Official Depot Gate Clearance Pass Issued
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#C6F432] text-[#0B0B0C] w-fit">
                        Authorized for Physical Yard Pickup
                      </span>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-5 bg-[#141416] p-4 rounded-xl border border-[#222225]">
                      {/* Real Visual Scannable QR Code */}
                      <div className="flex flex-col items-center space-y-1.5 shrink-0">
                        <QrCodeView value={ord.gatePassCode} size={130} />
                        <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#C6F432]">
                          Scannable QR Pass
                        </span>
                      </div>

                      {/* Details & Pass Code */}
                      <div className="flex-1 space-y-2 text-left w-full">
                        <div>
                          <span className="text-[10px] text-[#A1A1AA] uppercase tracking-wider block font-semibold">
                            Gate Clearance Pass Code:
                          </span>
                          <div className="flex items-center space-x-2 mt-0.5">
                            <span className="font-mono text-xl sm:text-2xl font-black text-[#C6F432] tracking-widest">
                              {ord.gatePassCode}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(ord.gatePassCode || '');
                                alert(`Gate Pass Code ${ord.gatePassCode} copied to clipboard!`);
                              }}
                              className="px-2.5 py-1 bg-[#222225] hover:bg-[#2A2A2E] text-white text-[10px] font-semibold rounded-md border border-[#333338] transition-colors"
                            >
                              Copy
                            </button>
                          </div>
                        </div>

                        <div className="text-[11px] text-[#A1A1AA] space-y-0.5">
                          <div>
                            {ord.driverName ? <span>Assigned Driver: <strong className="text-white">{ord.driverName}</strong></span> : ''}
                            {ord.truckPlate ? <span> • Vehicle Plate: <strong className="font-mono text-white">{ord.truckPlate}</strong></span> : ''}
                          </div>
                          <div>
                            Depot Loading Dock: <strong className="text-white">{ord.fulfillmentBranchName}</strong>
                          </div>
                        </div>

                        <div className="pt-2 flex flex-wrap gap-2">
                          <Link
                            href={`/branch-admin?tab=inventory&scan=${encodeURIComponent(ord.gatePassCode)}`}
                            className="px-3.5 py-1.5 bg-[#C6F432] hover:bg-[#D7F860] text-[#0B0B0C] font-bold text-xs rounded-lg transition-colors flex items-center space-x-1.5 shadow-sm"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>Scan &amp; Release in Branch Admin</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* CBE FT Reference Submission / Status Banner */}
                {ord.status === 'payment_pending' && (
                  <div className="bg-amber-50 border border-amber-300 p-4 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-amber-900 flex items-center space-x-1.5">
                        <Clock className="w-4 h-4 text-amber-700" />
                        <span>Awaiting CBE Bank Transfer Verification</span>
                      </span>
                      <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-bold uppercase">
                        Finance Action Required
                      </span>
                    </div>

                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      Please transfer <strong>ETB {ord.totalAmountEtb.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong> to AMG Holdings CBE Account <strong className="font-mono text-slate-900">1000192837461</strong> and confirm your FT Reference Number below.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                      <input
                        type="text"
                        defaultValue={ord.cbeFtReference || ''}
                        placeholder="Paste CBE FT Reference (e.g. FT26110699281744)..."
                        id={`cbe-input-${ord.id}`}
                        className="flex-1 text-xs px-3.5 py-2 border border-amber-300 rounded-lg bg-white font-mono font-bold uppercase text-slate-900 focus:outline-none focus:border-slate-900"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          const input = document.getElementById(`cbe-input-${ord.id}`) as HTMLInputElement;
                          const val = input?.value.trim();
                          if (!val) {
                            alert('Please enter a valid CBE FT reference code');
                            return;
                          }
                          try {
                            const res = await fetch('/api/payments/cbe-submit', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                orderId: ord.id,
                                orderNumber: ord.orderNumber,
                                cbeFtReference: val,
                                order: ord,
                              }),
                            });
                            const data = await res.json();
                            if (res.ok) {
                              const updatedOrder = data.order || { ...ord, cbeFtReference: val.toUpperCase(), status: 'payment_pending' };
                              if (typeof window !== 'undefined') {
                                try {
                                  const local = localStorage.getItem('amg_live_orders');
                                  const list = local ? JSON.parse(local) : [];
                                  const nextList = [updatedOrder, ...list.filter((o: any) => o.id !== updatedOrder.id && o.orderNumber !== updatedOrder.orderNumber)];
                                  localStorage.setItem('amg_live_orders', JSON.stringify(nextList));
                                  window.dispatchEvent(new CustomEvent('amg_orders_updated', { detail: updatedOrder }));
                                } catch (e) {}
                              }
                              alert(`CBE FT Reference ${val.toUpperCase()} submitted! Finance will verify against the bank ledger.`);
                              window.location.reload();
                            } else {
                              alert(data.error || 'Failed to submit FT reference');
                            }
                          } catch (e: any) {
                            alert(e.message || 'Network error');
                          }
                        }}
                        className="px-4 py-2 bg-[#0B0B0C] hover:bg-[#1A1A1D] text-[#C6F432] font-bold text-xs rounded-lg transition-colors shrink-0 shadow-sm"
                      >
                        {ord.cbeFtReference ? 'Update FT Reference' : 'Submit FT Reference'}
                      </button>
                    </div>

                    {ord.cbeFtReference && (
                      <div className="text-[10px] text-amber-800 font-mono">
                        Currently submitted code: <strong>{ord.cbeFtReference}</strong>
                      </div>
                    )}

                    {ord.paymentRejectionReason && (
                      <div className="text-[11px] text-rose-800 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                        <strong>Rejection Notice:</strong> {ord.paymentRejectionReason}. Please double check your CBE slip and resubmit.
                      </div>
                    )}
                  </div>
                )}

                {/* Delivery Progress Stepper */}
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                    Fulfillment Milestone Pipeline:
                  </span>
                  <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-semibold">
                    <div className={`p-1.5 rounded-sm ${ord.status !== 'payment_pending' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800 font-bold'}`}>
                      1. {ord.status === 'payment_pending' ? 'CBE Audit Pending' : 'CBE Verified'}
                    </div>
                    <div className={`p-1.5 rounded-sm ${ord.status === 'fulfillment_processing' || ord.status === 'ready_for_pickup' || ord.status === 'shipped' || ord.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'}`}>
                      2. Warehouse Staged
                    </div>
                    <div className={`p-1.5 rounded-sm ${ord.status === 'shipped' || ord.status === 'completed' ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-500'}`}>
                      3. Dispatch / Transit
                    </div>
                    <div className={`p-1.5 rounded-sm ${ord.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'}`}>
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
            )))}
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
        {activeTab === 'profile' && <UserProfileView />}

        {/* Modal: Request Technical Revision */}
        {revisionQuoteId && (
          <div
            onClick={() => setRevisionQuoteId(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in cursor-pointer"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white border border-slate-300 rounded-sm shadow-modal max-w-md w-full p-5 space-y-4 text-xs cursor-default"
            >
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
          <div
            onClick={() => setChatQuote(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in cursor-pointer"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white border border-slate-300 rounded-sm shadow-modal max-w-lg w-full flex flex-col h-[520px] overflow-hidden text-xs cursor-default"
            >
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
                  type="button"
                  onClick={() => setChatQuote(null)}
                  className="text-slate-400 hover:text-white font-bold text-sm px-2 py-1"
                >
                  ✕
                </button>
              </div>

              {/* Price Banner & Counter-Offer Quick Action inside Chat */}
              <div className="px-4 py-2.5 bg-sky-900/30 border-b border-sky-800/40 flex items-center justify-between gap-2">
                <div className="text-[11px] text-slate-700">
                  <span className="text-slate-500 uppercase text-[9px] font-bold block">Quoted Price:</span>
                  <span className="font-mono font-black text-xs text-amg-navy">
                    ETB {(chatQuote.finalQuotedTotalEtb || chatQuote.estimatedTotalEtb || 0).toLocaleString()}
                  </span>
                  {chatQuote.pendingCounterOffer && chatQuote.pendingCounterOffer.status === 'pending' && (
                    <span className="ml-1 text-[10px] text-amber-600 font-bold">
                      (Counter: ETB {chatQuote.pendingCounterOffer.targetPriceEtb.toLocaleString()} pending)
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenNegotiation(chatQuote)}
                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] rounded transition-all flex items-center space-x-1 shadow-xs"
                >
                  <Tag className="w-3 h-3" />
                  <span>Propose Counter-Offer</span>
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

        {/* Commercial Price Negotiation & Counter-Offer Modal (SRS 4.1 / 4.5) */}
        {negotiatingQuote && (
          <div
            onClick={() => setNegotiatingQuote(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm animate-in fade-in cursor-pointer"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white border border-slate-300 rounded-2xl shadow-2xl max-w-lg w-full flex flex-col overflow-hidden text-xs cursor-default"
            >
              {/* Header */}
              <div className="px-6 py-4 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <Tag className="w-5 h-5 text-amber-200" />
                  <div>
                    <h3 className="font-bold text-sm uppercase tracking-wide">
                      Negotiate Commercial Price: {negotiatingQuote.quoteNumber}
                    </h3>
                    <span className="text-[11px] text-amber-200/90 font-normal">
                      Propose a formal price reduction to the assigned sales engineer
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setNegotiatingQuote(null)}
                  className="text-white/80 hover:text-white font-bold text-base p-1"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <form onSubmit={handleSubmitCounterOffer} className="p-6 space-y-4 bg-white">
                {/* Baseline Price Summary */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Currently Quoted Price
                    </span>
                    <div className="text-lg font-mono font-extrabold text-amg-navy">
                      ETB {(negotiatingQuote.finalQuotedTotalEtb || negotiatingQuote.estimatedTotalEtb || 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Assigned Lead Desk
                    </span>
                    <div className="text-xs font-semibold text-sky-700">
                      {negotiatingQuote.assignedAgentName || 'AMG Sales Engineering'}
                    </div>
                  </div>
                </div>

                {/* Target Discount Percentage Selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Quick Discount Selection:
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[5, 10, 15, 20].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => handleApplyDiscountPercent(pct)}
                        className={`py-2 px-1 rounded-xl font-bold text-xs border transition-all text-center ${
                          counterDiscountPercent === pct
                            ? 'bg-amber-500 border-amber-600 text-white shadow-sm ring-2 ring-amber-300'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-amber-400'
                        }`}
                      >
                        -{pct}% Discount
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Target Price Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    Proposed Target Price (ETB):
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-mono font-bold text-slate-400">ETB</span>
                    <input
                      type="number"
                      required
                      min={1}
                      max={negotiatingQuote.finalQuotedTotalEtb || negotiatingQuote.estimatedTotalEtb || 100000000}
                      value={counterTargetPrice}
                      onChange={(e) => handleCustomTargetPriceChange(Number(e.target.value) || 0)}
                      className="w-full pl-12 pr-4 py-2 text-sm font-mono font-bold bg-white border border-slate-300 rounded-xl text-slate-900 focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>
                      Proposed Reduction:{' '}
                      <strong className="text-emerald-600 font-mono">
                        -ETB {Math.max(0, (negotiatingQuote.finalQuotedTotalEtb || negotiatingQuote.estimatedTotalEtb || 0) - counterTargetPrice).toLocaleString()}
                      </strong>
                    </span>
                    <span>
                      Effective Discount: <strong className="text-amber-600 font-mono">-{counterDiscountPercent}%</strong>
                    </span>
                  </div>
                </div>

                {/* Commercial Reason & Justification */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-800">
                    Commercial Justification / Reason:
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {[
                      'Budget ceiling limitation',
                      'Matching competitor formal quote',
                      'Volume bulk procurement discount',
                      'Immediate payment authorization upon approval',
                    ].map((reasonChip) => (
                      <button
                        key={reasonChip}
                        type="button"
                        onClick={() => setCounterReason(reasonChip)}
                        className={`text-[10px] px-2.5 py-1 rounded-full border transition-all ${
                          counterReason === reasonChip
                            ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold'
                            : 'bg-slate-100 border-slate-200 text-slate-600 hover:border-slate-400'
                        }`}
                      >
                        {reasonChip}
                      </button>
                    ))}
                  </div>
                  <textarea
                    rows={3}
                    required
                    value={counterReason}
                    onChange={(e) => setCounterReason(e.target.value)}
                    placeholder="Explain the commercial reason for requesting this discount..."
                    className="w-full p-3 text-xs bg-white border border-slate-300 rounded-xl text-slate-900 focus:border-amber-500 outline-none"
                  />
                </div>

                {/* Submit Action */}
                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setNegotiatingQuote(null)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingCounter}
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmittingCounter ? 'Submitting...' : `Submit Counter-Offer (ETB ${counterTargetPrice.toLocaleString()})`}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* CBE Bank Transfer & Settlement Modal */}
        {payingQuote && (
          <div
            onClick={() => setPayingQuote(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in cursor-pointer"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white border border-slate-300 rounded-2xl shadow-2xl max-w-xl w-full flex flex-col overflow-hidden text-xs cursor-default max-h-[90vh]"
            >
              {/* Header with CBE Theme */}
              <div className="px-6 py-4 bg-gradient-to-r from-[#6A1B29] via-[#851C2C] to-[#54121F] text-white flex items-center justify-between border-b border-amber-500/30">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-400 text-[#54121F] flex items-center justify-center font-serif font-black text-sm shadow-md">
                    CBE
                  </div>
                  <div>
                    <h3 className="font-bold text-sm uppercase tracking-wide flex items-center space-x-2">
                      <span>Commercial Bank of Ethiopia (CBE) Settlement</span>
                    </h3>
                    <span className="text-[11px] text-amber-200 block">
                      Official B2B Proforma Payment Rail • Quote: {payingQuote.quoteNumber}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPayingQuote(null)}
                  className="text-white/80 hover:text-white font-bold text-base p-1"
                >
                  ✕
                </button>
              </div>

              {/* Scrollable Body */}
              <form onSubmit={handleSubmitCbePayment} className="p-6 space-y-4 overflow-y-auto">
                {/* Financial Summary Card */}
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between items-center text-slate-600 text-xs">
                    <span>Quoted Subtotal (Production Baseline):</span>
                    <span className="font-mono font-bold text-slate-800">
                      ETB {(payingQuote.finalQuotedTotalEtb || payingQuote.estimatedTotalEtb || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 text-xs">
                    <span>ERCA VAT (15%):</span>
                    <span className="font-mono font-bold text-slate-800">
                      ETB {((payingQuote.finalQuotedTotalEtb || payingQuote.estimatedTotalEtb || 0) * 0.15).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="border-t border-slate-300 pt-2 flex justify-between items-center">
                    <span className="font-bold text-xs uppercase text-slate-900">Total Settlement Due (ETB):</span>
                    <span className="font-mono text-lg font-black text-emerald-700">
                      ETB {((payingQuote.finalQuotedTotalEtb || payingQuote.estimatedTotalEtb || 0) * 1.15).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Official CBE Account Details Card */}
                <div className="bg-[#6A1B29]/5 border border-[#6A1B29]/30 rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-[#6A1B29] uppercase tracking-wide flex items-center space-x-1.5">
                      <Building2 className="w-4 h-4" />
                      <span>AMG Holdings CBE Bank Account Details</span>
                    </div>
                    <span className="text-[10px] font-mono bg-[#6A1B29] text-white px-2 py-0.5 rounded-full font-bold">
                      Account of Record
                    </span>
                  </div>

                  <div className="bg-white border border-[#6A1B29]/20 p-3 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                        CBE Account Number:
                      </span>
                      <span className="font-mono text-base font-black text-slate-900 tracking-wider">
                        1000192837461
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText('1000192837461');
                        setIsCopiedAccount(true);
                        setTimeout(() => setIsCopiedAccount(false), 2500);
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-xs font-bold text-slate-800 flex items-center space-x-1 transition-colors"
                    >
                      {isCopiedAccount ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-bold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy A/C</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700 pt-1">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Beneficiary Name:</span>
                      <strong>AMG Holdings Industrial PLC</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Branch / Division:</span>
                      <strong>Addis Ababa Corporate Hub</strong>
                    </div>
                  </div>
                </div>

                {/* Transfer Guidance Steps */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 space-y-1.5">
                  <div className="font-bold text-slate-900 uppercase text-[10px] tracking-wider">
                    How to Complete Payment:
                  </div>
                  <ol className="list-decimal pl-4 space-y-1 text-[11px] leading-relaxed">
                    <li>Transfer total payable to the CBE Account above via <strong>CBE Mobile Banking (App/USSD *847#)</strong>, Internet Banking, or in-person branch teller deposit.</li>
                    <li>Locate the <strong>FT Reference Number</strong> in your CBE confirmation SMS or teller receipt (e.g. <span className="font-mono font-bold text-slate-900">FT261109923841</span>).</li>
                    <li>Enter your FT Reference Number below and submit for instant ledger verification by AMG Finance.</li>
                  </ol>
                </div>

                {/* Payment Input Form */}
                <div className="space-y-3 pt-1">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-900">
                      CBE Bank FT Reference Number <span className="text-rose-500">*</span>:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. FT261109923841 or CBE-10928374"
                      value={cbeFtCode}
                      onChange={(e) => setCbeFtCode(e.target.value.toUpperCase())}
                      className="w-full px-3.5 py-2.5 text-sm font-mono font-black uppercase tracking-wider bg-white border border-slate-300 rounded-xl focus:border-[#6A1B29] outline-none shadow-xs"
                    />
                    <span className="text-[10px] text-slate-500 block">
                      Found in your CBE SMS: &quot;Your account ... debited ... FT...&quot;
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-900">
                      Depositor Name / Payer Account Number:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Almaz Worku / MIDROC PLC (100028472918)"
                      value={cbePayerAccount}
                      onChange={(e) => setCbePayerAccount(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:border-[#6A1B29] outline-none"
                    />
                  </div>
                </div>

                {/* Submit Actions */}
                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setPayingQuote(null)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingPayment || !cbeFtCode.trim()}
                    className="px-5 py-2.5 bg-[#6A1B29] hover:bg-[#851C2C] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2 disabled:opacity-50"
                  >
                    <Building2 className="w-4 h-4 text-amber-300" />
                    <span>{isSubmittingPayment ? 'Submitting to Finance...' : 'Submit CBE Payment Reference'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
