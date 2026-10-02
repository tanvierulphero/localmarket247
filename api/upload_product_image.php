<?php
// ========================================================
// cPanel Secure Image Upload API with MIME Verification
// Path: api/upload_product_image.php
// Target Folder: uploads/products/ (Max 5MB, JPG/PNG/WEBP only)
// ========================================================

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Content-Type: application/json; charset=utf-8');

// Handle CORS Pre-flight Options
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

// 1. Setup secure uploads/products/ folder
$uploadRoot = __DIR__ . '/../uploads';
$productsDir = $uploadRoot . '/products';

// Auto-create directories if they don't exist
if (!file_exists($uploadRoot)) {
    @mkdir($uploadRoot, 0755, true);
}
if (!file_exists($productsDir)) {
    @mkdir($productsDir, 0755, true);
}

// Write a protective .htaccess file inside uploads/ and uploads/products/ to completely block script execution
$htaccessContent = "# Prevent execution of any scripts in this directory\n" .
                   "<FilesMatch \"\\.(php|php5|php7|php8|phtml|pl|py|jsp|asp|sh|cgi)$\">\n" .
                   "    ForceType text/plain\n" .
                   "    Deny from all\n" .
                   "</FilesMatch>\n";

@file_put_contents($uploadRoot . '/.htaccess', $htaccessContent);
@file_put_contents($productsDir . '/.htaccess', $htaccessContent);

if (!is_writable($productsDir)) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Upload directory is not writable on cPanel. Please check /uploads/products/ permissions.'
    ]);
    exit;
}

// 2. Validate the file upload
if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    $errorMsg = 'No file uploaded or upload error occurred.';
    if (isset($_FILES['file']['error'])) {
        switch ($_FILES['file']['error']) {
            case UPLOAD_ERR_INI_SIZE:
            case UPLOAD_ERR_FORM_SIZE:
                $errorMsg = 'File size exceeds server upload limits.';
                break;
            case UPLOAD_ERR_PARTIAL:
                $errorMsg = 'File was only partially uploaded.';
                break;
            case UPLOAD_ERR_NO_FILE:
                $errorMsg = 'No file was selected for upload.';
                break;
        }
    }
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $errorMsg
    ]);
    exit;
}

$fileTmpPath = $_FILES['file']['tmp_name'];
$originalName = $_FILES['file']['name'];
$fileSize = $_FILES['file']['size'];

// A. Size Validation: Max 5MB (5 * 1024 * 1024 bytes)
$maxSizeBytes = 5 * 1024 * 1024;
if ($fileSize > $maxSizeBytes) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'File size exceeds maximum 5MB limit.'
    ]);
    exit;
}

// B. File Extension Validation
$fileExtension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
$allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
if (!in_array($fileExtension, $allowedExtensions)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid file extension. Only JPG, JPEG, PNG, and WEBP are allowed.'
    ]);
    exit;
}

// C. Server-side Actual MIME-type Verification (Failsafe)
$actualMimeType = '';
if (function_exists('finfo_open')) {
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $actualMimeType = finfo_file($finfo, $fileTmpPath);
    finfo_close($finfo);
} elseif (function_exists('mime_content_type')) {
    $actualMimeType = mime_content_type($fileTmpPath);
} else {
    // Basic fallback if fileinfo is disabled on cPanel
    $actualMimeType = $_FILES['file']['type'];
}

$allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
if (!in_array(strtolower($actualMimeType), $allowedMimeTypes)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid image MIME type spoofing detected.'
    ]);
    exit;
}

// D. Generate completely unique/random cryptographically secure filename
$randomBytes = bin2hex(random_bytes(12));
// Normalize jpeg/jpg extension
$ext = ($fileExtension === 'jpeg') ? 'jpg' : $fileExtension;
$newFileName = $randomBytes . '.' . $ext;
$destPath = $productsDir . '/' . $newFileName;

// E. Move uploaded file to target folder
if (move_uploaded_file($fileTmpPath, $destPath)) {
    @chmod($destPath, 0644);
    
    // Relative path to store in database/JSON storage
    $relativePath = 'uploads/products/' . $newFileName;
    
    echo json_encode([
        'success' => true,
        'message' => 'Image uploaded successfully',
        'image_url' => $relativePath
    ]);
    exit;
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to move uploaded file to destination folder.'
    ]);
    exit;
}
