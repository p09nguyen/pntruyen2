<?php
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/cors.php';
$database = new Database();
$pdo = $database->getConnection();
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$action = $_GET['action'] ?? '';

if ($action === 'chapters_per_day') {
    $days = isset($_GET['days']) ? intval($_GET['days']) : 7;
    $sql = "
    
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM chapters
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        GROUP BY DATE(created_at)
        ORDER BY date ASC
    ";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$days-1]);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'data' => $data]);
    exit;
}

if ($action === 'global') {
    // Tổng số truyện
    $stories = $pdo->query("SELECT COUNT(*) FROM stories")->fetchColumn();
    // Tổng số chương
    $chapters = $pdo->query("SELECT COUNT(*) FROM chapters")->fetchColumn();
    // Tổng số user
    $users = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
    // Tổng số thể loại
    $categories = $pdo->query("SELECT COUNT(*) FROM categories")->fetchColumn();

    echo json_encode([
        'success' => true,
        'data' => [
            'totalStories' => intval($stories),
            'totalChapters' => intval($chapters),
            'totalUsers' => intval($users),
            'totalCategories' => intval($categories),
        ]
    ]);
    exit;
}

if ($action === 'views_global') {
    // Tổng lượt xem toàn hệ thống dựa trên SUM(view_count) của bảng chapters
    $totalViews = $pdo->query("SELECT COALESCE(SUM(view_count), 0) FROM chapters")->fetchColumn();

    echo json_encode([
        'success' => true,
        'data' => [
            'totalViews' => intval($totalViews),
        ]
    ]);
    exit;
}

if ($action === 'views_by_story') {
    // Lượt xem theo từng truyện: SUM(view_count) của các chương thuộc truyện đó
    $limit = isset($_GET['limit']) ? max(1, intval($_GET['limit'])) : 20;
    $offset = isset($_GET['offset']) ? max(0, intval($_GET['offset'])) : 0;

    $sql = "
        SELECT s.id, s.title, s.slug,
               COALESCE(SUM(c.view_count), 0) AS views
        FROM stories s
        LEFT JOIN chapters c ON c.story_id = s.id
        GROUP BY s.id
        ORDER BY views DESC
        LIMIT :limit OFFSET :offset
    ";
    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'data' => $data]);
    exit;
}

// Có thể bổ sung các action khác cho thống kê khác
http_response_code(400);
echo json_encode(['success' => false, 'message' => 'Invalid action']);
