import { useState, useMemo } from 'react';
import { Document, Product, Customer, SalesReturn, Expense, Purchase, FieldDispatch } from '../types';
import { 
  Download, 
  Users, 
  ShoppingBag, 
  DollarSign, 
  Calendar, 
  BarChart3, 
  ArrowDown, 
  RotateCcw, 
  PlusCircle, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Package,
  Layers,
  Search,
  Wallet,
  Coins,
  TrendingUp,
  UserCheck,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface ReportsHubProps {
  documents: Document[];
  products: Product[];
  customers: Customer[];
  returns?: SalesReturn[];
  expenses?: Expense[];
  purchases?: Purchase[];
  dispatches?: FieldDispatch[];
  onSaveReturn?: (ret: SalesReturn) => Promise<void> | void;
  onDeleteReturn?: (id: string) => Promise<void> | void;
}

export default function ReportsHub({ 
  documents, 
  products, 
  customers,
  returns = [],
  expenses = [],
  purchases = [],
  dispatches = [],
  onSaveReturn,
  onDeleteReturn
}: ReportsHubProps) {
  const [activeReportTab, setActiveReportTab] = useState<'sales' | 'customer' | 'product' | 'returns' | 'income_expenses'>('sales');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('All');
  const [selectedBrand, setSelectedBrand] = useState<string>('All');
  const [returnSearch, setReturnSearch] = useState('');

  // Return Modal State
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnDocId, setReturnDocId] = useState('');
  const [returnCustomerId, setReturnCustomerId] = useState('');
  const [returnProductId, setReturnProductId] = useState('');
  const [returnProductName, setReturnProductName] = useState('');
  const [returnSku, setReturnSku] = useState('');
  const [returnBrand, setReturnBrand] = useState('');
  const [returnUnit, setReturnUnit] = useState('Pcs');
  const [returnQuantity, setReturnQuantity] = useState<number>(1);
  const [returnUnitPrice, setReturnUnitPrice] = useState<number>(0);
  const [returnRefundAmount, setReturnRefundAmount] = useState<number>(0);
  const [returnDate, setReturnDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [returnRestocked, setReturnRestocked] = useState(true);
  const [returnDeductDue, setReturnDeductDue] = useState(true);
  const [returnReason, setReturnReason] = useState('Wrong Specification / Parameter Mismatch');
  const [returnNotes, setReturnNotes] = useState('');
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);
  const [returnError, setReturnError] = useState('');

  // unique brands list
  const brands = useMemo(() => {
    return ['All', ...Array.from(new Set(products.map(p => p.brand)))];
  }, [products]);

  // Aggregate Sales Figures
  const salesMetrics = useMemo(() => {
    const invoices = documents.filter(d => d.type === 'INVOICE');
    const totalSalesValue = invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.total, 0);
    const totalTaxValue = invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.taxAmount, 0);
    const outstandingValue = invoices.filter(i => i.status === 'Unpaid' || i.status === 'Overdue').reduce((sum, i) => sum + i.total, 0);
    const draftValue = invoices.filter(i => i.status === 'Draft').reduce((sum, i) => sum + i.total, 0);

    return {
      totalSalesValue,
      totalTaxValue,
      outstandingValue,
      draftValue,
      totalInvoicesCount: invoices.length,
      paidCount: invoices.filter(i => i.status === 'Paid').length,
      unpaidCount: invoices.filter(i => i.status === 'Unpaid' || i.status === 'Overdue').length
    };
  }, [documents]);

  // Customer-based transactional details
  const customerSummary = useMemo(() => {
    return customers.map(cust => {
      const clientDocs = documents.filter(d => d.customerId === cust.id);
      const invoiceDocs = clientDocs.filter(d => d.type === 'INVOICE');
      const paidAmt = invoiceDocs.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.total, 0);
      const pendingAmt = invoiceDocs.filter(i => i.status === 'Unpaid' || i.status === 'Overdue').reduce((sum, i) => sum + i.total, 0);
      const quotesCount = clientDocs.filter(d => d.type === 'QUOTATION').length;
      const offersCount = clientDocs.filter(d => d.type === 'OFFER_LETTER').length;

      return {
        ...cust,
        totalDocsCount: clientDocs.length,
        paidAmt,
        pendingAmt,
        quotesCount,
        offersCount
      };
    });
  }, [documents, customers]);

  // Product sales details
  const productSalesSummary = useMemo(() => {
    // Tally up items sold across paid and sent invoices
    const soldQuantities: Record<string, number> = {};
    const soldAmounts: Record<string, number> = {};

    documents
      .filter(d => d.type === 'INVOICE' && d.status === 'Paid')
      .forEach(doc => {
        doc.items.forEach(item => {
          if (item.productId) {
            soldQuantities[item.productId] = (soldQuantities[item.productId] || 0) + item.quantity;
            soldAmounts[item.productId] = (soldAmounts[item.productId] || 0) + item.total;
          }
        });
      });

    return products.map(prod => {
      const qtySold = soldQuantities[prod.id] || 0;
      const totalRevenue = soldAmounts[prod.id] || 0;
      return {
        ...prod,
        qtySold,
        totalRevenue
      };
    });
  }, [documents, products]);

  // Filtered lists for rendering
  const displayedCustomerReport = useMemo(() => {
    if (selectedCustomerId === 'All') return customerSummary;
    return customerSummary.filter(c => c.id === selectedCustomerId);
  }, [customerSummary, selectedCustomerId]);

  const displayedProductReport = useMemo(() => {
    if (selectedBrand === 'All') return productSalesSummary;
    return productSalesSummary.filter(p => p.brand === selectedBrand);
  }, [productSalesSummary, selectedBrand]);

  // Sales Returns Metrics
  const returnsMetrics = useMemo(() => {
    const totalCount = returns.length;
    const totalUnitsRestocked = returns.reduce((sum, r) => sum + (r.restocked ? r.quantity : 0), 0);
    const totalRefundAmount = returns.reduce((sum, r) => sum + (r.refundAmount || 0), 0);
    return {
      totalCount,
      totalUnitsRestocked,
      totalRefundAmount
    };
  }, [returns]);

  // Total Income vs Various Expenses & Owner's Drawings Metrics
  const incomeExpensesMetrics = useMemo(() => {
    // Paid Invoice Collections
    const paidInvoicesVal = documents
      .filter(d => (d.type === 'INVOICE' || d.type === 'BILL'))
      .reduce((sum, d) => {
        if (d.paidAmount !== undefined) return sum + d.paidAmount;
        return d.status === 'Paid' ? sum + d.total : 0;
      }, 0);

    // Paid Field Service Dispatches Collections
    const paidDispatchesVal = dispatches.reduce((sum, d) => sum + (Number(d.paidAmount) || 0), 0);

    const totalIncome = paidInvoicesVal + paidDispatchesVal;

    // Showroom Overhead Expenses (Excluding Owner Draw)
    const OWNER_DRAW_CAT = "Owner's Drawings / Personal Expense";
    const showroomExpensesVal = expenses
      .filter(e => e.category !== OWNER_DRAW_CAT)
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    // Stock Purchases Costs
    const purchasesCostVal = purchases.reduce((sum, p) => sum + (Number(p.paidAmount) || 0), 0);

    // Field Service Travel Expenses
    const fieldExpensesVal = dispatches.reduce((sum, d) => sum + (Number(d.expenseAmount) || 0), 0);

    const totalOperatingExpenses = showroomExpensesVal + purchasesCostVal + fieldExpensesVal;

    // Owner's Personal Drawings
    const ownerDrawingsVal = expenses
      .filter(e => e.category === OWNER_DRAW_CAT)
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const totalAllExpensesCombined = totalOperatingExpenses + ownerDrawingsVal;

    const netProfitBeforeDraw = totalIncome - totalOperatingExpenses;
    const netRetainedCash = totalIncome - totalAllExpensesCombined;

    return {
      paidInvoicesVal,
      paidDispatchesVal,
      totalIncome,
      showroomExpensesVal,
      purchasesCostVal,
      fieldExpensesVal,
      totalOperatingExpenses,
      ownerDrawingsVal,
      totalAllExpensesCombined,
      netProfitBeforeDraw,
      netRetainedCash
    };
  }, [documents, dispatches, expenses, purchases]);

  const filteredReturns = useMemo(() => {
    if (!returnSearch.trim()) return returns;
    const term = returnSearch.toLowerCase();
    return returns.filter(r => 
      r.returnNumber.toLowerCase().includes(term) ||
      r.customerName.toLowerCase().includes(term) ||
      (r.customerCompany && r.customerCompany.toLowerCase().includes(term)) ||
      r.productName.toLowerCase().includes(term) ||
      (r.sku && r.sku.toLowerCase().includes(term)) ||
      (r.originalDocNumber && r.originalDocNumber.toLowerCase().includes(term))
    );
  }, [returns, returnSearch]);

  // List of sales invoices available for returns (past 1, 2, or more months)
  const salesInvoices = useMemo(() => {
    return documents.filter(d => d.type === 'INVOICE' || d.type === 'BILL');
  }, [documents]);

  const selectedInvoice = useMemo(() => {
    return documents.find(d => d.id === returnDocId) || null;
  }, [documents, returnDocId]);

  // Handle invoice selection in return modal
  const handleSelectInvoice = (docId: string) => {
    setReturnDocId(docId);
    const doc = documents.find(d => d.id === docId);
    if (doc) {
      setReturnCustomerId(doc.customerId || '');
      // If invoice has items, pre-select first item
      if (doc.items && doc.items.length > 0) {
        const item = doc.items[0];
        setReturnProductId(item.productId || '');
        setReturnProductName(item.name);
        setReturnSku(item.brand || '');
        setReturnBrand('Hitachi');
        setReturnUnit(item.unit || 'Pcs');
        setReturnQuantity(1);
        setReturnUnitPrice(item.price);
        setReturnRefundAmount(item.price * 1);
      }
    }
  };

  // Handle selecting an item from the selected invoice
  const handleSelectInvoiceItem = (itemId: string) => {
    if (!selectedInvoice) return;
    const item = selectedInvoice.items.find(i => i.id === itemId);
    if (item) {
      setReturnProductId(item.productId || '');
      setReturnProductName(item.name);
      setReturnSku(item.brand || '');
      setReturnBrand('Hitachi');
      setReturnUnit(item.unit || 'Pcs');
      setReturnUnitPrice(item.price);
      setReturnRefundAmount(item.price * returnQuantity);
    }
  };

  // Handle Return Form Submit
  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReturnError('');

    if (!returnProductName.trim()) {
      setReturnError('Please specify the product being returned.');
      return;
    }
    if (returnQuantity <= 0) {
      setReturnError('Return quantity must be at least 1.');
      return;
    }

    setIsSubmittingReturn(true);
    try {
      const cust = customers.find(c => c.id === returnCustomerId) || (selectedInvoice ? {
        id: selectedInvoice.customerId,
        name: selectedInvoice.customerName,
        company: selectedInvoice.customerCompany
      } : null);

      const returnRecord: SalesReturn = {
        id: `ret-${Date.now()}`,
        returnNumber: `RET/${new Date().getFullYear()}/${String(returns.length + 1).padStart(3, '0')}`,
        returnDate,
        originalDocId: returnDocId || undefined,
        originalDocNumber: selectedInvoice?.docNumber || undefined,
        customerId: returnCustomerId || selectedInvoice?.customerId || 'cust-general',
        customerName: cust?.name || selectedInvoice?.customerName || 'General Customer',
        customerCompany: cust?.company || selectedInvoice?.customerCompany || '',
        productId: returnProductId || `prod-ret-${Date.now()}`,
        productName: returnProductName.trim(),
        sku: returnSku.trim(),
        brand: returnBrand.trim() || 'Hitachi',
        unit: returnUnit.trim() || 'Pcs',
        quantity: Number(returnQuantity) || 1,
        unitPrice: Number(returnUnitPrice) || 0,
        refundAmount: Number(returnRefundAmount) || 0,
        restocked: returnRestocked,
        deductFromDue: returnDeductDue,
        reason: returnReason,
        notes: returnNotes.trim(),
        createdAt: new Date().toISOString().split('T')[0]
      };

      if (onSaveReturn) {
        await onSaveReturn(returnRecord);
      }

      setIsReturnModalOpen(false);
      // Reset form
      setReturnDocId('');
      setReturnCustomerId('');
      setReturnProductId('');
      setReturnProductName('');
      setReturnSku('');
      setReturnQuantity(1);
      setReturnUnitPrice(0);
      setReturnRefundAmount(0);
      setReturnNotes('');
    } catch (err: any) {
      setReturnError(err.message || 'Failed to submit sales return');
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  // CLIENT-SIDE DOWNLOAD DYNAMIC CSV GENERATOR
  const downloadCSV = (reportType: 'sales' | 'customers' | 'products' | 'returns' | 'income_expenses') => {
    let csvContent = "data:text/csv;charset=utf-8,";
    let filename = `hitachisolutioncenter-${reportType}-Report.csv`;

    if (reportType === 'income_expenses') {
      csvContent += "Financial Metric / Category,Amount (BDT),Notes\n";
      csvContent += `Sales Invoices Collection,${incomeExpensesMetrics.paidInvoicesVal},Paid Sales Receipts\n`;
      csvContent += `Field Service Dispatches Collection,${incomeExpensesMetrics.paidDispatchesVal},Service & Repair Payments\n`;
      csvContent += `TOTAL INCOME / REVENUE,${incomeExpensesMetrics.totalIncome},Total Cash Inflow\n`;
      csvContent += `Showroom & Overhead Expenses,${incomeExpensesMetrics.showroomExpensesVal},Utilities Rent & Maintenance\n`;
      csvContent += `Stock Purchases Inward Cost,${incomeExpensesMetrics.purchasesCostVal},Parts & Machine Buying\n`;
      csvContent += `Field Service Travel Expenses,${incomeExpensesMetrics.fieldExpensesVal},Staff Travel & Meal\n`;
      csvContent += `TOTAL OPERATING EXPENSES,${incomeExpensesMetrics.totalOperatingExpenses},Total Operating Outflow\n`;
      csvContent += `NET OPERATING PROFIT,${incomeExpensesMetrics.netProfitBeforeDraw},Profit Before Owner Drawings\n`;
      csvContent += `OWNER PERSONAL DRAWINGS,${incomeExpensesMetrics.ownerDrawingsVal},Owner Personal Expenses\n`;
      csvContent += `NET RETAINED SURPLUS CASH,${incomeExpensesMetrics.netRetainedCash},Net Cash Balance\n`;
    } else if (reportType === 'sales') {
      csvContent += "Metric Label,Value (BDT / Count)\n";
      csvContent += `Total Sales Revenue (Paid Invoices),Tk. ${salesMetrics.totalSalesValue}\n`;
      csvContent += `Total VAT/Tax Collected,Tk. ${salesMetrics.totalTaxValue}\n`;
      csvContent += `Outstanding Receivables (Unpaid),Tk. ${salesMetrics.outstandingValue}\n`;
      csvContent += `Draft Invoices Value,Tk. ${salesMetrics.draftValue}\n`;
      csvContent += `Total Billing Invoice Count,${salesMetrics.totalInvoicesCount}\n`;
      csvContent += `Cleared Invoices,${salesMetrics.paidCount}\n`;
      csvContent += `Outstanding Invoices,${salesMetrics.unpaidCount}\n`;
    } else if (reportType === 'customers') {
      csvContent += "Customer Company,Contact Name,Phone,Email,Total Documents,Total Paid (BDT),Pending Amount (BDT),Quotes Sent,Offers Drafted\n";
      customerSummary.forEach(c => {
        csvContent += `"${c.company || 'Private'}","${c.name}","${c.phone}","${c.email}",${c.totalDocsCount},${c.paidAmt},${c.pendingAmt},${c.quotesCount},${c.offersCount}\n`;
      });
    } else if (reportType === 'products') {
      csvContent += "SKU,Product Name,Category,Brand,Standard Unit Price (BDT),Available Stock,Quantity Sold,Revenue Generated (BDT)\n";
      productSalesSummary.forEach(p => {
        csvContent += `"${p.sku}","${p.name}","${p.category}","${p.brand}",${p.price},${p.stock},${p.qtySold},${p.totalRevenue}\n`;
      });
    } else if (reportType === 'returns') {
      csvContent += "Return Voucher No,Return Date,Invoice Ref,Customer,Company,Product Name,Parts No/SKU,Quantity,Unit,Refund Amount (BDT),Restocked In Inventory,Deducted From Due,Reason,Notes\n";
      returns.forEach(r => {
        csvContent += `"${r.returnNumber}","${r.returnDate}","${r.originalDocNumber || ''}","${r.customerName}","${r.customerCompany || ''}","${r.productName}","${r.sku || ''}",${r.quantity},"${r.unit}",${r.refundAmount},"${r.restocked ? 'YES' : 'NO'}","${r.deductFromDue ? 'YES' : 'NO'}","${r.reason}","${r.notes || ''}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 text-xs">
      
      {/* Upper Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-4 rounded-xl shadow-2xs">
        <div className="flex bg-slate-100 p-1.5 rounded-lg border border-slate-200 gap-1 self-start">
          <button
            onClick={() => setActiveReportTab('sales')}
            className={`px-4 py-2 font-bold uppercase tracking-wider rounded-md cursor-pointer transition-colors ${
              activeReportTab === 'sales'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sales Reports
          </button>
          
          <button
            onClick={() => setActiveReportTab('income_expenses')}
            className={`px-4 py-2 font-bold uppercase tracking-wider rounded-md cursor-pointer transition-colors flex items-center gap-1.5 ${
              activeReportTab === 'income_expenses'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Coins className="w-3.5 h-3.5 text-amber-300" />
            Income vs Expenses
          </button>
          
          <button
            onClick={() => setActiveReportTab('customer')}
            className={`px-4 py-2 font-bold uppercase tracking-wider rounded-md cursor-pointer transition-colors ${
              activeReportTab === 'customer'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Customer-Based Reports
          </button>

          <button
            onClick={() => setActiveReportTab('product')}
            className={`px-4 py-2 font-bold uppercase tracking-wider rounded-md cursor-pointer transition-colors ${
              activeReportTab === 'product'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Product Stock Reports
          </button>

          <button
            onClick={() => setActiveReportTab('returns')}
            className={`px-4 py-2 font-bold uppercase tracking-wider rounded-md cursor-pointer transition-colors flex items-center gap-1.5 ${
              activeReportTab === 'returns'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Sales Returns & Restock ({returns.length})
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {activeReportTab === 'returns' && (
            <button
              onClick={() => setIsReturnModalOpen(true)}
              className="px-4 py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-bold uppercase tracking-wider rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              + New Sales Return Entry
            </button>
          )}

          <button
            onClick={() => downloadCSV(activeReportTab === 'customer' ? 'customers' : activeReportTab === 'product' ? 'products' : activeReportTab)}
            className="px-4 py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-bold uppercase tracking-wider rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Download className="w-4.5 h-4.5" />
            Download CSV Spreadsheet
          </button>
        </div>
      </div>

      {/* RENDER DYNAMIC TAB CONTENT */}

      {/* Tab: Total Income vs Various Expenses (Total Income - Various Expenses & Owner Drawings) */}
      {activeReportTab === 'income_expenses' && (
        <div className="space-y-6 animate-fade-in">
          {/* Top KPI Summary Banner */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-sm font-display text-white">
                  Annual / Monthly Profit & Loss Statement (Income vs Expenses)
                </h3>
              </div>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-3 py-1 rounded-full font-mono border border-slate-700">
                Total Revenue minus Operating Expenses & Owner Drawings
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-slate-800/90 border border-slate-700 p-3.5 sm:p-4 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Total Revenue</span>
                <span className="text-lg sm:text-xl font-black font-display text-emerald-300 block">Tk. {incomeExpensesMetrics.totalIncome.toLocaleString()}</span>
                <span className="text-[9px] sm:text-[10px] text-slate-400 block">Invoice Collections + Field Service Cash</span>
              </div>

              <div className="bg-slate-800/90 border border-slate-700 p-3.5 sm:p-4 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Operating Expenses</span>
                <span className="text-lg sm:text-xl font-black font-display text-amber-300 block">Tk. {incomeExpensesMetrics.totalOperatingExpenses.toLocaleString()}</span>
                <span className="text-[9px] sm:text-[10px] text-slate-400 block">Showroom Utilities + Parts Purchases + Travel</span>
              </div>

              <div className="bg-slate-800/90 border border-slate-700 p-3.5 sm:p-4 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">Owner's Drawings</span>
                <span className="text-lg sm:text-xl font-black font-display text-rose-300 block">Tk. {incomeExpensesMetrics.ownerDrawingsVal.toLocaleString()}</span>
                <span className="text-[9px] sm:text-[10px] text-slate-400 block">Owner's Personal & Family Withdrawals</span>
              </div>

              <div className="bg-slate-950 border border-emerald-500/30 p-3.5 sm:p-4 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider block">Net Surplus Cash Flow</span>
                <span className={`text-lg sm:text-xl font-black font-display block ${incomeExpensesMetrics.netRetainedCash >= 0 ? 'text-blue-300' : 'text-rose-400'}`}>
                  Tk. {incomeExpensesMetrics.netRetainedCash.toLocaleString()}
                </span>
                <span className="text-[9px] sm:text-[10px] text-emerald-400 block font-semibold">Remaining balance after all expenses & drawings</span>
              </div>
            </div>
          </div>

          {/* Detailed Financial Breakdown Table */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-2xs space-y-3 sm:space-y-4">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 font-display flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-900" />
              Financial Income & Expense Statement
            </h3>

            <div className="border border-slate-200 rounded-xl overflow-x-auto font-sans">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 sm:py-3 px-3 sm:px-4">Particulars / Category</th>
                    <th className="py-2.5 sm:py-3 px-3 sm:px-4 text-center">Type</th>
                    <th className="py-2.5 sm:py-3 px-3 sm:px-4 text-right">Amount (BDT)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold">
                  {/* Revenue Row 1 */}
                  <tr className="bg-emerald-50/40">
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-slate-900 font-bold">Sales Invoices Collections (Paid Invoices)</td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-center text-emerald-700 font-bold">INCOME</td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-right font-extrabold text-emerald-800 font-mono whitespace-nowrap">Tk. {incomeExpensesMetrics.paidInvoicesVal.toLocaleString()}</td>
                  </tr>

                  {/* Revenue Row 2 */}
                  <tr className="bg-emerald-50/40">
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-slate-900 font-bold">Field Service & Memo Cash Collections</td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-center text-emerald-700 font-bold">INCOME</td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-right font-extrabold text-emerald-800 font-mono whitespace-nowrap">Tk. {incomeExpensesMetrics.paidDispatchesVal.toLocaleString()}</td>
                  </tr>

                  {/* Subtotal Income */}
                  <tr className="bg-emerald-100/70 border-t-2 border-emerald-300 font-extrabold">
                    <td className="py-3 px-3 sm:px-4 text-emerald-950 font-black uppercase tracking-wider text-[11px] sm:text-xs">TOTAL BUSINESS REVENUE (TOTAL INFLOW)</td>
                    <td className="py-3 px-3 sm:px-4 text-center text-emerald-900 text-[10px] sm:text-xs">TOTAL INFLOW</td>
                    <td className="py-3 px-3 sm:px-4 text-right font-black text-emerald-900 font-mono text-xs sm:text-sm whitespace-nowrap">Tk. {incomeExpensesMetrics.totalIncome.toLocaleString()}</td>
                  </tr>

                  {/* Expense Row 1 */}
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-slate-800 font-bold">Showroom Operations, Utilities, Rent & Entertainment</td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-center text-amber-700 font-bold">EXPENSE</td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-right font-extrabold text-slate-900 font-mono whitespace-nowrap">Tk. {incomeExpensesMetrics.showroomExpensesVal.toLocaleString()}</td>
                  </tr>

                  {/* Expense Row 2 */}
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-slate-800 font-bold">Spare Parts & Stock Purchases (Inward Cost)</td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-center text-amber-700 font-bold">EXPENSE</td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-right font-extrabold text-slate-900 font-mono whitespace-nowrap">Tk. {incomeExpensesMetrics.purchasesCostVal.toLocaleString()}</td>
                  </tr>

                  {/* Expense Row 3 */}
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-slate-800 font-bold">Technicians Field Service Conveyance & Expenses</td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-center text-amber-700 font-bold">EXPENSE</td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-right font-extrabold text-slate-900 font-mono whitespace-nowrap">Tk. {incomeExpensesMetrics.fieldExpensesVal.toLocaleString()}</td>
                  </tr>

                  {/* Subtotal Operating Expenses */}
                  <tr className="bg-amber-50 border-t-2 border-amber-300 font-extrabold">
                    <td className="py-3 px-3 sm:px-4 text-amber-950 font-black uppercase tracking-wider text-[11px] sm:text-xs">TOTAL OPERATING EXPENSES (OUTFLOW)</td>
                    <td className="py-3 px-3 sm:px-4 text-center text-amber-900 text-[10px] sm:text-xs">OPERATING OUTFLOW</td>
                    <td className="py-3 px-3 sm:px-4 text-right font-black text-amber-900 font-mono text-xs sm:text-sm whitespace-nowrap">Tk. {incomeExpensesMetrics.totalOperatingExpenses.toLocaleString()}</td>
                  </tr>

                  {/* Operating Profit before Owner Draw */}
                  <tr className="bg-blue-50 border-t border-b border-blue-200 font-extrabold">
                    <td className="py-3 px-3 sm:px-4 text-blue-950 font-black uppercase tracking-wider text-[11px] sm:text-xs">NET OPERATING PROFIT</td>
                    <td className="py-3 px-3 sm:px-4 text-center text-blue-900 text-[10px] sm:text-xs">INCOME - EXPENSES</td>
                    <td className="py-3 px-3 sm:px-4 text-right font-black text-blue-950 font-mono text-xs sm:text-sm whitespace-nowrap">Tk. {incomeExpensesMetrics.netProfitBeforeDraw.toLocaleString()}</td>
                  </tr>

                  {/* Owner's Draw Row */}
                  <tr className="bg-rose-50/60">
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-rose-950 font-black">OWNER'S PERSONAL DRAWINGS</td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-center text-rose-800 font-bold">OWNER DRAW</td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-right font-black text-rose-700 font-mono text-xs sm:text-sm whitespace-nowrap">Tk. {incomeExpensesMetrics.ownerDrawingsVal.toLocaleString()}</td>
                  </tr>

                  {/* Final Net Cash Retained */}
                  <tr className="bg-slate-900 text-white font-extrabold border-t-2 border-slate-950">
                    <td className="py-3.5 sm:py-4 px-3 sm:px-4 font-black text-white text-[11px] sm:text-xs uppercase tracking-wider">
                      NET SURPLUS RETAINED CASH FLOW
                    </td>
                    <td className="py-3.5 sm:py-4 px-3 sm:px-4 text-center text-slate-300 text-[10px] sm:text-xs whitespace-nowrap">FINAL CASH BALANCE</td>
                    <td className={`py-3.5 sm:py-4 px-3 sm:px-4 text-right font-black text-sm sm:text-base font-mono whitespace-nowrap ${incomeExpensesMetrics.netRetainedCash >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      Tk. {incomeExpensesMetrics.netRetainedCash.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: Sales Summary & Trends */}
      {activeReportTab === 'sales' && (
        <div className="space-y-6 animate-fade-in">
          {/* Subheader summary grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-emerald-800 space-y-1.5">
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-[10px] uppercase tracking-wider text-emerald-600">Cleared Sales Revenue</span>
              </div>
              <h4 className="text-xl font-extrabold font-display">Tk. {salesMetrics.totalSalesValue.toLocaleString()}</h4>
              <p className="text-[10px] text-emerald-600/70 font-semibold">From {salesMetrics.paidCount} paid invoice receipts</p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-amber-800 space-y-1.5">
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4 text-amber-600" />
                <span className="font-bold text-[10px] uppercase tracking-wider text-amber-600">Outstanding Receivables</span>
              </div>
              <h4 className="text-xl font-extrabold font-display">Tk. {salesMetrics.outstandingValue.toLocaleString()}</h4>
              <p className="text-[10px] text-amber-600/70 font-semibold">From {salesMetrics.unpaidCount} unpaid/overdue invoices</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-blue-800 space-y-1.5">
              <div className="flex items-center gap-1">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-[10px] uppercase tracking-wider text-blue-600">Tax / VAT Collected</span>
              </div>
              <h4 className="text-xl font-extrabold font-display">Tk. {salesMetrics.totalTaxValue.toLocaleString()}</h4>
              <p className="text-[10px] text-blue-600/70 font-semibold">Average 5% brand tax on completed billing</p>
            </div>
          </div>

          {/* Breakdown Detail Block */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 font-display">Operational Sales Summary Log</h3>
            
            <div className="border border-slate-150 rounded-xl overflow-hidden font-sans">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase">
                    <th className="py-3 px-4">Financial Metric Item</th>
                    <th className="py-3 px-4 text-right">Aggregate Balance / Volume</th>
                    <th className="py-3 px-4">Performance Scope</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-800">Total Invoice Billing Volume</td>
                    <td className="py-3 px-4 text-right font-extrabold text-slate-900 font-display">Tk. {(salesMetrics.totalSalesValue + salesMetrics.outstandingValue).toLocaleString()}</td>
                    <td className="py-3 px-4 text-slate-500 font-medium">All completed & outstanding client transactions</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-800">Completed Payments Received</td>
                    <td className="py-3 px-4 text-right font-extrabold text-emerald-700 font-display">Tk. {salesMetrics.totalSalesValue.toLocaleString()}</td>
                    <td className="py-3 px-4 text-emerald-600 font-bold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Fully Cleared BDT Balance
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-800">Uncollected Customer Outstanding</td>
                    <td className="py-3 px-4 text-right font-extrabold text-amber-700 font-display">Tk. {salesMetrics.outstandingValue.toLocaleString()}</td>
                    <td className="py-3 px-4 text-slate-500 font-medium">Accounts Receivable pending showroom review</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-800">Active Pipeline Quotes</td>
                    <td className="py-3 px-4 text-right font-extrabold text-blue-900 font-display">
                      {documents.filter(d => d.type === 'QUOTATION' && d.status === 'Sent').length} items
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-medium">Quotations awaiting final customer purchase order</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Customer-Based Reports */}
      {activeReportTab === 'customer' && (
        <div className="space-y-6 animate-fade-in">
          {/* Filters */}
          <div className="flex bg-white border border-slate-200 p-4 rounded-xl items-center gap-3 shadow-2xs">
            <span className="font-bold text-slate-500 text-[10px] uppercase tracking-wider">Filter Customer:</span>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-bold focus:outline-hidden cursor-pointer"
            >
              <option value="All">All Registered Clients</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.company || c.name}</option>
              ))}
            </select>
          </div>

          {/* Customer Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <table className="w-full text-left font-sans">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Company & Client Info</th>
                  <th className="py-3.5 px-3">Contact Directs</th>
                  <th className="py-3.5 px-3 text-center">Docs Volume</th>
                  <th className="py-3.5 px-3 text-right">Total Paid</th>
                  <th className="py-3.5 px-3 text-right">Outstanding Amount</th>
                  <th className="py-3.5 px-3 text-center">Inquiry Pipeline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedCustomerReport.length > 0 ? (
                  displayedCustomerReport.map(c => {
                    const hasOutstanding = c.pendingAmt > 0;
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/50">
                        {/* Company Name */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-900 block leading-tight">{c.company || 'Private Client'}</span>
                            <span className="text-[10px] text-slate-500 block font-semibold">Attn: {c.name}</span>
                          </div>
                        </td>

                        {/* Contact info */}
                        <td className="py-3.5 px-3 text-slate-600 font-medium">
                          <div>Ph: <span className="font-bold text-slate-800">{c.phone}</span></div>
                          {c.email && <div className="text-[10px] text-slate-400">{c.email}</div>}
                        </td>

                        {/* Docs count */}
                        <td className="py-3.5 px-3 text-center font-bold text-slate-700">
                          {c.totalDocsCount} documents
                        </td>

                        {/* Total Paid BDT */}
                        <td className="py-3.5 px-3 text-right font-extrabold text-slate-900 font-display">
                          Tk. {c.paidAmt.toLocaleString()}
                        </td>

                        {/* Pending Amt */}
                        <td className="py-3.5 px-3 text-right">
                          <span className={`font-extrabold font-display ${hasOutstanding ? 'text-rose-600' : 'text-slate-500'}`}>
                            Tk. {c.pendingAmt.toLocaleString()}
                          </span>
                        </td>

                        {/* Pipeline info */}
                        <td className="py-3.5 px-3 text-center text-slate-500">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-violet-50 text-violet-700 border border-violet-100">
                            {c.offersCount} Offers
                          </span>
                          <span className="inline-block ml-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                            {c.quotesCount} Quotes
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400 italic">
                      No customer reports match this selection.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Product sales reports */}
      {activeReportTab === 'product' && (
        <div className="space-y-6 animate-fade-in">
          {/* Filters */}
          <div className="flex bg-white border border-slate-200 p-4 rounded-xl items-center gap-3 shadow-2xs">
            <span className="font-bold text-slate-500 text-[10px] uppercase tracking-wider">Filter Brand:</span>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-bold focus:outline-hidden cursor-pointer"
            >
              {brands.map(b => (
                <option key={b} value={b}>{b === 'All' ? 'All Brands Sourced' : b}</option>
              ))}
            </select>
          </div>

          {/* Product Sales table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <table className="w-full text-left font-sans">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Item SKU / Name</th>
                  <th className="py-3.5 px-3">Brand Origin</th>
                  <th className="py-3.5 px-3 text-right">Standard Price</th>
                  <th className="py-3.5 px-3 text-center">Remaining Stock</th>
                  <th className="py-3.5 px-3 text-center">Quantity Sold</th>
                  <th className="py-3.5 px-4 text-right">Total Revenue BDT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedProductReport.length > 0 ? (
                  displayedProductReport.map(p => {
                    const isOutOfStock = p.stock === 0;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        {/* Name SKU */}
                        <td className="py-3.5 px-4 max-w-sm">
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-900 block leading-tight">{p.name}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">{p.sku}</span>
                          </div>
                        </td>

                        {/* Brand */}
                        <td className="py-3.5 px-3">
                          <span className="inline-block bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded text-[10px]">
                            {p.brand}
                          </span>
                        </td>

                        {/* Standard price */}
                        <td className="py-3.5 px-3 text-right font-extrabold text-slate-950 font-display">
                          Tk. {p.price.toLocaleString()} / {p.unit}
                        </td>

                        {/* Remaining stock */}
                        <td className="py-3.5 px-3 text-center">
                          <span className={`font-extrabold text-sm ${isOutOfStock ? 'text-rose-600 font-display' : 'text-slate-800'}`}>
                            {p.stock}
                          </span>
                        </td>

                        {/* Quantity sold */}
                        <td className="py-3.5 px-3 text-center font-extrabold text-blue-900">
                          {p.qtySold} sold
                        </td>

                        {/* Total Revenue */}
                        <td className="py-3.5 px-4 text-right font-black text-slate-900 font-display">
                          Tk. {p.totalRevenue.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400 italic">
                      No products matched your brand filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Sales Returns & Restock Hub */}
      {activeReportTab === 'returns' && (
        <div className="space-y-6 animate-fade-in">
          {/* Subheader summary grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 text-rose-900 space-y-1.5">
              <div className="flex items-center gap-1">
                <RotateCcw className="w-4 h-4 text-rose-600" />
                <span className="font-bold text-[10px] uppercase tracking-wider text-rose-600">Total Returns Recorded</span>
              </div>
              <h4 className="text-xl font-extrabold font-display">{returnsMetrics.totalCount} Vouchers</h4>
              <p className="text-[10px] text-rose-700/80 font-semibold">Complete tracking of customer sales returns</p>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-emerald-900 space-y-1.5">
              <div className="flex items-center gap-1">
                <Package className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-[10px] uppercase tracking-wider text-emerald-600">Restocked Into Inventory</span>
              </div>
              <h4 className="text-xl font-extrabold font-display">+{returnsMetrics.totalUnitsRestocked} Units</h4>
              <p className="text-[10px] text-emerald-700/80 font-semibold">Inventory stock restored automatically</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-blue-900 space-y-1.5">
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-[10px] uppercase tracking-wider text-blue-600">Refund / Due Adjustment Value</span>
              </div>
              <h4 className="text-xl font-extrabold font-display">Tk. {returnsMetrics.totalRefundAmount.toLocaleString()}</h4>
              <p className="text-[10px] text-blue-700/80 font-semibold">Deducted from customer receivables or refunded</p>
            </div>
          </div>

          {/* Search bar & filter toolbar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search Return #, customer, invoice ref, or parts no..."
                value={returnSearch}
                onChange={(e) => setReturnSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white focus:outline-hidden"
              />
            </div>

            <button
              onClick={() => setIsReturnModalOpen(true)}
              className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold uppercase tracking-wider rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              + New Sales Return Entry
            </button>
          </div>

          {/* Returns Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Return SNo. / Date</th>
                    <th className="py-3.5 px-3">Customer / Company</th>
                    <th className="py-3.5 px-3">Invoice Ref</th>
                    <th className="py-3.5 px-3">Product & Parts No.</th>
                    <th className="py-3.5 px-3 text-center">Returned Qty</th>
                    <th className="py-3.5 px-3 text-right">Refund / Value</th>
                    <th className="py-3.5 px-3 text-center">Restocked</th>
                    <th className="py-3.5 px-3">Reason & Notes</th>
                    {onDeleteReturn && <th className="py-3.5 px-3 text-center w-12"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReturns.length > 0 ? (
                    filteredReturns.map(ret => (
                      <tr key={ret.id} className="hover:bg-slate-50/50">
                        {/* Return No & Date */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <span className="font-extrabold text-slate-900 block font-mono text-xs">{ret.returnNumber}</span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {ret.returnDate}
                            </span>
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="py-3.5 px-3">
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-900 block leading-tight">{ret.customerName}</span>
                            <span className="text-[10px] text-slate-400 block">{ret.customerCompany || 'General'}</span>
                          </div>
                        </td>

                        {/* Invoice Ref */}
                        <td className="py-3.5 px-3 font-mono text-xs">
                          {ret.originalDocNumber ? (
                            <span className="inline-block bg-blue-50 text-blue-800 font-bold px-2 py-0.5 rounded border border-blue-200">
                              {ret.originalDocNumber}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Direct Return</span>
                          )}
                        </td>

                        {/* Product & Parts No */}
                        <td className="py-3.5 px-3 max-w-xs">
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-900 block leading-tight">{ret.productName}</span>
                            {ret.sku && (
                              <span className="text-[10px] font-mono text-slate-500 font-bold bg-slate-100 px-1.5 py-0.5 rounded inline-block">
                                Parts: {ret.sku}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Returned Qty */}
                        <td className="py-3.5 px-3 text-center">
                          <span className="font-extrabold text-sm text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            {ret.quantity} {ret.unit || 'Pcs'}
                          </span>
                        </td>

                        {/* Refund Value */}
                        <td className="py-3.5 px-3 text-right">
                          <span className="font-black text-slate-900 font-display text-xs block">
                            Tk. {(ret.refundAmount || 0).toLocaleString()}
                          </span>
                          {ret.deductFromDue ? (
                            <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                              Due Deducted
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold text-slate-500">
                              Cash/Bank Refund
                            </span>
                          )}
                        </td>

                        {/* Restocked */}
                        <td className="py-3.5 px-3 text-center">
                          {ret.restocked ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold px-2 py-0.5 rounded-full text-[10px]">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Restocked (+{ret.quantity})
                            </span>
                          ) : (
                            <span className="inline-block bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full text-[10px]">
                              No Restock
                            </span>
                          )}
                        </td>

                        {/* Reason & Notes */}
                        <td className="py-3.5 px-3 max-w-xs">
                          <div className="space-y-0.5">
                            <span className="inline-block bg-amber-50 text-amber-800 border border-amber-200 font-bold px-1.5 py-0.5 rounded text-[10px]">
                              {ret.reason}
                            </span>
                            {ret.notes && (
                              <p className="text-[10px] text-slate-500 italic line-clamp-1">{ret.notes}</p>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        {onDeleteReturn && (
                          <td className="py-3.5 px-3 text-center">
                            <button
                              onClick={() => onDeleteReturn(ret.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer rounded hover:bg-rose-50"
                              title="Delete return record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-slate-400 italic">
                        {returnSearch ? 'No sales returns matched your search.' : 'No sales returns recorded yet. Click "+ New Sales Return" above to record a returned item.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* NEW SALES RETURN MODAL */}
      {isReturnModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl p-6 space-y-4 my-8 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">New Sales Return Entry</h3>
                  <p className="text-[10px] text-slate-400">Restore inventory stock and update customer account when sold products are returned.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReturnModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {returnError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{returnError}</span>
              </div>
            )}

            <form onSubmit={handleReturnSubmit} className="space-y-4 text-xs">
              {/* Row 1: Invoice Selection & Return Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Select Past Sales Invoice / Bill</label>
                  <select
                    value={returnDocId}
                    onChange={(e) => handleSelectInvoice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold text-slate-800 focus:outline-hidden"
                  >
                    <option value="">-- Direct Return (No Invoice Attached) --</option>
                    {salesInvoices.map(inv => (
                      <option key={inv.id} value={inv.id}>
                        {inv.docNumber} ({inv.date}) - {inv.customerName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Return Date</label>
                  <input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold"
                    required
                  />
                </div>
              </div>

              {/* If invoice has multiple items, let user pick which item was returned */}
              {selectedInvoice && selectedInvoice.items && selectedInvoice.items.length > 0 && (
                <div className="space-y-1 bg-blue-50/60 p-3 rounded-xl border border-blue-100">
                  <label className="font-bold text-blue-900 block">Select Returned Item from Invoice</label>
                  <select
                    onChange={(e) => handleSelectInvoiceItem(e.target.value)}
                    className="w-full bg-white border border-blue-200 rounded-lg p-2 font-semibold text-slate-800 focus:outline-hidden"
                  >
                    {selectedInvoice.items.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.brand || 'No Parts No'} | Qty: {item.quantity} | Rate: Tk. {item.price.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Row 2: Customer Selection (if direct return) */}
              {!selectedInvoice && (
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Customer</label>
                  <select
                    value={returnCustomerId}
                    onChange={(e) => setReturnCustomerId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold text-slate-800 focus:outline-hidden"
                  >
                    <option value="">-- Select Customer --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.company ? `(${c.company})` : ''} - {c.phone}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Row 3: Product Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Product Name</label>
                  <input
                    type="text"
                    required
                    value={returnProductName}
                    onChange={(e) => setReturnProductName(e.target.value)}
                    placeholder="e.g. Hitachi Air Filter"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Parts Number / SKU</label>
                  <input
                    type="text"
                    value={returnSku}
                    onChange={(e) => setReturnSku(e.target.value)}
                    placeholder="e.g. 52322330"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono font-semibold"
                  />
                </div>
              </div>

              {/* Row 4: Quantity & Pricing */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={returnQuantity}
                    onChange={(e) => {
                      const qty = Number(e.target.value) || 1;
                      setReturnQuantity(qty);
                      setReturnRefundAmount(qty * returnUnitPrice);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold text-center text-rose-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Unit Price</label>
                  <input
                    type="number"
                    min={0}
                    value={returnUnitPrice}
                    onChange={(e) => {
                      const rate = Number(e.target.value) || 0;
                      setReturnUnitPrice(rate);
                      setReturnRefundAmount(returnQuantity * rate);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold text-right"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Total Refund Value</label>
                  <input
                    type="number"
                    min={0}
                    value={returnRefundAmount}
                    onChange={(e) => setReturnRefundAmount(Number(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-black text-right text-slate-900"
                  />
                </div>
              </div>

              {/* Checkboxes: Restock in Inventory & Deduct from Due */}
              <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={returnRestocked}
                    onChange={(e) => setReturnRestocked(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span className="flex items-center gap-1.5 text-emerald-800 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Auto-Increase Inventory Stock
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={returnDeductDue}
                    onChange={(e) => setReturnDeductDue(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span className="flex items-center gap-1.5 text-blue-900">
                    Deduct from Customer's Outstanding Due
                  </span>
                </label>
              </div>

              {/* Reason */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Return Reason</label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold text-slate-800 focus:outline-hidden"
                >
                  <option value="Wrong Specification / Parameter Mismatch">Wrong Specification / Parameter Mismatch</option>
                  <option value="Defective Product / Operational Fault">Defective Product / Operational Fault</option>
                  <option value="Customer Order Cancelled">Customer Order Cancelled</option>
                  <option value="Damaged in Delivery / Transit">Damaged in Delivery / Transit</option>
                  <option value="Warranty Claim / Replacement">Warranty Claim / Replacement</option>
                  <option value="Excess Stock Return">Excess Stock Return</option>
                  <option value="Other Reason">Other Reason</option>
                </select>
              </div>

              {/* Remarks */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Notes / Remarks</label>
                <textarea
                  rows={2}
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="Additional details regarding this product return..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsReturnModalOpen(false)}
                  className="px-4 py-2 text-slate-500 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReturn}
                  className="px-5 py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-bold uppercase tracking-wider rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  {isSubmittingReturn ? 'Processing...' : 'Submit & Restock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
