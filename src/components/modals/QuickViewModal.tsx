'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types';
import { useCart } from '@/lib/cart-context';
import { useWishlist } from '@/lib/wishlist-context';
import {
  X,
  ShoppingCart,
  FileText,
  Building2,
  Shield,
  Layers,
  Heart,
  Check,
  Copy,
  Info,
  ExternalLink,
  Truck
} from 'lucide-react';

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickViewModal({ product, isOpen, onClose }: QuickViewModalProps) {
  const { addToCart, openRfq } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [copiedSku, setCopiedSku] = useState(false);
  const [addedNotice, setAddedNotice] = useState(false);

  if (!isOpen || !product) return null;

  const isStreamA = product.transactionStream === 'direct_checkout';
  const effectiveQuantity = Math.max(quantity, product.moq);
  const totalAmount = isStreamA ? product.unitPriceEtb * effectiveQuantity : 0;
  const inWishlist = isInWishlist(product.id);

  const handleCopySku = () => {
    navigator.clipboard.writeText(product.sku);
    setCopiedSku(true);
    setTimeout(() => setCopiedSku(false), 2000);
  };

  const handleAddToCart = () => {
    onClose();
    addToCart(product, effectiveQuantity);
  };

  const handleRfq = () => {
    onClose();
    openRfq(product);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div
        className="relative w-full max-w-4xl bg-white dark:bg-[#0B0B0C] border border-[#E4E4E7] dark:border-[#222225] rounded-3xl shadow-2xl overflow-hidden my-8 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-6 py-4 bg-[#FAFAFA] dark:bg-[#141416] border-b border-[#E4E4E7] dark:border-[#222225] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C6F432]" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA]">
              {product.subsidiaryName} • Quick View
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#71717A] hover:text-[#0B0B0C] dark:hover:text-white rounded-full hover:bg-[#E4E4E7] dark:hover:bg-[#1F1F24] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: 2 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 sm:p-8">
          {/* Left Column: Image & Badges (5 cols) */}
          <div className="md:col-span-5 space-y-4">
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden border border-[#E4E4E7] dark:border-[#222225] bg-[#F4F4F5] dark:bg-[#141416]">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/products/amg-structural-steel-beams.jpg';
                  }}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">
                  🏭
                </div>
              )}

              <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm ${
                  isStreamA
                    ? 'bg-[#0B0B0C] text-[#C6F432] border border-[#C6F432]/40'
                    : 'bg-[#1A1A1D] text-white border border-[#2A2A2E]'
                }`}>
                  {isStreamA ? 'Direct Buy (Stream A)' : 'RFQ Quote (Stream B)'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => toggleWishlist(product)}
                className="absolute top-3 right-3 p-2 rounded-full bg-white/90 dark:bg-[#0B0B0C]/90 backdrop-blur-sm border border-[#E4E4E7] dark:border-[#2A2A2E] text-[#0B0B0C] dark:text-white hover:text-rose-500 dark:hover:text-rose-400 transition-colors shadow-sm"
                title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <Heart className={`w-4 h-4 ${inWishlist ? 'fill-rose-500 text-rose-500' : ''}`} />
              </button>
            </div>

            {/* Quick SKU & Share */}
            <div className="p-3 bg-[#FAFAFA] dark:bg-[#141416] border border-[#E4E4E7] dark:border-[#222225] rounded-xl flex items-center justify-between text-xs font-mono">
              <span className="text-[#71717A] dark:text-[#A1A1AA]">SKU: {product.sku}</span>
              <button
                type="button"
                onClick={handleCopySku}
                className="flex items-center space-x-1 text-[#0B0B0C] dark:text-[#C6F432] font-semibold hover:underline"
              >
                {copiedSku ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSku ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Specs, Inventory & Order Action (7 cols) */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div>
                <h2 className="font-serif font-bold text-2xl text-[#0B0B0C] dark:text-white leading-tight">
                  {product.name}
                </h2>
                <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-2 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Price & MOQ Box */}
              <div className="p-4 bg-[#FAFAFA] dark:bg-[#141416] border border-[#E4E4E7] dark:border-[#222225] rounded-2xl flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA]">
                    {isStreamA ? 'Unit Price (Excl. VAT)' : 'Stream B Pricing'}
                  </div>
                  {isStreamA ? (
                    <div className="text-xl font-bold font-mono text-[#0B0B0C] dark:text-[#C6F432]">
                      ETB {product.unitPriceEtb.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      <span className="text-xs font-normal text-[#71717A] dark:text-[#A1A1AA]"> / {product.unitMeasurement}</span>
                    </div>
                  ) : (
                    <div className="text-sm font-bold text-[#0B0B0C] dark:text-white">
                      Custom Agent Quotation
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA]">
                    Minimum Order
                  </div>
                  <div className="text-sm font-bold font-mono text-[#0B0B0C] dark:text-white">
                    {product.moq} {product.unitMeasurement}
                  </div>
                </div>
              </div>

              {/* Branch Stock Inventory Glance */}
              {product.stockSummary && (
                <div className="space-y-2 border-t border-b border-[#F4F4F5] dark:border-[#1F1F24] py-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#0B0B0C] dark:text-white flex items-center space-x-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA]" />
                      <span>Regional Branch Availability:</span>
                    </span>
                    <span className="font-mono text-[11px] font-bold text-[#0B0B0C] dark:text-[#C6F432] bg-[#E4E4E7] dark:bg-[#1F1F24] px-2 py-0.5 rounded-full">
                      {product.stockSummary.totalOnHand} Total On Hand
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    {product.stockSummary.branches.map((b, idx) => (
                      <div
                        key={idx}
                        className={`p-2 rounded-lg border flex items-center justify-between ${
                          selectedBranch === b.branchName
                            ? 'bg-[#C6F432]/10 border-[#C6F432] text-[#0B0B0C] dark:text-white'
                            : 'bg-white dark:bg-[#141416] border-[#E4E4E7] dark:border-[#222225] text-[#71717A] dark:text-[#A1A1AA]'
                        }`}
                        onClick={() => setSelectedBranch(b.branchName)}
                        role="button"
                        tabIndex={0}
                      >
                        <span className="font-medium truncate">{b.branchName}</span>
                        <span className="font-bold text-[#0B0B0C] dark:text-white ml-2">{b.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Technical Specifications Pills */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA] flex items-center space-x-1">
                  <Info className="w-3 h-3 text-[#C6F432]" />
                  <span>Technical Specifications:</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
                  {Object.entries(product.technicalSpecs).slice(0, 4).map(([k, v]) => (
                    <div
                      key={k}
                      className="px-2.5 py-1.5 bg-[#FAFAFA] dark:bg-[#141416] border border-[#E4E4E7] dark:border-[#222225] rounded-lg flex justify-between"
                    >
                      <span className="text-[#71717A] dark:text-[#A1A1AA] text-[10px]">{k}:</span>
                      <span className="font-bold text-[#0B0B0C] dark:text-white text-[10px]">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="space-y-3 pt-2">
              {isStreamA ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center border border-[#E4E4E7] dark:border-[#222225] rounded-xl overflow-hidden bg-white dark:bg-[#141416]">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(product.moq, q - 1))}
                        className="px-3 py-2 text-[#71717A] hover:text-[#0B0B0C] dark:hover:text-white hover:bg-[#F4F4F5] dark:hover:bg-[#1F1F24]"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={product.moq}
                        value={effectiveQuantity}
                        onChange={(e) => setQuantity(Math.max(product.moq, parseInt(e.target.value) || product.moq))}
                        className="w-16 text-center font-mono font-bold text-xs bg-transparent text-[#0B0B0C] dark:text-white outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => q + 1)}
                        className="px-3 py-2 text-[#71717A] hover:text-[#0B0B0C] dark:hover:text-white hover:bg-[#F4F4F5] dark:hover:bg-[#1F1F24]"
                      >
                        +
                      </button>
                    </div>

                    <div className="flex-1 text-right font-mono text-xs">
                      <span className="text-[#71717A] dark:text-[#A1A1AA]">Est. Subtotal: </span>
                      <span className="font-bold text-sm text-[#0B0B0C] dark:text-[#C6F432]">
                        ETB {totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="w-full py-3 bg-[#0B0B0C] dark:bg-[#C6F432] text-white dark:text-[#0B0B0C] hover:bg-[#1F1F24] dark:hover:bg-[#D7F860] font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2"
                  >
                    {addedNotice ? (
                      <>
                        <Check className="w-4 h-4 text-[#C6F432] dark:text-[#0B0B0C]" />
                        <span>Added to Cart!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4 text-[#C6F432] dark:text-[#0B0B0C]" />
                        <span>Add {effectiveQuantity} {product.unitMeasurement} to Cart</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleRfq}
                  className="w-full py-3 bg-[#0B0B0C] dark:bg-[#C6F432] text-white dark:text-[#0B0B0C] hover:bg-[#1F1F24] dark:hover:bg-[#D7F860] font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2"
                >
                  <FileText className="w-4 h-4 text-[#C6F432] dark:text-[#0B0B0C]" />
                  <span>Configure Custom Specifications (RFQ)</span>
                </button>
              )}

              <div className="flex items-center justify-between text-xs pt-1">
                <Link
                  href={`/products/${product.slug}`}
                  onClick={onClose}
                  className="text-xs text-[#71717A] dark:text-[#A1A1AA] hover:text-[#0B0B0C] dark:hover:text-[#C6F432] flex items-center space-x-1"
                >
                  <span>Open full product page</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>

                <span className="text-[10px] text-[#A1A1AA] flex items-center space-x-1">
                  <Shield className="w-3 h-3 text-[#C6F432]" />
                  <span>CBE Bank Transfer & Proforma</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
