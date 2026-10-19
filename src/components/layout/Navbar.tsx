'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { useWishlist } from '@/lib/wishlist-context';
import { SUBSIDIARIES, BRANCHES } from '@/lib/constants';
import { UserRole } from '@/types';
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
  LogIn
} from 'lucide-react';

export function Navbar() {
  const { currentUser, activeRole, isLoggedIn, logout } = useAuth();
  const { totalCount, setIsCartDrawerOpen, openRfq } = useCart();
  const { wishlistCount } = useWishlist();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSubsidiaryFilter, setActiveSubsidiaryFilter] = useState<string | null>(null);

  const roleLabels: Record<UserRole, { label: string; badgeColor: string; route: string }> = {
    super_admin: { label: 'Corporate Super Admin', badgeColor: 'bg-purple-700', route: '/admin' },
    branch_admin: { label: 'Adama Branch Admin', badgeColor: 'bg-emerald-700', route: '/branch-admin' },
    sales_agent: { label: 'Sales Engineer (Agent)', badgeColor: 'bg-blue-700', route: '/agent' },
    customer: { label: 'Corporate B2B Client', badgeColor: 'bg-amber-700', route: '/portal' },
  };

  return (
    <header className="w-full bg-white border-b border-slate-300 sticky top-0 z-40 text-xs">
      {/* 1. TOP UTILITY & AUTH STATUS BAR */}
      <div className="bg-slate-900 text-slate-300 px-4 py-1.5 border-b border-slate-800 flex flex-wrap justify-between items-center text-[11px]">
        {/* Left: Hotline & Regional Network */}
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1 font-mono text-slate-400">
            <PhoneCall className="w-3 h-3 text-amg-red" />
            <span>Hotline: +251 11 662 4500</span>
          </span>
          <span className="hidden md:flex items-center space-x-1 text-slate-400">
            <MapPin className="w-3 h-3 text-amg-navy-400" />
            <span>Branches: Addis Ababa (HQ) | Adama Plant | Hawassa | Dire Dawa Hub</span>
          </span>
        </div>

        {/* Right: Authenticated User Status & Portal Navigation */}
        <div className="flex items-center space-x-2.5 my-0.5">
          {isLoggedIn && currentUser ? (
            <div className="flex items-center space-x-2">
              <span className="text-slate-400 hidden sm:inline text-[10px]">Logged in as:</span>
              <span className="font-semibold text-white flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                <span>{currentUser.fullName}</span>
              </span>
              <span className={`px-1.5 py-0.2 rounded-sm text-[9px] font-bold uppercase text-white ${roleLabels[activeRole]?.badgeColor || 'bg-slate-700'}`}>
                {activeRole.replace('_', ' ')}
              </span>

              {/* Quick link to current role's portal */}
              <Link
                href={roleLabels[activeRole]?.route || '/portal'}
                className="ml-1.5 px-2.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 rounded-sm font-semibold text-[10px] flex items-center space-x-1 transition-colors"
              >
                <Shield className="w-3 h-3 text-amg-red" />
                <span>Go to Portal</span>
              </Link>

              <Link
                href="/login"
                className="px-2 py-0.5 text-slate-400 hover:text-sky-300 font-medium text-[10px] transition-colors"
              >
                Switch Account
              </Link>

              <button
                type="button"
                onClick={() => logout()}
                className="px-2 py-0.5 text-slate-400 hover:text-rose-400 text-[10px] font-medium transition-colors flex items-center space-x-1"
                title="Log out of session"
              >
                <LogOut className="w-3 h-3" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span className="text-slate-400 text-[10px]">Staff & Procurement Access:</span>
              <Link
                href="/login"
                className="px-2.5 py-0.5 bg-amg-red hover:bg-red-700 text-white font-bold text-[10px] rounded-sm transition-colors flex items-center space-x-1 shadow-sm"
              >
                <LogIn className="w-3 h-3" />
                <span>Sign In to Portal</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* 2. MAIN BRAND & SEARCH HEADER (Grainger / Alibaba Industrial Style) */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <Link href="/" className="flex items-center space-x-3 shrink-0">
          <div className="relative w-12 h-12 bg-white flex items-center justify-center border border-slate-200 rounded-sm p-1 shadow-sm">
            <img
              src="/logo.png"
              alt="AMG Holdings Logo"
              className="max-h-full max-w-full object-contain"
            />
          </div>
          <div>
            <div className="text-base font-extrabold tracking-tight text-amg-navy flex items-center space-x-1.5">
              <span>AMG HOLDINGS</span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-amg-red bg-red-50 border border-red-200 px-1 rounded-sm">
                ENTERPRISE
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Multi-Subsidiary Heavy Industry & E-Commerce Platform
            </p>
          </div>
        </Link>

        {/* Search Bar with SKU / Category selector */}
        <div className="hidden lg:flex flex-1 max-w-2xl items-center border border-slate-300 rounded-sm bg-white overflow-hidden focus-within:border-amg-navy focus-within:ring-1 focus-within:ring-amg-navy">
          <div className="bg-slate-100 border-r border-slate-300 px-3 py-2 text-slate-600 font-semibold text-xs shrink-0 flex items-center space-x-1">
            <Layers className="w-3.5 h-3.5 text-amg-navy" />
            <span>All Subsidiaries</span>
          </div>
          <input
            type="text"
            placeholder="Search by SKU, ASTM standard, steel grade, roofing gauge, vehicle chassis..."
            className="w-full px-3 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none"
          />
          <button className="bg-amg-navy hover:bg-amg-navy-900 text-white px-4 py-2 font-bold flex items-center justify-center transition-colors">
            <Search className="w-4 h-4" />
          </button>
        </div>

        {/* Action Controls: RFQ Quote Trigger, Cart, & Account */}
        <div className="flex items-center space-x-3 shrink-0">
          {/* Stream B RFQ Button */}
          <button
            type="button"
            onClick={() => openRfq()}
            className="px-3.5 py-2 bg-amg-red hover:bg-red-800 text-white font-bold text-xs rounded-sm shadow-sm transition-colors flex items-center space-x-1.5"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Request Quote (RFQ)</span>
          </button>

          {/* Customer Wishlist Button */}
          <Link
            href="/portal?tab=wishlist"
            className="relative px-3 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-sm transition-colors flex items-center space-x-1.5 shadow-sm"
          >
            <Heart className="w-4 h-4 text-amg-red" />
            <span className="hidden sm:inline">Wishlist</span>
            {wishlistCount > 0 && (
              <span className="ml-0.5 bg-slate-800 text-white font-mono text-[10px] font-bold px-1.5 py-0.2 rounded-sm">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Stream A Cart Button */}
          <button
            type="button"
            onClick={() => setIsCartDrawerOpen(true)}
            className="relative px-3.5 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-amg-navy font-bold text-xs rounded-sm transition-colors flex items-center space-x-1.5 shadow-sm"
          >
            <ShoppingCart className="w-4 h-4 text-amg-navy" />
            <span className="hidden sm:inline">Cart</span>
            {totalCount > 0 && (
              <span className="ml-1 bg-amg-red text-white font-mono text-[10px] font-bold px-1.5 py-0.2 rounded-sm">
                {totalCount}
              </span>
            )}
          </button>

          {/* Active User Persona Badge / Login Link */}
          {isLoggedIn && currentUser ? (
            <Link
              href={roleLabels[activeRole]?.route || '/portal'}
              className="flex items-center space-x-2 pl-2 border-l border-slate-300 hover:opacity-90"
            >
              <div className="w-8 h-8 rounded-sm bg-amg-navy-100 border border-amg-navy-300 text-amg-navy font-bold flex items-center justify-center text-xs">
                {currentUser.fullName[0]}
              </div>
              <div className="hidden xl:block text-left">
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {currentUser.fullName}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  {roleLabels[activeRole]?.label}
                </div>
              </div>
            </Link>
          ) : (
            <Link
              href="/login"
              className="flex items-center space-x-1.5 pl-2 border-l border-slate-300 text-amg-navy hover:text-amg-red font-bold text-xs transition-colors"
            >
              <UserCheck className="w-4 h-4" />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </div>

      {/* 3. SUBSIDIARY DIRECTORY NAVIGATION BAR */}
      <nav className="bg-amg-navy text-white border-t border-amg-navy-900">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between overflow-x-auto scrollbar-none py-1">
          <div className="flex items-center space-x-1 shrink-0 font-medium text-xs">
            <Link
              href="/"
              className="px-3 py-1.5 hover:bg-amg-navy-900 rounded-sm font-bold text-white transition-colors"
            >
              Enterprise Catalog
            </Link>

            {SUBSIDIARIES.map((sub) => (
              <Link
                key={sub.id}
                href={`/#${sub.slug}`}
                className="px-3 py-1.5 text-slate-200 hover:text-white hover:bg-amg-navy-900 rounded-sm transition-colors whitespace-nowrap text-xs"
              >
                {sub.name.replace('AMG ', '')}
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex items-center space-x-3 text-[11px] text-slate-300 shrink-0 font-mono">
            <span>Direct Orders: Stream A</span>
            <span>•</span>
            <span>Heavy Engineering: Stream B</span>
          </div>
        </div>
      </nav>
    </header>
  );
}
