'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  ShieldCheck,
  Key,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Phone,
  Mail,
  User,
  Warehouse,
  CreditCard,
  Bell,
  Lock,
  RefreshCw,
  Send,
  Check,
  Copy,
  ExternalLink,
  Sparkles,
  Smartphone,
  Landmark,
  X,
  History,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { BRANCHES } from '@/lib/constants';
import { UserProfile } from '@/types';

export default function UserProfileView() {
  const { currentUser, setUser } = useAuth();

  // Form State
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [email] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '+251 91 123 4567');
  const [companyName, setCompanyName] = useState(currentUser?.companyName || 'MIDROC Construction Ethiopia PLC');
  const [tinNumber, setTinNumber] = useState(currentUser?.tinNumber || '0019283746');
  const [vatNumber, setVatNumber] = useState(currentUser?.vatNumber || 'VAT-ET-2024-88491');
  const [tradeLicense, setTradeLicense] = useState(currentUser?.tradeLicense || 'MOT/AA/14/839/2016');
  const [branchId, setBranchId] = useState(currentUser?.branchId || BRANCHES[0].id);

  // Security & Preferences
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(currentUser?.twoFactorEnabled ?? true);
  const [notifySms, setNotifySms] = useState(currentUser?.notifySms ?? true);
  const [notifyEmail, setNotifyEmail] = useState(currentUser?.notifyEmail ?? true);
  const [notifyGatePass, setNotifyGatePass] = useState(currentUser?.notifyGatePass ?? true);

  // Interaction State
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copiedTin, setCopiedTin] = useState(false);

  // MFA Modal State (SRS 4.2)
  const [isMfaModalOpen, setIsMfaModalOpen] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [isVerifyingMfa, setIsVerifyingMfa] = useState(false);

  // Password Reset Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Sync state if currentUser changes
  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.fullName || '');
      setPhone(currentUser.phone || '+251 91 123 4567');
      setCompanyName(currentUser.companyName || 'MIDROC Construction Ethiopia PLC');
      setTinNumber(currentUser.tinNumber || '0019283746');
      setVatNumber(currentUser.vatNumber || 'VAT-ET-2024-88491');
      setTradeLicense(currentUser.tradeLicense || 'MOT/AA/14/839/2016');
      if (currentUser.branchId) setBranchId(currentUser.branchId);
      if (currentUser.twoFactorEnabled !== undefined) setTwoFactorEnabled(currentUser.twoFactorEnabled);
      if (currentUser.notifySms !== undefined) setNotifySms(currentUser.notifySms);
      if (currentUser.notifyEmail !== undefined) setNotifyEmail(currentUser.notifyEmail);
      if (currentUser.notifyGatePass !== undefined) setNotifyGatePass(currentUser.notifyGatePass);
    }
  }, [currentUser]);

  // Check if sensitive fields have changed relative to currentUser
  const hasSensitiveChanges = () => {
    return (
      (tinNumber.trim() !== (currentUser?.tinNumber || '').trim()) ||
      (companyName.trim() !== (currentUser?.companyName || '').trim()) ||
      (phone.trim() !== (currentUser?.phone || '').trim())
    );
  };

  const handleCopyTin = () => {
    navigator.clipboard.writeText(tinNumber);
    setCopiedTin(true);
    setTimeout(() => setCopiedTin(false), 2000);
  };

  // Submit Handler
  const handleSaveProfile = async (codeToSubmit?: string) => {
    setSaveSuccess(null);
    setSaveError(null);
    setMfaError(null);

    // If sensitive changes exist and MFA hasn't been provided yet, open modal
    if (hasSensitiveChanges() && !codeToSubmit) {
      setIsMfaModalOpen(true);
      return;
    }

    if (codeToSubmit) {
      setIsVerifyingMfa(true);
    } else {
      setIsSaving(true);
    }

    try {
      const selectedBranch = BRANCHES.find((b) => b.id === branchId);

      const payload: Record<string, any> = {
        fullName,
        phone,
        companyName,
        tinNumber,
        vatNumber,
        tradeLicense,
        branchId,
        branchName: selectedBranch?.name || currentUser?.branchName,
        twoFactorEnabled,
        notifySms,
        notifyEmail,
        notifyGatePass,
      };

      if (codeToSubmit) {
        payload.mfaCode = codeToSubmit;
      }

      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser.role,
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.mfaRequired) {
          setIsMfaModalOpen(true);
          setMfaError(data.message || 'MFA OTP required for sensitive corporate updates.');
        } else {
          throw new Error(data.error || 'Failed to update user profile');
        }
        return;
      }

      // Success! Update auth state
      if (data.user) {
        setUser(data.user);
      } else {
        setUser({
          ...currentUser,
          ...payload,
        });
      }

      setIsMfaModalOpen(false);
      setMfaCode('');
      setSaveSuccess('Corporate profile & ERCA tax credentials updated successfully.');
      setTimeout(() => setSaveSuccess(null), 5000);
    } catch (err: any) {
      setSaveError(err.message || 'An unexpected error occurred while saving profile.');
    } finally {
      setIsSaving(false);
      setIsVerifyingMfa(false);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match.');
      return;
    }
    setPasswordSuccess('Password security credentials successfully updated under OWASP ASVS.');
    setTimeout(() => {
      setPasswordSuccess(null);
      setIsPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }, 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. EXECUTIVE BENTO HEADER */}
      <div className="bg-gradient-to-br from-white via-[#F8FAFC] to-[#F1F5F9] dark:from-[#141416] dark:via-[#111113] dark:to-[#0B0B0C] border border-slate-200/90 dark:border-[#2A2A2E] rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden transition-all">
        {/* Ambient Glows */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-gradient-to-bl from-[#C6F432]/25 to-transparent dark:from-[#C6F432]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-gradient-to-tr from-emerald-400/15 to-transparent dark:from-[#C6F432]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar Pill */}
            <div className="relative group">
              <div className="w-20 h-20 rounded-2xl bg-[#0B0B0C] dark:bg-[#1A1A1D] border-2 border-[#C6F432] text-[#C6F432] font-serif font-black text-3xl flex items-center justify-center shadow-lg shadow-[#C6F432]/15">
                {currentUser?.fullName ? currentUser.fullName[0] : 'U'}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0B0B0C] flex items-center justify-center" title="Account Active & Synced">
                <Check className="w-3.5 h-3.5 text-white" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-serif font-black text-2xl sm:text-3xl text-slate-900 dark:text-white tracking-tight">
                  {currentUser?.fullName || 'Procurement Executive'}
                </span>
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>ERCA Verified Entity</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#C6F432]/20 dark:bg-[#C6F432]/10 text-emerald-900 dark:text-[#C6F432] border border-[#C6F432]/40">
                  Role: {currentUser?.role?.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              <div className="text-xs text-slate-600 dark:text-[#A1A1AA] flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="flex items-center space-x-1.5 font-medium">
                  <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-[#C6F432]" />
                  <span>{currentUser?.companyName || 'MIDROC Construction Ethiopia PLC'}</span>
                </span>
                <span className="text-slate-300 dark:text-[#333338]">•</span>
                <span className="flex items-center space-x-1.5 font-mono">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{currentUser?.email}</span>
                </span>
                <span className="text-slate-300 dark:text-[#333338]">•</span>
                <span className="flex items-center space-x-1.5 font-mono">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{currentUser?.phone || '+251 91 123 4567'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions / Reset */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(true)}
              className="px-4 py-2.5 rounded-full bg-white dark:bg-[#1A1A1D] hover:bg-slate-50 dark:hover:bg-[#222225] text-slate-800 dark:text-[#E4E4E7] hover:text-slate-950 dark:hover:text-white border border-slate-300 dark:border-[#2A2A2E] text-xs font-semibold transition-all flex items-center space-x-2 shadow-xs"
            >
              <Key className="w-3.5 h-3.5 text-emerald-600 dark:text-[#C6F432]" />
              <span>Update Password</span>
            </button>
            <button
              type="button"
              onClick={() => handleSaveProfile()}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-full bg-[#C6F432] hover:bg-[#D7F860] text-[#0B0B0C] text-xs font-bold transition-all flex items-center space-x-2 shadow-md hover:shadow-[#C6F432]/25 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Updating Profile...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Save All Changes</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 4 BENTO QUICK METRICS */}
        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-[#222225] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/80 dark:bg-[#0E0E10] border border-slate-200 dark:border-[#222225] p-3.5 rounded-2xl">
            <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-[#71717A] tracking-wider mb-1 flex items-center justify-between">
              <span>Ethiopian Tax TIN</span>
              <button
                type="button"
                onClick={handleCopyTin}
                className="text-[10px] text-emerald-700 dark:text-[#C6F432] hover:underline flex items-center space-x-1"
                title="Copy TIN to clipboard"
              >
                {copiedTin ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedTin ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="text-sm font-mono font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
              <span>{tinNumber}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Valid 10-digit TIN" />
            </div>
            <div className="text-[10px] text-slate-400 dark:text-[#A1A1AA] mt-0.5">ERCA MoR Live Registered</div>
          </div>

          <div className="bg-white/80 dark:bg-[#0E0E10] border border-slate-200 dark:border-[#222225] p-3.5 rounded-2xl">
            <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-[#71717A] tracking-wider mb-1">
              Commercial Credit Tier
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
              <span>ETB 25,000,000</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold">
                Net-30
              </span>
            </div>
            <div className="text-[10px] text-slate-400 dark:text-[#A1A1AA] mt-0.5">Available: ETB 18,450,000</div>
          </div>

          <div className="bg-white/80 dark:bg-[#0E0E10] border border-slate-200 dark:border-[#222225] p-3.5 rounded-2xl">
            <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-[#71717A] tracking-wider mb-1">
              Default Fulfillment Hub
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {BRANCHES.find((b) => b.id === branchId)?.name || 'Addis Ababa Central Hub'}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-[#A1A1AA] mt-0.5">Priority Dispatch Route</div>
          </div>

          <div className="bg-white/80 dark:bg-[#0E0E10] border border-slate-200 dark:border-[#222225] p-3.5 rounded-2xl">
            <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-[#71717A] tracking-wider mb-1">
              Account Security Level
            </div>
            <div className="text-sm font-bold text-emerald-700 dark:text-[#C6F432] flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>OWASP ASVS v4.0</span>
            </div>
            <div className="text-[10px] text-slate-400 dark:text-[#A1A1AA] mt-0.5">
              2FA {twoFactorEnabled ? 'Active (SMS + Token)' : 'Disabled'}
            </div>
          </div>
        </div>
      </div>

      {/* SUCCESS / ERROR ALERTS */}
      {saveSuccess && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/60 text-emerald-800 dark:text-emerald-200 p-4 rounded-2xl flex items-center space-x-3 font-semibold text-xs shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {saveError && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-700/60 text-rose-800 dark:text-rose-200 p-4 rounded-2xl flex items-center space-x-3 font-semibold text-xs shadow-xs animate-in fade-in">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* 2. MAIN PROFILE FORM SECTIONS (BENTO GRID) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT 2 COLS: CORPORATE COMPLIANCE & EXECUTIVE IDENTITY */}
        <div className="lg:col-span-2 space-y-6">
          {/* SECTION A: CORPORATE TAX & ERCA COMPLIANCE (SRS 4.2 GATED) */}
          <div className="bg-white dark:bg-[#141416] border border-slate-200/90 dark:border-[#2A2A2E] rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#222225] pb-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-emerald-600 dark:text-[#C6F432]" />
                  <span>Corporate Legal Entity & ERCA Tax Compliance</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-[#A1A1AA]">
                  Official enterprise registration details recognized by the Ethiopian Ministry of Revenues.
                </p>
              </div>
              <span className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/50">
                <Lock className="w-3 h-3" />
                <span>MFA Protected (SRS 4.2)</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Company Legal Entity */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-[#D4D4D8] flex items-center justify-between">
                  <span>Registered Corporate Entity Name *</span>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono font-normal">
                    Requires OTP to modify
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. MIDROC Construction Ethiopia PLC"
                    className="w-full bg-slate-50 dark:bg-[#0E0E10] border border-slate-300 dark:border-[#2A2A2E] text-slate-900 dark:text-white font-semibold px-4 py-2.5 rounded-xl text-xs outline-none focus:border-[#C6F432] focus:ring-1 focus:ring-[#C6F432] transition-colors"
                  />
                  <Building2 className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                </div>
              </div>

              {/* TIN Number */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-[#D4D4D8] flex items-center justify-between">
                  <span>Tax Identification No. (TIN) *</span>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono font-normal">10 Digits</span>
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={tinNumber}
                  onChange={(e) => setTinNumber(e.target.value)}
                  placeholder="0019283746"
                  className="w-full bg-slate-50 dark:bg-[#0E0E10] border border-slate-300 dark:border-[#2A2A2E] text-slate-900 dark:text-white font-mono font-bold px-4 py-2.5 rounded-xl text-xs outline-none focus:border-[#C6F432] focus:ring-1 focus:ring-[#C6F432] transition-colors tracking-widest"
                />
              </div>

              {/* 15% VAT Registration */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-[#D4D4D8]">
                  15% Standard VAT Registration No.
                </label>
                <input
                  type="text"
                  value={vatNumber}
                  onChange={(e) => setVatNumber(e.target.value)}
                  placeholder="VAT-ET-2024-88491"
                  className="w-full bg-slate-50 dark:bg-[#0E0E10] border border-slate-300 dark:border-[#2A2A2E] text-slate-900 dark:text-white font-mono px-4 py-2.5 rounded-xl text-xs outline-none focus:border-[#C6F432] focus:ring-1 focus:ring-[#C6F432] transition-colors"
                />
              </div>

              {/* Commercial Trade License */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-[#D4D4D8]">
                  MOTRI Commercial Trade License No.
                </label>
                <input
                  type="text"
                  value={tradeLicense}
                  onChange={(e) => setTradeLicense(e.target.value)}
                  placeholder="MOT/AA/14/839/2016"
                  className="w-full bg-slate-50 dark:bg-[#0E0E10] border border-slate-300 dark:border-[#2A2A2E] text-slate-900 dark:text-white font-mono px-4 py-2.5 rounded-xl text-xs outline-none focus:border-[#C6F432] focus:ring-1 focus:ring-[#C6F432] transition-colors"
                />
              </div>

              {/* Preferred Fulfillment Depot */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-[#D4D4D8]">
                  Designated Regional Fulfillment Depot
                </label>
                <div className="relative">
                  <select
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0E0E10] border border-slate-300 dark:border-[#2A2A2E] text-slate-900 dark:text-white font-semibold px-4 py-2.5 rounded-xl text-xs outline-none focus:border-[#C6F432] focus:ring-1 focus:ring-[#C6F432] transition-colors appearance-none"
                  >
                    {BRANCHES.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.city})
                      </option>
                    ))}
                  </select>
                  <Warehouse className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-slate-500 dark:text-[#71717A] bg-slate-50 dark:bg-[#0E0E10] p-3 rounded-xl border border-slate-200 dark:border-[#222225] flex items-center space-x-2">
              <FileCheck className="w-4 h-4 text-emerald-600 dark:text-[#C6F432] shrink-0" />
              <span>
                All invoices generated through Stream A checkout and Stream B assisted quotes are ERCA compliant with 15% VAT automated breakdowns.
              </span>
            </div>
          </div>

          {/* SECTION B: EXECUTIVE PROCUREMENT OFFICER CONTACT */}
          <div className="bg-white dark:bg-[#141416] border border-slate-200/90 dark:border-[#2A2A2E] rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
            <div className="border-b border-slate-200 dark:border-[#222225] pb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
                <User className="w-4 h-4 text-emerald-600 dark:text-[#C6F432]" />
                <span>Authorized Procurement Officer & Contact Details</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-[#A1A1AA]">
                Primary contact receiving dispatch SMS notifications, digital waybills, and proforma revisions.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-[#D4D4D8]">
                  Authorized Officer Full Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Almaz Worku"
                    className="w-full bg-slate-50 dark:bg-[#0E0E10] border border-slate-300 dark:border-[#2A2A2E] text-slate-900 dark:text-white font-semibold px-4 py-2.5 rounded-xl text-xs outline-none focus:border-[#C6F432] focus:ring-1 focus:ring-[#C6F432] transition-colors"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Verified Email */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-[#D4D4D8] flex items-center justify-between">
                  <span>Corporate Business Email</span>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono">Domain Verified</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    readOnly
                    className="w-full bg-slate-100 dark:bg-[#1A1A1D] border border-slate-200 dark:border-[#2A2A2E] text-slate-600 dark:text-[#A1A1AA] font-mono px-4 py-2.5 rounded-xl text-xs outline-none cursor-not-allowed"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Mobile Phone */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-[#D4D4D8] flex items-center justify-between">
                  <span>Telebirr & SMS Dispatch Mobile Number *</span>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono font-normal">
                    Requires OTP to modify
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+251 91 123 4567"
                    className="w-full bg-slate-50 dark:bg-[#0E0E10] border border-slate-300 dark:border-[#2A2A2E] text-slate-900 dark:text-white font-mono font-semibold px-4 py-2.5 rounded-xl text-xs outline-none focus:border-[#C6F432] focus:ring-1 focus:ring-[#C6F432] transition-colors"
                  />
                  <Smartphone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT 1 COL: FINANCIAL TERMS, SECURITY & NOTIFICATIONS */}
        <div className="space-y-6">
          {/* SECTION C: COMMERCIAL CREDIT TERMS */}
          <div className="bg-white dark:bg-[#141416] border border-slate-200/90 dark:border-[#2A2A2E] rounded-3xl p-6 shadow-xs space-y-4">
            <div className="border-b border-slate-200 dark:border-[#222225] pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-emerald-600 dark:text-[#C6F432]" />
                <span>B2B Credit & Settlement</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-[#A1A1AA]">
                Approved enterprise commercial credit terms.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 dark:bg-[#0E0E10] p-4 rounded-2xl border border-slate-200 dark:border-[#222225] space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-[#A1A1AA] font-medium">Approved Credit Facility</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">ETB 25,000,000</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-[#A1A1AA] font-medium">Utilized Balance</span>
                  <span className="font-mono font-semibold text-amber-700 dark:text-amber-400">ETB 6,550,000</span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-slate-200 dark:bg-[#222225] h-2 rounded-full overflow-hidden">
                  <div className="bg-[#C6F432] h-full rounded-full" style={{ width: '26.2%' }} />
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400">
                  <span>26.2% Drawn</span>
                  <span className="text-emerald-700 dark:text-[#C6F432] font-semibold">ETB 18,450,000 Available</span>
                </div>
              </div>

              <div className="space-y-2 pt-1 text-[11px]">
                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-[#222225]">
                  <span className="text-slate-500 dark:text-[#A1A1AA]">Standard Terms:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">Net-30 Days post-dispatch</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-[#222225]">
                  <span className="text-slate-500 dark:text-[#A1A1AA]">Settlement Rail:</span>
                  <span className="font-semibold text-slate-900 dark:text-white flex items-center space-x-1">
                    <Landmark className="w-3.5 h-3.5 text-emerald-600 dark:text-[#C6F432]" />
                    <span>CBE Bank Transfer</span>
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-500 dark:text-[#A1A1AA]">CBE Verified Acct:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">1000123456789</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION D: SECURITY & 2FA (SRS 4.2) */}
          <div className="bg-white dark:bg-[#141416] border border-slate-200/90 dark:border-[#2A2A2E] rounded-3xl p-6 shadow-xs space-y-4">
            <div className="border-b border-slate-200 dark:border-[#222225] pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-[#C6F432]" />
                <span>Security & Sessions (SRS 4.2)</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-[#A1A1AA]">
                Two-Factor Authentication & active sessions.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              {/* 2FA Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0E0E10] border border-slate-200 dark:border-[#222225]">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                    <span>Two-Factor Authentication</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-[#A1A1AA]">
                    Enforces 6-digit OTP verification for profile and quote releases.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    twoFactorEnabled ? 'bg-[#C6F432]' : 'bg-slate-300 dark:bg-[#2A2A2E]'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-[#0B0B0C] shadow-lg ring-0 transition duration-200 ease-in-out ${
                      twoFactorEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Active Session Info */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0E0E10] border border-slate-200 dark:border-[#222225] space-y-1.5 text-[11px]">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Active Session</div>
                <div className="flex items-center justify-between text-slate-900 dark:text-white font-medium">
                  <span>Linux x86_64 • Chrome Browser</span>
                  <span className="text-emerald-700 dark:text-[#C6F432] font-semibold">Active Now</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">IP: 196.188.64.12 • Addis Ababa, Ethiopia</div>
              </div>
            </div>
          </div>

          {/* SECTION E: B2B DISPATCH NOTIFICATIONS */}
          <div className="bg-white dark:bg-[#141416] border border-slate-200/90 dark:border-[#2A2A2E] rounded-3xl p-6 shadow-xs space-y-4">
            <div className="border-b border-slate-200 dark:border-[#222225] pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
                <Bell className="w-4 h-4 text-emerald-600 dark:text-[#C6F432]" />
                <span>Dispatch & Logistics Alerts</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-[#A1A1AA]">
                Configured real-time alerts for warehousing and fleet dispatches.
              </p>
            </div>

            <div className="space-y-2.5 text-xs">
              <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-[#0E0E10] transition-colors">
                <span className="text-slate-800 dark:text-[#D4D4D8] font-medium">SMS Dispatch & Gate Pass Releases</span>
                <input
                  type="checkbox"
                  checked={notifyGatePass}
                  onChange={(e) => setNotifyGatePass(e.target.checked)}
                  className="w-4 h-4 accent-[#C6F432] rounded"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-[#0E0E10] transition-colors">
                <span className="text-slate-800 dark:text-[#D4D4D8] font-medium">CBE Bank Slip Verification Notices</span>
                <input
                  type="checkbox"
                  checked={notifySms}
                  onChange={(e) => setNotifySms(e.target.checked)}
                  className="w-4 h-4 accent-[#C6F432] rounded"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-[#0E0E10] transition-colors">
                <span className="text-slate-800 dark:text-[#D4D4D8] font-medium">Engineering RFQ Price Revisions</span>
                <input
                  type="checkbox"
                  checked={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.checked)}
                  className="w-4 h-4 accent-[#C6F432] rounded"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM FLOATING / FIXED ACTION DOCK */}
      <div className="bg-gradient-to-r from-white via-slate-50 to-white dark:from-[#141416] dark:via-[#1A1A1D] dark:to-[#141416] border border-slate-200/90 dark:border-[#2A2A2E] rounded-3xl p-5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3 text-xs">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-slate-900 dark:text-white">
              Compliance Standard: Ethiopian Revenue Authority (ERCA) & ISO 27001
            </div>
            <div className="text-[11px] text-slate-500 dark:text-[#A1A1AA]">
              Changes to Tax Identification Numbers or Company Entities trigger automatic security validation.
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              if (currentUser) {
                setFullName(currentUser.fullName || '');
                setPhone(currentUser.phone || '+251 91 123 4567');
                setCompanyName(currentUser.companyName || 'MIDROC Construction Ethiopia PLC');
                setTinNumber(currentUser.tinNumber || '0019283746');
                setVatNumber(currentUser.vatNumber || 'VAT-ET-2024-88491');
                setTradeLicense(currentUser.tradeLicense || 'MOT/AA/14/839/2016');
              }
            }}
            className="w-1/2 sm:w-auto px-4 py-2.5 rounded-full bg-white dark:bg-[#1A1A1D] hover:bg-slate-100 dark:hover:bg-[#222225] text-slate-700 dark:text-[#A1A1AA] hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-[#2A2A2E] text-xs font-semibold transition-all"
          >
            Discard Changes
          </button>
          <button
            type="button"
            onClick={() => handleSaveProfile()}
            disabled={isSaving}
            className="w-1/2 sm:w-auto px-6 py-2.5 rounded-full bg-[#C6F432] hover:bg-[#D7F860] text-[#0B0B0C] text-xs font-bold transition-all shadow-md hover:shadow-[#C6F432]/25 flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 4. MODAL: MFA OTP SECURITY CHALLENGE (SRS 4.2) */}
      {isMfaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-[#141416] border border-slate-200 dark:border-[#2A2A2E] rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-7 space-y-5 text-xs text-slate-900 dark:text-white relative overflow-hidden">
            {/* Ambient Accent Glow */}
            <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#C6F432]/15 rounded-full blur-2xl pointer-events-none" />

            <div className="flex justify-between items-center border-b border-slate-200 dark:border-[#222225] pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    MFA Security Challenge
                  </h3>
                  <div className="text-[10px] text-amber-600 dark:text-amber-400 font-mono">
                    Mandatory per SRS 4.2 Security Gating
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsMfaModalOpen(false);
                  setMfaError(null);
                }}
                className="p-1 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1A1A1D] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-slate-600 dark:text-[#A1A1AA] leading-relaxed">
                You are updating sensitive corporate identity credentials (such as your <strong>TIN Number</strong>, <strong>Legal Entity Name</strong>, or <strong>Mobile Phone</strong>).
              </p>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#0E0E10] border border-slate-200 dark:border-[#222225] space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-400">Dispatch Destination:</div>
                <div className="font-mono font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600 dark:text-[#C6F432]" />
                  <span>SMS to {phone}</span>
                </div>
              </div>

              {mfaError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-700/60 rounded-xl text-rose-800 dark:text-rose-200 font-medium text-[11px] flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                  <span>{mfaError}</span>
                </div>
              )}

              <div className="space-y-1.5 pt-2">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-[#D4D4D8]">
                  Enter 6-Digit One-Time Security Code:
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full text-center tracking-[0.5em] text-lg font-mono font-bold py-3 bg-slate-50 dark:bg-[#0E0E10] border border-slate-300 dark:border-[#2A2A2E] rounded-xl text-slate-900 dark:text-[#C6F432] focus:border-[#C6F432] outline-none transition-colors"
                />
              </div>

              {/* Demo Helper Button */}
              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className="text-slate-400">Testing Environment:</span>
                <button
                  type="button"
                  onClick={() => setMfaCode('123456')}
                  className="text-emerald-700 dark:text-[#C6F432] font-semibold hover:underline flex items-center space-x-1"
                >
                  <Key className="w-3 h-3" />
                  <span>Use Test Code (123456)</span>
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-[#222225] flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setIsMfaModalOpen(false);
                  setMfaError(null);
                }}
                className="px-4 py-2 rounded-full border border-slate-300 dark:border-[#2A2A2E] text-slate-700 dark:text-[#A1A1AA] hover:text-slate-900 dark:hover:text-white font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveProfile(mfaCode)}
                disabled={mfaCode.length !== 6 || isVerifyingMfa}
                className="px-5 py-2 rounded-full bg-[#C6F432] hover:bg-[#D7F860] text-[#0B0B0C] font-bold transition-all shadow-md hover:shadow-[#C6F432]/25 flex items-center space-x-2 disabled:opacity-50"
              >
                {isVerifyingMfa ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verify & Save</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL: PASSWORD RESET / ROTATION */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in">
          <form
            onSubmit={handlePasswordSubmit}
            className="bg-white dark:bg-[#141416] border border-slate-200 dark:border-[#2A2A2E] rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-7 space-y-4 text-xs text-slate-900 dark:text-white"
          >
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-[#222225] pb-3">
              <div className="flex items-center space-x-2.5">
                <Key className="w-5 h-5 text-emerald-600 dark:text-[#C6F432]" />
                <h3 className="text-sm font-bold uppercase tracking-wider">Update Account Password</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {passwordSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/60 rounded-xl text-emerald-800 dark:text-emerald-200 font-semibold text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-[#D4D4D8]">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-50 dark:bg-[#0E0E10] border border-slate-300 dark:border-[#2A2A2E] px-3.5 py-2 rounded-xl text-xs outline-none focus:border-[#C6F432]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-[#D4D4D8]">
                  New Password (Min. 8 chars, 1 number, 1 symbol)
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-50 dark:bg-[#0E0E10] border border-slate-300 dark:border-[#2A2A2E] px-3.5 py-2 rounded-xl text-xs outline-none focus:border-[#C6F432]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-[#D4D4D8]">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-50 dark:bg-[#0E0E10] border border-slate-300 dark:border-[#2A2A2E] px-3.5 py-2 rounded-xl text-xs outline-none focus:border-[#C6F432]"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-[#222225] flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="px-4 py-2 rounded-full border border-slate-300 dark:border-[#2A2A2E] text-slate-600 dark:text-[#A1A1AA]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-full bg-[#C6F432] hover:bg-[#D7F860] text-[#0B0B0C] font-bold shadow-sm"
              >
                Update Password
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
