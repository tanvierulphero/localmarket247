import { useState, useMemo } from 'react';
import { Document, DocumentType, DocumentStatus } from '../types';
import { getDocFinancials } from './DueLedger';
import { 
  Search, 
  SlidersHorizontal, 
  Plus, 
  FileText, 
  Trash2, 
  Edit3, 
  Printer, 
  CheckCircle, 
  CheckCircle2,
  Truck, 
  Receipt,
  Coins,
  DollarSign,
  Wallet,
  X,
  Calendar,
  CreditCard,
  RotateCcw,
  AlertCircle,
  Check,
  Zap,
  Building2,
  UserCheck
} from 'lucide-react';

interface DocumentListProps {
  documents: Document[];
  onAddDocumentClick: (type: DocumentType) => void;
  onEditDocument: (doc: Document) => void;
  onDeleteDocument?: (id: string) => void;
  onViewDocument: (doc: Document) => void;
  onCreateInvoiceFromChallan?: (challan: Document) => void;
  onCreateBillFromChallan?: (challan: Document) => void;
  onCreateChallanFromInvoice?: (invoice: Document) => void;
  onUpdateDocument?: (doc: Document) => void;
}

export default function DocumentList({
  documents,
  onAddDocumentClick,
  onEditDocument,
  onDeleteDocument,
  onViewDocument,
  onCreateInvoiceFromChallan,
  onCreateBillFromChallan,
  onCreateChallanFromInvoice,
  onUpdateDocument
}: DocumentListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Payment Settlement Modal State
  const [paymentModalDoc, setPaymentModalDoc] = useState<Document | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank Transfer' | 'bKash/Nagad' | 'Cheque'>('Cash');
  const [paymentDate, setPaymentDate] = useState<string>('');
  const [receiptNo, setReceiptNo] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<'FULL' | 'PARTIAL' | 'UNPAID'>('FULL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Open Payment Modal pre-filled
  const handleOpenPaymentModal = (doc: Document) => {
    const fin = getDocFinancials(doc);
    const today = new Date().toISOString().split('T')[0];
    const initialAmount = fin.due > 0 ? fin.due : fin.total;
    const randomReceipt = `MR-${today.replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    setPaymentModalDoc(doc);
    setPaymentAmount(initialAmount);
    setPaymentMode(doc.status === 'Paid' ? 'FULL' : (fin.paid > 0 && fin.due > 0 ? 'PARTIAL' : 'FULL'));
    setPaymentMethod('Cash');
    setPaymentDate(today);
    setReceiptNo(randomReceipt);
    setPaymentNotes(`Payment received against ${doc.type === 'INVOICE' ? 'Sales Invoice' : 'Bill'} ${doc.docNumber}`);
  };

  // Instant 1-Click Cash Full Payment
  const handleInstantFullPay = (doc: Document) => {
    if (!onUpdateDocument) return;
    const fin = getDocFinancials(doc);
    const today = new Date().toISOString().split('T')[0];
    const receipt = `MR-${today.replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const noteTag = `[Payment Received: Tk. ${fin.total.toLocaleString()} on ${today} via Cash - Instant 100% Full Payment cleared - Ref: ${receipt}]`;

    const updatedDoc: Document = {
      ...doc,
      paidAmount: fin.total,
      dueAmount: 0,
      status: 'Paid',
      notes: doc.notes ? `${doc.notes}\n${noteTag}` : noteTag
    };

    onUpdateDocument(updatedDoc);
    setPaymentModalDoc(null);
    setToastMessage(`✓ ${doc.type === 'CHALLAN' ? 'Delivery Challan' : doc.type === 'INVOICE' ? 'Sales Invoice' : 'Document'} ${doc.docNumber} marked as PAID (৳${fin.total.toLocaleString()})!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Save payment from modal (Full or Partial or Revert Unpaid)
  const handleSavePaymentModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalDoc || !onUpdateDocument) return;

    const fin = getDocFinancials(paymentModalDoc);
    const numAmount = Math.max(0, Number(paymentAmount) || 0);

    if (paymentMode === 'UNPAID') {
      const updatedDoc: Document = {
        ...paymentModalDoc,
        paidAmount: 0,
        dueAmount: paymentModalDoc.type === 'CHALLAN' ? 0 : fin.total,
        status: paymentModalDoc.type === 'CHALLAN' ? 'Active' : 'Unpaid'
      };
      onUpdateDocument(updatedDoc);
      setToastMessage(`${paymentModalDoc.type === 'CHALLAN' ? 'Challan' : 'Invoice'} ${paymentModalDoc.docNumber} set to ${paymentModalDoc.type === 'CHALLAN' ? 'Active (Unpaid)' : 'Unpaid'}.`);
      setTimeout(() => setToastMessage(null), 3500);
      setPaymentModalDoc(null);
      return;
    }

    let newPaid: number;
    let newDue: number;
    let newStatus: DocumentStatus;

    if (paymentMode === 'FULL') {
      newPaid = Math.max(fin.total, fin.paid + numAmount);
      newDue = 0;
      newStatus = 'Paid';
    } else {
      newPaid = fin.paid + numAmount;
      newDue = Math.max(0, fin.total - newPaid);
      newStatus = newDue === 0 ? 'Paid' : (paymentModalDoc.type === 'CHALLAN' ? 'Active' : 'Partially Paid');
    }

    const noteTag = `[Payment Received: Tk. ${numAmount.toLocaleString()} on ${paymentDate} via ${paymentMethod} - ${paymentNotes.trim()} - Ref: ${receiptNo.trim()}]`;

    const updatedDoc: Document = {
      ...paymentModalDoc,
      paidAmount: newPaid,
      dueAmount: newDue,
      status: newStatus,
      notes: paymentModalDoc.notes ? `${paymentModalDoc.notes}\n${noteTag}` : noteTag
    };

    onUpdateDocument(updatedDoc);
    setToastMessage(`✓ Payment of ৳${numAmount.toLocaleString()} recorded for ${paymentModalDoc.docNumber} (${newStatus})!`);
    setTimeout(() => setToastMessage(null), 3500);
    setPaymentModalDoc(null);
  };

  // Revert / Mark as Unpaid
  const handleRevertToUnpaid = (doc: Document) => {
    if (!onUpdateDocument) return;
    const fin = getDocFinancials(doc);
    const updatedDoc: Document = {
      ...doc,
      paidAmount: 0,
      dueAmount: doc.type === 'CHALLAN' ? 0 : fin.total,
      status: doc.type === 'CHALLAN' ? 'Active' : 'Unpaid'
    };

    onUpdateDocument(updatedDoc);
    setToastMessage(`${doc.type === 'CHALLAN' ? 'Challan' : 'Invoice'} ${doc.docNumber} set to ${doc.type === 'CHALLAN' ? 'Active' : 'Unpaid'}.`);
    setTimeout(() => setToastMessage(null), 3500);
    setPaymentModalDoc(null);
  };

  // Filtering documents
  const filteredDocuments = useMemo(() => {
    return [...documents]
      .sort((a, b) => {
        const timeA = new Date(a.date || 0).getTime();
        const timeB = new Date(b.date || 0).getTime();
        if (timeB !== timeA) return timeB - timeA;
        return (b.id || '').localeCompare(a.id || '');
      })
      .filter(doc => {
        const matchSearch = doc.docNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            doc.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (doc.customerCompany && doc.customerCompany.toLowerCase().includes(searchQuery.toLowerCase())) ||
                            (doc.subject && doc.subject.toLowerCase().includes(searchQuery.toLowerCase()));
        
        const matchType = selectedType === 'ALL' || doc.type === selectedType;
        const matchStatus = selectedStatus === 'ALL' || doc.status === selectedStatus;

        return matchSearch && matchType && matchStatus;
      });
  }, [documents, searchQuery, selectedType, selectedStatus]);

  // Group count for types
  const typeCounts = useMemo(() => {
    return {
      ALL: documents.length,
      OFFER_LETTER: documents.filter(d => d.type === 'OFFER_LETTER').length,
      QUOTATION: documents.filter(d => d.type === 'QUOTATION').length,
      CHALLAN: documents.filter(d => d.type === 'CHALLAN').length,
      INVOICE: documents.filter(d => d.type === 'INVOICE').length,
      BILL: documents.filter(d => d.type === 'BILL').length,
    };
  }, [documents]);

  // Color badge helpers for document types
  const getTypeBadge = (type: DocumentType) => {
    switch (type) {
      case 'OFFER_LETTER':
        return 'bg-violet-100 text-violet-800 border-violet-200';
      case 'QUOTATION':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'CHALLAN':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'BILL':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'INVOICE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Color badge helpers for statuses
  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case 'Paid':
      case 'Accepted':
      case 'Active':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Unpaid':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Sent':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Overdue':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 text-xs">
      
      {/* Dynamic shortcut creator cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Card 1: Offer Letter */}
        <button
          onClick={() => onAddDocumentClick('OFFER_LETTER')}
          className="bg-white border border-slate-200 hover:border-violet-500 hover:shadow-xs p-3.5 rounded-xl text-left space-y-1.5 transition-all cursor-pointer group"
        >
          <div className="w-7 h-7 bg-violet-50 group-hover:bg-violet-100 text-violet-700 rounded-lg flex items-center justify-center transition-colors">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-bold text-slate-900 block font-display leading-tight">Offer Letter</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Proposal / Intro</span>
          </div>
        </button>

        {/* Card 2: Quotation */}
        <button
          onClick={() => onAddDocumentClick('QUOTATION')}
          className="bg-white border border-slate-200 hover:border-amber-500 hover:shadow-xs p-3.5 rounded-xl text-left space-y-1.5 transition-all cursor-pointer group"
        >
          <div className="w-7 h-7 bg-amber-50 group-hover:bg-amber-100 text-amber-700 rounded-lg flex items-center justify-center transition-colors">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-bold text-slate-900 block font-display leading-tight">Quotation</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Price Estimate</span>
          </div>
        </button>

        {/* Card 3: Challan */}
        <button
          onClick={() => onAddDocumentClick('CHALLAN')}
          className="bg-white border border-slate-200 hover:border-blue-500 hover:shadow-xs p-3.5 rounded-xl text-left space-y-1.5 transition-all cursor-pointer group"
        >
          <div className="w-7 h-7 bg-blue-50 group-hover:bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center transition-colors">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-bold text-slate-900 block font-display leading-tight">Delivery Challan</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Goods Dispatch</span>
          </div>
        </button>

        {/* Card 4: Invoice */}
        <button
          onClick={() => onAddDocumentClick('INVOICE')}
          className="bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-xs p-3.5 rounded-xl text-left space-y-1.5 transition-all cursor-pointer group"
        >
          <div className="w-7 h-7 bg-emerald-50 group-hover:bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center transition-colors">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-bold text-slate-900 block font-display leading-tight">Sales Invoice</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Commercial Invoice</span>
          </div>
        </button>
      </div>

      {/* Advanced Filter Toolbar */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Search box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search document ID, client, or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white focus:border-blue-900"
            />
          </div>

          {/* Status filters */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Status:
            </span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Active">Active / Approved</option>
              <option value="Paid">Fully Paid</option>
              <option value="Unpaid">Unpaid / Outstanding</option>
              <option value="Overdue">Overdue</option>
              <option value="Accepted">Accepted</option>
              <option value="Declined">Declined</option>
            </select>
          </div>
        </div>

        {/* Categories Tab pills */}
        <div className="border-t border-slate-100 pt-3 flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedType('ALL')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              selectedType === 'ALL' 
                ? 'bg-blue-900 text-white shadow-xs' 
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            All Categories ({typeCounts.ALL})
          </button>
          
          <button
            onClick={() => setSelectedType('OFFER_LETTER')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              selectedType === 'OFFER_LETTER' 
                ? 'bg-violet-700 text-white shadow-xs' 
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            Offer Letters ({typeCounts.OFFER_LETTER})
          </button>

          <button
            onClick={() => setSelectedType('QUOTATION')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              selectedType === 'QUOTATION' 
                ? 'bg-amber-600 text-white shadow-xs' 
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            Quotations ({typeCounts.QUOTATION})
          </button>

          <button
            onClick={() => setSelectedType('CHALLAN')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              selectedType === 'CHALLAN' 
                ? 'bg-blue-700 text-white shadow-xs' 
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            Delivery Challans ({typeCounts.CHALLAN})
          </button>

          <button
            onClick={() => setSelectedType('INVOICE')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              selectedType === 'INVOICE' 
                ? 'bg-emerald-600 text-white shadow-xs' 
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            Sales Invoices ({typeCounts.INVOICE})
          </button>
        </div>
      </div>

      {/* Main Grid Log View */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Doc SNo. / ID</th>
                <th className="py-3.5 px-3">Type</th>
                <th className="py-3.5 px-3">Date / Due Date</th>
                <th className="py-3.5 px-3">Recipient / Client Company</th>
                <th className="py-3.5 px-3 text-right">Net Value</th>
                <th className="py-3.5 px-3 text-center">Workflow Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredDocuments.length > 0 ? (
                filteredDocuments.map(doc => (
                  <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* ID */}
                    <td className="py-3.5 px-4 font-bold text-blue-900 font-mono">
                      {doc.docNumber}
                    </td>

                    {/* Type Badge */}
                    <td className="py-3.5 px-3">
                      <span className={`inline-block border text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${getTypeBadge(doc.type)}`}>
                        {String(doc.type || '').replace('_', ' ')}
                      </span>
                    </td>

                    {/* Dates */}
                    <td className="py-3.5 px-3 text-slate-500 font-medium">
                      <div>Issued: <span className="font-bold text-slate-700">{doc.date}</span></div>
                      {doc.dueDate && (
                        <div className="text-[10px] text-rose-500">Due: <span className="font-bold">{doc.dueDate}</span></div>
                      )}
                    </td>

                    {/* Recipient */}
                    <td className="py-3.5 px-3 max-w-xs">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-900 block leading-tight">
                          {doc.customerCompany || doc.customerName}
                        </span>
                        {doc.customerCompany && (
                          <span className="text-[10px] text-slate-400 block font-semibold">Attn: {doc.customerName}</span>
                        )}
                      </div>
                    </td>

                    {/* Net Value & Accounting breakdown */}
                    <td className="py-3.5 px-3 text-right">
                      <div className="font-extrabold text-slate-900 font-display text-xs sm:text-sm">
                        ৳ {doc.total.toLocaleString()}
                      </div>
                      {doc.type === 'CHALLAN' ? (
                        doc.status === 'Paid' ? (
                          <div className="text-[10px] text-emerald-600 font-black flex items-center justify-end gap-1 mt-0.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Paid (Optional)</span>
                          </div>
                        ) : null
                      ) : (doc.type === 'INVOICE' || doc.type === 'BILL') ? (() => {
                        const fin = getDocFinancials(doc);
                        if (doc.status === 'Paid') {
                          return (
                            <div className="text-[10px] text-emerald-600 font-black flex items-center justify-end gap-1 mt-0.5">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Paid in Full</span>
                            </div>
                          );
                        }
                        if (fin.paid > 0) {
                          return (
                            <div className="text-[10px] text-amber-700 font-bold block mt-0.5 whitespace-nowrap">
                              <span>Paid: ৳{fin.paid.toLocaleString()}</span>
                              <span className="text-slate-400 mx-1">&bull;</span>
                              <span className="text-rose-600">Due: ৳{fin.due.toLocaleString()}</span>
                            </div>
                          );
                        }
                        return (
                          <div className="text-[10px] text-rose-600 font-bold block mt-0.5">
                            Due: ৳{fin.due.toLocaleString()}
                          </div>
                        );
                      })() : null}
                    </td>

                    {/* Status badge - Clickable for Invoices/Bills/Challans to manage payment */}
                    <td className="py-3.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => (doc.type === 'INVOICE' || doc.type === 'BILL' || doc.type === 'CHALLAN') && handleOpenPaymentModal(doc)}
                        className={`inline-flex items-center gap-1 border text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider transition-all ${getStatusBadge(doc.status)} ${(doc.type === 'INVOICE' || doc.type === 'BILL' || doc.type === 'CHALLAN') ? 'hover:shadow-xs hover:scale-105 cursor-pointer' : 'cursor-default'}`}
                        title={(doc.type === 'INVOICE' || doc.type === 'BILL' || doc.type === 'CHALLAN') ? 'Click to record payment or change status (Paid optional)' : doc.status}
                      >
                        {doc.status === 'Paid' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        <span>{doc.status}</span>
                      </button>
                    </td>

                    {/* Option Triggers */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">

                        {/* If Challan: If invoice already created, hide Create Invoice and show Invoiced badge */}
                        {doc.type === 'CHALLAN' && (() => {
                          const linkedInvoice = documents.find(d => 
                            (d.type === 'INVOICE' || d.type === 'BILL') && (
                              (d.notes && d.notes.includes(doc.docNumber)) ||
                              (d.subject && d.subject.includes(doc.docNumber)) ||
                              (doc.subject && doc.subject.includes(d.docNumber)) ||
                              (doc.notes && doc.notes.includes(d.docNumber))
                            )
                          );
                          const isAlreadyInvoiced = !!linkedInvoice || 
                            (doc.notes && (doc.notes.includes('Invoiced under') || doc.notes.includes('INV/'))) ||
                            (doc.subject && doc.subject.includes('INV/'));

                          if (linkedInvoice) {
                            return (
                              <button
                                onClick={() => onViewDocument(linkedInvoice)}
                                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg hover:text-emerald-950 transition-colors border border-emerald-300 cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                                title={`Invoice already created: ${linkedInvoice.docNumber} (click to view)`}
                              >
                                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Invoiced ({linkedInvoice.docNumber.split('/').pop() || 'INV'})</span>
                              </button>
                            );
                          }

                          if (isAlreadyInvoiced) {
                            return (
                              <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 text-[11px] font-bold flex items-center gap-1">
                                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Invoiced</span>
                              </span>
                            );
                          }

                          if (onCreateInvoiceFromChallan) {
                            return (
                              <button
                                onClick={() => onCreateInvoiceFromChallan(doc)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors border border-emerald-700 cursor-pointer flex items-center gap-1 text-[11px] font-bold shadow-2xs"
                                title="Generate Sales Invoice directly from this delivery challan"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Create Invoice</span>
                              </button>
                            );
                          }
                          return null;
                        })()}

                        {/* If Invoice/Bill: If challan already created, hide Create Challan and show Challan badge */}
                        {(doc.type === 'INVOICE' || doc.type === 'BILL') && (() => {
                          const linked = documents.find(d => 
                            d.type === 'CHALLAN' && (
                              (doc.notes && doc.notes.includes(d.docNumber)) ||
                              (doc.subject && doc.subject.includes(d.docNumber)) ||
                              (d.subject && d.subject.includes(doc.docNumber)) ||
                              (d.notes && d.notes.includes(doc.docNumber))
                            )
                          );
                          const hasChallanCreated = !!linked || 
                            (doc.notes && (doc.notes.includes('Delivery Challan') || doc.notes.includes('Challan') || doc.notes.includes('CH/'))) ||
                            (doc.subject && (doc.subject.includes('Delivery Challan') || doc.subject.includes('CH/')));

                          if (linked) {
                            return (
                              <button
                                onClick={() => onViewDocument(linked)}
                                className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg hover:text-blue-900 transition-colors border border-blue-200 cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                                title={`Challan already issued: ${linked.docNumber} (click to view)`}
                              >
                                <Truck className="w-3.5 h-3.5 text-blue-600" />
                                <span>Challan ({linked.docNumber.split('/').pop() || 'CH'})</span>
                              </button>
                            );
                          }

                          if (hasChallanCreated) {
                            return (
                              <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 text-[11px] font-bold flex items-center gap-1">
                                <Truck className="w-3.5 h-3.5 text-blue-600" />
                                <span>Challan Issued</span>
                              </span>
                            );
                          }

                          if (onCreateChallanFromInvoice) {
                            return (
                              <button
                                onClick={() => onCreateChallanFromInvoice(doc)}
                                className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-lg transition-colors border border-amber-300 cursor-pointer flex items-center gap-1 text-[11px] font-bold shadow-2xs"
                                title="Generate Delivery Challan directly from this invoice"
                              >
                                <Truck className="w-3.5 h-3.5 text-amber-700" />
                                <span>Create Challan</span>
                              </button>
                            );
                          }
                          return null;
                        })()}

                        {/* View & Print */}
                        <button
                          onClick={() => onViewDocument(doc)}
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-lg hover:text-blue-950 transition-colors border border-blue-200 cursor-pointer"
                          title="View, Print & Download PDF"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => onEditDocument(doc)}
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg hover:text-slate-900 transition-colors border border-slate-200 cursor-pointer"
                          title="Modify details"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        {onDeleteDocument && (
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to permanently delete document ${doc.docNumber}?`)) {
                                onDeleteDocument(doc.id);
                              }
                            }}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg hover:text-rose-700 transition-colors border border-rose-200 cursor-pointer"
                            title="Delete document (Admin Only)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 italic">
                    No documents match your search queries or filter categories.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-bold animate-fade-in border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* SALES INVOICE PAYMENT / "PAID" SETTLEMENT MODAL */}
      {paymentModalDoc && (() => {
        const fin = getDocFinancials(paymentModalDoc);
        return (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[85vh] sm:max-h-[88vh] flex flex-col overflow-hidden my-auto">
              {/* Modal Header */}
              <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                    <Coins className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base leading-tight font-display">
                      {paymentModalDoc.type === 'CHALLAN' 
                        ? 'Challan Payment (Optional Settlement)' 
                        : 'Invoice Payment Settlement'}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-slate-300 mt-0.5">
                      <span className="font-mono font-bold text-emerald-400">{paymentModalDoc.docNumber}</span>
                      <span>&bull;</span>
                      <span>
                        {paymentModalDoc.type === 'INVOICE' 
                          ? 'Sales Invoice' 
                          : paymentModalDoc.type === 'CHALLAN' 
                          ? 'Delivery Challan (Optional Payment)' 
                          : 'Supplier Bill'}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPaymentModalDoc(null)}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Client & Financial Snapshot & Form */}
              <div className="p-4 sm:p-5 space-y-4 flex-1 overflow-y-auto">
                {paymentModalDoc.type === 'CHALLAN' && (
                  <div className="bg-blue-50 border border-blue-200 text-blue-900 px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-2 font-medium">
                    <Truck className="w-4 h-4 text-blue-700 flex-shrink-0" />
                    <span>💡 Payment is not mandatory on delivery challans, it is completely optional. Record as Paid if payment is collected upon delivery.</span>
                  </div>
                )}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex justify-between items-start text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Client / Company</span>
                      <strong className="text-slate-900 block font-display text-sm">{paymentModalDoc.customerCompany || paymentModalDoc.customerName}</strong>
                      {paymentModalDoc.customerCompany && (
                        <span className="text-[11px] text-slate-500 font-medium">Attn: {paymentModalDoc.customerName}</span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Current Status</span>
                      <span className={`inline-block border text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider mt-0.5 ${getStatusBadge(paymentModalDoc.status)}`}>
                        {paymentModalDoc.status}
                      </span>
                    </div>
                  </div>

                  {/* Financial Counters */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-center">
                    <div className="bg-white p-2 rounded-lg border border-slate-100">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">Total Net</span>
                      <span className="font-extrabold text-slate-900 text-xs sm:text-sm font-display">৳ {fin.total.toLocaleString()}</span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-100">
                      <span className="text-[9px] text-emerald-600 font-bold uppercase block">Already Paid</span>
                      <span className="font-extrabold text-emerald-700 text-xs sm:text-sm font-display">৳ {fin.paid.toLocaleString()}</span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-100">
                      <span className="text-[9px] text-rose-500 font-bold uppercase block">Remaining Due</span>
                      <span className="font-extrabold text-rose-600 text-xs sm:text-sm font-display">৳ {fin.due.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Instant 1-Click Paid Button for fastest workflow */}
                {fin.due > 0 && (
                  <button
                    type="button"
                    onClick={() => handleInstantFullPay(paymentModalDoc)}
                    className="w-full py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs group"
                  >
                    <Zap className="w-4 h-4 text-emerald-600 fill-emerald-600 group-hover:scale-110 transition-transform" />
                    <span>⚡ Instant 100% Cash Paid (Full ৳{fin.due.toLocaleString()} Settlement)</span>
                  </button>
                )}

                {/* Payment Form */}
                <form onSubmit={handleSavePaymentModal} className="space-y-3.5">
                  {/* Settlement Mode Selection */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Settlement Mode
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentMode('FULL');
                          setPaymentAmount(fin.due > 0 ? fin.due : fin.total);
                        }}
                        className={`py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                          paymentMode === 'FULL' 
                            ? 'bg-emerald-600 text-white shadow-xs' 
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Full Paid
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPaymentMode('PARTIAL');
                          setPaymentAmount(fin.due > 0 ? fin.due : fin.total);
                        }}
                        className={`py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                          paymentMode === 'PARTIAL' 
                            ? 'bg-blue-900 text-white shadow-xs' 
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Partial
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMode('UNPAID')}
                        className={`py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                          paymentMode === 'UNPAID' 
                            ? 'bg-rose-600 text-white shadow-xs' 
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Revert to Due
                      </button>
                    </div>
                  </div>

                  {paymentMode !== 'UNPAID' ? (
                    <>
                      {/* Amount & Method Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                            Received Amount (৳)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max={fin.total}
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(Number(e.target.value) || 0)}
                            disabled={paymentMode === 'FULL'}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-black text-slate-900 focus:bg-white focus:outline-hidden text-sm disabled:opacity-75 disabled:bg-emerald-50/50 disabled:border-emerald-200"
                            required
                          />
                          {paymentMode === 'FULL' && (
                            <span className="text-[10px] text-emerald-700 font-semibold block">
                              ✓ Auto-clears full remaining due of ৳{fin.due > 0 ? fin.due.toLocaleString() : fin.total.toLocaleString()}
                            </span>
                          )}
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                            Payment Method
                          </label>
                          <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value as any)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold text-slate-800 focus:bg-white focus:outline-hidden text-xs cursor-pointer"
                          >
                            <option value="Cash">Cash</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="bKash/Nagad">bKash / Nagad</option>
                            <option value="Cheque">Cheque</option>
                          </select>
                        </div>
                      </div>

                      {/* Date & Receipt Reference Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                            Payment Date
                          </label>
                          <input
                            type="date"
                            value={paymentDate}
                            onChange={(e) => setPaymentDate(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-semibold text-slate-800 focus:bg-white focus:outline-hidden text-xs"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                            Money Receipt / Ref No.
                          </label>
                          <input
                            type="text"
                            value={receiptNo}
                            onChange={(e) => setReceiptNo(e.target.value)}
                            placeholder="e.g. MR-20261010-1001"
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono font-bold text-blue-900 focus:bg-white focus:outline-hidden text-xs"
                          />
                        </div>
                      </div>

                      {/* Notes / Remarks */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                          Notes / Description
                        </label>
                        <input
                          type="text"
                          value={paymentNotes}
                          onChange={(e) => setPaymentNotes(e.target.value)}
                          placeholder="e.g. Full settlement received by cheque / bank"
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-medium text-slate-800 focus:bg-white focus:outline-hidden"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl text-xs space-y-1">
                      <strong className="block font-bold">Revert to Unpaid:</strong>
                      <p className="text-[11px] leading-relaxed">
                        This will reset the recorded payment on this invoice to ৳0 and mark the workflow status as Unpaid / Outstanding.
                      </p>
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setPaymentModalDoc(null)}
                      className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className={`px-5 py-2 text-white font-black rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all hover:scale-[1.02] ${
                        paymentMode === 'UNPAID'
                          ? 'bg-rose-600 hover:bg-rose-700'
                          : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {paymentMode === 'UNPAID' 
                          ? 'Confirm Revert to Unpaid' 
                          : paymentMode === 'FULL' 
                            ? 'Confirm & Mark as Fully Paid' 
                            : 'Save Partial Payment'}
                      </span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
