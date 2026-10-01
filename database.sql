-- ==============================================================================
-- HITACHI SOLUTION CENTER / LOCALMARKET247 - COMPLETE DATABASE SCHEMA
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
DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
  `id` VARCHAR(128) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `sku` VARCHAR(100) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `brand` VARCHAR(100) NOT NULL,
  `price` DOUBLE NOT NULL DEFAULT 0,
  `stock` INT NOT NULL DEFAULT 0,
  `unit` VARCHAR(50) NOT NULL DEFAULT 'Pcs',
  `description` TEXT,
  `specs` LONGTEXT,
  `image_url` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sku` (`sku`),
  KEY `idx_category` (`category`),
  KEY `idx_brand` (`brand`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. Table: customers (Customers & Companies Table)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `customers`;
CREATE TABLE `customers` (
  `id` VARCHAR(128) NOT NULL,
  `company_id` VARCHAR(100) DEFAULT '',
  `name` VARCHAR(255) NOT NULL,
  `company` VARCHAR(255) DEFAULT '',
  `phone` VARCHAR(100) NOT NULL,
  `email` VARCHAR(255) DEFAULT '',
  `address` TEXT,
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_customer_phone` (`phone`),
  KEY `idx_customer_company` (`company`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. Table: suppliers (Suppliers & Vendors Table)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `suppliers`;
CREATE TABLE `suppliers` (
  `id` VARCHAR(128) NOT NULL,
  `supplier_id` VARCHAR(100) DEFAULT '',
  `name` VARCHAR(255) NOT NULL,
  `company` VARCHAR(255) DEFAULT '',
  `phone` VARCHAR(100) NOT NULL,
  `email` VARCHAR(255) DEFAULT '',
  `address` TEXT,
  `contact_person` VARCHAR(255) DEFAULT '',
  `notes` TEXT,
  `created_at` VARCHAR(100) DEFAULT '',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_supplier_phone` (`phone`),
  KEY `idx_supplier_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. Table: purchases (Purchases & Stock Inward Table)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `purchases`;
CREATE TABLE `purchases` (
  `id` VARCHAR(128) NOT NULL,
  `purchase_number` VARCHAR(100) NOT NULL,
  `supplier_invoice_no` VARCHAR(100) DEFAULT '',
  `supplier_id` VARCHAR(128) NOT NULL,
  `supplier_name` VARCHAR(255) NOT NULL,
  `supplier_company` VARCHAR(255) DEFAULT '',
  `supplier_phone` VARCHAR(100) DEFAULT '',
  `supplier_email` VARCHAR(255) DEFAULT '',
  `supplier_address` TEXT,
  `purchase_date` VARCHAR(50) NOT NULL,
  `items` LONGTEXT,
  `subtotal` DOUBLE NOT NULL DEFAULT 0,
  `tax_rate` DOUBLE DEFAULT 0,
  `tax_amount` DOUBLE DEFAULT 0,
  `discount` DOUBLE DEFAULT 0,
  `shipping_cost` DOUBLE DEFAULT 0,
  `grand_total` DOUBLE NOT NULL DEFAULT 0,
  `paid_amount` DOUBLE DEFAULT 0,
  `due_amount` DOUBLE DEFAULT 0,
  `payment_status` VARCHAR(50) NOT NULL, -- Paid, Partial, Due
  `payment_method` VARCHAR(50) NOT NULL, -- Cash, Bank Transfer, bKash, Cheque
  `status` VARCHAR(50) NOT NULL, -- Received, Ordered, Pending, Cancelled
  `notes` TEXT,
  `created_at` VARCHAR(100) DEFAULT '',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_purchase_number` (`purchase_number`),
  KEY `idx_purchase_supplier` (`supplier_id`),
  KEY `idx_purchase_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 5. Table: documents (Invoices, Quotations, Offer Letters, Bills)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `documents`;
CREATE TABLE `documents` (
  `id` VARCHAR(128) NOT NULL,
  `type` VARCHAR(50) NOT NULL, -- OFFER_LETTER, QUOTATION, BILL, INVOICE
  `doc_number` VARCHAR(100) NOT NULL,
  `date` VARCHAR(50) NOT NULL,
  `due_date` VARCHAR(50) DEFAULT NULL,
  `customer_id` VARCHAR(128) NOT NULL,
  `customer_name` VARCHAR(255) NOT NULL,
  `customer_company` VARCHAR(255) DEFAULT '',
  `customer_phone` VARCHAR(100) DEFAULT '',
  `customer_email` VARCHAR(255) DEFAULT '',
  `customer_address` TEXT,
  `subject` TEXT,
  `salutation` VARCHAR(255) DEFAULT '',
  `opening_paragraph` TEXT,
  `closing_paragraph` TEXT,
  `items` LONGTEXT,
  `subtotal` DOUBLE NOT NULL DEFAULT 0,
  `tax_rate` DOUBLE DEFAULT 0,
  `tax_amount` DOUBLE DEFAULT 0,
  `discount` DOUBLE DEFAULT 0,
  `total` DOUBLE NOT NULL DEFAULT 0,
  `paid_amount` DOUBLE DEFAULT 0,
  `due_amount` DOUBLE DEFAULT 0,
  `status` VARCHAR(50) NOT NULL,
  `terms` TEXT,
  `notes` TEXT,
  `signature_label` VARCHAR(255) DEFAULT 'Authorized Signature',
  `signature_name` VARCHAR(255) DEFAULT 'Hitachi Air Solution Center',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_doc_type` (`type`),
  KEY `idx_doc_number` (`doc_number`),
  KEY `idx_doc_customer` (`customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 6. Table: field_dispatches (Field Movement & Delivery Challans)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `field_dispatches`;
CREATE TABLE `field_dispatches` (
  `id` VARCHAR(128) NOT NULL,
  `dispatch_number` VARCHAR(100) NOT NULL,
  `staff_id` VARCHAR(128) NOT NULL,
  `staff_name` VARCHAR(255) NOT NULL,
  `customer_id` VARCHAR(128) NOT NULL,
  `customer_name` VARCHAR(255) NOT NULL,
  `customer_company` VARCHAR(255) DEFAULT '',
  `customer_phone` VARCHAR(100) DEFAULT '',
  `purpose` TEXT,
  `dispatch_date` VARCHAR(50) NOT NULL,
  `return_date` VARCHAR(50) DEFAULT NULL,
  `status` VARCHAR(50) NOT NULL, -- Pending Return, Completed, Cancelled
  `notes` TEXT,
  `items` LONGTEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_dispatch_number` (`dispatch_number`),
  KEY `idx_dispatch_staff` (`staff_id`),
  KEY `idx_dispatch_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 7. Table: staff_users (Staff & User Management)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `staff_users`;
CREATE TABLE `staff_users` (
  `id` VARCHAR(128) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(100) DEFAULT '',
  `passcode` VARCHAR(255) NOT NULL,
  `role` VARCHAR(100) NOT NULL, -- Super Admin, Admin, Sales Manager, Field Officer, Accountant
  `designation` VARCHAR(255) DEFAULT '',
  `status` VARCHAR(50) NOT NULL DEFAULT 'Active',
  `permissions` LONGTEXT,
  `created_at` VARCHAR(100) NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_staff_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 8. Table: settings (Business Settings & Print Configuration)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `settings`;
CREATE TABLE `settings` (
  `id` VARCHAR(128) NOT NULL DEFAULT 'global_settings',
  `name` VARCHAR(255) NOT NULL,
  `slogan` VARCHAR(255) DEFAULT '',
  `address` TEXT,
  `phone1` VARCHAR(100) DEFAULT '',
  `phone2` VARCHAR(100) DEFAULT '',
  `email` VARCHAR(255) DEFAULT '',
  `website` VARCHAR(255) DEFAULT '',
  `invoice_prefix` VARCHAR(50) DEFAULT 'INV',
  `quote_prefix` VARCHAR(50) DEFAULT 'QUO',
  `offer_prefix` VARCHAR(50) DEFAULT 'OFF',
  `bill_prefix` VARCHAR(50) DEFAULT 'BIL',
  `tax_rate` DOUBLE DEFAULT 0,
  `terms` TEXT,
  `signature_name` VARCHAR(255) DEFAULT '',
  `signature_label` VARCHAR(255) DEFAULT '',
  `logo_url` TEXT,
  `watermark_url` TEXT,
  `favicon_url` TEXT,
  `watermark_opacity` DOUBLE DEFAULT 0.04,
  `show_watermark` INT DEFAULT 1,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 9. Table: uploaded_files (Uploaded Files Records)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `uploaded_files`;
CREATE TABLE `uploaded_files` (
  `id` VARCHAR(128) NOT NULL,
  `file_name` VARCHAR(255) NOT NULL,
  `original_name` VARCHAR(255) DEFAULT '',
  `file_url` TEXT NOT NULL,
  `file_size` BIGINT DEFAULT 0,
  `mime_type` VARCHAR(100) DEFAULT '',
  `entity_type` VARCHAR(100) DEFAULT 'product', -- product, document, signature, logo, avatar
  `entity_id` VARCHAR(128) DEFAULT NULL,
  `uploaded_by_id` VARCHAR(128) DEFAULT NULL,
  `uploaded_by_name` VARCHAR(255) DEFAULT '',
  `ip_address` VARCHAR(100) DEFAULT '',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_upload_entity` (`entity_type`, `entity_id`),
  KEY `idx_upload_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 10. Table: activity_logs (Activity & Action Logs)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `activity_logs`;
CREATE TABLE `activity_logs` (
  `id` VARCHAR(128) NOT NULL,
  `staff_id` VARCHAR(128) DEFAULT NULL,
  `staff_name` VARCHAR(255) DEFAULT 'System / Guest',
  `action` VARCHAR(100) NOT NULL, -- CLICK, LOGIN, LOGOUT, CREATE, UPDATE, DELETE, PRINT, EXPORT_PDF, UPLOAD_IMAGE
  `module` VARCHAR(100) NOT NULL, -- INVENTORY, INVOICE, QUOTATION, BILL, DISPATCH, CUSTOMER, SUPPLIER, SETTINGS, STAFF
  `description` TEXT NOT NULL,
  `entity_id` VARCHAR(128) DEFAULT NULL,
  `payload` LONGTEXT, -- JSON data snapshot
  `ip_address` VARCHAR(100) DEFAULT '',
  `user_agent` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_activity_action` (`action`),
  KEY `idx_activity_module` (`module`),
  KEY `idx_activity_staff` (`staff_id`),
  KEY `idx_activity_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==============================================================================
-- INITIAL SEED DATA (Initial Seed Data)
-- ==============================================================================

-- Seed Settings
INSERT INTO `settings` (`id`, `name`, `slogan`, `address`, `phone1`, `phone2`, `email`, `website`, `invoice_prefix`, `quote_prefix`, `offer_prefix`, `bill_prefix`, `tax_rate`, `terms`, `signature_name`, `signature_label`) VALUES
('global_settings', 'Hitachi Air Solution Center', 'Industrial Air Compressors, Parts & Service Specialists', 'Plot # 12, Road # 04, Sector # 07, Uttara, Dhaka-1230, Bangladesh.', '+880 1711-000000', '+880 1819-000000', 'info@hitachisolutioncenter.com', 'https://localmarket247.top', 'INV', 'QUO', 'OFF', 'BIL', 7.5, '1. Warranty: Standard 12 Months manufacturer warranty on major components.\n2. Delivery: Ex-stock ready delivery or 2-4 weeks upon confirmation.\n3. Payment Terms: 50% advance with work order, remaining 50% upon delivery/commissioning.\n4. Validity: This quote/offer is valid for 30 calendar days from the date of issuance.', 'MD MAHI UDDIN', 'Managing Director')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Seed Staff Users
INSERT INTO `staff_users` (`id`, `name`, `email`, `phone`, `passcode`, `role`, `designation`, `status`, `permissions`, `created_at`) VALUES
('staff-1', 'MD MAHI UDDIN', 'mahi@hitachisolutioncenter.com', '01711-000001', '123456', 'Super Admin', 'Managing Director', 'Active', '["all"]', '2026-01-01'),
('staff-2', 'Engr. Tanvir Ahmed', 'tanvir@hitachisolutioncenter.com', '01711-000002', '123456', 'Admin', 'Chief Technical Officer', 'Active', '["all"]', '2026-01-01'),
('staff-3', 'Md. Rakib Hasan', 'rakib@hitachisolutioncenter.com', '01711-000003', '123456', 'Sales Manager', 'Senior Sales Executive', 'Active', '["dashboard","inventory","challan","invoice","quotation","customers","suppliers","purchases"]', '2026-01-01'),
('staff-4', 'Kamal Hossain', 'kamal@hitachisolutioncenter.com', '01711-000004', '123456', 'Field Officer', 'Field Service Engineer', 'Active', '["dashboard","challan","inventory"]', '2026-01-01')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Seed Products
INSERT INTO `products` (`id`, `name`, `sku`, `category`, `brand`, `price`, `stock`, `unit`, `description`, `specs`, `image_url`) VALUES
('prod-1', 'Hitachi Hiscrew 37 S-Type Screw Compressor', 'HIT-HS-37S', 'Screw Air Compressor', 'Hitachi', 650000, 3, 'Set', 'High-performance S-Type oil-flooded rotary screw air compressor with advanced microprocessor control, superior energy efficiency, and low noise levels.', '[{"label":"Motor Power","value":"37 kW (50 HP)"},{"label":"Free Air Delivery","value":"6.2 m³/min"},{"label":"Working Pressure","value":"8.5 Bar"}]', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=60'),
('prod-2', 'Atlas Copco GA37 VSD+ Variable Speed Compressor', 'AC-GA37-VSD', 'Screw Air Compressor', 'Atlas Copco', 890000, 2, 'Set', 'Premium variable speed drive (VSD+) rotary screw compressor. Saves up to 50% energy compared to fixed-speed models.', '[{"label":"Motor Power","value":"37 kW (50 HP)"},{"label":"Working Pressure","value":"4 - 13 Bar"}]', 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=400&auto=format&fit=crop&q=60'),
('prod-3', 'Hitachi Synthetic Screw Oil (Food Grade) 20L', 'HIT-OIL-20L', 'Lubricant Oil', 'Hitachi', 18500, 25, 'Can', 'Genuine 100% synthetic compressor oil for Hitachi rotary screw compressors. 8,000 hours operating lifetime.', '[]', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=60'),
('prod-4', 'Hitachi Air Filter Element (37kW)', 'HIT-AF-37K', 'Spare Parts', 'Hitachi', 12500, 15, 'Pcs', 'High-efficiency inlet air filter element for 37kW Hitachi screw compressors.', '[]', 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=400&auto=format&fit=crop&q=60')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Seed Customers
INSERT INTO `customers` (`id`, `company_id`, `name`, `company`, `phone`, `email`, `address`, `notes`) VALUES
('cust-1', 'COMP-001', 'Anwar Hossain', 'Ha-Meem Textile Mills Ltd.', '01711-223344', 'anwar@hameemgroup.com', 'Nishat Nagar, Tongi, Gazipur.', 'VIP Client - Textile Division'),
('cust-2', 'COMP-002', 'Engr. Shahadat Hossain', 'Square Pharmaceuticals PLC', '01819-887766', 'shahadat@squaregroup.com', 'Kaliyakir Industrial Zone, Gazipur.', 'Pharma Clean Air Requirement')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Seed Suppliers
INSERT INTO `suppliers` (`id`, `supplier_id`, `name`, `company`, `phone`, `email`, `address`, `contact_person`, `notes`, `created_at`) VALUES
('sup-1', 'SUP-101', 'Tanaka Imports Ltd.', 'Hitachi Industrial Equipment Japan', '+81 3-5555-0199', 'orders@tanaka-machinery.jp', 'Chiyoda-ku, Tokyo, Japan', 'Kenji Tanaka', 'Official Hitachi Japan Exporter', '2026-01-01'),
('sup-2', 'SUP-102', 'Bengal Engineering Spares', 'Bengal Spares & Lubricants Ltd.', '01712-998877', 'sales@bengalspares.com', 'DIT Road, Malibagh, Dhaka', 'Md. Jahangir Alam', 'Local Genuine Filter & Lubricant Distributor', '2026-01-01')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Seed Purchases
INSERT INTO `purchases` (`id`, `purchase_number`, `supplier_invoice_no`, `supplier_id`, `supplier_name`, `supplier_company`, `supplier_phone`, `supplier_email`, `supplier_address`, `purchase_date`, `items`, `subtotal`, `tax_rate`, `tax_amount`, `discount`, `shipping_cost`, `grand_total`, `paid_amount`, `due_amount`, `payment_status`, `payment_method`, `status`, `notes`, `created_at`) VALUES
('pur-1', 'PUR-2026-001', 'INV-JPN-8849', 'sup-1', 'Tanaka Imports Ltd.', 'Hitachi Industrial Equipment Japan', '+81 3-5555-0199', 'orders@tanaka-machinery.jp', 'Tokyo, Japan', '2026-03-01', '[{"id":"p-item-1","productId":"prod-1","productName":"Hitachi Hiscrew 37 S-Type Screw Compressor","brand":"Hitachi","unit":"Set","quantity":2,"unitCost":520000,"totalCost":1040000}]', 1040000, 0, 0, 20000, 15000, 1035000, 1035000, 0, 'Paid', 'Bank Transfer', 'Received', 'Imported via Chittagong Port under LC', '2026-03-01')
ON DUPLICATE KEY UPDATE `purchase_number` = VALUES(`purchase_number`);

-- Seed Documents
INSERT INTO `documents` (`id`, `type`, `doc_number`, `date`, `due_date`, `customer_id`, `customer_name`, `customer_company`, `customer_phone`, `customer_email`, `customer_address`, `subject`, `salutation`, `opening_paragraph`, `closing_paragraph`, `items`, `subtotal`, `tax_rate`, `tax_amount`, `discount`, `total`, `paid_amount`, `due_amount`, `status`, `terms`, `notes`, `signature_label`, `signature_name`) VALUES
('doc-1', 'INVOICE', 'INV-2026-001', '2026-03-01', '2026-03-15', 'cust-1', 'Anwar Hossain', 'Ha-Meem Textile Mills Ltd.', '01711-223344', 'anwar@hameemgroup.com', 'Nishat Nagar, Tongi, Gazipur.', 'Supply & Commissioning of Hitachi 37kW Screw Compressor', 'Dear Sir,', 'We are pleased to submit our commercial invoice for the high-efficiency screw air compressor supplied as per your work order.', 'Thank you for choosing Hitachi Solution Center.', '[{"id":"item-1","productId":"prod-1","name":"Hitachi Hiscrew 37 S-Type Screw Compressor","brand":"Hitachi","quantity":1,"price":650000,"total":650000,"unit":"Set"}]', 650000, 5, 32500, 10000, 672500, 400000, 272500, 'PARTIAL', '1. Warranty: 1 Year.\n2. Payment: 50% Advance.', 'Delivered to Tongi Plant', 'Managing Director', 'MD MAHI UDDIN')
ON DUPLICATE KEY UPDATE `doc_number` = VALUES(`doc_number`);

-- Seed Initial Activity Log
INSERT INTO `activity_logs` (`id`, `staff_id`, `staff_name`, `action`, `module`, `description`, `entity_id`, `ip_address`, `user_agent`) VALUES
('log-1', 'staff-1', 'MD MAHI UDDIN', 'LOGIN', 'AUTHENTICATION', 'System database initialized with full tracking capabilities', 'global_settings', '127.0.0.1', 'Hitachi Cloud Management System');

SET FOREIGN_KEY_CHECKS = 1;
