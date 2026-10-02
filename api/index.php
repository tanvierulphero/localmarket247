<?php
// ========================================================
// Primary PHP API Engine for Hitachi Solution Center
// Option 1: Server JSON Flat-File Storage Engine (Zero Config & Zero MySQL Required)
// ========================================================

ob_start();
@ini_set('display_errors', '0');
error_reporting(0);

// Polyfill for str_starts_with compatibility with PHP versions below 8.0
if (!function_exists('str_starts_with')) {
    function str_starts_with($haystack, $needle) {
        return (string)$needle !== '' && strncmp($haystack, $needle, strlen($needle)) === 0;
    }
}

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

// Server JSON Storage Directory Setup
$dataDir = __DIR__ . '/data';
if (!file_exists($dataDir)) {
    @mkdir($dataDir, 0755, true);
}

function getJsonStorage($fileKey) {
    global $dataDir;
    $filePath = $dataDir . '/' . $fileKey . '.json';
    if (file_exists($filePath)) {
        $content = file_get_contents($filePath);
        return json_decode($content, true) ?? [];
    }
    return [];
}

function saveJsonStorage($fileKey, $items) {
    global $dataDir;
    $filePath = $dataDir . '/' . $fileKey . '.json';
    @file_put_contents($filePath, json_encode($items, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

// Seed initial default data into JSON storage if empty
function seedInitialJsonDataIfNeeded() {
    global $dataDir;

    // 1. Settings
    if (!file_exists($dataDir . '/settings.json')) {
        saveJsonStorage('settings', [[
            'id' => 'global_settings',
            'name' => 'Hitachi Air Solution Center',
            'slogan' => 'Industrial Air Compressors, Parts & Service Specialists',
            'address' => 'Plot # 12, Road # 04, Sector # 07, Uttara, Dhaka-1230, Bangladesh.',
            'phone1' => '+880 1711-000000',
            'phone2' => '+880 1819-000000',
            'email' => 'info@hitachisolutioncenter.com',
            'website' => 'https://localmarket247.top',
            'invoicePrefix' => 'INV',
            'quotePrefix' => 'QUO',
            'offerPrefix' => 'OFF',
            'billPrefix' => 'BIL',
            'taxRate' => 7.5,
            'terms' => "1. Delivery: Ex-stock ready delivery or 2-4 weeks upon confirmation.\n2. Payment: 50% advance with work order, remaining 50% upon delivery/commissioning.\n3. Validity: This offer is valid for 30 calendar days.",
            'signatureName' => 'MD MAHI UDDIN',
            'signatureLabel' => 'Managing Director',
            'logoUrl' => '',
            'watermarkUrl' => '',
            'faviconUrl' => '',
            'watermarkOpacity' => 0.04,
            'showWatermark' => true
        ]]);
    }

    // 2. Staff Users
    if (!file_exists($dataDir . '/staff_users.json')) {
        saveJsonStorage('staff_users', [
            [
                'id' => 'staff-1',
                'name' => 'MD MAHI UDDIN',
                'email' => 'mahi@hitachisolutioncenter.com',
                'phone' => '01711-000001',
                'passcode' => '123456',
                'role' => 'Super Admin',
                'designation' => 'Managing Director',
                'status' => 'Active',
                'permissions' => ['all'],
                'createdAt' => '2026-01-01'
            ],
            [
                'id' => 'staff-2',
                'name' => 'Engr. Tanvir Ahmed',
                'email' => 'tanvir@hitachisolutioncenter.com',
                'phone' => '01711-000002',
                'passcode' => '123456',
                'role' => 'Admin',
                'designation' => 'Chief Technical Officer',
                'status' => 'Active',
                'permissions' => ['all'],
                'createdAt' => '2026-01-01'
            ],
            [
                'id' => 'staff-3',
                'name' => 'Md. Rakib Hasan',
                'email' => 'rakib@hitachisolutioncenter.com',
                'phone' => '01711-000003',
                'passcode' => '123456',
                'role' => 'Sales Manager',
                'designation' => 'Senior Sales Executive',
                'status' => 'Active',
                'permissions' => ['dashboard','inventory','challan','invoice','quotation','customers','suppliers','purchases'],
                'createdAt' => '2026-01-01'
            ]
        ]);
    }

    // 3. Products (Starts as an empty array for a clean setup with no demo data)
    if (!file_exists($dataDir . '/products.json')) {
        saveJsonStorage('products', []);
    }

    // 4. Customers (Starts as an empty array for a clean setup with no demo data)
    if (!file_exists($dataDir . '/customers.json')) {
        saveJsonStorage('customers', []);
    }
}

seedInitialJsonDataIfNeeded();

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
        $afterApi = array_slice($pathSegments, $apiIndex + 1);
        if (!empty($afterApi)) {
            if ($afterApi[0] === 'index.php') {
                $afterApi = array_slice($afterApi, 1);
            }
        }
        
        if (!empty($afterApi)) {
            $joined = implode('/', $afterApi);
            if ($joined === 'database/clear' || $joined === 'database_clear') {
                $endpoint = 'database/clear';
                $id = null;
            } elseif ($joined === 'database/seed-demo' || $joined === 'database_seed_demo') {
                $endpoint = 'database/seed-demo';
                $id = null;
            } else {
                if (count($afterApi) > 1) {
                    $id = array_pop($afterApi);
                    $endpoint = implode('/', $afterApi);
                } else {
                    $endpoint = $afterApi[0];
                    $id = null;
                }
            }
        }
    }
}

// Image Upload Router Endpoint
if ($endpoint === 'upload') {
    if (file_exists(__DIR__ . '/upload.php')) {
        require_once __DIR__ . '/upload.php';
        exit;
    }
}

// Health check endpoint
if ($endpoint === 'health' || $endpoint === 'ping') {
    http_response_code(200);
    echo json_encode([
        'status' => 'ok',
        'connected' => true,
        'storage' => 'Server JSON Persistence Engine (Option 1 Active)',
        'mysql_connected' => $pdo !== null,
        'message' => 'Running smoothly with Option 1: Server Flat-File Storage Engine'
    ]);
    exit;
}

// Database Clear and Reset Endpoint
if ($endpoint === 'database/clear' || $endpoint === 'database_clear') {
    $dataDir = __DIR__ . '/data';
    $filesToClear = ['products', 'customers', 'documents', 'field_dispatches', 'suppliers', 'purchases', 'returns', 'expenses', 'activity_logs', 'uploaded_files'];
    foreach ($filesToClear as $f) {
        @unlink($dataDir . '/' . $f . '.json');
    }

    if ($pdo) {
        try {
            $pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");
            $tables = ['products', 'customers', 'documents', 'purchases', 'suppliers', 'field_dispatches', 'sales_returns', 'expenses', 'activity_logs', 'uploaded_files'];
            foreach ($tables as $t) {
                @$pdo->exec("TRUNCATE TABLE `$t`;");
            }
            $pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");
        } catch (Exception $e) {
            // Non-fatal
        }
    }

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'All transaction logs, products, customers, and records have been cleared successfully.'
    ]);
    exit;
}

