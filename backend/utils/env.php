<?php

/**
 * Minimal .env loader (no external deps).
 * Loads key=value pairs into $_ENV and getenv()/putenv().
 *
 * Notes:
 * - This project runs on PHP built-in server and simple shared hosting setups
 *   where .env is not automatically loaded.
 * - Values already set in the process environment are not overridden.
 */
function loadEnvFile($path) {
    if (!is_string($path) || $path === '' || !is_file($path)) {
        return;
    }

    $lines = @file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines === false) return;

    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) continue;

        $eqPos = strpos($line, '=');
        if ($eqPos === false) continue;

        $key = trim(substr($line, 0, $eqPos));
        $value = trim(substr($line, $eqPos + 1));

        if ($key === '') continue;

        // Strip surrounding quotes.
        if ((str_starts_with($value, '"') && str_ends_with($value, '"')) ||
            (str_starts_with($value, "'") && str_ends_with($value, "'"))) {
            $value = substr($value, 1, -1);
        }

        // Don't override existing env.
        $existing = $_ENV[$key] ?? getenv($key);
        if ($existing !== false && $existing !== null && $existing !== '') {
            continue;
        }

        $_ENV[$key] = $value;
        putenv($key . '=' . $value);
    }
}

