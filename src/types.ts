export interface InventoryItem {
  _id: string;
  itemName: string;
  category: string;
  quantity: number;
  price: number;
  lowStockThreshold: number;
  lastUpdated: string;
  notes?: string;
}

export interface NewInventoryItemInput {
  itemName: string;
  category: string;
  quantity: number;
  price: number;
  lowStockThreshold: number;
  notes?: string;
}

export interface InventoryStats {
  totalItems: number;
  totalUnits: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  categoriesCount: number;
}

export type StockStatusType = 'all' | 'low' | 'out' | 'healthy';

export interface ItemFilter {
  search: string;
  category: string;
  stockStatus: StockStatusType;
  sortBy: 'itemName' | 'quantity' | 'price' | 'lastUpdated' | 'category';
  sortOrder: 'asc' | 'desc';
}

export interface HealthStatus {
  status: string;
  connectedToMongo: boolean;
  dbMode: 'mongodb' | 'memory';
  itemCount: number;
  hasMongoUri?: boolean;
  isVercel?: boolean;
  mongoError?: string | null;
}

export const PROVISION_CATEGORIES = [
  'Soft Drinks',
  'Juices & Beverages',
  'Mineral Water',
  'Snacks & Biscuits',
  'Dairy & Milk',
  'Cereals & Breakfast',
  'Cooking Essentials',
  'Toiletries & Soaps',
  'General Goods'
] as const;
