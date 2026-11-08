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
    <div className="bg-white dark:bg-[#141416] border border-[#E4E4E7] dark:border-[#1F1F24] rounded-2xl shadow-xs p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E4E4E7] dark:border-[#1F1F24] gap-3">
        <div className="flex items-center space-x-2">
          <History className="w-5 h-5 text-[#C6F432]" />
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-serif">
              Warehouse Stock Movement Audit Ledger
            </h3>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
              Chronological ledger of factory intakes, dock stagings, gate clearances &amp; inventory adjustments ({depotName})
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-1.5 border border-[#E4E4E7] dark:border-[#2A2A2E] bg-[#F4F4F5] dark:bg-[#1A1A1D] hover:bg-slate-200 dark:hover:bg-[#222225] text-slate-800 dark:text-white font-bold rounded-xl text-xs transition-all flex items-center space-x-1.5 shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Ledger</span>
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative col-span-2">
          <Search className="w-4 h-4 text-[#71717A] dark:text-[#A1A1AA] absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by SKU, Product Name, Reference Number (GRN/ORD), or Batch #..."
            className="w-full pl-9 pr-3 py-2 border border-[#E4E4E7] dark:border-[#2A2A2E] rounded-xl text-xs bg-[#F4F4F5] dark:bg-[#0E0E10] text-slate-900 dark:text-white focus:outline-none focus:border-[#C6F432]"
          />
        </div>
        <div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full border border-[#E4E4E7] dark:border-[#2A2A2E] rounded-xl px-3 py-2 text-xs bg-[#F4F4F5] dark:bg-[#0E0E10] text-slate-900 dark:text-white focus:outline-none focus:border-[#C6F432] font-medium"
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
      <div className="overflow-x-auto rounded-xl border border-[#E4E4E7] dark:border-[#1F1F24]">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F4F4F5] dark:bg-[#0E0E10] text-[#71717A] dark:text-[#A1A1AA] font-semibold border-b border-[#E4E4E7] dark:border-[#222225]">
            <tr>
              <th className="py-2.5 px-3">Date &amp; Time</th>
              <th className="py-2.5 px-3">Movement Type</th>
              <th className="py-2.5 px-3">Product / SKU</th>
              <th className="py-2.5 px-3">Reference Document</th>
              <th className="py-2.5 px-3 text-right">Quantity Change</th>
              <th className="py-2.5 px-3 text-right">Balance After</th>
              <th className="py-2.5 px-3">Authorized By</th>
              <th className="py-2.5 px-3">Audit Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4E4E7] dark:divide-[#1F1F24] text-slate-700 dark:text-slate-300">
            {filteredMovements.length > 0 ? (
              filteredMovements.map((mv) => {
                const isPositive = mv.quantityChange > 0;
                return (
                  <tr key={mv.id} className="hover:bg-[#F9FAFB] dark:hover:bg-[#18181B]/60 transition-colors">
                    <td className="py-2.5 px-3 whitespace-nowrap text-[#71717A] dark:text-[#A1A1AA] font-mono text-[11px]">
                      {new Date(mv.timestamp).toLocaleDateString()} {new Date(mv.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">{getMovementBadge(mv.movementType)}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900 dark:text-white">{mv.productName}</div>
                      <div className="text-[10px] font-mono text-[#0B0B0C] dark:text-[#C6F432]">
                        {mv.sku} {mv.batchNumber ? `• ${mv.batchNumber}` : ''}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap font-mono font-bold text-slate-800 dark:text-slate-200">
                      {mv.referenceNumber}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-sm whitespace-nowrap">
                      <span className={isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}>
                        {isPositive ? `+${mv.quantityChange}` : mv.quantityChange}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-[#71717A] dark:text-[#A1A1AA] whitespace-nowrap">
                      {mv.balanceAfter.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-800 dark:text-slate-200 font-medium">
                      {mv.performedBy}
                    </td>
                    <td className="py-2.5 px-3 text-[#71717A] dark:text-[#A1A1AA] text-[11px] max-w-xs truncate" title={mv.notes}>
                      {mv.notes || '—'}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="text-center py-8 text-[#71717A] dark:text-[#A1A1AA]">
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
