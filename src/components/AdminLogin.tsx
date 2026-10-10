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
  const [selectedStaffId, setSelectedStaffId] = useState<string>(() => {
    return staffUsers.length > 0 ? staffUsers[0].id : '';
  });
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [error, setError] = useState('');

  const selectedStaff = staffUsers.find(s => s.id === selectedStaffId);

  // Handle direct passcode or account selection submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const inputPass = passcode.trim();

    if (!inputPass) {
      setError('অনুগ্রহ করে আপনার পাসওয়ার্ড দিন। (Please enter your password)');
      return;
    }

    if (!selectedStaffId) {
      setError('অনুগ্রহ করে প্রথমে আপনার ইউজার অ্যাকাউন্ট নির্বাচন করুন। (Please select your user account)');
      return;
    }

    const staff = staffUsers.find(s => s.id === selectedStaffId);
    if (!staff) {
      setError('নির্বাচিত অ্যাকাউন্ট পাওয়া যায়নি। (Selected account not found)');
      return;
    }

    if (staff.status === 'Inactive') {
      setError('এই অ্যাকাউন্টটি নিষ্ক্রিয় করা হয়েছে। (This account has been deactivated)');
      return;
    }

    // Strict individual password check: each user can only log in with their own password
    if (staff.passcode !== inputPass) {
      setError(`ভুল পাসওয়ার্ড! "${staff.name}" শুধুমাত্র তার নিজস্ব পাসওয়ার্ড দিয়েই লগইন করতে পারবেন। অন্য কারো পাসওয়ার্ড দিয়ে লগইন হবে না।`);
      return;
    }

    onLoginSuccess(staff);
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
            <label className="font-bold text-slate-700 flex items-center justify-between">
              <span>Select Your User Account (ইউজার অ্যাকাউন্ট) <span className="text-rose-600">*</span></span>
              {selectedStaff && (
                <span className="text-[10px] text-blue-900 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 font-bold">
                  {selectedStaff.role}
                </span>
              )}
            </label>
            <select
              value={selectedStaffId}
              onChange={(e) => { setSelectedStaffId(e.target.value); setPasscode(''); setError(''); }}
              className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl p-3 text-slate-900 font-bold"
              required
            >
              <option value="" disabled>-- আপনার ইউজার অ্যাকাউন্ট নির্বাচন করুন (Select User) --</option>
              {staffUsers.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.name} — {staff.designation || staff.role}
                </option>
              ))}
            </select>
          </div>

          {/* Passcode Field */}
          <div className="space-y-1.5 relative">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 block">
                {selectedStaff ? `Enter Password for: ${selectedStaff.name}` : 'Enter Your Password'}
              </label>
              {selectedStaff && (
                <span className="text-[10px] text-slate-500 font-medium">
                  {selectedStaff.designation || selectedStaff.role}
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type={showPasscode ? 'text' : 'password'}
                value={passcode}
                onChange={(e) => { setPasscode(e.target.value); setError(''); }}
                placeholder={selectedStaff ? `${selectedStaff.name}-এর পাসওয়ার্ড লিখুন` : "Enter your password"}
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
            <p className="text-[10px] text-slate-500 font-medium pt-0.5">
              🔒 প্রতিটি ইউজার শুধুমাত্র তার নিজস্ব পাসওয়ার্ড দিয়েই লগইন করতে পারবেন।
            </p>
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
      </div>

      {/* Footer Info at the Very Bottom */}
      <div className="text-center text-xs text-slate-500 font-medium py-4">
        <div className="text-[10px] text-slate-400 font-medium">
          &copy; 2026 Jubayer Machineries &bull; All Rights Reserved
        </div>
      </div>
    </div>
  );
}