// Database Seed Demo Endpoint
if ($endpoint === 'database/seed-demo' || $endpoint === 'database_seed_demo') {
    $dataDir = __DIR__ . '/data';
    $filesToClear = ['products', 'customers', 'documents', 'field_dispatches', 'suppliers', 'purchases', 'returns', 'expenses'];
    foreach ($filesToClear as $f) {
        @unlink($dataDir . '/' . $f . '.json');
    }

    seedInitialJsonDataIfNeeded();

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Demo transaction data has been successfully seeded.'
    ]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$inputData = json_decode(file_get_contents('php://input'), true) ?? [];

// Helper functions for automatic CamelCase <-> snake_case translation
function camelToSnake($key) {
    return strtolower(preg_replace('/(?<!^)[A-Z]/', '_$0', $key));
}

function snakeToCamel($key) {
    return lcfirst(str_replace(' ', '', ucwords(str_replace('_', ' ', $key))));
}

function mapJsToDb($jsItem, $fieldsList) {
    $dbItem = [];
    foreach ($jsItem as $k => $v) {
        $dbKey = camelToSnake($k);
        if (in_array($dbKey, $fieldsList)) {
            if (($dbKey === 'specs' || $dbKey === 'items' || $dbKey === 'permissions') && is_array($v)) {
                $dbItem[$dbKey] = json_encode($v, JSON_UNESCAPED_UNICODE);
            } else {
                if (is_bool($v)) {
                    $dbItem[$dbKey] = $v ? 1 : 0;
                } else {
                    $dbItem[$dbKey] = $v;
                }
            }
        }
    }
    return $dbItem;
}

