import express from 'express';
import http from 'http';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { Server as SocketIOServer } from 'socket.io';
import { localDb } from './src/db/localDb.ts';

const app = express();
const httpServer = http.createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { origin: '*' }
});
const port = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

function appendSqlToFiles(table: string, data: any) {
  try {
    const keys = Object.keys(data).filter(k => data[k] !== undefined);
    const cols = keys.join(', ');
    const vals = keys.map(k => {
      const v = data[k];
      if (v === null || v === undefined) return 'NULL';
      if (typeof v === 'number' || typeof v === 'boolean') return v;
      if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
      return `'${String(v).replace(/'/g, "''")}'`;
    }).join(', ');
    const sqlStatement = `INSERT INTO ${table} (${cols}) VALUES (${vals}) ON CONFLICT DO NOTHING;\n`;
    
    ['database/schema.sql', 'public/schema.sql', 'schema.sql'].forEach(filePath => {
      if (fs.existsSync(filePath)) {
        fs.appendFileSync(filePath, sqlStatement, 'utf8');
      }
    });
  } catch (err) {
    console.error(`Failed to append SQL for table ${table}:`, err);
  }
}

function appendDeleteSqlToFiles(table: string, id: string) {
  try {
    const sqlStatement = `DELETE FROM ${table} WHERE id = '${id.replace(/'/g, "''")}';\n`;
    ['database/schema.sql', 'public/schema.sql', 'schema.sql'].forEach(filePath => {
      if (fs.existsSync(filePath)) {
        fs.appendFileSync(filePath, sqlStatement, 'utf8');
      }
    });
  } catch (err) {
    console.error(`Failed to append DELETE SQL for table ${table}:`, err);
  }
}

function notifyChange(entity: string, action: string, data?: any) {
  io.emit('db_change', { entity, action, data, timestamp: Date.now() });
}

io.on('connection', (socket) => {
  console.log('Real-time client connected:', socket.id);
});

// REST API Routes
// 0. Public Showcase Catalog Products
app.get('/api/catalog-products', (_req, res) => {
  try {
    const items = localDb.getList('catalogProducts');
    res.json(items);
  } catch (err: any) {
    console.error('Failed to fetch catalog products:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch catalog products' });
  }
});

app.post('/api/catalog-products', (req, res) => {
  try {
    const item = req.body;
    if (!item.id) {
      return res.status(400).json({ error: 'Missing catalog product ID' });
    }
    const productData = {
      id: String(item.id),
      name: String(item.name || ''),
      category: String(item.category || 'General'),
      brand: String(item.brand || 'Hitachi'),
      price: Number(item.price) || 0,
      callForPrice: item.callForPrice ? 1 : 0,
      badge: String(item.badge || ''),
      description: String(item.description || ''),
      specs: Array.isArray(item.specs) ? item.specs : [],
      imageUrl: String(item.imageUrl || ''),
      status: String(item.status || 'active'),
      displayOrder: Number(item.displayOrder) || 0,
      createdAt: String(item.createdAt || new Date().toISOString().split('T')[0]),
    };

    const saved = localDb.upsert('catalogProducts', productData);
    appendSqlToFiles('catalog_products', productData);
    notifyChange('catalog_products', 'save', productData);
    res.json(saved);
  } catch (err: any) {
    console.error('Failed to save catalog product:', err);
    res.status(500).json({ error: err.message || 'Failed to save catalog product' });
  }
});

app.delete('/api/catalog-products/:id', (req, res) => {
  try {
    const { id } = req.params;
    localDb.delete('catalogProducts', id);
    appendDeleteSqlToFiles('catalog_products', id);
    notifyChange('catalog_products', 'delete', { id });
    res.json({ success: true });
  } catch (err: any) {
    console.error('Failed to delete catalog product:', err);
    res.status(500).json({ error: err.message || 'Failed to delete catalog product' });
  }
});

// 1. Products (Internal ERP Stock Inventory)
app.get('/api/products', (_req, res) => {
  try {
    const items = localDb.getList('products');
    res.json(items);
  } catch (err: any) {
    console.error('Failed to fetch products:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch products' });
  }
});

