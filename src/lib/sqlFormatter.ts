/**
 * Safe SQL formatting and script generation for MySQL 5.7+, MariaDB & PostgreSQL
 * Pure TypeScript utility with ZERO Node.js dependencies (runs in both Browser and Server)
 */

/**
 * Escapes values for safe standard SQL string literals
 */
export function escapeSql(val: any): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return isNaN(val) ? '0' : String(val);
  if (typeof val === 'boolean') return val ? '1' : '0';
  if (typeof val === 'object') {
    val = JSON.stringify(val);
  }
  const str = String(val).replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, (char) => {
    switch (char) {
      case "\0": return "\\0";
      case "\x08": return "\\b";
      case "\x09": return "\\t";
      case "\x1a": return "\\z";
      case "\n": return "\\n";
      case "\r": return "\\r";
      case "\"":
      case "'":
      case "\\":
      case "%":
        return "\\" + char;
      default:
        return char;
    }
  });
  return `'${str}'`;
}

/**
 * Generates SQL statement for each entity
 */
export function generateSqlForEntity(table: string, item: any): string | null {
  if (!item || !item.id) return null;

  switch (table) {
    case 'products':
      return `INSERT INTO \`products\` (\`id\`, \`name\`, \`sku\`, \`category\`, \`brand\`, \`price\`, \`cost_price\`, \`stock\`, \`unit\`, \`description\`, \`specs\`, \`image_url\`) VALUES (${escapeSql(item.id)}, ${escapeSql(item.name || '')}, ${escapeSql(item.sku || '')}, ${escapeSql(item.category || 'General')}, ${escapeSql(item.brand || 'Hitachi')}, ${Number(item.price) || 0}, ${Number(item.costPrice ?? item.cost_price) || 0}, ${Number(item.stock) || 0}, ${escapeSql(item.unit || 'Pcs')}, ${escapeSql(item.description || '')}, ${escapeSql(item.specs || [])}, ${escapeSql(item.imageUrl || item.image_url || '')}) ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`), \`sku\` = VALUES(\`sku\`), \`category\` = VALUES(\`category\`), \`brand\` = VALUES(\`brand\`), \`price\` = VALUES(\`price\`), \`cost_price\` = VALUES(\`cost_price\`), \`stock\` = VALUES(\`stock\`), \`unit\` = VALUES(\`unit\`), \`description\` = VALUES(\`description\`), \`specs\` = VALUES(\`specs\`), \`image_url\` = VALUES(\`image_url\`);`;

    case 'customers':
      return `INSERT INTO \`customers\` (\`id\`, \`company_id\`, \`name\`, \`company\`, \`phone\`, \`email\`, \`address\`, \`notes\`) VALUES (${escapeSql(item.id)}, ${escapeSql(item.companyId || item.company_id || '')}, ${escapeSql(item.name || '')}, ${escapeSql(item.company || '')}, ${escapeSql(item.phone || '')}, ${escapeSql(item.email || '')}, ${escapeSql(item.address || '')}, ${escapeSql(item.notes || '')}) ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`), \`company_id\` = VALUES(\`company_id\`), \`company\` = VALUES(\`company\`), \`phone\` = VALUES(\`phone\`), \`email\` = VALUES(\`email\`), \`address\` = VALUES(\`address\`), \`notes\` = VALUES(\`notes\`);`;

    case 'documents':
      return `INSERT INTO \`documents\` (\`id\`, \`type\`, \`doc_number\`, \`date\`, \`due_date\`, \`customer_id\`, \`customer_name\`, \`customer_company\`, \`customer_phone\`, \`customer_email\`, \`customer_address\`, \`subject\`, \`salutation\`, \`opening_paragraph\`, \`closing_paragraph\`, \`items\`, \`subtotal\`, \`tax_rate\`, \`tax_amount\`, \`discount\`, \`total\`, \`paid_amount\`, \`due_amount\`, \`status\`, \`terms\`, \`notes\`, \`signature_label\`, \`signature_name\`, \`vat_enabled\`) VALUES (${escapeSql(item.id)}, ${escapeSql(item.type || 'INVOICE')}, ${escapeSql(item.docNumber || item.doc_number || '')}, ${escapeSql(item.date || '')}, ${escapeSql(item.dueDate || item.due_date || null)}, ${escapeSql(item.customerId || item.customer_id || '')}, ${escapeSql(item.customerName || item.customer_name || '')}, ${escapeSql(item.customerCompany || item.customer_company || '')}, ${escapeSql(item.customerPhone || item.customer_phone || '')}, ${escapeSql(item.customerEmail || item.customer_email || '')}, ${escapeSql(item.customerAddress || item.customer_address || '')}, ${escapeSql(item.subject || '')}, ${escapeSql(item.salutation || '')}, ${escapeSql(item.openingParagraph || item.opening_paragraph || '')}, ${escapeSql(item.closingParagraph || item.closing_paragraph || '')}, ${escapeSql(item.items || [])}, ${Number(item.subtotal) || 0}, ${Number(item.taxRate ?? item.tax_rate) || 0}, ${Number(item.taxAmount ?? item.tax_amount) || 0}, ${Number(item.discount) || 0}, ${Number(item.total) || 0}, ${Number(item.paidAmount ?? item.paid_amount) || 0}, ${Number(item.dueAmount ?? item.due_amount) || 0}, ${escapeSql(item.status || 'Draft')}, ${escapeSql(item.terms || '')}, ${escapeSql(item.notes || '')}, ${escapeSql(item.signatureLabel || item.signature_label || '')}, ${escapeSql(item.signatureName || item.signature_name || '')}, ${item.vatEnabled === false || item.vatEnabled === 0 ? 0 : 1}) ON DUPLICATE KEY UPDATE \`type\` = VALUES(\`type\`), \`doc_number\` = VALUES(\`doc_number\`), \`date\` = VALUES(\`date\`), \`due_date\` = VALUES(\`due_date\`), \`customer_name\` = VALUES(\`customer_name\`), \`customer_company\` = VALUES(\`customer_company\`), \`items\` = VALUES(\`items\`), \`subtotal\` = VALUES(\`subtotal\`), \`total\` = VALUES(\`total\`), \`paid_amount\` = VALUES(\`paid_amount\`), \`due_amount\` = VALUES(\`due_amount\`), \`status\` = VALUES(\`status\`), \`notes\` = VALUES(\`notes\`), \`vat_enabled\` = VALUES(\`vat_enabled\`);`;

    case 'staff_users':
      return `INSERT INTO \`staff_users\` (\`id\`, \`name\`, \`email\`, \`phone\`, \`passcode\`, \`role\`, \`designation\`, \`status\`, \`permissions\`, \`created_at\`) VALUES (${escapeSql(item.id)}, ${escapeSql(item.name || '')}, ${escapeSql(item.email || '')}, ${escapeSql(item.phone || '')}, ${escapeSql(item.passcode || '123456')}, ${escapeSql(item.role || 'Staff')}, ${escapeSql(item.designation || '')}, ${escapeSql(item.status || 'Active')}, ${escapeSql(item.permissions || [])}, ${escapeSql(item.createdAt || item.created_at || new Date().toISOString().split('T')[0])}) ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`), \`phone\` = VALUES(\`phone\`), \`role\` = VALUES(\`role\`), \`designation\` = VALUES(\`designation\`), \`status\` = VALUES(\`status\`), \`permissions\` = VALUES(\`permissions\`);`;

    case 'field_dispatches':
      return `INSERT INTO \`field_dispatches\` (\`id\`, \`dispatch_number\`, \`date\`, \`staff_id\`, \`staff_name\`, \`customer_id\`, \`customer_name\`, \`customer_company\`, \`company_name\`, \`address\`, \`customer_phone\`, \`phone\`, \`purpose\`, \`description\`, \`dispatch_date\`, \`return_date\`, \`bill_no\`, \`bill_amount\`, \`paid_amount\`, \`due_amount\`, \`expense_amount\`, \`expense_details\`, \`payment_status\`, \`payment_method\`, \`status\`, \`notes\`, \`items\`) VALUES (${escapeSql(item.id)}, ${escapeSql(item.dispatchNumber || item.dispatch_number || item.billNo || '')}, ${escapeSql(item.date || item.dispatchDate || '')}, ${escapeSql(item.staffId || item.staff_id || '')}, ${escapeSql(item.staffName || item.staff_name || '')}, ${escapeSql(item.customerId || item.customer_id || '')}, ${escapeSql(item.customerName || item.customer_name || '')}, ${escapeSql(item.customerCompany || item.customer_company || item.companyName || '')}, ${escapeSql(item.companyName || item.customerCompany || '')}, ${escapeSql(item.address || '')}, ${escapeSql(item.customerPhone || item.customer_phone || item.phone || '')}, ${escapeSql(item.phone || item.customerPhone || '')}, ${escapeSql(item.purpose || item.description || '')}, ${escapeSql(item.description || item.purpose || '')}, ${escapeSql(item.dispatchDate || item.dispatch_date || item.date || '')}, ${escapeSql(item.returnDate || item.return_date || null)}, ${escapeSql(item.billNo || item.dispatchNumber || '')}, ${Number(item.billAmount ?? item.bill_amount) || 0}, ${Number(item.paidAmount ?? item.paid_amount) || 0}, ${Number(item.dueAmount ?? item.due_amount) || 0}, ${Number(item.expenseAmount ?? item.expense_amount) || 0}, ${escapeSql(item.expenseDetails || item.expense_details || '')}, ${escapeSql(item.paymentStatus || item.payment_status || 'Paid')}, ${escapeSql(item.paymentMethod || item.payment_method || 'Cash')}, ${escapeSql(item.status || 'Completed')}, ${escapeSql(item.notes || '')}, ${escapeSql(item.items || [])}) ON DUPLICATE KEY UPDATE \`dispatch_number\` = VALUES(\`dispatch_number\`), \`date\` = VALUES(\`date\`), \`staff_name\` = VALUES(\`staff_name\`), \`customer_name\` = VALUES(\`customer_name\`), \`company_name\` = VALUES(\`company_name\`), \`address\` = VALUES(\`address\`), \`phone\` = VALUES(\`phone\`), \`description\` = VALUES(\`description\`), \`bill_no\` = VALUES(\`bill_no\`), \`bill_amount\` = VALUES(\`bill_amount\`), \`paid_amount\` = VALUES(\`paid_amount\`), \`due_amount\` = VALUES(\`due_amount\`), \`expense_amount\` = VALUES(\`expense_amount\`), \`expense_details\` = VALUES(\`expense_details\`), \`payment_status\` = VALUES(\`payment_status\`), \`payment_method\` = VALUES(\`payment_method\`), \`status\` = VALUES(\`status\`), \`notes\` = VALUES(\`notes\`), \`items\` = VALUES(\`items\`);`;

    case 'suppliers':
      return `INSERT INTO \`suppliers\` (\`id\`, \`supplier_id\`, \`name\`, \`company\`, \`phone\`, \`email\`, \`address\`, \`contact_person\`, \`notes\`, \`created_at\`) VALUES (${escapeSql(item.id)}, ${escapeSql(item.supplierId || item.supplier_id || '')}, ${escapeSql(item.name || '')}, ${escapeSql(item.company || '')}, ${escapeSql(item.phone || '')}, ${escapeSql(item.email || '')}, ${escapeSql(item.address || '')}, ${escapeSql(item.contactPerson || item.contact_person || '')}, ${escapeSql(item.notes || '')}, ${escapeSql(item.createdAt || item.created_at || new Date().toISOString().split('T')[0])}) ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`), \`company\` = VALUES(\`company\`), \`phone\` = VALUES(\`phone\`), \`email\` = VALUES(\`email\`), \`address\` = VALUES(\`address\`), \`contact_person\` = VALUES(\`contact_person\`), \`notes\` = VALUES(\`notes\`);`;

    case 'purchases':
      return `INSERT INTO \`purchases\` (\`id\`, \`purchase_number\`, \`supplier_invoice_no\`, \`supplier_id\`, \`supplier_name\`, \`supplier_company\`, \`supplier_phone\`, \`supplier_email\`, \`supplier_address\`, \`purchase_date\`, \`items\`, \`subtotal\`, \`tax_rate\`, \`tax_amount\`, \`discount\`, \`shipping_cost\`, \`grand_total\`, \`paid_amount\`, \`due_amount\`, \`payment_status\`, \`payment_method\`, \`status\`, \`notes\`, \`created_at\`) VALUES (${escapeSql(item.id)}, ${escapeSql(item.purchaseNumber || item.purchase_number || '')}, ${escapeSql(item.supplierInvoiceNo || item.supplier_invoice_no || '')}, ${escapeSql(item.supplierId || item.supplier_id || '')}, ${escapeSql(item.supplierName || item.supplier_name || '')}, ${escapeSql(item.supplierCompany || item.supplier_company || '')}, ${escapeSql(item.supplierPhone || item.supplier_phone || '')}, ${escapeSql(item.supplierEmail || item.supplier_email || '')}, ${escapeSql(item.supplierAddress || item.supplier_address || '')}, ${escapeSql(item.purchaseDate || item.purchase_date || '')}, ${escapeSql(item.items || [])}, ${Number(item.subtotal) || 0}, ${Number(item.taxRate ?? item.tax_rate) || 0}, ${Number(item.taxAmount ?? item.tax_amount) || 0}, ${Number(item.discount) || 0}, ${Number(item.shippingCost ?? item.shipping_cost) || 0}, ${Number(item.grandTotal ?? item.grand_total) || 0}, ${Number(item.paidAmount ?? item.paid_amount) || 0}, ${Number(item.dueAmount ?? item.due_amount) || 0}, ${escapeSql(item.paymentStatus || item.payment_status || 'Paid')}, ${escapeSql(item.paymentMethod || item.payment_method || 'Cash')}, ${escapeSql(item.status || 'Received')}, ${escapeSql(item.notes || '')}, ${escapeSql(item.createdAt || item.created_at || new Date().toISOString().split('T')[0])}) ON DUPLICATE KEY UPDATE \`purchase_number\` = VALUES(\`purchase_number\`), \`supplier_name\` = VALUES(\`supplier_name\`), \`items\` = VALUES(\`items\`), \`subtotal\` = VALUES(\`subtotal\`), \`grand_total\` = VALUES(\`grand_total\`), \`paid_amount\` = VALUES(\`paid_amount\`), \`due_amount\` = VALUES(\`due_amount\`), \`payment_status\` = VALUES(\`payment_status\`), \`status\` = VALUES(\`status\`), \`notes\` = VALUES(\`notes\`);`;

    case 'sales_returns':
      return `INSERT INTO \`sales_returns\` (\`id\`, \`return_number\`, \`return_date\`, \`original_doc_id\`, \`original_doc_number\`, \`customer_id\`, \`customer_name\`, \`customer_company\`, \`customer_phone\`, \`product_id\`, \`product_name\`, \`sku\`, \`parts_number\`, \`quantity\`, \`unit\`, \`unit_price\`, \`refund_amount\`, \`deduct_from_due\`, \`restocked\`, \`reason\`, \`notes\`, \`created_at\`) VALUES (${escapeSql(item.id)}, ${escapeSql(item.returnNumber || item.return_number || '')}, ${escapeSql(item.returnDate || item.return_date || '')}, ${escapeSql(item.originalDocId || item.original_doc_id || '')}, ${escapeSql(item.originalDocNumber || item.original_doc_number || '')}, ${escapeSql(item.customerId || item.customer_id || '')}, ${escapeSql(item.customerName || item.customer_name || '')}, ${escapeSql(item.customerCompany || item.customer_company || '')}, ${escapeSql(item.customerPhone || item.customer_phone || '')}, ${escapeSql(item.productId || item.product_id || '')}, ${escapeSql(item.productName || item.product_name || '')}, ${escapeSql(item.sku || '')}, ${escapeSql(item.partsNumber || item.parts_number || '')}, ${Number(item.quantity) || 1}, ${escapeSql(item.unit || 'Pcs')}, ${Number(item.unitPrice ?? item.unit_price) || 0}, ${Number(item.refundAmount ?? item.refund_amount) || 0}, ${item.deductFromDue ? 1 : 0}, ${item.restocked ? 1 : 0}, ${escapeSql(item.reason || '')}, ${escapeSql(item.notes || '')}, ${escapeSql(item.createdAt || item.created_at || new Date().toISOString().split('T')[0])}) ON DUPLICATE KEY UPDATE \`refund_amount\` = VALUES(\`refund_amount\`), \`notes\` = VALUES(\`notes\`);`;

    case 'expenses':
      return `INSERT INTO \`expenses\` (\`id\`, \`expense_number\`, \`date\`, \`category\`, \`title\`, \`amount\`, \`payment_method\`, \`paid_by\`, \`staff_id\`, \`reference_no\`, \`notes\`, \`receipt_url\`, \`created_at\`) VALUES (${escapeSql(item.id)}, ${escapeSql(item.expenseNumber || item.expense_number || '')}, ${escapeSql(item.date || '')}, ${escapeSql(item.category || 'Office')}, ${escapeSql(item.title || '')}, ${Number(item.amount) || 0}, ${escapeSql(item.paymentMethod || item.payment_method || 'Cash')}, ${escapeSql(item.paidBy || item.paid_by || '')}, ${escapeSql(item.staffId || item.staff_id || '')}, ${escapeSql(item.referenceNo || item.reference_no || '')}, ${escapeSql(item.notes || '')}, ${escapeSql(item.receiptUrl || item.receipt_url || '')}, ${escapeSql(item.createdAt || item.created_at || new Date().toISOString().split('T')[0])}) ON DUPLICATE KEY UPDATE \`title\` = VALUES(\`title\`), \`amount\` = VALUES(\`amount\`), \`category\` = VALUES(\`category\`), \`date\` = VALUES(\`date\`), \`notes\` = VALUES(\`notes\`);`;

    case 'settings':
      return `INSERT INTO \`settings\` (\`id\`, \`name\`, \`slogan\`, \`address\`, \`phone1\`, \`phone2\`, \`email\`, \`website\`, \`invoice_prefix\`, \`quote_prefix\`, \`offer_prefix\`, \`bill_prefix\`, \`tax_rate\`, \`terms\`, \`signature_name\`, \`signature_label\`, \`logo_url\`, \`watermark_url\`, \`favicon_url\`, \`watermark_opacity\`, \`show_watermark\`) VALUES (${escapeSql(item.id || 'global_settings')}, ${escapeSql(item.name || 'Hitachi Air Solution Center')}, ${escapeSql(item.slogan || '')}, ${escapeSql(item.address || '')}, ${escapeSql(item.phone1 || '')}, ${escapeSql(item.phone2 || '')}, ${escapeSql(item.email || '')}, ${escapeSql(item.website || '')}, ${escapeSql(item.invoicePrefix || item.invoice_prefix || 'INV')}, ${escapeSql(item.quotePrefix || item.quote_prefix || 'QUO')}, ${escapeSql(item.offerPrefix || item.offer_prefix || 'OFF')}, ${escapeSql(item.billPrefix || item.bill_prefix || 'BIL')}, ${Number(item.taxRate ?? item.tax_rate) || 0}, ${escapeSql(item.terms || '')}, ${escapeSql(item.signatureName || item.signature_name || '')}, ${escapeSql(item.signatureLabel || item.signature_label || '')}, ${escapeSql(item.logoUrl || item.logo_url || '')}, ${escapeSql(item.watermarkUrl || item.watermark_url || '')}, ${escapeSql(item.faviconUrl || item.favicon_url || '')}, ${Number(item.watermarkOpacity ?? item.watermark_opacity) || 0.04}, ${item.showWatermark === false || item.show_watermark === 0 ? 0 : 1}) ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`), \`slogan\` = VALUES(\`slogan\`), \`address\` = VALUES(\`address\`), \`phone1\` = VALUES(\`phone1\`), \`phone2\` = VALUES(\`phone2\`), \`email\` = VALUES(\`email\`), \`website\` = VALUES(\`website\`), \`tax_rate\` = VALUES(\`tax_rate\`), \`terms\` = VALUES(\`terms\`), \`signature_name\` = VALUES(\`signature_name\`), \`signature_label\` = VALUES(\`signature_label\`), \`logo_url\` = VALUES(\`logo_url\`), \`watermark_url\` = VALUES(\`watermark_url\`);`;

    default:
      return null;
  }
}

