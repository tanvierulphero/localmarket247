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
  signatureLabel: "Managing Director"
};

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    name: "Hitachi Hiscrew 37 S-Type Screw Compressor",
    sku: "HIT-HS-37S",
    category: "Screw Air Compressor",
    brand: "Hitachi",
    price: 650000,
    costPrice: 480000,
    stock: 3,
    unit: "Set",
    description: "High-performance S-Type oil-flooded rotary screw air compressor with advanced microprocessor control, superior energy efficiency, and low noise levels.",
    imageUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=60", // industrial equipment
    specs: [
      { label: "Motor Power", value: "37 kW (50 HP)" },
      { label: "Free Air Delivery", value: "6.2 m³/min" },
      { label: "Working Pressure", value: "8.5 Bar" },
      { label: "Cooling Method", value: "Air Cooled" },
      { label: "Weight", value: "1150 kg" }
    ]
  },
  {
    id: "prod-2",
    name: "Atlas Copco GA37 VSD+ Variable Speed Compressor",
    sku: "AC-GA37-VSD",
    category: "Screw Air Compressor",
    brand: "Atlas Copco",
    price: 890000,
    costPrice: 660000,
    stock: 2,
    unit: "Set",
    description: "Premium variable speed drive (VSD+) rotary screw compressor. Saves up to 50% energy compared to fixed-speed models. Elegant vertical space-saving design.",
    imageUrl: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=400&auto=format&fit=crop&q=60",
    specs: [
      { label: "Motor Power", value: "37 kW (50 HP)" },
      { label: "Free Air Delivery", value: "1.4 - 7.6 m³/min" },
      { label: "Working Pressure", value: "4 - 13 Bar" },
      { label: "Cooling Method", value: "Air Cooled" },
      { label: "Noise Level", value: "67 dB(A)" }
    ]
  },
  {
    id: "prod-3",
    name: "Hitachi Modular Refrigerated Air Dryer 55kW",
    sku: "HIT-AD-55",
    category: "Air Dryer",
    brand: "Hitachi",
    price: 185000,
    costPrice: 135000,
    stock: 5,
    unit: "Pcs",
    description: "High-efficiency refrigerated air dryer designed to remove moisture content from compressed air system to protect downstream pneumatic components.",
    imageUrl: "https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=400&auto=format&fit=crop&q=60",
    specs: [
      { label: "Capacity", value: "10.5 m³/min" },
      { label: "Inlet Temperature", value: "Max 50°C" },
      { label: "Dew Point", value: "3°C - 10°C" },
      { label: "Refrigerant", value: "R134a / R407C" }
    ]
  },
  {
    id: "prod-4",
    name: "Atlas Copco DD60+ High Efficiency Coalescing Line Filter",
    sku: "AC-LF-DD60",
    category: "Line Filter",
    brand: "Atlas Copco",
    price: 32000,
    costPrice: 22000,
    stock: 15,
    unit: "Pcs",
    description: "Coalescing air line filter for high-efficiency general purpose protection, removing liquid water and oil aerosol down to 0.1 mg/m³ (0.1 ppm) and particles down to 1 micron.",
    imageUrl: "https://images.unsplash.com/photo-1585713181935-d5f622cc2415?w=400&auto=format&fit=crop&q=60",
    specs: [
      { label: "Max Flow Rate", value: "60 l/s" },
      { label: "Filtration Grade", value: "DD+ High Efficiency" },
      { label: "Max Pressure", value: "16 Bar" },
      { label: "Connection", value: "G 1\"" }
    ]
  },
  {
    id: "prod-5",
    name: "Genuine Air Filter for Hitachi 22kW Compressor",
    sku: "HIT-AF-22K",
    category: "Spare Parts",
    brand: "Hitachi",
    price: 12500,
    costPrice: 8500,
    stock: 25,
    unit: "Pcs",
    description: "Genuine Hitachi air filter element to prevent dust and dirt particles from entering the compressor screw block, ensuring maximum longevity and performance.",
    imageUrl: "https://images.unsplash.com/photo-1530124560676-1055107c3ed0?w=400&auto=format&fit=crop&q=60",
    specs: [
      { label: "Compatible Model", value: "HISCREW 22 Series" },
      { label: "Filtration Rating", value: "3 Microns" },
      { label: "Material", value: "Special Cellulose Fiber" }
    ]
  },
  {
    id: "prod-6",
    name: "Genuine Oil Separator Element AC-GA37",
    sku: "AC-OS-GA37",
    category: "Spare Parts",
    brand: "Atlas Copco",
    price: 24000,
    costPrice: 16500,
    stock: 12,
    unit: "Pcs",
    description: "Atlas Copco genuine replacement oil-air separator element. Guarantees minimum residual oil carryover in air (less than 2ppm) and maintains low pressure drop.",
    imageUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=60",
    specs: [
      { label: "Compatible Model", value: "GA 30, GA 37, GA 45" },
      { label: "Residual Oil Content", value: "< 2 ppm" },
      { label: "Max Temp", value: "120°C" }
    ]
  },
  {
    id: "prod-7",
    name: "Hitachi Screw Compressor Lubricant Oil (Food Grade)",
    sku: "HIT-OIL-FG",
    category: "Spare Parts",
    brand: "Hitachi",
    price: 45000,
    costPrice: 32000,
    stock: 8,
    unit: "Can (20L)",
    description: "Premium synthetic food-grade lubricant oil for rotary screw compressors. Highly stable against oxidation, thermal breakdowns, and sludge formations.",
    imageUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=60",
    specs: [
      { label: "Volume", value: "20 Litres" },
      { label: "Viscosity Index", value: "ISO VG 46" },
      { label: "Lifetime", value: "4000 Hours" }
    ]
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: "cust-1",
    companyId: "COMP-1001",
    name: "Sabbir Rahman",
    company: "Apex Textile Printing & Dyeing Ltd.",
    phone: "01712-456789",
    email: "sabbir@apextextile.com",
    address: "Konabari Industrial Area, Gazipur, Bangladesh.",
    createdAt: "2026-01-10"
  },
  {
    id: "cust-2",
    companyId: "COMP-1002",
    name: "Mohammad Yusuf",
    company: "Standard Group Washing Division",
    phone: "01819-987654",
    email: "yusuf.m@standard-group.com",
    address: "Bason Sharok, Gazipur City, Gazipur.",
    createdAt: "2026-02-01"
  },
  {
    id: "cust-3",
    companyId: "COMP-1003",
    name: "Engr. Tanvir Ahmed",
    company: "Dhaka Auto Bricks Mills",
    phone: "01911-334455",
    email: "tanvir.engr@dhakabricks.com",
    address: "Joydebpur Road, Gazipur.",
    createdAt: "2026-02-15"
  },
  {
    id: "cust-4",
    companyId: "COMP-1004",
    name: "Kazi Monirul Islam",
    company: "Hamid Fabrics Limited",
    phone: "01552-887766",
    email: "monirul@hamidfabrics.com",
    address: "Sreepur, Gazipur, Bangladesh.",
    createdAt: "2026-03-01"
  }
];

