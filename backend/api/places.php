<?php

require_once __DIR__ . '/../utils/auth.php';

if ($method === 'POST') {
    requireAdmin();
    
    $data = json_decode(file_get_contents('php://input'), true);
    $query = $data['query'] ?? '';
    $location = $data['location'] ?? '';
    $type = $data['type'] ?? 'school';
    
    if (empty($query) && empty($location)) {
        http_response_code(400);
        echo json_encode(['error' => 'Query or location is required']);
        exit;
    }
    
    // Google Places API key - set this in environment or config
    $googleConfig = require __DIR__ . '/../config/google.php';
    $apiKey = $googleConfig['places_api_key'];
    
    if ($apiKey === 'YOUR_GOOGLE_PLACES_API_KEY' || empty($apiKey)) {
        http_response_code(500);
        echo json_encode(['error' => 'Google Places API key not configured. Please set GOOGLE_PLACES_API_KEY in environment variables or edit backend/config/google.php']);
        exit;
    }
    
    // Build search query
    $searchQuery = $query;
    if ($location) {
        $searchQuery = ($query ? $query . ' ' : '') . 'in ' . $location;
    }
    
    // Add type to query
    if ($type === 'school') {
        $searchQuery = ($searchQuery ? $searchQuery . ' ' : '') . 'school';
    } else {
        $searchQuery = ($searchQuery ? $searchQuery . ' ' : '') . 'college';
    }
    
    // Use Google Places Text Search API
    $url = 'https://maps.googleapis.com/maps/api/place/textsearch/json?' . http_build_query([
        'query' => $searchQuery,
        'key' => $apiKey,
        'type' => $type === 'school' ? 'school' : 'university'
    ]);
    
    // Use file_get_contents instead of curl (more commonly available)
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => 'User-Agent: Edubricz Sales Tracking',
            'timeout' => 30,
            'ignore_errors' => true
        ]
    ]);
    
    $response = @file_get_contents($url, false, $context);
    
    if ($response === false) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch places from Google. Please check your internet connection and API key.']);
        exit;
    }
    
    $placesData = json_decode($response, true);
    
    if ($placesData['status'] !== 'OK' && $placesData['status'] !== 'ZERO_RESULTS') {
        http_response_code(400);
        echo json_encode(['error' => 'Google Places API error: ' . $placesData['status']]);
        exit;
    }
    
    // Format results
    $results = [];
    if (isset($placesData['results']) && is_array($placesData['results'])) {
        foreach ($placesData['results'] as $place) {
            $result = [
                'name' => $place['name'] ?? '',
                'address' => $place['formatted_address'] ?? '',
                'latitude' => isset($place['geometry']['location']['lat']) ? $place['geometry']['location']['lat'] : null,
                'longitude' => isset($place['geometry']['location']['lng']) ? $place['geometry']['location']['lng'] : null,
                'place_id' => $place['place_id'] ?? '',
                'phone' => '',
                'website' => '',
                'rating' => $place['rating'] ?? null,
                'types' => $place['types'] ?? []
            ];
            
            // Get detailed information if place_id is available
            if (!empty($place['place_id'])) {
                $detailsUrl = 'https://maps.googleapis.com/maps/api/place/details/json?' . http_build_query([
                    'place_id' => $place['place_id'],
                    'fields' => 'name,formatted_address,formatted_phone_number,website,geometry',
                    'key' => $apiKey
                ]);
                
                $detailsContext = stream_context_create([
                    'http' => [
                        'method' => 'GET',
                        'header' => 'User-Agent: Edubricz Sales Tracking',
                        'timeout' => 30,
                        'ignore_errors' => true
                    ]
                ]);
                
                $detailsResponse = @file_get_contents($detailsUrl, false, $detailsContext);
                
                if ($detailsResponse !== false) {
                    $detailsData = json_decode($detailsResponse, true);
                    if ($detailsData['status'] === 'OK' && isset($detailsData['result'])) {
                        $result['phone'] = $detailsData['result']['formatted_phone_number'] ?? '';
                        $result['website'] = $detailsData['result']['website'] ?? '';
                    }
                }
            }
            
            $results[] = $result;
        }
    }
    
    echo json_encode([
        'success' => true,
        'results' => $results,
        'count' => count($results)
    ]);
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}

