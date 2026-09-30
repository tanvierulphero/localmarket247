export interface ProductSpec {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  brand: string;
  price: number;
  costPrice?: number; // ক্রয় মূল্য / Buying Cost
  stock: number;
  unit: string;
  description: string;
  specs: ProductSpec[];
  imageUrl: string;
}

export interface Customer {
  id: string;
  companyId?: string; // e.g. COMP-1001
  name: string;
  company: string;
  phone: string;
  email: string;
  address: string;
  createdAt?: string;
  notes?: string;
}

export type DocumentType = 'OFFER_LETTER' | 'QUOTATION' | 'BILL' | 'INVOICE' | 'CHALLAN';

export type ExpensePaymentMethod = 'Cash' | 'Bank Transfer' | 'bKash/Nagad' | 'Cheque';

export interface Expense {
  id: string;
  expenseNumber: string; // e.g. EXP/2026/001
  date: string;          // YYYY-MM-DD
  category: string;
  title: string;
  amount: number;
  paymentMethod: ExpensePaymentMethod;
  paidBy: string;
  staffId?: string;
  referenceNo?: string;
  notes?: string;
  receiptUrl?: string;
  createdAt?: string;
}

export interface SalesReturn {
  id: string;
  returnNumber: string; // e.g. RET/2026/001
  returnDate: string;   // e.g. 2026-09-26
  originalDocId?: string;
  originalDocNumber?: string;
  customerId: string;
  customerName: string;
  customerCompany?: string;
  customerPhone?: string;
  productId: string;
  productName: string;
  sku?: string;
  partsNumber?: string;
  brand?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  refundAmount: number;
  deductFromDue: boolean;
  restocked: boolean;
  reason: string;
  notes?: string;
  createdAt?: string;
}

export type DocumentStatus = 
  | 'Draft' 
  | 'Sent' 
  | 'Paid' 
  | 'Partially Paid'
  | 'Unpaid' 
  | 'Overdue' 
  | 'Accepted' 
  | 'Declined'
  | 'Active';

export type UserRole = 'ADMIN' | 'MANAGER' | 'SALESMAN' | 'STAFF' | 'CUSTOM';

export type PermissionKey =
  | 'view_overview'
  | 'view_inventory'
  | 'manage_inventory'
  | 'view_purchases'
  | 'manage_purchases'
  | 'view_documents'
  | 'create_documents'
  | 'edit_documents'
  | 'delete_documents'
  | 'view_reports'
  | 'view_due_ledger'
  | 'manage_due_ledger'
  | 'view_staff_management'
  | 'manage_settings'
  | 'view_field_dispatch'
  | 'manage_field_dispatch'
  | 'view_company_profiles'
  | 'manage_company_profiles'
  | 'view_expenses'
  | 'manage_expenses'
  | 'view_owner_draw'
  | 'manage_owner_draw';

export interface Supplier {
  id: string;
  supplierId?: string; // e.g. SUP-1001
  name: string;
  company: string;
  phone: string;
  email: string;
  address: string;
  contactPerson?: string;
  notes?: string;
  createdAt?: string;
}

