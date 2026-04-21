<?php

require_once __DIR__ . '/../utils/auth.php';

if ($method === 'GET') {
    $user = requireSalesperson();
    
    $type = $_GET['type'] ?? 'daily';
    $date = $_GET['date'] ?? date('Y-m-d');
    $salespersonId = $_GET['salesperson_id'] ?? null;
    $startDate = $_GET['start_date'] ?? null;
    $endDate = $_GET['end_date'] ?? null;
    
    if ($type === 'daily') {
        // Daily report
        $query = "
            SELECT 
                r.id as route_id,
                r.date,
                r.name as route_name,
                u.name as salesperson_name,
                a.name as area_name,
                COUNT(ri.id) as total_visits,
                COUNT(CASE WHEN v.status = 'visited' THEN 1 END) as visited_count,
                COUNT(CASE WHEN v.status = 'not_visited' THEN 1 END) as not_visited_count,
                COUNT(CASE WHEN v.status = 'follow_up' THEN 1 END) as follow_up_count,
                COUNT(CASE WHEN v.status = 'meeting_scheduled' THEN 1 END) as meeting_scheduled_count,
                COUNT(CASE WHEN v.status = 'invalid_location' THEN 1 END) as invalid_location_count,
                r.total_distance
            FROM routes r
            LEFT JOIN users u ON r.salesperson_id = u.id
            LEFT JOIN areas a ON r.area_id = a.id
            LEFT JOIN route_items ri ON r.id = ri.route_id
            LEFT JOIN visits v ON ri.id = v.route_item_id
            WHERE r.date = ?
        ";
        
        $params = [$date];
        
        if ($user['role'] === 'salesperson') {
            $query .= " AND r.salesperson_id = ?";
            $params[] = $user['id'];
        } elseif ($salespersonId) {
            $query .= " AND r.salesperson_id = ?";
            $params[] = $salespersonId;
        }
        
        $query .= " GROUP BY r.id ORDER BY r.created_at DESC";
        
        $stmt = $db->prepare($query);
        $stmt->execute($params);
        $routes = $stmt->fetchAll();
        
        // Get detailed visit list
        $query2 = "
            SELECT 
                v.*,
                s.name as school_name,
                s.address,
                s.type,
                ri.order_index,
                r.date as route_date,
                u.name as salesperson_name
            FROM visits v
            LEFT JOIN route_items ri ON v.route_item_id = ri.id
            LEFT JOIN schools s ON ri.school_id = s.id
            LEFT JOIN routes r ON ri.route_id = r.id
            LEFT JOIN users u ON r.salesperson_id = u.id
            WHERE r.date = ?
        ";
        
        $params2 = [$date];
        
        if ($user['role'] === 'salesperson') {
            $query2 .= " AND r.salesperson_id = ?";
            $params2[] = $user['id'];
        } elseif ($salespersonId) {
            $query2 .= " AND r.salesperson_id = ?";
            $params2[] = $salespersonId;
        }
        
        $query2 .= " ORDER BY ri.order_index";
        
        $stmt2 = $db->prepare($query2);
        $stmt2->execute($params2);
        $visits = $stmt2->fetchAll();
        
        echo json_encode([
            'date' => $date,
            'routes' => $routes,
            'visits' => $visits,
            'summary' => [
                'total_routes' => count($routes),
                'total_visits' => array_sum(array_column($routes, 'total_visits')),
                'visited' => array_sum(array_column($routes, 'visited_count')),
                'not_visited' => array_sum(array_column($routes, 'not_visited_count')),
                'follow_up' => array_sum(array_column($routes, 'follow_up_count')),
                'meeting_scheduled' => array_sum(array_column($routes, 'meeting_scheduled_count')),
                'invalid_location' => array_sum(array_column($routes, 'invalid_location_count'))
            ]
        ]);
    } elseif ($type === 'salesperson') {
        // Salesperson performance report
        if (!$salespersonId && $user['role'] === 'salesperson') {
            $salespersonId = $user['id'];
        }
        
        if (!$salespersonId) {
            http_response_code(400);
            echo json_encode(['error' => 'salesperson_id is required']);
            exit;
        }
        
        $dateFilter = "";
        $params = [$salespersonId];
        
        if ($startDate && $endDate) {
            $dateFilter = " AND r.date BETWEEN ? AND ?";
            $params[] = $startDate;
            $params[] = $endDate;
        } elseif ($date) {
            $dateFilter = " AND r.date = ?";
            $params[] = $date;
        }
        
        $query = "
            SELECT 
                r.date,
                COUNT(DISTINCT r.id) as total_routes,
                COUNT(ri.id) as total_visits,
                COUNT(CASE WHEN v.status = 'visited' THEN 1 END) as visited_count,
                COUNT(CASE WHEN v.status = 'follow_up' THEN 1 END) as follow_up_count,
                SUM(r.total_distance) as total_distance
            FROM routes r
            LEFT JOIN route_items ri ON r.id = ri.route_id
            LEFT JOIN visits v ON ri.id = v.route_item_id
            WHERE r.salesperson_id = ? $dateFilter
            GROUP BY r.date
            ORDER BY r.date DESC
        ";
        
        $stmt = $db->prepare($query);
        $stmt->execute($params);
        $report = $stmt->fetchAll();
        
        echo json_encode($report);
    } elseif ($type === 'uncovered') {
        // Uncovered schools/colleges
        requireAdmin();
        
        $areaId = $_GET['area_id'] ?? null;
        
        $query = "
            SELECT s.*, a.name as area_name
            FROM schools s
            LEFT JOIN areas a ON s.area_id = a.id
            WHERE s.id NOT IN (
                SELECT DISTINCT ri.school_id 
                FROM route_items ri
                LEFT JOIN routes r ON ri.route_id = r.id
                WHERE r.status = 'active' OR r.status = 'completed'
            )
        ";
        
        $params = [];
        if ($areaId) {
            $query .= " AND s.area_id = ?";
            $params[] = $areaId;
        }
        
        $query .= " ORDER BY s.area_id, s.name";
        
        $stmt = $db->prepare($query);
        $stmt->execute($params);
        $uncovered = $stmt->fetchAll();
        
        echo json_encode($uncovered);
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid report type']);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}