export const INITIAL_DOCUMENTS: Document[] = [
  {
    id: "doc-1",
    type: "OFFER_LETTER",
    docNumber: "JM/OF/2026/0001",
    date: "2026-09-15",
    customerId: "cust-1",
    customerName: "Sabbir Rahman",
    customerCompany: "Apex Textile Printing & Dyeing Ltd.",
    customerPhone: "01712-456789",
    customerEmail: "sabbir@apextextile.com",
    customerAddress: "Konabari Industrial Area, Gazipur, Bangladesh.",
    subject: "Offer Letter for Premium Hitachi Rotary Screw Compressor Parts & Oil",
    salutation: "Dear Sir,",
    openingParagraph: "We refer to our recent discussion regarding the spare parts requirement for your Hitachi 37kW Screw Compressor. Jubayer Machineries is highly pleased to submit our offer letter detailing our capability to supply genuine filters and lubricant oil to keep your factory running with zero downtime.",
    closingParagraph: "We trust that our proposal meets your requirements. We are standing by to support your plant operations with high-quality services. Please let us know if you require any further technical assistance.",
    items: [
      {
        id: "item-1",
        productId: "prod-5",
        name: "Genuine Air Filter for Hitachi 22kW/37kW Compressor",
        brand: "Hitachi",
        quantity: 2,
        price: 12500,
        total: 25000,
        unit: "Pcs"
      },
      {
        id: "item-2",
        productId: "prod-7",
        name: "Hitachi Screw Compressor Lubricant Oil (Food Grade)",
        brand: "Hitachi",
        quantity: 1,
        price: 45000,
        total: 45000,
        unit: "Can (20L)"
      }
    ],
    subtotal: 70000,
    taxRate: 5,
    taxAmount: 3500,
    discount: 5000,
    total: 68500,
    status: "Active",
    terms: "1. Delivery: Within 2-3 working days.\n2. Payment: Cash or Cheque in favor of Jubayer Machineries upon delivery.\n3. Product: 100% Genuine brand quality parts.",
    signatureName: "MD MAHI UDDIN",
    signatureLabel: "Managing Director"
  },
  {
    id: "doc-2",
    type: "QUOTATION",
    docNumber: "JM/QT/2026/0024",
    date: "2026-09-16",
    customerId: "cust-2",
    customerName: "Mohammad Yusuf",
    customerCompany: "Standard Group Washing Division",
    customerPhone: "01819-987654",
    customerEmail: "yusuf.m@standard-group.com",
    customerAddress: "Bason Sharok, Gazipur City, Gazipur.",
    subject: "Quotation for Brand New Atlas Copco Variable Speed Compressor GA37 VSD+",
    salutation: "Dear Mr. Yusuf,",
    openingParagraph: "Thank you for giving us the opportunity to quote our high-efficiency industrial compressed air solutions. Below, please find our most competitive quotation for the supply and commissioning of a world-class Atlas Copco Variable Speed Compressor, along with line filters to ensure immaculate dry air for your wash plant.",
    closingParagraph: "We hope this quotation matches your expectations and standard plant parameters. Looking forward to your valued work order. We are fully committed to sustainable partnership.",
    items: [
      {
        id: "item-3",
        productId: "prod-2",
        name: "Atlas Copco GA37 VSD+ Variable Speed Compressor",
        brand: "Atlas Copco",
        quantity: 1,
        price: 890000,
        total: 890000,
        unit: "Set"
      },
      {
        id: "item-4",
        productId: "prod-4",
        name: "Atlas Copco DD60+ High Efficiency Coalescing Line Filter",
        brand: "Atlas Copco",
        quantity: 2,
        price: 32000,
        total: 64000,
        unit: "Pcs"
      }
    ],
    subtotal: 954000,
    taxRate: 5,
    taxAmount: 47700,
    discount: 14000,
    total: 987700,
    status: "Sent",
    terms: "1. Delivery: Ex-stock Gazipur showroom.\n2. Price: Includes delivery and installation support within Gazipur district.\n3. Warranty: 18 Months mechanical warranty from commission.\n4. Subject to standard business clauses.",
    signatureName: "MD MAHI UDDIN",
    signatureLabel: "Managing Director"
  },
  {
    id: "doc-3",
    type: "INVOICE",
    docNumber: "JM/INV/2026/0152",
    date: "2026-09-17",
    dueDate: "2026-10-17",
    customerId: "cust-1",
    customerName: "Sabbir Rahman",
    customerCompany: "Apex Textile Printing & Dyeing Ltd.",
    customerPhone: "01712-456789",
    customerEmail: "sabbir@apextextile.com",
    customerAddress: "Konabari Industrial Area, Gazipur, Bangladesh.",
    items: [
      {
        id: "item-5",
        productId: "prod-1",
        name: "Hitachi Hiscrew 37 S-Type Screw Compressor",
        brand: "Hitachi",
        quantity: 1,
        price: 650000,
        total: 650000,
        unit: "Set"
      },
      {
        id: "item-6",
        productId: "prod-3",
        name: "Hitachi Modular Refrigerated Air Dryer 55kW",
        brand: "Hitachi",
        quantity: 1,
        price: 185000,
        total: 185000,
        unit: "Pcs"
      }
    ],
    subtotal: 835000,
    taxRate: 5,
    taxAmount: 41750,
    discount: 25000,
    total: 851750,
    status: "Paid",
    terms: "This invoice is fully paid. Thank you for choosing Jubayer Machineries as your sustainable partner.",
    signatureName: "MD MAHI UDDIN",
    signatureLabel: "Managing Director"
  },
  {
    id: "doc-4",
    type: "BILL",
    docNumber: "JM/BILL/2026/0091",
    date: "2026-09-14",
    dueDate: "2026-09-28",
    customerId: "cust-3",
    customerName: "Engr. Tanvir Ahmed",
    customerCompany: "Dhaka Auto Bricks Mills",
    customerPhone: "01911-334455",
    customerEmail: "tanvir.engr@dhakabricks.com",
    customerAddress: "Joydebpur Road, Gazipur.",
    items: [
      {
        id: "item-7",
        productId: "prod-6",
        name: "Genuine Oil Separator Element AC-GA37",
        brand: "Atlas Copco",
        quantity: 3,
        price: 24000,
        total: 72000,
        unit: "Pcs"
      }
    ],
    subtotal: 72000,
    taxRate: 5,
    taxAmount: 3600,
    discount: 0,
    total: 75600,
    status: "Unpaid",
    terms: "Payment should be cleared within 14 days of bill submission.",
    signatureName: "MD MAHI UDDIN",
    signatureLabel: "Managing Director"
  }
];

