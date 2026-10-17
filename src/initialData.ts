import { Product, CatalogProduct, Customer, Document, BusinessSettings, StaffUser, PermissionKey, FieldDispatch, Supplier, Purchase, SalesReturn, Expense } from './types';

export const ALL_PERMISSIONS: { key: PermissionKey; label: string; description: string; category: string }[] = [
  { key: 'view_overview', label: 'Overview Analytics', description: 'View high-level revenue and business overview stats', category: 'General' },
  { key: 'manage_public_catalog', label: 'Manage Public Catalog', description: 'Add, edit and manage custom showcase products & social media contact links', category: 'Showcase' },
  { key: 'view_inventory', label: 'View Stock Inventory', description: 'Browse spare parts and machine catalog items', category: 'Inventory' },
  { key: 'manage_inventory', label: 'Manage Stock Inventory', description: 'Add, update pricing, or remove catalog stock items', category: 'Inventory' },
  { key: 'view_purchases', label: 'View Purchase Entries', description: 'Browse stock inward and supplier purchases list', category: 'Purchases' },
  { key: 'manage_purchases', label: 'Manage Purchase Entries', description: 'Create purchase invoices, inward stock and supplier payments', category: 'Purchases' },
  { key: 'view_customers', label: 'View Customer Directory', description: 'Browse customer list, contact details, and balance status', category: 'Customers' },
  { key: 'manage_customers', label: 'Manage Customers', description: 'Add new clients, edit contact profiles, or remove customer records', category: 'Customers' },
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
    email: 'mahi@hitachiairsolutioncenter.com',
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
    email: 'kamrul@hitachiairsolutioncenter.com',
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
      'view_customers',
      'manage_customers',
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
    email: 'rafiq@hitachiairsolutioncenter.com',
    phone: '01812-334455',
    passcode: 'sales123',
    role: 'SALESMAN',
    designation: 'Senior Sales Executive',
    status: 'Active',
    createdAt: '2026-02-01',
    permissions: [
      'view_overview',
      'view_inventory',
      'view_customers',
      'manage_customers',
      'view_documents',
      'create_documents',
      'view_due_ledger'
    ]
  },
  {
    id: 'staff-store-1',
    name: 'Tarikul Tanvir',
    email: 'store@hitachiairsolutioncenter.com',
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
  publicLogoUrl: "",
  watermarkUrl: "",
  faviconUrl: "",
  challanPrefix: "JM/CH/2026/",
  watermarkOpacity: 0.04,
  showWatermark: 1,
  whatsapp: "01715-994956",
  messengerUrl: "https://m.me/hitachiairsolutioncenter",
  facebookUrl: "https://www.facebook.com/hitachiairsolutioncenter",
  telegramUrl: "https://t.me/hitachiairsolution"
};

export const INITIAL_PRODUCTS: Product[] = [];
export const INITIAL_CUSTOMERS: Customer[] = [];
export const INITIAL_DOCUMENTS: Document[] = [];
export const INITIAL_FIELD_DISPATCHES: FieldDispatch[] = [];
export const INITIAL_SUPPLIERS: Supplier[] = [];
export const INITIAL_PURCHASES: Purchase[] = [];
export const INITIAL_SALES_RETURNS: SalesReturn[] = [];
export const INITIAL_EXPENSES: Expense[] = [];

