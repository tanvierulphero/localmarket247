import { useState } from 'react';
import { StaffUser } from '../types';
import { 
  ArrowLeft, Eye, EyeOff, LogIn
} from 'lucide-react';
import Logo from './Logo';

interface AdminLoginProps {
  staffUsers: StaffUser[];
  onLoginSuccess: (user: StaffUser) => void;
  onBackToCatalog: () => void;
  logoUrl?: string;
  companyName?: string;
}

export default function AdminLogin({ staffUsers, onLoginSuccess, onBackToCatalog, logoUrl, companyName }: AdminLoginProps) {
  const [selectedStaffId, setSelectedStaffId] = useState<string>(() => {
    return staffUsers.length > 0 ? staffUsers[0].id : '';
  });
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [error, setError] = useState('');

  const selectedStaff = staffUsers.find(s => s.id === selectedStaffId);

  // Handle login submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const inputPass = passcode.trim();

    if (!inputPass) {
      setError('Please enter password.');
      return;
    }

    if (!selectedStaffId) {
      setError('Please select user account.');
      return;
    }

    const staff = staffUsers.find(s => s.id === selectedStaffId);
    if (!staff) {
      setError('Account not found.');
      return;
    }

    if (staff.status === 'Inactive') {
      setError('Account deactivated.');
      return;
    }

    if (staff.passcode !== inputPass) {
      setError(`Incorrect password for "${staff.name}".`);
      return;
    }

    onLoginSuccess(staff);
  };

  const handleQuickSelect = (staff: StaffUser) => {
    setSelectedStaffId(staff.id);
    setPasscode('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-100/80 flex flex-col justify-center items-center p-3 sm:p-4 relative">
      {/* Top back button */}
      <div className="w-full max-w-sm mb-2 flex items-center justify-between">
        <button
          onClick={onBackToCatalog}
          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Public Catalog
        </button>
      </div>

      {/* Compact Login Box */}
      <div className="max-w-sm w-full bg-white rounded-2xl shadow-lg border border-slate-200 p-4 sm:p-5 space-y-3.5 relative overflow-hidden">
        {/* Subtle color bar on top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-blue-900"></div>

        {/* Brand Header */}
        <div className="text-center space-y-0.5">
          {logoUrl && (
            <div className="h-9 w-auto flex justify-center mb-1">
              <Logo logoUrl={logoUrl} className="h-full w-auto text-blue-900" alt={companyName || "Logo"} />
            </div>
          )}
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-900 block font-display">
            {companyName || 'Jubayer Machineries'}
          </span>
          <h2 className="text-base sm:text-lg font-black font-display text-slate-900 leading-tight">
            Workspace Login
          </h2>
        </div>

        {/* Quick Staff Account Selector Pills */}
        {staffUsers.length > 0 && (
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
              Quick Select User:
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {staffUsers.slice(0, 4).map((staff) => (
                <button
                  key={staff.id}
                  type="button"
                  onClick={() => handleQuickSelect(staff)}
                  className={`px-2.5 py-1.5 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between gap-1 ${
                    selectedStaffId === staff.id
                      ? 'bg-blue-900 text-white border-blue-900 shadow-2xs'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <span className="font-extrabold text-[11px] truncate leading-none">{staff.name}</span>
                  <span className={`text-[8px] font-black uppercase px-1 py-0.5 rounded ${
                    selectedStaffId === staff.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {staff.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-2.5 text-xs" autoComplete="off">
          {/* Sub-Account Selector Dropdown */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[11px]">
              <label className="font-bold text-slate-700">Account</label>
              {selectedStaff && (
                <span className="text-[9px] text-blue-900 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 font-bold">
                  {selectedStaff.role}
                </span>
              )}
            </div>
            <select
              value={selectedStaffId}
              onChange={(e) => { setSelectedStaffId(e.target.value); setPasscode(''); setError(''); }}
              className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-900 rounded-lg px-2.5 py-2 text-slate-900 font-bold text-xs outline-none"
              required
            >
              <option value="" disabled>Select User Account</option>
              {staffUsers.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.name} — {staff.designation || staff.role}
                </option>
              ))}
            </select>
          </div>

          {/* Passcode Field */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 text-[11px] block">
              {selectedStaff ? `Password for ${selectedStaff.name}` : 'Password'}
            </label>
            <div className="relative">
              <input
                type={showPasscode ? 'text' : 'password'}
                value={passcode}
                onChange={(e) => { setPasscode(e.target.value); setError(''); }}
                placeholder="Enter password"
                autoComplete="new-password"
                className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:border-blue-900 rounded-lg text-slate-900 font-mono font-bold text-xs transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPasscode(!showPasscode)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPasscode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 p-2 rounded-lg text-center animate-shake">
              {error}
            </p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-lg transition-all shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Login Workspace</span>
          </button>
        </form>

        {/* Developer Info & Copyright */}
        <div className="pt-2 border-t border-slate-100 text-center space-y-0.5 text-[10px] text-slate-500 font-medium">
          <p>
            Developed by <strong className="text-slate-800 font-bold">Md. Tanvirul Islam (Tech Item)</strong> &bull;{' '}
            <a
              href="https://wa.me/8801840684615"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-700 hover:text-blue-900 font-bold underline"
            >
              01840684615
            </a>
          </p>
          <p className="text-[9px] text-slate-400">
            &copy; 2026 Jubayer Machineries &bull; All Rights Reserved
          </p>
        </div>
      </div>
    </div>
  );
}
