<?php

require_once __DIR__ . '/../utils/auth.php';

function uploadErrorMessage(int $errorCode): string {
    switch ($errorCode) {
        case UPLOAD_ERR_INI_SIZE:
            $uploadMax = ini_get('upload_max_filesize');
            $postMax = ini_get('post_max_size');
            return "Uploaded file exceeds server limits (upload_max_filesize={$uploadMax}, post_max_size={$postMax})";
        case UPLOAD_ERR_FORM_SIZE:
            return 'Uploaded file exceeds the MAX_FILE_SIZE limit specified by the form';
        case UPLOAD_ERR_PARTIAL:
            return 'File was only partially uploaded';
        case UPLOAD_ERR_NO_FILE:
            return 'No file was uploaded';
        case UPLOAD_ERR_NO_TMP_DIR:
            return 'Missing a temporary folder on the server';
        case UPLOAD_ERR_CANT_WRITE:
            return 'Failed to write file to disk';
        case UPLOAD_ERR_EXTENSION:
            return 'A PHP extension stopped the file upload';
        default:
            return 'Unknown upload error';
    }
}

if ($method === 'POST') {
    $user = requireSalesperson();
    
    if (!isset($_FILES['photo'])) {
        http_response_code(400);
        echo json_encode(['error' => 'No file uploaded (missing "photo" field). Please send multipart/form-data with a "photo" file.']);
        exit;
    }

    if ($_FILES['photo']['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(['error' => uploadErrorMessage((int)$_FILES['photo']['error'])]);
        exit;
    }
    
    $file = $_FILES['photo'];
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    $maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!in_array($file['type'], $allowedTypes)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed']);
        exit;
    }
    
    if ($file['size'] > $maxSize) {
        http_response_code(400);
        echo json_encode(['error' => 'File size exceeds 5MB limit']);
        exit;
    }
    
    // Create uploads directory if it doesn't exist
    $uploadDir = __DIR__ . '/../../uploads/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    
    // Generate unique filename
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = uniqid('visit_', true) . '.' . $extension;
    $filepath = $uploadDir . $filename;
    
    if (move_uploaded_file($file['tmp_name'], $filepath)) {
        // Return relative URL (adjust based on your server setup)
        $photoUrl = '/uploads/' . $filename;
        echo json_encode([
            'success' => true,
            'photo_url' => $photoUrl,
            'message' => 'File uploaded successfully'
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save file']);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
