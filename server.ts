import express from 'express';
import http from 'http';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { Server as SocketIOServer } from 'socket.io';
import { db, pool } from './src/db/index.ts';
import { products, customers, documents, staffUsers, settings, fieldDispatches, suppliers, purchases, salesReturns, expenses } from './src/db/schema.ts';
import { eq, sql } from 'drizzle-orm';
import { INITIAL_PRODUCTS, INITIAL_CUSTOMERS, INITIAL_DOCUMENTS, INITIAL_STAFF_USERS, DEFAULT_SETTINGS, INITIAL_FIELD_DISPATCHES, INITIAL_SUPPLIERS, INITIAL_PURCHASES, INITIAL_SALES_RETURNS, INITIAL_EXPENSES } from './src/initialData.ts';

const app = express();
const port = 3000;

const httpServer = http.createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
  },
});

// Configure upload storage
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const newName = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    cb(null, newName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
});

app.use('/uploads', express.static(uploadsDir));
app.use(express.json({ limit: '25mb' }));

// Upload image handler for Node server
const handleUpload = (req: express.Request, res: express.Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file uploaded' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ url: fileUrl, success: true });
};

app.post('/api/upload', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      console.error('Multer upload error:', err);
      return res.status(400).json({ error: err.message || 'File upload error' });
    }
    handleUpload(req, res);
  });
});

app.post('/api/upload.php', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      console.error('Multer upload error:', err);
      return res.status(400).json({ error: err.message || 'File upload error' });
    }
    handleUpload(req, res);
  });
});

// Helper to broadcast changes instantly
function notifyChange(entity: string, action: string, data?: any) {
  io.emit('db_change', { entity, action, data, timestamp: Date.now() });
}

io.on('connection', (socket) => {
  console.log('Real-time SQL client connected:', socket.id);
});

