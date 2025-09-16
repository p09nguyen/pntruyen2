<?php
header("Access-Control-Allow-Origin: https://pntruyen.online"); // Production domain
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200); exit();
}

require_once __DIR__ . '/config/database.php';
$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"), true);
$token = $data['token'] ?? '';

if (!$token) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Missing Google token']);
    exit;
}

// Xác thực token với Google
$google_api_url = "https://oauth2.googleapis.com/tokeninfo?id_token=" . $token;
$resp = file_get_contents($google_api_url);
$google_data = json_decode($resp, true);

if (!isset($google_data['email'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Invalid Google token']);
    exit;
}

// Tìm hoặc tạo user trong database
$email = $google_data['email'];
$name = $google_data['name'] ?? $google_data['email'];
$avatar = $google_data['picture'] ?? '';

$stmt = $db->prepare("SELECT * FROM users WHERE email = :email");
$stmt->bindValue(':email', $email);
$stmt->execute();
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    // Sinh username từ email, đảm bảo unique
    $base_username = explode('@', $email)[0];
    $username = $base_username;
    $check_stmt = $db->prepare("SELECT COUNT(*) FROM users WHERE username = :username");
    $suffix = 1;
    while (true) {
        $check_stmt->execute([':username' => $username]);
        if ($check_stmt->fetchColumn() == 0) {
            break;
        }
        $username = $base_username . $suffix;
        $suffix++;
    }
    // Tạo user mới, lưu cả tên thật vào full_name
    $stmt = $db->prepare("INSERT INTO users (username, email, avatar, role, full_name, status) VALUES (:username, :email, :avatar, 'user', :full_name, 'active')");
    $stmt->bindValue(':username', $username);
    $stmt->bindValue(':email', $email);
    $stmt->bindValue(':avatar', $avatar);
    $stmt->bindValue(':full_name', $name);
    $stmt->execute();
    $user_id = $db->lastInsertId();
} else {
    // Nếu user đã tồn tại, kiểm tra status
    if (isset($user['status']) && $user['status'] === 'inactive') {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'error' => 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên để biết thêm chi tiết hoặc mở khóa tài khoản.',
            'code' => 'ACCOUNT_DISABLED',
            'support' => 'Liên hệ admin qua email hoặc fanpage để được hỗ trợ mở khóa.'
        ]);
        exit;
    }
    $user_id = $user['id'];
}

// Lưu session
session_start();
$_SESSION['user_id'] = $user_id;
$_SESSION['username'] = isset($username) ? $username : ($user['username'] ?? $name);
$_SESSION['full_name'] = $name;
$_SESSION['email'] = $email;
$_SESSION['avatar'] = $avatar;

echo json_encode(['success' => true, 'user' => [
    'id' => $user_id,
    'username' => isset($username) ? $username : ($user['username'] ?? $name),
    'full_name' => $name,
    'email' => $email,
    'avatar' => $avatar
]]);
