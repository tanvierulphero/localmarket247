<?php
// ========================================================
// Primary PHP API Engine for Hitachi Solution Center
// Supports:
// 1. 100% Pure MySQL Database Engine (PDO / phpMyAdmin)
// 2. Seamless Server JSON Storage Fallback (Zero Config)
// 3. Direct cPanel /uploads routing
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

// CORS Headers
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

// Ensure public_logo_url and challan_prefix columns exist in MySQL on cPanel
if ($pdo) {
    try {
        $pdo->query("ALTER TABLE `settings` ADD `public_logo_url` LONGTEXT");
    } catch (Exception $e) {}
    try {
        $pdo->query("ALTER TABLE `settings` ADD `challan_prefix` VARCHAR(100) DEFAULT 'JM/CH/2026/'");
    } catch (Exception $e) {}
}

// Parse request URI and determine endpoint and ID
$requestUri = $_SERVER['REQUEST_URI'] ?? '';
$uriPath = parse_url($requestUri, PHP_URL_PATH) ?? '';

$endpoint = isset($_GET['endpoint']) ? trim($_GET['endpoint']) : '';
$id = isset($_GET['id']) ? trim($_GET['id']) : null;

if (empty($endpoint)) {
    $pathSegments = array_values(array_filter(explode('/', $uriPath)));
    $apiIndex = array_search('api', $pathSegments);
    if ($apiIndex !== false) {
        $seg1 = isset($pathSegments[$apiIndex + 1]) ? $pathSegments[$apiIndex + 1] : '';
        if ($seg1 !== 'index.php') {
            $endpoint = $seg1;
            $seg2 = isset($pathSegments[$apiIndex + 2]) ? $pathSegments[$apiIndex + 2] : null;
            if ($seg2) {
                if ($seg1 === 'products' || $seg1 === 'customers' || $seg1 === 'documents' || $seg1 === 'staff' || $seg1 === 'dispatches' || $seg1 === 'suppliers' || $seg1 === 'purchases' || $seg1 === 'returns' || $seg1 === 'expenses') {
                    $id = $seg2;
                } else {
                    $endpoint = $seg1 . '/' . $seg2;
                    $id = null;
                }
            }
        }
    }
}

// Router: Image Upload Endpoints (Calls upload.php directly)
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
                'database' => defined('DB_NAME') ? DB_NAME : 'MySQL Active',
                'timestamp' => date('c')
            ]);
            exit;
        } catch (Exception $e) {
            http_response_code(200);
            echo json_encode([
                'status' => 'error',
                'connected' => false,
                'error' => $e->getMessage(),
                'timestamp' => date('c')
            ]);
            exit;
        }
    } else {
        http_response_code(200);
        echo json_encode([
            'status' => 'ok',
            'connected' => true,
            'storage' => 'Server JSON Flat-File Engine Active',
            'mysql_connected' => false,
            'timestamp' => date('c')
        ]);
        exit;
    }
}

// JSON Fallback Storage Functions
$dataDir = __DIR__ . '/data';
if (!file_exists($dataDir)) {
    @mkdir($dataDir, 0777, true);
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

function processJsonRequest($endpoint, $method, $id, $inputData) {
    $fileKey = str_replace('-', '_', $endpoint);
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
            echo json_encode(['error' => 'Item not found']);
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

        $filtered = array_filter($items, function($item) use ($id) {
            return !isset($item['id']) || $item['id'] !== $id;
        });

        saveJsonStorage($fileKey, array_values($filtered));
        echo json_encode(['success' => true]);
        return;
    }
}

// Helper: Convert CamelCase to snake_case
function camelToSnake($input) {
    return strtolower(preg_replace('/(?<!^)[A-Z]/', '_$0', $input));
}

// Helper: Convert snake_case to CamelCase
function snakeToCamel($input) {
    return lcfirst(str_replace(' ', '', ucwords(str_replace('_', ' ', $input))));
}

