<?php
// ========================================================
// cPanel Product Update API Handler with Image Cleanup (MySQL PDO)
// Path: api/product_update.php
// Updates an existing product directly in MySQL database table
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

require_once __DIR__ . '/config.php';
$pdo = getDbConnection();

if (!$pdo) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed. Please check api/config.php.'
    ]);
    exit;
}

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

try {
    // 1. Fetch current product to check image cleanup
    $stmtOld = $pdo->prepare("SELECT * FROM `products` WHERE `id` = :id LIMIT 1");
    $stmtOld->execute([':id' => $productId]);
    $oldProduct = $stmtOld->fetch();

    if (!$oldProduct) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Product with ID ' . htmlspecialchars($productId) . ' not found in database.'
        ]);
        exit;
    }

    $oldImageUrl = $oldProduct['image_url'] ?? '';
    $newImageUrl = $inputData['imageUrl'] ?? ($inputData['image_url'] ?? $oldImageUrl);

    if (!empty($oldImageUrl) && $oldImageUrl !== $newImageUrl && str_starts_with($oldImageUrl, 'uploads/products/')) {
        $oldFilePath = realpath(__DIR__ . '/../' . $oldImageUrl);
        $productsFolderReal = realpath(__DIR__ . '/../uploads/products');
        
        if ($oldFilePath && $productsFolderReal && str_starts_with($oldFilePath, $productsFolderReal) && file_exists($oldFilePath)) {
            @unlink($oldFilePath);
        }
    }

    // 2. Update in MySQL
    $category = $inputData['category'] ?? $oldProduct['category'];
    $brand = $inputData['brand'] ?? $oldProduct['brand'];
    $price = isset($inputData['price']) ? floatval($inputData['price']) : floatval($oldProduct['price']);
    $costPrice = isset($inputData['costPrice']) ? floatval($inputData['costPrice']) : (isset($inputData['cost_price']) ? floatval($inputData['cost_price']) : floatval($oldProduct['cost_price']));
    $stock = isset($inputData['stock']) ? intval($inputData['stock']) : intval($oldProduct['stock']);
    $unit = $inputData['unit'] ?? $oldProduct['unit'];
    $description = $inputData['description'] ?? $oldProduct['description'];
    $specs = isset($inputData['specs']) && is_array($inputData['specs']) ? json_encode($inputData['specs'], JSON_UNESCAPED_UNICODE) : $oldProduct['specs'];

    $updateStmt = $pdo->prepare("
        UPDATE `products` SET
            `name` = :name,
            `sku` = :sku,
            `category` = :category,
            `brand` = :brand,
            `price` = :price,
            `cost_price` = :cost_price,
            `stock` = :stock,
            `unit` = :unit,
            `description` = :description,
            `specs` = :specs,
            `image_url` = :image_url
        WHERE `id` = :id
    ");

    $updateStmt->execute([
        ':id' => $productId,
        ':name' => $name,
        ':sku' => $sku,
        ':category' => $category,
        ':brand' => $brand,
        ':price' => $price,
        ':cost_price' => $costPrice,
        ':stock' => $stock,
        ':unit' => $unit,
        ':description' => $description,
        ':specs' => $specs,
        ':image_url' => $newImageUrl,
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'Product updated in MySQL database successfully',
        'product' => array_merge($inputData, ['imageUrl' => $newImageUrl])
    ]);
    exit;
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database Error: ' . $e->getMessage()
    ]);
    exit;
}
