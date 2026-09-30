<?php
// ========================================================
// cPanel Native PHP API Router for Hitachi Solution Center
// Handles GET, POST, DELETE for products, customers, documents, staff, settings
// ========================================================

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if (file_exists(__DIR__ . '/config.php')) {
    require_once __DIR__ . '/config.php';
}

$pdo = function_exists('getDbConnection') ? getDbConnection() : null;

// Parse request URI
$requestUri = $_SERVER['REQUEST_URI'] ?? '';
$uriPath = parse_url($requestUri, PHP_URL_PATH) ?? '';

// Determine endpoint and ID
$endpoint = isset($_GET['endpoint']) ? trim($_GET['endpoint']) : '';
$id = isset($_GET['id']) ? trim($_GET['id']) : null;

if (empty($endpoint)) {
    $pathSegments = array_values(array_filter(explode('/', $uriPath)));
    $apiIndex = array_search('api', $pathSegments);
    if ($apiIndex !== false) {
        $seg1 = isset($pathSegments[$apiIndex + 1]) ? $pathSegments[$apiIndex + 1] : '';
        if ($seg1 !== 'index.php') {
            $endpoint = $seg1;
            $id = isset($pathSegments[$apiIndex + 2]) ? $pathSegments[$apiIndex + 2] : null;
        }
    }
}

// Special Health / Ping endpoint returns helpful DB status
if ($endpoint === 'health' || $endpoint === 'ping') {
    if ($pdo === null) {
        http_response_code(200);
        echo json_encode([
            'status' => 'db_config_required',
            'connected' => false,
            'message' => 'Please configure your MySQL database credentials in api/config.php',
            'hint' => 'Check DB_NAME, DB_USER, DB_PASS in api/config.php',
            'test_url' => '/api/test_db.php'
        ]);
        exit;
    }
}

