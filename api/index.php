<?php
// ========================================================
// Primary PHP API Engine for Hitachi Solution Center
// Option 1: Server JSON Flat-File Storage Engine (Zero Config & Zero MySQL Required)
// ========================================================

ob_start();
@ini_set('display_errors', '0');
error_reporting(0);

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

    // 3. Products
    if (!file_exists($dataDir . '/products.json')) {
        saveJsonStorage('products', [
            [
                'id' => 'prod-1',
                'name' => 'Hitachi Hiscrew 37 S-Type Screw Compressor',
                'sku' => 'HIT-HS-37S',
                'category' => 'Screw Air Compressor',
                'brand' => 'Hitachi',
                'price' => 650000,
                'costPrice' => 480000,
                'stock' => 3,
                'unit' => 'Set',
                'description' => 'High-performance S-Type oil-flooded rotary screw air compressor with advanced microprocessor control.',
                'specs' => [
                    ['label' => 'Motor Power', 'value' => '37 kW (50 HP)'],
                    ['label' => 'Free Air Delivery', 'value' => '6.2 m³/min'],
                    ['label' => 'Working Pressure', 'value' => '8.5 Bar']
                ],
                'imageUrl' => 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=60'
            ],
            [
                'id' => 'prod-2',
                'name' => 'Atlas Copco GA37 VSD+ Variable Speed Compressor',
                'sku' => 'AC-GA37-VSD',
                'category' => 'Screw Air Compressor',
                'brand' => 'Atlas Copco',
                'price' => 890000,
                'costPrice' => 670000,
                'stock' => 2,
                'unit' => 'Set',
                'description' => 'Premium variable speed drive (VSD+) rotary screw compressor.',
                'specs' => [
                    ['label' => 'Motor Power', 'value' => '37 kW (50 HP)'],
                    ['label' => 'Working Pressure', 'value' => '4 - 13 Bar']
                ],
                'imageUrl' => 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=400&auto=format&fit=crop&q=60'
            ],
            [
                'id' => 'prod-3',
                'name' => 'Hitachi Synthetic Screw Oil (Food Grade) 20L',
                'sku' => 'HIT-OIL-20L',
                'category' => 'Lubricant Oil',
                'brand' => 'Hitachi',
                'price' => 18500,
                'costPrice' => 13500,
                'stock' => 25,
                'unit' => 'Can',
                'description' => 'Genuine 100% synthetic compressor oil for Hitachi rotary screw compressors.',
                'specs' => [],
                'imageUrl' => 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=60'
            ]
        ]);
    }

    // 4. Customers
    if (!file_exists($dataDir . '/customers.json')) {
        saveJsonStorage('customers', [
            [
                'id' => 'cust-1',
                'companyId' => 'COMP-001',
                'name' => 'Anwar Hossain',
                'company' => 'Ha-Meem Textile Mills Ltd.',
                'phone' => '01711-223344',
                'email' => 'anwar@hameemgroup.com',
                'address' => 'Nishat Nagar, Tongi, Gazipur.',
                'notes' => 'VIP Client - Textile Division'
            ],
            [
                'id' => 'cust-2',
                'companyId' => 'COMP-002',
                'name' => 'Engr. Shahadat Hossain',
                'company' => 'Square Pharmaceuticals PLC',
                'phone' => '01819-887766',
                'email' => 'shahadat@squaregroup.com',
                'address' => 'Kaliyakir Industrial Zone, Gazipur.',
                'notes' => 'Pharma Clean Air Requirement'
            ]
        ]);
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
        $seg1 = isset($pathSegments[$apiIndex + 1]) ? $pathSegments[$apiIndex + 1] : '';
        if ($seg1 !== 'index.php') {
            $endpoint = $seg1;
            $id = isset($pathSegments[$apiIndex + 2]) ? $pathSegments[$apiIndex + 2] : null;
        }
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

$method = $_SERVER['REQUEST_METHOD'];
$inputData = json_decode(file_get_contents('php://input'), true) ?? [];

// Helper for JSON Storage Processing
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

// Option 1 Default Engine Execution
processJsonRequest($endpoint, $method, $id, $inputData);