// Initial Custom Showcase Catalog Products (Exclusively for the Public Showcase Site - zero connection to inventory)
// Initial Custom Showcase Catalog Products (Exclusively for the Public Showcase Site - zero connection to inventory)
export const INITIAL_CATALOG_PRODUCTS: CatalogProduct[] = [
  {
    id: 'cat-hitachi-osp-22',
    name: 'Hitachi OSP-22M5ARN 22kW (30HP) Rotary Screw Air Compressor',
    category: 'Screw Air Compressor',
    brand: 'Hitachi',
    price: 1250000,
    callForPrice: true,
    badge: 'Best Seller',
    description: 'High-performance oil-flooded rotary screw air compressor engineered for 24/7 continuous industrial production with low noise, superior energy efficiency, and intelligent digital microprocessor monitoring.',
    specs: [
      { label: 'Motor Power', value: '22 kW (30 HP)' },
      { label: 'Working Pressure', value: '7.5 ~ 8.5 Bar (0.75 ~ 0.85 MPa)' },
      { label: 'Air Delivery (FAD)', value: '3.7 m³/min' },
      { label: 'Cooling Method', value: 'High Efficiency Air Cooled' },
      { label: 'Drive Mechanism', value: 'Direct Gear / High-Precision Rotor' },
      { label: 'Warranty', value: '2 Years Comprehensive Warranty' }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    displayOrder: 1,
    createdAt: '2026-01-01'
  },
  {
    id: 'cat-hitachi-osp-37-vsd',
    name: 'Hitachi OSP-37V5ARN Variable Speed (VSD) Inverter Screw Compressor',
    category: 'Screw Air Compressor',
    brand: 'Hitachi',
    price: 1850000,
    callForPrice: true,
    badge: 'Energy Saver (VSD)',
    description: 'Hitachi Next Series VSD inverter rotary screw air compressor. Saves up to 35% electrical power by dynamically matching motor speed to actual factory compressed air demand.',
    specs: [
      { label: 'Motor Power', value: '37 kW (50 HP) Inverter Driven' },
      { label: 'Working Pressure', value: '7.0 ~ 10.0 Bar Adjustable' },
      { label: 'Air Delivery (FAD)', value: '1.5 ~ 6.5 m³/min Variable' },
      { label: 'Power Savings', value: 'Up to 35% energy reduction' },
      { label: 'Controller', value: 'Hitachi Smart Touch Digital Panel' }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    displayOrder: 2,
    createdAt: '2026-01-05'
  },
  {
    id: 'cat-hitachi-hd-30-dryer',
    name: 'Hitachi Heavy-Duty Refrigerated Air Dryer (HD-30 Series)',
    category: 'Air Dryer',
    brand: 'Hitachi',
    price: 260000,
    callForPrice: true,
    badge: 'Featured',
    description: 'Industrial refrigerated compressed air dryer engineered to eliminate moisture, condensate, and water droplets from compressed air lines to safeguard factory machinery and pneumatic tools.',
    specs: [
      { label: 'Flow Capacity', value: '4.5 m³/min' },
      { label: 'Pressure Dew Point', value: '3°C ~ 10°C (37°F ~ 50°F)' },
      { label: 'Refrigerant', value: 'Eco-Friendly R410A / R134a' },
      { label: 'Max Inlet Temp', value: '65°C' },
      { label: 'Condensate Drain', value: 'Zero Air Loss Automatic Drain' }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1615873968403-89e068629265?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    displayOrder: 3,
    createdAt: '2026-01-10'
  },
  {
    id: 'cat-hitachi-line-filters',
    name: 'Hitachi High-Efficiency Precision Line Filters (Pre & Micro Filter)',
    category: 'Line Filter',
    brand: 'Hitachi',
    price: 45000,
    callForPrice: true,
    badge: 'High Filtration',
    description: 'High-efficiency industrial in-line compressed air filter housings with multi-layer microglass filter cartridges. Removes solid particulates, scale, rust, and residual oil aerosols.',
    specs: [
      { label: 'Filtration Accuracy', value: '0.01 Micron Particulate / 0.01 mg/m³ Oil' },
      { label: 'Rated Air Flow', value: '5.2 m³/min' },
      { label: 'Operating Pressure', value: 'Up to 16 Bar' },
      { label: 'Differential Gauge', value: 'Integrated Pressure Drop Indicator' }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    displayOrder: 4,
    createdAt: '2026-01-15'
  },
  {
    id: 'cat-hitachi-spare-separator',
    name: 'Hitachi Genuine Air/Oil Separator Element & Air Filter Kit',
    category: 'Spare Parts',
    brand: 'Hitachi',
    price: 58000,
    callForPrice: true,
    badge: '100% Genuine OEM',
    description: 'Original OEM spin-on and flange separator elements, intake air filters, and oil filters designed specifically for Hitachi OSP and DSP series screw air compressors.',
    specs: [
      { label: 'Compatibility', value: 'Hitachi OSP 15/22/37/55/75 kW Series' },
      { label: 'Residual Oil Content', value: '< 2 ppm (parts per million)' },
      { label: 'Service Life', value: '3,000 ~ 4,000 Running Hours' },
      { label: 'Filter Media', value: 'Borosilicate Glass Microfiber' }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    displayOrder: 5,
    createdAt: '2026-01-20'
  },
  {
    id: 'cat-hitachi-oil-2000',
    name: 'Hitachi New Hiscrew Oil 2000 (Synthetic Lubricant - 20L Pail)',
    category: 'Compressor Lubricant',
    brand: 'Hitachi',
    price: 38500,
    callForPrice: true,
    badge: 'Japanese OEM',
    description: 'Genuine factory-formulated synthetic screw compressor oil. Delivers superior anti-oxidation, minimal varnish formation, and 2-year / 6,000-hour extended drain interval.',
    specs: [
      { label: 'Package Size', value: '20 Liters Metal Pail' },
      { label: 'Viscosity Grade', value: 'ISO VG 32 Synthetic Base' },
      { label: 'Drain Interval', value: '6,000 Hours or 2 Years' },
      { label: 'Origin', value: 'Manufactured by Hitachi Japan' }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1545259741-2ea3ebf61fa3?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    displayOrder: 6,
    createdAt: '2026-01-22'
  }
];
