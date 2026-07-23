import React from 'react';
import { Package, AlertTriangle, AlertOctagon, DollarSign, Layers } from 'lucide-react';
import { InventoryStats, StockStatusType } from '../types';

interface StatsCardsProps {
  stats: InventoryStats;
  activeFilter: StockStatusType;
  onSelectFilter: (status: StockStatusType) => void;
  currencySymbol?: string;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  stats,
  activeFilter,
  onSelectFilter,
  currencySymbol = 'GH₵'
}) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      
      {/* Total Products Card */}
      <button
        onClick={() => onSelectFilter('all')}
        className={`p-4 sm:p-5 rounded-2xl text-left border transition-all ${
          activeFilter === 'all'
            ? 'bg-emerald-900 text-white border-emerald-900 ring-2 ring-emerald-600 shadow-md'
            : 'bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className={`text-[10px] uppercase tracking-widest font-extrabold ${activeFilter === 'all' ? 'text-emerald-200' : 'text-stone-400'}`}>
            Total Inventory
          </span>
          <div className={`p-2 rounded-xl ${activeFilter === 'all' ? 'bg-emerald-800 text-emerald-100' : 'bg-stone-100 text-stone-700'}`}>
            <Package className="w-4 h-4" />
          </div>
        </div>
        <div className={`text-2xl sm:text-3xl font-bold ${activeFilter === 'all' ? 'text-white' : 'text-stone-800'}`}>
          {stats.totalItems}{' '}
          <span className={`text-xs font-normal ${activeFilter === 'all' ? 'text-emerald-200' : 'text-stone-400'}`}>items</span>
        </div>
        <div className={`text-xs mt-1.5 flex items-center space-x-1 ${activeFilter === 'all' ? 'text-emerald-200' : 'text-stone-500'}`}>
          <Layers className="w-3 h-3" />
          <span>{stats.totalUnits} units across {stats.categoriesCount} categories</span>
        </div>
      </button>

      {/* Total Stock Value */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200 text-left shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-widest font-extrabold text-stone-400">
            Stock Value
          </span>
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-bold text-emerald-900">
          {currencySymbol}{stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="text-xs text-stone-500 mt-1.5 font-medium">
          Estimated retail value
        </div>
      </div>

      {/* Low-Stock Alert Items */}
      <button
        onClick={() => onSelectFilter('low')}
        className={`p-4 sm:p-5 rounded-2xl text-left border transition-all ${
          activeFilter === 'low'
            ? 'bg-orange-600 text-white border-orange-600 ring-2 ring-orange-500 shadow-md'
            : stats.lowStockCount > 0
            ? 'bg-orange-50 border-orange-200 hover:border-orange-300 hover:bg-orange-100/80 shadow-sm'
            : 'bg-white border-stone-200 hover:bg-stone-50 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className={`text-[10px] uppercase tracking-widest font-extrabold ${
            activeFilter === 'low' ? 'text-orange-100' : 'text-orange-700'
          }`}>
            Low Stock
          </span>
          <div className={`p-2 rounded-xl ${
            activeFilter === 'low' ? 'bg-orange-700 text-white' : 'bg-orange-100 text-orange-700'
          }`}>
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className={`text-2xl sm:text-3xl font-bold ${activeFilter === 'low' ? 'text-white' : 'text-orange-900'}`}>
          {stats.lowStockCount}{' '}
          <span className={`text-xs font-normal ${activeFilter === 'low' ? 'text-orange-100' : 'text-orange-700'}`}>products</span>
        </div>
        <div className={`text-xs mt-1.5 font-semibold ${activeFilter === 'low' ? 'text-orange-100' : 'text-orange-700'}`}>
          {stats.lowStockCount > 0 ? 'Below threshold restock' : 'All stock levels healthy'}
        </div>
      </button>

      {/* Out of Stock Items */}
      <button
        onClick={() => onSelectFilter('out')}
        className={`p-4 sm:p-5 rounded-2xl text-left border transition-all ${
          activeFilter === 'out'
            ? 'bg-red-700 text-white border-red-700 ring-2 ring-red-500 shadow-md'
            : stats.outOfStockCount > 0
            ? 'bg-red-50 border-red-200 hover:border-red-300 hover:bg-red-100/80 shadow-sm'
            : 'bg-white border-stone-200 hover:bg-stone-50 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className={`text-[10px] uppercase tracking-widest font-extrabold ${
            activeFilter === 'out' ? 'text-red-100' : 'text-red-700'
          }`}>
            Out of Stock
          </span>
          <div className={`p-2 rounded-xl ${
            activeFilter === 'out' ? 'bg-red-800 text-white' : 'bg-red-100 text-red-700'
          }`}>
            <AlertOctagon className="w-4 h-4" />
          </div>
        </div>
        <div className={`text-2xl sm:text-3xl font-bold ${activeFilter === 'out' ? 'text-white' : 'text-red-900'}`}>
          {stats.outOfStockCount}{' '}
          <span className={`text-xs font-normal ${activeFilter === 'out' ? 'text-red-100' : 'text-red-700'}`}>products</span>
        </div>
        <div className={`text-xs mt-1.5 font-semibold ${activeFilter === 'out' ? 'text-red-100' : 'text-red-700'}`}>
          {stats.outOfStockCount > 0 ? '0 units remaining' : 'No items sold out'}
        </div>
      </button>

    </div>
  );
};
