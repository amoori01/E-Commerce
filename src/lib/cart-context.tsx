'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { CartItem, Product } from '@/types';
import { getProductUnitPrice } from '@/lib/constants';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  totalSavings: number;
  tax: number;
  total: number;
  totalCount: number;
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
  isCheckoutOpen: boolean;
  openCheckout: () => void;
  closeCheckout: () => void;
  isRfqOpen: boolean;
  rfqProduct: Product | null;
  openRfq: (product?: Product) => void;
  closeRfq: () => void;
  appliedCoupon: import('@/types').CouponDiscount | null;
  couponDiscountEtb: number;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isRfqOpen, setIsRfqOpen] = useState(false);
  const [rfqProduct, setRfqProduct] = useState<Product | null>(null);

  // Load from local storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('amg_cart_items');
      if (saved) setItems(JSON.parse(saved));
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    try {
      localStorage.setItem('amg_cart_items', JSON.stringify(items));
    } catch (e) {
      console.error(e);
    }
  }, [items]);

  const addToCart = (product: Product, quantity = 1) => {
    if (product.transactionStream === 'assisted_quote') {
      openRfq(product);
      return;
    }

    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      const newQty = existing
        ? existing.quantity + quantity
        : Math.max(quantity, product.moq || 1);

      const effectiveUnitPrice = getProductUnitPrice(product, newQty);

      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: newQty, appliedUnitPriceEtb: effectiveUnitPrice }
            : i
        );
      }
      return [
        ...prev,
        {
          product,
          quantity: newQty,
          appliedUnitPriceEtb: effectiveUnitPrice,
        },
      ];
    });
    setIsCartDrawerOpen(true);
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => {
        if (i.product.id === productId) {
          const effectivePrice = getProductUnitPrice(i.product, quantity);
          return {
            ...i,
            quantity,
            appliedUnitPriceEtb: effectivePrice,
          };
        }
        return i;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const [appliedCoupon, setAppliedCoupon] = useState<import('@/types').CouponDiscount | null>(null);

  // Subtotal calculated with volume tier discounts
  const subtotal = items.reduce((sum, item) => {
    const effectivePrice = item.appliedUnitPriceEtb ?? getProductUnitPrice(item.product, item.quantity);
    return sum + effectivePrice * item.quantity;
  }, 0);

  // Calculate savings compared to baseline unit price
  const baseSubtotal = items.reduce(
    (sum, item) => sum + item.product.unitPriceEtb * item.quantity,
    0
  );
  const volumeSavings = Math.max(0, baseSubtotal - subtotal);

  // Coupon calculation
  let couponDiscountEtb = 0;
  if (appliedCoupon) {
    if (subtotal < appliedCoupon.minOrderValueEtb) {
      // Order fell below coupon threshold
      couponDiscountEtb = 0;
    } else if (appliedCoupon.discountType === 'percentage') {
      const calculated = (subtotal * appliedCoupon.discountValue) / 100;
      couponDiscountEtb = appliedCoupon.maxDiscountEtb
        ? Math.min(calculated, appliedCoupon.maxDiscountEtb)
        : calculated;
    } else {
      couponDiscountEtb = appliedCoupon.discountValue;
    }
  }

  const effectiveSubtotalAfterCoupon = Math.max(0, subtotal - couponDiscountEtb);
  const totalSavings = volumeSavings + couponDiscountEtb;

  const tax = effectiveSubtotalAfterCoupon * 0.15; // 15% Ethiopian VAT
  const total = effectiveSubtotalAfterCoupon + tax;
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const applyCoupon = (code: string) => {
    const normalized = code.trim().toUpperCase();
    const { INITIAL_COUPONS } = require('@/lib/constants');
    const found = INITIAL_COUPONS.find((c: import('@/types').CouponDiscount) => c.code === normalized);
    if (!found) {
      return { success: false, message: 'Invalid corporate voucher or promo code.' };
    }
    if (subtotal < found.minOrderValueEtb) {
      return {
        success: false,
        message: `Voucher requires a minimum order volume of ETB ${found.minOrderValueEtb.toLocaleString()}.`,
      };
    }
    setAppliedCoupon(found);
    return { success: true, message: `Coupon ${found.code} successfully applied.` };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const openCheckout = () => {
    setIsCartDrawerOpen(false);
    setIsCheckoutOpen(true);
  };

  const closeCheckout = () => {
    setIsCheckoutOpen(false);
  };

  const openRfq = (product?: Product) => {
    setRfqProduct(product || null);
    setIsRfqOpen(true);
  };

  const closeRfq = () => {
    setIsRfqOpen(false);
    setRfqProduct(null);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        subtotal,
        totalSavings,
        tax,
        total,
        totalCount,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        isCheckoutOpen,
        openCheckout,
        closeCheckout,
        isRfqOpen,
        rfqProduct,
        openRfq,
        closeRfq,
        appliedCoupon,
        couponDiscountEtb,
        applyCoupon,
        removeCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
