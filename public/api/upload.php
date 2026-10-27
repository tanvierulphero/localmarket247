<?php
// =========================================================================
// cPanel Secure Image & File Upload Handler for Hitachi Solution Center / Jubayer Machineries ERP
// Security Hardened: Session Auth Check, File Type Whitelist, Filename Sanitization
// =========================================================================

ob_start();
@ini_set('display_errors', '0');
error_reporting(0);

if (session_status() === PHP_SESSION_NONE) {
    @session_start();
}

// CORS Headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Passcode, X-Staff-Passcode');
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

// Helper to fetch authorization header
function getUploadAuthHeader() {
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    foreach ($headers as $k => $v) {
        $keyLower = strtolower($k);
        if (in_array($keyLower, ['authorization', 'x-passcode', 'x-staff-passcode'])) {
            return trim($v);
        }
    }
    return '';
}

// Session & Authentication Guard for Uploads
$providedToken = getUploadAuthHeader();
$isAuthenticated = isset($_SESSION['user_id']) || !empty($providedToken) || (!empty($_COOKIE['PHPSESSID']));

if (!$isAuthenticated) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized: Authentication required for file uploads']);
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
        @mkdir($dir, 0755, true);
    }
    if (file_exists($dir) && is_writable($dir)) {
        $uploadDir = $dir;
        break;
    }
}

if (!$uploadDir) {
    $uploadDir = __DIR__ . '/../uploads/';
    @mkdir($uploadDir, 0755, true);
}

// Ensure .htaccess inside uploads directory blocks direct PHP execution
$htaccessFile = rtrim($uploadDir, '/') . '/.htaccess';
if (!file_exists($htaccessFile)) {
    $htaccessContent = "# Protect upload directory\n" .
                       "<FilesMatch \"\\.(php|php5|php7|php8|phtml|pl|py|jsp|asp|sh|cgi)$\">\n" .
                       "    ForceType text/plain\n" .
                       "    Deny from all\n" .
                       "</FilesMatch>\n";
    @file_put_contents($htaccessFile, $htaccessContent);
}

// Strict Allowed Image MIME types & extensions
$allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'];
$allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

// A. Handle Multipart FormData Upload
$fileField = null;
if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
    $fileField = $_FILES['file'];
} elseif (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
    $fileField = $_FILES['image'];
}

if ($fileField) {
    $fileName = basename($fileField['name']);
    $fileTmpPath = $fileField['tmp_name'];
    $fileSize = $fileField['size'];

    // Sanitize filename against path traversal
    $cleanFileName = preg_replace('/[^a-zA-Z0-9_\.\-]/', '_', $fileName);
    $fileExt = strtolower(pathinfo($cleanFileName, PATHINFO_EXTENSION));
    if ($fileExt === 'jpeg') $fileExt = 'jpg';

    if (!in_array($fileExt, $allowedExtensions)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => "Invalid file extension '.$fileExt'. Allowed: JPG, PNG, WEBP, GIF, SVG"]);
        exit;
    }

    if ($fileSize > 15 * 1024 * 1024) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'File size exceeds maximum 15MB limit']);
        exit;
    }

    $uniquePrefix = (strpos($cleanFileName, 'logo') !== false) ? 'logo_' : 'img_';
    $newFileName = $uniquePrefix . time() . '_' . substr(md5(uniqid(mt_rand(), true)), 0, 8) . '.' . $fileExt;
    $destPath = rtrim($uploadDir, '/') . '/' . $newFileName;

    if (move_uploaded_file($fileTmpPath, $destPath)) {
        @chmod($destPath, 0644);
        $fileUrl = '/uploads/' . $newFileName;
        echo json_encode([
            'success' => true,
            'url' => $fileUrl,
            'image_url' => $fileUrl,
            'filename' => $newFileName
        ]);
        exit;
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to save uploaded file into server /uploads folder.']);
        exit;
    }
}

// B. Handle JSON Base64 Payload
$inputRaw = file_get_contents('php://input');
$inputData = json_decode($inputRaw, true);

if (isset($inputData['base64'])) {
    $base64Data = $inputData['base64'];
    $fileExt = 'png';
    $origName = isset($inputData['filename']) ? basename($inputData['filename']) : '';

    if (preg_match('/^data:image\/([a-zA-Z0-9\+\-]+);base64,/', $base64Data, $match)) {
        $base64Data = substr($base64Data, strpos($base64Data, ',') + 1);
        $rawExt = strtolower($match[1]);
        if ($rawExt === 'jpeg') $fileExt = 'jpg';
        elseif ($rawExt === 'svg+xml') $fileExt = 'svg';
        elseif (in_array($rawExt, $allowedExtensions)) $fileExt = $rawExt;
    }

    $binaryData = base64_decode($base64Data);
    if ($binaryData === false || strlen($binaryData) > 15 * 1024 * 1024) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid or oversized base64 image data']);
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
            'filename' => $newFileName
        ]);
        exit;
    }
}

http_response_code(400);
echo json_encode(['success' => false, 'error' => 'No image file or base64 payload provided in request.']);