app.post('/api/products', (req, res) => {
  try {
    const item = req.body;
    if (!item.id) {
      return res.status(400).json({ error: 'Missing product ID' });
    }
    const productData = {
      id: String(item.id),
      name: String(item.name || ''),
      sku: String(item.sku || ''),
      category: String(item.category || 'General'),
      brand: String(item.brand || 'Hitachi'),
      price: Number(item.price) || 0,
      costPrice: item.costPrice !== undefined ? Number(item.costPrice) : (item.price ? Math.round(Number(item.price) * 0.75) : 0),
      stock: Number(item.stock) || 0,
      unit: String(item.unit || 'Pcs'),
      description: String(item.description || ''),
      specs: Array.isArray(item.specs) ? item.specs : [],
      imageUrl: String(item.imageUrl || ''),
    };

    const saved = localDb.upsert('products', productData);
    appendSqlToFiles('products', productData);
    notifyChange('products', 'save', productData);
    res.json(saved);
  } catch (err: any) {
    console.error('Failed to save product:', err);
    res.status(500).json({ error: err.message || 'Failed to save product' });
  }
});

app.delete('/api/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    localDb.delete('products', id);
    appendDeleteSqlToFiles('products', id);
    notifyChange('products', 'delete', { id });
    res.json({ success: true });
  } catch (err: any) {
    console.error('Failed to delete product:', err);
    res.status(500).json({ error: err.message || 'Failed to delete product' });
  }
});

// 2. Customers
app.get('/api/customers', (_req, res) => {
  try {
    const items = localDb.getList('customers');
    res.json(items);
  } catch (err: any) {
    console.error('Failed to fetch customers:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch customers' });
  }
});

app.post('/api/customers', (req, res) => {
  try {
    const item = req.body;
    if (!item.id) {
      return res.status(400).json({ error: 'Missing customer ID' });
    }
    const saved = localDb.upsert('customers', item);
    appendSqlToFiles('customers', item);
    notifyChange('customers', 'save', item);
    res.json(saved);
  } catch (err: any) {
    console.error('Failed to save customer:', err);
    res.status(500).json({ error: err.message || 'Failed to save customer' });
  }
});

app.delete('/api/customers/:id', (req, res) => {
  try {
    const { id } = req.params;
    localDb.delete('customers', id);
    appendDeleteSqlToFiles('customers', id);
    notifyChange('customers', 'delete', { id });
    res.json({ success: true });
  } catch (err: any) {
    console.error('Failed to delete customer:', err);
    res.status(500).json({ error: err.message || 'Failed to delete customer' });
  }
});

// 3. Documents
app.get('/api/documents', (_req, res) => {
  try {
    const items = localDb.getList('documents');
    res.json(items);
  } catch (err: any) {
    console.error('Failed to fetch documents:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch documents' });
  }
});

app.post('/api/documents', (req, res) => {
  try {
    const item = req.body;
    if (!item.id) {
      return res.status(400).json({ error: 'Missing document ID' });
    }

    const totalNum = Number(item.total) || 0;
    const paidNum = Number(item.paidAmount) || 0;
    const dueNum = Math.max(0, totalNum - paidNum);

    const dbItem = {
      ...item,
      total: totalNum,
      paidAmount: paidNum,
      dueAmount: dueNum,
      vatEnabled: item.vatEnabled === false || item.vatEnabled === 0 ? 0 : 1,
    };

    const saved = localDb.upsert('documents', dbItem);
    appendSqlToFiles('documents', dbItem);
    notifyChange('documents', 'save', dbItem);
    res.json(saved);
  } catch (err: any) {
    console.error('Failed to save document:', err);
    res.status(500).json({ error: err.message || 'Failed to save document' });
  }
});

app.delete('/api/documents/:id', (req, res) => {
  try {
    const { id } = req.params;
    localDb.delete('documents', id);
    appendDeleteSqlToFiles('documents', id);
    notifyChange('documents', 'delete', { id });
    res.json({ success: true });
  } catch (err: any) {
    console.error('Failed to delete document:', err);
    res.status(500).json({ error: err.message || 'Failed to delete document' });
  }
});

// 4. Staff Users
app.get('/api/staff', (_req, res) => {
  try {
    const items = localDb.getList('staffUsers');
    res.json(items);
  } catch (err: any) {
    console.error('Failed to fetch staff:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch staff' });
  }
});

