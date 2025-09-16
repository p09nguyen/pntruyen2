<?php
// CORS headers for API
// Allowlist origins
$allowlist = [
    'https://pntruyen.online',
    'http://localhost:3000',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin && in_array($origin, $allowlist, true)) {
    header("Access-Control-Allow-Origin: $origin");
    header("Vary: Origin");
} else {
    // Fallback: allow same-origin or specific production origin
    header("Access-Control-Allow-Origin: https://pntruyen.online");
}

header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(204);
    exit();
}
?>
