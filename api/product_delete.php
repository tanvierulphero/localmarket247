<?php
// ========================================================
// cPanel Product Delete API Handler with Image Cleanup (MySQL PDO)
// Path: api/product_delete.php
// Deletes a product directly from MySQL database and removes image
// ========================================================

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

try {
    // 1. Fetch product to remove its image
    $stmt = $pdo->prepare("SELECT `image_url` FROM `products` WHERE `id` = :id LIMIT 1");
    $stmt->execute([':id' => $productId]);
    $product = $stmt->fetch();

    if ($product) {
        $imageUrl = $product['image_url'] ?? '';
        if (!empty($imageUrl) && str_starts_with($imageUrl, 'uploads/products/')) {
            $filePathOnDisk = realpath(__DIR__ . '/../' . $imageUrl);
            $productsFolderReal = realpath(__DIR__ . '/../uploads/products');

            if ($filePathOnDisk && $productsFolderReal && str_starts_with($filePathOnDisk, $productsFolderReal) && file_exists($filePathOnDisk)) {
                @unlink($filePathOnDisk);
            }
        }
    }

    // 2. Delete from MySQL
    $delStmt = $pdo->prepare("DELETE FROM `products` WHERE `id` = :id");
    $delStmt->execute([':id' => $productId]);

    echo json_encode([
        'success' => true,
        'message' => 'Product and associated image deleted from MySQL database successfully'
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
