-- ==============================================================================
-- JUBAYER MACHINERIES ERP - PRODUCTION DATABASE SCHEMA
-- Compatible with: MySQL 5.7+, MySQL 8.0+, MariaDB (cPanel phpMyAdmin) & PostgreSQL
-- Character Set: utf8mb4 / Unicode
-- Security & Integrity: Foreign Key Constraints, Unique Indices, BCrypt Password Storage
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+06:00";

-- 1. Table: products
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
  UNIQUE KEY `unique_sku` (`sku`),
  KEY `idx_category` (`category`),
  KEY `idx_brand` (`brand`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Table: customers
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
  KEY `idx_customer_company` (`company`),
  KEY `idx_customer_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Table: suppliers
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

-- 4. Table: staff_users
DROP TABLE IF EXISTS `staff_users`;
CREATE TABLE `staff_users` (
  `id` VARCHAR(128) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(100) DEFAULT '',
  `passcode` VARCHAR(255) NOT NULL, -- Stored as BCrypt hash
  `role` VARCHAR(50) NOT NULL DEFAULT 'SALESMAN',
  `designation` VARCHAR(100) DEFAULT '',
  `status` VARCHAR(50) NOT NULL DEFAULT 'Active',
  `permissions` LONGTEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_staff_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Table: purchases
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
  `payment_status` VARCHAR(50) DEFAULT 'Unpaid',
  `payment_method` VARCHAR(50) DEFAULT 'Cash',
  `notes` TEXT,
  `created_at` VARCHAR(100) DEFAULT '',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_purchase_number` (`purchase_number`),
  KEY `idx_purchase_supplier` (`supplier_id`),
  CONSTRAINT `fk_purchase_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Table: documents
DROP TABLE IF EXISTS `documents`;
CREATE TABLE `documents` (
  `id` VARCHAR(128) NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `doc_number` VARCHAR(100) NOT NULL,
  `customer_id` VARCHAR(128) NOT NULL,
  `customer_name` VARCHAR(255) NOT NULL,
  `customer_company` VARCHAR(255) DEFAULT '',
  `customer_phone` VARCHAR(100) DEFAULT '',
  `customer_email` VARCHAR(255) DEFAULT '',
  `customer_address` TEXT,
  `date` VARCHAR(50) NOT NULL,
  `items` LONGTEXT,
  `subtotal` DOUBLE NOT NULL DEFAULT 0,
  `tax_rate` DOUBLE DEFAULT 0,
  `tax_amount` DOUBLE DEFAULT 0,
  `discount` DOUBLE DEFAULT 0,
  `total` DOUBLE NOT NULL DEFAULT 0,
  `paid_amount` DOUBLE DEFAULT 0,
  `due_amount` DOUBLE DEFAULT 0,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Draft',
  `terms` TEXT,
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_doc_number` (`doc_number`),
  KEY `idx_doc_type` (`type`),
  KEY `idx_doc_customer` (`customer_id`),
  CONSTRAINT `fk_doc_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Table: field_dispatches
DROP TABLE IF EXISTS `field_dispatches`;
CREATE TABLE `field_dispatches` (
  `id` VARCHAR(128) NOT NULL,
  `dispatch_number` VARCHAR(100) DEFAULT '',
  `bill_no` VARCHAR(100) DEFAULT '',
  `customer_id` VARCHAR(128) NOT NULL,
  `customer_name` VARCHAR(255) NOT NULL,
  `customer_company` VARCHAR(255) DEFAULT '',
  `customer_phone` VARCHAR(100) DEFAULT '',
  `customer_address` TEXT,
  `staff_id` VARCHAR(128) NOT NULL,
  `staff_name` VARCHAR(255) NOT NULL,
  `dispatch_date` VARCHAR(50) NOT NULL,
  `purpose` TEXT,
  `description` TEXT,
  `bill_amount` DOUBLE NOT NULL DEFAULT 0,
  `expense_amount` DOUBLE NOT NULL DEFAULT 0,
  `paid_amount` DOUBLE NOT NULL DEFAULT 0,
  `due_amount` DOUBLE NOT NULL DEFAULT 0,
  `payment_status` VARCHAR(50) DEFAULT 'Unpaid',
  `status` VARCHAR(50) NOT NULL DEFAULT 'Scheduled',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_dispatch_number` (`dispatch_number`),
  KEY `idx_dispatch_customer` (`customer_id`),
  KEY `idx_dispatch_staff` (`staff_id`),
  CONSTRAINT `fk_dispatch_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_dispatch_staff` FOREIGN KEY (`staff_id`) REFERENCES `staff_users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Table: sales_returns
DROP TABLE IF EXISTS `sales_returns`;
CREATE TABLE `sales_returns` (
  `id` VARCHAR(128) NOT NULL,
  `return_number` VARCHAR(100) NOT NULL,
  `doc_id` VARCHAR(128) DEFAULT '',
  `doc_number` VARCHAR(100) DEFAULT '',
  `customer_id` VARCHAR(128) NOT NULL,
  `customer_name` VARCHAR(255) NOT NULL,
  `customer_company` VARCHAR(255) DEFAULT '',
  `customer_phone` VARCHAR(100) DEFAULT '',
  `product_id` VARCHAR(128) NOT NULL,
  `product_name` VARCHAR(255) NOT NULL,
  `sku` VARCHAR(100) DEFAULT '',
  `brand` VARCHAR(100) DEFAULT '',
  `unit` VARCHAR(50) DEFAULT 'Pcs',
  `quantity` INT NOT NULL DEFAULT 1,
  `unit_price` DOUBLE NOT NULL DEFAULT 0,
  `total_return_amount` DOUBLE NOT NULL DEFAULT 0,
  `refund_amount` DOUBLE NOT NULL DEFAULT 0,
  `deduct_from_due` TINYINT(1) DEFAULT 1,
  `restock_to_inventory` TINYINT(1) DEFAULT 1,
  `reason` TEXT,
  `notes` TEXT,
  `return_date` VARCHAR(50) NOT NULL,
  `created_at` VARCHAR(100) DEFAULT '',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_return_number` (`return_number`),
  KEY `idx_return_customer` (`customer_id`),
  KEY `idx_return_product` (`product_id`),
  CONSTRAINT `fk_return_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_return_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Table: expenses
DROP TABLE IF EXISTS `expenses`;
CREATE TABLE `expenses` (
  `id` VARCHAR(128) NOT NULL,
  `expense_number` VARCHAR(100) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `amount` DOUBLE NOT NULL DEFAULT 0,
  `date` VARCHAR(50) NOT NULL,
  `recorded_by` VARCHAR(255) DEFAULT 'Admin',
  `staff_id` VARCHAR(128) DEFAULT NULL,
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_expense_number` (`expense_number`),
  KEY `idx_expense_staff` (`staff_id`),
  KEY `idx_expense_date` (`date`),
  KEY `idx_expense_category` (`category`),
  CONSTRAINT `fk_expense_staff` FOREIGN KEY (`staff_id`) REFERENCES `staff_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Table: settings
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
  `tax_rate` DOUBLE DEFAULT 0,
  `logo_url` LONGTEXT,
  `public_logo_url` LONGTEXT,
  `watermark_url` LONGTEXT,
  `show_watermark` TINYINT(1) DEFAULT 1,
  `offer_prefix` VARCHAR(50) DEFAULT 'OFF-',
  `quote_prefix` VARCHAR(50) DEFAULT 'QT-',
  `invoice_prefix` VARCHAR(50) DEFAULT 'INV-',
  `bill_prefix` VARCHAR(50) DEFAULT 'BILL-',
  `terms` TEXT,
  `signature_name` VARCHAR(255) DEFAULT '',
  `signature_label` VARCHAR(255) DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
INSERT INTO products (id, name, sku, category, brand, price, costPrice, stock, unit, description, specs, imageUrl) VALUES ('prod-test-1', 'Hitachi 2000H Maintenance Service Kit', 'HIT-MK-2000', 'Service Kit', 'Hitachi', 45000, 32000, 15, 'Set', '', '[]', '') ON CONFLICT DO NOTHING;
DELETE FROM products WHERE id = 'prod-test-1';
