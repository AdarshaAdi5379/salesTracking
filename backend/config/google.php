<?php

// Google Places API Configuration
// You can set this via environment variable GOOGLE_PLACES_API_KEY
// Or directly set it here (not recommended for production)

return [
    'places_api_key' => $_ENV['GOOGLE_PLACES_API_KEY'] ?? getenv('GOOGLE_PLACES_API_KEY') ?: 'AIzaSyByMpZcBmce4H-U0gq0y6Wk_gWJ9r-_1ig'
];

