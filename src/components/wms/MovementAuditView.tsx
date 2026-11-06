'use client';

import React, { useState } from 'react';
import { StockMovementAudit } from '@/types';
import { History, Search, Filter, Printer, Download, ArrowUpRight, ArrowDownLeft, RefreshCw } from 'lucide-react';

interface MovementAuditViewProps {
  movements: StockMovementAudit[];
  depotName: string;
}

export const MovementAuditView: React.FC<MovementAuditViewProps> = ({
  movements,
  depotName,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredMovements = movements.filter((mv) => {
    const matchesFilter = filterType === 'all' || mv.movementType === filterType;
    const matchesSearch =
      searchQuery === '' ||
      mv.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mv.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mv.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (mv.batchNumber && mv.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const getMovementBadge = (type: StockMovementAudit['movementType']) => {
    switch (type) {
      case 'GRN_INTAKE':
        return (
          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded font-bold text-[10px] flex items-center w-fit space-x-1">
            <ArrowDownLeft className="w-3 h-3 text-emerald-700" />
            <span>GRN Factory Intake (ሞዴል 19)</span>
          </span>
        );
      case 'DISPATCH_FULFILLMENT':
        return (
          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-900 border border-indigo-300 rounded font-bold text-[10px] flex items-center w-fit space-x-1">
            <ArrowUpRight className="w-3 h-3 text-indigo-700" />
            <span>Gate Exit Release</span>
          </span>
        );
      case 'PICK_STAGING':
        return (
          <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded font-bold text-[10px] flex items-center w-fit space-x-1">
            <span>Dock Staging Movement</span>
          </span>
        );
      case 'CYCLE_ADJUSTMENT':
        return (
          <span className="px-2 py-0.5 bg-violet-100 text-violet-900 border border-violet-300 rounded font-bold text-[10px] flex items-center w-fit space-x-1">
            <span>Physical Count Audit</span>
          </span>
        );
      case 'DAMAGE_WRITE_OFF':
        return (
          <span className="px-2 py-0.5 bg-red-100 text-red-900 border border-red-300 rounded font-bold text-[10px] flex items-center w-fit space-x-1">
            <span>Damaged Write-Off</span>
          </span>
        );
      default:
        return <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px]">{type}</span>;
    }
  };

  return (
    <div className="bg-white border border-slate-300 rounded-sm shadow-crisp p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-3">
        <div className="flex items-center space-x-2">
          <History className="w-5 h-5 text-emerald-700" />
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Warehouse Stock Movement Audit Ledger
            </h3>
            <p className="text-xs text-slate-500">
              Chronological ledger of factory intakes, dock stagings, gate clearances & inventory adjustments ({depotName})
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-sm text-xs transition-colors flex items-center space-x-1.5 shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Ledger</span>
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by SKU, Product Name, Reference Number (GRN/ORD), or Batch #..."
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-sm text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
          />
        </div>
        <div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full border border-slate-300 rounded-sm px-2.5 py-1.5 text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-600 font-medium"
          >
            <option value="all">All Movement Categories ({movements.length})</option>
            <option value="GRN_INTAKE">GRN Factory Intakes (ሞዴል 19)</option>
            <option value="DISPATCH_FULFILLMENT">Gate Exit Consignments</option>
            <option value="PICK_STAGING">Dock Staging Movements</option>
            <option value="CYCLE_ADJUSTMENT">Physical Count Audits</option>
            <option value="DAMAGE_WRITE_OFF">Damaged Write-Offs</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-emerald-50 text-emerald-950 font-semibold border-b border-emerald-200">
            <tr>
              <th className="py-2.5 px-3">Date & Time</th>
              <th className="py-2.5 px-3">Movement Type</th>
              <th className="py-2.5 px-3">Product / SKU</th>
              <th className="py-2.5 px-3">Reference Document</th>
              <th className="py-2.5 px-3 text-right">Quantity Change</th>
              <th className="py-2.5 px-3 text-right">Balance After</th>
              <th className="py-2.5 px-3">Authorized By</th>
              <th className="py-2.5 px-3">Audit Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredMovements.length > 0 ? (
              filteredMovements.map((mv) => {
                const isPositive = mv.quantityChange > 0;
                return (
                  <tr key={mv.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      {new Date(mv.timestamp).toLocaleDateString()} {new Date(mv.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">{getMovementBadge(mv.movementType)}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{mv.productName}</div>
                      <div className="text-[10px] font-mono text-emerald-800">
                        {mv.sku} {mv.batchNumber ? `• ${mv.batchNumber}` : ''}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap font-mono font-bold text-slate-800">
                      {mv.referenceNumber}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-sm whitespace-nowrap">
                      <span className={isPositive ? 'text-emerald-700' : 'text-slate-900'}>
                        {isPositive ? `+${mv.quantityChange}` : mv.quantityChange}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-600 whitespace-nowrap">
                      {mv.balanceAfter.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-700 font-medium">
                      {mv.performedBy}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 text-[11px] max-w-xs truncate" title={mv.notes}>
                      {mv.notes || '—'}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="text-center py-8 text-slate-400">
                  No stock movements match the selected filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
