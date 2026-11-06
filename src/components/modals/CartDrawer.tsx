'use client';

import React from 'react';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { getProductUnitPrice } from '@/lib/constants';
import { X, Trash2, ArrowRight, ShoppingBag, ShieldCheck } from 'lucide-react';

export function CartDrawer() {
  const { activeRole, switchRole } = useAuth();
  const {
    items,
    isCartDrawerOpen,
    setIsCartDrawerOpen,
    removeFromCart,
    updateQuantity,
    subtotal,
    totalSavings,
    tax,
    total,
    openCheckout,
    appliedCoupon,
    couponDiscountEtb,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const [couponCodeInput, setCouponCodeInput] = React.useState('');
  const [couponStatus, setCouponStatus] = React.useState<{ error?: string; success?: string } | null>(null);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCodeInput.trim()) return;
    const res = applyCoupon(couponCodeInput);
    if (res.success) {
      setCouponStatus({ success: res.message });
      setCouponCodeInput('');
    } else {
      setCouponStatus({ error: res.message });
    }
  };

  if (!isCartDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-[#0B0B0C] border-l border-[#E4E4E7] dark:border-[#222225] shadow-2xl flex flex-col text-[#0B0B0C] dark:text-white transition-colors">
          {/* Header */}
          <div className="px-6 py-4 bg-[#0B0B0C] text-white flex items-center justify-between border-b border-[#222225]">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-[#C6F432]" />
              <h2 className="text-base font-serif font-bold tracking-tight">Direct Purchase Cart</h2>
              <span className="text-[10px] font-mono bg-[#1A1A1D] border border-[#2A2A2E] text-[#C6F432] px-2 py-0.5 rounded-full">
                Stream A
              </span>
            </div>
            <button
              onClick={() => setIsCartDrawerOpen(false)}
              className="text-[#A1A1AA] hover:text-white p-1 rounded-full hover:bg-[#1A1A1D] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Staff Mode Banner */}
          {activeRole !== 'customer' && (
            <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between text-[11px] text-amber-500">
              <div className="flex items-center space-x-1.5 truncate">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="truncate">Staff ({activeRole.replace('_', ' ')}): Orders require Customer account.</span>
              </div>
              <button
                type="button"
                onClick={() => switchRole('customer')}
                className="font-bold underline text-amber-400 hover:text-amber-300 ml-2 shrink-0"
              >
                Switch
              </button>
            </div>
          )}

          {/* Cart Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {items.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <ShoppingBag className="w-12 h-12 text-[#A1A1AA] mx-auto opacity-50" />
                <div className="text-sm font-semibold text-[#0B0B0C] dark:text-white">Your shopping cart is empty</div>
                <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] max-w-xs mx-auto">
                  Browse our direct self-service catalog (Ethio Roofing, Rebars, Coffee, Fasteners) to add instant purchase items.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map(({ product, quantity, appliedUnitPriceEtb }) => {
                  const effectivePrice = appliedUnitPriceEtb ?? getProductUnitPrice(product, quantity);
                  const hasDiscount = effectivePrice < product.unitPriceEtb;

                  return (
                    <div
                      key={product.id}
                      className="border border-[#E4E4E7] dark:border-[#222225] p-4 rounded-2xl bg-[#FAFAFA] dark:bg-[#141416] flex flex-col justify-between space-y-2 hover:border-[#0B0B0C] dark:hover:border-[#C6F432]/60 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="pr-2">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA] block">
                            SKU: {product.sku}
                          </span>
                          <h4 className="text-xs font-bold text-[#0B0B0C] dark:text-white leading-tight">
                            {product.name}
                          </h4>
                          <span className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
                            {product.subsidiaryName}
                          </span>
                        </div>
                        <button
                          onClick={() => removeFromCart(product.id)}
                          className="text-[#A1A1AA] hover:text-rose-500 p-1 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[#E4E4E7] dark:border-[#222225]">
                        <div className="flex items-center space-x-1.5">
                          {(() => {
                            const isAtMoq = quantity <= (product.moq || 1);
                            return (
                              <>
                                <button
                                  type="button"
                                  onClick={() => !isAtMoq && updateQuantity(product.id, quantity - 1)}
                                  disabled={isAtMoq}
                                  title={isAtMoq ? `Minimum order quantity is ${product.moq} ${product.unitMeasurement}s` : 'Decrease quantity'}
                                  className={`w-7 h-7 border border-[#E4E4E7] dark:border-[#2A2A2E] text-[#0B0B0C] dark:text-white font-bold rounded-lg flex items-center justify-center text-xs transition-colors ${
                                    isAtMoq
                                      ? 'opacity-35 cursor-not-allowed bg-slate-100 dark:bg-[#141416]'
                                      : 'bg-white dark:bg-[#1A1A1D] hover:bg-[#F4F4F5] dark:hover:bg-[#222225]'
                                  }`}
                                >
                                  -
                                </button>
                                <span className="font-mono text-xs px-2 font-semibold">
                                  {quantity} {product.unitMeasurement}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(product.id, quantity + 1)}
                                  className="w-7 h-7 border border-[#E4E4E7] dark:border-[#2A2A2E] bg-white dark:bg-[#1A1A1D] text-[#0B0B0C] dark:text-white font-bold rounded-lg flex items-center justify-center hover:bg-[#F4F4F5] dark:hover:bg-[#222225] text-xs transition-colors"
                                  title="Increase quantity"
                                >
                                  +
                                </button>
                                {product.moq > 1 && (
                                  <span className="text-[10px] font-mono text-amber-500 font-semibold ml-1">
                                    (MOQ: {product.moq})
                                  </span>
                                )}
                              </>
                            );
                          })()}
                        </div>

                        <div className="text-right">
                          <div className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
                            ETB {effectivePrice.toLocaleString()} / {product.unitMeasurement}
                            {hasDiscount && (
                              <span className="line-through text-[#A1A1AA] ml-1">
                                ETB {product.unitPriceEtb.toLocaleString()}
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-bold font-mono text-[#0B0B0C] dark:text-[#C6F432]">
                            ETB {(effectivePrice * quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Summary */}
          {items.length > 0 && (
            <div className="p-6 bg-[#FAFAFA] dark:bg-[#141416] border-t border-[#E4E4E7] dark:border-[#222225] space-y-3">
              {/* Promo Code Input */}
              <div className="border border-[#E4E4E7] dark:border-[#222225] bg-white dark:bg-[#0B0B0C] p-3 rounded-xl space-y-2">
                <form onSubmit={handleApplyCoupon} className="flex space-x-1.5">
                  <input
                    type="text"
                    placeholder="Voucher (BUILDETHIOPIA10)"
                    value={couponCodeInput}
                    onChange={(e) => setCouponCodeInput(e.target.value)}
                    className="flex-1 border border-[#E4E4E7] dark:border-[#222225] bg-transparent text-[#0B0B0C] dark:text-white px-3 py-1.5 text-xs rounded-lg focus:border-[#0B0B0C] dark:focus:border-[#C6F432] outline-none uppercase font-mono"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-[#0B0B0C] dark:bg-[#C6F432] text-white dark:text-[#0B0B0C] text-xs font-bold rounded-lg transition-colors"
                  >
                    Apply
                  </button>
                </form>

                {couponStatus?.error && (
                  <p className="text-[11px] text-rose-500 font-medium">{couponStatus.error}</p>
                )}
                {couponStatus?.success && (
                  <p className="text-[11px] text-emerald-500 font-medium">{couponStatus.success}</p>
                )}

                {appliedCoupon && (
                  <div className="flex justify-between items-center bg-[#C6F432]/10 border border-[#C6F432]/30 px-2.5 py-1 rounded-lg text-[11px]">
                    <span className="text-[#0B0B0C] dark:text-white font-semibold">
                      Voucher Applied: <span className="font-mono text-[#C6F432]">{appliedCoupon.code}</span>
                    </span>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="text-rose-500 hover:underline font-bold text-[10px]"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-1 text-xs">
                {totalSavings > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 p-2 rounded-lg">
                    <span>Contractor Total Savings:</span>
                    <span className="font-mono">-ETB {totalSavings.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#71717A] dark:text-[#A1A1AA]">
                  <span>Subtotal (Excl. VAT):</span>
                  <span className="font-mono text-[#0B0B0C] dark:text-white">ETB {subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                {couponDiscountEtb > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Corporate Voucher Discount:</span>
                    <span className="font-mono">-ETB {couponDiscountEtb.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#71717A] dark:text-[#A1A1AA]">
                  <span>Ethiopian VAT (15%):</span>
                  <span className="font-mono text-[#0B0B0C] dark:text-white">ETB {tax.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-[#0B0B0C] dark:text-white pt-2 border-t border-[#E4E4E7] dark:border-[#222225]">
                  <span>Total Payable:</span>
                  <span className="font-mono text-[#0B0B0C] dark:text-[#C6F432]">ETB {total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={openCheckout}
                  className="w-full py-3 bg-[#0B0B0C] dark:bg-[#C6F432] hover:bg-[#1A1A1D] dark:hover:bg-[#D7F860] text-white dark:text-[#0B0B0C] font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2"
                >
                  <span>Proceed to Digital Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-center space-x-1.5 text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#C6F432]" />
                <span>CBE Verified Bank Transfer & Proforma Ledger</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
