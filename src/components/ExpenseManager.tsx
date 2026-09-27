import { useState, useMemo } from 'react';
import { Expense, StaffUser, BusinessSettings, ExpensePaymentMethod } from '../types';
import { 
  DollarSign, 
  PlusCircle, 
  Search, 
  Calendar, 
  Download, 
  Printer, 
  Trash2, 
  Edit3, 
  Wallet, 
  TrendingUp, 
  Clock, 
  Filter, 
  CheckCircle2, 
  Receipt, 
  Building, 
  Car, 
  Coffee, 
  Package, 
  Wrench, 
  Printer as PrintIcon, 
  AlertCircle,
  FileText
} from 'lucide-react';

interface ExpenseManagerProps {
  expenses: Expense[];
  staffUsers: StaffUser[];
  currentUser: StaffUser | null;
  settings: BusinessSettings;
  onSaveExpense: (expense: Expense) => Promise<void> | void;
  onDeleteExpense: (id: string) => Promise<void> | void;
}

export const EXPENSE_CATEGORIES = [
  { name: 'Office Rent & Utilities', icon: Building, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { name: 'Staff Salary & Allowances', icon: Wallet, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { name: 'Conveyance & Transportation', icon: Car, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { name: 'Office Tea, Snacks & Entertainment', icon: Coffee, color: 'text-orange-600 bg-orange-50 border-orange-200' },
  { name: 'Shipping & Courier', icon: Package, color: 'text-teal-600 bg-teal-50 border-teal-200' },
  { name: 'Repair & Maintenance', icon: Wrench, color: 'text-rose-600 bg-rose-50 border-rose-200' },
  { name: 'Marketing & Advertising', icon: TrendingUp, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  { name: 'Stationery & Printing', icon: PrintIcon, color: 'text-cyan-600 bg-cyan-50 border-cyan-200' },
  { name: 'Bank Charges & Taxes', icon: DollarSign, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { name: 'Miscellaneous / Other Expenses', icon: FileText, color: 'text-slate-600 bg-slate-100 border-slate-200' },
];

export default function ExpenseManager({
  expenses,
  staffUsers,
  currentUser,
  settings,
  onSaveExpense,
  onDeleteExpense
}: ExpenseManagerProps) {
  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'LAST_MONTH'>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0].name);
  const [amount, setAmount] = useState<number | ''>('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<ExpensePaymentMethod>('Cash');
  const [paidBy, setPaidBy] = useState(() => currentUser?.name || 'MD MAHI UDDIN');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Print Summary State
  const [isPrintSummaryOpen, setIsPrintSummaryOpen] = useState(false);

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return expenses.filter(exp => {
      // Search
      const term = searchQuery.toLowerCase();
      const matchSearch = 
        exp.expenseNumber.toLowerCase().includes(term) ||
        exp.title.toLowerCase().includes(term) ||
        exp.category.toLowerCase().includes(term) ||
        (exp.paidBy && exp.paidBy.toLowerCase().includes(term)) ||
        (exp.referenceNo && exp.referenceNo.toLowerCase().includes(term));

      // Category
      const matchCategory = selectedCategory === 'ALL' || exp.category === selectedCategory;

      // Payment method
      const matchMethod = selectedPaymentMethod === 'ALL' || exp.paymentMethod === selectedPaymentMethod;

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

      return matchSearch && matchCategory && matchMethod && matchDate;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, searchQuery, selectedCategory, selectedPaymentMethod, dateFilter]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const totalExpense = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const todayExpense = expenses
      .filter(e => e.date === todayStr)
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const thisMonthExpense = expenses
      .filter(e => {
        const d = new Date(e.date);
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      })
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    // Group by category to find top category
    const catMap: Record<string, number> = {};
    expenses.forEach(e => {
      catMap[e.category] = (catMap[e.category] || 0) + (Number(e.amount) || 0);
    });

    let topCat = 'None';
    let topCatAmt = 0;
    Object.entries(catMap).forEach(([cat, amt]) => {
      if (amt > topCatAmt) {
        topCatAmt = amt;
        topCat = cat;
      }
    });

    return {
      totalExpense,
      todayExpense,
      thisMonthExpense,
      topCat,
      topCatAmt,
      filteredTotal: filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
    };
  }, [expenses, filteredExpenses]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingExpense(null);
    setTitle('');
    setCategory(EXPENSE_CATEGORIES[0].name);
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('Cash');
    setPaidBy(currentUser?.name || 'MD MAHI UDDIN');
    setReferenceNo('');
    setNotes('');
    setFormError('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (exp: Expense) => {
    setEditingExpense(exp);
    setTitle(exp.title);
    setCategory(exp.category);
    setAmount(exp.amount);
    setDate(exp.date);
    setPaymentMethod(exp.paymentMethod);
    setPaidBy(exp.paidBy || currentUser?.name || 'MD MAHI UDDIN');
    setReferenceNo(exp.referenceNo || '');
    setNotes(exp.notes || '');
    setFormError('');
    setIsModalOpen(true);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim()) {
      setFormError('Please enter an expense title / description.');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setFormError('Please enter a valid expense amount greater than 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      const expenseItem: Expense = {
        id: editingExpense?.id || `exp-${Date.now()}`,
        expenseNumber: editingExpense?.expenseNumber || `EXP/${new Date().getFullYear()}/${String(expenses.length + 1).padStart(3, '0')}`,
        date,
        category,
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
      setFormError(err.message || 'Failed to save expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Download CSV
  const handleDownloadCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Voucher No,Date,Category,Expense Description,Amount (BDT),Payment Method,Paid By,Reference / Memo No,Notes\n";

    filteredExpenses.forEach(exp => {
      csvContent += `"${exp.expenseNumber}","${exp.date}","${exp.category}","${exp.title.replace(/"/g, '""')}",${exp.amount},"${exp.paymentMethod}","${exp.paidBy || ''}","${exp.referenceNo || ''}","${(exp.notes || '').replace(/"/g, '""')}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `hitachisolutioncenter-expenses-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Category badge helper
  const getCategoryBadge = (catName: string) => {
    const found = EXPENSE_CATEGORIES.find(c => c.name === catName);
    return found?.color || 'text-slate-700 bg-slate-100 border-slate-200';
  };

  // Payment method badge helper
  const getMethodBadge = (method: ExpensePaymentMethod) => {
    switch (method) {
      case 'Cash':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Bank Transfer':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'bKash/Nagad':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'Cheque':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 text-xs animate-fade-in">
      
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-50 text-rose-700 rounded-xl border border-rose-200">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 font-display">
                Showroom & Daily Expenses (দৈনন্দিন খরচ ও ব্যয়)
              </h2>
              <p className="text-slate-400 text-[11px]">
                Track showroom overheads, utilities, staff conveyance, courier, and miscellaneous operational costs.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsPrintSummaryOpen(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold uppercase tracking-wider rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Print Expense Summary"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            Print Summary
          </button>

          <button
            onClick={handleDownloadCSV}
            className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 font-bold uppercase tracking-wider rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Export CSV"
          >
            <Download className="w-4 h-4 text-blue-700" />
            Export CSV
          </button>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold uppercase tracking-wider rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            + New Expense (নতুন খরচ এন্ট্রি)
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total All-Time Expenses */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="font-bold text-[10px] uppercase tracking-wider">Total Expenses (সর্বমোট ব্যয়)</span>
            <div className="p-1.5 bg-rose-50 text-rose-700 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-slate-900 font-display">
            ৳{metrics.totalExpense.toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-400 font-medium">
            Across {expenses.length} recorded voucher entries
          </p>
        </div>

        {/* Card 2: This Month's Expenses */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="font-bold text-[10px] uppercase tracking-wider">This Month (চলতি মাস)</span>
            <div className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-blue-900 font-display">
            ৳{metrics.thisMonthExpense.toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-400 font-medium">
            Total operational costs this calendar month
          </p>
        </div>

        {/* Card 3: Today's Expenses */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="font-bold text-[10px] uppercase tracking-wider">Today's Expense (আজকের খরচ)</span>
            <div className="p-1.5 bg-amber-50 text-amber-700 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-amber-800 font-display">
            ৳{metrics.todayExpense.toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-400 font-medium">
            Today's petty cash & direct payments
          </p>
        </div>

        {/* Card 4: Top Expense Category */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="font-bold text-[10px] uppercase tracking-wider">Top Category (সর্বোচ্চ খাত)</span>
            <div className="p-1.5 bg-purple-50 text-purple-700 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-sm font-extrabold text-slate-800 truncate" title={metrics.topCat}>
            {metrics.topCat}
          </div>
          <p className="text-[10px] text-purple-700 font-bold">
            ৳{metrics.topCatAmt.toLocaleString()} spent
          </p>
        </div>
      </div>

      {/* Search, Filter Toolbar & Category Pills */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Search box */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search voucher #, title, reference no, or staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white focus:outline-hidden"
            />
          </div>

          {/* Payment Method filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedPaymentMethod}
              onChange={(e) => setSelectedPaymentMethod(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">All Payment Methods</option>
              <option value="Cash">Cash (নগদ)</option>
              <option value="Bank Transfer">Bank Transfer (ব্যাংক)</option>
              <option value="bKash/Nagad">bKash/Nagad (মোবাইল ব্যাংকিং)</option>
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
              <option value="ALL">All Time (সব সময়)</option>
              <option value="TODAY">Today Only (আজকের খরচ)</option>
              <option value="THIS_WEEK">This Week (এই সপ্তাহ)</option>
              <option value="THIS_MONTH">This Month (চলতি মাস)</option>
              <option value="LAST_MONTH">Last Month (গত মাস)</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="border-t border-slate-100 pt-3 flex flex-wrap gap-1.5 items-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" /> Categories:
          </span>

          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Categories ({expenses.length})
          </button>

          {EXPENSE_CATEGORIES.map(cat => {
            const count = expenses.filter(e => e.category === cat.name).length;
            if (count === 0 && selectedCategory !== cat.name) return null;
            return (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                  selectedCategory === cat.name
                    ? 'bg-rose-700 text-white border-rose-700 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                <span>{cat.name}</span>
                <span className="text-[9px] opacity-75 font-mono">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Expense Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="font-bold text-slate-700">
            Showing {filteredExpenses.length} Expense Records
          </span>
          <span className="font-extrabold text-rose-800 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
            Filtered Total: ৳{metrics.filteredTotal.toLocaleString()}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Voucher No. / Date</th>
                <th className="py-3 px-3">Category (খাত)</th>
                <th className="py-3 px-3">Description / Title</th>
                <th className="py-3 px-3">Paid By / Ref</th>
                <th className="py-3 px-3 text-center">Payment Method</th>
                <th className="py-3 px-4 text-right">Amount (BDT)</th>
                <th className="py-3 px-3 text-center w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Voucher No & Date */}
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <span className="font-extrabold text-slate-900 block font-mono text-xs">
                          {exp.expenseNumber}
                        </span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {exp.date}
                        </span>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3">
                      <span className={`inline-block font-bold text-[10px] px-2 py-0.5 rounded-md border ${getCategoryBadge(exp.category)}`}>
                        {exp.category}
                      </span>
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

                    {/* Paid By & Reference */}
                    <td className="py-3 px-3">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-slate-800 block text-[11px]">
                          {exp.paidBy || 'Office Cash'}
                        </span>
                        {exp.referenceNo && (
                          <span className="text-[9px] font-mono text-slate-500 bg-slate-100 px-1 py-0.5 rounded inline-block">
                            Ref: {exp.referenceNo}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Payment Method */}
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-block font-bold text-[10px] px-2 py-0.5 rounded-full border ${getMethodBadge(exp.paymentMethod)}`}>
                        {exp.paymentMethod}
                      </span>
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
                          title="Edit expense"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete expense "${exp.title}" (৳${exp.amount.toLocaleString()})?`)) {
                              onDeleteExpense(exp.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          title="Delete expense"
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
                    {searchQuery ? 'No expenses matched your filter criteria.' : 'No expenses recorded yet. Click "+ New Expense" to log your first expenditure.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT EXPENSE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-4 my-8 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingExpense ? 'Modify Expense Voucher' : 'Record New Showroom Expense (নতুন খরচ এন্ট্রি)'}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {editingExpense ? `Updating Voucher #${editingExpense.expenseNumber}` : 'Log daily operational, utility, travel, or office costs'}
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
              {/* Category */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Expense Category (খরচের খাত)</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold text-slate-800 focus:outline-hidden"
                >
                  {EXPENSE_CATEGORIES.map(c => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Title / Description */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Expense Title / Description (খরচের বিবরণ)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Showroom Electricity Bill, Compressor delivery transport, etc."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-semibold focus:bg-white focus:outline-hidden"
                />
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Amount (খরচের পরিমাণ ৳)</label>
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
                  <label className="font-bold text-slate-700">Date (তারিখ)</label>
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
                  <label className="font-bold text-slate-700">Payment Method (পরিশোধের মাধ্যম)</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as ExpensePaymentMethod)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-semibold text-slate-800 focus:outline-hidden"
                  >
                    <option value="Cash">Cash (নগদ)</option>
                    <option value="Bank Transfer">Bank Transfer (ব্যাংক একাউন্ট)</option>
                    <option value="bKash/Nagad">bKash / Nagad (বিকাশ / নগদ)</option>
                    <option value="Cheque">Cheque (চেক)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Paid By / Spender (প্রদানকারী)</label>
                  <input
                    type="text"
                    value={paidBy}
                    onChange={(e) => setPaidBy(e.target.value)}
                    placeholder="e.g. Staff or Manager name"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-semibold focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Reference / Voucher No. */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Money Receipt / Voucher / Memo Ref (মেমো বা ভাউচার নম্বর)</label>
                <input
                  type="text"
                  placeholder="e.g. SA-9821, CHQ-481940, CASH-MEMO-44"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono font-semibold focus:bg-white focus:outline-hidden"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Remarks / Internal Notes (অতিরিক্ত নোট)</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any extra context or supplier details..."
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
                  {isSubmitting ? 'Saving...' : (editingExpense ? 'Update Expense' : 'Save Expense (সংরক্ষণ করুন)')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE EXPENSE SUMMARY MODAL */}
      {isPrintSummaryOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl p-6 space-y-4 my-8 print:p-0 print:border-none print:shadow-none">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-rose-700" />
                <h3 className="text-sm font-bold text-slate-900">Expense Statement & Audit Summary</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-blue-900 text-white font-bold rounded-lg flex items-center gap-1 text-xs cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Print Document
                </button>
                <button
                  onClick={() => setIsPrintSummaryOpen(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold px-2 py-1"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Print Content Area */}
            <div className="p-4 space-y-4">
              <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                <div>
                  <h1 className="text-lg font-black text-slate-900 font-display">{settings.name || 'HITACHI SOLUTION CENTER'}</h1>
                  <p className="text-[11px] text-slate-500">{settings.address || 'Corporate Showroom & Service Center, Dhaka'}</p>
                  <p className="text-[11px] text-slate-500">Hotline: {settings.phone1 || '01715-994956'}</p>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-sm text-rose-800 uppercase tracking-wider block">OFFICIAL EXPENSE STATEMENT</span>
                  <span className="text-[10px] text-slate-400 block">Generated: {new Date().toLocaleDateString('en-GB')}</span>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Vouchers</span>
                  <span className="text-base font-extrabold text-slate-800">{filteredExpenses.length}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Date Filter</span>
                  <span className="text-base font-extrabold text-slate-800">{dateFilter}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Expenditure</span>
                  <span className="text-base font-extrabold text-rose-800">৳{metrics.filteredTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Table */}
              <table className="w-full text-left text-[11px] border border-slate-200">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                    <th className="py-2 px-2.5">SNo.</th>
                    <th className="py-2 px-2.5">Date</th>
                    <th className="py-2 px-2.5">Category</th>
                    <th className="py-2 px-2.5">Title</th>
                    <th className="py-2 px-2.5">Method</th>
                    <th className="py-2 px-2.5">Paid By</th>
                    <th className="py-2 px-2.5 text-right">Amount (BDT)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredExpenses.map((exp, idx) => (
                    <tr key={exp.id}>
                      <td className="py-1.5 px-2.5 font-mono text-slate-500">{exp.expenseNumber}</td>
                      <td className="py-1.5 px-2.5">{exp.date}</td>
                      <td className="py-1.5 px-2.5 font-semibold text-slate-700">{exp.category}</td>
                      <td className="py-1.5 px-2.5">{exp.title}</td>
                      <td className="py-1.5 px-2.5">{exp.paymentMethod}</td>
                      <td className="py-1.5 px-2.5">{exp.paidBy}</td>
                      <td className="py-1.5 px-2.5 text-right font-bold text-slate-900">৳{exp.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-bold">
                    <td colSpan={6} className="py-2 px-2.5 text-right">Grand Total:</td>
                    <td className="py-2 px-2.5 text-right text-rose-700 text-xs">৳{metrics.filteredTotal.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs">
                <div>
                  <div className="border-t border-slate-300 pt-1 font-bold text-slate-700">Prepared By (Accounts)</div>
                </div>
                <div>
                  <div className="border-t border-slate-300 pt-1 font-bold text-slate-700">{settings.signatureName || 'Managing Director'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
