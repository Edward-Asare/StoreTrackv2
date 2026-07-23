import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { StatsCards } from './components/StatsCards';
import { StockAlertBanner } from './components/StockAlertBanner';
import { SearchFilterBar } from './components/SearchFilterBar';
import { InventoryTable } from './components/InventoryTable';
import { InventoryGrid } from './components/InventoryGrid';
import { AddProductModal } from './components/AddProductModal';
import { EnvInstructionsModal } from './components/EnvInstructionsModal';
import { ConfirmModal } from './components/ConfirmModal';
import { InventoryItem, InventoryStats, ItemFilter, HealthStatus, NewInventoryItemInput } from './types';
import { ShoppingBag, RefreshCw, AlertTriangle, CheckCircle, Trash2, Plus } from 'lucide-react';

export default function App() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<InventoryStats>({
    totalItems: 0,
    totalUnits: 0,
    totalValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    categoriesCount: 0
  });
  const [health, setHealth] = useState<HealthStatus | null>(null);

  const [filter, setFilter] = useState<ItemFilter>({
    search: '',
    category: 'All',
    stockStatus: 'all',
    sortBy: 'itemName',
    sortOrder: 'asc'
  });

  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isEnvGuideOpen, setIsEnvGuideOpen] = useState(false);

  // Confirmation Modal States
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'warning' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Fetch API handlers
  const loadData = useCallback(async (showLoadingSpinner = false) => {
    if (showLoadingSpinner) setIsLoading(true);
    try {
      // Build query string
      const params = new URLSearchParams();
      if (filter.search) params.append('search', filter.search);
      if (filter.category && filter.category !== 'All') params.append('category', filter.category);
      if (filter.stockStatus && filter.stockStatus !== 'all') params.append('stockStatus', filter.stockStatus);
      params.append('sortBy', filter.sortBy);
      params.append('sortOrder', filter.sortOrder);

      const [itemsRes, statsRes, healthRes] = await Promise.all([
        fetch(`/api/inventory?${params.toString()}`),
        fetch('/api/inventory/stats'),
        fetch('/api/health')
      ]);

      if (itemsRes.ok) {
        const fetchedItems = await itemsRes.json();
        setItems(fetchedItems);
      }

      if (statsRes.ok) {
        const fetchedStats = await statsRes.json();
        setStats(fetchedStats);
      }

      if (healthRes.ok) {
        const fetchedHealth = await healthRes.json();
        setHealth(fetchedHealth);
      }
    } catch (err) {
      console.error('Error fetching inventory data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  // Quick Stock Adjustment (+ or - delta)
  const handleStockChange = async (id: string, delta: number) => {
    setUpdatingId(id);

    // Optimistic UI update for snappy response
    setItems(prevItems =>
      prevItems.map(item => {
        if (item._id === id) {
          const newQty = Math.max(0, item.quantity + delta);
          return { ...item, quantity: newQty, lastUpdated: new Date().toISOString() };
        }
        return item;
      })
    );

    try {
      const res = await fetch(`/api/inventory/${id}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta })
      });

      if (res.ok) {
        const updatedItem: InventoryItem = await res.json();
        showToast(
          `Updated "${updatedItem.itemName}" stock to ${updatedItem.quantity} units`,
          updatedItem.quantity <= updatedItem.lowStockThreshold ? 'warning' : 'success'
        );
        // Refresh stats
        loadData(false);
      } else {
        // Rollback on failure
        loadData(false);
        showToast('Failed to update stock', 'warning');
      }
    } catch (err) {
      loadData(false);
      showToast('Server error updating stock', 'warning');
    } finally {
      setUpdatingId(null);
    }
  };

  // Add or Edit Product
  const handleSaveProduct = async (input: NewInventoryItemInput, editId?: string) => {
    if (editId) {
      // Edit existing product
      const res = await fetch(`/api/inventory/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      });
      if (res.ok) {
        showToast(`Product "${input.itemName}" updated successfully!`);
        loadData(false);
      } else {
        throw new Error('Failed to update product');
      }
    } else {
      // Add new product
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      });
      if (res.ok) {
        showToast(`Added new product "${input.itemName}" to inventory!`);
        loadData(false);
      } else {
        throw new Error('Failed to add product');
      }
    }
  };

  // Delete product
  const handleDeleteItem = (id: string, name: string) => {
    setItemToDelete({ id, name });
  };

  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;
    setIsDeletingItem(true);
    try {
      const res = await fetch(`/api/inventory/${itemToDelete.id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        showToast(`Removed "${itemToDelete.name}" from inventory`, 'warning');
        loadData(false);
        setItemToDelete(null);
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || 'Failed to delete item', 'warning');
      }
    } catch (err) {
      showToast('Error connecting to server', 'warning');
    } finally {
      setIsDeletingItem(false);
    }
  };

  // Reset / Seed initial sample provision data
  const handleResetSeed = () => {
    setShowResetConfirm(true);
  };

  const confirmResetSeed = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/inventory/seed', { method: 'POST' });
      if (res.ok) {
        showToast('Inventory reloaded with sample provision items!');
        loadData(false);
        setShowResetConfirm(false);
      }
    } catch (err) {
      showToast('Error resetting inventory', 'warning');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Clear all inventory items
  const handleClearAll = () => {
    setShowClearConfirm(true);
  };

  const confirmClearAll = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/inventory', { method: 'DELETE' });
      if (res.ok) {
        showToast('All inventory items cleared!');
        loadData(false);
        setShowClearConfirm(false);
      } else {
        showToast('Failed to clear inventory', 'warning');
      }
    } catch (err) {
      showToast('Error connecting to server', 'warning');
    } finally {
      setIsRefreshing(false);
    }
  };

  const categoriesInUse = Array.from(new Set(items.map(i => i.category)));

  return (
    <div className="min-h-screen bg-[#fdfdfb] text-stone-800 flex flex-col font-sans">
      
      {/* Top Navbar */}
      <Navbar
        health={health}
        lowStockCount={stats.lowStockCount}
        outOfStockCount={stats.outOfStockCount}
        onOpenAddModal={() => {
          setEditingItem(null);
          setIsAddModalOpen(true);
        }}
        onResetSeed={handleResetSeed}
        onClearAll={handleClearAll}
        onOpenEnvGuide={() => setIsEnvGuideOpen(true)}
        onSelectStockFilter={(status) => setFilter(f => ({ ...f, stockStatus: status }))}
        isRefreshing={isRefreshing}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Toast Alert */}
        {toast && (
          <div className="fixed bottom-5 right-5 z-50 flex items-center space-x-2 px-4 py-3 rounded-2xl bg-stone-900 text-white shadow-2xl border border-stone-800 animate-in slide-in-from-bottom-5">
            {toast.type === 'warning' ? (
              <AlertTriangle className="w-4 h-4 text-orange-400" />
            ) : (
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            )}
            <span className="text-xs font-bold">{toast.message}</span>
          </div>
        )}

        {/* Executive Summary Stats Cards */}
        <StatsCards
          stats={stats}
          activeFilter={filter.stockStatus}
          onSelectFilter={(status) => setFilter(f => ({ ...f, stockStatus: status }))}
          currencySymbol="GH₵"
        />

        {/* Low-Stock Visual Alerts Banner */}
        <StockAlertBanner
          items={items}
          onFilterLowStock={() => setFilter(f => ({ ...f, stockStatus: 'low' }))}
          onQuickAddStock={handleStockChange}
        />

        {/* Search, Filter & View Controls */}
        <SearchFilterBar
          filter={filter}
          onFilterChange={(updated) => setFilter(f => ({ ...f, ...updated }))}
          categories={categoriesInUse}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          totalFilteredCount={items.length}
        />

        {/* Content Table or Grid */}
        {isLoading ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center shadow-sm">
            <RefreshCw className="w-8 h-8 text-emerald-700 animate-spin mx-auto mb-3" />
            <p className="text-sm font-bold text-stone-800">Loading StoreTrack Inventory...</p>
            <p className="text-xs text-stone-400 mt-1">Fetching live products and low-stock alerts</p>
          </div>
        ) : viewMode === 'table' ? (
          <InventoryTable
            items={items}
            onStockChange={handleStockChange}
            onEditItem={(item) => {
              setEditingItem(item);
              setIsAddModalOpen(true);
            }}
            onDeleteItem={handleDeleteItem}
            onOpenAddModal={() => {
              setEditingItem(null);
              setIsAddModalOpen(true);
            }}
            currencySymbol="GH₵"
            isUpdatingId={updatingId}
          />
        ) : (
          <InventoryGrid
            items={items}
            onStockChange={handleStockChange}
            onEditItem={(item) => {
              setEditingItem(item);
              setIsAddModalOpen(true);
            }}
            onDeleteItem={handleDeleteItem}
            onOpenAddModal={() => {
              setEditingItem(null);
              setIsAddModalOpen(true);
            }}
            currencySymbol="GH₵"
            isUpdatingId={updatingId}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-stone-200 py-5 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2 font-semibold text-stone-700">
            <ShoppingBag className="w-4 h-4 text-emerald-700" />
            <span>StoreTrack — Local Provision Shop Inventory Manager</span>
          </div>
          <div className="flex items-center space-x-3 text-stone-400 text-[11px] font-medium">
            <span>Low-Stock Alerts: Configurable per product</span>
            <span>•</span>
            <button
              onClick={() => setIsEnvGuideOpen(true)}
              className="hover:text-emerald-800 underline font-bold"
            >
              MongoDB Atlas URI Status
            </button>
          </div>
        </div>
      </footer>

      {/* Add / Edit Product Modal */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingItem(null);
        }}
        onSubmit={handleSaveProduct}
        onDelete={handleDeleteItem}
        editingItem={editingItem}
        currencySymbol="GH₵"
      />

      {/* MongoDB Environment Setup Guide Modal */}
      <EnvInstructionsModal
        isOpen={isEnvGuideOpen}
        onClose={() => setIsEnvGuideOpen(false)}
        health={health}
        onRefreshHealth={() => {
          loadData(true);
        }}
      />

      {/* Delete Item Confirmation Modal */}
      <ConfirmModal
        isOpen={!!itemToDelete}
        title="Delete Product"
        message={`Are you sure you want to remove "${itemToDelete?.name || 'this item'}" from inventory? This action cannot be undone.`}
        confirmText="Delete Product"
        isDanger={true}
        isLoading={isDeletingItem}
        onClose={() => setItemToDelete(null)}
        onConfirm={confirmDeleteItem}
      />

      {/* Clear All Confirmation Modal */}
      <ConfirmModal
        isOpen={showClearConfirm}
        title="Clear All Inventory"
        message="Are you sure you want to remove ALL products from your inventory? This will reset the stock list to empty."
        confirmText="Clear All Data"
        isDanger={true}
        isLoading={isRefreshing}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={confirmClearAll}
      />

      {/* Reset Seed Confirmation Modal */}
      <ConfirmModal
        isOpen={showResetConfirm}
        title="Load Sample Items"
        message="This will populate your inventory with sample provision shop products (Soft Drinks, Juices, Water, Snacks, etc.). Continue?"
        confirmText="Load Sample Items"
        isDanger={false}
        isLoading={isRefreshing}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={confirmResetSeed}
      />

    </div>
  );
}