// Seed initial data if tables are empty
let isSeeded = false;
async function seedInitialDataIfNeeded() {
  if (isSeeded) return;
  try {
    // Ensure all required columns exist in PostgreSQL
    await pool.query(`
      ALTER TABLE settings ADD COLUMN IF NOT EXISTS logo_url text DEFAULT '';
      ALTER TABLE settings ADD COLUMN IF NOT EXISTS watermark_url text DEFAULT '';
      ALTER TABLE settings ADD COLUMN IF NOT EXISTS favicon_url text DEFAULT '';
      ALTER TABLE settings ADD COLUMN IF NOT EXISTS watermark_opacity real DEFAULT 0.04;
      ALTER TABLE settings ADD COLUMN IF NOT EXISTS show_watermark integer DEFAULT 1;
    `).catch((e) => console.error('Column check notice:', e));
    const existingProducts = await db.select().from(products).limit(1).catch(() => []);
    if (existingProducts.length === 0) {
      console.log('Seeding initial products into Cloud SQL...');
      for (const p of INITIAL_PRODUCTS) {
        await db.insert(products).values(p).onConflictDoNothing().catch(() => {});
      }
    }

    const existingCustomers = await db.select().from(customers).limit(1).catch(() => []);
    if (existingCustomers.length === 0) {
      console.log('Seeding initial customers into Cloud SQL...');
      for (const c of INITIAL_CUSTOMERS) {
        await db.insert(customers).values(c).onConflictDoNothing().catch(() => {});
      }
    }

    const existingSuppliers = await db.select().from(suppliers).limit(1).catch(() => []);
    if (existingSuppliers.length === 0) {
      console.log('Seeding initial suppliers into Cloud SQL...');
      for (const s of INITIAL_SUPPLIERS) {
        await db.insert(suppliers).values(s).onConflictDoNothing().catch(() => {});
      }
    }

    const existingPurchases = await db.select().from(purchases).limit(1).catch(() => []);
    if (existingPurchases.length === 0) {
      console.log('Seeding initial purchases into Cloud SQL...');
      for (const p of INITIAL_PURCHASES) {
        await db.insert(purchases).values(p).onConflictDoNothing().catch(() => {});
      }
    }

    const existingDocs = await db.select().from(documents).limit(1).catch(() => []);
    if (existingDocs.length === 0) {
      console.log('Seeding initial documents into Cloud SQL...');
      for (const d of INITIAL_DOCUMENTS) {
        await db.insert(documents).values(d).onConflictDoNothing().catch(() => {});
      }
    }

    const existingStaff = await db.select().from(staffUsers).limit(1).catch(() => []);
    if (existingStaff.length === 0) {
      console.log('Seeding initial staff users into Cloud SQL...');
      for (const s of INITIAL_STAFF_USERS) {
        await db.insert(staffUsers).values(s).onConflictDoNothing().catch(() => {});
      }
    }

    const existingSettings = await db.select().from(settings).limit(1).catch(() => []);
    if (existingSettings.length === 0) {
      console.log('Seeding initial settings into Cloud SQL...');
      await db.insert(settings).values({
        id: 'global_settings',
        ...DEFAULT_SETTINGS,
      }).onConflictDoNothing().catch(() => {});
    } else {
      const current = existingSettings[0];
      if (current && (current.name !== 'Jubayer Machineries' || current.email === 'ssengbd25@gmail.com' || current.address.includes('M.R Trade'))) {
        console.log('Updating existing settings to Jubayer Machineries...');
        await (db.update(settings as any) as any)
          .set({
            name: "Jubayer Machineries",
            slogan: "Your Problem Solution is Sustainable Partner",
            address: "Hazi Siddik Complex, Molla Market, Bason Sharok, Gazipur City.",
            phone1: "01715-994956",
            phone2: "01799-498199",
            email: "jubayermachineries@gmail.com",
            website: "www.hitachiairsolutioncenter.com",
          })
          .where(eq(settings.id, 'global_settings'))
          .catch(() => {});
      }
    }

    const existingDispatches = await db.select().from(fieldDispatches).limit(1).catch(() => []);
    if (existingDispatches.length === 0) {
      console.log('Seeding initial field dispatches into Cloud SQL...');
      for (const fd of INITIAL_FIELD_DISPATCHES) {
        await db.insert(fieldDispatches).values(fd).onConflictDoNothing().catch(() => {});
      }
    }

    const existingReturns = await db.select().from(salesReturns).limit(1).catch(() => []);
    if (existingReturns.length === 0) {
      console.log('Seeding initial sales returns into Cloud SQL...');
      for (const ret of INITIAL_SALES_RETURNS) {
        await (db.insert(salesReturns) as any).values({
          ...ret,
          deductFromDue: ret.deductFromDue ? 1 : 0,
          restocked: ret.restocked ? 1 : 0
        }).onConflictDoNothing().catch(() => {});
      }
    }

    const existingExpenses = await db.select().from(expenses).limit(1).catch(() => []);
    if (existingExpenses.length === 0) {
      console.log('Seeding initial daily expenses into Cloud SQL...');
      for (const expItem of INITIAL_EXPENSES) {
        await (db.insert(expenses) as any).values({
          id: expItem.id,
          expenseNumber: expItem.expenseNumber,
          date: expItem.date,
          category: expItem.category,
          title: expItem.title,
          amount: Number(expItem.amount) || 0,
          paymentMethod: expItem.paymentMethod,
          paidBy: expItem.paidBy || '',
          staffId: expItem.staffId || '',
          referenceNo: expItem.referenceNo || '',
          notes: expItem.notes || '',
          receiptUrl: expItem.receiptUrl || '',
          createdAt: expItem.createdAt || '',
        }).onConflictDoNothing().catch(() => {});
      }
    }
    isSeeded = true;
  } catch (err) {
    console.error('Data seeding check encountered notice:', err);
  }
}

// Initial seed trigger
seedInitialDataIfNeeded().catch(() => {});

// REST API Routes
// 1. Products
app.get('/api/products', async (_req, res) => {
  try {
    await seedInitialDataIfNeeded();
    const result = await db.select().from(products);
    res.json(result);
  } catch (err: any) {
    console.error('Failed to fetch products:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch products' });
  }
});

