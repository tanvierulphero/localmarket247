import React, { useState, useMemo } from 'react';
import { FieldDispatch, Customer, StaffUser, BusinessSettings, FieldPaymentStatus, FieldDispatchStatus } from '../types';
import { 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  Printer, 
  Calendar, 
  Building2, 
  User, 
  Phone, 
  MapPin, 
  FileText, 
  DollarSign, 
  CreditCard, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Download, 
  RefreshCw, 
  X, 
  Filter, 
  Users, 
  Briefcase, 
  Receipt,
  Car,
  ChevronDown,
  ChevronUp,
  Layers
} from 'lucide-react';
import Logo from './Logo';

interface FieldDispatchManagerProps {
  dispatches: FieldDispatch[];
  customers: Customer[];
  staffUsers: StaffUser[];
  settings: BusinessSettings;
  onSaveDispatch: (dispatch: FieldDispatch) => Promise<void>;
  onDeleteDispatch: (id: string) => Promise<void>;
}

export default function FieldDispatchManager({
  dispatches,
  customers,
  staffUsers,
  settings,
  onSaveDispatch,
  onDeleteDispatch,
}: FieldDispatchManagerProps) {
  // Navigation & View Tabs
  const [activeTab, setActiveTab] = useState<'all_entries' | 'staff_report' | 'company_report'>('all_entries');

  // Filter States
  const [dateFilterPreset, setDateFilterPreset] = useState<'all' | 'today' | 'last7' | 'thisMonth' | 'lastMonth' | 'custom'>('thisMonth');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStaffFilter, setSelectedStaffFilter] = useState('All');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState('All');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('All');

  // Modal States
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FieldDispatch | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [voucherToPrint, setVoucherToPrint] = useState<FieldDispatch | null>(null);
  const [isPrintingFullReport, setIsPrintingFullReport] = useState(false);

  // Form State for Entry / Edit
  const [formData, setFormData] = useState<{
    id?: string;
    date: string;
    staffId: string;
    staffName: string;
    customerId: string;
    companyName: string;
    address: string;
    phone: string;
    description: string;
    billNo: string;
    billAmount: number | string;
    paidAmount: number | string;
    dueAmount: number | string;
    expenseAmount: number | string;
    expenseDetails: string;
    paymentStatus: FieldPaymentStatus;
    paymentMethod: 'Cash' | 'Bank Transfer' | 'bKash/Nagad' | 'Cheque';
    status: FieldDispatchStatus;
    notes: string;
  }>({
    date: new Date().toISOString().split('T')[0],
    staffId: '',
    staffName: '',
    customerId: '',
    companyName: '',
    address: '',
    phone: '',
    description: '',
    billNo: '',
    billAmount: '',
    paidAmount: '',
    dueAmount: 0,
    expenseAmount: '',
    expenseDetails: '',
    paymentStatus: 'Paid',
    paymentMethod: 'Cash',
    status: 'Completed',
    notes: '',
  });

  // Expanded cards state for staff/company reports
  const [expandedStaff, setExpandedStaff] = useState<string | null>(null);
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null);

  // Helper: Open Modal for New Entry
  const handleOpenNewEntry = () => {
    // Generate next Bill No recommendation
    const year = new Date().getFullYear();
    const count = dispatches.length + 1;
    const nextBillNo = `BIL-${year}-${String(count).padStart(3, '0')}`;

    setEditingEntry(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      staffId: staffUsers[0]?.id || '',
      staffName: staffUsers[0]?.name || '',
      customerId: '',
      companyName: '',
      address: '',
      phone: '',
      description: '',
      billNo: nextBillNo,
      billAmount: '',
      paidAmount: '',
      dueAmount: 0,
      expenseAmount: '',
      expenseDetails: '',
      paymentStatus: 'Paid',
      paymentMethod: 'Cash',
      status: 'Completed',
      notes: '',
    });
    setIsEntryModalOpen(true);
  };

  // Helper: Open Modal for Edit
  const handleOpenEditEntry = (entry: FieldDispatch) => {
    setEditingEntry(entry);
    setFormData({
      id: entry.id,
      date: entry.date || entry.dispatchDate || new Date().toISOString().split('T')[0],
      staffId: entry.staffId || '',
      staffName: entry.staffName || '',
      customerId: entry.customerId || '',
      companyName: entry.companyName || entry.customerCompany || '',
      address: entry.address || '',
      phone: entry.phone || entry.customerPhone || '',
      description: entry.description || entry.purpose || '',
      billNo: entry.billNo || entry.dispatchNumber || '',
      billAmount: entry.billAmount ?? 0,
      paidAmount: entry.paidAmount ?? 0,
      dueAmount: entry.dueAmount ?? 0,
      expenseAmount: entry.expenseAmount ?? 0,
      expenseDetails: entry.expenseDetails || '',
      paymentStatus: entry.paymentStatus || 'Paid',
      paymentMethod: entry.paymentMethod || 'Cash',
      status: entry.status || 'Completed',
      notes: entry.notes || '',
    });
    setIsEntryModalOpen(true);
  };

  // Form Field Change Handlers & Auto-calculations
  const handleCompanySelect = (compId: string) => {
    if (!compId) {
      setFormData(prev => ({ ...prev, customerId: '', companyName: '', address: '', phone: '' }));
      return;
    }
    const cust = customers.find(c => c.id === compId);
    if (cust) {
      setFormData(prev => ({
        ...prev,
        customerId: cust.id,
        companyName: cust.company || cust.name,
        address: cust.address || '',
        phone: cust.phone || '',
      }));
    }
  };

  const handleStaffSelect = (stId: string) => {
    if (!stId) {
      setFormData(prev => ({ ...prev, staffId: '', staffName: '' }));
      return;
    }
    const st = staffUsers.find(s => s.id === stId);
    if (st) {
      setFormData(prev => ({
        ...prev,
        staffId: st.id,
        staffName: st.name,
      }));
    }
  };

  const handleFinancialChange = (
    field: 'billAmount' | 'paidAmount' | 'expenseAmount',
    val: string
  ) => {
    const numVal = val === '' ? '' : parseFloat(val) || 0;
    
    setFormData(prev => {
      const nextBill = field === 'billAmount' ? (numVal === '' ? 0 : Number(numVal)) : (Number(prev.billAmount) || 0);
      const nextPaid = field === 'paidAmount' ? (numVal === '' ? 0 : Number(numVal)) : (Number(prev.paidAmount) || 0);
      
      const calcDue = Math.max(0, nextBill - nextPaid);
      let autoStatus: FieldPaymentStatus = 'Paid';
      if (nextBill > 0) {
        if (nextPaid >= nextBill) {
          autoStatus = 'Paid';
        } else if (nextPaid > 0) {
          autoStatus = 'Partial';
        } else {
          autoStatus = 'Due';
        }
      }

      return {
        ...prev,
        [field]: val,
        dueAmount: calcDue,
        paymentStatus: autoStatus,
      };
    });
  };

  // Form Submit
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.staffName.trim()) {
      alert('অনুগ্রহ করে কর্মচারীর নাম উল্লেখ করুন।');
      return;
    }

    if (!formData.companyName.trim()) {
      alert('অনুগ্রহ করে কোম্পানির নাম / ক্লায়েন্টের নাম লিখুন।');
      return;
    }

    const bAmt = Number(formData.billAmount) || 0;
    const pAmt = Number(formData.paidAmount) || 0;
    const dAmt = Math.max(0, bAmt - pAmt);
    const expAmt = Number(formData.expenseAmount) || 0;

    const newOrUpdated: FieldDispatch = {
      id: formData.id || `disp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      date: formData.date || new Date().toISOString().split('T')[0],
      staffId: formData.staffId || undefined,
      staffName: formData.staffName.trim(),
      customerId: formData.customerId || undefined,
      companyName: formData.companyName.trim(),
      address: formData.address.trim(),
      phone: formData.phone.trim(),
      description: formData.description.trim(),
      billNo: formData.billNo.trim() || `BIL-${Date.now().toString().slice(-6)}`,
      billAmount: bAmt,
      paidAmount: pAmt,
      dueAmount: dAmt,
      expenseAmount: expAmt,
      expenseDetails: formData.expenseDetails.trim(),
      paymentStatus: formData.paymentStatus,
      paymentMethod: formData.paymentMethod,
      status: formData.status,
      notes: formData.notes.trim(),
      createdAt: editingEntry?.createdAt || new Date().toISOString(),
      // Legacy props for maximum compatibility
      dispatchNumber: formData.billNo.trim(),
      dispatchDate: formData.date,
      customerCompany: formData.companyName.trim(),
      customerName: formData.companyName.trim(),
      customerPhone: formData.phone.trim(),
      purpose: formData.description.trim(),
    };

    await onSaveDispatch(newOrUpdated);
    setIsEntryModalOpen(false);
    setEditingEntry(null);
  };

  // Filter Date Calculation
  const isDateInRange = (dateStr: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();

    if (dateFilterPreset === 'all') return true;

    if (dateFilterPreset === 'today') {
      const todayStr = now.toISOString().split('T')[0];
      return dateStr === todayStr;
    }

    if (dateFilterPreset === 'last7') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      return d >= sevenDaysAgo && d <= now;
    }

    if (dateFilterPreset === 'thisMonth') {
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }

    if (dateFilterPreset === 'lastMonth') {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      return d >= lastMonth && d <= lastMonthEnd;
    }

    if (dateFilterPreset === 'custom') {
      if (customStartDate && dateStr < customStartDate) return false;
      if (customEndDate && dateStr > customEndDate) return false;
      return true;
    }

    return true;
  };

  // Filtered Dispatches List
  const filteredDispatches = useMemo(() => {
    return dispatches.filter(disp => {
      const d = disp.date || disp.dispatchDate || '';
      if (!isDateInRange(d)) return false;

      // Staff filter
      if (selectedStaffFilter !== 'All') {
        const matchStaff = disp.staffName.toLowerCase() === selectedStaffFilter.toLowerCase() ||
                           disp.staffId === selectedStaffFilter;
        if (!matchStaff) return false;
      }

      // Company filter
      if (selectedCompanyFilter !== 'All') {
        const comp = (disp.companyName || disp.customerCompany || '').toLowerCase();
        if (!comp.includes(selectedCompanyFilter.toLowerCase())) return false;
      }

      // Payment Status filter
      if (selectedPaymentStatus !== 'All') {
        if (disp.paymentStatus !== selectedPaymentStatus) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const bNo = (disp.billNo || disp.dispatchNumber || '').toLowerCase();
        const sName = disp.staffName.toLowerCase();
        const cName = (disp.companyName || disp.customerCompany || '').toLowerCase();
        const addr = (disp.address || '').toLowerCase();
        const desc = (disp.description || disp.purpose || '').toLowerCase();
        const expDet = (disp.expenseDetails || '').toLowerCase();

        return bNo.includes(q) || sName.includes(q) || cName.includes(q) || addr.includes(q) || desc.includes(q) || expDet.includes(q);
      }

      return true;
    }).sort((a, b) => {
      const dateA = a.date || a.dispatchDate || '';
      const dateB = b.date || b.dispatchDate || '';
      return dateB.localeCompare(dateA); // Newest first
    });
  }, [dispatches, dateFilterPreset, customStartDate, customEndDate, selectedStaffFilter, selectedCompanyFilter, selectedPaymentStatus, searchQuery]);

  // Aggregate Key Performance Indicators (KPIs)
  const stats = useMemo(() => {
    let totalBill = 0;
    let totalPaid = 0;
    let totalDue = 0;
    let totalExpense = 0;

    filteredDispatches.forEach(item => {
      totalBill += Number(item.billAmount) || 0;
      totalPaid += Number(item.paidAmount) || 0;
      totalDue += Number(item.dueAmount) || 0;
      totalExpense += Number(item.expenseAmount) || 0;
    });

    const netCash = totalPaid - totalExpense;

    return {
      totalCount: filteredDispatches.length,
      totalBill,
      totalPaid,
      totalDue,
      totalExpense,
      netCash,
    };
  }, [filteredDispatches]);

  // Unique list of companies and staff for filter dropdowns
  const uniqueCompanies = useMemo(() => {
    const set = new Set<string>();
    dispatches.forEach(d => {
      const name = d.companyName || d.customerCompany;
      if (name) set.add(name);
    });
    customers.forEach(c => {
      if (c.company) set.add(c.company);
    });
    return Array.from(set).sort();
  }, [dispatches, customers]);

  const uniqueStaffList = useMemo(() => {
    const set = new Set<string>();
    dispatches.forEach(d => {
      if (d.staffName) set.add(d.staffName);
    });
    staffUsers.forEach(s => {
      if (s.name) set.add(s.name);
    });
    return Array.from(set).sort();
  }, [dispatches, staffUsers]);

  // Staff-wise Breakdown Report
  const staffBreakdown = useMemo(() => {
    const map: { [key: string]: {
      staffName: string;
      totalJobs: number;
      totalBill: number;
      totalPaid: number;
      totalDue: number;
      totalExpense: number;
      netCash: number;
      entries: FieldDispatch[];
    } } = {};

    filteredDispatches.forEach(item => {
      const key = item.staffName || 'Unknown';
      if (!map[key]) {
        map[key] = {
          staffName: key,
          totalJobs: 0,
          totalBill: 0,
          totalPaid: 0,
          totalDue: 0,
          totalExpense: 0,
          netCash: 0,
          entries: [],
        };
      }
      map[key].totalJobs += 1;
      map[key].totalBill += Number(item.billAmount) || 0;
      map[key].totalPaid += Number(item.paidAmount) || 0;
      map[key].totalDue += Number(item.dueAmount) || 0;
      map[key].totalExpense += Number(item.expenseAmount) || 0;
      map[key].netCash += (Number(item.paidAmount) || 0) - (Number(item.expenseAmount) || 0);
      map[key].entries.push(item);
    });

    return Object.values(map).sort((a, b) => b.totalBill - a.totalBill);
  }, [filteredDispatches]);

  // Company-wise Breakdown Report
  const companyBreakdown = useMemo(() => {
    const map: { [key: string]: {
      companyName: string;
      address: string;
      phone: string;
      totalVisits: number;
      totalBill: number;
      totalPaid: number;
      totalDue: number;
      lastVisitDate: string;
      entries: FieldDispatch[];
    } } = {};

    filteredDispatches.forEach(item => {
      const key = item.companyName || item.customerCompany || 'Unknown Client';
      if (!map[key]) {
        map[key] = {
          companyName: key,
          address: item.address || '',
          phone: item.phone || '',
          totalVisits: 0,
          totalBill: 0,
          totalPaid: 0,
          totalDue: 0,
          lastVisitDate: item.date || item.dispatchDate || '',
          entries: [],
        };
      }
      map[key].totalVisits += 1;
      map[key].totalBill += Number(item.billAmount) || 0;
      map[key].totalPaid += Number(item.paidAmount) || 0;
      map[key].totalDue += Number(item.dueAmount) || 0;
      if ((item.date || '') > map[key].lastVisitDate) {
        map[key].lastVisitDate = item.date || '';
      }
      map[key].entries.push(item);
    });

    return Object.values(map).sort((a, b) => b.totalBill - a.totalBill);
  }, [filteredDispatches]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredDispatches.length === 0) {
      alert('ডাউনলোড করার মতো কোনো ডাটা পাওয়া যায়নি।');
      return;
    }

    const headers = [
      'তারিখ (Date)',
      'বিল নং (Bill No)',
      'কর্মচারীর নাম (Staff Name)',
      'কোম্পানির নাম (Company Name)',
      'ঠিকানা (Address)',
      'কাজের বিবরণ (Description)',
      'বিল এমাউন্ট (Bill Amount ৳)',
      'পেইড (Paid ৳)',
      'ডিউ (Due ৳)',
      'কর্মচারীর খরচ (Staff Expense ৳)',
      'খরচের বিবরণ (Expense Details)',
      'নেট কালেকশন (Net Cash ৳)',
      'পেমেন্ট স্ট্যাটাস (Payment Status)',
      'পেমেন্ট মেথড (Payment Method)',
      'মন্তব্য (Notes)'
    ];

    const rows = filteredDispatches.map(d => [
      `"${d.date || d.dispatchDate || ''}"`,
      `"${d.billNo || d.dispatchNumber || ''}"`,
      `"${d.staffName || ''}"`,
      `"${(d.companyName || d.customerCompany || '').replace(/"/g, '""')}"`,
      `"${(d.address || '').replace(/"/g, '""')}"`,
      `"${(d.description || d.purpose || '').replace(/"/g, '""')}"`,
      d.billAmount || 0,
      d.paidAmount || 0,
      d.dueAmount || 0,
      d.expenseAmount || 0,
      `"${(d.expenseDetails || '').replace(/"/g, '""')}"`,
      (d.paidAmount || 0) - (d.expenseAmount || 0),
      `"${d.paymentStatus || 'Paid'}"`,
      `"${d.paymentMethod || 'Cash'}"`,
      `"${(d.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Field_Service_Statement_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-xl shadow-md shadow-blue-500/20">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 font-display flex items-center gap-2">
              Field Service & Work Logs
              <span className="text-xs font-bold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                ফিল্ড সার্ভিস ও কাজের খতিয়ান
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              তারিখ অনুযায়ী মাঠপর্যায়ের কাজের লগ, বিলিং, বকেয়া আদায় ও কর্মচারীদের খরচের পূর্ণাঙ্গ হিসাব
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsPrintingFullReport(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer border border-slate-200"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            রিপোর্ট প্রিন্ট
          </button>
          
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl font-bold text-xs transition-colors cursor-pointer border border-emerald-200"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            Excel / CSV
          </button>

          <button
            onClick={handleOpenNewEntry}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-blue-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            + নতুন এন্ট্রি (New Service Entry)
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards (KPI Summary) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Card 1: Total Jobs */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">মোট কাজ/ভিজিট</span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-display">
            {stats.totalCount} <span className="text-xs font-semibold text-slate-400">টি</span>
          </p>
          <p className="text-[10px] text-slate-500 font-medium">নির্বাচিত সময়সীমায়</p>
        </div>

        {/* Card 2: Total Bill */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">মোট কাজের বিল</span>
            <Receipt className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-xl font-black text-indigo-950 font-display">
            ৳{stats.totalBill.toLocaleString()}
          </p>
          <p className="text-[10px] text-indigo-600 font-medium">মোট বিল ভাউচার</p>
        </div>

        {/* Card 3: Total Paid / Collected */}
        <div className="bg-white p-4 rounded-xl border border-emerald-200/80 shadow-sm space-y-1 bg-gradient-to-br from-white to-emerald-50/40">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-[11px] font-bold uppercase tracking-wider">মোট পেইড / আদায়</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-black text-emerald-800 font-display">
            ৳{stats.totalPaid.toLocaleString()}
          </p>
          <p className="text-[10px] text-emerald-700 font-medium">ক্লায়েন্ট থেকে প্রাপ্ত</p>
        </div>

        {/* Card 4: Total Due */}
        <div className={`p-4 rounded-xl border shadow-sm space-y-1 ${
          stats.totalDue > 0 ? 'bg-rose-50/70 border-rose-200' : 'bg-white border-slate-200/80'
        }`}>
          <div className="flex items-center justify-between text-rose-600">
            <span className="text-[11px] font-bold uppercase tracking-wider">মোট বকেয়া / ডিউ</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-xl font-black text-rose-700 font-display">
            ৳{stats.totalDue.toLocaleString()}
          </p>
          <p className="text-[10px] text-rose-600 font-medium">অবশিষ্ট পাওনা বিল</p>
        </div>

        {/* Card 5: Total Expenses */}
        <div className="bg-white p-4 rounded-xl border border-amber-200/80 shadow-sm space-y-1 bg-gradient-to-br from-white to-amber-50/40">
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-[11px] font-bold uppercase tracking-wider">কর্মচারীদের খরচ</span>
            <Car className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xl font-black text-amber-800 font-display">
            ৳{stats.totalExpense.toLocaleString()}
          </p>
          <p className="text-[10px] text-amber-700 font-medium">যাতায়াত ও ফিল্ড খরচ</p>
        </div>

        {/* Card 6: Net Cash In-Hand */}
        <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white p-4 rounded-xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-[11px] font-bold uppercase tracking-wider">নেট জমা ব্যালেন্স</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-black text-emerald-400 font-display">
            ৳{stats.netCash.toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-300 font-medium">(আদায় − ফিল্ড খরচ)</p>
        </div>
      </div>

      {/* 3. Filter Toolbar & Date Range Presets */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3.5">
        {/* Row 1: Date Range Presets */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> সময়সীমা:
            </span>
            {[
              { id: 'today', label: 'আজ (Today)' },
              { id: 'last7', label: 'গত ৭ দিন' },
              { id: 'thisMonth', label: 'চলতি মাস' },
              { id: 'lastMonth', label: 'গত মাস' },
              { id: 'custom', label: 'কাস্টম তারিখ' },
              { id: 'all', label: 'সকল সময়' },
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setDateFilterPreset(p.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                  dateFilterPreset === p.id
                    ? 'bg-blue-700 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom Date Pickers */}
          {dateFilterPreset === 'custom' && (
            <div className="flex items-center gap-2 text-xs font-bold">
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
                <span className="text-slate-400 text-[10px]">শুরু:</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={e => setCustomStartDate(e.target.value)}
                  className="bg-transparent text-slate-800 text-xs font-bold outline-none cursor-pointer"
                />
              </div>
              <span className="text-slate-300">—</span>
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
                <span className="text-slate-400 text-[10px]">শেষ:</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={e => setCustomEndDate(e.target.value)}
                  className="bg-transparent text-slate-800 text-xs font-bold outline-none cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* Row 2: Search & Entity Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Live Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="বিল নং, কোম্পানি, কর্মচারী, কাজ..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
            />
          </div>

          {/* Employee Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <select
              value={selectedStaffFilter}
              onChange={e => setSelectedStaffFilter(e.target.value)}
              className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="All">সকল কর্মচারী (All Staff)</option>
              {uniqueStaffList.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Company Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <select
              value={selectedCompanyFilter}
              onChange={e => setSelectedCompanyFilter(e.target.value)}
              className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="All">সকল কোম্পানি (All Companies)</option>
              {uniqueCompanies.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Payment Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <CreditCard className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <select
              value={selectedPaymentStatus}
              onChange={e => setSelectedPaymentStatus(e.target.value)}
              className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="All">সকল পেমেন্ট স্ট্যাটাস</option>
              <option value="Paid">পরিশোধ (Paid)</option>
              <option value="Partial">আংশিক বকেয়া (Partial)</option>
              <option value="Due">সম্পূর্ণ বকেয়া (Due)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Section Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-3">
        <button
          onClick={() => setActiveTab('all_entries')}
          className={`pb-3 px-4 text-xs font-extrabold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'all_entries'
              ? 'border-blue-700 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          তারিখ অনুযায়ী এন্ট্রি তালিকা ({filteredDispatches.length})
        </button>

        <button
          onClick={() => setActiveTab('staff_report')}
          className={`pb-3 px-4 text-xs font-extrabold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'staff_report'
              ? 'border-blue-700 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          কর্মচারীভিত্তিক কাজের হিসাব ও খরচ রিপোর্ট ({staffBreakdown.length})
        </button>

        <button
          onClick={() => setActiveTab('company_report')}
          className={`pb-3 px-4 text-xs font-extrabold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'company_report'
              ? 'border-blue-700 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          কোম্পানিভিত্তিক সার্ভিস হিস্ট্রি ও ডিউ ({companyBreakdown.length})
        </button>
      </div>

      {/* 5. TAB 1: ALL ENTRIES TABLE (তারিখ অনুযায়ী এন্ট্রি খতিয়ান) */}
      {activeTab === 'all_entries' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {filteredDispatches.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/90 text-slate-600 font-extrabold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4">তারিখ ও বিল নং</th>
                    <th className="py-3.5 px-4">কর্মচারী</th>
                    <th className="py-3.5 px-4">কোম্পানি ও সাইট ঠিকানা</th>
                    <th className="py-3.5 px-4 max-w-xs">কাজের বিবরণ</th>
                    <th className="py-3.5 px-4 text-right">বিল এমাউন্ট</th>
                    <th className="py-3.5 px-4 text-right">পেইড</th>
                    <th className="py-3.5 px-4 text-right">বিল ডিউ</th>
                    <th className="py-3.5 px-4 text-right">কর্মচারীর খরচ</th>
                    <th className="py-3.5 px-4 text-right">নেট জমা</th>
                    <th className="py-3.5 px-4 text-center">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold">
                  {filteredDispatches.map(item => {
                    const bAmt = Number(item.billAmount) || 0;
                    const pAmt = Number(item.paidAmount) || 0;
                    const dAmt = Number(item.dueAmount) || 0;
                    const expAmt = Number(item.expenseAmount) || 0;
                    const netCash = pAmt - expAmt;

                    return (
                      <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                        {/* Date & Bill No */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-bold text-slate-900 font-mono">
                            {item.date || item.dispatchDate}
                          </div>
                          <span className="inline-block font-mono text-[10px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 mt-0.5">
                            {item.billNo || item.dispatchNumber || 'N/A'}
                          </span>
                        </td>

                        {/* Staff */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-900 font-bold flex items-center justify-center text-xs">
                              {item.staffName.charAt(0)}
                            </div>
                            <span className="font-bold text-slate-800">{item.staffName}</span>
                          </div>
                        </td>

                        {/* Company & Address */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 leading-snug">
                            {item.companyName || item.customerCompany || 'N/A'}
                          </div>
                          {item.address && (
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 truncate max-w-[200px]">
                              <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                              <span className="truncate">{item.address}</span>
                            </div>
                          )}
                        </td>

                        {/* Description */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <p className="text-slate-700 text-xs line-clamp-2" title={item.description || item.purpose}>
                            {item.description || item.purpose || '—'}
                          </p>
                        </td>

                        {/* Bill Amount */}
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                          ৳{bAmt.toLocaleString()}
                        </td>

                        {/* Paid Amount */}
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                          ৳{pAmt.toLocaleString()}
                          <div className="text-[9px] text-slate-400 font-normal">
                            {item.paymentMethod || 'Cash'}
                          </div>
                        </td>

                        {/* Due Amount */}
                        <td className="py-3.5 px-4 text-right font-mono whitespace-nowrap">
                          {dAmt > 0 ? (
                            <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                              ৳{dAmt.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-emerald-600 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              পরিশোধিত
                            </span>
                          )}
                        </td>

                        {/* Staff Expense */}
                        <td className="py-3.5 px-4 text-right font-mono whitespace-nowrap">
                          {expAmt > 0 ? (
                            <div>
                              <span className="font-bold text-amber-700">
                                ৳{expAmt.toLocaleString()}
                              </span>
                              {item.expenseDetails && (
                                <p className="text-[10px] text-slate-400 truncate max-w-[120px] ml-auto" title={item.expenseDetails}>
                                  {item.expenseDetails}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-300">৳0</span>
                          )}
                        </td>

                        {/* Net Cash */}
                        <td className="py-3.5 px-4 text-right font-mono font-extrabold text-blue-950 whitespace-nowrap">
                          <span className={netCash >= 0 ? 'text-blue-900' : 'text-rose-600'}>
                            ৳{netCash.toLocaleString()}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setVoucherToPrint(item)}
                              className="p-1.5 text-slate-500 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="প্রিন্ট ভাউচার স্লিপ"
                            >
                              <Printer className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleOpenEditEntry(item)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                              title="এডিট করুন"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => setDeletingId(item.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="ডিলিট করুন"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* Table Footer Totals */}
                <tfoot className="bg-slate-100/80 font-black text-slate-900 border-t-2 border-slate-300">
                  <tr>
                    <td colSpan={4} className="py-3.5 px-4 uppercase tracking-wider text-right text-xs">
                      সর্বমোট হিসাব (Total Summary):
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-xs">
                      ৳{stats.totalBill.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-xs text-emerald-800">
                      ৳{stats.totalPaid.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-xs text-rose-700">
                      ৳{stats.totalDue.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-xs text-amber-800">
                      ৳{stats.totalExpense.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-xs text-blue-900">
                      ৳{stats.netCash.toLocaleString()}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <Receipt className="w-12 h-12 mx-auto text-slate-300" />
              <p className="font-bold text-slate-700 text-sm">কোনো ফিল্ড সার্ভিস রেকর্ড পাওয়া যায়নি</p>
              <p className="text-xs max-w-md mx-auto">
                নির্বাচিত সময়সীমায় বা ফিল্টারে কোনো এন্ট্রি নেই। নতুন কাজ ও খরচের হিসাব যুক্ত করতে "+ নতুন এন্ট্রি" বাটনে চাপ দিন।
              </p>
              <button
                onClick={handleOpenNewEntry}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                প্রথম এন্ট্রি তৈরি করুন
              </button>
            </div>
          )}
        </div>
      )}

      {/* 6. TAB 2: STAFF-WISE PERFORMANCE & EXPENSE REPORT */}
      {activeTab === 'staff_report' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {staffBreakdown.map(staff => {
              const isExpanded = expandedStaff === staff.staffName;

              return (
                <div 
                  key={staff.staffName}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4 hover:shadow-md transition-shadow"
                >
                  {/* Staff Card Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow-md shadow-blue-500/20">
                        {staff.staffName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{staff.staffName}</h3>
                        <span className="text-[11px] text-slate-400 font-bold">
                          মোট কাজ: {staff.totalJobs} টি ভিজিট
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Financial Metrics Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">মোট বিল</span>
                      <span className="font-mono font-black text-slate-900">৳{staff.totalBill.toLocaleString()}</span>
                    </div>

                    <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase block">মোট আদায়</span>
                      <span className="font-mono font-black text-emerald-800">৳{staff.totalPaid.toLocaleString()}</span>
                    </div>

                    <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-100">
                      <span className="text-[10px] font-bold text-amber-600 uppercase block">ফিল্ড খরচ</span>
                      <span className="font-mono font-black text-amber-800">৳{staff.totalExpense.toLocaleString()}</span>
                    </div>

                    <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-100">
                      <span className="text-[10px] font-bold text-blue-600 uppercase block">অফিসে নেট জমা</span>
                      <span className="font-mono font-black text-blue-900">৳{staff.netCash.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Accordion Toggle for Detailed Logs */}
                  <div className="border-t border-slate-100 pt-3">
                    <button
                      onClick={() => setExpandedStaff(isExpanded ? null : staff.staffName)}
                      className="w-full flex items-center justify-between text-xs font-bold text-slate-600 hover:text-blue-700 transition-colors cursor-pointer py-1"
                    >
                      <span>কাজের বিস্তারিত তালিকা ({staff.entries.length} টি)</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {isExpanded && (
                      <div className="mt-3 space-y-2 max-h-60 overflow-y-auto pr-1">
                        {staff.entries.map(e => (
                          <div key={e.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px] space-y-1">
                            <div className="flex justify-between items-center font-bold">
                              <span className="text-slate-800">{e.companyName || e.customerCompany}</span>
                              <span className="text-slate-400 font-mono text-[10px]">{e.date || e.dispatchDate}</span>
                            </div>
                            <p className="text-slate-600 text-[10px] line-clamp-1">{e.description || e.purpose}</p>
                            <div className="flex justify-between items-center text-[10px] font-mono pt-1 text-slate-500">
                              <span>বিল: ৳{(e.billAmount || 0).toLocaleString()}</span>
                              <span className="text-emerald-700 font-bold">আদায়: ৳{(e.paidAmount || 0).toLocaleString()}</span>
                              <span className="text-amber-700 font-bold">খরচ: ৳{(e.expenseAmount || 0).toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 7. TAB 3: COMPANY-WISE SERVICE HISTORY & DUES */}
      {activeTab === 'company_report' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {companyBreakdown.map(comp => {
              const isExpanded = expandedCompany === comp.companyName;

              return (
                <div 
                  key={comp.companyName}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-blue-700 flex-shrink-0" />
                        {comp.companyName}
                      </h3>
                      {comp.address && (
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-xs">{comp.address}</p>
                      )}
                    </div>
                    <span className="bg-blue-50 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200">
                      {comp.totalVisits} টি সার্ভিস
                    </span>
                  </div>

                  {/* Financial Stats */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">মোট বিল</span>
                      <span className="font-mono font-black text-slate-900">৳{comp.totalBill.toLocaleString()}</span>
                    </div>

                    <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase block">পরিশোধ</span>
                      <span className="font-mono font-black text-emerald-800">৳{comp.totalPaid.toLocaleString()}</span>
                    </div>

                    <div className={`p-2.5 rounded-xl border ${
                      comp.totalDue > 0 ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-100'
                    }`}>
                      <span className="text-[10px] font-bold text-rose-600 uppercase block">বকেয়া ডিউ</span>
                      <span className="font-mono font-black text-rose-700">৳{comp.totalDue.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 font-medium">
                    সর্বশেষ সার্ভিস: <span className="text-slate-700 font-bold font-mono">{comp.lastVisitDate || 'N/A'}</span>
                  </div>

                  {/* Detailed History Accordion */}
                  <div className="border-t border-slate-100 pt-3">
                    <button
                      onClick={() => setExpandedCompany(isExpanded ? null : comp.companyName)}
                      className="w-full flex items-center justify-between text-xs font-bold text-slate-600 hover:text-blue-700 transition-colors cursor-pointer py-1"
                    >
                      <span>সার্ভিস হিস্ট্রি ({comp.entries.length} টি)</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {isExpanded && (
                      <div className="mt-3 space-y-2 max-h-60 overflow-y-auto pr-1">
                        {comp.entries.map(e => (
                          <div key={e.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px] space-y-1">
                            <div className="flex justify-between items-center font-bold">
                              <span className="text-blue-900 font-mono text-[10px]">{e.billNo || e.dispatchNumber}</span>
                              <span className="text-slate-400 font-mono text-[10px]">{e.date || e.dispatchDate}</span>
                            </div>
                            <p className="text-slate-700 font-semibold">{e.staffName} (কর্মচারী)</p>
                            <p className="text-slate-500 text-[10px]">{e.description || e.purpose}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 8. ENTRY & EDIT MODAL (সহজ এন্ট্রি ও আপডেট ফরম) */}
      {isEntryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-6 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg font-display">
                    {editingEntry ? 'ফিল্ড সার্ভিস এন্ট্রি সংশোধন (Edit Entry)' : 'নতুন ফিল্ড সার্ভিস এন্ট্রি (New Service Entry)'}
                  </h3>
                  <p className="text-xs text-blue-100">
                    কর্মচারীর কাজ, ক্লায়েন্ট বিল, বকেয়া ও যাতায়াত খরচের সম্পূর্ণ তথ্য প্রদান করুন
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEntryModalOpen(false)}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveForm} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Row 1: Date & Bill No */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    তারিখ (Date) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    বিল / ভাউচার নং (Bill / Voucher No) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: BIL-2026-001"
                    value={formData.billNo}
                    onChange={e => setFormData(prev => ({ ...prev, billNo: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 2: Employee Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  কর্মচারীর নাম (Responsible Employee / Staff) <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={formData.staffId}
                    onChange={e => handleStaffSelect(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">কর্মচারী নির্বাচন করুন (Select Staff)</option>
                    {staffUsers.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.designation || s.role})</option>
                    ))}
                  </select>

                  <input
                    type="text"
                    required
                    placeholder="বা কর্মচারীর নাম টাইপ করুন..."
                    value={formData.staffName}
                    onChange={e => setFormData(prev => ({ ...prev, staffName: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 3: Company & Client Details */}
              <div className="space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-extrabold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" /> কোম্পানি / ক্লায়েন্ট তথ্য
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">কাস্টমার প্রোফাইল থেকে বাছাই করুন বা সরাসরি লিখুন</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      রেজিস্টার্ড কোম্পানি লিস্ট (Select Company)
                    </label>
                    <select
                      value={formData.customerId}
                      onChange={e => handleCompanySelect(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                    >
                      <option value="">নতুন কোম্পানি টাইপ করবেন</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.company || c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      কোম্পানির নাম (Company Name) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="কোম্পানির নাম লিখুন..."
                      value={formData.companyName}
                      onChange={e => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      ঠিকানা / ফ্যাক্টরি লোকেশন (Address / Site Location)
                    </label>
                    <input
                      type="text"
                      placeholder="যেমন: কোনাবাড়ী, গাজীপুর"
                      value={formData.address}
                      onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      মোবাইল নম্বর (Phone No)
                    </label>
                    <input
                      type="text"
                      placeholder="01712-XXXXXX"
                      value={formData.phone}
                      onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Row 4: Work Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  কাজের বিবরণ (Work / Service / Maintenance Details) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="কী কাজ বা সার্ভিস করা হয়েছে বিস্তারিত লিখুন (যেমন: কম্প্রেসর মেইনটেন্যান্স, অয়েল ও ফিল্টার পরিবর্তন, ড্রায়ার লাইন চেকিং ইত্যাদি)..."
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Row 5: Financial Breakdown (Bill, Paid, Due, Method) */}
              <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 space-y-3">
                <span className="text-xs font-extrabold text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-blue-700" /> বিলিং ও পেমেন্ট হিসাব (Financials)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      মোট বিল এমাউন্ট (Bill ৳)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0.00"
                      value={formData.billAmount}
                      onChange={e => handleFinancialChange('billAmount', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-emerald-800 mb-1">
                      পেইড এমাউন্ট (Paid ৳)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0.00"
                      value={formData.paidAmount}
                      onChange={e => handleFinancialChange('paidAmount', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-mono font-bold text-emerald-800 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-rose-700 mb-1">
                      বিল ডিউ (Due ৳ - অটো হিসাব)
                    </label>
                    <input
                      type="number"
                      readOnly
                      value={formData.dueAmount}
                      className="w-full px-3 py-2 bg-rose-50 border border-rose-200 rounded-xl text-xs font-mono font-bold text-rose-800 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      পেমেন্ট মেথড (Payment Method)
                    </label>
                    <select
                      value={formData.paymentMethod}
                      onChange={e => setFormData(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                    >
                      <option value="Cash">Cash (নগদ)</option>
                      <option value="Bank Transfer">Bank Transfer (ব্যাংক ট্রান্সফার)</option>
                      <option value="bKash/Nagad">bKash / Nagad</option>
                      <option value="Cheque">Cheque (চেক)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      পেমেন্ট স্ট্যাটাস (Payment Status)
                    </label>
                    <select
                      value={formData.paymentStatus}
                      onChange={e => setFormData(prev => ({ ...prev, paymentStatus: e.target.value as any }))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                    >
                      <option value="Paid">Paid (পরিশোধিত)</option>
                      <option value="Partial">Partial (আংশিক বকেয়া)</option>
                      <option value="Due">Due (সম্পূর্ণ বকেয়া)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Row 6: Staff Expense & Field Cost */}
              <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200/80 space-y-3">
                <span className="text-xs font-extrabold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-amber-700" /> কর্মচারীর ফিল্ড খরচ (Staff Expenses / Conveyance)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-amber-800 mb-1">
                      খরচের পরিমাণ (Expense ৳)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0.00"
                      value={formData.expenseAmount}
                      onChange={e => handleFinancialChange('expenseAmount', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-mono font-bold text-amber-800 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      খরচের বিবরণ (Expense Details: যেমন- গাড়ি ভাড়া, খাবার, লোকাল পার্টস ইত্যাদি)
                    </label>
                    <input
                      type="text"
                      placeholder="সিএনজি ভাড়া, লাঞ্চ ও লোকাল পার্টস ক্রয়..."
                      value={formData.expenseDetails}
                      onChange={e => setFormData(prev => ({ ...prev, expenseDetails: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Row 7: Remarks */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  অতিরিক্ত মন্তব্য / নোট (Remarks / Notes)
                </label>
                <input
                  type="text"
                  placeholder="অন্য কোনো তথ্য বা ক্লায়েন্টের প্রতিক্রিয়া..."
                  value={formData.notes}
                  onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end items-center gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEntryModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  বাতিল (Cancel)
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-blue-600/20 cursor-pointer"
                >
                  {editingEntry ? 'সংরক্ষণ করুন (Update Record)' : 'এন্ট্রি সেভ করুন (Save Entry)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. DELETE CONFIRMATION MODAL */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 max-w-md w-full space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-slate-900 text-base">এন্ট্রিটি কি মুছে ফেলতে চান?</h3>
              <p className="text-xs text-slate-500">
                এই সার্ভিস ও বিলিং রেকর্ডটি স্থায়ীভাবে মুছে যাবে। এটি পূর্বাবস্থায় ফিরিয়ে আনা যাবে না।
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                না, রাখুন
              </button>
              <button
                onClick={async () => {
                  await onDeleteDispatch(deletingId);
                  setDeletingId(null);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
              >
                হ্যাঁ, মুছে ফেলুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. PRINTABLE SERVICE VOUCHER / RECEIPT SLIP MODAL */}
      {voucherToPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs print:bg-transparent print:p-0 no-print-backdrop">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden animate-slide-up print:max-h-none print:border-none print:shadow-none">
            {/* Modal Actions Header */}
            <div className="bg-slate-950 text-white px-4 py-3 flex justify-between items-center gap-4 flex-shrink-0 border-b border-slate-800 no-print">
              <span className="font-bold text-xs sm:text-sm flex items-center gap-2">
                <Printer className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                সার্ভিস ভাউচার / Field Service Voucher
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold uppercase rounded-md flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" /> প্রিন্ট করুন (Print)
                </button>
                <button
                  onClick={() => setVoucherToPrint(null)}
                  className="text-slate-400 hover:text-white font-bold bg-white/10 hover:bg-white/20 w-7 h-7 rounded-full flex items-center justify-center text-sm cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Voucher Paper */}
            <div className="overflow-y-auto flex-1 p-8 space-y-6 text-slate-800 bg-white print:overflow-visible print:p-0" id="printable-area">
              {/* Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                <div className="space-y-1">
                  <Logo />
                  <p className="text-[11px] font-bold text-slate-500">{settings.slogan}</p>
                  <p className="text-[10px] text-slate-500 max-w-sm">{settings.address}</p>
                  <p className="text-[10px] text-slate-500 font-mono">হটলাইন: {settings.phone1} | {settings.email}</p>
                </div>
                <div className="text-right space-y-1">
                  <span className="inline-block bg-slate-900 text-white font-extrabold text-xs px-3 py-1 rounded uppercase tracking-wider">
                    FIELD SERVICE VOUCHER
                  </span>
                  <p className="font-mono font-black text-sm text-blue-900 mt-1">
                    বিল নং: {voucherToPrint.billNo || voucherToPrint.dispatchNumber}
                  </p>
                  <p className="text-[11px] font-bold text-slate-600">
                    তারিখ: {voucherToPrint.date || voucherToPrint.dispatchDate}
                  </p>
                </div>
              </div>

              {/* Staff & Client Grid */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">কর্মচারী / টেকনিশিয়ান</span>
                  <p className="font-bold text-slate-900 text-sm">{voucherToPrint.staffName}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">কোম্পানি / ক্লায়েন্ট</span>
                  <p className="font-bold text-slate-900 text-sm">{voucherToPrint.companyName || voucherToPrint.customerCompany}</p>
                  {voucherToPrint.address && <p className="text-[11px] text-slate-500">{voucherToPrint.address}</p>}
                  {voucherToPrint.phone && <p className="text-[11px] text-slate-500 font-mono">ফোন: {voucherToPrint.phone}</p>}
                </div>
              </div>

              {/* Work Scope */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase text-slate-500 tracking-wider">কাজের বিবরণ (Work Description)</h4>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 leading-relaxed whitespace-pre-line">
                  {voucherToPrint.description || voucherToPrint.purpose || 'জেনারেল সার্ভিসিং ও টেকনিক্যাল সাপোর্ট'}
                </div>
              </div>

              {/* Financial Breakdown Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 font-bold text-slate-700 uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-4">বিবরণ</th>
                      <th className="py-2.5 px-4 text-right">টাকার পরিমাণ (BDT)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold font-mono">
                    <tr>
                      <td className="py-2.5 px-4 text-slate-800">মোট সার্ভিস বিল এমাউন্ট</td>
                      <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                        {(voucherToPrint.billAmount || 0).toLocaleString()}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 text-emerald-800 font-bold">পেইড / সংগৃহীত টাকা ({voucherToPrint.paymentMethod || 'Cash'})</td>
                      <td className="py-2.5 px-4 text-right font-bold text-emerald-800">
                        {(voucherToPrint.paidAmount || 0).toLocaleString()}
                      </td>
                    </tr>
                    <tr className="bg-rose-50/50">
                      <td className="py-2.5 px-4 text-rose-700 font-bold">অবশিষ্ট বিল বকেয়া (Due Amount)</td>
                      <td className="py-2.5 px-4 text-right font-bold text-rose-700">
                        {(voucherToPrint.dueAmount || 0).toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Expense Note if any */}
              {voucherToPrint.expenseAmount ? (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs flex justify-between items-center text-amber-900 font-medium">
                  <div>
                    <span className="font-bold">ফিল্ড খরচ (Conveyance/Expense): </span>
                    <span>{voucherToPrint.expenseDetails || 'যাতায়াত ও নাস্তা খরচ'}</span>
                  </div>
                  <span className="font-mono font-bold">{voucherToPrint.expenseAmount.toLocaleString()}</span>
                </div>
              ) : null}

              {/* Signature Blocks */}
              <div className="pt-16 grid grid-cols-2 gap-8 text-center text-xs">
                <div>
                  <div className="border-t border-slate-400 pt-1 font-bold text-slate-700">
                    ক্লায়েন্ট রিসিভিং সিল ও স্বাক্ষর
                  </div>
                  <p className="text-[10px] text-slate-400">Client Signature & Date</p>
                </div>
                <div>
                  <div className="border-t border-slate-400 pt-1 font-bold text-slate-700">
                    {voucherToPrint.staffName}
                  </div>
                  <p className="text-[10px] text-slate-400">দায়িত্বপ্রাপ্ত ইঞ্জিনিয়ার / স্টাফ</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 11. PRINTABLE COMPREHENSIVE FULL PERIOD STATEMENT MODAL */}
      {isPrintingFullReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs print:bg-transparent print:p-0 no-print-backdrop">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden animate-slide-up print:max-h-none print:border-none print:shadow-none">
            
            {/* Modal Actions Header */}
            <div className="bg-slate-950 text-white px-4 py-3 flex justify-between items-center gap-4 flex-shrink-0 border-b border-slate-800 no-print">
              <span className="font-bold text-xs sm:text-sm flex items-center gap-2">
                <Printer className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                পূর্ণাঙ্গ স্টেটমেন্ট / Full Period Statement
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold uppercase rounded-md flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" /> প্রিন্ট করুন (Print)
                </button>
                <button
                  onClick={() => setIsPrintingFullReport(false)}
                  className="text-slate-400 hover:text-white font-bold bg-white/10 hover:bg-white/20 w-7 h-7 rounded-full flex items-center justify-center text-sm cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 p-8 space-y-6 text-slate-800 bg-white print:overflow-visible print:p-0" id="printable-area">
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                <div>
                  <Logo />
                  <p className="text-[11px] font-bold text-slate-500 mt-1">{settings.slogan}</p>
                  <p className="text-[10px] text-slate-500 max-w-sm">{settings.address}</p>
                  <p className="text-[10px] text-slate-500 font-mono">ফোন: {settings.phone1} | {settings.email}</p>
                </div>
                <div className="text-right">
                  <h3 className="text-base font-black text-slate-900 uppercase">FIELD SERVICE & EXPENSE AUDIT STATEMENT</h3>
                  <p className="text-xs font-bold text-slate-600 mt-1">
                    তারিখ: {new Date().toLocaleDateString('en-GB')}
                  </p>
                  <p className="text-[11px] text-blue-900 font-bold">
                    রেকর্ড সংখ্যা: {filteredDispatches.length} টি
                  </p>
                </div>
              </div>

              {/* KPI Summary Block */}
              <div className="grid grid-cols-5 gap-2 text-center text-xs">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">মোট কাজ</span>
                  <span className="font-bold text-slate-900">{stats.totalCount} টি</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">মোট বিল</span>
                  <span className="font-bold text-slate-900">৳{stats.totalBill.toLocaleString()}</span>
                </div>
                <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase block">মোট আদায়</span>
                  <span className="font-bold text-emerald-800">৳{stats.totalPaid.toLocaleString()}</span>
                </div>
                <div className="bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                  <span className="text-[10px] font-bold text-rose-700 uppercase block">মোট ডিউ</span>
                  <span className="font-bold text-rose-700">৳{stats.totalDue.toLocaleString()}</span>
                </div>
                <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                  <span className="text-[10px] font-bold text-amber-700 uppercase block">মোট খরচ</span>
                  <span className="font-bold text-amber-800">৳{stats.totalExpense.toLocaleString()}</span>
                </div>
              </div>

              {/* Full Detailed Table */}
              <table className="w-full text-left text-[11px] border border-slate-200">
                <thead className="bg-slate-100 font-bold text-slate-700 uppercase text-[9px] border-b border-slate-200">
                  <tr>
                    <th className="p-2">তারিখ ও বিল</th>
                    <th className="p-2">কর্মচারী</th>
                    <th className="p-2">কোম্পানি ও সাইট</th>
                    <th className="p-2">কাজের বিবরণ</th>
                    <th className="p-2 text-right">বিল</th>
                    <th className="p-2 text-right">পেইড</th>
                    <th className="p-2 text-right">ডিউ</th>
                    <th className="p-2 text-right">খরচ</th>
                    <th className="p-2 text-right">নেট জমা</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold font-mono">
                  {filteredDispatches.map(item => (
                    <tr key={item.id}>
                      <td className="p-2 whitespace-nowrap">
                        <div>{item.date || item.dispatchDate}</div>
                        <span className="text-[9px] text-blue-900 font-bold">{item.billNo || item.dispatchNumber}</span>
                      </td>
                      <td className="p-2 font-sans font-bold">{item.staffName}</td>
                      <td className="p-2 font-sans">
                        <div className="font-bold">{item.companyName || item.customerCompany}</div>
                        <div className="text-[9px] text-slate-400 font-sans truncate max-w-[140px]">{item.address}</div>
                      </td>
                      <td className="p-2 font-sans text-[10px] max-w-xs">{item.description || item.purpose}</td>
                      <td className="p-2 text-right font-bold">{(item.billAmount || 0).toLocaleString()}</td>
                      <td className="p-2 text-right text-emerald-800 font-bold">{(item.paidAmount || 0).toLocaleString()}</td>
                      <td className="p-2 text-right text-rose-700 font-bold">{(item.dueAmount || 0).toLocaleString()}</td>
                      <td className="p-2 text-right text-amber-800 font-bold">{(item.expenseAmount || 0).toLocaleString()}</td>
                      <td className="p-2 text-right font-black text-blue-950">{((item.paidAmount || 0) - (item.expenseAmount || 0)).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 font-black border-t-2 border-slate-300 font-mono text-xs">
                  <tr>
                    <td colSpan={4} className="p-2 text-right font-sans uppercase">সর্বমোট (Total):</td>
                    <td className="p-2 text-right">{stats.totalBill.toLocaleString()}</td>
                    <td className="p-2 text-right text-emerald-800">{stats.totalPaid.toLocaleString()}</td>
                    <td className="p-2 text-right text-rose-700">{stats.totalDue.toLocaleString()}</td>
                    <td className="p-2 text-right text-amber-800">{stats.totalExpense.toLocaleString()}</td>
                    <td className="p-2 text-right text-blue-900">{stats.netCash.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>

              <div className="pt-16 grid grid-cols-2 gap-8 text-center text-xs">
                <div>
                  <div className="border-t border-slate-400 pt-1 font-bold text-slate-700">
                    হিসাব বিভাগ ও অডিটর স্বাক্ষর
                  </div>
                  <p className="text-[10px] text-slate-400">Accounts & Audit Department</p>
                </div>
                <div>
                  <div className="border-t border-slate-400 pt-1 font-bold text-slate-700">
                    ম্যানেজিং ডিরেক্টর / অথরাইজড সিগনেচার
                  </div>
                  <p className="text-[10px] text-slate-400">Managing Director Signature</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
