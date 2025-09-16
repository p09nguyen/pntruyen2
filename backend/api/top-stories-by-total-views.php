<?php
// API: Trả về danh sách top truyện theo trường total_views (bảng stories)
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
    $query = "SELECT s.*, 
                (SELECT COUNT(*) FROM chapters WHERE story_id = s.id) as chapter_count
              FROM stories s
              ORDER BY s.total_views DESC
              LIMIT :limit";
    $stmt = $db->prepare($query);
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
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
}
