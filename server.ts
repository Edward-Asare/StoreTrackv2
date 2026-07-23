import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose, { Schema, Document } from 'mongoose';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import dns from 'dns';

dotenv.config();

try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {
  // Ignore if not supported in node version
}

const appDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const app = express();

app.use(express.json());

// --- Mongoose Schema & Interface ---
export interface IInventoryItem extends Document {
  itemName: string;
  category: string;
  quantity: number;
  price: number;
  lowStockThreshold: number;
  lastUpdated: Date;
  notes?: string;
}

const ItemSchema: Schema = new Schema({
  itemName: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, default: 0, min: 0 },
  price: { type: Number, required: true, default: 0, min: 0 },
  lowStockThreshold: { type: Number, required: true, default: 5, min: 0 },
  lastUpdated: { type: Date, default: Date.now },
  notes: { type: String, default: '' }
});

const InventoryModel = mongoose.model<IInventoryItem>('InventoryItem', ItemSchema);

// --- In-Memory Fallback Engine for instant preview capability ---
interface MemoryItem {
  _id: string;
  itemName: string;
  category: string;
  quantity: number;
  price: number;
  lowStockThreshold: number;
  lastUpdated: Date;
  notes?: string;
}

let isMongoConnected = false;
let memoryStore: MemoryItem[] = [];

// Sample provision shop seed items (available on explicit seed request)
const DEFAULT_SEED_ITEMS = [
  { itemName: 'Coca-Cola 500ml', category: 'Soft Drinks', quantity: 24, price: 1.50, lowStockThreshold: 10, notes: 'Chilled bottle' },
  { itemName: 'Fanta Orange 500ml', category: 'Soft Drinks', quantity: 4, price: 1.50, lowStockThreshold: 8, notes: 'Low stock alert!' },
  { itemName: 'Sprite 500ml', category: 'Soft Drinks', quantity: 18, price: 1.50, lowStockThreshold: 5, notes: 'Plastic bottle' },
  { itemName: 'Ceres Apple Juice 1L', category: 'Juices & Beverages', quantity: 3, price: 3.80, lowStockThreshold: 6, notes: 'Needs restocking' },
  { itemName: 'Don Simon Orange Juice 1L', category: 'Juices & Beverages', quantity: 12, price: 3.50, lowStockThreshold: 5, notes: '100% pure juice' },
  { itemName: 'Voltic Mineral Water 1.5L', category: 'Mineral Water', quantity: 35, price: 1.00, lowStockThreshold: 12, notes: 'Best seller' },
  { itemName: 'Sachet Water Pack (30s)', category: 'Mineral Water', quantity: 2, price: 2.50, lowStockThreshold: 5, notes: 'Critical low stock' },
  { itemName: 'Pringles Original 165g', category: 'Snacks & Biscuits', quantity: 8, price: 2.80, lowStockThreshold: 4, notes: 'Potato chips' },
  { itemName: 'Digestive Biscuits 200g', category: 'Snacks & Biscuits', quantity: 15, price: 1.20, lowStockThreshold: 5, notes: 'Crispy wheat' },
  { itemName: 'Ideal Evaporated Milk 160g', category: 'Dairy & Milk', quantity: 1, price: 1.10, lowStockThreshold: 10, notes: 'Almost out of stock' },
  { itemName: 'Peak Powdered Milk 400g', category: 'Dairy & Milk', quantity: 14, price: 4.50, lowStockThreshold: 5, notes: 'Tin pack' },
  { itemName: 'Corn Flakes Cereal 500g', category: 'Cereals & Breakfast', quantity: 9, price: 3.90, lowStockThreshold: 4, notes: 'Breakfast cereal' },
  { itemName: 'Vegetable Cooking Oil 1L', category: 'Cooking Essentials', quantity: 6, price: 4.20, lowStockThreshold: 5, notes: 'Refined palm olein' },
  { itemName: 'Jasmine Fragrant Rice 5kg', category: 'Cooking Essentials', quantity: 11, price: 9.50, lowStockThreshold: 3, notes: 'Long grain' },
  { itemName: 'Antibacterial Bath Soap 100g', category: 'Toiletries & Soaps', quantity: 0, price: 0.90, lowStockThreshold: 6, notes: 'OUT OF STOCK' },
  { itemName: 'Toothpaste Fresh Mint 100g', category: 'Toiletries & Soaps', quantity: 7, price: 1.80, lowStockThreshold: 5, notes: 'Oral care' },
  { itemName: 'Safety Matchboxes (10-Pack)', category: 'General Goods', quantity: 20, price: 0.80, lowStockThreshold: 5, notes: 'Household essentials' }
];

