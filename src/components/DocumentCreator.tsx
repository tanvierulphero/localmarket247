import { useState, useEffect } from 'react';
import { Product, Customer, Document, DocumentItem, DocumentType, DocumentStatus, BusinessSettings, StaffUser } from '../types';
import { Plus, Trash2, Save, FileText, UserPlus, Calculator, Truck, Receipt, Package, UserCheck } from 'lucide-react';

interface DocumentCreatorProps {
  products: Product[];
  customers: Customer[];
  settings: BusinessSettings;
  onSaveDocument: (doc: Document) => void;
  onAddCustomer: (cust: Customer) => void;
  editingDocument?: Document | null;
  onCancel: () => void;
  initialDocType?: DocumentType | null;
  documents?: Document[];
  currentUser?: StaffUser | null;
  staffUsers?: StaffUser[];
}

function getStaffDesignation(user?: StaffUser | null, settings?: BusinessSettings): string {
  if (!user) return settings?.signatureLabel || 'Authorized Signatory';
  if (user.designation) return user.designation;
  if (user.role === 'ADMIN') return 'Managing Director & Owner';
  if (user.role === 'MANAGER') return 'Operations Manager';
  if (user.role === 'SALESMAN') return 'Senior Sales Executive';
  if (user.role === 'STAFF') return 'Store & Inventory Keeper';
  return settings?.signatureLabel || 'Authorized Signatory';
}

