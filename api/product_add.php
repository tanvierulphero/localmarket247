<?php
// ========================================================
// cPanel Product Add API Handler (MySQL PDO)
// Path: api/product_add.php
// Saves a new product directly to MySQL database table
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
if (!$inputData) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid JSON input payload'
    ]);
    exit;
}

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

$id = !empty($inputData['id']) ? $inputData['id'] : ('prod_' . time() . '_' . substr(md5(uniqid()), 0, 6));
$category = $inputData['category'] ?? 'General';
$brand = $inputData['brand'] ?? 'Hitachi';
$price = floatval($inputData['price'] ?? 0);
$costPrice = floatval($inputData['costPrice'] ?? ($inputData['cost_price'] ?? ($price * 0.75)));
$stock = intval($inputData['stock'] ?? 0);
$unit = $inputData['unit'] ?? 'Pcs';
$description = $inputData['description'] ?? '';
$specs = isset($inputData['specs']) && is_array($inputData['specs']) ? json_encode($inputData['specs'], JSON_UNESCAPED_UNICODE) : '[]';
$imageUrl = $inputData['imageUrl'] ?? ($inputData['image_url'] ?? '');

try {
    $stmt = $pdo->prepare("
        INSERT INTO `products` (`id`, `name`, `sku`, `category`, `brand`, `price`, `cost_price`, `stock`, `unit`, `description`, `specs`, `image_url`)
        VALUES (:id, :name, :sku, :category, :brand, :price, :cost_price, :stock, :unit, :description, :specs, :image_url)
        ON DUPLICATE KEY UPDATE
        `name` = VALUES(`name`),
        `sku` = VALUES(`sku`),
        `category` = VALUES(`category`),
        `brand` = VALUES(`brand`),
        `price` = VALUES(`price`),
        `cost_price` = VALUES(`cost_price`),
        `stock` = VALUES(`stock`),
        `unit` = VALUES(`unit`),
        `description` = VALUES(`description`),
        `specs` = VALUES(`specs`),
        `image_url` = VALUES(`image_url`)
    ");
    $stmt->execute([
        ':id' => $id,
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
        ':image_url' => $imageUrl,
    ]);

    $inputData['id'] = $id;
    echo json_encode([
        'success' => true,
        'message' => 'Product saved to MySQL database successfully',
        'product' => $inputData
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
