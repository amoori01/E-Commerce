'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Eye, Sparkles, Layers, ShoppingBag, ShieldCheck } from 'lucide-react';

interface HoverTargetData {
  title?: string;
  sku?: string;
  price?: string;
  stream?: string;
  badge?: string;
  subsidiary?: string;
}

export function MousePointerInspector() {
  const [coords, setCoords] = useState<{ x: number; y: number }>({ x: -100, y: -100 });
  const [hoverData, setHoverData] = useState<HoverTargetData | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      setIsVisible(false);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;

      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }

      rafId.current = requestAnimationFrame(() => {
        setCoords({ x: clientX, y: clientY });

        // Find nearest element with data-hover attribute
        const target = (e.target as HTMLElement | null)?.closest('[data-hover-title], [data-hover-sku], [data-hover-card]');

        if (target) {
          const title = target.getAttribute('data-hover-title') || undefined;
          const sku = target.getAttribute('data-hover-sku') || undefined;
          const price = target.getAttribute('data-hover-price') || undefined;
          const stream = target.getAttribute('data-hover-stream') || undefined;
          const badge = target.getAttribute('data-hover-badge') || undefined;
          const subsidiary = target.getAttribute('data-hover-subsidiary') || undefined;

          if (title || sku || badge) {
            setHoverData({ title, sku, price, stream, badge, subsidiary });
            setIsVisible(true);
            return;
          }
        }

        setIsVisible(false);
      });
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [enabled]);

  // If HUD is disabled or not pointing at an inspectable element, keep quiet
  if (!enabled || !isVisible || !hoverData) {
    return null;
  }

  // Calculate position to prevent screen edge overflow
  const offsetX = coords.x > window.innerWidth - 260 ? -240 : 18;
  const offsetY = coords.y > window.innerHeight - 100 ? -70 : 18;

  return (
    <div
      className="fixed pointer-events-none z-50 transition-opacity duration-200"
      style={{
        left: `${coords.x + offsetX}px`,
        top: `${coords.y + offsetY}px`,
        opacity: isVisible ? 1 : 0,
      }}
    >
      <div className="bg-[#0B0B0C]/95 dark:bg-[#141416]/95 backdrop-blur-md text-white border border-[#C6F432]/40 shadow-2xl rounded-xl px-3.5 py-2.5 max-w-[240px] text-xs font-sans transform scale-100 transition-transform duration-150">
        <div className="flex items-center justify-between gap-2 border-b border-[#2A2A2E] pb-1.5 mb-1.5">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-[#C6F432] animate-ping" />
            <span className="font-mono text-[9px] uppercase tracking-wider text-[#C6F432] font-bold">
              {hoverData.sku || hoverData.badge || 'AMG Inspect'}
            </span>
          </div>
          {hoverData.stream && (
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#1A1A1D] text-[#A1A1AA] border border-[#2A2A2E]">
              {hoverData.stream === 'direct_checkout' ? 'Direct Checkout' : 'RFQ Assisted'}
            </span>
          )}
        </div>

        {hoverData.title && (
          <div className="font-serif font-bold text-xs text-white line-clamp-1">
            {hoverData.title}
          </div>
        )}

        {hoverData.subsidiary && (
          <div className="text-[10px] text-[#A1A1AA] mt-0.5 truncate">
            {hoverData.subsidiary}
          </div>
        )}

        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-[#222225] text-[10px]">
          {hoverData.price ? (
            <div className="font-mono font-bold text-[#C6F432]">
              {hoverData.price}
            </div>
          ) : (
            <div className="text-[#A1A1AA] flex items-center space-x-1">
              <Eye className="w-3 h-3 text-[#C6F432]" />
              <span>Hovering Item</span>
            </div>
          )}
          <span className="text-[9px] text-[#71717A] bg-[#1A1A1D] px-1.5 py-0.5 rounded">
            Click to open
          </span>
        </div>
      </div>
    </div>
  );
}