app.post('/api/products', async (req, res) => {
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
    await (db.insert(products) as any).values(productData).onConflictDoUpdate({
      target: products.id,
      set: {
        name: productData.name,
        sku: productData.sku,
        category: productData.category,
        brand: productData.brand,
        price: productData.price,
        costPrice: productData.costPrice,
        stock: productData.stock,
        unit: productData.unit,
        description: productData.description,
        specs: productData.specs,
        imageUrl: productData.imageUrl,
      },
    });
    notifyChange('products', 'save', productData);
    res.json(productData);
  } catch (err: any) {
    console.error('Failed to save product:', err);
    res.status(500).json({ error: err.message || 'Failed to save product' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(products).where(eq(products.id, id));
    notifyChange('products', 'delete', { id });
    res.json({ success: true });
  } catch (err: any) {
    console.error('Failed to delete product:', err);
    res.status(500).json({ error: err.message || 'Failed to delete product' });
  }
});

// 2. Customers
app.get('/api/customers', async (_req, res) => {
  try {
    await seedInitialDataIfNeeded();
    const result = await db.select().from(customers);
    res.json(result);
  } catch (err: any) {
    console.error('Failed to fetch customers:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch customers' });
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    const item = req.body;
    if (!item.id) {
      return res.status(400).json({ error: 'Missing customer ID' });
    }
    await (db.insert(customers) as any).values(item).onConflictDoUpdate({
      target: customers.id,
      set: {
        companyId: item.companyId || '',
        name: item.name,
        company: item.company || '',
        phone: item.phone,
        email: item.email || '',
        address: item.address || '',
        notes: item.notes || '',
      },
    });
    notifyChange('customers', 'save', item);
    res.json(item);
  } catch (err: any) {
    console.error('Failed to save customer:', err);
    res.status(500).json({ error: err.message || 'Failed to save customer' });
  }
});

app.delete('/api/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(customers).where(eq(customers.id, id));
    notifyChange('customers', 'delete', { id });
    res.json({ success: true });
  } catch (err: any) {
    console.error('Failed to delete customer:', err);
    res.status(500).json({ error: err.message || 'Failed to delete customer' });
  }
});

// 3. Documents
app.get('/api/documents', async (_req, res) => {
  try {
    await seedInitialDataIfNeeded();
    const result = await db.select().from(documents);
    res.json(result);
  } catch (err: any) {
    console.error('Failed to fetch documents:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch documents' });
  }
});

app.post('/api/documents', async (req, res) => {
  try {
    const item = req.body;
    if (!item.id) {
      return res.status(400).json({ error: 'Missing document ID' });
    }
    const dbItem = {
      ...item,
      vatEnabled: item.vatEnabled === false || item.vatEnabled === 0 ? 0 : 1
    };
    await (db.insert(documents) as any).values(dbItem).onConflictDoUpdate({
      target: documents.id,
      set: {
        type: item.type,
        docNumber: item.docNumber,
        date: item.date,
        dueDate: item.dueDate || null,
        customerId: item.customerId,
        customerName: item.customerName,
        customerCompany: item.customerCompany || '',
        customerPhone: item.customerPhone || '',
        customerEmail: item.customerEmail || '',
        customerAddress: item.customerAddress || '',
        subject: item.subject || null,
        salutation: item.salutation || null,
        openingParagraph: item.openingParagraph || null,
        closingParagraph: item.closingParagraph || null,
        items: item.items || [],
        subtotal: item.subtotal,
        taxRate: item.taxRate || 0,
        taxAmount: item.taxAmount || 0,
        discount: item.discount || 0,
        total: item.total,
        paidAmount: item.paidAmount || 0,
        dueAmount: item.dueAmount || 0,
        status: item.status,
        terms: item.terms || '',
        notes: item.notes || null,
        signatureLabel: item.signatureLabel || 'Authorized Signature',
        signatureName: item.signatureName || 'Hitachi Air Solution Center',
        vatEnabled: item.vatEnabled === false || item.vatEnabled === 0 ? 0 : 1,
      },
    });
    notifyChange('documents', 'save', dbItem);
    res.json(dbItem);
  } catch (err: any) {
    console.error('Failed to save document:', err);
    res.status(500).json({ error: err.message || 'Failed to save document' });
  }
});

app.delete('/api/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(documents).where(eq(documents.id, id));
    notifyChange('documents', 'delete', { id });
    res.json({ success: true });
  } catch (err: any) {
    console.error('Failed to delete document:', err);
    res.status(500).json({ error: err.message || 'Failed to delete document' });
  }
});

