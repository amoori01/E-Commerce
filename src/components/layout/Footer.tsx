'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Award, Landmark, Phone, Mail, MapPin } from 'lucide-react';
import { SUBSIDIARIES, BRANCHES } from '@/lib/constants';

export function Footer() {
  const pathname = usePathname();
  const isManagementWorkspace =
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/branch-admin') ||
    pathname?.startsWith('/agent');

  if (isManagementWorkspace) {
    return (
      <footer className="bg-slate-950 text-slate-500 text-[11px] py-4 border-t border-slate-800 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>AMG Holdings PLC • Internal Operations & ERP Interface</span>
          <div className="flex items-center space-x-3 text-slate-400">
            <span>ISO 29148</span>
            <span>•</span>
            <span>OWASP ASVS v4.0</span>
            <span>•</span>
            <span>PCI-DSS v4.0</span>
            <span>•</span>
            <span>ERCA Tax Compliant</span>
          </div>
        </div>
      </footer>
    );
  }
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800">
      {/* Compliance & Standards Verification Bar */}
      <div className="bg-slate-950 py-4 border-b border-slate-800 text-slate-300">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-amg-red" />
            <span className="font-bold text-white uppercase tracking-wider">
              Enterprise Governance Baseline:
            </span>
            <span className="text-slate-400">
              ISO/IEC/IEEE 29148 • OWASP ASVS v4.0 • PCI-DSS v4.0 • WCAG 2.1 AA
            </span>
          </div>

          <div className="flex items-center space-x-4 text-[11px] text-slate-400">
            <span>National Switch: Chapa • Telebirr • CBE Birr</span>
            <span>•</span>
            <span>Central Tax Authority: ERCA Compliant</span>
          </div>
        </div>
      </div>

      {/* Main Directory Links */}
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Col 1: Corporate Profile */}
        <div className="space-y-3">
          <div className="text-white font-extrabold text-sm tracking-tight flex items-center space-x-2">
            <span className="w-3 h-3 bg-amg-red rounded-none" />
            <span>AMG HOLDINGS PLC</span>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">
            Multi-subsidiary industrial enterprise operating heavy structural steel mills, roofing production lines, commercial Sinotruk transport fleets, cryogenic gas separation plants, and specialty coffee packaging.
          </p>
          <div className="text-[11px] font-mono text-slate-400 space-y-1">
            <div>Tax Identification No (TIN): 0001293847</div>
            <div>Commercial Registration: AA/14/002931/2012</div>
          </div>
        </div>

        {/* Col 2: Subsidiary Companies */}
        <div className="space-y-2">
          <div className="text-white font-bold uppercase tracking-wider text-xs">
            Subsidiary Portfolio
          </div>
          <ul className="space-y-1.5 text-xs">
            {SUBSIDIARIES.map((sub) => (
              <li key={sub.id}>
                <Link
                  href={`/?subsidiary=${sub.slug}#catalog-section`}
                  className="hover:text-white transition-colors"
                >
                  {sub.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 3: Manufacturing & Regional Hubs */}
        <div className="space-y-2">
          <div className="text-white font-bold uppercase tracking-wider text-xs">
            Branch Network & Mills
          </div>
          <ul className="space-y-2 text-[11px]">
            {BRANCHES.map((b) => (
              <li key={b.id} className="border-b border-slate-800 pb-1.5">
                <span className="font-semibold text-slate-300 block">{b.name}</span>
                <span className="text-slate-500 block">{b.address}</span>
                <span className="text-slate-400 font-mono text-[10px]">{b.phone}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 4: Dual Procurement Pipelines */}
        <div className="space-y-3">
          <div className="text-white font-bold uppercase tracking-wider text-xs">
            Procurement Channels
          </div>
          <div className="space-y-2 text-xs">
            <div className="p-2.5 bg-slate-800/80 border border-slate-700 rounded-sm">
              <span className="font-bold text-white text-[11px] block uppercase tracking-wide">
                Stream A: Direct Digital Checkout
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Standard roofing sheets, steel rebars, fasteners, lubricants, and packaged coffee with instant mobile money settlement.
              </p>
            </div>

            <div className="p-2.5 bg-slate-800/80 border border-slate-700 rounded-sm">
              <span className="font-bold text-amg-red text-[11px] block uppercase tracking-wide">
                Stream B: Agent Quotation (RFQ)
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Sinotruk prime movers, heavy pre-engineered steel buildings, and cryogenic bulk gases with dedicated engineering sales agents.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-slate-800 py-4 text-center text-[11px] text-slate-400">
        © 2026 AMG Holdings PLC. All rights reserved. Enterprise Digital Transformation Platform.
      </div>
    </footer>
  );
}
