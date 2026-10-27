-- ==============================================================================
-- JUBAYER MACHINERIES ERP - DEMO SEED DATA
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Insert Initial Staff Users
INSERT INTO `staff_users` (`id`, `name`, `email`, `phone`, `passcode`, `role`, `designation`, `status`, `permissions`) VALUES
('staff-admin-01', 'MD MAHI UDDIN', 'admin@jubayermachineries.com', '01715-994956', '123456', 'ADMIN', 'Managing Director', 'Active', '["view_overview","view_inventory","manage_inventory","view_documents","create_documents","edit_documents","delete_documents","view_reports","view_due_ledger","view_expenses","view_owner_draw","view_field_dispatch","manage_field_dispatch","view_company_profiles","view_staff_management","manage_staff","manage_settings","manage_public_catalog"]'),
('staff-sales-01', 'Atiqur Rahman', 'sales@jubayermachineries.com', '01812-345678', '654321', 'SALESMAN', 'Senior Sales Executive', 'Active', '["view_overview","view_inventory","view_documents","create_documents","view_due_ledger"]');

-- 2. Insert Settings
INSERT INTO `settings` (`id`, `name`, `slogan`, `address`, `phone1`, `phone2`, `email`, `website`, `tax_rate`, `logo_url`, `public_logo_url`, `offer_prefix`, `quote_prefix`, `invoice_prefix`, `bill_prefix`, `terms`, `signature_name`, `signature_label`) VALUES
(1, 'Jubayer Machineries', 'Your Problem Solution is Sustainable Partner', 'Konabari Industrial Zone, Gazipur, Dhaka, Bangladesh', '01715-994956', '01912-345678', 'info@jubayermachineries.com', 'jubayermachineries.com', 0, '', '', 'OFF-', 'QT-', 'INV-', 'BILL-', '1. All prices are net BDT including delivery.\n2. Standard 12-Month warranty applies on machinery.\n3. Goods once sold cannot be returned without prior inspection.', 'MD ZUBAIR HOSSEN', 'Authorized Signatory');

-- 3. Insert Initial Products
INSERT INTO `products` (`id`, `name`, `sku`, `category`, `brand`, `price`, `cost_price`, `stock`, `unit`, `description`, `specs`) VALUES
('prod-1', 'Hitachi Screw Air Compressor 15 HP', 'HIT-15HP-01', 'Air Compressors', 'Hitachi', 450000, 380000, 5, 'Sets', '15 HP High-efficiency rotary screw air compressor designed for continuous industrial operations.', '[{"key":"Power","value":"15 HP (11 kW)"},{"key":"Pressure","value":"0.85 MPa (8.5 Bar)"},{"key":"Flow Rate","value":"1.65 m³/min"}]'),
('prod-2', 'Sullair Industrial Air Dryer 20 HP', 'SUL-DRY-20', 'Air Dryers', 'Sullair', 120000, 95000, 8, 'Pcs', 'Refrigerated compressed air dryer with ultra-low pressure drop and eco-friendly R410a refrigerant.', '[{"key":"Capacity","value":"2.5 m³/min"},{"key":"Refrigerant","value":"R410A Eco"},{"key":"Voltage","value":"220V / 50Hz"}]'),
('prod-3', 'Atlas Copco Oil Filter Element', 'ATL-FLT-88', 'Spare Parts', 'Atlas Copco', 8500, 5500, 25, 'Pcs', 'Genuine spin-on oil filter element for Atlas Copco GA series compressors.', '[{"key":"Part Number","value":"1622 3142 00"},{"key":"Filtration","value":"10 Micron"}]');

-- 4. Insert Initial Customers
INSERT INTO `customers` (`id`, `company_id`, `name`, `company`, `phone`, `email`, `address`, `notes`) VALUES
('cust-1001', 'COMP-1001', 'Engr. Atiqur Rahman', 'Apex Textile & Spinning Mills Ltd.', '01700-112233', 'atiqur@apexspinning.com', 'Plot 42, Konabari Industrial Area, Gazipur', 'Key VIP Client for Hitachi screw compressor spares'),
('cust-1002', 'COMP-1002', 'Mr. Shah Alam', 'Square Pharmaceuticals Ltd.', '01800-445566', 's.alam@squarepharma.org', 'Salna, Gazipur Sadar, Gazipur', 'Quarterly maintenance contract client');

-- 5. Insert Initial Documents (Invoices / Quotations)
INSERT INTO `documents` (`id`, `type`, `doc_number`, `customer_id`, `customer_name`, `customer_company`, `customer_phone`, `customer_email`, `customer_address`, `date`, `items`, `subtotal`, `tax_rate`, `tax_amount`, `discount`, `total`, `paid_amount`, `due_amount`, `status`, `terms`, `notes`) VALUES
('doc-001', 'INVOICE', 'INV-2026-001', 'cust-1001', 'Engr. Atiqur Rahman', 'Apex Textile & Spinning Mills Ltd.', '01700-112233', 'atiqur@apexspinning.com', 'Gazipur', '2026-10-15', '[{"id":"it-1","productId":"prod-1","name":"Hitachi Screw Air Compressor 15 HP","sku":"HIT-15HP-01","brand":"Hitachi","unit":"Sets","quantity":1,"price":450000,"total":450000,"warrantyMonths":12}]', 450000, 0, 0, 0, 450000, 450000, 0, 'Paid', 'Standard 12 Months Warranty Applied', 'Full payment received via Bank Transfer');

SET FOREIGN_KEY_CHECKS = 1;