// 4. Staff Users
app.get('/api/staff', async (_req, res) => {
  try {
    await seedInitialDataIfNeeded();
    const result = await db.select().from(staffUsers);
    res.json(result);
  } catch (err: any) {
    console.error('Failed to fetch staff:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch staff' });
  }
});

app.post('/api/staff', async (req, res) => {
  try {
    const item = req.body;
    if (!item.id) {
      return res.status(400).json({ error: 'Missing staff user ID' });
    }
    await (db.insert(staffUsers) as any).values(item).onConflictDoUpdate({
      target: staffUsers.id,
      set: {
        name: item.name,
        email: item.email,
        phone: item.phone || '',
        passcode: item.passcode,
        role: item.role,
        designation: item.designation || '',
        status: item.status,
        permissions: item.permissions || [],
        createdAt: item.createdAt || new Date().toISOString().split('T')[0],
      },
    });
    notifyChange('staff', 'save', item);
    res.json(item);
  } catch (err: any) {
    console.error('Failed to save staff:', err);
    res.status(500).json({ error: err.message || 'Failed to save staff' });
  }
});

app.delete('/api/staff/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(staffUsers).where(eq(staffUsers.id, id));
    notifyChange('staff', 'delete', { id });
    res.json({ success: true });
  } catch (err: any) {
    console.error('Failed to delete staff user:', err);
    res.status(500).json({ error: err.message || 'Failed to delete staff user' });
  }
});

// 5. Business Settings
app.get('/api/settings', async (_req, res) => {
  try {
    await seedInitialDataIfNeeded();
    const result = await db.select().from(settings).where(eq(settings.id, 'global_settings'));
    if (result.length > 0) {
      res.json(result[0]);
    } else {
      res.json(DEFAULT_SETTINGS);
    }
  } catch (err: any) {
    console.error('Failed to fetch settings:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch settings' });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const item = req.body;
    await (db.insert(settings) as any).values({
      id: 'global_settings',
      ...item,
    }).onConflictDoUpdate({
      target: settings.id,
      set: {
        name: item.name,
        slogan: item.slogan || '',
        address: item.address || '',
        phone1: item.phone1 || '',
        phone2: item.phone2 || '',
        email: item.email || '',
        website: item.website || '',
        invoicePrefix: item.invoicePrefix || 'INV',
        quotePrefix: item.quotePrefix || 'QUO',
        offerPrefix: item.offerPrefix || 'OFF',
        billPrefix: item.billPrefix || 'BIL',
        taxRate: item.taxRate || 0,
        terms: item.terms || '',
        signatureName: item.signatureName || '',
        signatureLabel: item.signatureLabel || '',
        logoUrl: item.logoUrl || '',
        watermarkUrl: item.watermarkUrl || '',
        faviconUrl: item.faviconUrl || '',
        watermarkOpacity: item.watermarkOpacity !== undefined ? item.watermarkOpacity : 0.04,
        showWatermark: item.showWatermark !== undefined ? item.showWatermark : 1,
      },
    });
    notifyChange('settings', 'save', item);
    res.json(item);
  } catch (err: any) {
    console.error('Failed to save settings:', err);
    res.status(500).json({ error: err.message || 'Failed to save settings' });
  }
});

// 6. Field Dispatches (Movement & Returns)
app.get('/api/field-dispatches', async (_req, res) => {
  try {
    await seedInitialDataIfNeeded();
    const result = await db.select().from(fieldDispatches);
    res.json(result);
  } catch (err: any) {
    console.error('Failed to fetch field dispatches:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch field dispatches' });
  }
});

