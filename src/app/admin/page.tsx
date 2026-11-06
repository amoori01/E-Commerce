'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  INITIAL_ORDERS,
  INITIAL_QUOTES,
  PRODUCTS,
  SUBSIDIARIES,
  SEEDED_USERS,
  BRANCHES,
  INITIAL_COUPONS,
  INVENTORY_ITEMS,
  INITIAL_ADMIN_AUDIT_LOGS,
  INITIAL_DEPOT_TRANSFERS,
  INITIAL_SETTLEMENT_BATCHES,
  INITIAL_WEBHOOK_STATUSES,
} from '@/lib/constants';
import {
  Product,
  UserProfile,
  UserRole,
  CouponDiscount,
  AdminAuditLog,
  InterDepotTransfer,
  FinancialSettlementBatch,
  WebhookHealthStatus,
  InventoryItem,
} from '@/types';
import {
  Shield,
  Layers,
  DollarSign,
  TrendingUp,
  FileText,
  ShoppingCart,
  Users,
  CheckCircle,
  CheckCircle2,
  AlertTriangle,
  Building2,
  RefreshCw,
  Sliders,
  Power,
  ToggleLeft,
  ToggleRight,
  Database,
  Lock,
  ArrowRight,
  Plus,
  Package,
  Search,
  X,
  Filter,
  Tag,
  UserPlus,
  UserCheck,
  UserX,
  Ban,
  Trash2,
  Edit3,
  Percent,
  Calendar,
  Activity,
  Truck,
  ArrowUpDown,
  Landmark,
  Download,
  Radio,
  Server,
  HardDrive,
  Send,
  Clock,
  Warehouse,
} from 'lucide-react';
import { MfaVerificationModal } from '@/components/modals/MfaVerificationModal';

