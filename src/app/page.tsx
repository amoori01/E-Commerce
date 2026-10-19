'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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
  Check
} from 'lucide-react';

export default function HomePage() {
  const { addToCart, openRfq } = useCart();
  const [selectedSubsidiary, setSelectedSubsidiary] = useState<string>('all');
  const [selectedStream, setSelectedStream] = useState<'all' | TransactionStream>('all');
  const [expandedSpecsId, setExpandedSpecsId] = useState<string | null>(null);

  const filteredProducts = PRODUCTS.filter((p) => {
    const matchesSub = selectedSubsidiary === 'all' || p.subsidiaryId === selectedSubsidiary;
    const matchesStream = selectedStream === 'all' || p.transactionStream === selectedStream;
    return matchesSub && matchesStream;
  });

  return (
    <div className="space-y-8 pb-16">
      {/* 1. INDUSTRIAL ENTERPRISE HERO SECTION */}
      <section className="bg-gradient-to-r from-amg-navy to-amg-navy-950 text-white border-b border-amg-navy-900 py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center space-x-2 bg-amg-navy-700/60 border border-amg-navy-400/30 px-3 py-1 rounded-sm text-xs font-semibold text-slate-200">
              <span className="w-2 h-2 bg-amg-red rounded-none inline-block animate-pulse" />
              <span>AMG Holdings Digital Transformation Baseline</span>
              <span className="text-slate-400">|</span>
              <span className="text-amg-red-300">Dual-Stream Architecture</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Enterprise Procurement & Heavy Engineering Portal
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
              Bringing the market directly to Ethiopian builders, fleet operators, and industrial enterprises. Procure standard construction products with instant digital settlement or submit custom engineering specifications for agent review.
            </p>

            {/* Dual Stream Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedStream('direct_checkout');
                  const el = document.getElementById('catalog-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-5 py-2.5 bg-amg-red hover:bg-red-800 text-white font-bold text-xs rounded-sm transition-all shadow-panel flex items-center space-x-2"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Stream A: Direct Digital Checkout</span>
              </button>

              <button
                type="button"
                onClick={() => openRfq()}
                className="px-5 py-2.5 bg-white hover:bg-slate-100 text-amg-navy font-bold text-xs rounded-sm transition-all shadow-panel flex items-center space-x-2"
              >
                <FileText className="w-4 h-4 text-amg-red" />
                <span>Stream B: Request Engineering RFQ</span>
              </button>
            </div>
          </div>

          {/* Right Metrics / Subsidiary Callout Card */}
          <div className="lg:col-span-4 bg-amg-navy-900/90 border border-amg-navy-600/40 p-5 rounded-sm shadow-modal space-y-3.5 text-xs">
            <div className="border-b border-amg-navy-700/80 pb-2">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
                Enterprise Operations
              </span>
              <h3 className="text-sm font-bold text-white">5 Specialized Sister Companies</h3>
            </div>

            <div className="space-y-2 text-slate-300 text-[11px]">
              <div className="flex justify-between items-center py-1 border-b border-amg-navy-800/80">
                <span className="font-medium">Heavy Steel & PEB Buildings</span>
                <span className="font-mono text-emerald-400 font-bold">Grade S355JR</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-amg-navy-800/80">
                <span className="font-medium">Roofing Sheets & Valleys</span>
                <span className="font-mono text-emerald-400 font-bold">20-Yr Warranty</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-amg-navy-800/80">
                <span className="font-medium">Sinotruk Heavy Commercial Fleets</span>
                <span className="font-mono text-emerald-400 font-bold">420HP Euro-III</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-amg-navy-800/80">
                <span className="font-medium">Medical / Industrial Gases & Lubes</span>
                <span className="font-mono text-emerald-400 font-bold">99.6% Cryo LOX</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="font-medium">AMG Specialty Arabica Coffee</span>
                <span className="font-mono text-emerald-400 font-bold">88.5 SCA Cup</span>
              </div>
            </div>

            <div className="pt-2 border-t border-amg-navy-700/80 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center space-x-1">
                <Shield className="w-3.5 h-3.5 text-amg-red" />
                <span>OWASP & PCI-DSS Compliant</span>
              </span>
              <span className="font-mono text-white font-semibold">4 Regional Hubs</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. DUAL ARCHITECTURE EXPLANATION CALLOUT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Stream A Card */}
          <div className="border border-slate-300 bg-white p-5 rounded-sm shadow-crisp space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 bg-amg-navy text-white text-[10px] font-bold uppercase rounded-sm">
                Stream A
              </span>
              <h3 className="text-sm font-bold text-slate-900">
                Direct Self-Service Digital Commerce
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Standardized catalog-fixed inventory: Ethio roofing sheets, ASTM A615 Grade 60 steel rebars, fasteners, industrial lubricants, and packaged Arabica coffee. Instant order placement with Telebirr, CBE Birr, Chapa, or bank wire without sales agent intervention.
            </p>
            <div className="text-[11px] font-mono text-amg-navy font-semibold flex items-center space-x-1 pt-1">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Real-time branch inventory reservation • 30-min checkout hold</span>
            </div>
          </div>

          {/* Stream B Card */}
          <div className="border border-slate-300 bg-white p-5 rounded-sm shadow-crisp space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 bg-amg-red text-white text-[10px] font-bold uppercase rounded-sm">
                Stream B
              </span>
              <h3 className="text-sm font-bold text-slate-900">
                Agent-Assisted Custom Quotation (RFQ)
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Complex capital engineering products: Pre-engineered steel buildings (PEB), custom columns/rafters, Sinotruk commercial transport prime movers, 45,000L tankers, and bulk cryogenic liquid gases. Dedicated sales engineers apply volume discounts and project pricing matrices.
            </p>
            <div className="text-[11px] font-mono text-amg-red font-semibold flex items-center space-x-1 pt-1">
              <Check className="w-3.5 h-3.5 text-amg-red" />
              <span>Technical drawing review • Multi-tier volume discounts • Escalated SLA</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CATALOG FILTER CONTROLS (GRAINGER / ALIBABA STYLE) */}
      <section id="catalog-section" className="max-w-7xl mx-auto px-4 sm:px-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-300 pb-3 gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Enterprise Catalog & Technical Specifications
            </h2>
            <p className="text-xs text-slate-500">
              Showing {filteredProducts.length} verified industrial product lines across AMG Holdings
            </p>
          </div>

          {/* Stream Filter Pills */}
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Filter Stream:
            </span>
            <div className="inline-flex bg-slate-200 p-0.5 rounded-sm border border-slate-300 text-xs">
              <button
                type="button"
                onClick={() => setSelectedStream('all')}
                className={`px-3 py-1 font-semibold rounded-sm transition-all ${
                  selectedStream === 'all'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Products
              </button>
              <button
                type="button"
                onClick={() => setSelectedStream('direct_checkout')}
                className={`px-3 py-1 font-semibold rounded-sm transition-all ${
                  selectedStream === 'direct_checkout'
                    ? 'bg-amg-navy text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Stream A (Instant)
              </button>
              <button
                type="button"
                onClick={() => setSelectedStream('assisted_quote')}
                className={`px-3 py-1 font-semibold rounded-sm transition-all ${
                  selectedStream === 'assisted_quote'
                    ? 'bg-amg-red text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Stream B (RFQ)
              </button>
            </div>
          </div>
        </div>

        {/* Subsidiary Filter Chips */}
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={() => setSelectedSubsidiary('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-sm border transition-all ${
              selectedSubsidiary === 'all'
                ? 'border-amg-navy bg-amg-navy text-white'
                : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
            }`}
          >
            All 5 Subsidiaries
          </button>
          {SUBSIDIARIES.map((sub) => (
            <button
              key={sub.id}
              type="button"
              onClick={() => setSelectedSubsidiary(sub.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-sm border transition-all ${
                selectedSubsidiary === sub.id
                  ? 'border-amg-navy bg-amg-navy text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
              }`}
            >
              {sub.name}
            </button>
          ))}
        </div>

        {/* 4. PRODUCT GRID (HIGH INFORMATION DENSITY, GRAINGER-STYLE SPECIFICATION CARDS) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
          {filteredProducts.map((product) => {
            const isStreamA = product.transactionStream === 'direct_checkout';
            const isExpanded = expandedSpecsId === product.id;

            return (
              <div
                key={product.id}
                className="bg-white border border-slate-300 rounded-sm shadow-crisp hover:shadow-panel transition-all flex flex-col justify-between overflow-hidden"
              >
                <div>
                  {/* Image & Header Badge Bar */}
                  <Link href={`/products/${product.slug}`} className="block relative h-48 bg-slate-100 border-b border-slate-200 overflow-hidden group">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-sm text-white ${
                          isStreamA ? 'bg-amg-navy' : 'bg-amg-red'
                        }`}
                      >
                        {isStreamA ? 'Stream A: Instant Buy' : 'Stream B: RFQ Required'}
                      </span>
                    </div>

                    <div className="absolute top-2 right-2">
                      <span className="bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-mono px-2 py-0.5 rounded-sm">
                        SKU: {product.sku}
                      </span>
                    </div>
                  </Link>

                  {/* Body Content */}
                  <div className="p-4 space-y-3">
                    <div>
                      <div className="text-[11px] font-semibold text-amg-navy uppercase tracking-wider">
                        {product.subsidiaryName}
                      </div>
                      <Link href={`/products/${product.slug}`}>
                        <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2 mt-0.5 hover:text-amg-navy hover:underline transition-colors">
                          {product.name}
                        </h3>
                      </Link>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>

                    {/* Pricing / MOQ Display */}
                    <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-sm flex items-center justify-between">
                      {isStreamA ? (
                        <div>
                          <div className="text-[10px] uppercase font-bold text-slate-500">
                            Unit Price (Excl. VAT)
                          </div>
                          <div className="text-base font-extrabold font-mono text-amg-navy">
                            ETB {product.unitPriceEtb.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            <span className="text-xs font-normal text-slate-500"> / {product.unitMeasurement}</span>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-[10px] uppercase font-bold text-slate-500">
                            Pricing Matrix
                          </div>
                          <div className="text-sm font-extrabold text-amg-red">
                            Custom Quotation by Engineering Agent
                          </div>
                        </div>
                      )}

                      <div className="text-right">
                        <div className="text-[10px] uppercase font-bold text-slate-500">
                          Min. Order (MOQ)
                        </div>
                        <div className="text-xs font-mono font-bold text-slate-800">
                          {product.moq} {product.unitMeasurement}
                        </div>
                      </div>
                    </div>

                    {/* Stock / Regional Branch Availability */}
                    {product.stockSummary && (
                      <div className="text-[11px] border-t border-slate-200 pt-2 space-y-1">
                        <div className="font-semibold text-slate-700 flex items-center justify-between">
                          <span className="flex items-center space-x-1">
                            <Building2 className="w-3.5 h-3.5 text-slate-500" />
                            <span>Branch Stock:</span>
                          </span>
                          <span className="font-mono text-emerald-700 font-bold">
                            {product.stockSummary.totalOnHand} {product.unitMeasurement} On-Hand
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 space-y-0.5">
                          {product.stockSummary.branches.map((b, idx) => (
                            <div key={idx} className="flex justify-between font-mono">
                              <span>{b.branchName}:</span>
                              <span className="text-slate-700 font-semibold">{b.quantity} {product.unitMeasurement}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Grainger-style Technical Data Sheet Table Accordion */}
                    <div className="border border-slate-200 rounded-sm overflow-hidden text-xs">
                      <button
                        type="button"
                        onClick={() => setExpandedSpecsId(isExpanded ? null : product.id)}
                        className="w-full px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold flex items-center justify-between transition-colors text-[11px]"
                      >
                        <span className="flex items-center space-x-1.5">
                          <Info className="w-3.5 h-3.5 text-amg-navy" />
                          <span>Technical Specifications Sheet</span>
                        </span>
                        <span className="text-slate-500 font-mono">
                          {isExpanded ? 'Hide ▲' : 'View ▼'}
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="p-3 bg-white divide-y divide-slate-100 text-[11px] font-mono">
                          {Object.entries(product.technicalSpecs).map(([specKey, specVal]) => (
                            <div key={specKey} className="py-1 flex justify-between gap-2">
                              <span className="text-slate-500">{specKey}:</span>
                              <span className="text-slate-900 font-semibold text-right">{specVal}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="p-4 pt-0">
                  {isStreamA ? (
                    <button
                      type="button"
                      onClick={() => addToCart(product)}
                      className="w-full py-2.5 bg-amg-navy hover:bg-amg-navy-900 text-white font-bold text-xs rounded-sm transition-colors flex items-center justify-center space-x-2 shadow-sm"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Add to Direct Cart (Instant Checkout)</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openRfq(product)}
                      className="w-full py-2.5 bg-amg-red hover:bg-red-800 text-white font-bold text-xs rounded-sm transition-colors flex items-center justify-center space-x-2 shadow-sm"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Request Custom Engineering RFQ</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. NATIONAL PAYMENT SWITCH & LOCAL SETTLEMENT BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-slate-900 text-white border border-slate-800 p-6 rounded-sm shadow-panel space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amg-red font-mono">
                Omnichannel Payment Infrastructure
              </span>
              <h3 className="text-base font-extrabold text-white">
                Integrated National Financial Switches & Mobile Money
              </h3>
            </div>
            <div className="text-xs text-slate-400">
              Instant reconciliation via unique idempotency keys and asynchronous webhooks
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="bg-slate-800/60 p-3 rounded-sm border border-slate-700/80 space-y-1">
              <div className="font-bold text-white">Telebirr SuperApp</div>
              <div className="text-[11px] text-slate-400">Direct mobile wallet STK push authorization & callback integration.</div>
            </div>

            <div className="bg-slate-800/60 p-3 rounded-sm border border-slate-700/80 space-y-1">
              <div className="font-bold text-white">Commercial Bank CBE Birr</div>
              <div className="text-[11px] text-slate-400">Direct clearing via CBE national digital core banking switch.</div>
            </div>

            <div className="bg-slate-800/60 p-3 rounded-sm border border-slate-700/80 space-y-1">
              <div className="font-bold text-white">Chapa Payment Switch</div>
              <div className="text-[11px] text-slate-400">International Visa, Mastercard, and localized multi-bank gateways.</div>
            </div>

            <div className="bg-slate-800/60 p-3 rounded-sm border border-slate-700/80 space-y-1">
              <div className="font-bold text-white">Direct Corporate Wire</div>
              <div className="text-[11px] text-slate-400">RTGS bank transfer verified against ERCA electronic VAT ledgers.</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
