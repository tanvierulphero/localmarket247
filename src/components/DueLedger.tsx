import { useState, Fragment } from 'react';
import { Document, Customer, DocumentStatus } from '../types';
import { 
  DollarSign, 
  Search, 
  Users, 
  Calendar, 
  CreditCard, 
  PlusCircle, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  ArrowRight,
  ChevronDown,
  ChevronUp,
  FileText,
  BadgeAlert,
  Printer
} from 'lucide-react';

interface DueLedgerProps {
  documents: Document[];
  customers: Customer[];
  onUpdateDocument: (doc: Document) => void;
  onBatchUpdateDocuments?: (docs: Document[]) => void;
  onViewDocument: (doc: Document) => void;
}

export default function DueLedger({ documents, customers, onUpdateDocument, onBatchUpdateDocuments, onViewDocument }: DueLedgerProps) {
  const [activeSubTab, setActiveSubTab] = useState<'customers' | 'invoices'>('customers');
  const [customerSearch, setCustomerSearch] = useState('');
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
  
  // Single Document Payment Collection Modal State
  const [collectingDoc, setCollectingDoc] = useState<Document | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentNotes, setPaymentNotes] = useState('');
  const [singlePaymentMethod, setSinglePaymentMethod] = useState<'Cash' | 'Bank Transfer' | 'bKash/Nagad' | 'Cheque'>('Cash');
  const [singlePaymentDate, setSinglePaymentDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Money Receipt state
  const [recentReceipt, setRecentReceipt] = useState<{
    receiptNo: string;
    date: string;
    customerName: string;
    customerCompany: string;
    customerPhone: string;
    amount: number;
    paymentMethod: string;
    notes: string;
    references: string;
    remainingDue: number;
  } | null>(null);

  // Company-Level Total Due Payment Modal State
  const [collectingCompany, setCollectingCompany] = useState<{
    customer: Customer;
    totalDue: number;
    documents: Document[];
  } | null>(null);
  const [companyPayAmount, setCompanyPayAmount] = useState<number>(0);
  const [companyPayMethod, setCompanyPayMethod] = useState<'Cash' | 'Bank Transfer' | 'bKash/Nagad' | 'Cheque'>('Bank Transfer');
  const [companyPayDate, setCompanyPayDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [companyPayNotes, setCompanyPayNotes] = useState('');
  const [companyPayFeedback, setCompanyPayFeedback] = useState<string | null>(null);

  // Helper: Extract only Invoice & Bill documents
  const financialDocs = documents.filter(doc => doc.type === 'INVOICE' || doc.type === 'BILL');

  // Compute stats
  const totalInvoiced = financialDocs.reduce((sum, doc) => sum + doc.total, 0);
  
  const totalPaid = financialDocs.reduce((sum, doc) => {
    // If explicit paidAmount exists, use it; otherwise if status is 'Paid', use doc.total
    if (doc.paidAmount !== undefined) return sum + doc.paidAmount;
    return doc.status === 'Paid' ? sum + doc.total : sum;
  }, 0);

  const totalOutstanding = financialDocs.reduce((sum, doc) => {
    if (doc.dueAmount !== undefined) return sum + doc.dueAmount;
    return doc.status !== 'Paid' ? sum + doc.total : sum;
  }, 0);

  const overdueOutstanding = financialDocs.reduce((sum, doc) => {
    if (doc.status === 'Overdue') {
      return sum + (doc.dueAmount !== undefined ? doc.dueAmount : doc.total);
    }
    return sum;
  }, 0);

  // Group financial summaries by customer
  const customerLedger = customers.map(cust => {
    const custDocs = financialDocs.filter(d => d.customerId === cust.id);
    
    const invoiced = custDocs.reduce((sum, d) => sum + d.total, 0);
    
    const paid = custDocs.reduce((sum, d) => {
      if (d.paidAmount !== undefined) return sum + d.paidAmount;
      return d.status === 'Paid' ? sum + d.total : sum;
    }, 0);

    const due = custDocs.reduce((sum, d) => {
      if (d.dueAmount !== undefined) return sum + d.dueAmount;
      return d.status !== 'Paid' ? sum + d.total : sum;
    }, 0);

    const overdueCount = custDocs.filter(d => d.status === 'Overdue').length;

    return {
      customer: cust,
      invoiced,
      paid,
      due,
      overdueCount,
      documents: custDocs
    };
  }).filter(item => item.invoiced > 0); // Only show customers with transaction history

  // Filter customer ledger based on search
  const filteredCustomerLedger = customerLedger.filter(item => {
    const term = customerSearch.toLowerCase();
    return (
      item.customer.name.toLowerCase().includes(term) ||
      item.customer.company.toLowerCase().includes(term) ||
      item.customer.phone.includes(term)
    );
  });

  // Filter individual invoices list
  const filteredInvoices = financialDocs.filter(doc => {
    const term = invoiceSearch.toLowerCase();
    const matchesSearch = (
      doc.docNumber.toLowerCase().includes(term) ||
      doc.customerName.toLowerCase().includes(term) ||
      doc.customerCompany.toLowerCase().includes(term)
    );
    return matchesSearch;
  });

  // Handle Payment Form submission
  const handleCollectPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectingDoc) return;

    // Current values or defaults
    const currentPaid = collectingDoc.paidAmount !== undefined ? collectingDoc.paidAmount : (collectingDoc.status === 'Paid' ? collectingDoc.total : 0);
    const newPaid = Math.min(collectingDoc.total, currentPaid + paymentAmount);
    const newDue = Math.max(0, collectingDoc.total - newPaid);

    let newStatus: DocumentStatus = 'Partially Paid';
    if (newDue === 0) {
      newStatus = 'Paid';
    } else if (newPaid === 0) {
      newStatus = 'Unpaid';
    }

    // Append standard notes if any
    let updatedNotes = collectingDoc.notes || '';
    if (paymentNotes.trim()) {
      updatedNotes += `\n[Payment Received: ৳${paymentAmount.toLocaleString()} on ${singlePaymentDate} via ${singlePaymentMethod} - ${paymentNotes}]`;
    }

    const updatedDoc: Document = {
      ...collectingDoc,
      paidAmount: newPaid,
      dueAmount: newDue,
      status: newStatus,
      notes: updatedNotes
    };

    onUpdateDocument(updatedDoc);

    // Create printable receipt
    setRecentReceipt({
      receiptNo: `MR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      date: singlePaymentDate,
      customerName: collectingDoc.customerName,
      customerCompany: collectingDoc.customerCompany || '',
      customerPhone: collectingDoc.customerPhone || '',
      amount: paymentAmount,
      paymentMethod: singlePaymentMethod,
      notes: paymentNotes || 'Invoice Due Payment',
      references: `${collectingDoc.type} #${collectingDoc.docNumber}`,
      remainingDue: newDue
    });

    setCollectingDoc(null);
    setPaymentAmount(0);
    setPaymentNotes('');
  };

  // Open Company Total Payment modal
  const handleOpenCompanyPay = (item: { customer: Customer; due: number; documents: Document[] }) => {
    setCollectingCompany({
      customer: item.customer,
      totalDue: item.due,
      documents: item.documents
    });
    setCompanyPayAmount(item.due); // Default to full due
    setCompanyPayMethod('Bank Transfer');
    setCompanyPayDate(new Date().toISOString().split('T')[0]);
    setCompanyPayNotes('');
    setCompanyPayFeedback(null);
  };

  // Handle Company Total Payment submission (distributes payment across due invoices oldest first)
  const handleCompanyPaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectingCompany || companyPayAmount <= 0) return;

    // Filter unpaid/partially paid documents and sort oldest first
    const unpaidDocs = collectingCompany.documents
      .filter(d => d.status !== 'Paid' && ((d.dueAmount !== undefined ? d.dueAmount : d.total) > 0))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let remainingToApply = companyPayAmount;
    const updatedDocs: Document[] = [];

    for (const doc of unpaidDocs) {
      if (remainingToApply <= 0) break;
      const currentDue = doc.dueAmount !== undefined ? doc.dueAmount : doc.total;
      const currentPaid = doc.paidAmount !== undefined ? doc.paidAmount : (doc.status === 'Paid' ? doc.total : 0);

      if (currentDue <= 0) continue;

      const paymentForThisDoc = Math.min(currentDue, remainingToApply);
      const newDue = Math.max(0, currentDue - paymentForThisDoc);
      const newPaid = currentPaid + paymentForThisDoc;
      remainingToApply -= paymentForThisDoc;

      const updatedDoc: Document = {
        ...doc,
        dueAmount: newDue,
        paidAmount: newPaid,
        status: newDue === 0 ? 'Paid' : 'Partially Paid',
        notes: (doc.notes || '') + `\n[কোম্পানি বকেয়া জমা: ৳${paymentForThisDoc.toLocaleString()} via ${companyPayMethod} on ${companyPayDate} - ${companyPayNotes || 'Ledger payment'}]`
      };
      updatedDocs.push(updatedDoc);
    }

    if (onBatchUpdateDocuments && updatedDocs.length > 0) {
      onBatchUpdateDocuments(updatedDocs);
    } else {
      updatedDocs.forEach(d => onUpdateDocument(d));
    }

    const remainingDue = Math.max(0, collectingCompany.totalDue - companyPayAmount);
    
    // Create printable receipt for entire batch payment
    setRecentReceipt({
      receiptNo: `MR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      date: companyPayDate,
      customerName: collectingCompany.customer.name,
      customerCompany: collectingCompany.customer.company || '',
      customerPhone: collectingCompany.customer.phone || '',
      amount: companyPayAmount,
      paymentMethod: companyPayMethod,
      notes: companyPayNotes || 'Company Ledger Consolidated Payment',
      references: `Invoices Paid: ` + updatedDocs.map(d => d.docNumber).join(', '),
      remainingDue: remainingDue
    });

    setCollectingCompany(null);
    setCompanyPayFeedback(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black font-display text-slate-900 tracking-tight">Due Outstanding Ledger</h2>
          <p className="text-xs text-slate-400 mt-0.5">Monitor accounts receivable, partial payments, and overdue credit balances.</p>
        </div>
        
        {/* Navigation Switch */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveSubTab('customers')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
              activeSubTab === 'customers'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Customer Ledger
          </button>
          <button
            onClick={() => setActiveSubTab('invoices')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
              activeSubTab === 'invoices'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Invoices & Due Bills
          </button>
        </div>
      </div>

      {/* Receivables Analytics Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Receivables */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none">
              Total Outstanding
            </span>
            <span className="text-lg font-black text-slate-900 font-display block mt-1">
              ৳{totalOutstanding.toLocaleString()}
            </span>
            <span className="text-[9px] font-bold text-rose-500 block">Uncollected credit</span>
          </div>
        </div>

        {/* Overdue Receivables */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-100 border border-rose-200 text-rose-700 rounded-xl flex items-center justify-center flex-shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none">
              Overdue Receivables
            </span>
            <span className="text-lg font-black text-rose-700 font-display block mt-1">
              ৳{overdueOutstanding.toLocaleString()}
            </span>
            <span className="text-[9px] font-bold text-slate-400 block">Passed due dates</span>
          </div>
        </div>

        {/* Collected Balance */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none">
              Total Received/Paid
            </span>
            <span className="text-lg font-black text-emerald-700 font-display block mt-1">
              ৳{totalPaid.toLocaleString()}
            </span>
            <span className="text-[9px] font-bold text-slate-400 block">Out of ৳{totalInvoiced.toLocaleString()}</span>
          </div>
        </div>

        {/* Due Collection Ratio */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none">
              Collection Ratio
            </span>
            <span className="text-lg font-black text-blue-900 font-display block mt-1">
              {totalInvoiced > 0 ? ((totalPaid / totalInvoiced) * 100).toFixed(1) : "0"}%
            </span>
            <span className="text-[9px] font-bold text-emerald-600 block">Total payment clearance</span>
          </div>
        </div>
      </div>

      {/* SUB-PANEL 1: CUSTOMER LEDGER */}
      {activeSubTab === 'customers' && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex justify-between items-center bg-white p-4 border border-slate-200 rounded-2xl shadow-2xs gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search ledger by client name/company..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:bg-white rounded-lg text-xs focus:outline-hidden transition-all font-semibold"
              />
            </div>
            <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider hidden sm:block">
              Total Managed: {filteredCustomerLedger.length} Accounts
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white uppercase tracking-wider text-[10px] font-bold border-b border-slate-950">
                    <th className="py-3 px-5">Client Name & Company</th>
                    <th className="py-3 px-4">Contact Phone</th>
                    <th className="py-3 px-4 text-right">Total Billing</th>
                    <th className="py-3 px-4 text-right">Collected</th>
                    <th className="py-3 px-4 text-right">Outstanding Due</th>
                    <th className="py-3 px-4 text-center">Overdue</th>
                    <th className="py-3 px-5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredCustomerLedger.length > 0 ? (
                    filteredCustomerLedger.map((item) => {
                      const isExpanded = expandedCustomer === item.customer.id;
                      return (
                        <Fragment key={item.customer.id}>
                          <tr 
                            className={`hover:bg-slate-50/80 transition-colors ${item.due > 0 ? 'bg-rose-50/20' : 'bg-white'}`}
                          >
                            <td className="py-4 px-5">
                              <span className="font-bold text-slate-900 block">{item.customer.name}</span>
                              <span className="text-[10px] text-slate-400 font-semibold">{item.customer.company}</span>
                            </td>
                            <td className="py-4 px-4 font-mono font-bold text-slate-500">{item.customer.phone}</td>
                            <td className="py-4 px-4 text-right font-bold text-slate-900">৳{item.invoiced.toLocaleString()}</td>
                            <td className="py-4 px-4 text-right font-bold text-emerald-600">৳{item.paid.toLocaleString()}</td>
                            <td className="py-4 px-4 text-right">
                              {item.due > 0 ? (
                                <div className="inline-block bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg text-right">
                                  <span className="text-sm font-black text-rose-700 font-display block leading-tight">
                                    ৳{item.due.toLocaleString()}
                                  </span>
                                  <span className="text-[9px] font-bold text-rose-500 uppercase tracking-wider block">
                                    মোট বকেয়া
                                  </span>
                                </div>
                              ) : (
                                <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md text-[10px] font-bold">
                                  ✅ কোনো বকেয়া নেই
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-4 text-center">
                              {item.overdueCount > 0 ? (
                                <span className="bg-rose-600 text-white font-mono font-bold text-[9px] px-1.5 py-0.5 rounded-full">
                                  {item.overdueCount} Overdue
                                </span>
                              ) : (
                                <span className="text-slate-300">&mdash;</span>
                              )}
                            </td>
                            <td className="py-4 px-5 text-center">
                              <div className="flex items-center justify-center gap-2">
                                {item.due > 0 && (
                                  <button
                                    onClick={() => handleOpenCompanyPay(item)}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-2xs transition-colors cursor-pointer"
                                    title="কোম্পানির মোট বকেয়া জমা গ্রহণ করুন"
                                  >
                                    <CreditCard className="w-3.5 h-3.5" />
                                    জমা নিন
                                  </button>
                                )}
                                <button
                                  onClick={() => setExpandedCustomer(isExpanded ? null : item.customer.id)}
                                  className="inline-flex items-center gap-1 text-xs text-blue-900 hover:text-blue-950 hover:underline font-bold cursor-pointer"
                                >
                                  {isExpanded ? 'Hide Details' : 'View Invoices'}
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded detail row showing all invoices for the customer */}
                          {isExpanded && (
                            <tr>
                              <td colSpan={7} className="bg-slate-50 p-5 border-t border-b border-slate-200">
                                <div className="space-y-3">
                                  <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                    Document Audit Trail: {item.customer.name}
                                  </h4>
                                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                                    <table className="w-full text-left text-xs border-collapse">
                                      <thead>
                                        <tr className="bg-slate-100 text-slate-500 uppercase tracking-widest text-[9px] font-bold border-b border-slate-200">
                                          <th className="py-2.5 px-4">Doc #</th>
                                          <th className="py-2.5 px-4">Date</th>
                                          <th className="py-2.5 px-4">Due Date</th>
                                          <th className="py-2.5 px-4 text-right">Invoiced Total</th>
                                          <th className="py-2.5 px-4 text-right">Paid Amount</th>
                                          <th className="py-2.5 px-4 text-right">Due Amount</th>
                                          <th className="py-2.5 px-4 text-center">Status</th>
                                          <th className="py-2.5 px-4 text-center">Actions</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-600">
                                        {item.documents.map((doc) => {
                                          const paidAmt = doc.paidAmount !== undefined ? doc.paidAmount : (doc.status === 'Paid' ? doc.total : 0);
                                          const dueAmt = doc.dueAmount !== undefined ? doc.dueAmount : (doc.status !== 'Paid' ? doc.total : 0);
                                          return (
                                            <tr key={doc.id} className="hover:bg-slate-50">
                                              <td className="py-3 px-4 font-mono font-bold text-blue-900">{doc.docNumber}</td>
                                              <td className="py-3 px-4">{doc.date}</td>
                                              <td className="py-3 px-4 font-mono">{doc.dueDate || '--'}</td>
                                              <td className="py-3 px-4 text-right text-slate-900 font-bold">৳{doc.total.toLocaleString()}</td>
                                              <td className="py-3 px-4 text-right text-emerald-600">৳{paidAmt.toLocaleString()}</td>
                                              <td className="py-3 px-4 text-right text-rose-600 font-bold">৳{dueAmt.toLocaleString()}</td>
                                              <td className="py-3 px-4 text-center">
                                                <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                                  doc.status === 'Paid' 
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                                    : doc.status === 'Partially Paid'
                                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                    : doc.status === 'Overdue'
                                                    ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                                                    : 'bg-slate-50 text-slate-600 border-slate-200'
                                                }`}>
                                                  {doc.status}
                                                </span>
                                              </td>
                                              <td className="py-3 px-4 text-center space-x-2">
                                                <button
                                                  onClick={() => onViewDocument(doc)}
                                                  className="text-blue-900 hover:text-blue-950 font-bold hover:underline text-[10px] cursor-pointer"
                                                >
                                                  View PDF
                                                </button>
                                                {dueAmt > 0 && (
                                                  <button
                                                    onClick={() => {
                                                      setCollectingDoc(doc);
                                                      setPaymentAmount(dueAmt); // Default to full due
                                                    }}
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md cursor-pointer"
                                                  >
                                                    Collect
                                                  </button>
                                                )}
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 px-5 text-center text-slate-400">
                        No customer accounts with transaction history found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-PANEL 2: INDIVIDUAL INVOICES DUE */}
      {activeSubTab === 'invoices' && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex justify-between items-center bg-white p-4 border border-slate-200 rounded-2xl shadow-2xs gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by invoice number or customer name..."
                value={invoiceSearch}
                onChange={(e) => setInvoiceSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:bg-white rounded-lg text-xs focus:outline-hidden transition-all font-semibold"
              />
            </div>
            <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider hidden sm:block">
              Total Records: {filteredInvoices.length} Documents
            </div>
          </div>

          {/* Invoices List Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white uppercase tracking-wider text-[10px] font-bold border-b border-slate-950">
                    <th className="py-3 px-5">Invoice / Document</th>
                    <th className="py-3 px-4">Client Name</th>
                    <th className="py-3 px-4">Issue Date</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4 text-right">Invoiced Total</th>
                    <th className="py-3 px-4 text-right">Collected</th>
                    <th className="py-3 px-4 text-right">Dues Outstanding</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-5 text-center">Payment Collect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredInvoices.length > 0 ? (
                    filteredInvoices.map((doc) => {
                      const paidAmt = doc.paidAmount !== undefined ? doc.paidAmount : (doc.status === 'Paid' ? doc.total : 0);
                      const dueAmt = doc.dueAmount !== undefined ? doc.dueAmount : (doc.status !== 'Paid' ? doc.total : 0);
                      return (
                        <tr 
                          key={doc.id} 
                          className={`hover:bg-slate-50/80 transition-colors ${dueAmt > 0 ? 'bg-rose-50/10' : 'bg-white'}`}
                        >
                          <td className="py-4 px-5">
                            <span className="font-mono font-bold text-blue-900 block text-xs">{doc.docNumber}</span>
                            <span className="text-[10px] text-slate-400 font-semibold block">{doc.type}</span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="font-bold text-slate-900 block">{doc.customerName}</span>
                            <span className="text-[10px] text-slate-400 font-semibold block">{doc.customerCompany}</span>
                          </td>
                          <td className="py-4 px-4 font-mono text-[11px] text-slate-500">{doc.date}</td>
                          <td className="py-4 px-4 font-mono text-[11px] text-slate-500">{doc.dueDate || '--'}</td>
                          <td className="py-4 px-4 text-right font-bold text-slate-900">৳{doc.total.toLocaleString()}</td>
                          <td className="py-4 px-4 text-right font-bold text-emerald-600">৳{paidAmt.toLocaleString()}</td>
                          <td className="py-4 px-4 text-right font-bold text-rose-600">
                            <span className={dueAmt > 0 ? 'bg-rose-50 border border-rose-100 px-2 py-1 rounded-md' : 'text-slate-400'}>
                              ৳{dueAmt.toLocaleString()}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                              doc.status === 'Paid' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : doc.status === 'Partially Paid'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : doc.status === 'Overdue'
                                ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                                : 'bg-slate-50 text-slate-600 border-slate-200'
                            }`}>
                              {doc.status}
                            </span>
                          </td>
                          <td className="py-4 px-5 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => onViewDocument(doc)}
                                className="text-slate-400 hover:text-blue-950 font-bold p-1 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                                title="View Document Layout"
                              >
                                <FileText className="w-4 h-4" />
                              </button>
                              {dueAmt > 0 ? (
                                <button
                                  onClick={() => {
                                    setCollectingDoc(doc);
                                    setPaymentAmount(dueAmt);
                                  }}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer shadow-3xs"
                                >
                                  Collect
                                </button>
                              ) : (
                                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                                  <CheckCircle className="w-3.5 h-3.5" /> Fully Paid
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-12 px-5 text-center text-slate-400">
                        No sales invoices or customer purchase bills recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* RECEIVE PAYMENT MODAL */}
      {collectingDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden animate-slide-up">
            <div className="bg-slate-950 text-white p-5 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Payment Desk</span>
                <h3 className="font-extrabold font-display text-sm">Collect Outstanding Dues</h3>
              </div>
              <button 
                onClick={() => setCollectingDoc(null)}
                className="text-slate-400 hover:text-white font-bold bg-white/5 hover:bg-white/10 px-2 py-1 rounded-lg text-xs"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCollectPaymentSubmit} className="p-6 space-y-4 text-xs font-semibold">
              <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-xl space-y-1.5">
                <div className="flex justify-between text-slate-500 font-semibold">
                  <span>Document #</span>
                  <span className="font-mono font-bold text-slate-900">{collectingDoc.docNumber}</span>
                </div>
                <div className="flex justify-between text-slate-500 font-semibold">
                  <span>Customer Name</span>
                  <span className="font-bold text-slate-950">{collectingDoc.customerName}</span>
                </div>
                <div className="flex justify-between text-slate-500 font-semibold">
                  <span>Invoiced Total</span>
                  <span className="font-bold text-slate-900">৳{collectingDoc.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-500 font-semibold">
                  <span>Previously Paid</span>
                  <span className="font-bold text-emerald-600">
                    ৳{(collectingDoc.paidAmount !== undefined ? collectingDoc.paidAmount : (collectingDoc.status === 'Paid' ? collectingDoc.total : 0)).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1.5 text-slate-800 font-bold">
                  <span>Outstanding Balance</span>
                  <span className="text-rose-600 font-extrabold">
                    ৳{(collectingDoc.dueAmount !== undefined ? collectingDoc.dueAmount : (collectingDoc.status !== 'Paid' ? collectingDoc.total : 0)).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Receive Payment Input */}
              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">Receive Collection Amount (৳) <span className="text-rose-600">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base font-display">৳</span>
                  <input
                    type="number"
                    required
                    min={1}
                    max={collectingDoc.dueAmount !== undefined ? collectingDoc.dueAmount : collectingDoc.total}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 pl-7 focus:bg-white focus:outline-hidden font-bold text-slate-900 text-sm"
                  />
                </div>
                <p className="text-[10px] text-slate-400">Enter payment collected from the client. Maximum allowed is the outstanding due amount.</p>
              </div>

              {/* Payment Method & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 font-bold block">পেমেন্ট মেথড (Payment Method)</label>
                  <select
                    value={singlePaymentMethod}
                    onChange={(e) => setSinglePaymentMethod(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold text-slate-800 focus:bg-white focus:outline-hidden"
                  >
                    <option value="Cash">Cash (নগদ)</option>
                    <option value="Bank Transfer">Bank Transfer (ব্যাংক)</option>
                    <option value="bKash/Nagad">bKash / Nagad</option>
                    <option value="Cheque">Cheque (চেক)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 font-bold block">জমার তারিখ (Payment Date)</label>
                  <input
                    type="date"
                    required
                    value={singlePaymentDate}
                    onChange={(e) => setSinglePaymentDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Payment Notes */}
              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">Payment / Transaction Memo (মন্তব্য)</label>
                <input
                  type="text"
                  placeholder="e.g. Received via Bank Cheque #48104 or Cash"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCollectingDoc(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-250 text-slate-700 text-center rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-center font-bold uppercase rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  Process Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPANY TOTAL DUE COLLECTION MODAL */}
      {collectingCompany && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up">
            <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white p-5 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block mb-0.5">Company Due Ledger &bull; পেমেন্ট গ্রহণ</span>
                <h3 className="font-extrabold font-display text-sm sm:text-base">
                  {collectingCompany.customer.company || collectingCompany.customer.name}
                </h3>
                <p className="text-[11px] text-slate-300">
                  Contact: {collectingCompany.customer.name} &bull; {collectingCompany.customer.phone}
                </p>
              </div>
              <button 
                onClick={() => setCollectingCompany(null)}
                className="text-slate-400 hover:text-white font-bold bg-white/10 hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center text-sm"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCompanyPaySubmit} className="p-6 space-y-4 text-xs font-semibold">
              {companyPayFeedback && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold text-center animate-fade-in">
                  {companyPayFeedback}
                </div>
              )}

              {/* Total Balance Card */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold uppercase text-[10px]">কোম্পানির মোট বকেয়া (Total Outstanding)</span>
                  <span className="font-black text-rose-600 text-base font-display">
                    ৳{collectingCompany.totalDue.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-500 text-[11px]">
                  <span>বকেয়া বিলের সংখ্যা (Unpaid Invoices)</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {collectingCompany.documents.filter(d => d.status !== 'Paid').length} টি বিল
                  </span>
                </div>

                {/* Quick amount setter buttons */}
                <div className="pt-2 border-t border-slate-200 flex flex-wrap gap-2">
                  <span className="text-[10px] text-slate-400 font-bold block w-full">দ্রুত সিলেক্ট করুন:</span>
                  <button
                    type="button"
                    onClick={() => setCompanyPayAmount(collectingCompany.totalDue)}
                    className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-md text-[11px] font-bold cursor-pointer transition-colors"
                  >
                    সম্পূর্ণ জমা (৳{collectingCompany.totalDue.toLocaleString()})
                  </button>
                  {collectingCompany.totalDue > 5000 && (
                    <button
                      type="button"
                      onClick={() => setCompanyPayAmount(Math.round(collectingCompany.totalDue * 0.5))}
                      className="px-2.5 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-md text-[11px] font-bold cursor-pointer transition-colors"
                    >
                      ৫০% জমা (৳{Math.round(collectingCompany.totalDue * 0.5).toLocaleString()})
                    </button>
                  )}
                </div>
              </div>

              {/* Payment Amount Input */}
              <div className="space-y-1">
                <label className="text-slate-800 font-bold block flex justify-between items-center">
                  <span>জমা টাকা (Payment Amount ৳) <span className="text-rose-600">*</span></span>
                  {companyPayAmount > 0 && (
                    <span className="text-[10px] text-slate-500 font-normal">
                      অবশিষ্ট বকেয়া থাকবে: <strong className="text-rose-600">৳{Math.max(0, collectingCompany.totalDue - companyPayAmount).toLocaleString()}</strong>
                    </span>
                  )}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base font-display">৳</span>
                  <input
                    type="number"
                    required
                    min={1}
                    max={collectingCompany.totalDue}
                    value={companyPayAmount || ''}
                    onChange={(e) => setCompanyPayAmount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 pl-7 focus:bg-white focus:outline-hidden font-bold text-slate-900 text-base font-mono"
                    placeholder="জমা টাকা লিখুন..."
                  />
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  জমা টাকা স্বয়ংক্রিয়ভাবে কোম্পানির বকেয়া ভাউচারগুলোর (পূর্বের থেকে বর্তমান) সাথে সমন্বয় হয়ে মোট ডিউ কমে যাবে।
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Payment Method */}
                <div className="space-y-1">
                  <label className="text-slate-700 font-bold block">পেমেন্ট মেথড (Payment Method)</label>
                  <select
                    value={companyPayMethod}
                    onChange={(e) => setCompanyPayMethod(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold text-slate-800 focus:bg-white focus:outline-hidden"
                  >
                    <option value="Cash">Cash (নগদ)</option>
                    <option value="Bank Transfer">Bank Transfer (ব্যাংক)</option>
                    <option value="bKash/Nagad">bKash / Nagad</option>
                    <option value="Cheque">Cheque (চেক)</option>
                  </select>
                </div>

                {/* Date */}
                <div className="space-y-1">
                  <label className="text-slate-700 font-bold block">জমার তারিখ (Payment Date)</label>
                  <input
                    type="date"
                    required
                    value={companyPayDate}
                    onChange={(e) => setCompanyPayDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">মন্তব্য / ভাউচার রেফারেন্স (Notes)</label>
                <input
                  type="text"
                  placeholder="যেমন: ব্যাংক ট্রানজেকশন আইডি বা নগদ গ্রহণ রসিদ নং"
                  value={companyPayNotes}
                  onChange={(e) => setCompanyPayNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCollectingCompany(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-center rounded-lg transition-colors cursor-pointer"
                >
                  বাতিল (Dismiss)
                </button>
                <button
                  type="submit"
                  disabled={companyPayAmount <= 0}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-center font-bold uppercase rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  জমা নিশ্চিত করুন (৳{companyPayAmount.toLocaleString()})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE MONEY RECEIPT MODAL */}
      {recentReceipt && (
        <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in no-print-backdrop">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-slide-up my-8">
            
            {/* Header Control Panel (no-print) */}
            <div className="bg-slate-950 text-white p-4 flex justify-between items-center no-print">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-extrabold text-xs sm:text-sm text-white">পেমেন্ট রসিদ তৈরি হয়েছে / Money Receipt Ready</h3>
                  <p className="text-[10px] text-slate-400">রসিদটি প্রিন্ট করে কাস্টমারকে দিন</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Print (প্রিন্ট)
                </button>
                <button 
                  onClick={() => setRecentReceipt(null)}
                  className="text-slate-400 hover:text-white font-bold bg-white/10 hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center text-sm cursor-pointer"
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Printable Receipt Body */}
            <div id="printable-area" className="p-8 bg-white text-slate-900 font-sans relative select-none">
              
              {/* Decorative border or watermarks for professional print */}
              <div className="border-4 border-slate-900 p-6 rounded-xl relative">
                
                {/* Letterhead */}
                <div className="text-center space-y-1 pb-4 border-b-2 border-slate-900">
                  <div className="text-2xl font-black tracking-tight text-slate-900 font-display">
                    HITACHI AIR SOLUTION CENTER
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                    "Your Problem Solution is Sustainable Partner"
                  </div>
                  <div className="text-[9px] text-slate-600 font-semibold">
                    Sales, Service & Repair of All Types of Air Conditioning Systems
                  </div>
                  <div className="text-[9px] text-slate-500 font-medium">
                    Corporate Office & bull; Contact: +880 1711-000000 & bull; Email: support@hitachisolution.com
                  </div>
                </div>

                {/* Voucher Title */}
                <div className="my-5 flex justify-center">
                  <span className="bg-slate-900 text-white font-black text-xs uppercase tracking-widest px-6 py-1.5 rounded-lg text-center font-mono">
                    MONEY RECEIPT / মানি রসিদ
                  </span>
                </div>

                {/* Receipt Grid Info */}
                <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-[11px] font-semibold text-slate-700 pb-4 border-b border-slate-200">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Receipt Number:</span>
                    <strong className="text-slate-900 font-mono text-xs">{recentReceipt.receiptNo}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Date of Payment:</span>
                    <strong className="text-slate-900 font-mono text-xs">{recentReceipt.date}</strong>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Received From (কাস্টমার):</span>
                    <strong className="text-slate-900 text-sm">{recentReceipt.customerName}</strong>
                    {recentReceipt.customerCompany && (
                      <span className="text-slate-500 block text-[10px]">Company: {recentReceipt.customerCompany}</span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Contact Number:</span>
                    <strong className="text-slate-800 font-mono">{recentReceipt.customerPhone || 'N/A'}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Payment Method:</span>
                    <strong className="text-emerald-700 uppercase tracking-wider">{recentReceipt.paymentMethod}</strong>
                  </div>
                </div>

                {/* Amount Section */}
                <div className="my-5 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Reference Document:
                    </span>
                    <span className="font-mono font-black text-slate-900 text-xs bg-slate-200 px-2 py-0.5 rounded">
                      {recentReceipt.references}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-slate-800">
                      Amount Received (জমাকৃত টাকা):
                    </span>
                    <span className="text-xl font-black text-slate-950 font-display">
                      ৳{recentReceipt.amount.toLocaleString()}.00
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-600 bg-white border border-slate-100 p-2 rounded-lg font-bold italic">
                    <span className="text-slate-400 uppercase tracking-wider font-mono block text-[9px] not-italic font-bold">
                      Amount in Words (কথায়):
                    </span>
                    {numberToWords(recentReceipt.amount)}
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-[10px] font-bold text-slate-500">
                    <span>Outstanding Remaining Due (অবশিষ্ট বকেয়া):</span>
                    <span className="text-rose-600 font-black font-mono">
                      ৳{recentReceipt.remainingDue.toLocaleString()}.00
                    </span>
                  </div>
                </div>

                {/* Notes */}
                {recentReceipt.notes && (
                  <div className="text-[10px] text-slate-500 font-semibold mb-6">
                    <span className="text-slate-400 text-[9px] uppercase font-bold block">Payment Details / Memo:</span>
                    <p className="text-slate-800 bg-slate-50 border border-slate-200 p-2 rounded-lg italic">
                      {recentReceipt.notes}
                    </p>
                  </div>
                )}

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-12 pt-12 text-center text-[10px] font-bold text-slate-500">
                  <div className="space-y-1">
                    <div className="border-t border-slate-400 pt-1.5 w-44 mx-auto text-slate-800">
                      Customer's Signature
                    </div>
                    <span className="text-[9px] text-slate-400 italic block">গ্রহীতার স্বাক্ষর</span>
                  </div>
                  <div className="space-y-1">
                    <div className="border-t border-slate-400 pt-1.5 w-44 mx-auto text-slate-800 font-bold">
                      Authorized Signature
                    </div>
                    <span className="text-[9px] text-slate-400 italic block">কর্তৃপক্ষের স্বাক্ষর</span>
                  </div>
                </div>

                {/* Copy / Seal Watermark */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none text-center rotate-12 z-0">
                  <span className="text-5xl font-black tracking-widest text-slate-900 border-8 border-slate-900 p-4 rounded-3xl block">
                    PAID / আদায়কৃত
                  </span>
                </div>

              </div>
            </div>

            {/* Footer buttons (no-print) */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end gap-3 no-print">
              <button
                onClick={() => setRecentReceipt(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-950 text-white text-xs font-bold uppercase rounded-xl cursor-pointer"
              >
                Close (বন্ধ করুন)
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

// Helper: Convert number to English currency words
function numberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  if (num === 0) return 'Zero Taka Only';
  
  const convert = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + convert(n % 10000000) : '');
  };
  
  return convert(num) + ' Taka Only';
}
