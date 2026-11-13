<?php
/**
 * Bootstrap: loaded first by every public PHP entry point.
 *
 * - enables strict error handling
 * - loads configuration, helpers and classes
 * - starts a hardened session (needed for the CSRF token and flash data)
 * - sends security headers, including a nonce-based Content Security Policy
 */

declare(strict_types=1);

const APP_ROOT = __DIR__ . '/..';

error_reporting(E_ALL);
ini_set('display_errors', '0'); // never leak paths or stack traces to visitors
ini_set('log_errors', '1');

// Gzip the HTML/JSON this app outputs. Production servers usually compress
// at the web-server level too; this also covers `php -S`, which does not.
if (extension_loaded('zlib')) {
    ini_set('zlib.output_compression', '1');
}

require __DIR__ . '/helpers.php';
require __DIR__ . '/RateLimiter.php';
require __DIR__ . '/ContactForm.php';

/* ---- Session ------------------------------------------------------------- */

$isHttps = ($_SERVER['HTTPS'] ?? '') === 'on';

session_name('portfolio_session');
session_start([
    'cookie_httponly'  => true,
    'cookie_secure'    => $isHttps,
    'cookie_samesite'  => 'Lax',
    'use_strict_mode'  => true,
    'use_only_cookies' => true,
]);

/* ---- Security headers ---------------------------------------------------- */

send_security_headers(csp_nonce(), $isHttps);
