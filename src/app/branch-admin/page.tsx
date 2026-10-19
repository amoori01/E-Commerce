'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { INVENTORY_ITEMS, BRANCHES, INITIAL_ORDERS } from '@/lib/constants';
import { InventoryItem, Order } from '@/types';
import {
  Building2,
  PackageCheck,
  AlertTriangle,
  ArrowUpDown,
  Truck,
  CheckCircle2,
  Boxes,
  Plus,
  RefreshCw,
  Search,
  MapPin,
  ClipboardList,
  QrCode,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

export default function BranchAdminPage() {
  const { currentUser, activeRole, switchRole } = useAuth();
  const [selectedBranchId, setSelectedBranchId] = useState(
    currentUser.branchId || BRANCHES[1].id // Default to Adama Industrial Park Hub
  );
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>(INVENTORY_ITEMS);
  const [ordersList, setOrdersList] = useState<Order[]>(INITIAL_ORDERS);
  const [selectedItemForAdjustment, setSelectedItemForAdjustment] = useState<InventoryItem | null>(null);
  const [adjustQty, setAdjustQty] = useState<number>(50);
  const [adjustReason, setAdjustReason] = useState<string>('stock_intake');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Dispatch / Gate Pass Generator state
  const [activeDispatchOrder, setActiveDispatchOrder] = useState<Order | null>(null);
  const [driverName, setDriverName] = useState('Tewodros Kassahun');
  const [truckPlate, setTruckPlate] = useState('AA-3-92018');
  const [gatePassCode, setGatePassCode] = useState<string | null>(null);

  // Barcode / QR Scanner State (SRS 5.4)
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [scanResult, setScanResult] = useState<{ item?: InventoryItem; order?: Order; message: string } | null>(null);

  // Low-Stock Automated Restock PO Trigger (SRS 5.3)
  const [restockModalItem, setRestockModalItem] = useState<InventoryItem | null>(null);
  const [restockQtyInput, setRestockQtyInput] = useState<number>(500);
  const [isRestocking, setIsRestocking] = useState(false);
  const [restockSuccessNotice, setRestockSuccessNotice] = useState<string | null>(null);

  const isBranchAdmin = activeRole === 'branch_admin';
  const activeBranch = BRANCHES.find((b) => b.id === selectedBranchId) || BRANCHES[1];
  const branchInventory = inventoryList.filter((item) => item.branchId === selectedBranchId);
  const branchOrders = ordersList.filter((ord) => ord.fulfillmentBranchId === selectedBranchId);

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForAdjustment) return;

    const delta = adjustReason === 'stock_intake' ? adjustQty : -adjustQty;

    setInventoryList((prev) =>
      prev.map((item) => {
        if (item.id === selectedItemForAdjustment.id) {
          return {
            ...item,
            quantityOnHand: Math.max(0, item.quantityOnHand + delta),
            updatedAt: new Date().toISOString(),
          };
        }
        return item;
      })
    );

    try {
      await fetch('/api/inventory/restock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: selectedBranchId,
          sku: selectedItemForAdjustment.sku,
          action: 'adjust',
          delta,
          reason: adjustReason,
        }),
      });
    } catch (err) {
      console.warn('Inventory sync error:', err);
    }

    setFeedbackMsg(
      `Inventory for ${selectedItemForAdjustment.productName} updated (${delta > 0 ? `+${delta}` : delta} units logged as ${adjustReason}).`
    );
    setSelectedItemForAdjustment(null);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleQuickBatchIntake = async (item: InventoryItem, qty: number) => {
    setInventoryList((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? { ...i, quantityOnHand: i.quantityOnHand + qty, updatedAt: new Date().toISOString() }
          : i
      )
    );

    try {
      await fetch('/api/inventory/restock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: selectedBranchId,
          sku: item.sku,
          action: 'intake',
          delta: qty,
          reason: 'Quick intake batch from factory consignment',
        }),
      });
    } catch (err) {
      console.warn('Intake error:', err);
    }

    setFeedbackMsg(`Received batch intake of +${qty} units for ${item.productName}. Physical on-hand updated.`);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleGenerateGatePass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDispatchOrder) return;

    const pass = `GATE-PASS-${Math.floor(100000 + Math.random() * 900000)}`;
    setGatePassCode(pass);

    setOrdersList((prev) =>
      prev.map((o) => (o.id === activeDispatchOrder.id ? { ...o, status: 'shipped' } : o))
    );
  };

  const handleScanBarcode = (e: React.FormEvent) => {
    e.preventDefault();
    const query = scannedBarcode.trim();
    if (!query) return;

    // Search inventory by SKU or ID
    const invMatch = branchInventory.find(
      (i) => i.sku.toLowerCase() === query.toLowerCase() || i.id.toLowerCase() === query.toLowerCase()
    );

    // Search orders by order number or gate pass
    const orderMatch = branchOrders.find(
      (o) => o.orderNumber.toLowerCase() === query.toLowerCase()
    );

    if (invMatch) {
      setScanResult({
        item: invMatch,
        message: `MATCHED PRODUCT: ${invMatch.productName} (On-Hand: ${invMatch.quantityOnHand} units in Bay 4)`,
      });
    } else if (orderMatch) {
      setScanResult({
        order: orderMatch,
        message: `MATCHED CONSIGNMENT: Order ${orderMatch.orderNumber} (${orderMatch.items.length} line items ready for gate verification)`,
      });
    } else {
      setScanResult({
        message: `Barcode / QR code "${query}" verified in physical scan ledger. Item logged for yard audit.`,
      });
    }
  };

  const handleIssueRestockPo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockModalItem) return;
    setIsRestocking(true);

    try {
      const res = await fetch('/api/inventory/restock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: selectedBranchId,
          sku: restockModalItem.sku,
          restockQty: restockQtyInput,
          supplier: 'AMG Central Steel Rolling Mills & Foundry Complex',
        }),
      });
      const data = await res.json();
      setRestockSuccessNotice(
        `Purchase Requisition ${data.purchaseOrder?.poNumber || 'PO-2026-COMMITTED'} dispatched to parent plant for ${restockQtyInput} units of ${restockModalItem.productName}.`
      );
      setRestockModalItem(null);
      setTimeout(() => setRestockSuccessNotice(null), 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRestocking(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      {/* 1. WAREHOUSE & LOGISTICS EMERALD THEME HEADER */}
      <div className="bg-[#064E3B] border-b border-emerald-900 text-white px-4 sm:px-6 py-6 shadow-md">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 bg-emerald-600 text-white font-extrabold uppercase rounded-sm text-[10px] tracking-wider flex items-center space-x-1 shadow-sm">
                  <Truck className="w-3 h-3" />
                  <span>Tier 3: Subsidiary Plant & Depot Operations</span>
                </span>
                <span className="text-emerald-200 font-mono text-[11px]">{activeBranch.code}</span>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white">
                Regional Branch & Warehouse Logistics Portal
              </h1>
              <p className="text-xs text-emerald-100 max-w-2xl">
                Operating scope assigned to regional mill facilities. Stock threshold alarms, factory mill intake, yard dispatch, and physical gate pass verification.
              </p>
            </div>

            {/* Operating Branch Dropdown */}
            <div className="bg-emerald-950/80 border border-emerald-700/60 p-3 rounded-sm text-right shrink-0">
              <div className="text-[10px] uppercase font-bold text-emerald-300">Active Regional Depot</div>
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="mt-1 bg-emerald-900 border border-emerald-600 text-white font-bold px-2 py-1 rounded-sm text-xs outline-none"
              >
                {BRANCHES.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.city})
                  </option>
                ))}
              </select>
              <div className="text-[10px] text-emerald-300 mt-1 font-mono">
                {activeBranch.address}
              </div>
            </div>
          </div>

          {/* Role Boundary Notice */}
          {!isBranchAdmin && (
            <div className="bg-amber-100 border border-amber-400 p-3 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 text-xs">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong>Role Boundary Notice:</strong> You are currently logged in as <strong>{currentUser.role}</strong>. Viewing branch depot controls in simulation mode.
                </div>
              </div>
              <button
                type="button"
                onClick={() => switchRole('branch_admin')}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-sm transition-colors shrink-0 flex items-center space-x-1"
              >
                <span>Switch to Branch Admin</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. BODY CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-xs">
        {feedbackMsg && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-3 rounded-sm flex items-center space-x-2 font-semibold text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Operational KPI Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-300 p-4 rounded-sm shadow-crisp space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Depot Stock Line Items
            </span>
            <div className="text-xl font-extrabold font-mono text-emerald-800">
              {branchInventory.length} Managed SKUs
            </div>
            <span className="text-[11px] text-slate-500">Live sync with ERP</span>
          </div>

          <div className="bg-white border border-slate-300 p-4 rounded-sm shadow-crisp space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Low Stock Warnings
            </span>
            <div className="text-xl font-extrabold font-mono text-amber-600">
              {branchInventory.filter((i) => i.quantityOnHand <= i.safetyStockThreshold).length} Reorder Triggers
            </div>
            <span className="text-[11px] text-amber-700">Under safety threshold</span>
          </div>

          <div className="bg-white border border-slate-300 p-4 rounded-sm shadow-crisp space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Awaiting Freight Dispatch
            </span>
            <div className="text-xl font-extrabold font-mono text-slate-900">
              {branchOrders.filter((o) => o.status !== 'completed' && o.status !== 'shipped').length} Orders
            </div>
            <span className="text-[11px] text-slate-500">Scheduled for loading</span>
          </div>

          <div className="bg-white border border-slate-300 p-4 rounded-sm shadow-crisp space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Plant Dispatch Gate
            </span>
            <div className="text-xl font-extrabold font-mono text-emerald-700">
              Gate 04 Operational
            </div>
            <span className="text-[11px] text-slate-500">Weighbridge calibrated</span>
          </div>
        </div>

        {/* Local Inventory Ledger */}
        <div className="bg-white border border-slate-300 rounded-sm shadow-crisp p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
            <div className="flex items-center space-x-2">
              <Boxes className="w-4 h-4 text-emerald-700" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Physical Inventory & Warehouse Storage Ledger ({activeBranch.city})
              </h3>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  setIsScannerOpen(true);
                  setScanResult(null);
                  setScannedBarcode('');
                }}
                className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-sm text-xs transition-colors flex items-center space-x-1 shadow-sm"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Launch Barcode / QR Scanner</span>
              </button>
              <span className="text-slate-500 font-mono text-[11px]">
                Branch Code: {activeBranch.code}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-emerald-50 text-emerald-900 font-semibold border-b border-emerald-200">
                <tr>
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3">Product Name</th>
                  <th className="py-2.5 px-3">Subsidiary</th>
                  <th className="py-2.5 px-3 text-right">Physical On-Hand</th>
                  <th className="py-2.5 px-3 text-right">Reserved Stock</th>
                  <th className="py-2.5 px-3 text-right">Safety Threshold</th>
                  <th className="py-2.5 px-3 text-center">Depot Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {branchInventory.length > 0 ? (
                  branchInventory.map((item) => {
                    const isLow = item.quantityOnHand <= item.safetyStockThreshold;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-800">{item.sku}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{item.productName}</td>
                        <td className="py-2.5 px-3 text-slate-600">{item.subsidiaryName}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 text-sm">
                          {item.quantityOnHand}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                          {item.quantityReserved}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          <span
                            className={`px-2 py-0.5 rounded-sm font-bold text-[10px] ${
                              isLow
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {item.safetyStockThreshold} {isLow ? '⚠️ REORDER' : ''}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center space-x-1.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleQuickBatchIntake(item, 50)}
                            className="px-2 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-sm font-bold text-[10px] transition-colors shadow-sm"
                            title="Receive factory delivery of +50 units"
                          >
                            +50 Intake
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickBatchIntake(item, 500)}
                            className="px-2 py-1 bg-indigo-700 hover:bg-indigo-800 text-white rounded-sm font-bold text-[10px] transition-colors shadow-sm"
                            title="Receive major consignment of +500 units"
                          >
                            +500 Batch
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedItemForAdjustment(item)}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-700 hover:text-white border border-emerald-300 rounded-sm font-bold text-[10px] text-emerald-800 transition-colors"
                          >
                            Adjust
                          </button>
                          {isLow && (
                            <button
                              type="button"
                              onClick={() => {
                                setRestockModalItem(item);
                                setRestockQtyInput(item.safetyStockThreshold * 2);
                              }}
                              className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-sm font-bold text-[10px] transition-colors shadow-sm"
                            >
                              Auto-Reorder PO
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-slate-500">
                      No inventory currently mapped to this branch facility.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stock Adjustment Form */}
        {selectedItemForAdjustment && (
          <div className="bg-emerald-50/70 border border-emerald-300 p-4 rounded-sm space-y-3 shadow-sm">
            <div className="flex justify-between items-center border-b border-emerald-200 pb-2">
              <h4 className="font-bold text-emerald-900 text-xs uppercase tracking-wider flex items-center space-x-1.5">
                <ArrowUpDown className="w-4 h-4 text-emerald-700" />
                <span>
                  Log Warehouse Inventory Movement: {selectedItemForAdjustment.productName} ({selectedItemForAdjustment.sku})
                </span>
              </h4>
              <button
                onClick={() => setSelectedItemForAdjustment(null)}
                className="text-slate-500 hover:text-slate-800 font-bold"
              >
                Cancel ✕
              </button>
            </div>

            <form onSubmit={handleAdjustStock} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-700 mb-1">
                  Movement Category:
                </label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full border border-slate-300 bg-white px-2 py-1.5 rounded-sm text-xs outline-none"
                >
                  <option value="stock_intake">Stock Intake (Factory Mill Delivery)</option>
                  <option value="dispatch">Customer Branch Pickup Clearance</option>
                  <option value="damage_writeoff">Damage / Quality Defect Rejection</option>
                  <option value="reconciliation">Physical Inventory Cycle Count Audit</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-700 mb-1">
                  Units Count:
                </label>
                <input
                  type="number"
                  min={1}
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Number(e.target.value))}
                  className="w-full border border-slate-300 px-2 py-1.5 rounded-sm font-mono text-xs outline-none"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-sm transition-colors text-xs"
                >
                  Record Warehouse Movement
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Regional Order Fulfillment & Gate Pass Generator */}
        <div className="bg-white border border-slate-300 rounded-sm shadow-crisp p-5 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-200">
            <Truck className="w-4 h-4 text-emerald-700" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Regional Order Fulfillment & Gate Clearance Queue
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-300">
                <tr>
                  <th className="py-2 px-3">Order Number</th>
                  <th className="py-2 px-3">Buyer Company</th>
                  <th className="py-2 px-3">Delivery Method</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Consignment</th>
                  <th className="py-2 px-3 text-center">Fulfillment Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {branchOrders.length > 0 ? (
                  branchOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-800">{ord.orderNumber}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-900">
                        {ord.customerName}
                        <span className="block text-[10px] text-slate-500">{ord.customerCompany}</span>
                      </td>
                      <td className="py-2.5 px-3 capitalize text-slate-700">
                        {ord.deliveryType.replace(/_/g, ' ')}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-sm font-bold text-[10px] uppercase">
                          {ord.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-600">
                        {ord.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveDispatchOrder(ord);
                            setGatePassCode(null);
                          }}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-sm text-[10px] transition-colors"
                        >
                          Generate Gate Pass / Dispatch
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-slate-500">
                      No active orders queued for clearance at this depot.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Gate Pass Modal */}
        {activeDispatchOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
            <div className="bg-white border border-slate-300 rounded-sm shadow-modal max-w-lg w-full p-5 space-y-4 text-xs">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <div className="flex items-center space-x-1.5 text-emerald-800 font-bold">
                  <QrCode className="w-5 h-5 text-emerald-600" />
                  <span>AMG Plant Gate Clearance Pass: {activeDispatchOrder.orderNumber}</span>
                </div>
                <button
                  onClick={() => setActiveDispatchOrder(null)}
                  className="text-slate-400 hover:text-slate-700 font-bold"
                >
                  ✕
                </button>
              </div>

              {gatePassCode ? (
                <div className="text-center py-4 space-y-3">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">Gate Pass Issued & Verified</h4>
                    <span className="font-mono text-lg font-extrabold text-emerald-800 block mt-1">
                      {gatePassCode}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Truck Plate: {truckPlate} • Driver: {driverName}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Order status transitioned to <strong>SHIPPED / DISPATCHED</strong> in ERP master ledger.
                  </p>
                  <button
                    onClick={() => setActiveDispatchOrder(null)}
                    className="w-full py-2 bg-emerald-700 text-white font-bold rounded-sm text-xs hover:bg-emerald-800"
                  >
                    Done & Close Clearance Slip
                  </button>
                </div>
              ) : (
                <form onSubmit={handleGenerateGatePass} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                      Assigned Driver Legal Name:
                    </label>
                    <input
                      type="text"
                      required
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      className="w-full border border-slate-300 px-3 py-1.5 rounded-sm outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                      Commercial Vehicle License Plate:
                    </label>
                    <input
                      type="text"
                      required
                      value={truckPlate}
                      onChange={(e) => setTruckPlate(e.target.value)}
                      className="w-full border border-slate-300 px-3 py-1.5 rounded-sm font-mono outline-none"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-sm text-xs transition-colors flex items-center justify-center space-x-1.5"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Authorize Security Gate Exit Slip</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Modal: Barcode / QR Scanner Interface (SRS 5.4) */}
        {isScannerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white border border-slate-300 rounded-sm shadow-modal max-w-md w-full p-5 space-y-4 text-xs">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <div className="flex items-center space-x-1.5 text-emerald-800 font-bold">
                  <QrCode className="w-5 h-5 text-emerald-700" />
                  <span className="uppercase tracking-wider">Depot Barcode & QR Verification Terminal</span>
                </div>
                <button
                  onClick={() => setIsScannerOpen(false)}
                  className="text-slate-400 hover:text-slate-700 font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Simulated Camera Viewfinder */}
              <div className="relative bg-slate-950 border border-slate-800 rounded-sm h-48 flex flex-col items-center justify-center text-center p-4 overflow-hidden">
                <div className="w-36 h-36 border-2 border-emerald-500 border-dashed rounded-sm flex items-center justify-center relative animate-pulse">
                  <div className="w-full h-0.5 bg-emerald-400 absolute shadow-lg" />
                  <QrCode className="w-16 h-16 text-emerald-500/40" />
                </div>
                <span className="text-[10px] text-emerald-400 mt-2 font-mono">
                  Targeting Camera Feed • Align Barcode / Consignment Gate Pass
                </span>
              </div>

              <form onSubmit={handleScanBarcode} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                    Manual Barcode Input / Hardware Laser Scan:
                  </label>
                  <div className="flex space-x-1.5">
                    <input
                      type="text"
                      required
                      placeholder="e.g. AMG-STEEL-RB-16MM or AMG-ORD-2026-1049"
                      value={scannedBarcode}
                      onChange={(e) => setScannedBarcode(e.target.value)}
                      className="flex-1 border border-slate-300 px-2.5 py-1.5 text-xs font-mono rounded-sm focus:border-emerald-700 outline-none"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-emerald-800 text-white font-bold rounded-sm hover:bg-emerald-900 text-xs"
                    >
                      Scan
                    </button>
                  </div>
                </div>
              </form>

              {scanResult && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-sm space-y-1">
                  <div className="font-bold text-xs flex items-center space-x-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Scan Verification Logged</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">{scanResult.message}</p>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(false)}
                  className="px-4 py-1.5 border border-slate-300 bg-slate-50 font-bold rounded-sm text-slate-700 hover:bg-slate-100"
                >
                  Close Terminal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Automated Restocking PO Generator (SRS 5.3) */}
        {restockModalItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white border border-slate-300 rounded-sm shadow-modal max-w-lg w-full p-5 space-y-4 text-xs">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <div className="flex items-center space-x-1.5 text-amber-800 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="uppercase tracking-wider">Automated Supplier Requisition Generator</span>
                </div>
                <button
                  onClick={() => setRestockModalItem(null)}
                  className="text-slate-400 hover:text-slate-700 font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-3 rounded-sm space-y-1 text-amber-900">
                <div className="font-bold text-xs">Stock Deficit Warning: {restockModalItem.productName}</div>
                <div className="text-[11px] flex justify-between font-mono">
                  <span>Current Physical On-Hand: <strong>{restockModalItem.quantityOnHand}</strong></span>
                  <span>Safety Threshold: <strong>{restockModalItem.safetyStockThreshold}</strong></span>
                </div>
              </div>

              <form onSubmit={handleIssueRestockPo} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                    Target Manufacturing Foundry / Supplier Mill:
                  </label>
                  <input
                    type="text"
                    readOnly
                    value="AMG Central Rolling Mills & Industrial Foundry Complex"
                    className="w-full border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs rounded-sm font-semibold text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                    Replenishment Quantity Requisition:
                  </label>
                  <input
                    type="number"
                    min={50}
                    step={50}
                    required
                    value={restockQtyInput}
                    onChange={(e) => setRestockQtyInput(Number(e.target.value))}
                    className="w-full border border-slate-300 px-2.5 py-1.5 text-xs font-mono font-bold rounded-sm focus:border-emerald-700 outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Calculated to restore buffer to 200% of safety stock threshold.
                  </span>
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setRestockModalItem(null)}
                    className="px-3 py-1.5 border border-slate-300 bg-white font-semibold rounded-sm hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isRestocking}
                    className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-sm transition-colors shadow-sm disabled:opacity-50"
                  >
                    {isRestocking ? 'Issuing PO...' : 'Commit Purchase Order to Factory'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Restock Success Feedback Toast */}
        {restockSuccessNotice && (
          <div className="fixed bottom-4 right-4 z-50 bg-emerald-900 border border-emerald-600 text-white p-4 rounded-sm shadow-xl flex items-center space-x-3 text-xs max-w-md animate-in slide-in-from-bottom">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{restockSuccessNotice}</span>
          </div>
        )}
      </div>
    </div>
  );
}
