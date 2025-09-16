<?php
// CORS headers (shared)
require_once(__DIR__ . '/config/cors.php');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(204);
    exit();
}

require_once(__DIR__ . '/config/database.php');
$database = new Database();
$db = $database->getConnection();

$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;

try {
    $query = "SELECT s.*, c.name as category_name, c.slug as category_slug, 
            IFNULL(SUM(ch.view_count),0) as total_views,
            (SELECT COUNT(*) FROM chapters WHERE story_id = s.id) as chapter_count
        FROM stories s
        LEFT JOIN chapters ch ON ch.story_id = s.id
        LEFT JOIN categories c ON s.category_id = c.id
        GROUP BY s.id
        ORDER BY total_views DESC
        LIMIT $limit";

    $stmt = $db->prepare($query);
    $stmt->execute();
    $stories = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'data' => $stories
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
    exit();
}