function mapDbToJs($dbRow) {
    $jsItem = [];
    if (!$dbRow) return null;
    foreach ($dbRow as $k => $v) {
        $jsKey = snakeToCamel($k);
        if ($k === 'specs' || $k === 'items' || $k === 'permissions') {
            $jsItem[$jsKey] = json_decode($v ?? '[]', true) ?? [];
        } else {
            if (is_numeric($v) && strlen($v ?? '') < 15) {
                if (strpos($v, '.') !== false) {
                    $jsItem[$jsKey] = (double)$v;
                } else {
                    $jsItem[$jsKey] = (int)$v;
                }
            } else {
                $jsItem[$jsKey] = $v;
            }
        }
    }
    return $jsItem;
}

// Helper for Database & JSON Storage Processing
function processJsonRequest($endpoint, $method, $id, $inputData) {
    global $pdo;

    // Table schema column definitions map
    $tablesMap = [
        'products' => [
            'table' => 'products',
            'fields' => ['id', 'name', 'sku', 'category', 'brand', 'price', 'cost_price', 'stock', 'unit', 'description', 'specs', 'image_url']
        ],
        'customers' => [
            'table' => 'customers',
            'fields' => ['id', 'company_id', 'name', 'company', 'phone', 'email', 'address', 'notes']
        ],
        'suppliers' => [
            'table' => 'suppliers',
            'fields' => ['id', 'supplier_id', 'name', 'company', 'phone', 'email', 'address', 'contact_person', 'notes', 'created_at']
        ],
        'purchases' => [
            'table' => 'purchases',
            'fields' => ['id', 'purchase_number', 'supplier_invoice_no', 'supplier_id', 'supplier_name', 'supplier_company', 'supplier_phone', 'supplier_email', 'supplier_address', 'purchase_date', 'items', 'subtotal', 'tax_rate', 'tax_amount', 'discount', 'shipping_cost', 'grand_total', 'paid_amount', 'due_amount', 'payment_status', 'payment_method', 'status', 'notes', 'created_at']
        ],
        'documents' => [
            'table' => 'documents',
            'fields' => ['id', 'type', 'doc_number', 'date', 'due_date', 'customer_id', 'customer_name', 'customer_company', 'customer_phone', 'customer_email', 'customer_address', 'subject', 'salutation', 'opening_paragraph', 'closing_paragraph', 'items', 'subtotal', 'tax_rate', 'tax_amount', 'discount', 'total', 'paid_amount', 'due_amount', 'status', 'terms', 'notes', 'signature_label', 'signature_name', 'vat_enabled']
        ],
        'staff' => [
            'table' => 'staff_users',
            'fields' => ['id', 'name', 'email', 'phone', 'passcode', 'role', 'designation', 'status', 'permissions', 'created_at']
        ],
        'settings' => [
            'table' => 'settings',
            'fields' => ['id', 'name', 'slogan', 'address', 'phone1', 'phone2', 'email', 'website', 'invoice_prefix', 'quote_prefix', 'offer_prefix', 'bill_prefix', 'tax_rate', 'terms', 'signature_name', 'signature_label', 'logo_url', 'watermark_url', 'favicon_url', 'watermark_opacity', 'show_watermark']
        ],
        'dispatches' => [
            'table' => 'field_dispatches',
            'fields' => ['id', 'dispatch_number', 'date', 'staff_id', 'staff_name', 'customer_id', 'customer_name', 'customer_company', 'company_name', 'address', 'customer_phone', 'phone', 'purpose', 'description', 'dispatch_date', 'return_date', 'bill_no', 'bill_amount', 'paid_amount', 'due_amount', 'expense_amount', 'expense_details', 'payment_status', 'payment_method', 'status', 'notes', 'items']
        ],
        'returns' => [
            'table' => 'sales_returns',
            'fields' => ['id', 'return_number', 'return_date', 'original_doc_id', 'original_doc_number', 'customer_id', 'customer_name', 'customer_company', 'customer_phone', 'product_id', 'product_name', 'sku', 'parts_number', 'quantity', 'unit', 'unit_price', 'refund_amount', 'deduct_from_due', 'restocked', 'reason', 'notes', 'created_at']
        ],
        'expenses' => [
            'table' => 'expenses',
            'fields' => ['id', 'expense_number', 'date', 'category', 'title', 'amount', 'payment_method', 'paid_by', 'staff_id', 'reference_no', 'notes', 'receipt_url', 'created_at']
        ]
    ];

    $fileKey = str_replace('-', '_', $endpoint);
    $useDb = ($pdo !== null && isset($tablesMap[$endpoint]));

    if ($useDb) {
        $meta = $tablesMap[$endpoint];
        $tableName = $meta['table'];
        $fieldsList = $meta['fields'];

        if ($method === 'GET') {
            if ($id) {
                $stmt = $pdo->prepare("SELECT * FROM `$tableName` WHERE `id` = :id");
                $stmt->execute([':id' => $id]);
                $row = $stmt->fetch();
                if ($row) {
                    echo json_encode(mapDbToJs($row));
                } else {
                    http_response_code(404);
                    echo json_encode(['error' => 'Item not found in database']);
                }
                return;
            }

            if ($endpoint === 'settings') {
                $stmt = $pdo->prepare("SELECT * FROM `$tableName` WHERE `id` = 'global_settings' LIMIT 1");
                $stmt->execute();
                $row = $stmt->fetch();
                if ($row) {
                    echo json_encode(mapDbToJs($row));
                } else {
                    echo json_encode(null);
                }
                return;
            }

            $stmt = $pdo->prepare("SELECT * FROM `$tableName` ORDER BY `id` DESC");
            $stmt->execute();
            $rows = $stmt->fetchAll();
            $jsRows = array_map('mapDbToJs', $rows);
            echo json_encode($jsRows);
            return;
        }

        if ($method === 'POST') {
            if ($endpoint === 'settings') {
                $inputData['id'] = 'global_settings';
            }

            $idVal = $inputData['id'] ?? null;
            if (!$idVal) {
                http_response_code(400);
                echo json_encode(['error' => 'Missing item ID']);
                return;
            }

            $dbItem = mapJsToDb($inputData, $fieldsList);

            // Secure Image Replacement: Check if new image replaces an old local cPanel image in MySQL
            if ($tableName === 'products') {
                try {
                    $oldStmt = $pdo->prepare("SELECT `image_url` FROM `products` WHERE `id` = :id");
                    $oldStmt->execute([':id' => $idVal]);
                    $oldRow = $oldStmt->fetch();
                    if ($oldRow) {
                        $oldImg = $oldRow['image_url'] ?? '';
                        $newImg = $dbItem['image_url'] ?? '';
                        if (!empty($oldImg) && $oldImg !== $newImg && str_starts_with($oldImg, 'uploads/products/')) {
                            $oldPath = realpath(__DIR__ . '/../' . $oldImg);
                            $productsDir = realpath(__DIR__ . '/../uploads/products');
                            if ($oldPath && $productsDir && str_starts_with($oldPath, $productsDir) && file_exists($oldPath)) {
                                @unlink($oldPath);
                            }
                        }
                    }
                } catch (Exception $imgEx) {
                    // Non-fatal
                }
            }

            $columns = array_keys($dbItem);
            $placeholders = array_map(function($c) { return ":$c"; }, $columns);
            
            $updates = [];
            foreach ($columns as $col) {
                if ($col !== 'id') {
                    $updates[] = "`$col` = VALUES(`$col`)";
                }
            }

            $sql = "INSERT INTO `$tableName` (`" . implode("`, `", $columns) . "`) VALUES (" . implode(", ", $placeholders) . ")";
            if (!empty($updates)) {
                $sql .= " ON DUPLICATE KEY UPDATE " . implode(", ", $updates);
            }

            $stmt = $pdo->prepare($sql);
            $params = [];
            foreach ($dbItem as $k => $v) {
                $params[":$k"] = $v;
            }
            $stmt->execute($params);

            echo json_encode($inputData);
            return;
        }

        if ($method === 'DELETE') {
            if (!$id) {
                http_response_code(400);
                echo json_encode(['error' => 'Missing ID parameter']);
                return;
            }

            // Image Deletion for Products in MySQL
            if ($tableName === 'products') {
                try {
                    $oldStmt = $pdo->prepare("SELECT `image_url` FROM `products` WHERE `id` = :id");
                    $oldStmt->execute([':id' => $id]);
                    $oldRow = $oldStmt->fetch();
                    if ($oldRow) {
                        $img = $oldRow['image_url'] ?? '';
                        if (!empty($img) && str_starts_with($img, 'uploads/products/')) {
                            $imgPath = realpath(__DIR__ . '/../' . $img);
                            $productsDir = realpath(__DIR__ . '/../uploads/products');
                            if ($imgPath && $productsDir && str_starts_with($imgPath, $productsDir) && file_exists($imgPath)) {
                                @unlink($imgPath);
                            }
                        }
                    }
                } catch (Exception $imgEx) {
                    // Non-fatal
                }
            }

            $stmt = $pdo->prepare("DELETE FROM `$tableName` WHERE `id` = :id");
            $stmt->execute([':id' => $id]);
            echo json_encode(['success' => true]);
            return;
        }
    }

    // JSON Flat-File Fallback (Zero Config Option)
    $items = getJsonStorage($fileKey);

    if ($method === 'GET') {
        if ($id) {
            foreach ($items as $item) {
                if (isset($item['id']) && $item['id'] === $id) {
                    echo json_encode($item);
                    return;
                }
            }
            http_response_code(404);
            echo json_encode(['error' => 'Item not found in Flat-File']);
            return;
        }

        if ($fileKey === 'settings') {
            echo json_encode($items[0] ?? null);
            return;
        }

        echo json_encode($items);
        return;
    }

    if ($method === 'POST') {
        if ($fileKey === 'settings') {
            $inputData['id'] = 'global_settings';
            saveJsonStorage('settings', [$inputData]);
            echo json_encode($inputData);
            return;
        }

        $idVal = $inputData['id'] ?? null;
        if (!$idVal) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing item ID']);
            return;
        }

        $found = false;
        foreach ($items as &$item) {
            if (isset($item['id']) && $item['id'] === $idVal) {
                // If it is a product being updated, delete the old image if it has changed
                if ($fileKey === 'products') {
                    $oldImg = isset($item['imageUrl']) ? $item['imageUrl'] : (isset($item['image_url']) ? $item['image_url'] : '');
                    $newImg = isset($inputData['imageUrl']) ? $inputData['imageUrl'] : (isset($inputData['image_url']) ? $inputData['image_url'] : '');
                    if (!empty($oldImg) && $oldImg !== $newImg && str_starts_with($oldImg, 'uploads/products/')) {
                        $oldPath = realpath(__DIR__ . '/../' . $oldImg);
                        $productsDir = realpath(__DIR__ . '/../uploads/products');
                        if ($oldPath && $productsDir && str_starts_with($oldPath, $productsDir) && file_exists($oldPath)) {
                            @unlink($oldPath);
                        }
                    }
                }
                $item = array_merge($item, $inputData);
                $found = true;
                break;
            }
        }
        if (!$found) {
            array_unshift($items, $inputData);
        }

        saveJsonStorage($fileKey, $items);
        echo json_encode($inputData);
        return;
    }

    if ($method === 'DELETE') {
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing ID parameter']);
            return;
        }

        // If deleting a product, delete its image too
        if ($fileKey === 'products') {
            foreach ($items as $item) {
                if (isset($item['id']) && $item['id'] === $id) {
                    $img = isset($item['imageUrl']) ? $item['imageUrl'] : (isset($item['image_url']) ? $item['image_url'] : '');
                    if (!empty($img) && str_starts_with($img, 'uploads/products/')) {
                        $imgPath = realpath(__DIR__ . '/../' . $img);
                        $productsDir = realpath(__DIR__ . '/../uploads/products');
                        if ($imgPath && $productsDir && str_starts_with($imgPath, $productsDir) && file_exists($imgPath)) {
                            @unlink($imgPath);
                        }
                    }
                    break;
                }
            }
        }

        $filtered = array_filter($items, function($item) use ($id) {
            return !isset($item['id']) || $item['id'] !== $id;
        });

        saveJsonStorage($fileKey, array_values($filtered));
        echo json_encode(['success' => true]);
        return;
    }
}

// Option 1 Default Engine Execution
processJsonRequest($endpoint, $method, $id, $inputData);
