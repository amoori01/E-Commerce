'use client';

import React, { useState } from 'react';
import { Order } from '@/types';
import { ClipboardList, Warehouse, CheckCircle2, X, Printer, ArrowRight, ShieldCheck } from 'lucide-react';

interface PickListModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onConfirmPickAndStage: (
    orderId: string,
    stagingDock: string,
    pickedBy: string
  ) => void;
}

export const PickListModal: React.FC<PickListModalProps> = ({
  isOpen,
  onClose,
  order,
  onConfirmPickAndStage,
}) => {
  const [selectedDock, setSelectedDock] = useState('Loading Dock 02 (Heavy Crane & Rebar Staging)');
  const [pickerName, setPickerName] = useState('Dawit Mekonnen (Lead Forklift Operator)');
  const [isTallyChecked, setIsTallyChecked] = useState(true);
  const [pickedItems, setPickedItems] = useState<{ [sku: string]: boolean }>({});

  if (!isOpen || !order) return null;

  const toggleItemPicked = (sku: string) => {
    setPickedItems((prev) => ({
      ...prev,
      [sku]: !prev[sku],
    }));
  };

  const allItemsChecked =
    order.items.length === 0 ||
    order.items.every((it) => pickedItems[it.sku] ?? true);

  const handleStageOrder = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmPickAndStage(order.id, selectedDock, pickerName);
    onClose();
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-300 max-w-2xl w-full max-h-[90vh] flex flex-col my-8">
        {/* Header */}
        <div className="p-4 bg-emerald-950 text-white flex items-center justify-between rounded-t-lg border-b border-emerald-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-[#C6F432]/10 rounded border border-[#C6F432]/30 text-[#C6F432]">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                Warehouse Picking List & Dock Staging
                <span className="text-[10px] font-mono bg-emerald-900 text-emerald-200 px-2 py-0.5 rounded border border-emerald-700">
                  Step 1 & 2 of Physical Fulfillment
                </span>
              </h3>
              <p className="text-xs text-emerald-300">
                Pick order items from depot yard bays and stage at dispatch dock for loading
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleStageOrder} className="p-6 overflow-y-auto space-y-5 text-xs text-slate-800">
          {/* Order Header */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded flex flex-col sm:flex-row justify-between gap-3">
            <div>
              <span className="text-[10px] font-mono uppercase font-bold text-slate-500">Order Number</span>
              <div className="text-base font-black text-slate-900 font-mono">{order.orderNumber}</div>
              {(order.quoteNumber || order.orderNumber.includes('RFQ')) && (
                <div className="mt-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    Origin RFQ Deal: {order.quoteNumber || 'RFQ-2026-AMG-00481'}
                  </span>
                </div>
              )}
              <div className="text-xs text-slate-600 font-semibold">{order.customerName} {order.customerCompany ? `(${order.customerCompany})` : ''}</div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-500">Depot Facility</span>
              <div className="text-xs font-bold text-emerald-900">{order.fulfillmentBranchName}</div>
              <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded font-mono text-[10px] font-bold">
                {order.items.length} Product Line{order.items.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Pick Sheet Table */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center space-x-1.5">
                <Warehouse className="w-4 h-4 text-emerald-700" />
                <span>Yard Picking Manifest (Items & Physical Bay Locations)</span>
              </h4>
              <button
                type="button"
                onClick={handlePrint}
                className="text-[11px] text-slate-600 hover:text-slate-900 flex items-center space-x-1 underline"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Pick Ticket</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-emerald-50 text-emerald-950 font-bold border-b border-emerald-200">
                  <tr>
                    <th className="py-2.5 px-3">Tally Check</th>
                    <th className="py-2.5 px-3">SKU & Product</th>
                    <th className="py-2.5 px-3">Allocated Bay / Aisle</th>
                    <th className="py-2.5 px-3 text-right">Required Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {order.items.map((item, idx) => {
                    const isChecked = pickedItems[item.sku] ?? true;
                    return (
                      <tr key={idx} className={isChecked ? 'bg-white' : 'bg-amber-50/50'}>
                        <td className="py-2.5 px-3">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleItemPicked(item.sku)}
                              className="w-4 h-4 text-emerald-700 rounded focus:ring-emerald-500"
                            />
                            <span className="text-[11px] font-bold text-emerald-900">
                              {isChecked ? 'Picked' : 'Pending'}
                            </span>
                          </label>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{item.productName}</div>
                          <div className="font-mono text-[10px] text-slate-500">SKU: {item.sku}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-950 font-mono text-[10px] font-bold rounded border border-emerald-300">
                            Yard Bay 04 • Shed B
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 text-sm">
                          {item.quantity} Units
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Staging Dock Assignment */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-300 rounded space-y-3">
            <h4 className="font-bold text-emerald-950 text-xs uppercase tracking-wider flex items-center space-x-1.5">
              <Warehouse className="w-4 h-4 text-emerald-700" />
              <span>Step 2: Assign Cargo Staging Dock</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Designated Loading Dock
                </label>
                <select
                  value={selectedDock}
                  onChange={(e) => setSelectedDock(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs bg-white font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                >
                  <option value="Loading Dock 01 (Bulk Pallet Staging)">
                    Loading Dock 01 (Bulk Pallet Staging)
                  </option>
                  <option value="Loading Dock 02 (Heavy Crane & Rebar Staging)">
                    Loading Dock 02 (Heavy Crane & Rebar Staging)
                  </option>
                  <option value="Loading Dock 03 (Rapid Dispatch & Light Goods)">
                    Loading Dock 03 (Rapid Dispatch & Light Goods)
                  </option>
                  <option value="Outdoor Yard Bay 04 (Trailer Drive-Through)">
                    Outdoor Yard Bay 04 (Trailer Drive-Through)
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Warehouse Picker / Forklift Operator
                </label>
                <input
                  type="text"
                  required
                  value={pickerName}
                  onChange={(e) => setPickerName(e.target.value)}
                  placeholder="e.g. Dawit Mekonnen"
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>

            <label className="flex items-center space-x-2 text-xs font-bold text-emerald-950 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={isTallyChecked}
                onChange={(e) => setIsTallyChecked(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
              <span>
                Physical Tally Confirmed: All items verified against picking manifest and stacked safely on dock.
              </span>
            </label>
          </div>

          {/* Modal Actions */}
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
              disabled={!allItemsChecked || !isTallyChecked}
              className={`px-5 py-2 rounded font-bold text-xs flex items-center space-x-2 transition-colors shadow-sm ${
                allItemsChecked && isTallyChecked
                  ? 'bg-emerald-800 hover:bg-emerald-900 text-white'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-[#C6F432]" />
              <span>Confirm Picked & Stage at {selectedDock.split(' ')[2] || 'Dock'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
