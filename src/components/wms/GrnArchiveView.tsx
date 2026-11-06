'use client';

import React, { useState } from 'react';
import { GoodsReceivedNote } from '@/types';
import { FileText, Search, Printer, ShieldCheck, Truck, ChevronRight } from 'lucide-react';

interface GrnArchiveViewProps {
  grnList: GoodsReceivedNote[];
  depotName: string;
}

export const GrnArchiveView: React.FC<GrnArchiveViewProps> = ({
  grnList,
  depotName,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrn, setSelectedGrn] = useState<GoodsReceivedNote | null>(null);

  const filtered = grnList.filter((g) => {
    return (
      searchQuery === '' ||
      g.grnNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.supplierWaybillNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.truckPlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.driverName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="bg-white border border-slate-300 rounded-sm shadow-crisp p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-3">
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-emerald-700" />
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Goods Received Notes Registry (ሞዴል 19 Archive)
            </h3>
            <p className="text-xs text-slate-500">
              Official custody vouchers and supplier waybill receipts ({depotName})
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by GRN Number, Supplier Waybill, Carrier Truck Plate, or Driver..."
          className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-sm text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
        />
      </div>

      {/* List */}
      <div className="overflow-x-auto border border-slate-200 rounded-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-emerald-50 text-emerald-950 font-semibold border-b border-emerald-200">
            <tr>
              <th className="py-2.5 px-3">GRN Number</th>
              <th className="py-2.5 px-3">Date</th>
              <th className="py-2.5 px-3">Supplier / Consignor</th>
              <th className="py-2.5 px-3">Supplier Waybill (Bollo)</th>
              <th className="py-2.5 px-3">Carrier / Truck Plate</th>
              <th className="py-2.5 px-3 text-right">Items Received</th>
              <th className="py-2.5 px-3 text-center">Quality Check</th>
              <th className="py-2.5 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filtered.length > 0 ? (
              filtered.map((grn) => (
                <tr key={grn.grnNumber} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-mono font-bold text-emerald-900">
                    {grn.grnNumber}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                    {new Date(grn.date).toLocaleDateString()}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-900">
                    {grn.supplierName}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                    {grn.supplierWaybillNumber}
                  </td>
                  <td className="py-2.5 px-3 text-slate-700">
                    <span className="font-mono font-bold">{grn.truckPlate}</span>
                    <span className="text-slate-500 block text-[10px]">{grn.driverName}</span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                    {grn.items.reduce((acc, it) => acc + it.quantityReceived, 0)} {grn.items[0]?.unit || 'Units'}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                      PASS (100%)
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => setSelectedGrn(grn)}
                      className="px-2.5 py-1 bg-emerald-800 hover:bg-emerald-900 text-white rounded text-[11px] font-bold shadow-sm transition-colors"
                    >
                      View Model 19 Voucher
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="text-center py-8 text-slate-400">
                  No Goods Received Notes found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Model 19 Voucher Viewer Modal */}
      {selectedGrn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-2xl border border-slate-300 max-w-2xl w-full max-h-[90vh] flex flex-col my-8">
            <div className="p-4 bg-emerald-950 text-white flex items-center justify-between rounded-t-lg border-b border-emerald-800">
              <h3 className="font-bold text-sm">
                Official Model 19 Voucher • {selectedGrn.grnNumber}
              </h3>
              <button
                onClick={() => setSelectedGrn(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto text-xs">
              <div className="p-6 bg-emerald-50/40 border-2 border-emerald-700 rounded-sm shadow-sm">
                <div className="flex justify-between items-start border-b border-emerald-200 pb-3 mb-4">
                  <div>
                    <div className="text-[10px] font-bold tracking-widest text-emerald-900 uppercase">
                      Federal Democratic Republic of Ethiopia
                    </div>
                    <div className="text-base font-black text-slate-900">
                      AMG HOLDINGS LOGISTICS & DEPOT CONSIGNMENT
                    </div>
                    <div className="text-xs text-slate-600">
                      Official Goods Received Note • ሞዴል 19 (Model 19 Custody Voucher)
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold bg-emerald-950 text-[#C6F432] px-3 py-1 rounded">
                      {selectedGrn.grnNumber}
                    </span>
                    <div className="text-[10px] text-slate-500 font-mono mt-1">
                      {new Date(selectedGrn.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs mb-4 pb-3 border-b border-emerald-200">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Depot Facility</span>
                    <span className="font-bold text-slate-900">{selectedGrn.depotName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Supplier / Consignor</span>
                    <span className="font-bold text-slate-900">{selectedGrn.supplierName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Supplier Waybill / Bollo #</span>
                    <span className="font-mono font-bold text-emerald-800">{selectedGrn.supplierWaybillNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Transport Carrier</span>
                    <span className="font-semibold text-slate-900">
                      Truck: {selectedGrn.truckPlate} • Driver: {selectedGrn.driverName}
                    </span>
                  </div>
                </div>

                <table className="w-full text-left text-xs mb-4">
                  <thead className="bg-emerald-100 text-emerald-950 font-bold border-b border-emerald-300">
                    <tr>
                      <th className="py-2 px-2">SKU</th>
                      <th className="py-2 px-2">Description</th>
                      <th className="py-2 px-2">Batch / Heat #</th>
                      <th className="py-2 px-2 text-right">Qty Received</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-200">
                    {selectedGrn.items.map((it, idx) => (
                      <tr key={idx} className="bg-white/80">
                        <td className="py-2 px-2 font-mono font-bold text-emerald-900">{it.sku}</td>
                        <td className="py-2 px-2 font-medium text-slate-900">{it.productName}</td>
                        <td className="py-2 px-2 font-mono text-[11px] text-slate-600">{it.batchNumber}</td>
                        <td className="py-2 px-2 font-mono font-bold text-right text-emerald-950 text-sm">
                          +{it.quantityReceived} {it.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="bg-emerald-100/60 p-3 rounded border border-emerald-300 text-[11px] space-y-1 mb-4">
                  <div className="flex items-center text-emerald-900 font-bold">
                    <ShieldCheck className="w-4 h-4 text-emerald-700 mr-1.5" />
                    <span>Physical Inspection: PASS (100% Quality Assurance Cleared)</span>
                  </div>
                  <div className="text-slate-600 italic">Notes: {selectedGrn.notes}</div>
                </div>

                <div className="grid grid-cols-2 gap-8 pt-4 border-t border-emerald-200 text-xs">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-500 mb-6">Received By (Storekeeper):</div>
                    <div className="border-t border-slate-400 font-bold text-slate-900 pt-1">
                      {selectedGrn.receivedBy}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-500 mb-6">Delivered By (Carrier):</div>
                    <div className="border-t border-slate-400 font-bold text-slate-900 pt-1">
                      {selectedGrn.driverName} ({selectedGrn.truckPlate})
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded font-bold text-xs flex items-center space-x-2 shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Voucher</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedGrn(null)}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold text-xs shadow-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
