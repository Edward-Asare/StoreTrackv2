import React, { useState } from 'react';
import { Plus, Minus, Edit2, Trash2, AlertTriangle, AlertOctagon, RefreshCw, CheckCircle } from 'lucide-react';
import { InventoryItem } from '../types';

interface InventoryTableProps {
  items: InventoryItem[];
  onStockChange: (id: string, delta: number) => Promise<void>;
  onEditItem: (item: InventoryItem) => void;
  onDeleteItem: (id: string, name: string) => void;
  onOpenAddModal?: () => void;
  currencySymbol?: string;
  isUpdatingId: string | null;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
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
        <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-3 text-stone-400">
          <AlertTriangle className="w-6 h-6 text-emerald-700" />
        </div>
        <h3 className="text-base font-bold text-stone-800">Inventory is Empty</h3>
        <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1 font-medium">
          No provision products in inventory. Start entering your stock details, drinks, beverages, or general goods!
        </p>
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
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-stone-800 text-stone-200 text-xs font-bold uppercase tracking-wider border-b border-stone-700">
              <th className="py-4 px-4">Item & Category</th>
              <th className="py-4 px-4 text-center">Stock Level</th>
              <th className="py-4 px-4 text-center">Quick Stock Adjust</th>
              <th className="py-4 px-4 text-right">Price</th>
              <th className="py-4 px-4 text-right">Total Value</th>
              <th className="py-4 px-4 text-center">Threshold</th>
              <th className="py-4 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 text-sm">
            {items.map((item) => {
              const isOut = item.quantity === 0;
              const isLow = !isOut && item.quantity <= item.lowStockThreshold;
              const isUpdating = isUpdatingId === item._id;

              // Visual highlight class based on stock condition
              let rowBgClass = 'hover:bg-stone-50 transition-colors';
              if (isOut) {
                rowBgClass = 'bg-red-50/70 hover:bg-red-100/60 transition-colors border-l-4 border-l-red-600';
              } else if (isLow) {
                rowBgClass = 'bg-orange-50/70 hover:bg-orange-100/60 transition-colors border-l-4 border-l-orange-500';
              }

              return (
                <tr key={item._id} className={rowBgClass}>
                  
                  {/* Name & Category */}
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-stone-900 flex items-center space-x-2">
                      <span>{item.itemName}</span>
                      {isOut && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 text-[10px] font-extrabold bg-red-600 text-white rounded-full uppercase tracking-wide">
                          <AlertOctagon className="w-3 h-3" />
                          <span>Out of Stock</span>
                        </span>
                      )}
                      {isLow && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 text-[10px] font-extrabold bg-orange-500 text-white rounded-full uppercase tracking-wide">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Low Stock</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-stone-500 mt-0.5">
                      <span className="px-2.5 py-0.5 bg-stone-100 text-stone-700 rounded-lg font-semibold border border-stone-200">
                        {item.category}
                      </span>
                      {item.notes && <span className="italic text-stone-400 truncate max-w-[180px]">{item.notes}</span>}
                    </div>
                  </td>

                  {/* Stock Level Badge */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <div className="inline-flex flex-col items-center">
                      <span
                        className={`text-base font-extrabold px-3 py-1 rounded-xl border ${
                          isOut
                            ? 'bg-red-100 text-red-950 border-red-200'
                            : isLow
                            ? 'bg-orange-100 text-orange-950 border-orange-200 animate-pulse'
                            : 'bg-emerald-100/80 text-emerald-950 border-emerald-200'
                        }`}
                      >
                        {item.quantity} <span className="text-xs font-medium">units</span>
                      </span>
                      <span className="text-[10px] text-stone-400 mt-1 font-semibold">
                        Limit: {item.lowStockThreshold}
                      </span>
                    </div>
                  </td>

                  {/* Real-time Quick Stock Adjustment Controls */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <div className="inline-flex items-center bg-stone-100 rounded-xl border border-stone-200 p-1 shadow-2xs space-x-1">
                      
                      {/* Sub button -5 */}
                      <button
                        onClick={() => onStockChange(item._id, -5)}
                        disabled={item.quantity === 0 || isUpdating}
                        className="px-2 py-1 text-xs font-bold text-stone-600 hover:text-red-700 hover:bg-red-100 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        title="Reduce by 5"
                      >
                        -5
                      </button>

                      {/* Sub button -1 */}
                      <button
                        onClick={() => onStockChange(item._id, -1)}
                        disabled={item.quantity === 0 || isUpdating}
                        className="p-1 text-stone-700 hover:text-red-700 hover:bg-red-100 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        title="Reduce by 1"
                      >
                        <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>

                      <span className="w-8 text-center text-xs font-bold text-stone-800">
                        {isUpdating ? <RefreshCw className="w-3 h-3 animate-spin mx-auto text-emerald-700" /> : item.quantity}
                      </span>

                      {/* Add button +1 */}
                      <button
                        onClick={() => onStockChange(item._id, 1)}
                        disabled={isUpdating}
                        className="p-1 text-stone-700 hover:text-emerald-800 hover:bg-emerald-100 rounded-lg transition-colors"
                        title="Add 1 unit"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>

                      {/* Add button +5 */}
                      <button
                        onClick={() => onStockChange(item._id, 5)}
                        disabled={isUpdating}
                        className="px-2 py-1 text-xs font-bold text-stone-600 hover:text-emerald-800 hover:bg-emerald-100 rounded-lg transition-colors"
                        title="Add 5 units"
                      >
                        +5
                      </button>

                    </div>
                  </td>

                  {/* Price */}
                  <td className="py-3.5 px-4 text-right font-bold text-stone-800 whitespace-nowrap">
                    {currencySymbol}{item.price.toFixed(2)}
                  </td>

                  {/* Total Stock Value */}
                  <td className="py-3.5 px-4 text-right font-extrabold text-emerald-900 whitespace-nowrap">
                    {currencySymbol}{(item.quantity * item.price).toFixed(2)}
                  </td>

                  {/* Low Stock Limit */}
                  <td className="py-3.5 px-4 text-center font-medium text-stone-500 text-xs">
                    &lt; {item.lowStockThreshold}
                  </td>

                  {/* Actions (Edit / Delete) */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center space-x-1">
                      <button
                        onClick={() => onEditItem(item)}
                        className="p-2 text-stone-500 hover:text-emerald-800 hover:bg-emerald-100 rounded-xl transition-colors"
                        title="Edit Product Details"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteItem(item._id, item.itemName)}
                        className="p-2 text-stone-500 hover:text-red-700 hover:bg-red-100 rounded-xl transition-colors"
                        title="Delete Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
