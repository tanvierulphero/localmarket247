import { useState, useMemo, Fragment } from 'react';
import { Document, Customer, DocumentStatus, BusinessSettings, StaffUser, Supplier, Purchase } from '../types';
import Logo from './Logo';
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
  Printer,
  FileSpreadsheet,
  Download,
  Coins,
  Building2,
  Phone,
  MessageSquare,
  Share2,
  Copy,
  Check,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Filter,
  Layers,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Receipt,
  Scale
} from 'lucide-react';

interface DueLedgerProps {
  documents: Document[];
  customers: Customer[];
  suppliers?: Supplier[];
  purchases?: Purchase[];
  settings?: BusinessSettings;
  currentUser?: StaffUser | null;
  onUpdateDocument: (doc: Document) => void;
  onBatchUpdateDocuments?: (docs: Document[]) => void;
  onSavePurchase?: (purchase: Purchase, updateStock: boolean) => Promise<void>;
  onViewDocument: (doc: Document) => void;
}

// Helper: Compute real, reliable document accounting figures
export function getDocFinancials(doc: Document) {
  if (!doc) return { total: 0, paid: 0, due: 0 };
  const total = Math.max(0, Number(doc.total) || 0);
  
  let paid = typeof doc.paidAmount === 'number' && !isNaN(doc.paidAmount)
    ? Math.max(0, doc.paidAmount)
    : (doc.status === 'Paid' ? total : 0);

  // Reconcile with parsed payment log from notes if notes exist and contain payments
  if (doc.notes && doc.notes.includes('[')) {
    const bracketRegex = /\[(?:Payment|Company Due|Customer Due|Due|Collection|Cleared|Received)[^\]]*:([^\]]+)\]/gi;
    let match;
    let sumParsedFromNotes = 0;
    while ((match = bracketRegex.exec(doc.notes)) !== null) {
      const amtMatch = match[1].match(/Tk\.?\s*([\d,]+)/i);
      if (amtMatch) {
        sumParsedFromNotes += parseInt(amtMatch[1].replace(/,/g, ''), 10) || 0;
      }
    }
    if (sumParsedFromNotes > paid) {
      paid = sumParsedFromNotes;
    }
  }

  let due = Math.max(0, total - paid);

  // Delivery Challan: payment is strictly optional. If not marked Paid, it does not force an overdue debt.
  if (doc.type === 'CHALLAN' && doc.status !== 'Paid' && (!doc.paidAmount || Number(doc.paidAmount) === 0)) {
    due = 0;
  }

  return { total, paid, due };
}

// Helper: Parse notes to extract payment transactions dynamically for reprinting later
function parsePaymentsFromDoc(doc: Document) {
  if (!doc) return [];
  const results: {
    id: string;
    receiptNo: string;
    date: string;
    amount: number;
    discount?: number;
    paymentMethod: string;
    notes: string;
    references: string;
    remainingDue: number;
    customerName: string;
    customerCompany: string;
    customerPhone: string;
  }[] = [];

  const { total, paid, due } = getDocFinancials(doc);
  const notesText = doc.notes || '';

  // Match any bracketed payment receipt note
  const bracketRegex = /\[(?:Payment Received|Company Due Received|Customer Due Received|Due Collected|Payment Cleared):([^\]]+)\]/gi;
  let match;
  while ((match = bracketRegex.exec(notesText)) !== null) {
    const body = match[1];

    const amtMatch = body.match(/Tk\.?\s*([\d,]+)/i);
    const amount = amtMatch ? parseInt(amtMatch[1].replace(/,/g, ''), 10) : 0;

    const discMatch = body.match(/\(Discount:\s*Tk\.?\s*([\d,]+)\)/i);
    const discount = discMatch ? parseInt(discMatch[1].replace(/,/g, ''), 10) : 0;

    if (amount <= 0 && discount <= 0) continue;

    // Date extraction: search for valid YYYY-MM-DD
    const dateMatch = body.match(/\b(\d{4}-\d{2}-\d{2})\b/);
    const date = dateMatch ? dateMatch[1] : (doc.date || new Date().toISOString().split('T')[0]);

    // Payment method extraction
    let paymentMethod = 'Cash';
    const methodMatch = body.match(/via\s+([A-Za-z0-9\s\/]+?)(?=\s+on\s+|\s*-\s*|$)/i);
    if (methodMatch && methodMatch[1].trim()) {
      paymentMethod = methodMatch[1].trim();
    } else if (/Cheque/i.test(body)) {
      paymentMethod = 'Cheque';
    } else if (/Bank/i.test(body)) {
      paymentMethod = 'Bank Transfer';
    } else if (/bKash|Nagad/i.test(body)) {
      paymentMethod = 'bKash / Nagad';
    }

    // Reference / Receipt No extraction
    let receiptNo = `MR-${date.replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const refMatch = body.match(/Ref:\s*([A-Za-z0-9_-]+)/i);
    if (refMatch) {
      receiptNo = refMatch[1];
    }

    // Clean up memo note text
    let cleanNote = body;
    const splitIndex = cleanNote.indexOf('-');
    if (splitIndex !== -1) {
      cleanNote = cleanNote.slice(splitIndex + 1);
    }
    cleanNote = cleanNote.replace(/Ref:\s*[A-Za-z0-9_-]+/gi, '').replace(/RefNo:\s*[A-Za-z0-9_-]+/gi, '').replace(/[-:]+$/g, '').trim();

    results.push({
      id: `${doc.id}-p-${match.index}`,
      receiptNo,
      date,
      amount,
      discount,
      paymentMethod: paymentMethod || 'Cash',
      notes: cleanNote || 'Due Payment Received',
      references: `${doc.type} #${doc.docNumber}`,
      remainingDue: due,
      customerName: doc.customerName,
      customerCompany: doc.customerCompany || '',
      customerPhone: doc.customerPhone || ''
    });
  }

  // AUDIT RECONCILIATION: Ensure sum of parsed payments equals total recorded doc.paidAmount!
  const sumParsedPayments = results.reduce((sum, p) => sum + p.amount, 0);
  if (paid > sumParsedPayments) {
    const unloggedPaid = paid - sumParsedPayments;
    results.unshift({
      id: `${doc.id}-initial-advance`,
      receiptNo: `MR-${(doc.date || '2026-01-01').replace(/-/g, '')}-${doc.docNumber.replace(/[^0-9]/g, '').slice(-4) || '1001'}`,
      date: doc.date || new Date().toISOString().split('T')[0],
      amount: unloggedPaid,
      paymentMethod: 'Direct Payment / Advance',
      notes: 'Initial payment recorded at document creation',
      references: `${doc.type} #${doc.docNumber}`,
      remainingDue: due,
      customerName: doc.customerName,
      customerCompany: doc.customerCompany || '',
      customerPhone: doc.customerPhone || ''
    });
  }

  return results;
}

