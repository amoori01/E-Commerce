'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Product } from '@/types';

interface WishlistContextType {
  wishlistIds: string[];
  wishlistProducts: Product[];
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
  wishlistCount: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('amg_wishlist_products');
      if (saved) setWishlistProducts(JSON.parse(saved));
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('amg_wishlist_products', JSON.stringify(wishlistProducts));
    } catch (e) {
      console.error(e);
    }
  }, [wishlistProducts]);

  const toggleWishlist = (product: Product) => {
    setWishlistProducts((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        return prev.filter((p) => p.id !== product.id);
      }
      return [...prev, product];
    });
  };

  const isInWishlist = (productId: string) => {
    return wishlistProducts.some((p) => p.id === productId);
  };

  const clearWishlist = () => {
    setWishlistProducts([]);
  };

  const wishlistIds = wishlistProducts.map((p) => p.id);
  const wishlistCount = wishlistProducts.length;

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds,
        wishlistProducts,
        toggleWishlist,
        isInWishlist,
        clearWishlist,
        wishlistCount,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
