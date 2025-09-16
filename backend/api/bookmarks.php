<?php
// Handle CORS first (shared)
require_once(__DIR__ . '/config/cors.php');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(204);
    exit();
}

require_once(__DIR__ . '/config/database.php');

session_start();
$database = new Database();
$db = $database->getConnection();

// Check if user is authenticated
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'error' => 'Authentication required'
    ]);
    exit;
}

$user_id = $_SESSION['user_id'];

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        try {
            $query = "SELECT b.*, s.title as story_title, s.author, s.cover_image,
                     c.title as chapter_title, c.chapter_number
                     FROM bookmarks b
                     LEFT JOIN stories s ON b.story_id = s.id
                     LEFT JOIN chapters c ON b.chapter_id = c.id
                     WHERE b.user_id = :user_id
                     ORDER BY b.created_at DESC";
            $stmt = $db->prepare($query);
            $stmt->bindValue(':user_id', $user_id);
            $stmt->execute();
            
            $bookmarks = [];
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $bookmarks[] = $row;
            }
            
            echo json_encode([
                'success' => true,
                'data' => $bookmarks
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
        break;
        
    case 'POST':
        try {
            $data = json_decode(file_get_contents("php://input"), true);
            
            if (!isset($data['story_id'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'story_id is required'
                ]);
                break;
            }
            
            // Check if bookmark already exists
            $check_query = "SELECT id FROM bookmarks WHERE user_id = :user_id AND story_id = :story_id";
            $check_stmt = $db->prepare($check_query);
            $check_stmt->bindValue(':user_id', $user_id);
            $check_stmt->bindValue(':story_id', $data['story_id']);
            $check_stmt->execute();
            
            if ($check_stmt->rowCount() > 0) {
                // Update existing bookmark
                $query = "UPDATE bookmarks SET chapter_id = :chapter_id WHERE user_id = :user_id AND story_id = :story_id";
                $stmt = $db->prepare($query);
                $stmt->bindValue(':user_id', $user_id);
                $stmt->bindValue(':story_id', $data['story_id']);
                $stmt->bindValue(':chapter_id', $data['chapter_id'] ?? null);
                
                if ($stmt->execute()) {
                    echo json_encode([
                        'success' => true,
                        'message' => 'Bookmark updated successfully'
                    ]);
                } else {
                    throw new Exception('Failed to update bookmark');
                }
            } else {
                // Create new bookmark
                $query = "INSERT INTO bookmarks (user_id, story_id, chapter_id) VALUES (:user_id, :story_id, :chapter_id)";
                $stmt = $db->prepare($query);
                $stmt->bindValue(':user_id', $user_id);
                $stmt->bindValue(':story_id', $data['story_id']);
                $stmt->bindValue(':chapter_id', $data['chapter_id'] ?? null);
                
                if ($stmt->execute()) {
                    echo json_encode([
                        'success' => true,
                        'message' => 'Bookmark created successfully',
                        'id' => $db->lastInsertId()
                    ]);
                } else {
                    throw new Exception('Failed to create bookmark');
                }
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
        break;
        
    case 'DELETE':
        try {
            $story_id = isset($_GET['story_id']) ? $_GET['story_id'] : null;
            
            if (!$story_id) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'story_id is required'
                ]);
                break;
            }
            
            $query = "DELETE FROM bookmarks WHERE user_id = :user_id AND story_id = :story_id";
            $stmt = $db->prepare($query);
            $stmt->bindValue(':user_id', $user_id);
            $stmt->bindValue(':story_id', $story_id);
            
            if ($stmt->execute()) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Bookmark removed successfully'
                ]);
            } else {
                throw new Exception('Failed to remove bookmark');
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => $e->getMessage()
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
