<?php
require_once __DIR__ . '/config/database.php';
$database = new Database();
$pdo = $database->getConnection();
require_once __DIR__ . '/config/cors.php';

header('Content-Type: application/json; charset=utf-8');

$method = $_SERVER['REQUEST_METHOD'];

function respond($success, $data = null, $message = '') {
    echo json_encode([
        'success' => $success,
        'data' => $data,
        'message' => $message
    ]);
    exit;
}

// GET: Lấy danh sách truyện nổi bật (có join sang stories)
if ($method === 'GET') {
    $sql = 'SELECT f.id, f.story_id, f.sort_order, f.large_image, s.title, s.author, s.cover_image, s.slug, s.description, s.status, s.category_id
            FROM featured_stories f
            JOIN stories s ON f.story_id = s.id
            ORDER BY f.sort_order ASC, f.created_at ASC';
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    respond(true, $rows);
}

// Nhận JSON body cho POST
$body = json_decode(file_get_contents('php://input'), true);

// POST: Thêm mới hoặc đổi thứ tự
if ($method === 'POST') {
    // Đổi thứ tự
    if (isset($body['action']) && $body['action'] === 'move') {
        $id = intval($body['id']);
        $direction = $body['direction'];
        // Lấy danh sách hiện tại
        $stmt = $pdo->query('SELECT id, sort_order FROM featured_stories ORDER BY sort_order ASC, created_at ASC');
        $featured = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $idx = array_search($id, array_column($featured, 'id'));
        if ($idx === false) respond(false, null, 'Not found');
        if ($direction === 'up' && $idx > 0) {
            $swapId = $featured[$idx-1]['id'];
        } elseif ($direction === 'down' && $idx < count($featured)-1) {
            $swapId = $featured[$idx+1]['id'];
        } else {
            respond(true, null, 'No change');
        }
        // Hoán đổi sort_order
        $pdo->beginTransaction();
        $stmt1 = $pdo->prepare('UPDATE featured_stories SET sort_order = ? WHERE id = ?');
        $stmt1->execute([$featured[$idx]['sort_order'], $swapId]);
        $stmt1->execute([$featured[$idx-1]['sort_order'], $id]);
        $pdo->commit();
        respond(true);
    }
    // Thêm mới
    if (isset($body['story_id'])) {
        // Lấy sort_order lớn nhất
        $max = $pdo->query('SELECT MAX(sort_order) FROM featured_stories')->fetchColumn();
        $sort_order = $max !== false ? $max + 1 : 1;
        $large_image = isset($body['large_image']) ? $body['large_image'] : null;
        $stmt = $pdo->prepare('INSERT INTO featured_stories (story_id, sort_order, large_image) VALUES (?, ?, ?)');
        try {
            $stmt->execute([$body['story_id'], $sort_order, $large_image]);
            respond(true);
        } catch (PDOException $e) {
            respond(false, null, 'Truyện đã có trong danh sách nổi bật');
        }
    }
    respond(false, null, 'Invalid request');
}

// DELETE: Xóa truyện nổi bật
if ($method === 'DELETE') {
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    if ($id > 0) {
        $stmt = $pdo->prepare('DELETE FROM featured_stories WHERE id = ?');
        $stmt->execute([$id]);
        respond(true);
    }
    respond(false, null, 'Missing id');
}

respond(false, null, 'Method not allowed');
