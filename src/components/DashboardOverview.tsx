import { useState } from 'react';
import { Document, Product, Customer, Expense, Purchase, FieldDispatch } from '../types';
import { 
  TrendingUp, 
  FileText, 
  ShoppingCart, 
  Users, 
  ChevronRight, 
  ArrowUpRight, 
  Clock, 
  BookOpen, 
  Coins, 
  ChevronDown, 
  ChevronUp, 
  Wallet, 
  Receipt, 
  TrendingDown, 
  Calculator,
  ArrowDownRight
} from 'lucide-react';

interface DashboardOverviewProps {
  documents: Document[];
  products: Product[];
  customers: Customer[];
  expenses?: Expense[];
  purchases?: Purchase[];
  dispatches?: FieldDispatch[];
  onNavigateToTab: (tab: string) => void;
  onViewDocument: (doc: Document) => void;
}

export default function DashboardOverview({
  documents,
  products,
  customers,
  expenses = [],
  purchases = [],
  dispatches = [],
  onNavigateToTab,
  onViewDocument
}: DashboardOverviewProps) {
  const [showProfitBreakdown, setShowProfitBreakdown] = useState(false);
  
  // Primary sales & due calculations
  const metrics = {
    totalSales: documents
      .filter(d => d.type === 'INVOICE' || d.type === 'BILL')
      .reduce((sum, d) => {
        if (d.paidAmount !== undefined) return sum + d.paidAmount;
        return d.status === 'Paid' ? sum + d.total : 0;
      }, 0),
    pendingReceivables: documents
      .filter(d => d.type === 'INVOICE' || d.type === 'BILL')
      .reduce((sum, d) => {
        if (d.dueAmount !== undefined) return sum + d.dueAmount;
        return d.status !== 'Paid' ? sum + d.total : 0;
      }, 0),
    totalDocs: documents.length,
    activeProducts: products.length,
    totalStockValue: products.reduce((sum, p) => sum + (p.price * p.stock), 0),
    totalCustomers: customers.length
  };

  // NET PROFIT CALCULATION (Total Income - Total Expenses = Net Profit)
  
  // 1. Total Income
  const paidInvoiceRevenue = metrics.totalSales;
  const paidDispatchRevenue = dispatches.reduce((sum, d) => sum + (Number(d.paidAmount) || 0), 0);
  const totalIncome = paidInvoiceRevenue + paidDispatchRevenue;

  // 2. Total Expenses
  const isOwnerDraw = (cat: string) => cat.includes("Owner's Drawings");

  const showroomExpenses = expenses
    .filter(e => !isOwnerDraw(e.category))
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const stockPurchasesCost = purchases.reduce((sum, p) => sum + (Number(p.paidAmount) || 0), 0);

  const fieldTravelExpenses = dispatches.reduce((sum, d) => sum + (Number(d.expenseAmount) || 0), 0);

  const totalOperatingExpenses = showroomExpenses + stockPurchasesCost + fieldTravelExpenses;

  // Owner Drawings
  const ownerDrawings = expenses
    .filter(e => isOwnerDraw(e.category))
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const totalAllExpensesCombined = totalOperatingExpenses + ownerDrawings;

  // 3. Net Operating Profit
  const netOperatingProfit = totalIncome - totalOperatingExpenses;
  const netRetainedCash = totalIncome - totalAllExpensesCombined;

  // Document breakdown count
  const docCounts = {
    offers: documents.filter(d => d.type === 'OFFER_LETTER').length,
    quotes: documents.filter(d => d.type === 'QUOTATION').length,
    bills: documents.filter(d => d.type === 'BILL').length,
    invoices: documents.filter(d => d.type === 'INVOICE').length
  };

  // Recent transactions (limit 5)
  const recentDocs = [...documents]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Group inventory items by brand to calculate share
  const brandStockCount = products.reduce((acc, p) => {
    acc[p.brand] = (acc[p.brand] || 0) + p.stock;
    return acc;
  }, {} as Record<string, number>);

  const brandsShare = Object.entries(brandStockCount)
    .map(([brand, stock]) => ({ brand, stock }))
    .sort((a, b) => b.stock - a.stock);

  return (
    <div className="space-y-8 text-xs">
      
      {/* ========================================================================= */}
      {/* 📊 FEATURED VIEW CARD: Total Income - Total Expenses = Net Profit */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xl border border-slate-800 space-y-4 relative overflow-hidden">
        {/* Subtle Background Glow Accent */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Card Header & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3 relative z-10">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
                <Calculator className="w-4 h-4" />
              </span>
              <h2 className="text-sm sm:text-base font-black font-display text-white tracking-tight flex items-center gap-2">
                Total Income - All Expenses = Net Profit
              </h2>
            </div>
            <p className="text-slate-400 text-[10px] sm:text-[11px] font-medium pl-7 sm:pl-8">
              Net Profit Statement: Automated live statement of revenue, operating costs, and net business profit.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              onClick={() => onNavigateToTab('reports')}
              className="px-3 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 hover:text-white font-bold rounded-lg border border-blue-500/30 transition-all text-[10px] sm:text-[11px] flex items-center gap-1 cursor-pointer"
            >
              <Coins className="w-3.5 h-3.5 text-amber-300" />
              Income & Expense Report
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 🧮 3 COMPACT FINANCIAL BOXES (Mobile & Desktop Responsive Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-stretch relative z-10">
          
          {/* BOX 1: TOTAL INCOME */}
          <div className="bg-slate-800/90 hover:bg-slate-800 border border-emerald-500/30 p-3.5 rounded-xl space-y-1 transition-all shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" /> Total Income (Inflows)
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Cash Inflow
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black font-display text-emerald-300 tracking-tight my-1">
              Tk.{totalIncome.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-300 font-medium flex justify-between items-center pt-1 border-t border-slate-700/60">
              <span>Invoice Sales: Tk.{paidInvoiceRevenue.toLocaleString()}</span>
              {paidDispatchRevenue > 0 && <span className="text-slate-400">+Field: Tk.{paidDispatchRevenue.toLocaleString()}</span>}
            </div>
          </div>

          {/* BOX 2: TOTAL EXPENSES */}
          <div className="bg-slate-800/90 hover:bg-slate-800 border border-amber-500/30 p-3.5 rounded-xl space-y-1 transition-all shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <ArrowDownRight className="w-3.5 h-3.5" /> Total Expenses (Outflows)
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Outflow
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black font-display text-amber-300 tracking-tight my-1">
              Tk.{totalOperatingExpenses.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-300 font-medium flex justify-between items-center pt-1 border-t border-slate-700/60">
              <span>Showroom: Tk.{showroomExpenses.toLocaleString()}</span>
              <span>Purchases: Tk.{stockPurchasesCost.toLocaleString()}</span>
            </div>
          </div>

          {/* BOX 3: NET PROFIT */}
          <div className={`${netOperatingProfit >= 0 ? 'bg-emerald-950/80 border-emerald-500/50 hover:bg-emerald-950' : 'bg-rose-950/80 border-rose-500/50 hover:bg-rose-950'} border-2 p-3.5 rounded-xl space-y-1 transition-all shadow-md flex flex-col justify-between`}>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 text-blue-200">
                <TrendingUp className="w-3.5 h-3.5 text-blue-400" /> Net Profit
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${netOperatingProfit >= 0 ? 'bg-emerald-500/30 text-emerald-200 border-emerald-400/40' : 'bg-rose-500/30 text-rose-200 border-rose-400/40'}`}>
                {netOperatingProfit >= 0 ? 'PROFIT' : 'LOSS'}
              </span>
            </div>
            <div className={`text-xl sm:text-2xl font-black font-display tracking-tight my-1 ${netOperatingProfit >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
              Tk.{netOperatingProfit.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-300 font-semibold flex justify-between items-center pt-1 border-t border-slate-700/60">
              <span>Operating Margin</span>
              <span className="text-slate-400 font-mono">
                {totalIncome > 0 ? `${((netOperatingProfit / totalIncome) * 100).toFixed(1)}% Margin` : '0%'}
              </span>
            </div>
          </div>

        </div>

        {/* 🔽 EXPANDABLE DETAILED BREAKDOWN TOGGLE */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 relative z-10">
          <button
            onClick={() => setShowProfitBreakdown(!showProfitBreakdown)}
            className="text-[10px] sm:text-[11px] font-bold text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer py-1 px-3 bg-slate-800/80 hover:bg-slate-800 rounded-lg border border-slate-700/80 transition-all self-start"
          >
            {showProfitBreakdown ? <ChevronUp className="w-3.5 h-3.5 text-emerald-400" /> : <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{showProfitBreakdown ? 'Hide Income & Expense Breakdown' : 'View Detailed Income & Expense Statement'}</span>
          </button>

          <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 font-semibold">
            {ownerDrawings > 0 && (
              <span className="flex items-center gap-1 text-amber-300/90 bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-800/40">
                <Receipt className="w-3 h-3 text-amber-400" />
                Owner Draw: <strong className="text-amber-200 font-mono">Tk.{ownerDrawings.toLocaleString()}</strong>
              </span>
            )}
            <span className="flex items-center gap-1 text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-800/40">
              <Wallet className="w-3 h-3 text-emerald-400" />
              Retained Cash: <strong className="text-white font-mono">Tk.{netRetainedCash.toLocaleString()}</strong>
            </span>
          </div>
        </div>

        {/* EXPANDED BREAKDOWN TABLE */}
        {showProfitBreakdown && (
          <div className="mt-4 pt-4 border-t border-slate-800 space-y-4 animate-fade-in relative z-10">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-400" />
              Itemized Income & Expense Breakdown Statement
            </h4>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs font-sans">
              
              {/* Left Column: Income Items */}
              <div className="bg-slate-900/90 border border-emerald-500/20 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center border-b border-emerald-500/30 pb-2">
                  <span className="font-bold text-emerald-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-400" /> Revenue & Inflows
                  </span>
                  <span className="font-extrabold text-emerald-300 font-mono">Tk.{totalIncome.toLocaleString()}</span>
                </div>

                <div className="space-y-2 text-[11px]">
                  <div className="flex justify-between items-center py-1 border-b border-slate-800 text-slate-300">
                    <span>Sales Invoices Collected</span>
                    <span className="font-mono font-bold text-white">Tk.{paidInvoiceRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800 text-slate-300">
                    <span>Field Services & Maintenance Bills Collected</span>
                    <span className="font-mono font-bold text-white">Tk.{paidDispatchRevenue.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Expense Items */}
              <div className="bg-slate-900/90 border border-amber-500/20 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center border-b border-amber-500/30 pb-2">
                  <span className="font-bold text-amber-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <TrendingDown className="w-4 h-4 text-amber-400" /> Operating Costs & Outflows
                  </span>
                  <span className="font-extrabold text-amber-300 font-mono">Tk.{totalOperatingExpenses.toLocaleString()}</span>
                </div>

                <div className="space-y-2 text-[11px]">
                  <div className="flex justify-between items-center py-1 border-b border-slate-800 text-slate-300">
                    <span>Showroom Overheads, Utilities & Office Expenses</span>
                    <span className="font-mono font-bold text-white">Tk.{showroomExpenses.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800 text-slate-300">
                    <span>Inventory Parts & Stock Procurement</span>
                    <span className="font-mono font-bold text-white">Tk.{stockPurchasesCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800 text-slate-300">
                    <span>Field Conveyance & Technician Travel Expenses</span>
                    <span className="font-mono font-bold text-white">Tk.{fieldTravelExpenses.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>


      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {/* Metric 1 */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-2xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Collected Revenue
            </span>
            <span className="text-xl font-extrabold font-display text-blue-950 block">
              Tk. {metrics.totalSales.toLocaleString()}
            </span>
            <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" /> Received Cash & Cheques
            </span>
          </div>
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 1b - Outstanding Dues */}
        <button
          onClick={() => onNavigateToTab('due_ledger')}
          className="bg-rose-50/50 hover:bg-rose-50 border border-rose-200 p-5 rounded-2xl flex items-center justify-between shadow-2xs transition-all text-left group cursor-pointer"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block">
              Outstanding Dues
            </span>
            <span className="text-xl font-black font-display text-rose-700 block">
              Tk. {metrics.pendingReceivables.toLocaleString()}
            </span>
            <span className="text-[9px] font-bold text-rose-600 flex items-center gap-1 group-hover:underline">
              Manage Ledger <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="w-10 h-10 bg-rose-100 text-rose-600 border border-rose-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <BookOpen className="w-5 h-5 animate-pulse" />
          </div>
        </button>

        {/* Metric 2 */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-2xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Documents Created
            </span>
            <span className="text-xl font-extrabold font-display text-blue-950 block">
              {metrics.totalDocs}
            </span>
            <span className="text-[9px] font-semibold text-slate-500 block">
              All categories total
            </span>
          </div>
          <div className="w-10 h-10 bg-blue-50 text-blue-900 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-2xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Stock Valuation
            </span>
            <span className="text-xl font-extrabold font-display text-blue-950 block">
              Tk. {metrics.totalStockValue.toLocaleString()}
            </span>
            <span className="text-[9px] font-bold text-slate-500 block">
              Across {metrics.activeProducts} products
            </span>
          </div>
          <div className="w-10 h-10 bg-amber-50 text-amber-700 rounded-xl flex items-center justify-center">
            <ShoppingCart className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4: Registered Clients */}
        <button
          onClick={() => onNavigateToTab('customers')}
          className="bg-white hover:bg-blue-50/40 border border-slate-200 hover:border-blue-300 p-5 rounded-2xl flex items-center justify-between shadow-2xs transition-all text-left group cursor-pointer"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Registered Clients
            </span>
            <span className="text-xl font-extrabold font-display text-blue-950 block">
              {metrics.totalCustomers}
            </span>
            <span className="text-[9px] font-bold text-blue-600 flex items-center gap-1 group-hover:underline">
              View Customer List <ChevronRight className="w-3 h-3" />
            </span>
          </div>
          <div className="w-10 h-10 bg-indigo-50 text-indigo-700 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Users className="w-5 h-5" />
          </div>
        </button>
      </div>

      {/* Analytics Charts & Spares Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Document Portfolio Mix - Custom Interactive SVG Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 lg:col-span-8 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-display">Document Creation Analytics</h3>
            <p className="text-slate-400 text-[11px] mb-6">Distribution and volume mix of documents in hitachisolutioncenter.</p>
          </div>

          {/* Simple custom visual bar-graph using pure CSS */}
          <div className="space-y-4 py-2">
            {/* Offer Letters Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Offer Letters
                </span>
                <span>{docCounts.offers} items</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                  style={{ width: `${metrics.totalDocs ? (docCounts.offers / metrics.totalDocs) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* Quotations Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Quotations
                </span>
                <span>{docCounts.quotes} items</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 rounded-full transition-all duration-1000"
                  style={{ width: `${metrics.totalDocs ? (docCounts.quotes / metrics.totalDocs) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* Invoices Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> Invoices
                </span>
                <span>{docCounts.invoices} items</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-600 rounded-full transition-all duration-1000"
                  style={{ width: `${metrics.totalDocs ? (docCounts.invoices / metrics.totalDocs) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* Bills Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span> Purchase Bills
                </span>
                <span>{docCounts.bills} items</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-rose-600 rounded-full transition-all duration-1000"
                  style={{ width: `${metrics.totalDocs ? (docCounts.bills / metrics.totalDocs) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 mt-6 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            <span>Operational Data is Persisted</span>
            <button 
              onClick={() => onNavigateToTab('docs')} 
              className="text-blue-900 hover:text-blue-950 font-bold hover:underline cursor-pointer"
            >
              Manage Documents &rarr;
            </button>
          </div>
        </div>

        {/* Brand Inventory Stock share list */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 lg:col-span-4 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-display">Brand Stock Distribution</h3>
            <p className="text-slate-400 text-[11px] mb-4">Total spare parts and machines in warehouse grouped by brand.</p>
          </div>

          <div className="space-y-3.5 flex-1 py-2">
            {brandsShare.slice(0, 5).map(({ brand, stock }) => {
              const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
              const percentage = totalStock ? (stock / totalStock) * 100 : 0;
              return (
                <div key={brand} className="space-y-1">
                  <div className="flex justify-between items-center font-semibold text-slate-700">
                    <span className="text-slate-900 font-bold">{brand}</span>
                    <span className="text-slate-500">{stock} Units ({Math.round(percentage)}%)</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-900 rounded-full"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => onNavigateToTab('inventory')}
            className="w-full py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 font-bold uppercase tracking-wider rounded-lg text-center mt-4 transition-colors cursor-pointer"
          >
            Open Stock Inventory
          </button>
        </div>
      </div>

      {/* Recent Activity Log & Shortcuts */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <div className="flex items-center gap-2">
            <Clock className="w-4.5 h-4.5 text-slate-400" />
            <h3 className="text-sm font-bold text-slate-900 font-display">Recent Operations Desk Activity</h3>
          </div>
          <button 
            onClick={() => onNavigateToTab('docs')}
            className="text-xs font-bold text-blue-900 hover:underline flex items-center cursor-pointer"
          >
            All Activity Logs <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-400 font-bold text-[10px] tracking-wider uppercase border-b border-slate-100">
                <th className="pb-3 pr-3">Doc Number</th>
                <th className="pb-3 px-3">Type</th>
                <th className="pb-3 px-3">Date</th>
                <th className="pb-3 px-3">Customer Company</th>
                <th className="pb-3 px-3 text-right">Payable</th>
                <th className="pb-3 px-3 text-center">Status</th>
                <th className="pb-3 pl-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentDocs.map(doc => {
                const getBadgeClass = (status: string) => {
                  switch (status) {
                    case 'Paid':
                    case 'Accepted':
                    case 'Active':
                      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
                    case 'Unpaid':
                      return 'bg-amber-100 text-amber-800 border-amber-200';
                    case 'Sent':
                      return 'bg-blue-100 text-blue-800 border-blue-200';
                    default:
                      return 'bg-slate-100 text-slate-700 border-slate-200';
                  }
                };

                return (
                  <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 pr-3 font-bold text-blue-900">{doc.docNumber}</td>
                    <td className="py-3.5 px-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-600">
                        {String(doc.type || '').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-500 font-medium">{doc.date}</td>
                    <td className="py-3.5 px-3 font-semibold text-slate-700">{doc.customerCompany || doc.customerName}</td>
                    <td className="py-3.5 px-3 text-right font-extrabold text-slate-900">Tk. {doc.total.toLocaleString()}</td>
                    <td className="py-3.5 px-3 text-center">
                      <span className={`inline-block border text-[9px] font-bold px-2 py-0.5 rounded-full ${getBadgeClass(doc.status)}`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="py-3.5 pl-3 text-right">
                      <button
                        onClick={() => onViewDocument(doc)}
                        className="px-2.5 py-1 text-blue-900 hover:text-white hover:bg-blue-900 text-[10px] font-bold rounded-md border border-blue-900/10 hover:border-blue-900 transition-colors cursor-pointer"
                      >
                        Print/PDF
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
  );
}
