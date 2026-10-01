<?php
// ========================================================
// cPanel Product Add API Handler
// Path: api/product_add.php
// Saves a new product to Flat-File storage / database
// ========================================================

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method Not Allowed'
    ]);
    exit;
}

// 1. Parse and validate JSON input
$inputData = json_decode(file_get_contents('php://input'), true);
if (!$inputData) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid JSON input payload'
    ]);
    exit;
}

// Validation
$name = isset($inputData['name']) ? trim($inputData['name']) : '';
$sku = isset($inputData['sku']) ? trim($inputData['sku']) : '';

if (empty($name)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Product Name is a required field'
    ]);
    exit;
}
if (empty($sku)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Product SKU is a required field'
    ]);
    exit;
}

// Create unique product ID if not supplied
if (empty($inputData['id'])) {
    $inputData['id'] = 'prod_' . time() . '_' . substr(md5(uniqid()), 0, 6);
}

// 2. Read products list from JSON
$dataDir = __DIR__ . '/data';
$filePath = $dataDir . '/products.json';

if (!file_exists($dataDir)) {
    @mkdir($dataDir, 0755, true);
}

$products = [];
if (file_exists($filePath)) {
    $products = json_decode(file_get_contents($filePath), true) ?? [];
}

// Prevent Duplicate SKU
foreach ($products as $p) {
    if (isset($p['sku']) && strtolower($p['sku']) === strtolower($sku)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Product with this SKU already exists.'
        ]);
        exit;
    }
}

// Push to the beginning of the list (newest first)
array_unshift($products, $inputData);

// Save back to JSON file
@file_put_contents($filePath, json_encode($products, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

echo json_encode([
    'success' => true,
    'message' => 'Product added successfully',
    'product' => $inputData
]);
exit;
