<?php
/**
 * Contact form endpoint.
 *
 * Accepts POST only. Steps, in order:
 *   1. CSRF token check
 *   2. Honeypot check (bots get a fake success and nothing is stored)
 *   3. Rate limit per IP address
 *   4. Normalise and validate input
 *   5. Append the message to storage/messages.log (no e-mail is sent)
 *
 * Response format depends on the client:
 *   - fetch() with "Accept: application/json"  -> JSON + HTTP status code
 *   - normal form post (no JavaScript)          -> 303 redirect back to the
 *     form, with the result stored as one-time "flash" data in the session
 */

declare(strict_types=1);

require __DIR__ . '/../src/bootstrap.php';

$wantsJson = str_contains($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json');

/**
 * Send the result in the format the client asked for, then stop.
 *
 * @param array<string, string> $errors
 * @param array<string, string> $old Input to refill the form with (no-JS only).
 */
$respond = static function (int $status, string $state, string $message, array $errors = [], array $old = []) use ($wantsJson): never {
    if ($wantsJson) {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
        echo json_encode(
            ['status' => $state, 'message' => $message, 'errors' => (object) $errors],
            JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR,
        );
        exit;
    }

    flash_set('contact', ['status' => $state, 'message' => $message, 'errors' => $errors, 'old' => $old]);
    header('Location: ./#contact', true, 303);
    exit;
};

// ---- 0. Method -------------------------------------------------------------
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    header('Allow: POST');
    if ($wantsJson) {
        $respond(405, 'error', 'This address only accepts form submissions.');
    }
    header('Location: ./#contact', true, 303);
    exit;
}

// ---- 1. CSRF ----------------------------------------------------------------
if (!csrf_is_valid($_POST['csrf_token'] ?? null)) {
    $respond(403, 'error', 'Your session has expired. Please reload the page and send the form again.');
}

// ---- 2. Honeypot ------------------------------------------------------------
// A filled hidden field means a bot. Pretend success so it does not retry.
if (($_POST['website'] ?? '') !== '') {
    $respond(200, 'success', 'Thank you! Your message has been sent.');
}

$data = ContactForm::normalise($_POST);

// ---- 3. Rate limit ----------------------------------------------------------
$storage = config('storage_dir');
if (!is_dir($storage) && !mkdir($storage, 0750, true) && !is_dir($storage)) {
    error_log('Contact form: storage directory could not be created.');
    $respond(500, 'error', 'Sorry, something went wrong on my side. Please try again later.');
}

$limiter = new RateLimiter(
    $storage . '/rate-limit.json',
    (int) config('rate_limit.max'),
    (int) config('rate_limit.seconds'),
);

$retryAfter = $limiter->hit(client_ip());
if ($retryAfter > 0) {
    header('Retry-After: ' . $retryAfter);
    $minutes = (int) ceil($retryAfter / 60);
    $respond(
        429,
        'error',
        "You have sent several messages in a short time. Please try again in {$minutes} minute" . ($minutes === 1 ? '' : 's') . '.',
        [],
        $data,
    );
}

// ---- 4. Validation ----------------------------------------------------------
$errors = ContactForm::validate($data);
if ($errors !== []) {
    $respond(422, 'error', 'Please check the highlighted fields.', $errors, $data);
}

// ---- 5. Store ---------------------------------------------------------------
try {
    ContactForm::store($data, $storage . '/messages.log');
} catch (Throwable $exception) {
    error_log('Contact form: ' . $exception->getMessage());
    $respond(500, 'error', 'Sorry, something went wrong on my side. Please try again later.', [], $data);
}

$respond(200, 'success', 'Thanks, your message was sent. I’ll reply soon.');
