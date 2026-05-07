<?php

require_once __DIR__ . '/../utils/auth.php';

if ($method === 'GET') {
    $user = requireSalesperson();
    
    if ($id && isset($_GET['uncovered'])) {
        // Get uncovered schools from a specific route
        $stmt = $db->prepare("
            SELECT r.*, u.name as salesperson_name, a.name as area_name
            FROM routes r
            LEFT JOIN users u ON r.salesperson_id = u.id
            LEFT JOIN areas a ON r.area_id = a.id
            WHERE r.id = ?
        ");
        $stmt->execute([$id]);
        $route = $stmt->fetch();
        
        if (!$route) {
            http_response_code(404);
            echo json_encode(['error' => 'Route not found']);
            exit;
        }
        
        // Get uncovered schools (not visited or status is not_visited)
        // A school is considered "covered" only if it has a visit with status = 'visited'
        // All other cases (no visit, not_visited, invalid_location, follow_up, meeting_scheduled) are considered uncovered
        $stmt = $db->prepare("
            SELECT ri.*, s.id as school_id, s.name as school_name, s.type, s.address, s.latitude, s.longitude,
                   COALESCE(v.status, 'not_visited') as visit_status
            FROM route_items ri
            LEFT JOIN schools s ON ri.school_id = s.id
            LEFT JOIN visits v ON ri.id = v.route_item_id
            WHERE ri.route_id = ?
            AND (v.status IS NULL OR v.status != 'visited')
            ORDER BY ri.order_index
        ");
        $stmt->execute([$id]);
        $uncovered = $stmt->fetchAll();
        
        echo json_encode([
            'route' => $route,
            'uncovered_schools' => $uncovered,
            'count' => count($uncovered)
        ]);
    } elseif ($id) {
        // Get single route with items
        $stmt = $db->prepare("
            SELECT r.*, u.name as salesperson_name, a.name as area_name
            FROM routes r
            LEFT JOIN users u ON r.salesperson_id = u.id
            LEFT JOIN areas a ON r.area_id = a.id
            WHERE r.id = ?
        ");
        $stmt->execute([$id]);
        $route = $stmt->fetch();
        
        if (!$route) {
            http_response_code(404);
            echo json_encode(['error' => 'Route not found']);
            exit;
        }
        
        // Get route items with school details
        // Get the most recent visit status for each school (across all routes)
        $stmt = $db->prepare("
            SELECT ri.*, s.name as school_name, s.type, s.address, s.latitude, s.longitude, s.phone, s.contact_person,
                   s.email,
                   v.status as visit_status, v.notes, v.photo_url, v.visited_at, v.latitude as visit_lat, v.longitude as visit_lng,
                   v.using_competitor, v.competitor_name,
                   v.deal_closed, v.deal_value, v.deal_issues,
                   (SELECT v2.visited_at FROM visits v2 
                    LEFT JOIN route_items ri2 ON v2.route_item_id = ri2.id 
                    WHERE ri2.school_id = s.id AND v2.status = 'visited' AND v2.visited_at IS NOT NULL 
                    ORDER BY v2.visited_at DESC LIMIT 1) as last_visited_at
            FROM route_items ri
            LEFT JOIN schools s ON ri.school_id = s.id
            LEFT JOIN visits v ON ri.id = v.route_item_id
            WHERE ri.route_id = ?
            ORDER BY ri.order_index
        ");
        $stmt->execute([$id]);
        $route['items'] = $stmt->fetchAll();
        
        echo json_encode($route);
    } else {
        // Get routes - admin sees all, salesperson sees only their own
        $salespersonId = $_GET['salesperson_id'] ?? null;
        $date = $_GET['date'] ?? null;
        $areaId = $_GET['area_id'] ?? null;
        $allArea = isset($_GET['all_area']) && $_GET['all_area'] === 'true';
        
        $query = "
            SELECT r.*, u.name as salesperson_name, a.name as area_name,
                   COUNT(DISTINCT ri.id) as total_items,
                   COUNT(DISTINCT CASE WHEN v.status = 'visited' THEN v.id END) as visited_count
            FROM routes r
            LEFT JOIN users u ON r.salesperson_id = u.id
            LEFT JOIN areas a ON r.area_id = a.id
            LEFT JOIN route_items ri ON r.id = ri.route_id
            LEFT JOIN visits v ON ri.id = v.route_item_id
        ";
        
        $conditions = [];
        $params = [];
        
        if ($user['role'] === 'salesperson') {
            // Special case: allow salespersons to query all routes for a specific area for TODAY only,
            // used by the mobile self-assignment flow to detect already-visited schools.
            if (!($allArea && $areaId && $date && $date === date('Y-m-d'))) {
                $conditions[] = "r.salesperson_id = ?";
                $params[] = $user['id'];
            }
        } elseif ($salespersonId) {
            $conditions[] = "r.salesperson_id = ?";
            $params[] = $salespersonId;
        }

        if ($areaId && $areaId !== '') {
            $conditions[] = "r.area_id = ?";
            $params[] = $areaId;
        }
        
        if ($date && $date !== '') {
            $conditions[] = "r.date = ?";
            $params[] = $date;
        }
        
        if (count($conditions) > 0) {
            $query .= " WHERE " . implode(" AND ", $conditions);
        }
        
        $query .= " GROUP BY r.id ORDER BY r.date DESC, r.created_at DESC";
        
        $stmt = $db->prepare($query);
        $stmt->execute($params);
        $routes = $stmt->fetchAll();
        
        echo json_encode($routes);
    }
} elseif ($method === 'POST') {
    $user = requireSalesperson();
    
    $data = json_decode(file_get_contents('php://input'), true);
    $salespersonId = $data['salesperson_id'] ?? null;
    $areaId = $data['area_id'] ?? null;
    $date = $data['date'] ?? date('Y-m-d');
    $name = $data['name'] ?? '';
    $schoolIds = $data['school_ids'] ?? [];

    // Salesperson can only create routes for themselves.
    if ($user['role'] === 'salesperson') {
        $salespersonId = $user['id'];
        $today = date('Y-m-d');
        if ($date !== $today) {
            http_response_code(400);
            echo json_encode(['error' => 'Salesperson can create routes only for today']);
            exit;
        }
    }
    
    if (empty($salespersonId) || empty($areaId) || empty($date)) {
        http_response_code(400);
        echo json_encode(['error' => 'salesperson_id, area_id, and date are required']);
        exit;
    }
    
    if (empty($schoolIds)) {
        http_response_code(400);
        echo json_encode(['error' => 'At least one school must be selected']);
        exit;
    }

    // Ensure salespeople cannot spoof another salesperson_id
    if ($user['role'] === 'salesperson' && isset($data['salesperson_id']) && (string)$data['salesperson_id'] !== (string)$user['id']) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden']);
        exit;
    }
    
    try {
        $db->beginTransaction();
        
        // Create route
        $stmt = $db->prepare("INSERT INTO routes (salesperson_id, area_id, date, name, status) VALUES (?, ?, ?, ?, 'active')");
        $stmt->execute([$salespersonId, $areaId, $date, $name]);
        $routeId = $db->lastInsertId();
        
        // Add route items
        $stmt = $db->prepare("INSERT INTO route_items (route_id, school_id, order_index) VALUES (?, ?, ?)");
        foreach ($schoolIds as $index => $schoolId) {
            $stmt->execute([$routeId, $schoolId, $index + 1]);
        }
        
        $db->commit();
        
        echo json_encode([
            'success' => true,
            'id' => $routeId,
            'message' => 'Route created successfully'
        ]);
    } catch (Exception $e) {
        $db->rollBack();
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create route: ' . $e->getMessage()]);
    }
} elseif ($method === 'POST' && isset($_GET['auto_assign'])) {
    // Auto-assign routes - distribute schools across multiple routes
    requireAdmin();
    
    $data = json_decode(file_get_contents('php://input'), true);
    $areaId = $data['area_id'] ?? null;
    $date = $data['date'] ?? date('Y-m-d');
    $salespersonIds = $data['salesperson_ids'] ?? [];
    $maxSchoolsPerRoute = isset($data['max_schools_per_route']) ? max(1, intval($data['max_schools_per_route'])) : 20;
    $schoolIds = $data['school_ids'] ?? [];
    $routeNamePrefix = $data['route_name_prefix'] ?? 'Auto Route';
    $excludeVisited = isset($data['exclude_visited']) ? (bool)$data['exclude_visited'] : false;
    
    if (empty($areaId) || empty($date) || empty($salespersonIds) || !is_array($salespersonIds) || count($salespersonIds) === 0) {
        http_response_code(400);
        echo json_encode(['error' => 'area_id, date, and at least one salesperson_id are required']);
        exit;
    }
    
    if (empty($schoolIds) || !is_array($schoolIds) || count($schoolIds) === 0) {
        http_response_code(400);
        echo json_encode(['error' => 'At least one school must be selected']);
        exit;
    }
    
    try {
        $db->beginTransaction();
        
        // Filter out visited schools if requested
        if ($excludeVisited) {
            $stmt = $db->prepare("
                SELECT DISTINCT ri.school_id
                FROM route_items ri
                LEFT JOIN visits v ON ri.id = v.route_item_id
                LEFT JOIN routes r ON ri.route_id = r.id
                WHERE r.date = ? AND v.status = 'visited'
            ");
            $stmt->execute([$date]);
            $visitedSchoolIds = array_column($stmt->fetchAll(), 'school_id');
            $schoolIds = array_diff($schoolIds, $visitedSchoolIds);
            
            if (empty($schoolIds)) {
                $db->rollBack();
                echo json_encode([
                    'success' => false,
                    'message' => 'All selected schools have already been visited on this date'
                ]);
                exit;
            }
        }
        
        // Get school details for ordering (optional: order by location for better route optimization)
        $placeholders = implode(',', array_fill(0, count($schoolIds), '?'));
        $stmt = $db->prepare("
            SELECT id, name, latitude, longitude 
            FROM schools 
            WHERE id IN ($placeholders) AND area_id = ?
            ORDER BY name
        ");
        $params = array_merge($schoolIds, [$areaId]);
        $stmt->execute($params);
        $schoolsData = $stmt->fetchAll();
        
        // Distribute schools across salespersons
        $totalSchools = count($schoolsData);
        $totalSalespersons = count($salespersonIds);
        $schoolsPerSalesperson = ceil($totalSchools / $totalSalespersons);
        
        $createdRoutes = [];
        $schoolIndex = 0;
        
        foreach ($salespersonIds as $salespersonIndex => $salespersonId) {
            // Calculate how many schools for this salesperson
            $remainingSalespersons = $totalSalespersons - $salespersonIndex;
            $remainingSchools = $totalSchools - $schoolIndex;
            $schoolsForThisPerson = min($maxSchoolsPerRoute, ceil($remainingSchools / $remainingSalespersons));
            
            if ($schoolsForThisPerson <= 0 || $schoolIndex >= $totalSchools) {
                break;
            }
            
            // Get schools for this route
            $schoolsForRoute = array_slice($schoolsData, $schoolIndex, $schoolsForThisPerson);
            $schoolIdsForRoute = array_column($schoolsForRoute, 'id');
            
            // Create route for this salesperson
            $routeName = $routeNamePrefix . ' ' . ($salespersonIndex + 1);
            $stmt = $db->prepare("INSERT INTO routes (salesperson_id, area_id, date, name, status) VALUES (?, ?, ?, ?, 'active')");
            $stmt->execute([$salespersonId, $areaId, $date, $routeName]);
            $routeId = $db->lastInsertId();
            
            // Add route items
            $stmt = $db->prepare("INSERT INTO route_items (route_id, school_id, order_index) VALUES (?, ?, ?)");
            foreach ($schoolIdsForRoute as $index => $schoolId) {
                $stmt->execute([$routeId, $schoolId, $index + 1]);
            }
            
            $createdRoutes[] = [
                'route_id' => $routeId,
                'salesperson_id' => $salespersonId,
                'school_count' => count($schoolIdsForRoute),
                'route_name' => $routeName
            ];
            
            $schoolIndex += $schoolsForThisPerson;
        }
        
        $db->commit();
        
        echo json_encode([
            'success' => true,
            'message' => "Successfully created " . count($createdRoutes) . " route(s) with " . $totalSchools . " school(s)",
            'routes' => $createdRoutes,
            'total_routes' => count($createdRoutes),
            'total_schools' => $totalSchools
        ]);
    } catch (Exception $e) {
        $db->rollBack();
        http_response_code(500);
        echo json_encode(['error' => 'Failed to auto-assign routes: ' . $e->getMessage()]);
    }
} elseif ($method === 'POST' && isset($_GET['move_uncovered'])) {
    // Move uncovered schools to next day route
    requireAdmin();
    
    $data = json_decode(file_get_contents('php://input'), true);
    $routeId = $data['route_id'] ?? null;
    $nextDate = $data['next_date'] ?? null;
    $salespersonId = $data['salesperson_id'] ?? null;
    
    if (!$routeId || !$nextDate) {
        http_response_code(400);
        echo json_encode(['error' => 'route_id and next_date are required']);
        exit;
    }
    
    try {
        $db->beginTransaction();
        
        // Get the original route
        $stmt = $db->prepare("SELECT * FROM routes WHERE id = ?");
        $stmt->execute([$routeId]);
        $originalRoute = $stmt->fetch();
        
        if (!$originalRoute) {
            throw new Exception('Route not found');
        }
        
        // Use provided salesperson_id or use the original route's salesperson
        $targetSalespersonId = $salespersonId ?: $originalRoute['salesperson_id'];
        
        // Get uncovered schools from the route
        // A school is considered "covered" only if it has a visit with status = 'visited'
        $stmt = $db->prepare("
            SELECT ri.school_id, ri.order_index
            FROM route_items ri
            LEFT JOIN visits v ON ri.id = v.route_item_id
            WHERE ri.route_id = ?
            AND (v.status IS NULL OR v.status != 'visited')
            ORDER BY ri.order_index
        ");
        $stmt->execute([$routeId]);
        $uncoveredItems = $stmt->fetchAll();
        
        if (empty($uncoveredItems)) {
            $db->rollBack();
            echo json_encode([
                'success' => false,
                'message' => 'No uncovered schools found in this route'
            ]);
            exit;
        }
        
        // Check if a route already exists for the next date, same salesperson and area
        $stmt = $db->prepare("
            SELECT id FROM routes 
            WHERE date = ? AND salesperson_id = ? AND area_id = ?
        ");
        $stmt->execute([$nextDate, $targetSalespersonId, $originalRoute['area_id']]);
        $existingRoute = $stmt->fetch();
        
        if ($existingRoute) {
            $newRouteId = $existingRoute['id'];
        } else {
            // Create new route for next day
            $routeName = $data['route_name'] ?? ($originalRoute['name'] . ' - Continued');
            $stmt = $db->prepare("
                INSERT INTO routes (salesperson_id, area_id, date, name, status) 
                VALUES (?, ?, ?, ?, 'active')
            ");
            $stmt->execute([
                $targetSalespersonId,
                $originalRoute['area_id'],
                $nextDate,
                $routeName
            ]);
            $newRouteId = $db->lastInsertId();
        }
        
        // Get the highest order_index in the new route
        $stmt = $db->prepare("
            SELECT COALESCE(MAX(order_index), 0) as max_order 
            FROM route_items 
            WHERE route_id = ?
        ");
        $stmt->execute([$newRouteId]);
        $maxOrder = $stmt->fetch()['max_order'] ?? 0;
        
        // Add uncovered schools to the new route
        $stmt = $db->prepare("
            INSERT INTO route_items (route_id, school_id, order_index) 
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE order_index = VALUES(order_index)
        ");
        
        $addedCount = 0;
        foreach ($uncoveredItems as $index => $item) {
            try {
                $stmt->execute([$newRouteId, $item['school_id'], $maxOrder + $index + 1]);
                $addedCount++;
            } catch (Exception $e) {
                // Skip if school already exists in route
                continue;
            }
        }
        
        $db->commit();
        
        echo json_encode([
            'success' => true,
            'message' => "Successfully moved {$addedCount} uncovered school(s) to route for {$nextDate}",
            'route_id' => $newRouteId,
            'moved_count' => $addedCount
        ]);
    } catch (Exception $e) {
        $db->rollBack();
        http_response_code(500);
        echo json_encode(['error' => 'Failed to move uncovered schools: ' . $e->getMessage()]);
    }
} elseif ($method === 'PUT') {
    requireAdmin();
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Route ID is required']);
        exit;
    }
    
    $data = json_decode(file_get_contents('php://input'), true);
    $status = $data['status'] ?? null;
    $name = $data['name'] ?? null;
    $totalDistance = $data['total_distance'] ?? null;
    $salespersonId = $data['salesperson_id'] ?? null;
    $areaId = $data['area_id'] ?? null;
    $date = $data['date'] ?? null;
    $schoolIds = $data['school_ids'] ?? null;
    
    try {
        $db->beginTransaction();
        
        // Update route basic info
        $updates = [];
        $params = [];
        
        if ($status !== null) {
            $updates[] = "status = ?";
            $params[] = $status;
        }
        if ($name !== null) {
            $updates[] = "name = ?";
            $params[] = $name;
        }
        if ($totalDistance !== null) {
            $updates[] = "total_distance = ?";
            $params[] = $totalDistance;
        }
        if ($salespersonId !== null) {
            $updates[] = "salesperson_id = ?";
            $params[] = $salespersonId;
        }
        if ($areaId !== null) {
            $updates[] = "area_id = ?";
            $params[] = $areaId;
        }
        if ($date !== null) {
            $updates[] = "date = ?";
            $params[] = $date;
        }
        
        if (!empty($updates)) {
            $params[] = $id;
            $query = "UPDATE routes SET " . implode(", ", $updates) . " WHERE id = ?";
            $stmt = $db->prepare($query);
            $stmt->execute($params);
        }
        
        // Update route items if school_ids provided
        if ($schoolIds !== null && is_array($schoolIds)) {
            // Delete existing route items
            $stmt = $db->prepare("DELETE FROM route_items WHERE route_id = ?");
            $stmt->execute([$id]);
            
            // Insert new route items
            $stmt = $db->prepare("INSERT INTO route_items (route_id, school_id, order_index) VALUES (?, ?, ?)");
            foreach ($schoolIds as $index => $schoolId) {
                $stmt->execute([$id, $schoolId, $index + 1]);
            }
        }
        
        $db->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'Route updated successfully'
        ]);
    } catch (Exception $e) {
        $db->rollBack();
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update route: ' . $e->getMessage()]);
    }
} elseif ($method === 'DELETE') {
    requireAdmin();
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Route ID is required']);
        exit;
    }
    
    $stmt = $db->prepare("DELETE FROM routes WHERE id = ?");
    $stmt->execute([$id]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Route deleted successfully'
    ]);
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
