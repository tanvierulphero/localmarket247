<?php
// ========================================================
// cPanel Product Delete API Handler with Image Cleanup
// Path: api/product_delete.php
// Deletes a product and safely unlinks its associated image
// ========================================================

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Support DELETE, POST or GET with ID parameter
$productId = isset($_GET['id']) ? trim($_GET['id']) : null;

if (!$productId) {
    $inputData = json_decode(file_get_contents('php://input'), true);
    if (isset($inputData['id'])) {
        $productId = $inputData['id'];
    }
}

if (!$productId) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Missing required Product ID parameter'
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
$productToDelete = null;

for ($i = 0; $i < count($products); $i++) {
    if (isset($products[$i]['id']) && $products[$i]['id'] === $productId) {
        $foundIndex = $i;
        $productToDelete = $products[$i];
        break;
    }
}

if ($foundIndex === -1) {
    http_response_code(404);
    echo json_encode([
        'success' => false,
        'message' => 'Product not found.'
    ]);
    exit;
}

// Safe path-traversal resistant deletion of associated product image
$imageUrl = isset($productToDelete['imageUrl']) ? $productToDelete['imageUrl'] : (isset($productToDelete['image_url']) ? $productToDelete['image_url'] : '');

if (!empty($imageUrl) && str_starts_with($imageUrl, 'uploads/products/')) {
    $filePathOnDisk = realpath(__DIR__ . '/../' . $imageUrl);
    $productsFolderReal = realpath(__DIR__ . '/../uploads/products');

    // Double check that the path is strictly inside uploads/products
    if ($filePathOnDisk && $productsFolderReal && str_starts_with($filePathOnDisk, $productsFolderReal) && file_exists($filePathOnDisk)) {
        @unlink($filePathOnDisk);
    }
}

// Remove from the list
array_splice($products, $foundIndex, 1);

// Save back to JSON file
@file_put_contents($filePath, json_encode($products, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

echo json_encode([
    'success' => true,
    'message' => 'Product and associated image deleted successfully'
]);
exit;