// Helper: Map frontend object keys to MySQL column names
function mapJsToDb($item, $fieldsList) {
    $dbItem = [];
    foreach ($fieldsList as $f) {
        $camel = snakeToCamel($f);
        if (array_key_exists($camel, $item)) {
            $val = $item[$camel];
            if (is_array($val) || is_object($val)) {
                $dbItem[$f] = json_encode($val, JSON_UNESCAPED_UNICODE);
            } else {
                $dbItem[$f] = $val;
            }
        } elseif (array_key_exists($f, $item)) {
            $val = $item[$f];
            if (is_array($val) || is_object($val)) {
                $dbItem[$f] = json_encode($val, JSON_UNESCAPED_UNICODE);
            } else {
                $dbItem[$f] = $val;
            }
        }
    }
    return $dbItem;
}

// Helper: Map MySQL record keys to frontend JSON CamelCase
function mapDbToJs($row) {
    if (!$row) return null;
    $jsItem = [];
    foreach ($row as $k => $v) {
        $camel = snakeToCamel($k);
        if (is_string($v) && (str_starts_with(trim($v), '[') || str_starts_with(trim($v), '{'))) {
            $decoded = json_decode($v, true);
            $jsItem[$camel] = ($decoded !== null) ? $decoded : $v;
        } else {
            $jsItem[$camel] = $v;
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
        'fields' => ['id', 'name', 'slogan', 'address', 'phone1', 'phone2', 'email', 'website', 'invoice_prefix', 'quote_prefix', 'offer_prefix', 'bill_prefix', 'tax_rate', 'terms', 'signature_name', 'signature_label', 'logo_url', 'public_logo_url', 'watermark_url', 'favicon_url', 'challan_prefix', 'watermark_opacity', 'show_watermark']
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

$method = $_SERVER['REQUEST_METHOD'];
$inputData = json_decode(file_get_contents('php://input'), true) ?? [];

// If PDO is not connected, use the JSON storage engine fallback
if (!$pdo) {
    processJsonRequest($endpoint, $method, $id, $inputData);
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

        // If product image is changed, delete old image from uploads/
        if ($tableName === 'products') {
            try {
                $oldStmt = $pdo->prepare("SELECT `image_url` FROM `products` WHERE `id` = :id");
                $oldStmt->execute([':id' => $idVal]);
                $oldRow = $oldStmt->fetch();
                if ($oldRow) {
                    $oldImg = $oldRow['image_url'] ?? '';
                    $newImg = $dbItem['image_url'] ?? '';
                    if (!empty($oldImg) && $oldImg !== $newImg && (str_starts_with($oldImg, 'uploads/') || str_starts_with($oldImg, '/uploads/'))) {
                        $cleanImgPath = ltrim($oldImg, '/');
                        $oldPath = realpath(__DIR__ . '/../' . $cleanImgPath);
                        $uploadDir = realpath(__DIR__ . '/../uploads');
                        if ($oldPath && $uploadDir && str_starts_with($oldPath, $uploadDir) && file_exists($oldPath)) {
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

        if ($tableName === 'products') {
            try {
                $oldStmt = $pdo->prepare("SELECT `image_url` FROM `products` WHERE `id` = :id");
                $oldStmt->execute([':id' => $id]);
                $oldRow = $oldStmt->fetch();
                if ($oldRow) {
                    $img = $oldRow['image_url'] ?? '';
                    if (!empty($img) && (str_starts_with($img, 'uploads/') || str_starts_with($img, '/uploads/'))) {
                        $cleanImgPath = ltrim($img, '/');
                        $imgPath = realpath(__DIR__ . '/../' . $cleanImgPath);
                        $uploadDir = realpath(__DIR__ . '/../uploads');
                        if ($imgPath && $uploadDir && str_starts_with($imgPath, $uploadDir) && file_exists($imgPath)) {
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
