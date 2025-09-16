HƯỚNG DẪN ĐĂNG NHẬP GOOGLE CHO PHP BACKEND (pntruyen2)
------------------------------------------------------

1. Cài đặt thư viện Google API Client:
   - Mở terminal/cmd tại thư mục D:\xampp\htdocs\pntruyen2\api
   - Chạy: composer require google/apiclient

2. Copy mã mẫu sau vào cuối file auth.php (trong switch POST/case 'google'):

case 'google':
    // Lấy mã code từ frontend
    $code = $data['code'] ?? null;
    if (!$code) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing Google code']);
        exit;
    }
    // Thông tin OAuth
    $client_id = '60519047481-6j6eockpffc53doah4ihu6l25ujdtnu2.apps.googleusercontent.com';
    $client_secret = 'YOUR_CLIENT_SECRET'; // <-- NHẬP SECRET Ở ĐÂY
    $redirect_uri = 'http://localhost:3000/auth/google/callback';

    require_once __DIR__ . '/vendor/autoload.php';
    $client = new Google_Client();
    $client->setClientId($client_id);
    $client->setClientSecret($client_secret);
    $client->setRedirectUri($redirect_uri);
    $client->addScope('email');
    $client->addScope('profile');

    try {
        // Lấy access token
        $token = $client->fetchAccessTokenWithAuthCode($code);
        if (isset($token['error'])) {
            throw new Exception($token['error_description'] ?? 'Google token error');
        }
        $client->setAccessToken($token['access_token']);
        $oauth = new Google_Service_Oauth2($client);
        $googleUser = $oauth->userinfo->get();

        // Lấy thông tin user từ Google
        $email = $googleUser->email;
        $full_name = $googleUser->name;
        $google_id = $googleUser->id;
        $avatar = $googleUser->picture;

        // Kiểm tra user đã tồn tại chưa
        $stmt = $db->prepare('SELECT id, username, full_name, email, role FROM users WHERE email = :email');
        $stmt->bindValue(':email', $email);
        $stmt->execute();
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$user) {
            // Nếu chưa có thì tạo user mới
            $username = 'gg_' . substr(md5($google_id), 0, 10);
            $stmt = $db->prepare('INSERT INTO users (username, full_name, email, role) VALUES (:username, :full_name, :email, "user")');
            $stmt->bindValue(':username', $username);
            $stmt->bindValue(':full_name', $full_name);
            $stmt->bindValue(':email', $email);
            $stmt->execute();
            $user_id = $db->lastInsertId();
            $user = [
                'id' => $user_id,
                'username' => $username,
                'full_name' => $full_name,
                'email' => $email,
                'role' => 'user'
            ];
        }
        // Đăng nhập (tạo session)
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['role'] = $user['role'];
        echo json_encode(['success' => true, 'user' => $user]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    break;

3. Lưu ý:
- Thay YOUR_CLIENT_SECRET bằng giá trị thực tế từ Google Cloud.
- Đảm bảo bảng users có các trường: id, username, full_name, email, role.
- Nếu đã có user với email này thì sẽ đăng nhập luôn, không tạo mới.
- Nếu lần đầu, username sẽ là gg_xxxxxxx (random).

4. Restart Apache nếu cần.

5. Test lại flow Google login trên frontend!
