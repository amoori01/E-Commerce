'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { INITIAL_ORDERS } from '@/lib/constants';
import { Order } from '@/types';
import {
  Landmark,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  Building2,
  FileText,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Receipt,
  User,
  Filter,
  Trash2,
} from 'lucide-react';

export default function FinanceDashboardPage() {
  const { currentUser, activeRole, switchRole } = useAuth();
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [filterStatus, setFilterStatus] = useState<'all' | 'payment_pending' | 'fulfillment_processing' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rejectReasonInput, setRejectReasonInput] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch orders from API and sync with local client submissions
  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/orders');
      let combined: Order[] = [];
      if (res.ok) {
        const data = await res.json();
        if (data.orders && Array.isArray(data.orders)) {
          combined = [...data.orders];
        }
      }

      // Check localStorage for any newly placed customer orders
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
                const existingIdx = combined.findIndex((c) => c.id === p.id || c.orderNumber === p.orderNumber);
                if (existingIdx >= 0) {
                  combined[existingIdx] = { ...combined[existingIdx], ...p };
                } else {
                  combined.unshift(p);
                }
              }
            }
          } catch (e) {}
        }
      }

      if (combined.length > 0) {
        setOrders(combined);
        setSelectedOrder((curr) => {
          if (!curr) {
            return combined.find((o) => o.status === 'payment_pending' && o.cbeFtReference) || combined[0];
          }
          const updated = combined.find((o) => o.id === curr.id || o.orderNumber === curr.orderNumber);
          return updated || curr;
        });
      }
    } catch (err) {
      console.warn('Finance failed to fetch orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 4000);
    const handleUpdate = () => loadOrders();
    window.addEventListener('amg_orders_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener('amg_orders_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    const matchesStatus =
      filterStatus === 'all'
        ? true
        : filterStatus === 'rejected'
        ? o.paymentRejectionReason !== undefined
        : o.status === filterStatus;

    const query = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !query ||
      o.orderNumber.toLowerCase().includes(query) ||
      o.customerName.toLowerCase().includes(query) ||
      (o.customerCompany && o.customerCompany.toLowerCase().includes(query)) ||
      (o.cbeFtReference && o.cbeFtReference.toLowerCase().includes(query));

    return matchesStatus && matchesQuery;
  });

  const pendingVerificationCount = orders.filter(
    (o) => o.status === 'payment_pending' && o.cbeFtReference
  ).length;

  const totalVerifiedAmount = orders
    .filter((o) => o.status !== 'cancelled' && o.status !== 'payment_pending')
    .reduce((sum, o) => sum + o.totalAmountEtb, 0);

  const handleClearOrders = async () => {
    if (!confirm('Are you sure you want to clean all test orders from the system?')) return;
    try {
      await fetch('/api/orders', { method: 'DELETE' });
      if (typeof window !== 'undefined') {
        localStorage.removeItem('amg_live_orders');
        window.dispatchEvent(new CustomEvent('amg_orders_updated'));
      }
      setOrders([]);
      setSelectedOrder(null);
      setActionFeedback({
        type: 'success',
        message: 'All test orders cleared! System is now at clean slate for end-to-end testing.',
      });
    } catch (e: any) {
      setActionFeedback({
        type: 'error',
        message: 'Failed to clear orders: ' + e.message,
      });
    }
  };

  const handleVerifyPayment = async (order: Order) => {
    setIsProcessing(true);
    setActionFeedback(null);
    try {
      const res = await fetch('/api/payments/finance-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          orderNumber: order.orderNumber,
          action: 'approve',
          verifiedBy: currentUser?.fullName ? `${currentUser.fullName} (Finance Lead)` : 'Helen Girmachew (Finance Lead)',
          order,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to verify payment');

      const verifiedTimestamp = new Date().toISOString();
      const verifiedBy = currentUser?.fullName || 'Helen Girmachew';

      // Update local state
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id
            ? {
                ...o,
                status: 'fulfillment_processing',
                paymentVerifiedAt: verifiedTimestamp,
                paymentVerifiedBy: verifiedBy,
                paymentRejectionReason: undefined,
              }
            : o
        )
      );

      if (selectedOrder?.id === order.id) {
        setSelectedOrder((prev) =>
          prev
            ? {
                ...prev,
                status: 'fulfillment_processing',
                paymentVerifiedAt: verifiedTimestamp,
                paymentVerifiedBy: verifiedBy,
                paymentRejectionReason: undefined,
              }
            : null
        );
      }

      // Sync with localStorage
      if (typeof window !== 'undefined') {
        try {
          const local = localStorage.getItem('amg_live_orders');
          const list = local ? JSON.parse(local) : [];
          const updatedList = list.map((o: any) =>
            o.id === order.id || o.orderNumber === order.orderNumber
              ? {
                  ...o,
                  status: 'fulfillment_processing',
                  paymentVerifiedAt: verifiedTimestamp,
                  paymentVerifiedBy: verifiedBy,
                  paymentRejectionReason: undefined,
                }
              : o
          );
          localStorage.setItem('amg_live_orders', JSON.stringify(updatedList));
          window.dispatchEvent(new CustomEvent('amg_orders_updated'));
        } catch (e) {}
      }

      setActionFeedback({
        type: 'success',
        message: `Order ${order.orderNumber} successfully verified. CBE Reference ${order.cbeFtReference || 'RECORD'} approved and dispatched to branch fulfillment.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error approving payment';
      setActionFeedback({ type: 'error', message: msg });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectPayment = async () => {
    if (!selectedOrder) return;
    setIsProcessing(true);
    setActionFeedback(null);
    try {
      const res = await fetch('/api/payments/finance-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          orderNumber: selectedOrder.orderNumber,
          action: 'reject',
          rejectionReason: rejectReasonInput.trim() || 'CBE FT reference not found in bank ledger records',
          verifiedBy: currentUser?.fullName || 'Helen Girmachew',
          order: selectedOrder,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reject payment');

      const reason = rejectReasonInput.trim() || 'CBE FT reference not found in bank ledger records';

      setOrders((prev) =>
        prev.map((o) =>
          o.id === selectedOrder.id
            ? {
                ...o,
                status: 'payment_pending',
                paymentRejectionReason: reason,
              }
            : o
        )
      );

      setSelectedOrder((prev) =>
        prev
          ? {
              ...prev,
              status: 'payment_pending',
              paymentRejectionReason: reason,
            }
          : null
      );

      // Sync with localStorage
      if (typeof window !== 'undefined') {
        try {
          const local = localStorage.getItem('amg_live_orders');
          const list = local ? JSON.parse(local) : [];
          const updatedList = list.map((o: any) =>
            o.id === selectedOrder.id || o.orderNumber === selectedOrder.orderNumber
              ? {
                  ...o,
                  status: 'payment_pending',
                  paymentRejectionReason: reason,
                }
              : o
          );
          localStorage.setItem('amg_live_orders', JSON.stringify(updatedList));
          window.dispatchEvent(new CustomEvent('amg_orders_updated'));
        } catch (e) {}
      }

      setShowRejectModal(false);
      setRejectReasonInput('');
      setActionFeedback({
        type: 'success',
        message: `Order ${selectedOrder.orderNumber} reference rejected. Customer notified to resubmit valid FT code.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error rejecting payment';
      setActionFeedback({ type: 'error', message: msg });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0B0B0C] text-[#0B0B0C] dark:text-white pb-20 transition-colors">
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
                  <span className="font-semibold tracking-wide">Module 7: Payment &amp; Ledger Verification</span>
                  <span className="text-slate-300 dark:text-[#52525B]">|</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#C6F432]/25 dark:bg-[#C6F432]/10 text-emerald-900 dark:text-[#C6F432] border border-[#C6F432]/40">CBE Bank Rail</span>
                </div>
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-white/80 dark:bg-[#141416] border border-slate-200/80 dark:border-[#2A2A2E] rounded-full text-[11px] text-slate-600 dark:text-[#A1A1AA] shadow-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A] dark:text-[#C6F432]" />
                  <span>Audit Grade Settlement</span>
                </div>
              </div>

              <h1 className="text-2xl sm:text-4xl font-serif font-black tracking-tight leading-tight text-slate-950 dark:text-white drop-shadow-xs">
                Finance &amp; CBE Reconciliation Console
              </h1>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-[#A1A1AA] font-sans leading-relaxed max-w-2xl font-normal">
                Review and audit Commercial Bank of Ethiopia (CBE) bank transfer reference codes (FT numbers) submitted by clients. Verified payments release reserved stock into branch depot fulfillment.
              </p>
            </div>

            {/* Persona Card */}
            <div className="flex items-center space-x-3 bg-white/90 dark:bg-[#141416]/90 p-3.5 rounded-2xl border border-slate-200 dark:border-[#2A2A2E] shadow-sm backdrop-blur-md shrink-0">
              <div className="w-10 h-10 rounded-full bg-slate-950 dark:bg-[#1A1A1D] text-[#C6F432] font-bold flex items-center justify-center text-sm border border-slate-800 dark:border-[#2A2A2E] shadow-xs">
                {currentUser.fullName[0]}
              </div>
              <div className="text-left text-xs">
                <div className="font-bold text-slate-950 dark:text-white leading-tight">{currentUser.fullName}</div>
                <div className="text-[10px] text-emerald-900 dark:text-[#C6F432] font-semibold">Corporate Finance Lead</div>
                <div className="text-[10px] text-slate-500 dark:text-[#71717A]">CBE Bank Ledger Audit</div>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bento Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-200/80 dark:border-[#1F1F24] mt-6">
            <div className="bg-white/80 dark:bg-[#141416]/70 border border-slate-200/80 dark:border-[#222225] rounded-2xl p-4 sm:p-5 space-y-1 shadow-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-[#A1A1AA]">
                Pending CBE FT Verifications
              </span>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-[#16A34A] dark:text-[#C6F432]">
                {pendingVerificationCount}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-[#71717A]">Orders awaiting statement audit</p>
            </div>

            <div className="bg-white/80 dark:bg-[#141416]/70 border border-slate-200/80 dark:border-[#222225] rounded-2xl p-4 sm:p-5 space-y-1 shadow-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-[#A1A1AA]">
                Total Verified Ledger Volume
              </span>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-950 dark:text-white">
                ETB {totalVerifiedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-[#71717A]">15% Ethiopian VAT accounted &amp; locked</p>
            </div>

            <div className="bg-white/80 dark:bg-[#141416]/70 border border-slate-200/80 dark:border-[#222225] rounded-2xl p-4 sm:p-5 space-y-1 shadow-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-[#A1A1AA]">
                CBE Official Settlement Account
              </span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-slate-950 dark:text-white">
                1000192837461
              </div>
              <p className="text-[11px] text-emerald-800 dark:text-[#C6F432] font-semibold">AMG Holdings Central Corporate</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. RECONCILIATION TABLE & AUDIT WORKSPACE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
        {actionFeedback && (
          <div
            className={`p-4 rounded-2xl border text-xs font-medium flex items-center justify-between ${
              actionFeedback.type === 'success'
                ? 'bg-[#F4FDE6] border-[#C6F432] text-[#0B0B0C]'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-center space-x-2">
              {actionFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600" />
              )}
              <span>{actionFeedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionFeedback(null)}
              className="text-xs font-bold underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#141416] p-4 rounded-2xl border border-[#E4E4E7] dark:border-[#222225] shadow-xs">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider hidden sm:inline">
              Filter:
            </span>
            <div className="inline-flex bg-[#F4F4F5] dark:bg-[#1A1A1D] p-1 rounded-full border border-[#E4E4E7] dark:border-[#2A2A2E] text-xs">
              <button
                type="button"
                onClick={() => setFilterStatus('all')}
                className={`px-3.5 py-1 font-semibold rounded-full transition-all ${
                  filterStatus === 'all'
                    ? 'bg-white dark:bg-[#222225] text-[#0B0B0C] dark:text-white shadow-xs'
                    : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#0B0B0C] dark:hover:text-white'
                }`}
              >
                All Orders
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('payment_pending')}
                className={`px-3.5 py-1 font-semibold rounded-full transition-all ${
                  filterStatus === 'payment_pending'
                    ? 'bg-[#0B0B0C] dark:bg-[#C6F432] text-[#C6F432] dark:text-[#0B0B0C] shadow-xs'
                    : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#0B0B0C] dark:hover:text-white'
                }`}
              >
                Pending Verification ({pendingVerificationCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('fulfillment_processing')}
                className={`px-3.5 py-1 font-semibold rounded-full transition-all ${
                  filterStatus === 'fulfillment_processing'
                    ? 'bg-[#0B0B0C] dark:bg-[#1F1F24] text-white shadow-xs'
                    : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#0B0B0C] dark:hover:text-white'
                }`}
              >
                Verified &amp; Released
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('rejected')}
                className={`px-3.5 py-1 font-semibold rounded-full transition-all ${
                  filterStatus === 'rejected'
                    ? 'bg-rose-900 text-white shadow-xs'
                    : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#0B0B0C] dark:hover:text-white'
                }`}
              >
                Rejected References
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={handleClearOrders}
              className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 rounded-full text-xs font-semibold flex items-center space-x-1.5 transition-colors shrink-0"
              title="Clean all test orders from database and localStorage"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clean All Orders</span>
            </button>

            <button
              type="button"
              onClick={loadOrders}
              disabled={isLoading}
              className="px-3.5 py-2 bg-white dark:bg-[#1A1A1D] hover:bg-[#F4F4F5] dark:hover:bg-[#222225] border border-[#E4E4E7] dark:border-[#2A2A2E] text-[#0B0B0C] dark:text-[#C6F432] rounded-full text-xs font-semibold flex items-center space-x-1.5 shadow-2xs transition-colors shrink-0"
              title="Refresh CBE reconciliation queue"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#C6F432]' : ''}`} />
              <span className="hidden sm:inline">{isLoading ? 'Syncing...' : 'Refresh Ledger'}</span>
            </button>

            <div className="relative min-w-[200px] sm:w-64">
              <Search className="w-4 h-4 text-[#71717A] dark:text-[#A1A1AA] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search FT code, order #..."
                className="w-full pl-9 pr-4 py-2 text-xs border border-[#E4E4E7] dark:border-[#222225] rounded-full bg-[#FAFAFA] dark:bg-[#1A1A1D] text-[#0B0B0C] dark:text-white focus:outline-none focus:border-[#0B0B0C] dark:focus:border-[#C6F432] focus:ring-1 focus:ring-[#C6F432]/40"
              />
            </div>
          </div>
        </div>

        {/* Master-Detail Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Orders Table List (8 cols) */}
          <div className="lg:col-span-8 bg-white dark:bg-[#141416] border border-[#E4E4E7] dark:border-[#222225] rounded-3xl shadow-xs overflow-hidden">
            <div className="p-5 border-b border-[#F4F4F5] dark:border-[#222225] flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-base text-[#0B0B0C] dark:text-white">
                  CBE Bank Transfer Verification Queue
                </h3>
                <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                  Select an order to inspect bank statement reference details and approve or reject.
                </p>
              </div>
              <span className="text-xs font-mono text-[#71717A] dark:text-[#A1A1AA]">
                {filteredOrders.length} records found
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAFAFA] dark:bg-[#1A1A1D] text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider text-[10px] font-bold border-b border-[#E4E4E7] dark:border-[#222225]">
                  <tr>
                    <th className="py-3 px-4">Order &amp; Date</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">CBE FT Reference</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F4F4F5] dark:divide-[#222225]">
                  {filteredOrders.map((ord) => {
                    const isSelected = selectedOrder?.id === ord.id;
                    const isPending = ord.status === 'payment_pending';

                    return (
                      <tr
                        key={ord.id}
                        onClick={() => setSelectedOrder(ord)}
                        className={`hover:bg-[#FAFAFA] dark:hover:bg-[#1A1A1D] cursor-pointer transition-colors ${
                          isSelected ? 'bg-[#F4F4F5] dark:bg-[#1F1F24] font-medium' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-mono">
                          <div className="font-bold text-[#0B0B0C] dark:text-white">{ord.orderNumber}</div>
                          <div className="text-[10px] text-[#71717A] dark:text-[#A1A1AA]">
                            {new Date(ord.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-[#0B0B0C] dark:text-white font-semibold">{ord.customerName}</div>
                          <div className="text-[10px] text-[#71717A] dark:text-[#A1A1AA]">{ord.customerCompany || 'Direct Client'}</div>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-[#0B0B0C] dark:text-[#C6F432]">
                          ETB {ord.totalAmountEtb.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 font-mono">
                          {ord.cbeFtReference ? (
                            <span className="px-2 py-0.5 bg-[#FAFAFA] dark:bg-[#1A1A1D] border border-[#E4E4E7] dark:border-[#2A2A2E] rounded font-bold text-[#0B0B0C] dark:text-white">
                              {ord.cbeFtReference}
                            </span>
                          ) : (
                            <span className="text-[10px] text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                              Not submitted
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {ord.paymentRejectionReason ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-500">
                              Rejected
                            </span>
                          ) : isPending ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#0B0B0C] dark:bg-[#C6F432] text-[#C6F432] dark:text-[#0B0B0C]">
                              Pending Review
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-500">
                              Verified
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrder(ord);
                            }}
                            className="px-3 py-1 bg-white dark:bg-[#1A1A1D] hover:bg-[#0B0B0C] dark:hover:bg-[#C6F432] text-[#0B0B0C] dark:text-white hover:text-white dark:hover:text-[#0B0B0C] border border-[#E4E4E7] dark:border-[#2A2A2E] rounded-full text-[11px] font-semibold transition-all shadow-2xs"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredOrders.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-[#71717A] dark:text-[#A1A1AA] text-xs">
                        No orders match the selected filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Verification Details Panel (4 cols) */}
          <div className="lg:col-span-4 bg-white dark:bg-[#141416] border border-[#E4E4E7] dark:border-[#222225] rounded-3xl p-6 shadow-xs space-y-5">
            {selectedOrder ? (
              <>
                <div className="border-b border-[#F4F4F5] pb-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#71717A]">
                      Audit Inspection
                    </span>
                    <span className="font-mono text-xs text-[#71717A]">
                      {selectedOrder.orderNumber}
                    </span>
                  </div>
                  <h3 className="font-serif font-bold text-lg text-[#0B0B0C]">
                    CBE Transfer Verification
                  </h3>
                </div>

                {/* Financial Overview */}
                <div className="bg-[#FAFAFA] dark:bg-[#1A1A1D] border border-[#E4E4E7] dark:border-[#2A2A2E] p-4 rounded-2xl space-y-2 text-xs">
                  <div className="flex justify-between items-center text-[#71717A] dark:text-[#A1A1AA]">
                    <span>Payable Amount:</span>
                    <span className="font-mono font-bold text-[#0B0B0C] dark:text-[#C6F432] text-sm">
                      ETB {selectedOrder.totalAmountEtb.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {selectedOrder.discountEtb && selectedOrder.discountEtb > 0 && (
                    <div className="flex justify-between items-center text-emerald-600 dark:text-[#C6F432] text-[11px] font-semibold">
                      <span>Voucher Discount ({selectedOrder.couponCode || 'Promo'}):</span>
                      <span className="font-mono">
                        -ETB {selectedOrder.discountEtb.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-[#71717A] dark:text-[#A1A1AA] text-[11px]">
                    <span>15% ERCA VAT Included:</span>
                    <span className="font-mono text-[#0B0B0C] dark:text-white">
                      ETB {selectedOrder.taxEtb.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[#71717A] dark:text-[#A1A1AA] text-[11px]">
                    <span>Fulfillment Branch:</span>
                    <span className="font-medium text-[#0B0B0C] dark:text-white">{selectedOrder.fulfillmentBranchName}</span>
                  </div>
                </div>

                {/* Submitted CBE Bank Details */}
                <div className="space-y-3 text-xs">
                  <div className="font-semibold text-[#0B0B0C] dark:text-white flex items-center space-x-1.5">
                    <Landmark className="w-4 h-4 text-[#C6F432]" />
                    <span>Customer Bank Slip Details</span>
                  </div>

                  <div className="space-y-2 bg-[#F4F4F5] dark:bg-[#1A1A1D] p-3.5 rounded-2xl border border-[#E4E4E7] dark:border-[#2A2A2E]">
                    <div>
                      <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] uppercase block">
                        CBE FT Reference Code:
                      </span>
                      <span className="font-mono font-black text-sm text-[#0B0B0C] dark:text-[#C6F432] tracking-wide">
                        {selectedOrder.cbeFtReference || 'NOT YET SUBMITTED BY BUYER'}
                      </span>
                    </div>

                    {selectedOrder.cbePayerAccount && (
                      <div>
                        <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] uppercase block">
                          Payer Account (Sender):
                        </span>
                        <span className="font-mono text-xs text-[#0B0B0C] dark:text-white">
                          {selectedOrder.cbePayerAccount}
                        </span>
                      </div>
                    )}

                    {selectedOrder.paymentSubmittedAt && (
                      <div>
                        <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] uppercase block">
                          Submission Timestamp:
                        </span>
                        <span className="font-mono text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
                          {new Date(selectedOrder.paymentSubmittedAt).toLocaleString()}
                        </span>
                      </div>
                    )}

                    {selectedOrder.paymentRejectionReason && (
                      <div className="pt-2 border-t border-rose-500/30 text-rose-500 text-[11px]">
                        <strong>Previous Rejection:</strong> {selectedOrder.paymentRejectionReason}
                      </div>
                    )}
                  </div>
                </div>

                {/* Items in order */}
                <div className="space-y-2 text-xs border-t border-[#F4F4F5] pt-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#71717A]">
                    Reserved Items ({selectedOrder.items.length})
                  </span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {selectedOrder.items.map((i) => (
                      <div key={i.id} className="p-2 bg-[#FAFAFA] dark:bg-[#1A1A1D] rounded-xl border border-[#E4E4E7] dark:border-[#2A2A2E] text-[11px]">
                        <div className="font-semibold text-[#0B0B0C] dark:text-white">{i.productName}</div>
                        <div className="flex justify-between font-mono text-[#71717A] dark:text-[#A1A1AA] text-[10px]">
                          <span>Qty: {i.quantity}</span>
                          <span className="text-[#0B0B0C] dark:text-[#C6F432]">ETB {i.totalPriceEtb.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-2 border-t border-[#F4F4F5] dark:border-[#222225]">
                  {selectedOrder.status === 'payment_pending' ? (
                    <>
                      <button
                        type="button"
                        disabled={isProcessing || !selectedOrder.cbeFtReference}
                        onClick={() => handleVerifyPayment(selectedOrder)}
                        className="w-full py-3 bg-[#0B0B0C] dark:bg-[#C6F432] hover:bg-[#1A1A1D] dark:hover:bg-[#D7F860] text-[#C6F432] dark:text-[#0B0B0C] font-bold text-xs rounded-full transition-all flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>{isProcessing ? 'Verifying...' : 'Confirm Bank Match & Approve'}</span>
                      </button>

                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => setShowRejectModal(true)}
                        className="w-full py-2.5 bg-white dark:bg-[#1A1A1D] hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 border border-rose-300 dark:border-rose-900 font-semibold text-xs rounded-full transition-all flex items-center justify-center space-x-1.5"
                      >
                        <XCircle className="w-4 h-4 text-rose-500" />
                        <span>Reject Reference (Request Resubmission)</span>
                      </button>
                    </>
                  ) : (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center space-y-1">
                      <div className="font-bold text-emerald-600 dark:text-emerald-400 text-xs flex items-center justify-center space-x-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Payment Verified</span>
                      </div>
                      <div className="text-[10px] text-emerald-700">
                        Verified by {selectedOrder.paymentVerifiedBy || 'Finance Lead'}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-[#71717A] text-xs space-y-2">
                <Receipt className="w-8 h-8 text-[#A1A1AA] mx-auto" />
                <p>Click on any order in the table to audit its CBE transaction reference.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* REJECT MODAL */}
      {showRejectModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#0B0B0C] rounded-3xl p-6 border border-[#E4E4E7] dark:border-[#222225] shadow-2xl max-w-md w-full space-y-4 text-[#0B0B0C] dark:text-white">
            <div className="space-y-1">
              <h3 className="font-serif font-bold text-lg text-[#0B0B0C] dark:text-white">
                Reject CBE FT Reference
              </h3>
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                Provide a reason why reference <strong className="font-mono text-[#0B0B0C] dark:text-[#C6F432]">{selectedOrder.cbeFtReference}</strong> does not match the CBE core statement.
              </p>
            </div>

            <textarea
              value={rejectReasonInput}
              onChange={(e) => setRejectReasonInput(e.target.value)}
              placeholder="e.g. Reference code not found on CBE statement, or transferred amount (ETB 50,000) does not match order total..."
              rows={3}
              className="w-full text-xs p-3.5 border border-[#E4E4E7] dark:border-[#222225] rounded-2xl bg-[#FAFAFA] dark:bg-[#141416] text-[#0B0B0C] dark:text-white focus:outline-none focus:border-[#0B0B0C] dark:focus:border-[#C6F432]"
            />

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 border border-[#E4E4E7] dark:border-[#222225] rounded-full text-xs font-semibold hover:bg-[#FAFAFA] dark:hover:bg-[#141416] text-[#0B0B0C] dark:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleRejectPayment}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-full shadow-sm"
              >
                {isProcessing ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
