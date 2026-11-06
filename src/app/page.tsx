'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PRODUCTS, SUBSIDIARIES, BRANCHES } from '@/lib/constants';
import { useCart } from '@/lib/cart-context';
import { Product, TransactionStream } from '@/types';
import { QuickViewModal } from '@/components/modals/QuickViewModal';
import {
  CheckCircle2,
  FileText,
  ShoppingCart,
  Building2,
  Layers,
  Shield,
  Truck,
  ArrowRight,
  Info,
  ChevronRight,
  Sparkles,
  Download,
  Flame,
  Check,
  X,
  Search,
  Eye
} from 'lucide-react';

function HomePageContent() {
  const { addToCart, openRfq } = useCart();
  const searchParams = useSearchParams();
  const [selectedSubsidiary, setSelectedSubsidiary] = useState<string>('all');
  const [selectedStream, setSelectedStream] = useState<'all' | TransactionStream>('all');
  const [catalogSearch, setCatalogSearch] = useState<string>('');
  const [expandedSpecsId, setExpandedSpecsId] = useState<string | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Sync state with URL search params and hash (e.g. from navbar or footer links)
  useEffect(() => {
    const subParam = searchParams.get('subsidiary');
    const streamParam = searchParams.get('stream');
    const qParam = searchParams.get('q');

    if (qParam !== null) {
      setCatalogSearch(qParam);
    } else {
      setCatalogSearch('');
    }

    if (subParam) {
      if (subParam === 'all') {
        setSelectedSubsidiary('all');
      } else {
        const found = SUBSIDIARIES.find(
          (s) =>
            s.slug === subParam ||
            s.id === subParam ||
            s.code.toLowerCase() === subParam.toLowerCase() ||
            s.name.toLowerCase().includes(subParam.toLowerCase())
        );
        if (found) {
          setSelectedSubsidiary(found.id);
        }
      }
    }

    if (streamParam) {
      if (streamParam === 'all' || streamParam === 'direct_checkout' || streamParam === 'assisted_quote') {
        setSelectedStream(streamParam as 'all' | TransactionStream);
      }
    }
  }, [searchParams]);

  // Support direct hash navigation (e.g., /#amg-roofing)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && hash !== 'catalog-section') {
        const found = SUBSIDIARIES.find((s) => s.slug === hash);
        if (found) {
          setSelectedSubsidiary(found.id);
        }
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const filteredProducts = PRODUCTS.filter((p) => {
    const matchesSub = selectedSubsidiary === 'all' || p.subsidiaryId === selectedSubsidiary;
    const matchesStream = selectedStream === 'all' || p.transactionStream === selectedStream;

    const query = catalogSearch.trim().toLowerCase();
    const matchesQuery =
      !query ||
      p.name.toLowerCase().includes(query) ||
      p.sku.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query) ||
      (p.categoryName && p.categoryName.toLowerCase().includes(query)) ||
      Object.entries(p.technicalSpecs || {}).some(
        ([key, val]) =>
          key.toLowerCase().includes(query) ||
          String(val).toLowerCase().includes(query)
      );

    return matchesSub && matchesStream && matchesQuery;
  });

  return (
    <div className="space-y-12 pb-20 bg-[#FAFAFA] dark:bg-[#0B0B0C] transition-colors">
      {/* 1. BENTO SHOWCASE HERO SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Bento Cell 1: Main Dark Narrative Card (8 cols) */}
          <div
            className="lg:col-span-8 bg-[#0B0B0C] text-white rounded-3xl p-8 sm:p-10 flex flex-col justify-between border border-[#1A1A1D] shadow-xl relative overflow-hidden group hover:border-[#C6F432]/40 transition-all duration-300"
          >
            {/* Subtle Lime Ambient Glow */}
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#C6F432]/10 rounded-full blur-3xl pointer-events-none group-hover:bg-[#C6F432]/15 transition-all duration-700" />

            <div className="space-y-5 relative z-10">
              <div className="inline-flex items-center space-x-2 px-3 py-1 bg-[#1A1A1D] border border-[#2A2A2E] rounded-full text-xs font-medium text-[#E4E4E7]">
                <span className="w-2 h-2 rounded-full bg-[#C6F432] inline-block shadow-[0_0_8px_#C6F432]" />
                <span className="font-sans font-semibold tracking-wide">AMG Holdings Digital Procurement</span>
                <span className="text-[#52525B]">|</span>
                <span className="text-[#C6F432] font-semibold">Dual-Stream Baseline</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-serif font-black tracking-tight leading-[1.15] text-white max-w-2xl">
                Heavy Engineering &amp; Commercial Materials, Delivered with Elegance.
              </h1>

              <p className="text-sm sm:text-base text-[#A1A1AA] max-w-xl font-sans leading-relaxed">
                Procure certified ASTM steel, roofing systems, heavy fleet logistics, industrial gases, and specialty coffee. Instant digital ordering or direct sales engineer quotation under verified CBE bank settlement.
              </p>
            </div>

            {/* Action Bar */}
            <div className="pt-8 flex flex-wrap items-center gap-3 relative z-10">
              <button
                type="button"
                onClick={() => {
                  setSelectedStream('direct_checkout');
                  const el = document.getElementById('catalog-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-6 py-3 bg-[#C6F432] hover:bg-[#D7F860] text-[#0B0B0C] font-bold text-xs rounded-full transition-all flex items-center space-x-2 shadow-lg hover:shadow-[#C6F432]/20"
              >
                <ShoppingCart className="w-4 h-4 text-[#0B0B0C]" />
                <span>Shop Stream A (Direct Buy)</span>
              </button>

              <button
                type="button"
                onClick={() => openRfq()}
                className="px-6 py-3 bg-[#141416] hover:bg-[#1A1A1D] text-white border border-[#2A2A2E] hover:border-[#C6F432]/40 font-semibold text-xs rounded-full transition-all flex items-center space-x-2"
              >
                <FileText className="w-4 h-4 text-[#C6F432]" />
                <span>Request Custom Quote (RFQ)</span>
              </button>
            </div>
          </div>

          {/* Bento Cell 2: Quick Metrics & Subsidiary Highlight (4 cols) */}
          <div
            className="lg:col-span-4 bg-white dark:bg-[#141416] text-[#0B0B0C] dark:text-white rounded-3xl p-7 border border-[#E4E4E7] dark:border-[#222225] hover:border-[#C6F432] dark:hover:border-[#C6F432] hover:-translate-y-1 hover:shadow-[0_15px_30px_-10px_rgba(198,244,50,0.18)] transition-all duration-300 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#F4F4F5] dark:border-[#222225]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA]">
                  Consortium Operations
                </span>
                <span className="px-2 py-0.5 bg-[#F4F4F5] dark:bg-[#222225] text-[#0B0B0C] dark:text-[#C6F432] text-[10px] font-bold rounded-full">
                  5 Sister Companies
                </span>
              </div>

              <div className="divide-y divide-[#F4F4F5] dark:divide-[#222225] text-xs pt-2">
                <div className="py-2.5 flex items-center justify-between">
                  <span className="font-medium text-[#27272A] dark:text-[#D4D4D8]">Structural Steel &amp; PEB</span>
                  <span className="font-mono text-[11px] font-bold text-[#0B0B0C] dark:text-[#C6F432] bg-[#FAFAFA] dark:bg-[#1A1A1D] px-2 py-0.5 rounded border border-[#E4E4E7] dark:border-[#2A2A2E]">Grade S355JR</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="font-medium text-[#27272A] dark:text-[#D4D4D8]">Ethio &amp; Adama Roofing</span>
                  <span className="font-mono text-[11px] font-bold text-[#0B0B0C] dark:text-[#C6F432] bg-[#FAFAFA] dark:bg-[#1A1A1D] px-2 py-0.5 rounded border border-[#E4E4E7] dark:border-[#2A2A2E]">0.40mm - 20Yr</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="font-medium text-[#27272A] dark:text-[#D4D4D8]">Sinotruk Prime Movers</span>
                  <span className="font-mono text-[11px] font-bold text-[#0B0B0C] dark:text-[#C6F432] bg-[#FAFAFA] dark:bg-[#1A1A1D] px-2 py-0.5 rounded border border-[#E4E4E7] dark:border-[#2A2A2E]">420HP Euro-III</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="font-medium text-[#27272A] dark:text-[#D4D4D8]">Industrial Cryogenic LOX</span>
                  <span className="font-mono text-[11px] font-bold text-[#0B0B0C] dark:text-[#C6F432] bg-[#FAFAFA] dark:bg-[#1A1A1D] px-2 py-0.5 rounded border border-[#E4E4E7] dark:border-[#2A2A2E]">99.6% Purity</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="font-medium text-[#27272A] dark:text-[#D4D4D8]">Specialty Arabica Coffee</span>
                  <span className="font-mono text-[11px] font-bold text-[#0B0B0C] dark:text-[#C6F432] bg-[#FAFAFA] dark:bg-[#1A1A1D] px-2 py-0.5 rounded border border-[#E4E4E7] dark:border-[#2A2A2E]">88.5 SCA Cup</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#F4F4F5] dark:border-[#222225] flex items-center justify-between text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
              <span className="flex items-center space-x-1.5 text-[#0B0B0C] dark:text-white font-medium">
                <Shield className="w-3.5 h-3.5 text-[#C6F432]" />
                <span>CBE FT Verified Rail</span>
              </span>
              <span className="font-semibold text-[#0B0B0C] dark:text-white">4 Regional Hubs</span>
            </div>
          </div>
        </div>

        {/* Bento Row 2: Secondary Quick-Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
          {/* Card 1: Direct Order Stream A */}
          <div
            className="bg-white dark:bg-[#141416] rounded-3xl p-6 border border-[#E4E4E7] dark:border-[#222225] shadow-xs hover:border-[#C6F432] dark:hover:border-[#C6F432] hover:-translate-y-1.5 hover:shadow-[0_15px_30px_-10px_rgba(198,244,50,0.18)] transition-all duration-300 flex flex-col justify-between group"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-[#0B0B0C] dark:bg-[#1F1F24] group-hover:bg-[#C6F432] transition-colors flex items-center justify-center text-[#C6F432] group-hover:text-[#0B0B0C]">
                <ShoppingCart className="w-5 h-5 transition-transform group-hover:scale-110" />
              </div>
              <h3 className="font-serif font-bold text-base text-[#0B0B0C] dark:text-white group-hover:text-[#0B0B0C] dark:group-hover:text-[#C6F432] transition-colors">Stream A: Direct Digital Buy</h3>
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
                Standardized construction materials, roofing sheets, fasteners, lubricants, and packaged coffee with real-time depot reservations.
              </p>
            </div>
            <div className="pt-4 flex items-center justify-between text-xs font-semibold text-[#0B0B0C] dark:text-[#C6F432]">
              <span>Instant checkout</span>
              <ArrowRight className="w-4 h-4 text-[#0B0B0C] dark:text-[#C6F432] transition-transform group-hover:translate-x-1" />
            </div>
          </div>

          {/* Card 2: Custom Quotation Stream B */}
          <div
            className="bg-white dark:bg-[#141416] rounded-3xl p-6 border border-[#E4E4E7] dark:border-[#222225] shadow-xs hover:border-[#C6F432] dark:hover:border-[#C6F432] hover:-translate-y-1.5 hover:shadow-[0_15px_30px_-10px_rgba(198,244,50,0.18)] transition-all duration-300 flex flex-col justify-between group"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-[#C6F432] flex items-center justify-center text-[#0B0B0C]">
                <FileText className="w-5 h-5 transition-transform group-hover:scale-110" />
              </div>
              <h3 className="font-serif font-bold text-base text-[#0B0B0C] dark:text-white group-hover:text-[#0B0B0C] dark:group-hover:text-[#C6F432] transition-colors">Stream B: Engineering RFQ</h3>
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
                Capital projects, custom PEB columns, Sinotruk tankers, and bulk gas cylinders priced by dedicated sales engineers with proforma invoices.
              </p>
            </div>
            <div className="pt-4 flex items-center justify-between text-xs font-semibold text-[#0B0B0C] dark:text-[#C6F432]">
              <span>Agent assisted</span>
              <ArrowRight className="w-4 h-4 text-[#0B0B0C] dark:text-[#C6F432] transition-transform group-hover:translate-x-1" />
            </div>
          </div>

          {/* Card 3: Regional Depots & Logistics */}
          <div
            className="bg-[#0B0B0C] text-white rounded-3xl p-6 border border-[#1A1A1D] shadow-xs hover:border-[#C6F432]/60 hover:-translate-y-1.5 hover:shadow-[0_15px_30px_-10px_rgba(198,244,50,0.22)] transition-all duration-300 flex flex-col justify-between group"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-[#1A1A1D] group-hover:bg-[#C6F432] transition-colors flex items-center justify-center text-[#C6F432] group-hover:text-[#0B0B0C]">
                <Truck className="w-5 h-5 transition-transform group-hover:scale-110" />
              </div>
              <h3 className="font-serif font-bold text-base text-white group-hover:text-[#C6F432] transition-colors">Regional Depot Clearance</h3>
              <p className="text-xs text-[#A1A1AA] leading-relaxed">
                Physical branch pickup or enterprise delivery across Addis Ababa HQ, Adama manufacturing plant, Hawassa, and Dire Dawa.
              </p>
            </div>
            <div className="pt-4 flex items-center justify-between text-xs font-semibold text-[#C6F432]">
              <span>Check branch stock</span>
              <ArrowRight className="w-4 h-4 text-[#C6F432] transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </section>

      {/* 2. CATALOG & BENTO FILTER CONTROLS */}
      <section id="catalog-section" className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Header & Controls Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-[#E4E4E7] dark:border-[#222225] pb-5 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#0B0B0C] dark:text-white tracking-tight">
              Enterprise Catalog &amp; Technical Products
            </h2>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-1 font-sans">
              Showing {filteredProducts.length} verified industrial product lines across AMG Holdings
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Live In-Catalog Search Bar */}
            <div className="relative min-w-[240px] sm:w-72">
              <Search className="w-4 h-4 text-[#71717A] dark:text-[#A1A1AA] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={catalogSearch}
                onChange={(e) => {
                  const val = e.target.value;
                  setCatalogSearch(val);
                  const params = new URLSearchParams(window.location.search);
                  if (val.trim()) {
                    params.set('q', val.trim());
                  } else {
                    params.delete('q');
                  }
                  const qs = params.toString();
                  window.history.replaceState({}, '', qs ? `/?${qs}#catalog-section` : '/#catalog-section');
                }}
                placeholder="Filter by SKU, steel, gauge..."
                className="w-full pl-9 pr-8 py-2 text-xs border border-[#E4E4E7] dark:border-[#222225] rounded-full bg-white dark:bg-[#141416] focus:outline-none focus:border-[#0B0B0C] dark:focus:border-[#C6F432] focus:ring-2 focus:ring-[#C6F432]/30 placeholder-[#A1A1AA] text-[#0B0B0C] dark:text-white"
              />
              {catalogSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setCatalogSearch('');
                    const params = new URLSearchParams(window.location.search);
                    params.delete('q');
                    const qs = params.toString();
                    window.history.replaceState({}, '', qs ? `/?${qs}#catalog-section` : '/#catalog-section');
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#0B0B0C] dark:hover:text-white"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Stream Filter Pills */}
            <div className="inline-flex bg-[#F4F4F5] dark:bg-[#141416] p-1 rounded-full border border-[#E4E4E7] dark:border-[#222225] text-xs">
              <button
                type="button"
                onClick={() => setSelectedStream('all')}
                className={`px-3.5 py-1.5 font-semibold rounded-full transition-all ${
                  selectedStream === 'all'
                    ? 'bg-white dark:bg-[#222225] text-[#0B0B0C] dark:text-white shadow-xs'
                    : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#0B0B0C] dark:hover:text-white'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setSelectedStream('direct_checkout')}
                className={`px-3.5 py-1.5 font-semibold rounded-full transition-all ${
                  selectedStream === 'direct_checkout'
                    ? 'bg-[#0B0B0C] dark:bg-[#C6F432] text-[#C6F432] dark:text-[#0B0B0C] shadow-xs'
                    : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#0B0B0C] dark:hover:text-white'
                }`}
              >
                Stream A (Direct)
              </button>
              <button
                type="button"
                onClick={() => setSelectedStream('assisted_quote')}
                className={`px-3.5 py-1.5 font-semibold rounded-full transition-all ${
                  selectedStream === 'assisted_quote'
                    ? 'bg-[#0B0B0C] dark:bg-[#1F1F24] text-white shadow-xs'
                    : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#0B0B0C] dark:hover:text-white'
                }`}
              >
                Stream B (RFQ)
              </button>
            </div>
          </div>
        </div>

        {/* Visual Category & Subsidiary Showcase with Category Pictures */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#71717A] dark:text-[#A1A1AA]">
                Shop By Division
              </span>
              <h3 className="font-serif text-lg font-bold text-[#0B0B0C] dark:text-white">
                Featured Industry Categories
              </h3>
            </div>
            <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] hidden sm:inline">
              Select a category to filter the catalog
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {SUBSIDIARIES.map((sub) => {
              const isSelected = selectedSubsidiary === sub.id;
              const productCount = PRODUCTS.filter((p) => p.subsidiaryId === sub.id).length;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => {
                    setSelectedSubsidiary(isSelected ? 'all' : sub.id);
                  }}
                  className={`group relative text-left rounded-2xl overflow-hidden border transition-all duration-300 h-36 flex flex-col justify-end p-3.5 ${
                    isSelected
                      ? 'border-[#C6F432] ring-2 ring-[#C6F432] shadow-[0_12px_30px_-8px_rgba(198,244,50,0.3)] -translate-y-1'
                      : 'border-[#E4E4E7] dark:border-[#222225] hover:border-[#C6F432] hover:-translate-y-1 hover:shadow-lg'
                  }`}
                >
                  {/* Category Background Image with gradient */}
                  {sub.imageUrl && (
                    <img
                      src={sub.imageUrl}
                      alt={sub.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop&q=80';
                      }}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  )}
                  <div
                    className={`absolute inset-0 transition-opacity ${
                      isSelected
                        ? 'bg-gradient-to-t from-[#0B0B0C] via-[#0B0B0C]/80 to-[#0B0B0C]/40 opacity-95'
                        : 'bg-gradient-to-t from-[#0B0B0C] via-[#0B0B0C]/75 to-transparent opacity-90 group-hover:opacity-85'
                    }`}
                  />

                  {/* Content overlay */}
                  <div className="relative z-10 space-y-1">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-[#0B0B0C]/80 text-[#C6F432] border border-[#C6F432]/40">
                      {productCount} items
                    </span>
                    <h4 className="font-serif font-bold text-xs text-white line-clamp-2 leading-tight">
                      {sub.name.replace('AMG ', '')}
                    </h4>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Subsidiary Filter Chips */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedSubsidiary('all')}
            className={`px-4 py-2 text-xs font-semibold rounded-full border transition-all ${
              selectedSubsidiary === 'all'
                ? 'border-[#0B0B0C] dark:border-[#C6F432] bg-[#0B0B0C] dark:bg-[#C6F432] text-white dark:text-[#0B0B0C] shadow-xs'
                : 'border-[#E4E4E7] dark:border-[#222225] bg-white dark:bg-[#141416] text-[#27272A] dark:text-[#D4D4D8] hover:border-[#C6F432] hover:text-[#0B0B0C] dark:hover:text-[#C6F432]'
            }`}
          >
            All 5 Subsidiaries
          </button>
          {SUBSIDIARIES.map((sub) => (
            <button
              key={sub.id}
              type="button"
              onClick={() => setSelectedSubsidiary(sub.id)}
              className={`px-4 py-2 text-xs font-semibold rounded-full border transition-all ${
                selectedSubsidiary === sub.id
                  ? 'border-[#0B0B0C] dark:border-[#C6F432] bg-[#0B0B0C] dark:bg-[#C6F432] text-white dark:text-[#0B0B0C] shadow-xs'
                  : 'border-[#E4E4E7] dark:border-[#222225] bg-white dark:bg-[#141416] text-[#27272A] dark:text-[#D4D4D8] hover:border-[#C6F432] hover:text-[#0B0B0C] dark:hover:text-[#C6F432]'
              }`}
            >
              {sub.name}
            </button>
          ))}
        </div>

        {/* Active Filter Notice & Reset Banner */}
        {(selectedSubsidiary !== 'all' || selectedStream !== 'all' || catalogSearch.trim() !== '') && (
          <div className="bg-white dark:bg-[#141416] border border-[#E4E4E7] dark:border-[#222225] px-5 py-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-3 shadow-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold uppercase tracking-wider text-[10px] bg-[#0B0B0C] text-[#C6F432] px-2.5 py-1 rounded-full">
                Active Filter
              </span>
              {catalogSearch.trim() && (
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-[#F4F4F5] dark:bg-[#1F1F24] border border-[#E4E4E7] dark:border-[#2A2A2E] rounded-full font-semibold text-[#0B0B0C] dark:text-white text-xs">
                  <span>Query: &ldquo;{catalogSearch}&rdquo;</span>
                  <button
                    type="button"
                    onClick={() => {
                      setCatalogSearch('');
                      const params = new URLSearchParams(window.location.search);
                      params.delete('q');
                      const qs = params.toString();
                      window.history.replaceState({}, '', qs ? `/?${qs}#catalog-section` : '/#catalog-section');
                    }}
                    className="text-[#71717A] hover:text-[#0B0B0C] dark:hover:text-white transition-colors"
                    title="Clear search query"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <span className="font-bold text-[#0B0B0C] dark:text-white">
                {selectedSubsidiary !== 'all'
                  ? SUBSIDIARIES.find((s) => s.id === selectedSubsidiary)?.name || 'Filtered Subsidiary'
                  : 'All 5 Subsidiaries'}
              </span>
              <span className="text-[#D4D4D8] dark:text-[#52525B]">•</span>
              <span className="font-medium text-[#71717A] dark:text-[#A1A1AA]">
                {selectedStream === 'direct_checkout'
                  ? 'Stream A: Instant Buy'
                  : selectedStream === 'assisted_quote'
                  ? 'Stream B: RFQ Required'
                  : 'All Transaction Streams'}
              </span>
              <span className="text-[#71717A] dark:text-[#A1A1AA] font-mono text-[11px]">
                ({filteredProducts.length} items found)
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedSubsidiary('all');
                setSelectedStream('all');
                setCatalogSearch('');
                window.history.pushState({}, '', '/#catalog-section');
              }}
              className="font-bold text-[#0B0B0C] dark:text-[#C6F432] hover:text-[#71717A] dark:hover:text-[#D7F860] text-xs flex items-center space-x-1 shrink-0"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset All Filters</span>
            </button>
          </div>
        )}

        {/* 3. PRODUCT BENTO GRID (FRIENDLY E-COMMERCE CARDS) */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            {filteredProducts.map((product) => {
              const isStreamA = product.transactionStream === 'direct_checkout';
              const isExpanded = expandedSpecsId === product.id;

              return (
                <div
                  key={product.id}
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    e.currentTarget.style.setProperty('--spotlight-x', `${e.clientX - rect.left}px`);
                    e.currentTarget.style.setProperty('--spotlight-y', `${e.clientY - rect.top}px`);
                  }}
                  className="relative bg-white dark:bg-[#141416] border border-[#E4E4E7] dark:border-[#222225] rounded-3xl shadow-xs hover:border-[#C6F432] dark:hover:border-[#C6F432] hover:-translate-y-2 hover:shadow-[0_22px_45px_-12px_rgba(198,244,50,0.22)] transition-all duration-300 flex flex-col justify-between overflow-hidden group"
                >
                  {/* Interactive Cursor Spotlight Glow Effect on Mouse Pointer */}
                  <div
                    className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl z-0"
                    style={{
                      background: 'radial-gradient(380px circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%), rgba(198, 244, 50, 0.12), transparent 70%)',
                    }}
                  />

                  <div className="relative z-10">
                    {/* Image & Header Badge Bar */}
                    <div className="relative h-56 bg-[#F4F4F5] dark:bg-[#1A1A1D] overflow-hidden">
                      <Link
                        href={`/products/${product.slug}`}
                        className="block w-full h-full"
                      >
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop&q=80';
                          }}
                          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
                        />
                      </Link>

                      {/* Quick View Button on Left Side of Picture (No text label) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setQuickViewProduct(product);
                        }}
                        className="absolute bottom-3.5 left-3.5 w-9 h-9 bg-[#0B0B0C]/90 dark:bg-[#141416]/95 backdrop-blur-md text-white border border-[#C6F432]/60 hover:border-[#C6F432] hover:bg-[#0B0B0C] hover:text-[#C6F432] rounded-full shadow-lg transition-all duration-300 flex items-center justify-center z-20 hover:scale-110"
                        title="Quick View"
                      >
                        <Eye className="w-4 h-4 text-[#C6F432]" />
                      </button>

                      <div className="absolute top-3.5 left-3.5 flex flex-col gap-1.5 z-10 pointer-events-none">
                        <span
                          className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full shadow-xs transition-colors ${
                            isStreamA
                              ? 'bg-[#0B0B0C] text-[#C6F432] border border-[#C6F432]/30 group-hover:border-[#C6F432]'
                              : 'bg-white dark:bg-[#0B0B0C] text-[#0B0B0C] dark:text-white border border-[#E4E4E7] dark:border-[#2A2A2E]'
                          }`}
                        >
                          {isStreamA ? 'Stream A: Instant Buy' : 'Stream B: RFQ Required'}
                        </span>
                      </div>

                      <div className="absolute top-3.5 right-3.5 flex items-center space-x-1.5 z-10">
                        <span className="bg-[#0B0B0C]/80 backdrop-blur-md text-white text-[10px] font-mono font-medium px-2.5 py-1 rounded-full border border-[#2A2A2E]">
                          {product.sku}
                        </span>
                      </div>
                    </div>

                    {/* Body Content */}
                    <div className="p-6 space-y-4">
                      <div>
                        <div className="text-[11px] font-bold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider">
                          {product.subsidiaryName}
                        </div>
                        <Link href={`/products/${product.slug}`}>
                          <h3 className="font-serif font-bold text-lg text-[#0B0B0C] dark:text-white leading-snug line-clamp-2 mt-1 hover:text-[#71717A] dark:hover:text-[#C6F432] transition-colors">
                            {product.name}
                          </h3>
                        </Link>
                      </div>

                      <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>

                      {/* Pricing / MOQ Display */}
                      <div className="bg-[#FAFAFA] dark:bg-[#1A1A1D] border border-[#E4E4E7] dark:border-[#2A2A2E] p-3.5 rounded-2xl flex items-center justify-between">
                        {isStreamA ? (
                          <div>
                            <div className="text-[10px] uppercase font-bold text-[#71717A] dark:text-[#A1A1AA]">
                              Unit Price (Excl. VAT)
                            </div>
                            <div className="text-base font-bold font-mono text-[#0B0B0C] dark:text-[#C6F432]">
                              ETB {product.unitPriceEtb.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              <span className="text-xs font-normal text-[#71717A] dark:text-[#A1A1AA]"> / {product.unitMeasurement}</span>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="text-[10px] uppercase font-bold text-[#71717A] dark:text-[#A1A1AA]">
                              Pricing Matrix
                            </div>
                            <div className="text-xs font-bold text-[#0B0B0C] dark:text-white">
                              Custom Agent Quotation
                            </div>
                          </div>
                        )}

                        <div className="text-right">
                          <div className="text-[10px] uppercase font-bold text-[#71717A] dark:text-[#A1A1AA]">
                            Min. Order
                          </div>
                          <div className="text-xs font-mono font-bold text-[#0B0B0C] dark:text-white">
                            {product.moq} {product.unitMeasurement}
                          </div>
                        </div>
                      </div>

                      {/* Stock / Regional Branch Availability */}
                      {product.stockSummary && (
                        <div className="text-[11px] border-t border-[#F4F4F5] dark:border-[#222225] pt-3 space-y-1">
                          <div className="font-semibold text-[#27272A] dark:text-[#E4E4E7] flex items-center justify-between">
                            <span className="flex items-center space-x-1.5">
                              <Building2 className="w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA]" />
                              <span>Branch Stock:</span>
                            </span>
                            <span className="font-mono text-[#0B0B0C] dark:text-[#C6F432] font-bold bg-[#F4F4F5] dark:bg-[#1A1A1D] px-2 py-0.5 rounded-full border border-transparent dark:border-[#2A2A2E]">
                              {product.stockSummary.totalOnHand} {product.unitMeasurement} On-Hand
                            </span>
                          </div>
                          <div className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] space-y-0.5 pt-1">
                            {product.stockSummary.branches.map((b, idx) => (
                              <div key={idx} className="flex justify-between font-mono">
                                <span>{b.branchName}:</span>
                                <span className="text-[#0B0B0C] dark:text-white font-semibold">{b.quantity} {product.unitMeasurement}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Technical Specifications Accordion */}
                      <div className="border border-[#E4E4E7] dark:border-[#2A2A2E] rounded-2xl overflow-hidden text-xs">
                        <button
                          type="button"
                          onClick={() => setExpandedSpecsId(isExpanded ? null : product.id)}
                          className="w-full px-3.5 py-2 bg-[#FAFAFA] dark:bg-[#1A1A1D] hover:bg-[#F4F4F5] dark:hover:bg-[#222225] text-[#27272A] dark:text-white font-semibold flex items-center justify-between transition-colors text-[11px]"
                        >
                          <span className="flex items-center space-x-1.5">
                            <Info className="w-3.5 h-3.5 text-[#0B0B0C] dark:text-[#C6F432]" />
                            <span>Technical Specifications</span>
                          </span>
                          <span className="text-[#71717A] dark:text-[#A1A1AA] font-mono text-[10px]">
                            {isExpanded ? 'Hide ▲' : 'View ▼'}
                          </span>
                        </button>

                        {isExpanded && (
                          <div className="p-3.5 bg-white dark:bg-[#141416] divide-y divide-[#F4F4F5] dark:divide-[#222225] text-[11px] font-mono">
                            {Object.entries(product.technicalSpecs).map(([specKey, specVal]) => (
                              <div key={specKey} className="py-1 flex justify-between gap-2">
                                <span className="text-[#71717A] dark:text-[#A1A1AA]">{specKey}:</span>
                                <span className="text-[#0B0B0C] dark:text-white font-semibold text-right">{specVal}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Action Buttons */}
                  <div className="p-6 pt-0 relative z-10">
                    {isStreamA ? (
                      <button
                        type="button"
                        onClick={() => addToCart(product)}
                        className="w-full py-3 bg-[#0B0B0C] dark:bg-[#C6F432] hover:bg-[#1A1A1D] dark:hover:bg-[#D7F860] text-white dark:text-[#0B0B0C] group-hover:bg-[#C6F432] group-hover:text-[#0B0B0C] font-semibold text-xs rounded-full transition-all duration-300 flex items-center justify-center space-x-2 shadow-sm group-hover:shadow-[0_10px_25px_-5px_rgba(198,244,50,0.35)]"
                      >
                        <ShoppingCart className="w-4 h-4 text-[#C6F432] group-hover:text-[#0B0B0C] dark:text-[#0B0B0C] transition-colors" />
                        <span>Add to Direct Cart</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openRfq(product)}
                        className="w-full py-3 bg-white dark:bg-[#141416] hover:bg-[#0B0B0C] dark:hover:bg-[#1F1F24] text-[#0B0B0C] dark:text-white group-hover:border-[#C6F432] group-hover:text-[#0B0B0C] dark:group-hover:text-[#C6F432] border border-[#E4E4E7] dark:border-[#2A2A2E] font-semibold text-xs rounded-full transition-all duration-300 flex items-center justify-center space-x-2 shadow-xs group-hover:shadow-[0_10px_25px_-5px_rgba(198,244,50,0.2)]"
                      >
                        <FileText className="w-4 h-4 text-[#0B0B0C] dark:text-[#C6F432]" />
                        <span>Request Custom Quotation</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white dark:bg-[#141416] border border-[#E4E4E7] dark:border-[#222225] rounded-3xl p-16 text-center space-y-4 shadow-xs">
            <div className="w-12 h-12 bg-[#F4F4F5] dark:bg-[#1A1A1D] rounded-full flex items-center justify-center mx-auto text-[#71717A] dark:text-[#A1A1AA]">
              <Layers className="w-6 h-6" />
            </div>
            <h4 className="font-serif font-bold text-[#0B0B0C] dark:text-white text-lg">
              {catalogSearch ? `No products match "${catalogSearch}"` : 'No items found matching the selected filter'}
            </h4>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] max-w-md mx-auto">
              {catalogSearch
                ? `Try searching with a different SKU (e.g. AMG-STL-001), standard (ASTM, S355JR), or reset your filters.`
                : `There are currently no products under this specific subsidiary and transaction stream combination.`}
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedSubsidiary('all');
                setSelectedStream('all');
                setCatalogSearch('');
                window.history.pushState({}, '', '/#catalog-section');
              }}
              className="px-6 py-2.5 bg-[#0B0B0C] dark:bg-[#C6F432] hover:bg-[#1A1A1D] dark:hover:bg-[#D7F860] text-[#C6F432] dark:text-[#0B0B0C] font-bold text-xs rounded-full transition-colors"
            >
              Reset Filters &amp; Show All Products
            </button>
          </div>
        )}
      </section>

      {/* 4. CBE BANK OF RECORD SETTLEMENT SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-[#0B0B0C] text-white rounded-3xl p-8 sm:p-10 border border-[#1A1A1D] shadow-xl space-y-6 relative overflow-hidden">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#1A1A1D] pb-6">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#C6F432] font-mono">
                Official Settlement Architecture
              </span>
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-white mt-1">
                Commercial Bank of Ethiopia (CBE) Direct Verification
              </h3>
            </div>
            <div className="text-xs text-[#A1A1AA] max-w-sm">
              In accordance with AMG Holdings financial controls, orders and quotes settle via CBE bank transfer with Finance FT reference verification.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="bg-[#141416] p-5 rounded-2xl border border-[#222225] space-y-1.5">
              <div className="font-serif font-bold text-white text-sm">1. Initiate Checkout</div>
              <div className="text-[11px] text-[#A1A1AA]">Order is generated and stock is held in depot with unique reference.</div>
            </div>

            <div className="bg-[#141416] p-5 rounded-2xl border border-[#222225] space-y-1.5">
              <div className="font-serif font-bold text-white text-sm">2. CBE Transfer</div>
              <div className="text-[11px] text-[#A1A1AA]">Transfer via CBE Mobile Banking, internet banking, or branch teller.</div>
            </div>

            <div className="bg-[#141416] p-5 rounded-2xl border border-[#222225] space-y-1.5">
              <div className="font-serif font-bold text-white text-sm">3. Submit FT Code</div>
              <div className="text-[11px] text-[#A1A1AA]">Paste bank FT transaction number in payment portal for verification.</div>
            </div>

            <div className="bg-[#141416] p-5 rounded-2xl border border-[#222225] space-y-1.5">
              <div className="font-serif font-bold text-[#C6F432] text-sm">4. Finance Release</div>
              <div className="text-[11px] text-[#A1A1AA]">Finance audits ledger, marks verified, and dispatches gate pass.</div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Quick View Modal Component */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 py-16 text-center text-slate-500 font-mono text-xs">
          Loading AMG Holdings Enterprise Catalog...
        </div>
      }
    >
      <HomePageContent />
    </Suspense>
  );
}
