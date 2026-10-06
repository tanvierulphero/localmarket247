import { useState, useMemo } from 'react';
import { Document, DocumentType, DocumentStatus } from '../types';
import { Search, SlidersHorizontal, Plus, FileText, Trash2, Edit3, Printer, CheckCircle, Truck, Receipt } from 'lucide-react';

interface DocumentListProps {
  documents: Document[];
  onAddDocumentClick: (type: DocumentType) => void;
  onEditDocument: (doc: Document) => void;
  onDeleteDocument: (id: string) => void;
  onViewDocument: (doc: Document) => void;
  onCreateInvoiceFromChallan?: (challan: Document) => void;
  onCreateBillFromChallan?: (challan: Document) => void;
}

export default function DocumentList({
  documents,
  onAddDocumentClick,
  onEditDocument,
  onDeleteDocument,
  onViewDocument,
  onCreateInvoiceFromChallan,
  onCreateBillFromChallan
}: DocumentListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

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
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
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

        {/* Card 5: Sales Bill */}
        <button
          onClick={() => onAddDocumentClick('BILL')}
          className="bg-white border border-slate-200 hover:border-purple-500 hover:shadow-xs p-3.5 rounded-xl text-left space-y-1.5 transition-all cursor-pointer group"
        >
          <div className="w-7 h-7 bg-purple-50 group-hover:bg-purple-100 text-purple-700 rounded-lg flex items-center justify-center transition-colors">
            <Receipt className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-bold text-slate-900 block font-display leading-tight">Sales Bill</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Customer Bill</span>
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

          <button
            onClick={() => setSelectedType('BILL')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              selectedType === 'BILL' 
                ? 'bg-rose-600 text-white shadow-xs' 
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            Supplier Bills ({typeCounts.BILL})
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

                    {/* Value */}
                    <td className="py-3.5 px-3 text-right font-extrabold text-slate-900 font-display">
                      {doc.total.toLocaleString()}
                    </td>

                    {/* Status badge */}
                    <td className="py-3.5 px-3 text-center">
                      <span className={`inline-block border text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${getStatusBadge(doc.status)}`}>
                        {doc.status}
                      </span>
                    </td>

                    {/* Option Triggers */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* If Challan: Option to directly create Sales Invoice from this Challan */}
                        {doc.type === 'CHALLAN' && onCreateInvoiceFromChallan && (
                          <button
                            onClick={() => onCreateInvoiceFromChallan(doc)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors border border-emerald-700 cursor-pointer flex items-center gap-1 text-[11px] font-bold shadow-2xs"
                            title="Generate Sales Invoice directly from this delivery challan"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Create Invoice</span>
                          </button>
                        )}

                        {/* If Invoice/Bill: View linked Delivery Challan if one actually exists */}
                        {(doc.type === 'INVOICE' || doc.type === 'BILL') && (() => {
                          const linked = documents.find(d => 
                            d.type === 'CHALLAN' && (
                              (doc.notes && doc.notes.includes(d.docNumber)) ||
                              (doc.subject && doc.subject.includes(d.docNumber)) ||
                              (d.subject && d.subject.includes(doc.docNumber))
                            )
                          );
                          if (linked) {
                            return (
                              <button
                                onClick={() => onViewDocument(linked)}
                                className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg hover:text-blue-900 transition-colors border border-blue-200 cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                                title={`View linked challan: ${linked.docNumber}`}
                              >
                                <Truck className="w-3.5 h-3.5 text-blue-600" />
                                <span>Challan</span>
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
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to permanently delete document ${doc.docNumber}?`)) {
                              onDeleteDocument(doc.id);
                            }
                          }}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg hover:text-rose-700 transition-colors border border-rose-200 cursor-pointer"
                          title="Delete document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
    </div>
  );
}
