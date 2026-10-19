'use client';

import React from 'react';
import { useCart } from '@/lib/cart-context';
import { getProductUnitPrice } from '@/lib/constants';
import { X, Trash2, ArrowRight, ShoppingBag, ShieldCheck } from 'lucide-react';

export function CartDrawer() {
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
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-slate-300 shadow-modal flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 bg-amg-navy text-white flex items-center justify-between border-b border-amg-navy-900">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-amg-red" />
              <h2 className="text-base font-bold tracking-tight">Direct Purchase Cart</h2>
              <span className="text-xs bg-amg-navy-700 px-2 py-0.5 rounded-sm">
                Stream A
              </span>
            </div>
            <button
              onClick={() => setIsCartDrawerOpen(false)}
              className="text-slate-300 hover:text-white p-1 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {items.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
                <div className="text-sm font-semibold text-slate-700">Your shopping cart is empty</div>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
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
                      className="border border-slate-200 p-3.5 rounded-sm bg-slate-50 flex flex-col justify-between space-y-2 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="pr-2">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">
                            SKU: {product.sku}
                          </span>
                          <h4 className="text-xs font-bold text-slate-900 leading-tight">
                            {product.name}
                          </h4>
                          <span className="text-[11px] text-slate-600">
                            {product.subsidiaryName}
                          </span>
                        </div>
                        <button
                          onClick={() => removeFromCart(product.id)}
                          className="text-slate-400 hover:text-red-600 p-1"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => updateQuantity(product.id, quantity - 1)}
                            className="w-6 h-6 border border-slate-300 bg-white text-slate-700 font-bold rounded-sm flex items-center justify-center hover:bg-slate-100 text-xs"
                          >
                            -
                          </button>
                          <span className="font-mono text-xs px-2 font-semibold">
                            {quantity} {product.unitMeasurement}
                          </span>
                          <button
                            onClick={() => updateQuantity(product.id, quantity + 1)}
                            className="w-6 h-6 border border-slate-300 bg-white text-slate-700 font-bold rounded-sm flex items-center justify-center hover:bg-slate-100 text-xs"
                          >
                            +
                          </button>
                        </div>

                        <div className="text-right">
                          <div className="text-[11px] text-slate-500">
                            ETB {effectivePrice.toLocaleString()} / {product.unitMeasurement}
                            {hasDiscount && (
                              <span className="line-through text-slate-400 ml-1">
                                ETB {product.unitPriceEtb.toLocaleString()}
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-bold font-mono text-amg-navy">
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
            <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-3">
              {/* Promo Code Input */}
              <div className="border border-slate-200 bg-white p-2.5 rounded-sm space-y-2">
                <form onSubmit={handleApplyCoupon} className="flex space-x-1.5">
                  <input
                    type="text"
                    placeholder="Enter Corporate Voucher (e.g. BUILDETHIOPIA10)"
                    value={couponCodeInput}
                    onChange={(e) => setCouponCodeInput(e.target.value)}
                    className="flex-1 border border-slate-300 px-2 py-1 text-xs rounded-sm focus:border-amg-navy outline-none uppercase font-mono"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-sm transition-colors"
                  >
                    Apply
                  </button>
                </form>

                {couponStatus?.error && (
                  <p className="text-[11px] text-red-600 font-medium">{couponStatus.error}</p>
                )}
                {couponStatus?.success && (
                  <p className="text-[11px] text-emerald-700 font-medium">{couponStatus.success}</p>
                )}

                {appliedCoupon && (
                  <div className="flex justify-between items-center bg-blue-50 border border-blue-200 px-2 py-1 rounded-sm text-[11px]">
                    <span className="text-amg-navy font-semibold">
                      Voucher Applied: <span className="font-mono">{appliedCoupon.code}</span>
                    </span>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="text-red-600 hover:underline font-bold text-[10px]"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-1 text-xs">
                {totalSavings > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 p-1.5 rounded-sm">
                    <span>Contractor & Voucher Total Savings:</span>
                    <span className="font-mono">-ETB {totalSavings.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal (Excl. VAT):</span>
                  <span className="font-mono">ETB {subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                {couponDiscountEtb > 0 && (
                  <div className="flex justify-between text-blue-700">
                    <span>Corporate Voucher Discount:</span>
                    <span className="font-mono">-ETB {couponDiscountEtb.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Ethiopian VAT (15%):</span>
                  <span className="font-mono">ETB {tax.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Payable:</span>
                  <span className="font-mono text-amg-red">ETB {total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={openCheckout}
                  className="w-full py-2.5 bg-amg-navy hover:bg-amg-navy-900 text-white font-bold text-xs rounded-sm transition-colors flex items-center justify-center space-x-2"
                >
                  <span>Proceed to Digital Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-center space-x-1.5 text-[11px] text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>PCI-DSS Compliant Localized Gateway Switch</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
