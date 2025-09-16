<?php
require_once 'config/cors.php';
require_once 'config/database.php';

// Get request method and URI
$method = $_SERVER['REQUEST_METHOD'];
$request = $_SERVER['REQUEST_URI'];

// Remove query string and get path
$path = parse_url($request, PHP_URL_PATH);
$path = str_replace('/pntruyen2', '', $path); // Remove base path
$segments = explode('/', trim($path, '/'));

// Route to appropriate API endpoint
if (count($segments) >= 2 && $segments[0] === 'api') {
    $endpoint = $segments[1];
    
    switch ($endpoint) {
        case 'categories':
            require_once 'api/categories.php';
            break;
        case 'stories':
            require_once 'api/stories.php';
            break;
        case 'chapters':
            require_once 'api/chapters.php';
            break;
        case 'auth':
            require_once 'api/auth.php';
            break;
        case 'bookmarks':
            require_once 'api/bookmarks.php';
            break;
        default:
            http_response_code(404);
            echo json_encode(['error' => 'Endpoint not found']);
            break;
    }
} else {
    http_response_code(404);
    echo json_encode(['error' => 'API endpoint not found']);
}
?>
