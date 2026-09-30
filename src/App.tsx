import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Product, Customer, Document, BusinessSettings, DocumentType, StaffUser, PermissionKey, FieldDispatch, Supplier, Purchase, SalesReturn, Expense } from './types';
import { 
  DEFAULT_SETTINGS, 
  INITIAL_PRODUCTS, 
  INITIAL_CUSTOMERS, 
  INITIAL_DOCUMENTS, 
  INITIAL_STAFF_USERS, 
  INITIAL_FIELD_DISPATCHES, 
  INITIAL_SUPPLIERS, 
  INITIAL_PURCHASES,
  INITIAL_SALES_RETURNS,
  INITIAL_EXPENSES
} from './initialData';

// Component imports
import PublicCatalog from './components/PublicCatalog';
import AdminLogin from './components/AdminLogin';
import PrintDocument from './components/PrintDocument';
import DashboardOverview from './components/DashboardOverview';
import InventoryManager from './components/InventoryManager';
import PurchasesView from './components/PurchasesView';
import DocumentCreator from './components/DocumentCreator';
import DocumentList from './components/DocumentList';
import ReportsHub from './components/ReportsHub';
import DueLedger from './components/DueLedger';
import ExpenseManager from './components/ExpenseManager';
import OwnerDrawManager from './components/OwnerDrawManager';
import StaffManagement from './components/StaffManagement';
import FieldDispatchManager from './components/FieldDispatchManager';
import CompanyProfileManager from './components/CompanyProfileManager';

import { 
  BarChart3, 
  ShoppingCart, 
  FileSpreadsheet, 
  Globe, 
  FileText, 
  Sliders, 
  Save, 
  ShieldCheck, 
  UserCheck, 
  Trash2, 
  RotateCcw, 
  Database, 
  FolderLock, 
  Zap, 
  Truck, 
  Building2,
  LogOut,
  Activity,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Server,
  HardDrive,
  Wallet,
  X,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Eye,
  Layers
} from 'lucide-react';
import { 
  apiGetProducts,
  apiSaveProduct,
  apiDeleteProduct,
  apiGetCustomers,
  apiSaveCustomer,
  apiDeleteCustomer,
  apiGetDocuments,
  apiSaveDocument,
  apiDeleteDocument,
  apiGetStaff,
  apiSaveStaff,
  apiDeleteStaff,
  apiGetSettings,
  apiSaveSettings,
  apiUploadImage,
  apiGetFieldDispatches,
  apiSaveFieldDispatch,
  apiDeleteFieldDispatch,
  apiGetSuppliers,
  apiSaveSupplier,
  apiDeleteSupplier,
  apiGetPurchases,
  apiSavePurchase,
  apiDeletePurchase,
  apiGetReturns,
  apiSaveReturn,
  apiDeleteReturn,
  apiGetExpenses,
  apiSaveExpense,
  apiDeleteExpense,
  apiClearDatabase,
  apiSeedDemoData,
  apiCheckDatabaseHealth,
  DbHealthResult
} from './lib/api';
import Logo from './components/Logo';

