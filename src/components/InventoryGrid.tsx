import React from 'react';
import { Plus, Minus, Edit2, Trash2, AlertTriangle, AlertOctagon, RefreshCw, Package } from 'lucide-react';
import { InventoryItem } from '../types';

interface InventoryGridProps {
  items: InventoryItem[];
  onStockChange: (id: string, delta: number) => Promise<void>;
  onEditItem: (item: InventoryItem) => void;
  onDeleteItem: (id: string, name: string) => void;
  onOpenAddModal?: () => void;
  currencySymbol?: string;
  isUpdatingId: string | null;
}

export const InventoryGrid: React.FC<InventoryGridProps> = ({
  items,
  onStockChange,
  onEditItem,
  onDeleteItem,
  onOpenAddModal,
  currencySymbol = 'GH₵',
  isUpdatingId
}) => {
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center shadow-sm">
        <Package className="w-8 h-8 text-emerald-700 mx-auto mb-2" />
        <h3 className="text-base font-bold text-stone-800">Inventory is Empty</h3>
        <p className="text-xs text-stone-500 mt-1 font-medium">No goods found. Click below to add your first provision product.</p>
        {onOpenAddModal && (
          <button
            onClick={onOpenAddModal}
            className="mt-4 inline-flex items-center space-x-1.5 px-5 py-2.5 text-xs font-bold rounded-xl bg-stone-800 hover:bg-emerald-800 text-white shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add First Product</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map((item) => {
        const isOut = item.quantity === 0;
        const isLow = !isOut && item.quantity <= item.lowStockThreshold;
        const isUpdating = isUpdatingId === item._id;

        let cardBorderClass = 'border-stone-200 bg-white hover:border-stone-300';
        if (isOut) {
          cardBorderClass = 'border-red-300 bg-red-50/60 hover:border-red-400';
        } else if (isLow) {
          cardBorderClass = 'border-orange-300 bg-orange-50/60 hover:border-orange-400';
        }

        return (
          <div
            key={item._id}
            className={`rounded-2xl border p-5 shadow-sm flex flex-col justify-between transition-all ${cardBorderClass}`}
          >
            <div>
              {/* Header: Category + Status Badge */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-lg bg-stone-100 text-stone-700 border border-stone-200">
                  {item.category}
                </span>

                {isOut ? (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 text-[10px] font-black bg-red-600 text-white rounded-full uppercase tracking-wider">
                    <AlertOctagon className="w-3 h-3" />
                    <span>Out of Stock</span>
                  </span>
                ) : isLow ? (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 text-[10px] font-black bg-orange-500 text-white rounded-full uppercase tracking-wider">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Low Stock</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-900 rounded-full">
                    Healthy
                  </span>
                )}
              </div>

              {/* Item Name */}
              <h3 className="font-bold text-stone-900 text-base leading-snug mb-1">
                {item.itemName}
              </h3>

              {item.notes && (
                <p className="text-xs text-stone-500 italic mb-2 line-clamp-1">{item.notes}</p>
              )}

              {/* Price & Value info */}
              <div className="flex items-center justify-between text-xs text-stone-600 my-3 pt-2.5 border-t border-stone-100">
                <div>
                  <span className="text-stone-400 text-[10px] uppercase font-bold block tracking-wider">Unit Price</span>
                  <span className="font-bold text-stone-900 text-sm">
                    {currencySymbol}{item.price.toFixed(2)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-stone-400 text-[10px] uppercase font-bold block tracking-wider">Stock Value</span>
                  <span className="font-extrabold text-emerald-900 text-sm">
                    {currencySymbol}{(item.quantity * item.price).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Stock Controls */}
            <div className="pt-3 border-t border-stone-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-stone-500">
                  Current Stock:
                </span>
                <span
                  className={`text-xs font-black px-2.5 py-0.5 rounded-lg border ${
                    isOut
                      ? 'text-red-950 bg-red-100 border-red-200'
                      : isLow
                      ? 'text-orange-950 bg-orange-100 border-orange-200'
                      : 'text-stone-800 bg-stone-100 border-stone-200'
                  }`}
                >
                  {item.quantity} units <span className="text-[10px] font-medium text-stone-500">(Limit: {item.lowStockThreshold})</span>
                </span>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => onStockChange(item._id, -1)}
                  disabled={item.quantity === 0 || isUpdating}
                  className="flex-1 py-1.5 flex items-center justify-center rounded-xl bg-stone-100 hover:bg-red-100 hover:text-red-700 text-stone-700 font-bold text-xs disabled:opacity-30 transition-colors"
                  title="Reduce stock by 1"
                >
                  <Minus className="w-3.5 h-3.5 mr-0.5 stroke-[2.5]" /> -1
                </button>

                <button
                  onClick={() => onStockChange(item._id, 1)}
                  disabled={isUpdating}
                  className="flex-1 py-1.5 flex items-center justify-center rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs transition-colors shadow-2xs"
                  title="Add 1 unit"
                >
                  <Plus className="w-3.5 h-3.5 mr-0.5 stroke-[2.5]" /> +1
                </button>

                <button
                  onClick={() => onStockChange(item._id, 5)}
                  disabled={isUpdating}
                  className="px-2 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-950 font-extrabold text-xs transition-colors"
                  title="Add 5 units"
                >
                  +5
                </button>

                <button
                  onClick={() => onEditItem(item)}
                  className="p-2 text-stone-500 hover:text-emerald-800 hover:bg-emerald-100 rounded-xl"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onDeleteItem(item._id, item.itemName)}
                  className="p-2 text-stone-400 hover:text-red-700 hover:bg-red-100 rounded-xl"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        );
      })}
    </div>
  );
};
