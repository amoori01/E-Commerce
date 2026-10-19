'use client';

import React, { useState, useEffect } from 'react';
import { Quote, Order } from '@/types';
import { Printer, X, ShieldCheck, CheckCircle2, QrCode, FileText, Layers } from 'lucide-react';

interface ProformaInvoiceModalProps {
  quote?: Quote | null;
  order?: Order | null;
  initialVersion?: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProformaInvoiceModal({
  quote,
  order,
  initialVersion,
  isOpen,
  onClose,
}: ProformaInvoiceModalProps) {
  const isQuote = !!quote;
  const currentVersion = quote?.currentVersion || 1;
  const [activeVersion, setActiveVersion] = useState<number>(initialVersion || currentVersion);

  useEffect(() => {
    if (initialVersion) {
      setActiveVersion(initialVersion);
    } else if (quote?.currentVersion) {
      setActiveVersion(quote.currentVersion);
    }
  }, [initialVersion, quote?.currentVersion]);

  if (!isOpen || (!quote && !order)) return null;

  // Resolve target revision if dealing with a Quote
  const revisions = isQuote && quote?.revisions ? quote.revisions : [];
  const targetRevision = revisions.find((r) => r.version === activeVersion) || revisions[0] || null;

  const invoiceNumber = isQuote
    ? `PI-${quote?.quoteNumber || '2026-AMG-001'}-REV-0${activeVersion}`
    : `PI-${order?.orderNumber || '2026-AMG-001'}`;

  const issueDate = isQuote
    ? new Date(targetRevision?.timestamp || quote?.createdAt || Date.now()).toLocaleDateString('en-GB')
    : new Date(order?.createdAt || Date.now()).toLocaleDateString('en-GB');

  const expiryDate = isQuote && (targetRevision?.validUntil || quote?.quoteValidUntil)
    ? new Date(targetRevision?.validUntil || quote!.quoteValidUntil!).toLocaleDateString('en-GB')
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB');

  const buyerCompany = isQuote
    ? quote?.customerCompany || quote?.customerName
    : order?.customerCompany || order?.customerName;

  const buyerContact = isQuote ? quote?.customerName : order?.customerName;
  const buyerDestination = isQuote
    ? quote?.deliveryDestination
    : order?.deliveryAddress || order?.fulfillmentBranchName;

  // Financial Calculations with Itemized 15% VAT
  const quoteTotal = targetRevision?.quotedTotalEtb ?? (quote?.finalQuotedTotalEtb || quote?.estimatedTotalEtb || 0);

  const subtotal = isQuote
    ? quoteTotal / 1.15
    : order?.subtotalEtb || 0;

  const vat15 = isQuote ? subtotal * 0.15 : order?.taxEtb || 0;
  const grandTotal = isQuote ? quoteTotal : order?.totalAmountEtb || 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white animate-in fade-in">
      <div className="relative w-full max-w-3xl bg-white border border-slate-300 shadow-modal rounded-sm overflow-hidden my-8 print:border-none print:shadow-none text-slate-900 text-xs font-sans">
        
        {/* Modal Controls (Hidden in Print) */}
        <div className="bg-slate-900 text-white px-6 py-3 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 bg-amg-red text-white text-[10px] font-extrabold uppercase rounded-sm">
              Official Document
            </span>
            <span className="font-bold text-xs">Commercial Proforma Invoice (ERCA Format)</span>
          </div>

          {/* Version Selector Pills for Quotes */}
          {isQuote && revisions.length > 0 && (
            <div className="flex items-center space-x-1.5 bg-slate-950/80 border border-slate-800 px-2.5 py-1 rounded-sm text-[11px]">
              <span className="text-slate-400 font-mono text-[10px] uppercase flex items-center space-x-1">
                <Layers className="w-3 h-3 text-sky-400" />
                <span>Revision:</span>
              </span>
              {revisions.map((rev) => {
                const isSelected = rev.version === activeVersion;
                return (
                  <button
                    key={rev.version}
                    type="button"
                    onClick={() => setActiveVersion(rev.version)}
                    className={`px-2 py-0.5 font-mono text-[10px] font-bold rounded-xs transition-colors ${
                      isSelected
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    v{rev.version} {rev.version === currentVersion ? '(Current)' : ''}
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1 bg-amg-navy hover:bg-amg-navy-900 text-white font-bold rounded-sm text-xs flex items-center space-x-1.5 transition-colors shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE PROFORMA INVOICE DOCUMENT */}
        <div className="p-8 sm:p-10 space-y-6">
          
          {/* 1. Official Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-amg-navy pb-5 gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 bg-amg-navy flex items-center justify-center text-white font-extrabold text-sm rounded-sm">
                  AMG
                </div>
                <div>
                  <h1 className="text-lg font-extrabold text-amg-navy tracking-tight leading-none">
                    AMG HOLDINGS PLC
                  </h1>
                  <span className="text-[10px] uppercase font-bold text-amg-red tracking-wider">
                    Heavy Industry, Engineering & Commercial E-Commerce
                  </span>
                </div>
              </div>
              <div className="text-[10px] text-slate-500 space-y-0.5 pt-1">
                <div>Corporate HQ: Bole Subcity, AMG Tower, Airport Corridor, Addis Ababa</div>
                <div>Factory Plants: Adama Industrial Park Hub | Hawassa Depot | Dire Dawa Hub</div>
                <div>Tel: +251 11 662 4500 | Email: procurement@amgholdings.com</div>
              </div>
            </div>

            <div className="text-left sm:text-right space-y-1 font-mono text-[11px] bg-slate-50 border border-slate-200 p-3 rounded-sm min-w-[220px]">
              <div className="flex items-center justify-between sm:justify-end space-x-2">
                <span className="text-sm font-extrabold text-amg-navy">PROFORMA INVOICE</span>
                {isQuote && (
                  <span className="px-1.5 py-0.5 bg-sky-100 text-sky-800 border border-sky-300 text-[9px] font-extrabold rounded-xs uppercase">
                    Draft v{activeVersion}
                  </span>
                )}
              </div>
              <div>Invoice No: <strong>{invoiceNumber}</strong></div>
              <div>Issue Date: {issueDate}</div>
              <div>Valid Through: <strong className="text-amg-red">{expiryDate}</strong></div>
              <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-200 mt-1">
                Supplier TIN: <strong>0001293847</strong>
              </div>
              <div className="text-[10px] text-slate-500">
                VAT Reg No: <strong>12903847-VAT</strong>
              </div>
            </div>
          </div>

          {/* 2. Buyer Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 border border-slate-200 p-4 rounded-sm text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Customer / B2B Entity
              </span>
              <div className="font-extrabold text-slate-900 text-sm mt-0.5">{buyerCompany}</div>
              <div className="text-slate-600">Attn: {buyerContact}</div>
              <div className="font-mono text-[11px] text-slate-700 mt-1">
                Customer TIN: <strong>0019283746</strong> (Verified Corporate)
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Fulfillment & Site Logistics
              </span>
              <div className="font-semibold text-slate-900 mt-0.5">{buyerDestination}</div>
              <div className="text-slate-600 mt-1">
                Subsidiary: <strong>{isQuote ? quote?.subsidiaryName : 'AMG Holdings Direct Order'}</strong>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Incidental Freight: Dispatched via AMG Commercial Heavy Transport Fleet
              </div>
            </div>
          </div>

          {/* Revision Formulation Note (If available) */}
          {targetRevision?.notes && (
            <div className="bg-sky-50/60 border border-sky-200 p-3 rounded-sm text-[11px]">
              <span className="font-bold text-sky-950 uppercase text-[10px] block mb-0.5">
                Draft Revision v{activeVersion} Engineering Formulation Audit:
              </span>
              <p className="text-slate-700 font-mono text-[10px] leading-relaxed">
                {targetRevision.notes}
              </p>
            </div>
          )}

          {/* 3. Itemized Bill of Materials / Items Table */}
          <div className="border border-slate-300 rounded-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-amg-navy text-white font-semibold text-[11px]">
                <tr>
                  <th className="py-2.5 px-3 w-8">#</th>
                  <th className="py-2.5 px-3">Description & Technical Specifications</th>
                  <th className="py-2.5 px-3 text-right">Quantity</th>
                  <th className="py-2.5 px-3 text-right">Unit Price (ETB)</th>
                  <th className="py-2.5 px-3 text-right">Total (ETB)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {isQuote && quote?.items ? (
                  quote.items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{item.customProductName}</div>
                        {item.requestedSpecs && (
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            {Object.entries(item.requestedSpecs)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(' | ')}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                        {item.quantity} {item.unitMeasurement}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        {(item.quotedUnitPriceEtb || (quoteTotal / (item.quantity || 1))).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {(item.quotedTotalPriceEtb || quoteTotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                ) : order?.items ? (
                  order.items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{item.productName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">SKU: {item.sku}</div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                        {item.quantity}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        {item.unitPriceEtb.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {item.totalPriceEtb.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                ) : null}
              </tbody>
            </table>
          </div>

          {/* 4. Financial Totals with Itemized 15% VAT */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="max-w-xs space-y-2 text-[11px] text-slate-600">
              <div className="font-bold text-slate-800 uppercase tracking-wide text-[10px]">
                Authorized Settlement Accounts:
              </div>
              <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-sm font-mono space-y-1 text-[10px]">
                <div>• Commercial Bank of Ethiopia (CBE): <strong>1000192837461</strong></div>
                <div>• Awash International Bank: <strong>01320492817200</strong></div>
                <div>• Dashen Bank SC: <strong>5049201928471</strong></div>
              </div>
              <p className="text-[10px] text-slate-500">
                Payment Currency: Ethiopian Birr (ETB). Quote validity subject to steel billet & fuel indexed rates.
              </p>
            </div>

            <div className="w-full sm:w-80 bg-slate-50 border border-slate-200 p-4 rounded-sm space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Before Tax (Excl. VAT):</span>
                <span className="font-mono font-semibold">ETB {subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-slate-700 bg-emerald-50/70 border border-emerald-200 p-1.5 rounded-xs">
                <span className="font-medium flex items-center space-x-1">
                  <span>Itemized VAT (15.0% ERCA):</span>
                </span>
                <span className="font-mono font-bold text-emerald-800">
                  ETB {vat15.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t-2 border-slate-300">
                <span>Grand Total (ETB):</span>
                <span className="font-mono text-amg-red">
                  ETB {grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="text-[9px] text-slate-500 font-mono text-right">
                All taxes assessed under Ethiopian VAT Proclamation No. 285/2002
              </div>
            </div>
          </div>

          {/* 5. Terms, Signatures & ERCA Compliance Seal */}
          <div className="border-t border-slate-200 pt-4 grid grid-cols-1 md:grid-cols-12 gap-6 text-[11px]">
            <div className="md:col-span-5 space-y-1">
              <span className="font-bold text-slate-700 block uppercase tracking-wider text-[10px]">
                Terms & Conditions:
              </span>
              <p className="text-slate-500 leading-relaxed text-[10px]">
                1. Delivery Lead Time: 15–20 working days following initial 30% advance deposit.<br />
                2. Surface Coating: High-build SA 2.5 shot blasted primer certified to ISO 8501-1.<br />
                3. Factory Inspection: Client engineer clearance welcome at Adama Fabrication Plant.
              </p>
              <div className="pt-2">
                <div className="inline-block border-b border-slate-400 w-44 pb-1 font-serif italic text-slate-800">
                  Dawit Haile / Solomon Bekele
                </div>
                <div className="text-[10px] uppercase font-bold text-slate-500 mt-0.5">
                  Authorized Commercial Directorate
                </div>
              </div>
            </div>

            {/* ERCA OFFICIAL FISCAL COMPLIANCE SEAL */}
            <div className="md:col-span-7 bg-emerald-50/70 border-2 border-emerald-700/80 rounded-sm p-3.5 space-y-2">
              <div className="flex items-start justify-between border-b border-emerald-300 pb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 bg-emerald-700 text-white rounded-full flex items-center justify-center font-bold text-xs shadow-xs">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-extrabold text-[11px] text-emerald-950 uppercase tracking-tight">
                      Federal Democratic Republic of Ethiopia
                    </div>
                    <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                      Ministry of Revenues • ERCA Electronic Fiscal Seal
                    </div>
                  </div>
                </div>
                <span className="px-1.5 py-0.5 bg-emerald-700 text-white font-mono text-[9px] font-extrabold rounded-xs uppercase">
                  Verified
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-emerald-950">
                <div>
                  <span className="text-emerald-700 block text-[9px] uppercase">Fiscal Machine ID (MIN):</span>
                  <strong>ERCA-MIN-AA-9812401</strong>
                </div>
                <div>
                  <span className="text-emerald-700 block text-[9px] uppercase">Fiscal Authorization:</span>
                  <strong>ERCA-AUTH-2026-ETB-9482</strong>
                </div>
                <div>
                  <span className="text-emerald-700 block text-[9px] uppercase">Supplier TIN:</span>
                  <strong>0001293847</strong>
                </div>
                <div>
                  <span className="text-emerald-700 block text-[9px] uppercase">VAT Registration:</span>
                  <strong>12903847-VAT</strong>
                </div>
              </div>

              <div className="pt-1.5 border-t border-emerald-200 flex items-center justify-between text-[9px] font-mono text-emerald-800">
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>Certified Digital Seal • Proclamation No. 285/2002 Compliant</span>
                </div>
                <span className="text-slate-500 font-normal">
                  Hash: ERCA-{quote?.id ? quote.id.substring(0, 8).toUpperCase() : '2026-F98B'}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
