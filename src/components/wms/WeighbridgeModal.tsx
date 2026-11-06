'use client';

import React, { useState } from 'react';
import { Order, WeighbridgeTicket } from '@/types';
import { Scale, CheckCircle2, AlertTriangle, X, Printer, ShieldCheck } from 'lucide-react';

interface WeighbridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onScaleConfirmed: (ticket: WeighbridgeTicket) => void;
}

export const WeighbridgeModal: React.FC<WeighbridgeModalProps> = ({
  isOpen,
  onClose,
  order,
  onScaleConfirmed,
}) => {
  // Estimated cargo weight from order items (e.g. 50 kg per bag, or 25 kg per unit)
  const defaultDeclaredKg = order
    ? order.items.reduce((acc, it) => acc + (it.quantity * 30), 0)
    : 1500;

  const [tareWeightKg, setTareWeightKg] = useState<number>(12400); // Empty truck tare
  const [grossWeightKg, setGrossWeightKg] = useState<number>(12400 + defaultDeclaredKg); // Loaded truck gross
  const [gateNumber, setGateNumber] = useState('Gate 04 (Heavy Axle Scale)');
  const [weighmasterName, setWeighmasterName] = useState('Yonas Wolde (Certified Weighmaster)');
  const [generatedTicket, setGeneratedTicket] = useState<WeighbridgeTicket | null>(null);

  if (!isOpen || !order) return null;

  const netWeightKg = Math.max(0, grossWeightKg - tareWeightKg);
  const varianceKg = netWeightKg - defaultDeclaredKg;
  const variancePercent = defaultDeclaredKg > 0 ? (varianceKg / defaultDeclaredKg) * 100 : 0;
  const isOverloaded = variancePercent > 5; // > 5% tolerance

  const handleIssueScaleTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const ticketNumber = `WB-SCALE-${Math.floor(10000 + Math.random() * 90000)}`;

    const newTicket: WeighbridgeTicket = {
      ticketNumber,
      orderNumber: order.orderNumber,
      gatePassCode: order.gatePassCode || 'GATE-PASS-AUTHORIZED',
      timestamp: new Date().toISOString(),
      gateNumber,
      truckPlate: order.truckPlate || 'AA-3-92018',
      driverName: order.driverName || 'Tewodros Kassahun',
      tareWeightKg,
      grossWeightKg,
      netWeightKg,
      declaredWeightKg: defaultDeclaredKg,
      weightVarianceKg: varianceKg,
      isOverloaded,
      weighmasterName,
    };

    setGeneratedTicket(newTicket);
    onScaleConfirmed(newTicket);
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-300 max-w-xl w-full max-h-[90vh] flex flex-col my-8">
        {/* Header */}
        <div className="p-4 bg-emerald-950 text-white flex items-center justify-between rounded-t-lg border-b border-emerald-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-[#C6F432]/10 rounded border border-[#C6F432]/30 text-[#C6F432]">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                Industrial Weighbridge Scale Terminal
                <span className="text-[10px] font-mono bg-emerald-900 text-emerald-200 px-2 py-0.5 rounded border border-emerald-700">
                  Gate Exit Scale
                </span>
              </h3>
              <p className="text-xs text-emerald-300">
                Gross, Tare & Net cargo weight audit verification
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setGeneratedTicket(null);
              onClose();
            }}
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-800">
          {generatedTicket ? (
            /* OFFICIAL WEIGHBRIDGE SCALE TICKET VIEW */
            <div className="space-y-4">
              <div className="p-5 bg-slate-50 border-2 border-emerald-800 rounded-sm font-mono shadow-sm">
                <div className="text-center border-b border-dashed border-slate-400 pb-3 mb-3">
                  <div className="font-black text-sm tracking-widest text-slate-900">
                    AMG HOLDINGS DEPOT WEIGHBRIDGE SYSTEM
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Electronic Axle Scale • Ethiopian Standards Agency Calibrated
                  </div>
                  <div className="text-xs font-bold text-emerald-900 mt-1">
                    TICKET: {generatedTicket.ticketNumber}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] mb-3 pb-3 border-b border-dashed border-slate-400">
                  <div>
                    <span className="text-slate-500">Order:</span>{' '}
                    <span className="font-bold text-slate-900">{generatedTicket.orderNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Gate Pass:</span>{' '}
                    <span className="font-bold text-slate-900">{generatedTicket.gatePassCode}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Truck Plate:</span>{' '}
                    <span className="font-bold text-slate-900">{generatedTicket.truckPlate}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Driver:</span>{' '}
                    <span className="font-bold text-slate-900">{generatedTicket.driverName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Scale Location:</span>{' '}
                    <span className="font-bold text-slate-900">{generatedTicket.gateNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Time:</span>{' '}
                    <span className="text-slate-900">
                      {new Date(generatedTicket.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                {/* Weights Calculation */}
                <div className="bg-emerald-950 text-white p-3 rounded space-y-1.5 mb-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">GROSS WEIGHT (Loaded):</span>
                    <span className="font-bold">{generatedTicket.grossWeightKg.toLocaleString()} KG</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">TARE WEIGHT (Empty Truck):</span>
                    <span className="font-bold">-{generatedTicket.tareWeightKg.toLocaleString()} KG</span>
                  </div>
                  <div className="border-t border-emerald-700 pt-1 flex justify-between text-sm font-black text-[#C6F432]">
                    <span>NET CARGO WEIGHT:</span>
                    <span>{generatedTicket.netWeightKg.toLocaleString()} KG ({(generatedTicket.netWeightKg / 1000).toFixed(2)} MT)</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[11px] text-slate-600 mb-3">
                  <span>Declared Manifest Weight: {generatedTicket.declaredWeightKg.toLocaleString()} KG</span>
                  <span className={`font-bold ${generatedTicket.isOverloaded ? 'text-red-600' : 'text-emerald-700'}`}>
                    Variance: {generatedTicket.weightVarianceKg >= 0 ? '+' : ''}{generatedTicket.weightVarianceKg} KG
                  </span>
                </div>

                <div className="text-[10px] text-slate-500 text-center border-t border-dashed border-slate-400 pt-2">
                  Certified Weighmaster: <span className="font-bold text-slate-800">{generatedTicket.weighmasterName}</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded font-bold text-xs flex items-center space-x-2 transition-colors shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Scale Ticket</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGeneratedTicket(null);
                    onClose();
                  }}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold text-xs transition-colors shadow-sm"
                >
                  Confirm Gate Clearance
                </button>
              </div>
            </div>
          ) : (
            /* SCALE ENTRY FORM */
            <form onSubmit={handleIssueScaleTicket} className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded flex justify-between items-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Consignment Order</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{order.orderNumber}</span>
                  <div className="text-[11px] text-slate-600">
                    Driver: {order.driverName || 'Tewodros Kassahun'} • Plate: {order.truckPlate || 'AA-3-92018'}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Calculated Manifest</span>
                  <span className="font-mono font-bold text-emerald-800 text-sm">
                    {defaultDeclaredKg.toLocaleString()} KG
                  </span>
                </div>
              </div>

              {/* Weight Inputs */}
              <div className="p-4 bg-emerald-50/60 border border-emerald-300 rounded space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Empty Truck Tare Weight (KG)
                    </label>
                    <input
                      type="number"
                      required
                      min="1000"
                      value={tareWeightKg}
                      onChange={(e) => setTareWeightKg(parseInt(e.target.value) || 0)}
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono font-bold bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    />
                    <span className="text-[10px] text-slate-500">Unladen vehicle scale reading</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Loaded Truck Gross Weight (KG)
                    </label>
                    <input
                      type="number"
                      required
                      min={tareWeightKg}
                      value={grossWeightKg}
                      onChange={(e) => setGrossWeightKg(parseInt(e.target.value) || 0)}
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono font-bold bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    />
                    <span className="text-[10px] text-slate-500">Loaded truck scale reading</span>
                  </div>
                </div>

                {/* Net calculation preview */}
                <div className="bg-emerald-950 text-white p-3 rounded flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-300 block">
                      Calculated Net Cargo Weight
                    </span>
                    <span className="text-lg font-black font-mono text-[#C6F432]">
                      {netWeightKg.toLocaleString()} KG
                    </span>
                    <span className="text-xs text-emerald-300 font-mono ml-2">
                      ({(netWeightKg / 1000).toFixed(2)} Metric Tons)
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase tracking-wider text-slate-300 block">
                      Variance vs Manifest
                    </span>
                    <span
                      className={`text-xs font-mono font-bold ${
                        isOverloaded ? 'text-red-400' : 'text-emerald-300'
                      }`}
                    >
                      {varianceKg >= 0 ? '+' : ''}{varianceKg} KG ({variancePercent.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Scale Gate & Weighmaster */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Weighbridge Gate Terminal
                  </label>
                  <select
                    value={gateNumber}
                    onChange={(e) => setGateNumber(e.target.value)}
                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  >
                    <option value="Gate 04 (Heavy Axle Scale)">Gate 04 (Heavy Axle Scale)</option>
                    <option value="Gate 02 (Bulk Cement Scale)">Gate 02 (Bulk Cement Scale)</option>
                    <option value="Gate 01 (Commercial Weighbridge)">Gate 01 (Commercial Weighbridge)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Certified Weighmaster
                  </label>
                  <input
                    type="text"
                    required
                    value={weighmasterName}
                    onChange={(e) => setWeighmasterName(e.target.value)}
                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
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
                  <Scale className="w-4 h-4 text-[#C6F432]" />
                  <span>Issue Weighbridge Scale Ticket & Authorize Exit</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
