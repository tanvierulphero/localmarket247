import { useState, useMemo } from 'react';
import { Customer, Document, FieldDispatch, BusinessSettings, DocumentType } from '../types';
import { 
  Users, 
  Search, 
  Plus, 
  FileText, 
  Phone, 
  Mail, 
  MapPin, 
  Building2, 
  Printer, 
  Download, 
  Edit, 
  Trash2, 
  ArrowUpDown, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  DollarSign, 
  MessageSquare, 
  Receipt, 
  BookOpen, 
  Layers, 
  TrendingUp,
  CreditCard,
  PlusCircle,
  ExternalLink,
  ShieldAlert,
  SlidersHorizontal,
  ChevronRight,
  Send,
  Eye
} from 'lucide-react';

interface CustomerListProps {
  customers: Customer[];
  documents: Document[];
  dispatches?: FieldDispatch[];
  settings: BusinessSettings;
  onSaveCustomer: (customer: Customer) => Promise<void>;
  onDeleteCustomer: (id: string) => Promise<void>;
  onViewDocument: (doc: Document) => void;
  onCreateDocumentForCustomer?: (customer: Customer, type: DocumentType) => void;
}

export default function CustomerList({
  customers,
  documents,
  dispatches = [],
  settings,
  onSaveCustomer,
  onDeleteCustomer,
  onViewDocument,
  onCreateDocumentForCustomer
}: CustomerListProps) {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDueStatus, setFilterDueStatus] = useState<'ALL' | 'DUE_ONLY' | 'PAID_ONLY' | 'HIGH_VALUE'>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'due' | 'totalPurchases' | 'recent'>('recent');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Modal States
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formCustomer, setFormCustomer] = useState<Partial<Customer>>({
    companyId: '',
    name: '',
    company: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Statement / Ledger Modal State
  const [selectedCustomerForLedger, setSelectedCustomerForLedger] = useState<Customer | null>(null);

  // Delete Confirmation Modal State
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Quick Create Document Modal
  const [quickDocCustomer, setQuickDocCustomer] = useState<Customer | null>(null);

  // Calculate customer financial metrics
  const customerFinancials = useMemo(() => {
    const map = new Map<string, {
      totalInvoiced: number;
      totalPaid: number;
      totalDue: number;
      docCount: number;
      invoicesCount: number;
      quotesCount: number;
      challansCount: number;
      lastTransactionDate: string | null;
    }>();

    customers.forEach(c => {
      const custDocs = documents.filter(d => 
        d.customerId === c.id ||
        (d.customerPhone && c.phone && d.customerPhone.trim() === c.phone.trim()) ||
        (d.customerCompany && c.company && d.customerCompany.toLowerCase().trim() === c.company.toLowerCase().trim())
      );

      let totalInvoiced = 0;
      let totalPaid = 0;
      let totalDue = 0;
      let invoicesCount = 0;
      let quotesCount = 0;
      let challansCount = 0;
      let lastDate: string | null = null;

      custDocs.forEach(d => {
        if (!lastDate || new Date(d.date) > new Date(lastDate)) {
          lastDate = d.date;
        }

        if (d.type === 'INVOICE' || d.type === 'BILL') {
          invoicesCount++;
          totalInvoiced += (d.total || 0);
          
          if (d.paidAmount !== undefined) {
            totalPaid += d.paidAmount;
          } else if (d.status === 'Paid') {
            totalPaid += d.total;
          }

          if (d.dueAmount !== undefined) {
            totalDue += d.dueAmount;
          } else if (d.status !== 'Paid') {
            totalDue += (d.total - (d.paidAmount || 0));
          }
        } else if (d.type === 'QUOTATION' || d.type === 'OFFER_LETTER') {
          quotesCount++;
        } else if (d.type === 'CHALLAN') {
          challansCount++;
        }
      });

      map.set(c.id, {
        totalInvoiced,
        totalPaid,
        totalDue: Math.max(0, totalDue),
        docCount: custDocs.length,
        invoicesCount,
        quotesCount,
        challansCount,
        lastTransactionDate: lastDate
      });
    });

    return map;
  }, [customers, documents]);

  // High-level aggregates for summary cards
  const summaryMetrics = useMemo(() => {
    let totalDue = 0;
    let totalSales = 0;
    let totalPaid = 0;
    let dueCustomersCount = 0;
    let activeCustomersCount = 0;

    customers.forEach(c => {
      const fin = customerFinancials.get(c.id);
      if (fin) {
        totalDue += fin.totalDue;
        totalSales += fin.totalInvoiced;
        totalPaid += fin.totalPaid;
        if (fin.totalDue > 0) dueCustomersCount++;
        if (fin.docCount > 0) activeCustomersCount++;
      }
    });

    return {
      totalCustomers: customers.length,
      activeCustomersCount,
      dueCustomersCount,
      totalDue,
      totalSales,
      totalPaid
    };
  }, [customers, customerFinancials]);

  // Filter and Sort Customers
  const filteredCustomers = useMemo(() => {
    return customers
      .filter(c => {
        const q = searchQuery.toLowerCase().trim();
        const compId = (c.companyId || `COMP-${c.id}`).toLowerCase();
        const matchesSearch = !q || 
          compId.includes(q) ||
          c.name.toLowerCase().includes(q) ||
          (c.company && c.company.toLowerCase().includes(q)) ||
          (c.phone && c.phone.includes(q)) ||
          (c.email && c.email.toLowerCase().includes(q)) ||
          (c.address && c.address.toLowerCase().includes(q));

        if (!matchesSearch) return false;

        const fin = customerFinancials.get(c.id);
        const due = fin?.totalDue || 0;
        const total = fin?.totalInvoiced || 0;

        if (filterDueStatus === 'DUE_ONLY') {
          return due > 0;
        } else if (filterDueStatus === 'PAID_ONLY') {
          return due === 0 && (fin?.docCount || 0) > 0;
        } else if (filterDueStatus === 'HIGH_VALUE') {
          return total >= 50000 || due >= 20000;
        }

        return true;
      })
      .sort((a, b) => {
        const finA = customerFinancials.get(a.id);
        const finB = customerFinancials.get(b.id);

        if (sortBy === 'name') {
          return (a.company || a.name).localeCompare(b.company || b.name);
        } else if (sortBy === 'due') {
          return (finB?.totalDue || 0) - (finA?.totalDue || 0);
        } else if (sortBy === 'totalPurchases') {
          return (finB?.totalInvoiced || 0) - (finA?.totalInvoiced || 0);
        } else {
          // recent
          return (b.createdAt || '').localeCompare(a.createdAt || '');
        }
      });
  }, [customers, searchQuery, filterDueStatus, sortBy, customerFinancials]);

  // Open modal for new customer
  const handleOpenAddModal = () => {
    setEditingCustomer(null);
    setFormCustomer({
      companyId: `COMP-${1001 + customers.length}`,
      name: '',
      company: '',
      phone: '',
      email: '',
      address: '',
      notes: ''
    });
    setFormError('');
    setIsAddEditModalOpen(true);
  };

  // Open modal for editing customer
  const handleOpenEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormCustomer({
      ...customer,
      companyId: customer.companyId || `COMP-${customer.id.substring(0, 6)}`
    });
    setFormError('');
    setIsAddEditModalOpen(true);
  };

  // Save Customer Handler
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCustomer.name?.trim() && !formCustomer.company?.trim()) {
      setFormError('Please enter either a Customer Name or Company Name.');
      return;
    }

    if (!formCustomer.phone?.trim()) {
      setFormError('Please enter a valid contact phone number.');
      return;
    }

    setIsSaving(true);
    setFormError('');

    try {
      const customerToSave: Customer = {
        id: editingCustomer ? editingCustomer.id : `cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        companyId: formCustomer.companyId?.trim() || `COMP-${1001 + customers.length}`,
        name: formCustomer.name?.trim() || formCustomer.company?.trim() || 'Valued Customer',
        company: formCustomer.company?.trim() || '',
        phone: formCustomer.phone?.trim() || '',
        email: formCustomer.email?.trim() || '',
        address: formCustomer.address?.trim() || '',
        notes: formCustomer.notes?.trim() || '',
        createdAt: editingCustomer?.createdAt || new Date().toISOString()
      };

      await onSaveCustomer(customerToSave);
      setIsAddEditModalOpen(false);
      setEditingCustomer(null);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save customer. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Customer Handler
  const handleConfirmDelete = async () => {
    if (!customerToDelete) return;
    setIsDeleting(true);
    try {
      await onDeleteCustomer(customerToDelete.id);
      setCustomerToDelete(null);
      if (selectedCustomerForLedger?.id === customerToDelete.id) {
        setSelectedCustomerForLedger(null);
      }
    } catch (err: any) {
      alert('Failed to delete customer: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Export Customer Directory to CSV
  const handleExportCSV = () => {
    if (customers.length === 0) {
      alert('No customer records to export.');
      return;
    }

    const headers = ['Customer ID', 'Contact Name', 'Company Name', 'Phone', 'Email', 'Address', 'Total Invoiced (Tk)', 'Total Paid (Tk)', 'Due Balance (Tk)', 'Notes'];
    const rows = customers.map(c => {
      const fin = customerFinancials.get(c.id);
      return [
        `"${c.companyId || `COMP-${c.id}`}"`,
        `"${(c.name || '').replace(/"/g, '""')}"`,
        `"${(c.company || '').replace(/"/g, '""')}"`,
        `"${(c.phone || '').replace(/"/g, '""')}"`,
        `"${(c.email || '').replace(/"/g, '""')}"`,
        `"${(c.address || '').replace(/"/g, '""')}"`,
        fin?.totalInvoiced || 0,
        fin?.totalPaid || 0,
        fin?.totalDue || 0,
        `"${(c.notes || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `customer_directory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Customer Directory
  const handlePrintDirectory = () => {
    window.print();
  };

  // Get Customer's related documents for Ledger
  const selectedCustomerDocs = useMemo(() => {
    if (!selectedCustomerForLedger) return [];
    return documents
      .filter(d => 
        d.customerId === selectedCustomerForLedger.id ||
        (d.customerPhone && selectedCustomerForLedger.phone && d.customerPhone.trim() === selectedCustomerForLedger.phone.trim()) ||
        (d.customerCompany && selectedCustomerForLedger.company && d.customerCompany.toLowerCase().trim() === selectedCustomerForLedger.company.toLowerCase().trim())
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [documents, selectedCustomerForLedger]);

  // Get Customer's related dispatches/services
  const selectedCustomerDispatches = useMemo(() => {
    if (!selectedCustomerForLedger) return [];
    return dispatches
      .filter(d => 
        d.customerId === selectedCustomerForLedger.id ||
        (d.companyName && selectedCustomerForLedger.company && d.companyName.toLowerCase() === selectedCustomerForLedger.company.toLowerCase()) ||
        (d.customerCompany && selectedCustomerForLedger.company && d.customerCompany.toLowerCase() === selectedCustomerForLedger.company.toLowerCase())
      )
      .sort((a, b) => new Date(b.dispatchDate || '').getTime() - new Date(a.dispatchDate || '').getTime());
  }, [dispatches, selectedCustomerForLedger]);

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & ACTION CONTROLS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs no-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 font-display flex items-center gap-2">
                  Customer Directory & Client List
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
                    {customers.length} Clients
                  </span>
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Manage factory clients, contact details, balance dues, transaction statements, and quick billing.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer border border-slate-300/80 shadow-2xs"
              title="Export Customer Directory as CSV Spreadsheet"
            >
              <Download className="w-4 h-4 text-slate-600" />
              Export CSV
            </button>
            <button
              onClick={handlePrintDirectory}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer border border-slate-300/80 shadow-2xs"
              title="Print Customer Directory"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              Print List
            </button>
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add New Customer
            </button>
          </div>
        </div>
      </div>

      {/* 2. SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        {/* Metric 1: Total Registered */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Registered Clients
            </span>
            <span className="text-2xl font-black text-slate-900 font-display block">
              {summaryMetrics.totalCustomers}
            </span>
            <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {summaryMetrics.activeCustomersCount} with orders & transactions
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2: Total Outstanding Due */}
        <div className="bg-white border border-rose-200 rounded-2xl p-5 shadow-2xs flex items-center justify-between bg-rose-50/20">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block">
              Total Outstanding Dues
            </span>
            <span className="text-2xl font-black text-rose-700 font-display block">
              Tk. {summaryMetrics.totalDue.toLocaleString()}
            </span>
            <span className="text-[10px] font-bold text-rose-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {summaryMetrics.dueCustomersCount} clients with pending dues
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3: Total Sales Billed */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Invoiced Sales
            </span>
            <span className="text-2xl font-black text-slate-900 font-display block">
              Tk. {summaryMetrics.totalSales.toLocaleString()}
            </span>
            <span className="text-[10px] font-semibold text-slate-500 block">
              Lifetime sales volume
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Receipt className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4: Total Collected / Paid */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Paid / Collected
            </span>
            <span className="text-2xl font-black text-emerald-700 font-display block">
              Tk. {summaryMetrics.totalPaid.toLocaleString()}
            </span>
            <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Collection rate: {summaryMetrics.totalSales > 0 ? `${((summaryMetrics.totalPaid / summaryMetrics.totalSales) * 100).toFixed(1)}%` : '0%'}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. SEARCH, FILTERS & VIEW MODE SWITCHER */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3 no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer name, company, phone, email, address, or ID..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" /> Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="recent">Recently Added</option>
              <option value="due">Highest Due Amount</option>
              <option value="totalPurchases">Highest Invoiced Sales</option>
              <option value="name">Name (A-Z)</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 ml-2">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Table View
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Grid Cards
              </button>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5" /> Filter Status:
          </span>
          <button
            onClick={() => setFilterDueStatus('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterDueStatus === 'ALL'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Clients ({customers.length})
          </button>
          <button
            onClick={() => setFilterDueStatus('DUE_ONLY')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterDueStatus === 'DUE_ONLY'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            Outstanding Dues ({summaryMetrics.dueCustomersCount})
          </button>
          <button
            onClick={() => setFilterDueStatus('PAID_ONLY')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterDueStatus === 'PAID_ONLY'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            Zero Due / Paid in Full
          </button>
          <button
            onClick={() => setFilterDueStatus('HIGH_VALUE')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterDueStatus === 'HIGH_VALUE'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
            }`}
          >
            High-Value Clients (VIP)
          </button>
        </div>
      </div>

      {/* 4. CUSTOMER LIST CONTENT (TABLE OR GRID) */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-2xs space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black text-slate-800">No Customers Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchQuery || filterDueStatus !== 'ALL'
              ? 'No customer matched your search keywords or filter status. Try clearing filters.'
              : 'You have not added any customer records yet. Click below to add your first customer.'}
          </p>
          <div className="pt-2">
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add First Customer
            </button>
          </div>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-black uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <th className="py-3.5 px-4">Client / Company Name</th>
                  <th className="py-3.5 px-4">Contact Info</th>
                  <th className="py-3.5 px-4">Location / Address</th>
                  <th className="py-3.5 px-4 text-center">Docs</th>
                  <th className="py-3.5 px-4 text-right">Total Invoiced</th>
                  <th className="py-3.5 px-4 text-right">Paid</th>
                  <th className="py-3.5 px-4 text-right">Current Due</th>
                  <th className="py-3.5 px-4 text-center no-print">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredCustomers.map(customer => {
                  const fin = customerFinancials.get(customer.id);
                  const totalDue = fin?.totalDue || 0;
                  const totalInvoiced = fin?.totalInvoiced || 0;
                  const totalPaid = fin?.totalPaid || 0;
                  const cleanPhone = (customer.phone || '').replace(/[^0-9]/g, '');

                  return (
                    <tr key={customer.id} className="hover:bg-blue-50/40 transition-colors group">
                      {/* Company / Customer Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center flex-shrink-0 text-xs shadow-2xs">
                            {(customer.company || customer.name || 'C').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 text-sm group-hover:text-blue-700 transition-colors">
                              {customer.company || customer.name}
                            </div>
                            {customer.company && customer.name && (
                              <div className="text-[11px] text-slate-500 font-medium">
                                Contact: {customer.name}
                              </div>
                            )}
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[9px] font-bold">
                                {customer.companyId || `COMP-${customer.id.substring(0, 6)}`}
                              </span>
                              {customer.notes && (
                                <span className="text-[10px] text-slate-400 italic max-w-[150px] truncate" title={customer.notes}>
                                  &bull; {customer.notes}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {customer.phone && (
                            <div className="flex items-center gap-1.5">
                              <a
                                href={`tel:${customer.phone}`}
                                className="font-mono font-bold text-slate-800 hover:text-blue-600 flex items-center gap-1"
                                title="Click to call phone"
                              >
                                <Phone className="w-3.5 h-3.5 text-blue-600" />
                                {customer.phone}
                              </a>
                              {cleanPhone && (
                                <a
                                  href={`https://wa.me/${cleanPhone.startsWith('88') ? cleanPhone : '88' + cleanPhone}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-600 hover:text-white flex items-center justify-center transition-colors shadow-2xs"
                                  title="Send WhatsApp message"
                                >
                                  <MessageSquare className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          )}
                          {customer.email && (
                            <a
                              href={`mailto:${customer.email}`}
                              className="text-[11px] text-slate-500 hover:text-blue-600 flex items-center gap-1 truncate max-w-[180px]"
                              title={customer.email}
                            >
                              <Mail className="w-3 h-3 text-slate-400" />
                              {customer.email}
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Location / Address */}
                      <td className="py-3.5 px-4 max-w-[200px]">
                        {customer.address ? (
                          <div className="text-[11px] text-slate-600 flex items-start gap-1 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                            <span className="line-clamp-2" title={customer.address}>{customer.address}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">No address listed</span>
                        )}
                      </td>

                      {/* Documents count */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-bold font-mono text-[11px]">
                          {fin?.docCount || 0}
                        </span>
                      </td>

                      {/* Total Invoiced */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-800">
                        Tk. {totalInvoiced.toLocaleString()}
                      </td>

                      {/* Total Paid */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                        Tk. {totalPaid.toLocaleString()}
                      </td>

                      {/* Current Due */}
                      <td className="py-3.5 px-4 text-right">
                        {totalDue > 0 ? (
                          <div className="inline-block font-mono font-black text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                            Tk. {totalDue.toLocaleString()}
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
                            Paid &bull; ৳0
                          </span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3.5 px-4 text-center no-print">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* View Statement / Ledger */}
                          <button
                            onClick={() => setSelectedCustomerForLedger(customer)}
                            className="p-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-lg transition-all shadow-2xs cursor-pointer"
                            title="View Full Customer Statement & Due Ledger"
                          >
                            <BookOpen className="w-4 h-4" />
                          </button>

                          {/* Quick Create Document */}
                          {onCreateDocumentForCustomer && (
                            <button
                              onClick={() => setQuickDocCustomer(customer)}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-lg transition-all shadow-2xs cursor-pointer"
                              title="Create Invoice, Quotation, or Challan for this customer"
                            >
                              <PlusCircle className="w-4 h-4" />
                            </button>
                          )}

                          {/* Edit Customer */}
                          <button
                            onClick={() => handleOpenEditModal(customer)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-700 text-slate-700 hover:text-white rounded-lg transition-all shadow-2xs cursor-pointer"
                            title="Edit customer details"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Delete Customer */}
                          <button
                            onClick={() => setCustomerToDelete(customer)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white rounded-lg transition-all shadow-2xs cursor-pointer"
                            title="Delete customer record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCustomers.map(customer => {
            const fin = customerFinancials.get(customer.id);
            const totalDue = fin?.totalDue || 0;
            const totalInvoiced = fin?.totalInvoiced || 0;
            const totalPaid = fin?.totalPaid || 0;
            const cleanPhone = (customer.phone || '').replace(/[^0-9]/g, '');

            return (
              <div
                key={customer.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Top Badge & Code */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-[10px] font-extrabold border border-blue-100">
                      {customer.companyId || `COMP-${customer.id.substring(0, 6)}`}
                    </span>
                    {totalDue > 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-black text-[10px]">
                        Due: Tk.{totalDue.toLocaleString()}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
                        Zero Due
                      </span>
                    )}
                  </div>

                  {/* Customer & Company Details */}
                  <div className="pt-3 space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-extrabold flex items-center justify-center flex-shrink-0 text-sm shadow-sm">
                        {(customer.company || customer.name || 'C').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900 line-clamp-1">
                          {customer.company || customer.name}
                        </h4>
                        {customer.company && customer.name && (
                          <p className="text-[11px] text-slate-500 font-medium">
                            Contact Person: {customer.name}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Contact Rows */}
                    <div className="space-y-1.5 pt-2 text-xs font-sans">
                      {customer.phone && (
                        <div className="flex items-center justify-between text-slate-700">
                          <a
                            href={`tel:${customer.phone}`}
                            className="flex items-center gap-1.5 font-mono font-bold hover:text-blue-600"
                          >
                            <Phone className="w-3.5 h-3.5 text-blue-600" />
                            {customer.phone}
                          </a>
                          {cleanPhone && (
                            <a
                              href={`https://wa.me/${cleanPhone.startsWith('88') ? cleanPhone : '88' + cleanPhone}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white text-[10px] font-bold flex items-center gap-1 transition-colors border border-emerald-200"
                            >
                              <MessageSquare className="w-3 h-3" /> WhatsApp
                            </a>
                          )}
                        </div>
                      )}

                      {customer.email && (
                        <a
                          href={`mailto:${customer.email}`}
                          className="flex items-center gap-1.5 text-slate-500 hover:text-blue-600 text-[11px] truncate"
                        >
                          <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{customer.email}</span>
                        </a>
                      )}

                      {customer.address && (
                        <div className="flex items-start gap-1.5 text-slate-500 text-[11px]">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{customer.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Financial Overview Grid */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Invoiced</span>
                    <span className="font-mono font-bold text-slate-800 text-[11px]">Tk.{totalInvoiced.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Paid</span>
                    <span className="font-mono font-bold text-emerald-700 text-[11px]">Tk.{totalPaid.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Due</span>
                    <span className={`font-mono font-black text-[11px] ${totalDue > 0 ? 'text-rose-700' : 'text-slate-500'}`}>
                      Tk.{totalDue.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setSelectedCustomerForLedger(customer)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" /> Statement
                  </button>
                  <button
                    onClick={() => handleOpenEditModal(customer)}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                    title="Edit details"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setCustomerToDelete(customer)}
                    className="p-1.5 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                    title="Delete customer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. ADD / EDIT CUSTOMER MODAL */}
      {/* ========================================================================= */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {editingCustomer ? 'Edit Customer Details' : 'Register New Customer / Client'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Enter customer contact details, business entity name, and address.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddEditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Customer ID */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Customer / Company ID
                  </label>
                  <input
                    type="text"
                    value={formCustomer.companyId || ''}
                    onChange={(e) => setFormCustomer({ ...formCustomer, companyId: e.target.value })}
                    placeholder="e.g. COMP-1001"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Company / Factory Name */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Company / Mill / Factory Name
                  </label>
                  <input
                    type="text"
                    value={formCustomer.company || ''}
                    onChange={(e) => setFormCustomer({ ...formCustomer, company: e.target.value })}
                    placeholder="e.g. Standard Garments Ltd."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Contact Person Name */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Contact Person Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formCustomer.name || ''}
                    onChange={(e) => setFormCustomer({ ...formCustomer, name: e.target.value })}
                    placeholder="e.g. Md. Tanvir Hasan"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Phone / Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formCustomer.phone || ''}
                    onChange={(e) => setFormCustomer({ ...formCustomer, phone: e.target.value })}
                    placeholder="e.g. 01712-345678"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formCustomer.email || ''}
                  onChange={(e) => setFormCustomer({ ...formCustomer, email: e.target.value })}
                  placeholder="e.g. purchase@company.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Address / Location */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Factory / Office Address
                </label>
                <textarea
                  rows={2}
                  value={formCustomer.address || ''}
                  onChange={(e) => setFormCustomer({ ...formCustomer, address: e.target.value })}
                  placeholder="e.g. Plot 45, Sector 7, Tongi Industrial Area, Gazipur"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Notes / Payment Terms / Remarks
                </label>
                <input
                  type="text"
                  value={formCustomer.notes || ''}
                  onChange={(e) => setFormCustomer({ ...formCustomer, notes: e.target.value })}
                  placeholder="e.g. 30 days credit limit, VIP buyer"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : editingCustomer ? 'Update Customer' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. CUSTOMER FULL STATEMENT & LEDGER MODAL */}
      {/* ========================================================================= */}
      {selectedCustomerForLedger && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-3 md:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 md:p-8 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col justify-between overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 no-print">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    Customer Account Statement & Ledger
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Complete invoice history, payments log, and due balance statement for{' '}
                    <strong className="text-slate-800">{selectedCustomerForLedger.company || selectedCustomerForLedger.name}</strong>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold border border-blue-200 cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Print Statement
                </button>
                <button
                  onClick={() => setSelectedCustomerForLedger(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Modal Body */}
            <div className="flex-1 overflow-y-auto py-4 space-y-6">
              {/* Customer Profile Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-mono font-bold">
                      {selectedCustomerForLedger.companyId || `COMP-${selectedCustomerForLedger.id.substring(0, 6)}`}
                    </span>
                    <h4 className="text-base font-black text-slate-900">
                      {selectedCustomerForLedger.company || selectedCustomerForLedger.name}
                    </h4>
                  </div>
                  {selectedCustomerForLedger.company && selectedCustomerForLedger.name && (
                    <div className="text-xs text-slate-600 font-medium">
                      Contact Person: <strong>{selectedCustomerForLedger.name}</strong>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-1 font-sans">
                    {selectedCustomerForLedger.phone && (
                      <span className="flex items-center gap-1 font-mono font-bold text-slate-800">
                        <Phone className="w-3.5 h-3.5 text-blue-600" /> {selectedCustomerForLedger.phone}
                      </span>
                    )}
                    {selectedCustomerForLedger.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400" /> {selectedCustomerForLedger.email}
                      </span>
                    )}
                    {selectedCustomerForLedger.address && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" /> {selectedCustomerForLedger.address}
                      </span>
                    )}
                  </div>
                </div>

                {/* Balance Summary Box */}
                {(() => {
                  const fin = customerFinancials.get(selectedCustomerForLedger.id);
                  const totalInvoiced = fin?.totalInvoiced || 0;
                  const totalPaid = fin?.totalPaid || 0;
                  const totalDue = fin?.totalDue || 0;

                  return (
                    <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-4 text-center shadow-2xs">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Total Invoiced</span>
                        <span className="text-sm font-black font-mono text-slate-900">Tk.{totalInvoiced.toLocaleString()}</span>
                      </div>
                      <div className="w-px h-8 bg-slate-200"></div>
                      <div>
                        <span className="text-[9px] font-bold text-emerald-600 uppercase block">Total Paid</span>
                        <span className="text-sm font-black font-mono text-emerald-700">Tk.{totalPaid.toLocaleString()}</span>
                      </div>
                      <div className="w-px h-8 bg-slate-200"></div>
                      <div>
                        <span className="text-[9px] font-bold text-rose-500 uppercase block">Outstanding Due</span>
                        <span className={`text-base font-black font-mono ${totalDue > 0 ? 'text-rose-700' : 'text-slate-500'}`}>
                          Tk.{totalDue.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Transactions / Documents List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Transaction & Billing History ({selectedCustomerDocs.length} Documents)
                  </h5>
                </div>

                {selectedCustomerDocs.length === 0 ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-500">
                    No documents, bills, or invoices created for this customer yet.
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-extrabold text-[10px] uppercase tracking-wider border-b border-slate-200">
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Document #</th>
                          <th className="py-2.5 px-3">Type</th>
                          <th className="py-2.5 px-3 text-right">Total Amount</th>
                          <th className="py-2.5 px-3 text-right">Paid</th>
                          <th className="py-2.5 px-3 text-right">Due Balance</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                          <th className="py-2.5 px-3 text-center no-print">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedCustomerDocs.map(doc => {
                          const docPaid = doc.paidAmount !== undefined ? doc.paidAmount : (doc.status === 'Paid' ? doc.total : 0);
                          const docDue = doc.dueAmount !== undefined ? doc.dueAmount : (doc.total - docPaid);

                          return (
                            <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-2.5 px-3 font-mono font-medium text-slate-600">{doc.date}</td>
                              <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{doc.docNumber || (doc as any).number || doc.id}</td>
                              <td className="py-2.5 px-3">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                  {doc.type}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                                Tk. {(doc.total || 0).toLocaleString()}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                                Tk. {docPaid.toLocaleString()}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-black text-rose-700">
                                {docDue > 0 ? `Tk. ${docDue.toLocaleString()}` : '৳0'}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                  doc.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                                  doc.status === 'Partially Paid' ? 'bg-amber-100 text-amber-800' :
                                  'bg-rose-100 text-rose-800'
                                }`}>
                                  {doc.status}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center no-print">
                                <button
                                  onClick={() => onViewDocument(doc)}
                                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                                >
                                  View / Print
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Service & Dispatches Log */}
              {selectedCustomerDispatches.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-amber-600" />
                    Field Services & Machine Dispatches Log ({selectedCustomerDispatches.length})
                  </h5>
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-extrabold text-[10px] uppercase border-b border-slate-200">
                          <th className="py-2 px-3">Date</th>
                          <th className="py-2 px-3">Slip #</th>
                          <th className="py-2 px-3">Staff / Service Person</th>
                          <th className="py-2 px-3">Purpose</th>
                          <th className="py-2 px-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedCustomerDispatches.map(dsp => (
                          <tr key={dsp.id} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-mono">{dsp.dispatchDate}</td>
                            <td className="py-2 px-3 font-mono font-bold text-amber-700">{dsp.dispatchNumber}</td>
                            <td className="py-2 px-3 font-medium">{dsp.staffName}</td>
                            <td className="py-2 px-3 text-slate-600">{dsp.purpose}</td>
                            <td className="py-2 px-3 text-center">
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-800">
                                {dsp.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-200 pt-4 flex items-center justify-between no-print">
              <div className="text-[11px] text-slate-500 italic">
                Statement generated from hitachisolutioncenter database
              </div>
              <button
                onClick={() => setSelectedCustomerForLedger(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Statement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. QUICK DOCUMENT CREATION SELECTION MODAL */}
      {/* ========================================================================= */}
      {quickDocCustomer && onCreateDocumentForCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 no-print">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-black text-slate-900">Create Document for Client</h4>
                <p className="text-xs text-slate-500 font-medium">
                  {quickDocCustomer.company || quickDocCustomer.name}
                </p>
              </div>
              <button onClick={() => setQuickDocCustomer(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => {
                  onCreateDocumentForCustomer(quickDocCustomer, 'INVOICE');
                  setQuickDocCustomer(null);
                }}
                className="p-3.5 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-900 border border-blue-200 rounded-xl text-left transition-all group cursor-pointer"
              >
                <FileText className="w-5 h-5 text-blue-600 group-hover:text-white mb-2" />
                <span className="font-black text-xs block">Invoice</span>
                <span className="text-[10px] text-slate-500 group-hover:text-blue-100 block">Sales tax invoice</span>
              </button>

              <button
                onClick={() => {
                  onCreateDocumentForCustomer(quickDocCustomer, 'QUOTATION');
                  setQuickDocCustomer(null);
                }}
                className="p-3.5 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-900 border border-indigo-200 rounded-xl text-left transition-all group cursor-pointer"
              >
                <Receipt className="w-5 h-5 text-indigo-600 group-hover:text-white mb-2" />
                <span className="font-black text-xs block">Quotation</span>
                <span className="text-[10px] text-slate-500 group-hover:text-indigo-100 block">Price estimate</span>
              </button>

              <button
                onClick={() => {
                  onCreateDocumentForCustomer(quickDocCustomer, 'BILL');
                  setQuickDocCustomer(null);
                }}
                className="p-3.5 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-900 border border-emerald-200 rounded-xl text-left transition-all group cursor-pointer"
              >
                <DollarSign className="w-5 h-5 text-emerald-600 group-hover:text-white mb-2" />
                <span className="font-black text-xs block">Cash Bill</span>
                <span className="text-[10px] text-slate-500 group-hover:text-emerald-100 block">Immediate billing</span>
              </button>

              <button
                onClick={() => {
                  onCreateDocumentForCustomer(quickDocCustomer, 'CHALLAN');
                  setQuickDocCustomer(null);
                }}
                className="p-3.5 bg-amber-50 hover:bg-amber-600 hover:text-white text-amber-900 border border-amber-200 rounded-xl text-left transition-all group cursor-pointer"
              >
                <Layers className="w-5 h-5 text-amber-600 group-hover:text-white mb-2" />
                <span className="font-black text-xs block">Delivery Challan</span>
                <span className="text-[10px] text-slate-500 group-hover:text-amber-100 block">Goods delivery slip</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. DELETE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {customerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 no-print">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h4 className="text-base font-black text-slate-900">Delete Customer Record?</h4>
              <p className="text-xs text-slate-500">
                Are you sure you want to delete{' '}
                <strong className="text-slate-800">{customerToDelete.company || customerToDelete.name}</strong>?
              </p>
              {(() => {
                const fin = customerFinancials.get(customerToDelete.id);
                if (fin && fin.totalDue > 0) {
                  return (
                    <div className="mt-2 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2 text-left">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                      <span>Warning: This client has an outstanding due balance of Tk.{fin.totalDue.toLocaleString()}!</span>
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setCustomerToDelete(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Customer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
