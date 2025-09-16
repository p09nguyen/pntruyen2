<?php
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/cors.php';
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, POST, PATCH, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

function send_response($success, $message = '', $data = null) {
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data
    ]);
    exit();
}

// Kết nối database
$database = new Database();
$conn = $database->getConnection();
if (!$conn) {
    send_response(false, 'Database connection failed');
}

if ($method === 'POST') {
    // Gửi góp ý hoặc yêu cầu dịch truyện
    $input = json_decode(file_get_contents('php://input'), true);
    $type = isset($input['type']) ? $input['type'] : null;
    $content = isset($input['content']) ? $input['content'] : null;
    $user_id = isset($input['user_id']) ? intval($input['user_id']) : null;
    if (!$type || !$content) {
        send_response(false, 'Missing type or content');
    }
    $stmt = $conn->prepare("INSERT INTO user_feedback (user_id, type, content, created_at) VALUES (:user_id, :type, :content, NOW())");
    $stmt->bindValue(':user_id', $user_id);
    $stmt->bindValue(':type', $type);
    $stmt->bindValue(':content', $content);
    if ($stmt->execute()) {
        send_response(true, 'Feedback submitted successfully');
    } else {
        send_response(false, 'Failed to submit feedback: ' . implode(' | ', $stmt->errorInfo()));
    }
}
elseif ($method === 'GET') {
    // Lấy danh sách góp ý/yêu cầu (admin)
    $where = '';
    $params = [];
    if (isset($_GET['type'])) {
        $where .= ' AND type = ?';
        $params[] = $_GET['type'];
    }
    if (isset($_GET['status'])) {
        $where .= ' AND status = ?';
        $params[] = $_GET['status'];
    }
    $sql = "SELECT uf.*, u.username as reviewer_name FROM user_feedback uf LEFT JOIN users u ON uf.reviewer_id = u.id WHERE 1 $where ORDER BY created_at DESC";
    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    send_response(true, '', $data);
}
elseif ($method === 'PATCH') {
    // Đổi trạng thái góp ý/yêu cầu (admin)
    $input = json_decode(file_get_contents('php://input'), true);
    $id = isset($input['id']) ? intval($input['id']) : null;
    $status = isset($input['status']) ? $input['status'] : null;
    $reviewer_id = isset($input['reviewer_id']) ? intval($input['reviewer_id']) : null;
    if (!$id || !$status) {
        send_response(false, 'Missing id or status');
    }
    $stmt = $conn->prepare("UPDATE user_feedback SET status = :status, reviewed_at = NOW(), reviewer_id = :reviewer_id WHERE id = :id");
    $stmt->bindValue(':status', $status);
    $stmt->bindValue(':reviewer_id', $reviewer_id);
    $stmt->bindValue(':id', $id);
    if ($stmt->execute()) {
        send_response(true, 'Status updated');
    } else {
        send_response(false, 'Failed to update status: ' . implode(' | ', $stmt->errorInfo()));
    }
}
else {
    send_response(false, 'Unsupported method');
}
