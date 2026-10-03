<?php
// ========================================================
// Primary PHP API Engine for Hitachi Solution Center
// 100% Pure MySQL Database Engine (PDO / phpMyAdmin)
// Zero JSON Flat-Files in public_html
// ========================================================

ob_start();
@ini_set('display_errors', '0');
error_reporting(0);

// Polyfill for str_starts_with compatibility with all PHP versions
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

// Parse request URI and determine endpoint and ID
$requestUri = $_SERVER['REQUEST_URI'] ?? '';
$uriPath = parse_url($requestUri, PHP_URL_PATH) ?? '';

$endpoint = isset($_GET['endpoint']) ? trim($_GET['endpoint']) : '';
$id = isset($_GET['id']) ? trim($_GET['id']) : null;

if (empty($endpoint)) {
    $pathSegments = array_values(array_filter(explode('/', $uriPath)));
    $apiIndex = array_search('api', $pathSegments);
    if ($apiIndex !== false) {
        $afterApi = array_slice($pathSegments, $apiIndex + 1);
        if (!empty($afterApi) && $afterApi[0] === 'index.php') {
            $afterApi = array_slice($afterApi, 1);
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

// Router: Image Upload Endpoints
if ($endpoint === 'upload') {
    if (file_exists(__DIR__ . '/upload.php')) {
        require_once __DIR__ . '/upload.php';
        exit;
    }
}

// Health Check Endpoint
if ($endpoint === 'health' || $endpoint === 'ping') {
    if ($pdo) {
        try {
            $pdo->query("SELECT 1");
            http_response_code(200);
            echo json_encode([
                'status' => 'ok',
                'connected' => true,
                'storage' => '100% Pure MySQL Database Engine (PDO)',
                'mysql_connected' => true,
                'message' => 'Connected to MySQL database successfully.'
            ]);
            exit;
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'status' => 'error',
                'connected' => false,
                'mysql_connected' => false,
                'error' => $e->getMessage()
            ]);
            exit;
        }
    } else {
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'connected' => false,
            'mysql_connected' => false,
            'message' => 'MySQL connection not established. Please check api/config.php credentials.'
        ]);
        exit;
    }
}

// Database Clear and Reset Endpoint
if ($endpoint === 'database/clear' || $endpoint === 'database_clear') {
    if (!$pdo) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Database not connected.']);
        exit;
    }

    try {
        $pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");
        $tables = ['products', 'customers', 'documents', 'purchases', 'suppliers', 'field_dispatches', 'sales_returns', 'expenses', 'activity_logs', 'uploaded_files'];
        foreach ($tables as $t) {
            @$pdo->exec("TRUNCATE TABLE `$t`;");
        }
        $pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'All database tables have been cleared in MySQL successfully.'
        ]);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        exit;
    }
}

// Helper functions for CamelCase <-> snake_case field mapping
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
            if (($dbKey === 'specs' || $dbKey === 'items' || $dbKey === 'permissions') && (is_array($v) || is_object($v))) {
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
    $stringFields = ['sku', 'doc_number', 'phone', 'customer_phone', 'supplier_phone', 'company_id', 'supplier_id', 'passcode', 'purchase_number', 'supplier_invoice_no', 'reference_no', 'expense_number', 'return_number', 'dispatch_number', 'slip_number', 'brand', 'name', 'unit', 'category', 'description', 'notes', 'terms', 'address', 'customer_address', 'customer_name', 'customer_company', 'customer_email', 'email', 'image_url', 'logo_url', 'watermark_url'];

    foreach ($dbRow as $k => $v) {
        $jsKey = snakeToCamel($k);
        if ($k === 'specs' || $k === 'items' || $k === 'permissions') {
            if (is_array($v)) {
                $jsItem[$jsKey] = $v;
            } else {
                $jsItem[$jsKey] = json_decode($v ?? '[]', true) ?? [];
            }
        } else if (in_array($k, $stringFields)) {
            $jsItem[$jsKey] = (string)($v ?? '');
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

if (!$pdo) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Database connection failed. Please check api/config.php and verify MySQL credentials in cPanel.'
    ]);
    exit;
}

if (!isset($tablesMap[$endpoint])) {
    http_response_code(404);
    echo json_encode(['error' => 'Invalid API endpoint: ' . htmlspecialchars($endpoint)]);
    exit;
}

$meta = $tablesMap[$endpoint];
$tableName = $meta['table'];
$fieldsList = $meta['fields'];
$method = $_SERVER['REQUEST_METHOD'];
$inputData = json_decode(file_get_contents('php://input'), true) ?? [];

// 1. GET Requests
if ($method === 'GET') {
    try {
        if ($id) {
            $stmt = $pdo->prepare("SELECT * FROM `$tableName` WHERE `id` = :id LIMIT 1");
            $stmt->execute([':id' => $id]);
            $row = $stmt->fetch();
            if ($row) {
                echo json_encode(mapDbToJs($row));
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Item not found']);
            }
            exit;
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
            exit;
        }

        $stmt = $pdo->prepare("SELECT * FROM `$tableName` ORDER BY `id` DESC");
        $stmt->execute();
        $rows = $stmt->fetchAll();
        $jsRows = array_map('mapDbToJs', $rows);
        echo json_encode($jsRows);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
        exit;
    }
}

// 2. POST Requests (Insert / Upsert)
if ($method === 'POST') {
    try {
        if ($endpoint === 'settings') {
            $inputData['id'] = 'global_settings';
        }

        $idVal = $inputData['id'] ?? null;
        if (!$idVal) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing required item ID']);
            exit;
        }

        $dbItem = mapJsToDb($inputData, $fieldsList);

        // If product image is changed, delete old image from uploads/products/
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
            } catch (Exception $imgEx) {}
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
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
        exit;
    }
}

// 3. DELETE Requests
if ($method === 'DELETE') {
    try {
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing required ID parameter']);
            exit;
        }

        // Image Cleanup for deleted products
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
            } catch (Exception $imgEx) {}
        }

        $stmt = $pdo->prepare("DELETE FROM `$tableName` WHERE `id` = :id");
        $stmt->execute([':id' => $id]);
        echo json_encode(['success' => true]);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
        exit;
    }
}
