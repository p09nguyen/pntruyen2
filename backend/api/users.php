<?php
date_default_timezone_set('Asia/Ho_Chi_Minh');
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/cors.php';
$database = new Database();
$pdo = $database->getConnection();

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

// GET: Danh sách user (hỗ trợ search, filter, phân trang)
if ($method === 'GET') {
    $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
    $limit = isset($_GET['limit']) ? max(1, intval($_GET['limit'])) : 20;
    $offset = ($page - 1) * $limit;
    $search = isset($_GET['search']) ? trim($_GET['search']) : '';
    $role = isset($_GET['role']) ? trim($_GET['role']) : '';
    $status = isset($_GET['status']) ? trim($_GET['status']) : '';

    $where = [];
    $params = [];
    if ($search !== '') {
        $where[] = '(username LIKE :search OR email LIKE :search)';
        $params[':search'] = "%$search%";
    }
    if ($role !== '') {
        $where[] = 'role = :role';
        $params[':role'] = $role;
    }
    if ($status !== '') {
        $where[] = 'status = :status';
        $params[':status'] = $status;
    }
    $whereSql = count($where) ? 'WHERE ' . implode(' AND ', $where) : '';

    $sql = "SELECT id, username, email, role, created_at, status FROM users $whereSql ORDER BY created_at DESC, id DESC LIMIT :limit OFFSET :offset";
    $stmt = $pdo->prepare($sql);
    foreach ($params as $k => $v) $stmt->bindValue($k, $v);
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Đếm tổng số user
    $countSql = "SELECT COUNT(*) FROM users $whereSql";
    $countStmt = $pdo->prepare($countSql);
    foreach ($params as $k => $v) $countStmt->bindValue($k, $v);
    $countStmt->execute();
    $total = $countStmt->fetchColumn();

    respond(true, [
        'users' => $users,
        'total' => intval($total),
        'page' => $page,
        'limit' => $limit
    ]);
}

// DELETE: Xóa user
if ($method === 'DELETE') {
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    if ($id <= 0) respond(false, null, 'Missing id');
    // Không cho xóa user admin gốc (id=1)
    if ($id === 1) respond(false, null, 'Không thể xóa admin mặc định');
    $stmt = $pdo->prepare('DELETE FROM users WHERE id = ?');
    $stmt->execute([$id]);
    respond(true);
}

// PUT: Sửa user
if ($method === 'PUT') {
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    if ($id <= 0) respond(false, null, 'Missing id');
    $data = json_decode(file_get_contents('php://input'), true);
    $fields = [];
    $params = [];
    if (isset($data['username'])) {
        $fields[] = 'username = :username';
        $params[':username'] = $data['username'];
    }
    if (isset($data['email'])) {
        $fields[] = 'email = :email';
        $params[':email'] = $data['email'];
    }
    if (isset($data['role'])) {
        $fields[] = 'role = :role';
        $params[':role'] = $data['role'];
    }
    if (isset($data['status'])) {
        $fields[] = 'status = :status';
        $params[':status'] = $data['status'];
    }
    if (isset($data['avatar_url'])) {
    $fields[] = 'avatar_url = :avatar_url';
    $params[':avatar_url'] = $data['avatar_url'];
}
if (empty($fields)) respond(false, null, 'No data to update');
    $sql = 'UPDATE users SET ' . implode(', ', $fields) . ' WHERE id = :id';
    $params[':id'] = $id;
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    respond(true);
}

// Method override: Cho phép POST + _method=PUT để update user/avatar
if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    // Đổi mật khẩu
    if (isset($data['_method']) && $data['_method'] === 'CHANGE_PASSWORD') {
        $user_id = isset($data['user_id']) ? intval($data['user_id']) : 0;
        $old_password = $data['old_password'] ?? '';
        $new_password = $data['new_password'] ?? '';
        if ($user_id <= 0 || !$old_password || !$new_password) {
            respond(false, null, 'Thiếu thông tin');
        }
        $stmt = $pdo->prepare('SELECT password_hash FROM users WHERE id = ?');
        $stmt->execute([$user_id]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$user || !password_verify($old_password, $user['password_hash'])) {
            respond(false, null, 'Mật khẩu cũ không đúng');
        }
        $new_hash = password_hash($new_password, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ?');
        $stmt->execute([$new_hash, $user_id]);
        respond(true, null, 'Đổi mật khẩu thành công');
    }
    $data = json_decode(file_get_contents('php://input'), true);
    if (isset($data['_method']) && strtoupper($data['_method']) === 'PUT') {
        $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
        if ($id <= 0) respond(false, null, 'Missing id');
        $fields = [];
        $params = [];
        if (isset($data['username'])) {
            $fields[] = 'username = :username';
            $params[':username'] = $data['username'];
        }
        if (isset($data['email'])) {
            $fields[] = 'email = :email';
            $params[':email'] = $data['email'];
        }
        if (isset($data['role'])) {
            $fields[] = 'role = :role';
            $params[':role'] = $data['role'];
        }
        if (isset($data['status'])) {
            $fields[] = 'status = :status';
            $params[':status'] = $data['status'];
        }
        if (isset($data['avatar_url'])) {
            $fields[] = 'avatar_url = :avatar_url';
            $params[':avatar_url'] = $data['avatar_url'];
        }
        if (empty($fields)) respond(false, null, 'No data to update');
        $sql = 'UPDATE users SET ' . implode(', ', $fields) . ' WHERE id = :id';
        $params[':id'] = $id;
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        respond(true);
    }
    // Nếu không phải method override thì là thêm user mới như cũ

    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['username'], $data['email'], $data['password'], $data['role'])) {
        respond(false, null, 'Missing required fields');
    }
    $now = date('Y-m-d H:i:s');
    $stmt = $pdo->prepare('INSERT INTO users (username, email, password_hash, role, status, created_at) VALUES (?, ?, ?, ?, ?, ?)');
    $password_hash = password_hash($data['password'], PASSWORD_DEFAULT);
    $status = isset($data['status']) ? $data['status'] : 'active';
    try {
        $stmt->execute([
            $data['username'],
            $data['email'],
            $password_hash,
            $data['role'],
            $status,
            $now
        ]);
        respond(true);
    } catch (PDOException $e) {
        respond(false, null, 'Username hoặc email đã tồn tại');
    }
}

respond(false, null, 'Method not allowed');