// Helper: Generate chronological step-by-step payment breakdown ledger for individual customer statement
function generateCustomerLedgerTransactions(
  item: { customer: Customer; documents: Document[] },
  startDate?: string,
  endDate?: string
) {
  const transactions: {
    id: string;
    date: string;
    refNo: string;
    type: 'INVOICE' | 'PAYMENT' | 'DISCOUNT';
    particulars: string;
    billed: number;
    paid: number;
    discount?: number;
    paymentMethod?: string;
  }[] = [];

  item.documents.forEach(doc => {
    // Only commercial invoices / bills create debt transactions!
    // Delivery Challans are goods delivery notes and do not force an unbilled debt.
    if (doc.type === 'CHALLAN' && doc.status !== 'Paid' && (!doc.paidAmount || doc.paidAmount === 0)) {
      return;
    }

    const { total } = getDocFinancials(doc);

    // Itemized goods / services description without bill number
    let cleanSubject = doc.subject || '';
    cleanSubject = cleanSubject
      .replace(/against\s+Delivery\s+Challan:?\s*[A-Za-z0-9_\-\/]+/gi, '')
      .replace(/against\s+Challan:?\s*[A-Za-z0-9_\-\/]+/gi, '')
      .replace(/against\s+Bill:?\s*[A-Za-z0-9_\-\/]+/gi, '')
      .replace(/against\s+Invoice:?\s*[A-Za-z0-9_\-\/]+/gi, '')
      .replace(new RegExp(doc.docNumber.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '')
      .replace(/#\s*[A-Za-z0-9_\-\/]+/g, '')
      .trim();

    const itemsDescription = doc.items && doc.items.length > 0
      ? doc.items.map(i => i.name).filter(Boolean).join(', ')
      : (cleanSubject || 'Spare Parts & Services Supply');

    // 1. Add Billed document entry
    transactions.push({
      id: `bill-${doc.id}`,
      date: doc.date,
      refNo: doc.docNumber,
      type: 'INVOICE',
      particulars: itemsDescription,
      billed: total,
      paid: 0
    });

    // 2. Parse payment log entries from doc.notes
    const parsedPayments = parsePaymentsFromDoc(doc);
    parsedPayments.forEach((p, idx) => {
      const cleanNote = p.notes && !p.notes.includes(doc.docNumber) && !p.notes.includes('Payment against') && !p.notes.includes('Invoice Due Collection')
        ? ` (${p.notes})`
        : '';

      transactions.push({
        id: `pay-${doc.id}-${idx}`,
        date: p.date,
        refNo: p.receiptNo,
        type: 'PAYMENT',
        particulars: `Payment Received via ${p.paymentMethod}${p.discount ? ` [Discount: Tk. ${p.discount.toLocaleString()}]` : ''}${cleanNote}`,
        billed: 0,
        paid: p.amount,
        discount: p.discount || 0,
        paymentMethod: p.paymentMethod
      });
    });
  });

  // Sort chronologically ascending by date
  transactions.sort((a, b) => {
    const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
    if (diff !== 0 && !isNaN(diff)) return diff;
    if (a.type === 'INVOICE' && b.type !== 'INVOICE') return -1;
    if (a.type !== 'INVOICE' && b.type === 'INVOICE') return 1;
    return 0;
  });

  // Calculate opening balance if filtered by start date
  let openingBalance = 0;
  const filteredTransactions: typeof transactions = [];

  transactions.forEach(t => {
    const tDate = t.date;
    const isBeforeStart = startDate && tDate < startDate;
    const isAfterEnd = endDate && tDate > endDate;

    if (isBeforeStart) {
      openingBalance = openingBalance + t.billed - t.paid - (t.discount || 0);
    } else if (!isAfterEnd) {
      filteredTransactions.push(t);
    }
  });

  let runningDue = Math.max(0, openingBalance);
  const ledgerWithBalance = filteredTransactions.map(t => {
    runningDue = runningDue + t.billed - t.paid - (t.discount || 0);
    return {
      ...t,
      runningDue: Math.max(0, runningDue)
    };
  });

  return {
    openingBalance: Math.max(0, openingBalance),
    transactions: ledgerWithBalance
  };
}

// Helper: Download CSV statement for individual customer
function downloadCustomerStatementCSV(
  customer: Customer, 
  transactions: { date: string; refNo: string; particulars: string; billed: number; paid: number; runningDue: number }[],
  totals: { invoiced: number; paid: number; due: number; openingBalance?: number }
) {
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += `Customer Statement / Due Report - ${customer.company || customer.name}\n`;
  csvContent += `Company Name,${customer.company || 'N/A'}\n`;
  csvContent += `Attn Name,${customer.name}\n`;
  csvContent += `Phone,${customer.phone}\n`;
  if (totals.openingBalance !== undefined) {
    csvContent += `Opening Balance (BDT),${totals.openingBalance}\n`;
  }
  csvContent += `Total Billed (BDT),${totals.invoiced}\n`;
  csvContent += `Total Paid (BDT),${totals.paid}\n`;
  csvContent += `Current Net Outstanding Due (BDT),${totals.due}\n\n`;

  csvContent += "Date,Ref / Memo No,Particulars / Description,Billed Amount (BDT),Paid Amount (BDT),Running Balance Due (BDT)\n";

  transactions.forEach(t => {
    csvContent += `"${t.date}","${t.refNo}","${t.particulars.replace(/"/g, '""')}",${t.billed},${t.paid},${t.runningDue}\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `Statement-${String(customer.company || customer.name || 'Customer').replace(/\s+/g, '_')}-${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Helper: Generate WhatsApp Reminder message
function getWhatsAppReminderText(customerName: string, companyName: string, dueAmount: number, settingsName: string, hotline: string) {
  return `Dear ${customerName}${companyName ? ` (${companyName})` : ''},
Greetings.
Your current outstanding balance with ${settingsName || 'Jubayer Machineries'} is Tk. ${dueAmount.toLocaleString()}.
Kindly arrange the payment at your earliest convenience.
For queries or details, please contact: ${hotline || '01715-994956'}.
Thank you.`;
}

export default function DueLedger({ 
  documents, 
  customers, 
  suppliers = [],
  purchases = [],
  settings, 
  currentUser, 
  onUpdateDocument, 
  onBatchUpdateDocuments, 
  onSavePurchase,
  onViewDocument 
}: DueLedgerProps) {
  // Main Tab: "customers" (Accounts Receivable) vs "suppliers" (Accounts Payable)
  const [mainTab, setMainTab] = useState<'customers' | 'suppliers'>('customers');
  
  // Customer Sub-tabs: "ledger" (Customer Accounts) | "invoices" (Due Documents) | "aging" (Due Aging Analysis)
  const [customerSubTab, setCustomerSubTab] = useState<'ledger' | 'invoices' | 'aging'>('ledger');
  
  // Supplier Sub-tabs: "ledger" (Supplier Accounts) | "purchases" (Due Purchases)
  const [supplierSubTab, setSupplierSubTab] = useState<'ledger' | 'purchases'>('ledger');

  // Customer Filter & Search States
  const [customerSearch, setCustomerSearch] = useState('');
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [customerStatusFilter, setCustomerStatusFilter] = useState<'ALL' | 'DUE' | 'OVERDUE' | 'CLEARED'>('DUE');
  const [customerSortBy, setCustomerSortBy] = useState<'DUE_DESC' | 'DUE_ASC' | 'NAME_ASC' | 'BILLED_DESC'>('DUE_DESC');
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);

  // Supplier Filter & Search States
  const [supplierSearch, setSupplierSearch] = useState('');
  const [purchaseSearch, setPurchaseSearch] = useState('');
  const [supplierStatusFilter, setSupplierStatusFilter] = useState<'ALL' | 'DUE' | 'CLEARED'>('DUE');
  
  // Copied reminder toast state
  const [copiedReminderId, setCopiedReminderId] = useState<string | null>(null);

  // Single Document Payment Collection Modal State
  const [collectingDoc, setCollectingDoc] = useState<Document | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [discountWaiver, setDiscountWaiver] = useState<number>(0);
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentReferenceNo, setPaymentReferenceNo] = useState('');
  const [singlePaymentMethod, setSinglePaymentMethod] = useState<'Cash' | 'Bank Transfer' | 'bKash/Nagad' | 'Cheque'>('Cash');
  const [singlePaymentDate, setSinglePaymentDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Company-Level Total Due Payment Modal State
  const [collectingCompany, setCollectingCompany] = useState<{
    customer: Customer;
    totalDue: number;
    documents: Document[];
  } | null>(null);
  const [companyPayAmount, setCompanyPayAmount] = useState<number>(0);
  const [companyDiscountWaiver, setCompanyDiscountWaiver] = useState<number>(0);
  const [companyPayMethod, setCompanyPayMethod] = useState<'Cash' | 'Bank Transfer' | 'bKash/Nagad' | 'Cheque'>('Bank Transfer');
  const [companyPayDate, setCompanyPayDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [companyPayNotes, setCompanyPayNotes] = useState('');
  const [companyPayRefNo, setCompanyPayRefNo] = useState('');

  // Supplier Due Payment Modal State
  const [payingSupplier, setPayingSupplier] = useState<{
    supplier: Supplier;
    totalDue: number;
    purchases: Purchase[];
  } | null>(null);
  const [supplierPayAmount, setSupplierPayAmount] = useState<number>(0);
  const [supplierPayMethod, setSupplierPayMethod] = useState<'Cash' | 'Bank Transfer' | 'bKash/Nagad' | 'Cheque'>('Bank Transfer');
  const [supplierPayDate, setSupplierPayDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [supplierPayNotes, setSupplierPayNotes] = useState('');
  const [supplierPayRefNo, setSupplierPayRefNo] = useState('');

  // Individual Customer Due Statement / Report Modal State
  const [viewingCustomerReport, setViewingCustomerReport] = useState<{
    customer: Customer;
    invoiced: number;
    paid: number;
    due: number;
    documents: Document[];
  } | null>(null);
  const [statementDateFilter, setStatementDateFilter] = useState<'all' | 'this_month' | 'last_30' | 'this_year' | 'custom'>('all');
  const [statementStartDate, setStatementStartDate] = useState('');
  const [statementEndDate, setStatementEndDate] = useState('');

  // Individual Supplier Statement Modal State
  const [viewingSupplierReport, setViewingSupplierReport] = useState<{
    supplier: Supplier;
    totalPurchased: number;
    totalPaid: number;
    due: number;
    purchases: Purchase[];
  } | null>(null);

  // Money Receipt (Print / View) Modal State
  const [recentReceipt, setRecentReceipt] = useState<{
    receiptNo: string;
    date: string;
    customerName: string;
    customerCompany: string;
    customerPhone: string;
    amount: number;
    discount?: number;
    paymentMethod: string;
    referenceNo?: string;
    notes: string;
    references: string;
    remainingDue: number;
  } | null>(null);

  // Supplier Payment Voucher Modal State
  const [recentVoucher, setRecentVoucher] = useState<{
    voucherNo: string;
    date: string;
    supplierName: string;
    supplierCompany: string;
    supplierPhone: string;
    amount: number;
    paymentMethod: string;
    referenceNo?: string;
    notes: string;
    references: string;
    remainingDue: number;
  } | null>(null);

  // 1. Filter only relevant financial documents
  const financialDocs = useMemo(() => {
    return (documents || []).filter(doc => 
      doc && (doc.type === 'INVOICE' || doc.type === 'BILL' || (doc.type === 'CHALLAN' && (doc.status === 'Paid' || Number(doc.paidAmount) > 0)) || (Number(doc.total) > 0 && doc.type !== 'QUOTATION' && doc.type !== 'OFFER_LETTER' && doc.type !== 'CHALLAN'))
    );
  }, [documents]);

  // High-level Customer Receivables Stats
  const totalInvoiced = useMemo(() => financialDocs.reduce((sum, doc) => sum + getDocFinancials(doc).total, 0), [financialDocs]);
  const totalPaid = useMemo(() => financialDocs.reduce((sum, doc) => sum + getDocFinancials(doc).paid, 0), [financialDocs]);
  const totalOutstanding = useMemo(() => financialDocs.reduce((sum, doc) => sum + getDocFinancials(doc).due, 0), [financialDocs]);

  const overdueDocs = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return financialDocs.filter(doc => {
      const { due } = getDocFinancials(doc);
      if (due <= 0) return false;
      if (doc.status === 'Overdue') return true;
      if (doc.dueDate && doc.dueDate < today) return true;
      return false;
    });
  }, [financialDocs]);

  const overdueOutstanding = useMemo(() => {
    return overdueDocs.reduce((sum, doc) => sum + getDocFinancials(doc).due, 0);
  }, [overdueDocs]);

  // Consolidate customer entities
  const allCustomerEntities: Customer[] = useMemo(() => {
    const list: Customer[] = [...(customers || [])];
    const registeredIds = new Set(list.map(c => String(c.id || '').trim()));
    const registeredComps = new Set(list.map(c => String(c.company || '').trim().toLowerCase()).filter(Boolean));
    const registeredNames = new Set(list.map(c => String(c.name || '').trim().toLowerCase()).filter(Boolean));

    financialDocs.forEach(d => {
      const dId = String(d.customerId || '').trim();
      const dComp = String(d.customerCompany || '').trim();
      const dName = String(d.customerName || dComp || 'Valued Client').trim();
      const compLower = dComp.toLowerCase();
      const nameLower = dName.toLowerCase();

      const isKnown = (dId && registeredIds.has(dId)) || 
                      (compLower && registeredComps.has(compLower)) || 
                      (nameLower && registeredNames.has(nameLower));

      if (!isKnown) {
        if (dId) registeredIds.add(dId);
        if (compLower) registeredComps.add(compLower);
        if (nameLower) registeredNames.add(nameLower);

        list.push({
          id: dId || `cust-auto-${Math.random().toString(36).substring(2, 9)}`,
          companyId: `COMP-${Math.floor(1000 + Math.random() * 9000)}`,
          name: dName,
          company: dComp || dName,
          phone: d.customerPhone || 'N/A',
          email: d.customerEmail || '',
          address: d.customerAddress || 'Gazipur, BD',
        });
      }
    });

    return list;
  }, [customers, financialDocs]);

  // Group customer ledger summaries
  const customerLedger = useMemo(() => {
    return allCustomerEntities.map(cust => {
      if (!cust) return null;
      const targetId = String(cust.id || '');
      const targetPhone = String(cust.phone || '').trim().replace(/[^0-9]/g, '');
      const targetComp = String(cust.company || '').trim().toLowerCase();
      const targetName = String(cust.name || '').trim().toLowerCase();

      const custDocs = financialDocs.filter(d => {
        if (!d) return false;
        // Strict match if document has customerId (prevents dues leaking to other companies)
        if (d.customerId) {
          return String(d.customerId) === targetId;
        }
        // Fallback ONLY for legacy documents without any customerId
        const dPhone = String(d.customerPhone || '').trim().replace(/[^0-9]/g, '');
        if (targetPhone && targetPhone !== '01700000000' && targetPhone.length >= 10 && dPhone && dPhone === targetPhone) return true;
        const dComp = String(d.customerCompany || '').trim().toLowerCase();
        if (targetComp && targetComp.length > 2 && dComp && dComp === targetComp && targetComp !== 'general sales / cash client' && targetComp !== 'walk-in client') return true;
        return false;
      });
      
      const invoiced = custDocs.reduce((sum, d) => sum + getDocFinancials(d).total, 0);
      const paid = custDocs.reduce((sum, d) => sum + getDocFinancials(d).paid, 0);
      const due = custDocs.reduce((sum, d) => sum + getDocFinancials(d).due, 0);
      
      const today = new Date().toISOString().split('T')[0];
      const overdueCount = custDocs.filter(d => {
        const dFinancials = getDocFinancials(d);
        if (dFinancials.due <= 0) return false;
        return d.status === 'Overdue' || (d.dueDate && d.dueDate < today);
      }).length;

      return {
        customer: cust,
        invoiced,
        paid,
        due,
        overdueCount,
        documents: custDocs
      };
    }).filter((item): item is NonNullable<typeof item> => item !== null && (item.invoiced > 0 || item.due > 0));
  }, [allCustomerEntities, financialDocs]);

  // Filtered & Sorted Customer Ledger
  const filteredCustomerLedger = useMemo(() => {
    let result = customerLedger.filter(item => {
      const term = customerSearch.toLowerCase();
      const matchesSearch = (
        item.customer.name.toLowerCase().includes(term) ||
        item.customer.company.toLowerCase().includes(term) ||
        item.customer.phone.includes(term) ||
        (item.customer.companyId && item.customer.companyId.toLowerCase().includes(term))
      );

      if (!matchesSearch) return false;

      if (customerStatusFilter === 'DUE') return item.due > 0;
      if (customerStatusFilter === 'OVERDUE') return item.overdueCount > 0;
      if (customerStatusFilter === 'CLEARED') return item.due === 0 && item.invoiced > 0;
      return true;
    });

    result.sort((a, b) => {
      if (customerSortBy === 'DUE_DESC') return b.due - a.due;
      if (customerSortBy === 'DUE_ASC') return a.due - b.due;
      if (customerSortBy === 'BILLED_DESC') return b.invoiced - a.invoiced;
      if (customerSortBy === 'NAME_ASC') return (a.customer.company || a.customer.name).localeCompare(b.customer.company || b.customer.name);
      return 0;
    });

    return result;
  }, [customerLedger, customerSearch, customerStatusFilter, customerSortBy]);

  // Filtered Invoices List
  const filteredInvoices = useMemo(() => {
    return financialDocs.filter(doc => {
      const term = invoiceSearch.toLowerCase();
      return (
        doc.docNumber.toLowerCase().includes(term) ||
        doc.customerName.toLowerCase().includes(term) ||
        (doc.customerCompany && doc.customerCompany.toLowerCase().includes(term)) ||
        (doc.customerPhone && doc.customerPhone.includes(term))
      );
    });
  }, [financialDocs, invoiceSearch]);

  // Due Aging Analysis calculations (0-30, 31-60, 61-90, 90+ days)
  const agingData = useMemo(() => {
    const today = new Date();
    const buckets = {
      current: { label: '0 - 30 Days (Current)', min: 0, max: 30, count: 0, amount: 0, docs: [] as Document[] },
      days31_60: { label: '31 - 60 Days (Follow-up)', min: 31, max: 60, count: 0, amount: 0, docs: [] as Document[] },
      days61_90: { label: '61 - 90 Days (Overdue Alert)', min: 61, max: 90, count: 0, amount: 0, docs: [] as Document[] },
      over90: { label: '90+ Days (Critical Recovery)', min: 91, max: 9999, count: 0, amount: 0, docs: [] as Document[] }
    };

    financialDocs.forEach(doc => {
      const { due } = getDocFinancials(doc);
      if (due <= 0) return;

      const issueDate = new Date(doc.date || today);
      const diffTime = Math.abs(today.getTime() - issueDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 30) {
        buckets.current.count += 1;
        buckets.current.amount += due;
        buckets.current.docs.push(doc);
      } else if (diffDays <= 60) {
        buckets.days31_60.count += 1;
        buckets.days31_60.amount += due;
        buckets.days31_60.docs.push(doc);
      } else if (diffDays <= 90) {
        buckets.days61_90.count += 1;
        buckets.days61_90.amount += due;
        buckets.days61_90.docs.push(doc);
      } else {
        buckets.over90.count += 1;
        buckets.over90.amount += due;
        buckets.over90.docs.push(doc);
      }
    });

    return buckets;
  }, [financialDocs]);

  // 2. High-level Supplier Payables Stats
  const totalPurchaseValue = useMemo(() => purchases.reduce((sum, p) => sum + (p.grandTotal || 0), 0), [purchases]);
  const totalPaidToSuppliers = useMemo(() => purchases.reduce((sum, p) => sum + (p.paidAmount || 0), 0), [purchases]);
  const totalSupplierPayableDue = useMemo(() => purchases.reduce((sum, p) => sum + (p.dueAmount || 0), 0), [purchases]);

  // Consolidate Supplier Ledger
  const supplierLedger = useMemo(() => {
    const list: Supplier[] = [...suppliers];
    const registeredIds = new Set(list.map(s => String(s.id || '').trim()));
    const registeredComps = new Set(list.map(s => String(s.company || '').trim().toLowerCase()).filter(Boolean));

    purchases.forEach(p => {
      const pId = String(p.supplierId || '').trim();
      const pComp = String(p.supplierCompany || p.supplierName || '').trim();
      const isKnown = (pId && registeredIds.has(pId)) || (pComp && registeredComps.has(pComp.toLowerCase()));

      if (!isKnown && pComp) {
        if (pId) registeredIds.add(pId);
        registeredComps.add(pComp.toLowerCase());
        list.push({
          id: pId || `sup-auto-${Math.random().toString(36).substring(2, 9)}`,
          supplierId: `SUP-${Math.floor(1000 + Math.random() * 9000)}`,
          name: p.supplierName,
          company: p.supplierCompany || p.supplierName,
          phone: p.supplierPhone || 'N/A',
          email: p.supplierEmail || '',
          address: p.supplierAddress || 'Dhaka, BD',
        });
      }
    });

    return list.map(sup => {
      const supPurchases = purchases.filter(p => 
        (p.supplierId && p.supplierId === sup.id) ||
        (p.supplierCompany && p.supplierCompany.toLowerCase() === sup.company.toLowerCase()) ||
        (p.supplierName && p.supplierName.toLowerCase() === sup.name.toLowerCase())
      );

      const totalPurchased = supPurchases.reduce((sum, p) => sum + (p.grandTotal || 0), 0);
      const totalPaid = supPurchases.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
      const due = supPurchases.reduce((sum, p) => sum + (p.dueAmount || 0), 0);

      return {
        supplier: sup,
        totalPurchased,
        totalPaid,
        due,
        purchases: supPurchases
      };
    }).filter(item => item.totalPurchased > 0 || item.due > 0);
  }, [suppliers, purchases]);

  const filteredSupplierLedger = useMemo(() => {
    return supplierLedger.filter(item => {
      const term = supplierSearch.toLowerCase();
      const matchesSearch = (
        item.supplier.name.toLowerCase().includes(term) ||
        item.supplier.company.toLowerCase().includes(term) ||
        item.supplier.phone.includes(term)
      );

      if (!matchesSearch) return false;
      if (supplierStatusFilter === 'DUE') return item.due > 0;
      if (supplierStatusFilter === 'CLEARED') return item.due === 0 && item.totalPurchased > 0;
      return true;
    });
  }, [supplierLedger, supplierSearch, supplierStatusFilter]);

  const filteredPurchasesList = useMemo(() => {
    return purchases.filter(p => {
      const term = purchaseSearch.toLowerCase();
      return (
        p.purchaseNumber.toLowerCase().includes(term) ||
        p.supplierName.toLowerCase().includes(term) ||
        (p.supplierCompany && p.supplierCompany.toLowerCase().includes(term)) ||
        (p.supplierInvoiceNo && p.supplierInvoiceNo.toLowerCase().includes(term))
      );
    });
  }, [purchases, purchaseSearch]);

  // Single Document Payment Submission - supports collecting payment as many times as desired
  const handleCollectPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectingDoc || (paymentAmount <= 0 && discountWaiver <= 0)) return;

    const { total, paid: currentPaid, due: currentDue } = getDocFinancials(collectingDoc);
    const safePayAmount = Math.max(0, paymentAmount);
    const safeDiscount = Math.min(Math.max(0, currentDue - safePayAmount), discountWaiver);
    const totalDeducted = safePayAmount + safeDiscount;
    const newPaid = currentPaid + safePayAmount;
    const newDue = Math.max(0, currentDue - totalDeducted);

    let newStatus: DocumentStatus = 'Partially Paid';
    if (newDue === 0) {
      newStatus = 'Paid';
    } else if (newPaid === 0) {
      newStatus = 'Unpaid';
    }

    const receiptNo = `MR-${singlePaymentDate.replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    let updatedNotes = collectingDoc.notes || '';
    const discountNote = safeDiscount > 0 ? ` (Discount: Tk. ${safeDiscount.toLocaleString()})` : '';
    const noteMemo = `\n[Payment Received: Tk. ${safePayAmount.toLocaleString()}${discountNote} on ${singlePaymentDate} via ${singlePaymentMethod} - ${paymentNotes.trim() || 'Due Payment'}${paymentReferenceNo ? ` - RefNo: ${paymentReferenceNo}` : ''} - Ref: ${receiptNo}]`;
    updatedNotes += noteMemo;

    const updatedDoc: Document = {
      ...collectingDoc,
      total,
      paidAmount: newPaid,
      dueAmount: newDue,
      status: newStatus,
      notes: updatedNotes
    };

    onUpdateDocument(updatedDoc);

    // Create printable receipt immediately
    setRecentReceipt({
      receiptNo,
      date: singlePaymentDate,
      customerName: collectingDoc.customerName,
      customerCompany: collectingDoc.customerCompany || '',
      customerPhone: collectingDoc.customerPhone || '',
      amount: safePayAmount,
      discount: safeDiscount,
      paymentMethod: singlePaymentMethod,
      referenceNo: paymentReferenceNo,
      notes: paymentNotes || 'Invoice Due Collection Receipt',
      references: `${collectingDoc.type} #${collectingDoc.docNumber}`,
      remainingDue: newDue
    });

    setCollectingDoc(null);
    setPaymentAmount(0);
    setDiscountWaiver(0);
    setPaymentNotes('');
    setPaymentReferenceNo('');
  };

  // Open Company Total Payment modal - can be opened anytime for any customer
  const handleOpenCompanyPay = (item: { customer: Customer; due: number; documents: Document[] }) => {
    setCollectingCompany({
      customer: item.customer,
      totalDue: Math.max(0, item.due),
      documents: item.documents
    });
    setCompanyPayAmount(item.due > 0 ? item.due : 0);
    setCompanyDiscountWaiver(0);
    setCompanyPayMethod('Bank Transfer');
    setCompanyPayDate(new Date().toISOString().split('T')[0]);
    setCompanyPayNotes('');
    setCompanyPayRefNo('');
  };

  // Company Consolidated Due Payment submission - unlimited payments supported
  const handleCompanyPaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectingCompany || (companyPayAmount <= 0 && companyDiscountWaiver <= 0)) return;

    const unpaidDocs = collectingCompany.documents
      .filter(d => getDocFinancials(d).due > 0 && d.status !== 'Paid')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let remainingPayment = companyPayAmount;
    let remainingDiscount = companyDiscountWaiver;
    const updatedDocs: Document[] = [];
    const receiptNo = `MR-${companyPayDate.replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    for (const doc of unpaidDocs) {
      if (remainingPayment <= 0 && remainingDiscount <= 0) break;
      const { total, paid: currentPaid, due: currentDue } = getDocFinancials(doc);
      if (currentDue <= 0) continue;

      const payForDoc = Math.min(currentDue, remainingPayment);
      remainingPayment -= payForDoc;

      const remainingDocDueAfterPay = Math.max(0, currentDue - payForDoc);
      const discountForDoc = Math.min(remainingDocDueAfterPay, remainingDiscount);
      remainingDiscount -= discountForDoc;

      const newDue = Math.max(0, remainingDocDueAfterPay - discountForDoc);
      const newPaid = currentPaid + payForDoc;

      const discountTag = discountForDoc > 0 ? ` (Discount: Tk. ${discountForDoc.toLocaleString()})` : '';
      const updatedDoc: Document = {
        ...doc,
        total,
        dueAmount: newDue,
        paidAmount: newPaid,
        status: newDue === 0 ? 'Paid' : 'Partially Paid',
        notes: (doc.notes || '') + `\n[Company Due Received: Tk. ${payForDoc.toLocaleString()}${discountTag} via ${companyPayMethod} on ${companyPayDate} - ${companyPayNotes || 'Ledger Payment'}${companyPayRefNo ? ` - RefNo: ${companyPayRefNo}` : ''} - Ref: ${receiptNo}]`
      };
      updatedDocs.push(updatedDoc);
    }

    // If all unpaid docs were settled and there is still remaining payment, OR if all documents were already paid:
    if (remainingPayment > 0 && collectingCompany.documents.length > 0) {
      // Apply payment to the latest invoice or document so the customer's ledger records the transaction
      const targetDoc = [...collectingCompany.documents]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      
      if (targetDoc) {
        const alreadyUpdatedIndex = updatedDocs.findIndex(d => d.id === targetDoc.id);
        const baseDoc = alreadyUpdatedIndex !== -1 ? updatedDocs[alreadyUpdatedIndex] : targetDoc;
        const { total, paid: currentPaid } = getDocFinancials(baseDoc);
        const newPaid = currentPaid + remainingPayment;
        const extraNote = `\n[Company Due Received: Tk. ${remainingPayment.toLocaleString()} via ${companyPayMethod} on ${companyPayDate} - ${companyPayNotes || 'Advance / Installment Collection'}${companyPayRefNo ? ` - RefNo: ${companyPayRefNo}` : ''} - Ref: ${receiptNo}]`;
        const finalizedDoc: Document = {
          ...baseDoc,
          total,
          paidAmount: newPaid,
          dueAmount: 0,
          status: 'Paid',
          notes: (baseDoc.notes || '') + extraNote
        };
        if (alreadyUpdatedIndex !== -1) {
          updatedDocs[alreadyUpdatedIndex] = finalizedDoc;
        } else {
          updatedDocs.push(finalizedDoc);
        }
        remainingPayment = 0;
      }
    }

    if (onBatchUpdateDocuments && updatedDocs.length > 0) {
      onBatchUpdateDocuments(updatedDocs);
    } else {
      updatedDocs.forEach(d => onUpdateDocument(d));
    }

    const remainingCompanyDue = Math.max(0, collectingCompany.totalDue - companyPayAmount - companyDiscountWaiver);
    
    setRecentReceipt({
      receiptNo,
      date: companyPayDate,
      customerName: collectingCompany.customer.name,
      customerCompany: collectingCompany.customer.company || '',
      customerPhone: collectingCompany.customer.phone || '',
      amount: companyPayAmount,
      discount: companyDiscountWaiver,
      paymentMethod: companyPayMethod,
      referenceNo: companyPayRefNo,
      notes: companyPayNotes || 'Company Consolidated Due Payment',
      references: updatedDocs.length > 0 ? `Paid Documents: ` + updatedDocs.map(d => `${d.type} #${d.docNumber}`).join(', ') : 'Company Account Settlement',
      remainingDue: remainingCompanyDue
    });

    setCollectingCompany(null);
  };

  // Supplier Due Payment Submission
  const handleSupplierPaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingSupplier || supplierPayAmount <= 0 || !onSavePurchase) return;

    const unpaidPurchases = payingSupplier.purchases
      .filter(p => (p.dueAmount || 0) > 0 && p.paymentStatus !== 'Paid')
      .sort((a, b) => new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime());

    let remainingToPay = supplierPayAmount;
    const voucherNo = `PV-${supplierPayDate.replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const paidPurchaseRefs: string[] = [];

    for (const purchase of unpaidPurchases) {
      if (remainingToPay <= 0) break;
      const currentDue = purchase.dueAmount || 0;
      if (currentDue <= 0) continue;

      const payForThis = Math.min(currentDue, remainingToPay);
      remainingToPay -= payForThis;

      const newPaid = (purchase.paidAmount || 0) + payForThis;
      const newDue = Math.max(0, currentDue - payForThis);
      const newStatus = newDue === 0 ? 'Paid' : 'Partial';

      const updatedPurchase: Purchase = {
        ...purchase,
        paidAmount: newPaid,
        dueAmount: newDue,
        paymentStatus: newStatus,
        notes: (purchase.notes || '') + `\n[Supplier Due Paid: Tk. ${payForThis.toLocaleString()} via ${supplierPayMethod} on ${supplierPayDate} - ${supplierPayNotes || 'Accounts Payable Payment'} - Voucher: ${voucherNo}]`
      };

      await onSavePurchase(updatedPurchase, false);
      paidPurchaseRefs.push(purchase.purchaseNumber);
    }

    const remainingSupplierDue = Math.max(0, payingSupplier.totalDue - supplierPayAmount);

    setRecentVoucher({
      voucherNo,
      date: supplierPayDate,
      supplierName: payingSupplier.supplier.name,
      supplierCompany: payingSupplier.supplier.company || '',
      supplierPhone: payingSupplier.supplier.phone || '',
      amount: supplierPayAmount,
      paymentMethod: supplierPayMethod,
      referenceNo: supplierPayRefNo,
      notes: supplierPayNotes || 'Supplier Accounts Payable Payment Voucher',
      references: paidPurchaseRefs.length > 0 ? `Purchases: ${paidPurchaseRefs.join(', ')}` : 'Supplier Ledger Payment',
      remainingDue: remainingSupplierDue
    });

    setPayingSupplier(null);
    setSupplierPayAmount(0);
    setSupplierPayNotes('');
    setSupplierPayRefNo('');
  };

  // Copy WhatsApp Reminder text helper
  const handleCopyReminder = (item: { customer: Customer; due: number }) => {
    const text = getWhatsAppReminderText(
      item.customer.name,
      item.customer.company,
      item.due,
      settings?.name || 'Jubayer Machineries',
      settings?.phone1 || '01715-994956'
    );
    navigator.clipboard.writeText(text);
    setCopiedReminderId(item.customer.id);
    setTimeout(() => setCopiedReminderId(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Dual Mode Switch */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-5 border border-slate-200 rounded-2xl shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-blue-900" />
            <h2 className="text-xl font-black font-display text-slate-900 tracking-tight">
              Due Outstanding Ledger
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Accounts Receivable (Customer Dues) and Accounts Payable (Supplier Dues) Central Management.
          </p>
        </div>
        
        {/* Main Mode Toggle: Customer Due vs Supplier Due */}
        <div className="flex items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200 w-full sm:w-auto">
          <button
            onClick={() => setMainTab('customers')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
              mainTab === 'customers'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-amber-300" />
            <span>Customer Dues</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-white/20 rounded-full">
              Tk. {totalOutstanding.toLocaleString()}
            </span>
          </button>
          <button
            onClick={() => setMainTab('suppliers')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
              mainTab === 'suppliers'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4 text-emerald-400" />
            <span>Supplier Dues</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-white/20 rounded-full">
              Tk. {totalSupplierPayableDue.toLocaleString()}
            </span>
          </button>
        </div>
      </div>

      {/* SECTION 1: CUSTOMER RECEIVABLES */}
      {mainTab === 'customers' && (
        <div className="space-y-6 animate-fade-in">
          {/* Receivables Analytics Widgets */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Total Receivables */}
            <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 shadow-2xs flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none truncate">
                  Total Outstanding
                </span>
                <span className="text-base sm:text-xl font-black text-rose-700 font-display block mt-1 truncate">
                  Tk. {totalOutstanding.toLocaleString()}
                </span>
                <span className="text-[9px] font-bold text-slate-500 block truncate">
                  Uncollected credit from {filteredCustomerLedger.filter(c => c.due > 0).length} clients
                </span>
              </div>
            </div>

            {/* Overdue Receivables */}
            <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 shadow-2xs flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none truncate">
                  Overdue Dues
                </span>
                <span className="text-base sm:text-xl font-black text-amber-800 font-display block mt-1 truncate">
                  Tk. {overdueOutstanding.toLocaleString()}
                </span>
                <span className="text-[9px] font-bold text-amber-600 block truncate">
                  {overdueDocs.length} overdue invoices
                </span>
              </div>
            </div>

            {/* Collected Balance */}
            <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 shadow-2xs flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none truncate">
                  Total Collected
                </span>
                <span className="text-base sm:text-xl font-black text-emerald-700 font-display block mt-1 truncate">
                  Tk. {totalPaid.toLocaleString()}
                </span>
                <span className="text-[9px] font-bold text-slate-500 block truncate">Cleared payments deposited</span>
              </div>
            </div>

            {/* Due Collection Ratio */}
            <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 shadow-2xs flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none truncate">
                  Collection Rate
                </span>
                <span className="text-base sm:text-xl font-black text-blue-900 font-display block mt-1 truncate">
                  {totalInvoiced > 0 ? ((totalPaid / totalInvoiced) * 100).toFixed(1) : "0"}%
                </span>
                <span className="text-[9px] font-bold text-emerald-600 block truncate">
                  Of Tk. {totalInvoiced.toLocaleString()} billing
                </span>
              </div>
            </div>
          </div>

          {/* Sub Navigation Tabs for Customers */}
          <div className="flex border-b border-slate-200 gap-2">
            <button
              onClick={() => setCustomerSubTab('ledger')}
              className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                customerSubTab === 'ledger'
                  ? 'border-blue-900 text-blue-900 font-black'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              Customer Accounts Ledger
            </button>
            <button
              onClick={() => setCustomerSubTab('invoices')}
              className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                customerSubTab === 'invoices'
                  ? 'border-blue-900 text-blue-900 font-black'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              Due Invoices & Bills
            </button>
            <button
              onClick={() => setCustomerSubTab('aging')}
              className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                customerSubTab === 'aging'
                  ? 'border-blue-900 text-blue-900 font-black'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Clock className="w-4 h-4" />
              Aging Analysis
            </button>
          </div>

          {/* SUB-VIEW 1: CUSTOMER ACCOUNTS LEDGER */}
          {customerSubTab === 'ledger' && (
            <div className="space-y-4">
              {/* Controls & Filter Bar */}
              <div className="bg-white p-4 border border-slate-200 rounded-2xl shadow-2xs flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by client name, company, phone, or ID..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-semibold focus:outline-hidden"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Status Filter Buttons */}
                  <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-[11px] font-bold">
                    <button
                      onClick={() => setCustomerStatusFilter('DUE')}
                      className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${customerStatusFilter === 'DUE' ? 'bg-white text-rose-700 shadow-2xs font-black' : 'text-slate-600'}`}
                    >
                      Has Due ({customerLedger.filter(c => c.due > 0).length})
                    </button>
                    <button
                      onClick={() => setCustomerStatusFilter('OVERDUE')}
                      className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${customerStatusFilter === 'OVERDUE' ? 'bg-white text-amber-700 shadow-2xs font-black' : 'text-slate-600'}`}
                    >
                      Overdue ({customerLedger.filter(c => c.overdueCount > 0).length})
                    </button>
                    <button
                      onClick={() => setCustomerStatusFilter('CLEARED')}
                      className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${customerStatusFilter === 'CLEARED' ? 'bg-white text-emerald-700 shadow-2xs font-black' : 'text-slate-600'}`}
                    >
                      Cleared ({customerLedger.filter(c => c.due === 0 && c.invoiced > 0).length})
                    </button>
                    <button
                      onClick={() => setCustomerStatusFilter('ALL')}
                      className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${customerStatusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs font-black' : 'text-slate-600'}`}
                    >
                      All ({customerLedger.length})
                    </button>
                  </div>

                  {/* Sort Selector */}
                  <select
                    value={customerSortBy}
                    onChange={(e) => setCustomerSortBy(e.target.value as any)}
                    className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold py-1.5 px-3 rounded-xl focus:outline-hidden cursor-pointer"
                  >
                    <option value="DUE_DESC">Highest Due First</option>
                    <option value="DUE_ASC">Lowest Due First</option>
                    <option value="BILLED_DESC">Highest Billed First</option>
                    <option value="NAME_ASC">Name (A-Z)</option>
                  </select>
                </div>
              </div>

              {/* Customer Ledger Table */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-950 text-white uppercase tracking-wider text-[10px] font-bold border-b border-slate-900">
                        <th className="py-3.5 px-5">Client Name & Company</th>
                        <th className="py-3.5 px-4">Contact Phone</th>
                        <th className="py-3.5 px-4 text-right">Total Billing</th>
                        <th className="py-3.5 px-4 text-right">Collected</th>
                        <th className="py-3.5 px-4 text-right">Outstanding Due</th>
                        <th className="py-3.5 px-4 text-center">Overdue</th>
                        <th className="py-3.5 px-5 text-center">Actions & Payment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {filteredCustomerLedger.length > 0 ? (
                        filteredCustomerLedger.map((item) => {
                          const isExpanded = expandedCustomer === item.customer.id;
                          const cleanPhone = item.customer.phone.replace(/[^0-9]/g, '');
                          const waPhone = cleanPhone.startsWith('88') ? cleanPhone : cleanPhone.startsWith('01') ? `88${cleanPhone}` : cleanPhone;
                          const reminderText = encodeURIComponent(
                            getWhatsAppReminderText(
                              item.customer.name,
                              item.customer.company,
                              item.due,
                              settings?.name || 'Jubayer Machineries',
                              settings?.phone1 || '01715-994956'
                            )
                          );

                          return (
                            <Fragment key={item.customer.id}>
                              <tr className={`hover:bg-slate-50/80 transition-colors ${item.due > 0 ? 'bg-rose-50/20' : 'bg-white'}`}>
                                <td className="py-4 px-5">
                                  <div className="flex items-center gap-2">
                                    <div>
                                      <span className="font-extrabold text-slate-900 block text-xs sm:text-sm">
                                        {item.customer.company || item.customer.name}
                                      </span>
                                      {item.customer.company && item.customer.name !== item.customer.company && (
                                        <span className="text-[10px] text-slate-500 font-semibold block">
                                          Attn: {item.customer.name}
                                        </span>
                                      )}
                                      {item.customer.companyId && (
                                        <span className="text-[9px] font-mono font-bold text-blue-900 block mt-0.5">
                                          ID: {item.customer.companyId}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4 px-4 font-mono font-bold text-slate-600">
                                  <div className="flex items-center gap-1.5">
                                    <Phone className="w-3 h-3 text-slate-400" />
                                    <a href={`tel:${item.customer.phone}`} className="hover:text-blue-900 hover:underline">
                                      {item.customer.phone}
                                    </a>
                                  </div>
                                </td>
                                <td className="py-4 px-4 text-right font-bold text-slate-900 font-mono">
                                  Tk. {item.invoiced.toLocaleString()}
                                </td>
                                <td className="py-4 px-4 text-right font-bold text-emerald-700 font-mono">
                                  Tk. {item.paid.toLocaleString()}
                                </td>
                                <td className="py-4 px-4 text-right">
                                  {item.due > 0 ? (
                                    <div className="inline-block bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg text-right">
                                      <span className="text-xs sm:text-sm font-black text-rose-700 font-display block leading-tight font-mono">
                                        Tk. {item.due.toLocaleString()}
                                      </span>
                                      <span className="text-[8px] font-bold text-rose-500 uppercase tracking-wider block">
                                        Total Outstanding
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg text-[10px] font-bold">
                                      <CheckCircle className="w-3 h-3" />
                                      Cleared / Zero Due
                                    </span>
                                  )}
                                </td>
                                <td className="py-4 px-4 text-center">
                                  {item.overdueCount > 0 ? (
                                    <span className="bg-rose-600 text-white font-mono font-bold text-[9px] px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                      <Clock className="w-2.5 h-2.5" />
                                      {item.overdueCount} Overdue
                                    </span>
                                  ) : (
                                    <span className="text-slate-300">&mdash;</span>
                                  )}
                                </td>
                                <td className="py-4 px-5 text-center">
                                  <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                    {/* Account Statement */}
                                    <button
                                      onClick={() => {
                                        setViewingCustomerReport(item);
                                        setStatementDateFilter('all');
                                      }}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-900 hover:bg-blue-950 text-white font-bold rounded-lg text-[11px] shadow-2xs transition-colors cursor-pointer"
                                      title="Open complete customer ledger statement"
                                    >
                                      <FileSpreadsheet className="w-3 h-3 text-amber-300" />
                                      Statement
                                    </button>

                                    {/* Collect Due - Always available so payments can be collected unlimited times */}
                                    <button
                                      onClick={() => handleOpenCompanyPay(item)}
                                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 font-bold rounded-lg text-[11px] shadow-2xs transition-colors cursor-pointer ${
                                        item.due > 0 
                                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                                      }`}
                                      title="Collect due or record payment for this client"
                                    >
                                      <CreditCard className="w-3 h-3" />
                                      {item.due > 0 ? 'Collect Due' : 'Record Pay'}
                                    </button>

                                    {/* WhatsApp Due Reminder */}
                                    {item.due > 0 && (
                                      <a
                                        href={`https://wa.me/${waPhone}?text=${reminderText}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 px-2 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-[11px] transition-colors cursor-pointer"
                                        title="Send WhatsApp payment reminder"
                                      >
                                        <MessageSquare className="w-3 h-3" />
                                        WhatsApp
                                      </a>
                                    )}

                                    {/* Copy Reminder Text */}
                                    {item.due > 0 && (
                                      <button
                                        onClick={() => handleCopyReminder(item)}
                                        className="inline-flex items-center gap-1 p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] transition-colors cursor-pointer"
                                        title="Copy payment reminder SMS text"
                                      >
                                        {copiedReminderId === item.customer.id ? (
                                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                                        ) : (
                                          <Copy className="w-3.5 h-3.5 text-slate-600" />
                                        )}
                                      </button>
                                    )}

                                    {/* Expand Invoices Toggle */}
                                    <button
                                      onClick={() => setExpandedCustomer(isExpanded ? null : item.customer.id)}
                                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                                      title={isExpanded ? 'Hide documents' : 'View documents breakdown'}
                                    >
                                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </button>
                                  </div>
                                </td>
                              </tr>

                              {/* Expanded Invoices Row */}
                              {isExpanded && (
                                <tr>
                                  <td colSpan={7} className="bg-slate-50 p-4 border-t border-b border-slate-200">
                                    <div className="space-y-3">
                                      <div className="flex justify-between items-center">
                                        <h4 className="text-[11px] uppercase font-black text-slate-700 tracking-wider flex items-center gap-1.5">
                                          <FileText className="w-3.5 h-3.5 text-blue-900" />
                                          Invoices & Bills Trail: {item.customer.company || item.customer.name}
                                        </h4>
                                        <span className="text-[10px] text-slate-500 font-bold">
                                          {item.documents.length} Records Linked
                                        </span>
                                      </div>

                                      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                                        <table className="w-full text-left text-xs border-collapse">
                                          <thead>
                                            <tr className="bg-slate-100 text-slate-600 uppercase tracking-widest text-[9px] font-bold border-b border-slate-200">
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
                                              const { total: docTotal, paid: paidAmt, due: dueAmt } = getDocFinancials(doc);
                                              const parsedPayments = parsePaymentsFromDoc(doc);
                                              return (
                                                <tr key={doc.id} className="hover:bg-slate-50">
                                                  <td className="py-3 px-4">
                                                    <span className="font-mono font-bold text-blue-900 block">{doc.docNumber}</span>
                                                    <span className="text-[9px] text-slate-400 font-semibold">{doc.type}</span>
                                                    {parsedPayments.length > 0 && (
                                                      <div className="mt-1 flex flex-wrap gap-1">
                                                        {parsedPayments.map((p) => (
                                                          <button
                                                            key={p.id}
                                                            onClick={() => setRecentReceipt({
                                                              receiptNo: p.receiptNo,
                                                              date: p.date,
                                                              customerName: p.customerName,
                                                              customerCompany: p.customerCompany,
                                                              customerPhone: p.customerPhone,
                                                              amount: p.amount,
                                                              discount: p.discount,
                                                              paymentMethod: p.paymentMethod,
                                                              notes: p.notes,
                                                              references: p.references,
                                                              remainingDue: p.remainingDue
                                                            })}
                                                            className="inline-flex items-center gap-0.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-200 px-1 py-0.5 rounded text-[8px] font-extrabold cursor-pointer transition-colors"
                                                            title="Reprint Money Receipt"
                                                          >
                                                            <Printer className="w-2.5 h-2.5 text-emerald-600" />
                                                            Receipt (Tk. {p.amount.toLocaleString()})
                                                          </button>
                                                        ))}
                                                      </div>
                                                    )}
                                                  </td>
                                                  <td className="py-3 px-4 font-mono text-[11px]">{doc.date}</td>
                                                  <td className="py-3 px-4 font-mono text-[11px]">{doc.dueDate || '--'}</td>
                                                  <td className="py-3 px-4 text-right text-slate-900 font-bold font-mono">Tk. {docTotal.toLocaleString()}</td>
                                                  <td className="py-3 px-4 text-right text-emerald-600 font-mono">Tk. {paidAmt.toLocaleString()}</td>
                                                  <td className="py-3 px-4 text-right text-rose-600 font-bold font-mono">Tk. {dueAmt.toLocaleString()}</td>
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
                                                          setPaymentAmount(dueAmt);
                                                          setDiscountWaiver(0);
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
                            No customer accounts matching your search or filters found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SUB-VIEW 2: INVOICES & DUE BILLS */}
          {customerSubTab === 'invoices' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white p-4 border border-slate-200 rounded-2xl shadow-2xs gap-4">
                <div className="relative w-full max-w-sm">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by invoice number or customer name..."
                    value={invoiceSearch}
                    onChange={(e) => setInvoiceSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs focus:outline-hidden font-semibold"
                  />
                </div>
                <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider hidden sm:block">
                  Total Records: {filteredInvoices.length} Documents
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-950 text-white uppercase tracking-wider text-[10px] font-bold border-b border-slate-900">
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
                          const { total: docTotal, paid: paidAmt, due: dueAmt } = getDocFinancials(doc);
                          const parsedPayments = parsePaymentsFromDoc(doc);
                          return (
                            <tr key={doc.id} className={`hover:bg-slate-50/80 transition-colors ${dueAmt > 0 ? 'bg-rose-50/10' : 'bg-white'}`}>
                              <td className="py-4 px-5">
                                <span className="font-mono font-bold text-blue-900 block text-xs">{doc.docNumber}</span>
                                <span className="text-[10px] text-slate-400 font-semibold block">{doc.type}</span>
                                {parsedPayments.length > 0 && (
                                  <div className="mt-1 flex flex-wrap gap-1">
                                    {parsedPayments.map((p, idx) => (
                                      <button
                                        key={p.id}
                                        onClick={() => setRecentReceipt({
                                          receiptNo: p.receiptNo,
                                          date: p.date,
                                          customerName: p.customerName,
                                          customerCompany: p.customerCompany,
                                          customerPhone: p.customerPhone,
                                          amount: p.amount,
                                          discount: p.discount,
                                          paymentMethod: p.paymentMethod,
                                          notes: p.notes,
                                          references: p.references,
                                          remainingDue: p.remainingDue
                                        })}
                                        className="inline-flex items-center gap-0.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-200 px-1 py-0.5 rounded text-[8px] font-extrabold cursor-pointer transition-colors"
                                        title="Reprint Money Receipt"
                                      >
                                        <Printer className="w-2.5 h-2.5 text-emerald-600" />
                                        Receipt-{idx + 1} (Tk. {p.amount.toLocaleString()})
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </td>
                              <td className="py-4 px-4">
                                <span className="font-bold text-slate-900 block">{doc.customerName}</span>
                                <span className="text-[10px] text-slate-400 font-semibold block">{doc.customerCompany}</span>
                              </td>
                              <td className="py-4 px-4 font-mono text-[11px] text-slate-500">{doc.date}</td>
                              <td className="py-4 px-4 font-mono text-[11px] text-slate-500">{doc.dueDate || '--'}</td>
                              <td className="py-4 px-4 text-right font-bold text-slate-900 font-mono">Tk. {docTotal.toLocaleString()}</td>
                              <td className="py-4 px-4 text-right font-bold text-emerald-600 font-mono">Tk. {paidAmt.toLocaleString()}</td>
                              <td className="py-4 px-4 text-right font-bold text-rose-600 font-mono">
                                <span className={dueAmt > 0 ? 'bg-rose-50 border border-rose-100 px-2 py-1 rounded-md' : 'text-slate-400'}>
                                  Tk. {dueAmt.toLocaleString()}
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
                                        setDiscountWaiver(0);
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

          {/* SUB-VIEW 3: DUE AGING ANALYSIS */}
          {customerSubTab === 'aging' && (
            <div className="space-y-6">
              <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-2xs">
                <h3 className="text-base font-extrabold text-slate-900 font-display flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-900" />
                  Accounts Receivable Aging Schedule
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Categorization of receivables by the number of days they have been outstanding since the invoice date.
                </p>

                {/* Aging 4-Column Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
                  {/* 0-30 Days */}
                  <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block">
                      0 - 30 Days (Current)
                    </span>
                    <span className="text-xl font-black text-emerald-900 font-mono block">
                      Tk. {agingData.current.amount.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-semibold block">
                      {agingData.current.count} invoices &bull; Healthy range
                    </span>
                  </div>

                  {/* 31-60 Days */}
                  <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-800 block">
                      31 - 60 Days (Follow-up)
                    </span>
                    <span className="text-xl font-black text-blue-900 font-mono block">
                      Tk. {agingData.days31_60.amount.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-blue-700 font-semibold block">
                      {agingData.days31_60.count} invoices &bull; Polite follow-up
                    </span>
                  </div>

                  {/* 61-90 Days */}
                  <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 block">
                      61 - 90 Days (Overdue Alert)
                    </span>
                    <span className="text-xl font-black text-amber-900 font-mono block">
                      Tk. {agingData.days61_90.amount.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-amber-700 font-semibold block">
                      {agingData.days61_90.count} invoices &bull; Formal notice
                    </span>
                  </div>

                  {/* 90+ Days */}
                  <div className="bg-rose-50/80 border border-rose-200 rounded-xl p-4 space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-800 block">
                      90+ Days (Critical Recovery)
                    </span>
                    <span className="text-xl font-black text-rose-900 font-mono block">
                      Tk. {agingData.over90.amount.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-rose-700 font-semibold block">
                      {agingData.over90.count} invoices &bull; Immediate recovery
                    </span>
                  </div>
                </div>
              </div>

              {/* Critical Aging Dues Table */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
                  <span className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    High Priority Aging Invoices (Over 30 Days Due)
                  </span>
                  <span className="text-[10px] text-slate-300 font-mono">
                    Total {agingData.days31_60.count + agingData.days61_90.count + agingData.over90.count} Invoices
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 uppercase tracking-widest text-[9px] font-bold border-b border-slate-200">
                        <th className="py-2.5 px-4">Doc #</th>
                        <th className="py-2.5 px-4">Customer Name & Company</th>
                        <th className="py-2.5 px-4">Phone</th>
                        <th className="py-2.5 px-4">Issue Date</th>
                        <th className="py-2.5 px-4 text-right">Invoiced Total</th>
                        <th className="py-2.5 px-4 text-right">Outstanding Due</th>
                        <th className="py-2.5 px-4 text-center">Aging Days</th>
                        <th className="py-2.5 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {[...agingData.over90.docs, ...agingData.days61_90.docs, ...agingData.days31_60.docs].map(doc => {
                        const { total, due } = getDocFinancials(doc);
                        const daysOld = Math.ceil(Math.abs(new Date().getTime() - new Date(doc.date).getTime()) / (1000 * 60 * 60 * 24));
                        return (
                          <tr key={doc.id} className="hover:bg-slate-50">
                            <td className="py-3 px-4 font-mono font-bold text-blue-900">{doc.docNumber}</td>
                            <td className="py-3 px-4">
                              <strong className="text-slate-900 block">{doc.customerName}</strong>
                              <span className="text-[10px] text-slate-400">{doc.customerCompany}</span>
                            </td>
                            <td className="py-3 px-4 font-mono text-[11px]">{doc.customerPhone}</td>
                            <td className="py-3 px-4 font-mono text-[11px]">{doc.date}</td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">Tk. {total.toLocaleString()}</td>
                            <td className="py-3 px-4 text-right font-mono font-black text-rose-700">Tk. {due.toLocaleString()}</td>
                            <td className="py-3 px-4 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded-full font-mono text-[10px] font-black ${
                                daysOld > 90 ? 'bg-rose-100 text-rose-800' : daysOld > 60 ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {daysOld} days ago
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => {
                                  setCollectingDoc(doc);
                                  setPaymentAmount(due);
                                  setDiscountWaiver(0);
                                }}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[10px] font-bold uppercase transition-colors cursor-pointer"
                              >
                                Collect
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: SUPPLIER PAYABLES */}
      {mainTab === 'suppliers' && (
        <div className="space-y-6 animate-fade-in">
          {/* Payables Analytics Widgets */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Total Supplier Payables */}
            <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 shadow-2xs flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-50 border border-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none truncate">
                  Total Supplier Payables
                </span>
                <span className="text-base sm:text-xl font-black text-amber-800 font-display block mt-1 truncate font-mono">
                  Tk. {totalSupplierPayableDue.toLocaleString()}
                </span>
                <span className="text-[9px] font-bold text-slate-500 block truncate">
                  Pending payable to suppliers
                </span>
              </div>
            </div>

            {/* Total Paid to Suppliers */}
            <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 shadow-2xs flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none truncate">
                  Paid to Suppliers
                </span>
                <span className="text-base sm:text-xl font-black text-emerald-700 font-display block mt-1 truncate font-mono">
                  Tk. {totalPaidToSuppliers.toLocaleString()}
                </span>
                <span className="text-[9px] font-bold text-slate-500 block truncate">
                  Cleared purchase vouchers
                </span>
              </div>
            </div>

            {/* Total Purchases Value */}
            <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 shadow-2xs flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                <Coins className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none truncate">
                  Total Procurement
                </span>
                <span className="text-base sm:text-xl font-black text-blue-900 font-display block mt-1 truncate font-mono">
                  Tk. {totalPurchaseValue.toLocaleString()}
                </span>
                <span className="text-[9px] font-bold text-slate-500 block truncate">
                  Across {purchases.length} purchases
                </span>
              </div>
            </div>

            {/* Net Position (Customer Receivables minus Supplier Payables) */}
            <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 shadow-2xs flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-50 border border-purple-100 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
                <Scale className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none truncate">
                  Net Working Balance
                </span>
                <span className={`text-base sm:text-xl font-black font-display block mt-1 truncate font-mono ${
                  (totalOutstanding - totalSupplierPayableDue) >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}>
                  Tk. {(totalOutstanding - totalSupplierPayableDue).toLocaleString()}
                </span>
                <span className="text-[9px] font-bold text-slate-500 block truncate">
                  {(totalOutstanding - totalSupplierPayableDue) >= 0 ? 'Surplus Receivable' : 'Net Payable Deficit'}
                </span>
              </div>
            </div>
          </div>

          {/* Supplier Sub-tabs */}
          <div className="flex border-b border-slate-200 gap-2">
            <button
              onClick={() => setSupplierSubTab('ledger')}
              className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                supplierSubTab === 'ledger'
                  ? 'border-blue-900 text-blue-900 font-black'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Supplier Accounts
            </button>
            <button
              onClick={() => setSupplierSubTab('purchases')}
              className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                supplierSubTab === 'purchases'
                  ? 'border-blue-900 text-blue-900 font-black'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              Due Purchase Vouchers
            </button>
          </div>

          {/* Supplier Accounts Table */}
          {supplierSubTab === 'ledger' && (
            <div className="space-y-4">
              <div className="bg-white p-4 border border-slate-200 rounded-2xl shadow-2xs flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by supplier name, company, or phone..."
                    value={supplierSearch}
                    onChange={(e) => setSupplierSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-semibold focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-[11px] font-bold">
                    <button
                      onClick={() => setSupplierStatusFilter('DUE')}
                      className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${supplierStatusFilter === 'DUE' ? 'bg-white text-amber-700 shadow-2xs font-black' : 'text-slate-600'}`}
                    >
                      Has Payable Due ({supplierLedger.filter(s => s.due > 0).length})
                    </button>
                    <button
                      onClick={() => setSupplierStatusFilter('CLEARED')}
                      className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${supplierStatusFilter === 'CLEARED' ? 'bg-white text-emerald-700 shadow-2xs font-black' : 'text-slate-600'}`}
                    >
                      Cleared ({supplierLedger.filter(s => s.due === 0 && s.totalPurchased > 0).length})
                    </button>
                    <button
                      onClick={() => setSupplierStatusFilter('ALL')}
                      className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${supplierStatusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs font-black' : 'text-slate-600'}`}
                    >
                      All ({supplierLedger.length})
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-950 text-white uppercase tracking-wider text-[10px] font-bold border-b border-slate-900">
                        <th className="py-3.5 px-5">Supplier Name & Company</th>
                        <th className="py-3.5 px-4">Contact Phone</th>
                        <th className="py-3.5 px-4 text-right">Total Purchased</th>
                        <th className="py-3.5 px-4 text-right">Paid to Supplier</th>
                        <th className="py-3.5 px-4 text-right">Outstanding Payable Due</th>
                        <th className="py-3.5 px-4 text-center">Purchases Count</th>
                        <th className="py-3.5 px-5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {filteredSupplierLedger.length > 0 ? (
                        filteredSupplierLedger.map((item) => (
                          <tr key={item.supplier.id} className={`hover:bg-slate-50/80 transition-colors ${item.due > 0 ? 'bg-amber-50/20' : 'bg-white'}`}>
                            <td className="py-4 px-5">
                              <strong className="text-slate-900 text-xs sm:text-sm block">
                                {item.supplier.company || item.supplier.name}
                              </strong>
                              {item.supplier.company && item.supplier.name !== item.supplier.company && (
                                <span className="text-[10px] text-slate-500 block">
                                  Contact: {item.supplier.name}
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-4 font-mono font-bold text-slate-600">{item.supplier.phone}</td>
                            <td className="py-4 px-4 text-right font-bold text-slate-900 font-mono">Tk. {item.totalPurchased.toLocaleString()}</td>
                            <td className="py-4 px-4 text-right font-bold text-emerald-700 font-mono">Tk. {item.totalPaid.toLocaleString()}</td>
                            <td className="py-4 px-4 text-right font-mono">
                              {item.due > 0 ? (
                                <div className="inline-block bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg text-right">
                                  <span className="text-xs sm:text-sm font-black text-amber-800 font-display block leading-tight">
                                    Tk. {item.due.toLocaleString()}
                                  </span>
                                  <span className="text-[8px] font-bold text-amber-600 uppercase tracking-wider block">
                                    Payable Due
                                  </span>
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                                  <CheckCircle className="w-3 h-3" />
                                  Cleared
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-4 text-center font-bold text-slate-600 font-mono">
                              {item.purchases.length} Vouchers
                            </td>
                            <td className="py-4 px-5 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => setViewingSupplierReport(item)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-900 hover:bg-blue-950 text-white font-bold rounded-lg text-xs shadow-2xs transition-colors cursor-pointer"
                                  title="View supplier statement"
                                >
                                  <FileSpreadsheet className="w-3.5 h-3.5 text-amber-300" />
                                  Statement
                                </button>
                                {item.due > 0 && (
                                  <button
                                    onClick={() => {
                                      setPayingSupplier({
                                        supplier: item.supplier,
                                        totalDue: item.due,
                                        purchases: item.purchases
                                      });
                                      setSupplierPayAmount(item.due);
                                      setSupplierPayDate(new Date().toISOString().split('T')[0]);
                                      setSupplierPayMethod('Bank Transfer');
                                      setSupplierPayNotes('');
                                      setSupplierPayRefNo('');
                                    }}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs shadow-2xs transition-colors cursor-pointer"
                                    title="Pay supplier due"
                                  >
                                    <CreditCard className="w-3.5 h-3.5" />
                                    Pay Due
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-12 px-5 text-center text-slate-400">
                            No supplier records matching your filter found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Supplier Due Purchases List */}
          {supplierSubTab === 'purchases' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white p-4 border border-slate-200 rounded-2xl shadow-2xs gap-4">
                <div className="relative w-full max-w-sm">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by purchase # or supplier..."
                    value={purchaseSearch}
                    onChange={(e) => setPurchaseSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-semibold focus:outline-hidden"
                  />
                </div>
                <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider hidden sm:block">
                  Total: {filteredPurchasesList.length} Purchase Records
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-950 text-white uppercase tracking-wider text-[10px] font-bold border-b border-slate-900">
                        <th className="py-3 px-5">Purchase #</th>
                        <th className="py-3 px-4">Supplier</th>
                        <th className="py-3 px-4">Purchase Date</th>
                        <th className="py-3 px-4 text-right">Grand Total</th>
                        <th className="py-3 px-4 text-right">Paid Amount</th>
                        <th className="py-3 px-4 text-right">Due Amount</th>
                        <th className="py-3 px-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {filteredPurchasesList.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="py-3 px-5 font-mono font-bold text-blue-900">{p.purchaseNumber}</td>
                          <td className="py-3 px-4">
                            <strong className="text-slate-900 block">{p.supplierName}</strong>
                            <span className="text-[10px] text-slate-400">{p.supplierCompany}</span>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px]">{p.purchaseDate}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">Tk. {(p.grandTotal || 0).toLocaleString()}</td>
                          <td className="py-3 px-4 text-right font-mono text-emerald-700">Tk. {(p.paidAmount || 0).toLocaleString()}</td>
                          <td className="py-3 px-4 text-right font-mono font-black text-amber-700">
                            Tk. {(p.dueAmount || 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                              (p.dueAmount || 0) === 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}>
                              {p.paymentStatus || ((p.dueAmount || 0) === 0 ? 'Paid' : 'Due')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: SINGLE DOCUMENT PAYMENT COLLECTION */}
      {collectingDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md max-h-[85vh] sm:max-h-[88vh] flex flex-col overflow-hidden my-auto animate-slide-up">
            <div className="bg-slate-950 text-white p-5 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Payment Desk</span>
                <h3 className="font-extrabold font-display text-sm">Collect Outstanding Dues</h3>
              </div>
              <button 
                onClick={() => setCollectingDoc(null)}
                className="text-slate-400 hover:text-white font-bold bg-white/5 hover:bg-white/10 px-2 py-1 rounded-lg text-xs cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCollectPaymentSubmit} className="p-4 sm:p-6 space-y-4 text-xs font-semibold flex-1 overflow-y-auto">
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-1.5">
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
                  <span className="font-bold text-slate-900 font-mono">Tk. {getDocFinancials(collectingDoc).total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-500 font-semibold">
                  <span>Previously Paid</span>
                  <span className="font-bold text-emerald-600 font-mono">
                    Tk. {getDocFinancials(collectingDoc).paid.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1.5 text-slate-800 font-bold">
                  <span>Outstanding Balance</span>
                  <span className="text-rose-600 font-extrabold font-mono text-sm">
                    Tk. {getDocFinancials(collectingDoc).due.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Receive Payment Input */}
              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">Receive Collection Amount (Tk.) <span className="text-rose-600">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Tk.</span>
                  <input
                    type="number"
                    required
                    min={0}
                    value={paymentAmount === 0 ? '' : paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value === '' ? 0 : Number(e.target.value))}
                    placeholder="Enter collected amount"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 pl-9 focus:bg-white focus:outline-hidden font-bold text-slate-900 text-sm font-mono"
                  />
                </div>
              </div>

              {/* Discount / Waiver Amount */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-slate-700 font-bold block">Cash Discount / Waiver</label>
                  <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Tk.</span>
                  <input
                    type="number"
                    min={0}
                    max={Math.max(0, getDocFinancials(collectingDoc).due - paymentAmount)}
                    value={discountWaiver === 0 ? '' : discountWaiver}
                    onChange={(e) => setDiscountWaiver(e.target.value === '' ? 0 : Number(e.target.value))}
                    placeholder="Waiver / concession amount (if any)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 pl-9 focus:bg-white focus:outline-hidden font-bold text-slate-900 text-sm font-mono"
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  Remaining due will be: <strong className="text-rose-600 font-mono">Tk. {Math.max(0, getDocFinancials(collectingDoc).due - paymentAmount - discountWaiver).toLocaleString()}</strong>
                </p>
              </div>

              {/* Payment Method & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 font-bold block">Payment Method</label>
                  <select
                    value={singlePaymentMethod}
                    onChange={(e) => setSinglePaymentMethod(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-800 focus:bg-white focus:outline-hidden"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="bKash/Nagad">bKash / Nagad</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 font-bold block">Payment Date</label>
                  <input
                    type="date"
                    required
                    value={singlePaymentDate}
                    onChange={(e) => setSinglePaymentDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 focus:bg-white focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              {/* Reference & Notes */}
              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">Cheque / TrxID / Ref No.</label>
                <input
                  type="text"
                  placeholder="e.g. Bank Cheque #48104 or TrxID"
                  value={paymentReferenceNo}
                  onChange={(e) => setPaymentReferenceNo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">Memo / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Received full due settlement"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCollectingDoc(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-center rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paymentAmount <= 0 && discountWaiver <= 0}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-center font-bold uppercase rounded-xl transition-colors cursor-pointer shadow-xs"
                >
                  Process Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: COMPANY TOTAL CONSOLIDATED PAYMENT */}
      {collectingCompany && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg max-h-[85vh] sm:max-h-[88vh] flex flex-col overflow-hidden my-auto animate-slide-up">
            <div className="bg-gradient-to-r from-slate-950 to-blue-950 text-white p-5 flex justify-between items-center flex-shrink-0">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block mb-0.5">
                  Consolidated Customer Due Collection
                </span>
                <h3 className="font-extrabold font-display text-sm sm:text-base">
                  {collectingCompany.customer.company || collectingCompany.customer.name}
                </h3>
                <p className="text-[11px] text-slate-300">
                  Contact: {collectingCompany.customer.name} &bull; {collectingCompany.customer.phone}
                </p>
              </div>
              <button 
                onClick={() => setCollectingCompany(null)}
                className="text-slate-400 hover:text-white font-bold bg-white/10 hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center text-sm cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCompanyPaySubmit} className="p-4 sm:p-6 space-y-4 text-xs font-semibold flex-1 overflow-y-auto">
              {/* Balance Card */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Total Outstanding Balance</span>
                  <span className="font-black text-rose-700 text-base font-display font-mono">
                    Tk. {collectingCompany.totalDue.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-500 text-[11px]">
                  <span>Unpaid Invoices Count</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {collectingCompany.documents.filter(d => getDocFinancials(d).due > 0).length} unpaid documents
                  </span>
                </div>

                {/* Quick amount setter buttons */}
                <div className="pt-2 border-t border-slate-200 flex flex-wrap gap-2">
                  <span className="text-[10px] text-slate-400 font-bold block w-full">Quick Select Amount:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setCompanyPayAmount(collectingCompany.totalDue);
                      setCompanyDiscountWaiver(0);
                    }}
                    className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
                  >
                    Full Payment (Tk. {collectingCompany.totalDue.toLocaleString()})
                  </button>
                  {collectingCompany.totalDue > 5000 && (
                    <button
                      type="button"
                      onClick={() => {
                        setCompanyPayAmount(Math.round(collectingCompany.totalDue * 0.5));
                        setCompanyDiscountWaiver(0);
                      }}
                      className="px-2.5 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
                    >
                      50% Partial (Tk. {Math.round(collectingCompany.totalDue * 0.5).toLocaleString()})
                    </button>
                  )}
                </div>
              </div>

              {/* Payment Amount */}
              <div className="space-y-1">
                <label className="text-slate-800 font-bold block flex justify-between items-center">
                  <span>Collected Amount (Tk.) <span className="text-rose-600">*</span></span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Tk.</span>
                  <input
                    type="number"
                    required
                    min={0}
                    value={companyPayAmount || ''}
                    onChange={(e) => setCompanyPayAmount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 pl-9 focus:bg-white focus:outline-hidden font-bold text-slate-900 text-base font-mono"
                    placeholder="Enter collected amount..."
                  />
                </div>
              </div>

              {/* Discount / Waiver Amount */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-slate-700 font-bold block">Cash Discount / Concession</label>
                  <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Tk.</span>
                  <input
                    type="number"
                    min={0}
                    max={Math.max(0, collectingCompany.totalDue - companyPayAmount)}
                    value={companyDiscountWaiver === 0 ? '' : companyDiscountWaiver}
                    onChange={(e) => setCompanyDiscountWaiver(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 pl-9 focus:bg-white focus:outline-hidden font-bold text-slate-900 text-base font-mono"
                    placeholder="Waiver / discount given to settle account"
                  />
                </div>
                <p className="text-[10px] text-slate-500">
                  Remaining company due will be: <strong className="text-rose-600 font-mono">Tk. {Math.max(0, collectingCompany.totalDue - companyPayAmount - companyDiscountWaiver).toLocaleString()}</strong>
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 font-bold block">Payment Method</label>
                  <select
                    value={companyPayMethod}
                    onChange={(e) => setCompanyPayMethod(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-800 focus:bg-white focus:outline-hidden"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="bKash/Nagad">bKash / Nagad</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 font-bold block">Payment Date</label>
                  <input
                    type="date"
                    required
                    value={companyPayDate}
                    onChange={(e) => setCompanyPayDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 focus:bg-white focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">Cheque / TrxID / Ref No.</label>
                <input
                  type="text"
                  placeholder="e.g. Bank Cheque # or TrxID"
                  value={companyPayRefNo}
                  onChange={(e) => setCompanyPayRefNo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">Reference Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Consolidated monthly billing settlement"
                  value={companyPayNotes}
                  onChange={(e) => setCompanyPayNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCollectingCompany(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-center rounded-xl transition-colors cursor-pointer"
                >
                  Dismiss
                </button>
                <button
                  type="submit"
                  disabled={companyPayAmount <= 0 && companyDiscountWaiver <= 0}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-center font-bold uppercase rounded-xl transition-colors cursor-pointer shadow-xs"
                >
                  Confirm Collection (Tk. {companyPayAmount.toLocaleString()})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: SUPPLIER DUE PAYMENT (PAY ACCOUNTS PAYABLE) */}
      {payingSupplier && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg max-h-[85vh] sm:max-h-[88vh] flex flex-col overflow-hidden my-auto animate-slide-up">
            <div className="bg-gradient-to-r from-slate-950 to-amber-950 text-white p-5 flex justify-between items-center flex-shrink-0">
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block mb-0.5">
                  Supplier Due Payment Desk
                </span>
                <h3 className="font-extrabold font-display text-sm sm:text-base">
                  {payingSupplier.supplier.company || payingSupplier.supplier.name}
                </h3>
                <p className="text-[11px] text-slate-300">
                  Contact: {payingSupplier.supplier.name} &bull; {payingSupplier.supplier.phone}
                </p>
              </div>
              <button 
                onClick={() => setPayingSupplier(null)}
                className="text-slate-400 hover:text-white font-bold bg-white/10 hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center text-sm cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSupplierPaySubmit} className="p-4 sm:p-6 space-y-4 text-xs font-semibold flex-1 overflow-y-auto">
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Total Supplier Due Payable</span>
                  <span className="font-black text-amber-800 text-base font-display font-mono">
                    Tk. {payingSupplier.totalDue.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-500 text-[11px]">
                  <span>Unpaid Purchase Vouchers</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {payingSupplier.purchases.filter(p => (p.dueAmount || 0) > 0).length} vouchers
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-800 font-bold block flex justify-between items-center">
                  <span>Pay Amount (Tk.) <span className="text-rose-600">*</span></span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    Remaining will be: <strong className="text-amber-800 font-mono">Tk. {Math.max(0, payingSupplier.totalDue - supplierPayAmount).toLocaleString()}</strong>
                  </span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Tk.</span>
                  <input
                    type="number"
                    required
                    min={1}
                    max={payingSupplier.totalDue}
                    value={supplierPayAmount || ''}
                    onChange={(e) => setSupplierPayAmount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 pl-9 focus:bg-white focus:outline-hidden font-bold text-slate-900 text-base font-mono"
                    placeholder="Enter payment amount..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 font-bold block">Payment Method</label>
                  <select
                    value={supplierPayMethod}
                    onChange={(e) => setSupplierPayMethod(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-800 focus:bg-white focus:outline-hidden"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="bKash/Nagad">bKash / Nagad</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 font-bold block">Payment Date</label>
                  <input
                    type="date"
                    required
                    value={supplierPayDate}
                    onChange={(e) => setSupplierPayDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 focus:bg-white focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">Cheque / TrxID / Ref No.</label>
                <input
                  type="text"
                  placeholder="e.g. Bank Cheque # or TrxID"
                  value={supplierPayRefNo}
                  onChange={(e) => setSupplierPayRefNo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">Notes / Particulars</label>
                <input
                  type="text"
                  placeholder="e.g. Spare parts supply purchase payment"
                  value={supplierPayNotes}
                  onChange={(e) => setSupplierPayNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPayingSupplier(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-center rounded-xl transition-colors cursor-pointer"
                >
                  Dismiss
                </button>
                <button
                  type="submit"
                  disabled={supplierPayAmount <= 0}
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-center font-bold uppercase rounded-xl transition-colors cursor-pointer shadow-xs"
                >
                  Confirm Payment (Tk. {supplierPayAmount.toLocaleString()})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: PRINTABLE OFFICIAL MONEY RECEIPT */}
      {recentReceipt && (
        <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in no-print-backdrop print:bg-transparent print:p-0">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh] sm:max-h-[88vh] my-auto overflow-hidden animate-slide-up print:max-h-none print:border-none print:shadow-none">
            {/* Header Control Panel (no-print) */}
            <div className="bg-slate-950 text-white px-5 py-3.5 flex justify-between items-center gap-4 no-print shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <h3 className="font-extrabold text-xs sm:text-sm text-white leading-tight">
                    Official Money Receipt
                  </h3>
                  <p className="text-[10px] text-slate-400 hidden sm:block">
                    Printed receipt copy for client records & billing file
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold uppercase rounded-lg flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Receipt
                </button>
                <button 
                  onClick={() => setRecentReceipt(null)}
                  className="text-slate-400 hover:text-white font-bold bg-white/10 hover:bg-white/20 w-7 h-7 rounded-full flex items-center justify-center text-sm cursor-pointer transition-colors"
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Printable Receipt Body */}
            <div id="printable-area" className="overflow-y-auto flex-1 p-6 sm:p-8 bg-white text-slate-900 font-sans relative select-none print:overflow-visible print:p-0">
              <div className="border-4 border-slate-900 p-6 rounded-2xl relative space-y-4">
                {/* Letterhead */}
                <div className="text-center space-y-1 pb-4 border-b-2 border-slate-900">
                  <div className="text-2xl font-black tracking-tight text-slate-900 font-display uppercase">
                    {settings?.name || 'Jubayer Machineries'}
                  </div>
                  <div className="text-[9px] text-slate-600 font-semibold">
                    {(settings?.address || 'Hazi Siddik Complex, Molla Market, Bason Sharok, Gazipur City.').replace(/corporate\s*office:?\s*/gi, '').trim()}
                  </div>
                  <div className="text-[9px] text-slate-500 font-medium">
                    Contact: {settings?.phone1 || '01715-994956'}, {settings?.phone2 || '01799-498199'} &bull; Email: {settings?.email || 'jubayermachineries@gmail.com'} &bull; Web: {settings?.website || 'www.hitachiairsolutioncenter.com'}
                  </div>
                </div>

                {/* Title */}
                <div className="flex justify-center my-3">
                  <span className="bg-slate-900 text-white font-black text-xs uppercase tracking-widest px-6 py-1.5 rounded-lg text-center font-mono">
                    OFFICIAL MONEY RECEIPT
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
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Received From:</span>
                    <strong className="text-slate-900 text-sm block">{recentReceipt.customerCompany || recentReceipt.customerName}</strong>
                    {recentReceipt.customerCompany && recentReceipt.customerName !== recentReceipt.customerCompany && (
                      <span className="text-slate-500 block text-[10px]">Attn: {recentReceipt.customerName}</span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Contact Phone:</span>
                    <strong className="text-slate-800 font-mono">{recentReceipt.customerPhone || 'N/A'}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Payment Method:</span>
                    <strong className="text-emerald-700 uppercase tracking-wider">{recentReceipt.paymentMethod}</strong>
                    {recentReceipt.referenceNo && (
                      <span className="text-[10px] text-slate-500 block font-mono">Ref: {recentReceipt.referenceNo}</span>
                    )}
                  </div>
                </div>

                {/* Amount Section */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Reference Document:
                    </span>
                    <span className="font-mono font-black text-slate-900 text-xs bg-slate-200 px-2.5 py-0.5 rounded">
                      {recentReceipt.references}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-slate-800">
                      Amount Received:
                    </span>
                    <span className="text-xl font-black text-slate-950 font-display font-mono">
                      Tk. {recentReceipt.amount.toLocaleString()}.00
                    </span>
                  </div>

                  {recentReceipt.discount && recentReceipt.discount > 0 ? (
                    <div className="flex justify-between items-center text-[11px] font-bold text-emerald-800 pt-1">
                      <span>Discount / Waiver Allowed:</span>
                      <span className="font-mono font-black">+ Tk. {recentReceipt.discount.toLocaleString()}.00</span>
                    </div>
                  ) : null}

                  <div className="text-[10px] text-slate-600 bg-white border border-slate-100 p-2.5 rounded-lg font-bold italic">
                    <span className="text-slate-400 uppercase tracking-wider font-mono block text-[9px] not-italic font-bold">
                      Amount in Words:
                    </span>
                    {numberToWords(recentReceipt.amount)}
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-[10px] font-bold text-slate-500">
                    <span>Remaining Outstanding Due:</span>
                    <span className="text-rose-600 font-black font-mono text-xs">
                      Tk. {recentReceipt.remainingDue.toLocaleString()}.00
                    </span>
                  </div>
                </div>

                {/* Memo */}
                {recentReceipt.notes && (
                  <div className="text-[10px] text-slate-500 font-semibold">
                    <span className="text-slate-400 text-[9px] uppercase font-bold block">Payment Details / Memo:</span>
                    <p className="text-slate-800 bg-slate-50 border border-slate-200 p-2 rounded-lg italic">
                      {(recentReceipt.notes || '').replace(/corporate\s*office:?\s*/gi, '')}
                    </p>
                  </div>
                )}

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-12 pt-8 text-center text-[10px] font-bold text-slate-500">
                  <div className="space-y-1">
                    <div className="border-t border-slate-400 pt-1.5 w-44 mx-auto text-slate-800">
                      Customer's Signature
                    </div>
                    <span className="text-[9px] text-slate-400 italic block">Receiver / Depositor</span>
                  </div>
                  <div className="space-y-1">
                    <div className="border-t border-slate-400 pt-1.5 w-44 mx-auto text-slate-800 font-bold">
                      {currentUser?.name || settings?.signatureName || 'MD MAHI UDDIN'}
                    </div>
                    <span className="text-[9px] text-slate-500 font-semibold block">
                      {currentUser?.designation || 'Managing Director & Owner'}
                    </span>
                    <span className="text-[8px] text-slate-400 italic block">Authorized Signature</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: PRINTABLE SUPPLIER PAYMENT VOUCHER */}
      {recentVoucher && (
        <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in no-print-backdrop print:bg-transparent print:p-0">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh] sm:max-h-[88vh] my-auto overflow-hidden animate-slide-up print:max-h-none print:border-none print:shadow-none">
            <div className="bg-slate-950 text-white px-5 py-3.5 flex justify-between items-center gap-4 no-print shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <h3 className="font-extrabold text-xs sm:text-sm text-white leading-tight">
                    Supplier Payment Voucher
                  </h3>
                  <p className="text-[10px] text-slate-400 hidden sm:block">
                    Accounts payable disbursement voucher copy
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-extrabold uppercase rounded-lg flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Voucher
                </button>
                <button 
                  onClick={() => setRecentVoucher(null)}
                  className="text-slate-400 hover:text-white font-bold bg-white/10 hover:bg-white/20 w-7 h-7 rounded-full flex items-center justify-center text-sm cursor-pointer transition-colors"
                >
                  &times;
                </button>
              </div>
            </div>

            <div id="printable-area" className="overflow-y-auto flex-1 p-6 sm:p-8 bg-white text-slate-900 font-sans relative select-none print:overflow-visible print:p-0">
              <div className="border-4 border-amber-950 p-6 rounded-2xl relative space-y-4">
                <div className="text-center space-y-1 pb-4 border-b-2 border-slate-900">
                  <div className="text-2xl font-black tracking-tight text-slate-900 font-display uppercase">
                    {settings?.name || 'Jubayer Machineries'}
                  </div>
                  <div className="text-[9px] text-slate-600 font-semibold">
                    {(settings?.address || 'Hazi Siddik Complex, Molla Market, Bason Sharok, Gazipur City.').replace(/corporate\s*office:?\s*/gi, '').trim()}
                  </div>
                  <div className="text-[9px] text-slate-500 font-medium">
                    Contact: {settings?.phone1 || '01715-994956'}, {settings?.phone2 || '01799-498199'} &bull; Email: {settings?.email || 'jubayermachineries@gmail.com'} &bull; Web: {settings?.website || 'www.hitachiairsolutioncenter.com'}
                  </div>
                </div>

                <div className="flex justify-center my-3">
                  <span className="bg-amber-900 text-white font-black text-xs uppercase tracking-widest px-6 py-1.5 rounded-lg text-center font-mono">
                    SUPPLIER PAYMENT VOUCHER
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-[11px] font-semibold text-slate-700 pb-4 border-b border-slate-200">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Voucher Number:</span>
                    <strong className="text-slate-900 font-mono text-xs">{recentVoucher.voucherNo}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Date of Payment:</span>
                    <strong className="text-slate-900 font-mono text-xs">{recentVoucher.date}</strong>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Paid To (Supplier):</span>
                    <strong className="text-slate-900 text-sm block">{recentVoucher.supplierCompany || recentVoucher.supplierName}</strong>
                    {recentVoucher.supplierCompany && (
                      <span className="text-slate-500 block text-[10px]">Contact Person: {recentVoucher.supplierName}</span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Contact Phone:</span>
                    <strong className="text-slate-800 font-mono">{recentVoucher.supplierPhone || 'N/A'}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Payment Method:</span>
                    <strong className="text-amber-800 uppercase tracking-wider">{recentVoucher.paymentMethod}</strong>
                    {recentVoucher.referenceNo && (
                      <span className="text-[10px] text-slate-500 block font-mono">Ref: {recentVoucher.referenceNo}</span>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Reference Vouchers:
                    </span>
                    <span className="font-mono font-black text-slate-900 text-xs bg-slate-200 px-2.5 py-0.5 rounded">
                      {recentVoucher.references}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-slate-800">
                      Amount Paid:
                    </span>
                    <span className="text-xl font-black text-slate-950 font-display font-mono">
                      Tk. {recentVoucher.amount.toLocaleString()}.00
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-600 bg-white border border-slate-100 p-2.5 rounded-lg font-bold italic">
                    <span className="text-slate-400 uppercase tracking-wider font-mono block text-[9px] not-italic font-bold">
                      Amount in Words:
                    </span>
                    {numberToWords(recentVoucher.amount)}
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-[10px] font-bold text-slate-500">
                    <span>Remaining Payable Due:</span>
                    <span className="text-amber-800 font-black font-mono text-xs">
                      Tk. {recentVoucher.remainingDue.toLocaleString()}.00
                    </span>
                  </div>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-12 pt-8 text-center text-[10px] font-bold text-slate-500">
                  <div className="space-y-1">
                    <div className="border-t border-slate-400 pt-1.5 w-44 mx-auto text-slate-800">
                      Supplier's Receiver Signature
                    </div>
                    <span className="text-[9px] text-slate-400 italic block">Receiver Acknowledgement</span>
                  </div>
                  <div className="space-y-1">
                    <div className="border-t border-slate-400 pt-1.5 w-44 mx-auto text-slate-800 font-bold">
                      {currentUser?.name || settings?.signatureName || 'MD MAHI UDDIN'}
                    </div>
                    <span className="text-[9px] text-slate-500 font-semibold block">
                      {currentUser?.designation || 'Managing Director & Owner'}
                    </span>
                    <span className="text-[8px] text-slate-400 italic block">Authorized Payer</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: INDIVIDUAL CUSTOMER ACCOUNT STATEMENT */}
      {viewingCustomerReport && (() => {
        const liveReportItem = customerLedger.find(c => c.customer.id === viewingCustomerReport.customer.id) || viewingCustomerReport;
        const cust = liveReportItem.customer;
        
        let startFilter: string | undefined = undefined;
        let endFilter: string | undefined = undefined;
        const now = new Date();

        if (statementDateFilter === 'this_month') {
          const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
          startFilter = firstDay;
        } else if (statementDateFilter === 'last_30') {
          const past30 = new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0];
          startFilter = past30;
        } else if (statementDateFilter === 'this_year') {
          startFilter = `${now.getFullYear()}-01-01`;
        } else if (statementDateFilter === 'custom') {
          startFilter = statementStartDate || undefined;
          endFilter = statementEndDate || undefined;
        }

        const { openingBalance, transactions } = generateCustomerLedgerTransactions(liveReportItem, startFilter, endFilter);
        const allCustomerReceipts = liveReportItem.documents.flatMap(doc => parsePaymentsFromDoc(doc));

        const periodBilled = transactions.reduce((sum, t) => sum + t.billed, 0);
        const periodPaid = transactions.reduce((sum, t) => sum + t.paid, 0);
        const periodDiscount = transactions.reduce((sum, t) => sum + (t.discount || 0), 0);
        const closingDue = transactions.length > 0 
          ? transactions[transactions.length - 1].runningDue 
          : openingBalance;

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in no-print-backdrop print:bg-transparent print:p-0">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl flex flex-col max-h-[85vh] sm:max-h-[88vh] my-auto overflow-hidden animate-slide-up print:max-h-none print:border-none print:shadow-none">
              
              {/* Modal Top Control Bar (no-print) */}
              <div className="bg-slate-950 text-white px-5 py-3.5 flex flex-wrap justify-between items-center gap-3 no-print shrink-0 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-white leading-tight">
                      {cust.company || cust.name} - Customer Ledger Statement
                    </h3>
                    <p className="text-[10px] text-slate-400 hidden sm:block">
                      Chronological statement of invoices, payments received, and running due balance.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      const target = liveReportItem;
                      setViewingCustomerReport(null);
                      handleOpenCompanyPay(target);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold uppercase rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                    title="Collect or record payment for this client"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    Collect Payment
                  </button>
                  <button
                    onClick={() => downloadCustomerStatementCSV(cust, transactions, {
                      invoiced: periodBilled,
                      paid: periodPaid,
                      due: closingDue,
                      openingBalance
                    })}
                    className="px-3 py-1.5 bg-blue-900 hover:bg-blue-950 text-white text-[10px] font-bold uppercase rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-300" />
                    Download CSV
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-extrabold uppercase rounded-lg flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print Statement
                  </button>
                  <button 
                    onClick={() => setViewingCustomerReport(null)}
                    className="text-slate-400 hover:text-white font-bold bg-white/10 hover:bg-white/20 w-7 h-7 rounded-full flex items-center justify-center text-sm cursor-pointer transition-colors"
                  >
                    &times;
                  </button>
                </div>
              </div>

              {/* Date Filter Bar (no-print) */}
              <div className="bg-slate-100 px-5 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs no-print">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-600 uppercase text-[10px]">Statement Period:</span>
                  <div className="flex bg-white p-0.5 rounded-lg border border-slate-200 text-[11px] font-bold">
                    <button
                      onClick={() => setStatementDateFilter('all')}
                      className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${statementDateFilter === 'all' ? 'bg-blue-900 text-white' : 'text-slate-600'}`}
                    >
                      All Time
                    </button>
                    <button
                      onClick={() => setStatementDateFilter('this_month')}
                      className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${statementDateFilter === 'this_month' ? 'bg-blue-900 text-white' : 'text-slate-600'}`}
                    >
                      This Month
                    </button>
                    <button
                      onClick={() => setStatementDateFilter('last_30')}
                      className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${statementDateFilter === 'last_30' ? 'bg-blue-900 text-white' : 'text-slate-600'}`}
                    >
                      Last 30 Days
                    </button>
                    <button
                      onClick={() => setStatementDateFilter('this_year')}
                      className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${statementDateFilter === 'this_year' ? 'bg-blue-900 text-white' : 'text-slate-600'}`}
                    >
                      This Year
                    </button>
                    <button
                      onClick={() => setStatementDateFilter('custom')}
                      className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${statementDateFilter === 'custom' ? 'bg-blue-900 text-white' : 'text-slate-600'}`}
                    >
                      Custom Range
                    </button>
                  </div>
                </div>

                {statementDateFilter === 'custom' && (
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={statementStartDate}
                      onChange={(e) => setStatementStartDate(e.target.value)}
                      className="bg-white border border-slate-200 rounded-lg p-1 text-xs font-mono"
                    />
                    <span className="text-slate-400 font-bold">&rarr;</span>
                    <input
                      type="date"
                      value={statementEndDate}
                      onChange={(e) => setStatementEndDate(e.target.value)}
                      className="bg-white border border-slate-200 rounded-lg p-1 text-xs font-mono"
                    />
                  </div>
                )}
              </div>

              {/* Printable Statement Body */}
              <div id="printable-area" className="overflow-y-auto flex-1 p-6 sm:p-8 bg-white text-slate-900 font-sans relative select-none print:overflow-visible print:p-0 space-y-5">
                
                {/* Official Showroom Header */}
                <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start border-b-2 border-slate-900 pb-4 gap-3 sm:gap-0">
                  <div className="flex items-center gap-3">
                    {settings?.logoUrl && (
                      <div className="h-12 w-auto shrink-0">
                        <Logo logoUrl={settings?.logoUrl} className="h-full w-auto text-blue-900" alt={settings?.name} />
                      </div>
                    )}
                    <div>
                      <h1 className="text-base sm:text-lg font-black text-slate-900 font-display tracking-tight leading-snug">
                        {settings?.name || 'Jubayer Machineries'}
                      </h1>
                      <p className="text-[9px] sm:text-[10px] text-slate-500 font-medium">{(settings?.address || 'Hazi Siddik Complex, Molla Market, Bason Sharok, Gazipur City.').replace(/corporate\s*office:?\s*/gi, '').trim()}</p>
                      <p className="text-[9px] sm:text-[10px] text-slate-500 font-medium">Hotline: {settings?.phone1 || '01715-994956'}, {settings?.phone2 || '01799-498199'}</p>
                      <p className="text-[9px] sm:text-[10px] text-slate-500 font-medium">Email: {settings?.email || 'jubayermachineries@gmail.com'} &bull; Web: {settings?.website || 'www.hitachiairsolutioncenter.com'}</p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right shrink-0">
                    <span className="font-black text-xs sm:text-sm text-slate-950 uppercase tracking-widest block font-mono">
                      CUSTOMER ACCOUNT STATEMENT
                    </span>
                    <span className="text-[10px] sm:text-[11px] text-rose-700 font-extrabold block">
                      Accounts Receivable Ledger
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-slate-400 block font-semibold mt-0.5">
                      Report Date: {new Date().toLocaleDateString('en-GB')}
                    </span>
                  </div>
                </div>

                {/* Customer Profile Box */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Client / Company Information</span>
                    <h3 className="font-extrabold text-sm text-slate-900 mt-0.5">{cust.company || 'Private Client'}</h3>
                    <p className="text-slate-600 font-bold text-[11px]">Contact Person: <span className="text-slate-900">{cust.name}</span></p>
                    <p className="text-slate-600 text-[11px]">Address: <span className="font-medium text-slate-800">{cust.address || 'Gazipur, Bangladesh'}</span></p>
                  </div>
                  <div className="text-left sm:text-right space-y-0.5">
                    <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Contact & Account Details</span>
                    <p className="font-bold text-slate-900 text-[11px]">Phone: <span className="font-mono text-blue-900">{cust.phone}</span></p>
                    {cust.email && <p className="text-slate-600 text-[11px]">Email: <span className="font-medium">{cust.email}</span></p>}
                    {cust.companyId && <p className="text-slate-500 font-mono text-[10px]">Account ID: {cust.companyId}</p>}
                  </div>
                </div>

                {/* Summary Balance Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {openingBalance > 0 && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-1">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Opening Due</span>
                      <span className="text-sm sm:text-base font-black text-slate-800 font-mono block">
                        Tk. {openingBalance.toLocaleString()}
                      </span>
                    </div>
                  )}

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-1">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Total Invoiced</span>
                    <span className="text-sm sm:text-base font-black text-slate-900 font-mono block">
                      Tk. {periodBilled.toLocaleString()}
                    </span>
                  </div>

                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-1">
                    <span className="text-[9px] font-bold text-emerald-800 uppercase tracking-wider block">Total Collected</span>
                    <span className="text-sm sm:text-base font-black text-emerald-700 font-mono block">
                      Tk. {periodPaid.toLocaleString()}
                    </span>
                  </div>

                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-center space-y-1">
                    <span className="text-[9px] font-bold text-rose-800 uppercase tracking-wider block">Net Outstanding Due</span>
                    <span className="text-sm sm:text-lg font-black text-rose-700 font-mono block">
                      Tk. {closingDue.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Payment History Receipts (no-print) */}
                {allCustomerReceipts.length > 0 && (
                  <div className="space-y-2 bg-blue-50/40 p-3.5 rounded-xl border border-blue-200/80 no-print">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider flex items-center gap-1.5 font-display">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        Official Money Receipts ({allCustomerReceipts.length})
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {allCustomerReceipts.map((rcpt, rIdx) => (
                        <div key={rcpt.id || rIdx} className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs space-y-1 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-center">
                              <span className="font-mono font-bold text-blue-900 text-[11px]">{rcpt.receiptNo}</span>
                              <span className="text-[9px] font-mono text-slate-400">{rcpt.date}</span>
                            </div>
                            <div className="text-sm font-black text-emerald-700 font-mono mt-0.5">
                              Tk. {rcpt.amount.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate">
                              Via {rcpt.paymentMethod} {rcpt.notes ? `• ${rcpt.notes}` : ''}
                            </div>
                          </div>

                          <button
                            onClick={() => setRecentReceipt({
                              receiptNo: rcpt.receiptNo,
                              date: rcpt.date,
                              customerName: rcpt.customerName || cust.name,
                              customerCompany: rcpt.customerCompany || cust.company || '',
                              customerPhone: rcpt.customerPhone || cust.phone || '',
                              amount: rcpt.amount,
                              discount: rcpt.discount,
                              paymentMethod: rcpt.paymentMethod,
                              notes: rcpt.notes,
                              references: rcpt.references,
                              remainingDue: rcpt.remainingDue
                            })}
                            className="w-full mt-1 py-1 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded font-bold text-[10px] uppercase flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          >
                            <Printer className="w-3 h-3 text-emerald-600" />
                            Print Receipt
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Chronological Transaction Table */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Itemized Transaction & Payment History (Running Due)
                    </h3>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Total {transactions.length} records
                    </span>
                  </div>

                  <div className="border border-slate-300 rounded-lg overflow-x-auto">
                    <table className="w-full text-left text-[11px] border-collapse min-w-[500px]">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 uppercase tracking-wider text-[9px]">
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Ref No.</th>
                          <th className="py-2.5 px-3">Particulars / Description</th>
                          <th className="py-2.5 px-3 text-right">Invoiced (Tk.)</th>
                          <th className="py-2.5 px-3 text-right">Paid (Tk.)</th>
                          <th className="py-2.5 px-3 text-right">Running Due (Tk.)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                        {openingBalance > 0 && (
                          <tr className="bg-slate-50 font-bold">
                            <td className="py-2 px-3 font-mono text-[10px]">{startFilter || '--'}</td>
                            <td className="py-2 px-3 font-mono text-[10px]">--</td>
                            <td className="py-2 px-3 text-slate-600 italic">Opening Balance Brought Forward</td>
                            <td className="py-2 px-3 text-right font-mono">--</td>
                            <td className="py-2 px-3 text-right font-mono">--</td>
                            <td className="py-2 px-3 text-right font-mono font-black text-rose-700">
                              Tk. {openingBalance.toLocaleString()}
                            </td>
                          </tr>
                        )}

                        {transactions.map((tx) => {
                          const isPayment = tx.type === 'PAYMENT';
                          return (
                            <tr key={tx.id} className={isPayment ? 'bg-emerald-50/40 font-semibold' : 'hover:bg-slate-50/50'}>
                              <td className="py-2.5 px-3 font-mono text-[10px] font-bold text-slate-600 whitespace-nowrap">{tx.date}</td>
                              <td className="py-2.5 px-3 font-mono font-bold text-blue-900 text-[10px] whitespace-nowrap">{tx.refNo}</td>
                              <td className="py-2.5 px-3 max-w-xs">
                                <span className="block leading-tight text-[11px]">{tx.particulars}</span>
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                                {tx.billed > 0 ? `Tk. ${tx.billed.toLocaleString()}` : '—'}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-700 whitespace-nowrap">
                                {tx.paid > 0 ? `+ Tk. ${tx.paid.toLocaleString()}` : '—'}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-black text-rose-700 whitespace-nowrap">
                                Tk. {tx.runningDue.toLocaleString()}
                              </td>
                            </tr>
                          );
                        })}
                        
                        {/* Summary Footer */}
                        <tr className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900 text-xs">
                          <td colSpan={3} className="py-3 px-3 uppercase tracking-wider text-[10px]">
                            Grand Closing Balance:
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-black whitespace-nowrap">
                            Tk. {periodBilled.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-black text-emerald-700 whitespace-nowrap">
                            Tk. {periodPaid.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-black text-rose-700 text-sm whitespace-nowrap">
                            Tk. {closingDue.toLocaleString()}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-8 sm:gap-16 pt-8 text-center text-[9px] sm:text-[10px] font-bold text-slate-500">
                  <div className="space-y-1">
                    <div className="border-t border-slate-400 pt-1.5 w-32 sm:w-48 mx-auto text-slate-800">
                      Customer Signature
                    </div>
                    <span className="text-[8px] sm:text-[9px] text-slate-400 italic block">Receiver / Client</span>
                  </div>
                  <div className="space-y-1">
                    <div className="border-t border-slate-400 pt-1.5 w-32 sm:w-48 mx-auto text-slate-800 font-bold">
                      {currentUser?.name || settings?.signatureName || 'MD MAHI UDDIN'}
                    </div>
                    <span className="text-[8px] sm:text-[9px] text-slate-500 font-semibold block">
                      {currentUser?.designation || 'Managing Director & Owner'}
                    </span>
                    <span className="text-[8px] sm:text-[9px] text-slate-400 italic block">Authorized Signatory</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL 7: INDIVIDUAL SUPPLIER STATEMENT */}
      {viewingSupplierReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in no-print-backdrop print:bg-transparent print:p-0">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl flex flex-col max-h-[85vh] sm:max-h-[88vh] my-auto overflow-hidden animate-slide-up print:max-h-none print:border-none print:shadow-none">
            <div className="bg-slate-950 text-white px-5 py-3.5 flex justify-between items-center gap-4 no-print shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <h3 className="font-extrabold text-xs sm:text-sm text-white leading-tight">
                    {viewingSupplierReport.supplier.company || viewingSupplierReport.supplier.name} - Supplier Account Statement
                  </h3>
                  <p className="text-[10px] text-slate-400 hidden sm:block">
                    Accounts payable procurement bills and disbursement ledger
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-extrabold uppercase rounded-lg flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Statement
                </button>
                <button 
                  onClick={() => setViewingSupplierReport(null)}
                  className="text-slate-400 hover:text-white font-bold bg-white/10 hover:bg-white/20 w-7 h-7 rounded-full flex items-center justify-center text-sm cursor-pointer transition-colors"
                >
                  &times;
                </button>
              </div>
            </div>

            <div id="printable-area" className="overflow-y-auto flex-1 p-6 sm:p-8 bg-white text-slate-900 font-sans relative select-none print:overflow-visible print:p-0 space-y-5">
              <div className="text-center space-y-1 pb-4 border-b-2 border-slate-900">
                <div className="text-xl font-black text-slate-900 font-display uppercase">
                  {settings?.name || 'Jubayer Machineries'}
                </div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                  SUPPLIER ACCOUNTS PAYABLE LEDGER
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Supplier Details</span>
                  <h3 className="font-extrabold text-sm text-slate-900">{viewingSupplierReport.supplier.company || viewingSupplierReport.supplier.name}</h3>
                  <p className="text-slate-600">Contact Person: {viewingSupplierReport.supplier.name}</p>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Contact Information</span>
                  <p className="font-mono font-bold text-slate-900">{viewingSupplierReport.supplier.phone}</p>
                  <p className="text-slate-500">{viewingSupplierReport.supplier.address}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Total Purchases</span>
                  <span className="text-base font-black text-slate-900 font-mono block">
                    Tk. {viewingSupplierReport.totalPurchased.toLocaleString()}
                  </span>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-1">
                  <span className="text-[9px] font-bold text-emerald-800 uppercase tracking-wider block">Total Paid</span>
                  <span className="text-base font-black text-emerald-700 font-mono block">
                    Tk. {viewingSupplierReport.totalPaid.toLocaleString()}
                  </span>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center space-y-1">
                  <span className="text-[9px] font-bold text-amber-800 uppercase tracking-wider block">Payable Due</span>
                  <span className="text-base font-black text-amber-800 font-mono block">
                    Tk. {viewingSupplierReport.due.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="border border-slate-300 rounded-lg overflow-x-auto">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 uppercase tracking-wider text-[9px]">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Purchase #</th>
                      <th className="py-2.5 px-3">Supplier Invoice #</th>
                      <th className="py-2.5 px-3 text-right">Total (Tk.)</th>
                      <th className="py-2.5 px-3 text-right">Paid (Tk.)</th>
                      <th className="py-2.5 px-3 text-right">Due (Tk.)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                    {viewingSupplierReport.purchases.map(p => (
                      <tr key={p.id}>
                        <td className="py-2.5 px-3 font-mono">{p.purchaseDate}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-900">{p.purchaseNumber}</td>
                        <td className="py-2.5 px-3 font-mono">{p.supplierInvoiceNo || '--'}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">Tk. {(p.grandTotal || 0).toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-700 font-bold">Tk. {(p.paidAmount || 0).toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-amber-800 font-black">Tk. {(p.dueAmount || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