// Clear all items function
async function clearAllInventoryData() {
  memoryStore = [];
  if (isMongoConnected) {
    try {
      await InventoryModel.deleteMany({});
      console.log('Cleared MongoDB inventory data');
    } catch (err) {
      console.error('Failed to clear MongoDB items:', err);
    }
  }
}

let cachedConnPromise: Promise<void> | null = null;
let lastMongoError: string | null = null;

// Database Connection Manager
async function initDatabase() {
  if (mongoose.connection.readyState === 1) {
    isMongoConnected = true;
    lastMongoError = null;
    return;
  }
  if (isMongoConnected) return;
  if (cachedConnPromise) return cachedConnPromise;

  const mongoUri = process.env.MONGODB_URI;
  if (mongoUri && mongoUri.trim() !== '' && mongoUri !== 'MY_MONGODB_URI') {
    cachedConnPromise = (async () => {
      try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
        isMongoConnected = true;
        lastMongoError = null;
        console.log('Successfully connected to MongoDB!');
      } catch (err: any) {
        let errMsg = err?.message || String(err);
        if (errMsg.includes('querySrv') && mongoUri.startsWith('mongodb+srv://')) {
          console.warn('Local DNS SRV query failed. Retrying with Google/Cloudflare public DNS (8.8.8.8, 1.1.1.1)...');
          try {
            dns.setServers(['8.8.8.8', '1.1.1.1']);
            await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
            isMongoConnected = true;
            lastMongoError = null;
            console.log('Successfully connected to MongoDB via Public DNS!');
            return;
          } catch (retryErr: any) {
            errMsg = retryErr?.message || String(retryErr);
            console.warn('Public DNS retry failed:', errMsg);
          }
        }
        console.warn('MongoDB connection failed. StoreTrack will safely fall back to local memory store:', errMsg);
        isMongoConnected = false;
        lastMongoError = errMsg;
      } finally {
        cachedConnPromise = null;
      }
    })();
    return cachedConnPromise;
  } else {
    console.log('No MONGODB_URI configured. Running StoreTrack in local memory engine.');
    isMongoConnected = false;
    lastMongoError = null;
  }
}

// Auto-connect to MongoDB for serverless API requests (e.g. Vercel)
app.use('/api', async (req: Request, res: Response, next: NextFunction) => {
  if (mongoose.connection.readyState !== 1 && process.env.MONGODB_URI) {
    await initDatabase();
  }
  next();
});

// --- REST API ENDPOINTS ---

// Health Check & System Status
app.get('/api/health', async (req: Request, res: Response) => {
  let count = memoryStore.length;
  if (isMongoConnected) {
    try {
      count = await InventoryModel.countDocuments();
    } catch (err) {
      count = 0;
    }
  }
  res.json({
    status: 'ok',
    connectedToMongo: isMongoConnected,
    dbMode: isMongoConnected ? 'mongodb' : 'memory',
    itemCount: count,
    hasMongoUri: Boolean(process.env.MONGODB_URI && process.env.MONGODB_URI.trim() !== '' && process.env.MONGODB_URI !== 'MY_MONGODB_URI'),
    isVercel: process.env.VERCEL === '1',
    mongoError: lastMongoError
  });
});

// POST /api/health/connect - Connect or test connection with MongoDB URI
app.post('/api/health/connect', async (req: Request, res: Response) => {
  const customUri = req.body?.mongoUri || process.env.MONGODB_URI;

  if (!customUri || customUri.trim() === '' || customUri === 'MY_MONGODB_URI') {
    return res.status(400).json({
      success: false,
      connectedToMongo: false,
      message: 'Please provide a valid MONGODB_URI connection string.'
    });
  }

  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    console.log('Attempting MongoDB connection with URI...');
    await mongoose.connect(customUri.trim(), { serverSelectionTimeoutMS: 5000 });
    isMongoConnected = true;
    process.env.MONGODB_URI = customUri.trim();

    return res.json({
      success: true,
      connectedToMongo: true,
      dbMode: 'mongodb',
      message: 'Successfully connected to MongoDB Cluster!'
    });
  } catch (err: any) {
    console.warn('MongoDB connection attempt failed:', err.message);
    isMongoConnected = false;
    return res.status(500).json({
      success: false,
      connectedToMongo: false,
      dbMode: 'memory',
      error: err.message || 'Connection failed'
    });
  }
});

