<?php
// =========================================================================
// cPanel MySQL Database Diagnostic & Troubleshooting Tool
// Hitachi Solution Center / LocalMarket247
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
    <title>cPanel Database & PHP Diagnostic Tool</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #1e293b; padding: 20px; line-height: 1.6; max-width: 860px; margin: 0 auto; }
        .card { background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); margin-bottom: 20px; }
        h1, h2, h3, h4 { color: #0f172a; margin-top: 0; }
        .badge-success { background: #dcfce7; color: #166534; padding: 4px 10px; border-radius: 6px; font-weight: bold; font-size: 13px; }
        .badge-error { background: #fee2e2; color: #991b1b; padding: 4px 10px; border-radius: 6px; font-weight: bold; font-size: 13px; }
        .badge-warning { background: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: 6px; font-weight: bold; font-size: 13px; }
        .code-box { background: #0f172a; color: #38bdf8; padding: 12px; border-radius: 8px; font-family: monospace; font-size: 13px; overflow-x: auto; margin: 10px 0; }
        ol, ul { padding-left: 20px; }
        li { margin-bottom: 8px; }
        .step-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 16px; margin: 15px 0; color: #166534; }
        .alert-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 16px; margin: 15px 0; color: #991b1b; }
    </style>
</head>
<body>

<div class="card">
    <h2>🔧 cPanel Database & Server Diagnostic Tool</h2>
    <p>Real-time health report for your cPanel PHP environment & MySQL Database:</p>
    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 16px 0;">

    <!-- 1. PHP Version -->
    <h3>1. PHP Version Check:</h3>
    <p>Current PHP Version: <strong><?php echo phpversion(); ?></strong> 
    <?php if (version_compare(phpversion(), '7.4.0', '>=')): ?>
        <span class="badge-success">OK (Supported) ✅</span>
    <?php else: ?>
        <span class="badge-warning">Old PHP Version (Recommended 8.1 / 8.2 / 8.3 / 8.4) ⚠️</span>
    <?php endif; ?>
    </p>

    <!-- 2. PHP Database Extensions Check -->
    <h3>2. Database Extensions Check:</h3>
    <ul>
        <li>
            <strong>PDO Extension:</strong>
            <?php if (class_exists('PDO') && extension_loaded('pdo_mysql')): ?>
                <span class="badge-success">Enabled (pdo_mysql active) ✅</span>
            <?php else: ?>
                <span class="badge-error">DISABLED / NOT TICKED ❌</span>
            <?php endif; ?>
        </li>
        <li style="margin-top: 8px;">
            <strong>MySQLi Extension:</strong>
            <?php if (class_exists('mysqli') || extension_loaded('mysqli')): ?>
                <span class="badge-success">Enabled (mysqli active) ✅</span>
            <?php else: ?>
                <span class="badge-error">DISABLED ❌</span>
            <?php endif; ?>
        </li>
    </ul>

    <?php if (!class_exists('PDO') || !extension_loaded('pdo_mysql')): ?>
        <div class="alert-box">
            <h4>⚠️ How to Enable <code>pdo_mysql</code> in cPanel (1-Minute Fix):</h4>
            <p style="margin-bottom: 8px;">Your cPanel is running PHP <?php echo phpversion(); ?>, but the <strong>pdo_mysql</strong> extension checkbox is currently unticked in cPanel.</p>
            <ol>
                <li>Log in to your <strong>cPanel Dashboard</strong>.</li>
                <li>Search for and open <strong>"Select PHP Version"</strong> (or <strong>"MultiPHP Manager" / "PHP Extensions"</strong>).</li>
                <li>Click on the <strong>"Extensions"</strong> tab.</li>
                <li>Find <strong><code>pdo_mysql</code></strong> and <strong><code>pdo</code></strong> in the list and <strong>check/tick the boxes</strong> next to them.</li>
                <li>Refresh this page (<code>/api/test_db.php</code>)!</li>
            </ol>
        </div>
    <?php endif; ?>

    <!-- 3. config.php File Check -->
    <h3>3. config.php Configuration File Check:</h3>
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
    <h3>4. MySQL Connection Test:</h3>
    <?php
    $dbHost = defined('DB_HOST') ? DB_HOST : 'localhost';
    $dbName = defined('DB_NAME') ? DB_NAME : '';
    $dbUser = defined('DB_USER') ? DB_USER : '';
    $dbPass = defined('DB_PASS') ? DB_PASS : '';

    echo "<ul>";
    echo "<li><strong>DB_HOST:</strong> <code>" . htmlspecialchars($dbHost) . "</code></li>";
    echo "<li><strong>DB_NAME:</strong> <code>" . ($dbName ? htmlspecialchars($dbName) : '<span style="color:red;">EMPTY</span>') . "</code></li>";
    echo "<li><strong>DB_USER:</strong> <code>" . ($dbUser ? htmlspecialchars($dbUser) : '<span style="color:red;">EMPTY</span>') . "</code></li>";
    echo "<li><strong>DB_PASS:</strong> <code>" . (strlen($dbPass ?? '') > 0 ? "******** (" . strlen($dbPass ?? '') . " chars)" : '<span style="color:red;">EMPTY</span>') . "</code></li>";
    echo "</ul>";

    if (empty($dbName) || empty($dbUser)) {
        echo '<div style="background: #fef3c7; border: 1px solid #fde68a; padding: 14px; border-radius: 8px; color: #92400e;">';
        echo '⚠️ <strong>Notice:</strong> <code>DB_NAME</code> or <code>DB_USER</code> is empty in <code>api/config.php</code>.<br>';
        echo 'Open <code>public_html/api/config.php</code> in cPanel File Manager, enter your database name, user, and password, then save.';
        echo '</div>';
    } else {
        $db = null;
        $connectionError = '';

        if (function_exists('getDbConnection')) {
            try {
                $db = getDbConnection(true);
            } catch (Throwable $e) {
                $connectionError = $e->getMessage();
            }
        }

        if ($db) {
            echo '<div class="step-box">';
            echo '🎉 <strong>Success! Connected to MySQL database "' . htmlspecialchars($dbName) . '" successfully!</strong>';
            echo '</div>';

            // Check Tables
            echo '<h3 style="margin-top: 20px;">5. Database Tables Check:</h3>';
            try {
                $stmt = $db->query("SHOW TABLES");
                $rows = $stmt->fetchAll();
                $tables = [];
                foreach ($rows as $r) {
                    $vals = array_values($r);
                    if (!empty($vals[0])) $tables[] = $vals[0];
                }

                if (count($tables) > 0) {
                    echo '<p style="color: #166534;">Found <strong>' . count($tables) . '</strong> table(s): <code class="code-box">' . implode(', ', $tables) . '</code> ✅</p>';
                } else {
                    echo '<div style="background: #fef3c7; border: 1px solid #fde68a; padding: 14px; border-radius: 8px; color: #92400e;">';
                    echo '⚠️ <strong>No tables found in database!</strong><br>';
                    echo 'Open <strong>phpMyAdmin</strong> in cPanel -> Select database <code>' . htmlspecialchars($dbName) . '</code> -> Go to <strong>Import</strong> tab -> Choose <strong>schema.sql</strong> (or <strong>database.sql</strong>) and click <strong>Go</strong>.';
                    echo '</div>';
                }
            } catch (Throwable $te) {
                echo '<p style="color:red;">Table check notice: ' . htmlspecialchars($te->getMessage()) . '</p>';
            }
        } else {
            echo '<div class="alert-box">';
            echo '❌ <strong>Database Connection Failed:</strong> ' . htmlspecialchars($connectionError ?: 'Unable to connect to MySQL database.');
            echo '</div>';
            echo '<h4>Troubleshooting Checklist:</h4>';
            echo '<ol>';
            echo '<li><strong>Verify Password:</strong> Ensure the password in <code>api/config.php</code> matches the MySQL user password created in cPanel.</li>';
            echo '<li><strong>Check Permissions:</strong> In cPanel -> <strong>MySQL Databases</strong> -> Scroll to <strong>Add User to Database</strong> -> Select your User and Database -> Click <strong>Add</strong> -> Check <strong>ALL PRIVILEGES</strong> -> Click <strong>Make Changes</strong>.</li>';
            echo '<li><strong>Full Names:</strong> Make sure <code>DB_NAME</code> and <code>DB_USER</code> include your cPanel prefix (e.g., <code>localmar_247</code>).</li>';
            echo '</ol>';
        }
    }
    ?>
</div>

<div class="card" style="text-align: center; color: #64748b; font-size: 13px;">
    Jubayer Machineries &bull; cPanel Diagnostics Tool &bull; PHP <?php echo phpversion(); ?>
</div>

</body>
</html>
