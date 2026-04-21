<?php

require_once __DIR__ . '/../utils/auth.php';

if ($method === 'GET') {
    if ($id) {
        // Get single school
        $stmt = $db->prepare("SELECT * FROM schools WHERE id = ?");
        $stmt->execute([$id]);
        $school = $stmt->fetch();
        
        if ($school) {
            echo json_encode($school);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'School not found']);
        }
    } else {
        // Get schools by area or all schools with pagination
        $areaId = $_GET['area_id'] ?? null;
        $search = $_GET['search'] ?? null;
        $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
        $limit = isset($_GET['limit']) ? max(1, min(100, intval($_GET['limit']))) : 20;
        $noPagination = isset($_GET['no_pagination']) && $_GET['no_pagination'] === 'true';
        $offset = ($page - 1) * $limit;
        
        // Build WHERE conditions
        $whereConditions = [];
        $params = [];
        
        if ($areaId) {
            $whereConditions[] = "s.area_id = ?";
            $params[] = $areaId;
        }
        
        if ($search && trim($search) !== '') {
            $searchTerm = '%' . trim($search) . '%';
            $whereConditions[] = "(s.name LIKE ? OR s.address LIKE ?)";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }
        
        $whereClause = !empty($whereConditions) ? 'WHERE ' . implode(' AND ', $whereConditions) : '';
        
        // Build base query
        if ($noPagination && $areaId && !$search) {
            // Return all schools for the area (for route creation)
            $query = "SELECT s.*, a.name as area_name FROM schools s LEFT JOIN areas a ON s.area_id = a.id WHERE s.area_id = ? ORDER BY s.name";
            $stmt = $db->prepare($query);
            $stmt->execute([$areaId]);
            $schools = $stmt->fetchAll();
            echo json_encode($schools);
            exit;
        } else {
            // Count query
            $countQuery = "SELECT COUNT(*) as total FROM schools s LEFT JOIN areas a ON s.area_id = a.id " . $whereClause;
            $countStmt = $db->prepare($countQuery);
            $countStmt->execute($params);
            $total = $countStmt->fetch()['total'];
            
            // Data query
            $query = "SELECT s.*, a.name as area_name FROM schools s LEFT JOIN areas a ON s.area_id = a.id " . $whereClause . " ORDER BY s.name LIMIT ? OFFSET ?";
            $params[] = $limit;
            $params[] = $offset;
            $stmt = $db->prepare($query);
            $stmt->execute($params);
        }
        
        $schools = $stmt->fetchAll();
        $totalPages = ceil($total / $limit);
        
        echo json_encode([
            'data' => $schools,
            'pagination' => [
                'current_page' => $page,
                'per_page' => $limit,
                'total' => $total,
                'total_pages' => $totalPages,
                'has_next' => $page < $totalPages,
                'has_prev' => $page > 1
            ]
        ]);
    }
} elseif ($method === 'POST') {
    requireAdmin();
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Check if this is a bulk import
    if (isset($data['schools']) && is_array($data['schools'])) {
        // Bulk import
        $schools = $data['schools'];
        $successCount = 0;
        $errorCount = 0;
        $errors = [];
        
        $stmt = $db->prepare("INSERT INTO schools (area_id, name, type, address, latitude, longitude, phone, email, contact_person, google_place_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        
        foreach ($schools as $index => $school) {
            $areaId = $school['area_id'] ?? null;
            $name = $school['name'] ?? '';
            $type = $school['type'] ?? 'school';
            $address = $school['address'] ?? '';
            $latitude = $school['latitude'] ?? null;
            $longitude = $school['longitude'] ?? null;
            $phone = $school['phone'] ?? '';
            $email = $school['email'] ?? '';
            $contactPerson = $school['contact_person'] ?? '';
            $googlePlaceId = $school['google_place_id'] ?? '';
            
            if (empty($name) || empty($areaId)) {
                $errorCount++;
                $errors[] = "Row " . ($index + 1) . ": Name and area_id are required";
                continue;
            }
            
            try {
                $stmt->execute([$areaId, $name, $type, $address, $latitude, $longitude, $phone, $email, $contactPerson, $googlePlaceId]);
                $successCount++;
            } catch (Exception $e) {
                $errorCount++;
                $errors[] = "Row " . ($index + 1) . ": " . $e->getMessage();
            }
        }
        
        echo json_encode([
            'success' => true,
            'message' => "Bulk import completed: {$successCount} successful, {$errorCount} failed",
            'success_count' => $successCount,
            'error_count' => $errorCount,
            'errors' => $errors
        ]);
    } else {
        // Single school creation
        $areaId = $data['area_id'] ?? null;
        $name = $data['name'] ?? '';
        $type = $data['type'] ?? 'school';
        $address = $data['address'] ?? '';
        $latitude = $data['latitude'] ?? null;
        $longitude = $data['longitude'] ?? null;
        $phone = $data['phone'] ?? '';
        $email = $data['email'] ?? '';
        $contactPerson = $data['contact_person'] ?? '';
        $googlePlaceId = $data['google_place_id'] ?? '';
        
        if (empty($name) || empty($areaId)) {
            http_response_code(400);
            echo json_encode(['error' => 'Name and area_id are required']);
            exit;
        }
        
        $additionalFields = isset($data['additional_fields']) && $data['additional_fields'] ? json_encode($data['additional_fields']) : null;
        
        $stmt = $db->prepare("INSERT INTO schools (area_id, name, type, address, latitude, longitude, phone, email, contact_person, google_place_id, additional_fields) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$areaId, $name, $type, $address, $latitude, $longitude, $phone, $email, $contactPerson, $googlePlaceId, $additionalFields]);
        $schoolId = $db->lastInsertId();
        
        echo json_encode([
            'success' => true,
            'id' => $schoolId,
            'message' => 'School created successfully'
        ]);
    }
} elseif ($method === 'PUT') {
    requireAdmin();
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'School ID is required']);
        exit;
    }
    
    $data = json_decode(file_get_contents('php://input'), true);
    $name = $data['name'] ?? '';
    $type = $data['type'] ?? 'school';
    $address = $data['address'] ?? '';
    $latitude = $data['latitude'] ?? null;
    $longitude = $data['longitude'] ?? null;
    $phone = $data['phone'] ?? '';
    $email = $data['email'] ?? '';
    $contactPerson = $data['contact_person'] ?? '';
    $additionalFields = isset($data['additional_fields']) && $data['additional_fields'] ? json_encode($data['additional_fields']) : null;
    
    $stmt = $db->prepare("UPDATE schools SET name = ?, type = ?, address = ?, latitude = ?, longitude = ?, phone = ?, email = ?, contact_person = ?, additional_fields = ? WHERE id = ?");
    $stmt->execute([$name, $type, $address, $latitude, $longitude, $phone, $email, $contactPerson, $additionalFields, $id]);
    
    echo json_encode([
        'success' => true,
        'message' => 'School updated successfully'
    ]);
} elseif ($method === 'DELETE') {
    requireAdmin();
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'School ID is required']);
        exit;
    }
    
    $stmt = $db->prepare("DELETE FROM schools WHERE id = ?");
    $stmt->execute([$id]);
    
    echo json_encode([
        'success' => true,
        'message' => 'School deleted successfully'
    ]);
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}

