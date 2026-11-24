import { useState, useMemo } from 'react';
import { Product, ProductSpec, Document, FieldDispatch, StaffUser, Purchase } from '../types';
import { formatDateDMY } from '../lib/dateFormat';
import { 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  RotateCcw, 
  AlertTriangle, 
  ChevronsUpDown, 
  Eye, 
  BarChart3, 
  Building2, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  X, 
  CheckCircle2, 
  FileText, 
  ShoppingBag, 
  Package,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

interface InventoryManagerProps {
  products: Product[];
  documents?: Document[];
  dispatches?: FieldDispatch[];
  purchases?: Purchase[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct?: (id: string) => void;
  onViewDocument?: (doc: Document) => void;
  currentUser?: StaffUser | null;
}

export default function InventoryManager({
  products,
  documents = [],
  dispatches = [],
  purchases = [],
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onViewDocument,
  currentUser
}: InventoryManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [stockFilter, setStockFilter] = useState<'all' | 'lowest' | 'out' | 'low' | 'adequate'>('all');
  const [sortBy, setSortBy] = useState<'default' | 'stock_asc' | 'stock_desc' | 'name_asc' | 'price_desc'>('default');
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(() => {
    try {
      const saved = Number(localStorage.getItem('jm_low_stock_threshold'));
      return Number.isFinite(saved) && saved >= 1 ? saved : 5;
    } catch {
      return 5;
    }
  });

  const handleThresholdChange = (val: number) => {
    const clean = Math.max(1, Math.min(9999, Math.floor(val) || 1));
    setLowStockThreshold(clean);
    try {
      localStorage.setItem('jm_low_stock_threshold', String(clean));
    } catch {}
  };
  
  // Modal / Form States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Lifetime History Modal State
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  
  const [formData, setFormData] = useState<{
    name: string;
    sku: string;
    crossReference: string;
    measurement: string;
    warehouse: string;
    rack: string;
    shelf: string;
    category?: string;
    brand: string;
    price: number;
    costPrice: number;
    stock: number;
    unit: string;
    description: string;
    specs: ProductSpec[];
    imageUrl: string;
  }>({
    name: '',
    sku: '',
    crossReference: '',
    measurement: '',
    warehouse: '',
    rack: '',
    shelf: '',
    category: 'Spare Parts',
    brand: 'Hitachi',
    price: 0,
    costPrice: 0,
    stock: 0,
    unit: 'Pcs',
    description: '',
    specs: [{ label: '', value: '' }],
    imageUrl: ''
  });

  // LIFETIME ANALYTICS & BUYER LOG CALCULATIONS
  const productAnalytics = useMemo(() => {
    if (!historyProduct) return null;

    const liveProduct = (products || []).find(p => p.id === historyProduct.id) || historyProduct;
    const hpId = String(liveProduct.id || '');
    const hpSku = String(liveProduct.sku || '').trim().toLowerCase();

    // 1. Find all Sales Invoices / Documents containing this product
    const salesRecords: {
      docId: string;
      docNumber: string;
      docType: string;
      date: string;
      customerId: string;
      customerName: string;
      customerCompany: string;
      customerPhone: string;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
      unit: string;
      status: string;
      doc: Document;
    }[] = [];

    // 2. Find all Purchase Bills containing this product
    const purchaseRecords: {
      docId: string;
      docNumber: string;
      date: string;
      supplierName: string;
      quantity: number;
      buyPrice: number;
      lineTotal: number;
      doc: Document;
    }[] = [];

    // 1. Process customer sales from documents (INVOICE, BILL, QUOTATION, OFFER_LETTER)
    // CRITICAL: Custom items (marked isCustom) must NEVER match or affect inventory!
    (documents || []).forEach(doc => {
      if (!doc || !Array.isArray(doc.items)) return;

      doc.items.forEach(it => {
        if (!it || it.isCustom) return;
        
        const itProdId = String(it.productId || '').trim();
        const itSku = String(it.brand || '').trim().toLowerCase();
        const isMatched = (itProdId && itProdId === hpId) || (!itProdId && hpSku && itSku === hpSku);
        if (!isMatched) return;

        salesRecords.push({
          docId: String(doc.id || ''),
          docNumber: String(doc.docNumber || 'DOC-000'),
          docType: String(doc.type || 'INVOICE'),
          date: String(doc.date || ''),
          customerId: String(doc.customerId || ''),
          customerName: String(doc.customerName || 'Customer'),
          customerCompany: String(doc.customerCompany || doc.customerName || 'Client Company'),
          customerPhone: String(doc.customerPhone || ''),
          quantity: Number(it.quantity) || 1,
          unitPrice: Number(it.price) || 0,
          lineTotal: Number(it.total) || 0,
          unit: String(it.unit || liveProduct.unit || 'Pcs'),
          status: String(doc.status || 'Active'),
          doc
        });
      });
    });

    // 2. Process authentic supplier purchases from purchases table ONLY (match by productId or exact SKU)
    (purchases || []).forEach(p => {
      if (!p || !Array.isArray(p.items)) return;
      p.items.forEach(it => {
        if (!it) return;
        const itProdId = String(it.productId || '').trim();
        const itSku = String(it.sku || '').trim().toLowerCase();
        const isMatched = (itProdId && itProdId === hpId) || (hpSku && itSku === hpSku);
        if (isMatched) {
          purchaseRecords.push({
            docId: String(p.id || ''),
            docNumber: String(p.purchaseNumber || 'PUR-000'),
            date: String(p.purchaseDate || ''),
            supplierName: String(p.supplierCompany || p.supplierName || 'Vendor Supplier'),
            quantity: Number(it.quantity) || 1,
            buyPrice: Number(it.unitCost) || 0,
            lineTotal: Number(it.totalCost ?? (it.quantity * it.unitCost)) || 0,
            doc: p as any
          });
        }
      });
    });

    // 3. Find field dispatches containing this inventory product
    const dispatchRecords = (dispatches || []).filter(d => 
      d && Array.isArray(d.items) && d.items.some(it => {
        if (!it) return false;
        const itProdId = String(it.productId || '');
        return itProdId && itProdId === hpId;
      })
    );

    // Sum total quantities & financial revenue
    const invoiceSales = salesRecords.filter(r => r.docType === 'INVOICE' || r.docType === 'BILL');
    const totalQtySold = invoiceSales.reduce((s, r) => s + (Number(r.quantity) || 0), 0);
    const totalSalesRevenue = invoiceSales.reduce((s, r) => s + (Number(r.lineTotal) || 0), 0);

    const currentStock = Number(liveProduct.stock) || 0;
    const currentPrice = Number(liveProduct.price) || 0;
    const productCostPrice = Number(liveProduct.costPrice) || 0;

    const purchasedFromBills = purchaseRecords.reduce((s, r) => s + (Number(r.quantity) || 0), 0);
    // Total stock inward (Purchases + Initial Stock) always reconciles with Current Available Stock + Total Sold
    const totalQtyPurchased = Math.max(purchasedFromBills, currentStock + totalQtySold);

    // Determine accurate unit purchase cost from Purchase Bills or Product's saved costPrice
    const totalBillsCost = purchaseRecords.reduce((s, r) => s + (Number(r.lineTotal) || 0), 0);
    const avgBillUnitCost = purchasedFromBills > 0 ? (totalBillsCost / purchasedFromBills) : 0;
    const effectiveUnitCost = productCostPrice > 0
      ? productCostPrice
      : (avgBillUnitCost > 0 ? avgBillUnitCost : Math.round(currentPrice * 0.70));

    // Cost of goods sold (for profit calculation against sales revenue)
    const costOfGoodsSold = totalQtySold * effectiveUnitCost;
    const totalPurchaseCostActual = totalQtySold > 0
      ? Math.round(costOfGoodsSold)
      : (totalBillsCost > 0 ? Math.round(totalBillsCost) : Math.round(currentStock * effectiveUnitCost));

    // Profit or Loss on sold items
    const netProfitLoss = totalQtySold > 0 ? Math.round(totalSalesRevenue - costOfGoodsSold) : 0;
    const marginPercent = totalSalesRevenue > 0 ? (netProfitLoss / totalSalesRevenue) * 100 : 0;

    return {
      historyProduct: liveProduct,
      salesRecords,
      invoiceSales,
      purchaseRecords,
      dispatchRecords,
      totalQtyPurchased,
      totalQtySold,
      availableStock: currentStock,
      totalSalesRevenue,
      totalPurchaseCostActual,
      netProfitLoss,
      marginPercent,
      isProfit: netProfitLoss >= 0
    };
  }, [historyProduct, products, documents, dispatches, purchases]);

  // User-created Custom Categories and Brands (Persistent)
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('jm_custom_categories');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [customBrands, setCustomBrands] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('jm_custom_brands');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [isAddingNewBrand, setIsAddingNewBrand] = useState(false);
  const [newBrandInput, setNewBrandInput] = useState('');

  const categories = useMemo(() => {
    const base = ['Screw Air Compressor', 'Air Dryer', 'Line Filter', 'Spare Parts'];
    const fromProducts = (products || []).map(p => (p.category || '').trim()).filter(Boolean);
    const combined = Array.from(new Set([...base, ...customCategories, ...fromProducts]));
    return combined.sort((a, b) => a.localeCompare(b));
  }, [products, customCategories]);

  const brands = useMemo(() => {
    const base = ['Hitachi', 'Atlas Copco', 'KAESER', 'BOGE', 'ELGi', 'Linghein', 'JAGUAR', 'IR Ingersoll Rand', 'Gardner Denver'];
    const fromProducts = (products || []).map(p => (p.brand || '').trim()).filter(Boolean);
    const combined = Array.from(new Set([...base, ...customBrands, ...fromProducts]));
    return combined.sort((a, b) => a.localeCompare(b));
  }, [products, customBrands]);

  const handleSaveNewCategory = () => {
    const trimmed = newCategoryInput.trim();
    if (!trimmed) return;
    if (!categories.includes(trimmed)) {
      const updated = [...customCategories, trimmed];
      setCustomCategories(updated);
      try {
        localStorage.setItem('jm_custom_categories', JSON.stringify(updated));
      } catch (err) {
        console.warn('Failed to save to localStorage:', err);
      }
    }
    setFormData(prev => ({ ...prev, category: trimmed }));
    setNewCategoryInput('');
    setIsAddingNewCategory(false);
  };

  const handleSaveNewBrand = () => {
    const trimmed = newBrandInput.trim();
    if (!trimmed) return;
    if (!brands.includes(trimmed)) {
      const updated = [...customBrands, trimmed];
      setCustomBrands(updated);
      try {
        localStorage.setItem('jm_custom_brands', JSON.stringify(updated));
      } catch (err) {
        console.warn('Failed to save to localStorage:', err);
      }
    }
    setFormData(prev => ({ ...prev, brand: trimmed }));
    setNewBrandInput('');
    setIsAddingNewBrand(false);
  };

  // Stock status summary counts
  const stockStats = useMemo(() => {
    const list = Array.isArray(products) ? products.filter(Boolean) : [];
    let outCount = 0;
    let lowCount = 0;
    let adequateCount = 0;
    for (const p of list) {
      const qty = Number(p.stock) || 0;
      if (qty <= 0) {
        outCount += 1;
      } else if (qty <= lowStockThreshold) {
        lowCount += 1;
      } else {
        adequateCount += 1;
      }
    }
    return {
      total: list.length,
      lowestTotal: outCount + lowCount,
      outCount,
      lowCount,
      adequateCount,
    };
  }, [products, lowStockThreshold]);

  // Filtering and sorting products (defensive)
  const filteredProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];
    const matched = products.filter(p => {
      if (!p) return false;
      const pName = String(p.name || '').toLowerCase();
      const pSku = String(p.sku || '').toLowerCase();
      const pBrand = String(p.brand || '').toLowerCase();
      const pCross = String(p.crossReference || '').toLowerCase();
      const pMeasure = String(p.measurement || '').toLowerCase();
      const pWarehouse = String(p.warehouse || '').toLowerCase();
      const pRack = String(p.rack || '').toLowerCase();
      const pShelf = String(p.shelf || '').toLowerCase();
      const query = String(searchQuery || '').toLowerCase().trim();
      const qty = Number(p.stock) || 0;

      const matchSearch = !query || 
        pName.includes(query) || 
        pSku.includes(query) || 
        pBrand.includes(query) ||
        pCross.includes(query) ||
        pMeasure.includes(query) ||
        pWarehouse.includes(query) ||
        pRack.includes(query) ||
        pShelf.includes(query);
      const matchBrandOrCat = selectedCategory === 'All' || p.brand === selectedCategory || p.category === selectedCategory || p.warehouse === selectedCategory;

      let matchStock = true;
      if (stockFilter === 'lowest') {
        matchStock = qty <= lowStockThreshold;
      } else if (stockFilter === 'out') {
        matchStock = qty <= 0;
      } else if (stockFilter === 'low') {
        matchStock = qty > 0 && qty <= lowStockThreshold;
      } else if (stockFilter === 'adequate') {
        matchStock = qty > lowStockThreshold;
      }

      return matchSearch && matchBrandOrCat && matchStock;
    });

    if (sortBy === 'stock_asc') {
      return [...matched].sort((a, b) => (Number(a.stock) || 0) - (Number(b.stock) || 0));
    }
    if (sortBy === 'stock_desc') {
      return [...matched].sort((a, b) => (Number(b.stock) || 0) - (Number(a.stock) || 0));
    }
    if (sortBy === 'name_asc') {
      return [...matched].sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
    }
    if (sortBy === 'price_desc') {
      return [...matched].sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    }
    return matched;
  }, [products, searchQuery, selectedCategory, stockFilter, sortBy, lowStockThreshold]);

  // Handle + / - Quick Stock Adjustments
  const handleQuickStock = (product: Product, delta: number) => {
    const updated = { ...product, stock: Math.max(0, (Number(product.stock) || 0) + delta) };
    onUpdateProduct(updated);
  };

  // Open Add modal
  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      name: '',
      sku: '',
      crossReference: '',
      measurement: '',
      warehouse: '',
      rack: '',
      shelf: '',
      category: 'Spare Parts',
      brand: 'Hitachi',
      price: 0,
      costPrice: 0,
      stock: 0,
      unit: 'Pcs',
      description: '',
      specs: [{ label: 'Motor Power', value: '' }, { label: 'Working Pressure', value: '' }],
      imageUrl: ''
    });
    setIsFormOpen(true);
  };

  // Open Edit modal
  const handleOpenEdit = (product: Product) => {
    setEditingId(product.id);
    let parsedSpecs: ProductSpec[] = [{ label: '', value: '' }];
    if (Array.isArray(product.specs) && product.specs.length > 0) {
      parsedSpecs = product.specs.map(s => ({
        label: String(s?.label || ''),
        value: String(s?.value || '')
      }));
    } else if (typeof product.specs === 'string' && (product.specs as string).trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(product.specs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsedSpecs = parsed.map(s => ({
            label: String(s?.label || ''),
            value: String(s?.value || '')
          }));
        }
      } catch {}
    }

    setFormData({
      name: String(product.name || ''),
      sku: String(product.sku || ''),
      crossReference: String(product.crossReference || ''),
      measurement: String(product.measurement || ''),
      warehouse: String(product.warehouse || ''),
      rack: String(product.rack || ''),
      shelf: String(product.shelf || ''),
      category: product.category || 'Spare Parts',
      brand: product.brand || 'Hitachi',
      price: Number(product.price) || 0,
      costPrice: Number(product.costPrice) || Math.round(Number(product.price || 0) * 0.75),
      stock: Number(product.stock) || 0,
      unit: product.unit || 'Pcs',
      description: String(product.description || ''),
      specs: parsedSpecs,
      imageUrl: product.imageUrl || ''
    });
    setIsFormOpen(true);
  };

  // Handle Spec Adding / Editing
  const handleAddSpecField = () => {
    setFormData({ ...formData, specs: [...formData.specs, { label: '', value: '' }] });
  };

  const handleSpecChange = (index: number, field: 'label' | 'value', val: string) => {
    const nextSpecs = [...formData.specs];
    if (nextSpecs[index]) {
      nextSpecs[index][field] = val;
      setFormData({ ...formData, specs: nextSpecs });
    }
  };

  const handleRemoveSpecField = (index: number) => {
    const nextSpecs = formData.specs.filter((_, i) => i !== index);
    setFormData({ ...formData, specs: nextSpecs.length > 0 ? nextSpecs : [{ label: '', value: '' }] });
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.sku) {
      alert("Name and SKU SKU/Model are required.");
      return;
    }

    // Clean empty specs
    const cleanSpecs = (formData.specs || []).filter(s => String(s?.label || '').trim() !== '' && String(s?.value || '').trim() !== '');

    if (editingId) {
      // Update
      onUpdateProduct({
        id: editingId,
        ...formData,
        specs: cleanSpecs
      });
    } else {
      // Create
      const newProduct: Product = {
        id: `prod-${Date.now()}`,
        ...formData,
        specs: cleanSpecs
      };
      onAddProduct(newProduct);
    }
    
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-5 text-xs">
      {/* Stock Level Quick Filter Cards (with Lowest Stock Alert) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => {
            setStockFilter('all');
          }}
          className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
            stockFilter === 'all'
              ? 'bg-blue-50/70 border-blue-900 ring-1 ring-blue-900/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">All Stock Items</span>
            <span className="text-xl font-black text-slate-900 font-display">{stockStats.total}</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <Package className="w-4 h-4" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setStockFilter('lowest');
            setSortBy('stock_asc');
          }}
          className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
            stockFilter === 'lowest'
              ? 'bg-amber-50 border-amber-500 ring-1 ring-amber-500/30 shadow-xs'
              : 'bg-white border-slate-200 hover:border-amber-300 shadow-2xs'
          }`}
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
              Lowest Stock (&le; {lowStockThreshold})
            </span>
            <span className="text-xl font-black text-amber-700 font-display">{stockStats.lowestTotal}</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <TrendingDown className="w-4 h-4" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setStockFilter('out');
            setSortBy('stock_asc');
          }}
          className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
            stockFilter === 'out'
              ? 'bg-rose-50 border-rose-500 ring-1 ring-rose-500/30 shadow-xs'
              : 'bg-white border-slate-200 hover:border-rose-300 shadow-2xs'
          }`}
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">Out of Stock (0)</span>
            <span className="text-xl font-black text-rose-700 font-display">{stockStats.outCount}</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setStockFilter('adequate');
          }}
          className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
            stockFilter === 'adequate'
              ? 'bg-emerald-50 border-emerald-600 ring-1 ring-emerald-600/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-emerald-300 shadow-2xs'
          }`}
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
              Adequate (&gt; {lowStockThreshold})
            </span>
            <span className="text-xl font-black text-emerald-700 font-display">{stockStats.adequateCount}</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </button>
      </div>

      {/* Upper toolbar controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 bg-white border border-slate-200 p-4 rounded-xl shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by SKU, Name, Cross Ref, Measurement, Brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white focus:border-blue-900"
            />
          </div>

          {/* Brand Filter Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold focus:outline-hidden cursor-pointer"
          >
            <option value="All">All Brands</option>
            {brands.map(b => <option key={b} value={b}>{b}</option>)}
          </select>

          {/* Stock Level Filter Dropdown */}
          <select
            value={stockFilter}
            onChange={(e) => {
              const next = e.target.value as 'all' | 'lowest' | 'out' | 'low' | 'adequate';
              setStockFilter(next);
              if (next === 'lowest' || next === 'low' || next === 'out') {
                setSortBy('stock_asc');
              }
            }}
            className={`p-2 border rounded-lg font-semibold focus:outline-hidden cursor-pointer ${
              stockFilter === 'lowest' || stockFilter === 'low'
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : stockFilter === 'out'
                ? 'bg-rose-50 border-rose-300 text-rose-900'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <option value="all">All Stock Levels</option>
            <option value="lowest">Lowest Stock (&le; {lowStockThreshold})</option>
            <option value="out">Out of Stock (0)</option>
            <option value="low">Low Stock Only (1–{lowStockThreshold})</option>
            <option value="adequate">Adequate Stock (&gt; {lowStockThreshold})</option>
          </select>

          {/* Sort By Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'default' | 'stock_asc' | 'stock_desc' | 'name_asc' | 'price_desc')}
            className={`p-2 border rounded-lg font-semibold focus:outline-hidden cursor-pointer ${
              sortBy === 'stock_asc'
                ? 'bg-blue-50 border-blue-300 text-blue-900'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <option value="default">Sort: Default</option>
            <option value="stock_asc">Sort: Lowest Stock First</option>
            <option value="stock_desc">Sort: Highest Stock First</option>
            <option value="name_asc">Sort: Name (A–Z)</option>
            <option value="price_desc">Sort: Highest Price</option>
          </select>

          {/* Low Stock Threshold Setting */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5" title="Set minimum quantity threshold for Low Stock alert">
            <span className="text-[10px] font-bold text-slate-500 uppercase whitespace-nowrap">Low Limit &le;</span>
            <input
              type="number"
              min={1}
              max={9999}
              value={lowStockThreshold}
              onChange={(e) => handleThresholdChange(Number(e.target.value))}
              className="w-12 bg-white border border-slate-300 rounded px-1.5 py-0.5 text-center font-mono font-bold text-slate-900 focus:outline-hidden focus:border-blue-900"
            />
          </div>

          {(stockFilter !== 'all' || sortBy !== 'default' || selectedCategory !== 'All' || searchQuery.trim() !== '') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setStockFilter('all');
                setSortBy('default');
              }}
              className="px-2.5 py-2 text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
              title="Reset all filters and sorting"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          )}
        </div>

        {/* Add Product Button */}
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Catalog Product
        </button>
      </div>

      {/* Main Table view */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Item SKU / Name</th>
                <th className="py-3 px-3">Cross Ref &amp; Measurement</th>
                <th className="py-3 px-3">Warehouse / Rack / Shelf</th>
                <th className="py-3 px-3">Brand</th>
                <th className="py-3 px-3 text-right">Selling &amp; Cost Price</th>
                <th className="py-3 px-4 text-center">
                  <button
                    type="button"
                    onClick={() => setSortBy(prev => prev === 'stock_asc' ? 'stock_desc' : 'stock_asc')}
                    className="inline-flex items-center gap-1 hover:text-blue-900 transition-colors cursor-pointer uppercase font-bold"
                    title="Click to sort by Lowest / Highest Stock"
                  >
                    Stock Volume
                    {sortBy === 'stock_asc' ? (
                      <ArrowUp className="w-3.5 h-3.5 text-blue-900" />
                    ) : sortBy === 'stock_desc' ? (
                      <ArrowDown className="w-3.5 h-3.5 text-blue-900" />
                    ) : (
                      <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredProducts.length > 0 ? (
                filteredProducts.map(product => {
                  if (!product) return null;
                  const prodStock = Number(product.stock) || 0;
                  const prodPrice = Number(product.price) || 0;
                  const prodCost = Number(product.costPrice) || Math.round(prodPrice * 0.75);
                  const prodUnit = product.unit || 'Pcs';
                  const isLowStock = prodStock > 0 && prodStock <= lowStockThreshold;

                  return (
                    <tr key={product.id || Math.random()} className="hover:bg-slate-50/50 transition-colors">
                      {/* Name, Image & SKU */}
                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg border border-slate-200 bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center shadow-2xs">
                            {product.imageUrl ? (
                              <img 
                                src={product.imageUrl} 
                                alt={product.name} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=100&auto=format&fit=crop&q=60';
                                }}
                              />
                            ) : (
                              <Package className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <div className="space-y-0.5 min-w-0">
                            <span className="font-bold text-slate-900 block leading-tight truncate">{product.name || 'Unnamed Product'}</span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">{product.sku || 'N/A'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Cross Reference & Measurement */}
                      <td className="py-3.5 px-3">
                        {product.crossReference || product.measurement ? (
                          <div className="space-y-0.5 max-w-[200px]">
                            {product.crossReference && (
                              <span className="block font-bold text-slate-800 text-[11px] truncate" title={`Cross Ref: ${product.crossReference}`}>
                                <span className="text-slate-400 font-semibold text-[9px] uppercase">Ref:</span> {product.crossReference}
                              </span>
                            )}
                            {product.measurement && (
                              <span className="block font-medium text-slate-500 text-[10px] truncate" title={`Measurement: ${product.measurement}`}>
                                <span className="text-slate-400 font-semibold text-[9px] uppercase">Dim:</span> {product.measurement}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 font-normal italic text-[11px]">-</span>
                        )}
                      </td>

                      {/* Storage Location: Warehouse, Rack, Shelf/Cell */}
                      <td className="py-3.5 px-3">
                        {product.warehouse || product.rack || product.shelf ? (
                          <div className="space-y-1 max-w-[210px]">
                            {product.warehouse && (
                              <span className="inline-block bg-indigo-50 text-indigo-800 border border-indigo-200 font-bold px-2 py-0.5 rounded text-[10px] truncate max-w-full" title={`Warehouse: ${product.warehouse}`}>
                                WH: {product.warehouse}
                              </span>
                            )}
                            {(product.rack || product.shelf) && (
                              <div className="flex flex-wrap items-center gap-1 text-[10px]">
                                {product.rack && (
                                  <span className="bg-slate-100 text-slate-700 border border-slate-200 font-bold px-1.5 py-0.5 rounded font-mono">
                                    Rack: {product.rack}
                                  </span>
                                )}
                                {product.shelf && (
                                  <span className="bg-amber-50 text-amber-800 border border-amber-200 font-bold px-1.5 py-0.5 rounded font-mono">
                                    Shelf: {product.shelf}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 font-normal italic text-[11px]">-</span>
                        )}
                      </td>

                      {/* Brand */}
                      <td className="py-3.5 px-3">
                        <span className="inline-block bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded text-[10px]">
                          {product.brand || 'Hitachi'}
                        </span>
                      </td>

                      {/* Price: Selling Price & Purchase Price */}
                      <td className="py-3.5 px-3 text-right">
                        <div className="font-extrabold text-slate-900 font-display text-xs">
                          Tk. {prodPrice.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">/ {prodUnit}</span>
                        </div>
                        <div className="text-[10px] font-bold text-emerald-700 bg-emerald-50 inline-block px-1.5 py-0.5 rounded border border-emerald-200 mt-0.5" title="Purchase Cost">
                          Cost: Tk. {prodCost.toLocaleString()}
                        </div>
                      </td>

                      {/* Stock Volume (Read-only: manual +/- stopped as requested) */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className={`px-2.5 py-1 rounded-lg font-black text-xs font-mono border ${
                            prodStock <= 0 ? 'bg-rose-50 text-rose-700 border-rose-200' :
                            isLowStock ? 'bg-amber-50 text-amber-700 border-amber-200 font-display' :
                            'bg-slate-100 text-slate-900 border-slate-200'
                          }`}>
                            {prodStock} {prodUnit}
                          </span>
                        </div>
                      </td>

                      {/* Stock Status badges */}
                      <td className="py-3.5 px-3 text-center">
                        {prodStock <= 0 ? (
                          <span className="inline-block bg-rose-50 text-rose-700 border border-rose-200 font-bold px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider">
                            Out of stock
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 font-bold px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider">
                            <AlertTriangle className="w-3 h-3" /> Low Stock
                          </span>
                        ) : (
                          <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider">
                            Adequate
                          </span>
                        )}
                      </td>

                      {/* Operations */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setHistoryProduct(product)}
                            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 font-extrabold text-[10px] uppercase rounded-lg flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                            title="View Lifetime History, Profit/Loss & Buyers Ledger"
                          >
                            <BarChart3 className="w-3.5 h-3.5 text-blue-700" />
                            Lifetime Ledger
                          </button>

                          <button
                            onClick={() => handleOpenEdit(product)}
                            className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg hover:text-slate-900 transition-colors border border-slate-200 cursor-pointer"
                            title="Edit details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          
                          {onDeleteProduct && (currentUser?.role === 'ADMIN' || !currentUser) && (
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to permanently delete ${product.name} from the catalog?`)) {
                                  onDeleteProduct(product.id);
                                }
                              }}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg hover:text-rose-700 transition-colors border border-rose-200 cursor-pointer"
                              title="Delete Item (Admin Only)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400 italic">
                    No products matched your search or filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORM MODAL (Add & Edit details) */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] sm:max-h-[88vh] flex flex-col overflow-hidden my-auto">
            <div className="bg-blue-900 text-white p-5 flex justify-between items-center">
              <h3 className="font-bold font-display text-base">
                {editingId ? 'Edit Catalog Product Details' : 'Register New Machinery Catalog Product'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-white hover:text-slate-200 font-bold bg-white/10 px-3 py-1.5 rounded-lg text-xs cursor-pointer"
              >
                Close &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              {/* Product title / name */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Product Name / Model Description <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hitachi Hiscrew 37 S-Type Screw Compressor"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* SKU Code */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">SKU / Model Code <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HIT-HS-37S"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:outline-hidden"
                  />
                </div>

                {/* Unit type */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Unit of Measurement (e.g. Set, Pcs, Can)</label>
                  <input
                    type="text"
                    placeholder="e.g. Set"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Cross Reference (Manual Input) */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 text-xs">Cross Reference</label>
                  <input
                    type="text"
                    placeholder="Enter Cross Reference (e.g. 55302021, 21114040, Ref Part #)"
                    value={formData.crossReference}
                    onChange={(e) => setFormData({ ...formData, crossReference: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:outline-hidden text-xs font-semibold text-slate-800"
                  />
                </div>

                {/* Measurement (Manual Input) */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 text-xs">Measurement</label>
                  <input
                    type="text"
                    placeholder="Enter Measurement / Dimensions (e.g. 150x90x350 mm, Size)"
                    value={formData.measurement}
                    onChange={(e) => setFormData({ ...formData, measurement: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:outline-hidden text-xs font-semibold text-slate-800"
                  />
                </div>
              </div>

              {/* Warehouse, Rack & Shelf/Cell Storage Location (Manual Input) */}
              <div className="p-3.5 bg-indigo-50/50 border border-indigo-200/80 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-indigo-950 uppercase tracking-wider">
                    Storage Location (ওয়্যারহাউস, র‍্যাক ও সেলফ নম্বর)
                  </span>
                  <span className="text-[10px] font-semibold text-indigo-700">
                    Manual Location Entry
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Warehouse */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 text-[11px] block">
                      Warehouse (ওয়্যারহাউস)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Warehouse-1 / Main Store"
                      value={formData.warehouse}
                      onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-hidden focus:border-indigo-600 text-xs font-semibold text-slate-800"
                    />
                  </div>

                  {/* Rack */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 text-[11px] block">
                      Rack No. (র‍্যাক নম্বর)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rack-A / Rack-02"
                      value={formData.rack}
                      onChange={(e) => setFormData({ ...formData, rack: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-hidden focus:border-indigo-600 text-xs font-semibold text-slate-800"
                    />
                  </div>

                  {/* Shelf / Cell */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 text-[11px] block">
                      Shelf / Cell No. (সেলফ বা সেল নম্বর)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Shelf-03 / Cell-12"
                      value={formData.shelf}
                      onChange={(e) => setFormData({ ...formData, shelf: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-hidden focus:border-indigo-600 text-xs font-semibold text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Brand dropdown & custom creation */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 text-xs">Brand Sourced</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingNewBrand(!isAddingNewBrand);
                      setNewBrandInput('');
                    }}
                    className="text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded cursor-pointer transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    {isAddingNewBrand ? 'Cancel' : '+ New Brand'}
                  </button>
                </div>

                {isAddingNewBrand ? (
                  <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg space-y-2 animate-in fade-in zoom-in-95 duration-100">
                    <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider block">
                      Create &amp; Save New Brand
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        autoFocus
                        value={newBrandInput}
                        onChange={(e) => setNewBrandInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSaveNewBrand();
                          }
                        }}
                        placeholder="e.g. Sullair, CompAir, Fusheng..."
                        className="flex-1 bg-white border border-blue-300 rounded-md px-2.5 py-1.5 text-xs text-slate-900 font-semibold focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={handleSaveNewBrand}
                        disabled={!newBrandInput.trim()}
                        className="px-3 py-1.5 bg-blue-900 hover:bg-blue-950 text-white rounded-md text-xs font-bold cursor-pointer disabled:opacity-40 transition-colors"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingNewBrand(false)}
                        className="px-2 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md text-xs font-bold cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <select
                    value={formData.brand}
                    onChange={(e) => {
                      if (e.target.value === '__NEW_BRAND__') {
                        setIsAddingNewBrand(true);
                        setNewBrandInput('');
                      } else {
                        setFormData({ ...formData, brand: e.target.value });
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:outline-hidden cursor-pointer font-semibold text-slate-800"
                  >
                    {brands.map(b => <option key={b} value={b}>{b}</option>)}
                    <option value="__NEW_BRAND__" className="text-blue-700 font-bold bg-blue-50">
                      + Create New Brand...
                    </option>
                  </select>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Selling Price */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 flex items-center justify-between">
                    <span>Selling Price (Tk.)</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.price === 0 ? '' : formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value === '' ? 0 : Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:outline-hidden font-bold text-blue-900"
                    placeholder="Enter selling price"
                  />
                </div>

                {/* Purchase Cost */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 flex items-center justify-between">
                    <span>Purchase Cost (Tk.)</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.costPrice === 0 ? '' : formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value === '' ? 0 : Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-emerald-200 rounded-lg p-2.5 focus:bg-white focus:outline-hidden font-bold text-emerald-700"
                    placeholder="Enter purchase cost"
                  />
                </div>

                {/* Stock volume */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 flex items-center justify-between">
                    <span>Stock Quantity</span>
                    {editingId && (
                      <span className="text-[9px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-normal">
                        Auto-managed
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    min={0}
                    disabled={!!editingId}
                    value={formData.stock === 0 ? '' : formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value === '' ? 0 : Number(e.target.value) })}
                    placeholder="0"
                    className={`w-full border rounded-lg p-2.5 font-bold ${
                      editingId ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed' : 'bg-slate-50 border-slate-200 focus:bg-white focus:outline-hidden'
                    }`}
                  />
                  {editingId && (
                    <p className="text-[10px] text-slate-400 leading-tight">
                      Stock levels are updated via purchases, sales challans, and returns.
                    </p>
                  )}
                </div>
              </div>

              {/* Extended descriptive text */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Catalog Description</label>
                <textarea
                  rows={2}
                  placeholder="Provide brief details about physical design, utility, or applications..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="border-t border-slate-100 pt-4 flex justify-end gap-3.5">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-950 text-white font-bold uppercase tracking-wider rounded-lg shadow-xs cursor-pointer"
                >
                  {editingId ? 'Save Updates' : 'Add to Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIFETIME PRODUCT HISTORY & PROFIT/LOSS ANALYTICS MODAL */}
      {historyProduct && productAnalytics && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] sm:max-h-[88vh] flex flex-col overflow-hidden my-auto">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-blue-900 text-white p-5 flex justify-between items-center">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs bg-white/20 text-blue-200 px-2 py-0.5 rounded">
                    {productAnalytics.historyProduct.sku}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-blue-300">
                    {productAnalytics.historyProduct.brand}
                    {productAnalytics.historyProduct.crossReference ? ` • Ref: ${productAnalytics.historyProduct.crossReference}` : ''}
                    {productAnalytics.historyProduct.measurement ? ` • Dim: ${productAnalytics.historyProduct.measurement}` : ''}
                  </span>
                </div>
                <h3 className="text-base font-black font-display text-white">
                  {productAnalytics.historyProduct.name} - Lifetime Analytics & Buyers Ledger
                </h3>
              </div>

              <button
                onClick={() => setHistoryProduct(null)}
                className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
              
              {/* Stat Cards 6-Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Total Purchased</span>
                  <span className="text-lg font-black font-display text-slate-900 block">
                    {productAnalytics.totalQtyPurchased} <span className="text-xs text-slate-500 font-semibold">{productAnalytics.historyProduct.unit}</span>
                  </span>
                  <span className="text-[9px] text-slate-500 font-semibold">Bills & Initial Stock</span>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Total Sold</span>
                  <span className="text-lg font-black font-display text-blue-900 block">
                    {productAnalytics.totalQtySold} <span className="text-xs text-slate-500 font-semibold">{productAnalytics.historyProduct.unit}</span>
                  </span>
                  <span className="text-[9px] text-blue-700 font-semibold">Invoices Total Sold</span>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Current Available Stock</span>
                  <span className={`text-lg font-black font-display block ${
                    productAnalytics.availableStock < 5 ? 'text-rose-600' : 'text-slate-900'
                  }`}>
                    {productAnalytics.availableStock} <span className="text-xs text-slate-500 font-semibold">{productAnalytics.historyProduct.unit}</span>
                  </span>
                  <span className="text-[9px] text-slate-500 font-semibold">Showroom Warehouse</span>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Total Sales Revenue</span>
                  <span className="text-lg font-black font-display text-blue-950 block">
                    Tk. {productAnalytics.totalSalesRevenue.toLocaleString()}
                  </span>
                  <span className="text-[9px] text-slate-500 font-semibold">Total Revenue</span>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Total Purchase Cost</span>
                  <span className="text-lg font-black font-display text-slate-800 block">
                    Tk. {productAnalytics.totalPurchaseCostActual.toLocaleString()}
                  </span>
                  <span className="text-[9px] text-slate-500 font-semibold">Procurement Cost</span>
                </div>

                <div className={`p-3 rounded-xl space-y-1 border ${
                  productAnalytics.isProfit ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'
                }`}>
                  <span className={`text-[9px] font-bold uppercase block ${
                    productAnalytics.isProfit ? 'text-emerald-800' : 'text-rose-800'
                  }`}>
                    {productAnalytics.isProfit ? 'Net Profit' : 'Net Loss'}
                  </span>
                  <span className={`text-lg font-black font-display block ${
                    productAnalytics.isProfit ? 'text-emerald-800' : 'text-rose-800'
                  }`}>
                    Tk. {Math.abs(productAnalytics.netProfitLoss).toLocaleString()}
                  </span>
                  <span className={`text-[9px] font-bold flex items-center gap-0.5 ${
                    productAnalytics.isProfit ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {productAnalytics.isProfit ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {productAnalytics.marginPercent.toFixed(1)}% Margin
                  </span>
                </div>
              </div>

              {/* TABLE 1: BUYERS LEDGER ("Buyers Sales Ledger") */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-900 text-xs font-display flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-blue-900" />
                    Buyers Sales Ledger
                  </h4>
                  <span className="text-[10px] text-slate-400 font-bold">
                    {productAnalytics.invoiceSales.length} Customer Transactions
                  </span>
                </div>

                {productAnalytics.invoiceSales.length > 0 ? (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          <th className="py-2.5 px-3">Date & Invoice No.</th>
                          <th className="py-2.5 px-3">Buyer Company / Name</th>
                          <th className="py-2.5 px-3 text-center">Qty Sold</th>
                          <th className="py-2.5 px-3 text-right">Unit Price</th>
                          <th className="py-2.5 px-3 text-right">Line Total</th>
                          <th className="py-2.5 px-3 text-center">Invoice Status</th>
                          <th className="py-2.5 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-sans">
                        {productAnalytics.invoiceSales.map((sale, i) => (
                          <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-2.5 px-3 font-semibold">
                              <span className="font-mono font-bold text-blue-900 block">{sale.docNumber}</span>
                              <span className="text-[10px] text-slate-400">{formatDateDMY(sale.date)}</span>
                            </td>

                            <td className="py-2.5 px-3">
                              <span className="font-bold text-slate-900 block leading-tight">{sale.customerCompany}</span>
                              <span className="text-[10px] text-slate-500">Attn: {sale.customerName} &bull; {sale.customerPhone}</span>
                            </td>

                            <td className="py-2.5 px-3 text-center font-black text-slate-900 font-display text-sm">
                              {sale.quantity} <span className="text-xs text-slate-500 font-normal">{sale.unit}</span>
                            </td>

                            <td className="py-2.5 px-3 text-right font-bold text-slate-700">
                              Tk. {sale.unitPrice.toLocaleString()}
                            </td>

                            <td className="py-2.5 px-3 text-right font-extrabold text-slate-950 font-display">
                              Tk. {sale.lineTotal.toLocaleString()}
                            </td>

                            <td className="py-2.5 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                sale.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}>
                                {sale.status}
                              </span>
                            </td>

                            <td className="py-2.5 px-3 text-right">
                              {onViewDocument && (
                                <button
                                  onClick={() => {
                                    setHistoryProduct(null);
                                    onViewDocument(sale.doc);
                                  }}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-blue-900 hover:text-white text-slate-700 font-bold text-[9px] uppercase rounded transition-colors border border-slate-200 cursor-pointer"
                                >
                                  Invoice
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-400 border border-slate-200 rounded-xl bg-slate-50">
                    <p className="font-bold text-slate-700">No sales invoices recorded for this product yet.</p>
                  </div>
                )}
              </div>

              {/* TABLE 2: PURCHASE & SUPPLIER LOG */}
              {productAnalytics.purchaseRecords.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="font-bold text-slate-900 text-xs font-display flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-emerald-700" />
                    Purchase Bills & Supplier Log
                  </h4>

                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          <th className="py-2.5 px-3">Bill No. & Date</th>
                          <th className="py-2.5 px-3">Supplier Vendor</th>
                          <th className="py-2.5 px-3 text-center">Qty Purchased</th>
                          <th className="py-2.5 px-3 text-right">Unit Buy Price</th>
                          <th className="py-2.5 px-3 text-right">Total Cost</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-sans">
                        {productAnalytics.purchaseRecords.map((pRec, i) => (
                          <tr key={i} className="hover:bg-slate-50/60">
                            <td className="py-2.5 px-3">
                              <span className="font-mono font-bold text-slate-900 block">{pRec.docNumber}</span>
                              <span className="text-[10px] text-slate-400">{formatDateDMY(pRec.date)}</span>
                            </td>

                            <td className="py-2.5 px-3 font-bold text-slate-800">
                              {pRec.supplierName}
                            </td>

                            <td className="py-2.5 px-3 text-center font-bold text-slate-900">
                              {pRec.quantity} Pcs
                            </td>

                            <td className="py-2.5 px-3 text-right font-semibold text-slate-700">
                              Tk. {pRec.buyPrice.toLocaleString()}
                            </td>

                            <td className="py-2.5 px-3 text-right font-extrabold text-slate-900 font-display">
                              Tk. {pRec.lineTotal.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>

            <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end">
              <button
                onClick={() => setHistoryProduct(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold uppercase rounded-xl cursor-pointer"
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