export const INITIAL_FIELD_DISPATCHES: FieldDispatch[] = [
  {
    id: "disp-2026-001",
    date: "2026-09-24",
    staffId: "staff-sales-1",
    staffName: "Engr. Rafiqul Islam",
    customerId: "cust-1",
    companyName: "Apex Textile Printing & Dyeing Ltd.",
    address: "Konabari Industrial Area, Gazipur, Bangladesh",
    phone: "01712-456789",
    description: "Hitachi 22kW স্ক্রু কম্প্রেসর জেনারেল সার্ভিসিং, এয়ার ফিল্টার ও অয়েল পরিবর্তন এবং প্রেশার ভাল্ব ক্যালিব্রেশন।",
    billNo: "BIL-2026-091",
    billAmount: 25000,
    paidAmount: 25000,
    dueAmount: 0,
    expenseAmount: 1800,
    expenseDetails: "সিএনজি যাতায়াত ভাড়া (৳১২০০) এবং টেকনিশিয়ান দুপুরের খাবার ও নাস্তা (৳৬০০)",
    paymentStatus: "Paid",
    paymentMethod: "Cash",
    status: "Completed",
    notes: "মেশিন সফলভাবে টেস্ট রান করা হয়েছে। ক্লায়েন্ট সন্তোষ প্রকাশ করেছেন।",
    dispatchNumber: "BIL-2026-091",
    dispatchDate: "2026-09-24",
    customerCompany: "Apex Textile Printing & Dyeing Ltd.",
    customerName: "Sabbir Rahman",
    customerPhone: "01712-456789",
    purpose: "Hitachi 22kW স্ক্রু কম্প্রেসর জেনারেল সার্ভিসিং"
  },
  {
    id: "disp-2026-002",
    date: "2026-09-25",
    staffId: "staff-mgr-1",
    staffName: "Kamrul Hasan",
    customerId: "cust-2",
    companyName: "Standard Group Washing Division",
    address: "Bason Sharok, Gazipur City, Gazipur",
    phone: "01819-987654",
    description: "Atlas Copco GA37 এয়ার ড্রায়ার লাইন চেকিং, অয়েল সেপারেটর এলিমেন্ট ফিটিং ও লিকেজ মেরামত।",
    billNo: "BIL-2026-092",
    billAmount: 48000,
    paidAmount: 30000,
    dueAmount: 18000,
    expenseAmount: 2400,
    expenseDetails: "অফিস গাড়ি জ্বালানি (৳১৮০০) এবং লোকাল হার্ডওয়্যার সিলিং টেপ ও গ্যাসকেট ক্রয় (৳৬০০)",
    paymentStatus: "Partial",
    paymentMethod: "Bank Transfer",
    status: "Completed",
    notes: "আংশিক ৩০,০০০ টাকা ট্রান্সফার পেয়েছে, অবশিষ্ট ১৮,০০০ টাকা আগামী সপ্তাহে দেবে।",
    dispatchNumber: "BIL-2026-092",
    dispatchDate: "2026-09-25",
    customerCompany: "Standard Group Washing Division",
    customerName: "Mohammad Yusuf",
    customerPhone: "01819-987654",
    purpose: "Atlas Copco GA37 এয়ার ড্রায়ার লাইন চেকিং ও মেরামত"
  },
  {
    id: "disp-2026-003",
    date: "2026-09-26",
    staffId: "staff-tech-1",
    staffName: "Tariqul Islam (Technician)",
    customerId: "cust-3",
    companyName: "Square Pharmaceuticals Limited",
    address: "Kaliakair Plant, Gazipur",
    phone: "01733-112233",
    description: "ফার্মাসিউটিক্যালস ক্লিনরুম অয়েল-ফ্রি এয়ার কম্প্রেসর বাৎসরিক মেইনটেন্যান্স ও প্রেসার সেন্সর পরিবর্তন।",
    billNo: "BIL-2026-093",
    billAmount: 35000,
    paidAmount: 0,
    dueAmount: 35000,
    expenseAmount: 2200,
    expenseDetails: "কালিয়াকৈর আসা-যাওয়ার এক্সপ্রেস বাস ও লোকাল রিকশা ভাড়া (৳১৫০০) এবং লাঞ্চ (৳৭০০)",
    paymentStatus: "Due",
    paymentMethod: "Cheque",
    status: "Completed",
    notes: "অফিসিয়াল বিল কপি জমা দেওয়া হয়েছে, অ্যাকাউন্টস ডিপার্টমেন্ট চেক প্রসেস করছে।",
    dispatchNumber: "BIL-2026-093",
    dispatchDate: "2026-09-26",
    customerCompany: "Square Pharmaceuticals Limited",
    customerName: "Engr. Tanvir Ahmed",
    customerPhone: "01733-112233",
    purpose: "অয়েল-ফ্রি এয়ার কম্প্রেসর বাৎসরিক মেইনটেন্যান্স"
  }
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: "sup-1",
    supplierId: "SUP-1001",
    name: "Mahmudur Rahman",
    company: "Hitachi Air Solutions Japan & Singapore Regional Hub",
    phone: "01711-554433",
    email: "supply@hitachi-regional.com",
    address: "Motijheel C/A, Dhaka-1000.",
    contactPerson: "Engr. Mahmud",
    notes: "Main authorized importer & OEM spare parts supplier.",
    createdAt: "2026-01-05"
  },
  {
    id: "sup-2",
    supplierId: "SUP-1002",
    name: "Sajjadul Karim",
    company: "Atlas Industrial Lubricants & Machinery Corp.",
    phone: "01819-223311",
    email: "sales@atlas-lubricants.bd",
    address: "Tejgaon I/A, Dhaka-1208.",
    contactPerson: "Sajjadul Karim",
    notes: "Synthetic Compressor Oils & Air Filters supplier.",
    createdAt: "2026-01-20"
  },
  {
    id: "sup-3",
    supplierId: "SUP-1003",
    name: "Kabir Hossain",
    company: "Pneumatic Valves & Dryer Parts Trading",
    phone: "01912-778899",
    email: "kabir@pneumaticparts.com",
    address: "Nawabpur Road, Dhaka.",
    contactPerson: "Kabir Hossain",
    notes: "Local hardware, valves, gauges & fittings vendor.",
    createdAt: "2026-02-10"
  }
];