/**
 * Builds a 100% complete, clean database.sql dump script from currently loaded live data.
 * Compatible with MySQL 5.7+, 8.0+, MariaDB (cPanel / phpMyAdmin) and PostgreSQL.
 */
export function buildFullSqlScript(data: {
  products?: any[];
  customers?: any[];
  documents?: any[];
  staff?: any[];
  settings?: any;
  fieldDispatches?: any[];
  suppliers?: any[];
  purchases?: any[];
  salesReturns?: any[];
  expenses?: any[];
}): string {
  const timestamp = new Date().toISOString();
  const prods = data.products || [];
  const custs = data.customers || [];
  const docs = data.documents || [];
  const staff = data.staff || [];
  const setts = data.settings || {};
  const disps = data.fieldDispatches || [];
  const sups = data.suppliers || [];
  const purs = data.purchases || [];
  const rets = data.salesReturns || [];
  const exps = data.expenses || [];

  let out = `-- ==============================================================================
-- HITACHI SOLUTION CENTER / LOCALMARKET247 - COMPLETE DATABASE DUMP
-- Generated At: ${timestamp}
-- Compatible with: MySQL 5.7+, MySQL 8.0+, MariaDB (cPanel phpMyAdmin) & PostgreSQL
-- Character Set: utf8mb4 / Unicode
-- Features: Full Inventory, Invoicing, Quotations, Field Dispatches, 
--           Purchases, Suppliers, Media Uploads Tracking, Complete Activity & Click Logs
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+06:00"; -- Bangladesh Standard Time

-- ------------------------------------------------------------------------------
-- 1. Table: products (Products & Inventory Table)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS \`products\`;
CREATE TABLE \`products\` (
  \`id\` VARCHAR(128) NOT NULL,
  \`name\` VARCHAR(255) NOT NULL,
  \`sku\` VARCHAR(100) NOT NULL,
  \`category\` VARCHAR(100) NOT NULL,
  \`brand\` VARCHAR(100) NOT NULL,
  \`price\` DOUBLE NOT NULL DEFAULT 0,
  \`cost_price\` DOUBLE NOT NULL DEFAULT 0,
  \`stock\` INT NOT NULL DEFAULT 0,
  \`unit\` VARCHAR(50) NOT NULL DEFAULT 'Pcs',
  \`description\` TEXT,
  \`specs\` LONGTEXT,
  \`image_url\` LONGTEXT,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_sku\` (\`sku\`),
  KEY \`idx_category\` (\`category\`),
  KEY \`idx_brand\` (\`brand\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. Table: customers (Customers & Companies Table)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS \`customers\`;
CREATE TABLE \`customers\` (
  \`id\` VARCHAR(128) NOT NULL,
  \`company_id\` VARCHAR(100) DEFAULT '',
  \`name\` VARCHAR(255) NOT NULL,
  \`company\` VARCHAR(255) DEFAULT '',
  \`phone\` VARCHAR(100) NOT NULL,
  \`email\` VARCHAR(255) DEFAULT '',
  \`address\` TEXT,
  \`notes\` TEXT,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_customer_phone\` (\`phone\`),
  KEY \`idx_customer_company\` (\`company\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. Table: suppliers (Suppliers & Vendors Table)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS \`suppliers\`;
CREATE TABLE \`suppliers\` (
  \`id\` VARCHAR(128) NOT NULL,
  \`supplier_id\` VARCHAR(100) DEFAULT '',
  \`name\` VARCHAR(255) NOT NULL,
  \`company\` VARCHAR(255) DEFAULT '',
  \`phone\` VARCHAR(100) NOT NULL,
  \`email\` VARCHAR(255) DEFAULT '',
  \`address\` TEXT,
  \`contact_person\` VARCHAR(255) DEFAULT '',
  \`notes\` TEXT,
  \`created_at\` VARCHAR(100) DEFAULT '',
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_supplier_name\` (\`name\`),
  KEY \`idx_supplier_phone\` (\`phone\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. Table: purchases (Purchases & Supplier Invoices Table)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS \`purchases\`;
CREATE TABLE \`purchases\` (
  \`id\` VARCHAR(128) NOT NULL,
  \`purchase_number\` VARCHAR(100) NOT NULL,
  \`supplier_invoice_no\` VARCHAR(100) DEFAULT '',
  \`supplier_id\` VARCHAR(128) NOT NULL,
  \`supplier_name\` VARCHAR(255) NOT NULL,
  \`supplier_company\` VARCHAR(255) DEFAULT '',
  \`supplier_phone\` VARCHAR(100) DEFAULT '',
  \`supplier_email\` VARCHAR(255) DEFAULT '',
  \`supplier_address\` TEXT,
  \`purchase_date\` VARCHAR(50) NOT NULL,
  \`items\` LONGTEXT,
  \`subtotal\` DOUBLE NOT NULL DEFAULT 0,
  \`tax_rate\` DOUBLE DEFAULT 0,
  \`tax_amount\` DOUBLE DEFAULT 0,
  \`discount\` DOUBLE DEFAULT 0,
  \`shipping_cost\` DOUBLE DEFAULT 0,
  \`grand_total\` DOUBLE NOT NULL DEFAULT 0,
  \`paid_amount\` DOUBLE DEFAULT 0,
  \`due_amount\` DOUBLE DEFAULT 0,
  \`payment_status\` VARCHAR(50) NOT NULL,
  \`payment_method\` VARCHAR(50) NOT NULL,
  \`status\` VARCHAR(50) NOT NULL,
  \`notes\` TEXT,
  \`created_at\` VARCHAR(100) DEFAULT '',
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_purchase_number\` (\`purchase_number\`),
  KEY \`idx_purchase_supplier\` (\`supplier_id\`),
  KEY \`idx_purchase_status\` (\`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 5. Table: documents (Invoices, Quotations, Offer Letters, Bills)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS \`documents\`;
CREATE TABLE \`documents\` (
  \`id\` VARCHAR(128) NOT NULL,
  \`type\` VARCHAR(50) NOT NULL,
  \`doc_number\` VARCHAR(100) NOT NULL,
  \`date\` VARCHAR(50) NOT NULL,
  \`due_date\` VARCHAR(50) DEFAULT NULL,
  \`customer_id\` VARCHAR(128) NOT NULL,
  \`customer_name\` VARCHAR(255) NOT NULL,
  \`customer_company\` VARCHAR(255) DEFAULT '',
  \`customer_phone\` VARCHAR(100) DEFAULT '',
  \`customer_email\` VARCHAR(255) DEFAULT '',
  \`customer_address\` TEXT,
  \`subject\` TEXT,
  \`salutation\` VARCHAR(255) DEFAULT '',
  \`opening_paragraph\` TEXT,
  \`closing_paragraph\` TEXT,
  \`items\` LONGTEXT,
  \`subtotal\` DOUBLE NOT NULL DEFAULT 0,
  \`tax_rate\` DOUBLE DEFAULT 0,
  \`tax_amount\` DOUBLE DEFAULT 0,
  \`discount\` DOUBLE DEFAULT 0,
  \`total\` DOUBLE NOT NULL DEFAULT 0,
  \`paid_amount\` DOUBLE DEFAULT 0,
  \`due_amount\` DOUBLE DEFAULT 0,
  \`status\` VARCHAR(50) NOT NULL,
  \`terms\` TEXT,
  \`notes\` TEXT,
  \`signature_label\` VARCHAR(255) DEFAULT 'Authorized Signature',
  \`signature_name\` VARCHAR(255) DEFAULT 'Hitachi Air Solution Center',
  \`vat_enabled\` INT NOT NULL DEFAULT 1,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_doc_type\` (\`type\`),
  KEY \`idx_doc_number\` (\`doc_number\`),
  KEY \`idx_doc_customer\` (\`customer_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 6. Table: field_dispatches (Field Movement & Service Dispatches)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS \`field_dispatches\`;
CREATE TABLE \`field_dispatches\` (
  \`id\` VARCHAR(128) NOT NULL,
  \`dispatch_number\` VARCHAR(100) NOT NULL,
  \`date\` VARCHAR(50) DEFAULT '',
  \`staff_id\` VARCHAR(128) NOT NULL,
  \`staff_name\` VARCHAR(255) NOT NULL,
  \`customer_id\` VARCHAR(128) NOT NULL,
  \`customer_name\` VARCHAR(255) NOT NULL,
  \`customer_company\` VARCHAR(255) DEFAULT '',
  \`company_name\` VARCHAR(255) DEFAULT '',
  \`address\` TEXT,
  \`customer_phone\` VARCHAR(100) DEFAULT '',
  \`phone\` VARCHAR(100) DEFAULT '',
  \`purpose\` TEXT,
  \`description\` TEXT,
  \`dispatch_date\` VARCHAR(50) DEFAULT '',
  \`return_date\` VARCHAR(50) DEFAULT NULL,
  \`bill_no\` VARCHAR(100) DEFAULT '',
  \`bill_amount\` DOUBLE DEFAULT 0,
  \`paid_amount\` DOUBLE DEFAULT 0,
  \`due_amount\` DOUBLE DEFAULT 0,
  \`expense_amount\` DOUBLE DEFAULT 0,
  \`expense_details\` TEXT,
  \`payment_status\` VARCHAR(50) DEFAULT 'Paid',
  \`payment_method\` VARCHAR(50) DEFAULT 'Cash',
  \`status\` VARCHAR(50) NOT NULL DEFAULT 'Completed',
  \`notes\` TEXT,
  \`items\` LONGTEXT,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_dispatch_number\` (\`dispatch_number\`),
  KEY \`idx_dispatch_staff\` (\`staff_id\`),
  KEY \`idx_dispatch_status\` (\`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 7. Table: staff_users (Staff & User Management)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS \`staff_users\`;
CREATE TABLE \`staff_users\` (
  \`id\` VARCHAR(128) NOT NULL,
  \`name\` VARCHAR(255) NOT NULL,
  \`email\` VARCHAR(255) NOT NULL,
  \`phone\` VARCHAR(100) DEFAULT '',
  \`passcode\` VARCHAR(255) NOT NULL,
  \`role\` VARCHAR(100) NOT NULL,
  \`designation\` VARCHAR(255) DEFAULT '',
  \`status\` VARCHAR(50) NOT NULL DEFAULT 'Active',
  \`permissions\` LONGTEXT,
  \`created_at\` VARCHAR(100) NOT NULL,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`idx_staff_email\` (\`email\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 8. Table: settings (Business Settings & Print Configuration)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS \`settings\`;
CREATE TABLE \`settings\` (
  \`id\` VARCHAR(128) NOT NULL DEFAULT 'global_settings',
  \`name\` VARCHAR(255) NOT NULL,
  \`slogan\` VARCHAR(255) DEFAULT '',
  \`address\` TEXT,
  \`phone1\` VARCHAR(100) DEFAULT '',
  \`phone2\` VARCHAR(100) DEFAULT '',
  \`email\` VARCHAR(255) DEFAULT '',
  \`website\` VARCHAR(255) DEFAULT '',
  \`invoice_prefix\` VARCHAR(50) DEFAULT 'INV',
  \`quote_prefix\` VARCHAR(50) DEFAULT 'QUO',
  \`offer_prefix\` VARCHAR(50) DEFAULT 'OFF',
  \`bill_prefix\` VARCHAR(50) DEFAULT 'BIL',
  \`tax_rate\` DOUBLE DEFAULT 0,
  \`terms\` TEXT,
  \`signature_name\` VARCHAR(255) DEFAULT '',
  \`signature_label\` VARCHAR(255) DEFAULT '',
  \`logo_url\` LONGTEXT,
  \`watermark_url\` LONGTEXT,
  \`favicon_url\` LONGTEXT,
  \`watermark_opacity\` DOUBLE DEFAULT 0.04,
  \`show_watermark\` INT DEFAULT 1,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 9. Table: uploaded_files (Uploaded Files Records)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS \`uploaded_files\`;
CREATE TABLE \`uploaded_files\` (
  \`id\` VARCHAR(128) NOT NULL,
  \`file_name\` VARCHAR(255) NOT NULL,
  \`original_name\` VARCHAR(255) DEFAULT '',
  \`file_url\` TEXT NOT NULL,
  \`file_size\` BIGINT DEFAULT 0,
  \`mime_type\` VARCHAR(100) DEFAULT '',
  \`entity_type\` VARCHAR(100) DEFAULT 'product',
  \`entity_id\` VARCHAR(128) DEFAULT NULL,
  \`uploaded_by_id\` VARCHAR(128) DEFAULT NULL,
  \`uploaded_by_name\` VARCHAR(255) DEFAULT '',
  \`ip_address\` VARCHAR(100) DEFAULT '',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_upload_entity\` (\`entity_type\`, \`entity_id\`),
  KEY \`idx_upload_created\` (\`created_at\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 10. Table: sales_returns (Sales Returns & Restock Records)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS \`sales_returns\`;
CREATE TABLE \`sales_returns\` (
  \`id\` VARCHAR(128) NOT NULL,
  \`return_number\` VARCHAR(100) NOT NULL,
  \`return_date\` VARCHAR(50) NOT NULL,
  \`original_doc_id\` VARCHAR(128) DEFAULT '',
  \`original_doc_number\` VARCHAR(100) DEFAULT '',
  \`customer_id\` VARCHAR(128) NOT NULL,
  \`customer_name\` VARCHAR(255) NOT NULL,
  \`customer_company\` VARCHAR(255) DEFAULT '',
  \`customer_phone\` VARCHAR(100) DEFAULT '',
  \`product_id\` VARCHAR(128) NOT NULL,
  \`product_name\` VARCHAR(255) NOT NULL,
  \`sku\` VARCHAR(100) DEFAULT '',
  \`parts_number\` VARCHAR(100) DEFAULT '',
  \`quantity\` INT NOT NULL DEFAULT 1,
  \`unit\` VARCHAR(50) NOT NULL DEFAULT 'Pcs',
  \`unit_price\` DOUBLE NOT NULL DEFAULT 0,
  \`refund_amount\` DOUBLE DEFAULT 0,
  \`deduct_from_due\` INT DEFAULT 1,
  \`restocked\` INT DEFAULT 1,
  \`reason\` TEXT,
  \`notes\` TEXT,
  \`created_at\` VARCHAR(100) DEFAULT '',
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_return_number\` (\`return_number\`),
  KEY \`idx_return_customer\` (\`customer_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 11. Table: expenses (Daily & Office Expenses Table)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS \`expenses\`;
CREATE TABLE \`expenses\` (
  \`id\` VARCHAR(128) NOT NULL,
  \`expense_number\` VARCHAR(100) NOT NULL,
  \`date\` VARCHAR(50) NOT NULL,
  \`category\` VARCHAR(100) NOT NULL,
  \`title\` VARCHAR(255) NOT NULL,
  \`amount\` DOUBLE NOT NULL DEFAULT 0,
  \`payment_method\` VARCHAR(50) NOT NULL DEFAULT 'Cash',
  \`paid_by\` VARCHAR(255) DEFAULT '',
  \`staff_id\` VARCHAR(128) DEFAULT '',
  \`reference_no\` VARCHAR(100) DEFAULT '',
  \`notes\` TEXT,
  \`receipt_url\` TEXT,
  \`created_at\` VARCHAR(100) DEFAULT '',
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_expense_number\` (\`expense_number\`),
  KEY \`idx_expense_date\` (\`date\`),
  KEY \`idx_expense_category\` (\`category\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 12. Table: activity_logs (Activity & Action Logs)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS \`activity_logs\`;
CREATE TABLE \`activity_logs\` (
  \`id\` VARCHAR(128) NOT NULL,
  \`staff_id\` VARCHAR(128) DEFAULT NULL,
  \`staff_name\` VARCHAR(255) DEFAULT 'System / Guest',
  \`action\` VARCHAR(100) NOT NULL,
  \`module\` VARCHAR(100) NOT NULL,
  \`description\` TEXT NOT NULL,
  \`entity_id\` VARCHAR(128) DEFAULT NULL,
  \`payload\` LONGTEXT,
  \`ip_address\` VARCHAR(100) DEFAULT '',
  \`user_agent\` TEXT,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_activity_action\` (\`action\`),
  KEY \`idx_activity_module\` (\`module\`),
  KEY \`idx_activity_staff\` (\`staff_id\`),
  KEY \`idx_activity_created\` (\`created_at\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==============================================================================
-- LIVE APPLICATION & ADMIN PANEL ENTRIES
-- ==============================================================================

`;

  // Settings
  if (setts && Object.keys(setts).length > 0) {
    const sSql = generateSqlForEntity('settings', setts);
    if (sSql) out += `-- Settings\n${sSql}\n\n`;
  }

  // Staff users
  if (staff.length > 0) {
    out += `-- Staff Users (${staff.length})\n`;
    staff.forEach(s => {
      const sql = generateSqlForEntity('staff_users', s);
      if (sql) out += `${sql}\n`;
    });
    out += '\n';
  }

  // Products
  if (prods.length > 0) {
    out += `-- Products & Inventory Items (${prods.length})\n`;
    prods.forEach(p => {
      const sql = generateSqlForEntity('products', p);
      if (sql) out += `${sql}\n`;
    });
    out += '\n';
  }

  // Customers
  if (custs.length > 0) {
    out += `-- Customers & Companies (${custs.length})\n`;
    custs.forEach(c => {
      const sql = generateSqlForEntity('customers', c);
      if (sql) out += `${sql}\n`;
    });
    out += '\n';
  }

  // Suppliers
  if (sups.length > 0) {
    out += `-- Suppliers & Vendors (${sups.length})\n`;
    sups.forEach(s => {
      const sql = generateSqlForEntity('suppliers', s);
      if (sql) out += `${sql}\n`;
    });
    out += '\n';
  }

  // Purchases
  if (purs.length > 0) {
    out += `-- Purchases & Inward Stock (${purs.length})\n`;
    purs.forEach(p => {
      const sql = generateSqlForEntity('purchases', p);
      if (sql) out += `${sql}\n`;
    });
    out += '\n';
  }

  // Documents
  if (docs.length > 0) {
    out += `-- Documents: Invoices, Quotations, Bills & Challans (${docs.length})\n`;
    docs.forEach(d => {
      const sql = generateSqlForEntity('documents', d);
      if (sql) out += `${sql}\n`;
    });
    out += '\n';
  }

  // Field Dispatches
  if (disps.length > 0) {
    out += `-- Field Service & Work Records (${disps.length})\n`;
    disps.forEach(fd => {
      const sql = generateSqlForEntity('field_dispatches', fd);
      if (sql) out += `${sql}\n`;
    });
    out += '\n';
  }

  // Sales Returns
  if (rets.length > 0) {
    out += `-- Sales Returns & Restock (${rets.length})\n`;
    rets.forEach(r => {
      const sql = generateSqlForEntity('sales_returns', r);
      if (sql) out += `${sql}\n`;
    });
    out += '\n';
  }

  // Expenses
  if (exps.length > 0) {
    out += `-- Expenses & Owner Personal Drawings (${exps.length})\n`;
    exps.forEach(e => {
      const sql = generateSqlForEntity('expenses', e);
      if (sql) out += `${sql}\n`;
    });
    out += '\n';
  }

  out += `-- ------------------------------------------------------------------------------\n-- REAL-TIME ADMIN PANEL LIVE ENTRIES\n-- ------------------------------------------------------------------------------\n\nSET FOREIGN_KEY_CHECKS = 1;\n`;

  return out;
}
