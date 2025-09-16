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

try {
    $query = "SELECT s.id, s.title, s.slug, s.show_on_home, c.name AS category_name, c.id AS category_id,
       COUNT(ch.id) AS chapter_count,
       MAX(ch.created_at) AS latest_chapter_update
FROM stories s
JOIN chapters ch ON ch.story_id = s.id
LEFT JOIN categories c ON s.category_id = c.id
GROUP BY s.id
HAVING chapter_count > 0
ORDER BY latest_chapter_update DESC";
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