export default function SuperAdminPage() {
  const { currentUser, activeRole, switchRole } = useAuth();
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'products'
    | 'orders'
    | 'rfqs'
    | 'coupons'
    | 'users'
    | 'inventory_health'
    | 'settlement'
    | 'audit_logs'
    | 'system_health'
    | 'payments'
    | 'tax_settings'
  >('overview');

  // User Management State (Feature 1)
  const [usersList, setUsersList] = useState<UserProfile[]>(SEEDED_USERS);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');

  // Add User Form State
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('+251 91 100 0000');
  const [newUserRole, setNewUserRole] = useState<UserRole>('branch_admin');
  const [newUserSubId, setNewUserSubId] = useState(SUBSIDIARIES[0].id);
  const [newUserBranchId, setNewUserBranchId] = useState(BRANCHES[0].id);
  const [newUserCompany, setNewUserCompany] = useState('');
  const [newUserTin, setNewUserTin] = useState('');

  // Coupon Discount State (Feature 2)
  const [couponsList, setCouponsList] = useState<CouponDiscount[]>(INITIAL_COUPONS);
  const [isAddCouponOpen, setIsAddCouponOpen] = useState(false);
  const [couponSearch, setCouponSearch] = useState('');

  // Add Coupon Form State
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDesc, setNewCouponDesc] = useState('');
  const [newCouponType, setNewCouponType] = useState<'percentage' | 'fixed_etb'>('percentage');
  const [newCouponValue, setNewCouponValue] = useState<number>(10);
  const [newCouponMinOrder, setNewCouponMinOrder] = useState<number>(50000);
  const [newCouponMaxCap, setNewCouponMaxCap] = useState<number>(25000);
  const [newCouponExpiry, setNewCouponExpiry] = useState('2026-12-31');
  const [newCouponSubId, setNewCouponSubId] = useState<string>('all');

  // Feature 3: Security & Compliance Audit Log State
  const [auditLogsList, setAuditLogsList] = useState<AdminAuditLog[]>(INITIAL_ADMIN_AUDIT_LOGS);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState<string>('all');

  // Feature 4: Cross-Depot Inventory Health & Transfer State
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>(INVENTORY_ITEMS);
  const [transfersList, setTransfersList] = useState<InterDepotTransfer[]>(INITIAL_DEPOT_TRANSFERS);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferSku, setTransferSku] = useState(INVENTORY_ITEMS[0].sku);
  const [transferSourceId, setTransferSourceId] = useState(BRANCHES[1].id); // Adama
  const [transferDestId, setTransferDestId] = useState(BRANCHES[0].id); // Addis
  const [transferQty, setTransferQty] = useState<number>(100);
  const [transferTruckPlate, setTransferTruckPlate] = useState('ET-3-88219');
  const [transferDriver, setTransferDriver] = useState('Kassahun Wolde');

  // Feature 5: Financial Settlement & Gateway Reconciliation State
  const [settlementBatches, setSettlementBatches] = useState<FinancialSettlementBatch[]>(INITIAL_SETTLEMENT_BATCHES);
  const [settlementSearch, setSettlementSearch] = useState('');

  // Feature 6: System Health & Maintenance Mode State
  const [isMaintenanceMode, setIsMaintenanceMode] = useState<boolean>(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState(
    'Scheduled consortium infrastructure mirror sync in progress. Order intake and catalog browsing will resume momentarily.'
  );
  const [webhookStatuses, setWebhookStatuses] = useState<WebhookHealthStatus[]>(INITIAL_WEBHOOK_STATUSES);
  const [isPingingWebhooks, setIsPingingWebhooks] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam) {
        setActiveTab(tabParam as any);
      }

      // Load cached states
      try {
        const storedUsers = localStorage.getItem('amg_users');
        if (storedUsers) {
          const parsed = JSON.parse(storedUsers);
          if (Array.isArray(parsed) && parsed.length > 0) setUsersList(parsed);
        }
        const storedCoupons = localStorage.getItem('amg_coupons');
        if (storedCoupons) {
          const parsed = JSON.parse(storedCoupons);
          if (Array.isArray(parsed) && parsed.length > 0) setCouponsList(parsed);
        }
        const storedAudits = localStorage.getItem('amg_admin_audit_logs');
        if (storedAudits) {
          const parsed = JSON.parse(storedAudits);
          if (Array.isArray(parsed) && parsed.length > 0) setAuditLogsList(parsed);
        }
        const storedTransfers = localStorage.getItem('amg_depot_transfers');
        if (storedTransfers) {
          const parsed = JSON.parse(storedTransfers);
          if (Array.isArray(parsed) && parsed.length > 0) setTransfersList(parsed);
        }
        const storedSettlements = localStorage.getItem('amg_settlement_batches');
        if (storedSettlements) {
          const parsed = JSON.parse(storedSettlements);
          if (Array.isArray(parsed) && parsed.length > 0) setSettlementBatches(parsed);
        }
        const storedMaint = localStorage.getItem('amg_maintenance_mode');
        if (storedMaint) {
          setIsMaintenanceMode(storedMaint === 'true');
        }
      } catch (e) {}
    }
  }, []);

  // Interactive Product Catalog State
  const [productsList, setProductsList] = useState<Product[]>(PRODUCTS);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [productSubFilter, setProductSubFilter] = useState<string>('all');
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);

  // New Product Form State
  const [newProdName, setNewProdName] = useState('');
  const [newProdSku, setNewProdSku] = useState('');
  const [newProdSubId, setNewProdSubId] = useState(SUBSIDIARIES[0].id);
  const [newProdStream, setNewProdStream] = useState<'direct_checkout' | 'assisted_quote'>('direct_checkout');
  const [newProdPrice, setNewProdPrice] = useState<number>(1200);
  const [newProdUnit, setNewProdUnit] = useState('pcs');
  const [newProdMoq, setNewProdMoq] = useState<number>(1);
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdSpecs, setNewProdSpecs] = useState('Standard industrial grade, ISO certified');

  // Interactive Super Admin Controls
  const [vatRate, setVatRate] = useState<number>(15.0);
  const [withholdingRate, setWithholdingRate] = useState<number>(2.0);
  const [telebirrActive, setTelebirrActive] = useState<boolean>(true);
  const [cbeBirrActive, setCbeBirrActive] = useState<boolean>(true);
  const [chapaActive, setChapaActive] = useState<boolean>(true);
  const [wireActive, setWireActive] = useState<boolean>(true);
  const [savedSettingsNotice, setSavedSettingsNotice] = useState<string | null>(null);

  const isSuperAdmin = activeRole === 'super_admin';

  const totalGmv = INITIAL_ORDERS.reduce((sum, o) => sum + o.totalAmountEtb, 0);
  const totalRfqPipelineValue = INITIAL_QUOTES.reduce(
    (sum, q) => sum + (q.finalQuotedTotalEtb || q.estimatedTotalEtb || 0),
    0
  );

  const [isMfaOpen, setIsMfaOpen] = useState(false);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setProductError(null);
    setIsSubmittingProduct(true);

    try {
      const selectedSub = SUBSIDIARIES.find((s) => s.id === newProdSubId) || SUBSIDIARIES[0];
      const payload = {
        name: newProdName,
        sku: newProdSku,
        subsidiaryId: newProdSubId,
        transactionStream: newProdStream,
        unitPriceEtb: newProdStream === 'direct_checkout' ? newProdPrice : 0,
        unitMeasurement: newProdUnit,
        moq: newProdMoq,
        description: newProdDesc,
        technicalSpecs: {
          specification: newProdSpecs,
          subsidiaryCode: selectedSub.code,
        },
      };

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create product');
      }

      if (data.product) {
        setProductsList((prev) => [data.product, ...prev]);
      }

      setIsAddProductOpen(false);
      setSavedSettingsNotice(`Product "${newProdName}" added successfully to the catalog!`);
      setTimeout(() => setSavedSettingsNotice(null), 4000);

      // Reset form
      setNewProdName('');
      setNewProdSku('');
      setNewProdDesc('');
    } catch (err: unknown) {
      setProductError(err instanceof Error ? err.message : 'Error creating product');
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  const handleSaveTaxPolicy = (e: React.FormEvent) => {
    e.preventDefault();
    setIsMfaOpen(true);
  };

  const logAdminAudit = (
    action: AdminAuditLog['action'],
    details: string,
    status: AdminAuditLog['status'] = 'SUCCESS'
  ) => {
    const newLog: AdminAuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      adminName: currentUser.fullName,
      adminEmail: currentUser.email,
      action,
      details,
      ipAddress: '196.188.241.10 (EthioTelecom / Addis HQ)',
      status,
    };
    setAuditLogsList((prev) => {
      const next = [newLog, ...prev];
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('amg_admin_audit_logs', JSON.stringify(next));
        } catch (e) {}
      }
      return next;
    });
  };

  const handleMfaConfirmed = () => {
    setIsMfaOpen(false);
    logAdminAudit('TAX_POLICY_UPDATE', `Committed national VAT rate ${vatRate}% & Withholding ${withholdingRate}% under MFA`);
    setSavedSettingsNotice(`Tax Policy Updated: Standard VAT ${vatRate}% & Withholding ${withholdingRate}% committed across all subsidiaries under verified MFA token.`);
    setTimeout(() => setSavedSettingsNotice(null), 3500);
  };

  // User Management Handlers (Feature 1)
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedSub = SUBSIDIARIES.find((s) => s.id === newUserSubId);
    const selectedBranch = BRANCHES.find((b) => b.id === newUserBranchId);

    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      fullName: newUserName,
      email: newUserEmail,
      phone: newUserPhone,
      role: newUserRole,
      subsidiaryId: selectedSub?.id,
      subsidiaryName: selectedSub?.name,
      branchId: selectedBranch?.id,
      branchName: selectedBranch?.name,
      companyName: newUserCompany || undefined,
      tinNumber: newUserTin || undefined,
      isVerified: true,
      isActive: true,
    };

    const nextList = [newUser, ...usersList];
    setUsersList(nextList);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('amg_users', JSON.stringify(nextList));
      } catch (e) {}
    }

    setIsAddUserOpen(false);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserCompany('');
    setNewUserTin('');
    setSavedSettingsNotice(`User "${newUser.fullName}" (${newUser.role}) successfully created & activated!`);
    setTimeout(() => setSavedSettingsNotice(null), 3500);
  };

  const handleToggleUserActive = (userId: string) => {
    const nextList = usersList.map((u) => {
      if (u.id === userId) {
        const nextStatus = u.isActive === false ? true : false;
        return { ...u, isActive: nextStatus };
      }
      return u;
    });
    setUsersList(nextList);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('amg_users', JSON.stringify(nextList));
      } catch (e) {}
    }
  };

  const handleSaveEditedUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    const nextList = usersList.map((u) => (u.id === editingUser.id ? editingUser : u));
    setUsersList(nextList);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('amg_users', JSON.stringify(nextList));
      } catch (e) {}
    }
    setEditingUser(null);
    setSavedSettingsNotice(`Updated governance scope for ${editingUser.fullName}.`);
    setTimeout(() => setSavedSettingsNotice(null), 3500);
  };

  // Coupon Handlers (Feature 2)
  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const code = newCouponCode.trim().toUpperCase();
    if (!code) return;

    const newCoupon: CouponDiscount = {
      code,
      description: newCouponDesc || `${newCouponValue}${newCouponType === 'percentage' ? '%' : ' ETB'} Corporate Discount`,
      discountType: newCouponType,
      discountValue: newCouponValue,
      minOrderValueEtb: newCouponMinOrder,
      maxDiscountEtb: newCouponType === 'percentage' && newCouponMaxCap > 0 ? newCouponMaxCap : undefined,
      validUntil: newCouponExpiry,
      eligibleSubsidiaryId: newCouponSubId === 'all' ? undefined : newCouponSubId,
      isActive: true,
    };

    const nextList = [newCoupon, ...couponsList.filter((c) => c.code !== code)];
    setCouponsList(nextList);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('amg_coupons', JSON.stringify(nextList));
      } catch (e) {}
    }

    setIsAddCouponOpen(false);
    setNewCouponCode('');
    setNewCouponDesc('');
    setSavedSettingsNotice(`Corporate promo voucher "${newCoupon.code}" created and live for checkout!`);
    setTimeout(() => setSavedSettingsNotice(null), 3500);
  };

  const handleToggleCouponActive = (code: string) => {
    const nextList = couponsList.map((c) => {
      if (c.code === code) {
        return { ...c, isActive: c.isActive === false ? true : false };
      }
      return c;
    });
    setCouponsList(nextList);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('amg_coupons', JSON.stringify(nextList));
      } catch (e) {}
    }
  };

  const handleDeleteCoupon = (code: string) => {
    if (!confirm(`Are you sure you want to delete promo coupon ${code}?`)) return;
    const nextList = couponsList.filter((c) => c.code !== code);
    setCouponsList(nextList);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('amg_coupons', JSON.stringify(nextList));
      } catch (e) {}
    }
    logAdminAudit('COUPON_MANAGEMENT', `Deleted promo coupon ${code}`);
  };

  // Feature 4: Inter-Depot Stock Transfer
  const handleInitiateDepotTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (transferSourceId === transferDestId) {
      alert('Source and Destination depots cannot be the same facility.');
      return;
    }
    const product = inventoryList.find((i) => i.sku === transferSku);
    const sourceBranch = BRANCHES.find((b) => b.id === transferSourceId);
    const destBranch = BRANCHES.find((b) => b.id === transferDestId);

    const newTransfer: InterDepotTransfer = {
      transferNumber: `TRF-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString(),
      sku: transferSku,
      productName: product?.productName || 'Industrial Consignment',
      sourceBranchId: transferSourceId,
      sourceBranchName: sourceBranch?.name || 'Regional Hub',
      destBranchId: transferDestId,
      destBranchName: destBranch?.name || 'Regional Hub',
      quantity: transferQty,
      status: 'IN_TRANSIT',
      dispatchedBy: currentUser.fullName,
      truckPlate: transferTruckPlate,
    };

    const nextList = [newTransfer, ...transfersList];
    setTransfersList(nextList);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('amg_depot_transfers', JSON.stringify(nextList));
      } catch (e) {}
    }

    logAdminAudit(
      'DEPOT_TRANSFER',
      `Dispatched transfer ${newTransfer.transferNumber}: ${transferQty} units of ${transferSku} from ${newTransfer.sourceBranchName} to ${newTransfer.destBranchName} (Truck: ${transferTruckPlate})`
    );

    setIsTransferModalOpen(false);
    setSavedSettingsNotice(`Inter-depot transfer ${newTransfer.transferNumber} dispatched successfully!`);
    setTimeout(() => setSavedSettingsNotice(null), 3500);
  };

  // Feature 5: Reconcile Financial Batch
  const handleReconcileBatch = (batchId: string) => {
    const nextList = settlementBatches.map((b) =>
      b.batchId === batchId ? { ...b, status: 'SETTLED' as const } : b
    );
    setSettlementBatches(nextList);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('amg_settlement_batches', JSON.stringify(nextList));
      } catch (e) {}
    }
    logAdminAudit('TAX_POLICY_UPDATE', `Reconciled financial settlement batch ${batchId}`);
    setSavedSettingsNotice(`Settlement batch ${batchId} reconciled and cleared for subsidiary payout.`);
    setTimeout(() => setSavedSettingsNotice(null), 3500);
  };

  // Feature 6: Maintenance Mode & Webhook Ping
  const handleToggleMaintenanceMode = () => {
    const nextState = !isMaintenanceMode;
    setIsMaintenanceMode(nextState);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('amg_maintenance_mode', String(nextState));
      } catch (e) {}
    }
    logAdminAudit(
      'MAINTENANCE_TOGGLE',
      `Platform maintenance mode set to ${nextState ? 'ENABLED' : 'DISABLED'}`,
      nextState ? 'WARNING' : 'SUCCESS'
    );
    setSavedSettingsNotice(`Consortium Maintenance Mode ${nextState ? 'ACTIVATED' : 'DEACTIVATED'}.`);
    setTimeout(() => setSavedSettingsNotice(null), 3500);
  };

  const handlePingWebhooks = () => {
    setIsPingingWebhooks(true);
    setTimeout(() => {
      setWebhookStatuses((prev) =>
        prev.map((w) => ({
          ...w,
          latencyMs: Math.floor(25 + Math.random() * 80),
          lastPing: new Date().toISOString(),
        }))
      );
      setIsPingingWebhooks(false);
      logAdminAudit('MAINTENANCE_TOGGLE', 'Pings verified for all payment webhooks & ERP mirrors (100% operational)');
      setSavedSettingsNotice('All national payment webhooks and ERP mirrors verified live (100% operational).');
      setTimeout(() => setSavedSettingsNotice(null), 3500);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* 1. EXECUTIVE THEME HERO BANNER (Obsidian & Indigo Enterprise Authority) */}
      <div className="bg-[#090D16] border-b border-indigo-950/80 px-4 sm:px-6 py-6 shadow-2xl">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 bg-indigo-600 text-white font-extrabold uppercase rounded-sm text-[10px] tracking-wider flex items-center space-x-1 shadow-sm">
                  <Shield className="w-3 h-3" />
                  <span>Tier 4: Enterprise Root Governance</span>
                </span>
                <span className="text-slate-400 font-mono text-[11px]">AMG-CORP-GOV-01</span>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white">
                Executive Super Admin Command Center
              </h1>
              <p className="text-xs text-slate-400 max-w-2xl">
                Global governance across all 5 industrial subsidiaries. Master product taxonomy, national payment switches, ERCA tax compliance, and cross-subsidiary RBAC governance.
              </p>
            </div>

            {/* Access Badge & Current Persona */}
            <div className="bg-slate-900 border border-indigo-900/60 p-3 rounded-sm text-right shrink-0">
              <div className="text-[10px] uppercase font-bold text-slate-400">Authenticated Persona</div>
              <div className="text-sm font-bold text-white flex items-center justify-end space-x-1.5 mt-0.5">
                <span>{currentUser.fullName}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              </div>
              <div className="text-[11px] font-mono text-indigo-400 mt-0.5">
                Role: {currentUser.role.toUpperCase()} (Full Enterprise Scope)
              </div>
            </div>
          </div>

          {/* Access Control Verification Banner */}
          {!isSuperAdmin && (
            <div className="bg-amber-950/70 border border-amber-600/60 p-3.5 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-200 text-xs">
              <div className="flex items-start space-x-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">RBAC Access Boundary Notice:</strong>
                  <span>
                    Your active session is currently set to <strong>{currentUser.role}</strong>. Viewing executive corporate controls in prototype inspection mode.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => switchRole('super_admin')}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-sm transition-colors shrink-0 flex items-center space-x-1.5"
              >
                <span>Assume Super Admin Privileges</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. DASHBOARD BODY */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-xs">
        {/* Navigation Tabs (Dark Executive Style) */}
        <div className="flex border-b border-slate-800 space-x-2 overflow-x-auto scrollbar-none">
          {[
            { id: 'overview', label: 'Executive Overview' },
            { id: 'inventory_health', label: 'Consortium Depot Health' },
            { id: 'settlement', label: 'Gateway Settlement Ledger' },
            { id: 'audit_logs', label: `Compliance Audit (${auditLogsList.length})` },
            { id: 'system_health', label: 'System & Webhooks' },
            { id: 'products', label: `Master Catalog (${productsList.length})` },
            { id: 'orders', label: `Direct Orders (${INITIAL_ORDERS.length})` },
            { id: 'rfqs', label: `RFQ Pipeline (${INITIAL_QUOTES.length})` },
            { id: 'coupons', label: `Promo Vouchers (${couponsList.length})` },
            { id: 'payments', label: 'Payment Switches' },
            { id: 'tax_settings', label: 'ERCA Tax Rules' },
            { id: 'users', label: `Staff & RBAC (${usersList.length})` },
          ].map((tab) => (
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
              className={`px-4 py-2.5 font-bold transition-all border-b-2 -mb-px whitespace-nowrap text-xs ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-400 bg-slate-900/60'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Global Maintenance Mode Banner */}
        {isMaintenanceMode && (
          <div className="bg-amber-950/80 border-2 border-amber-500 p-4 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-200 text-xs shadow-lg animate-pulse">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <strong className="text-white uppercase tracking-wider block">
                  CONSORTIUM MAINTENANCE MODE ACTIVE
                </strong>
                <span>{maintenanceMessage}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleMaintenanceMode}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-sm text-xs transition-colors shrink-0"
            >
              Resume Normal Operations
            </button>
          </div>
        )}

        {savedSettingsNotice && (
          <div className="bg-emerald-950/70 border border-emerald-600 text-emerald-300 p-3 rounded-sm flex items-center space-x-2 font-semibold text-xs">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{savedSettingsNotice}</span>
          </div>
        )}

        {/* TAB 1: EXECUTIVE OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Top Metric Tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-sm space-y-1 shadow-panel">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Total Direct GMV (Stream A)
                </span>
                <div className="text-xl font-extrabold font-mono text-emerald-400">
                  ETB {totalGmv.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <span className="text-[11px] text-slate-400">
                  Settled through Telebirr & CBE digital rails
                </span>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-sm space-y-1 shadow-panel">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Active RFQ Pipeline (Stream B)
                </span>
                <div className="text-xl font-extrabold font-mono text-indigo-400">
                  ETB {totalRfqPipelineValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <span className="text-[11px] text-slate-400">
                  Heavy Structural Steel & Commercial Fleet
                </span>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-sm space-y-1 shadow-panel">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Active Subsidiaries
                </span>
                <div className="text-xl font-extrabold text-white">5 Operating Divisions</div>
                <span className="text-[11px] text-slate-400">
                  100% operational status across all plants
                </span>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-sm space-y-1 shadow-panel">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Regional Depots & Mills
                </span>
                <div className="text-xl font-extrabold text-white">4 Fulfillment Hubs</div>
                <span className="text-[11px] text-slate-400">
                  Addis HQ, Adama, Hawassa, Dire Dawa
                </span>
              </div>
            </div>

            {/* Subsidiary Performance Ledger */}
            <div className="bg-slate-900 border border-slate-800 rounded-sm p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Subsidiary Division Matrix & Transaction Stream
                  </h3>
                </div>
                <span className="text-slate-400 font-mono text-[11px]">ERP Bi-Directional Mirror Active</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Division Code</th>
                      <th className="py-2.5 px-3">Company Legal Entity</th>
                      <th className="py-2.5 px-3">Primary Stream</th>
                      <th className="py-2.5 px-3">Lead Regional Mill</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {SUBSIDIARIES.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-mono font-bold text-indigo-400">{sub.code}</td>
                        <td className="py-2.5 px-3 font-medium text-white">{sub.name}</td>
                        <td className="py-2.5 px-3 font-mono text-[11px]">
                          {sub.code === 'AMG_STEEL' || sub.code === 'AMG_TRANSPORT'
                            ? 'Stream B (Agent RFQ)'
                            : 'Stream A (Direct Buy)'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">
                          {sub.code === 'AMG_ROOFING' || sub.code === 'AMG_STEEL'
                            ? 'Adama Industrial Park Hub'
                            : sub.code === 'AMG_GAS_LUBE'
                            ? 'Dire Dawa Logistics Hub'
                            : 'Addis Ababa Central Hub'}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-700/60 text-emerald-300 rounded-sm font-bold text-[10px]">
                            ACTIVE
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: MASTER CATALOG & PRODUCTS */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            {/* Top Action Bar */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-sm flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-panel">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search by SKU, name, or subsidiary..."
                    className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 text-white rounded-sm text-xs font-mono w-72 outline-none focus:border-indigo-500"
                  />
                </div>

                <select
                  value={productSubFilter}
                  onChange={(e) => setProductSubFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-sm text-xs font-semibold outline-none focus:border-indigo-500"
                >
                  <option value="all">All 5 Subsidiaries</option>
                  {SUBSIDIARIES.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => setIsAddProductOpen(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-sm shadow-md transition-colors flex items-center justify-center space-x-1.5 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Product to Catalog</span>
              </button>
            </div>

            {/* Products Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-sm p-5 space-y-4 shadow-panel">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
                <div className="flex items-center space-x-2">
                  <Package className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Enterprise Product Registry ({productsList.filter((p) => {
                      const matchesSearch =
                        productSearch === '' ||
                        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                        p.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
                        p.subsidiaryName.toLowerCase().includes(productSearch.toLowerCase());
                      const matchesSub = productSubFilter === 'all' || p.subsidiaryId === productSubFilter;
                      return matchesSearch && matchesSub;
                    }).length} Products Listed)
                  </h3>
                </div>
                <div className="flex items-center space-x-2 font-mono text-[11px] text-slate-400">
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    <span>Stream A (Direct Checkout)</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-sky-500 inline-block" />
                    <span>Stream B (Agent RFQ)</span>
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3">Product Name</th>
                      <th className="py-2.5 px-3">Subsidiary Division</th>
                      <th className="py-2.5 px-3">Fulfillment Stream</th>
                      <th className="py-2.5 px-3">Unit Price (ETB)</th>
                      <th className="py-2.5 px-3">MOQ</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {productsList
                      .filter((p) => {
                        const matchesSearch =
                          productSearch === '' ||
                          p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                          p.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
                          p.subsidiaryName.toLowerCase().includes(productSearch.toLowerCase());
                        const matchesSub = productSubFilter === 'all' || p.subsidiaryId === productSubFilter;
                        return matchesSearch && matchesSub;
                      })
                      .map((p) => {
                        const isDirect = p.transactionStream === 'direct_checkout' || p.fulfillmentStream === 'DIRECT';
                        return (
                          <tr key={p.id} className="hover:bg-slate-800/40">
                            <td className="py-2.5 px-3 font-mono font-bold text-indigo-400">{p.sku}</td>
                            <td className="py-2.5 px-3 font-medium text-white max-w-xs truncate">{p.name}</td>
                            <td className="py-2.5 px-3 text-slate-400">{p.subsidiaryName}</td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`px-2 py-0.5 rounded-sm font-mono text-[10px] font-bold uppercase tracking-wider ${
                                  isDirect
                                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60'
                                    : 'bg-sky-950/80 text-sky-300 border border-sky-700/60'
                                }`}
                              >
                                {isDirect ? 'Stream A (Direct Buy)' : 'Stream B (RFQ Quote)'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold">
                              {isDirect ? `ETB ${p.unitPriceEtb.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : <span className="text-slate-500 italic">Custom Negotiation</span>}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-400">
                              {p.moq || 1} {p.unitMeasurement}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-700/60 text-emerald-300 rounded-sm font-bold text-[10px]">
                                ACTIVE
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DIRECT ORDERS (STREAM A) */}
        {activeTab === 'orders' && (
          <div className="bg-slate-900 border border-slate-800 rounded-sm p-5 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Corporate Ledger: Stream A Self-Service Orders
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3">Order Number</th>
                    <th className="py-2 px-3">Buyer Company</th>
                    <th className="py-2 px-3">Fulfillment Hub</th>
                    <th className="py-2 px-3">Payment Switch</th>
                    <th className="py-2 px-3">VAT (15%)</th>
                    <th className="py-2 px-3">Total Payable</th>
                    <th className="py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {INITIAL_ORDERS.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-mono font-bold text-indigo-400">{ord.orderNumber}</td>
                      <td className="py-2.5 px-3">
                        <span className="text-white font-medium block">{ord.customerName}</span>
                        <span className="text-[10px] text-slate-400">{ord.customerCompany}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">{ord.fulfillmentBranchName}</td>
                      <td className="py-2.5 px-3 uppercase font-mono text-[11px] text-slate-300">
                        {ord.paymentMethod}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">
                        ETB {ord.taxEtb.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">
                        ETB {ord.totalAmountEtb.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 bg-blue-950 border border-blue-700/60 text-blue-300 rounded-sm font-bold text-[10px] uppercase">
                          {ord.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: RFQ PIPELINE (STREAM B) */}
        {activeTab === 'rfqs' && (
          <div className="bg-slate-900 border border-slate-800 rounded-sm p-5 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Corporate Escalation: Stream B RFQ Pipeline
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3">RFQ ID</th>
                    <th className="py-2 px-3">Project Title</th>
                    <th className="py-2 px-3">Client Entity</th>
                    <th className="py-2 px-3">Assigned Sales Engineer</th>
                    <th className="py-2 px-3">Target Value</th>
                    <th className="py-2 px-3">State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {INITIAL_QUOTES.map((q) => (
                    <tr key={q.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-mono font-bold text-amg-red-400">{q.quoteNumber}</td>
                      <td className="py-2.5 px-3 font-medium text-white">{q.projectTitle}</td>
                      <td className="py-2.5 px-3 text-slate-300">{q.customerCompany}</td>
                      <td className="py-2.5 px-3 text-indigo-400 font-semibold">{q.assignedAgentName || 'Pending'}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-white">
                        ETB {(q.finalQuotedTotalEtb || q.estimatedTotalEtb || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 bg-amber-950 border border-amber-700/60 text-amber-300 rounded-sm font-bold text-[10px] uppercase">
                          {q.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: TAX POLICY & ERCA COMPLIANCE */}
        {activeTab === 'tax_settings' && (
          <div className="bg-slate-900 border border-slate-800 rounded-sm p-5 space-y-5 max-w-2xl">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Ethiopian ERCA Tax Policy Configuration
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Configure cross-subsidiary taxation rates applied automatically at Stream A checkout and Stream B pricing formulas.
              </p>
            </div>

            <form onSubmit={handleSaveTaxPolicy} className="space-y-4">
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  National Value Added Tax (VAT %):
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    step="0.1"
                    value={vatRate}
                    onChange={(e) => setVatRate(Number(e.target.value))}
                    className="w-32 bg-slate-950 border border-slate-700 px-3 py-2 text-white font-mono font-bold rounded-sm outline-none focus:border-indigo-500"
                  />
                  <span className="text-slate-400 font-mono">% (Ethiopia Standard VAT is 15.0%)</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Corporate Withholding Tax (%):
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    step="0.1"
                    value={withholdingRate}
                    onChange={(e) => setWithholdingRate(Number(e.target.value))}
                    className="w-32 bg-slate-950 border border-slate-700 px-3 py-2 text-white font-mono font-bold rounded-sm outline-none focus:border-indigo-500"
                  />
                  <span className="text-slate-400 font-mono">% (Applied on B2B invoices exceeding ETB 10,000)</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-sm transition-colors shadow-sm"
                >
                  Commit Enterprise Tax Policy
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 5: PAYMENT GATEWAY SWITCHBOARD */}
        {activeTab === 'payments' && (
          <div className="bg-slate-900 border border-slate-800 rounded-sm p-5 space-y-5">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                National Payment Switchboard & Kill-Switch Controls
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Enable or temporarily disable specific payment switches during scheduled bank maintenance without taking down the full catalog.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-sm flex justify-between items-center">
                <div>
                  <div className="text-white font-bold text-sm">Telebirr SuperApp Switch</div>
                  <div className="text-[11px] text-slate-400">Ethio Telecom API • Port 443 Direct STK Push</div>
                </div>
                <button
                  type="button"
                  onClick={() => setTelebirrActive(!telebirrActive)}
                  className={`px-3 py-1.5 font-bold rounded-sm text-xs transition-colors ${
                    telebirrActive ? 'bg-emerald-600 text-white' : 'bg-rose-950 text-rose-300 border border-rose-800'
                  }`}
                >
                  {telebirrActive ? 'ONLINE' : 'PAUSED'}
                </button>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-sm flex justify-between items-center">
                <div>
                  <div className="text-white font-bold text-sm">CBE Birr National Core Switch</div>
                  <div className="text-[11px] text-slate-400">Commercial Bank of Ethiopia Core Integration</div>
                </div>
                <button
                  type="button"
                  onClick={() => setCbeBirrActive(!cbeBirrActive)}
                  className={`px-3 py-1.5 font-bold rounded-sm text-xs transition-colors ${
                    cbeBirrActive ? 'bg-emerald-600 text-white' : 'bg-rose-950 text-rose-300 border border-rose-800'
                  }`}
                >
                  {cbeBirrActive ? 'ONLINE' : 'PAUSED'}
                </button>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-sm flex justify-between items-center">
                <div>
                  <div className="text-white font-bold text-sm">Chapa Fintech Gateway</div>
                  <div className="text-[11px] text-slate-400">Visa / Mastercard / Local Wallets Switch</div>
                </div>
                <button
                  type="button"
                  onClick={() => setChapaActive(!chapaActive)}
                  className={`px-3 py-1.5 font-bold rounded-sm text-xs transition-colors ${
                    chapaActive ? 'bg-emerald-600 text-white' : 'bg-rose-950 text-rose-300 border border-rose-800'
                  }`}
                >
                  {chapaActive ? 'ONLINE' : 'PAUSED'}
                </button>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-sm flex justify-between items-center">
                <div>
                  <div className="text-white font-bold text-sm">Corporate Bank Wire (RTGS)</div>
                  <div className="text-[11px] text-slate-400">Direct Awash & CBE Commercial Accounts</div>
                </div>
                <button
                  type="button"
                  onClick={() => setWireActive(!wireActive)}
                  className={`px-3 py-1.5 font-bold rounded-sm text-xs transition-colors ${
                    wireActive ? 'bg-emerald-600 text-white' : 'bg-rose-950 text-rose-300 border border-rose-800'
                  }`}
                >
                  {wireActive ? 'ONLINE' : 'PAUSED'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB: CORPORATE PROMO VOUCHERS & B2B REBATES (FEATURE 2) */}
        {activeTab === 'coupons' && (
          <div className="bg-slate-900 border border-slate-800 rounded-sm p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <Tag className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Corporate Promo Vouchers & B2B Rebates Engine
                  </h3>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Manage promotional discount codes and commercial rebates applied dynamically at cart & checkout.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
                  <input
                    type="text"
                    placeholder="Search vouchers..."
                    value={couponSearch}
                    onChange={(e) => setCouponSearch(e.target.value)}
                    className="pl-8 pr-2.5 py-1 border border-slate-800 bg-slate-950 text-white rounded-sm text-xs outline-none focus:border-indigo-500 w-44"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddCouponOpen(true)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-sm text-xs transition-colors flex items-center space-x-1 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Promo Voucher</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Voucher Code</th>
                    <th className="py-2.5 px-3">Description & Scope</th>
                    <th className="py-2.5 px-3">Discount Value</th>
                    <th className="py-2.5 px-3">Min Order Requirement</th>
                    <th className="py-2.5 px-3">Expiration Date</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {couponsList
                    .filter(
                      (c) =>
                        couponSearch === '' ||
                        c.code.toLowerCase().includes(couponSearch.toLowerCase()) ||
                        c.description.toLowerCase().includes(couponSearch.toLowerCase())
                    )
                    .map((c) => {
                      const isExpired = c.validUntil && new Date(c.validUntil) < new Date();
                      const isActive = c.isActive !== false && !isExpired;
                      return (
                        <tr key={c.code} className="hover:bg-slate-800/40">
                          <td className="py-2.5 px-3">
                            <span className="font-mono font-bold text-white bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-xs">
                              {c.code}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-medium text-slate-200">{c.description}</div>
                            <div className="text-[10px] text-slate-500">
                              {c.eligibleSubsidiaryId
                                ? SUBSIDIARIES.find((s) => s.id === c.eligibleSubsidiaryId)?.name || 'Specific Division'
                                : 'All Operating Subsidiaries'}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">
                            {c.discountType === 'percentage'
                              ? `${c.discountValue}% OFF`
                              : `ETB ${c.discountValue.toLocaleString()} Direct Rebate`}
                            {c.maxDiscountEtb && (
                              <span className="block text-[10px] font-normal text-slate-400">
                                Max Cap: ETB {c.maxDiscountEtb.toLocaleString()}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-400">
                            ETB {c.minOrderValueEtb.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">
                            {c.validUntil || 'Perpetual'}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {isExpired ? (
                              <span className="px-2 py-0.5 bg-rose-950 text-rose-400 border border-rose-800 rounded text-[10px] font-bold">
                                EXPIRED
                              </span>
                            ) : isActive ? (
                              <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded text-[10px] font-bold">
                                ACTIVE
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-amber-950 text-amber-400 border border-amber-800 rounded text-[10px] font-bold">
                                PAUSED
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center space-x-1.5 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleToggleCouponActive(c.code)}
                              className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                                c.isActive === false
                                  ? 'bg-emerald-800 hover:bg-emerald-700 text-white'
                                  : 'bg-amber-900/60 hover:bg-amber-800 text-amber-200 border border-amber-700/60'
                              }`}
                            >
                              {c.isActive === false ? 'Activate' : 'Pause'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCoupon(c.code)}
                              className="px-2 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded text-[10px] font-bold transition-colors"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: CONSORTIUM DEPOT HEALTH & INVENTORY VALUATION (FEATURE 4) */}
        {activeTab === 'inventory_health' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-sm space-y-1 shadow-panel">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Consortium Stock Valuation
                </span>
                <div className="text-xl font-extrabold font-mono text-emerald-400">
                  ETB 48,250,000
                </div>
                <span className="text-[11px] text-slate-400">Asset value across 4 regional yards</span>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-sm space-y-1 shadow-panel">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Managed Physical Units
                </span>
                <div className="text-xl font-extrabold font-mono text-white">
                  {inventoryList.reduce((acc, i) => acc + i.quantityOnHand, 0).toLocaleString()} Units
                </div>
                <span className="text-[11px] text-slate-400">Total physical on-hand quantity</span>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-sm space-y-1 shadow-panel">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Safety Stock Alerts
                </span>
                <div className="text-xl font-extrabold font-mono text-amber-400">
                  {inventoryList.filter((i) => i.quantityOnHand <= i.safetyStockThreshold).length} Low-Stock Triggers
                </div>
                <span className="text-[11px] text-amber-500">Approaching threshold safety line</span>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-sm space-y-1 shadow-panel">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Inter-Depot Transfers
                </span>
                <div className="text-xl font-extrabold font-mono text-indigo-400">
                  {transfersList.filter((t) => t.status === 'IN_TRANSIT').length} In-Transit
                </div>
                <span className="text-[11px] text-slate-400">Regional logistics balancing grid</span>
              </div>
            </div>

            {/* Cross-Depot Stock Matrix */}
            <div className="bg-slate-900 border border-slate-800 rounded-sm p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <Warehouse className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Regional Depot Inventory Distribution & Health Matrix
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Live physical stock comparison across Addis Ababa Central Hub, Adama, Dire Dawa, and Hawassa.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(true)}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-sm text-xs transition-colors flex items-center space-x-1.5 shadow-sm shrink-0"
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span>Initiate Inter-Depot Transfer</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">SKU & Description</th>
                      <th className="py-2.5 px-3">Operating Division</th>
                      <th className="py-2.5 px-3">Primary Depot Facility</th>
                      <th className="py-2.5 px-3">Yard Bay Location</th>
                      <th className="py-2.5 px-3 text-right">Physical On-Hand</th>
                      <th className="py-2.5 px-3 text-right">Reserved</th>
                      <th className="py-2.5 px-3 text-center">Safety Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {inventoryList.map((item) => {
                      const isLow = item.quantityOnHand <= item.safetyStockThreshold;
                      return (
                        <tr key={item.id} className="hover:bg-slate-800/40">
                          <td className="py-2.5 px-3">
                            <span className="font-mono font-bold text-indigo-400">{item.sku}</span>
                            <div className="text-white font-medium">{item.productName}</div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-400">{item.subsidiaryName}</td>
                          <td className="py-2.5 px-3 text-slate-300 font-semibold">{item.branchName}</td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">{item.bayLocation || 'Yard Bay 04'}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-white text-sm">
                            {item.quantityOnHand.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                            {item.quantityReserved.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {isLow ? (
                              <span className="px-2 py-0.5 bg-amber-950 text-amber-400 border border-amber-800 rounded font-bold text-[10px]">
                                ⚠️ REORDER RISK
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded font-bold text-[10px]">
                                HEALTHY BUFFER
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Inter-Depot Transfers Ledger */}
            <div className="bg-slate-900 border border-slate-800 rounded-sm p-5 space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
                <Truck className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Active Inter-Depot Stock Transfers & Transit Waybills
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Transfer #</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Product / SKU</th>
                      <th className="py-2.5 px-3">Origin Hub</th>
                      <th className="py-2.5 px-3">Destination Hub</th>
                      <th className="py-2.5 px-3 text-right">Transfer Qty</th>
                      <th className="py-2.5 px-3">Carrier / Truck Plate</th>
                      <th className="py-2.5 px-3 text-center">Transit Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {transfersList.map((trf) => (
                      <tr key={trf.transferNumber} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-mono font-bold text-indigo-400">{trf.transferNumber}</td>
                        <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                          {new Date(trf.date).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-white">{trf.productName}</div>
                          <div className="text-[10px] font-mono text-slate-500">{trf.sku}</div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-300">{trf.sourceBranchName}</td>
                        <td className="py-2.5 px-3 text-slate-300 font-bold">{trf.destBranchName}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400 text-sm">
                          {trf.quantity.toLocaleString()} Units
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">
                          <span className="font-mono font-bold text-slate-200">{trf.truckPlate}</span>
                          <span className="block text-[10px]">{trf.dispatchedBy}</span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {trf.status === 'IN_TRANSIT' ? (
                            <span className="px-2 py-0.5 bg-amber-950 text-amber-400 border border-amber-800 rounded font-bold text-[10px] animate-pulse">
                              IN TRANSIT
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded font-bold text-[10px]">
                              RECEIVED
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: FINANCIAL SETTLEMENT & GATEWAY RECONCILIATION (FEATURE 5) */}
        {activeTab === 'settlement' && (
          <div className="space-y-6">
            {/* Overview KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-sm space-y-1 shadow-panel">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Gross Settlement GMV
                </span>
                <div className="text-xl font-extrabold font-mono text-emerald-400">
                  ETB {settlementBatches.reduce((acc, b) => acc + b.grossAmountEtb, 0).toLocaleString()}
                </div>
                <span className="text-[11px] text-slate-400">Aggregated digital collections</span>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-sm space-y-1 shadow-panel">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Processing Deductions & Fees
                </span>
                <div className="text-xl font-extrabold font-mono text-rose-400">
                  -ETB {settlementBatches.reduce((acc, b) => acc + b.feeAmountEtb, 0).toLocaleString()}
                </div>
                <span className="text-[11px] text-slate-400">Telebirr, CBE Birr & Chapa switch fees</span>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-sm space-y-1 shadow-panel">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Net Disbursed Funds
                </span>
                <div className="text-xl font-extrabold font-mono text-indigo-400">
                  ETB {settlementBatches.reduce((acc, b) => acc + b.netDisbursedEtb, 0).toLocaleString()}
                </div>
                <span className="text-[11px] text-slate-400">Ready for subsidiary bank payout</span>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-sm space-y-1 shadow-panel">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Reconciled Batches
                </span>
                <div className="text-xl font-extrabold font-mono text-white">
                  {settlementBatches.filter((b) => b.status === 'SETTLED').length} of {settlementBatches.length} Cleared
                </div>
                <span className="text-[11px] text-slate-400">CBE & Telebirr ledger reconciliation</span>
              </div>
            </div>

            {/* Payment Rails Performance Matrix */}
            <div className="bg-slate-900 border border-slate-800 rounded-sm p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <Landmark className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      National Payment Gateway Settlement Matrix
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Gross receipts, processing transaction interchange, and net commercial bank disbursements.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const csvContent =
                      'data:text/csv;charset=utf-8,BatchID,Date,Gateway,GrossETB,FeesETB,NetETB,Status,Account\n' +
                      settlementBatches
                        .map((b) => `${b.batchId},${b.date},${b.gateway},${b.grossAmountEtb},${b.feeAmountEtb},${b.netDisbursedEtb},${b.status},${b.payoutAccount}`)
                        .join('\n');
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement('a');
                    link.setAttribute('href', encodedUri);
                    link.setAttribute('download', `AMG_Settlement_Report_${new Date().toISOString().split('T')[0]}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="px-3.5 py-1.5 border border-slate-700 hover:bg-slate-800 text-slate-200 font-bold rounded-sm text-xs transition-colors flex items-center space-x-1.5 shadow-sm shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export ERCA Settlement CSV</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Batch Reference</th>
                      <th className="py-2.5 px-3">Settlement Date</th>
                      <th className="py-2.5 px-3">Digital Payment Switch</th>
                      <th className="py-2.5 px-3 text-right">Gross GMV</th>
                      <th className="py-2.5 px-3 text-right">Gateway Fees</th>
                      <th className="py-2.5 px-3 text-right">Net Payout</th>
                      <th className="py-2.5 px-3">Subsidiary Payout Account</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {settlementBatches.map((batch) => (
                      <tr key={batch.batchId} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-mono font-bold text-indigo-400">{batch.batchId}</td>
                        <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                          {new Date(batch.date).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-white block">{batch.gatewayName}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{batch.transactionCount} Transactions</span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                          ETB {batch.grossAmountEtb.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-rose-400">
                          -ETB {batch.feeAmountEtb.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400 text-sm">
                          ETB {batch.netDisbursedEtb.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">{batch.payoutAccount}</td>
                        <td className="py-2.5 px-3 text-center">
                          {batch.status === 'SETTLED' ? (
                            <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded font-bold text-[10px]">
                              SETTLED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-amber-950 text-amber-400 border border-amber-800 rounded font-bold text-[10px] animate-pulse">
                              PENDING
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {batch.status !== 'SETTLED' ? (
                            <button
                              type="button"
                              onClick={() => handleReconcileBatch(batch.batchId)}
                              className="px-2 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[10px] font-bold transition-colors"
                            >
                              Reconcile
                            </button>
                          ) : (
                            <span className="text-slate-500 font-mono text-[11px]">✓ Cleared</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: ADMIN SECURITY & COMPLIANCE AUDIT TRAIL (FEATURE 3) */}
        {activeTab === 'audit_logs' && (
          <div className="bg-slate-900 border border-slate-800 rounded-sm p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Administrative & Security Compliance Audit Trail
                  </h3>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Immutable record of executive role impersonations, tax modifications, payment kill-switches, and coupon issuances.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <select
                  value={auditActionFilter}
                  onChange={(e) => setAuditActionFilter(e.target.value)}
                  className="border border-slate-800 bg-slate-950 text-slate-300 rounded-sm px-2.5 py-1 text-xs outline-none focus:border-indigo-500"
                >
                  <option value="all">All Audit Actions ({auditLogsList.length})</option>
                  <option value="PAYMENT_KILL_SWITCH">Payment Kill-Switches</option>
                  <option value="TAX_POLICY_UPDATE">ERCA Tax Policy</option>
                  <option value="USER_GOVERNANCE">User Governance</option>
                  <option value="COUPON_MANAGEMENT">Vouchers & Rebates</option>
                  <option value="DEPOT_TRANSFER">Depot Transfers</option>
                  <option value="MAINTENANCE_TOGGLE">Maintenance Mode</option>
                </select>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
                  <input
                    type="text"
                    placeholder="Search audit trail..."
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    className="pl-8 pr-2.5 py-1 border border-slate-800 bg-slate-950 text-white rounded-sm text-xs outline-none focus:border-indigo-500 w-44"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const csvContent =
                      'data:text/csv;charset=utf-8,' +
                      ['Timestamp,Action Category,Administrator,Admin Email,Details,IP Address,Status']
                        .concat(
                          auditLogsList.map(
                            (l) =>
                              `"${new Date(l.timestamp).toISOString()}","${l.action}","${l.adminName}","${l.adminEmail}","${l.details.replace(/"/g, '""')}","${l.ipAddress || 'Internal'}","${l.status}"`
                          )
                        )
                        .join('\n');
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement('a');
                    link.setAttribute('href', encodedUri);
                    link.setAttribute('download', `amg-security-compliance-audit-${new Date().toISOString().slice(0, 10)}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="px-3 py-1 border border-slate-700 hover:bg-slate-800 text-slate-200 font-bold rounded-sm text-xs transition-colors flex items-center space-x-1.5 shadow-sm shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Action Category</th>
                    <th className="py-2.5 px-3">Administrator</th>
                    <th className="py-2.5 px-3">Governance Event Details</th>
                    <th className="py-2.5 px-3">Network IP / Origin</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {auditLogsList
                    .filter((log) => {
                      const matchesCategory = auditActionFilter === 'all' || log.action === auditActionFilter;
                      const matchesSearch =
                        auditSearch === '' ||
                        log.details.toLowerCase().includes(auditSearch.toLowerCase()) ||
                        log.adminName.toLowerCase().includes(auditSearch.toLowerCase()) ||
                        (log.ipAddress && log.ipAddress.toLowerCase().includes(auditSearch.toLowerCase()));
                      return matchesCategory && matchesSearch;
                    })
                    .map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 bg-slate-950 border border-slate-700 text-indigo-300 rounded font-mono font-bold text-[10px]">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-white">{log.adminName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{log.adminEmail}</div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-200">{log.details}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                          {log.ipAddress || 'Internal Loopback'}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                              log.status === 'SUCCESS'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-amber-950 text-amber-400 border border-amber-800'
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: SYSTEM HEALTH, API WEBHOOKS & MAINTENANCE MODE (FEATURE 6) */}
        {activeTab === 'system_health' && (
          <div className="space-y-6">
            {/* Maintenance Mode Controller */}
            <div className="bg-slate-900 border border-slate-800 rounded-sm p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
                <div className="flex items-center space-x-2">
                  <Power className="w-5 h-5 text-amber-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Consortium-Wide Maintenance Mode Kill-Switch
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Temporarily freeze catalog ordering and display scheduled downtime announcements across customer portals.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleToggleMaintenanceMode}
                  className={`px-4 py-2 font-bold rounded-sm text-xs transition-colors flex items-center space-x-2 shadow-sm ${
                    isMaintenanceMode
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  <Power className="w-4 h-4" />
                  <span>{isMaintenanceMode ? 'DEACTIVATE MAINTENANCE' : 'ACTIVATE MAINTENANCE'}</span>
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Customer-Facing Maintenance Banner Notice:
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={maintenanceMessage}
                    onChange={(e) => setMaintenanceMessage(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 px-3 py-2 rounded text-white text-xs outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        try {
                          localStorage.setItem('amg_maintenance_message', maintenanceMessage);
                        } catch (e) {}
                      }
                      logAdminAudit('MAINTENANCE_TOGGLE', `Updated maintenance banner: "${maintenanceMessage}"`);
                      setSavedSettingsNotice('Maintenance banner message committed.');
                      setTimeout(() => setSavedSettingsNotice(null), 3000);
                    }}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded text-xs transition-colors"
                  >
                    Save Banner
                  </button>
                </div>
              </div>
            </div>

            {/* Live API Webhook & Microservices Health Monitor */}
            <div className="bg-slate-900 border border-slate-800 rounded-sm p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Live Payment Webhook Listeners & ERP Synchronization Monitor
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Sub-second telemetry for national banking endpoints, mobile money callbacks, and ERP data pipelines.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handlePingWebhooks}
                  disabled={isPingingWebhooks}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-sm text-xs transition-colors flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isPingingWebhooks ? 'animate-spin' : ''}`} />
                  <span>{isPingingWebhooks ? 'Testing Endpoints...' : 'Ping & Test Webhook Heartbeat'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {webhookStatuses.map((wh) => (
                  <div
                    key={wh.serviceName}
                    className="bg-slate-950 border border-slate-800 p-4 rounded-sm space-y-2 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="font-bold text-white text-xs">{wh.serviceName}</div>
                      <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded font-bold text-[10px] flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>{wh.status}</span>
                      </span>
                    </div>

                    <div className="font-mono text-[11px] text-indigo-400 bg-slate-900 p-1.5 rounded truncate">
                      {wh.endpoint}
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                      <span>Latency: <strong className="text-emerald-400 font-mono">{wh.latencyMs} ms</strong></span>
                      <span>Uptime: <strong className="text-slate-200 font-mono">{wh.successRate}%</strong></span>
                    </div>

                    <div className="text-[10px] text-slate-500 flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>Last Ping: {new Date(wh.lastPing).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: STAFF & RBAC GOVERNANCE (FEATURE 1) */}
        {activeTab === 'users' && (
          <div className="bg-slate-900 border border-slate-800 rounded-sm p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Staff & RBAC Stakeholder Access Directory
                  </h3>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Manage enterprise personnel, branch depot administrators, finance auditors, and corporate client accounts.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                {/* Role Filter */}
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="border border-slate-800 bg-slate-950 text-slate-300 rounded-sm px-2.5 py-1 text-xs outline-none focus:border-indigo-500"
                >
                  <option value="all">All Roles ({usersList.length})</option>
                  <option value="super_admin">Super Admins</option>
                  <option value="branch_admin">Branch Admins</option>
                  <option value="finance_officer">Finance Officers</option>
                  <option value="sales_agent">Sales Agents</option>
                  <option value="customer">Corporate Customers</option>
                </select>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
                  <input
                    type="text"
                    placeholder="Search name, email, TIN..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-8 pr-2.5 py-1 border border-slate-800 bg-slate-950 text-white rounded-sm text-xs outline-none focus:border-indigo-500 w-44"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(true)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-sm text-xs transition-colors flex items-center space-x-1 shadow-sm shrink-0"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add New Employee</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Name & Phone</th>
                    <th className="py-2.5 px-3">Email Address</th>
                    <th className="py-2.5 px-3">Role Level</th>
                    <th className="py-2.5 px-3">Assigned Scope / Branch</th>
                    <th className="py-2.5 px-3">ERCA TIN</th>
                    <th className="py-2.5 px-3 text-center">Account Status</th>
                    <th className="py-2.5 px-3 text-center">Governance Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {usersList
                    .filter((usr) => {
                      const matchesRole = userRoleFilter === 'all' || usr.role === userRoleFilter;
                      const matchesSearch =
                        userSearch === '' ||
                        usr.fullName.toLowerCase().includes(userSearch.toLowerCase()) ||
                        usr.email.toLowerCase().includes(userSearch.toLowerCase()) ||
                        (usr.tinNumber && usr.tinNumber.toLowerCase().includes(userSearch.toLowerCase())) ||
                        (usr.companyName && usr.companyName.toLowerCase().includes(userSearch.toLowerCase()));
                      return matchesRole && matchesSearch;
                    })
                    .map((usr) => {
                      const isSuspended = usr.isActive === false;
                      return (
                        <tr key={usr.id} className={isSuspended ? 'bg-rose-950/20' : 'hover:bg-slate-800/40'}>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-white flex items-center space-x-1.5">
                              <span>{usr.fullName}</span>
                              {usr.companyName && (
                                <span className="text-[10px] text-slate-400 font-normal">({usr.companyName})</span>
                              )}
                            </div>
                            <div className="text-[10px] font-mono text-slate-500">{usr.phone || 'No phone'}</div>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-400">{usr.email}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 bg-slate-800 text-indigo-300 rounded-sm font-mono font-bold text-[10px] uppercase">
                              {usr.role.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-400">
                            <div className="font-medium text-slate-300">
                              {usr.subsidiaryName || 'Global Enterprise Scope'}
                            </div>
                            {usr.branchName && (
                              <div className="text-[10px] text-emerald-400 font-mono">Hub: {usr.branchName}</div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-500">{usr.tinNumber || '—'}</td>
                          <td className="py-2.5 px-3 text-center">
                            {isSuspended ? (
                              <span className="px-2 py-0.5 bg-rose-950 text-rose-400 border border-rose-800 rounded font-bold text-[10px]">
                                SUSPENDED
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded font-bold text-[10px]">
                                ACTIVE
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center space-x-1.5 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleToggleUserActive(usr.id)}
                              className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                                isSuspended
                                  ? 'bg-emerald-800 hover:bg-emerald-700 text-white'
                                  : 'bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800'
                              }`}
                            >
                              {isSuspended ? 'Reactivate' : 'Suspend'}
                            </button>

                            <button
                              type="button"
                              onClick={() => setEditingUser(usr)}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold border border-slate-700"
                            >
                              Edit Scope
                            </button>

                            <button
                              type="button"
                              onClick={() => switchRole(usr.role)}
                              className="px-2 py-1 bg-indigo-900/60 hover:bg-indigo-600 text-indigo-200 hover:text-white rounded text-[10px] font-bold border border-indigo-700/60"
                            >
                              Assume
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* CREATE NEW EMPLOYEE / USER MODAL (FEATURE 1) */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-sm shadow-2xl max-w-lg w-full p-6 space-y-4 text-xs my-8 text-slate-200">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-white font-bold">
                <UserPlus className="w-5 h-5 text-indigo-400" />
                <span className="text-sm uppercase tracking-wider">Add Enterprise Staff / Stakeholder</span>
              </div>
              <button onClick={() => setIsAddUserOpen(false)} className="text-slate-400 hover:text-white font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Almaz Bekele"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 px-3 py-1.5 rounded text-white focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. almaz@amgholdings.et"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 px-3 py-1.5 rounded text-white font-mono focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    placeholder="+251 91 100 0000"
                    value={newUserPhone}
                    onChange={(e) => setNewUserPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 px-3 py-1.5 rounded text-white font-mono focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Role Permission Level</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                  className="w-full bg-slate-950 border border-slate-800 px-3 py-1.5 rounded text-white font-semibold focus:border-indigo-500 outline-none"
                >
                  <option value="branch_admin">Branch Admin (Depot Warehouse & Dispatch)</option>
                  <option value="finance_officer">Finance Officer (Payment & Ledger Audits)</option>
                  <option value="sales_agent">Sales Agent (Assisted RFQ & Client Portfolios)</option>
                  <option value="super_admin">Super Admin (Consortium Executive)</option>
                  <option value="customer">Corporate / Retail Customer</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Subsidiary Division Scope</label>
                  <select
                    value={newUserSubId}
                    onChange={(e) => setNewUserSubId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 px-3 py-1.5 rounded text-white focus:border-indigo-500 outline-none"
                  >
                    {SUBSIDIARIES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Assigned Regional Hub</label>
                  <select
                    value={newUserBranchId}
                    onChange={(e) => setNewUserBranchId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 px-3 py-1.5 rounded text-white focus:border-indigo-500 outline-none"
                  >
                    {BRANCHES.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.city})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Company Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. MIDROC Construction"
                    value={newUserCompany}
                    onChange={(e) => setNewUserCompany(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 px-3 py-1.5 rounded text-white focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">ERCA TIN Number (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 0049281728"
                    value={newUserTin}
                    onChange={(e) => setNewUserTin(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 px-3 py-1.5 rounded text-white font-mono focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-3 py-1.5 border border-slate-700 bg-slate-800 text-slate-300 rounded hover:bg-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded shadow-sm flex items-center space-x-1"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Register & Activate User</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER SCOPE MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-sm shadow-2xl max-w-md w-full p-6 space-y-4 text-xs my-8 text-slate-200">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-white font-bold">
                <Edit3 className="w-4 h-4 text-indigo-400" />
                <span className="text-sm uppercase tracking-wider">Edit Governance Scope: {editingUser.fullName}</span>
              </div>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-white font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditedUser} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Role Permission Level</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                  className="w-full bg-slate-950 border border-slate-800 px-3 py-1.5 rounded text-white font-semibold focus:border-indigo-500 outline-none"
                >
                  <option value="branch_admin">Branch Admin</option>
                  <option value="finance_officer">Finance Officer</option>
                  <option value="sales_agent">Sales Agent</option>
                  <option value="super_admin">Super Admin</option>
                  <option value="customer">Customer</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Subsidiary Division</label>
                <select
                  value={editingUser.subsidiaryId || ''}
                  onChange={(e) => {
                    const sub = SUBSIDIARIES.find((s) => s.id === e.target.value);
                    setEditingUser({ ...editingUser, subsidiaryId: sub?.id, subsidiaryName: sub?.name });
                  }}
                  className="w-full bg-slate-950 border border-slate-800 px-3 py-1.5 rounded text-white focus:border-indigo-500 outline-none"
                >
                  <option value="">Consortium Global Scope</option>
                  {SUBSIDIARIES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Assigned Regional Hub</label>
                <select
                  value={editingUser.branchId || ''}
                  onChange={(e) => {
                    const br = BRANCHES.find((b) => b.id === e.target.value);
                    setEditingUser({ ...editingUser, branchId: br?.id, branchName: br?.name });
                  }}
                  className="w-full bg-slate-950 border border-slate-800 px-3 py-1.5 rounded text-white focus:border-indigo-500 outline-none"
                >
                  <option value="">Consortium-Wide</option>
                  {BRANCHES.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.city})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3 py-1.5 border border-slate-700 bg-slate-800 text-slate-300 rounded hover:bg-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded shadow-sm"
                >
                  Save Scope Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE NEW PROMO VOUCHER MODAL (FEATURE 2) */}
      {isAddCouponOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-sm shadow-2xl max-w-lg w-full p-6 space-y-4 text-xs my-8 text-slate-200">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-white font-bold">
                <Tag className="w-5 h-5 text-emerald-400" />
                <span className="text-sm uppercase tracking-wider">Create Corporate Promo Voucher</span>
              </div>
              <button onClick={() => setIsAddCouponOpen(false)} className="text-slate-400 hover:text-white font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Voucher Promo Code (Uppercase)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SUMMERSTEEL15, AMGCBE5000"
                  value={newCouponCode}
                  onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-slate-800 px-3 py-1.5 rounded text-white font-mono font-bold tracking-wider focus:border-indigo-500 outline-none uppercase"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Description / Marketing Purpose
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 15% Procurement rebate on construction steel & rebar"
                  value={newCouponDesc}
                  onChange={(e) => setNewCouponDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 px-3 py-1.5 rounded text-white focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Discount Model</label>
                  <select
                    value={newCouponType}
                    onChange={(e) => setNewCouponType(e.target.value as 'percentage' | 'fixed_etb')}
                    className="w-full bg-slate-950 border border-slate-800 px-3 py-1.5 rounded text-white focus:border-indigo-500 outline-none font-semibold"
                  >
                    <option value="percentage">Percentage Discount (%)</option>
                    <option value="fixed_etb">Fixed Direct Rebate (ETB)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    {newCouponType === 'percentage' ? 'Percentage Rate (%)' : 'Deduction Amount (ETB)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newCouponValue}
                    onChange={(e) => setNewCouponValue(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-slate-950 border border-slate-800 px-3 py-1.5 rounded text-white font-mono font-bold focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Minimum Order Subtotal (ETB)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newCouponMinOrder}
                    onChange={(e) => setNewCouponMinOrder(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-slate-950 border border-slate-800 px-3 py-1.5 rounded text-white font-mono focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Maximum Discount Cap (ETB, Optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newCouponMaxCap}
                    onChange={(e) => setNewCouponMaxCap(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 px-3 py-1.5 rounded text-white font-mono focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Valid Until (Expiry Date)</label>
                  <input
                    type="date"
                    required
                    value={newCouponExpiry}
                    onChange={(e) => setNewCouponExpiry(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 px-3 py-1.5 rounded text-white focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Eligible Subsidiary Division</label>
                  <select
                    value={newCouponSubId}
                    onChange={(e) => setNewCouponSubId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 px-3 py-1.5 rounded text-white focus:border-indigo-500 outline-none"
                  >
                    <option value="all">All Operating Subsidiaries</option>
                    {SUBSIDIARIES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddCouponOpen(false)}
                  className="px-3 py-1.5 border border-slate-700 bg-slate-800 text-slate-300 rounded hover:bg-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded shadow-sm flex items-center space-x-1"
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>Issue & Activate Voucher</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INTER-DEPOT TRANSFER MODAL */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-sm max-w-lg w-full p-5 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Truck className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Initiate Inter-Depot Stock Transfer</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInitiateDepotTransfer} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Select Consignment Item (SKU)</label>
                <select
                  value={transferSku}
                  onChange={(e) => setTransferSku(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 px-3 py-1.5 rounded text-white focus:border-indigo-500 outline-none"
                >
                  {inventoryList.map((item) => (
                    <option key={item.sku} value={item.sku}>
                      [{item.sku}] {item.productName} ({item.quantityOnHand.toLocaleString()} on-hand)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Source Depot (Origin)</label>
                  <select
                    value={transferSourceId}
                    onChange={(e) => setTransferSourceId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 px-3 py-1.5 rounded text-white focus:border-indigo-500 outline-none"
                  >
                    {BRANCHES.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Destination Depot (Target)</label>
                  <select
                    value={transferDestId}
                    onChange={(e) => setTransferDestId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 px-3 py-1.5 rounded text-white focus:border-indigo-500 outline-none"
                  >
                    {BRANCHES.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.city})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Transfer Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={transferQty}
                    onChange={(e) => setTransferQty(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-slate-950 border border-slate-800 px-3 py-1.5 rounded text-white font-mono font-bold focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Transit Truck Plate #</label>
                  <input
                    type="text"
                    required
                    value={transferTruckPlate}
                    onChange={(e) => setTransferTruckPlate(e.target.value)}
                    placeholder="e.g. ET-3-88219"
                    className="w-full bg-slate-950 border border-slate-800 px-3 py-1.5 rounded text-white font-mono focus:border-indigo-500 outline-none uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Assigned Logistics Driver</label>
                <input
                  type="text"
                  required
                  value={transferDriver}
                  onChange={(e) => setTransferDriver(e.target.value)}
                  placeholder="Driver Full Name & License ID"
                  className="w-full bg-slate-950 border border-slate-800 px-3 py-1.5 rounded text-white focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="p-2.5 bg-indigo-950/30 border border-indigo-900/50 rounded text-[11px] text-indigo-300">
                Direct cross-depot transfers automatically issue an official electronic transit waybill. Source depot stock will be reserved and transit status will be tracked until confirmed at destination weighbridge.
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-700 bg-slate-800 text-slate-300 rounded hover:bg-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded shadow-sm flex items-center space-x-1"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Dispatch Consignment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <MfaVerificationModal
        isOpen={isMfaOpen}
        userEmail={currentUser.email}
        userPhone={currentUser.phone}
        actionTitle="Commit Global Cross-Subsidiary Tax Policy (ERCA)"
        onSuccess={handleMfaConfirmed}
        onCancel={() => setIsMfaOpen(false)}
      />

      {/* ADD NEW PRODUCT MODAL */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-indigo-900/80 rounded-sm max-w-2xl w-full p-6 space-y-5 shadow-2xl text-xs my-8 text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-indigo-600 rounded text-white">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    Add New Product to Enterprise Catalog
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Publish standardized SKU for Stream A or custom engineering item for Stream B
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddProductOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {productError && (
              <div className="p-3 bg-rose-950/70 border border-rose-700 text-rose-200 rounded-sm">
                {productError}
              </div>
            )}

            <form onSubmit={handleCreateProduct} className="space-y-4">
              {/* Stream Selector */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-sm space-y-2">
                <label className="font-bold text-slate-300 block uppercase tracking-wider text-[11px]">
                  Fulfillment & Transaction Stream:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`p-3 border rounded-sm cursor-pointer transition-all flex flex-col space-y-1 ${
                      newProdStream === 'direct_checkout'
                        ? 'border-emerald-500 bg-emerald-950/30'
                        : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="stream"
                        checked={newProdStream === 'direct_checkout'}
                        onChange={() => setNewProdStream('direct_checkout')}
                        className="accent-emerald-500"
                      />
                      <span className="font-bold text-white text-xs">Stream A: Direct Checkout</span>
                    </div>
                    <p className="text-[10px] text-slate-400 pl-5">
                      Standard products with fixed unit pricing (Roofing sheets, standard rebars, packaged coffee, retail lubes). Instant self-service buy.
                    </p>
                  </label>

                  <label
                    className={`p-3 border rounded-sm cursor-pointer transition-all flex flex-col space-y-1 ${
                      newProdStream === 'assisted_quote'
                        ? 'border-sky-500 bg-sky-950/30'
                        : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="stream"
                        checked={newProdStream === 'assisted_quote'}
                        onChange={() => setNewProdStream('assisted_quote')}
                        className="accent-sky-500"
                      />
                      <span className="font-bold text-white text-xs">Stream B: Agent RFQ Quote</span>
                    </div>
                    <p className="text-[10px] text-slate-400 pl-5">
                      Heavy engineered items (PEB structures, Sinotruk commercial fleet, bulk gases). Displays &quot;Request Quote&quot; button and routes to sales agents.
                    </p>
                  </label>
                </div>
              </div>

              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block text-[11px]">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    placeholder="e.g. Grade 60 Rebar (20mm x 12m)"
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-sm px-3 py-2 text-xs focus:border-indigo-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block text-[11px]">Product SKU (Unique) *</label>
                  <input
                    type="text"
                    required
                    value={newProdSku}
                    onChange={(e) => setNewProdSku(e.target.value)}
                    placeholder="e.g. AMG-STEEL-RB-20MM"
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-sm px-3 py-2 text-xs font-mono uppercase focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Subsidiary Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block text-[11px]">Subsidiary Operating Division *</label>
                  <select
                    value={newProdSubId}
                    onChange={(e) => setNewProdSubId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-sm px-3 py-2 text-xs focus:border-indigo-500 outline-none"
                  >
                    {SUBSIDIARIES.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name} ({sub.code})
                      </option>
                    ))}
                  </select>
                </div>

                {newProdStream === 'direct_checkout' ? (
                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block text-[11px]">Unit Price (ETB) *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={newProdPrice}
                      onChange={(e) => setNewProdPrice(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 text-white rounded-sm px-3 py-2 text-xs font-mono font-bold focus:border-indigo-500 outline-none"
                    />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="font-bold text-slate-400 block text-[11px]">Quotation Pricing Mode</label>
                    <div className="p-2 bg-slate-950 border border-slate-800 rounded-sm text-[11px] text-sky-400 font-mono">
                      Formula pricing formulated dynamically by Sales Engineers
                    </div>
                  </div>
                )}
              </div>

              {/* Unit & MOQ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block text-[11px]">Unit of Measurement</label>
                  <select
                    value={newProdUnit}
                    onChange={(e) => setNewProdUnit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-sm px-3 py-2 text-xs focus:border-indigo-500 outline-none"
                  >
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="meter">Meters (meter)</option>
                    <option value="ton">Metric Tons (ton)</option>
                    <option value="drum">Drums (208L)</option>
                    <option value="cylinder">Gas Cylinder Bank</option>
                    <option value="bag">Degassing Bag (500g/1kg)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block text-[11px]">Minimum Order Quantity (MOQ)</label>
                  <input
                    type="number"
                    min="1"
                    value={newProdMoq}
                    onChange={(e) => setNewProdMoq(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-sm px-3 py-2 text-xs font-mono focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Technical Specs & Description */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300 block text-[11px]">Technical Specifications / Standards</label>
                <input
                  type="text"
                  value={newProdSpecs}
                  onChange={(e) => setNewProdSpecs(e.target.value)}
                  placeholder="e.g. ASTM A615 Grade 60, EN 10025 S355JR, Ethiopian Standards Agency certified"
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-sm px-3 py-2 text-xs focus:border-indigo-500 outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300 block text-[11px]">Product Description</label>
                <textarea
                  rows={2}
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  placeholder="Enter commercial description, usage guidelines, and metallurgical properties..."
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-sm px-3 py-2 text-xs focus:border-indigo-500 outline-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProduct}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-sm shadow-md transition-colors flex items-center space-x-1.5 disabled:opacity-60"
                >
                  {isSubmittingProduct ? <span>Publishing...</span> : <span>Publish to Catalog</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
