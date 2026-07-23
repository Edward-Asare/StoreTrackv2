import React from 'react';
import { Search, Filter, LayoutGrid, List, X, ArrowUpDown } from 'lucide-react';
import { ItemFilter, StockStatusType, PROVISION_CATEGORIES } from '../types';

interface SearchFilterBarProps {
  filter: ItemFilter;
  onFilterChange: (updated: Partial<ItemFilter>) => void;
  categories: string[];
  viewMode: 'table' | 'grid';
  onViewModeChange: (mode: 'table' | 'grid') => void;
  totalFilteredCount: number;
}

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  filter,
  onFilterChange,
  categories,
  viewMode,
  onViewModeChange,
  totalFilteredCount
}) => {
  // Combine preset categories with any custom ones in database
  const allCategories = Array.from(new Set([...PROVISION_CATEGORIES, ...categories])).sort();

  return (
    <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm mb-6 space-y-3.5">
      
      {/* Top Row: Search input + View switcher + Sort */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        
        {/* Search Input (matching Design HTML rounded-full stone-100 style) */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filter.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            placeholder="Search inventory by name, category, or note..."
            className="w-full pl-10 pr-8 py-2.5 text-sm bg-stone-100 border-none rounded-full text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
          />
          {filter.search && (
            <button
              onClick={() => onFilterChange({ search: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sort selector */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 px-3.5 py-2 bg-stone-100/80 border border-stone-200 rounded-xl text-xs font-semibold text-stone-700">
            <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />
            <span className="text-stone-400">Sort:</span>
            <select
              value={`${filter.sortBy}-${filter.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-') as [any, any];
                onFilterChange({ sortBy, sortOrder });
              }}
              className="bg-transparent font-bold text-stone-800 focus:outline-none cursor-pointer"
            >
              <option value="itemName-asc">Name (A–Z)</option>
              <option value="itemName-desc">Name (Z–A)</option>
              <option value="quantity-asc">Stock (Low to High)</option>
              <option value="quantity-desc">Stock (High to Low)</option>
              <option value="price-desc">Price (High to Low)</option>
              <option value="price-asc">Price (Low to High)</option>
              <option value="lastUpdated-desc">Recently Updated</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200">
            <button
              onClick={() => onViewModeChange('table')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                viewMode === 'table' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-900'
              }`}
              title="Table Layout"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                viewMode === 'grid' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-900'
              }`}
              title="Grid Cards Layout"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Bottom Row: Category Filter Dropdown & Stock Status Pills */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pt-3 border-t border-stone-100">
        
        {/* Stock Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-extrabold uppercase tracking-widest text-stone-400 mr-1 flex items-center space-x-1">
            <Filter className="w-3 h-3 text-stone-400" />
            <span>Filter:</span>
          </span>

          {(['all', 'low', 'out', 'healthy'] as StockStatusType[]).map((status) => {
            const labels: Record<StockStatusType, string> = {
              all: 'All Goods',
              low: 'Low Stock',
              out: 'Out of Stock',
              healthy: 'Healthy Stock'
            };

            const isSelected = filter.stockStatus === status;

            return (
              <button
                key={status}
                onClick={() => onFilterChange({ stockStatus: status })}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  isSelected
                    ? status === 'low'
                      ? 'bg-orange-500 text-white shadow-xs'
                      : status === 'out'
                      ? 'bg-red-600 text-white shadow-xs'
                      : status === 'healthy'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-emerald-100 text-emerald-900 shadow-xs'
                    : 'bg-stone-100/80 text-stone-600 hover:bg-stone-200/80'
                }`}
              >
                {labels[status]}
              </button>
            );
          })}
        </div>

        {/* Category Dropdown */}
        <div className="flex items-center space-x-2 self-stretch md:self-auto">
          <label className="text-xs font-bold text-stone-400 uppercase tracking-widest whitespace-nowrap">Category:</label>
          <select
            value={filter.category}
            onChange={(e) => onFilterChange({ category: e.target.value })}
            className="px-3.5 py-1.5 text-xs bg-stone-100/80 border border-stone-200 rounded-xl text-stone-800 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer flex-1 md:flex-none"
          >
            <option value="All">All Categories ({allCategories.length})</option>
            {allCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <span className="text-xs text-stone-400 font-medium pl-2 hidden sm:inline">
            {totalFilteredCount} item{totalFilteredCount !== 1 ? 's' : ''}
          </span>
        </div>

      </div>

    </div>
  );
};