app.post('/api/field-dispatches', async (req, res) => {
  try {
    const item = req.body;
    if (!item.id) {
      return res.status(400).json({ error: 'Missing field dispatch ID' });
    }
    await (db.insert(fieldDispatches) as any).values({
      id: item.id,
      date: item.date || item.dispatchDate || new Date().toISOString().split('T')[0],
      staffId: item.staffId || '',
      staffName: item.staffName || '',
      customerId: item.customerId || '',
      companyName: item.companyName || item.customerCompany || '',
      address: item.address || '',
      phone: item.phone || item.customerPhone || '',
      description: item.description || item.purpose || '',
      billNo: item.billNo || item.dispatchNumber || '',
      billAmount: item.billAmount ?? 0,
      paidAmount: item.paidAmount ?? 0,
      dueAmount: item.dueAmount ?? 0,
      expenseAmount: item.expenseAmount ?? 0,
      expenseDetails: item.expenseDetails || '',
      paymentStatus: item.paymentStatus || 'Paid',
      paymentMethod: item.paymentMethod || 'Cash',
      status: item.status || 'Completed',
      notes: item.notes || '',
      dispatchNumber: item.dispatchNumber || item.billNo || '',
      customerName: item.customerName || '',
      customerCompany: item.customerCompany || item.companyName || '',
      customerPhone: item.customerPhone || item.phone || '',
      purpose: item.purpose || item.description || '',
      dispatchDate: item.dispatchDate || item.date || '',
      returnDate: item.returnDate || null,
      items: item.items || [],
    }).onConflictDoUpdate({
      target: fieldDispatches.id,
      set: {
        date: item.date || item.dispatchDate || '',
        staffId: item.staffId || '',
        staffName: item.staffName || '',
        customerId: item.customerId || '',
        companyName: item.companyName || item.customerCompany || '',
        address: item.address || '',
        phone: item.phone || item.customerPhone || '',
        description: item.description || item.purpose || '',
        billNo: item.billNo || item.dispatchNumber || '',
        billAmount: item.billAmount ?? 0,
        paidAmount: item.paidAmount ?? 0,
        dueAmount: item.dueAmount ?? 0,
        expenseAmount: item.expenseAmount ?? 0,
        expenseDetails: item.expenseDetails || '',
        paymentStatus: item.paymentStatus || 'Paid',
        paymentMethod: item.paymentMethod || 'Cash',
        status: item.status || 'Completed',
        notes: item.notes || '',
        dispatchNumber: item.dispatchNumber || item.billNo || '',
        customerName: item.customerName || '',
        customerCompany: item.customerCompany || item.companyName || '',
        customerPhone: item.customerPhone || item.phone || '',
        purpose: item.purpose || item.description || '',
        dispatchDate: item.dispatchDate || item.date || '',
        returnDate: item.returnDate || null,
        items: item.items || [],
      },
    });
    notifyChange('dispatches', 'save', item);
    res.json(item);
  } catch (err: any) {
    console.error('Failed to save field dispatch:', err);
    res.status(500).json({ error: err.message || 'Failed to save field dispatch' });
  }
});

app.delete('/api/field-dispatches/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(fieldDispatches).where(eq(fieldDispatches.id, id));
    notifyChange('dispatches', 'delete', { id });
    res.json({ success: true });
  } catch (err: any) {
    console.error('Failed to delete field dispatch:', err);
    res.status(500).json({ error: err.message || 'Failed to delete field dispatch' });
  }
});

// 7. Suppliers
app.get('/api/suppliers', async (_req, res) => {
  try {
    await seedInitialDataIfNeeded();
    const result = await db.select().from(suppliers);
    res.json(result);
  } catch (err: any) {
    console.error('Failed to fetch suppliers:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch suppliers' });
  }
});

app.post('/api/suppliers', async (req, res) => {
  try {
    const item = req.body;
    if (!item.id) {
      return res.status(400).json({ error: 'Missing supplier ID' });
    }
    await (db.insert(suppliers) as any).values(item).onConflictDoUpdate({
      target: suppliers.id,
      set: {
        supplierId: item.supplierId || '',
        name: item.name,
        company: item.company || '',
        phone: item.phone,
        email: item.email || '',
        address: item.address || '',
        contactPerson: item.contactPerson || '',
        notes: item.notes || '',
        createdAt: item.createdAt || '',
      },
    });
    notifyChange('suppliers', 'save', item);
    res.json(item);
  } catch (err: any) {
    console.error('Failed to save supplier:', err);
    res.status(500).json({ error: err.message || 'Failed to save supplier' });
  }
});

