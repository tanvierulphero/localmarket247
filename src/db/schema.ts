import { pgTable, text, real, integer, jsonb, timestamp } from 'drizzle-orm/pg-core';

// Users table for database user tracking
export const users = pgTable('users', {
  id: text('id').primaryKey().notNull(),
  uid: text('uid').unique(),
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Products / Inventory table
export const products = pgTable('products', {
  id: text('id').primaryKey().notNull(),
  name: text('name').notNull(),
  sku: text('sku').notNull(),
  category: text('category').notNull(),
  brand: text('brand').notNull(),
  price: real('price').notNull(),
  costPrice: real('cost_price').default(0),
  stock: integer('stock').notNull(),
  unit: text('unit').notNull(),
  description: text('description').default(''),
  specs: jsonb('specs').$type<{ label: string; value: string }[]>().default([]),
  imageUrl: text('image_url').default(''),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Customers table
export const customers = pgTable('customers', {
  id: text('id').primaryKey().notNull(),
  companyId: text('company_id').default(''),
  name: text('name').notNull(),
  company: text('company').default(''),
  phone: text('phone').notNull(),
  email: text('email').default(''),
  address: text('address').default(''),
  notes: text('notes').default(''),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Documents table (Invoices, Quotations, Offer Letters, Bills)
export const documents = pgTable('documents', {
  id: text('id').primaryKey().notNull(),
  type: text('type').notNull(), // OFFER_LETTER, QUOTATION, BILL, INVOICE
  docNumber: text('doc_number').notNull(),
  date: text('date').notNull(),
  dueDate: text('due_date'),
  customerId: text('customer_id').notNull(),
  customerName: text('customer_name').notNull(),
  customerCompany: text('customer_company').default(''),
  customerPhone: text('customer_phone').default(''),
  customerEmail: text('customer_email').default(''),
  customerAddress: text('customer_address').default(''),
  
  // Specific to Offer Letter / Quotation
  subject: text('subject'),
  salutation: text('salutation'),
  openingParagraph: text('opening_paragraph'),
  closingParagraph: text('closing_paragraph'),

  // Financial Items & Totals
  items: jsonb('items').$type<{
    id: string;
    productId?: string;
    name: string;
    brand: string;
    quantity: number;
    price: number;
    total: number;
    unit: string;
  }[]>().default([]),
  subtotal: real('subtotal').notNull(),
  taxRate: real('tax_rate').default(0),
  taxAmount: real('tax_amount').default(0),
  discount: real('discount').default(0),
  total: real('total').notNull(),
  paidAmount: real('paid_amount').default(0),
  dueAmount: real('due_amount').default(0),
  status: text('status').notNull(),
  terms: text('terms').default(''),
  notes: text('notes'),
  signatureLabel: text('signature_label').default('Authorized Signature'),
  signatureName: text('signature_name').default('Hitachi Air Solution Center'),
  vatEnabled: integer('vat_enabled').default(1),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Staff Users table
export const staffUsers = pgTable('staff_users', {
  id: text('id').primaryKey().notNull(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').default(''),
  passcode: text('passcode').notNull(),
  role: text('role').notNull(),
  designation: text('designation').default(''),
  status: text('status').notNull(), // Active, Inactive
  permissions: jsonb('permissions').$type<string[]>().default([]),
  createdAt: text('created_at').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Business Settings table
export const settings = pgTable('settings', {
  id: text('id').primaryKey().notNull(), // 'global_settings'
  name: text('name').notNull(),
  slogan: text('slogan').default(''),
  address: text('address').default(''),
  phone1: text('phone1').default(''),
  phone2: text('phone2').default(''),
  email: text('email').default(''),
  website: text('website').default(''),
  invoicePrefix: text('invoice_prefix').default('INV'),
  quotePrefix: text('quote_prefix').default('QUO'),
  offerPrefix: text('offer_prefix').default('OFF'),
  billPrefix: text('bill_prefix').default('BIL'),
  taxRate: real('tax_rate').default(0),
  terms: text('terms').default(''),
  signatureName: text('signature_name').default(''),
  signatureLabel: text('signature_label').default(''),
  logoUrl: text('logo_url').default(''),
  watermarkUrl: text('watermark_url').default(''),
  faviconUrl: text('favicon_url').default(''),
  watermarkOpacity: real('watermark_opacity').default(0.04),
  showWatermark: integer('show_watermark').default(1),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Field Service & Work Records table
export const fieldDispatches = pgTable('field_dispatches', {
  id: text('id').primaryKey().notNull(),
  date: text('date').default(''),
  staffId: text('staff_id').default(''),
  staffName: text('staff_name').notNull(),
  customerId: text('customer_id').default(''),
  companyName: text('company_name').default(''),
  address: text('address').default(''),
  phone: text('phone').default(''),
  description: text('description').default(''),
  billNo: text('bill_no').default(''),
  billAmount: real('bill_amount').default(0),
  paidAmount: real('paid_amount').default(0),
  dueAmount: real('due_amount').default(0),
  expenseAmount: real('expense_amount').default(0),
  expenseDetails: text('expense_details').default(''),
  paymentStatus: text('payment_status').default('Paid'), // 'Paid' | 'Partial' | 'Due'
  paymentMethod: text('payment_method').default('Cash'),
  status: text('status').default('Completed'), // 'Completed' | 'Pending' | 'In Progress'
  notes: text('notes').default(''),
  
  // Backward compatibility fields
  dispatchNumber: text('dispatch_number').default(''),
  customerName: text('customer_name').default(''),
  customerCompany: text('customer_company').default(''),
  customerPhone: text('customer_phone').default(''),
  purpose: text('purpose').default(''),
  dispatchDate: text('dispatch_date').default(''),
  returnDate: text('return_date'),
  items: jsonb('items').$type<any[]>().default([]),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Suppliers / Vendors table
export const suppliers = pgTable('suppliers', {
  id: text('id').primaryKey().notNull(),
  supplierId: text('supplier_id').default(''),
  name: text('name').notNull(),
  company: text('company').default(''),
  phone: text('phone').notNull(),
  email: text('email').default(''),
  address: text('address').default(''),
  contactPerson: text('contact_person').default(''),
  notes: text('notes').default(''),
  createdAt: text('created_at').default(''),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Purchases / Stock Inward table
export const purchases = pgTable('purchases', {
  id: text('id').primaryKey().notNull(),
  purchaseNumber: text('purchase_number').notNull(),
  supplierInvoiceNo: text('supplier_invoice_no').default(''),
  supplierId: text('supplier_id').notNull(),
  supplierName: text('supplier_name').notNull(),
  supplierCompany: text('supplier_company').default(''),
  supplierPhone: text('supplier_phone').default(''),
  supplierEmail: text('supplier_email').default(''),
  supplierAddress: text('supplier_address').default(''),
  purchaseDate: text('purchase_date').notNull(),
  items: jsonb('items').$type<{
    id: string;
    productId: string;
    productName: string;
    sku?: string;
    brand?: string;
    unit: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
  }[]>().default([]),
  subtotal: real('subtotal').notNull(),
  taxRate: real('tax_rate').default(0),
  taxAmount: real('tax_amount').default(0),
  discount: real('discount').default(0),
  shippingCost: real('shipping_cost').default(0),
  grandTotal: real('grand_total').notNull(),
  paidAmount: real('paid_amount').default(0),
  dueAmount: real('due_amount').default(0),
  paymentStatus: text('payment_status').notNull(), // 'Paid' | 'Partial' | 'Due'
  paymentMethod: text('payment_method').notNull(), // 'Cash' | 'Bank Transfer' | 'bKash/Nagad' | 'Cheque'
  status: text('status').notNull(), // 'Received' | 'Ordered' | 'Pending' | 'Cancelled'
  notes: text('notes').default(''),
  createdAt: text('created_at').default(''),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Sales Returns / Restock table
export const salesReturns = pgTable('sales_returns', {
  id: text('id').primaryKey().notNull(),
  returnNumber: text('return_number').notNull(),
  returnDate: text('return_date').notNull(),
  originalDocId: text('original_doc_id').default(''),
  originalDocNumber: text('original_doc_number').default(''),
  customerId: text('customer_id').notNull(),
  customerName: text('customer_name').notNull(),
  customerCompany: text('customer_company').default(''),
  customerPhone: text('customer_phone').default(''),
  productId: text('product_id').notNull(),
  productName: text('product_name').notNull(),
  sku: text('sku').default(''),
  partsNumber: text('parts_number').default(''),
  quantity: integer('quantity').notNull(),
  unit: text('unit').notNull(),
  unitPrice: real('unit_price').notNull(),
  refundAmount: real('refund_amount').default(0),
  deductFromDue: integer('deduct_from_due').default(1), // 1 for true, 0 for false
  restocked: integer('restocked').default(1),
  reason: text('reason').default(''),
  notes: text('notes').default(''),
  createdAt: text('created_at').default(''),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Expenses table
export const expenses = pgTable('expenses', {
  id: text('id').primaryKey().notNull(),
  expenseNumber: text('expense_number').notNull(),
  date: text('date').notNull(),
  category: text('category').notNull(),
  title: text('title').notNull(),
  amount: real('amount').notNull(),
  paymentMethod: text('payment_method').notNull(), // 'Cash' | 'Bank Transfer' | 'bKash/Nagad' | 'Cheque'
  paidBy: text('paid_by').default(''),
  staffId: text('staff_id').default(''),
  referenceNo: text('reference_no').default(''),
  notes: text('notes').default(''),
  receiptUrl: text('receipt_url').default(''),
  createdAt: text('created_at').default(''),
  updatedAt: timestamp('updated_at').defaultNow(),
});