export const INITIAL_PURCHASES: Purchase[] = [
  {
    id: "pur-2026-001",
    purchaseNumber: "PUR/2026/0001",
    supplierInvoiceNo: "INV-HIT-8821",
    supplierId: "sup-1",
    supplierName: "Mahmudur Rahman",
    supplierCompany: "Hitachi Air Solutions Japan & Singapore Regional Hub",
    supplierPhone: "01711-554433",
    supplierEmail: "supply@hitachi-regional.com",
    supplierAddress: "Motijheel C/A, Dhaka-1000.",
    purchaseDate: "2026-09-10",
    items: [
      {
        id: "pur-item-1",
        productId: "prod-1",
        productName: "Hitachi Hiscrew 37 S-Type Screw Compressor",
        sku: "HIT-HS-37S",
        brand: "Hitachi",
        unit: "Set",
        quantity: 2,
        unitCost: 520000,
        totalCost: 1040000
      },
      {
        id: "pur-item-2",
        productId: "prod-5",
        productName: "Genuine Air Filter for Hitachi 22kW Compressor",
        sku: "HIT-AF-22K",
        brand: "Hitachi",
        unit: "Pcs",
        quantity: 20,
        unitCost: 8500,
        totalCost: 170000
      }
    ],
    subtotal: 1210000,
    taxRate: 0,
    taxAmount: 0,
    discount: 10000,
    shippingCost: 5000,
    grandTotal: 1205000,
    paidAmount: 1205000,
    dueAmount: 0,
    paymentStatus: "Paid",
    paymentMethod: "Bank Transfer",
    status: "Received",
    notes: "Direct container delivery at Gazipur central showroom.",
    createdAt: "2026-09-10"
  },
  {
    id: "pur-2026-002",
    purchaseNumber: "PUR/2026/0002",
    supplierInvoiceNo: "ATL-9920",
    supplierId: "sup-2",
    supplierName: "Sajjadul Karim",
    supplierCompany: "Atlas Industrial Lubricants & Machinery Corp.",
    supplierPhone: "01819-223311",
    supplierEmail: "sales@atlas-lubricants.bd",
    supplierAddress: "Tejgaon I/A, Dhaka-1208.",
    purchaseDate: "2026-09-20",
    items: [
      {
        id: "pur-item-3",
        productId: "prod-7",
        productName: "Hitachi Screw Compressor Lubricant Oil (Food Grade)",
        sku: "HIT-OIL-FG",
        brand: "Hitachi",
        unit: "Can (20L)",
        quantity: 10,
        unitCost: 36000,
        totalCost: 360000
      },
      {
        id: "pur-item-4",
        productId: "prod-6",
        productName: "Genuine Oil Separator Element AC-GA37",
        sku: "AC-OS-GA37",
        brand: "Atlas Copco",
        unit: "Pcs",
        quantity: 15,
        unitCost: 18000,
        totalCost: 270000
      }
    ],
    subtotal: 630000,
    taxRate: 0,
    taxAmount: 0,
    discount: 5000,
    shippingCost: 2000,
    grandTotal: 627000,
    paidAmount: 300000,
    dueAmount: 327000,
    paymentStatus: "Partial",
    paymentMethod: "Cheque",
    status: "Received",
    notes: "Advance 300k paid by Cheque. Remaining 327k due on 30-day supplier credit.",
    createdAt: "2026-09-20"
  }
];

