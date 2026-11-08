'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { SEEDED_USERS, BRANCHES } from '@/lib/constants';
import { UserProfile, UserRole } from '@/types';
import {
  Shield,
  ShieldCheck,
  Lock,
  Mail,
  Phone,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Building2,
  KeyRound,
  Sparkles,
  Users,
  UserPlus,
  Briefcase,
  User,
  Eye,
  EyeOff,
  Layers,
  ArrowLeft,
  Truck,
  Check,
  CreditCard,
  FileText,
  BadgeCheck,
  HelpCircle,
  Sun,
  Moon,
} from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser, switchRole } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<'standard' | 'register' | 'demo'>('standard');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('Password123!');
  const [showPassword, setShowPassword] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaPromptMessage, setMfaPromptMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Customer Registration State
  const [regFullName, setRegFullName] = useState('');
  const [regAccountType, setRegAccountType] = useState<'b2b' | 'b2c'>('b2b');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCompanyName, setRegCompanyName] = useState('');
  const [regTinNumber, setRegTinNumber] = useState('');
  const [regVatNumber, setRegVatNumber] = useState('');
  const [regBranchId, setRegBranchId] = useState(BRANCHES[0]?.id || 'a1111111-1111-1111-1111-111111111111');
  const [regCity, setRegCity] = useState('Addis Ababa');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regSuccessNotice, setRegSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'register') {
      setActiveTab('register');
    } else if (tabParam === 'demo') {
      setActiveTab('demo');
    }
  }, [searchParams]);

  const roleRedirectMap: Record<UserRole, string> = {
    super_admin: '/admin',
    branch_admin: '/branch-admin',
    sales_agent: '/agent',
    finance: '/finance',
    customer: '/portal',
  };

  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const payload: { identifier: string; password: string; mfaCode?: string } = {
        identifier: identifier.trim(),
        password,
      };

      if (mfaRequired && mfaCode) {
        payload.mfaCode = mfaCode.trim();
      }

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (data.mfaRequired) {
        setMfaRequired(true);
        setMfaPromptMessage(data.message || 'MFA OTP required for privileged account');
        setLoading(false);
        return;
      }

      // Successful login
      if (data.user) {
        setUser(data.user);
        const targetUrl = roleRedirectMap[data.user.role as UserRole] || '/';
        router.push(targetUrl);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setRegSuccessNotice(null);

    if (regPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters long');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    if (!regEmail.trim() && !regPhone.trim()) {
      setErrorMsg('Please provide either an email or mobile phone number');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        fullName: regFullName.trim(),
        email: regEmail.trim() || undefined,
        phone: regPhone.trim() || undefined,
        password: regPassword,
        customerType: regAccountType,
        branchId: regBranchId,
        companyName: regAccountType === 'b2b' ? regCompanyName.trim() : 'Individual Retail Buyer',
        tinNumber: regAccountType === 'b2b' ? regTinNumber.trim() : 'N/A (Consumer)',
        vatNumber: regAccountType === 'b2b' ? (regVatNumber.trim() || undefined) : 'N/A (Standard Retail)',
        city: regCity,
        role: 'customer',
      };

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setRegSuccessNotice('Account successfully registered! Redirecting to your Customer Portal...');
      if (data.user) {
        setUser(data.user);
        setTimeout(() => {
          router.push('/portal');
        }, 1200);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Registration error. Please verify your details.');
    } finally {
      setLoading(false);
    }
  };

  const handle1ClickLogin = (user: UserProfile) => {
    setUser(user);
    const targetUrl = roleRedirectMap[user.role] || '/';
    router.push(targetUrl);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080809] text-slate-900 dark:text-white flex flex-col justify-between selection:bg-[#C6F432] selection:text-[#080809] transition-colors duration-200">
      {/* Top subtle bar */}
      <div className="border-b border-slate-200 dark:border-[#1E1E22] bg-white/90 dark:bg-[#0E0E10]/80 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center space-x-2 text-xs font-semibold text-slate-600 dark:text-[#A1A1AA] hover:text-slate-900 dark:hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          <span>Return to Storefront Catalog</span>
        </Link>

        <div className="flex items-center space-x-3 text-[11px] font-mono text-slate-500 dark:text-[#71717A]">
          <span className="hidden sm:inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] text-slate-700 dark:text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-[#C6F432] animate-pulse" />
            <span>Gateway Online • Addis Ababa GMT+3</span>
          </span>
          <span className="hidden md:inline text-slate-300 dark:text-slate-600">|</span>
          <span className="text-slate-500 dark:text-slate-400">SRS 4.2 Compliant</span>
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 rounded-xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#18181B] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center space-x-1.5 shadow-xs cursor-pointer"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-slate-700" />
            )}
            <span className="text-[10px] font-bold capitalize sm:inline hidden">
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </span>
          </button>
        </div>
      </div>

      {/* Main Container: Split on LG */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 lg:py-12 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* LEFT COLUMN: Executive Consortium Showcase (LG screens) */}
          <div className="lg:col-span-6 space-y-8 pr-0 lg:pr-4">
            {/* Header Badge & Brand */}
            <div className="space-y-4">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-[#C6F432]/10 border border-emerald-200 dark:border-[#C6F432]/30 text-emerald-800 dark:text-[#C6F432] text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>AMG Holdings Enterprise Access</span>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-2xl bg-white dark:bg-[#141416] p-2 border border-slate-200 dark:border-[#2A2A2E] shadow-sm dark:shadow-xl flex items-center justify-center shrink-0">
                  <img src="/logo.png" alt="AMG Holdings" className="max-h-full max-w-full object-contain" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                    Unified Industrial Procurement
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Corporate Governance &amp; Commercial Trade Infrastructure
                  </p>
                </div>
              </div>

              <p className="text-sm text-slate-600 dark:text-[#A1A1AA] leading-relaxed max-w-lg">
                Direct access for commercial B2B contractors, individual retail buyers, licensed sales engineers, branch depot managers, and corporate treasury.
              </p>
            </div>

            {/* Core Capability Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#222226] hover:border-emerald-500/40 dark:hover:border-[#C6F432]/40 shadow-xs transition-colors">
                <div className="w-8 h-8 rounded-xl bg-lime-500/10 dark:bg-[#C6F432]/10 border border-lime-500/20 dark:border-[#C6F432]/20 flex items-center justify-center text-emerald-600 dark:text-[#C6F432] mb-3">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h2 className="text-xs font-bold text-slate-900 dark:text-white mb-1">Dual-Stream Engine</h2>
                <p className="text-[11px] text-slate-500 dark:text-[#71717A] leading-normal">
                  Stream A direct inventory buy &amp; Stream B custom PEB &amp; roofing engineering RFQs.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#222226] hover:border-emerald-500/40 dark:hover:border-[#C6F432]/40 shadow-xs transition-colors">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3">
                  <Building2 className="w-4 h-4" />
                </div>
                <h2 className="text-xs font-bold text-slate-900 dark:text-white mb-1">Ethiopian Banking Rails</h2>
                <p className="text-[11px] text-slate-500 dark:text-[#71717A] leading-normal">
                  Instant CBE Birr FT reconciliation, Telebirr API integration, and branch cash slips.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#222226] hover:border-emerald-500/40 dark:hover:border-[#C6F432]/40 shadow-xs transition-colors">
                <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400 mb-3">
                  <FileText className="w-4 h-4" />
                </div>
                <h2 className="text-xs font-bold text-slate-900 dark:text-white mb-1">ERCA Tax &amp; Invoicing</h2>
                <p className="text-[11px] text-slate-500 dark:text-[#71717A] leading-normal">
                  Automated Ethiopian TIN validation, 15% VAT invoicing, and withholding declarations.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#222226] hover:border-emerald-500/40 dark:hover:border-[#C6F432]/40 shadow-xs transition-colors">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-3">
                  <Truck className="w-4 h-4" />
                </div>
                <h2 className="text-xs font-bold text-slate-900 dark:text-white mb-1">Regional Branch Depots</h2>
                <p className="text-[11px] text-slate-500 dark:text-[#71717A] leading-normal">
                  Addis Ababa Central Hub, Adama FTZ, Hawassa Regional Depot &amp; Dire Dawa Hub.
                </p>
              </div>
            </div>

            {/* Subsidiary Pills */}
            <div className="pt-2 border-t border-slate-200 dark:border-[#1E1E22]">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#71717A] mb-2.5">
                5 Operating Subsidiaries
              </div>
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                <span className="px-2.5 py-1 rounded-full bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] text-slate-700 dark:text-slate-300 shadow-xs">
                  Heavy Structural Steel
                </span>
                <span className="px-2.5 py-1 rounded-full bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] text-slate-700 dark:text-slate-300 shadow-xs">
                  Ethio &amp; Adama Roofing
                </span>
                <span className="px-2.5 py-1 rounded-full bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] text-slate-700 dark:text-slate-300 shadow-xs">
                  Commercial Fleet Logistics
                </span>
                <span className="px-2.5 py-1 rounded-full bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] text-slate-700 dark:text-slate-300 shadow-xs">
                  Industrial Cryogenic Gases
                </span>
                <span className="px-2.5 py-1 rounded-full bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] text-slate-700 dark:text-slate-300 shadow-xs">
                  Specialty Coffee Export
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: The Authentication Box */}
          <div className="lg:col-span-6">
            <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#242428] rounded-3xl shadow-xl dark:shadow-2xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden transition-colors">
              {/* Subtle top lime glow line */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#C6F432] dark:via-[#C6F432]/60 to-transparent" />

              {/* Segmented Pill Tabs */}
              <div className="p-1 rounded-2xl bg-slate-100 dark:bg-[#0A0A0C] border border-slate-200 dark:border-[#1E1E22] grid grid-cols-3 gap-1 mb-6 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('standard');
                    setErrorMsg(null);
                  }}
                  className={`py-2.5 rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                    activeTab === 'standard'
                      ? 'bg-[#C6F432] text-[#080809] shadow-sm font-bold'
                      : 'text-slate-600 dark:text-[#A1A1AA] hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-[#18181B]'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setErrorMsg(null);
                  }}
                  className={`py-2.5 rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                    activeTab === 'register'
                      ? 'bg-[#C6F432] text-[#080809] shadow-sm font-bold'
                      : 'text-slate-600 dark:text-[#A1A1AA] hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-[#18181B]'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('demo');
                    setErrorMsg(null);
                  }}
                  className={`py-2.5 rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                    activeTab === 'demo'
                      ? 'bg-[#C6F432] text-[#080809] shadow-sm font-bold'
                      : 'text-slate-600 dark:text-[#A1A1AA] hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-[#18181B]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>1-Click Demo</span>
                </button>
              </div>

              {/* Alert / Error Message */}
              {errorMsg && (
                <div className="mb-5 p-3.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 rounded-2xl text-rose-800 dark:text-rose-200 text-xs flex items-start space-x-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-semibold">{errorMsg}</div>
                  </div>
                </div>
              )}

              {/* Success Notification */}
              {regSuccessNotice && (
                <div className="mb-5 p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-700/80 rounded-2xl text-emerald-800 dark:text-emerald-200 text-xs flex items-center space-x-2.5 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="font-medium">{regSuccessNotice}</span>
                </div>
              )}

              {/* TAB 1: STANDARD SIGN IN */}
              {activeTab === 'standard' && (
                <form onSubmit={handleStandardLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-[#D4D4D8] block">
                      Corporate Email or Ethiopian Phone Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-[#71717A]">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="procurement@company.et or +251 91 123 4567"
                        className="w-full bg-slate-50 dark:bg-[#18181B] border border-slate-200 dark:border-[#2E2E34] hover:border-slate-300 dark:hover:border-[#42424A] focus:border-emerald-600 dark:focus:border-[#C6F432] focus:ring-4 focus:ring-emerald-500/10 dark:focus:ring-[#C6F432]/10 text-slate-900 dark:text-white rounded-xl pl-10 pr-4 py-3 text-xs outline-none transition-all placeholder-slate-400 dark:placeholder-[#71717A]"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-[#71717A]">
                      Use your registered corporate domain email or Ethiopian mobile (+251).
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-[#D4D4D8] block">
                        Account Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('demo');
                          setErrorMsg(null);
                        }}
                        className="text-[10px] text-emerald-600 dark:text-[#C6F432] hover:underline font-semibold cursor-pointer"
                      >
                        Forgot password? Try Demo
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-[#71717A]">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-[#18181B] border border-slate-200 dark:border-[#2E2E34] hover:border-slate-300 dark:hover:border-[#42424A] focus:border-emerald-600 dark:focus:border-[#C6F432] focus:ring-4 focus:ring-emerald-500/10 dark:focus:ring-[#C6F432]/10 text-slate-900 dark:text-white rounded-xl pl-10 pr-11 py-3 text-xs outline-none transition-all placeholder-slate-400 dark:placeholder-[#71717A] font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 dark:text-[#71717A] hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* MFA OTP Step-Up Input (Appears when required for privileged users) */}
                  {mfaRequired && (
                    <div className="p-4 bg-sky-50 dark:bg-[#141E28] border border-sky-300 dark:border-sky-500/50 rounded-2xl space-y-3 animate-in fade-in">
                      <div className="flex items-center space-x-2 text-sky-700 dark:text-sky-400 text-xs font-bold">
                        <Shield className="w-4 h-4" />
                        <span>Two-Factor Authentication (MFA OTP Required)</span>
                      </div>
                      <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                        {mfaPromptMessage}
                      </p>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400">
                          Enter 6-Digit OTP Code (Simulated Test Code: <span className="text-emerald-600 dark:text-[#C6F432] font-mono font-bold">123456</span>):
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          value={mfaCode}
                          onChange={(e) => setMfaCode(e.target.value)}
                          placeholder="123456"
                          className="w-full bg-white dark:bg-[#0A0A0C] border border-sky-400 focus:ring-4 focus:ring-sky-400/20 text-slate-900 dark:text-white font-mono text-center tracking-[0.35em] text-xl py-2.5 rounded-xl outline-none"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-4 bg-[#C6F432] hover:bg-[#b5e625] dark:hover:bg-[#D7F860] active:scale-[0.99] text-[#080809] font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer"
                  >
                    {loading ? (
                      <span className="flex items-center space-x-2">
                        <span className="w-3.5 h-3.5 border-2 border-[#080809] border-t-transparent rounded-full animate-spin" />
                        <span>Verifying Credentials...</span>
                      </span>
                    ) : (
                      <>
                        <span>{mfaRequired ? 'Verify OTP & Complete Authentication' : 'Sign In to Portal'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="pt-2 text-center text-xs text-slate-500 dark:text-[#71717A]">
                    <span>Don&apos;t have an enterprise account? </span>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('register');
                        setErrorMsg(null);
                      }}
                      className="text-emerald-700 dark:text-[#C6F432] hover:underline font-bold cursor-pointer"
                    >
                      Create Customer Account
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: REGISTER CUSTOMER ACCOUNT */}
              {activeTab === 'register' && (
                <form onSubmit={handleRegister} className="space-y-3.5">
                  {/* Account Classification */}
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-[#D4D4D8] block mb-2">
                      Customer Classification
                    </label>
                    <div className="grid grid-cols-2 gap-2 mb-2.5">
                      <button
                        type="button"
                        onClick={() => setRegAccountType('b2b')}
                        className={`p-3 rounded-2xl border text-left flex items-start space-x-2.5 transition-all cursor-pointer ${
                          regAccountType === 'b2b'
                            ? 'border-emerald-600 dark:border-[#C6F432] bg-emerald-50 dark:bg-[#C6F432]/10 text-slate-900 dark:text-white shadow-xs'
                            : 'border-slate-200 dark:border-[#27272A] bg-slate-50 dark:bg-[#18181B] text-slate-600 dark:text-[#A1A1AA] hover:border-slate-300 dark:hover:border-[#3F3F46]'
                        }`}
                      >
                        <Building2 className={`w-4 h-4 shrink-0 mt-0.5 ${regAccountType === 'b2b' ? 'text-emerald-600 dark:text-[#C6F432]' : 'text-slate-400 dark:text-[#71717A]'}`} />
                        <div>
                          <div className="font-bold text-xs text-slate-900 dark:text-white">Commercial B2B</div>
                          <div className="text-[10px] text-slate-500 dark:text-[#A1A1AA]">Contractor, builder, or fleet</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRegAccountType('b2c')}
                        className={`p-3 rounded-2xl border text-left flex items-start space-x-2.5 transition-all cursor-pointer ${
                          regAccountType === 'b2c'
                            ? 'border-emerald-600 dark:border-[#C6F432] bg-emerald-50 dark:bg-[#C6F432]/10 text-slate-900 dark:text-white shadow-xs'
                            : 'border-slate-200 dark:border-[#27272A] bg-slate-50 dark:bg-[#18181B] text-slate-600 dark:text-[#A1A1AA] hover:border-slate-300 dark:hover:border-[#3F3F46]'
                        }`}
                      >
                        <User className={`w-4 h-4 shrink-0 mt-0.5 ${regAccountType === 'b2c' ? 'text-emerald-600 dark:text-[#C6F432]' : 'text-slate-400 dark:text-[#71717A]'}`} />
                        <div>
                          <div className="font-bold text-xs text-slate-900 dark:text-white">Retail / Individual</div>
                          <div className="text-[10px] text-slate-500 dark:text-[#A1A1AA]">Direct personal buyer</div>
                        </div>
                      </button>
                    </div>

                    {/* Contextual Tier Notice */}
                    {regAccountType === 'b2b' ? (
                      <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-[#141E28] border border-sky-200 dark:border-sky-500/30 text-[11px] text-sky-800 dark:text-sky-200 flex items-center space-x-2">
                        <Building2 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                        <span>Enables ERCA 15% VAT tax invoices, corporate credit terms, and custom PEB engineering RFQs.</span>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-[#132219] border border-emerald-200 dark:border-emerald-500/30 text-[11px] text-emerald-800 dark:text-emerald-200 flex items-center space-x-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>Instant consumer access (like Ahmed). No company TIN or commercial trade licenses required.</span>
                      </div>
                    )}
                  </div>

                  {/* Representative Full Name */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-[#D4D4D8] block">
                      Full {regAccountType === 'b2b' ? 'Representative' : 'Customer'} Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder={regAccountType === 'b2b' ? 'e.g., Eng. Dawit Kebede' : 'e.g., Ahmed Mohammed'}
                      className="w-full bg-slate-50 dark:bg-[#18181B] border border-slate-200 dark:border-[#2E2E34] focus:border-emerald-600 dark:focus:border-[#C6F432] focus:ring-4 focus:ring-emerald-500/10 dark:focus:ring-[#C6F432]/10 text-slate-900 dark:text-white rounded-xl px-3.5 py-2.5 text-xs outline-none transition-all placeholder-slate-400 dark:placeholder-[#71717A]"
                    />
                  </div>

                  {/* Company Name & TIN & VAT (Conditional for B2B) */}
                  {regAccountType === 'b2b' && (
                    <div className="space-y-2.5 animate-in fade-in">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-[#D4D4D8] block">
                            Company Legal Name *
                          </label>
                          <input
                            type="text"
                            required={regAccountType === 'b2b'}
                            value={regCompanyName}
                            onChange={(e) => setRegCompanyName(e.target.value)}
                            placeholder="e.g., Sunshine Construction PLC"
                            className="w-full bg-slate-50 dark:bg-[#18181B] border border-slate-200 dark:border-[#2E2E34] focus:border-emerald-600 dark:focus:border-[#C6F432] text-slate-900 dark:text-white rounded-xl px-3 py-2.5 text-xs outline-none transition-all placeholder-slate-400 dark:placeholder-[#71717A]"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-[#D4D4D8] block">
                            Ethiopian TIN (10-Digit) *
                          </label>
                          <input
                            type="text"
                            required={regAccountType === 'b2b'}
                            value={regTinNumber}
                            onChange={(e) => setRegTinNumber(e.target.value)}
                            placeholder="0019283746"
                            className="w-full bg-slate-50 dark:bg-[#18181B] border border-slate-200 dark:border-[#2E2E34] focus:border-emerald-600 dark:focus:border-[#C6F432] text-slate-900 dark:text-white rounded-xl px-3 py-2.5 text-xs outline-none transition-all placeholder-slate-400 dark:placeholder-[#71717A] font-mono"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-[#D4D4D8] block">
                          ERCA VAT Registration Number (Optional)
                        </label>
                        <input
                          type="text"
                          value={regVatNumber}
                          onChange={(e) => setRegVatNumber(e.target.value)}
                          placeholder="e.g., 01-2948-59281"
                          className="w-full bg-slate-50 dark:bg-[#18181B] border border-slate-200 dark:border-[#2E2E34] focus:border-emerald-600 dark:focus:border-[#C6F432] text-slate-900 dark:text-white rounded-xl px-3 py-2 text-xs outline-none transition-all placeholder-slate-400 dark:placeholder-[#71717A] font-mono"
                        />
                      </div>
                    </div>
                  )}

                  {/* Primary Servicing Hub & Destination */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-[#D4D4D8] block">
                        Fulfillment Branch Hub
                      </label>
                      <select
                        value={regBranchId}
                        onChange={(e) => setRegBranchId(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-[#18181B] border border-slate-200 dark:border-[#2E2E34] focus:border-emerald-600 dark:focus:border-[#C6F432] text-slate-900 dark:text-white rounded-xl px-3 py-2.5 text-xs outline-none transition-all cursor-pointer"
                      >
                        {BRANCHES.map((b) => (
                          <option key={b.id} value={b.id} className="bg-white dark:bg-[#141416] text-slate-900 dark:text-white">
                            {b.name} ({b.city})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-[#D4D4D8] block">
                        Delivery City / Region
                      </label>
                      <input
                        type="text"
                        value={regCity}
                        onChange={(e) => setRegCity(e.target.value)}
                        placeholder="e.g., Addis Ababa, Bole"
                        className="w-full bg-slate-50 dark:bg-[#18181B] border border-slate-200 dark:border-[#2E2E34] focus:border-emerald-600 dark:focus:border-[#C6F432] text-slate-900 dark:text-white rounded-xl px-3 py-2.5 text-xs outline-none transition-all placeholder-slate-400 dark:placeholder-[#71717A]"
                      />
                    </div>
                  </div>

                  {/* Email & Ethiopian Mobile */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-[#D4D4D8] block">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="procurement@company.et"
                        className="w-full bg-slate-50 dark:bg-[#18181B] border border-slate-200 dark:border-[#2E2E34] focus:border-emerald-600 dark:focus:border-[#C6F432] text-slate-900 dark:text-white rounded-xl px-3 py-2.5 text-xs outline-none transition-all placeholder-slate-400 dark:placeholder-[#71717A] font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-[#D4D4D8] block">
                        Mobile Phone (CBE/Telebirr)
                      </label>
                      <input
                        type="text"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="+251 91 123 4567"
                        className="w-full bg-slate-50 dark:bg-[#18181B] border border-slate-200 dark:border-[#2E2E34] focus:border-emerald-600 dark:focus:border-[#C6F432] text-slate-900 dark:text-white rounded-xl px-3 py-2.5 text-xs outline-none transition-all placeholder-slate-400 dark:placeholder-[#71717A] font-mono"
                      />
                    </div>
                  </div>

                  {/* Passwords */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-[#D4D4D8] block">
                        Create Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          required
                          minLength={8}
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="Min 8 characters"
                          className="w-full bg-slate-50 dark:bg-[#18181B] border border-slate-200 dark:border-[#2E2E34] focus:border-emerald-600 dark:focus:border-[#C6F432] text-slate-900 dark:text-white rounded-xl pl-3 pr-9 py-2.5 text-xs outline-none transition-all placeholder-slate-400 dark:placeholder-[#71717A] font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 dark:text-[#71717A] hover:text-slate-700 dark:hover:text-white cursor-pointer"
                        >
                          {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-[#D4D4D8] block">
                        Confirm Password *
                      </label>
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        minLength={8}
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Repeat password"
                        className="w-full bg-slate-50 dark:bg-[#18181B] border border-slate-200 dark:border-[#2E2E34] focus:border-emerald-600 dark:focus:border-[#C6F432] text-slate-900 dark:text-white rounded-xl px-3 py-2.5 text-xs outline-none transition-all placeholder-slate-400 dark:placeholder-[#71717A] font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-4 bg-[#C6F432] hover:bg-[#b5e625] dark:hover:bg-[#D7F860] active:scale-[0.99] text-[#080809] font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer mt-2"
                  >
                    {loading ? (
                      <span className="flex items-center space-x-2">
                        <span className="w-3.5 h-3.5 border-2 border-[#080809] border-t-transparent rounded-full animate-spin" />
                        <span>Registering Customer Profile...</span>
                      </span>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Register &amp; Enter Customer Portal</span>
                      </>
                    )}
                  </button>

                  <div className="pt-1 text-center text-xs text-slate-500 dark:text-[#71717A]">
                    <span>Already have an account? </span>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('standard');
                        setErrorMsg(null);
                      }}
                      className="text-emerald-700 dark:text-[#C6F432] hover:underline font-bold cursor-pointer"
                    >
                      Sign In here
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 3: 1-CLICK DEMO ACCOUNTS */}
              {activeTab === 'demo' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-[#71717A]">
                    <span>Instant demo authentication:</span>
                    <span className="font-mono text-[10px] text-emerald-700 dark:text-[#C6F432] font-bold">{SEEDED_USERS.length} Core Personas Configured</span>
                  </div>

                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 scrollbar-none">
                    {SEEDED_USERS.map((u) => {
                      const badgeStyles: Record<UserRole, { bg: string; text: string; label: string; portal: string }> = {
                        super_admin: { bg: 'bg-purple-100 dark:bg-purple-950/80 border-purple-300 dark:border-purple-500/40', text: 'text-purple-800 dark:text-purple-300', label: 'Super Admin', portal: '/admin' },
                        finance: { bg: 'bg-lime-100 dark:bg-[#C6F432]/10 border-lime-300 dark:border-[#C6F432]/30', text: 'text-lime-900 dark:text-[#C6F432]', label: 'Finance Lead', portal: '/finance' },
                        branch_admin: { bg: 'bg-emerald-100 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-500/40', text: 'text-emerald-800 dark:text-emerald-300', label: 'Branch Admin', portal: '/branch-admin' },
                        sales_agent: { bg: 'bg-sky-100 dark:bg-sky-950/80 border-sky-300 dark:border-sky-500/40', text: 'text-sky-800 dark:text-sky-300', label: 'Sales Agent', portal: '/agent' },
                        customer: { bg: 'bg-amber-100 dark:bg-amber-950/80 border-amber-300 dark:border-amber-500/40', text: 'text-amber-800 dark:text-amber-300', label: 'B2B Customer', portal: '/portal' },
                      };

                      const roleInfo = badgeStyles[u.role];
                      const isB2C = u.customerType === 'b2c';
                      const badgeLabel = isB2C ? 'Individual (B2C)' : roleInfo.label;
                      const badgeBg = isB2C ? 'bg-teal-100 dark:bg-teal-950/80 border-teal-300 dark:border-teal-500/40' : roleInfo.bg;
                      const badgeText = isB2C ? 'text-teal-800 dark:text-teal-300' : roleInfo.text;

                      return (
                        <div
                          key={u.id}
                          onClick={() => handle1ClickLogin(u)}
                          className="p-3 bg-slate-50 dark:bg-[#18181B] hover:bg-slate-100 dark:hover:bg-[#202025] border border-slate-200 dark:border-[#27272A] hover:border-emerald-500 dark:hover:border-[#C6F432]/60 rounded-2xl cursor-pointer transition-all flex items-center justify-between group shadow-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-[#C6F432] transition-colors">
                                {u.fullName}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${badgeBg} ${badgeText}`}>
                                {badgeLabel}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-600 dark:text-[#A1A1AA] font-mono">
                              {u.email}
                            </div>
                            {(u.companyName || u.branchName) && (
                              <div className="text-[10px] text-slate-500 dark:text-[#71717A]">
                                {u.companyName || u.branchName}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-500 dark:text-[#A1A1AA] group-hover:text-emerald-700 dark:group-hover:text-[#C6F432] transition-colors pl-3 shrink-0">
                            <span className="hidden sm:inline">Enter Portal</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Footer bar */}
      <div className="border-t border-slate-200 dark:border-[#1E1E22] bg-white/90 dark:bg-[#0E0E10]/80 py-4 px-4 sm:px-8 text-center text-xs text-slate-500 dark:text-[#71717A]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            &copy; {new Date().getFullYear()} AMG Holdings Group. All corporate rights reserved.
          </div>
          <div className="flex items-center space-x-4 text-[11px]">
            <span className="flex items-center space-x-1 text-slate-600 dark:text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-[#C6F432]" />
              <span>TLS 256-Bit SSL Secured</span>
            </span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="text-slate-600 dark:text-slate-400">ERCA Registered Group</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-[#080809] flex items-center justify-center text-slate-500 dark:text-[#A1A1AA] font-mono text-xs">
          Loading AMG Enterprise Gateway...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
