<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
require_once __DIR__ . '/PHPMailer-6.10.0/src/PHPMailer.php';
require_once __DIR__ . '/PHPMailer-6.10.0/src/SMTP.php';
require_once __DIR__ . '/PHPMailer-6.10.0/src/Exception.php';
// Kiểm tra PHPMailer đã load chưa
if (!class_exists('PHPMailer\\PHPMailer\\PHPMailer')) {
    file_put_contents(__DIR__.'/reset_mail.log', "PHPMailer class not found\n", FILE_APPEND);
}

// Gửi mail reset password
header("Access-Control-Allow-Origin: https://pntruyen.online");
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

$raw = file_get_contents("php://input");
$data = json_decode($raw, true);
$email = trim($data['email'] ?? '');
file_put_contents(__DIR__.'/debug.log', print_r([
    'raw' => $raw,
    'data' => $data,
    'email' => $email
], true), FILE_APPEND);

if (!$email) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Email là bắt buộc']);
    exit;
}

$stmt = $db->prepare("SELECT id FROM users WHERE email = :email");
$stmt->bindValue(':email', $email);
$stmt->execute();
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    // Không tiết lộ email tồn tại hay không
    echo json_encode(['success' => true, 'message' => 'Nếu email tồn tại, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.']);
    exit;
}

// Sinh token ngẫu nhiên
$token = bin2hex(random_bytes(32));
$expires = date('Y-m-d H:i:s', strtotime('+30 minutes'));

// Lưu vào bảng password_resets
$db->prepare("DELETE FROM password_resets WHERE user_id = :uid")->execute([':uid' => $user['id']]);
$stmt = $db->prepare("INSERT INTO password_resets (user_id, token, expires_at) VALUES (:uid, :token, :expires)");
$stmt->bindValue(':uid', $user['id']);
$stmt->bindValue(':token', $token);
$stmt->bindValue(':expires', $expires);
$stmt->execute();

$resetLink = "https://pntruyen.shop/reset-password?token=$token";
$subject = "Yêu cầu đặt lại mật khẩu";
$message = "Xin chào,\n\nBạn hoặc ai đó đã yêu cầu đặt lại mật khẩu cho tài khoản của bạn.\n\nVui lòng nhấp vào liên kết sau để đặt lại mật khẩu (có hiệu lực 30 phút):\n$resetLink\n\nNếu không phải bạn, hãy bỏ qua email này.";


$mail = new PHPMailer(true);
try {
    $mail->isSMTP();
    $mail->Host = 'smtp.gmail.com';
    $mail->SMTPAuth = true;
    $mail->Username = 'np7098037@gmail.com'; // Thay bằng email Gmail của bạn
    $mail->Password = 'orun vypw visg vsll';   // Dán mật khẩu ứng dụng vừa tạo
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = 587;
    $mail->setFrom('yourgmail@gmail.com', 'no-reply@pntruyen.shop');
    $mail->setFrom('noreply@pntruyen.shop', 'no-reply@pntruyen.shop');
    $mail->addAddress($email);

    $mail->CharSet = 'UTF-8';
    $mail->isHTML(false);
    $mail->CharSet = 'UTF-8';
    $mail->Subject = $subject;
    $mail->Body    = $message;

    $mail->send();
} catch (Exception $e) {
    file_put_contents(__DIR__.'/reset_mail.log', "Mail error: {$mail->ErrorInfo}\n", FILE_APPEND);
}

echo json_encode(['success' => true, 'message' => 'Nếu email tồn tại, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.']);
