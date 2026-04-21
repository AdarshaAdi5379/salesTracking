<?php

require_once __DIR__ . '/../utils/auth.php';

if ($method === 'GET') {
    $user = requireSalesperson();
    
    if ($id) {
        // Get single user
        if ($user['role'] !== 'admin' && $user['id'] != $id) {
            http_response_code(403);
            echo json_encode(['error' => 'Access denied']);
            exit;
        }
        
        $stmt = $db->prepare("SELECT id, name, email, role, phone, created_at FROM users WHERE id = ?");
        $stmt->execute([$id]);
        $userData = $stmt->fetch();
        
        if ($userData) {
            echo json_encode($userData);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'User not found']);
        }
    } else {
        // Get all users - admin sees all, salesperson sees only themselves
        if ($user['role'] === 'admin') {
            $role = $_GET['role'] ?? null;
            
            if ($role) {
                $stmt = $db->prepare("SELECT id, name, email, role, phone, created_at FROM users WHERE role = ? ORDER BY name");
                $stmt->execute([$role]);
            } else {
                $stmt = $db->query("SELECT id, name, email, role, phone, created_at FROM users ORDER BY name");
            }
        } else {
            $stmt = $db->prepare("SELECT id, name, email, role, phone, created_at FROM users WHERE id = ?");
            $stmt->execute([$user['id']]);
        }
        
        $users = $stmt->fetchAll();
        echo json_encode($users);
    }
} elseif ($method === 'POST') {
    requireAdmin();
    
    $data = json_decode(file_get_contents('php://input'), true);
    $name = $data['name'] ?? '';
    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';
    $role = $data['role'] ?? 'salesperson';
    $phone = $data['phone'] ?? '';
    
    if (empty($name) || empty($email) || empty($password)) {
        http_response_code(400);
        echo json_encode(['error' => 'Name, email, and password are required']);
        exit;
    }
    
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    
    try {
        $stmt = $db->prepare("INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$name, $email, $hashedPassword, $role, $phone]);
        $userId = $db->lastInsertId();
        
        echo json_encode([
            'success' => true,
            'id' => $userId,
            'message' => 'User created successfully'
        ]);
    } catch (PDOException $e) {
        http_response_code(400);
        echo json_encode(['error' => 'Failed to create user: ' . $e->getMessage()]);
    }
} elseif ($method === 'PUT') {
    $user = requireSalesperson();
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'User ID is required']);
        exit;
    }
    
    // Users can only update themselves, unless admin
    if ($user['role'] !== 'admin' && $user['id'] != $id) {
        http_response_code(403);
        echo json_encode(['error' => 'Access denied']);
        exit;
    }
    
    $data = json_decode(file_get_contents('php://input'), true);
    $name = $data['name'] ?? null;
    $phone = $data['phone'] ?? null;
    $password = $data['password'] ?? null;
    $role = $data['role'] ?? null;
    
    $updates = [];
    $params = [];
    
    if ($name !== null) {
        $updates[] = "name = ?";
        $params[] = $name;
    }
    if ($phone !== null) {
        $updates[] = "phone = ?";
        $params[] = $phone;
    }
    if ($password !== null) {
        $updates[] = "password = ?";
        $params[] = password_hash($password, PASSWORD_DEFAULT);
    }
    if ($role !== null && $user['role'] === 'admin') {
        $updates[] = "role = ?";
        $params[] = $role;
    }
    
    if (empty($updates)) {
        http_response_code(400);
        echo json_encode(['error' => 'No fields to update']);
        exit;
    }
    
    $params[] = $id;
    $query = "UPDATE users SET " . implode(", ", $updates) . " WHERE id = ?";
    $stmt = $db->prepare($query);
    $stmt->execute($params);
    
    echo json_encode([
        'success' => true,
        'message' => 'User updated successfully'
    ]);
} elseif ($method === 'DELETE') {
    requireAdmin();
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'User ID is required']);
        exit;
    }
    
    if ($user['id'] == $id) {
        http_response_code(400);
        echo json_encode(['error' => 'Cannot delete your own account']);
        exit;
    }
    
    $stmt = $db->prepare("DELETE FROM users WHERE id = ?");
    $stmt->execute([$id]);
    
    echo json_encode([
        'success' => true,
        'message' => 'User deleted successfully'
    ]);
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}

