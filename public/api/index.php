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

require_once __DIR__ . '/config.php';

$pdo = getDbConnection();

// Parse request URI
$requestUri = $_SERVER['REQUEST_URI'];
$uriPath = parse_url($requestUri, PHP_URL_PATH);

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

        case 'health':
            $startTime = microtime(true);
            try {
                $pCount = $pdo->query("SELECT COUNT(*) FROM products")->fetchColumn();
                $cCount = $pdo->query("SELECT COUNT(*) FROM customers")->fetchColumn();
                $dCount = $pdo->query("SELECT COUNT(*) FROM documents")->fetchColumn();
                $sCount = $pdo->query("SELECT COUNT(*) FROM staff_users")->fetchColumn();
                
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
                        'staff_users' => (int)$sCount
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
