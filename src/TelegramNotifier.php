<?php
/**
 * Sends contact-form messages to a Telegram chat through the Bot API.
 *
 * Uses only PHP streams (no cURL extension, no SDK). The bot token and the
 * chat id come from environment variables (see src/config.php), so they
 * are never committed to the repository.
 */

declare(strict_types=1);

final class TelegramNotifier
{
    /** Telegram's limit for one message is 4096 characters. */
    private const MAX_LENGTH = 4000;

    public function __construct(
        private readonly string $token,
        private readonly string $chatId,
        private readonly int $timeout = 6,
    ) {
    }

    /**
     * Build a notifier from the config, or null when Telegram is not set up
     * (for example during local development).
     */
    public static function fromConfig(): ?self
    {
        $token  = config('telegram.token');
        $chatId = config('telegram.chat_id');

        return is_string($token) && $token !== '' && is_string($chatId) && $chatId !== ''
            ? new self($token, $chatId)
            : null;
    }

    /**
     * @param array{name: string, email: string, message: string} $data
     */
    public static function format(array $data): string
    {
        $text = "📬 New message from the portfolio\n\n"
            . "Name: {$data['name']}\n"
            . "E-mail: {$data['email']}\n\n"
            . $data['message'];

        return mb_strlen($text) > self::MAX_LENGTH
            ? mb_substr($text, 0, self::MAX_LENGTH) . '…'
            : $text;
    }

    /**
     * Send a plain-text message. Returns true only if Telegram confirms it.
     * Plain text (no parse_mode) means visitor input never needs escaping.
     */
    public function send(string $text): bool
    {
        $body = json_encode([
            'chat_id'                  => $this->chatId,
            'text'                     => $text,
            'disable_web_page_preview' => true,
        ], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);

        $context = stream_context_create([
            'http' => [
                'method'        => 'POST',
                'header'        => "Content-Type: application/json\r\n",
                'content'       => $body,
                'timeout'       => $this->timeout,
                'ignore_errors' => true, // read the JSON error body on 4xx/5xx
            ],
        ]);

        $url = 'https://api.telegram.org/bot' . rawurlencode($this->token) . '/sendMessage';
        $response = @file_get_contents($url, false, $context);

        if ($response === false) {
            error_log('Telegram: request failed (network or timeout).');
            return false;
        }

        $result = json_decode($response, true);
        if (!is_array($result) || ($result['ok'] ?? false) !== true) {
            // Log Telegram's description, never the token.
            error_log('Telegram: ' . (is_array($result) ? (string) ($result['description'] ?? 'unknown error') : 'invalid response'));
            return false;
        }

        return true;
    }
}
