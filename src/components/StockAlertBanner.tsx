import React from 'react';
import { AlertTriangle, AlertOctagon, ArrowRight, CheckCircle2 } from 'lucide-react';
import { InventoryItem } from '../types';

interface StockAlertBannerProps {
  items: InventoryItem[];
  onFilterLowStock: () => void;
  onQuickAddStock: (id: string, delta: number) => void;
}

export const StockAlertBanner: React.FC<StockAlertBannerProps> = ({
  items,
  onFilterLowStock,
  onQuickAddStock
}) => {
  const alertItems = items.filter(
    i => i.quantity <= i.lowStockThreshold
  );

  if (alertItems.length === 0) {
    return null;
  }

  const outOfStockItems = alertItems.filter(i => i.quantity === 0);
  const lowStockItems = alertItems.filter(i => i.quantity > 0);

  return (
    <div className="mb-6 rounded-2xl border border-orange-200 bg-orange-50/70 p-4 sm:p-5 shadow-sm text-stone-800">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        
        <div className="flex items-start space-x-3">
          <div className="p-2.5 rounded-xl bg-orange-200/60 text-orange-800 shrink-0 mt-0.5 md:mt-0">
            {outOfStockItems.length > 0 ? (
              <AlertOctagon className="w-5 h-5 text-red-600 animate-pulse" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-orange-700" />
            )}
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-stone-900 text-sm sm:text-base">
                Low-Stock Alert: {alertItems.length} Product{alertItems.length > 1 ? 's' : ''} Require Attention
              </h3>
              {outOfStockItems.length > 0 && (
                <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-red-600 text-white rounded-full uppercase tracking-wider">
                  {outOfStockItems.length} Out of Stock
                </span>
              )}
            </div>
            
            <p className="text-xs text-stone-600 mt-0.5 font-medium">
              Items highlighted below have fallen below safety limits. Click (+ Restock) to add units instantly.
            </p>

            {/* Quick Chips preview of top alert items */}
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {alertItems.slice(0, 5).map(item => (
                <div
                  key={item._id}
                  className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-xl text-xs font-medium border ${
                    item.quantity === 0
                      ? 'bg-red-100/80 border-red-200 text-red-900'
                      : 'bg-orange-100/80 border-orange-200 text-orange-950'
                  }`}
                >
                  <span className="font-bold text-stone-900">{item.itemName}</span>
                  <span className={`px-1.5 py-0.2 rounded font-extrabold ${item.quantity === 0 ? 'bg-red-600 text-white' : 'bg-orange-600 text-white'}`}>
                    {item.quantity} Left (Limit: {item.lowStockThreshold})
                  </span>
                  <button
                    onClick={() => onQuickAddStock(item._id, 10)}
                    className="hover:underline text-[10px] font-bold text-emerald-800 hover:text-emerald-950 bg-white px-1.5 py-0.5 rounded-lg border border-emerald-300 shadow-2xs"
                    title="Add 10 units"
                  >
                    +10 Restock
                  </button>
                </div>
              ))}
              {alertItems.length > 5 && (
                <span className="text-xs text-stone-500 self-center font-medium">
                  +{alertItems.length - 5} more items
                </span>
              )}
            </div>

          </div>
        </div>

        <button
          onClick={onFilterLowStock}
          className="self-stretch md:self-auto px-4 py-2.5 text-xs font-bold rounded-xl bg-orange-600 hover:bg-orange-700 text-white shadow-sm flex items-center justify-center space-x-1.5 transition-colors whitespace-nowrap"
        >
          <span>View Alert Items</span>
          <ArrowRight className="w-4 h-4" />
        </button>

      </div>
    </div>
  );
};
