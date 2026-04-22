<?php

// NOTE:
// - In production (Nginx + PHP-FPM), CORS is typically handled at the Nginx layer.
// - In local development, the project uses PHP's built-in server (`php -S ...`), so we
//   set CORS headers here to allow the Vite dev servers (ports 3000/3001) to call the API.

$isPhpBuiltInServer = (php_sapi_name() === 'cli-server');

// Allowed local dev origins (add more if you change Vite ports)
$allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
];

if ($isPhpBuiltInServer) {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin && in_array($origin, $allowedOrigins, true)) {
        header("Access-Control-Allow-Origin: $origin");
        header("Vary: Origin");
    } else {
        // Fallback for tools like curl/Postman (no Origin header)
        header("Access-Control-Allow-Origin: *");
    }

    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin");
    header("Access-Control-Expose-Headers: Content-Length, Content-Type");
}

// Handle preflight OPTIONS requests
if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    header("Content-Length: 0");
    header("Content-Type: text/plain");
    exit(0);
}

// Set content type for non-OPTIONS requests
if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] !== 'OPTIONS') {
    header("Content-Type: application/json");
}
