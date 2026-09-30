import { useState, useMemo } from 'react';
import { Expense, StaffUser, BusinessSettings, ExpensePaymentMethod, Document, FieldDispatch, Purchase } from '../types';
import { 
  UserCheck, 
  PlusCircle, 
  Search, 
  Calendar, 
  Download, 
  Printer, 
  Trash2, 
  Edit3, 
  Wallet, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Coins,
  Receipt,
  Building,
  ShieldCheck,
  Filter
} from 'lucide-react';

interface OwnerDrawManagerProps {
  expenses: Expense[];
  documents: Document[];
  dispatches: FieldDispatch[];
  purchases: Purchase[];
  staffUsers: StaffUser[];
  currentUser: StaffUser | null;
  settings: BusinessSettings;
  onSaveExpense: (expense: Expense) => Promise<void> | void;
  onDeleteExpense: (id: string) => Promise<void> | void;
}

export const OWNER_DRAW_CATEGORY = "Owner's Drawings / Personal Expense (মালিকের ব্যক্তিগত খরচ/উত্তোলন)";

export default function OwnerDrawManager({
  expenses,
  documents,
  dispatches,
  purchases,
  staffUsers,
  currentUser,
  settings,
  onSaveExpense,
  onDeleteExpense
}: OwnerDrawManagerProps) {
  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'LAST_MONTH'>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<ExpensePaymentMethod>('Cash');
  const [paidBy, setPaidBy] = useState(() => currentUser?.name || 'MD MAHI UDDIN (Owner)');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Print Summary State
  const [isPrintSummaryOpen, setIsPrintSummaryOpen] = useState(false);

  // All Owner Drawings Expenses
  const ownerDrawingsList = useMemo(() => {
    return expenses.filter(e => e.category === OWNER_DRAW_CATEGORY);
  }, [expenses]);

  // Filtered List
  const filteredDrawings = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return ownerDrawingsList.filter(exp => {
      // Search
      const term = searchQuery.toLowerCase();
      const matchSearch = 
        exp.expenseNumber.toLowerCase().includes(term) ||
        exp.title.toLowerCase().includes(term) ||
        (exp.paidBy && exp.paidBy.toLowerCase().includes(term)) ||
        (exp.referenceNo && exp.referenceNo.toLowerCase().includes(term));

      // Payment method
      const matchMethod = selectedMethod === 'ALL' || exp.paymentMethod === selectedMethod;

      // Date Range
      let matchDate = true;
      if (dateFilter === 'TODAY') {
        matchDate = exp.date === todayStr;
      } else if (dateFilter === 'THIS_WEEK') {
        const expDate = new Date(exp.date);
        const diffDays = Math.floor((now.getTime() - expDate.getTime()) / (1000 * 3600 * 24));
        matchDate = diffDays >= 0 && diffDays <= 7;
      } else if (dateFilter === 'THIS_MONTH') {
        const expDate = new Date(exp.date);
        matchDate = expDate.getFullYear() === currentYear && expDate.getMonth() === currentMonth;
      } else if (dateFilter === 'LAST_MONTH') {
        const expDate = new Date(exp.date);
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        matchDate = expDate.getFullYear() === lastMonthYear && expDate.getMonth() === lastMonth;
      }

      return matchSearch && matchMethod && matchDate;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [ownerDrawingsList, searchQuery, selectedMethod, dateFilter]);

  // Aggregate Business Financial Metrics (Total Income vs Various Expenses vs Owner's Drawings)
  const financialSummary = useMemo(() => {
    // 1. Total Income from Paid Invoices
    const paidInvoicesIncome = documents
      .filter(d => (d.type === 'INVOICE' || d.type === 'BILL'))
      .reduce((sum, d) => {
        if (d.paidAmount !== undefined) return sum + d.paidAmount;
        return d.status === 'Paid' ? sum + d.total : 0;
      }, 0);

    // 2. Field Service Dispatches Income
    const fieldDispatchesIncome = dispatches.reduce((sum, d) => sum + (Number(d.paidAmount) || 0), 0);

    const totalIncome = paidInvoicesIncome + fieldDispatchesIncome;

    // 3. Operational Showroom Expenses (Excluding Owner Drawings)
    const showroomExpenses = expenses
      .filter(e => e.category !== OWNER_DRAW_CATEGORY)
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    // 4. Stock Inward Purchases Expenses
    const purchaseExpenses = purchases.reduce((sum, p) => sum + (Number(p.paidAmount) || 0), 0);

    // 5. Field Service Travel Expenses
    const fieldServiceExpenses = dispatches.reduce((sum, d) => sum + (Number(d.expenseAmount) || 0), 0);

    const totalOperatingExpenses = showroomExpenses + purchaseExpenses + fieldServiceExpenses;

    // 6. Net Operating Profit before Owner Drawings
    const operatingProfit = totalIncome - totalOperatingExpenses;

    // 7. Owner's Total Drawings
    const totalOwnerDrawings = ownerDrawingsList.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    // 8. Net Retained Cash Balance
    const netRetainedCash = operatingProfit - totalOwnerDrawings;

    // Today & Month Owner Draw totals
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const todayDraw = ownerDrawingsList
      .filter(e => e.date === todayStr)
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const thisMonthDraw = ownerDrawingsList
      .filter(e => {
        const d = new Date(e.date);
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      })
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    return {
      totalIncome,
      paidInvoicesIncome,
      fieldDispatchesIncome,
      showroomExpenses,
      purchaseExpenses,
      fieldServiceExpenses,
      totalOperatingExpenses,
      operatingProfit,
      totalOwnerDrawings,
      netRetainedCash,
      todayDraw,
      thisMonthDraw,
      filteredTotal: filteredDrawings.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
    };
  }, [documents, dispatches, expenses, purchases, ownerDrawingsList, filteredDrawings]);

  // Open Modal Create
  const handleOpenCreate = () => {
    setEditingExpense(null);
    setTitle('মালিকের প্রয়োজনীয় ব্যক্তিগত নগদ উত্তোলন');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('Cash');
    setPaidBy(currentUser?.name || 'MD MAHI UDDIN (Owner)');
    setReferenceNo('');
    setNotes('');
    setFormError('');
    setIsModalOpen(true);
  };

  // Open Modal Edit
  const handleOpenEdit = (exp: Expense) => {
    setEditingExpense(exp);
    setTitle(exp.title);
    setAmount(exp.amount);
    setDate(exp.date);
    setPaymentMethod(exp.paymentMethod);
    setPaidBy(exp.paidBy || currentUser?.name || 'MD MAHI UDDIN (Owner)');
    setReferenceNo(exp.referenceNo || '');
    setNotes(exp.notes || '');
    setFormError('');
    setIsModalOpen(true);
  };

  // Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim()) {
      setFormError('উত্তোলনের বিবরণ বা কারণ লিখুন (Enter description).');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setFormError('সঠিক টাকার পরিমাণ দিন (Enter valid amount).');
      return;
    }

    setIsSubmitting(true);
    try {
      const expenseItem: Expense = {
        id: editingExpense?.id || `draw-${Date.now()}`,
        expenseNumber: editingExpense?.expenseNumber || `DRAW/${new Date().getFullYear()}/${String(ownerDrawingsList.length + 1).padStart(3, '0')}`,
        date,
        category: OWNER_DRAW_CATEGORY,
        title: title.trim(),
        amount: Number(amount),
        paymentMethod,
        paidBy: paidBy.trim(),
        staffId: currentUser?.id,
        referenceNo: referenceNo.trim(),
        notes: notes.trim(),
        createdAt: editingExpense?.createdAt || new Date().toISOString().split('T')[0]
      };

      await onSaveExpense(expenseItem);
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'উত্তোলন সংরক্ষণ করতে ব্যর্থ হয়েছে');
    } finally {
      setIsSubmitting(false);
    }
  };

  // CSV Export
  const handleDownloadCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Voucher No,Date,Withdrawal Purpose / Title,Amount (BDT),Payment Method,Drawn By,Reference,Notes\n";

    filteredDrawings.forEach(exp => {
      csvContent += `"${exp.expenseNumber}","${exp.date}","${exp.title.replace(/"/g, '""')}",${exp.amount},"${exp.paymentMethod}","${exp.paidBy || ''}","${exp.referenceNo || ''}","${(exp.notes || '').replace(/"/g, '""')}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `hitachisolutioncenter-owner-drawings-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 text-xs animate-fade-in">
      
      {/* Top Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2.5 bg-rose-100 text-rose-800 rounded-xl border border-rose-300">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 font-display">
                মালিকের ব্যক্তিগত খরচ বা উত্তোলন (Owner's Personal Expenses & Drawings)
              </h2>
              <p className="text-slate-500 text-[11px]">
                ব্যবসায়িক পরিচালন খরচের বাইরে মালিকের পারিবারিক প্রয়োজন, নিজস্ব গাড়ি ও ব্যক্তিগত উত্তোলন আলাদাভাবে ট্র্যাক করুন।
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsPrintSummaryOpen(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold uppercase tracking-wider rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Print Statement"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            প্রিন্ট বিবরণী (Print Statement)
          </button>

          <button
            onClick={handleDownloadCSV}
            className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 font-bold uppercase tracking-wider rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-blue-700" />
            Export CSV
          </button>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold uppercase tracking-wider rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            + নতুন উত্তোলন এন্ট্রি (Add Owner Draw)
          </button>
        </div>
      </div>

      {/* COMPREHENSIVE P&L FINANCIAL BALANCE SUMMARY BAR (টোটাল ইনকাম - বিভিন্ন ধরণের খরচ - মালিকের উত্তোলন) */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-sm font-display text-white">
              হিসাব সংক্ষেপ: টোটাল ইনকাম - বিভিন্ন ধরণের খরচ - মালিকের উত্তোলন
            </h3>
          </div>
          <span className="text-[10px] bg-slate-800 text-slate-300 px-3 py-1 rounded-full font-mono border border-slate-700">
            Real-Time Cash & Profit Reconciliation
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Business Income */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 space-y-1.5">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-bold text-[10px] uppercase tracking-wider text-emerald-400">১. টোটাল ইনকাম (Total Income)</span>
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-black font-display text-emerald-300">
              ৳{financialSummary.totalIncome.toLocaleString()}
            </div>
            <p className="text-[10px] text-slate-400">
              বিক্রয় ইনভয়েস: ৳{financialSummary.paidInvoicesIncome.toLocaleString()} + ফিল্ড সেবা: ৳{financialSummary.fieldDispatchesIncome.toLocaleString()}
            </p>
          </div>

          {/* Card 2: Various Operating Expenses */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 space-y-1.5">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-bold text-[10px] uppercase tracking-wider text-amber-400">২. পরিচালন খরচ (Operating Expenses)</span>
              <ArrowDownRight className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl font-black font-display text-amber-300">
              ৳{financialSummary.totalOperatingExpenses.toLocaleString()}
            </div>
            <p className="text-[10px] text-slate-400">
              শোরুম খরচ: ৳{financialSummary.showroomExpenses.toLocaleString()} + মালামাল ক্রয়: ৳{financialSummary.purchaseExpenses.toLocaleString()}
            </p>
          </div>

          {/* Card 3: Owner's Drawings */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 space-y-1.5">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-bold text-[10px] uppercase tracking-wider text-rose-400">৩. মালিকের উত্তোলন (Owner's Draw)</span>
              <UserCheck className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-xl font-black font-display text-rose-300">
              ৳{financialSummary.totalOwnerDrawings.toLocaleString()}
            </div>
            <p className="text-[10px] text-slate-400">
              চলতি মাসে উত্তোলন: ৳{financialSummary.thisMonthDraw.toLocaleString()}
            </p>
          </div>

          {/* Card 4: Net Surplus Balance */}
          <div className="bg-slate-950 border border-emerald-500/30 rounded-xl p-4 space-y-1.5">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-bold text-[10px] uppercase tracking-wider text-blue-300">৪. অবশিষ্ট তহবিল (Net Cash Flow)</span>
              <Wallet className="w-4 h-4 text-blue-400" />
            </div>
            <div className={`text-xl font-black font-display ${financialSummary.netRetainedCash >= 0 ? 'text-blue-300' : 'text-rose-400'}`}>
              ৳{financialSummary.netRetainedCash.toLocaleString()}
            </div>
            <p className="text-[10px] text-emerald-400 font-semibold">
              ইনকাম হতে সকল খরচ ও উত্তোলন বাদ দিয়ে অবশিষ্ট
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid for Owner's Drawings Specifics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Draw All Time */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="font-bold text-[10px] uppercase tracking-wider">সর্বমোট উত্তোলন (Total All-Time Draw)</span>
            <div className="p-1.5 bg-rose-50 text-rose-700 rounded-lg">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-rose-800 font-display">
            ৳{financialSummary.totalOwnerDrawings.toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-400 font-medium">
            মোট {ownerDrawingsList.length} টি উত্তোলন ভাউচার সম্পন্ন
          </p>
        </div>

        {/* This Month Draw */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="font-bold text-[10px] uppercase tracking-wider">চলতি মাসের উত্তোলন (This Month)</span>
            <div className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-blue-900 font-display">
            ৳{financialSummary.thisMonthDraw.toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-400 font-medium">
            চলতি ক্যালেণ্ডার মাসের মোট উত্তোলন
          </p>
        </div>

        {/* Today's Draw */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="font-bold text-[10px] uppercase tracking-wider">আজকের উত্তোলন (Today's Draw)</span>
            <div className="p-1.5 bg-amber-50 text-amber-700 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-amber-800 font-display">
            ৳{financialSummary.todayDraw.toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-400 font-medium">
            আজকের নগদ বা পেটি ক্যাশ ব্যক্তিগত উত্তোলন
          </p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Search */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search voucher #, purpose / title, reference, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white focus:outline-hidden"
            />
          </div>

          {/* Payment Method */}
          <div className="sm:col-span-3">
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">All Payment Methods</option>
              <option value="Cash">Cash (নগদ)</option>
              <option value="Bank Transfer">Bank Transfer (ব্যাংক)</option>
              <option value="bKash/Nagad">bKash/Nagad (বিকাশ/নগদ)</option>
              <option value="Cheque">Cheque (চেক)</option>
            </select>
          </div>

          {/* Date range filter */}
          <div className="sm:col-span-3">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">All Time (সব সময়)</option>
              <option value="TODAY">Today Only (আজকের উত্তোলন)</option>
              <option value="THIS_WEEK">This Week (এই সপ্তাহ)</option>
              <option value="THIS_MONTH">This Month (চলতি মাস)</option>
              <option value="LAST_MONTH">Last Month (গত মাস)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="font-bold text-slate-700">
            Showing {filteredDrawings.length} Owner Draw Records
          </span>
          <span className="font-extrabold text-rose-800 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
            Filtered Total Draw: ৳{financialSummary.filteredTotal.toLocaleString()}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Voucher No. / Date</th>
                <th className="py-3 px-3">Withdrawal Purpose / Title (উদ্দেশ্য)</th>
                <th className="py-3 px-3">Drawn By / Paid To</th>
                <th className="py-3 px-3 text-center">Method</th>
                <th className="py-3 px-3">Memo / Ref No.</th>
                <th className="py-3 px-4 text-right">Amount (BDT)</th>
                <th className="py-3 px-3 text-center w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDrawings.length > 0 ? (
                filteredDrawings.map(exp => (
                  <tr key={exp.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Voucher No & Date */}
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <span className="font-extrabold text-rose-900 block font-mono text-xs">
                          {exp.expenseNumber}
                        </span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {exp.date}
                        </span>
                      </div>
                    </td>

                    {/* Title & Notes */}
                    <td className="py-3 px-3 max-w-sm">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-900 block leading-tight">
                          {exp.title}
                        </span>
                        {exp.notes && (
                          <p className="text-[10px] text-slate-400 line-clamp-1 italic">
                            {exp.notes}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Paid By */}
                    <td className="py-3 px-3 font-semibold text-slate-800">
                      {exp.paidBy || 'MD MAHI UDDIN (Owner)'}
                    </td>

                    {/* Method */}
                    <td className="py-3 px-3 text-center">
                      <span className="inline-block font-bold text-[10px] px-2 py-0.5 rounded-full border bg-rose-50 text-rose-800 border-rose-200">
                        {exp.paymentMethod}
                      </span>
                    </td>

                    {/* Ref */}
                    <td className="py-3 px-3 font-mono text-slate-500 text-[10px]">
                      {exp.referenceNo || 'N/A'}
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-4 text-right">
                      <span className="font-extrabold text-rose-700 text-sm font-display block">
                        ৳{Number(exp.amount).toLocaleString()}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(exp)}
                          className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                          title="Edit draw"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete owner draw record "${exp.title}" (৳${exp.amount.toLocaleString()})?`)) {
                              onDeleteExpense(exp.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          title="Delete draw"
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
                    {searchQuery ? 'No owner drawings matched your search filter.' : 'No owner personal expenses or drawings recorded yet. Click "+ নতুন উত্তোলন এন্ট্রি" above to log.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT OWNER DRAW MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-4 my-8 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingExpense ? 'মালিকের উত্তোলন সংশোধন' : 'মালিকের ব্যক্তিগত খরচ বা উত্তোলন এন্ট্রি (Owner Draw)'}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    শোরুম বা ব্যাংক একাউন্ট থেকে মালিকের ব্যক্তিগত নগদ উত্তোলন বা পারিবারিক খরচ যুক্ত করুন
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              {/* Title / Description */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">উত্তোলনের উদ্দেশ্য / বিবরণ (Withdrawal Purpose / Title)</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: মালিকের ব্যক্তিগত প্রয়োজনীয় নগদ উত্তোলন, পারিবারিক খরচ, নিজস্ব গাড়ি ফুয়েল ইত্যাদি"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-semibold focus:bg-white focus:outline-hidden"
                />
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">উত্তোলনের পরিমাণ (Amount ৳)</label>
                  <input
                    type="number"
                    min={1}
                    required
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-black text-rose-700 text-base focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">তারিখ (Date)</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-semibold focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Payment Method & Paid By */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">গ্রহণের মাধ্যম (Withdrawal Method)</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as ExpensePaymentMethod)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-semibold text-slate-800 focus:outline-hidden"
                  >
                    <option value="Cash">Cash (নগদ ক্যাশ)</option>
                    <option value="Bank Transfer">Bank Transfer (ব্যাংক)</option>
                    <option value="bKash/Nagad">bKash / Nagad (বিকাশ / নগদ)</option>
                    <option value="Cheque">Cheque (চেক)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">উত্তোলনকারী (Drawn By / Owner Name)</label>
                  <input
                    type="text"
                    value={paidBy}
                    onChange={(e) => setPaidBy(e.target.value)}
                    placeholder="MD MAHI UDDIN (Owner)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-semibold focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Reference / Voucher No. */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">মেমো / ব্যাংক লেনদেন রেফারেন্স (Ref / Cheque / Txn ID)</label>
                <input
                  type="text"
                  placeholder="e.g. CASH-DRAW-01, CHQ-99214"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono font-semibold focus:bg-white focus:outline-hidden"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">অতিরিক্ত নোট বা মন্তব্য (Remarks)</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="যেমন: ঘর ভাড়া, চিকিৎসা খরচ বা ব্যক্তিগত ক্রয়..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold focus:bg-white focus:outline-hidden"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-500 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-bold uppercase tracking-wider rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isSubmitting ? 'Saving...' : (editingExpense ? 'আপডেট করুন' : 'উত্তোলন সংরক্ষণ করুন')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE OWNER DRAWINGS STATEMENT MODAL */}
      {isPrintSummaryOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in no-print-backdrop print:bg-transparent print:p-0">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] overflow-hidden animate-slide-up print:max-h-none print:border-none print:shadow-none">
            
            {/* Header Control Panel (no-print) */}
            <div className="bg-slate-950 text-white px-4 py-3 flex justify-between items-center gap-4 no-print flex-shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <div>
                  <h3 className="font-extrabold text-[11px] sm:text-xs text-white leading-tight">
                    মালিকের উত্তোলন ও ব্যক্তিগত খরচ স্টেটমেন্ট (Owner's Drawings Statement)
                  </h3>
                  <p className="text-[9px] text-slate-400 hidden sm:block">
                    অফিসিয়াল হিসাব বিবরণী প্রিন্ট বা সংরক্ষণের জন্য ব্যবহার করুন
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold uppercase rounded-md flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print (প্রিন্ট)
                </button>
                <button 
                  onClick={() => setIsPrintSummaryOpen(false)}
                  className="text-slate-400 hover:text-white font-bold bg-white/10 hover:bg-white/20 w-7 h-7 rounded-full flex items-center justify-center text-sm cursor-pointer transition-colors"
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Print Content Area */}
            <div id="printable-area" className="overflow-y-auto flex-1 p-8 bg-white text-slate-900 font-sans relative select-none print:overflow-visible print:p-0 space-y-6">
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                <div>
                  <h1 className="text-xl font-black text-slate-900 font-display tracking-tight">{settings.name || 'Jubayer Machineries'}</h1>
                  <p className="text-[10px] text-slate-500 font-medium">{settings.address || 'Hazi Siddik Complex, Molla Market, Bason Sharok, Gazipur City.'}</p>
                  <p className="text-[10px] text-slate-500 font-medium">Hotline: {settings.phone1 || '01715-994956'}</p>
                </div>
                <div className="text-right">
                  <span className="font-black text-sm text-rose-950 uppercase tracking-widest block font-mono">OWNER'S DRAWINGS STATEMENT</span>
                  <span className="text-[10px] text-slate-400 block font-semibold">Generated: {new Date().toLocaleDateString('en-GB')}</span>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider mb-0.5">Total Income</span>
                  <span className="text-sm font-extrabold text-emerald-700 font-mono">৳{financialSummary.totalIncome.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider mb-0.5">Operating Expenses</span>
                  <span className="text-sm font-extrabold text-amber-700 font-mono">৳{financialSummary.totalOperatingExpenses.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider mb-0.5">Owner Total Draw</span>
                  <span className="text-sm font-black text-rose-600 font-mono">৳{financialSummary.filteredTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Table */}
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 uppercase tracking-wider text-[9px]">
                      <th className="py-2.5 px-3">Voucher #</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Purpose / Title</th>
                      <th className="py-2.5 px-3">Method</th>
                      <th className="py-2.5 px-3">Drawn By</th>
                      <th className="py-2.5 px-3 text-right">Amount (BDT)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
                    {filteredDrawings.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 font-mono font-bold text-slate-500 text-[10px]">{exp.expenseNumber}</td>
                        <td className="py-2 px-3 font-mono text-[10px]">{exp.date}</td>
                        <td className="py-2 px-3 font-bold text-slate-900">{exp.title}</td>
                        <td className="py-2 px-3 text-slate-600 font-semibold">{exp.paymentMethod}</td>
                        <td className="py-2 px-3 text-slate-600">{exp.paidBy}</td>
                        <td className="py-2 px-3 text-right font-black text-rose-700 font-mono">৳{exp.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50 font-bold border-t border-slate-300 text-slate-900">
                      <td colSpan={5} className="py-2.5 px-3 text-right uppercase tracking-wider text-[10px]">Grand Total Draw:</td>
                      <td className="py-2.5 px-3 text-right text-rose-700 text-xs font-black font-mono">৳{financialSummary.filteredTotal.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-12 pt-12 text-center text-[10px] font-bold text-slate-500">
                <div className="space-y-1">
                  <div className="border-t border-slate-400 pt-1.5 w-44 mx-auto text-slate-800">
                    Accounts Manager
                  </div>
                  <span className="text-[9px] text-slate-400 italic block">প্রস্তুতকারকের স্বাক্ষর</span>
                </div>
                <div className="space-y-1">
                  <div className="border-t border-slate-400 pt-1.5 w-44 mx-auto text-slate-800 font-bold">
                    {settings.signatureName || 'Managing Director'} (Owner)
                  </div>
                  <span className="text-[9px] text-slate-400 italic block">মালিকের স্বাক্ষর</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
