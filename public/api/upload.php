<?php
// =========================================================================
// cPanel Secure Image & File Upload Handler for Hitachi Solution Center
// Directly saves uploaded files into the cPanel /uploads directory
// Supports: FormData (file/image) and Server-side JSON Base64 decode
// =========================================================================

ob_start();
@ini_set('display_errors', '0');
error_reporting(0);

// CORS Headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Content-Type: application/json; charset=utf-8');

// Preflight CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method Not Allowed. Use POST.']);
    exit;
}

// 1. Resolve and create /uploads directory on cPanel disk
$possibleUploadDirs = [
    __DIR__ . '/../uploads/',
    dirname(__DIR__) . '/uploads/',
    __DIR__ . '/uploads/',
    (!empty($_SERVER['DOCUMENT_ROOT']) ? rtrim($_SERVER['DOCUMENT_ROOT'], '/') . '/uploads/' : '')
];

$uploadDir = null;
foreach ($possibleUploadDirs as $dir) {
    if (empty($dir)) continue;
    if (!file_exists($dir)) {
        @mkdir($dir, 0777, true);
        @chmod($dir, 0777);
    }
    if (file_exists($dir) && is_writable($dir)) {
        $uploadDir = $dir;
        break;
    }
}

// If still not writable, attempt default fallback
if (!$uploadDir) {
    $uploadDir = __DIR__ . '/../uploads/';
    @mkdir($uploadDir, 0777, true);
    @chmod($uploadDir, 0777);
}

// Ensure .htaccess inside uploads directory blocks direct PHP execution while serving images
$htaccessFile = rtrim($uploadDir, '/') . '/.htaccess';
if (!file_exists($htaccessFile)) {
    $htaccessContent = "# Protect upload directory\n" .
                       "<FilesMatch \"\\.(php|php5|php7|php8|phtml|pl|py|jsp|asp|sh|cgi)$\">\n" .
                       "    ForceType text/plain\n" .
                       "    Deny from all\n" .
                       "</FilesMatch>\n";
    @file_put_contents($htaccessFile, $htaccessContent);
}

// Allowed extensions
$allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'];

// A. Handle Multipart FormData Upload
$fileField = null;
if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
    $fileField = $_FILES['file'];
} elseif (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
    $fileField = $_FILES['image'];
}

if ($fileField) {
    $fileName = $fileField['name'];
    $fileTmpPath = $fileField['tmp_name'];
    $fileSize = $fileField['size'];

    $fileExt = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
    if ($fileExt === 'jpeg') $fileExt = 'jpg';

    if (!in_array($fileExt, $allowedExtensions)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => "Invalid file extension '.$fileExt'. Allowed: JPG, PNG, WEBP, GIF, SVG"
        ]);
        exit;
    }

    if ($fileSize > 20 * 1024 * 1024) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'File size exceeds maximum 20MB limit'
        ]);
        exit;
    }

    // Generate unique filename
    $uniquePrefix = (strpos($fileName, 'logo') !== false || strpos($fileName, 'header') !== false) ? 'logo_' : 'img_';
    $newFileName = $uniquePrefix . time() . '_' . substr(md5(uniqid(mt_rand(), true)), 0, 8) . '.' . $fileExt;
    $destPath = rtrim($uploadDir, '/') . '/' . $newFileName;

    if (move_uploaded_file($fileTmpPath, $destPath)) {
        @chmod($destPath, 0644);
        $fileUrl = '/uploads/' . $newFileName;
        echo json_encode([
            'success' => true,
            'url' => $fileUrl,
            'image_url' => $fileUrl,
            'relative_url' => 'uploads/' . $newFileName,
            'filename' => $newFileName,
            'server' => 'cpanel'
        ]);
        exit;
    } else {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Failed to save uploaded file into cPanel /uploads folder. Please verify folder permissions (755 or 777).'
        ]);
        exit;
    }
}

// B. Check for detailed PHP upload error codes if $_FILES exists
$errCode = isset($_FILES['file']['error']) ? $_FILES['file']['error'] : (isset($_FILES['image']['error']) ? $_FILES['image']['error'] : null);
if ($errCode !== null && $errCode !== UPLOAD_ERR_NO_FILE) {
    $msg = 'PHP upload error code: ' . $errCode;
    if ($errCode === UPLOAD_ERR_INI_SIZE || $errCode === UPLOAD_ERR_FORM_SIZE) {
        $msg = 'File size exceeds server upload_max_filesize limit in php.ini.';
    } elseif ($errCode === UPLOAD_ERR_PARTIAL) {
        $msg = 'File was only partially uploaded.';
    } elseif ($errCode === UPLOAD_ERR_NO_TMP_DIR) {
        $msg = 'Missing temporary folder on server.';
    } elseif ($errCode === UPLOAD_ERR_CANT_WRITE) {
        $msg = 'Failed to write file to disk on server.';
    }
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $msg]);
    exit;
}

// C. Handle JSON Base64 Payload (Direct server-side write to cPanel disk)
$inputRaw = file_get_contents('php://input');
$inputData = json_decode($inputRaw, true);

if (isset($inputData['base64'])) {
    $base64Data = $inputData['base64'];
    $fileExt = 'png';
    $origName = $inputData['filename'] ?? '';

    if (preg_match('/^data:image\/([a-zA-Z0-9\+\-]+);base64,/', $base64Data, $match)) {
        $base64Data = substr($base64Data, strpos($base64Data, ',') + 1);
        $rawExt = strtolower($match[1]);
        if ($rawExt === 'jpeg') $fileExt = 'jpg';
        elseif ($rawExt === 'svg+xml') $fileExt = 'svg';
        elseif (in_array($rawExt, $allowedExtensions)) $fileExt = $rawExt;
    } elseif (!empty($origName)) {
        $ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));
        if (in_array($ext, $allowedExtensions)) {
            $fileExt = ($ext === 'jpeg') ? 'jpg' : $ext;
        }
    }

    $binaryData = base64_decode($base64Data);
    if ($binaryData === false) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid base64 encoding']);
        exit;
    }

    $uniquePrefix = (strpos($origName, 'logo') !== false) ? 'logo_' : 'img_';
    $newFileName = $uniquePrefix . time() . '_' . substr(md5(uniqid(mt_rand(), true)), 0, 8) . '.' . $fileExt;
    $destPath = rtrim($uploadDir, '/') . '/' . $newFileName;

    if (file_put_contents($destPath, $binaryData)) {
        @chmod($destPath, 0644);
        $fileUrl = '/uploads/' . $newFileName;
        echo json_encode([
            'success' => true,
            'url' => $fileUrl,
            'image_url' => $fileUrl,
            'relative_url' => 'uploads/' . $newFileName,
            'filename' => $newFileName,
            'server' => 'cpanel'
        ]);
        exit;
    } else {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Failed to write file to cPanel /uploads directory. Please check permissions.'
        ]);
        exit;
    }
}

http_response_code(400);
echo json_encode(['success' => false, 'error' => 'No image file or base64 payload provided in upload request.']);
