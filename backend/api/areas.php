<?php

require_once __DIR__ . '/../utils/auth.php';

if ($method === 'GET') {
    if ($id) {
        // Get single area
        $stmt = $db->prepare("SELECT * FROM areas WHERE id = ?");
        $stmt->execute([$id]);
        $area = $stmt->fetch();
        
        if ($area) {
            echo json_encode($area);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Area not found']);
        }
    } else {
        // Get all areas
        $stmt = $db->query("SELECT * FROM areas ORDER BY name");
        $areas = $stmt->fetchAll();
        echo json_encode($areas);
    }
} elseif ($method === 'POST') {
    requireAdmin();
    
    $data = json_decode(file_get_contents('php://input'), true);
    $name = $data['name'] ?? '';
    $city = $data['city'] ?? '';
    $state = $data['state'] ?? '';
    
    if (empty($name)) {
        http_response_code(400);
        echo json_encode(['error' => 'Area name is required']);
        exit;
    }
    
    $stmt = $db->prepare("INSERT INTO areas (name, city, state) VALUES (?, ?, ?)");
    $stmt->execute([$name, $city, $state]);
    $areaId = $db->lastInsertId();
    
    echo json_encode([
        'success' => true,
        'id' => $areaId,
        'message' => 'Area created successfully'
    ]);
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}

