<?php
// ========================================================
// cPanel Image Upload Handler with SQL Audit Tracking
// Saves uploaded product images into the /uploads directory
// and logs details in uploaded_files & activity_logs table
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
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

// Ensure uploads folder exists
$possibleUploadDirs = [
    __DIR__ . '/../uploads/',
    __DIR__ . '/uploads/',
    $_SERVER['DOCUMENT_ROOT'] . '/uploads/'
];

$uploadDir = null;
foreach ($possibleUploadDirs as $dir) {
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

// Optional DB Logging Helper
function logUploadToDatabase($fileId, $fileName, $originalName, $fileUrl, $fileSize, $mimeType) {
    try {
        if (file_exists(__DIR__ . '/config.php')) {
            require_once __DIR__ . '/config.php';
            $pdo = getDbConnection();
            if ($pdo) {
                $clientIp = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
                $stmt = $pdo->prepare("
                    INSERT INTO uploaded_files (id, file_name, original_name, file_url, file_size, mime_type, entity_type, ip_address)
                    VALUES (:id, :file_name, :original_name, :file_url, :file_size, :mime_type, 'product', :ip_address)
                ");
                $stmt->execute([
                    ':id' => $fileId,
                    ':file_name' => $fileName,
                    ':original_name' => $originalName,
                    ':file_url' => $fileUrl,
                    ':file_size' => $fileSize,
                    ':mime_type' => $mimeType,
                    ':ip_address' => $clientIp
                ]);

                // Also log to activity_logs
                $actStmt = $pdo->prepare("
                    INSERT INTO activity_logs (id, staff_name, action, module, description, entity_id, ip_address)
                    VALUES (:id, 'Staff / System', 'UPLOAD_IMAGE', 'INVENTORY', :description, :entity_id, :ip_address)
                ");
                $actStmt->execute([
                    ':id' => 'act_' . time() . '_' . substr(md5(uniqid()), 0, 6),
                    ':description' => "Uploaded image file: " . $originalName . " (" . round($fileSize / 1024, 1) . " KB)",
                    ':entity_id' => $fileId,
                    ':ip_address' => $clientIp
                ]);
            }
        }
    } catch (Exception $e) {
        // Non-fatal, file is still saved on disk
    }
}

// Handle File Upload from FormData
if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
    $fileTmpPath = $_FILES['file']['tmp_name'];
    $fileName = $_FILES['file']['name'];
    $fileSize = $_FILES['file']['size'];
    $fileType = $_FILES['file']['type'];

    // Allowed file extensions
    $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
    $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];

    if (!in_array($fileExtension, $allowedExtensions)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid file extension. Allowed: JPG, PNG, WEBP, GIF, SVG']);
        exit;
    }

    // Limit size to 25MB
    if ($fileSize > 25 * 1024 * 1024) {
        http_response_code(400);
        echo json_encode(['error' => 'File size exceeds 25MB limit']);
        exit;
    }

    // Generate unique name
    $fileId = 'file_' . time() . '_' . substr(md5(uniqid()), 0, 8);
    $newFileName = 'prod_' . time() . '_' . substr(md5(uniqid()), 0, 8) . '.' . $fileExtension;
    $destPath = $uploadDir . $newFileName;

    if (move_uploaded_file($fileTmpPath, $destPath)) {
        @chmod($destPath, 0644);
        $fileUrl = 'uploads/' . $newFileName;
        logUploadToDatabase($fileId, $newFileName, $fileName, $fileUrl, $fileSize, $fileType);
        echo json_encode([
            'url' => $fileUrl,
            'success' => true,
            'id' => $fileId,
            'storage' => 'cpanel_disk'
        ]);
        exit;
    } else {
        // Fail-safe Fallback: If cPanel folder permission prevents writing to disk,
        // convert temp file to Base64 Data URL so the product image STILL works 100%!
        $fileData = file_get_contents($fileTmpPath);
        if ($fileData !== false) {
            $base64 = 'data:' . $fileType . ';base64,' . base64_encode($fileData);
            logUploadToDatabase($fileId, 'base64_' . $fileName, $fileName, $base64, $fileSize, $fileType);
            echo json_encode([
                'url' => $base64,
                'success' => true,
                'id' => $fileId,
                'storage' => 'database_base64',
                'notice' => 'cPanel uploads folder is not writable. Image saved directly into database/storage as Base64.'
            ]);
            exit;
        }

        http_response_code(500);
        echo json_encode(['error' => 'Failed to process file on cPanel. Please check /uploads directory permissions or use URL link option.']);
        exit;
    }
}

// Handle JSON Base64 Payload as Fallback
$inputData = json_decode(file_get_contents('php://input'), true);
if (isset($inputData['base64'])) {
    $base64Data = $inputData['base64'];
    if (preg_match('/^data:image\/(\w+);base64,/', $base64Data, $type)) {
        $base64Data = substr($base64Data, strpos($base64Data, ',') + 1);
        $type = strtolower($type[1]);

        if (!in_array($type, ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'])) {
            $type = 'png';
        }

        $base64Data = base64_decode($base64Data);
        if ($base64Data === false) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid base64 encoding']);
            exit;
        }

        $fileId = 'file_' . time() . '_' . substr(md5(uniqid()), 0, 8);
        $newFileName = 'prod_' . time() . '_' . substr(md5(uniqid()), 0, 8) . '.' . $type;
        $destPath = $uploadDir . $newFileName;

        if (file_put_contents($destPath, $base64Data)) {
            $fileUrl = '/uploads/' . $newFileName;
            logUploadToDatabase($fileId, $newFileName, 'base64_upload.' . $type, $fileUrl, strlen($base64Data), 'image/' . $type);
            echo json_encode(['url' => $fileUrl, 'success' => true, 'id' => $fileId]);
            exit;
        }
    }
}

http_response_code(400);
echo json_encode(['error' => 'No image file provided in upload request']);