app.post('/api/staff', (req, res) => {
  try {
    const item = req.body;
    if (!item.id) {
      return res.status(400).json({ error: 'Missing staff user ID' });
    }
    const saved = localDb.upsert('staffUsers', item);
    appendSqlToFiles('staff_users', item);
    notifyChange('staff', 'save', item);
    res.json(saved);
  } catch (err: any) {
    console.error('Failed to save staff:', err);
    res.status(500).json({ error: err.message || 'Failed to save staff' });
  }
});

app.delete('/api/staff/:id', (req, res) => {
  try {
    const { id } = req.params;
    localDb.delete('staffUsers', id);
    appendDeleteSqlToFiles('staff_users', id);
    notifyChange('staff', 'delete', { id });
    res.json({ success: true });
  } catch (err: any) {
    console.error('Failed to delete staff:', err);
    res.status(500).json({ error: err.message || 'Failed to delete staff' });
  }
});

// 5. Settings
app.get('/api/settings', (_req, res) => {
  try {
    const settings = localDb.getSettings();
    res.json(settings);
  } catch (err: any) {
    console.error('Failed to fetch settings:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch settings' });
  }
});

app.post('/api/settings', (req, res) => {
  try {
    const item = req.body;
    const saved = localDb.saveSettings(item);
    appendSqlToFiles('settings', saved);
    notifyChange('settings', 'save', saved);
    res.json(saved);
  } catch (err: any) {
    console.error('Failed to save settings:', err);
    res.status(500).json({ error: err.message || 'Failed to save settings' });
  }
});

// 6. Field Dispatches API
app.get('/api/field-dispatches', (_req, res) => {
  try {
    const items = localDb.getList('fieldDispatches');
    res.json(items);
  } catch (err: any) {
    console.error('Failed to fetch field dispatches:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch field dispatches' });
  }
});

app.post('/api/field-dispatches', (req, res) => {
  try {
    const item = req.body;
    if (!item.id) {
      return res.status(400).json({ error: 'Missing field dispatch ID' });
    }
    const saved = localDb.upsert('fieldDispatches', item);
    appendSqlToFiles('field_dispatches', item);
    notifyChange('field_dispatches', 'save', item);
    res.json(saved);
  } catch (err: any) {
    console.error('Failed to save field dispatch:', err);
    res.status(500).json({ error: err.message || 'Failed to save field dispatch' });
  }
});

app.delete('/api/field-dispatches/:id', (req, res) => {
  try {
    const { id } = req.params;
    localDb.delete('fieldDispatches', id);
    appendDeleteSqlToFiles('field_dispatches', id);
    notifyChange('field_dispatches', 'delete', { id });
    res.json({ success: true });
  } catch (err: any) {
    console.error('Failed to delete field dispatch:', err);
    res.status(500).json({ error: err.message || 'Failed to delete field dispatch' });
  }
});

// 7. Suppliers API
app.get('/api/suppliers', (_req, res) => {
  try {
    const items = localDb.getList('suppliers');
    res.json(items);
  } catch (err: any) {
    console.error('Failed to fetch suppliers:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch suppliers' });
  }
});

app.post('/api/suppliers', (req, res) => {
  try {
    const item = req.body;
    if (!item.id) {
      return res.status(400).json({ error: 'Missing supplier ID' });
    }
    const saved = localDb.upsert('suppliers', item);
    appendSqlToFiles('suppliers', item);
    notifyChange('suppliers', 'save', item);
    res.json(saved);
  } catch (err: any) {
    console.error('Failed to save supplier:', err);
    res.status(500).json({ error: err.message || 'Failed to save supplier' });
  }
});

app.delete('/api/suppliers/:id', (req, res) => {
  try {
    const { id } = req.params;
    localDb.delete('suppliers', id);
    appendDeleteSqlToFiles('suppliers', id);
    notifyChange('suppliers', 'delete', { id });
    res.json({ success: true });
  } catch (err: any) {
    console.error('Failed to delete supplier:', err);
    res.status(500).json({ error: err.message || 'Failed to delete supplier' });
  }
});

// 8. Purchases API
app.get('/api/purchases', (_req, res) => {
  try {
    const items = localDb.getList('purchases');
    res.json(items);
  } catch (err: any) {
    console.error('Failed to fetch purchases:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch purchases' });
  }
});

