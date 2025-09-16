<?php
session_start();
error_log('PHPSESSID: ' . ($_COOKIE['PHPSESSID'] ?? 'no session'));
// Handle CORS first (shared)
require_once(__DIR__ . '/config/cors.php');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(204);
    exit();
}

require_once(__DIR__ . '/config/database.php');
$database = new Database();
$db = $database->getConnection();

switch ($_SERVER['REQUEST_METHOD']) {
    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        $action = isset($_GET['action']) ? $_GET['action'] : '';
        
        // Debug logging
        error_log("Auth API - Action: " . $action);
        error_log("Auth API - Data: " . json_encode($data));
        
        switch ($action) {
            case 'register':
                try {
                    $required_fields = ['username', 'email', 'password', 'full_name'];
                    foreach ($required_fields as $field) {
                        if (!isset($data[$field]) || empty($data[$field])) {
                            http_response_code(400);
                            echo json_encode([
                                'success' => false,
                                'error' => ucfirst($field) . ' is required'
                            ]);
                            exit;
                        }
                    }
                    
                    // Check if username or email already exists
                    $check_query = "SELECT id FROM users WHERE username = :username OR email = :email";
                    $check_stmt = $db->prepare($check_query);
                    $check_stmt->bindValue(':username', $data['username']);
                    $check_stmt->bindValue(':email', $data['email']);
                    $check_stmt->execute();
                    
                    if ($check_stmt->rowCount() > 0) {
                        http_response_code(400);
                        echo json_encode([
                            'success' => false,
                            'error' => 'Username or email already exists'
                        ]);
                        break;
                    }
                    
                    $password_hash = password_hash($data['password'], PASSWORD_DEFAULT);
                    
                    $query = "INSERT INTO users (username, full_name, email, password_hash, role) 
                             VALUES (:username, :full_name, :email, :password_hash, 'user')";
                    $stmt = $db->prepare($query);
                    $stmt->bindValue(':username', $data['username']);
                    $stmt->bindValue(':full_name', $data['full_name']);
                    $stmt->bindValue(':email', $data['email']);
                    $stmt->bindValue(':password_hash', $password_hash);
                    
                    if ($stmt->execute()) {
                        echo json_encode([
                            'success' => true,
                            'message' => 'User registered successfully',
                            'user_id' => $db->lastInsertId()
                        ]);
                    } else {
                        throw new Exception('Failed to register user');
                    }
                } catch (Exception $e) {
                    http_response_code(500);
                    echo json_encode([
                        'success' => false,
                        'error' => $e->getMessage()
                    ]);
                }
                break;
                
            case 'login':
        error_log('LOGIN DATA: ' . json_encode($data));
        try {
            if (!isset($data['username']) || !isset($data['password'])) {
                error_log('LOGIN ERROR: missing username or password');
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Username and password are required'
                ]);
                break;
            }
            $query = "SELECT id, username, email, password_hash, role, status, avatar_url FROM users 
                     WHERE username = :username OR email = :email";
            error_log('LOGIN: preparing SQL');
            $stmt = $db->prepare($query);
            $stmt->bindValue(':username', $data['username']);
            $stmt->bindValue(':email', $data['username']);
            $stmt->execute();
            error_log('LOGIN: SQL executed');
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            error_log('LOGIN: user fetch result: ' . json_encode($user));
            if ($user && password_verify($data['password'], $user['password_hash'])) {
                // Check if account is inactive
                if (isset($user['status']) && $user['status'] === 'inactive') {
                    error_log('LOGIN: account inactive');
                    session_destroy(); // Xóa session nếu có session cũ
                    http_response_code(403);
                    echo json_encode([
                        'success' => false,
                        'error' => 'Tài khoản đã bị vô hiệu hóa, vui lòng liên hệ quản trị viên!'
                    ]);
                    break;
                }
                error_log('LOGIN: password verify OK, setting session');
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['username'] = $user['username'];
                $_SESSION['role'] = $user['role'];
                unset($user['password_hash']); // Don't send password hash
                error_log('LOGIN: session set, returning success');
                echo json_encode([
                    'success' => true,
                    'message' => 'Login successful',
                    'user' => $user
                ]);
            } else {
                error_log('LOGIN: invalid credentials');
                http_response_code(401);
                echo json_encode([
                    'success' => false,
                    'error' => 'Invalid username or password'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            error_log('LOGIN ERROR: ' . $e->getMessage());
            echo json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
        break;
                
            case 'logout':
                session_start();
                session_destroy();
                echo json_encode([
                    'success' => true,
                    'message' => 'Logged out successfully'
                ]);
                break;
                
            default:
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Invalid action'
                ]);
                break;
        }
        break;
        
    case 'GET':
        // Check current user session
        if (isset($_SESSION['user_id'])) {
            $query = "SELECT id, username, full_name, email, role, avatar_url FROM users WHERE id = :user_id";
            $stmt = $db->prepare($query);
            $stmt->bindValue(':user_id', $_SESSION['user_id']);
            $stmt->execute();
            
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($user) {
                echo json_encode([
                    'success' => true,
                    'user' => $user
                ]);
            } else {
                session_destroy();
                http_response_code(401);
                echo json_encode([
                    'success' => false,
                    'error' => 'User not found'
                ]);
            }
        } else {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'error' => 'Not authenticated'
            ]);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode([
            'success' => false,
            'error' => 'Method not allowed'
        ]);
        break;
}
?>
