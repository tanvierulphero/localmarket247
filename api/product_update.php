<?php
// ========================================================
// cPanel Product Update API Handler with Image Cleanup
// Path: api/product_update.php
// Updates an existing product and removes old image if replaced
// ========================================================

// Polyfill for str_starts_with compatibility with PHP versions below 8.0
if (!function_exists('str_starts_with')) {
    function str_starts_with($haystack, $needle) {
        return (string)$needle !== '' && strncmp($haystack, $needle, strlen($needle)) === 0;
    }
}

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

// Parse and validate JSON input
$inputData = json_decode(file_get_contents('php://input'), true);
if (!$inputData || empty($inputData['id'])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid product payload or missing Product ID'
    ]);
    exit;
}

$productId = $inputData['id'];
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

// Read products list from JSON
$dataDir = __DIR__ . '/data';
$filePath = $dataDir . '/products.json';

if (!file_exists($filePath)) {
    http_response_code(404);
    echo json_encode([
        'success' => false,
        'message' => 'No products database found on server.'
    ]);
    exit;
}

$products = json_decode(file_get_contents($filePath), true) ?? [];

$foundIndex = -1;
$oldProduct = null;

for ($i = 0; $i < count($products); $i++) {
    if (isset($products[$i]['id']) && $products[$i]['id'] === $productId) {
        $foundIndex = $i;
        $oldProduct = $products[$i];
        break;
    }
}

if ($foundIndex === -1) {
    http_response_code(404);
    echo json_encode([
        'success' => false,
        'message' => 'Product with ID ' . htmlspecialchars($productId) . ' not found.'
    ]);
    exit;
}

// Secure Image Replacement: Check if new image replaces an old local cPanel image
$oldImageUrl = isset($oldProduct['imageUrl']) ? $oldProduct['imageUrl'] : (isset($oldProduct['image_url']) ? $oldProduct['image_url'] : '');
$newImageUrl = isset($inputData['imageUrl']) ? $inputData['imageUrl'] : (isset($inputData['image_url']) ? $inputData['image_url'] : '');

if (!empty($oldImageUrl) && $oldImageUrl !== $newImageUrl) {
    // Only delete if it was a local uploads file to prevent deleting external preset links
    if (str_starts_with($oldImageUrl, 'uploads/products/')) {
        $oldFilePath = realpath(__DIR__ . '/../' . $oldImageUrl);
        $productsFolderReal = realpath(__DIR__ . '/../uploads/products');
        
        // Prevent path traversal: make sure the deleted file is strictly inside the uploads/products/ folder
        if ($oldFilePath && $productsFolderReal && str_starts_with($oldFilePath, $productsFolderReal) && file_exists($oldFilePath)) {
            @unlink($oldFilePath);
        }
    }
}

// Update the product record in our list
$products[$foundIndex] = array_merge($products[$foundIndex], $inputData);

// Save back to JSON file
@file_put_contents($filePath, json_encode($products, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

echo json_encode([
    'success' => true,
    'message' => 'Product updated successfully',
    'product' => $products[$foundIndex]
]);
exit;
