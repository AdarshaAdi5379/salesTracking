<?php

function verifyToken() {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    
    if (empty($authHeader) || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized - No token provided']);
        exit;
    }
    
    $token = $matches[1];
    // Simple token verification (in production, use JWT)
    // For now, we'll decode the user info from the token
    $userData = json_decode(base64_decode($token), true);
    
    if (!$userData || !isset($userData['id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid token']);
        exit;
    }
    
    return $userData;
}

function requireAdmin() {
    $user = verifyToken();
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden - Admin access required']);
        exit;
    }
    return $user;
}

function requireSalesperson() {
    $user = verifyToken();
    if (!in_array($user['role'], ['admin', 'salesperson'])) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden']);
        exit;
    }
    return $user;
}

