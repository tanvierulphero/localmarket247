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
  `cost_price` DOUBLE NOT NULL DEFAULT 0,
  `stock` INT NOT NULL DEFAULT 0,
  `unit` VARCHAR(50) NOT NULL DEFAULT 'Pcs',
  `description` TEXT,
  `specs` LONGTEXT,
  `image_url` LONGTEXT,
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
  `vat_enabled` INT NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_doc_type` (`type`),
  KEY `idx_doc_number` (`doc_number`),
  KEY `idx_doc_customer` (`customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 6. Table: field_dispatches (Field Movement & Service Dispatches)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `field_dispatches`;
CREATE TABLE `field_dispatches` (
  `id` VARCHAR(128) NOT NULL,
  `dispatch_number` VARCHAR(100) NOT NULL,
  `date` VARCHAR(50) DEFAULT '',
  `staff_id` VARCHAR(128) NOT NULL,
  `staff_name` VARCHAR(255) NOT NULL,
  `customer_id` VARCHAR(128) NOT NULL,
  `customer_name` VARCHAR(255) NOT NULL,
  `customer_company` VARCHAR(255) DEFAULT '',
  `company_name` VARCHAR(255) DEFAULT '',
  `address` TEXT,
  `customer_phone` VARCHAR(100) DEFAULT '',
  `phone` VARCHAR(100) DEFAULT '',
  `purpose` TEXT,
  `description` TEXT,
  `dispatch_date` VARCHAR(50) DEFAULT '',
  `return_date` VARCHAR(50) DEFAULT NULL,
  `bill_no` VARCHAR(100) DEFAULT '',
  `bill_amount` DOUBLE DEFAULT 0,
  `paid_amount` DOUBLE DEFAULT 0,
  `due_amount` DOUBLE DEFAULT 0,
  `expense_amount` DOUBLE DEFAULT 0,
  `expense_details` TEXT,
  `payment_status` VARCHAR(50) DEFAULT 'Paid',
  `payment_method` VARCHAR(50) DEFAULT 'Cash',
  `status` VARCHAR(50) NOT NULL DEFAULT 'Completed',
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
  `logo_url` LONGTEXT,
  `watermark_url` LONGTEXT,
  `favicon_url` LONGTEXT,
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
  `file_url` LONGTEXT NOT NULL,
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
-- 10. Table: sales_returns (Sales Returns & Restock Records)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `sales_returns`;
CREATE TABLE `sales_returns` (
  `id` VARCHAR(128) NOT NULL,
  `return_number` VARCHAR(100) NOT NULL,
  `return_date` VARCHAR(50) NOT NULL,
  `original_doc_id` VARCHAR(128) DEFAULT '',
  `original_doc_number` VARCHAR(100) DEFAULT '',
  `customer_id` VARCHAR(128) NOT NULL,
  `customer_name` VARCHAR(255) NOT NULL,
  `customer_company` VARCHAR(255) DEFAULT '',
  `customer_phone` VARCHAR(100) DEFAULT '',
  `product_id` VARCHAR(128) NOT NULL,
  `product_name` VARCHAR(255) NOT NULL,
  `sku` VARCHAR(100) DEFAULT '',
  `parts_number` VARCHAR(100) DEFAULT '',
  `quantity` INT NOT NULL DEFAULT 1,
  `unit` VARCHAR(50) NOT NULL DEFAULT 'Pcs',
  `unit_price` DOUBLE NOT NULL DEFAULT 0,
  `refund_amount` DOUBLE DEFAULT 0,
  `deduct_from_due` INT DEFAULT 1,
  `restocked` INT DEFAULT 1,
  `reason` TEXT,
  `notes` TEXT,
  `created_at` VARCHAR(100) DEFAULT '',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_return_number` (`return_number`),
  KEY `idx_return_customer` (`customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 11. Table: expenses (Daily & Office Expenses Table)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `expenses`;
CREATE TABLE `expenses` (
  `id` VARCHAR(128) NOT NULL,
  `expense_number` VARCHAR(100) NOT NULL,
  `date` VARCHAR(50) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `amount` DOUBLE NOT NULL DEFAULT 0,
  `payment_method` VARCHAR(50) NOT NULL DEFAULT 'Cash',
  `paid_by` VARCHAR(255) DEFAULT '',
  `staff_id` VARCHAR(128) DEFAULT '',
  `reference_no` VARCHAR(100) DEFAULT '',
  `notes` TEXT,
  `receipt_url` TEXT,
  `created_at` VARCHAR(100) DEFAULT '',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_expense_number` (`expense_number`),
  KEY `idx_expense_date` (`date`),
  KEY `idx_expense_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 12. Table: activity_logs (Activity & Action Logs)
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
INSERT INTO `settings` (`id`, `name`, `slogan`, `address`, `phone1`, `phone2`, `email`, `website`, `invoice_prefix`, `quote_prefix`, `offer_prefix`, `bill_prefix`, `tax_rate`, `terms`, `signature_name`, `signature_label`, `logo_url`, `watermark_url`, `favicon_url`, `watermark_opacity`, `show_watermark`) VALUES ('global_settings', 'Jubayer Machineries', 'Your Problem Solution is Sustainable Partner', 'Hazi Siddik Complex, Molla Market, Bason Sharok, Gazipur City.', '01715-994956', '01799-498199', 'jubayermachineries@gmail.com', 'www.hitachiairsolutioncenter.com', 'HSC/INV/2026/', 'HSC/QT/2026/', 'HSC/OF/2026/', 'HSC/BILL/2026/', 5, '1. Delivery: Within 7 working days upon receipt of work order.\n2. Payment: 50\% advance with work order & 50\% upon delivery.\n3. Warranty: 1 Year comprehensive brand warranty.\n4. Validity of this offer is 30 days.', 'MD MAHI UDDIN', 'Managing Director', '', '', '', 0.04, 1) ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `slogan` = VALUES(`slogan`), `address` = VALUES(`address`), `phone1` = VALUES(`phone1`), `phone2` = VALUES(`phone2`), `email` = VALUES(`email`), `website` = VALUES(`website`), `tax_rate` = VALUES(`tax_rate`), `terms` = VALUES(`terms`), `signature_name` = VALUES(`signature_name`), `signature_label` = VALUES(`signature_label`), `logo_url` = VALUES(`logo_url`), `watermark_url` = VALUES(`watermark_url`);

-- Seed Staff Users with authorized accounts (No demo data)
INSERT INTO `staff_users` (`id`, `name`, `email`, `phone`, `passcode`, `role`, `designation`, `status`, `permissions`, `created_at`) VALUES 
('staff-admin-1', 'MD MAHI UDDIN', 'mahi@hitachisolutioncenter.com', '01715-994956', 'admin123', 'ADMIN', 'Managing Director & Owner', 'Active', '[\"view_overview\",\"view_inventory\",\"manage_inventory\",\"view_documents\",\"create_documents\",\"edit_documents\",\"delete_documents\",\"view_due_ledger\",\"manage_due_ledger\",\"view_reports\",\"manage_settings\",\"view_staff_management\"]', '2026-01-01'),
('staff-mgr-1', 'Kamrul Hasan', 'kamrul@hitachisolutioncenter.com', '01799-498199', 'mgr123', 'MANAGER', 'Operations Manager', 'Active', '[\"view_overview\",\"view_inventory\",\"manage_inventory\",\"view_documents\",\"create_documents\",\"edit_documents\",\"view_due_ledger\",\"manage_due_ledger\",\"view_reports\"]', '2026-01-15'),
('staff-sales-1', 'Engr. Rafiqul Islam', 'rafiq@hitachisolutioncenter.com', '01812-334455', 'sales123', 'SALESMAN', 'Senior Sales Executive', 'Active', '[\"view_overview\",\"view_inventory\",\"view_documents\",\"create_documents\",\"view_due_ledger\"]', '2026-02-01'),
('staff-store-1', 'Tarikul Tanvir', 'store@hitachisolutioncenter.com', '01911-223344', 'staff123', 'STAFF', 'Store & Inventory Keeper', 'Active', '[\"view_inventory\",\"manage_inventory\",\"view_documents\"]', '2026-02-10')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `phone` = VALUES(`phone`), `role` = VALUES(`role`), `designation` = VALUES(`designation`), `status` = VALUES(`status`), `permissions` = VALUES(`permissions`);

-- Seed Initial Activity Log
INSERT INTO `activity_logs` (`id`, `staff_id`, `staff_name`, `action`, `module`, `description`, `entity_id`, `ip_address`, `user_agent`) VALUES
('log-1', 'staff-admin-1', 'MD MAHI UDDIN', 'LOGIN', 'AUTHENTICATION', 'System database initialized with clean production schema and zero demo records.', 'global_settings', '127.0.0.1', 'Hitachi Cloud Management System')
ON DUPLICATE KEY UPDATE `action` = VALUES(`action`);

SET FOREIGN_KEY_CHECKS = 1;
