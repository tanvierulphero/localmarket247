import { Product, Customer, Document, BusinessSettings, StaffUser, PermissionKey, FieldDispatch, Supplier, Purchase, SalesReturn, Expense } from './types';

export const ALL_PERMISSIONS: { key: PermissionKey; label: string; description: string; category: string }[] = [
  { key: 'view_overview', label: 'Overview Analytics', description: 'View high-level revenue and business overview stats', category: 'General' },
  { key: 'view_inventory', label: 'View Stock Inventory', description: 'Browse spare parts and machine catalog items', category: 'Inventory' },
  { key: 'manage_inventory', label: 'Manage Stock Inventory', description: 'Add, update pricing, or remove catalog stock items', category: 'Inventory' },
  { key: 'view_purchases', label: 'View Purchase Entries', description: 'Browse stock inward and supplier purchases list', category: 'Purchases' },
  { key: 'manage_purchases', label: 'Manage Purchase Entries', description: 'Create purchase invoices, inward stock and supplier payments', category: 'Purchases' },
  { key: 'view_documents', label: 'View Documents Hub', description: 'Access offer letters, quotations, bills, and invoices list', category: 'Documents' },
  { key: 'create_documents', label: 'Create New Documents', description: 'Generate offer letters, quotes, bills, and invoices', category: 'Documents' },
  { key: 'edit_documents', label: 'Edit Existing Documents', description: 'Modify created quotations, bills, and invoices', category: 'Documents' },
  { key: 'delete_documents', label: 'Delete Documents', description: 'Permanently purge invoices or quotation records', category: 'Documents' },
  { key: 'view_due_ledger', label: 'View Due Ledger', description: 'View customer accounts receivable and due balances', category: 'Accounts' },
  { key: 'manage_due_ledger', label: 'Collect Dues / Manage Ledger', description: 'Receive customer payments and update due balances', category: 'Accounts' },
  { key: 'view_expenses', label: 'View Daily Expenses', description: 'Browse company and showroom expense records', category: 'Accounts' },
  { key: 'manage_expenses', label: 'Manage Daily Expenses', description: 'Record, edit, and categorize company expenses', category: 'Accounts' },
  { key: 'view_owner_draw', label: "View Owner's Drawings", description: "View owner's personal expenses and withdrawals", category: 'Accounts' },
  { key: 'manage_owner_draw', label: "Manage Owner's Drawings", description: "Record and manage owner's personal drawings and personal expenses", category: 'Accounts' },
  { key: 'view_field_dispatch', label: 'View Field Dispatches', description: 'Track staff products taken out and returned for service/sales', category: 'Dispatch' },
  { key: 'manage_field_dispatch', label: 'Manage Field Dispatches', description: 'Create dispatch slips, reconcile returns and generate field invoices', category: 'Dispatch' },
  { key: 'view_reports', label: 'View Business Reports', description: 'Export sales, VAT, and inventory report spreadsheets', category: 'Analytics' },
  { key: 'manage_settings', label: 'Manage Showroom Settings', description: 'Configure company branding, address, and print metadata', category: 'Admin' },
  { key: 'view_staff_management', label: 'Manage Staff Sub-Accounts', description: 'Create sub-accounts and configure role access rules', category: 'Admin' },
];

export const INITIAL_STAFF_USERS: StaffUser[] = [
  {
    id: 'staff-admin-1',
    name: 'MD MAHI UDDIN',
    email: 'mahi@hitachisolutioncenter.com',
    phone: '01715-994956',
    passcode: 'admin123',
    role: 'ADMIN',
    designation: 'Managing Director & Owner',
    status: 'Active',
    createdAt: '2026-01-01',
    permissions: ALL_PERMISSIONS.map(p => p.key)
  },
  {
    id: 'staff-mgr-1',
    name: 'Kamrul Hasan',
    email: 'kamrul@hitachisolutioncenter.com',
    phone: '01799-498199',
    passcode: 'mgr123',
    role: 'MANAGER',
    designation: 'Operations Manager',
    status: 'Active',
    createdAt: '2026-01-15',
    permissions: [
      'view_overview',
      'view_inventory',
      'manage_inventory',
      'view_documents',
      'create_documents',
      'edit_documents',
      'view_due_ledger',
      'manage_due_ledger',
      'view_reports'
    ]
  },
  {
    id: 'staff-sales-1',
    name: 'Engr. Rafiqul Islam',
    email: 'rafiq@hitachisolutioncenter.com',
    phone: '01812-334455',
    passcode: 'sales123',
    role: 'SALESMAN',
    designation: 'Senior Sales Executive',
    status: 'Active',
    createdAt: '2026-02-01',
    permissions: [
      'view_overview',
      'view_inventory',
      'view_documents',
      'create_documents',
      'view_due_ledger'
    ]
  },
  {
    id: 'staff-store-1',
    name: 'Tarikul Tanvir',
    email: 'store@hitachisolutioncenter.com',
    phone: '01911-223344',
    passcode: 'staff123',
    role: 'STAFF',
    designation: 'Store & Inventory Keeper',
    status: 'Active',
    createdAt: '2026-02-10',
    permissions: [
      'view_inventory',
      'manage_inventory',
      'view_documents'
    ]
  }
];

export const DEFAULT_SETTINGS: BusinessSettings = {
  name: "Jubayer Machineries",
  slogan: "Your Problem Solution is Sustainable Partner",
  address: "Hazi Siddik Complex, Molla Market, Bason Sharok, Gazipur City.",
  phone1: "01715-994956",
  phone2: "01799-498199",
  email: "jubayermachineries@gmail.com",
  website: "www.hitachiairsolutioncenter.com",
  invoicePrefix: "JM/INV/2026/",
  quotePrefix: "JM/QT/2026/",
  offerPrefix: "JM/OF/2026/",
  billPrefix: "JM/BILL/2026/",
  taxRate: 5, // 5% VAT
  terms: "1. Delivery: Within 7 working days upon receipt of work order.\n2. Payment: 50% advance with work order & 50% upon delivery.\n3. Warranty: 1 Year comprehensive brand warranty.\n4. Validity of this offer is 30 days.",
  signatureName: "MD MAHI UDDIN",
  signatureLabel: "Managing Director",
  logoUrl: "",
  watermarkUrl: "",
  faviconUrl: "",
  watermarkOpacity: 0.04,
  showWatermark: 1
};

export const INITIAL_PRODUCTS: Product[] = [];
export const INITIAL_CUSTOMERS: Customer[] = [];
export const INITIAL_DOCUMENTS: Document[] = [];
export const INITIAL_FIELD_DISPATCHES: FieldDispatch[] = [];
export const INITIAL_SUPPLIERS: Supplier[] = [];
export const INITIAL_PURCHASES: Purchase[] = [];
export const INITIAL_SALES_RETURNS: SalesReturn[] = [];
export const INITIAL_EXPENSES: Expense[] = [];
