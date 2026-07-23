import React from 'react';
import { ShoppingBag, Database, Plus, RefreshCw, AlertTriangle, HelpCircle, Trash2 } from 'lucide-react';
import { HealthStatus } from '../types';

interface NavbarProps {
  health: HealthStatus | null;
  lowStockCount: number;
  outOfStockCount: number;
  onOpenAddModal: () => void;
  onResetSeed: () => void;
  onClearAll: () => void;
  onOpenEnvGuide: () => void;
  onSelectStockFilter: (status: 'all' | 'low' | 'out') => void;
  isRefreshing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  health,
  lowStockCount,
  outOfStockCount,
  onOpenAddModal,
  onResetSeed,
  onClearAll,
  onOpenEnvGuide,
  onSelectStockFilter,
  isRefreshing,
}) => {
  const totalAlerts = lowStockCount + outOfStockCount;

  return (
    <header className="bg-white border-b border-stone-200 text-stone-800 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo & Name */}
        <div className="flex items-center space-x-3">
          <div className="bg-emerald-700 p-2.5 rounded-xl text-white font-bold shadow-md shadow-emerald-700/10 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-emerald-900 font-sans">StoreTrack</h1>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-100/80 text-emerald-900 border border-emerald-200 font-bold">
                Provision Shop
              </span>
            </div>
            <p className="text-xs text-stone-500 hidden sm:block">Beverages, Drinks & Shop Goods Inventory</p>
          </div>
        </div>

        {/* Database & Stock Alert Badges */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* DB Indicator Button */}
          <button
            onClick={onOpenEnvGuide}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs rounded-xl bg-stone-100 hover:bg-stone-200/80 border border-stone-200 text-stone-700 transition-colors"
            title="Database Connection Status (Click for MongoDB Setup)"
          >
            <Database className={`w-3.5 h-3.5 ${health?.connectedToMongo ? 'text-emerald-700' : 'text-orange-600'}`} />
            <span className="hidden md:inline font-semibold">
              {health?.connectedToMongo ? 'MongoDB Atlas' : 'Local Engine'}
            </span>
            <span className={`w-2 h-2 rounded-full ${health?.connectedToMongo ? 'bg-emerald-600 animate-pulse' : 'bg-orange-500'}`} />
            <HelpCircle className="w-3.5 h-3.5 text-stone-400 ml-0.5" />
          </button>

          {/* Quick Alert Filter Badge */}
          {totalAlerts > 0 && (
            <button
              onClick={() => onSelectStockFilter(outOfStockCount > 0 ? 'out' : 'low')}
              className="flex items-center space-x-1.5 px-3 py-2 text-xs rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-800 font-bold transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-orange-600 animate-bounce" />
              <span>{totalAlerts} Alert{totalAlerts > 1 ? 's' : ''}</span>
            </button>
          )}

          {/* Clear All Data */}
          <button
            onClick={onClearAll}
            className="p-2 text-stone-500 hover:text-red-700 bg-stone-100 hover:bg-red-50 border border-stone-200 rounded-xl transition-colors"
            title="Clear All Inventory Items"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Refresh/Reset Demo Data */}
          <button
            onClick={onResetSeed}
            disabled={isRefreshing}
            className="p-2 text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-xl transition-colors"
            title="Load Sample Demo Items"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-700' : ''}`} />
          </button>

          {/* Add New Product Button */}
          <button
            onClick={onOpenAddModal}
            className="flex items-center space-x-1.5 px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-stone-800 hover:bg-emerald-800 text-white shadow-md shadow-stone-200 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Product</span>
          </button>
        </div>

      </div>
    </header>
  );
};
