import { useState } from 'react';
import { StaffUser, UserRole, PermissionKey } from '../types';
import { ALL_PERMISSIONS } from '../initialData';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  ShieldAlert, 
  Key, 
  Check, 
  X, 
  Edit3, 
  Trash2, 
  Search, 
  Lock, 
  Info, 
  Building, 
  UserCheck, 
  CheckCircle2, 
  Sliders
} from 'lucide-react';

interface StaffManagementProps {
  staffUsers: StaffUser[];
  currentUser: StaffUser | null;
  onAddStaff: (staff: StaffUser) => void;
  onUpdateStaff: (staff: StaffUser) => void;
  onDeleteStaff: (id: string) => void;
}

export default function StaffManagement({
  staffUsers,
  currentUser,
  onAddStaff,
  onUpdateStaff,
  onDeleteStaff
}: StaffManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffUser | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    phone: string;
    passcode: string;
    role: UserRole;
    designation: string;
    status: 'Active' | 'Inactive';
    permissions: PermissionKey[];
  }>({
    name: '',
    email: '',
    phone: '',
    passcode: '',
    role: 'SALESMAN',
    designation: '',
    status: 'Active',
    permissions: [
      'view_overview',
      'view_inventory',
      'view_documents',
      'create_documents',
      'view_due_ledger'
    ]
  });

  // Helper: Open Modal for New Staff
  const handleOpenNewModal = () => {
    setEditingStaff(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      passcode: Math.floor(100000 + Math.random() * 900000).toString(), // random 6 digit passcode default
      role: 'SALESMAN',
      designation: 'Sales Representative',
      status: 'Active',
      permissions: [
        'view_overview',
        'view_inventory',
        'view_documents',
        'create_documents',
        'view_due_ledger'
      ]
    });
    setIsModalOpen(true);
  };

  // Helper: Open Modal for Editing
  const handleOpenEditModal = (staff: StaffUser) => {
    setEditingStaff(staff);
    setFormData({
      name: staff.name,
      email: staff.email,
      phone: staff.phone,
      passcode: staff.passcode,
      role: staff.role,
      designation: staff.designation,
      status: staff.status,
      permissions: [...staff.permissions]
    });
    setIsModalOpen(true);
  };

  // Preset Role Rules Applicator
  const applyRolePreset = (role: UserRole) => {
    let presetPerms: PermissionKey[] = [];
    let defaultDesignation = '';

    if (role === 'ADMIN') {
      presetPerms = ALL_PERMISSIONS.map(p => p.key);
      defaultDesignation = 'System Administrator / Director';
    } else if (role === 'MANAGER') {
      presetPerms = [
        'view_overview',
        'view_inventory',
        'manage_inventory',
        'view_documents',
        'create_documents',
        'edit_documents',
        'view_due_ledger',
        'manage_due_ledger',
        'view_reports'
      ];
      defaultDesignation = 'Branch / Operations Manager';
    } else if (role === 'SALESMAN') {
      presetPerms = [
        'view_overview',
        'view_inventory',
        'view_documents',
        'create_documents',
        'view_due_ledger'
      ];
      defaultDesignation = 'Sales Executive';
    } else if (role === 'STAFF') {
      presetPerms = [
        'view_inventory',
        'manage_inventory',
        'view_documents'
      ];
      defaultDesignation = 'Store / Warehouse Staff';
    }

    setFormData(prev => ({
      ...prev,
      role,
      designation: defaultDesignation || prev.designation,
      permissions: presetPerms
    }));
  };

  // Toggle permission checkbox
  const togglePermission = (key: PermissionKey) => {
    setFormData(prev => {
      const exists = prev.permissions.includes(key);
      const updated = exists 
        ? prev.permissions.filter(k => k !== key)
        : [...prev.permissions, key];
      return {
        ...prev,
        role: 'CUSTOM', // set to custom when modified
        permissions: updated
      };
    });
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.passcode.trim()) return;

    if (editingStaff) {
      const updated: StaffUser = {
        ...editingStaff,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        passcode: formData.passcode,
        role: formData.role,
        designation: formData.designation,
        status: formData.status,
        permissions: formData.permissions
      };
      onUpdateStaff(updated);
    } else {
      const newStaff: StaffUser = {
        id: `staff-${Date.now()}`,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        passcode: formData.passcode,
        role: formData.role,
        designation: formData.designation || 'Staff Member',
        status: formData.status,
        permissions: formData.permissions,
        createdAt: new Date().toISOString().split('T')[0]
      };
      onAddStaff(newStaff);
    }

    setIsModalOpen(false);
  };

  // Filter staff list
  const filteredStaff = staffUsers.filter(user => {
    const term = searchQuery.toLowerCase();
    const matchesSearch = (
      user.name.toLowerCase().includes(term) ||
      user.designation.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      user.phone.includes(term)
    );
    const matchesRole = filterRole === 'All' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  // Group permissions by category for checkbox display
  const permissionCategories = Array.from(new Set(ALL_PERMISSIONS.map(p => p.category)));

  return (
    <div className="space-y-6 text-xs">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 border border-slate-200 rounded-2xl shadow-2xs">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-900 border border-blue-100 font-bold px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
            Sub-Account & Role Access Rules
          </div>
          <h2 className="text-xl font-black font-display text-slate-900 tracking-tight">Staff Sub-Accounts Management</h2>
          <p className="text-slate-500 mt-1">Create sub-accounts for Managers, Salesmen, and Staffs. Configure granular permission rules for each role.</p>
        </div>

        <button
          onClick={handleOpenNewModal}
          className="px-4 py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-bold uppercase tracking-wider text-xs rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          Create Sub-Account
        </button>
      </div>

      {/* Summary KPI Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 text-blue-900 rounded-lg flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Accounts</span>
            <span className="text-lg font-black text-slate-900 font-display">{staffUsers.length}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-700 rounded-lg flex items-center justify-center font-bold">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Managers</span>
            <span className="text-lg font-black text-slate-900 font-display">
              {staffUsers.filter(s => s.role === 'MANAGER').length}
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-700 rounded-lg flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Sales Team</span>
            <span className="text-lg font-black text-slate-900 font-display">
              {staffUsers.filter(s => s.role === 'SALESMAN').length}
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-50 text-amber-700 rounded-lg flex items-center justify-center font-bold">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Active Sub-Accounts</span>
            <span className="text-lg font-black text-emerald-600 font-display">
              {staffUsers.filter(s => s.status === 'Active').length} Active
            </span>
          </div>
        </div>
      </div>

      {/* Toolbar Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 border border-slate-200 rounded-xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, or designation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-xs focus:bg-white focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <span className="text-[10px] uppercase font-bold text-slate-400">Filter Role:</span>
          {['All', 'ADMIN', 'MANAGER', 'SALESMAN', 'STAFF'].map((r) => (
            <button
              key={r}
              onClick={() => setFilterRole(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterRole === r 
                  ? 'bg-blue-900 text-white shadow-3xs' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {r === 'All' ? 'All Roles' : r}
            </button>
          ))}
        </div>
      </div>

      {/* Staff Accounts Directory Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white uppercase tracking-wider text-[10px] font-bold border-b border-slate-950">
                <th className="py-3.5 px-5">Staff Name & Designation</th>
                <th className="py-3.5 px-4">Role Badge</th>
                <th className="py-3.5 px-4">Passcode</th>
                <th className="py-3.5 px-4">Contact info</th>
                <th className="py-3.5 px-4 text-center">Permissions Count</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredStaff.length > 0 ? (
                filteredStaff.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-5">
                      <span className="font-bold text-slate-900 block text-sm">{staff.name}</span>
                      <span className="text-[11px] text-slate-400 font-semibold">{staff.designation}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        staff.role === 'ADMIN'
                          ? 'bg-purple-50 text-purple-800 border-purple-200'
                          : staff.role === 'MANAGER'
                          ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                          : staff.role === 'SALESMAN'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : staff.role === 'STAFF'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-slate-100 text-slate-800 border-slate-200'
                      }`}>
                        {staff.role}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-md border border-slate-200 text-xs">
                        {staff.passcode}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-xs">
                      <span className="block font-semibold text-slate-800">{staff.phone}</span>
                      <span className="block text-[10px] text-slate-400 font-mono">{staff.email}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="font-bold text-blue-900 bg-blue-50 px-2.5 py-1 rounded-full text-[11px] border border-blue-100">
                        {staff.permissions.length} / {ALL_PERMISSIONS.length} Allowed
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => onUpdateStaff({ ...staff, status: staff.status === 'Active' ? 'Inactive' : 'Active' })}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border cursor-pointer ${
                          staff.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                        title="Click to toggle account access"
                      >
                        {staff.status}
                      </button>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEditModal(staff)}
                          className="p-1.5 text-blue-900 hover:text-blue-950 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Sub-Account & Permissions"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {currentUser?.role === 'ADMIN' && staff.id !== currentUser?.id && (
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete sub-account for ${staff.name}?`)) {
                                onDeleteStaff(staff.id);
                              }
                            }}
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Sub-Account (Admin Only)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No staff sub-accounts match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ROLE PERMISSION MATRIX REFERENCE GUIDE */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xs">
        <div>
          <h3 className="font-extrabold text-sm text-slate-900 font-display flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-900" />
            Standard Role Access Rules Matrix
          </h3>
          <p className="text-slate-500 text-xs mt-0.5">Overview of standard predefined system access rules for each role.</p>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <th className="p-3">Module / Permission Feature</th>
                <th className="p-3 text-center">Admin</th>
                <th className="p-3 text-center">Manager</th>
                <th className="p-3 text-center">Salesman</th>
                <th className="p-3 text-center">Staff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {ALL_PERMISSIONS.map((perm) => (
                <tr key={perm.key} className="hover:bg-slate-50">
                  <td className="p-3">
                    <span className="font-bold text-slate-900 block">{perm.label}</span>
                    <span className="text-[10px] text-slate-400">{perm.description}</span>
                  </td>
                  <td className="p-3 text-center">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 mx-auto" />
                  </td>
                  <td className="p-3 text-center">
                    {[
                      'view_overview', 'view_inventory', 'manage_inventory', 
                      'view_documents', 'create_documents', 'edit_documents', 
                      'view_due_ledger', 'manage_due_ledger', 'view_reports'
                    ].includes(perm.key) ? (
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 mx-auto" />
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {[
                      'view_overview', 'view_inventory', 'view_documents', 
                      'create_documents', 'view_due_ledger'
                    ].includes(perm.key) ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 mx-auto" />
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {[
                      'view_inventory', 'manage_inventory', 'view_documents'
                    ].includes(perm.key) ? (
                      <CheckCircle2 className="w-4 h-4 text-amber-600 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT SUB-ACCOUNT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[85vh] sm:max-h-[88vh] flex flex-col overflow-hidden my-auto">
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest block mb-0.5">
                  Sub-Account Configuration
                </span>
                <h3 className="font-bold font-display text-base leading-none">
                  {editingStaff ? `Edit Sub-Account: ${editingStaff.name}` : 'Create New Sub-Account'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-300 hover:text-white font-bold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Row 1: Name & Designation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Full Name <span className="text-rose-600">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Engr. Tanvir Ahmed"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-semibold focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Designation / Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Sales Executive"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-semibold focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Row 2: Role Selection & Presets */}
              <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <label className="font-bold text-slate-800 block uppercase tracking-wider text-[10px]">
                  Select Staff Role Preset
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['ADMIN', 'MANAGER', 'SALESMAN', 'STAFF'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => applyRolePreset(r)}
                      className={`p-2.5 rounded-lg text-center font-bold text-xs uppercase tracking-wider border transition-all cursor-pointer ${
                        formData.role === r
                          ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500">
                  Selecting a role automatically applies standard predefined permission rules below. You can also customize individual checkboxes.
                </p>
              </div>

              {/* Row 3: Passcode, Phone, Email */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">
                    Login Passcode <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 123456"
                    value={formData.passcode}
                    onChange={(e) => setFormData({ ...formData, passcode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono font-bold text-blue-900 focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="01700-000000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-semibold focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Email Address</label>
                  <input
                    type="email"
                    placeholder="staff@hitachiairsolutioncenter.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-semibold focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Row 4: Granular Permission Checkboxes */}
              <div className="space-y-3 border-t border-slate-200 pt-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs font-display">Granular Feature Permissions</h4>
                    <p className="text-[10px] text-slate-500">Configure exact screen and action access for this sub-account.</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'CUSTOM', permissions: ALL_PERMISSIONS.map(p => p.key) })}
                      className="text-[10px] font-bold text-blue-900 hover:underline cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'CUSTOM', permissions: [] })}
                      className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {permissionCategories.map((category) => {
                    const categoryPerms = ALL_PERMISSIONS.filter(p => {
                      if (p.category !== category) return false;
                      if ((p.key === 'view_owner_draw' || p.key === 'manage_owner_draw') && formData.role !== 'ADMIN') return false;
                      return true;
                    });
                    if (categoryPerms.length === 0) return null;
                    return (
                      <div key={category} className="border border-slate-200 rounded-xl p-3.5 space-y-2 bg-slate-50/50">
                        <span className="text-[10px] font-black uppercase text-blue-900 tracking-wider block">
                          {category} Permissions
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {categoryPerms.map((perm) => {
                            const checked = formData.permissions.includes(perm.key);
                            return (
                              <label 
                                key={perm.key} 
                                className={`flex items-start gap-2.5 p-2 rounded-lg border cursor-pointer transition-all ${
                                  checked 
                                    ? 'bg-blue-50/80 border-blue-200 text-blue-950 font-bold' 
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => togglePermission(perm.key)}
                                  className="mt-0.5 rounded-sm border-slate-300 text-blue-900 focus:ring-blue-900"
                                />
                                <div>
                                  <span className="block text-xs leading-tight">{perm.label}</span>
                                  <span className="block text-[9px] text-slate-400 font-normal mt-0.5">{perm.description}</span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold uppercase rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-900 hover:bg-blue-950 text-white font-bold uppercase rounded-xl transition-colors cursor-pointer shadow-xs"
                >
                  {editingStaff ? 'Save Sub-Account Changes' : 'Create Staff Sub-Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
