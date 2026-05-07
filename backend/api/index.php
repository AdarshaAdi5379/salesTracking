<?php
// Enable error reporting for debugging (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_reporting', E_ALL);

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../utils/env.php';
loadEnvFile(__DIR__ . '/../.env');
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/auth.php';

// Simple routing
$request_uri = $_SERVER['REQUEST_URI'] ?? '/';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path = parse_url($request_uri, PHP_URL_PATH);

// Remove /salesapi/api or /api from path (handle both local and remote)
$path = preg_replace('#^/salesapi/api|^/api#', '', $path);
$path = trim($path, '/');

// If path is empty after trimming, try to get from SCRIPT_NAME or PATH_INFO
if (empty($path) && isset($_SERVER['PATH_INFO'])) {
    $path = trim($_SERVER['PATH_INFO'], '/');
}

$segments = explode('/', $path);

// Route handling
try {
    $db = (new Database())->getConnection();
    
    if (count($segments) === 0 || $segments[0] === '') {
        echo json_encode(['message' => 'Edubricz Sales Tracking API']);
        exit;
    }

    $resource = $segments[0];
    $id = $segments[1] ?? null;

    // Debug: Log the resource being accessed
    // error_log("API Resource: " . $resource . " | Path: " . $path . " | Segments: " . json_encode($segments));

    switch ($resource) {
        case 'uploads':
            // Serve uploaded visit images from /uploads/<filename>.
            // NOTE: This endpoint is intentionally unauthenticated because <img> tags can't send Authorization headers.
            // If you need auth-protected images, switch to a signed URL or a token-based query param.
            $requested = $segments[1] ?? '';
            if ($requested === '') {
                http_response_code(404);
                echo json_encode(['error' => 'File not specified']);
                exit;
            }

            // Basic path traversal protection.
            if (str_contains($requested, '..') || str_contains($requested, '/') || str_contains($requested, '\\')) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid file path']);
                exit;
            }

            $uploadsDir = realpath(__DIR__ . '/../../uploads');
            if ($uploadsDir === false) {
                http_response_code(404);
                echo json_encode(['error' => 'Uploads directory not found']);
                exit;
            }

            $filePath = $uploadsDir . DIRECTORY_SEPARATOR . $requested;
            if (!is_file($filePath)) {
                http_response_code(404);
                echo json_encode(['error' => 'File not found']);
                exit;
            }

            $mime = 'application/octet-stream';
            if (function_exists('finfo_open')) {
                $finfo = finfo_open(FILEINFO_MIME_TYPE);
                if ($finfo) {
                    $detected = finfo_file($finfo, $filePath);
                    if (is_string($detected) && $detected !== '') $mime = $detected;
                    finfo_close($finfo);
                }
            }

            header('Content-Type: ' . $mime);
            header('Content-Length: ' . filesize($filePath));
            header('Cache-Control: private, max-age=3600');
            readfile($filePath);
            exit;

        case 'auth':
            require __DIR__ . '/auth.php';
            break;
        case 'areas':
            require __DIR__ . '/areas.php';
            break;
        case 'schools':
            require __DIR__ . '/schools.php';
            break;
        case 'routes':
            require __DIR__ . '/routes.php';
            break;
        case 'visits':
            require __DIR__ . '/visits.php';
            break;
        case 'reports':
            require __DIR__ . '/reports.php';
            break;
        case 'users':
            require __DIR__ . '/users.php';
            break;
        case 'upload':
            require __DIR__ . '/upload.php';
            break;
        case 'places':
            require __DIR__ . '/places.php';
            break;
        case 'coverage':
            require __DIR__ . '/coverage.php';
            break;
        default:
            http_response_code(404);
            error_log("404 - Resource not found: " . $resource . " | Path: " . $path . " | Segments: " . json_encode($segments) . " | Request URI: " . $request_uri);
            echo json_encode([
                'error' => 'Resource not found',
                'resource' => $resource,
                'path' => $path,
                'segments' => $segments,
                'request_uri' => $request_uri,
                'available_resources' => ['auth', 'areas', 'schools', 'routes', 'visits', 'reports', 'users', 'upload', 'uploads', 'places', 'coverage']
            ]);
            exit;
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    error_log("API Error: " . $e->getMessage() . " in " . $e->getFile() . " on line " . $e->getLine());
    echo json_encode([
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'trace' => $e->getTraceAsString()
    ]);
}
