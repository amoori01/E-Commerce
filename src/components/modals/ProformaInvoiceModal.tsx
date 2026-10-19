'use client';

import React from 'react';
import { Quote, Order } from '@/types';
import { Printer, X, Download, ShieldCheck, Building2, CheckCircle2 } from 'lucide-react';

interface ProformaInvoiceModalProps {
  quote?: Quote | null;
  order?: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProformaInvoiceModal({
  quote,
  order,
  isOpen,
  onClose,
}: ProformaInvoiceModalProps) {
  if (!isOpen || (!quote && !order)) return null;

  const isQuote = !!quote;

  const invoiceNumber = isQuote
    ? `PI-${quote?.quoteNumber || '2026-AMG-001'}`
    : `PI-${order?.orderNumber || '2026-AMG-001'}`;

  const issueDate = isQuote
    ? new Date(quote?.createdAt || Date.now()).toLocaleDateString('en-GB')
    : new Date(order?.createdAt || Date.now()).toLocaleDateString('en-GB');

  const expiryDate = isQuote && quote?.quoteValidUntil
    ? new Date(quote.quoteValidUntil).toLocaleDateString('en-GB')
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB');

  const buyerCompany = isQuote
    ? quote?.customerCompany || quote?.customerName
    : order?.customerCompany || order?.customerName;

  const buyerContact = isQuote ? quote?.customerName : order?.customerName;
  const buyerDestination = isQuote
    ? quote?.deliveryDestination
    : order?.deliveryAddress || order?.fulfillmentBranchName;

  const subtotal = isQuote
    ? (quote?.finalQuotedTotalEtb || quote?.estimatedTotalEtb || 0) / 1.15
    : order?.subtotalEtb || 0;

  const vat15 = isQuote ? subtotal * 0.15 : order?.taxEtb || 0;
  const grandTotal = isQuote
    ? (quote?.finalQuotedTotalEtb || quote?.estimatedTotalEtb || 0)
    : order?.totalAmountEtb || 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white animate-in fade-in">
      <div className="relative w-full max-w-3xl bg-white border border-slate-300 shadow-modal rounded-sm overflow-hidden my-8 print:border-none print:shadow-none text-slate-900 text-xs font-sans">
        {/* Modal Controls (Hidden in Print) */}
        <div className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 bg-amg-red text-white text-[10px] font-extrabold uppercase rounded-sm">
              Official Document
            </span>
            <span className="font-bold text-xs">Commercial Proforma Invoice (ERCA Format)</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1 bg-amg-navy hover:bg-amg-navy-900 text-white font-bold rounded-sm text-xs flex items-center space-x-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white"
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

            <div className="text-left sm:text-right space-y-1 font-mono text-[11px] bg-slate-50 border border-slate-200 p-3 rounded-sm">
              <div className="text-sm font-extrabold text-amg-navy">PROFORMA INVOICE</div>
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
                        {(item.quotedUnitPriceEtb || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {(item.quotedTotalPriceEtb || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
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

          {/* 4. Financial Totals */}
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

            <div className="w-full sm:w-72 bg-slate-50 border border-slate-200 p-4 rounded-sm space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (Excl. VAT):</span>
                <span className="font-mono">ETB {subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Ethiopian VAT (15.0%):</span>
                <span className="font-mono">ETB {vat15.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-300">
                <span>Grand Total (ETB):</span>
                <span className="font-mono text-amg-red">
                  ETB {grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* 5. Terms & Signatures */}
          <div className="border-t border-slate-200 pt-4 grid grid-cols-2 gap-8 text-[11px]">
            <div className="space-y-1">
              <span className="font-bold text-slate-700 block uppercase tracking-wider text-[10px]">
                Terms & Conditions:
              </span>
              <p className="text-slate-500 leading-relaxed text-[10px]">
                1. Delivery Lead Time: 15–20 working days following initial 30% advance deposit.<br />
                2. Surface Coating: High-build SA 2.5 shot blasted primer certified to ISO 8501-1.<br />
                3. Factory Inspection: Client engineer clearance welcome at Adama Fabrication Plant.
              </p>
            </div>

            <div className="text-right space-y-4">
              <div className="inline-block border-b border-slate-400 w-48 pb-1 text-center font-serif italic text-slate-800">
                Dawit Haile / Solomon Bekele
              </div>
              <div className="text-[10px] uppercase font-bold text-slate-500">
                Authorized Commercial Directorate • AMG Holdings PLC
              </div>
              <div className="inline-flex items-center space-x-1 text-[10px] text-emerald-700 font-mono font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-sm">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>ERCA Certified Electronic Seal Attached</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
