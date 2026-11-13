<?php
/**
 * media.php — serve the demo video with HTTP Range support.
 *
 * Why this exists: browsers seek in a video by requesting byte ranges
 * ("Range: bytes=1000-"). Apache and Nginx support that for static files,
 * but PHP's built-in development server (php -S) does not: it always sends
 * the whole file with "200 OK", so seeking breaks. This script implements
 * single-range requests (RFC 9110), so the player works with php -S too.
 *
 * On a production server you can point the sources in src/config.php
 * straight at the files in assets/media/ and delete this script.
 *
 * Security: only files in the whitelist below can be served.
 */

declare(strict_types=1);

const MEDIA_FILES = [
    'demo.mp4'  => 'video/mp4',
    'demo.webm' => 'video/webm',
];
const CHUNK_SIZE = 65536;

header_remove('X-Powered-By');
header('X-Content-Type-Options: nosniff');

$name = $_GET['file'] ?? '';
if (!is_string($name) || !isset(MEDIA_FILES[$name])) {
    http_response_code(404);
    exit;
}

$path = __DIR__ . '/assets/media/' . $name;
$size = is_file($path) ? filesize($path) : false;
if ($size === false) {
    http_response_code(404);
    exit;
}

$start = 0;
$end = $size - 1;

// Parse a single "bytes=start-end" range; "bytes=500-" and "bytes=-500"
// (the last 500 bytes) are both valid forms.
$range = $_SERVER['HTTP_RANGE'] ?? '';
if ($range !== '') {
    if (!preg_match('/^bytes=(\d*)-(\d*)$/', $range, $m) || ($m[1] === '' && $m[2] === '')) {
        http_response_code(416);
        header("Content-Range: bytes */{$size}");
        exit;
    }

    if ($m[1] === '') {                       // suffix range: last N bytes
        $start = max(0, $size - (int) $m[2]);
    } else {
        $start = (int) $m[1];
        $end = $m[2] === '' ? $size - 1 : min((int) $m[2], $size - 1);
    }

    if ($start > $end || $start >= $size) {
        http_response_code(416);
        header("Content-Range: bytes */{$size}");
        exit;
    }

    http_response_code(206);
    header("Content-Range: bytes {$start}-{$end}/{$size}");
}

$length = $end - $start + 1;

header('Content-Type: ' . MEDIA_FILES[$name]);
header('Accept-Ranges: bytes');
header('Content-Length: ' . $length);
header('Cache-Control: public, max-age=604800');
header('Last-Modified: ' . gmdate('D, d M Y H:i:s', (int) filemtime($path)) . ' GMT');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'HEAD') {
    exit;
}

$handle = fopen($path, 'rb');
if ($handle === false) {
    http_response_code(500);
    exit;
}

fseek($handle, $start);
while ($length > 0 && !feof($handle) && connection_aborted() === 0) {
    $chunk = fread($handle, min(CHUNK_SIZE, $length));
    if ($chunk === false) {
        break;
    }
    echo $chunk;
    flush();
    $length -= strlen($chunk);
}
fclose($handle);
