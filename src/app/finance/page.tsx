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
  Filter
} from 'lucide-react';

export default function FinanceDashboardPage() {
  const { currentUser, activeRole, switchRole } = useAuth();
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [filterStatus, setFilterStatus] = useState<'all' | 'payment_pending' | 'fulfillment_processing' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectReasonInput, setRejectReasonInput] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to verify payment');

      // Update local state
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id
            ? {
                ...o,
                status: 'fulfillment_processing',
                paymentVerifiedAt: new Date().toISOString(),
                paymentVerifiedBy: currentUser?.fullName || 'Helen Girmachew',
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
                paymentVerifiedAt: new Date().toISOString(),
                paymentVerifiedBy: currentUser?.fullName || 'Helen Girmachew',
                paymentRejectionReason: undefined,
              }
            : null
        );
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
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reject payment');

      setOrders((prev) =>
        prev.map((o) =>
          o.id === selectedOrder.id
            ? {
                ...o,
                status: 'payment_pending',
                paymentRejectionReason: rejectReasonInput.trim() || 'CBE FT reference not found in bank ledger records',
              }
            : o
        )
      );

      setSelectedOrder((prev) =>
        prev
          ? {
              ...prev,
              status: 'payment_pending',
              paymentRejectionReason: rejectReasonInput.trim() || 'CBE FT reference not found in bank ledger records',
            }
          : null
      );

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
    <div className="min-h-screen bg-[#FAFAFA] text-[#0B0B0C] pb-20">
      {/* 1. TOP HEADER & METRICS */}
      <section className="bg-[#0B0B0C] text-white border-b border-[#1A1A1D] py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center space-x-2 px-3 py-1 bg-[#1A1A1D] border border-[#2A2A2E] rounded-full text-xs font-semibold text-[#E4E4E7]">
                <span className="w-2 h-2 rounded-full bg-[#C6F432] inline-block shadow-[0_0_8px_#C6F432]" />
                <span>Architecture Module 7: Payment &amp; Ledger Verification</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-black tracking-tight text-white">
                Finance &amp; CBE Reconciliation Console
              </h1>
              <p className="text-xs text-[#A1A1AA] max-w-2xl font-sans">
                Review and audit Commercial Bank of Ethiopia (CBE) bank transfer reference codes (FT numbers) submitted by clients. Verified payments release reserved stock into branch depot fulfillment.
              </p>
            </div>

            {/* Role switch / verification badge */}
            <div className="flex items-center space-x-3 bg-[#141416] p-3 rounded-2xl border border-[#222225] shrink-0">
              <div className="w-10 h-10 rounded-full bg-[#1A1A1D] text-[#C6F432] font-bold flex items-center justify-center text-sm border border-[#2A2A2E]">
                {currentUser.fullName[0]}
              </div>
              <div className="text-left text-xs">
                <div className="font-bold text-white leading-tight">{currentUser.fullName}</div>
                <div className="text-[10px] text-[#C6F432] font-semibold">Corporate Finance Lead</div>
                <div className="text-[10px] text-[#71717A]">CBE Bank Ledger Audit</div>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bento Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="bg-[#141416] border border-[#222225] rounded-2xl p-5 space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#A1A1AA]">
                Pending CBE FT Verifications
              </span>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-[#C6F432]">
                {pendingVerificationCount}
              </div>
              <p className="text-[11px] text-[#71717A]">Orders awaiting manual statement audit</p>
            </div>

            <div className="bg-[#141416] border border-[#222225] rounded-2xl p-5 space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#A1A1AA]">
                Total Verified Ledger Volume
              </span>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-white">
                ETB {totalVerifiedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-[#71717A]">15% Ethiopian VAT accounted &amp; locked</p>
            </div>

            <div className="bg-[#141416] border border-[#222225] rounded-2xl p-5 space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#A1A1AA]">
                CBE Official Settlement Account
              </span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-white">
                1000192837461
              </div>
              <p className="text-[11px] text-[#C6F432] font-semibold">AMG Holdings Central Corporate</p>
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#E4E4E7] shadow-xs">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-[#71717A] uppercase tracking-wider hidden sm:inline">
              Filter:
            </span>
            <div className="inline-flex bg-[#F4F4F5] p-1 rounded-full border border-[#E4E4E7] text-xs">
              <button
                type="button"
                onClick={() => setFilterStatus('all')}
                className={`px-3.5 py-1 font-semibold rounded-full transition-all ${
                  filterStatus === 'all'
                    ? 'bg-white text-[#0B0B0C] shadow-xs'
                    : 'text-[#71717A] hover:text-[#0B0B0C]'
                }`}
              >
                All Orders
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('payment_pending')}
                className={`px-3.5 py-1 font-semibold rounded-full transition-all ${
                  filterStatus === 'payment_pending'
                    ? 'bg-[#0B0B0C] text-[#C6F432] shadow-xs'
                    : 'text-[#71717A] hover:text-[#0B0B0C]'
                }`}
              >
                Pending Verification ({pendingVerificationCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('fulfillment_processing')}
                className={`px-3.5 py-1 font-semibold rounded-full transition-all ${
                  filterStatus === 'fulfillment_processing'
                    ? 'bg-[#0B0B0C] text-white shadow-xs'
                    : 'text-[#71717A] hover:text-[#0B0B0C]'
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
                    : 'text-[#71717A] hover:text-[#0B0B0C]'
                }`}
              >
                Rejected References
              </button>
            </div>
          </div>

          <div className="relative min-w-[240px] sm:w-72">
            <Search className="w-4 h-4 text-[#71717A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by FT code, order #, client..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-[#E4E4E7] rounded-full bg-[#FAFAFA] focus:outline-none focus:border-[#0B0B0C] focus:ring-1 focus:ring-[#C6F432]/40"
            />
          </div>
        </div>

        {/* Master-Detail Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Orders Table List (8 cols) */}
          <div className="lg:col-span-8 bg-white border border-[#E4E4E7] rounded-3xl shadow-xs overflow-hidden">
            <div className="p-5 border-b border-[#F4F4F5] flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-base text-[#0B0B0C]">
                  CBE Bank Transfer Verification Queue
                </h3>
                <p className="text-xs text-[#71717A]">
                  Select an order to inspect bank statement reference details and approve or reject.
                </p>
              </div>
              <span className="text-xs font-mono text-[#71717A]">
                {filteredOrders.length} records found
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAFAFA] text-[#71717A] uppercase tracking-wider text-[10px] font-bold border-b border-[#E4E4E7]">
                  <tr>
                    <th className="py-3 px-4">Order &amp; Date</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">CBE FT Reference</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F4F4F5]">
                  {filteredOrders.map((ord) => {
                    const isSelected = selectedOrder?.id === ord.id;
                    const isPending = ord.status === 'payment_pending';

                    return (
                      <tr
                        key={ord.id}
                        onClick={() => setSelectedOrder(ord)}
                        className={`hover:bg-[#FAFAFA] cursor-pointer transition-colors ${
                          isSelected ? 'bg-[#F4F4F5] font-medium' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-mono">
                          <div className="font-bold text-[#0B0B0C]">{ord.orderNumber}</div>
                          <div className="text-[10px] text-[#71717A]">
                            {new Date(ord.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-[#0B0B0C] font-semibold">{ord.customerName}</div>
                          <div className="text-[10px] text-[#71717A]">{ord.customerCompany || 'Direct Client'}</div>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-[#0B0B0C]">
                          ETB {ord.totalAmountEtb.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 font-mono">
                          {ord.cbeFtReference ? (
                            <span className="px-2 py-0.5 bg-[#FAFAFA] border border-[#E4E4E7] rounded font-bold text-[#0B0B0C]">
                              {ord.cbeFtReference}
                            </span>
                          ) : (
                            <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                              Not submitted
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {ord.paymentRejectionReason ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                              Rejected
                            </span>
                          ) : isPending ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#0B0B0C] text-[#C6F432]">
                              Pending Review
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
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
                            className="px-3 py-1 bg-white hover:bg-[#0B0B0C] text-[#0B0B0C] hover:text-white border border-[#E4E4E7] rounded-full text-[11px] font-semibold transition-all shadow-2xs"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredOrders.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-[#71717A] text-xs">
                        No orders match the selected filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Verification Details Panel (4 cols) */}
          <div className="lg:col-span-4 bg-white border border-[#E4E4E7] rounded-3xl p-6 shadow-xs space-y-5">
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
                <div className="bg-[#FAFAFA] border border-[#E4E4E7] p-4 rounded-2xl space-y-2 text-xs">
                  <div className="flex justify-between items-center text-[#71717A]">
                    <span>Payable Amount:</span>
                    <span className="font-mono font-bold text-[#0B0B0C] text-sm">
                      ETB {selectedOrder.totalAmountEtb.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[#71717A] text-[11px]">
                    <span>15% ERCA VAT Included:</span>
                    <span className="font-mono">
                      ETB {selectedOrder.taxEtb.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[#71717A] text-[11px]">
                    <span>Fulfillment Branch:</span>
                    <span className="font-medium text-[#0B0B0C]">{selectedOrder.fulfillmentBranchName}</span>
                  </div>
                </div>

                {/* Submitted CBE Bank Details */}
                <div className="space-y-3 text-xs">
                  <div className="font-semibold text-[#0B0B0C] flex items-center space-x-1.5">
                    <Landmark className="w-4 h-4 text-[#0B0B0C]" />
                    <span>Customer Bank Slip Details</span>
                  </div>

                  <div className="space-y-2 bg-[#F4F4F5] p-3.5 rounded-2xl border border-[#E4E4E7]">
                    <div>
                      <span className="text-[10px] text-[#71717A] uppercase block">
                        CBE FT Reference Code:
                      </span>
                      <span className="font-mono font-black text-sm text-[#0B0B0C] tracking-wide">
                        {selectedOrder.cbeFtReference || 'NOT YET SUBMITTED BY BUYER'}
                      </span>
                    </div>

                    {selectedOrder.cbePayerAccount && (
                      <div>
                        <span className="text-[10px] text-[#71717A] uppercase block">
                          Payer Account (Sender):
                        </span>
                        <span className="font-mono text-xs text-[#0B0B0C]">
                          {selectedOrder.cbePayerAccount}
                        </span>
                      </div>
                    )}

                    {selectedOrder.paymentSubmittedAt && (
                      <div>
                        <span className="text-[10px] text-[#71717A] uppercase block">
                          Submission Timestamp:
                        </span>
                        <span className="font-mono text-[11px] text-[#71717A]">
                          {new Date(selectedOrder.paymentSubmittedAt).toLocaleString()}
                        </span>
                      </div>
                    )}

                    {selectedOrder.paymentRejectionReason && (
                      <div className="pt-2 border-t border-rose-200 text-rose-800 text-[11px]">
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
                      <div key={i.id} className="p-2 bg-[#FAFAFA] rounded border border-[#E4E4E7] text-[11px]">
                        <div className="font-semibold text-[#0B0B0C]">{i.productName}</div>
                        <div className="flex justify-between font-mono text-[#71717A] text-[10px]">
                          <span>Qty: {i.quantity}</span>
                          <span>ETB {i.totalPriceEtb.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-2 border-t border-[#F4F4F5]">
                  {selectedOrder.status === 'payment_pending' ? (
                    <>
                      <button
                        type="button"
                        disabled={isProcessing || !selectedOrder.cbeFtReference}
                        onClick={() => handleVerifyPayment(selectedOrder)}
                        className="w-full py-3 bg-[#0B0B0C] hover:bg-[#1A1A1D] text-[#C6F432] font-bold text-xs rounded-full transition-all flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>{isProcessing ? 'Verifying...' : 'Confirm Bank Match & Approve'}</span>
                      </button>

                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => setShowRejectModal(true)}
                        className="w-full py-2.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 font-semibold text-xs rounded-full transition-all flex items-center justify-center space-x-1.5"
                      >
                        <XCircle className="w-4 h-4 text-rose-600" />
                        <span>Reject Reference (Request Resubmission)</span>
                      </button>
                    </>
                  ) : (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-1">
                      <div className="font-bold text-emerald-800 text-xs flex items-center justify-center space-x-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 border border-[#E4E4E7] shadow-xl max-w-md w-full space-y-4">
            <div className="space-y-1">
              <h3 className="font-serif font-bold text-lg text-[#0B0B0C]">
                Reject CBE FT Reference
              </h3>
              <p className="text-xs text-[#71717A]">
                Provide a reason why reference <strong className="font-mono text-[#0B0B0C]">{selectedOrder.cbeFtReference}</strong> does not match the CBE core statement.
              </p>
            </div>

            <textarea
              value={rejectReasonInput}
              onChange={(e) => setRejectReasonInput(e.target.value)}
              placeholder="e.g. Reference code not found on CBE statement, or transferred amount (ETB 50,000) does not match order total..."
              rows={3}
              className="w-full text-xs p-3 border border-[#E4E4E7] rounded-2xl bg-[#FAFAFA] focus:outline-none focus:border-[#0B0B0C]"
            />

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 border border-[#E4E4E7] rounded-full text-xs font-semibold hover:bg-[#FAFAFA]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleRejectPayment}
                className="px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-full shadow-xs"
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