if ($pdo === null && !empty($endpoint)) {
    http_response_code(200);
    echo json_encode([
        'error' => 'Database connection is not established. Please check api/config.php credentials.',
        'db_configured' => false,
        'diagnostic_tool' => '/api/test_db.php'
    ]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$inputData = json_decode(file_get_contents('php://input'), true) ?? [];

try {
    switch ($endpoint) {
        // ----------------------------------------------------
        // 1. PRODUCTS API
        // ----------------------------------------------------
        case 'products':
            if ($method === 'GET') {
                $stmt = $pdo->query("SELECT * FROM products ORDER BY name ASC");
                $rows = $stmt->fetchAll();
                foreach ($rows as &$r) {
                    $r['price'] = (float)$r['price'];
                    $r['stock'] = (int)$r['stock'];
                    $r['specs'] = json_decode($r['specs'] ?? '[]', true);
                    $r['imageUrl'] = $r['image_url'] ?? '';
                    unset($r['image_url'], $r['updated_at']);
                }
                echo json_encode($rows);
            } elseif ($method === 'POST') {
                $idVal = $inputData['id'] ?? null;
                if (!$idVal) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Missing product ID']);
                    exit;
                }
                $stmt = $pdo->prepare("
                    INSERT INTO products (id, name, sku, category, brand, price, stock, unit, description, specs, image_url)
                    VALUES (:id, :name, :sku, :category, :brand, :price, :stock, :unit, :description, :specs, :image_url)
                    ON DUPLICATE KEY UPDATE
                        name = VALUES(name), sku = VALUES(sku), category = VALUES(category),
                        brand = VALUES(brand), price = VALUES(price), stock = VALUES(stock),
                        unit = VALUES(unit), description = VALUES(description),
                        specs = VALUES(specs), image_url = VALUES(image_url)
                ");
                $stmt->execute([
                    ':id' => $idVal,
                    ':name' => $inputData['name'] ?? '',
                    ':sku' => $inputData['sku'] ?? '',
                    ':category' => $inputData['category'] ?? '',
                    ':brand' => $inputData['brand'] ?? '',
                    ':price' => (float)($inputData['price'] ?? 0),
                    ':stock' => (int)($inputData['stock'] ?? 0),
                    ':unit' => $inputData['unit'] ?? 'Pcs',
                    ':description' => $inputData['description'] ?? '',
                    ':specs' => json_encode($inputData['specs'] ?? []),
                    ':image_url' => $inputData['imageUrl'] ?? $inputData['image_url'] ?? '',
                ]);
                echo json_encode($inputData);
            } elseif ($method === 'DELETE') {
                if (!$id) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Missing ID parameter']);
                    exit;
                }
                $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
                $stmt->execute([$id]);
                echo json_encode(['success' => true]);
            }
            break;

        // ----------------------------------------------------
        // 2. CUSTOMERS API
        // ----------------------------------------------------
        case 'customers':
            if ($method === 'GET') {
                $stmt = $pdo->query("SELECT * FROM customers ORDER BY name ASC");
                $rows = $stmt->fetchAll();
                foreach ($rows as &$r) {
                    unset($r['updated_at']);
                }
                echo json_encode($rows);
            } elseif ($method === 'POST') {
                $idVal = $inputData['id'] ?? null;
                if (!$idVal) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Missing customer ID']);
                    exit;
                }
                $stmt = $pdo->prepare("
                    INSERT INTO customers (id, name, company, phone, email, address)
                    VALUES (:id, :name, :company, :phone, :email, :address)
                    ON DUPLICATE KEY UPDATE
                        name = VALUES(name), company = VALUES(company), phone = VALUES(phone),
                        email = VALUES(email), address = VALUES(address)
                ");
                $stmt->execute([
                    ':id' => $idVal,
                    ':name' => $inputData['name'] ?? '',
                    ':company' => $inputData['company'] ?? '',
                    ':phone' => $inputData['phone'] ?? '',
                    ':email' => $inputData['email'] ?? '',
                    ':address' => $inputData['address'] ?? '',
                ]);
                echo json_encode($inputData);
            } elseif ($method === 'DELETE') {
                if (!$id) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Missing ID parameter']);
                    exit;
                }
                $stmt = $pdo->prepare("DELETE FROM customers WHERE id = ?");
                $stmt->execute([$id]);
                echo json_encode(['success' => true]);
            }
            break;

        // ----------------------------------------------------
        // 3. DOCUMENTS API
        // ----------------------------------------------------
        case 'documents':
            if ($method === 'GET') {
                $stmt = $pdo->query("SELECT * FROM documents ORDER BY date DESC");
                $rows = $stmt->fetchAll();
                foreach ($rows as &$r) {
                    $r['docNumber'] = $r['doc_number'];
                    $r['dueDate'] = $r['due_date'];
                    $r['customerId'] = $r['customer_id'];
                    $r['customerName'] = $r['customer_name'];
                    $r['customerCompany'] = $r['customer_company'];
                    $r['customerPhone'] = $r['customer_phone'];
                    $r['customerEmail'] = $r['customer_email'];
                    $r['customerAddress'] = $r['customer_address'];
                    $r['openingParagraph'] = $r['opening_paragraph'];
                    $r['closingParagraph'] = $r['closing_paragraph'];
                    $r['items'] = json_decode($r['items'] ?? '[]', true);
                    $r['subtotal'] = (float)$r['subtotal'];
                    $r['taxRate'] = (float)$r['tax_rate'];
                    $r['taxAmount'] = (float)$r['tax_amount'];
                    $r['discount'] = (float)$r['discount'];
                    $r['total'] = (float)$r['total'];
                    $r['paidAmount'] = (float)$r['paid_amount'];
                    $r['dueAmount'] = (float)$r['due_amount'];
                    $r['signatureLabel'] = $r['signature_label'];
                    $r['signatureName'] = $r['signature_name'];

                    unset(
                        $r['doc_number'], $r['due_date'], $r['customer_id'], $r['customer_name'],
                        $r['customer_company'], $r['customer_phone'], $r['customer_email'], $r['customer_address'],
                        $r['opening_paragraph'], $r['closing_paragraph'], $r['subtotal'], $r['tax_rate'],
                        $r['tax_amount'], $r['discount'], $r['paid_amount'], $r['due_amount'],
                        $r['signature_label'], $r['signature_name'], $r['updated_at']
                    );
                }
                echo json_encode($rows);
            } elseif ($method === 'POST') {
                $idVal = $inputData['id'] ?? null;
                if (!$idVal) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Missing document ID']);
                    exit;
                }
                $stmt = $pdo->prepare("
                    INSERT INTO documents (
                        id, type, doc_number, date, due_date, customer_id, customer_name, customer_company,
                        customer_phone, customer_email, customer_address, subject, salutation, opening_paragraph,
                        closing_paragraph, items, subtotal, tax_rate, tax_amount, discount, total, paid_amount,
                        due_amount, status, terms, notes, signature_label, signature_name
                    ) VALUES (
                        :id, :type, :doc_number, :date, :due_date, :customer_id, :customer_name, :customer_company,
                        :customer_phone, :customer_email, :customer_address, :subject, :salutation, :opening_paragraph,
                        :closing_paragraph, :items, :subtotal, :tax_rate, :tax_amount, :discount, :total, :paid_amount,
                        :due_amount, :status, :terms, :notes, :signature_label, :signature_name
                    ) ON DUPLICATE KEY UPDATE
                        type = VALUES(type), doc_number = VALUES(doc_number), date = VALUES(date), due_date = VALUES(due_date),
                        customer_id = VALUES(customer_id), customer_name = VALUES(customer_name), customer_company = VALUES(customer_company),
                        customer_phone = VALUES(customer_phone), customer_email = VALUES(customer_email), customer_address = VALUES(customer_address),
                        subject = VALUES(subject), salutation = VALUES(salutation), opening_paragraph = VALUES(opening_paragraph),
                        closing_paragraph = VALUES(closing_paragraph), items = VALUES(items), subtotal = VALUES(subtotal),
                        tax_rate = VALUES(tax_rate), tax_amount = VALUES(tax_amount), discount = VALUES(discount),
                        total = VALUES(total), paid_amount = VALUES(paid_amount), due_amount = VALUES(due_amount),
                        status = VALUES(status), terms = VALUES(terms), notes = VALUES(notes),
                        signature_label = VALUES(signature_label), signature_name = VALUES(signature_name)
                ");
                $stmt->execute([
                    ':id' => $idVal,
                    ':type' => $inputData['type'] ?? 'INVOICE',
                    ':doc_number' => $inputData['docNumber'] ?? '',
                    ':date' => $inputData['date'] ?? date('Y-m-d'),
                    ':due_date' => $inputData['dueDate'] ?? null,
                    ':customer_id' => $inputData['customerId'] ?? '',
                    ':customer_name' => $inputData['customerName'] ?? '',
                    ':customer_company' => $inputData['customerCompany'] ?? '',
                    ':customer_phone' => $inputData['customerPhone'] ?? '',
                    ':customer_email' => $inputData['customerEmail'] ?? '',
                    ':customer_address' => $inputData['customerAddress'] ?? '',
                    ':subject' => $inputData['subject'] ?? null,
                    ':salutation' => $inputData['salutation'] ?? null,
                    ':opening_paragraph' => $inputData['openingParagraph'] ?? null,
                    ':closing_paragraph' => $inputData['closingParagraph'] ?? null,
                    ':items' => json_encode($inputData['items'] ?? []),
                    ':subtotal' => (float)($inputData['subtotal'] ?? 0),
                    ':tax_rate' => (float)($inputData['taxRate'] ?? 0),
                    ':tax_amount' => (float)($inputData['taxAmount'] ?? 0),
                    ':discount' => (float)($inputData['discount'] ?? 0),
                    ':total' => (float)($inputData['total'] ?? 0),
                    ':paid_amount' => (float)($inputData['paidAmount'] ?? 0),
                    ':due_amount' => (float)($inputData['dueAmount'] ?? 0),
                    ':status' => $inputData['status'] ?? 'DRAFT',
                    ':terms' => $inputData['terms'] ?? '',
                    ':notes' => $inputData['notes'] ?? null,
                    ':signature_label' => $inputData['signatureLabel'] ?? 'Authorized Signature',
                    ':signature_name' => $inputData['signatureName'] ?? 'Hitachi Air Solution Center',
                ]);
                echo json_encode($inputData);
            } elseif ($method === 'DELETE') {
                if (!$id) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Missing ID parameter']);
                    exit;
                }
                $stmt = $pdo->prepare("DELETE FROM documents WHERE id = ?");
                $stmt->execute([$id]);
                echo json_encode(['success' => true]);
            }
            break;

        // ----------------------------------------------------
        // 4. STAFF USERS API
        // ----------------------------------------------------
        case 'staff':
            if ($method === 'GET') {
                $stmt = $pdo->query("SELECT * FROM staff_users ORDER BY name ASC");
                $rows = $stmt->fetchAll();
                foreach ($rows as &$r) {
                    $r['permissions'] = json_decode($r['permissions'] ?? '[]', true);
                    $r['createdAt'] = $r['created_at'];
                    unset($r['created_at'], $r['updated_at']);
                }
                echo json_encode($rows);
            } elseif ($method === 'POST') {
                $idVal = $inputData['id'] ?? null;
                if (!$idVal) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Missing staff user ID']);
                    exit;
                }
                $stmt = $pdo->prepare("
                    INSERT INTO staff_users (id, name, email, phone, passcode, role, designation, status, permissions, created_at)
                    VALUES (:id, :name, :email, :phone, :passcode, :role, :designation, :status, :permissions, :created_at)
                    ON DUPLICATE KEY UPDATE
                        name = VALUES(name), email = VALUES(email), phone = VALUES(phone), passcode = VALUES(passcode),
                        role = VALUES(role), designation = VALUES(designation), status = VALUES(status),
                        permissions = VALUES(permissions), created_at = VALUES(created_at)
                ");
                $stmt->execute([
                    ':id' => $idVal,
                    ':name' => $inputData['name'] ?? '',
                    ':email' => $inputData['email'] ?? '',
                    ':phone' => $inputData['phone'] ?? '',
                    ':passcode' => $inputData['passcode'] ?? '123456',
                    ':role' => $inputData['role'] ?? 'MANAGER',
                    ':designation' => $inputData['designation'] ?? '',
                    ':status' => $inputData['status'] ?? 'Active',
                    ':permissions' => json_encode($inputData['permissions'] ?? []),
                    ':created_at' => $inputData['createdAt'] ?? date('Y-m-d'),
                ]);
                echo json_encode($inputData);
            } elseif ($method === 'DELETE') {
                if (!$id) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Missing ID parameter']);
                    exit;
                }
                $stmt = $pdo->prepare("DELETE FROM staff_users WHERE id = ?");
                $stmt->execute([$id]);
                echo json_encode(['success' => true]);
            }
            break;

        // ----------------------------------------------------
        // 5. SETTINGS API
        // ----------------------------------------------------
        case 'settings':
            if ($method === 'GET') {
                // Auto-add columns if not exists
                try {
                    $pdo->exec("ALTER TABLE settings ADD COLUMN logo_url TEXT DEFAULT NULL");
                } catch (Exception $e) {}
                try {
                    $pdo->exec("ALTER TABLE settings ADD COLUMN watermark_url TEXT DEFAULT NULL");
                } catch (Exception $e) {}
                try {
                    $pdo->exec("ALTER TABLE settings ADD COLUMN favicon_url TEXT DEFAULT NULL");
                } catch (Exception $e) {}
                try {
                    $pdo->exec("ALTER TABLE settings ADD COLUMN watermark_opacity DOUBLE DEFAULT 0.04");
                } catch (Exception $e) {}
                try {
                    $pdo->exec("ALTER TABLE settings ADD COLUMN show_watermark INT DEFAULT 1");
                } catch (Exception $e) {}

                $stmt = $pdo->query("SELECT * FROM settings WHERE id = 'global_settings'");
                $row = $stmt->fetch();
                if ($row) {
                    $row['invoicePrefix'] = $row['invoice_prefix'];
                    $row['quotePrefix'] = $row['quote_prefix'];
                    $row['offerPrefix'] = $row['offer_prefix'];
                    $row['billPrefix'] = $row['bill_prefix'];
                    $row['taxRate'] = (float)$row['tax_rate'];
                    $row['signatureName'] = $row['signature_name'];
                    $row['signatureLabel'] = $row['signature_label'];
                    $row['logoUrl'] = $row['logo_url'] ?? '';
                    $row['watermarkUrl'] = $row['watermark_url'] ?? '';
                    $row['faviconUrl'] = $row['favicon_url'] ?? '';
                    $row['watermarkOpacity'] = isset($row['watermark_opacity']) ? (float)$row['watermark_opacity'] : 0.04;
                    $row['showWatermark'] = isset($row['show_watermark']) ? (int)$row['show_watermark'] : 1;
                    unset(
                        $row['invoice_prefix'], $row['quote_prefix'], $row['offer_prefix'],
                        $row['bill_prefix'], $row['tax_rate'], $row['signature_name'],
                        $row['signature_label'], $row['logo_url'], $row['watermark_url'],
                        $row['favicon_url'], $row['watermark_opacity'], $row['show_watermark'],
                        $row['updated_at']
                    );
                    echo json_encode($row);
                } else {
                    echo json_encode([
                        'id' => 'global_settings',
                        'name' => 'Jubayer Machineries',
                        'slogan' => 'Your Problem Solution is Sustainable Partner',
                        'address' => 'Hazi Siddik Complex, Molla Market, Bason Sharok, Gazipur City.',
                        'phone1' => '01715-994956',
                        'phone2' => '01799-498199',
                        'email' => 'jubayermachineries@gmail.com',
                        'website' => 'www.hitachiairsolutioncenter.com',
                        'invoicePrefix' => 'JM/INV/2026/',
                        'quotePrefix' => 'JM/QT/2026/',
                        'offerPrefix' => 'JM/OF/2026/',
                        'billPrefix' => 'JM/BILL/2026/',
                        'taxRate' => 5,
                        'terms' => '1. Delivery: Within 7 working days upon receipt of order.',
                        'signatureName' => 'MD MAHI UDDIN',
                        'signatureLabel' => 'Managing Director',
                        'logoUrl' => '',
                        'watermarkUrl' => '',
                        'faviconUrl' => '',
                        'watermarkOpacity' => 0.04,
                        'showWatermark' => 1
                    ]);
                }
            } elseif ($method === 'POST') {
                // Auto-add columns if not exists
                try {
                    $pdo->exec("ALTER TABLE settings ADD COLUMN logo_url TEXT DEFAULT NULL");
                } catch (Exception $e) {}
                try {
                    $pdo->exec("ALTER TABLE settings ADD COLUMN watermark_url TEXT DEFAULT NULL");
                } catch (Exception $e) {}
                try {
                    $pdo->exec("ALTER TABLE settings ADD COLUMN favicon_url TEXT DEFAULT NULL");
                } catch (Exception $e) {}
                try {
                    $pdo->exec("ALTER TABLE settings ADD COLUMN watermark_opacity DOUBLE DEFAULT 0.04");
                } catch (Exception $e) {}
                try {
                    $pdo->exec("ALTER TABLE settings ADD COLUMN show_watermark INT DEFAULT 1");
                } catch (Exception $e) {}

                $stmt = $pdo->prepare("
                    INSERT INTO settings (
                        id, name, slogan, address, phone1, phone2, email, website,
                        invoice_prefix, quote_prefix, offer_prefix, bill_prefix,
                        tax_rate, terms, signature_name, signature_label,
                        logo_url, watermark_url, favicon_url, watermark_opacity, show_watermark
                    ) VALUES (
                        'global_settings', :name, :slogan, :address, :phone1, :phone2, :email, :website,
                        :invoice_prefix, :quote_prefix, :offer_prefix, :bill_prefix,
                        :tax_rate, :terms, :signature_name, :signature_label,
                        :logo_url, :watermark_url, :favicon_url, :watermark_opacity, :show_watermark
                    ) ON DUPLICATE KEY UPDATE
                        name = VALUES(name), slogan = VALUES(slogan), address = VALUES(address),
                        phone1 = VALUES(phone1), phone2 = VALUES(phone2), email = VALUES(email),
                        website = VALUES(website), invoice_prefix = VALUES(invoice_prefix),
                        quote_prefix = VALUES(quote_prefix), offer_prefix = VALUES(offer_prefix),
                        bill_prefix = VALUES(bill_prefix), tax_rate = VALUES(tax_rate),
                        terms = VALUES(terms), signature_name = VALUES(signature_name),
                        signature_label = VALUES(signature_label),
                        logo_url = VALUES(logo_url), watermark_url = VALUES(watermark_url),
                        favicon_url = VALUES(favicon_url), watermark_opacity = VALUES(watermark_opacity),
                        show_watermark = VALUES(show_watermark)
                ");
                $stmt->execute([
                    ':name' => $inputData['name'] ?? 'Jubayer Machineries',
                    ':slogan' => $inputData['slogan'] ?? '',
                    ':address' => $inputData['address'] ?? '',
                    ':phone1' => $inputData['phone1'] ?? '',
                    ':phone2' => $inputData['phone2'] ?? '',
                    ':email' => $inputData['email'] ?? '',
                    ':website' => $inputData['website'] ?? '',
                    ':invoice_prefix' => $inputData['invoicePrefix'] ?? 'JM/INV/2026/',
                    ':quote_prefix' => $inputData['quotePrefix'] ?? 'JM/QT/2026/',
                    ':offer_prefix' => $inputData['offerPrefix'] ?? 'JM/OF/2026/',
                    ':bill_prefix' => $inputData['billPrefix'] ?? 'JM/BILL/2026/',
                    ':tax_rate' => (float)($inputData['taxRate'] ?? 0),
                    ':terms' => $inputData['terms'] ?? '',
                    ':signature_name' => $inputData['signatureName'] ?? '',
                    ':signature_label' => $inputData['signatureLabel'] ?? '',
                    ':logo_url' => $inputData['logoUrl'] ?? '',
                    ':watermark_url' => $inputData['watermarkUrl'] ?? '',
                    ':favicon_url' => $inputData['faviconUrl'] ?? '',
                    ':watermark_opacity' => isset($inputData['watermarkOpacity']) ? (float)$inputData['watermarkOpacity'] : 0.04,
                    ':show_watermark' => isset($inputData['showWatermark']) ? (int)$inputData['showWatermark'] : 1,
                ]);
                echo json_encode($inputData);
            }
            break;

        // ----------------------------------------------------
        // 6. FIELD DISPATCHES API
        // ----------------------------------------------------
        case 'field-dispatches':
            if ($method === 'GET') {
                $stmt = $pdo->query("SELECT * FROM field_dispatches ORDER BY dispatch_date DESC");
                $results = [];
                while ($row = $stmt->fetch()) {
                    $results[] = [
                        'id' => $row['id'],
                        'dispatchNumber' => $row['dispatch_number'],
                        'staffId' => $row['staff_id'],
                        'staffName' => $row['staff_name'],
                        'customerId' => $row['customer_id'],
                        'customerName' => $row['customer_name'],
                        'customerCompany' => $row['customer_company'],
                        'customerPhone' => $row['customer_phone'],
                        'purpose' => $row['purpose'],
                        'dispatchDate' => $row['dispatch_date'],
                        'returnDate' => $row['return_date'],
                        'status' => $row['status'],
                        'notes' => $row['notes'],
                        'items' => json_decode($row['items'] ?: '[]', true)
                    ];
                }
                echo json_encode($results);
            } elseif ($method === 'POST') {
                $stmt = $pdo->prepare("
                    INSERT INTO field_dispatches (
                        id, dispatch_number, staff_id, staff_name, customer_id, customer_name,
                        customer_company, customer_phone, purpose, dispatch_date, return_date, status, notes, items
                    ) VALUES (
                        :id, :dispatch_number, :staff_id, :staff_name, :customer_id, :customer_name,
                        :customer_company, :customer_phone, :purpose, :dispatch_date, :return_date, :status, :notes, :items
                    ) ON DUPLICATE KEY UPDATE
                        dispatch_number = VALUES(dispatch_number), staff_id = VALUES(staff_id),
                        staff_name = VALUES(staff_name), customer_id = VALUES(customer_id),
                        customer_name = VALUES(customer_name), customer_company = VALUES(customer_company),
                        customer_phone = VALUES(customer_phone), purpose = VALUES(purpose),
                        dispatch_date = VALUES(dispatch_date), return_date = VALUES(return_date),
                        status = VALUES(status), notes = VALUES(notes), items = VALUES(items)
                ");
                $stmt->execute([
                    ':id' => $inputData['id'],
                    ':dispatch_number' => $inputData['dispatchNumber'],
                    ':staff_id' => $inputData['staffId'],
                    ':staff_name' => $inputData['staffName'],
                    ':customer_id' => $inputData['customerId'],
                    ':customer_name' => $inputData['customerName'],
                    ':customer_company' => $inputData['customerCompany'] ?? '',
                    ':customer_phone' => $inputData['customerPhone'] ?? '',
                    ':purpose' => $inputData['purpose'] ?? '',
                    ':dispatch_date' => $inputData['dispatchDate'],
                    ':return_date' => $inputData['returnDate'] ?? null,
                    ':status' => $inputData['status'],
                    ':notes' => $inputData['notes'] ?? '',
                    ':items' => json_encode($inputData['items'] ?? [])
                ]);
                echo json_encode($inputData);
            } elseif ($method === 'DELETE') {
                $stmt = $pdo->prepare("DELETE FROM field_dispatches WHERE id = :id");
                $stmt->execute([':id' => $id]);
                echo json_encode(['success' => true]);
            }
            break;

        // ----------------------------------------------------
        // 7. SUPPLIERS API
        // ----------------------------------------------------
        case 'suppliers':
            if ($method === 'GET') {
                $stmt = $pdo->query("SELECT * FROM suppliers ORDER BY name ASC");
                $results = [];
                while ($row = $stmt->fetch()) {
                    $results[] = [
                        'id' => $row['id'],
                        'supplierId' => $row['supplier_id'] ?? '',
                        'name' => $row['name'],
                        'company' => $row['company'],
                        'phone' => $row['phone'],
                        'email' => $row['email'],
                        'address' => $row['address'],
                        'contactPerson' => $row['contact_person'] ?? '',
                        'notes' => $row['notes'] ?? '',
                        'createdAt' => $row['created_at'] ?? ''
                    ];
                }
                echo json_encode($results);
            } elseif ($method === 'POST') {
                $stmt = $pdo->prepare("
                    INSERT INTO suppliers (
                        id, supplier_id, name, company, phone, email, address, contact_person, notes, created_at
                    ) VALUES (
                        :id, :supplier_id, :name, :company, :phone, :email, :address, :contact_person, :notes, :created_at
                    ) ON DUPLICATE KEY UPDATE
                        supplier_id = VALUES(supplier_id), name = VALUES(name), company = VALUES(company),
                        phone = VALUES(phone), email = VALUES(email), address = VALUES(address),
                        contact_person = VALUES(contact_person), notes = VALUES(notes)
                ");
                $stmt->execute([
                    ':id' => $inputData['id'],
                    ':supplier_id' => $inputData['supplierId'] ?? '',
                    ':name' => $inputData['name'],
                    ':company' => $inputData['company'] ?? '',
                    ':phone' => $inputData['phone'],
                    ':email' => $inputData['email'] ?? '',
                    ':address' => $inputData['address'] ?? '',
                    ':contact_person' => $inputData['contactPerson'] ?? '',
                    ':notes' => $inputData['notes'] ?? '',
                    ':created_at' => $inputData['createdAt'] ?? date('Y-m-d')
                ]);
                echo json_encode($inputData);
            } elseif ($method === 'DELETE') {
                $stmt = $pdo->prepare("DELETE FROM suppliers WHERE id = :id");
                $stmt->execute([':id' => $id]);
                echo json_encode(['success' => true]);
            }
            break;

        // ----------------------------------------------------
        // 8. PURCHASES / STOCK INWARD API
        // ----------------------------------------------------
        case 'purchases':
            if ($method === 'GET') {
                $stmt = $pdo->query("SELECT * FROM purchases ORDER BY purchase_date DESC");
                $results = [];
                while ($row = $stmt->fetch()) {
                    $results[] = [
                        'id' => $row['id'],
                        'purchaseNumber' => $row['purchase_number'],
                        'supplierInvoiceNo' => $row['supplier_invoice_no'] ?? '',
                        'supplierId' => $row['supplier_id'],
                        'supplierName' => $row['supplier_name'],
                        'supplierCompany' => $row['supplier_company'],
                        'supplierPhone' => $row['supplier_phone'],
                        'supplierEmail' => $row['supplier_email'] ?? '',
                        'supplierAddress' => $row['supplier_address'] ?? '',
                        'purchaseDate' => $row['purchase_date'],
                        'items' => json_decode($row['items'] ?: '[]', true),
                        'subtotal' => (float)$row['subtotal'],
                        'taxRate' => (float)$row['tax_rate'],
                        'taxAmount' => (float)$row['tax_amount'],
                        'discount' => (float)$row['discount'],
                        'shippingCost' => (float)($row['shipping_cost'] ?? 0),
                        'grandTotal' => (float)$row['grand_total'],
                        'paidAmount' => (float)$row['paid_amount'],
                        'dueAmount' => (float)$row['due_amount'],
                        'paymentStatus' => $row['payment_status'],
                        'paymentMethod' => $row['payment_method'],
                        'status' => $row['status'],
                        'notes' => $row['notes'] ?? '',
                        'createdAt' => $row['created_at'] ?? ''
                    ];
                }
                echo json_encode($results);
            } elseif ($method === 'POST') {
                $stmt = $pdo->prepare("
                    INSERT INTO purchases (
                        id, purchase_number, supplier_invoice_no, supplier_id, supplier_name,
                        supplier_company, supplier_phone, supplier_email, supplier_address,
                        purchase_date, items, subtotal, tax_rate, tax_amount, discount,
                        shipping_cost, grand_total, paid_amount, due_amount, payment_status,
                        payment_method, status, notes, created_at
                    ) VALUES (
                        :id, :purchase_number, :supplier_invoice_no, :supplier_id, :supplier_name,
                        :supplier_company, :supplier_phone, :supplier_email, :supplier_address,
                        :purchase_date, :items, :subtotal, :tax_rate, :tax_amount, :discount,
                        :shipping_cost, :grand_total, :paid_amount, :due_amount, :payment_status,
                        :payment_method, :status, :notes, :created_at
                    ) ON DUPLICATE KEY UPDATE
                        purchase_number = VALUES(purchase_number), supplier_invoice_no = VALUES(supplier_invoice_no),
                        supplier_id = VALUES(supplier_id), supplier_name = VALUES(supplier_name),
                        supplier_company = VALUES(supplier_company), supplier_phone = VALUES(supplier_phone),
                        supplier_email = VALUES(supplier_email), supplier_address = VALUES(supplier_address),
                        purchase_date = VALUES(purchase_date), items = VALUES(items),
                        subtotal = VALUES(subtotal), tax_rate = VALUES(tax_rate),
                        tax_amount = VALUES(tax_amount), discount = VALUES(discount),
                        shipping_cost = VALUES(shipping_cost), grand_total = VALUES(grand_total),
                        paid_amount = VALUES(paid_amount), due_amount = VALUES(due_amount),
                        payment_status = VALUES(payment_status), payment_method = VALUES(payment_method),
                        status = VALUES(status), notes = VALUES(notes)
                ");
                $stmt->execute([
                    ':id' => $inputData['id'],
                    ':purchase_number' => $inputData['purchaseNumber'],
                    ':supplier_invoice_no' => $inputData['supplierInvoiceNo'] ?? '',
                    ':supplier_id' => $inputData['supplierId'],
                    ':supplier_name' => $inputData['supplierName'],
                    ':supplier_company' => $inputData['supplierCompany'] ?? '',
                    ':supplier_phone' => $inputData['supplierPhone'] ?? '',
                    ':supplier_email' => $inputData['supplierEmail'] ?? '',
                    ':supplier_address' => $inputData['supplierAddress'] ?? '',
                    ':purchase_date' => $inputData['purchaseDate'],
                    ':items' => json_encode($inputData['items'] ?? []),
                    ':subtotal' => (float)$inputData['subtotal'],
                    ':tax_rate' => (float)($inputData['taxRate'] ?? 0),
                    ':tax_amount' => (float)($inputData['taxAmount'] ?? 0),
                    ':discount' => (float)($inputData['discount'] ?? 0),
                    ':shipping_cost' => (float)($inputData['shippingCost'] ?? 0),
                    ':grand_total' => (float)$inputData['grandTotal'],
                    ':paid_amount' => (float)($inputData['paidAmount'] ?? 0),
                    ':due_amount' => (float)($inputData['dueAmount'] ?? 0),
                    ':payment_status' => $inputData['paymentStatus'] ?? 'Paid',
                    ':payment_method' => $inputData['paymentMethod'] ?? 'Cash',
                    ':status' => $inputData['status'] ?? 'Received',
                    ':notes' => $inputData['notes'] ?? '',
                    ':created_at' => $inputData['createdAt'] ?? date('Y-m-d')
                ]);
                echo json_encode($inputData);
            } elseif ($method === 'DELETE') {
                $stmt = $pdo->prepare("DELETE FROM purchases WHERE id = :id");
                $stmt->execute([':id' => $id]);
                echo json_encode(['success' => true]);
            }
            break;

        // ----------------------------------------------------
        // 9. IMAGE UPLOAD API
        // ----------------------------------------------------
        case 'upload':
            $possibleUploadDirs = [
                __DIR__ . '/../uploads/',
                __DIR__ . '/uploads/',
                $_SERVER['DOCUMENT_ROOT'] . '/uploads/'
            ];

            $uploadDir = null;
            foreach ($possibleUploadDirs as $dir) {
                if (!file_exists($dir)) {
                    @mkdir($dir, 0755, true);
                }
                if (file_exists($dir) && is_writable($dir)) {
                    $uploadDir = $dir;
                    break;
                }
            }

            if (!$uploadDir) {
                $uploadDir = __DIR__ . '/../uploads/';
                @mkdir($uploadDir, 0755, true);
            }

            if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
                $fileTmpPath = $_FILES['file']['tmp_name'];
                $fileName = $_FILES['file']['name'];
                $ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
                $allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
                if (!in_array($ext, $allowed)) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Invalid image format']);
                    exit;
                }
                $newName = 'prod_' . time() . '_' . substr(md5(uniqid()), 0, 8) . '.' . $ext;
                $targetFile = $uploadDir . $newName;
                if (move_uploaded_file($fileTmpPath, $targetFile)) {
                    @chmod($targetFile, 0644);
                    echo json_encode(['url' => '/uploads/' . $newName, 'success' => true]);
                    exit;
                }
            }
            http_response_code(400);
            echo json_encode(['error' => 'No image file uploaded']);
            break;

        // ----------------------------------------------------
        // 10. ACTIVITY LOGS / CLICK & AUDIT TRAIL API
        // ----------------------------------------------------
        case 'activity_logs':
        case 'logs':
            if ($method === 'GET') {
                $limit = isset($_GET['limit']) ? min((int)$_GET['limit'], 200) : 100;
                $stmt = $pdo->prepare("SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT :lim");
                $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
                $stmt->execute();
                $rows = $stmt->fetchAll();
                foreach ($rows as &$r) {
                    $r['payload'] = json_decode($r['payload'] ?? '{}', true);
                }
                echo json_encode($rows);
            } elseif ($method === 'POST') {
                $logId = $inputData['id'] ?? ('log_' . time() . '_' . substr(md5(uniqid()), 0, 6));
                $stmt = $pdo->prepare("
                    INSERT INTO activity_logs (id, staff_id, staff_name, action, module, description, entity_id, payload, ip_address, user_agent)
                    VALUES (:id, :staff_id, :staff_name, :action, :module, :description, :entity_id, :payload, :ip_address, :user_agent)
                ");
                $clientIp = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
                $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
                $stmt->execute([
                    ':id' => $logId,
                    ':staff_id' => $inputData['staff_id'] ?? $inputData['staffId'] ?? null,
                    ':staff_name' => $inputData['staff_name'] ?? $inputData['staffName'] ?? 'System / Guest',
                    ':action' => $inputData['action'] ?? 'CLICK',
                    ':module' => $inputData['module'] ?? 'SYSTEM',
                    ':description' => $inputData['description'] ?? 'User action recorded',
                    ':entity_id' => $inputData['entity_id'] ?? $inputData['entityId'] ?? null,
                    ':payload' => json_encode($inputData['payload'] ?? []),
                    ':ip_address' => $clientIp,
                    ':user_agent' => $userAgent
                ]);
                echo json_encode(['success' => true, 'id' => $logId]);
            }
            break;

        // ----------------------------------------------------
        // 11. UPLOADED FILES ARCHIVE API
        // ----------------------------------------------------
        case 'uploaded_files':
        case 'uploads_archive':
            if ($method === 'GET') {
                $stmt = $pdo->query("SELECT * FROM uploaded_files ORDER BY created_at DESC LIMIT 100");
                $rows = $stmt->fetchAll();
                echo json_encode($rows);
            }
            break;

        // ----------------------------------------------------
        // 12. DATABASE & SERVER HEALTH CHECK
        // ----------------------------------------------------
        case 'health':
            $startTime = microtime(true);
            try {
                $pCount = $pdo->query("SELECT COUNT(*) FROM products")->fetchColumn();
                $cCount = $pdo->query("SELECT COUNT(*) FROM customers")->fetchColumn();
                $dCount = $pdo->query("SELECT COUNT(*) FROM documents")->fetchColumn();
                $sCount = $pdo->query("SELECT COUNT(*) FROM staff_users")->fetchColumn();
                $fCount = 0;
                $supCount = 0;
                $purCount = 0;
                try { $fCount = $pdo->query("SELECT COUNT(*) FROM field_dispatches")->fetchColumn(); } catch (Exception $e) {}
                try { $supCount = $pdo->query("SELECT COUNT(*) FROM suppliers")->fetchColumn(); } catch (Exception $e) {}
                try { $purCount = $pdo->query("SELECT COUNT(*) FROM purchases")->fetchColumn(); } catch (Exception $e) {}
                
                $uploadDir = __DIR__ . '/../uploads/';
                $uploadsWritable = file_exists($uploadDir) && is_writable($uploadDir);

                $latency = round((microtime(true) - $startTime) * 1000, 2);
                echo json_encode([
                    'status' => 'ok',
                    'database' => 'MySQL / MariaDB (cPanel)',
                    'connected' => true,
                    'latencyMs' => $latency,
                    'tables' => [
                        'products' => (int)$pCount,
                        'customers' => (int)$cCount,
                        'documents' => (int)$dCount,
                        'staff_users' => (int)$sCount,
                        'field_dispatches' => (int)$fCount,
                        'suppliers' => (int)$supCount,
                        'purchases' => (int)$purCount
                    ],
                    'uploadsFolderWritable' => $uploadsWritable,
                    'timestamp' => date('c')
                ]);
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode([
                    'status' => 'error',
                    'connected' => false,
                    'error' => $e->getMessage(),
                    'timestamp' => date('c')
                ]);
            }
            break;

        default:
            http_response_code(404);
            echo json_encode(['error' => 'Endpoint not found', 'endpoint' => $endpoint]);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