app.post('/api/purchases', (req, res) => {
  try {
    const item = req.body;
    if (!item.id) {
      return res.status(400).json({ error: 'Missing purchase ID' });
    }
    const saved = localDb.upsert('purchases', item);
    appendSqlToFiles('purchases', item);
    notifyChange('purchases', 'save', item);
    res.json(saved);
  } catch (err: any) {
    console.error('Failed to save purchase:', err);
    res.status(500).json({ error: err.message || 'Failed to save purchase' });
  }
});

app.delete('/api/purchases/:id', (req, res) => {
  try {
    const { id } = req.params;
    localDb.delete('purchases', id);
    appendDeleteSqlToFiles('purchases', id);
    notifyChange('purchases', 'delete', { id });
    res.json({ success: true });
  } catch (err: any) {
    console.error('Failed to delete purchase:', err);
    res.status(500).json({ error: err.message || 'Failed to delete purchase' });
  }
});

// 9. Sales Returns & Restock
app.get('/api/returns', (_req, res) => {
  try {
    const items = localDb.getList('salesReturns');
    res.json(items);
  } catch (err: any) {
    console.error('Failed to fetch returns:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch returns' });
  }
});

app.post('/api/returns', (req, res) => {
  try {
    const item = req.body;
    if (!item.id) {
      return res.status(400).json({ error: 'Missing return ID' });
    }
    const saved = localDb.upsert('salesReturns', item);
    appendSqlToFiles('sales_returns', item);
    notifyChange('returns', 'save', item);
    res.json(saved);
  } catch (err: any) {
    console.error('Failed to save return:', err);
    res.status(500).json({ error: err.message || 'Failed to save return' });
  }
});

app.delete('/api/returns/:id', (req, res) => {
  try {
    const { id } = req.params;
    localDb.delete('salesReturns', id);
    appendDeleteSqlToFiles('sales_returns', id);
    notifyChange('returns', 'delete', { id });
    res.json({ success: true });
  } catch (err: any) {
    console.error('Failed to delete return:', err);
    res.status(500).json({ error: err.message || 'Failed to delete return' });
  }
});

// 10. Expenses API
app.get('/api/expenses', (_req, res) => {
  try {
    const items = localDb.getList('expenses');
    res.json(items);
  } catch (err: any) {
    console.error('Failed to fetch expenses:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch expenses' });
  }
});

app.post('/api/expenses', (req, res) => {
  try {
    const item = req.body;
    if (!item.id) {
      return res.status(400).json({ error: 'Missing expense ID' });
    }
    const expenseData = {
      id: String(item.id),
      expenseNumber: String(item.expenseNumber || `EXP/${new Date().getFullYear()}/${Date.now()}`),
      date: String(item.date || new Date().toISOString().split('T')[0]),
      category: String(item.category || 'Miscellaneous / Other Expenses'),
      title: String(item.title || ''),
      amount: Number(item.amount) || 0,
      paymentMethod: String(item.paymentMethod || 'Cash'),
      paidBy: String(item.paidBy || ''),
      staffId: String(item.staffId || ''),
      referenceNo: String(item.referenceNo || ''),
      notes: String(item.notes || ''),
      receiptUrl: String(item.receiptUrl || ''),
      createdAt: String(item.createdAt || new Date().toISOString().split('T')[0]),
    };

    const saved = localDb.upsert('expenses', expenseData);
    appendSqlToFiles('expenses', expenseData);
    notifyChange('expenses', 'save', expenseData);
    res.json(saved);
  } catch (err: any) {
    console.error('Failed to save expense:', err);
    res.status(500).json({ error: err.message || 'Failed to save expense' });
  }
});

app.delete('/api/expenses/:id', (req, res) => {
  try {
    const { id } = req.params;
    localDb.delete('expenses', id);
    appendDeleteSqlToFiles('expenses', id);
    notifyChange('expenses', 'delete', { id });
    res.json({ success: true });
  } catch (err: any) {
    console.error('Failed to delete expense:', err);
    res.status(500).json({ error: err.message || 'Failed to delete expense' });
  }
});

// 11. Database Setup / Clear / Reset Management
app.post('/api/database/clear', (_req, res) => {
  try {
    localDb.clearAll();
    notifyChange('database', 'clear', { timestamp: Date.now() });
    res.json({ success: true, message: 'All transactions, products, customers, and records have been cleared. Database is empty and ready for fresh setup.' });
  } catch (err: any) {
    console.error('Failed to clear database:', err);
    res.status(500).json({ error: err.message || 'Failed to clear database' });
  }
});

