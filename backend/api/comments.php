<?php
date_default_timezone_set('Asia/Ho_Chi_Minh');
require_once(__DIR__ . '/config/database.php');
$db = new Database();
$pdo = $db->getConnection();
require_once(__DIR__ . '/config/cors.php');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

// API test: GET /api/comments.php?now=1 => trả về ngày giờ hiện tại trên server
if (isset($_GET['now']) && $_GET['now'] == '1') {
    json_response([
        'server_time' => date('Y-m-d H:i:s'),
        'php_timezone' => date_default_timezone_get(),
        'timestamp' => time()
    ]);
}

function json_response($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // GET all comments for admin
    if (isset($_GET['all']) && $_GET['all'] == '1') {
        // Phân trang
        $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
        $limit = isset($_GET['limit']) ? max(1, intval($_GET['limit'])) : 20;
        $offset = ($page - 1) * $limit;
        // Đếm tổng số bình luận
        $total = $pdo->query('SELECT COUNT(*) FROM comments')->fetchColumn();
        $pages = ceil($total / $limit);
        $stmt = $pdo->prepare('SELECT c.id, c.user_id, u.username, u.full_name, c.content, c.created_at, c.chapter_id, ch.title AS chapter_title, ch.slug AS chapter_slug, ch.story_id, s.title AS story_title, s.slug AS story_slug FROM comments c JOIN users u ON c.user_id = u.id JOIN chapters ch ON c.chapter_id = ch.id JOIN stories s ON ch.story_id = s.id ORDER BY c.created_at DESC, c.id DESC LIMIT :limit OFFSET :offset');
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $comments = $stmt->fetchAll(PDO::FETCH_ASSOC);
        json_response([
          'comments' => $comments,
          'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => intval($total),
            'pages' => $pages
          ]
        ]);

    }
    // GET /api/comments.php?user_id=123
    if (isset($_GET['user_id'])) {
        $user_id = intval($_GET['user_id']);
        $stmt = $pdo->prepare('SELECT c.id, c.user_id, u.username, u.full_name, c.content, c.created_at, c.chapter_id, ch.title AS chapter_title, ch.story_id, s.title AS story_title
            FROM comments c
            JOIN users u ON c.user_id = u.id
            JOIN chapters ch ON c.chapter_id = ch.id
            JOIN stories s ON ch.story_id = s.id
            WHERE c.user_id = ?
            ORDER BY c.created_at DESC, c.id DESC');
        $stmt->execute([$user_id]);
        $comments = $stmt->fetchAll(PDO::FETCH_ASSOC);
        json_response(['data' => $comments]);
    }
    // GET /api/comments.php?chapter_id=123
    if (!isset($_GET['chapter_id'])) {
        json_response(['error' => 'Missing chapter_id'], 400);
    }
    $chapter_id = intval($_GET['chapter_id']);
    $stmt = $pdo->prepare('SELECT c.id, c.user_id, u.username, u.full_name, u.avatar_url, c.content, c.created_at FROM comments c JOIN users u ON c.user_id = u.id WHERE c.chapter_id = ? ORDER BY c.created_at DESC, c.id DESC');
    $stmt->execute([$chapter_id]);
    $comments = $stmt->fetchAll(PDO::FETCH_ASSOC);
    // Đảm bảo luôn có avatar (nếu thiếu thì trả về avatar mặc định)
    foreach ($comments as &$c) {
        if (empty($c['avatar_url'])) {
            $c['avatar_url'] = '/default-avatar.png';
        }
    }
    json_response(['comments' => $comments]);
}

if ($method === 'POST') {
    // POST /api/comments.php {chapter_id, user_id, content}
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['chapter_id'], $data['user_id'], $data['content'])) {
        json_response(['error' => 'Missing fields'], 400);
    }
    $now = date('Y-m-d H:i:s');
    $stmt = $pdo->prepare('INSERT INTO comments (chapter_id, user_id, content, created_at) VALUES (?, ?, ?, ?)');
    $ok = $stmt->execute([
        intval($data['chapter_id']),
        intval($data['user_id']),
        trim($data['content']),
        $now
    ]);
    if ($ok) {
        json_response(['success' => true, 'id' => $pdo->lastInsertId()]);
    } else {
        json_response(['error' => 'Failed to add comment'], 500);
    }
}

if ($method === 'DELETE') {
    // DELETE /api/comments.php?id=123
    if (!isset($_GET['id'])) {
        json_response(['error' => 'Missing id'], 400);
    }
    $id = intval($_GET['id']);
    $stmt = $pdo->prepare('DELETE FROM comments WHERE id = ?');
    $ok = $stmt->execute([$id]);
    if ($ok) {
        json_response(['success' => true]);
    } else {
        json_response(['error' => 'Failed to delete'], 500);
    }
}

json_response(['error' => 'Invalid request'], 400);
