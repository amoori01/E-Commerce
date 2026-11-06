'use client';

import React, { useState } from 'react';
import { GoodsReceivedNote, InventoryItem } from '@/types';
import { FileText, CheckCircle2, ShieldCheck, Truck, X, Printer } from 'lucide-react';

interface GrnModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetItem: InventoryItem | null;
  depotId: string;
  depotName: string;
  onGrnIssued: (grn: GoodsReceivedNote, updatedQty: number, batchNumber: string) => void;
}

export const GrnModal: React.FC<GrnModalProps> = ({
  isOpen,
  onClose,
  targetItem,
  depotId,
  depotName,
  onGrnIssued,
}) => {
  const [supplierName, setSupplierName] = useState('Mugher Cement Enterprise / AMG Factory Plant');
  const [supplierWaybillNumber, setSupplierWaybillNumber] = useState(
    `WB-${Math.floor(10000 + Math.random() * 90000)}`
  );
  const [truckPlate, setTruckPlate] = useState('ET-3-48192');
  const [driverName, setDriverName] = useState('Hailu Gebremedhin');
  const [driverPhone, setDriverPhone] = useState('+251 91 123 4567');
  const [quantityReceived, setQuantityReceived] = useState<number>(100);
  const [unit, setUnit] = useState('Pcs');
  const [batchNumber, setBatchNumber] = useState(
    `BATCH-2026-MUG-${Math.floor(100 + Math.random() * 900)}`
  );
  const [mfgDate, setMfgDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState('');
  const [millTestCert, setMillTestCert] = useState('MTC-ISO9001-ET-0982');
  const [inspectionPassed, setInspectionPassed] = useState(true);
  const [notes, setNotes] = useState(
    'Cargo arrived with factory tamper seals intact. 100% moisture-free. Packaging uncompromised.'
  );

  const [generatedGrn, setGeneratedGrn] = useState<GoodsReceivedNote | null>(null);

  if (!isOpen || !targetItem) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const grnNumber = `GRN-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newGrn: GoodsReceivedNote = {
      grnNumber,
      date: new Date().toISOString(),
      depotId,
      depotName,
      supplierName,
      supplierWaybillNumber,
      truckPlate,
      driverName,
      driverPhone,
      qualityInspectionPassed: inspectionPassed,
      receivedBy: 'Branch Admin (Depot Yard Inspector)',
      notes,
      items: [
        {
          sku: targetItem.sku,
          productName: targetItem.productName,
          quantityReceived,
          unit,
          batchNumber,
          mfgDate,
          expiryDate: expiryDate || undefined,
          millTestCert: millTestCert || undefined,
        },
      ],
    };

    setGeneratedGrn(newGrn);
    onGrnIssued(newGrn, quantityReceived, batchNumber);
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-300 max-w-2xl w-full max-h-[90vh] flex flex-col my-8">
        {/* Modal Header */}
        <div className="p-4 bg-emerald-950 text-white flex items-center justify-between rounded-t-lg border-b border-emerald-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-[#C6F432]/10 rounded border border-[#C6F432]/30 text-[#C6F432]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                Goods Received Note (GRN) • ሞዴል 19
                <span className="text-[10px] font-mono bg-emerald-900 text-emerald-200 px-2 py-0.5 rounded border border-emerald-700">
                  Model 19 Compliance
                </span>
              </h3>
              <p className="text-xs text-emerald-300">
                Official intake registry for factory consignments entering {depotName}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setGeneratedGrn(null);
              onClose();
            }}
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-800">
          {generatedGrn ? (
            /* OFFICIAL MODEL 19 VOUCHER VIEW */
            <div className="space-y-4">
              <div className="p-6 bg-emerald-50/50 border-2 border-emerald-700 rounded-sm relative shadow-sm print:border-black print:p-2">
                <div className="flex justify-between items-start border-b border-emerald-200 pb-3 mb-4">
                  <div>
                    <div className="text-[11px] font-bold tracking-widest text-emerald-900 uppercase">
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
                      {generatedGrn.grnNumber}
                    </span>
                    <div className="text-[10px] text-slate-500 font-mono mt-1">
                      {new Date(generatedGrn.date).toLocaleDateString()} {new Date(generatedGrn.date).toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs mb-4 pb-3 border-b border-emerald-200">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Depot Facility</span>
                    <span className="font-bold text-slate-900">{generatedGrn.depotName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Supplier / Factory</span>
                    <span className="font-bold text-slate-900">{generatedGrn.supplierName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Supplier Waybill / Bollo #</span>
                    <span className="font-mono font-bold text-emerald-800">{generatedGrn.supplierWaybillNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Transport Carrier</span>
                    <span className="font-semibold text-slate-900">
                      Truck: {generatedGrn.truckPlate} • Driver: {generatedGrn.driverName}
                    </span>
                  </div>
                </div>

                {/* Items Table */}
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
                    {generatedGrn.items.map((it, idx) => (
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

                {/* Quality & Signatures */}
                <div className="bg-emerald-100/60 p-3 rounded border border-emerald-300 text-[11px] space-y-1 mb-4">
                  <div className="flex items-center text-emerald-900 font-bold">
                    <ShieldCheck className="w-4 h-4 text-emerald-700 mr-1.5" />
                    <span>Physical Inspection: PASS (100% Quality Assurance Cleared)</span>
                  </div>
                  <div className="text-slate-600 italic">Notes: {generatedGrn.notes}</div>
                </div>

                <div className="grid grid-cols-2 gap-8 pt-4 border-t border-emerald-200 text-xs">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-500 mb-6">Received By (Storekeeper):</div>
                    <div className="border-t border-slate-400 font-bold text-slate-900 pt-1">
                      {generatedGrn.receivedBy}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-500 mb-6">Delivered By (Carrier):</div>
                    <div className="border-t border-slate-400 font-bold text-slate-900 pt-1">
                      {generatedGrn.driverName} ({generatedGrn.truckPlate})
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded font-bold text-xs flex items-center space-x-2 transition-colors shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Official Model 19 Voucher</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGeneratedGrn(null);
                    onClose();
                  }}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold text-xs transition-colors shadow-sm"
                >
                  Close & Return to Ledger
                </button>
              </div>
            </div>
          ) : (
            /* INTAKE CREATION FORM */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Target Item Brief */}
              <div className="bg-slate-50 border border-slate-200 p-3 rounded flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-emerald-700 uppercase font-bold block">
                    Product Being Received
                  </span>
                  <div className="font-bold text-slate-900 text-sm">{targetItem.productName}</div>
                  <div className="text-[11px] font-mono text-slate-500">
                    SKU: {targetItem.sku} • Current On-Hand: {targetItem.quantityOnHand}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Depot Yard Bay</span>
                  <span className="font-mono text-xs font-bold text-emerald-800">
                    {targetItem.bayLocation || 'Yard Bay 04'}
                  </span>
                </div>
              </div>

              {/* Supplier & Transport Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Manufacturing Supplier / Consignor
                  </label>
                  <select
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  >
                    <option value="Mugher Cement Enterprise / AMG Factory Plant">
                      Mugher Cement Enterprise / AMG Factory Plant
                    </option>
                    <option value="Dangote Cement Ethiopia PLC">Dangote Cement Ethiopia PLC</option>
                    <option value="Akaki Steel Rolling Mill PLC">Akaki Steel Rolling Mill PLC</option>
                    <option value="AMG Heavy Industries Foundry">AMG Heavy Industries Foundry</option>
                    <option value="Habesha Steel Mills PLC">Habesha Steel Mills PLC</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Supplier Waybill / Bollo Number (የጭነት ደረሰኝ)
                  </label>
                  <input
                    type="text"
                    required
                    value={supplierWaybillNumber}
                    onChange={(e) => setSupplierWaybillNumber(e.target.value)}
                    placeholder="e.g. WB-MUG-2026-9812"
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Incoming Truck Plate Number
                  </label>
                  <input
                    type="text"
                    required
                    value={truckPlate}
                    onChange={(e) => setTruckPlate(e.target.value)}
                    placeholder="e.g. ET-3-48192"
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Driver Full Name & Phone
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="text"
                      required
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      placeholder="Driver Name"
                      className="border border-slate-300 rounded px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    />
                    <input
                      type="text"
                      value={driverPhone}
                      onChange={(e) => setDriverPhone(e.target.value)}
                      placeholder="Phone"
                      className="border border-slate-300 rounded px-2 py-1.5 text-xs font-mono bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>
                </div>
              </div>

              {/* Quantity, Batch & Quality Specs */}
              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded space-y-3">
                <div className="font-bold text-emerald-950 text-xs flex items-center justify-between">
                  <span>Batch Specifications & Intake Quantity</span>
                  <div className="space-x-1.5">
                    <button
                      type="button"
                      onClick={() => setQuantityReceived(50)}
                      className="px-2 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded text-[10px] font-bold"
                    >
                      50 Pcs
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuantityReceived(100)}
                      className="px-2 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded text-[10px] font-bold"
                    >
                      100 Pcs
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuantityReceived(500)}
                      className="px-2 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded text-[10px] font-bold"
                    >
                      500 Pcs
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Received Quantity
                    </label>
                    <div className="flex space-x-1">
                      <input
                        type="number"
                        min="1"
                        required
                        value={quantityReceived}
                        onChange={(e) => setQuantityReceived(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs font-mono font-bold bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                      />
                      <select
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        className="border border-slate-300 rounded px-1.5 py-1.5 text-xs bg-white text-slate-700"
                      >
                        <option value="Pcs">Pcs</option>
                        <option value="Bars">Bars</option>
                        <option value="Bags">Bags</option>
                        <option value="Quintals">Qtl</option>
                        <option value="Drums">Drums</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Batch / Heat Number
                    </label>
                    <input
                      type="text"
                      required
                      value={batchNumber}
                      onChange={(e) => setBatchNumber(e.target.value)}
                      placeholder="e.g. BATCH-2026-ETH-982"
                      className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs font-mono bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Mill Test Certificate (MTC)
                    </label>
                    <input
                      type="text"
                      value={millTestCert}
                      onChange={(e) => setMillTestCert(e.target.value)}
                      placeholder="e.g. MTC-ISO9001-ET-0982"
                      className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs font-mono bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Manufacturing Date
                    </label>
                    <input
                      type="date"
                      value={mfgDate}
                      onChange={(e) => setMfgDate(e.target.value)}
                      className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Expiry Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>
                </div>
              </div>

              {/* Inspection Check & Notes */}
              <div>
                <label className="flex items-center space-x-2 text-xs font-bold text-emerald-950 cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    checked={inspectionPassed}
                    onChange={(e) => setInspectionPassed(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <span>
                    Physical Quality Inspection Verified: Seals intact, undamaged packaging, zero moisture
                  </span>
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Inspector remarks or bay stacking instructions..."
                  className="w-full border border-slate-300 rounded p-2 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end items-center space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded text-slate-700 font-bold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded font-bold text-xs flex items-center space-x-2 transition-colors shadow-sm"
                >
                  <FileText className="w-4 h-4 text-[#C6F432]" />
                  <span>Issue Official Model 19 GRN & Update Stock</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
