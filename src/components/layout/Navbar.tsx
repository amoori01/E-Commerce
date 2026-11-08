'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { useWishlist } from '@/lib/wishlist-context';
import { SUBSIDIARIES, BRANCHES } from '@/lib/constants';
import { UserRole } from '@/types';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import {
  Search,
  ShoppingCart,
  FileText,
  UserCheck,
  Shield,
  Layers,
  ChevronDown,
  Building,
  PhoneCall,
  MapPin,
  HelpCircle,
  Menu,
  X,
  Heart,
  LogOut,
  LogIn,
  ExternalLink,
  ArrowLeft
} from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, activeRole, isLoggedIn, logout } = useAuth();
  const { totalCount, setIsCartDrawerOpen, openRfq } = useCart();
  const { wishlistCount } = useWishlist();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSubsidiary, setSearchSubsidiary] = useState('all');
  const [activeSubSlug, setActiveSubSlug] = useState<string>('all');

  React.useEffect(() => {
    const updateActive = () => {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const sub = params.get('subsidiary');
        setActiveSubSlug(sub || 'all');
      }
    };
    updateActive();
    window.addEventListener('popstate', updateActive);
    window.addEventListener('hashchange', updateActive);
    return () => {
      window.removeEventListener('popstate', updateActive);
      window.removeEventListener('hashchange', updateActive);
    };
  }, [pathname]);

  const roleLabels: Record<UserRole, { label: string; badgeColor: string; route: string }> = {
    super_admin: { label: 'Corporate Super Admin', badgeColor: 'bg-purple-950 text-purple-200 border-purple-700/50', route: '/admin' },
    finance: { label: 'Corporate Finance Lead', badgeColor: 'bg-[#1A1A1D] text-[#C6F432] border-[#C6F432]/50', route: '/finance' },
    branch_admin: { label: 'Adama Branch Admin', badgeColor: 'bg-emerald-950 text-emerald-200 border-emerald-700/50', route: '/branch-admin' },
    sales_agent: { label: 'Sales Engineer (Agent)', badgeColor: 'bg-blue-950 text-blue-200 border-blue-700/50', route: '/agent' },
    customer: { label: 'Corporate B2B Client', badgeColor: 'bg-[#1A1A1D] text-[#C6F432] border-[#C6F432]/30', route: '/portal' },
  };

  // Search submission handler
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    const params = new URLSearchParams();
    if (trimmed) {
      params.set('q', trimmed);
    }
    if (searchSubsidiary && searchSubsidiary !== 'all') {
      params.set('subsidiary', searchSubsidiary);
    }
    const qs = params.toString();
    router.push(qs ? `/?${qs}#catalog-section` : '/#catalog-section');
  };

  // When inside authentication pages (/login, /register),
  // hide all customer shopping navigation (cart, wishlist, RFQ, search bar, consumer subsidiary navigation bar, user persona badge)
  const isAuthPage =
    pathname?.startsWith('/login') ||
    pathname?.startsWith('/register');

  if (isAuthPage) {
    return (
      <header className="w-full bg-[#0B0B0C] border-b border-[#222225] text-white sticky top-0 z-40 text-xs shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex items-center justify-between gap-4">
          {/* Left: Brand Logo & Title */}
          <Link href="/" className="flex items-center space-x-3.5 group shrink-0">
            <div className="w-10 h-10 bg-white flex items-center justify-center rounded-lg p-1.5 border border-[#2A2A2E] shadow-sm">
              <img src="/logo.png" alt="AMG Holdings" className="max-h-full max-w-full object-contain" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-serif font-black text-base tracking-tight text-white group-hover:text-[#C6F432] transition-colors">
                  AMG HOLDINGS
                </span>
                <span className="px-2 py-0.5 rounded-full font-sans font-bold text-[9px] uppercase border bg-[#1A1A1D] border-[#C6F432]/40 text-[#C6F432]">
                  SECURE ACCESS
                </span>
              </div>
              <div className="text-[11px] text-[#A1A1AA] font-normal hidden md:block">
                Unified Enterprise Identity & Access Management
              </div>
            </div>
          </Link>

          {/* Right: Return to Storefront & Support */}
          <div className="flex items-center space-x-3 text-xs">
            <ThemeToggle />

            <div className="hidden sm:flex items-center space-x-1.5 text-[#A1A1AA] text-[11px]">
              <PhoneCall className="w-3.5 h-3.5 text-[#C6F432]" />
              <span>Support: +251 11 662 4500</span>
            </div>

            <Link
              href="/"
              className="px-3.5 py-1.5 bg-[#141416] hover:bg-[#1A1A1D] text-white border border-[#2A2A2E] hover:border-[#C6F432]/40 rounded-full font-medium text-[11px] flex items-center space-x-2 transition-all shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#C6F432]" />
              <span>Return to Public Catalog</span>
            </Link>
          </div>
        </div>
      </header>
    );
  }

  // When inside staff/management workspaces (/admin, /branch-admin, /agent, /finance),
  // hide all customer shopping navigation (cart, wishlist, RFQ, search, consumer subsidiary bar)
  const isManagementWorkspace =
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/branch-admin') ||
    pathname?.startsWith('/agent') ||
    pathname?.startsWith('/finance');

  const isStorefront = pathname === '/' || pathname === '' || pathname?.startsWith('/products');

  if (isManagementWorkspace) {
    const portalConfig = pathname?.startsWith('/admin')
      ? {
          badge: 'SUPER ADMIN',
          badgeColor: 'bg-purple-900/80 border-purple-600 text-purple-200',
          title: 'Corporate HQ Governance Console',
          subtitle: 'Multi-subsidiary catalog, direct orders GMV ledger, tax rules & audit logs',
          workspaceLink: '/admin',
        }
      : pathname?.startsWith('/finance')
      ? {
          badge: 'FINANCE & TREASURY',
          badgeColor: 'bg-[#1A1A1D] border-[#C6F432]/60 text-[#C6F432]',
          title: 'CBE Bank Transfer & Ledger Reconciliation Queue',
          subtitle: 'Verify customer CBE FT reference numbers, approve releases & audit tax invoices',
          workspaceLink: '/finance',
        }
      : pathname?.startsWith('/branch-admin')
      ? {
          badge: 'BRANCH DEPOT ADMIN',
          badgeColor: 'bg-emerald-900/80 border-emerald-600 text-emerald-200',
          title: 'Depot Warehouse & Inventory Management',
          subtitle: 'Stock intakes (+50/+500), POS sync, gate pass clearance & agent assignments',
          workspaceLink: '/branch-admin',
        }
      : {
          badge: 'SALES ENGINEER',
          badgeColor: 'bg-blue-900/80 border-blue-600 text-blue-200',
          title: 'Technical Quotation & Proforma Workspace',
          subtitle: 'Cost breakdown formulation, revisions v1/v2, 15% VAT & ERCA fiscal seal',
          workspaceLink: '/agent',
        };

    return (
      <header className="w-full bg-[#0B0B0C] border-b border-[#222225] text-white sticky top-0 z-40 text-xs shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
          {/* Left: Brand Logo & Management Console Title */}
          <Link href={portalConfig.workspaceLink} className="flex items-center space-x-3.5 group shrink-0">
            <div className="w-9 h-9 bg-white flex items-center justify-center rounded-lg p-1.5 border border-[#2A2A2E] shadow-sm">
              <img src="/logo.png" alt="AMG Holdings" className="max-h-full max-w-full object-contain" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-serif font-black text-sm tracking-tight text-white group-hover:text-[#C6F432] transition-colors">
                  AMG HOLDINGS
                </span>
                <span className={`px-2 py-0.5 rounded-full font-sans font-bold text-[9px] uppercase border ${portalConfig.badgeColor}`}>
                  {portalConfig.badge}
                </span>
              </div>
              <div className="text-[11px] text-[#A1A1AA] font-normal hidden md:block">
                {portalConfig.title}
              </div>
            </div>
          </Link>

          {/* Right: Staff Controls & Storefront Switcher */}
          <div className="flex items-center space-x-3 text-xs">
            <ThemeToggle />

            {/* View Public Storefront Link */}
            <Link
              href="/"
              className="px-3 py-1 bg-[#141416] hover:bg-[#1A1A1D] text-[#E4E4E7] hover:text-[#C6F432] border border-[#2A2A2E] hover:border-[#C6F432]/30 rounded-full font-medium text-[11px] flex items-center space-x-1.5 transition-all shadow-xs"
              title="Open customer-facing public storefront catalog"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#C6F432]" />
              <span className="hidden sm:inline">View Public Storefront</span>
              <span className="sm:hidden">Storefront</span>
            </Link>

            {/* Authenticated Staff User Pill */}
            {currentUser && (
              <div className="flex items-center space-x-2 pl-2 border-l border-[#222225]">
                <div className="w-7 h-7 rounded-full bg-[#1A1A1D] border border-[#2A2A2E] text-[#C6F432] font-bold flex items-center justify-center text-xs">
                  {currentUser.fullName[0]}
                </div>
                <div className="hidden lg:block text-left">
                  <div className="text-[11px] font-bold text-white leading-tight">
                    {currentUser.fullName}
                  </div>
                  <div className="text-[10px] text-[#A1A1AA] font-sans">
                    {currentUser.companyName || roleLabels[activeRole]?.label}
                  </div>
                </div>
              </div>
            )}

            {/* Switch Account */}
            <Link
              href="/login"
              className="px-2 py-1 text-[#A1A1AA] hover:text-[#C6F432] text-[11px] font-medium transition-colors"
            >
              Switch Role
            </Link>

            {/* Logout */}
            <button
              type="button"
              onClick={() => logout()}
              className="px-2.5 py-1 bg-[#141416] hover:bg-rose-950/40 text-[#A1A1AA] hover:text-rose-400 border border-[#222225] rounded-full text-[11px] transition-colors flex items-center space-x-1"
              title="Log out of session"
            >
              <LogOut className="w-3 h-3" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="w-full bg-white dark:bg-[#0B0B0C] border-b border-[#E4E4E7] dark:border-[#222225] sticky top-0 z-40 text-xs shadow-xs transition-colors">
      {/* 1. TOP UTILITY & AUTH STATUS BAR */}
      <div className="bg-[#0B0B0C] text-[#D4D4D8] px-4 py-2 border-b border-[#1A1A1D] flex flex-wrap justify-between items-center text-[11px]">
        {/* Left: Hotline & Regional Network */}
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1.5 font-sans text-[#E4E4E7]">
            <PhoneCall className="w-3.5 h-3.5 text-[#C6F432]" />
            <span className="font-semibold text-white">Hotline: +251 11 662 4500</span>
          </span>
          <span className="hidden md:flex items-center space-x-1.5 text-[#A1A1AA]">
            <MapPin className="w-3.5 h-3.5 text-[#C6F432]" />
            <span>HQ Addis Ababa • Adama Plant • Hawassa • Dire Dawa Hub</span>
          </span>
        </div>

        {/* Right: Authenticated User Status & Portal Navigation */}
        <div className="flex items-center space-x-3 my-0.5">
          {isLoggedIn && currentUser ? (
            <div className="flex items-center space-x-2">
              <span className="text-[#A1A1AA] hidden sm:inline text-[10px]">Logged in as:</span>
              <span className="font-semibold text-white flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-[#C6F432] inline-block shadow-[0_0_8px_#C6F432]" />
                <span>{currentUser.fullName}</span>
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${roleLabels[activeRole]?.badgeColor || 'bg-[#1A1A1D] text-white border border-[#2A2A2E]'}`}>
                {activeRole.replace('_', ' ')}
              </span>

              {/* Quick link to current role's portal */}
              <Link
                href={roleLabels[activeRole]?.route || '/portal'}
                className="ml-1.5 px-3 py-0.5 bg-[#141416] hover:bg-[#1A1A1D] text-[#C6F432] border border-[#C6F432]/40 rounded-full font-bold text-[10px] flex items-center space-x-1 transition-all"
              >
                <Shield className="w-3 h-3 text-[#C6F432]" />
                <span>Go to Portal</span>
              </Link>

              <Link
                href="/login"
                className="px-2 py-0.5 text-[#A1A1AA] hover:text-[#C6F432] font-medium text-[10px] transition-colors"
              >
                Switch Account
              </Link>

              <button
                type="button"
                onClick={() => logout()}
                className="px-2 py-0.5 text-[#A1A1AA] hover:text-rose-400 text-[10px] font-medium transition-colors flex items-center space-x-1"
                title="Log out of session"
              >
                <LogOut className="w-3 h-3" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2.5">
              <span className="text-[#A1A1AA] text-[10px]">Client Access:</span>
              <Link
                href="/login?tab=register"
                className="px-3 py-0.5 bg-[#141416] hover:bg-[#1A1A1D] text-white border border-[#2A2A2E] hover:border-[#C6F432]/40 font-semibold text-[10px] rounded-full transition-all"
              >
                <span>Register</span>
              </Link>
              <Link
                href="/login"
                className="px-3 py-0.5 bg-[#C6F432] hover:bg-[#D7F860] text-[#0B0B0C] font-bold text-[10px] rounded-full transition-all flex items-center space-x-1 shadow-xs"
              >
                <LogIn className="w-3 h-3 text-[#0B0B0C]" />
                <span>Sign In</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* 2. MAIN BRAND & SEARCH HEADER */}
      <div className="max-w-7xl mx-auto px-4 py-3.5 flex items-center justify-between gap-6">
        {/* Brand Logo & Name with Playfair Display Elegance */}
        <Link href="/" className="flex items-center space-x-3.5 shrink-0 group">
          <div className="relative w-11 h-11 bg-white flex items-center justify-center border border-[#E4E4E7] rounded-xl p-1.5 shadow-xs group-hover:border-[#0B0B0C] transition-all">
            <img
              src="/logo.png"
              alt="AMG Holdings Logo"
              className="max-h-full max-w-full object-contain"
            />
          </div>
          <div>
            <div className="text-lg font-serif font-black tracking-tight text-[#0B0B0C] dark:text-white flex items-center space-x-2">
              <span>AMG HOLDINGS</span>
              <span className="text-[9px] uppercase font-sans font-extrabold tracking-widest text-[#0B0B0C] bg-[#C6F432] px-2 py-0.5 rounded-full">
                COMMERCE
              </span>
            </div>
            <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] font-sans font-normal">
              Industrial Materials, Commercial Fleet & Heavy Engineering
            </p>
          </div>
        </Link>

        {/* Search Bar with SKU / Category selector */}
        <form
          onSubmit={handleSearch}
          className="hidden lg:flex flex-1 max-w-2xl items-center bg-slate-50/90 dark:bg-[#141416]/90 hover:bg-white dark:hover:bg-[#18181B] border border-slate-200/90 dark:border-[#2A2A2E] hover:border-slate-400 dark:hover:border-[#C6F432]/50 focus-within:bg-white dark:focus-within:bg-[#0E0E10] focus-within:border-slate-900 dark:focus-within:border-[#C6F432] focus-within:ring-4 focus-within:ring-[#C6F432]/10 dark:focus-within:ring-[#C6F432]/15 rounded-full p-1 pl-1.5 transition-all duration-300 shadow-xs backdrop-blur-md"
        >
          {/* Subsidiary Filter Pill */}
          <div className="relative flex items-center shrink-0">
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-[#1E1E22] border border-slate-200 dark:border-[#2D2D32] text-slate-800 dark:text-white text-xs font-semibold shadow-2xs hover:border-slate-400 dark:hover:border-[#C6F432]/40 transition-colors cursor-pointer group/sub">
              <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-[#C6F432] shrink-0" />
              <select
                value={searchSubsidiary}
                onChange={(e) => setSearchSubsidiary(e.target.value)}
                className="bg-transparent text-slate-900 dark:text-white text-xs font-semibold focus:outline-none cursor-pointer appearance-none pr-4"
                aria-label="Filter search by subsidiary"
              >
                <option value="all" className="bg-white dark:bg-[#141416] text-slate-900 dark:text-white">
                  All Subsidiaries
                </option>
                {SUBSIDIARIES.map((sub) => (
                  <option key={sub.id} value={sub.slug} className="bg-white dark:bg-[#141416] text-slate-900 dark:text-white">
                    {sub.name.replace('AMG ', '')}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 dark:text-[#A1A1AA] absolute right-2.5 pointer-events-none group-hover/sub:text-slate-900 dark:group-hover/sub:text-white transition-colors" />
            </div>
          </div>

          {/* Search Query Input */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search structural steel, roofing, transport fleet, industrial gases..."
            className="w-full px-3.5 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#71717A] bg-transparent outline-none font-medium"
          />

          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="p-1 mr-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-slate-200 dark:hover:bg-[#222225] transition-colors"
              title="Clear search input"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Submit Action Button */}
          <button
            type="submit"
            className="w-9 h-9 rounded-full bg-[#0B0B0C] dark:bg-[#C6F432] hover:bg-slate-800 dark:hover:bg-[#D7F860] text-white dark:text-[#0B0B0C] flex items-center justify-center shrink-0 transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
            title="Search catalog"
          >
            <Search className="w-4 h-4" />
          </button>
        </form>

        {/* Action Controls: RFQ Quote Trigger, Cart, Theme Toggle & Account */}
        <div className="flex items-center space-x-2.5 shrink-0">
          {/* Theme Toggle Button */}
          <ThemeToggle />

          {/* Stream B RFQ Button */}
          <button
            type="button"
            onClick={() => openRfq()}
            className="px-4 py-2.5 bg-white dark:bg-[#141416] hover:bg-[#0B0B0C] dark:hover:bg-[#1F1F24] text-[#0B0B0C] dark:text-white hover:text-[#C6F432] border border-[#E4E4E7] dark:border-[#222225] hover:border-[#0B0B0C] font-semibold text-xs rounded-full shadow-xs transition-all flex items-center space-x-2"
          >
            <FileText className="w-4 h-4 text-[#0B0B0C] dark:text-[#C6F432]" />
            <span className="hidden sm:inline">Request Quote (RFQ)</span>
          </button>

          {/* Customer Wishlist Button */}
          <Link
            href="/portal?tab=wishlist"
            className="relative p-2.5 border border-[#E4E4E7] dark:border-[#222225] bg-white dark:bg-[#141416] hover:border-[#0B0B0C] dark:hover:border-[#C6F432]/50 hover:bg-[#FAFAFA] dark:hover:bg-[#1F1F24] text-[#0B0B0C] dark:text-white rounded-full transition-all flex items-center justify-center shadow-xs"
            title="View Wishlist"
          >
            <Heart className="w-4 h-4 text-[#0B0B0C] dark:text-white" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#0B0B0C] text-[#C6F432] text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Stream A Cart Button */}
          <button
            type="button"
            onClick={() => setIsCartDrawerOpen(true)}
            className="relative px-4 py-2.5 bg-[#0B0B0C] dark:bg-[#1A1A1D] hover:bg-[#1A1A1D] dark:hover:bg-[#222225] text-white hover:text-[#C6F432] border border-transparent dark:border-[#2A2A2E] font-semibold text-xs rounded-full transition-all flex items-center space-x-2 shadow-sm"
          >
            <ShoppingCart className="w-4 h-4 text-[#C6F432]" />
            <span className="hidden sm:inline">Cart</span>
            {totalCount > 0 && (
              <span className="ml-1 bg-[#C6F432] text-[#0B0B0C] font-sans text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                {totalCount}
              </span>
            )}
          </button>

          {/* Active User Persona Badge / Login Link */}
          {isLoggedIn && currentUser ? (
            <Link
              href={roleLabels[activeRole]?.route || '/portal'}
              className="flex items-center space-x-2 pl-2 border-l border-[#E4E4E7] dark:border-[#222225] hover:opacity-90"
            >
              <div className="w-8 h-8 rounded-full bg-[#0B0B0C] dark:bg-[#1A1A1D] text-[#C6F432] font-bold flex items-center justify-center text-xs shadow-xs border border-transparent dark:border-[#2A2A2E]">
                {currentUser.fullName[0]}
              </div>
              <div className="hidden xl:block text-left">
                <div className="text-xs font-bold text-[#0B0B0C] dark:text-white leading-tight">
                  {currentUser.fullName}
                </div>
                <div className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] font-medium">
                  {roleLabels[activeRole]?.label}
                </div>
              </div>
            </Link>
          ) : (
            <div className="flex items-center space-x-2 pl-2 border-l border-[#E4E4E7] dark:border-[#222225]">
              <Link
                href="/login"
                className="text-[#0B0B0C] dark:text-white hover:text-[#C6F432] font-bold text-xs transition-colors px-2 py-1"
              >
                Sign In
              </Link>
              <Link
                href="/login?tab=register"
                className="px-3.5 py-1.5 bg-[#C6F432] hover:bg-[#D7F860] text-[#0B0B0C] font-bold text-xs rounded-full transition-colors shadow-xs"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* 2b. MOBILE / TABLET SEARCH BAR (Storefront Only) */}
      {isStorefront && (
        <div className="lg:hidden px-4 pb-3 pt-1.5 bg-[#FAFAFA] dark:bg-[#141416] border-t border-[#E4E4E7] dark:border-[#222225]">
          <form
            onSubmit={handleSearch}
            className="flex items-center bg-white dark:bg-[#0B0B0C] border border-slate-200 dark:border-[#2A2A2E] focus-within:border-[#C6F432] focus-within:ring-2 focus-within:ring-[#C6F432]/20 rounded-full p-1 pl-3 transition-all shadow-xs"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, SKUs, materials..."
              className="w-full text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#71717A] outline-none bg-transparent"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-2 text-slate-400 hover:text-slate-900 dark:hover:text-white"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="submit"
              className="w-8 h-8 rounded-full bg-[#0B0B0C] dark:bg-[#C6F432] text-white dark:text-[#0B0B0C] font-bold flex items-center justify-center shrink-0 transition-transform active:scale-95"
              title="Search catalog"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* 3. SUBSIDIARY DIRECTORY NAVIGATION BAR (Storefront Catalog Only) */}
      {isStorefront && (
        <nav className="bg-white/90 dark:bg-[#0B0B0C]/90 backdrop-blur-md border-t border-[#E4E4E7] dark:border-[#1A1A1D] transition-colors py-2">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-between overflow-x-auto scrollbar-none gap-4">
            <div className="flex items-center space-x-2 shrink-0 text-xs">
              <Link
                href="/?subsidiary=all&stream=all#catalog-section"
                scroll={false}
                onClick={() => setActiveSubSlug('all')}
                className={`px-3.5 py-1.5 font-semibold transition-all rounded-full whitespace-nowrap text-xs flex items-center space-x-1.5 ${
                  activeSubSlug === 'all'
                    ? 'bg-[#C6F432] text-[#0B0B0C] font-bold shadow-[0_0_12px_rgba(198,244,50,0.25)] border border-[#C6F432]'
                    : 'bg-white dark:bg-[#141416] text-[#71717A] dark:text-[#A1A1AA] border border-[#E4E4E7] dark:border-[#2A2A2E] hover:text-[#0B0B0C] dark:hover:text-white hover:border-[#C6F432]/50 shadow-2xs'
                }`}
              >
                {activeSubSlug === 'all' && <span className="w-1.5 h-1.5 rounded-full bg-[#0B0B0C]" />}
                <span>Enterprise Catalog</span>
              </Link>

              {SUBSIDIARIES.map((sub) => {
                const isActive = activeSubSlug === sub.slug || activeSubSlug === sub.id;
                return (
                  <Link
                    key={sub.id}
                    href={`/?subsidiary=${sub.slug}#catalog-section`}
                    scroll={false}
                    onClick={() => setActiveSubSlug(sub.slug)}
                    className={`px-3.5 py-1.5 font-semibold transition-all rounded-full whitespace-nowrap text-xs flex items-center space-x-1.5 ${
                      isActive
                        ? 'bg-[#C6F432] text-[#0B0B0C] font-bold shadow-[0_0_12px_rgba(198,244,50,0.25)] border border-[#C6F432]'
                        : 'bg-white dark:bg-[#141416] text-[#71717A] dark:text-[#A1A1AA] border border-[#E4E4E7] dark:border-[#2A2A2E] hover:text-[#0B0B0C] dark:hover:text-white hover:border-[#C6F432]/50 shadow-2xs'
                    }`}
                  >
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#0B0B0C]" />}
                    <span>{sub.name.replace('AMG ', '')}</span>
                  </Link>
                );
              })}
            </div>

            <div className="hidden lg:flex items-center space-x-2 text-[11px] shrink-0">
              <Link
                href="/?stream=direct_checkout#catalog-section"
                scroll={false}
                className="px-3 py-1.5 bg-white dark:bg-[#141416] hover:bg-slate-50 dark:hover:bg-[#1A1A1D] text-[#0B0B0C] dark:text-[#E4E4E7] border border-[#E4E4E7] dark:border-[#2A2A2E] hover:border-[#C6F432]/60 rounded-full transition-all flex items-center space-x-1.5 font-medium shadow-2xs"
                title="Filter catalog to Stream A instant buy products"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] dark:bg-[#C6F432] shadow-[0_0_6px_#C6F432]" />
                <span>Direct Buy: Stream A</span>
              </Link>
              <span className="text-slate-300 dark:text-[#3F3F46]">•</span>
              <Link
                href="/?stream=assisted_quote#catalog-section"
                scroll={false}
                className="px-3 py-1.5 bg-white dark:bg-[#141416] hover:bg-slate-50 dark:hover:bg-[#1A1A1D] text-[#0B0B0C] dark:text-[#E4E4E7] border border-[#E4E4E7] dark:border-[#2A2A2E] hover:border-slate-400 dark:hover:border-white rounded-full transition-all flex items-center space-x-1.5 font-medium shadow-2xs"
                title="Filter catalog to Stream B custom engineering RFQ products"
              >
                <FileText className="w-3 h-3 text-[#16A34A] dark:text-[#C6F432]" />
                <span>Heavy Engineering: Stream B</span>
              </Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