export default function App() {
  // Authentication & Layout Views
  // "catalog" | "login" | "dashboard"
  const [currentView, setCurrentView] = useState<'catalog' | 'login' | 'dashboard'>('catalog');
  const [activeTab, setActiveTab] = useState<string>('overview'); // "overview", "inventory", "docs", "reports", "due_ledger", "staff_management", "settings"

  // Staff Sub-Accounts & Current Active User
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>(INITIAL_STAFF_USERS);
  const [currentUser, setCurrentUser] = useState<StaffUser | null>(() => {
    try {
      const saved = localStorage.getItem('jm_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Core Database lists
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [dispatches, setDispatches] = useState<FieldDispatch[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [salesReturns, setSalesReturns] = useState<SalesReturn[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settings, setSettings] = useState<BusinessSettings>(DEFAULT_SETTINGS);

  // Focus workflows
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [isCreatingDoc, setIsCreatingDoc] = useState<DocumentType | null>(null);

  // Temporary Settings Edit Form State
  const [settingsForm, setSettingsForm] = useState<BusinessSettings>(DEFAULT_SETTINGS);
  const [settingsSavedFeedback, setSettingsSavedFeedback] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingWatermark, setIsUploadingWatermark] = useState(false);

  // Logo & Watermark File Upload Handlers
  const handleLogoFileUpload = async (file: File) => {
    setIsUploadingLogo(true);
    try {
      const res = await apiUploadImage(file);
      if (res && res.url) {
        setSettingsForm(prev => ({ ...prev, logoUrl: res.url }));
      }
    } catch (err) {
      console.error('Failed to upload logo:', err);
      alert('লোগো আপলোড করতে সমস্যা হয়েছে। অনুগ্রহ করে ছবির সাইজ চেক করে পুনরায় চেষ্টা করুন।');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleWatermarkFileUpload = async (file: File) => {
    setIsUploadingWatermark(true);
    try {
      const res = await apiUploadImage(file);
      if (res && res.url) {
        setSettingsForm(prev => ({ ...prev, watermarkUrl: res.url, showWatermark: 1 }));
      }
    } catch (err) {
      console.error('Failed to upload watermark:', err);
      alert('জলছাপ আপলোড করতে সমস্যা হয়েছে।');
    } finally {
      setIsUploadingWatermark(false);
    }
  };

  // Database Diagnostics & Health Check State
  const [isDbHealthModalOpen, setIsDbHealthModalOpen] = useState(false);
  const [dbHealthData, setDbHealthData] = useState<DbHealthResult | null>(null);
  const [isCheckingDb, setIsCheckingDb] = useState(false);

  const handleCheckDatabase = async () => {
    setIsCheckingDb(true);
    setIsDbHealthModalOpen(true);
    try {
      const res = await apiCheckDatabaseHealth();
      setDbHealthData(res);
    } catch (err: any) {
      setDbHealthData({
        status: 'error',
        database: 'Database',
        connected: false,
        error: err.message || 'Check failed',
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsCheckingDb(false);
    }
  };

  // Helper: Permission check
  const hasPermission = (perm: PermissionKey) => {
    if (!currentUser) return false;
    if (currentUser.role === 'ADMIN') return true;
    return currentUser.permissions.includes(perm);
  };

  // Fetch all data from Cloud SQL Database on load with localStorage fallback
  const loadCloudSqlData = async () => {
    // 1. Initial hydrate from localStorage cache for instant zero-latency load
    const cachedProds = localStorage.getItem('hsc_products');
    const cachedCusts = localStorage.getItem('hsc_customers');
    const cachedDocs = localStorage.getItem('hsc_documents');
    const cachedDispatches = localStorage.getItem('hsc_dispatches');
    const cachedSuppliers = localStorage.getItem('hsc_suppliers');
    const cachedPurchases = localStorage.getItem('hsc_purchases');
    const cachedReturns = localStorage.getItem('hsc_returns');
    const cachedExpenses = localStorage.getItem('hsc_expenses');

    if (cachedProds) {
      try { setProducts(JSON.parse(cachedProds)); } catch {}
    }
    if (cachedCusts) {
      try { setCustomers(JSON.parse(cachedCusts)); } catch {}
    }
    if (cachedDocs) {
      try { setDocuments(JSON.parse(cachedDocs)); } catch {}
    }
    if (cachedDispatches) {
      try { setDispatches(JSON.parse(cachedDispatches)); } catch {}
    }
    if (cachedSuppliers) {
      try { setSuppliers(JSON.parse(cachedSuppliers)); } catch {}
    }
    if (cachedPurchases) {
      try { setPurchases(JSON.parse(cachedPurchases)); } catch {}
    }
    if (cachedReturns) {
      try { setSalesReturns(JSON.parse(cachedReturns)); } catch {}
    }
    if (cachedExpenses) {
      try { setExpenses(JSON.parse(cachedExpenses)); } catch {}
    }

    try {
      const [prods, custs, docs, staff, setts, disps, sups, purs, rets, exps] = await Promise.all([
        apiGetProducts().catch(() => cachedProds ? JSON.parse(cachedProds) : []),
        apiGetCustomers().catch(() => cachedCusts ? JSON.parse(cachedCusts) : []),
        apiGetDocuments().catch(() => cachedDocs ? JSON.parse(cachedDocs) : []),
        apiGetStaff().catch(() => INITIAL_STAFF_USERS),
        apiGetSettings().catch(() => DEFAULT_SETTINGS),
        apiGetFieldDispatches().catch(() => cachedDispatches ? JSON.parse(cachedDispatches) : []),
        apiGetSuppliers().catch(() => cachedSuppliers ? JSON.parse(cachedSuppliers) : []),
        apiGetPurchases().catch(() => cachedPurchases ? JSON.parse(cachedPurchases) : []),
        apiGetReturns().catch(() => cachedReturns ? JSON.parse(cachedReturns) : []),
        apiGetExpenses().catch(() => cachedExpenses ? JSON.parse(cachedExpenses) : []),
      ]);

      const safeProds = Array.isArray(prods) ? prods : [];
      setProducts(safeProds);
      localStorage.setItem('hsc_products', JSON.stringify(safeProds));

      const safeCusts = Array.isArray(custs) ? custs : [];
      setCustomers(safeCusts);
      localStorage.setItem('hsc_customers', JSON.stringify(safeCusts));

      const safeDocs = Array.isArray(docs) ? docs : [];
      setDocuments(safeDocs);
      localStorage.setItem('hsc_documents', JSON.stringify(safeDocs));

      const safeDisps = Array.isArray(disps) ? disps : [];
      setDispatches(safeDisps);
      localStorage.setItem('hsc_dispatches', JSON.stringify(safeDisps));

      const safeSups = Array.isArray(sups) ? sups : [];
      setSuppliers(safeSups);
      localStorage.setItem('hsc_suppliers', JSON.stringify(safeSups));

      const safePurs = Array.isArray(purs) ? purs : [];
      setPurchases(safePurs);
      localStorage.setItem('hsc_purchases', JSON.stringify(safePurs));

      const safeRets = Array.isArray(rets) ? rets : [];
      setSalesReturns(safeRets);
      localStorage.setItem('hsc_returns', JSON.stringify(safeRets));

      const safeExps = Array.isArray(exps) ? exps : [];
      setExpenses(safeExps);
      localStorage.setItem('hsc_expenses', JSON.stringify(safeExps));

      setStaffUsers(staff && staff.length > 0 ? staff : INITIAL_STAFF_USERS);
      if (setts) {
        setSettings(setts);
        setSettingsForm(setts);
      }

      // Current active user restoration (only restore if previously logged in)
      const savedCurrentUser = localStorage.getItem('jm_current_user');
      if (savedCurrentUser) {
        try {
          const parsed = JSON.parse(savedCurrentUser);
          const matched = staff?.find(s => s.id === parsed.id) || parsed;
          setCurrentUser(matched);
        } catch {
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
    } catch (e) {
      console.error('Initial fetch warning:', e);
    }
  };

  useEffect(() => {
    loadCloudSqlData();

    // Establish Real-Time Socket Connection
    const socket = io();

    socket.on('db_change', (change) => {
      console.log('Real-Time SQL Change Notification Received:', change);
      if (change.entity === 'products') {
        apiGetProducts().then(setProducts).catch(() => {});
      } else if (change.entity === 'customers') {
        apiGetCustomers().then(setCustomers).catch(() => {});
      } else if (change.entity === 'documents') {
        apiGetDocuments().then(setDocuments).catch(() => {});
      } else if (change.entity === 'staff') {
        apiGetStaff().then(setStaffUsers).catch(() => {});
      } else if (change.entity === 'settings') {
        apiGetSettings().then(s => { setSettings(s); setSettingsForm(s); }).catch(() => {});
      } else if (change.entity === 'dispatches') {
        apiGetFieldDispatches().then(setDispatches).catch(() => {});
      } else if (change.entity === 'suppliers') {
        apiGetSuppliers().then(setSuppliers).catch(() => {});
      } else if (change.entity === 'purchases') {
        apiGetPurchases().then(setPurchases).catch(() => {});
      } else if (change.entity === 'returns') {
        apiGetReturns().then(setSalesReturns).catch(() => {});
      } else if (change.entity === 'expenses') {
        apiGetExpenses().then(setExpenses).catch(() => {});
      } else if (change.entity === 'database') {
        loadCloudSqlData();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Staff Account Handlers
  const handleAddStaff = async (newStaff: StaffUser) => {
    const updated = [newStaff, ...staffUsers];
    setStaffUsers(updated);
    try {
      await apiSaveStaff(newStaff);
    } catch (e) {
      console.error('Failed to save staff to Cloud SQL:', e);
    }
  };

  const handleUpdateStaff = async (updatedStaff: StaffUser) => {
    const updated = staffUsers.map(s => s.id === updatedStaff.id ? updatedStaff : s);
    setStaffUsers(updated);
    if (currentUser?.id === updatedStaff.id) {
      setCurrentUser(updatedStaff);
      localStorage.setItem('jm_current_user', JSON.stringify(updatedStaff));
    }
    try {
      await apiSaveStaff(updatedStaff);
    } catch (e) {
      console.error('Failed to update staff in Cloud SQL:', e);
    }
  };

  const handleDeleteStaff = async (id: string) => {
    const updated = staffUsers.filter(s => s.id !== id);
    setStaffUsers(updated);
    try {
      await apiDeleteStaff(id);
    } catch (e) {
      console.error('Failed to delete staff from Cloud SQL:', e);
    }
  };

  const handleLoginUser = (user: StaffUser) => {
    setCurrentUser(user);
    localStorage.setItem('jm_current_user', JSON.stringify(user));
    setCurrentView('dashboard');
    
    // Auto redirect to permitted default tab
    if (user.role === 'ADMIN' || user.permissions.includes('view_overview')) setActiveTab('overview');
    else if (user.permissions.includes('view_inventory')) setActiveTab('inventory');
    else if (user.permissions.includes('view_documents')) setActiveTab('docs');
    else if (user.permissions.includes('view_due_ledger')) setActiveTab('due_ledger');
    else if (user.permissions.includes('view_reports')) setActiveTab('reports');
    else if (user.permissions.includes('view_staff_management')) setActiveTab('staff_management');
    else if (user.permissions.includes('manage_settings')) setActiveTab('settings');
  };

  // Clear All Data Handler (for fresh entry)
  const handleClearAllData = async () => {
    if (window.confirm("আপনি কি নিশ্চিত যে আপনি ডাটাবেজের সমস্ত পণ্য, গ্রাহক, ইনভয়েস, পারচেজ, ডেলিভারি চালান ও খরচ তালিকা সম্পূর্ণ খালি (Clear) করতে চান? এটি করলে একদম নতুন করে ডাটাবেজ সেটআপ করতে পারবেন।")) {
      try {
        await apiClearDatabase();
        setProducts([]);
        setCustomers([]);
        setDocuments([]);
        setDispatches([]);
        setSuppliers([]);
        setPurchases([]);
        setSalesReturns([]);
        setExpenses([]);
        localStorage.setItem('hsc_products', '[]');
        localStorage.setItem('hsc_customers', '[]');
        localStorage.setItem('hsc_documents', '[]');
        localStorage.setItem('hsc_dispatches', '[]');
        localStorage.setItem('hsc_suppliers', '[]');
        localStorage.setItem('hsc_purchases', '[]');
        localStorage.setItem('hsc_returns', '[]');
        localStorage.setItem('hsc_expenses', '[]');
        alert("ডাটাবেজ সফলভাবে সম্পূর্ণ খালি করা হয়েছে! এখন আপনি নতুন করে ডাটা সেটআপ করতে পারবেন।");
      } catch (e: any) {
        console.error('Error clearing database:', e);
        alert("ডাটাবেজ ক্লিয়ার করতে সমস্যা হয়েছে: " + (e.message || ''));
      }
    }
  };

  // Restore Sample Demo Data Handler
  const handleRestoreSampleData = async () => {
    if (window.confirm("আপনি কি ডেমো স্যাম্পল ডাটা ডাটাবেজে রিস্টোর করতে চান?")) {
      try {
        await apiSeedDemoData();
        await loadCloudSqlData();
        alert("ডেমো ডাটা সফলভাবে রিস্টোর হয়েছে!");
      } catch (e: any) {
        console.error('Error restoring sample data:', e);
        alert('ডেমো ডাটা রিস্টোর করতে সমস্যা হয়েছে।');
      }
    }
  };

  // HANDLERS FOR INVENTORY / PRODUCTS
  const handleAddProduct = async (p: Product) => {
    const list = [p, ...products];
    setProducts(list);
    localStorage.setItem('hsc_products', JSON.stringify(list));
    try {
      await apiSaveProduct(p);
    } catch (e: any) {
      console.warn('Backend sync warning:', e);
      // Data is saved in local browser state & localStorage
    }
  };

  const handleUpdateProduct = async (p: Product) => {
    const list = products.map(item => item.id === p.id ? p : item);
    setProducts(list);
    localStorage.setItem('hsc_products', JSON.stringify(list));
    try {
      await apiSaveProduct(p);
    } catch (e: any) {
      console.warn('Backend sync warning:', e);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const list = products.filter(p => p.id !== id);
    setProducts(list);
    localStorage.setItem('hsc_products', JSON.stringify(list));
    try {
      await apiDeleteProduct(id);
    } catch (e: any) {
      console.warn('Backend sync warning:', e);
    }
  };

  // HANDLERS FOR CUSTOMERS
  const handleAddCustomer = async (c: Customer) => {
    const list = [c, ...customers];
    setCustomers(list);
    localStorage.setItem('hsc_customers', JSON.stringify(list));
    try {
      await apiSaveCustomer(c);
    } catch (e: any) {
      console.warn('Backend sync warning:', e);
    }
  };

  // HANDLERS FOR DOCUMENTS
  const handleSaveDocument = async (doc: Document) => {
    let list = [...documents];
    const exists = documents.some(d => d.id === doc.id);
    if (exists) {
      list = documents.map(d => d.id === doc.id ? doc : d);
    } else {
      list = [doc, ...documents];
    }

    // Auto-generate or update corresponding Delivery Challan whenever a Bill or Invoice is created/saved
    if (doc.type === 'INVOICE' || doc.type === 'BILL') {
      const challanPrefix = 'JM/CH/2026/';
      const docNumParts = doc.docNumber.split('/');
      const numSuffix = docNumParts[docNumParts.length - 1] || Math.floor(1000 + Math.random() * 9000).toString();
      const challanDocNumber = `${challanPrefix}${numSuffix}`;

      const challanId = `doc-ch-${doc.id}`;
      const existingChallanIndex = list.findIndex(d => d.id === challanId || d.docNumber === challanDocNumber);

      const challanDoc: Document = {
        id: existingChallanIndex >= 0 ? list[existingChallanIndex].id : challanId,
        type: 'CHALLAN',
        docNumber: existingChallanIndex >= 0 ? list[existingChallanIndex].docNumber : challanDocNumber,
        date: doc.date,
        dueDate: undefined,
        customerId: doc.customerId,
        customerName: doc.customerName,
        customerCompany: doc.customerCompany,
        customerPhone: doc.customerPhone,
        customerEmail: doc.customerEmail,
        customerAddress: doc.customerAddress,
        subject: `Delivery Challan for ${doc.type === 'INVOICE' ? 'Invoice' : 'Bill'} ${doc.docNumber}`,
        salutation: doc.salutation || 'Dear Sir,',
        openingParagraph: 'Please receive the following genuine spare parts and equipment in good condition as per order/bill.',
        closingParagraph: 'Received the above goods in sound and complete condition.',
        items: doc.items.map(it => ({
          ...it,
          price: 0,
          total: 0
        })),
        subtotal: 0,
        taxRate: 0,
        taxAmount: 0,
        discount: 0,
        total: 0,
        status: 'Active',
        terms: '1. Please check the goods at the time of delivery.\n2. Claims regarding damages must be reported within 24 hours.',
        signatureName: doc.signatureName,
        signatureLabel: doc.signatureLabel,
        vatEnabled: false
      };

      if (existingChallanIndex >= 0) {
        list = list.map((d, i) => i === existingChallanIndex ? challanDoc : d);
      } else {
        list = [challanDoc, ...list];
      }
      apiSaveDocument(challanDoc).catch(() => {});
    }

    setDocuments(list);
    localStorage.setItem('hsc_documents', JSON.stringify(list));

    try {
      await apiSaveDocument(doc);
    } catch (e: any) {
      console.warn('Backend sync warning:', e);
    }
    
    // Decrement stock levels if a paid sales invoice is created
    if (doc.type === 'INVOICE' && doc.status === 'Paid' && !exists) {
      const updatedProducts = products.map(prod => {
        const itemInDoc = doc.items.find(it => it.productId === prod.id);
        if (itemInDoc) {
          const updatedProd = {
            ...prod,
            stock: Math.max(0, prod.stock - itemInDoc.quantity)
          };
          apiSaveProduct(updatedProd).catch(() => {});
          return updatedProd;
        }
        return prod;
      });
      setProducts(updatedProducts);
    }

    setEditingDocument(null);
    setIsCreatingDoc(null);
    setActiveTab('docs');
    setViewingDocument(doc); // View the printable layout immediately!
  };

  const handleDeleteDocument = async (id: string) => {
    const list = documents.filter(d => d.id !== id);
    setDocuments(list);
    try {
      await apiDeleteDocument(id);
    } catch (e) {
      console.error('Failed to delete document:', e);
    }
  };

  // HANDLERS FOR FIELD DISPATCHES / SERVICE LOGS
  const handleSaveDispatch = async (dispatch: FieldDispatch) => {
    let list = [...dispatches];
    const existingIndex = dispatches.findIndex(d => d.id === dispatch.id);
    if (existingIndex >= 0) {
      list[existingIndex] = dispatch;
    } else {
      list = [dispatch, ...dispatches];
    }
    setDispatches(list);
    localStorage.setItem('hsc_dispatches', JSON.stringify(list));

    try {
      await apiSaveFieldDispatch(dispatch);
    } catch (e) {
      console.warn('Backend sync warning for dispatch:', e);
    }
  };

  const handleDeleteDispatch = async (id: string) => {
    const list = dispatches.filter(d => d.id !== id);
    setDispatches(list);
    localStorage.setItem('hsc_dispatches', JSON.stringify(list));
    try {
      await apiDeleteFieldDispatch(id);
    } catch (e) {
      console.error('Failed to delete dispatch:', e);
    }
  };

  // Supplier CRUD Handlers
  const handleSaveSupplier = async (supplier: Supplier) => {
    const existingIndex = suppliers.findIndex(s => s.id === supplier.id);
    let list: Supplier[];
    if (existingIndex >= 0) {
      list = [...suppliers];
      list[existingIndex] = supplier;
    } else {
      list = [supplier, ...suppliers];
    }
    setSuppliers(list);
    localStorage.setItem('hsc_suppliers', JSON.stringify(list));
    try {
      await apiSaveSupplier(supplier);
    } catch (e) {
      console.warn('Backend sync warning for supplier:', e);
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    const list = suppliers.filter(s => s.id !== id);
    setSuppliers(list);
    localStorage.setItem('hsc_suppliers', JSON.stringify(list));
    try {
      await apiDeleteSupplier(id);
    } catch (e) {
      console.warn('Backend sync warning for delete supplier:', e);
    }
  };

  // Purchase Entry & Stock Inward Handlers
  const handleSavePurchase = async (purchase: Purchase, updateStock: boolean) => {
    const existingIndex = purchases.findIndex(p => p.id === purchase.id);
    let list: Purchase[];
    if (existingIndex >= 0) {
      list = [...purchases];
      list[existingIndex] = purchase;
    } else {
      list = [purchase, ...purchases];
    }
    setPurchases(list);
    localStorage.setItem('hsc_purchases', JSON.stringify(list));

    // Automatically update or create products in inventory
    let updatedProducts = [...products];
    if (updateStock && purchase.status === 'Received') {
      for (let idx = 0; idx < purchase.items.length; idx++) {
        const item = purchase.items[idx];
        const itemQty = Number(item.quantity) || 1;
        const itemUnitCost = Number(item.unitCost) || 0;
        
        // Find existing product by ID, SKU, or Name
        const existingIdx = updatedProducts.findIndex(p => 
          (item.productId && p.id === item.productId) ||
          (item.sku && p.sku && p.sku.trim().toLowerCase() === item.sku.trim().toLowerCase()) ||
          (p.name.trim().toLowerCase() === item.productName.trim().toLowerCase())
        );

        if (existingIdx >= 0) {
          const matchedProd = updatedProducts[existingIdx];
          const newStock = matchedProd.stock + itemQty;
          const updatedProd: Product = {
            ...matchedProd,
            stock: newStock,
            costPrice: itemUnitCost > 0 ? itemUnitCost : (matchedProd.costPrice || Math.round(matchedProd.price * 0.75)),
            brand: item.brand?.trim() || matchedProd.brand,
            sku: item.sku?.trim() || matchedProd.sku,
            unit: item.unit?.trim() || matchedProd.unit
          };
          updatedProducts[existingIdx] = updatedProd;
          try {
            await apiSaveProduct(updatedProd);
          } catch (e) {
            console.warn('Backend sync warning for updating product stock:', e);
          }
        } else {
          // BRAND NEW PRODUCT - Automatically create in inventory!
          const newId = item.productId && item.productId.startsWith('prod-')
            ? item.productId
            : `prod-${Date.now()}-${idx}`;
          item.productId = newId;

          const newProduct: Product = {
            id: newId,
            name: item.productName.trim() || 'New Purchased Spare Part',
            sku: item.sku?.trim() || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
            category: 'Spare Parts & Consumables',
            brand: item.brand?.trim() || 'Hitachi',
            price: itemUnitCost > 0 ? Math.round(itemUnitCost * 1.35) : 1000,
            costPrice: itemUnitCost,
            stock: itemQty,
            unit: item.unit?.trim() || 'Pcs',
            description: `Auto-added from purchase voucher #${purchase.purchaseNumber}`,
            specs: [],
            imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&auto=format&fit=crop&q=60'
          };
          updatedProducts = [newProduct, ...updatedProducts];
          try {
            await apiSaveProduct(newProduct);
          } catch (e) {
            console.warn('Backend sync warning for new purchase product:', e);
          }
        }
      }

      setProducts(updatedProducts);
      localStorage.setItem('hsc_products', JSON.stringify(updatedProducts));
    }

    try {
      await apiSavePurchase(purchase);
    } catch (e) {
      console.warn('Backend sync warning for purchase:', e);
    }
  };

  const handleDeletePurchase = async (id: string) => {
    const list = purchases.filter(p => p.id !== id);
    setPurchases(list);
    localStorage.setItem('hsc_purchases', JSON.stringify(list));
    try {
      await apiDeletePurchase(id);
    } catch (e) {
      console.warn('Backend sync warning for delete purchase:', e);
    }
  };

  // Sales Returns & Restock Handlers
  const handleSaveReturn = async (ret: SalesReturn) => {
    const existingIndex = salesReturns.findIndex(r => r.id === ret.id);
    let list: SalesReturn[];
    if (existingIndex >= 0) {
      list = [...salesReturns];
      list[existingIndex] = ret;
    } else {
      list = [ret, ...salesReturns];
    }
    setSalesReturns(list);
    localStorage.setItem('hsc_returns', JSON.stringify(list));

    // 1. If restocked, increase inventory product stock immediately!
    if (ret.restocked && ret.quantity > 0) {
      const updatedProducts = products.map(prod => {
        if (prod.id === ret.productId || (ret.sku && prod.sku.toLowerCase() === ret.sku.toLowerCase())) {
          const updated = {
            ...prod,
            stock: prod.stock + ret.quantity
          };
          apiSaveProduct(updated).catch(() => {});
          return updated;
        }
        return prod;
      });
      setProducts(updatedProducts);
      localStorage.setItem('hsc_products', JSON.stringify(updatedProducts));
    }

    // 2. If deductFromDue, adjust customer's invoice/bill due amount
    if (ret.deductFromDue && ret.refundAmount > 0 && ret.originalDocId) {
      const doc = documents.find(d => d.id === ret.originalDocId);
      if (doc) {
        const currentDue = doc.dueAmount !== undefined ? doc.dueAmount : doc.total;
        const newDue = Math.max(0, currentDue - ret.refundAmount);
        const newPaid = Math.max(0, doc.total - newDue);
        const updatedDoc: Document = {
          ...doc,
          dueAmount: newDue,
          paidAmount: newPaid,
          status: newDue === 0 ? 'Paid' : 'Partially Paid',
          notes: (doc.notes || '') + `\n[Sales Return #${ret.returnNumber}: ৳${ret.refundAmount.toLocaleString()} adjusted against due on ${ret.returnDate}]`
        };
        const updatedDocs = documents.map(d => d.id === updatedDoc.id ? updatedDoc : d);
        setDocuments(updatedDocs);
        localStorage.setItem('hsc_documents', JSON.stringify(updatedDocs));
        apiSaveDocument(updatedDoc).catch(() => {});
      }
    }

    try {
      await apiSaveReturn(ret);
    } catch (e) {
      console.warn('Backend sync warning for sales return:', e);
    }
  };

  const handleDeleteReturn = async (id: string) => {
    const list = salesReturns.filter(r => r.id !== id);
    setSalesReturns(list);
    localStorage.setItem('hsc_returns', JSON.stringify(list));
    try {
      await apiDeleteReturn(id);
    } catch (e) {
      console.warn('Backend sync warning for delete sales return:', e);
    }
  };

  // Daily Expense Handlers
  const handleSaveExpense = async (expense: Expense) => {
    const existingIndex = expenses.findIndex(e => e.id === expense.id);
    let list: Expense[];
    if (existingIndex >= 0) {
      list = [...expenses];
      list[existingIndex] = expense;
    } else {
      list = [expense, ...expenses];
    }
    setExpenses(list);
    localStorage.setItem('hsc_expenses', JSON.stringify(list));
    try {
      await apiSaveExpense(expense);
    } catch (e) {
      console.warn('Backend sync warning for expense:', e);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    const list = expenses.filter(e => e.id !== id);
    setExpenses(list);
    localStorage.setItem('hsc_expenses', JSON.stringify(list));
    try {
      await apiDeleteExpense(id);
    } catch (e) {
      console.warn('Backend sync warning for delete expense:', e);
    }
  };

  // Batch Update Documents Handler (for Company-wide Payment Allocation)
  const handleBatchUpdateDocuments = async (docsToUpdate: Document[]) => {
    const updatedMap = new Map(docsToUpdate.map(d => [d.id, d]));
    const list = documents.map(doc => updatedMap.has(doc.id) ? updatedMap.get(doc.id)! : doc);
    setDocuments(list);
    localStorage.setItem('hsc_documents', JSON.stringify(list));

    for (const doc of docsToUpdate) {
      try {
        await apiSaveDocument(doc);
      } catch (e) {
        console.warn('Backend sync warning for document update:', e);
      }
    }
  };

  const handleUpdateProductStock = async (productId: string, quantityDelta: number) => {
    const updatedProducts = products.map(prod => {
      if (prod.id === productId) {
        const updated = {
          ...prod,
          stock: Math.max(0, prod.stock + quantityDelta)
        };
        apiSaveProduct(updated).catch(() => {});
        return updated;
      }
      return prod;
    });
    setProducts(updatedProducts);
    localStorage.setItem('hsc_products', JSON.stringify(updatedProducts));
  };

  // HANDLER FOR SETTINGS SAVE
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettings(settingsForm);
    try {
      await apiSaveSettings(settingsForm);
      setSettingsSavedFeedback(true);
      setTimeout(() => setSettingsSavedFeedback(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      alert('Error saving settings to database.');
    }
  };

  // Quick helper to logout / reset view
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('jm_current_user');
    setCurrentView('catalog');
    setViewingDocument(null);
    setEditingDocument(null);
    setIsCreatingDoc(null);
  };

  // Render printable document layout if selected
  if (viewingDocument) {
    return (
      <PrintDocument 
        document={viewingDocument}
        settings={settings}
        onBack={() => setViewingDocument(null)}
      />
    );
  }

  // RENDER MAIN APPLICATION WRAPPERS
  return (
    <div className="font-sans antialiased text-slate-800 bg-slate-50 min-h-screen">
      
      {/* 1. PUBLIC WEBSITE CATALOG VIEW */}
      {currentView === 'catalog' && (
        <PublicCatalog 
          products={products}
          onAdminClick={() => {
            setCurrentView('login');
          }}
        />
      )}

      {/* 2. ADMIN PORTAL SECURE ACCESS PAGE */}
      {currentView === 'login' && (
        <AdminLogin 
          staffUsers={staffUsers}
          onLoginSuccess={handleLoginUser}
          onBackToCatalog={() => setCurrentView('catalog')}
        />
      )}

      {/* 3. CORE SECURE EXECUTIVE DASHBOARD */}
      {currentView === 'dashboard' && (
        <div className="min-h-screen flex flex-col md:flex-row animate-fade-in">
          
          {/* Dashboard Left Sidebar */}
          <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col justify-between border-r border-slate-950 flex-shrink-0 z-30 no-print">
            <div>
              {/* Brand Header */}
              <div className="p-5 border-b border-slate-950 flex items-center justify-center h-16">
                <Logo className="h-full w-auto text-white" light={true} logoUrl={settings.logoUrl} alt={settings.name} />
              </div>

              {/* Sidebar Tabs Links */}
              <nav className="p-4 space-y-1.5 text-xs font-bold uppercase tracking-wider">
                {/* Switch to Public Website & Logout */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-800/80 hover:bg-rose-950/70 text-slate-200 hover:text-white border border-slate-700/70 hover:border-rose-800 rounded-xl transition-all text-left mb-4 font-extrabold cursor-pointer group shadow-2xs"
                  title="Logout and visit Public Website"
                >
                  <span className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-400 group-hover:text-rose-400" />
                    Public Website
                  </span>
                  <span className="text-[9px] bg-slate-700 group-hover:bg-rose-900 text-slate-300 group-hover:text-rose-200 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                    Logout
                  </span>
                </button>

                <div className="text-[10px] text-slate-500 tracking-widest uppercase font-black px-3 pb-2">
                  Management Hub
                </div>

                {/* Tab: Overview */}
                {hasPermission('view_overview') && (
                  <button
                    onClick={() => { setActiveTab('overview'); setEditingDocument(null); setIsCreatingDoc(null); }}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-lg transition-all text-left cursor-pointer ${
                      activeTab === 'overview' && !editingDocument && !isCreatingDoc
                        ? 'bg-blue-600 text-white font-extrabold shadow-sm'
                        : 'hover:bg-slate-800 hover:text-slate-100'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    Overview Stats
                  </button>
                )}

                {/* Tab: Inventory */}
                {hasPermission('view_inventory') && (
                  <button
                    onClick={() => { setActiveTab('inventory'); setEditingDocument(null); setIsCreatingDoc(null); }}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-lg transition-all text-left cursor-pointer ${
                      activeTab === 'inventory'
                        ? 'bg-blue-600 text-white font-extrabold shadow-sm'
                        : 'hover:bg-slate-800 hover:text-slate-100'
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Stock Inventory
                  </button>
                )}

                {/* Tab: Purchases / Stock Inward */}
                {hasPermission('view_purchases') && (
                  <button
                    onClick={() => { setActiveTab('purchases'); setEditingDocument(null); setIsCreatingDoc(null); }}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-lg transition-all text-left cursor-pointer ${
                      activeTab === 'purchases'
                        ? 'bg-emerald-600 text-white font-extrabold shadow-sm'
                        : 'hover:bg-slate-800 hover:text-slate-100'
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4 text-emerald-400" />
                    Purchase Entry (ক্রয়)
                  </button>
                )}

                {/* Tab: Documents */}
                {hasPermission('view_documents') && (
                  <button
                    onClick={() => { setActiveTab('docs'); setEditingDocument(null); setIsCreatingDoc(null); }}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-lg transition-all text-left cursor-pointer ${
                      activeTab === 'docs'
                        ? 'bg-blue-600 text-white font-extrabold shadow-sm'
                        : 'hover:bg-slate-800 hover:text-slate-100'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    Documents Hub
                  </button>
                )}

                {/* Tab: Reports */}
                {hasPermission('view_reports') && (
                  <button
                    onClick={() => { setActiveTab('reports'); setEditingDocument(null); setIsCreatingDoc(null); }}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-lg transition-all text-left cursor-pointer ${
                      activeTab === 'reports'
                        ? 'bg-blue-600 text-white font-extrabold shadow-sm'
                        : 'hover:bg-slate-800 hover:text-slate-100'
                    }`}
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Reports Hub
                  </button>
                )}

                {/* Tab: Due Ledger */}
                {hasPermission('view_due_ledger') && (
                  <button
                    onClick={() => { setActiveTab('due_ledger'); setEditingDocument(null); setIsCreatingDoc(null); }}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-lg transition-all text-left cursor-pointer ${
                      activeTab === 'due_ledger'
                        ? 'bg-blue-600 text-white font-extrabold shadow-sm'
                        : 'hover:bg-slate-800 hover:text-slate-100'
                    }`}
                  >
                    <FileText className="w-4 h-4 text-rose-400" />
                    Due Ledger
                  </button>
                )}

                {/* Tab: Daily Expenses */}
                {hasPermission('view_expenses') && (
                  <button
                    onClick={() => { setActiveTab('expenses'); setEditingDocument(null); setIsCreatingDoc(null); }}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-lg transition-all text-left cursor-pointer ${
                      activeTab === 'expenses'
                        ? 'bg-rose-700 text-white font-extrabold shadow-sm'
                        : 'hover:bg-slate-800 hover:text-slate-100'
                    }`}
                  >
                    <Wallet className="w-4 h-4 text-rose-400" />
                    Daily Expenses (খরচ)
                  </button>
                )}

                {/* Tab: Owner's Personal Drawings */}
                {(currentUser?.role === 'ADMIN' || hasPermission('view_owner_draw') || hasPermission('view_expenses')) && (
                  <button
                    onClick={() => { setActiveTab('owner_draw'); setEditingDocument(null); setIsCreatingDoc(null); }}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-lg transition-all text-left cursor-pointer ${
                      activeTab === 'owner_draw'
                        ? 'bg-rose-800 text-white font-extrabold shadow-sm'
                        : 'hover:bg-slate-800 hover:text-slate-100'
                    }`}
                  >
                    <UserCheck className="w-4 h-4 text-rose-300" />
                    Owner's Draw (মালিকের উত্তোলন)
                  </button>
                )}

                {/* Tab: Field Service & Dispatches */}
                {hasPermission('view_field_dispatch') && (
                  <button
                    onClick={() => { setActiveTab('dispatch'); setEditingDocument(null); setIsCreatingDoc(null); }}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-lg transition-all text-left cursor-pointer ${
                      activeTab === 'dispatch'
                        ? 'bg-blue-600 text-white font-extrabold shadow-sm'
                        : 'hover:bg-slate-800 hover:text-slate-100'
                    }`}
                  >
                    <Truck className="w-4 h-4 text-amber-400" />
                    Field Service & Dispatches
                  </button>
                )}

                {/* Tab: Company Profiles */}
                {hasPermission('view_company_profiles') && (
                  <button
                    onClick={() => { setActiveTab('company_profiles'); setEditingDocument(null); setIsCreatingDoc(null); }}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-lg transition-all text-left cursor-pointer ${
                      activeTab === 'company_profiles'
                        ? 'bg-blue-600 text-white font-extrabold shadow-sm'
                        : 'hover:bg-slate-800 hover:text-slate-100'
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-teal-400" />
                    Company Profiles
                  </button>
                )}

                {/* Tab: Staff Sub-Accounts */}
                {hasPermission('view_staff_management') && (
                  <button
                    onClick={() => { setActiveTab('staff_management'); setEditingDocument(null); setIsCreatingDoc(null); }}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-lg transition-all text-left cursor-pointer ${
                      activeTab === 'staff_management'
                        ? 'bg-blue-600 text-white font-extrabold shadow-sm'
                        : 'hover:bg-slate-800 hover:text-slate-100'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                    Staff Sub-Accounts
                  </button>
                )}

                {/* Tab: Business Settings */}
                {hasPermission('manage_settings') && (
                  <button
                    onClick={() => { setActiveTab('settings'); setEditingDocument(null); setIsCreatingDoc(null); }}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-lg transition-all text-left cursor-pointer ${
                      activeTab === 'settings'
                        ? 'bg-blue-600 text-white font-extrabold shadow-sm'
                        : 'hover:bg-slate-800 hover:text-slate-100'
                    }`}
                  >
                    <Sliders className="w-4 h-4" />
                    Showroom Settings
                  </button>
                )}
              </nav>
            </div>

            {/* Sidebar Active User Profile Card */}
            {currentUser && (
              <div className="p-4 border-t border-slate-950 bg-slate-950/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">
                      {currentUser.name.charAt(0)}
                    </div>
                    <div className="overflow-hidden">
                      <span className="font-bold text-xs text-white block truncate">{currentUser.name}</span>
                      <span className="text-[10px] text-slate-400 font-semibold block truncate">{currentUser.designation || currentUser.role}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                    currentUser.role === 'ADMIN' ? 'bg-purple-900 text-purple-200 border border-purple-700' : 'bg-blue-900 text-blue-200'
                  }`}>
                    {currentUser.role}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setCurrentView('login')}
                    className="flex items-center justify-center gap-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-bold uppercase transition-colors cursor-pointer"
                    title="Switch user account"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Switch
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-1 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-900/60 rounded-lg text-[10px] font-bold uppercase transition-colors cursor-pointer"
                    title="Logout from Admin Panel"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-400" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </aside>

          {/* Core workspace content */}
          <main className="flex-1 bg-slate-50 min-h-screen flex flex-col justify-between">
            {/* Top Workspace Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between no-print">
              <div className="flex items-center gap-3">
                <FolderLock className="w-5 h-5 text-blue-900" />
                <div className="text-xs">
                  <span className="font-bold text-slate-900 font-display block">
                    hitachisolutioncenter Workspace
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">
                    Session: {currentUser ? `${currentUser.name} (${currentUser.role})` : 'Active Session'}
                  </span>
                </div>
              </div>

              {/* Right Side Header Items */}
              <div className="flex items-center gap-3">
                <span className="hidden lg:inline text-xs italic text-blue-900 font-medium font-sans">
                  "Your Problem Solution is Sustainable Partner"
                </span>
                <button
                  type="button"
                  onClick={handleCheckDatabase}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 hover:border-emerald-300 rounded-full text-[10px] font-black uppercase tracking-wider shadow-2xs cursor-pointer transition-all"
                  title="Click to check live database connection and record metrics"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <Zap className="w-3 h-3 text-emerald-600 fill-emerald-600" />
                  Live Database Connected &bull; Check DB
                </button>
                
                {/* Header Logout Button */}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 hover:border-rose-300 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
                  title="Logout from Admin Panel"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-600" />
                  Logout
                </button>
              </div>
            </header>

            {/* Render Tab panels */}
            <div className="p-6 md:p-8 flex-1">
              
              {/* Document Creation Forms takes priority */}
              {editingDocument || isCreatingDoc ? (
                <DocumentCreator 
                  products={products}
                  customers={customers}
                  settings={settings}
                  onSaveDocument={handleSaveDocument}
                  onAddCustomer={handleAddCustomer}
                  editingDocument={editingDocument}
                  onCancel={() => { setEditingDocument(null); setIsCreatingDoc(null); }}
                />
              ) : (
                <>
                  {/* TAB PANEL 1: Overview */}
                  {activeTab === 'overview' && hasPermission('view_overview') && (
                    <DashboardOverview 
                      documents={documents}
                      products={products}
                      customers={customers}
                      expenses={expenses}
                      purchases={purchases}
                      dispatches={dispatches}
                      onNavigateToTab={(tab) => setActiveTab(tab)}
                      onViewDocument={(doc) => setViewingDocument(doc)}
                    />
                  )}

                  {/* TAB PANEL 2: Inventory Stock */}
                  {activeTab === 'inventory' && hasPermission('view_inventory') && (
                    <InventoryManager 
                      products={products}
                      documents={documents}
                      dispatches={dispatches}
                      onAddProduct={handleAddProduct}
                      onUpdateProduct={handleUpdateProduct}
                      onDeleteProduct={handleDeleteProduct}
                      onViewDocument={(doc) => setViewingDocument(doc)}
                    />
                  )}

                  {/* TAB PANEL 2b: Purchases & Inward Stock Management */}
                  {activeTab === 'purchases' && hasPermission('view_purchases') && (
                    <PurchasesView 
                      purchases={purchases}
                      suppliers={suppliers}
                      products={products}
                      settings={settings}
                      currentUser={currentUser}
                      onSavePurchase={handleSavePurchase}
                      onDeletePurchase={handleDeletePurchase}
                      onSaveSupplier={handleSaveSupplier}
                      onDeleteSupplier={handleDeleteSupplier}
                      onUpdateProductStock={handleUpdateProductStock}
                    />
                  )}

                  {/* TAB PANEL 3: Documents List Log */}
                  {activeTab === 'docs' && hasPermission('view_documents') && (
                    <DocumentList 
                      documents={documents}
                      onAddDocumentClick={(type) => setIsCreatingDoc(type)}
                      onEditDocument={(doc) => setEditingDocument(doc)}
                      onDeleteDocument={handleDeleteDocument}
                      onViewDocument={(doc) => setViewingDocument(doc)}
                    />
                  )}

                  {/* TAB PANEL 4: Reports Hub */}
                  {activeTab === 'reports' && hasPermission('view_reports') && (
                    <ReportsHub 
                      documents={documents}
                      products={products}
                      customers={customers}
                      returns={salesReturns}
                      expenses={expenses}
                      purchases={purchases}
                      dispatches={dispatches}
                      onSaveReturn={handleSaveReturn}
                      onDeleteReturn={handleDeleteReturn}
                    />
                  )}

                  {/* TAB PANEL 4b: Due Ledger */}
                  {activeTab === 'due_ledger' && hasPermission('view_due_ledger') && (
                    <DueLedger 
                      documents={documents}
                      customers={customers}
                      settings={settings}
                      onUpdateDocument={handleSaveDocument}
                      onBatchUpdateDocuments={handleBatchUpdateDocuments}
                      onViewDocument={(doc) => setViewingDocument(doc)}
                    />
                  )}

                  {/* TAB PANEL 4c: Daily Expenses Management */}
                  {activeTab === 'expenses' && hasPermission('view_expenses') && (
                    <ExpenseManager 
                      expenses={expenses}
                      staffUsers={staffUsers}
                      currentUser={currentUser}
                      settings={settings}
                      onSaveExpense={handleSaveExpense}
                      onDeleteExpense={handleDeleteExpense}
                    />
                  )}

                  {/* TAB PANEL 4c2: Owner's Personal Expenses & Drawings */}
                  {(activeTab === 'owner_draw' || activeTab === 'owner_drawings') && (
                    <OwnerDrawManager 
                      expenses={expenses}
                      documents={documents}
                      dispatches={dispatches}
                      purchases={purchases}
                      staffUsers={staffUsers}
                      currentUser={currentUser}
                      settings={settings}
                      onSaveExpense={handleSaveExpense}
                      onDeleteExpense={handleDeleteExpense}
                    />
                  )}

                  {/* TAB PANEL 4d: Field Service & Work Logs Hub */}
                  {activeTab === 'dispatch' && hasPermission('view_field_dispatch') && (
                    <FieldDispatchManager 
                      dispatches={dispatches}
                      customers={customers}
                      staffUsers={staffUsers}
                      settings={settings}
                      onSaveDispatch={handleSaveDispatch}
                      onDeleteDispatch={handleDeleteDispatch}
                    />
                  )}

                  {/* TAB PANEL 4e: Company Profiles & Unique ID Directory */}
                  {activeTab === 'company_profiles' && hasPermission('view_company_profiles') && (
                    <CompanyProfileManager 
                      customers={customers}
                      documents={documents}
                      dispatches={dispatches}
                      products={products}
                      onSaveCustomer={handleAddCustomer}
                      onViewDocument={(doc) => setViewingDocument(doc)}
                    />
                  )}

                  {/* TAB PANEL 4c: Staff Sub-Accounts & Role Rules */}
                  {activeTab === 'staff_management' && hasPermission('view_staff_management') && (
                    <StaffManagement 
                      staffUsers={staffUsers}
                      currentUser={currentUser}
                      onAddStaff={handleAddStaff}
                      onUpdateStaff={handleUpdateStaff}
                      onDeleteStaff={handleDeleteStaff}
                    />
                  )}

                  {/* TAB PANEL 5: Business Settings Editor */}
                  {activeTab === 'settings' && (
                    <div className="max-w-4xl space-y-6">
                      
                      {/* 1. BRANDING, LOGO & WATERMARK MANAGEMENT CARD */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-6">
                        <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <ImageIcon className="w-5 h-5 text-blue-900" />
                              <h3 className="text-sm sm:text-base font-bold text-slate-900 font-display">
                                লোগো ও ব্যাকগ্রাউন্ড জলছাপ ব্যবস্থাপনা (Logo & Watermark Settings)
                              </h3>
                            </div>
                            <p className="text-slate-500 text-[11px] mt-0.5">
                              আপনার নিজস্ব কোম্পানি লোগো ও প্রিন্ট ডকুমেন্টের ব্যাকগ্রাউন্ড জলছাপ ম্যানুয়ালি যুক্ত করুন। এটি cPanel ও ডাটাবেজে স্থায়ীভাবে সংরক্ষিত থাকবে।
                            </p>
                          </div>
                          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-1 rounded-lg">
                            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                            cPanel Synced
                          </span>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Left Column: Logo & Watermark Controls */}
                          <div className="space-y-5">
                            
                            {/* SECTION A: COMPANY MAIN LOGO */}
                            <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 space-y-3">
                              <div className="flex justify-between items-center">
                                <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                                  <ImageIcon className="w-3.5 h-3.5 text-blue-700" />
                                  কোম্পানি প্রধান লোগো (Main Logo)
                                </label>
                                {settingsForm.logoUrl && (
                                  <button
                                    type="button"
                                    onClick={() => setSettingsForm({ ...settingsForm, logoUrl: '' })}
                                    className="text-[10px] text-rose-600 hover:text-rose-800 font-bold hover:underline cursor-pointer flex items-center gap-1"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    ডিফল্ট লোগোতে ফিরুন
                                  </button>
                                )}
                              </div>

                              {/* Upload Button & File Input */}
                              <div className="flex items-center gap-3">
                                <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-300 hover:border-blue-700 rounded-xl text-xs font-bold text-slate-700 hover:text-blue-900 cursor-pointer shadow-2xs transition-all ${isUploadingLogo ? 'opacity-60 pointer-events-none' : ''}`}>
                                  <Upload className="w-4 h-4 text-blue-700" />
                                  <span>{isUploadingLogo ? 'লোগো আপলোড হচ্ছে...' : 'নতুন লোগো ছবি আপলোড করুন'}</span>
                                  <input
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleLogoFileUpload(file);
                                    }}
                                    className="hidden"
                                    disabled={isUploadingLogo}
                                  />
                                </label>
                              </div>

                              {/* Manual Image URL Input */}
                              <div className="space-y-1">
                                <span className="text-[10px] text-slate-500 font-semibold">অথবা লোগোর সরাসরি লিংক / Image URL:</span>
                                <input
                                  type="text"
                                  placeholder="e.g. /api/uploads/logo.png অথবা https://example.com/logo.png"
                                  value={settingsForm.logoUrl || ''}
                                  onChange={(e) => setSettingsForm({ ...settingsForm, logoUrl: e.target.value })}
                                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono focus:border-blue-900 focus:outline-hidden"
                                />
                              </div>

                              {/* Live Logo Preview Box */}
                              <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl">
                                <div className="w-24 h-12 flex items-center justify-center bg-slate-100/80 rounded-lg border border-slate-200 p-1 flex-shrink-0">
                                  <Logo logoUrl={settingsForm.logoUrl} className="max-h-full max-w-full text-blue-900" alt="Logo Preview" />
                                </div>
                                <div className="text-[11px] text-slate-600 space-y-0.5">
                                  <div className="font-bold text-slate-800 flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>{settingsForm.logoUrl ? 'কাস্টম লোগো সক্রিয়' : 'ডিফল্ট ভেক্টর লোগো সক্রিয়'}</span>
                                  </div>
                                  <p className="text-[10px] text-slate-400">
                                    এটি ইনভয়েস, কোটেশন, বিল ও সাইডবার হেডারে প্রদর্শিত হবে।
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* SECTION B: DOCUMENT BACKGROUND WATERMARK */}
                            <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 space-y-3">
                              <div className="flex justify-between items-center">
                                <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                                  <Layers className="w-3.5 h-3.5 text-indigo-700" />
                                  কাগজের ব্যাকগ্রাউন্ড জলছাপ (Background Watermark)
                                </label>
                              </div>

                              {/* Enable/Disable Watermark Toggle */}
                              <label className="flex items-center gap-2.5 p-2.5 bg-white border border-slate-200 rounded-xl cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={settingsForm.showWatermark !== 0 && settingsForm.showWatermark !== false}
                                  onChange={(e) => setSettingsForm({ ...settingsForm, showWatermark: e.target.checked ? 1 : 0 })}
                                  className="w-4 h-4 rounded border-slate-300 text-blue-900 focus:ring-blue-900 accent-blue-900 cursor-pointer"
                                />
                                <div className="text-xs">
                                  <span className="font-bold text-slate-900 block">প্রিন্ট ডকুমেন্টে ব্যাকগ্রাউন্ড জলছাপ দেখান</span>
                                  <span className="text-[10px] text-slate-500 block">ইনভয়েস, কোটেশন, বিল ও গ্রাহক লেজারের মাঝখানে জলছাপ থাকবে</span>
                                </div>
                              </label>

                              {(settingsForm.showWatermark !== 0 && settingsForm.showWatermark !== false) && (
                                <div className="space-y-3 pt-2 animate-fade-in">
                                  {/* Watermark Opacity Slider */}
                                  <div className="space-y-1.5 bg-white border border-slate-200 p-3 rounded-xl">
                                    <div className="flex justify-between items-center text-xs">
                                      <span className="font-bold text-slate-700">জলছাপের স্বচ্ছতা (Watermark Opacity):</span>
                                      <span className="font-mono font-black text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-xs">
                                        {Math.round((settingsForm.watermarkOpacity ?? 0.04) * 100)}%
                                      </span>
                                    </div>
                                    <input
                                      type="range"
                                      min="0.01"
                                      max="0.25"
                                      step="0.01"
                                      value={settingsForm.watermarkOpacity ?? 0.04}
                                      onChange={(e) => setSettingsForm({ ...settingsForm, watermarkOpacity: parseFloat(e.target.value) })}
                                      className="w-full accent-blue-900 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
                                    />
                                    <div className="flex justify-between text-[9px] text-slate-400 font-semibold px-0.5">
                                      <span>১% (খুব হালকা)</span>
                                      <span>৪% (আদর্শ / Recommended)</span>
                                      <span>২৫% (গাঢ়)</span>
                                    </div>
                                  </div>

                                  {/* Custom Watermark Image Upload / URL (Optional) */}
                                  <div className="space-y-2 bg-white border border-slate-200 p-3 rounded-xl">
                                    <div className="flex justify-between items-center">
                                      <span className="text-[11px] font-bold text-slate-700">আলাদা জলছাপ ছবি (ঐচ্ছিক):</span>
                                      {settingsForm.watermarkUrl && (
                                        <button
                                          type="button"
                                          onClick={() => setSettingsForm({ ...settingsForm, watermarkUrl: '' })}
                                          className="text-[9px] text-rose-600 hover:text-rose-800 font-bold hover:underline cursor-pointer"
                                        >
                                          লোগোকে জলছাপ হিসেবে ব্যবহার করুন
                                        </button>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <label className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 border border-slate-300 hover:border-indigo-600 rounded-lg text-[11px] font-bold text-slate-700 hover:text-indigo-900 cursor-pointer transition-all ${isUploadingWatermark ? 'opacity-60 pointer-events-none' : ''}`}>
                                        <Upload className="w-3.5 h-3.5 text-indigo-700" />
                                        <span>{isUploadingWatermark ? 'আপলোড হচ্ছে...' : 'জলছাপের ছবি আপলোড'}</span>
                                        <input
                                          type="file"
                                          accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleWatermarkFileUpload(file);
                                          }}
                                          className="hidden"
                                          disabled={isUploadingWatermark}
                                        />
                                      </label>
                                    </div>

                                    <input
                                      type="text"
                                      placeholder="আলাদা জলছাপের URL (ফাঁকা রাখলে প্রধান লোগোই জলছাপ হবে)"
                                      value={settingsForm.watermarkUrl || ''}
                                      onChange={(e) => setSettingsForm({ ...settingsForm, watermarkUrl: e.target.value })}
                                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-[11px] font-mono focus:border-blue-900 focus:outline-hidden"
                                    />
                                    <p className="text-[9px] text-slate-400">
                                      * আলাদা ছবি না দিলে স্বয়ংক্রিয়ভাবে প্রধান লোগোটিই জলছাপ হিসেবে ডকুমেন্টের মাঝে বসে যাবে।
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>

                          </div>

                          {/* Right Column: Live Interactive Document Sheet Simulation */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                <Eye className="w-3.5 h-3.5 text-blue-800" />
                                ডকুমেন্টে লাইভ প্রিভিউ (Live Sheet Preview)
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">A4 Sheet Simulation</span>
                            </div>

                            <div className="border border-slate-300 rounded-2xl bg-slate-100 p-3 sm:p-4 flex items-center justify-center shadow-inner">
                              {/* Simulated A4 Mini Page */}
                              <div className="w-full max-w-[340px] bg-white rounded-lg shadow-md border border-slate-200 p-4 relative overflow-hidden select-none space-y-3 min-h-[380px] flex flex-col justify-between">
                                
                                {/* Background Watermark behind text */}
                                {(settingsForm.showWatermark !== 0 && settingsForm.showWatermark !== false) && (
                                  <div 
                                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] pointer-events-none select-none z-0 flex items-center justify-center transition-opacity duration-150"
                                    style={{ 
                                      opacity: typeof settingsForm.watermarkOpacity === 'number' ? settingsForm.watermarkOpacity : 0.04 
                                    }}
                                  >
                                    {settingsForm.watermarkUrl ? (
                                      <img 
                                        src={settingsForm.watermarkUrl} 
                                        alt="Watermark Preview" 
                                        className="w-full max-h-[160px] object-contain grayscale" 
                                      />
                                    ) : settingsForm.logoUrl ? (
                                      <img 
                                        src={settingsForm.logoUrl} 
                                        alt="Watermark Preview" 
                                        className="w-full max-h-[160px] object-contain grayscale" 
                                      />
                                    ) : (
                                      <Logo className="w-full h-auto text-blue-900" />
                                    )}
                                  </div>
                                )}

                                {/* Letterhead Header */}
                                <div className="relative z-10 border-b border-blue-900/30 pb-2 flex justify-between items-center gap-2">
                                  <div className="h-8 w-auto flex-shrink-0">
                                    <Logo logoUrl={settingsForm.logoUrl} className="h-full w-auto text-blue-900" alt="Logo" />
                                  </div>
                                  <div className="text-right text-[8px] text-slate-500 font-sans leading-tight">
                                    <span className="font-bold text-slate-800 block text-[9px]">{settingsForm.name || 'Jubayer Machineries'}</span>
                                    <span>{settingsForm.phone1 || '01715-994956'}</span>
                                    <span className="block text-blue-800 font-semibold">{settingsForm.website || 'jubayermachineries.com'}</span>
                                  </div>
                                </div>

                                {/* Mock Document Content */}
                                <div className="relative z-10 space-y-2 flex-1 pt-1 text-[9px]">
                                  <div className="bg-slate-100/90 p-1.5 rounded flex justify-between items-center border-l-2 border-blue-900 font-bold">
                                    <span className="text-blue-950 font-display uppercase tracking-wider text-[9px]">INVOICE / বিল</span>
                                    <span className="text-slate-600 font-mono text-[8px]">INV-2026-001</span>
                                  </div>

                                  <div className="text-slate-600 space-y-0.5 text-[8px]">
                                    <p className="font-bold text-slate-800">বিল প্রাপক: Apex Holdings Ltd.</p>
                                    <p>ঠিকানা: Konabari, Gazipur</p>
                                  </div>

                                  <div className="border border-slate-200 rounded overflow-hidden">
                                    <table className="w-full text-left text-[8px]">
                                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                                        <tr>
                                          <th className="p-1">বিবরণ (Item)</th>
                                          <th className="p-1 text-right">মূল্য (BDT)</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100 text-slate-600">
                                        <tr>
                                          <td className="p-1">Hitachi VRF Inverter 10 HP</td>
                                          <td className="p-1 text-right font-mono font-bold">৳৪,৫০,০০০</td>
                                        </tr>
                                        <tr>
                                          <td className="p-1">Copper Pipe 1/2" (100 RFT)</td>
                                          <td className="p-1 text-right font-mono font-bold">৳২৫,০০০</td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>

                                  <div className="flex justify-between items-center pt-1 font-bold text-[9px] border-t border-slate-200">
                                    <span>সর্বমোট প্রদেয় (Total):</span>
                                    <span className="text-blue-900 font-black font-mono">৳৪,৭৫,০০০</span>
                                  </div>
                                </div>

                                {/* Mock Footer Signatures */}
                                <div className="relative z-10 pt-2 border-t border-slate-200 flex justify-between text-[7px] text-slate-400">
                                  <div>
                                    <p className="border-t border-slate-400 pt-0.5 font-bold text-slate-600">Customer Signature</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="border-t border-blue-900 pt-0.5 font-bold text-blue-900">{settingsForm.signatureName || 'MD ZUBAIR HOSSEN'}</p>
                                    <p className="text-[6px] text-slate-500">{settingsForm.signatureLabel || 'Authorized Signatory'}</p>
                                  </div>
                                </div>

                              </div>
                            </div>
                          </div>

                        </div>
                      </div>

                      {/* 2. BUSINESS SHOWROOM METADATA & PREFERENCES */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-6">
                        <div className="border-b border-slate-100 pb-4">
                          <h3 className="text-sm font-bold text-slate-900 font-display">শো-রুম ও যোগাযোগ তথ্য (Showroom Details)</h3>
                          <p className="text-slate-400 text-[11px] mt-0.5">কোম্পানির নাম, ঠিকানা, ফোন নম্বর, ইনভয়েস প্রিফিক্স ও ডিফল্ট শর্তাবলী পরিবর্তন করুন।</p>
                        </div>

                      <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
                        {/* Row 1: Company Name & Slogan */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="font-bold text-slate-700">Company Brand Name</label>
                            <input
                              type="text"
                              value={settingsForm.name}
                              onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:bg-white focus:outline-hidden font-semibold"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="font-bold text-slate-700">Corporate Vision Slogan</label>
                            <input
                              type="text"
                              value={settingsForm.slogan}
                              onChange={(e) => setSettingsForm({ ...settingsForm, slogan: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:bg-white focus:outline-hidden font-semibold"
                            />
                          </div>
                        </div>

                        {/* Row 2: Address */}
                        <div className="space-y-1">
                          <label className="font-bold text-slate-700">Office / Showroom Physical Address</label>
                          <textarea
                            rows={2}
                            value={settingsForm.address}
                            onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:bg-white focus:outline-hidden font-semibold"
                          />
                        </div>

                        {/* Row 3: Phones & Contacts */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <label className="font-bold text-slate-700">Direct Hotline 1</label>
                            <input
                              type="text"
                              value={settingsForm.phone1}
                              onChange={(e) => setSettingsForm({ ...settingsForm, phone1: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:bg-white focus:outline-hidden font-semibold"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="font-bold text-slate-700">Direct Hotline 2</label>
                            <input
                              type="text"
                              value={settingsForm.phone2}
                              onChange={(e) => setSettingsForm({ ...settingsForm, phone2: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:bg-white focus:outline-hidden font-semibold"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="font-bold text-slate-700">Corporate Email</label>
                            <input
                              type="email"
                              value={settingsForm.email}
                              onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:bg-white focus:outline-hidden font-semibold"
                            />
                          </div>
                        </div>

                        {/* Row 4: Website & Tax Rate */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="sm:col-span-2 space-y-1">
                            <label className="font-bold text-slate-700">Company Website</label>
                            <input
                              type="text"
                              value={settingsForm.website}
                              onChange={(e) => setSettingsForm({ ...settingsForm, website: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:bg-white focus:outline-hidden font-semibold"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="font-bold text-slate-700">Standard VAT Rate (%)</label>
                            <input
                              type="number"
                              value={settingsForm.taxRate}
                              onChange={(e) => setSettingsForm({ ...settingsForm, taxRate: Number(e.target.value) })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:bg-white focus:outline-hidden font-semibold"
                            />
                          </div>
                        </div>

                        {/* Row 5: Document Number Prefixes */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 border-t border-slate-100 pt-3">
                          <div className="space-y-1">
                            <label className="font-bold text-slate-700">Offer Letter Prefix</label>
                            <input
                              type="text"
                              value={settingsForm.offerPrefix}
                              onChange={(e) => setSettingsForm({ ...settingsForm, offerPrefix: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:bg-white focus:outline-hidden font-mono text-[10px]"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="font-bold text-slate-700">Quotation Prefix</label>
                            <input
                              type="text"
                              value={settingsForm.quotePrefix}
                              onChange={(e) => setSettingsForm({ ...settingsForm, quotePrefix: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:bg-white focus:outline-hidden font-mono text-[10px]"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="font-bold text-slate-700">Invoice Prefix</label>
                            <input
                              type="text"
                              value={settingsForm.invoicePrefix}
                              onChange={(e) => setSettingsForm({ ...settingsForm, invoicePrefix: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:bg-white focus:outline-hidden font-mono text-[10px]"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="font-bold text-slate-700">Bill Prefix</label>
                            <input
                              type="text"
                              value={settingsForm.billPrefix}
                              onChange={(e) => setSettingsForm({ ...settingsForm, billPrefix: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:bg-white focus:outline-hidden font-mono text-[10px]"
                            />
                          </div>
                        </div>

                        {/* Default terms and condition block */}
                        <div className="space-y-1 border-t border-slate-100 pt-3">
                          <label className="font-bold text-slate-700">Default Terms & Conditions on Printouts</label>
                          <textarea
                            rows={3}
                            value={settingsForm.terms}
                            onChange={(e) => setSettingsForm({ ...settingsForm, terms: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:bg-white focus:outline-hidden font-mono text-[10px] leading-relaxed"
                          />
                        </div>

                        {/* Signatures */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                          <div className="space-y-1">
                            <label className="font-bold text-slate-700">Default Signing Authority Name</label>
                            <input
                              type="text"
                              value={settingsForm.signatureName}
                              onChange={(e) => setSettingsForm({ ...settingsForm, signatureName: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:bg-white focus:outline-hidden font-semibold"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="font-bold text-slate-700">Authority Title Designation</label>
                            <input
                              type="text"
                              value={settingsForm.signatureLabel}
                              onChange={(e) => setSettingsForm({ ...settingsForm, signatureLabel: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:bg-white focus:outline-hidden font-semibold"
                            />
                          </div>
                        </div>

                        {/* Feedback messages */}
                        {settingsSavedFeedback && (
                          <p className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-center flex items-center justify-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            কোম্পানি লোগো, জলছাপ ও সেটিংস সফলভাবে সংরক্ষিত ও cPanel এ সিঙ্ক হয়েছে!
                          </p>
                        )}

                        <div className="flex justify-end gap-3 pt-3">
                          <button
                            type="button"
                            onClick={() => setSettingsForm(settings)}
                            className="px-4 py-2 text-slate-500 font-semibold cursor-pointer"
                          >
                            Reset Form
                          </button>
                          
                          <button
                            type="submit"
                            className="px-6 py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-bold uppercase tracking-wider rounded-xl shadow-xs cursor-pointer flex items-center gap-2 transition-all active:scale-95"
                          >
                            <Save className="w-4 h-4" />
                            Save & Sync to cPanel
                          </button>
                        </div>
                      </form>
                      </div>

                    {/* DATABASE HEALTH DIAGNOSTICS CARD */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 mt-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-blue-900 font-bold">
                          <Activity className="w-5 h-5 text-emerald-600" />
                          <h3 className="text-base">Live Database Health & Connection Diagnostics (ডাটাবেজ স্ট্যাটাস টেস্ট)</h3>
                        </div>
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          Online & Synchronized
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">
                        Check real-time connectivity with MySQL / PostgreSQL server, verify table row counts (Products, Invoices, Dispatches, Staff), verify upload directory permissions, and measure network latency.
                      </p>
                      
                      <div className="flex flex-wrap gap-3 pt-1">
                        <button
                          type="button"
                          onClick={handleCheckDatabase}
                          className="px-4 py-2.5 bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                        >
                          <Activity className="w-4 h-4 text-emerald-400" />
                          Run Database Health Check (ডাটাবেজ চেক করুন)
                        </button>
                      </div>
                    </div>

                    {/* DATABASE RESET / DATA CLEAR CARD */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 mt-6 space-y-4">
                      <div className="flex items-center gap-2 text-rose-700 font-bold">
                        <Trash2 className="w-5 h-5" />
                        <h3 className="text-base">Cloud SQL Database & Sample Data Management</h3>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">
                        Wipe current sample items, customer lists, and documents from Cloud SQL database to start fresh with clean data entry, or restore original demo data.
                      </p>
                      
                      <div className="flex flex-wrap gap-3 pt-2">
                        <button
                          type="button"
                          onClick={handleClearAllData}
                          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                        >
                          <Trash2 className="w-4 h-4" />
                          Clear All Data (Start Fresh)
                        </button>

                        <button
                          type="button"
                          onClick={handleRestoreSampleData}
                          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 cursor-pointer border border-slate-300"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Restore Demo Sample Data
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                </>
              )}

            </div>

            {/* Admin page copyright */}
            <footer className="bg-white border-t border-slate-200 py-4 px-8 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono no-print">
              <span>hitachisolutioncenter Dashboard &bull; Cloud SQL Relational Database Active</span>
              <span>"Your Problem Solution is Sustainable Partner"</span>
            </footer>
          </main>
        </div>
      )}

      {/* DATABASE HEALTH DIAGNOSTICS MODAL */}
      {isDbHealthModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Database className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold font-display">Database & Server Health Check</h3>
                  <span className="text-[10px] text-slate-400 font-mono">hitachisolutioncenter Diagnostics</span>
                </div>
              </div>
              <button
                onClick={() => setIsDbHealthModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {isCheckingDb ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                  <RefreshCw className="w-10 h-10 text-blue-600 animate-spin" />
                  <span className="text-sm font-bold text-slate-800">Testing Database Connection...</span>
                  <span className="text-xs text-slate-500">ডাটাবেজ সংযোগ ও টেবিল ডাটা ভেরিফাই করা হচ্ছে</span>
                </div>
              ) : dbHealthData ? (
                <div className="space-y-4">
                  {/* Status Banner */}
                  <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                    dbHealthData.connected && dbHealthData.status === 'ok'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}>
                    {dbHealthData.connected && dbHealthData.status === 'ok' ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h4 className="font-bold text-sm">
                        {dbHealthData.connected ? 'Database Connected & Fully Functional' : 'Database Connection Issue'}
                      </h4>
                      <p className="text-xs mt-0.5 opacity-90">
                        {dbHealthData.connected 
                          ? 'ডাটাবেজ সঠিকভাবে যুক্ত আছে এবং রিয়েল-টাইম সিঙ্ক সক্রিয় রয়েছে।' 
                          : (dbHealthData.error || 'Could not reach database server.')}
                      </p>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Database Engine</span>
                      <span className="font-bold text-slate-800 block truncate flex items-center gap-1.5">
                        <Server className="w-3.5 h-3.5 text-blue-600" />
                        {dbHealthData.database || 'SQL Database'}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Response Latency</span>
                      <span className="font-bold text-emerald-700 block flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        {dbHealthData.latencyMs !== undefined ? `${dbHealthData.latencyMs} ms (Fast)` : 'Active'}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Uploads Storage</span>
                      <span className="font-bold text-slate-800 block flex items-center gap-1.5">
                        <HardDrive className="w-3.5 h-3.5 text-teal-600" />
                        {dbHealthData.uploadsFolderWritable !== false ? 'Writable (/uploads/)' : 'Restricted'}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Last Verified</span>
                      <span className="font-mono text-[11px] text-slate-600 block">
                        {new Date(dbHealthData.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  {/* Table Record Counts */}
                  {dbHealthData.tables && (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                        Database Tables & Row Counts (সংরক্ষিত ডাটার তালিকা):
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                        <div className="bg-white p-2 rounded-lg border border-slate-200 flex justify-between items-center">
                          <span className="text-slate-600 font-medium">Products:</span>
                          <span className="font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded text-xs">
                            {dbHealthData.tables.products ?? 0}
                          </span>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-slate-200 flex justify-between items-center">
                          <span className="text-slate-600 font-medium">Customers:</span>
                          <span className="font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded text-xs">
                            {dbHealthData.tables.customers ?? 0}
                          </span>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-slate-200 flex justify-between items-center">
                          <span className="text-slate-600 font-medium">Documents:</span>
                          <span className="font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded text-xs">
                            {dbHealthData.tables.documents ?? 0}
                          </span>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-slate-200 flex justify-between items-center">
                          <span className="text-slate-600 font-medium">Staff Accounts:</span>
                          <span className="font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded text-xs">
                            {dbHealthData.tables.staff_users ?? 0}
                          </span>
                        </div>
                        {dbHealthData.tables.field_dispatches !== undefined && (
                          <div className="bg-white p-2 rounded-lg border border-slate-200 flex justify-between items-center">
                            <span className="text-slate-600 font-medium">Dispatches:</span>
                            <span className="font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded text-xs">
                              {dbHealthData.tables.field_dispatches ?? 0}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-between items-center">
              <button
                type="button"
                onClick={handleCheckDatabase}
                disabled={isCheckingDb}
                className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCheckingDb ? 'animate-spin' : ''}`} />
                Re-Test Connection
              </button>
              <button
                type="button"
                onClick={() => setIsDbHealthModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
