'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { INITIAL_ORDERS, INITIAL_QUOTES, PRODUCTS, SUBSIDIARIES, SEEDED_USERS } from '@/lib/constants';
import { Product } from '@/types';
import {
  Shield,
  Layers,
  DollarSign,
  TrendingUp,
  FileText,
  ShoppingCart,
  Users,
  CheckCircle,
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
  Tag
} from 'lucide-react';
import { MfaVerificationModal } from '@/components/modals/MfaVerificationModal';

export default function SuperAdminPage() {
  const { currentUser, activeRole, switchRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'rfqs' | 'users' | 'payments' | 'tax_settings'>('overview');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'products' || tabParam === 'catalog') {
        setActiveTab('products');
      }
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

  const handleMfaConfirmed = () => {
    setIsMfaOpen(false);
    setSavedSettingsNotice(`Tax Policy Updated: Standard VAT ${vatRate}% & Withholding ${withholdingRate}% committed across all subsidiaries under verified MFA token.`);
    setTimeout(() => setSavedSettingsNotice(null), 3500);
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
            { id: 'products', label: `Master Catalog (${productsList.length})` },
            { id: 'orders', label: `Direct Orders (${INITIAL_ORDERS.length})` },
            { id: 'rfqs', label: `RFQ Pipeline (${INITIAL_QUOTES.length})` },
            { id: 'tax_settings', label: 'ERCA Tax & Financial Rules' },
            { id: 'payments', label: 'Payment Gateway Switchboard' },
            { id: 'users', label: `RBAC Governance (${SEEDED_USERS.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
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

        {/* TAB 6: RBAC GOVERNANCE */}
        {activeTab === 'users' && (
          <div className="bg-slate-900 border border-slate-800 rounded-sm p-5 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              RBAC & ABAC Stakeholder Access Directory
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3">Name</th>
                    <th className="py-2 px-3">Email Address</th>
                    <th className="py-2 px-3">Role Level</th>
                    <th className="py-2 px-3">Assigned Scope / Branch</th>
                    <th className="py-2 px-3">ERCA TIN</th>
                    <th className="py-2 px-3 text-center">Assume Persona</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {SEEDED_USERS.map((usr) => (
                    <tr key={usr.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-bold text-white">{usr.fullName}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">{usr.email}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 bg-slate-800 text-indigo-300 rounded-sm font-mono font-bold text-[10px] uppercase">
                          {usr.role}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {usr.subsidiaryName || usr.branchName || 'Global Enterprise Scope'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">{usr.tinNumber || 'N/A'}</td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => switchRole(usr.role)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-indigo-600 hover:text-white border border-slate-700 rounded-sm text-[10px] font-bold transition-colors"
                        >
                          Switch Role
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

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
