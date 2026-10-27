-- ==============================================================================
-- JUBAYER MACHINERIES ERP - FULL RECOVERY DUMP FOR CPANEL (PHPMYADMIN)
-- Generated: 2026-10-27T15:38:51.682Z
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+06:00";

DROP TABLE IF EXISTS `settings`;
CREATE TABLE `settings` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `slogan` VARCHAR(255) DEFAULT "",
  `address` TEXT,
  `phone1` VARCHAR(100) DEFAULT "",
  `phone2` VARCHAR(100) DEFAULT "",
  `email` VARCHAR(255) DEFAULT "",
  `website` VARCHAR(255) DEFAULT "",
  `invoice_prefix` VARCHAR(50) DEFAULT "JM/INV/2026/",
  `quote_prefix` VARCHAR(50) DEFAULT "JM/QT/2026/",
  `offer_prefix` VARCHAR(50) DEFAULT "JM/OF/2026/",
  `bill_prefix` VARCHAR(50) DEFAULT "JM/BILL/2026/",
  `challan_prefix` VARCHAR(50) DEFAULT "JM/CH/2026/",
  `tax_rate` DOUBLE DEFAULT 0,
  `terms` TEXT,
  `signature_name` VARCHAR(255) DEFAULT "",
  `signature_label` VARCHAR(255) DEFAULT "",
  `logo_url` LONGTEXT,
  `public_logo_url` LONGTEXT,
  `watermark_url` LONGTEXT,
  `favicon_url` LONGTEXT,
  `watermark_opacity` DOUBLE DEFAULT 0.04,
  `show_watermark` INT DEFAULT 1,
  `whatsapp` VARCHAR(100) DEFAULT "",
  `messenger_url` VARCHAR(255) DEFAULT "",
  `facebook_url` VARCHAR(255) DEFAULT "",
  `telegram_url` VARCHAR(255) DEFAULT "",
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `settings` (`id`, `name`, `slogan`, `address`, `phone1`, `phone2`, `email`, `website`, `invoice_prefix`, `quote_prefix`, `offer_prefix`, `bill_prefix`, `challan_prefix`, `tax_rate`, `terms`, `signature_name`, `signature_label`, `whatsapp`, `messenger_url`, `facebook_url`, `telegram_url`) VALUES ('global_settings', 'Jubayer Machineries', 'Your Problem Solution is Sustainable Partner', 'Hazi Siddik Complex, Molla Market, Bason Sharok, Gazipur City.', '01715-994956', '01799-498199', 'jubayermachineries@gmail.com', 'www.hitachiairsolutioncenter.com', 'JM/INV/2026/', 'JM/QT/2026/', 'JM/OF/2026/', 'JM/BILL/2026/', 'JM/CH/2026/', 5, '1. Delivery: Within 7 working days upon receipt of work order.
2. Payment: 50% advance with work order & 50% upon delivery.
3. Warranty: 1 Year comprehensive brand warranty.
4. Validity of this offer is 30 days.', 'MD MAHI UDDIN', 'Managing Director', '01715-994956', 'https://m.me/hitachiairsolutioncenter', 'https://www.facebook.com/hitachiairsolutioncenter', 'https://t.me/hitachiairsolution') ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

DROP TABLE IF EXISTS `staff_users`;
CREATE TABLE `staff_users` (
  `id` VARCHAR(128) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(100) DEFAULT "",
  `passcode` VARCHAR(100) NOT NULL DEFAULT "123456",
  `role` VARCHAR(50) NOT NULL DEFAULT "Staff",
  `designation` VARCHAR(100) DEFAULT "",
  `status` VARCHAR(50) NOT NULL DEFAULT "Active",
  `permissions` LONGTEXT,
  `created_at` VARCHAR(50) DEFAULT ""
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `staff_users` (`id`, `name`, `email`, `phone`, `passcode`, `role`, `designation`, `status`, `permissions`, `created_at`) VALUES ('staff-admin-1', 'MD MAHI UDDIN', 'mahi@hitachiairsolutioncenter.com', '01715-994956', 'admin123', 'ADMIN', 'Managing Director & Owner', 'Active', '["view_overview","manage_public_catalog","view_inventory","manage_inventory","view_purchases","manage_purchases","view_customers","manage_customers","view_documents","create_documents","edit_documents","delete_documents","view_due_ledger","manage_due_ledger","view_expenses","manage_expenses","view_owner_draw","manage_owner_draw","view_field_dispatch","manage_field_dispatch","view_reports","manage_settings","view_staff_management"]', '2026-01-01') ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);
INSERT INTO `staff_users` (`id`, `name`, `email`, `phone`, `passcode`, `role`, `designation`, `status`, `permissions`, `created_at`) VALUES ('staff-mgr-1', 'Kamrul Hasan', 'kamrul@hitachiairsolutioncenter.com', '01799-498199', 'mgr123', 'MANAGER', 'Operations Manager', 'Active', '["view_overview","view_inventory","manage_inventory","view_customers","manage_customers","view_documents","create_documents","edit_documents","view_due_ledger","manage_due_ledger","view_reports"]', '2026-01-15') ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);
INSERT INTO `staff_users` (`id`, `name`, `email`, `phone`, `passcode`, `role`, `designation`, `status`, `permissions`, `created_at`) VALUES ('staff-sales-1', 'Engr. Rafiqul Islam', 'rafiq@hitachiairsolutioncenter.com', '01812-334455', 'sales123', 'SALESMAN', 'Senior Sales Executive', 'Active', '["view_overview","view_inventory","view_customers","manage_customers","view_documents","create_documents","view_due_ledger"]', '2026-02-01') ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);
INSERT INTO `staff_users` (`id`, `name`, `email`, `phone`, `passcode`, `role`, `designation`, `status`, `permissions`, `created_at`) VALUES ('staff-store-1', 'Tarikul Tanvir', 'store@hitachiairsolutioncenter.com', '01911-223344', 'staff123', 'STAFF', 'Store & Inventory Keeper', 'Active', '["view_inventory","manage_inventory","view_documents"]', '2026-02-10') ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
  `id` VARCHAR(128) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `sku` VARCHAR(100) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `brand` VARCHAR(100) NOT NULL,
  `price` DOUBLE NOT NULL DEFAULT 0,
  `cost_price` DOUBLE NOT NULL DEFAULT 0,
  `stock` INT NOT NULL DEFAULT 0,
  `unit` VARCHAR(50) NOT NULL DEFAULT "Pcs",
  `description` TEXT,
  `specs` LONGTEXT,
  `image_url` LONGTEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `products` (`id`, `name`, `sku`, `category`, `brand`, `price`, `cost_price`, `stock`, `unit`, `description`, `specs`, `image_url`) VALUES ('prod-1', 'Hitachi Screw Air Compressor 15 HP', 'HIT-15HP-01', 'Screw Air Compressor', 'Hitachi', 450000, 380000, 5, 'Sets', '15 HP High-efficiency rotary screw air compressor designed for continuous industrial operations.', '[{"label":"Power","value":"15 HP (11 kW)"},{"label":"Pressure","value":"0.85 MPa (8.5 Bar)"},{"label":"Flow Rate","value":"1.65 m³/min"}]', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80') ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);
INSERT INTO `products` (`id`, `name`, `sku`, `category`, `brand`, `price`, `cost_price`, `stock`, `unit`, `description`, `specs`, `image_url`) VALUES ('prod-2', 'Sullair Industrial Air Dryer 20 HP', 'SUL-DRY-20', 'Air Dryer', 'Sullair', 120000, 95000, 8, 'Pcs', 'Refrigerated compressed air dryer with ultra-low pressure drop and eco-friendly R410a refrigerant.', '[{"label":"Capacity","value":"2.5 m³/min"},{"label":"Refrigerant","value":"R410A Eco"},{"label":"Voltage","value":"220V / 50Hz"}]', 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80') ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);
INSERT INTO `products` (`id`, `name`, `sku`, `category`, `brand`, `price`, `cost_price`, `stock`, `unit`, `description`, `specs`, `image_url`) VALUES ('prod-3', 'Atlas Copco Oil Filter Element', 'ATL-FLT-88', 'Spare Parts', 'Atlas Copco', 8500, 5500, 25, 'Pcs', 'Genuine spin-on oil filter element for Atlas Copco GA series compressors.', '[{"label":"Part Number","value":"1622 3142 00"},{"label":"Filtration","value":"10 Micron"}]', 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=800&q=80') ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

DROP TABLE IF EXISTS `customers`;
CREATE TABLE `customers` (
  `id` VARCHAR(128) NOT NULL PRIMARY KEY,
  `company_id` VARCHAR(100) DEFAULT "",
  `name` VARCHAR(255) NOT NULL,
  `company` VARCHAR(255) DEFAULT "",
  `phone` VARCHAR(100) DEFAULT "",
  `email` VARCHAR(255) DEFAULT "",
  `address` TEXT,
  `notes` TEXT,
  `created_at` VARCHAR(50) DEFAULT ""
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `customers` (`id`, `company_id`, `name`, `company`, `phone`, `email`, `address`, `notes`, `created_at`) VALUES ('cust_1790958174665_krgb', 'COMP-1001', 'test', 'test', '01840684615', 'tanvierul@gmail.com', '', 'Website Contact Inquiry: vvvvv', '2026-10-02T16:22:55.493Z') ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);
INSERT INTO `customers` (`id`, `company_id`, `name`, `company`, `phone`, `email`, `address`, `notes`, `created_at`) VALUES ('cust_1791015181330_njq8', 'COMP-1002', 'শিউলী আক্তার', 'শিউলী আক্তার', '01753459755', 'mst.sheulyakter21@gmail.com', '', 'Website Contact Inquiry: fdfff', '2026-10-03T08:13:01.392Z') ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);
INSERT INTO `customers` (`id`, `company_id`, `name`, `company`, `phone`, `email`, `address`, `notes`, `created_at`) VALUES ('cust-1001', 'COMP-1001', 'Engr. Atiqur Rahman', 'Apex Textile & Spinning Mills Ltd.', '01700-112233', 'atiqur@apexspinning.com', 'Plot 42, Konabari Industrial Area, Gazipur', 'Key VIP Client for Hitachi screw compressor spares', NULL) ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);
INSERT INTO `customers` (`id`, `company_id`, `name`, `company`, `phone`, `email`, `address`, `notes`, `created_at`) VALUES ('cust-1002', 'COMP-1002', 'Mr. Shah Alam', 'Square Pharmaceuticals Ltd.', '01800-445566', 's.alam@squarepharma.org', 'Salna, Gazipur Sadar, Gazipur', 'Quarterly maintenance contract client', NULL) ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

DROP TABLE IF EXISTS `documents`;
CREATE TABLE `documents` (
  `id` VARCHAR(128) NOT NULL PRIMARY KEY,
  `type` VARCHAR(50) NOT NULL,
  `doc_number` VARCHAR(100) NOT NULL,
  `date` VARCHAR(50) NOT NULL,
  `due_date` VARCHAR(50) DEFAULT NULL,
  `customer_id` VARCHAR(128) NOT NULL,
  `customer_name` VARCHAR(255) NOT NULL,
  `customer_company` VARCHAR(255) DEFAULT "",
  `customer_phone` VARCHAR(100) DEFAULT "",
  `customer_email` VARCHAR(255) DEFAULT "",
  `customer_address` TEXT,
  `subject` VARCHAR(255) DEFAULT "",
  `salutation` VARCHAR(100) DEFAULT "Dear Sir,",
  `opening_paragraph` TEXT,
  `closing_paragraph` TEXT,
  `items` LONGTEXT NOT NULL,
  `subtotal` DOUBLE NOT NULL DEFAULT 0,
  `tax_rate` DOUBLE DEFAULT 0,
  `tax_amount` DOUBLE DEFAULT 0,
  `discount` DOUBLE DEFAULT 0,
  `total` DOUBLE NOT NULL DEFAULT 0,
  `paid_amount` DOUBLE DEFAULT 0,
  `due_amount` DOUBLE DEFAULT 0,
  `status` VARCHAR(50) NOT NULL DEFAULT "Active",
  `terms` TEXT,
  `notes` TEXT,
  `signature_label` VARCHAR(255) DEFAULT "Managing Director",
  `signature_name` VARCHAR(255) DEFAULT "MD MAHI UDDIN",
  `vat_enabled` INT DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `documents` (`id`, `type`, `doc_number`, `date`, `due_date`, `customer_id`, `customer_name`, `customer_company`, `customer_phone`, `customer_email`, `customer_address`, `subject`, `salutation`, `opening_paragraph`, `closing_paragraph`, `items`, `subtotal`, `tax_rate`, `tax_amount`, `discount`, `total`, `paid_amount`, `due_amount`, `status`, `terms`, `notes`, `signature_label`, `signature_name`, `vat_enabled`) VALUES ('doc-1791868437684', 'INVOICE', 'HSC/INV/2026/1826', '2026-10-13', '2026-11-13', 'cust_1791015181330_njq8', 'শিউলী আক্তার', 'শিউলী আক্তার', '01753459755', 'mst.sheulyakter21@gmail.com', '', 'Sales Invoice for Delivery Challan JM/CH/2026/7353', 'Dear Sir,', 'Please find our commercial sales invoice for the supplied machinery, spare parts, and associated services.', 'Thank you for your business. Please settle the invoice as per the agreed payment terms.', '[{"id":"item-1791125456640-0.19139627648557878","name":"ff","unit":"Pcs","brand":"ffd","price":100,"total":100,"quantity":1,"productId":""}]', 100, 0, 0, 0, 100, 0, 100, 'Unpaid', '1. Delivery: Within 7 working days upon receipt of work order.
2. Payment: 50% advance with work order & 50% upon delivery.
3. Warranty: 1 Year comprehensive brand warranty.
4. Validity of this offer is 30 days.', 'Generated against Delivery Challan: JM/CH/2026/7353', 'Managing Director & Owner', 'MD MAHI UDDIN', 0) ON DUPLICATE KEY UPDATE `doc_number`=VALUES(`doc_number`);
INSERT INTO `documents` (`id`, `type`, `doc_number`, `date`, `due_date`, `customer_id`, `customer_name`, `customer_company`, `customer_phone`, `customer_email`, `customer_address`, `subject`, `salutation`, `opening_paragraph`, `closing_paragraph`, `items`, `subtotal`, `tax_rate`, `tax_amount`, `discount`, `total`, `paid_amount`, `due_amount`, `status`, `terms`, `notes`, `signature_label`, `signature_name`, `vat_enabled`) VALUES ('doc-1791125466306', 'CHALLAN', 'JM/CH/2026/7353', '2026-10-04', '', 'cust_1791015181330_njq8', 'শিউলী আক্তার', 'শিউলী আক্তার', '01753459755', 'mst.sheulyakter21@gmail.com', '', '', 'Dear Sir,', '', '', '[{"id":"item-1791125456640-0.19139627648557878","name":"ff","unit":"Pcs","brand":"ffd","price":100,"total":100,"quantity":1,"productId":""}]', 100, 5, 5, 0, 105, 0, 105, 'Active', '1. Delivery: Within 7 working days upon receipt of work order.
2. Payment: 50% advance with work order & 50% upon delivery.
3. Warranty: 1 Year comprehensive brand warranty.
4. Validity of this offer is 30 days.', '', 'Managing Director', 'MD MAHI UDDIN', 1) ON DUPLICATE KEY UPDATE `doc_number`=VALUES(`doc_number`);

DROP TABLE IF EXISTS `catalog_products`;
CREATE TABLE `catalog_products` (
  `id` VARCHAR(128) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `brand` VARCHAR(100) NOT NULL,
  `price` DOUBLE NOT NULL DEFAULT 0,
  `call_for_price` INT NOT NULL DEFAULT 0,
  `badge` VARCHAR(100) DEFAULT "",
  `description` TEXT,
  `specs` LONGTEXT,
  `image_url` LONGTEXT,
  `status` VARCHAR(50) NOT NULL DEFAULT "active",
  `display_order` INT NOT NULL DEFAULT 0,
  `created_at` VARCHAR(50) DEFAULT ""
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `catalog_products` (`id`, `name`, `category`, `brand`, `price`, `call_for_price`, `badge`, `description`, `specs`, `image_url`, `status`, `display_order`, `created_at`) VALUES ('cat-hitachi-osp-22', 'Hitachi OSP-22M5ARN 22kW (30HP) Rotary Screw Air Compressor', 'Screw Air Compressor', 'Hitachi', 1250000, 1, 'Best Seller', 'High-performance oil-flooded rotary screw air compressor engineered for 24/7 continuous industrial production with low noise, superior energy efficiency, and intelligent digital microprocessor monitoring.', '[{"label":"Motor Power","value":"22 kW (30 HP)"},{"label":"Working Pressure","value":"7.5 ~ 8.5 Bar (0.75 ~ 0.85 MPa)"},{"label":"Air Delivery (FAD)","value":"3.7 m³/min"},{"label":"Cooling Method","value":"High Efficiency Air Cooled"},{"label":"Drive Mechanism","value":"Direct Gear / High-Precision Rotor"},{"label":"Warranty","value":"2 Years Comprehensive Warranty"}]', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80', 'active', 1, '2026-01-01') ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);
INSERT INTO `catalog_products` (`id`, `name`, `category`, `brand`, `price`, `call_for_price`, `badge`, `description`, `specs`, `image_url`, `status`, `display_order`, `created_at`) VALUES ('cat-hitachi-osp-37-vsd', 'Hitachi OSP-37V5ARN Variable Speed (VSD) Inverter Screw Compressor', 'Screw Air Compressor', 'Hitachi', 1850000, 1, 'Energy Saver (VSD)', 'Hitachi Next Series VSD inverter rotary screw air compressor. Saves up to 35% electrical power by dynamically matching motor speed to actual factory compressed air demand.', '[{"label":"Motor Power","value":"37 kW (50 HP) Inverter Driven"},{"label":"Working Pressure","value":"7.0 ~ 10.0 Bar Adjustable"},{"label":"Air Delivery (FAD)","value":"1.5 ~ 6.5 m³/min Variable"},{"label":"Power Savings","value":"Up to 35% energy reduction"},{"label":"Controller","value":"Hitachi Smart Touch Digital Panel"}]', 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80', 'active', 2, '2026-01-05') ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);
INSERT INTO `catalog_products` (`id`, `name`, `category`, `brand`, `price`, `call_for_price`, `badge`, `description`, `specs`, `image_url`, `status`, `display_order`, `created_at`) VALUES ('cat-hitachi-hd-30-dryer', 'Hitachi Heavy-Duty Refrigerated Air Dryer (HD-30 Series)', 'Air Dryer', 'Hitachi', 260000, 1, 'Featured', 'Industrial refrigerated compressed air dryer engineered to eliminate moisture, condensate, and water droplets from compressed air lines to safeguard factory machinery and pneumatic tools.', '[{"label":"Flow Capacity","value":"4.5 m³/min"},{"label":"Pressure Dew Point","value":"3°C ~ 10°C (37°F ~ 50°F)"},{"label":"Refrigerant","value":"Eco-Friendly R410A / R134a"},{"label":"Max Inlet Temp","value":"65°C"},{"label":"Condensate Drain","value":"Zero Air Loss Automatic Drain"}]', 'https://images.unsplash.com/photo-1615873968403-89e068629265?auto=format&fit=crop&w=800&q=80', 'active', 3, '2026-01-10') ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);
INSERT INTO `catalog_products` (`id`, `name`, `category`, `brand`, `price`, `call_for_price`, `badge`, `description`, `specs`, `image_url`, `status`, `display_order`, `created_at`) VALUES ('cat-hitachi-line-filters', 'Hitachi High-Efficiency Precision Line Filters (Pre & Micro Filter)', 'Line Filter', 'Hitachi', 45000, 1, 'High Filtration', 'High-efficiency industrial in-line compressed air filter housings with multi-layer microglass filter cartridges. Removes solid particulates, scale, rust, and residual oil aerosols.', '[{"label":"Filtration Accuracy","value":"0.01 Micron Particulate / 0.01 mg/m³ Oil"},{"label":"Rated Air Flow","value":"5.2 m³/min"},{"label":"Operating Pressure","value":"Up to 16 Bar"},{"label":"Differential Gauge","value":"Integrated Pressure Drop Indicator"}]', 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=800&q=80', 'active', 4, '2026-01-15') ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);
INSERT INTO `catalog_products` (`id`, `name`, `category`, `brand`, `price`, `call_for_price`, `badge`, `description`, `specs`, `image_url`, `status`, `display_order`, `created_at`) VALUES ('cat-hitachi-spare-separator', 'Hitachi Genuine Air/Oil Separator Element & Air Filter Kit', 'Spare Parts', 'Hitachi', 58000, 1, '100% Genuine OEM', 'Original OEM spin-on and flange separator elements, intake air filters, and oil filters designed specifically for Hitachi OSP and DSP series screw air compressors.', '[{"label":"Compatibility","value":"Hitachi OSP 15/22/37/55/75 kW Series"},{"label":"Residual Oil Content","value":"< 2 ppm (parts per million)"},{"label":"Service Life","value":"3,000 ~ 4,000 Running Hours"},{"label":"Filter Media","value":"Borosilicate Glass Microfiber"}]', 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80', 'active', 5, '2026-01-20') ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);
INSERT INTO `catalog_products` (`id`, `name`, `category`, `brand`, `price`, `call_for_price`, `badge`, `description`, `specs`, `image_url`, `status`, `display_order`, `created_at`) VALUES ('cat-hitachi-oil-2000', 'Hitachi New Hiscrew Oil 2000 (Synthetic Lubricant - 20L Pail)', 'Compressor Lubricant', 'Hitachi', 38500, 1, 'Japanese OEM', 'Genuine factory-formulated synthetic screw compressor oil. Delivers superior anti-oxidation, minimal varnish formation, and 2-year / 6,000-hour extended drain interval.', '[{"label":"Package Size","value":"20 Liters Metal Pail"},{"label":"Viscosity Grade","value":"ISO VG 32 Synthetic Base"},{"label":"Drain Interval","value":"6,000 Hours or 2 Years"},{"label":"Origin","value":"Manufactured by Hitachi Japan"}]', 'https://images.unsplash.com/photo-1545259741-2ea3ebf61fa3?auto=format&fit=crop&w=800&q=80', 'active', 6, '2026-01-22') ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

DROP TABLE IF EXISTS `field_dispatches`;
CREATE TABLE `field_dispatches` (
  `id` VARCHAR(128) NOT NULL PRIMARY KEY,
  `dispatch_number` VARCHAR(100) NOT NULL,
  `date` VARCHAR(50) NOT NULL,
  `staff_id` VARCHAR(128) DEFAULT "",
  `staff_name` VARCHAR(255) DEFAULT "",
  `customer_id` VARCHAR(128) DEFAULT "",
  `customer_name` VARCHAR(255) DEFAULT "",
  `customer_company` VARCHAR(255) DEFAULT "",
  `address` TEXT,
  `phone` VARCHAR(100) DEFAULT "",
  `purpose` TEXT,
  `status` VARCHAR(50) NOT NULL DEFAULT "Completed",
  `items` LONGTEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `suppliers`;
CREATE TABLE `suppliers` (
  `id` VARCHAR(128) NOT NULL PRIMARY KEY,
  `supplier_code` VARCHAR(100) DEFAULT "",
  `name` VARCHAR(255) NOT NULL,
  `company` VARCHAR(255) DEFAULT "",
  `phone` VARCHAR(100) DEFAULT "",
  `email` VARCHAR(255) DEFAULT "",
  `address` TEXT,
  `created_at` VARCHAR(50) DEFAULT ""
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `purchases`;
CREATE TABLE `purchases` (
  `id` VARCHAR(128) NOT NULL PRIMARY KEY,
  `purchase_number` VARCHAR(100) NOT NULL,
  `date` VARCHAR(50) NOT NULL,
  `supplier_id` VARCHAR(128) NOT NULL,
  `supplier_name` VARCHAR(255) NOT NULL,
  `items` LONGTEXT NOT NULL,
  `subtotal` DOUBLE DEFAULT 0,
  `grand_total` DOUBLE DEFAULT 0,
  `paid_amount` DOUBLE DEFAULT 0,
  `due_amount` DOUBLE DEFAULT 0,
  `status` VARCHAR(50) DEFAULT "Received"
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `sales_returns`;
CREATE TABLE `sales_returns` (
  `id` VARCHAR(128) NOT NULL PRIMARY KEY,
  `return_number` VARCHAR(100) NOT NULL,
  `return_date` VARCHAR(50) NOT NULL,
  `original_doc_number` VARCHAR(100) DEFAULT "",
  `customer_name` VARCHAR(255) NOT NULL,
  `product_name` VARCHAR(255) NOT NULL,
  `quantity` INT DEFAULT 1,
  `unit` VARCHAR(50) DEFAULT "Pcs",
  `refund_amount` DOUBLE DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `expenses`;
CREATE TABLE `expenses` (
  `id` VARCHAR(128) NOT NULL PRIMARY KEY,
  `expense_number` VARCHAR(100) NOT NULL,
  `date` VARCHAR(50) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `amount` DOUBLE NOT NULL DEFAULT 0,
  `payment_method` VARCHAR(50) DEFAULT "Cash"
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
