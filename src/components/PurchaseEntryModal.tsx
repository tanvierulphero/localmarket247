import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Purchase, PurchaseItem, Supplier, Product, PurchasePaymentStatus, PurchaseStatus } from '../types';
import { 
  X, 
  Plus, 
  Trash2, 
  ShoppingCart, 
  Building2, 
  Calendar, 
  DollarSign, 
  FileText, 
  Truck, 
  CheckCircle2, 
  AlertCircle,
  PackagePlus,
  HelpCircle,
  Search,
  ChevronDown
} from 'lucide-react';
import { generateNextPurchaseNumber } from '../lib/documentNumber';
import DateInput from './DateInput';

interface PurchaseEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (purchase: Purchase, updateStock: boolean) => Promise<void>;
  purchases?: Purchase[];
  suppliers: Supplier[];
  products: Product[];
  onAddSupplier: (supplier: Supplier) => Promise<void>;
  initialPurchase?: Purchase | null;
}

export default function PurchaseEntryModal({
  isOpen,
  onClose,
  onSave,
  purchases = [],
  suppliers,
  products,
  onAddSupplier,
  initialPurchase
}: PurchaseEntryModalProps) {
  // Form State
  const [purchaseNumber, setPurchaseNumber] = useState('');
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [supplierCompany, setSupplierCompany] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierEmail, setSupplierEmail] = useState('');
  const [supplierAddress, setSupplierAddress] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [taxRate, setTaxRate] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank Transfer' | 'bKash/Nagad' | 'Cheque'>('Bank Transfer');
  const [status, setStatus] = useState<PurchaseStatus>('Received');
  const [notes, setNotes] = useState('');
  const [updateStock, setUpdateStock] = useState(true);

  // Quick Supplier Add state
  const [isQuickAddingSupplier, setIsQuickAddingSupplier] = useState(false);
  const [newSupName, setNewSupName] = useState('');
  const [newSupCompany, setNewSupCompany] = useState('');
  const [newSupPhone, setNewSupPhone] = useState('');
  const [newSupEmail, setNewSupEmail] = useState('');
  const [newSupAddress, setNewSupAddress] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Product Search States (Section 3: Quick Search & Per-Row Searchable Selector)
  const [quickProductSearch, setQuickProductSearch] = useState('');
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false);
  const [openRowPickerId, setOpenRowPickerId] = useState<string | null>(null);
  const [rowSearchQuery, setRowSearchQuery] = useState('');
  const quickSearchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (quickSearchRef.current && !quickSearchRef.current.contains(e.target as Node)) {
        setIsQuickSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filterCatalogProducts = (query: string) => {
    const q = query.trim().toLowerCase();
    const list = Array.isArray(products) ? products.filter(Boolean) : [];
    if (!q) return list.slice(0, 40);
    return list
      .filter((p) => {
        const name = String(p.name || '').toLowerCase();
        const sku = String(p.sku || '').toLowerCase();
        const brand = String(p.brand || '').toLowerCase();
        const crossRef = String(p.crossReference || '').toLowerCase();
        const measurement = String(p.measurement || '').toLowerCase();
        const warehouse = String(p.warehouse || '').toLowerCase();
        return (
          name.includes(q) ||
          sku.includes(q) ||
          brand.includes(q) ||
          crossRef.includes(q) ||
          measurement.includes(q) ||
          warehouse.includes(q)
        );
      })
      .slice(0, 40);
  };

  const quickSearchResults = useMemo(
    () => filterCatalogProducts(quickProductSearch),
    [products, quickProductSearch]
  );

  const rowSearchResults = useMemo(
    () => filterCatalogProducts(rowSearchQuery),
    [products, rowSearchQuery]
  );

  // Auto-generate sequential Purchase Number (+1) or populate for edit
  useEffect(() => {
    if (isOpen) {
      if (initialPurchase) {
        setPurchaseNumber(initialPurchase.purchaseNumber);
        setSupplierInvoiceNo(initialPurchase.supplierInvoiceNo || '');
        setSelectedSupplierId(initialPurchase.supplierId);
        setSupplierName(initialPurchase.supplierName);
        setSupplierCompany(initialPurchase.supplierCompany || '');
        setSupplierPhone(initialPurchase.supplierPhone || '');
        setSupplierEmail(initialPurchase.supplierEmail || '');
        setSupplierAddress(initialPurchase.supplierAddress || '');
        setPurchaseDate(initialPurchase.purchaseDate);
        setItems(initialPurchase.items.length > 0 ? [...initialPurchase.items] : []);
        setTaxRate(initialPurchase.taxRate || 0);
        setDiscount(initialPurchase.discount || 0);
        setShippingCost(initialPurchase.shippingCost || 0);
        setPaidAmount(initialPurchase.paidAmount || 0);
        setPaymentMethod(initialPurchase.paymentMethod || 'Bank Transfer');
        setStatus(initialPurchase.status || 'Received');
        setNotes(initialPurchase.notes || '');
        setUpdateStock(false); // Don't double add stock on edit unless desired
      } else {
        setPurchaseNumber(generateNextPurchaseNumber(purchases));
        setSupplierInvoiceNo('');
        setSelectedSupplierId('');
        setSupplierName('');
        setSupplierCompany('');
        setSupplierPhone('');
        setSupplierEmail('');
        setSupplierAddress('');
        setPurchaseDate(new Date().toISOString().split('T')[0]);
        setItems([
          {
            id: `p-item-${Date.now()}-1`,
            productId: products[0]?.id || '',
            productName: products[0]?.name || '',
            sku: products[0]?.sku || '',
            brand: products[0]?.brand || '',
            unit: products[0]?.unit || 'Pcs',
            quantity: 1,
            unitCost: Math.round((products[0]?.price || 1000) * 0.75),
            totalCost: Math.round((products[0]?.price || 1000) * 0.75)
          }
        ]);
        setTaxRate(0);
        setDiscount(0);
        setShippingCost(0);
        setPaidAmount(0);
        setPaymentMethod('Bank Transfer');
        setStatus('Received');
        setNotes('');
        setUpdateStock(true);
      }
      setIsQuickAddingSupplier(false);
      setQuickProductSearch('');
      setIsQuickSearchOpen(false);
      setOpenRowPickerId(null);
      setRowSearchQuery('');
      setErrorMsg('');
    }
  }, [isOpen, initialPurchase, products, purchases]);

  // Handle Supplier Selection
  const handleSupplierSelect = (supId: string) => {
    setSelectedSupplierId(supId);
    if (supId === 'NEW') {
      setIsQuickAddingSupplier(true);
      return;
    }
    const sup = suppliers.find(s => s.id === supId);
    if (sup) {
      setSupplierName(sup.name);
      setSupplierCompany(sup.company || '');
      setSupplierPhone(sup.phone || '');
      setSupplierEmail(sup.email || '');
      setSupplierAddress(sup.address || '');
    }
  };

  // Quick save new supplier
  const handleSaveQuickSupplier = async () => {
    if (!newSupName.trim() || !newSupPhone.trim()) {
      setErrorMsg('Please enter at least Supplier Name and Phone Number.');
      return;
    }
    const nextSupNum = 1001 + (suppliers?.length || 0);
    const newSup: Supplier = {
      id: `sup-${Date.now()}`,
      supplierId: `SUP-${nextSupNum}`,
      name: newSupName.trim(),
      company: newSupCompany.trim(),
      phone: newSupPhone.trim(),
      email: newSupEmail.trim(),
      address: newSupAddress.trim(),
      createdAt: new Date().toISOString().split('T')[0]
    };
    try {
      await onAddSupplier(newSup);
      setSelectedSupplierId(newSup.id);
      setSupplierName(newSup.name);
      setSupplierCompany(newSup.company);
      setSupplierPhone(newSup.phone);
      setSupplierEmail(newSup.email);
      setSupplierAddress(newSup.address);
      setIsQuickAddingSupplier(false);
      setNewSupName('');
      setNewSupCompany('');
      setNewSupPhone('');
      setNewSupEmail('');
      setNewSupAddress('');
      setErrorMsg('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save new supplier');
    }
  };

  // Line Item Handlers
  const handleAddItem = () => {
    const defaultProd = products[0];
    const newItem: PurchaseItem = {
      id: `p-item-${Date.now()}-${items.length + 1}`,
      productId: defaultProd?.id || '',
      productName: defaultProd?.name || '',
      sku: defaultProd?.sku || '',
      brand: defaultProd?.brand || '',
      unit: defaultProd?.unit || 'Pcs',
      quantity: 1,
      unitCost: Math.round((defaultProd?.price || 1000) * 0.75),
      totalCost: Math.round((defaultProd?.price || 1000) * 0.75)
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const getProductUnitCost = (prod?: Product) => {
    if (!prod) return 0;
    const cost = Number(prod.costPrice);
    if (Number.isFinite(cost) && cost > 0) return cost;
    return Math.round((Number(prod.price) || 0) * 0.75);
  };

  const handleQuickAddFromSearch = (prod: Product) => {
    const cost = getProductUnitCost(prod);
    const newItem: PurchaseItem = {
      id: `p-item-${Date.now()}-${items.length + 1}`,
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku || '',
      brand: prod.brand || '',
      unit: prod.unit || 'Pcs',
      quantity: 1,
      unitCost: cost,
      totalCost: cost
    };

    // If there is only a single blank row without a product name, replace it; otherwise append
    if (items.length === 1 && !items[0].productName.trim()) {
      setItems([newItem]);
    } else {
      setItems([...items, newItem]);
    }
    setQuickProductSearch('');
    setIsQuickSearchOpen(false);
  };

  const handleItemProductChange = (index: number, prodId: string) => {
    const prod = products.find(p => p.id === prodId);
    const updated = [...items];
    if (prod) {
      const cost = getProductUnitCost(prod);
      updated[index] = {
        ...updated[index],
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        brand: prod.brand,
        unit: prod.unit,
        unitCost: cost,
        totalCost: cost * updated[index].quantity
      };
    } else {
      updated[index] = {
        ...updated[index],
        productId: '',
        productName: '',
        sku: '',
        brand: '',
        unit: 'Pcs'
      };
    }
    setItems(updated);
    setOpenRowPickerId(null);
    setRowSearchQuery('');
  };

  const handleItemFieldChange = (index: number, field: 'productName' | 'quantity' | 'unitCost' | 'unit' | 'sku' | 'brand', value: any) => {
    const updated = [...items];
    const current = { ...updated[index] };
    
    if (field === 'quantity') {
      const q = Math.max(1, Number(value) || 1);
      current.quantity = q;
      current.totalCost = q * current.unitCost;
    } else if (field === 'unitCost') {
      const c = Math.max(0, Number(value) || 0);
      current.unitCost = c;
      current.totalCost = current.quantity * c;
    } else if (field === 'productName') {
      current.productName = value;
    } else if (field === 'unit') {
      current.unit = value;
    } else if (field === 'sku') {
      current.sku = value;
      const cleanSku = String(value || '').trim().toLowerCase();
      if (cleanSku) {
        const matchedBySku = products.find(p => String(p.sku || '').trim().toLowerCase() === cleanSku);
        if (matchedBySku) {
          current.productId = matchedBySku.id;
          if (!current.productName) current.productName = matchedBySku.name;
          if (!current.brand) current.brand = matchedBySku.brand;
          if (!current.unit) current.unit = matchedBySku.unit;
        } else {
          current.productId = '';
        }
      } else {
        current.productId = '';
      }
    } else if (field === 'brand') {
      current.brand = value;
    }

    updated[index] = current;
    setItems(updated);
  };

  // Totals Calculations
  const subtotal = items.reduce((acc, item) => acc + (item.totalCost || 0), 0);
  const taxAmount = taxRate > 0 ? Math.round((subtotal * taxRate) / 100) : 0;
  const grandTotal = Math.max(0, subtotal + taxAmount + Number(shippingCost || 0) - Number(discount || 0));
  const dueAmount = Math.max(0, grandTotal - Number(paidAmount || 0));

  const paymentStatus: PurchasePaymentStatus = 
    paidAmount >= grandTotal && grandTotal > 0 ? 'Paid' : 
    paidAmount > 0 ? 'Partial' : 'Due';

  // Auto set paid amount to grand total if user clicks "Mark as Fully Paid"
  const handleMarkFullyPaid = () => {
    setPaidAmount(grandTotal);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!supplierName.trim()) {
      setErrorMsg('Please select or specify a Supplier.');
      return;
    }

    if (items.length === 0 || items.some(it => !it.productName.trim())) {
      setErrorMsg('Please ensure all purchase line items have valid product names.');
      return;
    }

    setIsSubmitting(true);
    try {
      const purchaseData: Purchase = {
        id: initialPurchase?.id || `pur-${Date.now()}`,
        purchaseNumber: purchaseNumber.trim(),
        supplierInvoiceNo: supplierInvoiceNo.trim(),
        supplierId: selectedSupplierId || `sup-custom-${Date.now()}`,
        supplierName: supplierName.trim(),
        supplierCompany: supplierCompany.trim(),
        supplierPhone: supplierPhone.trim(),
        supplierEmail: supplierEmail.trim(),
        supplierAddress: supplierAddress.trim(),
        purchaseDate,
        items,
        subtotal,
        taxRate,
        taxAmount,
        discount: Number(discount || 0),
        shippingCost: Number(shippingCost || 0),
        grandTotal,
        paidAmount: Number(paidAmount || 0),
        dueAmount,
        paymentStatus,
        paymentMethod,
        status,
        notes: notes.trim(),
        createdAt: initialPurchase?.createdAt || new Date().toISOString().split('T')[0]
      };

      await onSave(purchaseData, updateStock);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save purchase entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[85vh] sm:max-h-[88vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl">
              <PackagePlus className="w-6 h-6 text-emerald-100" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {initialPurchase ? 'Edit Purchase Entry' : 'New Purchase / Stock Inward Entry'}
              </h2>
              <p className="text-xs text-emerald-100">
                Supplier procurement, inventory inward stock & payable ledger management
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6 flex-1 overflow-y-auto">
          
          {errorMsg && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl flex items-center gap-3 text-rose-700 dark:text-rose-300 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Basic Information & Supplier */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
            
            {/* Purchase Details */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                1. Purchase Voucher Information
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Purchase Invoice No. *
                </label>
                <input
                  type="text"
                  required
                  value={purchaseNumber}
                  onChange={(e) => setPurchaseNumber(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono font-medium"
                  placeholder="PUR/2026/0001"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Supplier's Bill/Challan No.
                </label>
                <input
                  type="text"
                  value={supplierInvoiceNo}
                  onChange={(e) => setSupplierInvoiceNo(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. INV-99812 / Ch-404"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Purchase Date *
                </label>
                <DateInput
                  required
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Supplier Selection */}
            <div className="space-y-4 lg:col-span-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  2. Supplier Details
                </h3>
                {!isQuickAddingSupplier && (
                  <button
                    type="button"
                    onClick={() => setIsQuickAddingSupplier(true)}
                    className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Quick Add Supplier
                  </button>
                )}
              </div>

              {isQuickAddingSupplier ? (
                <div className="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Create New Supplier Profile</span>
                    <button
                      type="button"
                      onClick={() => setIsQuickAddingSupplier(false)}
                      className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Supplier / Contact Person Name *"
                      value={newSupName}
                      onChange={(e) => setNewSupName(e.target.value)}
                      className="px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Company Name (e.g. Hitachi Japan Hub)"
                      value={newSupCompany}
                      onChange={(e) => setNewSupCompany(e.target.value)}
                      className="px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Phone Number *"
                      value={newSupPhone}
                      onChange={(e) => setNewSupPhone(e.target.value)}
                      className="px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                    />
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={newSupEmail}
                      onChange={(e) => setNewSupEmail(e.target.value)}
                      className="px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Address / Location (e.g. Motijheel, Dhaka)"
                    value={newSupAddress}
                    onChange={(e) => setNewSupAddress(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={handleSaveQuickSupplier}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                  >
                    Save & Select Supplier
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Select Existing Supplier
                    </label>
                    <select
                      value={selectedSupplierId}
                      onChange={(e) => handleSupplierSelect(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">-- Choose Supplier or type manually --</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} {s.company ? `(${s.company})` : ''} - {s.phone}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Supplier / Contact Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      placeholder="e.g. Mahmudur Rahman"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Supplier Company Name
                    </label>
                    <input
                      type="text"
                      value={supplierCompany}
                      onChange={(e) => setSupplierCompany(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      placeholder="e.g. Hitachi Air Solutions Hub"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Supplier Phone
                    </label>
                    <input
                      type="text"
                      value={supplierPhone}
                      onChange={(e) => setSupplierPhone(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      placeholder="01711-XXXXXX"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Items Table (Purchased Products List) */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <ShoppingCart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                3. Purchased Products & Unit Cost
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Product Row
              </button>
            </div>

            {/* Quick Product Search & Add Bar */}
            <div ref={quickSearchRef} className="relative">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-emerald-600 dark:text-emerald-400 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={quickProductSearch}
                  onFocus={() => setIsQuickSearchOpen(true)}
                  onChange={(e) => {
                    setQuickProductSearch(e.target.value);
                    setIsQuickSearchOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setIsQuickSearchOpen(false);
                  }}
                  placeholder="Search product by Name, Parts No. / SKU, Cross Ref, or Brand to add..."
                  className="w-full pl-9 pr-9 py-2.5 text-xs bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700/80 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 shadow-2xs font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                />
                {quickProductSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuickProductSearch('');
                      setIsQuickSearchOpen(false);
                    }}
                    className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {isQuickSearchOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden">
                  <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <span>
                      {quickProductSearch.trim()
                        ? `Matching Inventory Items (${quickSearchResults.length})`
                        : `Inventory Catalog (${products.length} items) — Click to Add`}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsQuickSearchOpen(false)}
                      className="text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      Close
                    </button>
                  </div>

                  <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {quickSearchResults.length > 0 ? (
                      quickSearchResults.map((p) => {
                        const qty = Number(p.stock) || 0;
                        const estCost = getProductUnitCost(p);
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleQuickAddFromSearch(p)}
                            className="w-full px-3 py-2 text-left hover:bg-emerald-50/80 dark:hover:bg-emerald-950/40 flex items-center justify-between gap-3 transition-colors cursor-pointer"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                                  {p.name}
                                </span>
                                {p.brand && (
                                  <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded">
                                    {p.brand}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500 flex items-center gap-2 flex-wrap mt-0.5 font-mono">
                                <span>SKU: {p.sku || 'N/A'}</span>
                                {p.crossReference && <span>• Ref: {p.crossReference}</span>}
                                {p.warehouse && <span>• WH: {p.warehouse}</span>}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                                qty <= 0
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : qty <= 5
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}>
                                Stock: {qty} {p.unit || 'Pcs'}
                              </span>
                              <span className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-400 min-w-[70px] text-right">
                                Tk. {estCost.toLocaleString()}
                              </span>
                              <span className="px-2 py-1 bg-emerald-600 text-white rounded-md text-[10px] font-bold">
                                + Add
                              </span>
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="px-4 py-6 text-center text-xs text-slate-400">
                        No matching product found for "{quickProductSearch}". You can still type a custom item directly in the table below.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="border border-slate-200 dark:border-slate-700/80 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100/90 dark:bg-slate-800/80 text-xs text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2.5 px-3 w-8">#</th>
                      <th className="py-2.5 px-3 min-w-[260px]">Product / Spare Part Item</th>
                      <th className="py-2.5 px-3 w-28">Unit</th>
                      <th className="py-2.5 px-3 w-28">Quantity</th>
                      <th className="py-2.5 px-3 w-36">Purchase Cost (Tk.)</th>
                      <th className="py-2.5 px-3 w-36 text-right">Total (Tk.)</th>
                      <th className="py-2.5 px-3 w-12 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                    {items.map((item, index) => {
                      const selectedCatalogProd = products.find(p => p.id === item.productId);
                      const isPickerOpen = openRowPickerId === item.id;

                      return (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-2.5 px-3 text-xs font-mono text-slate-400 align-top pt-3.5">
                          {index + 1}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="space-y-1.5">
                            {/* Searchable Catalog Item Picker */}
                            <div className="space-y-1">
                              <button
                                type="button"
                                onClick={() => {
                                  if (isPickerOpen) {
                                    setOpenRowPickerId(null);
                                    setRowSearchQuery('');
                                  } else {
                                    setOpenRowPickerId(item.id);
                                    setRowSearchQuery('');
                                  }
                                }}
                                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-emerald-400 rounded-lg font-medium flex items-center justify-between gap-2 text-left cursor-pointer transition-colors"
                              >
                                <span className="truncate text-slate-700 dark:text-slate-200">
                                  {selectedCatalogProd
                                    ? `${selectedCatalogProd.name} (${selectedCatalogProd.brand || 'N/A'} | Stock: ${selectedCatalogProd.stock} ${selectedCatalogProd.unit || 'Pcs'})`
                                    : '-- Search or Select Catalog Item --'}
                                </span>
                                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${isPickerOpen ? 'rotate-180' : ''}`} />
                              </button>

                              {isPickerOpen && (
                                <div className="bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-lg shadow-md overflow-hidden">
                                  <div className="p-1.5 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                                    <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <input
                                      type="text"
                                      autoFocus
                                      value={rowSearchQuery}
                                      onChange={(e) => setRowSearchQuery(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Escape') {
                                          setOpenRowPickerId(null);
                                          setRowSearchQuery('');
                                        }
                                      }}
                                      placeholder="Type name, SKU, cross ref, or brand..."
                                      className="w-full bg-transparent text-xs focus:outline-hidden text-slate-800 dark:text-slate-100"
                                    />
                                    {rowSearchQuery && (
                                      <button
                                        type="button"
                                        onClick={() => setRowSearchQuery('')}
                                        className="text-slate-400 hover:text-slate-600 cursor-pointer"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                  <div className="max-h-44 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                                    <button
                                      type="button"
                                      onClick={() => handleItemProductChange(index, '')}
                                      className="w-full px-2.5 py-1.5 text-left text-[11px] text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 italic cursor-pointer"
                                    >
                                      -- Custom / Manual Item (Clear Catalog Link) --
                                    </button>
                                    {rowSearchResults.length > 0 ? (
                                      rowSearchResults.map((p) => {
                                        const qty = Number(p.stock) || 0;
                                        return (
                                          <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => handleItemProductChange(index, p.id)}
                                            className={`w-full px-2.5 py-1.5 text-left hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center justify-between gap-2 cursor-pointer ${
                                              item.productId === p.id ? 'bg-emerald-50/70 dark:bg-emerald-950/30' : ''
                                            }`}
                                          >
                                            <div className="min-w-0">
                                              <div className="text-[11px] font-bold text-slate-800 dark:text-slate-100 truncate">
                                                {p.name}
                                              </div>
                                              <div className="text-[10px] text-slate-500 font-mono truncate">
                                                {p.sku || 'N/A'} {p.brand ? `• ${p.brand}` : ''} {p.crossReference ? `• Ref: ${p.crossReference}` : ''}
                                              </div>
                                            </div>
                                            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 ${
                                              qty <= 0 ? 'bg-rose-50 text-rose-700' : qty <= 5 ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-700'
                                            }`}>
                                              {qty} {p.unit || 'Pcs'}
                                            </span>
                                          </button>
                                        );
                                      })
                                    ) : (
                                      <div className="px-2.5 py-3 text-center text-[11px] text-slate-400">
                                        No matching catalog items
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>

                            <input
                              type="text"
                              required
                              placeholder="Product Title / Description"
                              value={item.productName}
                              onChange={(e) => handleItemFieldChange(index, 'productName', e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold"
                            />
                            <div className="grid grid-cols-2 gap-1.5">
                              <input
                                type="text"
                                placeholder="Parts No. / SKU"
                                value={item.sku || ''}
                                onChange={(e) => handleItemFieldChange(index, 'sku', e.target.value)}
                                className="w-full px-2 py-1 text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-mono"
                              />
                              <input
                                type="text"
                                placeholder="Brand (e.g. Hitachi)"
                                value={item.brand || ''}
                                onChange={(e) => handleItemFieldChange(index, 'brand', e.target.value)}
                                className="w-full px-2 py-1 text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded"
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) => handleItemFieldChange(index, 'unit', e.target.value)}
                            className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-center"
                            placeholder="Pcs/Set"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="number"
                            min="1"
                            value={!item.quantity ? '' : item.quantity}
                            onChange={(e) => handleItemFieldChange(index, 'quantity', e.target.value)}
                            placeholder="1"
                            className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-center font-bold text-emerald-600 dark:text-emerald-400"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={!item.unitCost ? '' : item.unitCost}
                            onChange={(e) => handleItemFieldChange(index, 'unitCost', e.target.value)}
                            placeholder="0.00"
                            className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-right font-mono"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                          Tk. {(item.totalCost || 0).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            disabled={items.length <= 1}
                            onClick={() => handleRemoveItem(index)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 disabled:opacity-30 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Automatic Stock Increment Option */}
            <div className="flex items-center gap-2 p-3 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 rounded-xl text-xs text-emerald-900 dark:text-emerald-300">
              <input
                type="checkbox"
                id="autoUpdateStock"
                checked={updateStock}
                onChange={(e) => setUpdateStock(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
              <label htmlFor="autoUpdateStock" className="cursor-pointer font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <strong>Auto-increase product stock in Inventory</strong> (Automatically increase stock level upon arrival)
              </label>
            </div>
          </div>

          {/* Section 3: Billing Calculations & Payments */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
            
            {/* Payment & Status details */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                4. Payment & Delivery Status
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Procurement Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as PurchaseStatus)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold"
                  >
                    <option value="Received">✅ Received (In Warehouse)</option>
                    <option value="Ordered">📦 Ordered (Awaiting Dispatch)</option>
                    <option value="Pending">⏳ Pending Delivery</option>
                    <option value="Cancelled">❌ Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="bKash/Nagad">bKash / Nagad</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes & Internal Memo
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg resize-none"
                  placeholder="e.g. Delivered via Gazipur transport depot. 30 days supplier credit."
                />
              </div>
            </div>

            {/* Calculations Summary Card */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5 text-sm">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">Tk. {subtotal.toLocaleString()}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="text-xs text-slate-500 block mb-0.5">Discount (Tk.)</label>
                  <input
                    type="number"
                    min="0"
                    value={discount || ''}
                    onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                    className="w-full px-2 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-right"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-0.5">Shipping / Transport (Tk.)</label>
                  <input
                    type="number"
                    min="0"
                    value={shippingCost || ''}
                    onChange={(e) => setShippingCost(Number(e.target.value) || 0)}
                    className="w-full px-2 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-right"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-base font-black pt-2 border-t border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                <span>Grand Total:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">Tk. {grandTotal.toLocaleString()}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Paid Amount</label>
                    <button
                      type="button"
                      onClick={handleMarkFullyPaid}
                      className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                    >
                      Full Paid
                    </button>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={paidAmount || ''}
                    onChange={(e) => setPaidAmount(Number(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-lg font-mono font-bold text-right text-emerald-700 dark:text-emerald-300"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Due Balance
                  </label>
                  <div className={`px-2.5 py-1.5 text-xs font-mono font-bold text-right rounded-lg border ${
                    dueAmount > 0 
                      ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800' 
                      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                  }`}>
                    Tk. {dueAmount.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>Payment Status Badge:</span>
                <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                  paymentStatus === 'Paid' 
                    ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300' 
                    : paymentStatus === 'Partial'
                    ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300'
                    : 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300'
                }`}>
                  {paymentStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-600/20 hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <PackagePlus className="w-4 h-4" />
              {isSubmitting ? 'Saving Purchase...' : initialPurchase ? 'Update Purchase Entry' : 'Save & Record Inward Stock'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
