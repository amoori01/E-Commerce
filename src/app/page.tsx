'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PRODUCTS, SUBSIDIARIES, BRANCHES } from '@/lib/constants';
import { useCart } from '@/lib/cart-context';
import { Product, TransactionStream } from '@/types';
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
  Search
} from 'lucide-react';

function HomePageContent() {
  const { addToCart, openRfq } = useCart();
  const searchParams = useSearchParams();
  const [selectedSubsidiary, setSelectedSubsidiary] = useState<string>('all');
  const [selectedStream, setSelectedStream] = useState<'all' | TransactionStream>('all');
  const [catalogSearch, setCatalogSearch] = useState<string>('');
  const [expandedSpecsId, setExpandedSpecsId] = useState<string | null>(null);

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
    <div className="space-y-12 pb-20 bg-[#FAFAFA]">
      {/* 1. BENTO SHOWCASE HERO SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Bento Cell 1: Main Dark Narrative Card (8 cols) */}
          <div className="lg:col-span-8 bg-[#0B0B0C] text-white rounded-3xl p-8 sm:p-10 flex flex-col justify-between border border-[#1A1A1D] shadow-xl relative overflow-hidden group">
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
          <div className="lg:col-span-4 bg-white rounded-3xl p-7 border border-[#E4E4E7] shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#F4F4F5]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#71717A]">
                  Consortium Operations
                </span>
                <span className="px-2 py-0.5 bg-[#F4F4F5] text-[#0B0B0C] text-[10px] font-bold rounded-full">
                  5 Sister Companies
                </span>
              </div>

              <div className="divide-y divide-[#F4F4F5] text-xs pt-2">
                <div className="py-2.5 flex items-center justify-between">
                  <span className="font-medium text-[#27272A]">Structural Steel &amp; PEB</span>
                  <span className="font-mono text-[11px] font-bold text-[#0B0B0C] bg-[#FAFAFA] px-2 py-0.5 rounded border border-[#E4E4E7]">Grade S355JR</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="font-medium text-[#27272A]">Ethio &amp; Adama Roofing</span>
                  <span className="font-mono text-[11px] font-bold text-[#0B0B0C] bg-[#FAFAFA] px-2 py-0.5 rounded border border-[#E4E4E7]">0.40mm - 20Yr</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="font-medium text-[#27272A]">Sinotruk Prime Movers</span>
                  <span className="font-mono text-[11px] font-bold text-[#0B0B0C] bg-[#FAFAFA] px-2 py-0.5 rounded border border-[#E4E4E7]">420HP Euro-III</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="font-medium text-[#27272A]">Industrial Cryogenic LOX</span>
                  <span className="font-mono text-[11px] font-bold text-[#0B0B0C] bg-[#FAFAFA] px-2 py-0.5 rounded border border-[#E4E4E7]">99.6% Purity</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="font-medium text-[#27272A]">Specialty Arabica Coffee</span>
                  <span className="font-mono text-[11px] font-bold text-[#0B0B0C] bg-[#FAFAFA] px-2 py-0.5 rounded border border-[#E4E4E7]">88.5 SCA Cup</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#F4F4F5] flex items-center justify-between text-[11px] text-[#71717A]">
              <span className="flex items-center space-x-1.5 text-[#0B0B0C] font-medium">
                <Shield className="w-3.5 h-3.5 text-[#0B0B0C]" />
                <span>CBE FT Verified Rail</span>
              </span>
              <span className="font-semibold text-[#0B0B0C]">4 Regional Hubs</span>
            </div>
          </div>
        </div>

        {/* Bento Row 2: Secondary Quick-Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
          {/* Card 1: Direct Order Stream A */}
          <div className="bg-white rounded-3xl p-6 border border-[#E4E4E7] shadow-xs hover:border-[#0B0B0C] transition-all flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-[#0B0B0C] flex items-center justify-center text-[#C6F432]">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-base text-[#0B0B0C]">Stream A: Direct Digital Buy</h3>
              <p className="text-xs text-[#71717A] leading-relaxed">
                Standardized construction materials, roofing sheets, fasteners, lubricants, and packaged coffee with real-time depot reservations.
              </p>
            </div>
            <div className="pt-4 flex items-center justify-between text-xs font-semibold text-[#0B0B0C]">
              <span>Instant checkout</span>
              <ArrowRight className="w-4 h-4 text-[#0B0B0C]" />
            </div>
          </div>

          {/* Card 2: Custom Quotation Stream B */}
          <div className="bg-white rounded-3xl p-6 border border-[#E4E4E7] shadow-xs hover:border-[#0B0B0C] transition-all flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-[#C6F432] flex items-center justify-center text-[#0B0B0C]">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-base text-[#0B0B0C]">Stream B: Engineering RFQ</h3>
              <p className="text-xs text-[#71717A] leading-relaxed">
                Capital projects, custom PEB columns, Sinotruk tankers, and bulk gas cylinders priced by dedicated sales engineers with proforma invoices.
              </p>
            </div>
            <div className="pt-4 flex items-center justify-between text-xs font-semibold text-[#0B0B0C]">
              <span>Agent assisted</span>
              <ArrowRight className="w-4 h-4 text-[#0B0B0C]" />
            </div>
          </div>

          {/* Card 3: Regional Depots & Logistics */}
          <div className="bg-[#0B0B0C] text-white rounded-3xl p-6 border border-[#1A1A1D] shadow-xs flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-[#1A1A1D] flex items-center justify-center text-[#C6F432]">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-base text-white">Regional Depot Clearance</h3>
              <p className="text-xs text-[#A1A1AA] leading-relaxed">
                Physical branch pickup or enterprise delivery across Addis Ababa HQ, Adama manufacturing plant, Hawassa, and Dire Dawa.
              </p>
            </div>
            <div className="pt-4 flex items-center justify-between text-xs font-semibold text-[#C6F432]">
              <span>Check branch stock</span>
              <ArrowRight className="w-4 h-4 text-[#C6F432]" />
            </div>
          </div>
        </div>
      </section>

      {/* 2. CATALOG & BENTO FILTER CONTROLS */}
      <section id="catalog-section" className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Header & Controls Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-[#E4E4E7] pb-5 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#0B0B0C] tracking-tight">
              Enterprise Catalog &amp; Technical Products
            </h2>
            <p className="text-xs text-[#71717A] mt-1 font-sans">
              Showing {filteredProducts.length} verified industrial product lines across AMG Holdings
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Live In-Catalog Search Bar */}
            <div className="relative min-w-[240px] sm:w-72">
              <Search className="w-4 h-4 text-[#71717A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                className="w-full pl-9 pr-8 py-2 text-xs border border-[#E4E4E7] rounded-full bg-white focus:outline-none focus:border-[#0B0B0C] focus:ring-2 focus:ring-[#C6F432]/30 placeholder-[#A1A1AA] text-[#0B0B0C]"
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#0B0B0C]"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Stream Filter Pills */}
            <div className="inline-flex bg-[#F4F4F5] p-1 rounded-full border border-[#E4E4E7] text-xs">
              <button
                type="button"
                onClick={() => setSelectedStream('all')}
                className={`px-3.5 py-1.5 font-semibold rounded-full transition-all ${
                  selectedStream === 'all'
                    ? 'bg-white text-[#0B0B0C] shadow-xs'
                    : 'text-[#71717A] hover:text-[#0B0B0C]'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setSelectedStream('direct_checkout')}
                className={`px-3.5 py-1.5 font-semibold rounded-full transition-all ${
                  selectedStream === 'direct_checkout'
                    ? 'bg-[#0B0B0C] text-[#C6F432] shadow-xs'
                    : 'text-[#71717A] hover:text-[#0B0B0C]'
                }`}
              >
                Stream A (Direct)
              </button>
              <button
                type="button"
                onClick={() => setSelectedStream('assisted_quote')}
                className={`px-3.5 py-1.5 font-semibold rounded-full transition-all ${
                  selectedStream === 'assisted_quote'
                    ? 'bg-[#0B0B0C] text-white shadow-xs'
                    : 'text-[#71717A] hover:text-[#0B0B0C]'
                }`}
              >
                Stream B (RFQ)
              </button>
            </div>
          </div>
        </div>

        {/* Subsidiary Filter Chips */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedSubsidiary('all')}
            className={`px-4 py-2 text-xs font-semibold rounded-full border transition-all ${
              selectedSubsidiary === 'all'
                ? 'border-[#0B0B0C] bg-[#0B0B0C] text-white shadow-xs'
                : 'border-[#E4E4E7] bg-white text-[#27272A] hover:border-[#0B0B0C]'
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
                  ? 'border-[#0B0B0C] bg-[#0B0B0C] text-white shadow-xs'
                  : 'border-[#E4E4E7] bg-white text-[#27272A] hover:border-[#0B0B0C]'
              }`}
            >
              {sub.name}
            </button>
          ))}
        </div>

        {/* Active Filter Notice & Reset Banner */}
        {(selectedSubsidiary !== 'all' || selectedStream !== 'all' || catalogSearch.trim() !== '') && (
          <div className="bg-white border border-[#E4E4E7] px-5 py-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-3 shadow-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold uppercase tracking-wider text-[10px] bg-[#0B0B0C] text-[#C6F432] px-2.5 py-1 rounded-full">
                Active Filter
              </span>
              {catalogSearch.trim() && (
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-[#F4F4F5] border border-[#E4E4E7] rounded-full font-semibold text-[#0B0B0C] text-xs">
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
                    className="text-[#71717A] hover:text-[#0B0B0C] transition-colors"
                    title="Clear search query"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <span className="font-bold text-[#0B0B0C]">
                {selectedSubsidiary !== 'all'
                  ? SUBSIDIARIES.find((s) => s.id === selectedSubsidiary)?.name || 'Filtered Subsidiary'
                  : 'All 5 Subsidiaries'}
              </span>
              <span className="text-[#D4D4D8]">•</span>
              <span className="font-medium text-[#71717A]">
                {selectedStream === 'direct_checkout'
                  ? 'Stream A: Instant Buy'
                  : selectedStream === 'assisted_quote'
                  ? 'Stream B: RFQ Required'
                  : 'All Transaction Streams'}
              </span>
              <span className="text-[#71717A] font-mono text-[11px]">
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
              className="font-bold text-[#0B0B0C] hover:text-[#71717A] text-xs flex items-center space-x-1 shrink-0"
            >
              <X className="w-3.5 h-3.5 text-[#0B0B0C]" />
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
                  className="bg-white border border-[#E4E4E7] rounded-3xl shadow-xs hover:shadow-xl hover:border-[#0B0B0C] transition-all duration-300 flex flex-col justify-between overflow-hidden group"
                >
                  <div>
                    {/* Image & Header Badge Bar */}
                    <Link
                      href={`/products/${product.slug}`}
                      className="block relative h-56 bg-[#F4F4F5] overflow-hidden"
                    >
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3.5 left-3.5 flex flex-col gap-1.5">
                        <span
                          className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full shadow-xs ${
                            isStreamA
                              ? 'bg-[#0B0B0C] text-[#C6F432]'
                              : 'bg-white text-[#0B0B0C] border border-[#E4E4E7]'
                          }`}
                        >
                          {isStreamA ? 'Stream A: Instant Buy' : 'Stream B: RFQ Required'}
                        </span>
                      </div>

                      <div className="absolute top-3.5 right-3.5">
                        <span className="bg-[#0B0B0C]/80 backdrop-blur-md text-white text-[10px] font-mono font-medium px-2.5 py-1 rounded-full">
                          {product.sku}
                        </span>
                      </div>
                    </Link>

                    {/* Body Content */}
                    <div className="p-6 space-y-4">
                      <div>
                        <div className="text-[11px] font-bold text-[#71717A] uppercase tracking-wider">
                          {product.subsidiaryName}
                        </div>
                        <Link href={`/products/${product.slug}`}>
                          <h3 className="font-serif font-bold text-lg text-[#0B0B0C] leading-snug line-clamp-2 mt-1 hover:text-[#71717A] transition-colors">
                            {product.name}
                          </h3>
                        </Link>
                      </div>

                      <p className="text-xs text-[#71717A] line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>

                      {/* Pricing / MOQ Display */}
                      <div className="bg-[#FAFAFA] border border-[#E4E4E7] p-3.5 rounded-2xl flex items-center justify-between">
                        {isStreamA ? (
                          <div>
                            <div className="text-[10px] uppercase font-bold text-[#71717A]">
                              Unit Price (Excl. VAT)
                            </div>
                            <div className="text-base font-bold font-mono text-[#0B0B0C]">
                              ETB {product.unitPriceEtb.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              <span className="text-xs font-normal text-[#71717A]"> / {product.unitMeasurement}</span>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="text-[10px] uppercase font-bold text-[#71717A]">
                              Pricing Matrix
                            </div>
                            <div className="text-xs font-bold text-[#0B0B0C]">
                              Custom Agent Quotation
                            </div>
                          </div>
                        )}

                        <div className="text-right">
                          <div className="text-[10px] uppercase font-bold text-[#71717A]">
                            Min. Order
                          </div>
                          <div className="text-xs font-mono font-bold text-[#0B0B0C]">
                            {product.moq} {product.unitMeasurement}
                          </div>
                        </div>
                      </div>

                      {/* Stock / Regional Branch Availability */}
                      {product.stockSummary && (
                        <div className="text-[11px] border-t border-[#F4F4F5] pt-3 space-y-1">
                          <div className="font-semibold text-[#27272A] flex items-center justify-between">
                            <span className="flex items-center space-x-1.5">
                              <Building2 className="w-3.5 h-3.5 text-[#71717A]" />
                              <span>Branch Stock:</span>
                            </span>
                            <span className="font-mono text-[#0B0B0C] font-bold bg-[#F4F4F5] px-2 py-0.5 rounded-full">
                              {product.stockSummary.totalOnHand} {product.unitMeasurement} On-Hand
                            </span>
                          </div>
                          <div className="text-[10px] text-[#71717A] space-y-0.5 pt-1">
                            {product.stockSummary.branches.map((b, idx) => (
                              <div key={idx} className="flex justify-between font-mono">
                                <span>{b.branchName}:</span>
                                <span className="text-[#0B0B0C] font-semibold">{b.quantity} {product.unitMeasurement}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Technical Specifications Accordion */}
                      <div className="border border-[#E4E4E7] rounded-2xl overflow-hidden text-xs">
                        <button
                          type="button"
                          onClick={() => setExpandedSpecsId(isExpanded ? null : product.id)}
                          className="w-full px-3.5 py-2 bg-[#FAFAFA] hover:bg-[#F4F4F5] text-[#27272A] font-semibold flex items-center justify-between transition-colors text-[11px]"
                        >
                          <span className="flex items-center space-x-1.5">
                            <Info className="w-3.5 h-3.5 text-[#0B0B0C]" />
                            <span>Technical Specifications</span>
                          </span>
                          <span className="text-[#71717A] font-mono text-[10px]">
                            {isExpanded ? 'Hide ▲' : 'View ▼'}
                          </span>
                        </button>

                        {isExpanded && (
                          <div className="p-3.5 bg-white divide-y divide-[#F4F4F5] text-[11px] font-mono">
                            {Object.entries(product.technicalSpecs).map(([specKey, specVal]) => (
                              <div key={specKey} className="py-1 flex justify-between gap-2">
                                <span className="text-[#71717A]">{specKey}:</span>
                                <span className="text-[#0B0B0C] font-semibold text-right">{specVal}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Action Buttons */}
                  <div className="p-6 pt-0">
                    {isStreamA ? (
                      <button
                        type="button"
                        onClick={() => addToCart(product)}
                        className="w-full py-3 bg-[#0B0B0C] hover:bg-[#1A1A1D] text-white hover:text-[#C6F432] font-semibold text-xs rounded-full transition-all flex items-center justify-center space-x-2 shadow-sm"
                      >
                        <ShoppingCart className="w-4 h-4 text-[#C6F432]" />
                        <span>Add to Direct Cart</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openRfq(product)}
                        className="w-full py-3 bg-white hover:bg-[#0B0B0C] text-[#0B0B0C] hover:text-[#C6F432] border border-[#0B0B0C] font-semibold text-xs rounded-full transition-all flex items-center justify-center space-x-2 shadow-xs"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Request Custom Quotation</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-[#E4E4E7] rounded-3xl p-16 text-center space-y-4 shadow-xs">
            <div className="w-12 h-12 bg-[#F4F4F5] rounded-full flex items-center justify-center mx-auto text-[#71717A]">
              <Layers className="w-6 h-6" />
            </div>
            <h4 className="font-serif font-bold text-[#0B0B0C] text-lg">
              {catalogSearch ? `No products match "${catalogSearch}"` : 'No items found matching the selected filter'}
            </h4>
            <p className="text-xs text-[#71717A] max-w-md mx-auto">
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
              className="px-6 py-2.5 bg-[#0B0B0C] hover:bg-[#1A1A1D] text-[#C6F432] font-bold text-xs rounded-full transition-colors"
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
