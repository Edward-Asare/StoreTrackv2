import React, { useState, useEffect } from 'react';
import { X, PackagePlus, Save, AlertTriangle, Trash2 } from 'lucide-react';
import { InventoryItem, NewInventoryItemInput, PROVISION_CATEGORIES } from '../types';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (item: NewInventoryItemInput, editId?: string) => Promise<void>;
  onDelete?: (id: string, name: string) => void;
  editingItem: InventoryItem | null;
  currencySymbol?: string;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  editingItem,
  currencySymbol = 'GH₵'
}) => {
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState<string>(PROVISION_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [quantity, setQuantity] = useState('10');
  const [price, setPrice] = useState('1.50');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (editingItem) {
      setItemName(editingItem.itemName);
      if ((PROVISION_CATEGORIES as readonly string[]).includes(editingItem.category)) {
        setCategory(editingItem.category);
        setIsCustomCategory(false);
      } else {
        setIsCustomCategory(true);
        setCustomCategory(editingItem.category);
      }
      setQuantity(editingItem.quantity.toString());
      setPrice(editingItem.price.toString());
      setLowStockThreshold(editingItem.lowStockThreshold.toString());
      setNotes(editingItem.notes || '');
    } else {
      setItemName('');
      setCategory(PROVISION_CATEGORIES[0]);
      setIsCustomCategory(false);
      setCustomCategory('');
      setQuantity('10');
      setPrice('1.50');
      setLowStockThreshold('5');
      setNotes('');
    }
    setErrorMessage('');
  }, [editingItem, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!itemName.trim()) {
      setErrorMessage('Please enter a product name.');
      return;
    }

    const finalCategory = isCustomCategory ? customCategory.trim() : category;
    if (!finalCategory) {
      setErrorMessage('Please select or specify a product category.');
      return;
    }

    const parsedQty = parseInt(quantity, 10);
    const parsedPrice = parseFloat(price);
    const parsedThreshold = parseInt(lowStockThreshold, 10);

    if (isNaN(parsedQty) || parsedQty < 0) {
      setErrorMessage('Quantity must be a valid non-negative number.');
      return;
    }

    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setErrorMessage('Price must be a valid non-negative number.');
      return;
    }

    if (isNaN(parsedThreshold) || parsedThreshold < 0) {
      setErrorMessage('Low stock threshold must be a valid non-negative number.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        itemName: itemName.trim(),
        category: finalCategory,
        quantity: parsedQty,
        price: parsedPrice,
        lowStockThreshold: parsedThreshold,
        notes: notes.trim()
      }, editingItem?._id);

      setIsSubmitting(false);
      onClose();
    } catch (err) {
      setIsSubmitting(false);
      setErrorMessage('Failed to save product. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-stone-800 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-700 text-white font-bold">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {editingItem ? 'Edit Provision Product' : 'Add New Provision Product'}
              </h2>
              <p className="text-xs text-stone-300">
                {editingItem ? 'Update details, pricing, or alert limits' : 'Enter stock details for drinks, beverages, or general goods'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1 rounded-xl hover:bg-stone-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-900 text-xs flex items-center space-x-2 font-medium">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Product Name */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g., Coca-Cola 500ml, Ceres Apple Juice"
              className="w-full px-4 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-medium"
            />
          </div>

          {/* Category Selector */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                Category <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setIsCustomCategory(!isCustomCategory)}
                className="text-xs font-bold text-emerald-700 hover:underline"
              >
                {isCustomCategory ? 'Select from list' : '+ Custom Category'}
              </button>
            </div>

            {isCustomCategory ? (
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Enter custom category name..."
                className="w-full px-4 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-medium"
              />
            ) : (
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {PROVISION_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Quantity & Price Row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Initial Quantity */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Stock Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Unit Price ({currencySymbol}) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Low Stock Alert Threshold */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Low-Stock Alert Threshold (Units) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              required
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-orange-50 border border-orange-200 rounded-xl text-orange-950 font-bold focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
            />
            <p className="text-[11px] text-stone-500 mt-1 font-medium">
              Highlight item in orange/red when stock reaches or drops below this count (default: 5 units).
            </p>
          </div>

          {/* Notes / Description */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Notes / Location (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Fridge A, Top Shelf, Carton pack"
              className="w-full px-4 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>

          {/* Footer buttons */}
          <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
            {editingItem && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  const item = editingItem;
                  onClose();
                  onDelete(item._id, item.itemName);
                }}
                className="flex items-center space-x-1.5 px-3.5 py-2.5 text-xs font-bold text-red-700 hover:bg-red-50 rounded-xl transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Item</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center space-x-1.5 px-5 py-2.5 text-xs font-bold rounded-xl bg-stone-800 hover:bg-emerald-800 text-white shadow-md shadow-stone-200 transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSubmitting ? 'Saving...' : editingItem ? 'Update Product' : 'Save Product'}</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
