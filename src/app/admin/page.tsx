'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { INITIAL_ORDERS, INITIAL_QUOTES, PRODUCTS, SUBSIDIARIES, SEEDED_USERS } from '@/lib/constants';
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
  ArrowRight
} from 'lucide-react';
import { MfaVerificationModal } from '@/components/modals/MfaVerificationModal';

export default function SuperAdminPage() {
  const { currentUser, activeRole, switchRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'rfqs' | 'users' | 'payments' | 'tax_settings'>('overview');

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
    </div>
  );
}