app.delete('/api/suppliers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(suppliers).where(eq(suppliers.id, id));
    notifyChange('suppliers', 'delete', { id });
    res.json({ success: true });
  } catch (err: any) {
    console.error('Failed to delete supplier:', err);
    res.status(500).json({ error: err.message || 'Failed to delete supplier' });
  }
});

// 8. Purchases / Stock Inward
app.get('/api/purchases', async (_req, res) => {
  try {
    await seedInitialDataIfNeeded();
    const result = await db.select().from(purchases);
    res.json(result);
  } catch (err: any) {
    console.error('Failed to fetch purchases:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch purchases' });
  }
});

app.post('/api/purchases', async (req, res) => {
  try {
    const item = req.body;
    if (!item.id) {
      return res.status(400).json({ error: 'Missing purchase ID' });
    }
    await (db.insert(purchases) as any).values(item).onConflictDoUpdate({
      target: purchases.id,
      set: {
        purchaseNumber: item.purchaseNumber,
        supplierInvoiceNo: item.supplierInvoiceNo || '',
        supplierId: item.supplierId,
        supplierName: item.supplierName,
        supplierCompany: item.supplierCompany || '',
        supplierPhone: item.supplierPhone || '',
        supplierEmail: item.supplierEmail || '',
        supplierAddress: item.supplierAddress || '',
        purchaseDate: item.purchaseDate,
        items: item.items || [],
        subtotal: item.subtotal,
        taxRate: item.taxRate || 0,
        taxAmount: item.taxAmount || 0,
        discount: item.discount || 0,
        shippingCost: item.shippingCost || 0,
        grandTotal: item.grandTotal,
        paidAmount: item.paidAmount || 0,
        dueAmount: item.dueAmount || 0,
        paymentStatus: item.paymentStatus,
        paymentMethod: item.paymentMethod,
        status: item.status,
        notes: item.notes || '',
        createdAt: item.createdAt || '',
      },
    });
    notifyChange('purchases', 'save', item);
    res.json(item);
  } catch (err: any) {
    console.error('Failed to save purchase:', err);
    res.status(500).json({ error: err.message || 'Failed to save purchase' });
  }
});

app.delete('/api/purchases/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(purchases).where(eq(purchases.id, id));
    notifyChange('purchases', 'delete', { id });
    res.json({ success: true });
  } catch (err: any) {
    console.error('Failed to delete purchase:', err);
    res.status(500).json({ error: err.message || 'Failed to delete purchase' });
  }
});

// 9. Sales Returns & Restock
app.get('/api/returns', async (_req, res) => {
  try {
    await seedInitialDataIfNeeded();
    const result = await db.select().from(salesReturns);
    res.json(result);
  } catch (err: any) {
    console.error('Failed to fetch returns:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch returns' });
  }
});

app.post('/api/returns', async (req, res) => {
  try {
    const item = req.body;
    if (!item.id) {
      return res.status(400).json({ error: 'Missing return ID' });
    }
    await (db.insert(salesReturns) as any).values({
      ...item,
      deductFromDue: item.deductFromDue ? 1 : 0,
      restocked: item.restocked ? 1 : 0
    }).onConflictDoUpdate({
      target: salesReturns.id,
      set: {
        returnNumber: item.returnNumber,
        returnDate: item.returnDate,
        originalDocId: item.originalDocId || '',
        originalDocNumber: item.originalDocNumber || '',
        customerId: item.customerId,
        customerName: item.customerName,
        customerCompany: item.customerCompany || '',
        customerPhone: item.customerPhone || '',
        productId: item.productId,
        productName: item.productName,
        sku: item.sku || '',
        partsNumber: item.partsNumber || '',
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        refundAmount: item.refundAmount || 0,
        deductFromDue: item.deductFromDue ? 1 : 0,
        restocked: item.restocked ? 1 : 0,
        reason: item.reason || '',
        notes: item.notes || '',
        createdAt: item.createdAt || '',
      },
    });
    notifyChange('returns', 'save', item);
    res.json(item);
  } catch (err: any) {
    console.error('Failed to save return:', err);
    res.status(500).json({ error: err.message || 'Failed to save return' });
  }
});

app.delete('/api/returns/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(salesReturns).where(eq(salesReturns.id, id));
    notifyChange('returns', 'delete', { id });
    res.json({ success: true });
  } catch (err: any) {
    console.error('Failed to delete return:', err);
    res.status(500).json({ error: err.message || 'Failed to delete return' });
  }
});

