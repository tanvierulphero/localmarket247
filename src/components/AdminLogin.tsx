import { useState } from 'react';
import { StaffUser } from '../types';
import { 
  Lock, ArrowLeft, Eye, EyeOff, ShieldAlert, UserCheck, ShieldCheck, Key,
  Phone, MessageCircle, Code2, Sparkles, Copy, Check, ExternalLink, Globe
} from 'lucide-react';
import Logo from './Logo';

interface AdminLoginProps {
  staffUsers: StaffUser[];
  onLoginSuccess: (user: StaffUser) => void;
  onBackToCatalog: () => void;
}

export default function AdminLogin({ staffUsers, onLoginSuccess, onBackToCatalog }: AdminLoginProps) {
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [error, setError] = useState('');
  const [copiedPhone, setCopiedPhone] = useState(false);

  const handleCopyPhone = () => {
    try {
      navigator.clipboard.writeText('01840684615');
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    } catch {
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    }
  };

  // Handle direct passcode or account selection submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const inputPass = passcode.trim();

    // 1. If specific staff account selected
    if (selectedStaffId) {
      const staff = staffUsers.find(s => s.id === selectedStaffId);
      if (staff) {
        if (staff.status === 'Inactive') {
          setError('This sub-account has been deactivated by the administrator.');
          return;
        }
        if (staff.passcode === inputPass || inputPass === 'admin123') {
          onLoginSuccess(staff);
          return;
        } else {
          setError(`Incorrect passcode for ${staff.name}. Please try again.`);
          return;
        }
      }
    }

    // 2. Otherwise search by passcode across active staff accounts
    const matchedStaff = staffUsers.find(s => s.passcode === inputPass && s.status === 'Active');
    if (matchedStaff) {
      onLoginSuccess(matchedStaff);
      return;
    }

    // 3. Fallback super admin master passcode 'admin123' or 'admin'
    if (inputPass === 'admin123' || inputPass.toLowerCase() === 'admin') {
      const superAdmin = staffUsers.find(s => s.role === 'ADMIN') || {
        id: 'staff-admin-master',
        name: 'MD MAHI UDDIN',
        email: 'mahi@hitachisolutioncenter.com',
        phone: '01715-994956',
        passcode: 'admin123',
        role: 'ADMIN',
        designation: 'Managing Director & Owner',
        status: 'Active',
        createdAt: '2026-01-01',
        permissions: [
          'view_overview', 'view_inventory', 'manage_inventory', 
          'view_documents', 'create_documents', 'edit_documents', 
          'delete_documents', 'view_reports', 'view_due_ledger', 
          'manage_due_ledger', 'view_staff_management', 'manage_settings'
        ]
      };
      onLoginSuccess(superAdmin as StaffUser);
      return;
    }

    setError('Invalid passcode. Please enter a valid Admin or Staff passcode.');
  };

  // Quick select sub-account (leaves passcode empty for user to type manually)
  const handleQuickSelect = (staff: StaffUser) => {
    setSelectedStaffId(staff.id);
    setPasscode('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 md:p-8">
      {/* Back link */}
      <div>
        <button
          onClick={onBackToCatalog}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Public Catalog
        </button>
      </div>

      {/* Login Box */}
      <div className="max-w-md w-full mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 p-8 space-y-6 md:p-10 relative overflow-hidden">
        {/* Subtle decorative color line on top */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-900"></div>

        {/* Brand identity header */}
        <div className="text-center space-y-1">
          <div className="h-14 w-auto flex justify-center mb-2">
            <Logo className="h-full w-auto text-blue-900" />
          </div>
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-blue-900 block font-display">
            Jubayer Machineries
          </span>
          <h2 className="text-xl font-black font-display text-slate-900 leading-tight">
            Workspace Login
          </h2>
        </div>

        {/* Quick Staff Account Selector Pills */}
        {staffUsers.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Quick Select Sub-Account:
            </label>
            <div className="grid grid-cols-2 gap-2 text-left">
              {staffUsers.slice(0, 4).map((staff) => (
                <button
                  key={staff.id}
                  type="button"
                  onClick={() => handleQuickSelect(staff)}
                  className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedStaffId === staff.id
                      ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <span className="font-bold text-xs block truncate leading-tight">{staff.name}</span>
                  <div className="flex justify-between items-center mt-1">
                    <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md ${
                      selectedStaffId === staff.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {staff.role}
                    </span>
                    <span className="text-[9px] text-slate-400 font-medium">Click to select</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs" autoComplete="off">
          {/* Sub-Account Selector Dropdown */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 block">Select Sub-Account (Optional)</label>
            <select
              value={selectedStaffId}
              onChange={(e) => { setSelectedStaffId(e.target.value); setPasscode(''); setError(''); }}
              className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl p-3 text-slate-900 font-semibold"
            >
              <option value="">&mdash; Any Active Account / Master Admin &mdash;</option>
              {staffUsers.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.name} ({staff.designation || staff.role})
                </option>
              ))}
            </select>
          </div>

          {/* Passcode Field */}
          <div className="space-y-1.5 relative">
            <label className="font-bold text-slate-700 block">Enter Account Passcode</label>
            <div className="relative">
              <input
                type={showPasscode ? 'text' : 'password'}
                value={passcode}
                onChange={(e) => { setPasscode(e.target.value); setError(''); }}
                placeholder="Enter passcode"
                autoComplete="new-password"
                className="w-full pl-3.5 pr-10 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden focus:border-blue-900 rounded-xl text-slate-900 font-mono font-bold tracking-wide transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPasscode(!showPasscode)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-xl text-center animate-shake">
              {error}
            </p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all hover:scale-[1.01] shadow-xs cursor-pointer"
          >
            Authenticate & Open Workspace
          </button>
        </form>

        {/* DEVELOPER PROFILE SHOWCASE CARD - Tech Item & Md. Tanvirul Islam */}
        <div className="border-t border-slate-200/90 -mx-8 -mb-8 mt-6 bg-gradient-to-b from-slate-900 via-blue-950 to-slate-950 rounded-b-2xl p-5 text-white shadow-inner">
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-400 p-0.5 shadow-md flex items-center justify-center font-black text-white text-xs tracking-wider font-display">
                  TI
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full" title="Available for projects"></span>
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-extrabold text-blue-300 uppercase tracking-widest">
                    Crafted by Tech Item
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.2 text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                    Available
                  </span>
                </div>
                <h4 className="text-sm font-extrabold text-white leading-tight flex items-center gap-1">
                  Md. Tanvirul Islam
                </h4>
                <p className="text-[10px] text-slate-300 font-medium">
                  Full-Stack ERP & Web Application Engineer
                </p>
              </div>
            </div>
          </div>

          {/* Client Attraction Pitch & Value Proposition */}
          <div className="pt-3 pb-2 text-left space-y-1.5">
            <p className="text-[11px] text-slate-200 leading-relaxed font-medium">
              Need a custom <span className="text-blue-300 font-bold">Business ERP, Inventory & Due Ledger, Billing Software or Website</span> like this for your company?
            </p>
            <div className="flex flex-wrap gap-1.5 text-[9px] font-semibold text-slate-300">
              <span className="bg-white/10 px-2 py-0.5 rounded-md border border-white/10">⚡ Custom Business ERP</span>
              <span className="bg-white/10 px-2 py-0.5 rounded-md border border-white/10">📊 Invoicing & Ledger</span>
              <span className="bg-white/10 px-2 py-0.5 rounded-md border border-white/10">📱 Cloud & Mobile Ready</span>
            </div>
          </div>

          {/* Direct Contact CTAs for Clients */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            {/* Direct Phone Call Button */}
            <a
              href="tel:01840684615"
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white rounded-xl text-xs font-bold transition-all shadow-xs group cursor-pointer"
              title="Call Md. Tanvirul Islam directly"
            >
              <Phone className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
              <span>01840684615</span>
            </a>

            {/* Direct WhatsApp Contact Button */}
            <a
              href="https://wa.me/8801840684615?text=Hello%20Md.%20Tanvirul%20Islam%20(Tech%20Item),%20I%20saw%20the%20Jubayer%20Machineries%20system%20and%20would%20like%20to%20develop%20a%20similar%20custom%20software%20/%20website%20for%20my%20business."
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Chat on WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
          </div>

          {/* Quick copy phone option */}
          <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Hire Developer for Your Business
            </span>
            <button
              type="button"
              onClick={handleCopyPhone}
              className="inline-flex items-center gap-1 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              {copiedPhone ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-300 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy Number</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="text-center text-[10px] text-slate-400 font-semibold tracking-wider pt-6">
        &copy; 2026 Jubayer Machineries &bull; Powered by Tech Item
      </div>
    </div>
  );
}
