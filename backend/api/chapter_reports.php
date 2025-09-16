<?php
// API báo lỗi chương
// POST: gửi báo lỗi
// GET: admin xem danh sách

date_default_timezone_set('Asia/Ho_Chi_Minh');
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/cors.php';

$db = new Database();
$pdo = $db->getConnection();
header('Content-Type: application/json; charset=utf-8');
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'OPTIONS') {
    http_response_code(204);
    exit();
}

function json_response($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data);
    exit();
}

if ($method === 'POST') {
    // POST /api/chapter_reports.php {chapter_id, user_id, report_content}
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['chapter_id'], $data['report_content'])) {
        json_response(['error' => 'Thiếu thông tin'], 400);
    }
    $chapter_id = intval($data['chapter_id']);
    $user_id = isset($data['user_id']) ? intval($data['user_id']) : null;
    $report_content = trim($data['report_content']);
    $now = date('Y-m-d H:i:s');
    $stmt = $pdo->prepare('INSERT INTO chapter_reports (chapter_id, user_id, report_content, created_at) VALUES (?, ?, ?, ?)');
    $ok = $stmt->execute([$chapter_id, $user_id, $report_content, $now]);
    if ($ok) {
        json_response(['success' => true]);
    } else {
        json_response(['error' => 'Không gửi được báo lỗi'], 500);
    }
}

if ($method === 'GET') {
    // GET /api/chapter_reports.php?all=1 (admin)
    if (isset($_GET['all']) && $_GET['all'] == '1') {
        // Lấy tất cả report, join info user/chapter
        $sql = 'SELECT r.*, u.username, c.title AS chapter_title, c.story_id, s.title AS story_title
            FROM chapter_reports r
            LEFT JOIN users u ON r.user_id = u.id
            JOIN chapters c ON r.chapter_id = c.id
            JOIN stories s ON c.story_id = s.id
            ORDER BY r.created_at DESC';
        $reports = $pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC);
        json_response(['reports' => $reports]);
    } else if (isset($_GET['id'])) {
        // Xem chi tiết 1 report
        $id = intval($_GET['id']);
        $stmt = $pdo->prepare('SELECT * FROM chapter_reports WHERE id = ?');
        $stmt->execute([$id]);
        $report = $stmt->fetch(PDO::FETCH_ASSOC);
        json_response(['report' => $report]);
    } else {
        json_response(['error' => 'Tham số không hợp lệ'], 400);
    }
}

// PATCH: cập nhật trạng thái
if ($method === 'PATCH') {
    // PATCH /api/chapter_reports.php?id=... {status}
    if (!isset($_GET['id'])) {
        json_response(['error' => 'Thiếu id'], 400);
    }
    $id = intval($_GET['id']);
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['status'])) {
        json_response(['error' => 'Thiếu status'], 400);
    }
    $status = $data['status'];
    $stmt = $pdo->prepare('UPDATE chapter_reports SET status = ? WHERE id = ?');
    $ok = $stmt->execute([$status, $id]);
    if ($ok) {
        json_response(['success' => true]);
    } else {
        json_response(['error' => 'Không cập nhật được'], 500);
    }
}

json_response(['error' => 'Phương thức không hỗ trợ'], 405);