app.post('/api/database/seed-demo', (_req, res) => {
  try {
    localDb.seedDemo();
    notifyChange('database', 'seed', { timestamp: Date.now() });
    res.json({ success: true, message: 'Demo data seeded successfully.' });
  } catch (err: any) {
    console.error('Failed to seed demo data:', err);
    res.status(500).json({ error: err.message || 'Failed to seed demo data' });
  }
});

// 12. Database & Server Health Diagnostics Check
app.get('/api/health', (_req, res) => {
  const counts = localDb.getCounts();
  res.json({
    status: 'ok',
    database: 'High-Performance Integrated Server Database',
    connected: true,
    latencyMs: 1,
    tables: counts,
    uploadsFolderWritable: fs.existsSync(uploadsDir),
    timestamp: new Date().toISOString(),
  });
});

// 13. File Upload handling
const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (_req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const publicUrl = `/uploads/${req.file.filename}`;
    res.json({ url: publicUrl, filename: req.file.filename });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to upload file' });
  }
});

app.use('/uploads', express.static(uploadsDir));

// 14. SQL Sync & Backup export endpoints
app.get('/api/download-sql', (_req, res) => {
  const schemaPath = path.join(process.cwd(), 'database/schema.sql');
  if (fs.existsSync(schemaPath)) {
    res.download(schemaPath, 'jubayer_machineries_database.sql');
  } else {
    const publicSchema = path.join(process.cwd(), 'public/database.sql');
    if (fs.existsSync(publicSchema)) {
      res.download(publicSchema, 'jubayer_machineries_database.sql');
    } else {
      res.status(404).send('SQL backup file not found');
    }
  }
});

app.get('/api/schema.sql', (_req, res) => {
  const schemaPath = path.join(process.cwd(), 'database/schema.sql');
  if (fs.existsSync(schemaPath)) {
    res.setHeader('Content-Type', 'text/plain');
    res.send(fs.readFileSync(schemaPath, 'utf8'));
  } else {
    res.status(404).send('schema.sql not found');
  }
});

app.post('/api/sync-all', (req, res) => {
  try {
    const { products, customers, documents, staff, settings, fieldDispatches, suppliers, purchases, salesReturns, expenses } = req.body;
    let count = 0;

    if (Array.isArray(products)) {
      products.forEach((p: any) => { appendSqlToFiles('products', p); count++; });
    }
    if (Array.isArray(customers)) {
      customers.forEach((c: any) => { appendSqlToFiles('customers', c); count++; });
    }
    if (Array.isArray(documents)) {
      documents.forEach((d: any) => { appendSqlToFiles('documents', d); count++; });
    }
    if (Array.isArray(staff)) {
      staff.forEach((s: any) => { appendSqlToFiles('staff_users', s); count++; });
    }
    if (settings && typeof settings === 'object') {
      appendSqlToFiles('settings', settings);
      count++;
    }
    if (Array.isArray(fieldDispatches)) {
      fieldDispatches.forEach((fd: any) => { appendSqlToFiles('field_dispatches', fd); count++; });
    }
    if (Array.isArray(suppliers)) {
      suppliers.forEach((s: any) => { appendSqlToFiles('suppliers', s); count++; });
    }
    if (Array.isArray(purchases)) {
      purchases.forEach((pur: any) => { appendSqlToFiles('purchases', pur); count++; });
    }
    if (Array.isArray(salesReturns)) {
      salesReturns.forEach((ret: any) => { appendSqlToFiles('sales_returns', ret); count++; });
    }
    if (Array.isArray(expenses)) {
      expenses.forEach((exp: any) => { appendSqlToFiles('expenses', exp); count++; });
    }

    res.json({ success: true, count, message: `Successfully synchronized ${count} records into database.sql and schema.sql!` });
  } catch (err: any) {
    console.error('Failed to sync all to SQL:', err);
    res.status(500).json({ error: err.message || 'Failed to sync to SQL' });
  }
});

// Vite middleware for frontend app in development mode
if (process.env.NODE_ENV !== 'production') {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static('dist'));
  app.get('*', (_req, res) => {
    res.sendFile('dist/index.html', { root: '.' });
  });
}

httpServer.listen(port, '0.0.0.0', () => {
  console.log(`Jubayer Machineries Server listening on port ${port}`);
});