export default function DocumentCreator({
  products,
  customers,
  settings,
  onSaveDocument,
  onAddCustomer,
  editingDocument,
  onCancel,
  initialDocType,
  documents,
  currentUser,
  staffUsers
}: DocumentCreatorProps) {
  
  // Authorized Signatory dynamically sourced from the currently logged in user (Admin, Manager, Staff)
  const loggedInSigName = currentUser?.name || settings.signatureName || 'MD MAHI UDDIN';
  const loggedInSigLabel = currentUser ? getStaffDesignation(currentUser, settings) : (settings.signatureLabel || 'Authorized Signatory');

  // Document Type Selector
  const [docType, setDocType] = useState<DocumentType>(() => {
    if (editingDocument) return editingDocument.type;
    if (initialDocType) return initialDocType;
    return 'CHALLAN';
  });

  const [selectedChallanId, setSelectedChallanId] = useState('');
  
  // Header Meta
  const [docNumber, setDocNumber] = useState('');
  const [date, setDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<DocumentStatus>('Draft');

  // Customer Selector/Creation & Unique ID Search
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  // Check if document was already saved in database or is a new conversion from challan
  const isExistingSavedDoc = !!(editingDocument && documents?.some(d => d.id === editingDocument.id));
  const [companyIdSearch, setCompanyIdSearch] = useState('');
  const [isAddingNewCustomer, setIsAddingNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    companyId: '',
    name: '',
    company: '',
    phone: '',
    email: '',
    address: ''
  });

  // Paragraph Text States (mainly for letters/quotes)
  const [subject, setSubject] = useState('');
  const [salutation, setSalutation] = useState('Dear Sir,');
  const [openingParagraph, setOpeningParagraph] = useState('');
  const [closingParagraph, setClosingParagraph] = useState('');

  // Items table
  const [items, setItems] = useState<DocumentItem[]>([]);
  
  // Totals & Overrides
  const [vatEnabled, setVatEnabled] = useState(true);
  const [taxRate, setTaxRate] = useState(settings.taxRate);
  const [discount, setDiscount] = useState(0);
  const [hasDiscount, setHasDiscount] = useState(false);
  const [terms, setTerms] = useState(settings.terms);
  const [notes, setNotes] = useState(editingDocument?.notes || '');
  const [signatureName, setSignatureName] = useState(() => {
    return editingDocument?.signatureName || loggedInSigName;
  });
  const [signatureLabel, setSignatureLabel] = useState(() => {
    return editingDocument?.signatureLabel || loggedInSigLabel;
  });

  // Initialize or Load Edit Data
  useEffect(() => {
    if (editingDocument) {
      setDocType(editingDocument.type);
      setDocNumber(editingDocument.docNumber);
      setDate(editingDocument.date);
      setDueDate(editingDocument.dueDate || '');
      setStatus(editingDocument.status);
      setSelectedCustomerId(editingDocument.customerId);
      setSubject(editingDocument.subject || '');
      setSalutation(editingDocument.salutation || 'Dear Sir,');
      setOpeningParagraph(editingDocument.openingParagraph || '');
      setClosingParagraph(editingDocument.closingParagraph || '');
      setItems(editingDocument.items || []);
      setTaxRate(editingDocument.taxRate);
      setVatEnabled(editingDocument.vatEnabled !== false && editingDocument.vatEnabled !== 0);
      setDiscount(editingDocument.discount);
      setHasDiscount(editingDocument.discount > 0);
      setTerms(editingDocument.terms);
      setNotes(editingDocument.notes || '');
      setSignatureName(editingDocument.signatureName || loggedInSigName);
      setSignatureLabel(editingDocument.signatureLabel || loggedInSigLabel);
    } else {
      // Create New
      const targetType = initialDocType || 'CHALLAN';
      setDocType(targetType);
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      setDate(dateStr);
      setDiscount(0);
      setHasDiscount(false);
      setNotes('');
      setSignatureName(loggedInSigName);
      setSignatureLabel(loggedInSigLabel);
      
      // Default 1 month due date for invoices
      const defaultDue = new Date();
      defaultDue.setMonth(defaultDue.getMonth() + 1);
      setDueDate(defaultDue.toISOString().split('T')[0]);

      // Seed placeholders based on selected type
      updatePlaceholders(targetType, dateStr);
    }
  }, [editingDocument, initialDocType, currentUser]);

  const handleImportFromChallan = () => {
    if (!selectedChallanId) return;
    const ch = (documents || []).find(d => d.id === selectedChallanId);
    if (!ch) return;

    setSelectedCustomerId(ch.customerId);
    setSubject(`${docType === 'INVOICE' ? 'Sales Invoice' : 'Bill'} for Delivery Challan ${ch.docNumber}`);
    if (ch.terms) setTerms(ch.terms);
    setNotes(`Generated against Delivery Challan: ${ch.docNumber}`);
    
    // Populate items with prices from catalog or existing price
    const mappedItems: DocumentItem[] = ch.items.map(it => {
      const prod = products.find(p => p.id === it.productId);
      const unitPrice = it.price > 0 ? it.price : (prod?.price || 0);
      return {
        ...it,
        price: unitPrice,
        total: unitPrice * it.quantity
      };
    });
    setItems(mappedItems);
  };

  // Adjust prefixes when document type is changed (only if not editing)
  useEffect(() => {
    if (!editingDocument) {
      updatePlaceholders(docType, date);
    }
  }, [docType]);

  const updatePlaceholders = (type: DocumentType, currentDate: string) => {
    const randomId = Math.floor(1000 + Math.random() * 9000);
    const prefix = 
      type === 'OFFER_LETTER' ? settings.offerPrefix :
      type === 'QUOTATION' ? settings.quotePrefix :
      type === 'BILL' ? settings.billPrefix :
      type === 'CHALLAN' ? 'JM/CH/2026/' :
      settings.invoicePrefix;
    
    setDocNumber(`${prefix}${randomId}`);

    if (type === 'OFFER_LETTER') {
      setStatus('Active');
      setSubject('Offer Letter for Genuine Compressor Spares & Consumables');
      setOpeningParagraph('We refer to your requirement for compressed air system maintenance parts. Jubayer Machineries is highly pleased to submit our offer letter detailing our capability to supply genuine filters and service components to keep your factory running at peak efficiency.');
      setClosingParagraph('We trust that our proposal matches your machinery parameters. Looking forward to your valued work order to establish our sustainable partnership.');
    } else if (type === 'QUOTATION') {
      setStatus('Sent');
      setSubject('Quotation for Supply and Commissioning of Screw Air Compressor System');
      setOpeningParagraph('Thank you for giving us the opportunity to quote our high-performance industrial compressed air products. Below, please find our most competitive quotation for the supply, delivery, and setup of premium machinery.');
      setClosingParagraph('We hope this quotation is satisfactory and matches your budget rules. Feel free to contact our technical sales desk for any further explanations.');
    } else if (type === 'CHALLAN') {
      setStatus('Active');
      setSubject('Delivery Challan for Machinery & Spare Parts');
      setOpeningParagraph('Please receive the following genuine spare parts and equipment in good condition as per work order.');
      setClosingParagraph('Received the above goods in sound and complete condition.');
    } else if (type === 'BILL') {
      setStatus('Unpaid');
      setSubject('Sales Bill for Machinery Spares & Services');
      setOpeningParagraph('Please find our formal sales bill for the supplied equipment and genuine maintenance parts.');
      setClosingParagraph('Thank you for your business. Please arrange payment at your earliest convenience.');
    } else if (type === 'INVOICE') {
      setStatus('Unpaid');
      setSubject('Sales Invoice for Machinery & Spares');
      setOpeningParagraph('Please find our commercial sales invoice for the supplied machinery, spare parts, and associated services.');
      setClosingParagraph('Thank you for your business. Please settle the invoice as per the agreed payment terms.');
    } else {
      setStatus('Unpaid');
      setSubject('');
      setOpeningParagraph('');
      setClosingParagraph('');
    }
  };

  // Add Item Line
  const handleAddItem = (productId?: string) => {
    const newItem: DocumentItem = {
      id: `item-${Date.now()}-${Math.random()}`,
      productId: productId || '',
      name: '',
      brand: '',
      quantity: 1,
      price: 0,
      total: 0,
      unit: 'Pcs'
    };

    if (productId) {
      const p = products.find(prod => prod.id === productId);
      if (p) {
        newItem.name = p.name;
        newItem.brand = p.sku || p.brand; // Parts Number
        newItem.price = p.price;
        newItem.unit = p.unit;
        newItem.total = p.price * 1;
      }
    }

    setItems([...items, newItem]);
  };

  // Modify Item Line
  const handleItemChange = (index: number, field: keyof DocumentItem, val: any) => {
    const newItems = [...items];
    const item = { ...newItems[index] };

    if (field === 'productId') {
      const p = products.find(prod => prod.id === val);
      if (p) {
        item.productId = p.id;
        item.name = p.name;
        item.brand = p.sku || p.brand; // Parts Number
        item.price = p.price;
        item.unit = p.unit;
      } else {
        item.productId = '';
      }
    } else {
      (item as any)[field] = val;
    }

    // Recalculate line total
    if (field === 'quantity' || field === 'price' || field === 'productId') {
      item.total = item.quantity * item.price;
    }

    newItems[index] = item;
    setItems(newItems);
  };

  // Remove Item Line
  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculate Totals
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = vatEnabled ? Math.round((subtotal * taxRate) / 100) : 0;
  const total = Math.max(0, subtotal + taxAmount - discount);

  // Quick Unique Company ID Search auto-select
  const handleCompanyIdSearch = (input: string) => {
    setCompanyIdSearch(input);
    if (!input.trim()) return;

    const term = input.trim().toLowerCase();
    const matched = customers.find(c => {
      if (!c) return false;
      const compId = String(c.companyId || `COMP-${String(c.id || '').replace('cust-', '100')}`).toLowerCase();
      const cComp = String(c.company || '').toLowerCase();
      const cName = String(c.name || '').toLowerCase();
      return compId === term || 
             compId.includes(term) || 
             cComp.includes(term) ||
             cName.includes(term);
    });

    if (matched) {
      setSelectedCustomerId(matched.id);
    }
  };

  // Quick Inline Customer Addition (Fully optional inputs)
  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    const generatedCompId = newCustomer.companyId.trim() || `COMP-${1001 + customers.length}`;
    const compName = newCustomer.company.trim() || newCustomer.name.trim() || 'General Customer / Cash Client';
    const contactName = newCustomer.name.trim() || compName;
    const contactPhone = newCustomer.phone.trim() || '01700-000000';

    const created: Customer = {
      id: `cust-${Date.now()}`,
      companyId: generatedCompId,
      name: contactName,
      company: compName,
      phone: contactPhone,
      email: newCustomer.email.trim(),
      address: newCustomer.address.trim() || 'Gazipur, BD'
    };
    onAddCustomer(created);
    setSelectedCustomerId(created.id);
    setIsAddingNewCustomer(false);
    setNewCustomer({ companyId: '', name: '', company: '', phone: '', email: '', address: '' });
  };

  // Save the full document (Fallback defaults ensure work always completes smoothly)
  const handleSave = () => {
    // 1. Fallback Customer if none selected
    const cust = customers.find(c => c.id === selectedCustomerId) || {
      id: `cust-walkin-${Date.now()}`,
      companyId: 'COMP-WALKIN',
      name: 'Walk-in Client / General Customer',
      company: 'General Sales / Cash Client',
      phone: '01700-000000',
      email: '',
      address: 'Gazipur, Bangladesh'
    };

    // 2. Fallback Item line if table is empty
    let validItems = items.map(it => ({
      ...it,
      name: it.name.trim() || 'Industrial Machinery Spare Part',
      quantity: Math.max(1, it.quantity || 1),
      price: Math.max(0, it.price || 0),
      total: Math.max(1, it.quantity || 1) * Math.max(0, it.price || 0)
    }));

    if (validItems.length === 0) {
      validItems = [{
        id: `item-${Date.now()}`,
        name: 'Hitachi Compressor Genuine Spare Part',
        brand: 'Hitachi',
        quantity: 1,
        price: 1000,
        total: 1000,
        unit: 'Pcs'
      }];
    }

    const calculatedSubtotal = validItems.reduce((sum, item) => sum + item.total, 0);
    const calculatedTaxAmount = vatEnabled ? Math.round((calculatedSubtotal * taxRate) / 100) : 0;
    const calculatedTotal = Math.max(0, calculatedSubtotal + calculatedTaxAmount - discount);

    const safePaid = editingDocument?.paidAmount !== undefined 
      ? Number(editingDocument.paidAmount) 
      : (status === 'Paid' ? calculatedTotal : 0);
    const safeDue = editingDocument?.dueAmount !== undefined && (editingDocument.dueAmount > 0 || safePaid > 0)
      ? Number(editingDocument.dueAmount) 
      : (status === 'Paid' ? 0 : Math.max(0, calculatedTotal - safePaid));

    const finalStatus: DocumentStatus = status || (safeDue === 0 ? 'Paid' : (safePaid > 0 ? 'Partially Paid' : 'Unpaid'));

    const doc: Document = {
      id: editingDocument ? editingDocument.id : `doc-${Date.now()}`,
      type: docType,
      docNumber: docNumber.trim() || `JM/${docType}/2026/${Math.floor(1000 + Math.random() * 9000)}`,
      date: date || new Date().toISOString().split('T')[0],
      dueDate: (docType === 'INVOICE' || docType === 'BILL') ? (dueDate || date) : undefined,
      customerId: cust.id,
      customerName: cust.name,
      customerCompany: cust.company,
      customerPhone: cust.phone,
      customerEmail: cust.email,
      customerAddress: cust.address,
      subject: subject || undefined,
      salutation: salutation || undefined,
      openingParagraph: openingParagraph || undefined,
      closingParagraph: closingParagraph || undefined,
      items: validItems,
      subtotal: calculatedSubtotal,
      taxRate: vatEnabled ? taxRate : 0,
      taxAmount: calculatedTaxAmount,
      discount,
      total: calculatedTotal,
      paidAmount: safePaid,
      dueAmount: safeDue,
      status: finalStatus,
      terms,
      notes: notes || editingDocument?.notes,
      signatureName,
      signatureLabel,
      vatEnabled
    };

    onSaveDocument(doc);
  };

  return (
    <div className="space-y-6 text-xs">
      {/* Title block */}
      <div className="flex justify-between items-center bg-white border border-slate-200 p-4 rounded-xl shadow-2xs">
        <div className="space-y-0.5">
          <h2 className="text-base font-black font-display text-slate-900 leading-tight">
            {editingDocument ? 'Modify Existing Document' : 'Generate New Business Document'}
          </h2>
          <p className="text-slate-400 text-[11px]">Draft professional, print-ready PDFs under Jubayer Machineries.</p>
        </div>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 border border-slate-200 text-slate-600 hover:text-slate-900 font-bold uppercase rounded-lg cursor-pointer"
        >
          Cancel
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form controls (lg:col-span-8) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Main Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
            
            {/* Row 1: Doc Type, Number, Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-slate-100 pb-4">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Document Category</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as DocumentType)}
                  disabled={isExistingSavedDoc}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold text-slate-800 focus:outline-hidden cursor-pointer"
                >
                  <option value="OFFER_LETTER">Offer Letter</option>
                  <option value="QUOTATION">Quotation</option>
                  <option value="CHALLAN">Delivery Challan</option>
                  <option value="INVOICE">Sales Invoice</option>
                  <option value="BILL">Sales Bill</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Document SNo. / Reference</label>
                <input
                  type="text"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  placeholder="e.g. JM/QT/2026/001"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Workflow Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as DocumentStatus)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold text-slate-800 focus:outline-hidden cursor-pointer"
                >
                  <option value="Draft">Draft</option>
                  <option value="Sent">Sent / Published</option>
                  <option value="Active">Active / Approved</option>
                  <option value="Paid">Fully Paid</option>
                  <option value="Unpaid">Unpaid / Outstanding</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Accepted">Accepted by client</option>
                  <option value="Declined">Declined by client</option>
                </select>
              </div>
            </div>

            {/* Challan Workflow Guidance Notice */}
            {docType === 'CHALLAN' && (
              <div className="bg-blue-50/80 border border-blue-200 text-blue-900 rounded-xl p-3.5 flex items-start gap-3 animate-fade-in">
                <Truck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <span className="font-bold block">Delivery Challan:</span>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Create the Delivery Challan first when dispatching goods. <strong>Stock will not decrease when creating a challan.</strong> When the final Sales Bill or Invoice is created later from this challan, <strong>stock will automatically decrease.</strong>
                  </p>
                </div>
              </div>
            )}

            {/* Import from Existing Challan for Bill/Invoice */}
            {(docType === 'BILL' || docType === 'INVOICE') && documents && documents.some(d => d.type === 'CHALLAN') && (
              <div className="bg-emerald-50/80 border border-emerald-200 text-emerald-950 rounded-xl p-3.5 space-y-2.5 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-emerald-700" />
                    <span className="font-bold text-xs">Load Data from Existing Delivery Challan:</span>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100 px-2.5 py-0.5 rounded-full">
                    Generate {docType === 'INVOICE' ? 'Invoice' : 'Bill'} from Challan
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 items-center">
                  <select
                    value={selectedChallanId}
                    onChange={(e) => setSelectedChallanId(e.target.value)}
                    className="w-full bg-white border border-emerald-300 rounded-lg p-2 text-xs font-semibold text-slate-800 focus:outline-hidden"
                  >
                    <option value="">&mdash; Select a Delivery Challan &mdash;</option>
                    {documents.filter(d => d.type === 'CHALLAN').map(ch => (
                      <option key={ch.id} value={ch.id}>
                        [{ch.docNumber}] {ch.customerCompany || ch.customerName} &bull; Date: {ch.date} &bull; ({ch.items.length} items)
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleImportFromChallan}
                    disabled={!selectedChallanId}
                    className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs whitespace-nowrap cursor-pointer disabled:opacity-50 transition-colors shadow-2xs flex items-center justify-center gap-1.5"
                  >
                    <Package className="w-3.5 h-3.5" />
                    Import Challan Data
                  </button>
                </div>
                <p className="text-[10px] text-emerald-800 font-medium">
                  💡 Selecting a challan automatically fills customer details and items. Saving this {docType === 'INVOICE' ? 'sales invoice' : 'sales bill'} will update your inventory stock.
                </p>
              </div>
            )}

            {/* Row 2: Customer selection, Unique ID Search & creation */}
            <div className="space-y-3 border-b border-slate-100 pb-4">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                {/* Unique ID Quick Search Input */}
                <div className="sm:col-span-5 space-y-1">
                  <label className="font-bold text-slate-700 block">Search by Company ID</label>
                  <input
                    type="text"
                    placeholder="e.g. COMP-1001"
                    value={companyIdSearch}
                    onChange={(e) => handleCompanyIdSearch(e.target.value)}
                    className="w-full bg-blue-50/60 border border-blue-200 focus:bg-white rounded-lg p-2.5 font-mono font-extrabold text-blue-900 focus:outline-hidden"
                  />
                </div>

                {/* Dropdown Customer List */}
                <div className="sm:col-span-4 space-y-1">
                  <label className="font-bold text-slate-700 block">Select Client / Recipient</label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
                  >
                    <option value="">&mdash; Walk-in Client / General Customer &mdash;</option>
                    {customers.map(c => {
                      if (!c) return null;
                      const compId = c.companyId || `COMP-${String(c.id || '').replace('cust-', '100')}`;
                      return (
                        <option key={c.id} value={c.id}>
                          [{compId}] {c.company || c.name} ({c.name})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Inline Add Customer Toggle */}
                <div className="sm:col-span-3">
                  <button
                    type="button"
                    onClick={() => setIsAddingNewCustomer(!isAddingNewCustomer)}
                    className="w-full py-2.5 border border-dashed border-blue-300 hover:border-blue-900 text-blue-900 bg-blue-50/50 hover:bg-blue-50 font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    + New Customer
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Add Customer Subform (All fields optional for zero-block completion) */}
            {isAddingNewCustomer && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4 animate-slide-down">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4 text-blue-900" />
                    Register New Customer (All fields optional)
                  </h4>
                  <span className="text-[10px] text-slate-400 font-bold">You can leave any field blank</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Unique Company ID</label>
                    <input
                      type="text"
                      placeholder={`e.g. COMP-${1001 + customers.length}`}
                      value={newCustomer.companyId}
                      onChange={(e) => setNewCustomer({ ...newCustomer, companyId: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono font-bold text-blue-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Company Name (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Apex Textile Mills"
                      value={newCustomer.company}
                      onChange={(e) => setNewCustomer({ ...newCustomer, company: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Contact Person Name (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Sabbir Rahman"
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Phone Number (Optional)</label>
                    <input
                      type="tel"
                      placeholder="e.g. 01712-456789"
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Email Address (Optional)</label>
                    <input
                      type="email"
                      placeholder="e.g. purchase@apex.com"
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Delivery / Factory Address</label>
                  <textarea
                    rows={2}
                    placeholder="Konabari Industrial Area, Gazipur..."
                    value={newCustomer.address}
                    onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2"
                  />
                </div>

                <div className="flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsAddingNewCustomer(false)}
                    className="px-3.5 py-1.5 text-slate-600 font-semibold cursor-pointer"
                  >
                    Dismiss
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateCustomer}
                    className="px-4 py-1.5 bg-blue-900 text-white font-bold uppercase rounded-lg cursor-pointer"
                  >
                    Save & Assign Client
                  </button>
                </div>
              </div>
            )}

            {/* Row 3: Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-slate-100 pb-4">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Issue Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:outline-hidden"
                />
              </div>

              {/* Due Date only for invoice & bill */}
              {(docType === 'INVOICE' || docType === 'BILL') && (
                <div className="space-y-1.5 animate-fade-in">
                  <label className="font-bold text-slate-700">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:outline-hidden"
                  />
                </div>
              )}
            </div>

            {/* Letter Head Attributes (Subject, opening, closing) */}
            {(docType === 'OFFER_LETTER' || docType === 'QUOTATION') && (
              <div className="space-y-4 border-b border-slate-100 pb-4 animate-slide-down">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Subject Line</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Subject of the proposal..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:outline-hidden font-semibold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-1 space-y-1.5">
                    <label className="font-bold text-slate-700">Salutation</label>
                    <input
                      type="text"
                      value={salutation}
                      onChange={(e) => setSalutation(e.target.value)}
                      placeholder="e.g. Dear Sir,"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:outline-hidden"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="font-bold text-slate-700 font-sans">Opening Letter Paragraph</label>
                    <textarea
                      rows={2}
                      value={openingParagraph}
                      onChange={(e) => setOpeningParagraph(e.target.value)}
                      placeholder="Brief introductory note..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:bg-white focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* THE DYNAMIC SPARES & GOODS ITEMS TABLE */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold font-display text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1">
                  <Calculator className="w-4 h-4 text-blue-900" />
                  Spare Parts & Machinery Items Selection
                </h3>
                
                {/* Select from warehouse shortcut */}
                <div className="flex items-center gap-2">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddItem(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-lg font-bold text-[11px] focus:outline-hidden cursor-pointer"
                  >
                    <option value="">+ Pull From Inventory Catalog</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.brand} - {p.sku} ({p.name.slice(0, 30)}...)</option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => handleAddItem()}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold uppercase rounded-lg text-[10px] cursor-pointer"
                  >
                    + Custom Item Row
                  </button>
                </div>
              </div>

              {items.length > 0 ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-sans">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          <th className="py-2.5 px-3">Description of Goods</th>
                          <th className="py-2.5 px-3 w-32">Parts Number</th>
                          <th className="py-2.5 px-3 w-16 text-center">Qty</th>
                          <th className="py-2.5 px-3 w-16 text-center">Unit</th>
                          <th className="py-2.5 px-3 w-28 text-right">Rate (BDT)</th>
                          <th className="py-2.5 px-3 w-28 text-right">Line Total</th>
                          <th className="py-2.5 px-3 w-10 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150">
                        {items.map((item, index) => (
                          <tr key={item.id} className="hover:bg-slate-50/50">
                            {/* Name description */}
                            <td className="py-2 px-2.5">
                              <input
                                type="text"
                                placeholder="e.g. Hitachi Air Filter element"
                                value={item.name}
                                onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs font-semibold"
                                required
                              />
                            </td>

                            {/* Parts Number / Brand */}
                            <td className="py-2 px-1">
                              <input
                                type="text"
                                placeholder="Parts Number / Model"
                                value={item.brand}
                                onChange={(e) => handleItemChange(index, 'brand', e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs font-semibold font-mono"
                              />
                            </td>

                            {/* Quantity */}
                            <td className="py-2 px-1 text-center">
                              <input
                                type="number"
                                min={1}
                                value={item.quantity === 0 ? '' : item.quantity}
                                onChange={(e) => handleItemChange(index, 'quantity', e.target.value === '' ? 0 : Number(e.target.value))}
                                placeholder="1"
                                className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs font-semibold text-center"
                                required
                              />
                            </td>

                            {/* Unit */}
                            <td className="py-2 px-1 text-center">
                              <input
                                type="text"
                                placeholder="Pcs"
                                value={item.unit}
                                onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs font-semibold text-center"
                              />
                            </td>

                            {/* Rate Price */}
                            <td className="py-2 px-1 text-right">
                              <input
                                type="number"
                                min={0}
                                value={item.price === 0 ? '' : item.price}
                                onChange={(e) => handleItemChange(index, 'price', e.target.value === '' ? 0 : Number(e.target.value))}
                                placeholder="0.00"
                                className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs font-bold text-right"
                                required
                              />
                            </td>

                            {/* Total calculated display */}
                            <td className="py-2 px-2 text-right font-extrabold text-slate-900 font-display">
                              Tk. {item.total.toLocaleString()}
                            </td>

                            {/* Delete row */}
                            <td className="py-2 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(index)}
                                className="text-rose-600 hover:text-rose-800 p-1"
                                title="Remove Line"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => handleAddItem()}
                  className="border-2 border-dashed border-slate-200 hover:border-slate-400 py-10 rounded-xl text-center text-slate-400 italic cursor-pointer bg-slate-50 hover:bg-slate-100 transition-all flex flex-col items-center justify-center gap-2"
                >
                  <Plus className="w-8 h-8 text-slate-300" />
                  <span>Your document currently has no item rows. Click here to add a spare parts item row.</span>
                </div>
              )}
            </div>

            {/* Closing letter block for offer/quotes */}
            {(docType === 'OFFER_LETTER' || docType === 'QUOTATION') && (
              <div className="space-y-1.5 border-t border-slate-100 pt-4 animate-slide-down">
                <label className="font-bold text-slate-700">Closing Letter Paragraph</label>
                <textarea
                  rows={2}
                  value={closingParagraph}
                  onChange={(e) => setClosingParagraph(e.target.value)}
                  placeholder="Final greetings or call to action..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:bg-white focus:outline-hidden"
                />
              </div>
            )}
          </div>
        </div>

        {/* Right totals and final terms panel (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Financial Totals Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <h3 className="font-bold font-display text-slate-900 uppercase tracking-wider text-[11px] border-b border-slate-100 pb-2">
              Financial Summary
            </h3>

            <div className="space-y-3 font-semibold text-slate-600">
              {/* Subtotal */}
              <div className="flex justify-between">
                <span>Sub-Total amount:</span>
                <span className="text-slate-950">Tk. {subtotal.toLocaleString()}</span>
              </div>

              {/* VAT Tax Option */}
              <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={vatEnabled}
                    onChange={(e) => setVatEnabled(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-900 focus:ring-blue-900 accent-blue-900 cursor-pointer"
                  />
                  <span className="font-bold text-slate-800 text-[11px]">
                    Include VAT / Tax?
                  </span>
                </label>

                {vatEnabled ? (
                  <div className="space-y-1.5 pt-2 border-t border-slate-200/60 animate-fade-in">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-semibold text-slate-600">VAT / Tax Rate (%):</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={taxRate === 0 ? '' : taxRate}
                        onChange={(e) => setTaxRate(e.target.value === '' ? 0 : Number(e.target.value))}
                        placeholder="0"
                        className="w-16 text-right bg-white border border-slate-200 rounded p-1 font-bold text-slate-900 focus:border-blue-900 focus:outline-hidden"
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500 font-bold">
                      <span>VAT Amount:</span>
                      <span>Tk. {taxAmount.toLocaleString()}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 italic">VAT excluded from document</p>
                )}
              </div>

              {/* Special Discount Selection */}
              <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hasDiscount}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setHasDiscount(checked);
                      if (!checked) {
                        setDiscount(0);
                      }
                    }}
                    className="w-4 h-4 rounded border-slate-300 text-blue-900 focus:ring-blue-900 accent-blue-900 cursor-pointer"
                  />
                  <span className="font-bold text-slate-800 text-[11px]">
                    Apply Discount?
                  </span>
                </label>

                {hasDiscount && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-200/60 animate-fade-in">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-semibold text-slate-600">Flat Discount (BDT):</span>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs font-mono">Tk. </span>
                        <input
                          type="number"
                          min={0}
                          value={discount || ''}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setDiscount(val >= 0 ? val : 0);
                          }}
                          className="w-24 text-right bg-white border border-slate-200 rounded p-1 pl-5 font-bold text-slate-900 focus:border-blue-900 focus:outline-hidden text-xs"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Total Payable BDT */}
              <div className="flex justify-between text-slate-900 font-extrabold text-sm border-t border-slate-200 pt-3">
                <span>Total Payable (BDT):</span>
                <span className="text-base text-blue-950 font-display">Tk. {total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Terms, Conditions & Signature Cards */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <h3 className="font-bold font-display text-slate-900 uppercase tracking-wider text-[11px] border-b border-slate-100 pb-2">
              Document Terms & Signatures
            </h3>

            {/* Terms and conditions block */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Terms & Conditions of Supply</label>
              <textarea
                rows={4}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="Specify delivery, warranty, payments, etc..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:bg-white focus:outline-hidden font-mono text-[10px] leading-relaxed"
              />
            </div>

            {/* Signature name & designation */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Authorized Signatory (স্বাক্ষরকারী):
                </span>
                {currentUser && (
                  <span className="text-[9.5px] font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-blue-700" />
                    Active: {currentUser.name}
                  </span>
                )}
              </div>

              {/* Quick Select Signatory Account */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Quick Select Signatory (অ্যাকাউন্ট অনুযায়ী নির্বাচন)</label>
                <select
                  value={staffUsers?.find(s => s.name === signatureName)?.id || (currentUser?.name === signatureName ? currentUser?.id : 'custom')}
                  onChange={(e) => {
                    const staffId = e.target.value;
                    if (staffId === 'custom') return;
                    const staff = staffUsers?.find(s => s.id === staffId);
                    if (staff) {
                      setSignatureName(staff.name);
                      setSignatureLabel(getStaffDesignation(staff, settings));
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold focus:bg-white text-slate-900 text-xs cursor-pointer"
                >
                  {currentUser && (
                    <option value={currentUser.id}>
                      👤 Current Login: {currentUser.name} ({getStaffDesignation(currentUser, settings)})
                    </option>
                  )}
                  {staffUsers && staffUsers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {getStaffDesignation(s, settings)} ({s.role})
                    </option>
                  ))}
                  <option value="custom">✏️ Custom Signatory Name & Designation</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Authorized Signature Name (অনুমোদনকারীর নাম)</label>
                <input
                  type="text"
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 font-bold focus:bg-white focus:outline-hidden text-slate-900"
                />
              </div>

              {/* Signature designation */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Designation / Role Title (পদবি)</label>
                <input
                  type="text"
                  value={signatureLabel}
                  onChange={(e) => setSignatureLabel(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 font-bold focus:bg-white focus:outline-hidden text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Final Action triggers */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleSave}
              className="w-full py-3.5 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="w-4.5 h-4.5" />
              Save Document Record
            </button>
            
            <button
              type="button"
              onClick={onCancel}
              className="w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold uppercase rounded-xl transition-colors cursor-pointer text-center"
            >
              Cancel changes
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
