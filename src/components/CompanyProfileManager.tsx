import { useState, useMemo } from 'react';
import { Customer, Document, FieldDispatch, Product } from '../types';
import { 
  Building2, 
  Search, 
  Plus, 
  ShieldCheck, 
  FileText, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Copy, 
  Printer, 
  Calendar,
  Layers,
  ChevronRight,
  TrendingUp,
  DollarSign
} from 'lucide-react';

interface CompanyProfileManagerProps {
  customers: Customer[];
  documents: Document[];
  dispatches: FieldDispatch[];
  products: Product[];
  onSaveCustomer: (customer: Customer) => Promise<void>;
  onViewDocument: (doc: Document) => void;
}

export default function CompanyProfileManager({
  customers,
  documents,
  dispatches,
  products,
  onSaveCustomer,
  onViewDocument
}: CompanyProfileManagerProps) {
  // State for selected company profile
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(customers[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState<'purchases' | 'dues' | 'service' | 'docs'>('purchases');

  // Modal State: New Company
  const [isRegistering, setIsRegistering] = useState(false);
  const [newCompany, setNewCompany] = useState({
    companyId: `COMP-${1001 + customers.length}`,
    name: '',
    company: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  });

  // Filtered Company List for search
  const filteredCompanies = useMemo(() => {
    return customers.filter(c => {
      const q = searchQuery.toLowerCase();
      const compId = (c.companyId || `COMP-${c.id}`).toLowerCase();
      return compId.includes(q) ||
             c.company.toLowerCase().includes(q) ||
             c.name.toLowerCase().includes(q) ||
             c.phone.includes(q) ||
             c.email.toLowerCase().includes(q);
    });
  }, [customers, searchQuery]);

  // Currently selected customer object
  const activeCustomer = useMemo(() => {
    return customers.find(c => c.id === selectedCompanyId) || customers[0] || null;
  }, [customers, selectedCompanyId]);

  // Documents associated with this customer
  const companyDocs = useMemo(() => {
    if (!activeCustomer) return [];
    return documents.filter(d => 
      d.customerId === activeCustomer.id ||
      d.customerPhone === activeCustomer.phone ||
      (d.customerCompany && activeCustomer.company && d.customerCompany.toLowerCase() === activeCustomer.company.toLowerCase())
    );
  }, [documents, activeCustomer]);

  // Field Dispatches & Services associated with this customer
  const companyDispatches = useMemo(() => {
    if (!activeCustomer) return [];
    return dispatches.filter(d => 
      d.customerId === activeCustomer.id ||
      (d.companyName && activeCustomer.company && d.companyName.toLowerCase() === activeCustomer.company.toLowerCase()) ||
      (d.customerCompany && activeCustomer.company && d.customerCompany.toLowerCase() === activeCustomer.company.toLowerCase())
    );
  }, [dispatches, activeCustomer]);

  // CALCULATE ALL PURCHASED PRODUCTS & WARRANTY INFORMATION
  const purchasedProductsLog = useMemo(() => {
    if (!activeCustomer) return [];

    const itemsLog: {
      docId: string;
      docNumber: string;
      docType: string;
      purchaseDate: string;
      productId?: string;
      productName: string;
      brand: string;
      quantity: number;
      price: number;
      total: number;
      unit: string;
      warrantyMonths: number;
      warrantyExpiryDate: string;
      isWarrantyActive: boolean;
      daysRemaining: number;
    }[] = [];

    // Filter paid/partially paid/unpaid Invoices and Bills
    const paidSalesDocs = companyDocs.filter(d => d.type === 'INVOICE' || d.type === 'BILL');

    const today = new Date();

    paidSalesDocs.forEach(doc => {
      doc.items.forEach(it => {
        // Calculate warranty (default 12 months for machinery/dryers, 6 months for spare parts)
        const isSpare = it.name.toLowerCase().includes('filter') || it.name.toLowerCase().includes('element') || it.name.toLowerCase().includes('oil');
        const defaultWarrantyMonths = isSpare ? 6 : 12;
        const warrantyMonths = it.warrantyMonths || defaultWarrantyMonths;

        const purchaseDate = new Date(doc.date);
        const expiryDate = new Date(purchaseDate);
        expiryDate.setMonth(expiryDate.getMonth() + warrantyMonths);

        const diffTime = expiryDate.getTime() - today.getTime();
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const isWarrantyActive = daysRemaining > 0;

        itemsLog.push({
          docId: doc.id,
          docNumber: doc.docNumber,
          docType: doc.type,
          purchaseDate: doc.date,
          productId: it.productId,
          productName: it.name,
          brand: it.brand,
          quantity: it.quantity,
          price: it.price,
          total: it.total,
          unit: it.unit || 'Pcs',
          warrantyMonths,
          warrantyExpiryDate: expiryDate.toISOString().split('T')[0],
          isWarrantyActive,
          daysRemaining
        });
      });
    });

    return itemsLog.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
  }, [companyDocs, activeCustomer]);

  // UNPAID / DUE INVOICES
  const dueInvoicesLog = useMemo(() => {
    return companyDocs.filter(d => (d.type === 'INVOICE' || d.type === 'BILL') && (d.dueAmount && d.dueAmount > 0 || d.status === 'Unpaid' || d.status === 'Partially Paid'));
  }, [companyDocs]);

  // TOTAL STATS FOR THIS COMPANY
  const stats = useMemo(() => {
    const totalPurchasedQty = purchasedProductsLog.reduce((s, it) => s + it.quantity, 0);
    const totalPurchasedValue = companyDocs
      .filter(d => d.type === 'INVOICE' || d.type === 'BILL')
      .reduce((s, d) => s + d.total, 0);

    const totalDueAmount = dueInvoicesLog.reduce((s, d) => s + (d.dueAmount !== undefined ? d.dueAmount : d.total), 0);
    const activeWarrantyCount = purchasedProductsLog.filter(it => it.isWarrantyActive).length;

    return {
      totalPurchasedQty,
      totalPurchasedValue,
      totalDueAmount,
      activeWarrantyCount
    };
  }, [purchasedProductsLog, companyDocs, dueInvoicesLog]);

  // Copy Company ID
  const handleCopyCompanyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Submit Register New Company (Fallback defaults ensure completion is never blocked)
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const generatedCompId = newCompany.companyId.trim() || `COMP-${1001 + customers.length}`;
    const compName = newCompany.company.trim() || newCompany.name.trim() || 'General Client / Cash Customer';
    const contactName = newCompany.name.trim() || compName;
    const contactPhone = newCompany.phone.trim() || '01700-000000';

    const createdCust: Customer = {
      id: `cust-${Date.now()}`,
      companyId: generatedCompId,
      name: contactName,
      company: compName,
      phone: contactPhone,
      email: newCompany.email.trim(),
      address: newCompany.address.trim() || 'Gazipur, Bangladesh',
      notes: newCompany.notes.trim(),
      createdAt: new Date().toISOString().split('T')[0]
    };

    await onSaveCustomer(createdCust);
    setSelectedCompanyId(createdCust.id);
    setIsRegistering(false);
    setNewCompany({
      companyId: `COMP-${1002 + customers.length}`,
      name: '',
      company: '',
      phone: '',
      email: '',
      address: '',
      notes: ''
    });
  };

  return (
    <div className="space-y-8 text-xs">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-blue-900 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-800/80 text-blue-200 text-[10px] font-bold uppercase tracking-wider border border-blue-700">
            <Building2 className="w-3.5 h-3.5 text-blue-300" />
            Company ID & Client Portfolio Management
          </div>
          <h2 className="text-xl font-black font-display tracking-tight text-white">
            Client Company Directory & Warranty Ledger
          </h2>
          <p className="text-slate-300 text-xs max-w-2xl">
            Search client companies by Unique Company ID, track total products purchased, outstanding bill balances, and active product warranties in real-time.
          </p>
        </div>

        <button
          onClick={() => {
            setNewCompany({
              companyId: `COMP-${1001 + customers.length}`,
              name: '',
              company: '',
              phone: '',
              email: '',
              address: '',
              notes: ''
            });
            setIsRegistering(true);
          }}
          className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer flex-shrink-0"
        >
          <Plus className="w-4.5 h-4.5" />
          + Create Company Profile
        </button>
      </div>

      {/* SEARCH BAR & DIRECTORY SELECTOR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Directory & Search List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-xs">Search Company</h3>
              <span className="text-[10px] text-slate-400 font-bold">{filteredCompanies.length} Client Records</span>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by Unique ID (COMP-1001) or Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden font-semibold text-slate-900"
              />
            </div>

            {/* List of Companies */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {filteredCompanies.length > 0 ? (
                filteredCompanies.map(c => {
                  const formattedCompanyId = c.companyId || `COMP-${c.id.replace('cust-', '100')}`;
                  const isSelected = activeCustomer?.id === c.id;

                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCompanyId(c.id)}
                      className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-900 text-white border-blue-900 shadow-md'
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-md ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-blue-900'
                        }`}>
                          {formattedCompanyId}
                        </span>
                        <span className={`text-[9px] font-bold ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>
                          {c.phone}
                        </span>
                      </div>

                      <h4 className="font-bold text-sm block truncate leading-tight">
                        {c.company || c.name}
                      </h4>
                      <p className={`text-[11px] truncate mt-0.5 ${isSelected ? 'text-slate-200' : 'text-slate-500'}`}>
                        Attn: {c.name}
                      </p>
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-8 text-slate-400 space-y-1">
                  <Search className="w-8 h-8 mx-auto text-slate-300" />
                  <p>No company matched your search</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Selected Company Full Dashboard Profile */}
        <div className="lg:col-span-8 space-y-6">
          {activeCustomer ? (
            <>
              {/* Profile Card Header */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-6">
                
                {/* Top Title & Unique ID Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-blue-900" />
                      <h2 className="text-lg font-black font-display text-slate-900">
                        {activeCustomer.company || activeCustomer.name}
                      </h2>
                    </div>
                    <p className="text-slate-500 font-semibold text-xs pl-7">
                      Contact Representative: <span className="text-slate-900 font-bold">{activeCustomer.name}</span>
                    </p>
                  </div>

                  {/* Unique ID Badge */}
                  <div className="flex items-center gap-2">
                    <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-xl flex items-center gap-3">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase block leading-none">Unique Company ID</span>
                        <span className="text-sm font-mono font-black text-blue-900 tracking-wider">
                          {activeCustomer.companyId || `COMP-${activeCustomer.id.replace('cust-', '100')}`}
                        </span>
                      </div>
                      <button
                        onClick={() => handleCopyCompanyId(activeCustomer.companyId || `COMP-${activeCustomer.id.replace('cust-', '100')}`)}
                        className="p-1.5 bg-white text-blue-900 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer border border-blue-200"
                        title="Copy Company ID"
                      >
                        {copiedId ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Company Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold">
                  <div className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <Phone className="w-4 h-4 text-blue-700 flex-shrink-0" />
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Hotline Phone</span>
                      <span className="font-bold text-slate-800">{activeCustomer.phone}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <Mail className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <div className="truncate">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Official Email</span>
                      <span className="font-bold text-slate-800 truncate block">{activeCustomer.email || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <div className="truncate">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Factory Address</span>
                      <span className="font-bold text-slate-800 truncate block">{activeCustomer.address || 'Gazipur, BD'}</span>
                    </div>
                  </div>
                </div>

                {/* Metrics Cards for this company */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Products Purchased</span>
                    <span className="text-xl font-black font-display text-blue-950 block">
                      {stats.totalPurchasedQty} <span className="text-xs font-semibold text-slate-500">Units</span>
                    </span>
                    <span className="text-[9px] text-slate-500 font-bold">Total Goods Sold</span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Purchase Value</span>
                    <span className="text-xl font-black font-display text-blue-950 block">
                      Tk. {stats.totalPurchasedValue.toLocaleString()}
                    </span>
                    <span className="text-[9px] text-slate-500 font-bold">Total Invoice Value</span>
                  </div>

                  <div className={`p-4 rounded-xl space-y-1 border ${
                    stats.totalDueAmount > 0 ? 'bg-rose-50 border-rose-200 text-rose-950' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <span className="text-[10px] font-bold uppercase block text-rose-600">Due Balance</span>
                    <span className="text-xl font-black font-display text-rose-700 block">
                      Tk. {stats.totalDueAmount.toLocaleString()}
                    </span>
                    <span className="text-[9px] font-bold text-rose-600">
                      {dueInvoicesLog.length} Unpaid Bills
                    </span>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase block">Active Warranty Items</span>
                    <span className="text-xl font-black font-display text-emerald-800 block">
                      {stats.activeWarrantyCount} <span className="text-xs font-semibold text-emerald-600">Items</span>
                    </span>
                    <span className="text-[9px] text-emerald-700 font-bold">Active Warranty Cards</span>
                  </div>
                </div>

                {/* Profile Inner Tabs */}
                <div className="border-b border-slate-200 flex gap-2 pt-2">
                  <button
                    onClick={() => setActiveProfileTab('purchases')}
                    className={`pb-3 px-4 text-xs font-extrabold border-b-2 transition-all cursor-pointer ${
                      activeProfileTab === 'purchases'
                        ? 'border-blue-900 text-blue-900'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    📦 Sold Products & Warranties ({purchasedProductsLog.length})
                  </button>

                  <button
                    onClick={() => setActiveProfileTab('dues')}
                    className={`pb-3 px-4 text-xs font-extrabold border-b-2 transition-all cursor-pointer ${
                      activeProfileTab === 'dues'
                        ? 'border-rose-600 text-rose-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    ⚠️ Unpaid Bills ({dueInvoicesLog.length})
                  </button>

                  <button
                    onClick={() => setActiveProfileTab('service')}
                    className={`pb-3 px-4 text-xs font-extrabold border-b-2 transition-all cursor-pointer ${
                      activeProfileTab === 'service'
                        ? 'border-blue-900 text-blue-900'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    🚚 Field Service Dispatches ({companyDispatches.length})
                  </button>

                  <button
                    onClick={() => setActiveProfileTab('docs')}
                    className={`pb-3 px-4 text-xs font-extrabold border-b-2 transition-all cursor-pointer ${
                      activeProfileTab === 'docs'
                        ? 'border-blue-900 text-blue-900'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    📑 All Documents ({companyDocs.length})
                  </button>
                </div>

                {/* TAB 1: PURCHASED PRODUCTS & WARRANTY TRACKING */}
                {activeProfileTab === 'purchases' && (
                  <div className="space-y-4 pt-2">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-slate-900 text-xs font-display">
                        Products Purchased & Warranty Status
                      </h4>
                      <span className="text-[10px] text-slate-400 font-bold">Standard 12/18 Months Warranty Tracked</span>
                    </div>

                    {purchasedProductsLog.length > 0 ? (
                      <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                        {purchasedProductsLog.map((it, idx) => (
                          <div key={idx} className="p-4 bg-white hover:bg-slate-50 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-blue-900 text-[11px] bg-blue-50 px-2 py-0.5 rounded">
                                  {it.docNumber}
                                </span>
                                <span className="text-[10px] text-slate-400 font-semibold">Purchase Date: {it.purchaseDate}</span>
                              </div>
                              <h5 className="font-bold text-slate-900 text-sm">{it.productName}</h5>
                              <p className="text-[11px] text-slate-500">
                                Brand: <b>{it.brand}</b> &bull; Quantity: <b>{it.quantity} {it.unit}</b> &bull; Total: <b>Tk. {it.total.toLocaleString()}</b>
                              </p>
                            </div>

                            {/* Warranty Badge */}
                            <div className="text-right space-y-1">
                              {it.isWarrantyActive ? (
                                <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold px-3 py-1 rounded-full text-[11px]">
                                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                  Active Warranty ({it.daysRemaining} days left)
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 border border-slate-200 font-bold px-3 py-1 rounded-full text-[11px]">
                                  <AlertCircle className="w-4 h-4 text-slate-400" />
                                  Warranty Expired ({it.warrantyExpiryDate})
                                </div>
                              )}
                              <span className="text-[10px] text-slate-400 block">
                                Expiry Date: {it.warrantyExpiryDate}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-slate-400 space-y-2 border border-slate-200 rounded-xl bg-slate-50">
                        <Layers className="w-8 h-8 mx-auto text-slate-300" />
                        <p className="font-bold text-slate-700">No invoices or purchased products found</p>
                        <p className="text-[11px]">Generating invoices under this company will automatically populate products and warranty tracking here.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: UNPAID & DUE INVOICES LOG */}
                {activeProfileTab === 'dues' && (
                  <div className="space-y-4 pt-2">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-rose-700 text-xs font-display">
                        Unpaid Invoices & Payment Ledger
                      </h4>
                      <span className="text-[10px] text-slate-400 font-bold">Outstanding Ledger Balances</span>
                    </div>

                    {dueInvoicesLog.length > 0 ? (
                      <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                        {dueInvoicesLog.map(doc => (
                          <div key={doc.id} className="p-4 bg-rose-50/40 hover:bg-rose-50 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-blue-900 text-xs">{doc.docNumber}</span>
                                <span className="text-[10px] text-slate-500">Date: {doc.date}</span>
                                <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-rose-100 text-rose-800 border border-rose-200">
                                  {doc.status}
                                </span>
                              </div>
                              <p className="text-xs font-bold text-slate-800">
                                Total Bill: Tk. {doc.total.toLocaleString()} &bull; Paid: Tk. {(doc.paidAmount || 0).toLocaleString()}
                              </p>
                            </div>

                            <div className="text-right space-y-1">
                              <span className="text-[10px] font-bold text-rose-600 uppercase block">Due Balance</span>
                              <span className="text-lg font-black font-display text-rose-700 block">
                                Tk. {(doc.dueAmount !== undefined ? doc.dueAmount : doc.total).toLocaleString()}
                              </span>
                              <button
                                onClick={() => onViewDocument(doc)}
                                className="px-3 py-1 bg-blue-900 hover:bg-blue-950 text-white font-bold text-[10px] uppercase rounded-md transition-colors cursor-pointer"
                              >
                                View Invoice
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-emerald-700 space-y-2 border border-emerald-200 rounded-xl bg-emerald-50/50">
                        <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-600" />
                        <h5 className="font-bold text-sm">No Unpaid Invoices!</h5>
                        <p className="text-[11px] text-slate-600">All invoices for this client company are fully settled.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: FIELD SERVICE DISPATCHES */}
                {activeProfileTab === 'service' && (
                  <div className="space-y-4 pt-2">
                    <h4 className="font-bold text-slate-900 text-xs font-display">
                      On-site Field Service & Work Records
                    </h4>

                    {companyDispatches.length > 0 ? (
                      <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                        {companyDispatches.map(disp => (
                          <div key={disp.id} className="p-4 bg-white hover:bg-slate-50 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-blue-900 text-xs">{disp.billNo || disp.dispatchNumber}</span>
                                <span className="text-[10px] text-slate-500">Date: {disp.date || disp.dispatchDate}</span>
                              </div>
                              <p className="text-xs font-bold text-slate-800">Responsible Staff: {disp.staffName}</p>
                              <p className="text-[11px] text-slate-600">{disp.description || disp.purpose}</p>
                            </div>

                            <div className="flex items-center gap-3 text-right">
                              <div>
                                <span className="text-[10px] text-slate-400 font-bold block uppercase">Bill & Due</span>
                                <span className="text-xs font-mono font-bold text-slate-900">
                                  Tk. {(disp.billAmount || 0).toLocaleString()}
                                </span>
                                {(disp.dueAmount || 0) > 0 && (
                                  <span className="text-[10px] font-mono font-bold text-rose-600 block">
                                    Due: Tk. {(disp.dueAmount || 0).toLocaleString()}
                                  </span>
                                )}
                              </div>
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                                disp.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 
                                disp.paymentStatus === 'Partial' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                              }`}>
                                {disp.paymentStatus || disp.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-slate-400 border border-slate-200 rounded-xl bg-slate-50">
                        <p className="font-bold text-slate-700">No field service records found for this company</p>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: ALL DOCUMENTS & HISTORY */}
                {activeProfileTab === 'docs' && (
                  <div className="space-y-4 pt-2">
                    <h4 className="font-bold text-slate-900 text-xs font-display">
                      All Document History (Offer Letters, Quotations, Invoices)
                    </h4>

                    {companyDocs.length > 0 ? (
                      <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                        {companyDocs.map(doc => (
                          <div key={doc.id} className="p-3.5 bg-white hover:bg-slate-50 transition-colors flex justify-between items-center">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-blue-900 text-xs">{doc.docNumber}</span>
                                <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-100 text-slate-700">
                                  {doc.type}
                                </span>
                                <span className="text-[10px] text-slate-500">{doc.date}</span>
                              </div>
                              <p className="text-xs font-bold text-slate-800 mt-0.5">Total Amount: Tk. {doc.total.toLocaleString()}</p>
                            </div>

                            <button
                              onClick={() => onViewDocument(doc)}
                              className="px-3 py-1 bg-slate-100 hover:bg-blue-900 hover:text-white text-slate-700 font-bold text-[10px] uppercase rounded-md transition-colors cursor-pointer border border-slate-200"
                            >
                              Print / View
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-slate-400 border border-slate-200 rounded-xl bg-slate-50">
                        <p className="font-bold text-slate-700">No documents found</p>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3 shadow-2xs">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800 text-base">Select a Company Profile</h3>
              <p className="text-slate-400 text-xs">Choose a company from the left directory or enter a Unique ID in the search bar.</p>
            </div>
          )}
        </div>

      </div>

      {/* REGISTER NEW COMPANY MODAL */}
      {isRegistering && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="bg-blue-900 text-white p-5 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest block">Client Profile Registration</span>
                <h3 className="text-base font-bold font-display">Create New Company Profile</h3>
              </div>
              <button onClick={() => setIsRegistering(false)} className="text-white/80 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="p-6 space-y-4 text-xs">
              
              {/* Generated Unique Company ID */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Unique Company ID</label>
                <input
                  type="text"
                  value={newCompany.companyId}
                  onChange={(e) => setNewCompany({ ...newCompany, companyId: e.target.value })}
                  required
                  className="w-full bg-blue-50/60 border border-blue-200 rounded-xl p-2.5 font-mono font-extrabold text-blue-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Company Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Textile Ltd."
                    value={newCompany.company}
                    onChange={(e) => setNewCompany({ ...newCompany, company: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Contact Person Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Engr. Atiqur Rahman"
                    value={newCompany.name}
                    onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Phone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 01712-XXXXXX"
                    value={newCompany.phone}
                    onChange={(e) => setNewCompany({ ...newCompany, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Official Email</label>
                  <input
                    type="email"
                    placeholder="e.g. info@company.com"
                    value={newCompany.email}
                    onChange={(e) => setNewCompany({ ...newCompany, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Factory / Office Address</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Konabari Industrial Area, Gazipur, Bangladesh."
                  value={newCompany.address}
                  onChange={(e) => setNewCompany({ ...newCompany, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-900"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRegistering(false)}
                  className="px-4 py-2 text-slate-600 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-900 hover:bg-blue-950 text-white font-bold uppercase rounded-xl shadow-md cursor-pointer"
                >
                  Create Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