// GET /api/inventory - Fetch all items (with optional filter/search)
app.get('/api/inventory', async (req: Request, res: Response) => {
  try {
    const { search, category, stockStatus, sortBy = 'itemName', sortOrder = 'asc' } = req.query;

    let items: any[] = [];
    if (isMongoConnected) {
      items = await InventoryModel.find({}).lean();
    } else {
      items = [...memoryStore];
    }

    // Client-side / In-memory filtering helper
    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      items = items.filter(i =>
        i.itemName.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        (i.notes && i.notes.toLowerCase().includes(q))
      );
    }

    if (category && typeof category === 'string' && category !== 'All') {
      items = items.filter(i => i.category === category);
    }

    if (stockStatus && typeof stockStatus === 'string') {
      if (stockStatus === 'low') {
        items = items.filter(i => i.quantity > 0 && i.quantity <= i.lowStockThreshold);
      } else if (stockStatus === 'out') {
        items = items.filter(i => i.quantity === 0);
      } else if (stockStatus === 'healthy') {
        items = items.filter(i => i.quantity > i.lowStockThreshold);
      }
    }

    // Sorting
    const orderMult = sortOrder === 'desc' ? -1 : 1;
    items.sort((a, b) => {
      const key = sortBy as string;
      if (key === 'itemName' || key === 'category') {
        return (a[key] || '').localeCompare(b[key] || '') * orderMult;
      }
      if (key === 'quantity' || key === 'price' || key === 'lowStockThreshold') {
        return ((a[key] ?? 0) - (b[key] ?? 0)) * orderMult;
      }
      if (key === 'lastUpdated') {
        return (new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime()) * orderMult;
      }
      return 0;
    });

    res.json(items);
  } catch (err) {
    console.error('Error fetching inventory:', err);
    res.status(500).json({ error: 'Failed to fetch inventory items' });
  }
});

// GET /api/inventory/stats - Aggregated inventory metrics
app.get('/api/inventory/stats', async (req: Request, res: Response) => {
  try {
    let items: any[] = [];
    if (isMongoConnected) {
      items = await InventoryModel.find({}).lean();
    } else {
      items = memoryStore;
    }

    const totalItems = items.length;
    let totalUnits = 0;
    let totalValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    const categoriesSet = new Set<string>();

    items.forEach(item => {
      totalUnits += item.quantity;
      totalValue += item.quantity * item.price;
      categoriesSet.add(item.category);
      if (item.quantity === 0) {
        outOfStockCount++;
      } else if (item.quantity <= item.lowStockThreshold) {
        lowStockCount++;
      }
    });

    res.json({
      totalItems,
      totalUnits,
      totalValue: Math.round(totalValue * 100) / 100,
      lowStockCount,
      outOfStockCount,
      categoriesCount: categoriesSet.size
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute inventory statistics' });
  }
});

// POST /api/inventory - Add new product
app.post('/api/inventory', async (req: Request, res: Response) => {
  try {
    const { itemName, category, quantity, price, lowStockThreshold, notes } = req.body;

    if (!itemName || !category) {
      return res.status(400).json({ error: 'Item Name and Category are required.' });
    }

    const parsedQty = Math.max(0, parseInt(quantity ?? 0, 10));
    const parsedPrice = Math.max(0, parseFloat(price ?? 0));
    const parsedThreshold = Math.max(0, parseInt(lowStockThreshold ?? 5, 10));

    const newItemData = {
      itemName: itemName.trim(),
      category: category.trim(),
      quantity: isNaN(parsedQty) ? 0 : parsedQty,
      price: isNaN(parsedPrice) ? 0 : parsedPrice,
      lowStockThreshold: isNaN(parsedThreshold) ? 5 : parsedThreshold,
      notes: notes ? notes.trim() : '',
      lastUpdated: new Date()
    };

    if (isMongoConnected) {
      const createdItem = new InventoryModel(newItemData);
      await createdItem.save();
      return res.status(201).json(createdItem);
    } else {
      const createdItem: MemoryItem = {
        _id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        ...newItemData
      };
      memoryStore.unshift(createdItem);
      return res.status(201).json(createdItem);
    }
  } catch (err) {
    console.error('Error adding inventory item:', err);
    res.status(500).json({ error: 'Failed to create new item' });
  }
});

// PATCH /api/inventory/:id/stock - Quick stock adjustment (Increment / Decrement / Set)
app.patch('/api/inventory/:id/stock', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { delta, quantity } = req.body;

    if (isMongoConnected) {
      const item = await InventoryModel.findById(id);
      if (!item) {
        return res.status(404).json({ error: 'Item not found' });
      }

      if (typeof delta === 'number') {
        item.quantity = Math.max(0, item.quantity + delta);
      } else if (typeof quantity === 'number') {
        item.quantity = Math.max(0, quantity);
      }
      item.lastUpdated = new Date();
      await item.save();
      return res.json(item);
    } else {
      const index = memoryStore.findIndex(i => i._id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'Item not found' });
      }

      if (typeof delta === 'number') {
        memoryStore[index].quantity = Math.max(0, memoryStore[index].quantity + delta);
      } else if (typeof quantity === 'number') {
        memoryStore[index].quantity = Math.max(0, quantity);
      }
      memoryStore[index].lastUpdated = new Date();
      return res.json(memoryStore[index]);
    }
  } catch (err) {
    console.error('Error updating stock level:', err);
    res.status(500).json({ error: 'Failed to update stock quantity' });
  }
});

