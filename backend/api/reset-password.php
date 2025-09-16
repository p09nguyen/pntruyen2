<?php
// Đặt lại mật khẩu bằng token
require_once(__DIR__ . '/config/cors.php');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(204); exit();
}

require_once __DIR__ . '/config/database.php';
$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"), true);
$token = trim($data['token'] ?? '');
$password = $data['password'] ?? '';
if (!$token || !$password) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Token và mật khẩu mới là bắt buộc']);
    exit;
}

// Kiểm tra token
$stmt = $db->prepare("SELECT pr.user_id, u.email, pr.expires_at FROM password_resets pr JOIN users u ON pr.user_id = u.id WHERE pr.token = :token");
$stmt->bindValue(':token', $token);
$stmt->execute();
$row = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$row) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Token không hợp lệ']);
    exit;
}
if (strtotime($row['expires_at']) < time()) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Token đã hết hạn, vui lòng gửi lại yêu cầu quên mật khẩu.']);
    exit;
}

// Đổi mật khẩu
$password_hash = password_hash($password, PASSWORD_DEFAULT);
$stmt = $db->prepare("UPDATE users SET password_hash = :phash WHERE id = :uid");
$stmt->bindValue(':phash', $password_hash);
$stmt->bindValue(':uid', $row['user_id']);
$stmt->execute();
// Xóa token
$db->prepare("DELETE FROM password_resets WHERE user_id = :uid")->execute([':uid' => $row['user_id']]);

echo json_encode(['success' => true, 'message' => 'Mật khẩu đã được đặt lại thành công!']);
