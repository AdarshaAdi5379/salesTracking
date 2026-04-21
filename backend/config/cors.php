<?php

// NOTE: CORS headers are now handled by Nginx to avoid duplicates
// This file is kept for backward compatibility but headers are set in Nginx config

// Handle preflight OPTIONS requests - Nginx should handle this, but keep as fallback
if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    header("Content-Length: 0");
    header("Content-Type: text/plain");
    exit(0);
}

// Set content type for non-OPTIONS requests
if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] !== 'OPTIONS') {
    header("Content-Type: application/json");
}
