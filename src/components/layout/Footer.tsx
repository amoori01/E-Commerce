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
      <footer className="bg-[#0B0B0C] text-[#71717A] text-[11px] py-4 border-t border-[#1A1A1D] font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>AMG Holdings PLC • Internal Operations & ERP Interface</span>
          <div className="flex items-center space-x-3 text-[#A1A1AA]">
            <span>ISO 29148</span>
            <span>•</span>
            <span>OWASP ASVS v4.0</span>
            <span>•</span>
            <span>PCI-DSS v4.0</span>
            <span>•</span>
            <span className="text-[#C6F432]">ERCA Tax Compliant</span>
          </div>
        </div>
      </footer>
    );
  }
  return (
    <footer className="bg-[#0B0B0C] text-[#A1A1AA] text-xs border-t border-[#1A1A1D]">
      {/* Compliance & Standards Verification Bar */}
      <div className="bg-[#070708] py-4 border-b border-[#1A1A1D] text-[#D4D4D8]">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center space-x-2.5">
            <Shield className="w-4 h-4 text-[#C6F432]" />
            <span className="font-bold text-white uppercase tracking-wider text-[11px]">
              Enterprise Procurement Standard:
            </span>
            <span className="text-[#A1A1AA]">
              CBE Verified Settlement • Multi-Subsidiary Isolation • Real-time Branch Depots
            </span>
          </div>

          <div className="flex items-center space-x-4 text-[11px] text-[#A1A1AA]">
            <span>Bank of Record: Commercial Bank of Ethiopia (CBE)</span>
            <span>•</span>
            <span className="text-[#C6F432] font-semibold">TIN & VAT Regulated</span>
          </div>
        </div>
      </div>

      {/* Main Directory Links */}
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Col 1: Corporate Profile */}
        <div className="space-y-3.5">
          <div className="text-white font-serif font-black text-lg tracking-tight flex items-center space-x-2">
            <span className="w-2.5 h-2.5 bg-[#C6F432] rounded-full inline-block" />
            <span>AMG HOLDINGS</span>
          </div>
          <p className="text-[#A1A1AA] text-xs leading-relaxed font-sans">
            Ethiopia&apos;s leading diversified industrial conglomerate. Heavy structural steel fabrication, pre-engineered buildings, roofing systems, Sinotruk commercial fleets, industrial gases, and premium export coffee.
          </p>
          <div className="text-[11px] text-[#71717A] space-y-1 font-sans">
            <div>Tax Identification (TIN): <span className="text-[#E4E4E7] font-semibold">0001293847</span></div>
            <div>Commercial Registration: <span className="text-[#E4E4E7] font-semibold">AA/14/002931/2012</span></div>
          </div>
        </div>

        {/* Col 2: Subsidiary Companies */}
        <div className="space-y-3">
          <div className="text-white font-semibold text-xs uppercase tracking-wider">
            Subsidiary Portfolio
          </div>
          <ul className="space-y-2 text-xs">
            {SUBSIDIARIES.map((sub) => (
              <li key={sub.id}>
                <Link
                  href={`/?subsidiary=${sub.slug}#catalog-section`}
                  className="text-[#A1A1AA] hover:text-[#C6F432] transition-colors"
                >
                  {sub.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 3: Manufacturing & Regional Hubs */}
        <div className="space-y-3">
          <div className="text-white font-semibold text-xs uppercase tracking-wider">
            Regional Depots & Mills
          </div>
          <ul className="space-y-2.5 text-[11px]">
            {BRANCHES.map((b) => (
              <li key={b.id} className="border-b border-[#1A1A1D] pb-2">
                <div className="font-semibold text-white">{b.name}</div>
                <div className="text-[#71717A] flex items-center space-x-1.5 mt-0.5">
                  <MapPin className="w-3 h-3 text-[#C6F432]" />
                  <span>{b.region} • {b.address}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 4: Dual Stream Model & Support */}
        <div className="space-y-3.5">
          <div className="text-white font-semibold text-xs uppercase tracking-wider">
            Direct & RFQ Channels
          </div>
          <p className="text-[11px] text-[#A1A1AA] leading-relaxed">
            Need custom structural engineering or volume fleet orders? Our sales engineers deliver proforma invoices with full project breakdown.
          </p>
          <div className="space-y-2 pt-1">
            <div className="flex items-center space-x-2 text-xs text-white">
              <Phone className="w-3.5 h-3.5 text-[#C6F432]" />
              <span>+251 11 662 4500 / +251 91 123 4567</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-white">
              <Mail className="w-3.5 h-3.5 text-[#C6F432]" />
              <span>procurement@amgholdings.et</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Copyright */}
      <div className="border-t border-[#1A1A1D] py-4 bg-[#070708] text-[11px] text-[#71717A]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>© {new Date().getFullYear()} AMG Holdings PLC. All rights reserved.</div>
          <div className="flex items-center space-x-4">
            <Link href="/" className="hover:text-white transition-colors">Privacy Policy</Link>
            <span>•</span>
            <Link href="/" className="hover:text-white transition-colors">Terms of Procurement</Link>
            <span>•</span>
            <Link href="/" className="hover:text-white transition-colors">CBE Settlement Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
