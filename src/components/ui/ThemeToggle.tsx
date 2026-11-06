'use client';

import React from 'react';
import { useTheme } from '@/lib/theme-context';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
  variant?: 'compact' | 'expanded';
}

export function ThemeToggle({ className = '', variant = 'compact' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  if (variant === 'expanded') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
          isDark
            ? 'bg-[#141416] text-[#C6F432] border-[#2A2A2E] hover:border-[#C6F432]/60 shadow-xs'
            : 'bg-[#F4F4F5] text-[#0B0B0C] border-[#E4E4E7] hover:border-[#0B0B0C] shadow-xs'
        } ${className}`}
        title={`Current mode: ${theme}. Click to switch.`}
      >
        {isDark ? (
          <>
            <Moon className="w-3.5 h-3.5 text-[#C6F432]" />
            <span>Dark Mode</span>
          </>
        ) : (
          <>
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <span>Light Mode</span>
          </>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className={`relative p-2 rounded-full border transition-all duration-300 flex items-center justify-center ${
        isDark
          ? 'bg-[#141416] text-[#C6F432] border-[#2A2A2E] hover:border-[#C6F432]/60 shadow-[0_0_12px_rgba(198,244,50,0.15)]'
          : 'bg-white text-[#0B0B0C] border-[#E4E4E7] hover:border-[#0B0B0C] shadow-xs'
      } ${className}`}
      title={`Toggle theme (currently ${theme})`}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {isDark ? (
          <Moon className="w-4 h-4 text-[#C6F432] transition-transform duration-300 rotate-0 scale-100" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500 transition-transform duration-300 rotate-0 scale-100" />
        )}
      </div>
    </button>
  );
}
