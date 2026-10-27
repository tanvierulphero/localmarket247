const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'database.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

function esc(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return isNaN(val) ? '0' : String(val);
  if (typeof val === 'boolean') return val ? '1' : '0';
  if (typeof val === 'object') val = JSON.stringify(val);
  const s = String(val).replace(/'/g, "''").replace(/\\/g, '\\\\');
  return "'" + s + "'";
}

let sql = '';
sql += '-- ==============================================================================\n';
sql += '-- JUBAYER MACHINERIES ERP - FULL RECOVERY DUMP FOR CPANEL (PHPMYADMIN)\n';
sql += '-- Generated: ' + new Date().toISOString() + '\n';
sql += '-- ==============================================================================\n\n';
sql += 'SET FOREIGN_KEY_CHECKS = 0;\n';
sql += 'SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";\n';
sql += 'SET time_zone = "+06:00";\n\n';

// 1. Settings Table
sql += 'DROP TABLE IF EXISTS `settings`;\n';
sql += 'CREATE TABLE `settings` (\n';
sql += '  `id` VARCHAR(50) NOT NULL PRIMARY KEY,\n';
sql += '  `name` VARCHAR(255) NOT NULL,\n';
sql += '  `slogan` VARCHAR(255) DEFAULT "",\n';
sql += '  `address` TEXT,\n';
sql += '  `phone1` VARCHAR(100) DEFAULT "",\n';
sql += '  `phone2` VARCHAR(100) DEFAULT "",\n';
sql += '  `email` VARCHAR(255) DEFAULT "",\n';
sql += '  `website` VARCHAR(255) DEFAULT "",\n';
sql += '  `invoice_prefix` VARCHAR(50) DEFAULT "JM/INV/2026/",\n';
sql += '  `quote_prefix` VARCHAR(50) DEFAULT "JM/QT/2026/",\n';
sql += '  `offer_prefix` VARCHAR(50) DEFAULT "JM/OF/2026/",\n';
sql += '  `bill_prefix` VARCHAR(50) DEFAULT "JM/BILL/2026/",\n';
sql += '  `challan_prefix` VARCHAR(50) DEFAULT "JM/CH/2026/",\n';
sql += '  `tax_rate` DOUBLE DEFAULT 0,\n';
sql += '  `terms` TEXT,\n';
sql += '  `signature_name` VARCHAR(255) DEFAULT "",\n';
sql += '  `signature_label` VARCHAR(255) DEFAULT "",\n';
sql += '  `logo_url` LONGTEXT,\n';
sql += '  `public_logo_url` LONGTEXT,\n';
sql += '  `watermark_url` LONGTEXT,\n';
sql += '  `favicon_url` LONGTEXT,\n';
sql += '  `watermark_opacity` DOUBLE DEFAULT 0.04,\n';
sql += '  `show_watermark` INT DEFAULT 1,\n';
sql += '  `whatsapp` VARCHAR(100) DEFAULT "",\n';
sql += '  `messenger_url` VARCHAR(255) DEFAULT "",\n';
sql += '  `facebook_url` VARCHAR(255) DEFAULT "",\n';
sql += '  `telegram_url` VARCHAR(255) DEFAULT "",\n';
sql += '  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP\n';
sql += ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n';

const st = db.settings || {};
sql += `INSERT INTO \`settings\` (\`id\`, \`name\`, \`slogan\`, \`address\`, \`phone1\`, \`phone2\`, \`email\`, \`website\`, \`invoice_prefix\`, \`quote_prefix\`, \`offer_prefix\`, \`bill_prefix\`, \`challan_prefix\`, \`tax_rate\`, \`terms\`, \`signature_name\`, \`signature_label\`, \`whatsapp\`, \`messenger_url\`, \`facebook_url\`, \`telegram_url\`) VALUES ('global_settings', ${esc(st.name)}, ${esc(st.slogan)}, ${esc(st.address)}, ${esc(st.phone1)}, ${esc(st.phone2)}, ${esc(st.email)}, ${esc(st.website)}, ${esc(st.invoicePrefix)}, ${esc(st.quotePrefix)}, ${esc(st.offerPrefix)}, ${esc(st.billPrefix)}, ${esc(st.challanPrefix)}, ${Number(st.taxRate) || 0}, ${esc(st.terms)}, ${esc(st.signatureName)}, ${esc(st.signatureLabel)}, ${esc(st.whatsapp)}, ${esc(st.messengerUrl)}, ${esc(st.facebookUrl)}, ${esc(st.telegramUrl)}) ON DUPLICATE KEY UPDATE \`name\`=VALUES(\`name\`);\n\n`;

// 2. Staff Users Table
sql += 'DROP TABLE IF EXISTS `staff_users`;\n';
sql += 'CREATE TABLE `staff_users` (\n';
sql += '  `id` VARCHAR(128) NOT NULL PRIMARY KEY,\n';
sql += '  `name` VARCHAR(255) NOT NULL,\n';
sql += '  `email` VARCHAR(255) NOT NULL,\n';
sql += '  `phone` VARCHAR(100) DEFAULT "",\n';
sql += '  `passcode` VARCHAR(100) NOT NULL DEFAULT "123456",\n';
sql += '  `role` VARCHAR(50) NOT NULL DEFAULT "Staff",\n';
sql += '  `designation` VARCHAR(100) DEFAULT "",\n';
sql += '  `status` VARCHAR(50) NOT NULL DEFAULT "Active",\n';
sql += '  `permissions` LONGTEXT,\n';
sql += '  `created_at` VARCHAR(50) DEFAULT ""\n';
sql += ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n';

(db.staffUsers || []).forEach(u => {
  sql += `INSERT INTO \`staff_users\` (\`id\`, \`name\`, \`email\`, \`phone\`, \`passcode\`, \`role\`, \`designation\`, \`status\`, \`permissions\`, \`created_at\`) VALUES (${esc(u.id)}, ${esc(u.name)}, ${esc(u.email)}, ${esc(u.phone)}, ${esc(u.passcode)}, ${esc(u.role)}, ${esc(u.designation)}, ${esc(u.status)}, ${esc(u.permissions)}, ${esc(u.createdAt)}) ON DUPLICATE KEY UPDATE \`name\`=VALUES(\`name\`);\n`;
});
sql += '\n';

// 3. Products (Internal ERP Stock)
sql += 'DROP TABLE IF EXISTS `products`;\n';
sql += 'CREATE TABLE `products` (\n';
sql += '  `id` VARCHAR(128) NOT NULL PRIMARY KEY,\n';
sql += '  `name` VARCHAR(255) NOT NULL,\n';
sql += '  `sku` VARCHAR(100) NOT NULL,\n';
sql += '  `category` VARCHAR(100) NOT NULL,\n';
sql += '  `brand` VARCHAR(100) NOT NULL,\n';
sql += '  `price` DOUBLE NOT NULL DEFAULT 0,\n';
sql += '  `cost_price` DOUBLE NOT NULL DEFAULT 0,\n';
sql += '  `stock` INT NOT NULL DEFAULT 0,\n';
sql += '  `unit` VARCHAR(50) NOT NULL DEFAULT "Pcs",\n';
sql += '  `description` TEXT,\n';
sql += '  `specs` LONGTEXT,\n';
sql += '  `image_url` LONGTEXT,\n';
sql += '  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n';
sql += ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n';

(db.products || []).forEach(p => {
  sql += `INSERT INTO \`products\` (\`id\`, \`name\`, \`sku\`, \`category\`, \`brand\`, \`price\`, \`cost_price\`, \`stock\`, \`unit\`, \`description\`, \`specs\`, \`image_url\`) VALUES (${esc(p.id)}, ${esc(p.name)}, ${esc(p.sku)}, ${esc(p.category)}, ${esc(p.brand)}, ${Number(p.price) || 0}, ${Number(p.costPrice) || 0}, ${Number(p.stock) || 0}, ${esc(p.unit)}, ${esc(p.description)}, ${esc(p.specs)}, ${esc(p.imageUrl)}) ON DUPLICATE KEY UPDATE \`name\`=VALUES(\`name\`);\n`;
});
sql += '\n';

// 4. Customers Table
sql += 'DROP TABLE IF EXISTS `customers`;\n';
sql += 'CREATE TABLE `customers` (\n';
sql += '  `id` VARCHAR(128) NOT NULL PRIMARY KEY,\n';
sql += '  `company_id` VARCHAR(100) DEFAULT "",\n';
sql += '  `name` VARCHAR(255) NOT NULL,\n';
sql += '  `company` VARCHAR(255) DEFAULT "",\n';
sql += '  `phone` VARCHAR(100) DEFAULT "",\n';
sql += '  `email` VARCHAR(255) DEFAULT "",\n';
sql += '  `address` TEXT,\n';
sql += '  `notes` TEXT,\n';
sql += '  `created_at` VARCHAR(50) DEFAULT ""\n';
sql += ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n';

(db.customers || []).forEach(c => {
  sql += `INSERT INTO \`customers\` (\`id\`, \`company_id\`, \`name\`, \`company\`, \`phone\`, \`email\`, \`address\`, \`notes\`, \`created_at\`) VALUES (${esc(c.id)}, ${esc(c.companyId)}, ${esc(c.name)}, ${esc(c.company)}, ${esc(c.phone)}, ${esc(c.email)}, ${esc(c.address)}, ${esc(c.notes)}, ${esc(c.createdAt)}) ON DUPLICATE KEY UPDATE \`name\`=VALUES(\`name\`);\n`;
});
sql += '\n';

// 5. Documents Table
sql += 'DROP TABLE IF EXISTS `documents`;\n';
sql += 'CREATE TABLE `documents` (\n';
sql += '  `id` VARCHAR(128) NOT NULL PRIMARY KEY,\n';
sql += '  `type` VARCHAR(50) NOT NULL,\n';
sql += '  `doc_number` VARCHAR(100) NOT NULL,\n';
sql += '  `date` VARCHAR(50) NOT NULL,\n';
sql += '  `due_date` VARCHAR(50) DEFAULT NULL,\n';
sql += '  `customer_id` VARCHAR(128) NOT NULL,\n';
sql += '  `customer_name` VARCHAR(255) NOT NULL,\n';
sql += '  `customer_company` VARCHAR(255) DEFAULT "",\n';
sql += '  `customer_phone` VARCHAR(100) DEFAULT "",\n';
sql += '  `customer_email` VARCHAR(255) DEFAULT "",\n';
sql += '  `customer_address` TEXT,\n';
sql += '  `subject` VARCHAR(255) DEFAULT "",\n';
sql += '  `salutation` VARCHAR(100) DEFAULT "Dear Sir,",\n';
sql += '  `opening_paragraph` TEXT,\n';
sql += '  `closing_paragraph` TEXT,\n';
sql += '  `items` LONGTEXT NOT NULL,\n';
sql += '  `subtotal` DOUBLE NOT NULL DEFAULT 0,\n';
sql += '  `tax_rate` DOUBLE DEFAULT 0,\n';
sql += '  `tax_amount` DOUBLE DEFAULT 0,\n';
sql += '  `discount` DOUBLE DEFAULT 0,\n';
sql += '  `total` DOUBLE NOT NULL DEFAULT 0,\n';
sql += '  `paid_amount` DOUBLE DEFAULT 0,\n';
sql += '  `due_amount` DOUBLE DEFAULT 0,\n';
sql += '  `status` VARCHAR(50) NOT NULL DEFAULT "Active",\n';
sql += '  `terms` TEXT,\n';
sql += '  `notes` TEXT,\n';
sql += '  `signature_label` VARCHAR(255) DEFAULT "Managing Director",\n';
sql += '  `signature_name` VARCHAR(255) DEFAULT "MD MAHI UDDIN",\n';
sql += '  `vat_enabled` INT DEFAULT 1\n';
sql += ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n';

(db.documents || []).forEach(d => {
  sql += `INSERT INTO \`documents\` (\`id\`, \`type\`, \`doc_number\`, \`date\`, \`due_date\`, \`customer_id\`, \`customer_name\`, \`customer_company\`, \`customer_phone\`, \`customer_email\`, \`customer_address\`, \`subject\`, \`salutation\`, \`opening_paragraph\`, \`closing_paragraph\`, \`items\`, \`subtotal\`, \`tax_rate\`, \`tax_amount\`, \`discount\`, \`total\`, \`paid_amount\`, \`due_amount\`, \`status\`, \`terms\`, \`notes\`, \`signature_label\`, \`signature_name\`, \`vat_enabled\`) VALUES (${esc(d.id)}, ${esc(d.type)}, ${esc(d.docNumber)}, ${esc(d.date)}, ${esc(d.dueDate)}, ${esc(d.customerId)}, ${esc(d.customerName)}, ${esc(d.customerCompany)}, ${esc(d.customerPhone)}, ${esc(d.customerEmail)}, ${esc(d.customerAddress)}, ${esc(d.subject)}, ${esc(d.salutation)}, ${esc(d.openingParagraph)}, ${esc(d.closingParagraph)}, ${esc(d.items)}, ${Number(d.subtotal) || 0}, ${Number(d.taxRate) || 0}, ${Number(d.taxAmount) || 0}, ${Number(d.discount) || 0}, ${Number(d.total) || 0}, ${Number(d.paidAmount) || 0}, ${Number(d.dueAmount) || 0}, ${esc(d.status)}, ${esc(d.terms)}, ${esc(d.notes)}, ${esc(d.signatureLabel)}, ${esc(d.signatureName)}, ${d.vatEnabled ? 1 : 0}) ON DUPLICATE KEY UPDATE \`doc_number\`=VALUES(\`doc_number\`);\n`;
});
sql += '\n';

// 6. Showcase Catalog Products
sql += 'DROP TABLE IF EXISTS `catalog_products`;\n';
sql += 'CREATE TABLE `catalog_products` (\n';
sql += '  `id` VARCHAR(128) NOT NULL PRIMARY KEY,\n';
sql += '  `name` VARCHAR(255) NOT NULL,\n';
sql += '  `category` VARCHAR(100) NOT NULL,\n';
sql += '  `brand` VARCHAR(100) NOT NULL,\n';
sql += '  `price` DOUBLE NOT NULL DEFAULT 0,\n';
sql += '  `call_for_price` INT NOT NULL DEFAULT 0,\n';
sql += '  `badge` VARCHAR(100) DEFAULT "",\n';
sql += '  `description` TEXT,\n';
sql += '  `specs` LONGTEXT,\n';
sql += '  `image_url` LONGTEXT,\n';
sql += '  `status` VARCHAR(50) NOT NULL DEFAULT "active",\n';
sql += '  `display_order` INT NOT NULL DEFAULT 0,\n';
sql += '  `created_at` VARCHAR(50) DEFAULT ""\n';
sql += ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n';

(db.catalogProducts || []).forEach(cp => {
  sql += `INSERT INTO \`catalog_products\` (\`id\`, \`name\`, \`category\`, \`brand\`, \`price\`, \`call_for_price\`, \`badge\`, \`description\`, \`specs\`, \`image_url\`, \`status\`, \`display_order\`, \`created_at\`) VALUES (${esc(cp.id)}, ${esc(cp.name)}, ${esc(cp.category)}, ${esc(cp.brand)}, ${Number(cp.price) || 0}, ${cp.callForPrice ? 1 : 0}, ${esc(cp.badge)}, ${esc(cp.description)}, ${esc(cp.specs)}, ${esc(cp.imageUrl)}, ${esc(cp.status)}, ${Number(cp.displayOrder) || 0}, ${esc(cp.createdAt)}) ON DUPLICATE KEY UPDATE \`name\`=VALUES(\`name\`);\n`;
});
sql += '\n';

// 7. Field Dispatches, Suppliers, Purchases, Sales Returns, Expenses Tables
sql += 'DROP TABLE IF EXISTS `field_dispatches`;\n';
sql += 'CREATE TABLE `field_dispatches` (\n';
sql += '  `id` VARCHAR(128) NOT NULL PRIMARY KEY,\n';
sql += '  `dispatch_number` VARCHAR(100) NOT NULL,\n';
sql += '  `date` VARCHAR(50) NOT NULL,\n';
sql += '  `staff_id` VARCHAR(128) DEFAULT "",\n';
sql += '  `staff_name` VARCHAR(255) DEFAULT "",\n';
sql += '  `customer_id` VARCHAR(128) DEFAULT "",\n';
sql += '  `customer_name` VARCHAR(255) DEFAULT "",\n';
sql += '  `customer_company` VARCHAR(255) DEFAULT "",\n';
sql += '  `address` TEXT,\n';
sql += '  `phone` VARCHAR(100) DEFAULT "",\n';
sql += '  `purpose` TEXT,\n';
sql += '  `status` VARCHAR(50) NOT NULL DEFAULT "Completed",\n';
sql += '  `items` LONGTEXT\n';
sql += ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n';

sql += 'DROP TABLE IF EXISTS `suppliers`;\n';
sql += 'CREATE TABLE `suppliers` (\n';
sql += '  `id` VARCHAR(128) NOT NULL PRIMARY KEY,\n';
sql += '  `supplier_code` VARCHAR(100) DEFAULT "",\n';
sql += '  `name` VARCHAR(255) NOT NULL,\n';
sql += '  `company` VARCHAR(255) DEFAULT "",\n';
sql += '  `phone` VARCHAR(100) DEFAULT "",\n';
sql += '  `email` VARCHAR(255) DEFAULT "",\n';
sql += '  `address` TEXT,\n';
sql += '  `created_at` VARCHAR(50) DEFAULT ""\n';
sql += ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n';

sql += 'DROP TABLE IF EXISTS `purchases`;\n';
sql += 'CREATE TABLE `purchases` (\n';
sql += '  `id` VARCHAR(128) NOT NULL PRIMARY KEY,\n';
sql += '  `purchase_number` VARCHAR(100) NOT NULL,\n';
sql += '  `date` VARCHAR(50) NOT NULL,\n';
sql += '  `supplier_id` VARCHAR(128) NOT NULL,\n';
sql += '  `supplier_name` VARCHAR(255) NOT NULL,\n';
sql += '  `items` LONGTEXT NOT NULL,\n';
sql += '  `subtotal` DOUBLE DEFAULT 0,\n';
sql += '  `grand_total` DOUBLE DEFAULT 0,\n';
sql += '  `paid_amount` DOUBLE DEFAULT 0,\n';
sql += '  `due_amount` DOUBLE DEFAULT 0,\n';
sql += '  `status` VARCHAR(50) DEFAULT "Received"\n';
sql += ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n';

sql += 'DROP TABLE IF EXISTS `sales_returns`;\n';
sql += 'CREATE TABLE `sales_returns` (\n';
sql += '  `id` VARCHAR(128) NOT NULL PRIMARY KEY,\n';
sql += '  `return_number` VARCHAR(100) NOT NULL,\n';
sql += '  `return_date` VARCHAR(50) NOT NULL,\n';
sql += '  `original_doc_number` VARCHAR(100) DEFAULT "",\n';
sql += '  `customer_name` VARCHAR(255) NOT NULL,\n';
sql += '  `product_name` VARCHAR(255) NOT NULL,\n';
sql += '  `quantity` INT DEFAULT 1,\n';
sql += '  `unit` VARCHAR(50) DEFAULT "Pcs",\n';
sql += '  `refund_amount` DOUBLE DEFAULT 0\n';
sql += ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n';

sql += 'DROP TABLE IF EXISTS `expenses`;\n';
sql += 'CREATE TABLE `expenses` (\n';
sql += '  `id` VARCHAR(128) NOT NULL PRIMARY KEY,\n';
sql += '  `expense_number` VARCHAR(100) NOT NULL,\n';
sql += '  `date` VARCHAR(50) NOT NULL,\n';
sql += '  `category` VARCHAR(100) NOT NULL,\n';
sql += '  `title` VARCHAR(255) NOT NULL,\n';
sql += '  `amount` DOUBLE NOT NULL DEFAULT 0,\n';
sql += '  `payment_method` VARCHAR(50) DEFAULT "Cash"\n';
sql += ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n';

sql += 'SET FOREIGN_KEY_CHECKS = 1;\n';

fs.writeFileSync(path.join(__dirname, '..', 'database.sql'), sql, 'utf8');
fs.writeFileSync(path.join(__dirname, '..', 'public', 'database.sql'), sql, 'utf8');
fs.writeFileSync(path.join(__dirname, '..', 'database', 'schema.sql'), sql, 'utf8');

console.log('cPanel MySQL dump generated successfully! Total size:', sql.length, 'bytes');
