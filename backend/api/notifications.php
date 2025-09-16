<?php
date_default_timezone_set('Asia/Ho_Chi_Minh');
// CORS headers (shared)
require_once(__DIR__ . '/config/cors.php');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(204);
    exit();
}

require_once(__DIR__ . '/config/database.php');
session_start();
$database = new Database();
$db = $database->getConnection();

// Auth
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Authentication required']);
    exit;
}
$user_id = $_SESSION['user_id'];

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        // Get notifications for current user (optionally support ?unread=1)
        try {
            $unread = isset($_GET['unread']) ? intval($_GET['unread']) : null;
            // Select explicit columns to avoid ambiguity and to include slugs
            $query = "SELECT 
                        n.id               AS notification_id,
                        n.user_id,
                        n.story_id,
                        n.chapter_id,
                        n.is_read,
                        n.created_at,
                        s.title           AS story_title,
                        s.slug            AS story_slug,
                        c.title           AS chapter_title,
                        c.chapter_number  AS chapter_number,
                        c.slug            AS chapter_slug
                      FROM notifications n
                      LEFT JOIN stories s ON n.story_id = s.id
                      LEFT JOIN chapters c ON n.chapter_id = c.id
                      WHERE n.user_id = :user_id";
            if ($unread === 1) {
                $query .= " AND n.is_read = 0";
            }
            $query .= " ORDER BY n.created_at DESC LIMIT 100";
            $stmt = $db->prepare($query);
            $stmt->bindValue(':user_id', $user_id);
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            // Group by story_id
            $groups = [];
            foreach ($results as $row) {
                $sid = $row['story_id'];
                if (!isset($groups[$sid])) {
                    $groups[$sid] = [
                        'story_id' => $sid,
                        'story_title' => $row['story_title'],
                        'story_slug' => $row['story_slug'],
                        'unread_count' => 0,
                        'chapters' => [],
                        'latest_created_at' => $row['created_at'],
                    ];
                }
                $groups[$sid]['chapters'][] = [
                    // IMPORTANT: use chapter_id as id to match frontend expectations
                    'id' => $row['chapter_id'],
                    'chapter_title' => $row['chapter_title'],
                    'chapter_number' => $row['chapter_number'],
                    'created_at' => $row['created_at'],
                    'is_read' => $row['is_read'],
                    'slug' => $row['chapter_slug'],
                ];
                // Count unread
                if ($row['is_read'] == 0) {
                    $groups[$sid]['unread_count']++;
                }
                // Update latest_created_at
                if (strtotime($row['created_at']) > strtotime($groups[$sid]['latest_created_at'])) {
                    $groups[$sid]['latest_created_at'] = $row['created_at'];
                }
            }
            // Sort groups by latest_created_at desc
            usort($groups, function($a, $b) {
                return strtotime($b['latest_created_at']) - strtotime($a['latest_created_at']);
            });
            echo json_encode(['success' => true, 'data' => array_values($groups)]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
        break;
    case 'POST':
        // Mark notification(s) as read
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            if (isset($data['id'])) {
                // Mark single notification as read
                $stmt = $db->prepare("UPDATE notifications SET is_read = 1 WHERE id = :id AND user_id = :user_id");
                $stmt->bindValue(':id', $data['id']);
                $stmt->bindValue(':user_id', $user_id);
                $stmt->execute();
                echo json_encode(['success' => true]);
            } elseif (isset($data['all']) && $data['all'] === true) {
                // Mark all as read
                $stmt = $db->prepare("UPDATE notifications SET is_read = 1 WHERE user_id = :user_id");
                $stmt->bindValue(':user_id', $user_id);
                $stmt->execute();
                echo json_encode(['success' => true]);
            } else {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Invalid request']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
        break;
    case 'DELETE':
        // Delete a notification
        try {
            if (!isset($_GET['id'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Notification ID required']);
                exit;
            }
            $stmt = $db->prepare("DELETE FROM notifications WHERE id = :id AND user_id = :user_id");
            $stmt->bindValue(':id', $_GET['id']);
            $stmt->bindValue(':user_id', $user_id);
            $stmt->execute();
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
        break;
    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        break;
}
