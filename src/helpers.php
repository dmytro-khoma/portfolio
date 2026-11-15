<?php
/**
 * Small, framework-free helper functions used by templates and endpoints.
 *
 * Rule of thumb used across the project: data is escaped at the moment it
 * is printed, with e(). Templates never echo a variable without it.
 */

declare(strict_types=1);

/* ---- Configuration ------------------------------------------------------- */

/**
 * Read a configuration value with dot notation, e.g. config('links.github').
 */
function config(string $key, mixed $default = null): mixed
{
    static $config = null;
    $config ??= require __DIR__ . '/config.php';

    $value = $config;
    foreach (explode('.', $key) as $segment) {
        if (!is_array($value) || !array_key_exists($segment, $value)) {
            return $default;
        }
        $value = $value[$segment];
    }

    return $value;
}

/* ---- Output -------------------------------------------------------------- */

/**
 * Escape a value for safe use in HTML text and attribute values.
 */
function e(string|int|float|null $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE | ENT_HTML5, 'UTF-8');
}

/**
 * Render a template from src/templates with its own isolated variables.
 *
 * @param array<string, mixed> $data Variables made available to the template.
 */
function render(string $template, array $data = []): void
{
    $file = __DIR__ . '/templates/' . $template . '.php';

    if (!is_file($file)) {
        throw new RuntimeException("Template not found: {$template}");
    }

    // A closure gives the template a clean scope: only $data is visible.
    (static function (string $__file, array $__data): void {
        extract($__data, EXTR_SKIP);
        require $__file;
    })($file, $data);
}

/**
 * Inline SVG icon referencing the sprite in templates/partials/icons.php.
 */
function icon(string $name, string $extraClass = ''): string
{
    $class = trim('icon icon--' . $name . ' ' . $extraClass);

    return '<svg class="' . e($class) . '" aria-hidden="true" focusable="false">'
        . '<use href="#i-' . e($name) . '"></use></svg>';
}

/**
 * Read the CSS source files in cascade-layer order and return them as one
 * lightly minified string for an inline <style> block.
 *
 * Why inline: the whole stylesheet is small (~8 KB gzipped), and inlining it
 * removes every render-blocking request on this single-page site. The
 * source stays split into readable files for development.
 */
function inline_css(): string
{
    $files = ['tokens', 'reset', 'base', 'layout', 'components', 'effects', 'utilities'];
    $css = '';

    foreach ($files as $name) {
        $css .= file_get_contents(APP_ROOT . "/public/assets/css/{$name}.css") . "\n";
    }

    $css = preg_replace('~/\*.*?\*/~s', '', $css) ?? $css;   // comments
    $css = preg_replace('~\s*\n\s*~', "\n", $css) ?? $css;   // indentation, blank lines

    return trim($css);
}

/* ---- Request ------------------------------------------------------------- */

/**
 * The visitor's IP address. Behind a trusted proxy, REMOTE_ADDR is the proxy
 * itself, so the first address in X-Forwarded-For is used instead. A client
 * could fake that header, but here the IP only feeds the contact-form rate
 * limit, which also has a CSRF token and a honeypot behind it.
 */
function client_ip(): string
{
    if (config('trust_proxy') && !empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $first = trim(explode(',', (string) $_SERVER['HTTP_X_FORWARDED_FOR'])[0]);
        if (filter_var($first, FILTER_VALIDATE_IP)) {
            return $first;
        }
    }

    return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
}

/* ---- Security ------------------------------------------------------------ */

/**
 * One random nonce per request, used to allow our own inline <style> and
 * <script> blocks under the Content Security Policy.
 */
function csp_nonce(): string
{
    static $nonce = null;
    $nonce ??= base64_encode(random_bytes(16));

    return $nonce;
}

function send_security_headers(string $nonce, bool $isHttps): void
{
    $csp = implode('; ', [
        "default-src 'self'",
        "script-src 'self' 'nonce-{$nonce}'",
        "style-src 'self' 'nonce-{$nonce}'",
        "img-src 'self' data:",
        "media-src 'self'",
        "font-src 'self'",
        "connect-src 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "object-src 'none'",
    ]);

    header_remove('X-Powered-By'); // do not advertise the PHP version
    header('Content-Security-Policy: ' . $csp);
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header('Permissions-Policy: camera=(), microphone=(), geolocation=()');
    header('Cross-Origin-Opener-Policy: same-origin');

    if ($isHttps) {
        header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
    }
}

/**
 * The CSRF token for this session (created on first use).
 */
function csrf_token(): string
{
    if (empty($_SESSION['csrf_token']) || !is_string($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }

    return $_SESSION['csrf_token'];
}

function csrf_is_valid(mixed $token): bool
{
    return is_string($token)
        && isset($_SESSION['csrf_token'])
        && hash_equals($_SESSION['csrf_token'], $token);
}

/* ---- Flash data (one-request session storage) ---------------------------- */

/**
 * Store a value for the next request only.
 */
function flash_set(string $key, mixed $value): void
{
    $_SESSION['flash'][$key] = $value;
}

/**
 * Read a flashed value and remove it.
 */
function flash_get(string $key): mixed
{
    $value = $_SESSION['flash'][$key] ?? null;
    unset($_SESSION['flash'][$key]);

    return $value;
}
