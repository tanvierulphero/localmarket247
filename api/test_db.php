<?php
// =========================================================================
// cPanel MySQL Database Diagnostic & Troubleshooting Tool
// =========================================================================
@error_reporting(E_ALL);
@ini_set('display_errors', '1');
header('Content-Type: text/html; charset=utf-8');

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>cPanel Database Diagnostic Tool</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #1e293b; padding: 20px; line-height: 1.6; max-width: 800px; margin: 0 auto; }
        .card { background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); margin-bottom: 20px; }
        h1, h2, h3 { color: #0f172a; margin-top: 0; }
        .badge-success { background: #dcfce7; color: #166534; padding: 4px 10px; border-radius: 6px; font-weight: bold; }
        .badge-error { background: #fee2e2; color: #991b1b; padding: 4px 10px; border-radius: 6px; font-weight: bold; }
        .badge-warning { background: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: 6px; font-weight: bold; }
        .code-box { background: #0f172a; color: #38bdf8; padding: 12px; border-radius: 8px; font-family: monospace; font-size: 14px; overflow-x: auto; }
        ol, ul { padding-left: 20px; }
        li { margin-bottom: 8px; }
        .btn { background: #2563eb; color: #ffffff; border: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; cursor: pointer; }
        .btn:hover { background: #1d4ed8; }
    </style>
</head>
<body>

<div class="card">
    <h2>🔧 cPanel Database & Server Diagnostic Tool</h2>
    <p>Detailed status of your cPanel server and MySQL database:</p>
    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 16px 0;">

    <!-- 1. PHP Version -->
    <h3>1. PHP Version Check:</h3>
    <p>Current PHP Version: <strong><?php echo phpversion(); ?></strong> 
    <?php if (version_compare(phpversion(), '7.4.0', '>=')): ?>
        <span class="badge-success">OK (Supported) ✅</span>
    <?php else: ?>
        <span class="badge-warning">Old Version (Recommended PHP 8.1+) ⚠️</span>
    <?php endif; ?>
    </p>

    <!-- 2. PDO MySQL Extension -->
    <h3>2. PDO MySQL Extension Check:</h3>
    <?php if (extension_loaded('pdo_mysql')): ?>
        <p><span class="badge-success">Enabled (pdo_mysql is active) ✅</span></p>
    <?php else: ?>
        <p><span class="badge-error">DISABLED / NOT INSTALLED ❌</span></p>
        <p style="color: #991b1b; font-size: 13px;">
            Solution: Go to cPanel -> <strong>Select PHP Version</strong> (or MultiPHP Manager) -> <strong>Extensions</strong> tab -> Check and enable <code>pdo_mysql</code>.
        </p>
    <?php endif; ?>

    <!-- 3. config.php Check -->
    <h3>3. config.php File Check:</h3>
    <?php
    $configPath = __DIR__ . '/config.php';
    if (file_exists($configPath)) {
        echo '<p><span class="badge-success">Found at api/config.php ✅</span></p>';
        include_once $configPath;
    } else {
        echo '<p><span class="badge-error">Missing api/config.php File ❌</span></p>';
        echo '<p>Solution: Create <code>api/config.php</code> in cPanel File Manager and fill in your database credentials.</p>';
    }
    ?>

    <!-- 4. MySQL Connection Test -->
    <h3>4. MySQL Database Connection Test:</h3>
    <?php
    $dbHost = defined('DB_HOST') ? DB_HOST : 'localhost';
    $dbName = defined('DB_NAME') ? DB_NAME : '';
    $dbUser = defined('DB_USER') ? DB_USER : '';
    $dbPass = defined('DB_PASS') ? DB_PASS : '';

    echo "<ul>";
    echo "<li><strong>DB_HOST:</strong> <code>" . htmlspecialchars($dbHost) . "</code></li>";
    echo "<li><strong>DB_NAME:</strong> <code>" . ($dbName ? htmlspecialchars($dbName) : '<span style="color:red;">EMPTY</span>') . "</code></li>";
    echo "<li><strong>DB_USER:</strong> <code>" . ($dbUser ? htmlspecialchars($dbUser) : '<span style="color:red;">EMPTY</span>') . "</code></li>";
    echo "<li><strong>DB_PASS:</strong> <code>" . (strlen($dbPass) > 0 ? "******** (" . strlen($dbPass) . " chars)" : '<span style="color:red;">EMPTY</span>') . "</code></li>";
    echo "</ul>";

    if (empty($dbName) || empty($dbUser)) {
        echo '<div style="background: #fef3c7; border: 1px solid #fde68a; padding: 14px; border-radius: 8px; color: #92400e;">';
        echo '⚠️ <strong>Notice:</strong> <code>DB_NAME</code> or <code>DB_USER</code> is empty in <code>api/config.php</code>.<br>';
        echo 'Open <code>public_html/api/config.php</code> in cPanel File Manager, enter your database name, user, and password, then save.';
        echo '</div>';
    } else {
        $pdo = null;
        $connectionError = '';
        
        try {
            $dsn = "mysql:host=" . $dbHost . ";dbname=" . $dbName . ";charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_TIMEOUT => 5
            ];
            $pdo = new PDO($dsn, $dbUser, $dbPass, $options);
        } catch (Throwable $e) {
            $connectionError = $e->getMessage();
            // Try 127.0.0.1 fallback
            if ($dbHost === 'localhost') {
                try {
                    $dsn2 = "mysql:host=127.0.0.1;dbname=" . $dbName . ";charset=utf8mb4";
                    $pdo = new PDO($dsn2, $dbUser, $dbPass, $options);
                    $connectionError = '';
                } catch (Throwable $e2) {
                    $connectionError = $e2->getMessage();
                }
            }
        }

        if ($pdo) {
            echo '<div style="background: #dcfce7; border: 1px solid #bbf7d0; padding: 16px; border-radius: 8px; color: #166534; font-size: 16px;">';
            echo '🎉 <strong>Success! Connected to MySQL database "' . htmlspecialchars($dbName) . '" successfully!</strong>';
            echo '</div>';

            // Check Tables
            echo '<h3 style="margin-top: 20px;">5. Database Tables Check:</h3>';
            try {
                $stmt = $pdo->query("SHOW TABLES");
                $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);

                if (count($tables) > 0) {
                    echo '<p style="color: #166534;">Tables count: <strong>' . count($tables) . '</strong> (' . implode(', ', $tables) . ') ✅</p>';
                } else {
                    echo '<div style="background: #fef3c7; border: 1px solid #fde68a; padding: 14px; border-radius: 8px; color: #92400e;">';
                    echo '⚠️ <strong>No tables found in database!</strong><br>';
                    echo 'Open <strong>phpMyAdmin</strong> in cPanel -> Select database <code>' . htmlspecialchars($dbName) . '</code> -> Go to <strong>Import</strong> tab -> Choose <strong>schema.sql</strong> and click <strong>Go</strong>.';
                    echo '</div>';
                }
            } catch (Exception $te) {
                echo '<p style="color:red;">Table check error: ' . htmlspecialchars($te->getMessage()) . '</p>';
            }
        } else {
            echo '<div style="background: #fee2e2; border: 1px solid #fecaca; padding: 16px; border-radius: 8px; color: #991b1b;">';
            echo '❌ <strong>Database connection failed:</strong> ' . htmlspecialchars($connectionError);
            echo '</div>';
            echo '<h4 style="margin-top: 15px;">Troubleshooting Steps:</h4>';
            echo '<ol>';
            echo '<li><strong>Check Password:</strong> Ensure the database user password in <code>api/config.php</code> exactly matches the one set in cPanel MySQL Databases.</li>';
            echo '<li><strong>Grant Permissions:</strong> In cPanel -> <strong>MySQL Databases</strong> -> Under <strong>Add User to Database</strong>, select your User and Database, click <strong>Add</strong>, check <strong>ALL PRIVILEGES</strong>, and click <strong>Make Changes</strong>.</li>';
            echo '<li><strong>Use Full Names:</strong> Include the full cPanel prefix in database and user names (e.g. <code>localmar_hitachi</code>).</li>';
            echo '</ol>';
        }
    }
    ?>
</div>

<div class="card" style="text-align: center; color: #64748b; font-size: 13px;">
    Jubayer Machineries &bull; Diagnostics Utility &bull; PHP <?php echo phpversion(); ?>
</div>

</body>
</html>
