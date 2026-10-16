<?php
// ========================================================
// cPanel MySQL Database Configuration Template
// Copy this file to config.php and fill in your DB credentials
// ========================================================

define('DB_HOST', 'localhost');
define('DB_NAME', ''); // e.g. 'cpaneluser_hitachidb'
define('DB_USER', ''); // e.g. 'cpaneluser_dbuser'
define('DB_PASS', ''); // e.g. 'YourStrongPassword123'

function getDbConnection() {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            http_response_code(200);
            echo json_encode([
                "error" => "Database connection failed: " . $e->getMessage(),
                "db_error" => true
            ]);
            exit;
        }
    }
    return $pdo;
}
