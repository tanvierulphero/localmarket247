<?php
// =========================================================================
// 🚀 cPanel MySQL Database Configuration Template
// =========================================================================
// Copy this file to api/config.php and fill in your DB credentials
// =========================================================================

define('DB_HOST', 'localhost');              // 'localhost' or '127.0.0.1'
define('DB_NAME', '');                       // Example: 'localmar_hitachidb'
define('DB_USER', '');                       // Example: 'localmar_dbuser'
define('DB_PASS', '');                       // Example: 'YourStrongPassword123'
define('DB_PORT', '3306');                   // Default MySQL port 3306
define('DB_CHARSET', 'utf8mb4');             // Full Unicode support

/**
 * Get safe PDO database connection with automatic 503 protection & fallbacks.
 *
 * @return PDO|null
 */
function getDbConnection() {
    static $pdo = null;
    static $hasAttempted = false;

    if ($pdo !== null) {
        return $pdo;
    }

    if ($hasAttempted) {
        return null;
    }

    $hasAttempted = true;

    // Return null safely if credentials are not configured yet (prevents 503 errors)
    if (empty(DB_NAME) || empty(DB_USER)) {
        return null;
    }

    // Verify PDO MySQL driver exists
    if (!extension_loaded('pdo_mysql')) {
        error_log("Hitachi API Error: pdo_mysql extension is missing in PHP.");
        return null;
    }

    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
        PDO::ATTR_TIMEOUT            => 5, // 5 seconds connection timeout (prevents LiteSpeed 503 hangs)
    ];

    // Attempt 1: Direct DSN connection (e.g. localhost)
    try {
        $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        return $pdo;
    } catch (Throwable $e1) {
        // Attempt 2: Fallback to 127.0.0.1 IP if localhost socket was not accessible
        if (DB_HOST === 'localhost') {
            try {
                $fallbackDsn = "mysql:host=127.0.0.1;port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
                $pdo = new PDO($fallbackDsn, DB_USER, DB_PASS, $options);
                return $pdo;
            } catch (Throwable $e2) {
                error_log("MySQL fallback connection failed: " . $e2->getMessage());
            }
        }
        
        error_log("MySQL primary connection failed: " . $e1->getMessage());
        return null;
    }
}