// PUT /api/inventory/:id - Update complete product details
app.put('/api/inventory/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { itemName, category, quantity, price, lowStockThreshold, notes } = req.body;

    const parsedQty = Math.max(0, parseInt(quantity, 10));
    const parsedPrice = Math.max(0, parseFloat(price));
    const parsedThreshold = Math.max(0, parseInt(lowStockThreshold, 10));

    const updateFields = {
      itemName: itemName?.trim(),
      category: category?.trim(),
      quantity: isNaN(parsedQty) ? 0 : parsedQty,
      price: isNaN(parsedPrice) ? 0 : parsedPrice,
      lowStockThreshold: isNaN(parsedThreshold) ? 5 : parsedThreshold,
      notes: notes ? notes.trim() : '',
      lastUpdated: new Date()
    };

    if (isMongoConnected) {
      const updated = await InventoryModel.findByIdAndUpdate(id, updateFields, { new: true });
      if (!updated) return res.status(404).json({ error: 'Item not found' });
      return res.json(updated);
    } else {
      const index = memoryStore.findIndex(i => i._id === id);
      if (index === -1) return res.status(404).json({ error: 'Item not found' });
      
      memoryStore[index] = {
        ...memoryStore[index],
        ...updateFields
      };
      return res.json(memoryStore[index]);
    }
  } catch (err) {
    console.error('Error updating item details:', err);
    res.status(500).json({ error: 'Failed to update item details' });
  }
});

// DELETE /api/inventory - Clear all inventory items
app.delete('/api/inventory', async (req: Request, res: Response) => {
  try {
    if (isMongoConnected) {
      await InventoryModel.deleteMany({});
    }
    memoryStore = [];
    return res.json({ message: 'All temporal data cleared successfully', items: [] });
  } catch (err) {
    console.error('Error clearing inventory:', err);
    res.status(500).json({ error: 'Failed to clear inventory' });
  }
});

// DELETE /api/inventory/:id - Delete item from inventory
app.delete('/api/inventory/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (isMongoConnected) {
      let deleted = null;
      if (mongoose.Types.ObjectId.isValid(id)) {
        deleted = await InventoryModel.findByIdAndDelete(id);
      }
      if (!deleted) {
        deleted = await InventoryModel.findOneAndDelete({ _id: id });
      }
      if (!deleted) {
        // Fallback check memoryStore in case item was added locally
        const index = memoryStore.findIndex(i => i._id === id);
        if (index !== -1) {
          memoryStore.splice(index, 1);
          return res.json({ message: 'Item deleted from memory store', id });
        }
        return res.status(404).json({ error: 'Item not found' });
      }
      return res.json({ message: 'Item deleted successfully', id });
    } else {
      const index = memoryStore.findIndex(i => i._id === id);
      if (index === -1) return res.status(404).json({ error: 'Item not found' });
      
      const removed = memoryStore.splice(index, 1);
      return res.json({ message: 'Item deleted successfully', id, item: removed[0] });
    }
  } catch (err: any) {
    console.error('Error deleting item:', err);
    res.status(500).json({ error: err.message || 'Failed to delete item' });
  }
});

// POST /api/inventory/seed - Reset database with default provision shop items
app.post('/api/inventory/seed', async (req: Request, res: Response) => {
  try {
    if (isMongoConnected) {
      await InventoryModel.deleteMany({});
      const seeded = await InventoryModel.insertMany(DEFAULT_SEED_ITEMS.map(i => ({ ...i, lastUpdated: new Date() })));
      return res.json({ message: 'Reset and seeded MongoDB database', items: seeded });
    } else {
      memoryStore = DEFAULT_SEED_ITEMS.map((item, idx) => ({
        _id: 'item_' + (idx + 1) + '_' + Date.now(),
        ...item,
        lastUpdated: new Date()
      }));
      return res.json({ message: 'Reset and seeded in-memory store', items: memoryStore });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to re-seed inventory' });
  }
});

// --- Start Express Server with Vite Middleware ---
async function startServer() {
  await initDatabase();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`StoreTrack server is running on http://0.0.0.0:${PORT}`);
  });
}

if (process.env.VERCEL !== '1') {
  startServer();
}

export default app;
