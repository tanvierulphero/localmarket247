import React, { useState } from 'react';
import { Purchase, Supplier, Product, StaffUser, BusinessSettings } from '../types';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Printer, 
  ShoppingCart, 
  Building2, 
  DollarSign, 
  CreditCard, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Eye, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  MapPin, 
  ArrowUpRight, 
  PackageCheck,
  X,
  TrendingDown,
  Layers,
  ChevronDown
} from 'lucide-react';
import PurchaseEntryModal from './PurchaseEntryModal';

interface PurchasesViewProps {
  purchases: Purchase[];
  suppliers: Supplier[];
  products: Product[];
  settings: BusinessSettings;
  currentUser: StaffUser | null;
  onSavePurchase: (purchase: Purchase, updateStock: boolean) => Promise<void>;
  onDeletePurchase: (id: string) => Promise<void>;
  onSaveSupplier: (supplier: Supplier) => Promise<void>;
  onDeleteSupplier: (id: string) => Promise<void>;
  onUpdateProductStock: (productId: string, quantityDelta: number) => Promise<void>;
}

export default function PurchasesView({
  purchases,
  suppliers,
  products,
  settings,
  currentUser,
  onSavePurchase,
  onDeletePurchase,
  onSaveSupplier,
  onDeleteSupplier,
}: PurchasesViewProps) {
  // Main Tab State: "purchases" | "suppliers"
  const [activeSubTab, setActiveSubTab] = useState<'purchases' | 'suppliers'>('purchases');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterPayment, setFilterPayment] = useState<string>('ALL');
  const [filterSupplier, setFilterSupplier] = useState<string>('ALL');

  // Purchase Modal State
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);

  // Supplier Modal State
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // View / Print Voucher Modal State
  const [viewingPurchase, setViewingPurchase] = useState<Purchase | null>(null);

  // Quick Pay Modal State
  const [quickPayPurchase, setQuickPayPurchase] = useState<Purchase | null>(null);
  const [quickPayAmount, setQuickPayAmount] = useState<number>(0);

  // Check permissions
  const canManage = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER' || currentUser?.permissions.includes('manage_purchases');

  // Filtered Purchases
  const filteredPurchases = purchases.filter(p => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      p.purchaseNumber.toLowerCase().includes(q) ||
      (p.supplierInvoiceNo && p.supplierInvoiceNo.toLowerCase().includes(q)) ||
      p.supplierName.toLowerCase().includes(q) ||
      (p.supplierCompany && p.supplierCompany.toLowerCase().includes(q)) ||
      p.items.some(it => it.productName.toLowerCase().includes(q));

    const matchesStatus = filterStatus === 'ALL' || p.status === filterStatus;
    const matchesPayment = filterPayment === 'ALL' || p.paymentStatus === filterPayment;
    const matchesSupplier = filterSupplier === 'ALL' || p.supplierId === filterSupplier;

    return matchesSearch && matchesStatus && matchesPayment && matchesSupplier;
  });

  // Calculate High-Level Metrics
  const totalPurchaseValue = purchases.reduce((sum, p) => sum + (p.grandTotal || 0), 0);
  const totalPaidToSuppliers = purchases.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
  const totalSupplierPayableDue = purchases.reduce((sum, p) => sum + (p.dueAmount || 0), 0);
  const totalPurchaseCount = purchases.length;

  // Handle Quick Payment Submit
  const handleQuickPaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPayPurchase) return;

    const newPaid = Number(quickPayPurchase.paidAmount || 0) + Number(quickPayAmount || 0);
    const newDue = Math.max(0, Number(quickPayPurchase.grandTotal || 0) - newPaid);
    const newPaymentStatus = newDue <= 0 ? 'Paid' : 'Partial';

    const updated: Purchase = {
      ...quickPayPurchase,
      paidAmount: newPaid,
      dueAmount: newDue,
      paymentStatus: newPaymentStatus
    };

    await onSavePurchase(updated, false);
    setQuickPayPurchase(null);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Purchase No',
      'Supplier Invoice',
      'Date',
      'Supplier Name',
      'Supplier Company',
      'Phone',
      'Items Count',
      'Grand Total (BDT)',
      'Paid Amount (BDT)',
      'Due Amount (BDT)',
      'Payment Status',
      'Procurement Status'
    ];

    const rows = filteredPurchases.map(p => [
      `"${p.purchaseNumber}"`,
      `"${p.supplierInvoiceNo || ''}"`,
      `"${p.purchaseDate}"`,
      `"${p.supplierName}"`,
      `"${p.supplierCompany || ''}"`,
      `"${p.supplierPhone}"`,
      p.items.length,
      p.grandTotal,
      p.paidAmount,
      p.dueAmount,
      `"${p.paymentStatus}"`,
      `"${p.status}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Purchases_Register_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <ShoppingCart className="w-6 h-6" />
            </div>
            Purchase Entry & Supplier Procurement (ক্রয় ও ভেন্ডর ব্যবস্থাপনা)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Record supplier purchases, stock inward entries, payments & accounts payable ledger
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>

          {canManage && (
            <>
              <button
                onClick={() => {
                  setEditingSupplier(null);
                  setIsSupplierModalOpen(true);
                }}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Building2 className="w-4 h-4 text-emerald-600" /> + Add Supplier
              </button>

              <button
                onClick={() => {
                  setEditingPurchase(null);
                  setIsEntryModalOpen(true);
                }}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all"
              >
                <Plus className="w-4 h-4" /> + New Purchase Entry (নতুন ক্রয়)
              </button>
            </>
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Purchases Value */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Purchases (মোট ক্রয়)</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-black font-mono text-slate-900 dark:text-white">
              ৳{totalPurchaseValue.toLocaleString()}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">{totalPurchaseCount} total purchase invoices recorded</p>
          </div>
        </div>

        {/* Total Paid to Suppliers */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Paid to Suppliers (পরিশোধ)</span>
            <div className="p-2 bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-black font-mono text-teal-600 dark:text-teal-400">
              ৳{totalPaidToSuppliers.toLocaleString()}
            </h3>
            <p className="text-[11px] text-teal-600/80 dark:text-teal-400/80 mt-0.5">Cleared via Bank, Cash & Cheque</p>
          </div>
        </div>

        {/* Supplier Payable Due */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Supplier Payable Due (বকেয়া)</span>
            <div className="p-2 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-xl">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-black font-mono text-rose-600 dark:text-rose-400">
              ৳{totalSupplierPayableDue.toLocaleString()}
            </h3>
            <p className="text-[11px] text-rose-600/80 dark:text-rose-400/80 mt-0.5">Accounts payable to vendors</p>
          </div>
        </div>

        {/* Suppliers Count */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Registered Suppliers (ভেন্ডর)</span>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-black font-mono text-blue-600 dark:text-blue-400">
              {suppliers.length}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Active partners & OEM distributors</p>
          </div>
        </div>

      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveSubTab('purchases')}
          className={`pb-3 px-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeSubTab === 'purchases'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          Purchase Invoices & Inward Stock ({purchases.length})
        </button>
        <button
          onClick={() => setActiveSubTab('suppliers')}
          className={`pb-3 px-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeSubTab === 'suppliers'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Suppliers Directory ({suppliers.length})
        </button>
      </div>

      {activeSubTab === 'purchases' ? (
        <div className="space-y-4">
          
          {/* Search and Filters Bar */}
          <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-sm flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Purchase #, Supplier, Bill # or Product Name..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 transition-colors"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300"
              >
                <option value="ALL">Status: All</option>
                <option value="Received">✅ Received</option>
                <option value="Ordered">📦 Ordered</option>
                <option value="Pending">⏳ Pending</option>
                <option value="Cancelled">❌ Cancelled</option>
              </select>

              <select
                value={filterPayment}
                onChange={(e) => setFilterPayment(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300"
              >
                <option value="ALL">Payment: All</option>
                <option value="Paid">🟢 Fully Paid</option>
                <option value="Partial">🟡 Partial Paid</option>
                <option value="Due">🔴 Unpaid / Due</option>
              </select>

              <select
                value={filterSupplier}
                onChange={(e) => setFilterSupplier(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 max-w-[180px]"
              >
                <option value="ALL">Supplier: All</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.company || s.phone})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Purchases Table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-3 px-4">Purchase No & Bill</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Supplier & Contact</th>
                    <th className="py-3 px-4">Items Summary</th>
                    <th className="py-3 px-4 text-right">Grand Total (৳)</th>
                    <th className="py-3 px-4 text-right">Paid (৳)</th>
                    <th className="py-3 px-4 text-right">Due (৳)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {filteredPurchases.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        <ShoppingCart className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                        <p className="font-semibold text-sm text-slate-600 dark:text-slate-300">No Purchase Entries Found</p>
                        <p className="text-xs text-slate-400 mt-1">Click "+ New Purchase Entry" to record your first stock inward</p>
                      </td>
                    </tr>
                  ) : (
                    filteredPurchases.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                        
                        {/* Purchase & Bill No */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-white font-mono flex items-center gap-1.5">
                            <span className="text-emerald-600 dark:text-emerald-400">{p.purchaseNumber}</span>
                          </div>
                          {p.supplierInvoiceNo && (
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                              Bill: {p.supplierInvoiceNo}
                            </span>
                          )}
                        </td>

                        {/* Date */}
                        <td className="py-3 px-4 whitespace-nowrap text-slate-600 dark:text-slate-300 font-medium">
                          {p.purchaseDate}
                        </td>

                        {/* Supplier */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            {p.supplierName}
                          </div>
                          {p.supplierCompany && (
                            <div className="text-[11px] text-slate-500">{p.supplierCompany}</div>
                          )}
                          {p.supplierPhone && (
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-emerald-500" /> {p.supplierPhone}
                            </div>
                          )}
                        </td>

                        {/* Items */}
                        <td className="py-3 px-4 max-w-[220px]">
                          <div className="space-y-0.5">
                            {p.items.slice(0, 2).map((it, idx) => (
                              <div key={idx} className="text-slate-700 dark:text-slate-300 truncate">
                                • {it.quantity}x {it.productName}
                              </div>
                            ))}
                            {p.items.length > 2 && (
                              <span className="text-[10px] text-emerald-600 font-bold">
                                +{p.items.length - 2} more items
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Grand Total */}
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                          ৳{(p.grandTotal || 0).toLocaleString()}
                        </td>

                        {/* Paid */}
                        <td className="py-3 px-4 text-right font-mono font-bold text-teal-600 dark:text-teal-400">
                          ৳{(p.paidAmount || 0).toLocaleString()}
                        </td>

                        {/* Due */}
                        <td className="py-3 px-4 text-right font-mono font-bold">
                          <span className={p.dueAmount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}>
                            ৳{(p.dueAmount || 0).toLocaleString()}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 text-center">
                          <div className="space-y-1 inline-flex flex-col items-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              p.status === 'Received' 
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300' 
                                : p.status === 'Ordered'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                            }`}>
                              {p.status}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              p.paymentStatus === 'Paid'
                                ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200/60'
                                : p.paymentStatus === 'Partial'
                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60'
                                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/60'
                            }`}>
                              {p.paymentStatus}
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            
                            {/* View / Print Voucher */}
                            <button
                              onClick={() => setViewingPurchase(p)}
                              title="View / Print Purchase Bill"
                              className="p-1.5 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Quick Payment Button if due exists */}
                            {canManage && p.dueAmount > 0 && (
                              <button
                                onClick={() => {
                                  setQuickPayPurchase(p);
                                  setQuickPayAmount(p.dueAmount);
                                }}
                                title="Pay Supplier Due"
                                className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors"
                              >
                                <CreditCard className="w-4 h-4" />
                              </button>
                            )}

                            {/* Edit */}
                            {canManage && (
                              <button
                                onClick={() => {
                                  setEditingPurchase(p);
                                  setIsEntryModalOpen(true);
                                }}
                                title="Edit Purchase Entry"
                                className="p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}

                            {/* Delete */}
                            {canManage && (
                              <button
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete purchase entry "${p.purchaseNumber}"?`)) {
                                    onDeletePurchase(p.id);
                                  }
                                }}
                                title="Delete Purchase Entry"
                                className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}

                          </div>
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      ) : (
        /* Suppliers Management Tab */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers.map(s => {
              const supPurchases = purchases.filter(p => p.supplierId === s.id);
              const supTotal = supPurchases.reduce((sum, p) => sum + (p.grandTotal || 0), 0);
              const supDue = supPurchases.reduce((sum, p) => sum + (p.dueAmount || 0), 0);

              return (
                <div key={s.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-sm space-y-4 relative group">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded font-semibold text-slate-600 dark:text-slate-300">
                        {s.supplierId || 'SUP-VENDOR'}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                        {s.name}
                      </h3>
                      {s.company && (
                        <p className="text-xs text-slate-500 font-medium">{s.company}</p>
                      )}
                    </div>

                    {canManage && (
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                        <button
                          onClick={() => {
                            setEditingSupplier(s);
                            setIsSupplierModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete supplier "${s.name}"?`)) {
                              onDeleteSupplier(s.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{s.phone}</span>
                    </div>
                    {s.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{s.email}</span>
                      </div>
                    )}
                    {s.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{s.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Supplier Ledger Mini Stats */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Total Purchased</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        ৳{supTotal.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block">Outstanding Due</span>
                      <span className={`font-mono font-bold ${supDue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600'}`}>
                        ৳{supDue.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 1. Purchase Entry Modal */}
      <PurchaseEntryModal
        isOpen={isEntryModalOpen}
        onClose={() => {
          setIsEntryModalOpen(false);
          setEditingPurchase(null);
        }}
        onSave={onSavePurchase}
        suppliers={suppliers}
        products={products}
        onAddSupplier={onSaveSupplier}
        initialPurchase={editingPurchase}
      />

      {/* 2. Supplier Create/Edit Modal */}
      {isSupplierModalOpen && (
        <SupplierModal
          isOpen={isSupplierModalOpen}
          onClose={() => {
            setIsSupplierModalOpen(false);
            setEditingSupplier(null);
          }}
          onSave={onSaveSupplier}
          initialSupplier={editingSupplier}
        />
      )}

      {/* 3. View / Print Purchase Voucher Modal */}
      {viewingPurchase && (
        <PurchasePrintModal
          purchase={viewingPurchase}
          settings={settings}
          onClose={() => setViewingPurchase(null)}
        />
      )}

      {/* 4. Quick Pay Modal */}
      {quickPayPurchase && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" /> Pay Supplier Due
              </h3>
              <button onClick={() => setQuickPayPurchase(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Purchase No:</span>
                <strong className="text-slate-800 dark:text-slate-200">{quickPayPurchase.purchaseNumber}</strong>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Supplier:</span>
                <strong className="text-slate-800 dark:text-slate-200">{quickPayPurchase.supplierName}</strong>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Current Due Balance:</span>
                <strong className="text-rose-600 font-mono text-sm">৳{quickPayPurchase.dueAmount.toLocaleString()}</strong>
              </div>
            </div>

            <form onSubmit={handleQuickPaySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Amount (টাকা)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={quickPayPurchase.dueAmount}
                  value={quickPayAmount || ''}
                  onChange={(e) => setQuickPayAmount(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold text-emerald-600 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setQuickPayPurchase(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// Supplier Create / Edit Component Modal
function SupplierModal({
  isOpen,
  onClose,
  onSave,
  initialSupplier
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (supplier: Supplier) => Promise<void>;
  initialSupplier?: Supplier | null;
}) {
  const [name, setName] = useState(initialSupplier?.name || '');
  const [company, setCompany] = useState(initialSupplier?.company || '');
  const [phone, setPhone] = useState(initialSupplier?.phone || '');
  const [email, setEmail] = useState(initialSupplier?.email || '');
  const [address, setAddress] = useState(initialSupplier?.address || '');
  const [contactPerson, setContactPerson] = useState(initialSupplier?.contactPerson || '');
  const [notes, setNotes] = useState(initialSupplier?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    setIsSubmitting(true);
    try {
      const data: Supplier = {
        id: initialSupplier?.id || `sup-${Date.now()}`,
        supplierId: initialSupplier?.supplierId || `SUP-${Math.floor(1000 + Math.random() * 9000)}`,
        name: name.trim(),
        company: company.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        contactPerson: contactPerson.trim(),
        notes: notes.trim(),
        createdAt: initialSupplier?.createdAt || new Date().toISOString().split('T')[0]
      };
      await onSave(data);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600" />
            {initialSupplier ? 'Edit Supplier (ভেন্ডর তথ্য সংশোধন)' : 'Add New Supplier (নতুন ভেন্ডর)'}
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Supplier Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
              placeholder="e.g. Mahmudur Rahman"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Company / Firm Name</label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
              placeholder="e.g. Hitachi Regional Hub"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                placeholder="01711-XXXXXX"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                placeholder="supplier@mail.com"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Address / Warehouse</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
              placeholder="Motijheel, Dhaka / Gazipur"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Notes / Terms</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs resize-none"
              placeholder="Credit terms, warranty agreements etc."
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold"
            >
              {isSubmitting ? 'Saving...' : 'Save Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Purchase Invoice Print / View Modal
function PurchasePrintModal({
  purchase,
  settings,
  onClose
}: {
  purchase: Purchase;
  settings: BusinessSettings;
  onClose: () => void;
}) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in no-print-backdrop print:bg-transparent print:p-0">
      <div className="bg-white text-slate-900 w-full max-w-3xl rounded-2xl border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-slide-up print:max-h-none print:border-none print:shadow-none">
        
        {/* Top Action Bar (hidden in print) */}
        <div className="bg-slate-950 text-white px-4 py-3 flex justify-between items-center gap-4 flex-shrink-0 border-b border-slate-800 no-print">
          <span className="font-bold text-xs sm:text-sm flex items-center gap-2">
            <Printer className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            Purchase Receipt / Stock Inward Voucher
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold uppercase rounded-md flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" /> প্রিন্ট করুন (Print)
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white font-bold bg-white/10 hover:bg-white/20 w-7 h-7 rounded-full flex items-center justify-center text-sm cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div id="printable-area" className="overflow-y-auto flex-1 p-8 bg-white text-slate-900 font-sans relative select-none print:overflow-visible print:p-0 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start border-b pb-4 border-slate-200">
            <div>
              <h2 className="text-xl font-black text-slate-900">{settings.name}</h2>
              <p className="text-xs text-slate-600">{settings.slogan}</p>
              <p className="text-xs text-slate-500 mt-1">{settings.address}</p>
              <p className="text-xs text-slate-500">Phone: {settings.phone1} | Email: {settings.email}</p>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider rounded">
                STOCK INWARD VOUCHER
              </span>
              <p className="text-sm font-bold font-mono text-slate-900 mt-1">{purchase.purchaseNumber}</p>
              <p className="text-xs text-slate-500">Date: {purchase.purchaseDate}</p>
              {purchase.supplierInvoiceNo && (
                <p className="text-xs text-slate-500">Supplier Bill: {purchase.supplierInvoiceNo}</p>
              )}
            </div>
          </div>

          {/* Supplier Info */}
          <div className="bg-slate-50 p-4 rounded-xl text-xs space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Received From Supplier:</span>
            <p className="font-bold text-sm text-slate-900">{purchase.supplierName}</p>
            {purchase.supplierCompany && <p className="text-slate-700">{purchase.supplierCompany}</p>}
            {purchase.supplierPhone && <p className="text-slate-600">Phone: {purchase.supplierPhone}</p>}
            {purchase.supplierAddress && <p className="text-slate-500">{purchase.supplierAddress}</p>}
          </div>

          {/* Items Table */}
          <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-100 font-bold text-slate-700">
              <tr>
                <th className="py-2 px-3 w-8">#</th>
                <th className="py-2 px-3">Item Description</th>
                <th className="py-2 px-3 w-20 text-center">Unit</th>
                <th className="py-2 px-3 w-20 text-center">Qty</th>
                <th className="py-2 px-3 w-28 text-right">Unit Rate (৳)</th>
                <th className="py-2 px-3 w-28 text-right">Total (৳)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {purchase.items.map((it, idx) => (
                <tr key={idx}>
                  <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
                  <td className="py-2 px-3 font-semibold text-slate-900">{it.productName}</td>
                  <td className="py-2 px-3 text-center text-slate-600">{it.unit}</td>
                  <td className="py-2 px-3 text-center font-bold text-slate-900">{it.quantity}</td>
                  <td className="py-2 px-3 text-right font-mono">৳{it.unitCost.toLocaleString()}</td>
                  <td className="py-2 px-3 text-right font-mono font-bold">৳{(it.totalCost || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-mono font-bold">৳{purchase.subtotal.toLocaleString()}</span>
              </div>
              {purchase.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount:</span>
                  <span className="font-mono font-bold">-৳{purchase.discount.toLocaleString()}</span>
                </div>
              )}
              {purchase.shippingCost > 0 && (
                <div className="flex justify-between">
                  <span>Shipping/Transport:</span>
                  <span className="font-mono font-bold">+৳{purchase.shippingCost.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-sm text-slate-900 pt-1 border-t border-slate-200">
                <span>Grand Total:</span>
                <span className="font-mono text-emerald-700">৳{purchase.grandTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-teal-700 pt-0.5">
                <span>Paid Amount:</span>
                <span className="font-mono font-bold">৳{purchase.paidAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-rose-700 font-bold pt-0.5">
                <span>Due Balance:</span>
                <span className="font-mono">৳{purchase.dueAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-12 grid grid-cols-2 gap-8 text-center text-xs">
            <div className="border-t border-slate-300 pt-2 text-slate-500">
              Supplier Signature & Date
            </div>
            <div className="border-t border-slate-300 pt-2 text-slate-500">
              Store Officer / Authorized Receipt
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
