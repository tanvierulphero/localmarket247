<?php
// ========================================================
// cPanel Secure Image & Document Upload API
// Path: api/upload.php
// Target Directory: uploads/products/ (Max 5MB, JPG/PNG/WEBP/PDF)
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
        'message' => 'Method Not Allowed. Use POST.'
    ]);
    exit;
}

// 1. Setup secure uploads/products/ folder
$uploadRoot = __DIR__ . '/../uploads';
$productsDir = $uploadRoot . '/products';

if (!file_exists($uploadRoot)) {
    @mkdir($uploadRoot, 0755, true);
}
if (!file_exists($productsDir)) {
    @mkdir($productsDir, 0755, true);
}

// Write a protective .htaccess file inside uploads/ to block PHP execution
$htaccessContent = "# Block PHP execution in upload directory\n" .
                   "<FilesMatch \"\\.(php|php5|php7|php8|phtml|pl|py|jsp|asp|sh|cgi)$\">\n" .
                   "    ForceType text/plain\n" .
                   "    Deny from all\n" .
                   "</FilesMatch>\n";

@file_put_contents($uploadRoot . '/.htaccess', $htaccessContent);
@file_put_contents($productsDir . '/.htaccess', $htaccessContent);

// Check directory write permissions
if (!is_writable($productsDir)) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Upload directory is not writable on server. Please check /uploads/products/ permissions.'
    ]);
    exit;
}

// 2. Locate uploaded file key ('file' or 'image')
$fileField = null;
if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
    $fileField = $_FILES['file'];
} elseif (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
    $fileField = $_FILES['image'];
}

if (!$fileField) {
    $errorMsg = 'No file uploaded or upload error occurred.';
    $errCode = isset($_FILES['file']['error']) ? $_FILES['file']['error'] : (isset($_FILES['image']['error']) ? $_FILES['image']['error'] : null);
    if ($errCode !== null) {
        switch ($errCode) {
            case UPLOAD_ERR_INI_SIZE:
            case UPLOAD_ERR_FORM_SIZE:
                $errorMsg = 'File size exceeds maximum upload limit.';
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

$fileTmpPath = $fileField['tmp_name'];
$originalName = $fileField['name'];
$fileSize = $fileField['size'];

// A. Size Validation: Max 5MB
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
$allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'];
if (!in_array($fileExtension, $allowedExtensions)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid file extension. Allowed: JPG, PNG, WEBP, GIF, SVG.'
    ]);
    exit;
}

// C. Server-side MIME-type Verification
$actualMimeType = '';
if (function_exists('finfo_open')) {
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $actualMimeType = finfo_file($finfo, $fileTmpPath);
    finfo_close($finfo);
} elseif (function_exists('mime_content_type')) {
    $actualMimeType = mime_content_type($fileTmpPath);
} else {
    $actualMimeType = $fileField['type'];
}

$allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/jpg'];
if (!in_array(strtolower($actualMimeType), $allowedMimeTypes)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid file MIME type.'
    ]);
    exit;
}

// D. Generate secure unique filename
$randomBytes = bin2hex(random_bytes(12));
$ext = ($fileExtension === 'jpeg') ? 'jpg' : $fileExtension;
$newFileName = $randomBytes . '.' . $ext;
$destPath = $productsDir . '/' . $newFileName;

// E. Move file to target folder
if (move_uploaded_file($fileTmpPath, $destPath)) {
    @chmod($destPath, 0644);
    $relativePath = 'uploads/products/' . $newFileName;
    
    echo json_encode([
        'success' => true,
        'message' => 'Image uploaded successfully',
        'url' => $relativePath,
        'image_url' => $relativePath
    ]);
    exit;
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to save uploaded file on server.'
    ]);
    exit;
}
