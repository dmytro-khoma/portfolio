<?php
/**
 * File-based sliding-window rate limiter.
 *
 * Stores, per key, the timestamps of recent attempts in one JSON file.
 * An exclusive file lock makes concurrent requests safe. This is enough for
 * a small portfolio site; a busy site would use Redis or a database.
 *
 * Keys are hashed before storage, so raw IP addresses are never written
 * to disk.
 */

declare(strict_types=1);

final class RateLimiter
{
    public function __construct(
        private readonly string $file,
        private readonly int $maxAttempts,
        private readonly int $windowSeconds,
    ) {
    }

    /**
     * Record an attempt for $key. Returns the number of seconds the caller
     * must wait, or 0 if the attempt is allowed.
     */
    public function hit(string $key): int
    {
        $handle = fopen($this->file, 'c+');
        if ($handle === false) {
            throw new RuntimeException('Rate limiter storage is not writable.');
        }

        try {
            flock($handle, LOCK_EX);

            $now = time();
            $data = json_decode(stream_get_contents($handle) ?: '{}', true);
            $data = is_array($data) ? $data : [];

            // Drop timestamps that are outside the window, for every key,
            // so the file never grows without limit.
            foreach ($data as $storedKey => $times) {
                $data[$storedKey] = array_values(array_filter(
                    (array) $times,
                    fn (mixed $t): bool => is_int($t) && $t > $now - $this->windowSeconds,
                ));
                if ($data[$storedKey] === []) {
                    unset($data[$storedKey]);
                }
            }

            $hash = hash('sha256', $key);
            $attempts = $data[$hash] ?? [];

            if (count($attempts) >= $this->maxAttempts) {
                $retryAfter = min($attempts) + $this->windowSeconds - $now;
            } else {
                $attempts[] = $now;
                $data[$hash] = $attempts;
                $retryAfter = 0;
            }

            ftruncate($handle, 0);
            rewind($handle);
            fwrite($handle, (string) json_encode($data));
            fflush($handle);

            return max(0, $retryAfter);
        } finally {
            flock($handle, LOCK_UN);
            fclose($handle);
        }
    }
}
