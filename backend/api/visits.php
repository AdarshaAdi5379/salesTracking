<?php

require_once __DIR__ . '/../utils/auth.php';

if ($method === 'GET') {
    $user = requireSalesperson();
    
    if ($id) {
        // Get single visit
        $stmt = $db->prepare("
            SELECT v.*, ri.route_id, ri.school_id, s.name as school_name, s.address, s.latitude, s.longitude
            FROM visits v
            LEFT JOIN route_items ri ON v.route_item_id = ri.id
            LEFT JOIN schools s ON ri.school_id = s.id
            WHERE v.id = ?
        ");
        $stmt->execute([$id]);
        $visit = $stmt->fetch();
        
        if ($visit) {
            echo json_encode($visit);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Visit not found']);
        }
    } else {
        // Get visits by route or date
        $routeId = $_GET['route_id'] ?? null;
        $date = $_GET['date'] ?? null;
        
        $query = "
            SELECT v.*, ri.route_id, ri.school_id, s.name as school_name, s.address, s.type,
                   r.date as route_date, r.salesperson_id
            FROM visits v
            LEFT JOIN route_items ri ON v.route_item_id = ri.id
            LEFT JOIN schools s ON ri.school_id = s.id
            LEFT JOIN routes r ON ri.route_id = r.id
            WHERE 1=1
        ";
        
        $params = [];
        
        if ($user['role'] === 'salesperson') {
            $query .= " AND r.salesperson_id = ?";
            $params[] = $user['id'];
        }
        
        if ($routeId) {
            $query .= " AND ri.route_id = ?";
            $params[] = $routeId;
        }
        
        if ($date) {
            $query .= " AND r.date = ?";
            $params[] = $date;
        }
        
        $query .= " ORDER BY v.visited_at DESC, v.created_at DESC";
        
        $stmt = $db->prepare($query);
        $stmt->execute($params);
        $visits = $stmt->fetchAll();
        
        echo json_encode($visits);
    }
} elseif ($method === 'POST') {
    $user = requireSalesperson();
    
    $data = json_decode(file_get_contents('php://input'), true);
    $routeItemId = $data['route_item_id'] ?? null;
    $status = $data['status'] ?? 'visited';
    $notes = $data['notes'] ?? '';
    $photoUrl = $data['photo_url'] ?? '';
    $latitude = $data['latitude'] ?? null;
    $longitude = $data['longitude'] ?? null;
    $usingCompetitor = isset($data['using_competitor']) ? (bool)$data['using_competitor'] : false;
    $competitorName = $data['competitor_name'] ?? null;
    $updateSchoolContact = $data['update_school_contact'] ?? null;
    $schoolId = $data['school_id'] ?? null;
    
    if (empty($routeItemId)) {
        http_response_code(400);
        echo json_encode(['error' => 'route_item_id is required']);
        exit;
    }
    
    // Verify route item belongs to salesperson's route and get school_id
    $stmt = $db->prepare("
        SELECT ri.id, ri.school_id FROM route_items ri
        LEFT JOIN routes r ON ri.route_id = r.id
        WHERE ri.id = ? AND r.salesperson_id = ?
    ");
    $stmt->execute([$routeItemId, $user['id']]);
    $routeItem = $stmt->fetch();
    
    if (!$routeItem) {
        http_response_code(403);
        echo json_encode(['error' => 'Route item not found or access denied']);
        exit;
    }
    
    // Use school_id from route item if not provided
    if (!$schoolId) {
        $schoolId = $routeItem['school_id'];
    }
    
    // Update school contact details if requested
    if ($updateSchoolContact && $schoolId) {
        $updates = [];
        $params = [];
        
        if (isset($updateSchoolContact['phone'])) {
            $updates[] = "phone = ?";
            $params[] = $updateSchoolContact['phone'];
        }
        if (isset($updateSchoolContact['email'])) {
            $updates[] = "email = ?";
            $params[] = $updateSchoolContact['email'];
        }
        if (isset($updateSchoolContact['contact_person'])) {
            $updates[] = "contact_person = ?";
            $params[] = $updateSchoolContact['contact_person'];
        }
        
        if (!empty($updates)) {
            $params[] = $schoolId;
            $updateQuery = "UPDATE schools SET " . implode(", ", $updates) . " WHERE id = ?";
            $updateStmt = $db->prepare($updateQuery);
            $updateStmt->execute($params);
        }
    }
    
    // Check if visit already exists for this route_item
    $stmt = $db->prepare("SELECT id, visited_at, status FROM visits WHERE route_item_id = ?");
    $stmt->execute([$routeItemId]);
    $existingVisit = $stmt->fetch();
    
    // Check if this school has been visited before (in any route)
    $stmt = $db->prepare("
        SELECT v.id, v.visited_at, v.status, r.date as route_date, r.id as route_id
        FROM visits v
        LEFT JOIN route_items ri ON v.route_item_id = ri.id
        LEFT JOIN routes r ON ri.route_id = r.id
        WHERE ri.school_id = ? AND v.status = 'visited' AND v.visited_at IS NOT NULL
        ORDER BY v.visited_at DESC
        LIMIT 1
    ");
    $stmt->execute([$schoolId]);
    $previousSchoolVisit = $stmt->fetch();
    
    // Determine visited_at timestamp
    // If status is 'visited', always set to current time (updates on each visit)
    // This ensures the latest visit date is always current
    $visitedAt = ($status === 'visited') ? date('Y-m-d H:i:s') : null;
    
    if ($existingVisit) {
        // Update existing visit for this route_item
        // Always update visited_at if status is 'visited' (even if it was visited before)
        $stmt = $db->prepare("
            UPDATE visits 
            SET status = ?, notes = ?, photo_url = ?, latitude = ?, longitude = ?, 
                using_competitor = ?, competitor_name = ?,
                visited_at = ?, updated_at = NOW()
            WHERE route_item_id = ?
        ");
        $stmt->execute([$status, $notes, $photoUrl, $latitude, $longitude, $usingCompetitor, $competitorName, $visitedAt, $routeItemId]);
        $visitId = $existingVisit['id'];
    } else {
        // Create new visit for this route_item
        $stmt = $db->prepare("
            INSERT INTO visits (route_item_id, status, notes, photo_url, latitude, longitude, using_competitor, competitor_name, visited_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$routeItemId, $status, $notes, $photoUrl, $latitude, $longitude, $usingCompetitor, $competitorName, $visitedAt]);
        $visitId = $db->lastInsertId();
    }
    
    // If school was previously visited and current status is 'visited',
    // the visited_at timestamp is now updated to the current time
    // This ensures the "last visited" date reflects the most recent visit
    
    echo json_encode([
        'success' => true,
        'id' => $visitId,
        'message' => 'Visit updated successfully'
    ]);
} elseif ($method === 'PUT') {
    $user = requireSalesperson();
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Visit ID is required']);
        exit;
    }
    
    $data = json_decode(file_get_contents('php://input'), true);
    $status = $data['status'] ?? null;
    $notes = $data['notes'] ?? null;
    $photoUrl = $data['photo_url'] ?? null;
    $latitude = $data['latitude'] ?? null;
    $longitude = $data['longitude'] ?? null;
    
    // Verify visit belongs to salesperson and get school_id
    $stmt = $db->prepare("
        SELECT v.id, ri.school_id FROM visits v
        LEFT JOIN route_items ri ON v.route_item_id = ri.id
        LEFT JOIN routes r ON ri.route_id = r.id
        WHERE v.id = ? AND r.salesperson_id = ?
    ");
    $stmt->execute([$id, $user['id']]);
    $visit = $stmt->fetch();
    
    if (!$visit) {
        http_response_code(403);
        echo json_encode(['error' => 'Visit not found or access denied']);
        exit;
    }
    
    // Update school contact details if requested
    if ($updateSchoolContact && ($schoolId || $visit['school_id'])) {
        $schoolIdToUpdate = $schoolId ?: $visit['school_id'];
        $updates = [];
        $params = [];
        
        if (isset($updateSchoolContact['phone'])) {
            $updates[] = "phone = ?";
            $params[] = $updateSchoolContact['phone'];
        }
        if (isset($updateSchoolContact['email'])) {
            $updates[] = "email = ?";
            $params[] = $updateSchoolContact['email'];
        }
        if (isset($updateSchoolContact['contact_person'])) {
            $updates[] = "contact_person = ?";
            $params[] = $updateSchoolContact['contact_person'];
        }
        
        if (!empty($updates)) {
            $params[] = $schoolIdToUpdate;
            $updateQuery = "UPDATE schools SET " . implode(", ", $updates) . " WHERE id = ?";
            $updateStmt = $db->prepare($updateQuery);
            $updateStmt->execute($params);
        }
    }
    
    $updates = [];
    $params = [];
    
    if ($status !== null) {
        $updates[] = "status = ?";
        $params[] = $status;
        if ($status === 'visited') {
            $updates[] = "visited_at = COALESCE(visited_at, NOW())";
        }
    }
    if ($notes !== null) {
        $updates[] = "notes = ?";
        $params[] = $notes;
    }
    if ($photoUrl !== null) {
        $updates[] = "photo_url = ?";
        $params[] = $photoUrl;
    }
    if ($latitude !== null) {
        $updates[] = "latitude = ?";
        $params[] = $latitude;
    }
    if ($longitude !== null) {
        $updates[] = "longitude = ?";
        $params[] = $longitude;
    }
    if ($usingCompetitor !== null) {
        $updates[] = "using_competitor = ?";
        $params[] = $usingCompetitor;
    }
    if ($competitorName !== null) {
        $updates[] = "competitor_name = ?";
        $params[] = $competitorName;
    }
    
    if (empty($updates)) {
        http_response_code(400);
        echo json_encode(['error' => 'No fields to update']);
        exit;
    }
    
    $updates[] = "updated_at = NOW()";
    $params[] = $id;
    
    $query = "UPDATE visits SET " . implode(", ", $updates) . " WHERE id = ?";
    $stmt = $db->prepare($query);
    $stmt->execute($params);
    
    echo json_encode([
        'success' => true,
        'message' => 'Visit updated successfully'
    ]);
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}