// 10. Expenses API
app.get('/api/expenses', async (_req, res) => {
  try {
    await seedInitialDataIfNeeded();
    const result = await db.select().from(expenses);
    res.json(result);
  } catch (err: any) {
    console.error('Failed to fetch expenses:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch expenses' });
  }
});

app.post('/api/expenses', async (req, res) => {
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
    await (db.insert(expenses) as any).values(expenseData).onConflictDoUpdate({
      target: expenses.id,
      set: {
        expenseNumber: expenseData.expenseNumber,
        date: expenseData.date,
        category: expenseData.category,
        title: expenseData.title,
        amount: expenseData.amount,
        paymentMethod: expenseData.paymentMethod,
        paidBy: expenseData.paidBy,
        staffId: expenseData.staffId,
        referenceNo: expenseData.referenceNo,
        notes: expenseData.notes,
        receiptUrl: expenseData.receiptUrl,
        createdAt: expenseData.createdAt,
      },
    });
    notifyChange('expenses', 'save', expenseData);
    res.json(expenseData);
  } catch (err: any) {
    console.error('Failed to save expense:', err);
    res.status(500).json({ error: err.message || 'Failed to save expense' });
  }
});

app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(expenses).where(eq(expenses.id, id));
    notifyChange('expenses', 'delete', { id });
    res.json({ success: true });
  } catch (err: any) {
    console.error('Failed to delete expense:', err);
    res.status(500).json({ error: err.message || 'Failed to delete expense' });
  }
});

// 10. Database & Server Health Diagnostics Check
app.get('/api/health', async (_req, res) => {
  const startTime = Date.now();
  try {
    await seedInitialDataIfNeeded();
    const pCountRes: any = await db.execute(`SELECT COUNT(*) as count FROM products;`);
    const cCountRes: any = await db.execute(`SELECT COUNT(*) as count FROM customers;`);
    const dCountRes: any = await db.execute(`SELECT COUNT(*) as count FROM documents;`);
    const sCountRes: any = await db.execute(`SELECT COUNT(*) as count FROM staff_users;`);
    const fCountRes: any = await db.execute(`SELECT COUNT(*) as count FROM field_dispatches;`);
    const supCountRes: any = await db.execute(`SELECT COUNT(*) as count FROM suppliers;`).catch(() => ({ rows: [{ count: 0 }] }));
    const purCountRes: any = await db.execute(`SELECT COUNT(*) as count FROM purchases;`).catch(() => ({ rows: [{ count: 0 }] }));

    const pCount = pCountRes?.rows?.[0]?.count ?? pCountRes?.[0]?.count ?? 0;
    const cCount = cCountRes?.rows?.[0]?.count ?? cCountRes?.[0]?.count ?? 0;
    const dCount = dCountRes?.rows?.[0]?.count ?? dCountRes?.[0]?.count ?? 0;
    const sCount = sCountRes?.rows?.[0]?.count ?? sCountRes?.[0]?.count ?? 0;
    const fCount = fCountRes?.rows?.[0]?.count ?? fCountRes?.[0]?.count ?? 0;
    const supCount = supCountRes?.rows?.[0]?.count ?? supCountRes?.[0]?.count ?? 0;
    const purCount = purCountRes?.rows?.[0]?.count ?? purCountRes?.[0]?.count ?? 0;

    const latency = Date.now() - startTime;
    res.json({
      status: 'ok',
      database: 'PostgreSQL (Cloud SQL Database)',
      connected: true,
      latencyMs: latency,
      tables: {
        products: Number(pCount),
        customers: Number(cCount),
        documents: Number(dCount),
        staff_users: Number(sCount),
        field_dispatches: Number(fCount),
        suppliers: Number(supCount),
        purchases: Number(purCount),
      },
      uploadsFolderWritable: fs.existsSync(uploadsDir),
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'error',
      connected: false,
      error: err.message || 'Database connection error',
      timestamp: new Date().toISOString(),
    });
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
  console.log(`Server with Real-Time WebSockets listening on http://0.0.0.0:${port}`);
});