export const INITIAL_SALES_RETURNS: SalesReturn[] = [
  {
    id: "ret-2026-001",
    returnNumber: "RET/2026/001",
    returnDate: "2026-09-22",
    originalDocId: "doc-3",
    originalDocNumber: "JM/INV/2026/0001",
    customerId: "cust-1",
    customerName: "Sabbir Rahman",
    customerCompany: "Apex Textile Printing & Dyeing Ltd.",
    customerPhone: "01712-456789",
    productId: "prod-4",
    productName: "Atlas Copco DD60+ High Efficiency Coalescing Line Filter",
    sku: "AC-LF-DD60",
    partsNumber: "AC-LF-DD60",
    quantity: 1,
    unit: "Pcs",
    unitPrice: 32000,
    refundAmount: 32000,
    deductFromDue: true,
    restocked: true,
    reason: "Unused spare part returned after 1 month routine maintenance cycle",
    notes: "Restocked into central warehouse. Adjusted against customer due ledger.",
    createdAt: "2026-09-22"
  }
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: "exp-2026-001",
    expenseNumber: "EXP/2026/001",
    date: "2026-09-25",
    category: "Office Rent & Utilities",
    title: "Showroom Electricity Bill (DPDC August 2026)",
    amount: 14500,
    paymentMethod: "Bank Transfer",
    paidBy: "MD MAHI UDDIN",
    referenceNo: "DPDC-893041",
    notes: "Paid via Dutch Bangla Bank Corporate account online",
    createdAt: "2026-09-25"
  },
  {
    id: "exp-2026-002",
    expenseNumber: "EXP/2026/002",
    date: "2026-09-24",
    category: "Shipping & Courier",
    title: "SA Paribahan Compressor Oil Filter shipment to Chittagong Client",
    amount: 1200,
    paymentMethod: "Cash",
    paidBy: "Kamrul Hasan",
    referenceNo: "SA-CTG-9821",
    notes: "Delivery for Apex Spinning & Knitting site service spare parts",
    createdAt: "2026-09-24"
  },
  {
    id: "exp-2026-003",
    expenseNumber: "EXP/2026/003",
    date: "2026-09-23",
    category: "Conveyance & Transportation",
    title: "Service Engineer travel & CNG fare for Jamuna Fertilizer onsite inspection",
    amount: 2500,
    paymentMethod: "bKash/Nagad",
    paidBy: "Engr. Rafiqul Islam",
    referenceNo: "CNG-JF-04",
    notes: "Site visit for 75kW Hitachi Screw Compressor troubleshooting",
    createdAt: "2026-09-23"
  },
  {
    id: "exp-2026-004",
    expenseNumber: "EXP/2026/004",
    date: "2026-09-21",
    category: "Office Tea, Snacks & Entertainment",
    title: "Weekly Office Refreshment & Client Meeting Hospitality",
    amount: 1850,
    paymentMethod: "Cash",
    paidBy: "Kamrul Hasan",
    referenceNo: "SNACK-WK38",
    notes: "Guest entertainment for industrial factory client meeting",
    createdAt: "2026-09-21"
  },
  {
    id: "exp-2026-005",
    expenseNumber: "EXP/2026/005",
    date: "2026-09-18",
    category: "Stationery & Printing",
    title: "Official Challan & Quotation Pad Printing (500 sets)",
    amount: 4500,
    paymentMethod: "Cash",
    paidBy: "MD MAHI UDDIN",
    referenceNo: "PRINT-PAD-2026",
    notes: "Branded hitachisolutioncenter official delivery challan and letterhead printing",
    createdAt: "2026-09-18"
  }
];
