'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { SEEDED_USERS } from '@/lib/constants';
import { UserProfile, UserRole } from '@/types';
import {
  Shield,
  Lock,
  Mail,
  Phone,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Building2,
  KeyRound,
  Sparkles,
  Users
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { setUser, switchRole } = useAuth();

  const [activeTab, setActiveTab] = useState<'standard' | 'demo'>('standard');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('Password123!');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaPromptMessage, setMfaPromptMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const roleRedirectMap: Record<UserRole, string> = {
    super_admin: '/admin',
    branch_admin: '/branch-admin',
    sales_agent: '/agent',
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
      setErrorMsg(err instanceof Error ? err.message : 'Login failed. Please try again.');
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
    <div className="min-h-[calc(100vh-140px)] bg-slate-900 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-xl w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded bg-white p-1 shadow-md border border-slate-700 mx-auto">
            <img src="/logo.png" alt="AMG Holdings" className="max-h-full max-w-full object-contain" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white uppercase">
            AMG Holdings Enterprise Access
          </h1>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Multi-subsidiary procurement, engineering quotation, branch inventory, and corporate governance.
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-slate-950 border border-slate-800 rounded-sm shadow-2xl overflow-hidden">
          {/* Tab Selector */}
          <div className="grid grid-cols-2 border-b border-slate-800 text-xs font-bold text-center">
            <button
              type="button"
              onClick={() => setActiveTab('standard')}
              className={`py-3.5 transition-all flex items-center justify-center space-x-2 ${
                activeTab === 'standard'
                  ? 'bg-slate-900 text-white border-b-2 border-amg-red font-black'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200'
              }`}
            >
              <KeyRound className="w-4 h-4 text-amg-red" />
              <span>Standard Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('demo')}
              className={`py-3.5 transition-all flex items-center justify-center space-x-2 ${
                activeTab === 'demo'
                  ? 'bg-slate-900 text-white border-b-2 border-amg-red font-black'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4 text-sky-400" />
              <span>1-Click Demo Accounts</span>
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'standard' ? (
              <form onSubmit={handleStandardLogin} className="space-y-4">
                {errorMsg && (
                  <div className="p-3 bg-rose-950/70 border border-rose-700/60 rounded-sm text-rose-200 text-xs flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Identifier Input */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block">
                    Corporate Email or Phone Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="e.g., agent.solomon@amgholdings.com or +251 91 340 0003"
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-sm px-3.5 py-2.5 text-xs focus:outline-none focus:border-amg-red font-mono"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Supports registered corporate email or phone with Ethiopian country code (+251).
                  </p>
                </div>

                {/* Password Input */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block">
                      Account Password
                    </label>
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-sm px-3.5 py-2.5 text-xs focus:outline-none focus:border-amg-red font-mono"
                  />
                </div>

                {/* MFA OTP Step-Up Input (Appears for privileged accounts) */}
                {mfaRequired && (
                  <div className="p-4 bg-sky-950/60 border border-sky-600/60 rounded-sm space-y-3">
                    <div className="flex items-center space-x-2 text-sky-300 text-xs font-bold">
                      <Shield className="w-4 h-4 text-sky-400" />
                      <span>Two-Factor Authentication (MFA) Required</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      {mfaPromptMessage}
                    </p>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400">
                        Enter 6-Digit OTP Code:
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={mfaCode}
                        onChange={(e) => setMfaCode(e.target.value)}
                        placeholder="123456"
                        className="w-full bg-slate-900 border border-sky-500 text-sky-200 font-mono tracking-widest text-base text-center py-2 rounded-sm focus:outline-none"
                      />
                      <span className="text-[10px] text-sky-400 block text-center">
                        Demo OTP: Enter <strong>123456</strong>
                      </span>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-amg-red hover:bg-red-700 text-white font-bold text-xs rounded-sm shadow-md transition-colors flex items-center justify-center space-x-2 disabled:opacity-60"
                >
                  {loading ? (
                    <span>Authenticating...</span>
                  ) : (
                    <>
                      <span>{mfaRequired ? 'Verify OTP & Complete Sign In' : 'Sign In to Portal'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="space-y-3">
                <p className="text-[11px] text-slate-400">
                  Select any seeded stakeholder account below to authenticate and enter their specific portal:
                </p>

                <div className="space-y-2">
                  {SEEDED_USERS.map((u) => {
                    const badgeStyles: Record<UserRole, { bg: string; text: string; label: string; portal: string }> = {
                      super_admin: { bg: 'bg-purple-900/60 border-purple-700', text: 'text-purple-300', label: 'Super Admin', portal: '/admin' },
                      branch_admin: { bg: 'bg-emerald-900/60 border-emerald-700', text: 'text-emerald-300', label: 'Branch Admin', portal: '/branch-admin' },
                      sales_agent: { bg: 'bg-blue-900/60 border-blue-700', text: 'text-blue-300', label: 'Sales Agent', portal: '/agent' },
                      customer: { bg: 'bg-amber-900/60 border-amber-700', text: 'text-amber-300', label: 'Customer', portal: '/portal' },
                    };
                    const roleInfo = badgeStyles[u.role];

                    return (
                      <div
                        key={u.id}
                        onClick={() => handle1ClickLogin(u)}
                        className="p-3 bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-sm cursor-pointer transition-all flex items-center justify-between group"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-white group-hover:text-sky-300 transition-colors">
                              {u.fullName}
                            </span>
                            <span className={`px-1.5 py-0.2 rounded-sm text-[9px] font-bold uppercase border ${roleInfo.bg} ${roleInfo.text}`}>
                              {roleInfo.label}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {u.email}
                          </div>
                          {u.companyName && (
                            <div className="text-[10px] text-slate-500">
                              {u.companyName}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-1 text-slate-400 group-hover:text-white text-xs font-bold shrink-0 pl-3">
                          <span className="hidden sm:inline">Enter Portal</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="bg-slate-900/80 px-6 py-3 border-t border-slate-800 text-center text-[11px] text-slate-400">
            <span>Need procurement assistance? </span>
            <Link href="/" className="text-sky-400 hover:underline font-semibold">
              Browse Enterprise Catalog
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
