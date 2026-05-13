<?php

// Ensure variables from index.php are available
if (!isset($method)) {
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
}

require_once __DIR__ . '/../utils/auth.php';

if ($method === 'GET') {
    $user = requireSalesperson();
    
    // Get all visited schools with coordinates
    // Only show schools that have been visited (status = 'visited')
    $date = $_GET['date'] ?? null;
    $fromDate = $_GET['from_date'] ?? null;
    $toDate = $_GET['to_date'] ?? null;
    $salespersonId = $_GET['salesperson_id'] ?? null;
    $areaId = $_GET['area_id'] ?? null;

    $isValidDate = function ($value) {
        return is_string($value) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $value) === 1;
    };

    // Backward compatibility: if only `date` is provided, treat it as a single-day range.
    if ((!$fromDate && !$toDate) && $date) {
        $fromDate = $date;
        $toDate = $date;
    }

    // If one side of the range is missing, treat as a single-day filter.
    if ($fromDate && !$toDate) $toDate = $fromDate;
    if ($toDate && !$fromDate) $fromDate = $toDate;

    if (($fromDate && !$isValidDate($fromDate)) || ($toDate && !$isValidDate($toDate))) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid date format. Use YYYY-MM-DD.']);
        exit;
    }

    if ($fromDate && $toDate && $fromDate > $toDate) {
        http_response_code(400);
        echo json_encode(['error' => 'from_date cannot be after to_date.']);
        exit;
    }
    
    $query = "
        SELECT DISTINCT
            s.id as school_id,
            s.name as school_name,
            s.type,
            s.address,
            s.latitude,
            s.longitude,
            s.phone,
            s.contact_person,
            a.name as area_name,
            v.visited_at,
            v.status as visit_status,
            u.name as salesperson_name,
            r.date as route_date,
            r.name as route_name
        FROM visits v
        LEFT JOIN route_items ri ON v.route_item_id = ri.id
        LEFT JOIN schools s ON ri.school_id = s.id
        LEFT JOIN routes r ON ri.route_id = r.id
        LEFT JOIN areas a ON s.area_id = a.id
        LEFT JOIN users u ON r.salesperson_id = u.id
        WHERE v.status = 'visited'
        AND s.latitude IS NOT NULL
        AND s.longitude IS NOT NULL
    ";
    
    $params = [];
    
    // Filter by user role
    if ($user['role'] === 'salesperson') {
        $query .= " AND r.salesperson_id = ?";
        $params[] = $user['id'];
    } elseif ($salespersonId) {
        $query .= " AND r.salesperson_id = ?";
        $params[] = $salespersonId;
    }
    
    // Filter by date range
    if ($fromDate && $toDate) {
        $query .= " AND r.date BETWEEN ? AND ?";
        $params[] = $fromDate;
        $params[] = $toDate;
    }
    
    // Filter by area
    if ($areaId) {
        $query .= " AND s.area_id = ?";
        $params[] = $areaId;
    }
    
    $query .= " ORDER BY v.visited_at DESC";
    
    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $visitedSchools = $stmt->fetchAll();
    
    // Get summary statistics
    $summaryQuery = "
        SELECT 
            COUNT(DISTINCT s.id) as total_visited_schools,
            COUNT(DISTINCT a.id) as total_areas_covered,
            COUNT(DISTINCT r.salesperson_id) as total_salespersons,
            MIN(v.visited_at) as first_visit_date,
            MAX(v.visited_at) as last_visit_date
        FROM visits v
        LEFT JOIN route_items ri ON v.route_item_id = ri.id
        LEFT JOIN schools s ON ri.school_id = s.id
        LEFT JOIN routes r ON ri.route_id = r.id
        LEFT JOIN areas a ON s.area_id = a.id
        WHERE v.status = 'visited'
        AND s.latitude IS NOT NULL
        AND s.longitude IS NOT NULL
    ";
    
    $summaryParams = [];
    if ($user['role'] === 'salesperson') {
        $summaryQuery .= " AND r.salesperson_id = ?";
        $summaryParams[] = $user['id'];
    } elseif ($salespersonId) {
        $summaryQuery .= " AND r.salesperson_id = ?";
        $summaryParams[] = $salespersonId;
    }
    if ($fromDate && $toDate) {
        $summaryQuery .= " AND r.date BETWEEN ? AND ?";
        $summaryParams[] = $fromDate;
        $summaryParams[] = $toDate;
    }
    if ($areaId) {
        $summaryQuery .= " AND s.area_id = ?";
        $summaryParams[] = $areaId;
    }
    
    $summaryStmt = $db->prepare($summaryQuery);
    $summaryStmt->execute($summaryParams);
    $summary = $summaryStmt->fetch();
    
    echo json_encode([
        'success' => true,
        'visited_schools' => $visitedSchools,
        'summary' => $summary,
        'count' => count($visitedSchools)
    ]);
    exit;
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}
