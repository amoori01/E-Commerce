'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  INVENTORY_ITEMS,
  BRANCHES,
  INITIAL_ORDERS,
  SEEDED_USERS,
  INITIAL_GRN_LOGS,
  INITIAL_AUDIT_MOVEMENTS,
} from '@/lib/constants';
import { addServerOrder } from '@/lib/server-orders';
import { QrCodeView } from '@/components/ui/QrCodeView';
import {
  InventoryItem,
  Order,
  UserProfile,
  Branch,
  GoodsReceivedNote,
  StockMovementAudit,
  WeighbridgeTicket,
} from '@/types';
import { GrnModal } from '@/components/wms/GrnModal';
import { PickListModal } from '@/components/wms/PickListModal';
import { WeighbridgeModal } from '@/components/wms/WeighbridgeModal';
import { MovementAuditView } from '@/components/wms/MovementAuditView';
import { GrnArchiveView } from '@/components/wms/GrnArchiveView';
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
  ArrowRight,
  ChevronDown,
  Users,
  UserCheck,
  Briefcase,
  Shield,
  X,
  Filter,
  FileText,
  Scale,
  History,
  Warehouse,
  Printer,
  ShieldCheck,
} from 'lucide-react';

export default function BranchAdminPage() {
  const { currentUser, activeRole, switchRole } = useAuth();
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>(INVENTORY_ITEMS);
  const [ordersList, setOrdersList] = useState<Order[]>(INITIAL_ORDERS);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'dispatch' || tabParam === 'inventory' || tabParam === 'agents' || tabParam === 'grn' || tabParam === 'audit') {
        setActiveTab(tabParam as any);
      }
      try {
        const storedGrn = localStorage.getItem('amg_wms_grn');
        if (storedGrn) setGrnList(JSON.parse(storedGrn));
        const storedAudit = localStorage.getItem('amg_wms_audit');
        if (storedAudit) setAuditMovements(JSON.parse(storedAudit));
      } catch (e) {}
      const scanParam = params.get('scan');
      if (scanParam) {
        setIsScannerOpen(true);
        setScannedBarcode(scanParam);
      }
    }
  }, []);

  useEffect(() => {
    const fetchBranchOrders = async () => {
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
        if (combined.length > 0) {
          setOrdersList(combined);
        }
      } catch (e) {}
    };

    fetchBranchOrders();
    const handleUpdate = () => fetchBranchOrders();
    window.addEventListener('amg_orders_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('amg_orders_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);
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

  // WMS Enterprise State: GRN Model 19 & Audit Movements
  const [grnList, setGrnList] = useState<GoodsReceivedNote[]>(INITIAL_GRN_LOGS);
  const [auditMovements, setAuditMovements] = useState<StockMovementAudit[]>(INITIAL_AUDIT_MOVEMENTS);

  // WMS Modals
  const [isGrnModalOpen, setIsGrnModalOpen] = useState(false);
  const [grnTargetItem, setGrnTargetItem] = useState<InventoryItem | null>(null);

  const [isPickModalOpen, setIsPickModalOpen] = useState(false);
  const [activePickOrder, setActivePickOrder] = useState<Order | null>(null);

  const [isWeighbridgeModalOpen, setIsWeighbridgeModalOpen] = useState(false);
  const [activeWeighbridgeOrder, setActiveWeighbridgeOrder] = useState<Order | null>(null);

  // Tab Switcher
  const [activeTab, setActiveTab] = useState<'inventory' | 'dispatch' | 'grn' | 'audit' | 'agents'>('inventory');

  // Sales Agent & Client Portfolio Assignment State (SRS Section 2)
  const [agentsList, setAgentsList] = useState<UserProfile[]>(
    SEEDED_USERS.filter((u) => u.role === 'sales_agent')
  );
  const [editingAgent, setEditingAgent] = useState<UserProfile | null>(null);
  const [targetAgentBranch, setTargetAgentBranch] = useState<string>(selectedBranchId === 'all' ? BRANCHES[0].id : selectedBranchId);
  const [portfolioInput, setPortfolioInput] = useState<string>('');
  const [specializationInput, setSpecializationInput] = useState<string>('');
  const [isSavingAgent, setIsSavingAgent] = useState(false);
  const [agentSearch, setAgentSearch] = useState('');

  const isBranchAdmin = activeRole === 'branch_admin';
  const activeBranch: Branch = selectedBranchId === 'all'
    ? {
        id: 'all',
        code: 'ALL_DEPOTS',
        name: 'All Regional Depots (Consortium Wide)',
        city: 'All Regional Depots',
        address: 'Consortium-Wide Central Oversight & Multi-Depot Logistics Grid',
        phone: '+251 11 550 0000',
        email: 'logistics@amgholdings.et',
        isHub: true,
        isActive: true,
      }
    : BRANCHES.find((b) => b.id === selectedBranchId) || BRANCHES[0];
  const activeSubsidiaryName = currentUser.subsidiaryName || 'AMG Heavy Industry Division';
  const branchInventory = selectedBranchId === 'all'
    ? inventoryList
    : inventoryList.filter((item) => item.branchId === selectedBranchId);
  const branchOrders = selectedBranchId === 'all'
    ? ordersList
    : ordersList.filter((ord) => ord.fulfillmentBranchId === selectedBranchId);

  const subsidiaryAgents = agentsList.filter(
    (a) => !currentUser.subsidiaryId || a.subsidiaryId === currentUser.subsidiaryId || activeRole === 'super_admin'
  );
  const filteredAgents = subsidiaryAgents.filter(
    (a) =>
      a.fullName.toLowerCase().includes(agentSearch.toLowerCase()) ||
      (a.clientPortfolio && a.clientPortfolio.toLowerCase().includes(agentSearch.toLowerCase())) ||
      (a.specialization && a.specialization.toLowerCase().includes(agentSearch.toLowerCase()))
  );

  const handleOpenAssignModal = (agent: UserProfile) => {
    setEditingAgent(agent);
    setTargetAgentBranch(agent.branchId || selectedBranchId);
    setPortfolioInput(agent.clientPortfolio || 'MIDROC Construction Ethiopia PLC');
    setSpecializationInput(agent.specialization || 'Technical Industrial Sales');
  };

  const handleSaveAgentPortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAgent) return;
    setIsSavingAgent(true);

    try {
      const res = await fetch('/api/branch-admin/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'branch_admin',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          agentId: editingAgent.id,
          targetBranchId: targetAgentBranch,
          clientPortfolio: portfolioInput,
          specialization: specializationInput,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.details || 'Failed to update agent assignment');
      }

      const assignedBranchName = BRANCHES.find((b) => b.id === targetAgentBranch)?.name || editingAgent.branchName;

      setAgentsList((prev) =>
        prev.map((a) =>
          a.id === editingAgent.id
            ? {
                ...a,
                branchId: targetAgentBranch,
                branchName: assignedBranchName,
                clientPortfolio: portfolioInput,
                specialization: specializationInput,
              }
            : a
        )
      );

      setFeedbackMsg(`Successfully assigned ${editingAgent.fullName} to ${assignedBranchName} for portfolio: "${portfolioInput}".`);
      setEditingAgent(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Assignment error';
      setFeedbackMsg(`Error assigning agent: ${msg}`);
    } finally {
      setIsSavingAgent(false);
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

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

    // Log movement in audit ledger
    const newMovement: StockMovementAudit = {
      id: `mv-${Date.now()}`,
      timestamp: new Date().toISOString(),
      sku: selectedItemForAdjustment.sku,
      productName: selectedItemForAdjustment.productName,
      depotId: activeBranch.id,
      depotName: activeBranch.name,
      movementType: adjustReason === 'damage_writeoff' ? 'DAMAGE_WRITE_OFF' : 'CYCLE_ADJUSTMENT',
      referenceNumber: `ADJ-${Math.floor(1000 + Math.random() * 9000)}`,
      quantityChange: delta,
      balanceAfter: Math.max(0, selectedItemForAdjustment.quantityOnHand + delta),
      performedBy: 'Branch Admin (Depot Yard Inspector)',
      notes: `Manual adjustment logged: ${adjustReason}`,
      batchNumber: selectedItemForAdjustment.batchNumber,
    };
    setAuditMovements((prev) => [newMovement, ...prev]);

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

    // Also record in audit ledger
    const newMovement: StockMovementAudit = {
      id: `mv-${Date.now()}`,
      timestamp: new Date().toISOString(),
      sku: item.sku,
      productName: item.productName,
      depotId: activeBranch.id,
      depotName: activeBranch.name,
      movementType: 'GRN_INTAKE',
      referenceNumber: `GRN-QUICK-${Math.floor(1000 + Math.random() * 9000)}`,
      quantityChange: qty,
      balanceAfter: item.quantityOnHand + qty,
      performedBy: 'Branch Admin (Depot Yard Inspector)',
      notes: `Quick factory intake batch received`,
      batchNumber: item.batchNumber,
    };
    setAuditMovements((prev) => [newMovement, ...prev]);

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

  // WMS Handlers
  const handleOpenGrnModal = (item: InventoryItem) => {
    setGrnTargetItem(item);
    setIsGrnModalOpen(true);
  };

  const handleGrnIssued = (grn: GoodsReceivedNote, updatedQty: number, batchNumber: string) => {
    setInventoryList((prev) =>
      prev.map((i) =>
        i.sku === grn.items[0].sku
          ? {
              ...i,
              quantityOnHand: i.quantityOnHand + updatedQty,
              batchNumber: batchNumber || i.batchNumber,
              updatedAt: new Date().toISOString(),
            }
          : i
      )
    );

    setGrnList((prev) => {
      const next = [grn, ...prev];
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('amg_wms_grn', JSON.stringify(next));
        } catch (e) {}
      }
      return next;
    });

    const newMovement: StockMovementAudit = {
      id: `mv-${Date.now()}`,
      timestamp: grn.date,
      sku: grn.items[0].sku,
      productName: grn.items[0].productName,
      depotId: grn.depotId,
      depotName: grn.depotName,
      movementType: 'GRN_INTAKE',
      referenceNumber: grn.grnNumber,
      quantityChange: updatedQty,
      balanceAfter: (grnTargetItem?.quantityOnHand || 0) + updatedQty,
      performedBy: grn.receivedBy,
      notes: `Waybill ${grn.supplierWaybillNumber} • Truck ${grn.truckPlate} (${grn.driverName})`,
      batchNumber,
    };

    setAuditMovements((prev) => {
      const next = [newMovement, ...prev];
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('amg_wms_audit', JSON.stringify(next));
        } catch (e) {}
      }
      return next;
    });

    setFeedbackMsg(`Issued official Model 19 GRN (${grn.grnNumber}). Added +${updatedQty} to physical stock.`);
  };

  const handleConfirmPickAndStage = (orderId: string, stagingDock: string, pickedBy: string) => {
    let targetOrder: Order | undefined;
    setOrdersList((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          targetOrder = o;
          const updated: Order = {
            ...o,
            pickingStatus: 'staged',
            stagingDock,
            pickedBy,
            stagedAt: new Date().toISOString(),
          };
          addServerOrder(updated);
          if (typeof window !== 'undefined') {
            try {
              const local = localStorage.getItem('amg_live_orders');
              const list = local ? JSON.parse(local) : [];
              const nextList = [
                updated,
                ...list.filter((x: any) => x.id !== updated.id && x.orderNumber !== updated.orderNumber),
              ];
              localStorage.setItem('amg_live_orders', JSON.stringify(nextList));
              window.dispatchEvent(new CustomEvent('amg_orders_updated', { detail: updated }));
            } catch (e) {}
          }
          return updated;
        }
        return o;
      })
    );

    if (targetOrder) {
      const newMovement: StockMovementAudit = {
        id: `mv-${Date.now()}`,
        timestamp: new Date().toISOString(),
        sku: targetOrder.items[0]?.sku || 'MULTIPLE',
        productName: targetOrder.items[0]?.productName || 'Order Items',
        depotId: activeBranch.id,
        depotName: activeBranch.name,
        movementType: 'PICK_STAGING',
        referenceNumber: targetOrder.orderNumber,
        quantityChange: -(targetOrder.items[0]?.quantity || 0),
        balanceAfter: (branchInventory.find((i) => i.sku === targetOrder?.items[0]?.sku)?.quantityOnHand || 100),
        performedBy: pickedBy,
        notes: `Picked from yard bays and staged at ${stagingDock}`,
      };
      setAuditMovements((prev) => [newMovement, ...prev]);
    }

    setFeedbackMsg(`Order ${targetOrder?.orderNumber || orderId} picked and staged at ${stagingDock}. Ready for Gate Clearance Pass.`);
  };

  const handleWeighbridgeScaleConfirmed = (ticket: WeighbridgeTicket) => {
    const targetOrder = ordersList.find((o) => o.orderNumber === ticket.orderNumber);
    if (targetOrder) {
      const updated: Order = {
        ...targetOrder,
        status: 'completed',
        weighbridgeTicket: ticket,
      };
      setOrdersList((prev) => prev.map((o) => (o.id === targetOrder.id ? updated : o)));
      addServerOrder(updated);
      if (typeof window !== 'undefined') {
        try {
          const local = localStorage.getItem('amg_live_orders');
          const list = local ? JSON.parse(local) : [];
          const nextList = [
            updated,
            ...list.filter((x: any) => x.id !== updated.id && x.orderNumber !== updated.orderNumber),
          ];
          localStorage.setItem('amg_live_orders', JSON.stringify(nextList));
          window.dispatchEvent(new CustomEvent('amg_orders_updated', { detail: updated }));
        } catch (e) {}
      }

      const newMovement: StockMovementAudit = {
        id: `mv-${Date.now()}`,
        timestamp: ticket.timestamp,
        sku: targetOrder.items[0]?.sku || 'MULTIPLE',
        productName: targetOrder.items[0]?.productName || 'Consignment Cargo',
        depotId: activeBranch.id,
        depotName: activeBranch.name,
        movementType: 'DISPATCH_FULFILLMENT',
        referenceNumber: ticket.ticketNumber,
        quantityChange: -(targetOrder.items[0]?.quantity || 0),
        balanceAfter: (branchInventory.find((i) => i.sku === targetOrder?.items[0]?.sku)?.quantityOnHand || 100),
        performedBy: ticket.weighmasterName,
        notes: `Gate Exit weighed at ${ticket.gateNumber}. Net Cargo: ${ticket.netWeightKg} KG (${ticket.weightVarianceKg >= 0 ? '+' : ''}${ticket.weightVarianceKg} KG variance).`,
      };
      setAuditMovements((prev) => [newMovement, ...prev]);

      setScanResult({
        order: updated,
        message: `WEIGHBRIDGE & GATE CLEARANCE APPROVED: Ticket ${ticket.ticketNumber} verified! Net Cargo ${ticket.netWeightKg.toLocaleString()} KG passed Gate 04 scale. Order marked COMPLETED.`,
      });
      setFeedbackMsg(`Consignment released through Gate 04 weighbridge scale (Ticket: ${ticket.ticketNumber}).`);
    }
  };

  const handleGenerateGatePass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDispatchOrder) return;

    const pass = `GATE-PASS-${Math.floor(100000 + Math.random() * 900000)}`;
    setGatePassCode(pass);

    const updatedOrder: Order = {
      ...activeDispatchOrder,
      status: 'shipped',
      gatePassCode: pass,
      driverName,
      truckPlate,
      dispatchedAt: new Date().toISOString(),
    };

    setOrdersList((prev) =>
      prev.map((o) => (o.id === activeDispatchOrder.id ? updatedOrder : o))
    );

    // Persist to server store
    addServerOrder(updatedOrder);

    // Persist to localStorage and broadcast so Customer Portal updates immediately
    if (typeof window !== 'undefined') {
      try {
        const local = localStorage.getItem('amg_live_orders');
        const list = local ? JSON.parse(local) : [];
        const nextList = [
          updatedOrder,
          ...list.filter((o: any) => o.id !== updatedOrder.id && o.orderNumber !== updatedOrder.orderNumber),
        ];
        localStorage.setItem('amg_live_orders', JSON.stringify(nextList));
        window.dispatchEvent(new CustomEvent('amg_orders_updated', { detail: updatedOrder }));
      } catch (e) {}
    }
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
    const orderMatch = ordersList.find(
      (o) =>
        o.orderNumber.toLowerCase() === query.toLowerCase() ||
        (o.gatePassCode && o.gatePassCode.toLowerCase() === query.toLowerCase())
    );

    if (invMatch) {
      setScanResult({
        item: invMatch,
        message: `MATCHED PRODUCT: ${invMatch.productName} (On-Hand: ${invMatch.quantityOnHand} units in Bay 4)`,
      });
    } else if (orderMatch) {
      setScanResult({
        order: orderMatch,
        message: `MATCHED CONSIGNMENT: Order ${orderMatch.orderNumber} (Gate Pass: ${orderMatch.gatePassCode || query}) - ${orderMatch.customerName} (${orderMatch.items.length} line items authorized for clearance).`,
      });
    } else {
      setScanResult({
        message: `Barcode / Gate Pass "${query}" verified in physical scan ledger. Item logged for yard audit.`,
      });
    }
  };

  const handleCompleteOrderRelease = (orderToComplete: Order) => {
    const updated: Order = {
      ...orderToComplete,
      status: 'completed',
    };
    setOrdersList((prev) =>
      prev.map((o) => (o.id === orderToComplete.id ? updated : o))
    );
    addServerOrder(updated);
    if (typeof window !== 'undefined') {
      try {
        const local = localStorage.getItem('amg_live_orders');
        const list = local ? JSON.parse(local) : [];
        const nextList = [
          updated,
          ...list.filter((o: any) => o.id !== updated.id && o.orderNumber !== updated.orderNumber),
        ];
        localStorage.setItem('amg_live_orders', JSON.stringify(nextList));
        window.dispatchEvent(new CustomEvent('amg_orders_updated', { detail: updated }));
      } catch (e) {}
    }
    setScanResult({
      order: updated,
      message: `GATE CLEARANCE APPROVED: Order ${updated.orderNumber} successfully released through Gate 04 weighbridge. Order marked COMPLETED!`,
    });
    setFeedbackMsg(`Order ${updated.orderNumber} released from loading dock. Physical collection completed.`);
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
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0B0B0C] text-[#0B0B0C] dark:text-[#E4E4E7] transition-colors duration-200 pb-20">
      {/* 1. EXECUTIVE THEME HERO BANNER (Flagship Obsidian & Lime Luxury Authority) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <div className="bg-[#0B0B0C] text-white rounded-3xl p-6 sm:p-8 border border-[#1A1A1D] shadow-2xl relative overflow-hidden group hover:border-[#C6F432]/30 transition-all duration-300">
          {/* Ambient Lime Glows */}
          <div className="absolute -top-32 -right-32 w-[24rem] h-[24rem] bg-[#C6F432]/10 rounded-full blur-3xl pointer-events-none group-hover:bg-[#C6F432]/15 transition-all duration-700" />
          <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-[#C6F432]/5 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 bg-[#141416] border border-[#2A2A2E] rounded-full text-xs font-medium text-[#E4E4E7]">
                  <span className="w-2 h-2 rounded-full bg-[#C6F432] inline-block shadow-[0_0_8px_#C6F432]" />
                  <span className="font-semibold tracking-wide">Tier 3: Regional Depot &amp; Mill Operations</span>
                  <span className="text-[#52525B]">|</span>
                  <span className="text-[#C6F432] font-mono text-[11px] font-semibold">{activeBranch.code}</span>
                </div>
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-[#141416] border border-[#2A2A2E] rounded-full text-[11px] text-[#A1A1AA]">
                  <Truck className="w-3.5 h-3.5 text-[#C6F432]" />
                  <span>{activeBranch.city} Central Depot</span>
                </div>
              </div>

              <h1 className="text-2xl sm:text-4xl font-serif font-black tracking-tight leading-tight text-white">
                Regional Branch &amp; Warehouse Logistics Portal
              </h1>

              <p className="text-xs sm:text-sm text-[#A1A1AA] font-sans leading-relaxed max-w-2xl">
                Operating scope assigned to regional mill facilities. Stock threshold alarms, factory mill intake, yard dispatch, and physical gate pass verification under verified enterprise standards.
              </p>
            </div>

            {/* Operating Branch Scope Selector */}
            <div className="shrink-0 flex items-center lg:self-center">
              <div className="bg-[#141416]/90 border border-[#2A2A2E] hover:border-[#C6F432]/40 rounded-xl px-3 py-2 shadow-sm transition-all sm:w-72 w-full">
                <div className="flex items-center justify-between text-[10px] uppercase font-bold text-[#71717A] tracking-wider mb-1.5 px-0.5">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C6F432] shadow-[0_0_6px_#C6F432]" />
                    Depot Scope
                  </span>
                  <span className="text-[#C6F432] font-mono text-[10px] font-semibold">{activeBranch.code}</span>
                </div>
                <div className="relative">
                  <select
                    value={selectedBranchId}
                    onChange={(e) => setSelectedBranchId(e.target.value)}
                    className="w-full appearance-none bg-[#0E0E10] border border-[#2A2A2E] hover:border-[#3E3E44] focus:border-[#C6F432] text-white font-medium pl-2.5 pr-7 py-1.5 rounded-lg text-xs outline-none transition-colors cursor-pointer"
                  >
                    <option value="all">All Regional Depots ({ordersList.length} orders)</option>
                    {BRANCHES.map((b) => {
                      const count = ordersList.filter((o) => o.fulfillmentBranchId === b.id).length;
                      return (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.city}) {count > 0 ? `• [${count}]` : ''}
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-[#A1A1AA] pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
                </div>
                <div className="text-[10px] text-[#71717A] mt-1 px-0.5 flex items-center space-x-1 font-mono">
                  <MapPin className="w-2.5 h-2.5 text-[#C6F432] shrink-0" />
                  <span className="truncate">{activeBranch.address}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Role Boundary Notice */}
          {!isBranchAdmin && (
            <div className="mt-6 pt-4 border-t border-[#1F1F24] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-200 text-xs">
              <div className="flex items-center space-x-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Your active session is currently set to <strong>{currentUser.role}</strong>. Viewing branch depot controls in simulation mode.
                </span>
              </div>
              <button
                type="button"
                onClick={() => switchRole('branch_admin')}
                className="px-3.5 py-1.5 bg-[#C6F432] hover:bg-[#D7F860] text-[#0B0B0C] font-bold text-xs rounded-full transition-all shrink-0 flex items-center space-x-1 shadow-sm"
              >
                <span>Switch to Branch Admin</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 2. BODY CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-xs">
        {feedbackMsg && (
          <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 p-4 rounded-2xl flex items-center space-x-2 font-semibold text-xs shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-[#C6F432] shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Operational KPI Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#141416] border border-[#E4E4E7] dark:border-[#1F1F24] p-5 rounded-2xl space-y-1 shadow-xs hover:border-[#C6F432]/40 transition-all">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA] block">
              Depot Stock Line Items
            </span>
            <div className="text-2xl font-black font-mono text-[#0B0B0C] dark:text-[#C6F432]">
              {branchInventory.length} Managed SKUs
            </div>
            <span className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">Live sync with ERP</span>
          </div>

          <div className="bg-white dark:bg-[#141416] border border-[#E4E4E7] dark:border-[#1F1F24] p-5 rounded-2xl space-y-1 shadow-xs hover:border-[#C6F432]/40 transition-all">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA] block">
              Low Stock Warnings
            </span>
            <div className="text-2xl font-black font-mono text-amber-500">
              {branchInventory.filter((i) => i.quantityOnHand <= i.safetyStockThreshold).length} Reorder Triggers
            </div>
            <span className="text-[11px] text-amber-600 dark:text-amber-400">Under safety threshold</span>
          </div>

          <div className="bg-white dark:bg-[#141416] border border-[#E4E4E7] dark:border-[#1F1F24] p-5 rounded-2xl space-y-1 shadow-xs hover:border-[#C6F432]/40 transition-all">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA] block">
              Awaiting Freight Dispatch
            </span>
            <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
              {branchOrders.filter((o) => o.status !== 'completed' && o.status !== 'shipped').length} Orders
            </div>
            <span className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">Scheduled for loading</span>
          </div>

          <div className="bg-white dark:bg-[#141416] border border-[#E4E4E7] dark:border-[#1F1F24] p-5 rounded-2xl space-y-1 shadow-xs hover:border-[#C6F432]/40 transition-all">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA] block">
              Plant Dispatch Gate
            </span>
            <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              Gate 04 Operational
            </div>
            <span className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">Weighbridge calibrated</span>
          </div>
        </div>

        {/* Navigation Tabs (Hero-style pill chips with horizontal scroll) */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          {[
            { id: 'inventory', label: 'Depot Inventory Ledger', icon: Boxes },
            { id: 'dispatch', label: 'Picking, Staging & Gate Exit', count: branchOrders.length, icon: Truck },
            { id: 'grn', label: 'Model 19 (GRN) Archive', count: grnList.length, icon: FileText },
            { id: 'audit', label: 'Movement Audit Ledger', count: auditMovements.length, icon: History },
            { id: 'agents', label: 'Sales Agent Assignments', count: subsidiaryAgents.length, icon: Users },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  if (typeof window !== 'undefined') {
                    const url = new URL(window.location.href);
                    url.searchParams.set('tab', tab.id);
                    window.history.pushState({}, '', url.toString());
                  }
                }}
                className={`px-4 py-2 font-semibold transition-all rounded-full whitespace-nowrap text-xs flex items-center space-x-1.5 ${
                  isActive
                    ? 'bg-[#C6F432] text-[#0B0B0C] font-bold shadow-[0_0_12px_rgba(198,244,50,0.25)] border border-[#C6F432]'
                    : 'bg-white dark:bg-[#141416] text-[#71717A] dark:text-[#A1A1AA] border border-[#E4E4E7] dark:border-[#2A2A2E] hover:text-[#0B0B0C] dark:hover:text-white hover:border-[#C6F432]/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span
                    className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      isActive
                        ? 'bg-[#0B0B0C] text-[#C6F432]'
                        : 'bg-[#F4F4F5] dark:bg-[#0E0E10] text-[#71717A] dark:text-[#A1A1AA] border border-[#E4E4E7] dark:border-[#2A2A2E]'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Local Inventory Ledger */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#141416] border border-[#E4E4E7] dark:border-[#1F1F24] rounded-2xl shadow-xs p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E4E4E7] dark:border-[#1F1F24] gap-2">
                <div className="flex items-center space-x-2">
                  <Boxes className="w-4 h-4 text-[#C6F432]" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-serif">
                    Physical Inventory &amp; Warehouse Storage Ledger ({activeBranch.city})
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
                    className="px-3.5 py-1.5 bg-[#C6F432] hover:bg-[#D7F860] text-[#0B0B0C] font-bold rounded-xl text-xs transition-all flex items-center space-x-1.5 shadow-sm"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Launch Barcode / QR Scanner</span>
                  </button>
                  <span className="text-[#71717A] dark:text-[#A1A1AA] font-mono text-[11px]">
                    Branch Code: {activeBranch.code}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-[#E4E4E7] dark:border-[#1F1F24]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F4F4F5] dark:bg-[#0E0E10] text-[#71717A] dark:text-[#A1A1AA] font-semibold border-b border-[#E4E4E7] dark:border-[#222225]">
                    <tr>
                      <th className="py-2.5 px-3">SKU &amp; Product</th>
                      <th className="py-2.5 px-3">Yard Bay &amp; Batch Traceability</th>
                      <th className="py-2.5 px-3">Subsidiary</th>
                      <th className="py-2.5 px-3 text-right">Physical On-Hand</th>
                      <th className="py-2.5 px-3 text-right">Reserved</th>
                      <th className="py-2.5 px-3 text-right">Safety Threshold</th>
                      <th className="py-2.5 px-3 text-center">Depot Intake &amp; WMS Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E4E7] dark:divide-[#1F1F24] text-slate-700 dark:text-slate-300">
                    {branchInventory.length > 0 ? (
                      branchInventory.map((item) => {
                        const isLow = item.quantityOnHand <= item.safetyStockThreshold;
                        return (
                          <tr key={item.id} className="hover:bg-[#F9FAFB] dark:hover:bg-[#18181B]/60 transition-colors">
                            <td className="py-2.5 px-3">
                              <div className="font-mono font-bold text-[#0B0B0C] dark:text-[#C6F432]">{item.sku}</div>
                              <div className="font-semibold text-slate-900 dark:text-white">{item.productName}</div>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1">
                                <Warehouse className="w-3.5 h-3.5 text-emerald-600 dark:text-[#C6F432]" />
                                <span>{item.bayLocation || 'Yard Bay 04 • Shed B'}</span>
                              </div>
                              <div className="text-[10px] font-mono text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
                                Batch: <span className="font-bold text-slate-700 dark:text-slate-300">{item.batchNumber || 'BATCH-2026-ACTIVE'}</span>
                                {item.millTestCert && (
                                  <span className="ml-1 text-emerald-600 dark:text-[#C6F432]">[{item.millTestCert}]</span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-[#71717A] dark:text-[#A1A1AA]">{item.subsidiaryName}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white text-sm">
                              {item.quantityOnHand.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-[#71717A] dark:text-[#A1A1AA]">
                              {item.quantityReserved.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono">
                              <span
                                className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                  isLow
                                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-800/60'
                                    : 'bg-slate-100 dark:bg-[#0E0E10] text-slate-700 dark:text-slate-300 border border-[#E4E4E7] dark:border-[#2A2A2E]'
                                }`}
                              >
                                {item.safetyStockThreshold} {isLow ? '⚠️ REORDER' : ''}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center space-x-1 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleOpenGrnModal(item)}
                                className="px-2.5 py-1 bg-[#141416] hover:bg-[#1A1A1D] text-[#C6F432] rounded-lg font-bold text-[10px] transition-all shadow-xs inline-flex items-center space-x-1 border border-[#2A2A2E]"
                                title="Issue official Ethiopian Model 19 Goods Received Note with supplier waybill"
                              >
                                <FileText className="w-3 h-3 text-[#C6F432]" />
                                <span>Log GRN (ሞዴል 19)</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuickBatchIntake(item, 50)}
                                className="px-2 py-1 bg-emerald-100 dark:bg-emerald-950/60 hover:bg-emerald-200 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60 rounded-lg font-bold text-[10px] transition-all shadow-xs"
                                title="Quick factory delivery of +50 units"
                              >
                                +50
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuickBatchIntake(item, 500)}
                                className="px-2 py-1 bg-sky-100 dark:bg-sky-950/60 hover:bg-sky-200 dark:hover:bg-sky-900 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800/60 rounded-lg font-bold text-[10px] transition-all shadow-xs"
                                title="Quick major consignment of +500 units"
                              >
                                +500
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedItemForAdjustment(item)}
                                className="px-2 py-1 bg-slate-100 dark:bg-[#1A1A1D] hover:bg-slate-200 dark:hover:bg-slate-800 border border-[#E4E4E7] dark:border-[#2A2A2E] rounded-lg font-bold text-[10px] text-slate-800 dark:text-slate-300 transition-all"
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
                                  className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-black rounded-lg font-bold text-[10px] transition-all shadow-xs"
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
                        <td colSpan={7} className="text-center py-6 text-[#71717A] dark:text-[#A1A1AA]">
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
              <div className="bg-[#F9FAFB] dark:bg-[#141416] border border-[#E4E4E7] dark:border-[#1F1F24] p-5 rounded-2xl space-y-4 shadow-xs">
                <div className="flex justify-between items-center border-b border-[#E4E4E7] dark:border-[#1F1F24] pb-2">
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center space-x-1.5 font-serif">
                    <ArrowUpDown className="w-4 h-4 text-[#C6F432]" />
                    <span>
                      Log Warehouse Inventory Movement: {selectedItemForAdjustment.productName} ({selectedItemForAdjustment.sku})
                    </span>
                  </h4>
                  <button
                    onClick={() => setSelectedItemForAdjustment(null)}
                    className="text-[#71717A] hover:text-slate-900 dark:hover:text-white font-bold"
                  >
                    Cancel ✕
                  </button>
                </div>

                <form onSubmit={handleAdjustStock} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Movement Category:
                    </label>
                    <select
                      value={adjustReason}
                      onChange={(e) => setAdjustReason(e.target.value)}
                      className="w-full border border-[#E4E4E7] dark:border-[#2A2A2E] bg-white dark:bg-[#0E0E10] text-slate-900 dark:text-white px-3 py-2 rounded-xl text-xs outline-none focus:border-[#C6F432]"
                    >
                      <option value="stock_intake">Stock Intake (Factory Mill Delivery)</option>
                      <option value="dispatch">Customer Branch Pickup Clearance</option>
                      <option value="damage_writeoff">Damage / Quality Defect Rejection</option>
                      <option value="reconciliation">Physical Inventory Cycle Count Audit</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Units Count:
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={adjustQty}
                      onChange={(e) => setAdjustQty(Number(e.target.value))}
                      className="w-full border border-[#E4E4E7] dark:border-[#2A2A2E] bg-white dark:bg-[#0E0E10] text-slate-900 dark:text-white px-3 py-2 rounded-xl font-mono text-xs outline-none focus:border-[#C6F432]"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full py-2 bg-[#C6F432] hover:bg-[#D7F860] text-[#0B0B0C] font-bold rounded-xl transition-all text-xs shadow-md"
                    >
                      Record Warehouse Movement
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Regional Order Fulfillment & Gate Pass Generator */}
        {activeTab === 'dispatch' && (
          <div className="bg-white dark:bg-[#141416] border border-[#E4E4E7] dark:border-[#1F1F24] rounded-2xl shadow-xs p-6 space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-[#E4E4E7] dark:border-[#1F1F24]">
              <Truck className="w-4 h-4 text-[#C6F432]" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-serif">
                Regional Order Fulfillment &amp; Gate Clearance Queue
              </h3>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#E4E4E7] dark:border-[#1F1F24]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F4F4F5] dark:bg-[#0E0E10] text-[#71717A] dark:text-[#A1A1AA] font-semibold border-b border-[#E4E4E7] dark:border-[#222225]">
                  <tr>
                    <th className="py-2.5 px-3">Order Number</th>
                    <th className="py-2.5 px-3">Buyer Company</th>
                    <th className="py-2.5 px-3">Delivery Method</th>
                    <th className="py-2.5 px-3">Order Status</th>
                    <th className="py-2.5 px-3">WMS Staging Status</th>
                    <th className="py-2.5 px-3">Consignment</th>
                    <th className="py-2.5 px-3 text-center">Fulfillment &amp; Weighbridge Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E4E7] dark:divide-[#1F1F24] text-slate-700 dark:text-slate-300">
                  {branchOrders.length > 0 ? (
                    branchOrders.map((ord) => {
                      const isStaged = ord.pickingStatus === 'staged';
                      return (
                        <tr key={ord.id} className="hover:bg-[#F9FAFB] dark:hover:bg-[#18181B]/60 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-[#0B0B0C] dark:text-[#C6F432]">{ord.orderNumber}</td>
                          <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">
                            {ord.customerName}
                            <span className="block text-[10px] text-[#71717A] dark:text-[#A1A1AA]">{ord.customerCompany}</span>
                          </td>
                          <td className="py-2.5 px-3 capitalize text-slate-700 dark:text-slate-300">
                            {ord.deliveryType.replace(/_/g, ' ')}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60 rounded-full font-bold text-[10px] uppercase">
                              {ord.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            {isStaged ? (
                              <div className="space-y-0.5">
                                <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800/60 rounded-full font-bold text-[10px] flex items-center w-fit space-x-1">
                                  <Warehouse className="w-3 h-3 text-emerald-700 dark:text-[#C6F432]" />
                                  <span>Staged: {ord.stagingDock?.split('(')[0] || 'Dock 02'}</span>
                                </span>
                                <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] block font-mono">
                                  By: {ord.pickedBy?.split(' ')[0] || 'Yard Staff'}
                                </span>
                              </div>
                            ) : (
                              <span className="px-2.5 py-0.5 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 rounded-full font-medium text-[10px]">
                                Awaiting Picking
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
                            {ord.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                          </td>
                          <td className="py-2.5 px-3 text-center space-x-1.5 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => {
                                setActivePickOrder(ord);
                                setIsPickModalOpen(true);
                              }}
                              className="px-2.5 py-1.5 bg-[#141416] hover:bg-[#1A1A1D] text-white border border-[#2A2A2E] rounded-xl font-bold text-[10px] transition-all inline-flex items-center space-x-1 shadow-xs"
                              title="Generate Picking List with Yard Bay addresses and assign Staging Dock"
                            >
                              <ClipboardList className="w-3 h-3 text-[#C6F432]" />
                              <span>{isStaged ? 'Review Pick' : '1. Pick & Stage'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setActiveDispatchOrder(ord);
                                setGatePassCode(null);
                              }}
                              className="px-2.5 py-1.5 bg-[#C6F432] hover:bg-[#D7F860] text-[#0B0B0C] font-bold rounded-xl text-[10px] transition-all inline-flex items-center space-x-1 shadow-md"
                            >
                              <Truck className="w-3 h-3" />
                              <span>2. Gate Pass</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setActiveWeighbridgeOrder(ord);
                                setIsWeighbridgeModalOpen(true);
                              }}
                              className="px-2.5 py-1.5 bg-slate-100 dark:bg-[#1A1A1D] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-[#C6F432] font-bold rounded-xl text-[10px] transition-all inline-flex items-center space-x-1 border border-[#E4E4E7] dark:border-[#2A2A2E] shadow-xs"
                              title="Open Weighbridge Scale Terminal to log axle weight and scale ticket"
                            >
                              <Scale className="w-3 h-3" />
                              <span>3. Weighbridge</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-6 text-[#71717A] dark:text-[#A1A1AA]">
                        No active orders queued for clearance at this depot.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Model 19 (GRN) Archive Tab */}
        {activeTab === 'grn' && (
          <GrnArchiveView grnList={grnList} depotName={activeBranch.name} />
        )}

        {/* Warehouse Stock Movement Audit Ledger Tab */}
        {activeTab === 'audit' && (
          <MovementAuditView movements={auditMovements} depotName={activeBranch.name} />
        )}

        {/* Sales Agent & Client Portfolio Assignments Tab (SRS Section 2) */}
        {activeTab === 'agents' && (
          <div className="bg-white dark:bg-[#141416] border border-[#E4E4E7] dark:border-[#1F1F24] rounded-2xl shadow-xs p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E4E4E7] dark:border-[#1F1F24] gap-2">
              <div>
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-[#C6F432]" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-serif">
                    Subsidiary Sales Agent &amp; Client Portfolio Assignments
                  </h3>
                </div>
                <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
                  Assign specialized sales engineers to client portfolios within your subsidiary boundary.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-[#141416] border border-[#2A2A2E] text-[#E4E4E7] text-[10px] font-bold rounded-full">
                  <Shield className="w-3 h-3 text-[#C6F432]" />
                  <span>Boundary: {activeSubsidiaryName}</span>
                </span>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search agents or portfolios..."
                    value={agentSearch}
                    onChange={(e) => setAgentSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 border border-[#E4E4E7] dark:border-[#2A2A2E] rounded-xl text-xs bg-[#F4F4F5] dark:bg-[#0E0E10] text-slate-900 dark:text-white focus:border-[#C6F432] outline-none w-56 font-sans"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#E4E4E7] dark:border-[#1F1F24]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F4F4F5] dark:bg-[#0E0E10] text-[#71717A] dark:text-[#A1A1AA] font-semibold border-b border-[#E4E4E7] dark:border-[#222225]">
                  <tr>
                    <th className="py-2.5 px-3">Sales Agent</th>
                    <th className="py-2.5 px-3">Subsidiary Division</th>
                    <th className="py-2.5 px-3">Assigned Branch Hub</th>
                    <th className="py-2.5 px-3">Engineering Specialization</th>
                    <th className="py-2.5 px-3">Client Portfolio Assignment</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E4E7] dark:divide-[#1F1F24] text-slate-700 dark:text-slate-300">
                  {filteredAgents.length > 0 ? (
                    filteredAgents.map((agent) => (
                      <tr key={agent.id} className="hover:bg-[#F9FAFB] dark:hover:bg-[#18181B]/60 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900 dark:text-white">{agent.fullName}</div>
                          <div className="text-[10px] font-mono text-[#71717A] dark:text-[#A1A1AA]">{agent.email}</div>
                          <div className="text-[10px] font-mono text-[#71717A] dark:text-[#A1A1AA]">{agent.phone}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-[#0E0E10] text-slate-800 dark:text-[#C6F432] border border-[#E4E4E7] dark:border-[#2A2A2E] rounded-md font-semibold text-[10px] block w-fit">
                            {agent.subsidiaryName || 'General Industrial'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center space-x-1">
                            <MapPin className="w-3 h-3 text-[#C6F432]" />
                            <span>{agent.branchName || 'Adama Industrial Park Hub'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-[#0E0E10] border border-[#E4E4E7] dark:border-[#2A2A2E] px-2.5 py-0.5 rounded-md inline-block">
                            {agent.specialization || 'Technical Industrial Sales'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900 dark:text-white font-mono text-[11px]">
                            {agent.clientPortfolio || 'General Enterprise Accounts'}
                          </div>
                          <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA]">Certified dedicated account desk</span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleOpenAssignModal(agent)}
                            className="px-3.5 py-1.5 bg-[#C6F432] hover:bg-[#D7F860] text-[#0B0B0C] font-bold rounded-xl text-[11px] transition-all shadow-xs flex items-center space-x-1 mx-auto"
                          >
                            <Briefcase className="w-3 h-3" />
                            <span>Reassign Portfolio</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-[#71717A] dark:text-[#A1A1AA]">
                        No sales agents found within this subsidiary boundary.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Gate Pass Modal */}
        {activeDispatchOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white dark:bg-[#0E0E10] border border-[#E4E4E7] dark:border-[#2A2A2E] rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-7 space-y-4 text-xs text-slate-800 dark:text-slate-200">
              <div className="flex justify-between items-center border-b border-[#E4E4E7] dark:border-[#1F1F24] pb-3">
                <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold">
                  <QrCode className="w-5 h-5 text-[#C6F432]" />
                  <span className="text-sm uppercase tracking-wider font-serif">AMG Plant Gate Clearance Pass: {activeDispatchOrder.orderNumber}</span>
                </div>
                <button
                  onClick={() => setActiveDispatchOrder(null)}
                  className="text-[#71717A] hover:text-slate-900 dark:hover:text-white font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              {gatePassCode ? (
                <div className="text-center py-4 space-y-3">
                  <div className="flex justify-center p-3 bg-white rounded-2xl w-fit mx-auto border border-[#E4E4E7]">
                    <QrCodeView value={gatePassCode} size={150} />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white font-serif">Gate Pass Issued &amp; Ready for Yard Exit</h4>
                    <span className="font-mono text-lg font-extrabold text-[#0B0B0C] dark:text-[#C6F432] block mt-1">
                      {gatePassCode}
                    </span>
                    <span className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
                      Truck Plate: {truckPlate} • Driver: {driverName}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Order status transitioned to <strong>SHIPPED / DISPATCHED</strong> in ERP master ledger.
                  </p>
                  <button
                    onClick={() => setActiveDispatchOrder(null)}
                    className="w-full py-2.5 bg-[#C6F432] hover:bg-[#D7F860] text-[#0B0B0C] font-bold rounded-xl text-xs transition-all shadow-md"
                  >
                    Done &amp; Close Clearance Slip
                  </button>
                </div>
              ) : (
                <form onSubmit={handleGenerateGatePass} className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Assigned Driver Legal Name:
                    </label>
                    <input
                      type="text"
                      required
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      className="w-full bg-[#F4F4F5] dark:bg-[#141416] border border-[#E4E4E7] dark:border-[#2A2A2E] px-3.5 py-2 rounded-xl text-slate-900 dark:text-white focus:border-[#C6F432] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Commercial Vehicle License Plate:
                    </label>
                    <input
                      type="text"
                      required
                      value={truckPlate}
                      onChange={(e) => setTruckPlate(e.target.value)}
                      className="w-full bg-[#F4F4F5] dark:bg-[#141416] border border-[#E4E4E7] dark:border-[#2A2A2E] px-3.5 py-2 rounded-xl text-slate-900 dark:text-white font-mono focus:border-[#C6F432] outline-none"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-[#C6F432] hover:bg-[#D7F860] text-[#0B0B0C] font-bold rounded-xl text-xs transition-all flex items-center justify-center space-x-1.5 shadow-md"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
            <div className="bg-white dark:bg-[#0E0E10] border border-[#E4E4E7] dark:border-[#2A2A2E] rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-7 space-y-4 text-xs text-slate-800 dark:text-slate-200">
              <div className="flex justify-between items-center border-b border-[#E4E4E7] dark:border-[#1F1F24] pb-3">
                <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold">
                  <QrCode className="w-5 h-5 text-[#C6F432]" />
                  <span className="text-sm uppercase tracking-wider font-serif">Depot Barcode &amp; QR Terminal</span>
                </div>
                <button
                  onClick={() => setIsScannerOpen(false)}
                  className="text-[#71717A] hover:text-slate-900 dark:hover:text-white font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              {/* Simulated Camera Viewfinder */}
              <div className="relative bg-[#0B0B0C] border border-[#1A1A1D] rounded-2xl h-48 flex flex-col items-center justify-center text-center p-4 overflow-hidden">
                <div className="w-36 h-36 border-2 border-[#C6F432] border-dashed rounded-xl flex items-center justify-center relative animate-pulse">
                  <div className="w-full h-0.5 bg-[#C6F432] absolute shadow-[0_0_8px_#C6F432]" />
                  <QrCode className="w-16 h-16 text-[#C6F432]/30" />
                </div>
                <span className="text-[10px] text-[#C6F432] mt-2 font-mono">
                  Targeting Camera Feed • Align Barcode / Consignment Gate Pass
                </span>
              </div>

              <form onSubmit={handleScanBarcode} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Manual Barcode Input / Hardware Laser Scan:
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      required
                      placeholder="e.g. GATE-PASS-904424, SKU, or Order #"
                      value={scannedBarcode}
                      onChange={(e) => setScannedBarcode(e.target.value)}
                      className="flex-1 bg-[#F4F4F5] dark:bg-[#141416] border border-[#E4E4E7] dark:border-[#2A2A2E] px-3.5 py-2 text-xs font-mono rounded-xl text-slate-900 dark:text-white focus:border-[#C6F432] outline-none"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#C6F432] hover:bg-[#D7F860] text-[#0B0B0C] font-bold rounded-xl text-xs transition-all shadow-md shrink-0"
                    >
                      Scan
                    </button>
                  </div>
                </div>
              </form>

              {scanResult && (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200 rounded-2xl space-y-2">
                  <div className="font-bold text-xs flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-[#C6F432]" />
                    <span>Scan Verification Logged</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">{scanResult.message}</p>
                  {scanResult.order && scanResult.order.status !== 'completed' && (
                    <div className="space-y-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveWeighbridgeOrder(scanResult.order!);
                          setIsWeighbridgeModalOpen(true);
                          setIsScannerOpen(false);
                        }}
                        className="w-full py-2 bg-[#141416] hover:bg-[#1A1A1D] text-[#C6F432] font-bold rounded-xl text-xs transition-all flex items-center justify-center space-x-1.5 shadow-sm border border-[#2A2A2E]"
                      >
                        <Scale className="w-4 h-4 text-[#C6F432]" />
                        <span>Perform Weighbridge Axle Scale Verification</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCompleteOrderRelease(scanResult.order!)}
                        className="w-full py-2 bg-[#C6F432] hover:bg-[#D7F860] text-[#0B0B0C] font-bold rounded-xl text-xs transition-all flex items-center justify-center space-x-1.5 shadow-md"
                      >
                        <CheckCircle2 className="w-4 h-4 text-[#0B0B0C]" />
                        <span>Authorize Gate Exit &amp; Complete Consignment</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(false)}
                  className="px-4 py-2 border border-[#E4E4E7] dark:border-[#2A2A2E] bg-slate-100 dark:bg-[#1A1A1D] text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-200 dark:hover:bg-slate-800 transition-all"
                >
                  Close Terminal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Automated Restocking PO Generator (SRS 5.3) */}
        {restockModalItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
            <div className="bg-white dark:bg-[#0E0E10] border border-[#E4E4E7] dark:border-[#2A2A2E] rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-7 space-y-4 text-xs text-slate-800 dark:text-slate-200">
              <div className="flex justify-between items-center border-b border-[#E4E4E7] dark:border-[#1F1F24] pb-3">
                <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <span className="text-sm uppercase tracking-wider font-serif">Automated Supplier Requisition</span>
                </div>
                <button
                  onClick={() => setRestockModalItem(null)}
                  className="text-[#71717A] hover:text-slate-900 dark:hover:text-white font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 p-3.5 rounded-2xl space-y-1 text-amber-900 dark:text-amber-200">
                <div className="font-bold text-xs">Stock Deficit Warning: {restockModalItem.productName}</div>
                <div className="text-[11px] flex justify-between font-mono">
                  <span>Current Physical On-Hand: <strong>{restockModalItem.quantityOnHand}</strong></span>
                  <span>Safety Threshold: <strong>{restockModalItem.safetyStockThreshold}</strong></span>
                </div>
              </div>

              <form onSubmit={handleIssueRestockPo} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Target Manufacturing Foundry / Supplier Mill:
                  </label>
                  <input
                    type="text"
                    readOnly
                    value="AMG Central Rolling Mills & Industrial Foundry Complex"
                    className="w-full border border-[#E4E4E7] dark:border-[#2A2A2E] bg-[#F4F4F5] dark:bg-[#141416] px-3.5 py-2 text-xs rounded-xl font-semibold text-slate-700 dark:text-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Replenishment Quantity Requisition:
                  </label>
                  <input
                    type="number"
                    min={50}
                    step={50}
                    required
                    value={restockQtyInput}
                    onChange={(e) => setRestockQtyInput(Number(e.target.value))}
                    className="w-full bg-[#F4F4F5] dark:bg-[#141416] border border-[#E4E4E7] dark:border-[#2A2A2E] px-3.5 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white rounded-xl focus:border-[#C6F432] outline-none"
                  />
                  <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] mt-1 block">
                    Calculated to restore buffer to 200% of safety stock threshold.
                  </span>
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setRestockModalItem(null)}
                    className="px-4 py-2 border border-[#E4E4E7] dark:border-[#2A2A2E] bg-slate-100 dark:bg-[#1A1A1D] text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-all text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isRestocking}
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl transition-all shadow-md disabled:opacity-50 text-xs"
                  >
                    {isRestocking ? 'Issuing PO...' : 'Commit Purchase Order to Factory'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Reassign Sales Agent Portfolio (SRS Section 2) */}
        {editingAgent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
            <div className="bg-white dark:bg-[#0E0E10] border border-[#E4E4E7] dark:border-[#2A2A2E] rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-7 space-y-4 text-xs text-slate-800 dark:text-slate-200">
              <div className="flex justify-between items-center border-b border-[#E4E4E7] dark:border-[#1F1F24] pb-3">
                <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold">
                  <UserCheck className="w-4 h-4 text-[#C6F432]" />
                  <span className="text-sm uppercase tracking-wider font-serif">Assign Agent to Client Portfolio</span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingAgent(null)}
                  className="text-[#71717A] hover:text-slate-900 dark:hover:text-white font-bold text-sm"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 p-3.5 rounded-2xl space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold text-emerald-900 dark:text-emerald-300">
                    Target Sales Agent:
                  </span>
                  <span className="px-2 py-0.5 bg-[#C6F432] text-[#0B0B0C] font-bold text-[9px] rounded-full uppercase">
                    ABAC Boundary Verified
                  </span>
                </div>
                <div className="font-extrabold text-sm text-slate-900 dark:text-white">{editingAgent.fullName}</div>
                <div className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] font-mono">
                  {editingAgent.email} • {editingAgent.subsidiaryName}
                </div>
              </div>

              <form onSubmit={handleSaveAgentPortfolio} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    1. Regional Fulfillment Branch Hub:
                  </label>
                  <select
                    value={targetAgentBranch}
                    onChange={(e) => setTargetAgentBranch(e.target.value)}
                    className="w-full border border-[#E4E4E7] dark:border-[#2A2A2E] bg-white dark:bg-[#141416] text-slate-900 dark:text-white px-3.5 py-2 text-xs rounded-xl font-semibold outline-none focus:border-[#C6F432]"
                  >
                    {BRANCHES.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    2. Assigned Client Portfolio (Institutional Accounts):
                  </label>
                  <input
                    type="text"
                    required
                    value={portfolioInput}
                    onChange={(e) => setPortfolioInput(e.target.value)}
                    placeholder="e.g. MIDROC Construction Ethiopia PLC & Commercial Hubs"
                    className="w-full bg-[#F4F4F5] dark:bg-[#141416] border border-[#E4E4E7] dark:border-[#2A2A2E] px-3.5 py-2 rounded-xl font-mono text-xs text-slate-900 dark:text-white outline-none focus:border-[#C6F432]"
                  />
                  {/* Preset quick suggestions */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[
                      'MIDROC Construction PLC',
                      'Sunshine Construction & Housing',
                      'Sur Construction & Regional Depots',
                      'Dangote & National Fleet Accounts',
                    ].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setPortfolioInput(preset)}
                        className="px-2.5 py-1 bg-slate-100 dark:bg-[#1A1A1D] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] rounded-lg border border-[#E4E4E7] dark:border-[#2A2A2E] transition-all"
                      >
                        + {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    3. Technical Engineering Specialization:
                  </label>
                  <input
                    type="text"
                    required
                    value={specializationInput}
                    onChange={(e) => setSpecializationInput(e.target.value)}
                    placeholder="e.g. Pre-Painted Roofing Profiles & Fasteners"
                    className="w-full bg-[#F4F4F5] dark:bg-[#141416] border border-[#E4E4E7] dark:border-[#2A2A2E] px-3.5 py-2 rounded-xl font-mono text-xs text-slate-900 dark:text-white outline-none focus:border-[#C6F432]"
                  />
                </div>

                <div className="pt-2 flex justify-end space-x-2 border-t border-[#E4E4E7] dark:border-[#1F1F24]">
                  <button
                    type="button"
                    onClick={() => setEditingAgent(null)}
                    className="px-4 py-2 border border-[#E4E4E7] dark:border-[#2A2A2E] bg-slate-100 dark:bg-[#1A1A1D] text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-all text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingAgent}
                    className="px-5 py-2 bg-[#C6F432] hover:bg-[#D7F860] text-[#0B0B0C] font-bold rounded-xl transition-all shadow-md disabled:opacity-50 text-xs flex items-center space-x-1"
                  >
                    {isSavingAgent ? (
                      <span>Updating Assignment...</span>
                    ) : (
                      <>
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Commit Portfolio Assignment</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* WMS Enterprise Modals */}
        <GrnModal
          isOpen={isGrnModalOpen}
          onClose={() => setIsGrnModalOpen(false)}
          targetItem={grnTargetItem}
          depotId={activeBranch.id}
          depotName={activeBranch.name}
          onGrnIssued={handleGrnIssued}
        />

        <PickListModal
          isOpen={isPickModalOpen}
          onClose={() => setIsPickModalOpen(false)}
          order={activePickOrder}
          onConfirmPickAndStage={handleConfirmPickAndStage}
        />

        <WeighbridgeModal
          isOpen={isWeighbridgeModalOpen}
          onClose={() => setIsWeighbridgeModalOpen(false)}
          order={activeWeighbridgeOrder}
          onScaleConfirmed={handleWeighbridgeScaleConfirmed}
        />

        {/* Restock Success Feedback Toast */}
        {restockSuccessNotice && (
          <div className="fixed bottom-4 right-4 z-50 bg-[#0B0B0C] border border-[#2A2A2E] text-white p-4 rounded-2xl shadow-2xl flex items-center space-x-3 text-xs max-w-md animate-in slide-in-from-bottom">
            <CheckCircle2 className="w-5 h-5 text-[#C6F432] shrink-0" />
            <span>{restockSuccessNotice}</span>
          </div>
        )}
      </div>
    </div>
  );
}

