<?php
/**
 * Contact form: normalisation, validation and storage.
 *
 * Kept separate from the HTTP code in public/contact.php so the rules can
 * be read (and tested) on their own. Messages are appended to a log file
 * as JSON lines instead of being e-mailed.
 */

declare(strict_types=1);

final class ContactForm
{
    public const NAME_MAX = 80;
    public const EMAIL_MAX = 254;
    public const MESSAGE_MIN = 10;
    public const MESSAGE_MAX = 5000;

    /**
     * Normalise raw input: keep only expected fields, force strings, trim,
     * and remove control characters (newlines are kept in the message).
     *
     * @param array<string, mixed> $input Usually $_POST.
     * @return array{name: string, email: string, message: string}
     */
    public static function normalise(array $input): array
    {
        $text = static fn (mixed $v): string => is_string($v) ? trim($v) : '';

        return [
            'name'    => preg_replace('/[\x00-\x1F\x7F]/u', '', $text($input['name'] ?? '')) ?? '',
            'email'   => mb_strtolower($text($input['email'] ?? '')),
            'message' => preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', str_replace("\r\n", "\n", $text($input['message'] ?? ''))) ?? '',
        ];
    }

    /**
     * Validate normalised data. Returns field => error message; empty if valid.
     * The same rules are mirrored in the HTML attributes for the browser
     * and in js/contact-form.js for instant feedback.
     *
     * @param array{name: string, email: string, message: string} $data
     * @return array<string, string>
     */
    public static function validate(array $data): array
    {
        $errors = [];

        if ($data['name'] === '') {
            $errors['name'] = 'Please enter your name.';
        } elseif (mb_strlen($data['name']) > self::NAME_MAX) {
            $errors['name'] = 'Please keep your name under ' . self::NAME_MAX . ' characters.';
        }

        if ($data['email'] === '') {
            $errors['email'] = 'Please enter your e-mail address.';
        } elseif (
            mb_strlen($data['email']) > self::EMAIL_MAX
            || filter_var($data['email'], FILTER_VALIDATE_EMAIL) === false
        ) {
            $errors['email'] = 'Please enter a valid e-mail address, like name@example.com.';
        }

        $length = mb_strlen($data['message']);
        if ($length === 0) {
            $errors['message'] = 'Please write a message.';
        } elseif ($length < self::MESSAGE_MIN) {
            $errors['message'] = 'Your message is a little short. Please write at least ' . self::MESSAGE_MIN . ' characters.';
        } elseif ($length > self::MESSAGE_MAX) {
            $errors['message'] = 'Please keep your message under ' . self::MESSAGE_MAX . ' characters.';
        }

        return $errors;
    }

    /**
     * Append a message to the log file as one JSON object per line.
     *
     * @param array{name: string, email: string, message: string} $data
     */
    public static function store(array $data, string $logFile): void
    {
        $entry = [
            'received_at' => gmdate('c'),
            'name'        => $data['name'],
            'email'       => $data['email'],
            'message'     => $data['message'],
        ];

        $line = json_encode($entry, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);

        if (file_put_contents($logFile, $line . PHP_EOL, FILE_APPEND | LOCK_EX) === false) {
            throw new RuntimeException('Could not write the message log.');
        }
    }
}