export interface PurchaseItem {
  id: string;
  productId: string;
  productName: string;
  sku?: string;
  brand?: string;
  unit: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export type PurchasePaymentStatus = 'Paid' | 'Partial' | 'Due';
export type PurchaseStatus = 'Received' | 'Ordered' | 'Pending' | 'Cancelled';

export interface Purchase {
  id: string;
  purchaseNumber: string; // e.g. PUR/2026/0001
  supplierInvoiceNo?: string; // e.g. INV-8849
  supplierId: string;
  supplierName: string;
  supplierCompany: string;
  supplierPhone: string;
  supplierEmail?: string;
  supplierAddress?: string;
  purchaseDate: string;
  items: PurchaseItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  shippingCost: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: PurchasePaymentStatus;
  paymentMethod: 'Cash' | 'Bank Transfer' | 'bKash/Nagad' | 'Cheque';
  status: PurchaseStatus;
  notes?: string;
  createdAt?: string;
}

export interface FieldDispatchItem {
  id: string;
  productId: string;
  productName: string;
  brand: string;
  unit: string;
  issuedQty: number;   // Total items taken out by staff
  soldQty: number;     // Items sold/used on site
  returnedQty: number; // Items returned back to warehouse
  unitPrice: number;
  totalPrice: number;
}

export type FieldDispatchStatus = 'Completed' | 'Pending' | 'In Progress' | 'Cancelled';
export type FieldPaymentStatus = 'Paid' | 'Partial' | 'Due';

export interface FieldDispatch {
  id: string;
  date: string;              // Date of entry (YYYY-MM-DD)
  staffId?: string;          // Staff ID if linked
  staffName: string;         // কর্মচারীর নাম (Employee / Staff Name)
  customerId?: string;       // Customer ID if linked
  companyName: string;       // কোম্পানির নাম (Company / Client Name)
  address: string;           // ঠিকানা / সাইট লোকেশন (Address / Location)
  phone?: string;            // যোগাযোগ নম্বর (Phone)
  description: string;       // কাজের বিবরণ (Work / Service / Job Details)
  billNo: string;            // বিল নং / মেমো নং (Bill / Voucher / Memo No)
  billAmount: number;        // মোট বিল এমাউন্ট (Total Bill Amount ৳)
  paidAmount: number;        // পেইড এমাউন্ট (Paid / Received Amount ৳)
  dueAmount: number;         // বিল ডিউ (Due Amount ৳)
  expenseAmount: number;     // কর্মচারীর খরচ (Staff Field Expense / Conveyance ৳)
  expenseDetails?: string;   // খরচের বিবরণ (Expense Details)
  paymentStatus: FieldPaymentStatus; // পরিশোধ স্ট্যাটাস (Paid | Partial | Due)
  paymentMethod: 'Cash' | 'Bank Transfer' | 'bKash/Nagad' | 'Cheque'; // পেমেন্ট মেথড
  status: FieldDispatchStatus; // কাজের স্ট্যাটাস (Completed | Pending | In Progress)
  notes?: string;            // অতিরিক্ত মন্তব্য / নোট
  createdAt?: string;

  // Backward compatibility fields
  dispatchNumber?: string;
  dispatchDate?: string;
  customerName?: string;
  customerCompany?: string;
  customerPhone?: string;
  purpose?: string;
  returnDate?: string | null;
  items?: FieldDispatchItem[];
}

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  passcode: string;
  role: UserRole;
  designation: string;
  status: 'Active' | 'Inactive';
  permissions: PermissionKey[];
  createdAt: string;
}

export interface DocumentItem {
  id: string;
  productId?: string;
  name: string;
  brand: string;
  quantity: number;
  price: number;
  total: number;
  unit: string;
  warrantyMonths?: number; // e.g. 12, 18, 24
  warrantyExpiryDate?: string; // e.g. "2027-09-25"
}

export interface Document {
  id: string;
  type: DocumentType;
  docNumber: string; // e.g. JM-2026-0001
  date: string;
  dueDate?: string; // invoice/bill
  customerId: string;
  customerName: string;
  customerCompany: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  
  // Specific to Offer Letter / Quotation
  subject?: string;
  salutation?: string;
  openingParagraph?: string;
  closingParagraph?: string;
  
  // General Document Fields
  items: DocumentItem[];
  subtotal: number;
  taxRate: number; // percentage
  taxAmount: number;
  discount: number; // flat amount
  total: number;
  paidAmount?: number; // Outstanding/Due Ledger tracking
  dueAmount?: number;  // Outstanding/Due Ledger tracking
  status: DocumentStatus;
  terms: string;
  notes?: string;
  signatureLabel: string;
  signatureName: string;
  vatEnabled?: boolean | number;
}

export interface BusinessSettings {
  name: string;
  slogan: string;
  address: string;
  phone1: string;
  phone2: string;
  email: string;
  website: string;
  invoicePrefix: string;
  quotePrefix: string;
  offerPrefix: string;
  billPrefix: string;
  taxRate: number;
  terms: string;
  signatureName: string;
  signatureLabel: string;
}
