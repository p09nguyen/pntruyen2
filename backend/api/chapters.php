<?php
date_default_timezone_set('Asia/Ho_Chi_Minh');
// Handle CORS first (shared)
require_once(__DIR__ . '/config/cors.php');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once(__DIR__ . '/config/database.php');
require_once(__DIR__ . '/utils/SlugHelper.php');


session_start();
$database = new Database();
$db = $database->getConnection();

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        try {
            $story_id = isset($_GET['story_id']) ? $_GET['story_id'] : null;
            $story_slug = isset($_GET['story_slug']) ? $_GET['story_slug'] : null;
            $chapter_identifier = isset($_GET['id']) ? $_GET['id'] : null;
            $chapter_slug = isset($_GET['slug']) ? $_GET['slug'] : null;
            
            if ($chapter_identifier || $chapter_slug) {
                // Get single chapter with navigation info (include explicit slug fields)
                $query = "SELECT c.*, 
                         c.slug AS slug,
                         s.title as story_title, 
                         s.slug as story_slug,
                         (SELECT c2.id FROM chapters c2 WHERE c2.story_id = c.story_id AND c2.chapter_number < c.chapter_number ORDER BY c2.chapter_number DESC LIMIT 1) as prev_chapter_id,
                         (SELECT c2.slug FROM chapters c2 WHERE c2.story_id = c.story_id AND c2.chapter_number < c.chapter_number ORDER BY c2.chapter_number DESC LIMIT 1) as prev_chapter_slug,
                         (SELECT c2.id FROM chapters c2 WHERE c2.story_id = c.story_id AND c2.chapter_number > c.chapter_number ORDER BY c2.chapter_number ASC LIMIT 1) as next_chapter_id,
                         (SELECT c2.slug FROM chapters c2 WHERE c2.story_id = c.story_id AND c2.chapter_number > c.chapter_number ORDER BY c2.chapter_number ASC LIMIT 1) as next_chapter_slug
                         FROM chapters c
                         LEFT JOIN stories s ON c.story_id = s.id
                         WHERE ";
                
                if ($chapter_slug && $story_slug) {
                    $query .= "c.slug = :chapter_slug AND s.slug = :story_slug";
                    $stmt = $db->prepare($query);
                    $stmt->bindValue(':chapter_slug', $chapter_slug);
                    $stmt->bindValue(':story_slug', $story_slug);
                } else if ($chapter_identifier) {
                    if (is_numeric($chapter_identifier)) {
                        $query .= "c.id = :chapter_id";
                        $stmt = $db->prepare($query);
                        $stmt->bindValue(':chapter_id', $chapter_identifier);
                    } else {
                        $query .= "c.slug = :chapter_slug";
                        $stmt = $db->prepare($query);
                        $stmt->bindValue(':chapter_slug', $chapter_identifier);
                    }
                } else {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'error' => 'Chapter identifier required'
                    ]);
                    exit;
                }
                
                $stmt->execute();
                
                $chapter = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($chapter) {
                    // --- TĂNG view_count mỗi lần đọc chương ---
                    if (isset($chapter['id'])) {
                        $updateView = $db->prepare("UPDATE chapters SET view_count = view_count + 1 WHERE id = ?");
                        $updateView->execute([$chapter['id']]);
                        // Update lại giá trị view_count trong $chapter để trả về đúng số mới nhất
                        $chapter['view_count'] = isset($chapter['view_count']) ? ($chapter['view_count'] + 1) : 1;
                    }
                    // --- DEBUG: Log user_id, story_id khi đọc chương ---
                    $user_id = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;
                    error_log("Chapters API - Read chapter: user_id=" . var_export($user_id, true) . ", story_id=" . var_export($chapter['story_id'] ?? null, true));
                    if ($user_id && isset($chapter['story_id'])) {
                        $today = date('Y-m-d');
                        $checkSql = "SELECT id FROM story_views WHERE user_id = :user_id AND story_id = :story_id AND view_date = :today LIMIT 1";
                        $checkStmt = $db->prepare($checkSql);
                        $checkStmt->bindValue(':user_id', $user_id);
                        $checkStmt->bindValue(':story_id', $chapter['story_id']);
                        $checkStmt->bindValue(':today', $today);
                        $checkStmt->execute();
                        error_log("Chapters API - story_views check rowCount=" . $checkStmt->rowCount());
                        if ($checkStmt->rowCount() === 0) {
                            $insertSql = "INSERT INTO story_views (user_id, story_id, view_date) VALUES (?, ?, ?)";
                            $result = $db->prepare($insertSql)->execute([$user_id, $chapter['story_id'], $today]);
                            error_log("Chapters API - story_views INSERT result=" . var_export($result, true));
                        }
                    }
                    echo json_encode([
                        'success' => true,
                        'data' => $chapter
                    ]);
                } else {
                    http_response_code(404);
                    echo json_encode([
                        'success' => false,
                        'error' => 'Chapter not found'
                    ]);
                }
            } elseif ($story_id) {
                // Pagination params
                $page = isset($_GET['page']) && is_numeric($_GET['page']) && $_GET['page'] > 0 ? intval($_GET['page']) : 1;
                $limit = isset($_GET['limit']) && is_numeric($_GET['limit']) && $_GET['limit'] > 0 ? intval($_GET['limit']) : 20;
                $offset = ($page - 1) * $limit;

                // Get total chapters count
                $count_query = "SELECT COUNT(*) FROM chapters WHERE story_id = :story_id";
                $count_stmt = $db->prepare($count_query);
                $count_stmt->bindValue(':story_id', $story_id);
                $count_stmt->execute();
                $total = (int)$count_stmt->fetchColumn();
                $pages = $limit > 0 ? ceil($total / $limit) : 1;

                // Get paginated chapters with explicit override rules only
                // Default: asc (chap 1 -> n). Use desc only when explicitly requested.
                $sortParam = isset($_GET['sort']) ? strtolower($_GET['sort']) : '';
                if ($sortParam !== 'asc' && $sortParam !== 'desc') {
                    $sortParam = (isset($_GET['admin']) && $_GET['admin'] == '1') ? 'desc' : 'asc';
                }
                $orderBy = ($sortParam === 'desc') ? 'chapter_number DESC' : 'chapter_number ASC';
                $query = "SELECT id, story_id, title, chapter_number, slug, created_at 
                         FROM chapters 
                         WHERE story_id = :story_id 
                         ORDER BY $orderBy
                         LIMIT :offset, :limit";
                $stmt = $db->prepare($query);
                $stmt->bindValue(':story_id', $story_id, PDO::PARAM_INT);
                $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
                $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
                $stmt->execute();
                $chapters = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode([
                    'success' => true,
                    'data' => $chapters,
                    'pagination' => [
                        'page' => $page,
                        'limit' => $limit,
                        'total' => $total,
                        'pages' => $pages
                    ]
                ]);
            } else {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'story_id or chapter id is required'
                ]);
            }
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
            
            // Debug logging
            error_log("Chapters API - Data received: " . json_encode($data));

            // --- BULK ADD SUPPORT ---
            if (is_array($data) && array_keys($data) === range(0, count($data) - 1)) {
                // $data là array tuần tự (bulk add)
                $results = [];
                $successCount = 0;
                $failCount = 0;
                foreach ($data as $idx => $chapter) {
                    $required_fields = ['story_id', 'title', 'content', 'chapter_number'];
                    $missing = [];
                    foreach ($required_fields as $field) {
                        if (!isset($chapter[$field]) || empty($chapter[$field])) {
                            $missing[] = $field;
                        }
                    }
                    if (!empty($missing)) {
                        $results[] = [
                            'index' => $idx,
                            'success' => false,
                            'error' => 'Missing fields: ' . implode(', ', $missing)
                        ];
                        $failCount++;
                        continue;
                    }
                    // Tạo slug unique cho chapter
                    $slug = SlugHelper::createUniqueChapterSlug($db, $chapter['story_id'], $chapter['chapter_number']);
                    $query = "INSERT INTO chapters (story_id, title, slug, content, chapter_number) VALUES (:story_id, :title, :slug, :content, :chapter_number)";
                    $stmt = $db->prepare($query);
                    $stmt->bindValue(':story_id', $chapter['story_id']);
                    $stmt->bindValue(':title', $chapter['title']);
                    $stmt->bindValue(':slug', $slug);
                    $stmt->bindValue(':content', $chapter['content']);
                    $stmt->bindValue(':chapter_number', $chapter['chapter_number']);
                    $executeResult = $stmt->execute();
                    if ($executeResult) {
                        $chapter_id = $db->lastInsertId();
                        // Update story's updated_at
                        $update_story = "UPDATE stories SET updated_at = :updated_at WHERE id = :story_id";
$update_stmt = $db->prepare($update_story);
$update_stmt->bindValue(':updated_at', date('Y-m-d H:i:s'));
$update_stmt->bindValue(':story_id', $chapter['story_id']);
$update_stmt->execute();
                        $results[] = [
                            'index' => $idx,
                            'success' => true,
                            'id' => $chapter_id
                        ];
                        $successCount++;
                    } else {
                        $error = $stmt->errorInfo();
                        $results[] = [
                            'index' => $idx,
                            'success' => false,
                            'error' => $error[2]
                        ];
                        $failCount++;
                    }
                }
                // Tổng hợp kết quả
                echo json_encode([
                    'success' => $failCount === 0,
                    'total' => count($data),
                    'added' => $successCount,
                    'failed' => $failCount,
                    'results' => $results
                ]);
                break;
            }
            // --- END BULK ADD ---

            // Check if this is actually a PUT request using _method parameter
            if (isset($data['_method']) && $data['_method'] === 'PUT') {
                // Handle PUT request (update)
                $chapter_id = isset($_GET['id']) ? $_GET['id'] : null;
                if (!$chapter_id) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'error' => 'Chapter ID is required'
                    ]);
                    exit;
                }
                
                // Remove _method from data
                unset($data['_method']);
                
                // Validate required fields for update
                $allowed_fields = ['story_id', 'title', 'content', 'chapter_number'];
                $update_data = [];
                
                foreach ($allowed_fields as $field) {
                    if (isset($data[$field])) {
                        $update_data[$field] = $data[$field];
                    }
                }
                
                if (empty($update_data)) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'error' => 'No valid fields to update'
                    ]);
                    exit;
                }
                
                // Nếu cập nhật chapter_number, tạo slug mới
                if (isset($update_data['chapter_number']) && isset($update_data['story_id'])) {
                    $update_data['slug'] = SlugHelper::createUniqueChapterSlug($db, $update_data['story_id'], $update_data['chapter_number'], $chapter_id);
                }
                
                // Build update query
                $set_clauses = [];
                foreach ($update_data as $field => $value) {
                    $set_clauses[] = "$field = :$field";
                }
                
                $query = "UPDATE chapters SET " . implode(', ', $set_clauses) . " WHERE id = :id";
                error_log("Chapters API - Query: " . $query);
                error_log("Chapters API - Update data: " . json_encode($update_data));
                
                $stmt = $db->prepare($query);
                
                // Bind parameters
                foreach ($update_data as $field => $value) {
                    $stmt->bindValue(":$field", $value);
                }
                $stmt->bindValue(':id', $chapter_id);
                
                if ($stmt->execute()) {
                    $affected_rows = $stmt->rowCount();
                    error_log("Chapters API - Update successful, affected rows: " . $affected_rows);
                    
                    // Update story's updated_at timestamp
                    if (isset($update_data['story_id'])) {
                        $story_update = "UPDATE stories SET updated_at = :updated_at WHERE id = :story_id";
                        $story_stmt = $db->prepare($story_update);
                        $story_stmt->bindValue(':story_id', $update_data['story_id']);
                        $story_stmt->execute();
                    }
                    
                    echo json_encode([
                        'success' => true,
                        'message' => 'Chapter updated successfully'
                    ]);
                } else {
                    $error = $stmt->errorInfo();
                    error_log("Chapters API - Database error: " . json_encode($error));
                    http_response_code(500);
                    echo json_encode([
                        'success' => false,
                        'error' => 'Failed to update chapter: ' . $error[2]
                    ]);
                }
            } else {
                // Handle normal POST request (create)
                $required_fields = ['story_id', 'title', 'content', 'chapter_number'];
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
                
                // Tạo slug unique cho chapter
                $slug = SlugHelper::createUniqueChapterSlug($db, $data['story_id'], $data['chapter_number']);
                
                $query = "INSERT INTO chapters (story_id, title, slug, content, chapter_number) 
                         VALUES (:story_id, :title, :slug, :content, :chapter_number)";
                $stmt = $db->prepare($query);
                $stmt->bindValue(':story_id', $data['story_id']);
                $stmt->bindValue(':title', $data['title']);
                $stmt->bindValue(':slug', $slug);
                $stmt->bindValue(':content', $data['content']);
                $stmt->bindValue(':chapter_number', $data['chapter_number']);
                
                $executeResult = $stmt->execute();
                if (!$executeResult) {
                    $error = $stmt->errorInfo();
                    error_log('Chapters API - INSERT chapter error: ' . json_encode($error));
                }
                if ($executeResult) {
                    $chapter_id = $db->lastInsertId(); // LẤY NGAY SAU INSERT
                    error_log('Chapters API - lastInsertId after insert: ' . print_r($chapter_id, true));
                    if (!$chapter_id) {
                        error_log('Chapters API - lastInsertId is empty or zero!');
                        throw new Exception('Không lấy được chapter_id sau khi insert!');
                    }
                    // Update story's updated_at timestamp
                    $update_story = "UPDATE stories SET updated_at = :updated_at WHERE id = :story_id";
$update_stmt = $db->prepare($update_story);
$update_stmt->bindValue(':updated_at', date('Y-m-d H:i:s'));
$update_stmt->bindValue(':story_id', $data['story_id']);
$update_stmt->execute();

                    // Insert notifications for all users who bookmarked this story
                    $bookmark_query = "SELECT user_id FROM bookmarks WHERE story_id = :story_id";
                    $bookmark_stmt = $db->prepare($bookmark_query);
                    $bookmark_stmt->bindValue(':story_id', $data['story_id']);
                    $bookmark_stmt->execute();
                    $users = $bookmark_stmt->fetchAll(PDO::FETCH_COLUMN);
                    if ($users && count($users) > 0) {
                        $notif_query = "INSERT INTO notifications (user_id, story_id, chapter_id) VALUES (:user_id, :story_id, :chapter_id)";
                        $notif_stmt = $db->prepare($notif_query);
                        foreach ($users as $uid) {
                            $notif_stmt->execute([
                                ':user_id' => $uid,
                                ':story_id' => $data['story_id'],
                                ':chapter_id' => $chapter_id
                            ]);
                        }
                    }
                    
                    echo json_encode([
                        'success' => true,
                        'message' => 'Chapter created successfully',
                        'id' => $chapter_id
                    ]);
                } else {
                    throw new Exception('Failed to create chapter');
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
        
    case 'PUT':
        try {
            $chapter_id = isset($_GET['id']) ? $_GET['id'] : null;
            if (!$chapter_id) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Chapter ID is required'
                ]);
                exit;
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            if (!$input) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Invalid JSON data'
                ]);
                exit;
            }
            
            // Validate required fields
            $required_fields = ['title', 'content', 'chapter_number'];
            foreach ($required_fields as $field) {
                if (empty($input[$field])) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'error' => ucfirst($field) . ' is required'
                    ]);
                    exit;
                }
            }
            
            $query = "UPDATE chapters SET title = :title, content = :content, chapter_number = :chapter_number, updated_at = :updated_at WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindValue(':id', $chapter_id);
            $stmt->bindValue(':title', $input['title']);
            $stmt->bindValue(':content', $input['content']);
            $stmt->bindValue(':chapter_number', $input['chapter_number']);
            
            if ($stmt->execute()) {
                // Update story's updated_at timestamp
                $story_query = "SELECT story_id FROM chapters WHERE id = :id";
                $story_stmt = $db->prepare($story_query);
                $story_stmt->bindValue(':id', $chapter_id);
                $story_stmt->execute();
                $story_result = $story_stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($story_result) {
                    $update_story = "UPDATE stories SET updated_at = :updated_at WHERE id = :story_id";
                    $update_stmt = $db->prepare($update_story);
                    $update_stmt->bindValue(':story_id', $story_result['story_id']);
                    $update_stmt->execute();
                }
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Chapter updated successfully'
                ]);
            } else {
                throw new Exception('Failed to update chapter');
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
            $chapter_id = isset($_GET['id']) ? $_GET['id'] : null;
            if (!$chapter_id) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Chapter ID is required'
                ]);
                exit;
            }
            
            error_log("Chapters API - Deleting chapter ID: " . $chapter_id);
            
            // Xóa tất cả report liên quan trước
            $del_reports = $db->prepare("DELETE FROM chapter_reports WHERE chapter_id = :chapter_id");
            $del_reports->bindValue(':chapter_id', $chapter_id);
            $del_reports->execute();

            $delete_query = "DELETE FROM chapters WHERE id = :id";
            $stmt = $db->prepare($delete_query);
            $stmt->bindValue(':id', $chapter_id);
            
            if ($stmt->execute()) {
                $affected_rows = $stmt->rowCount();
                error_log("Chapters API - Delete successful, affected rows: " . $affected_rows);
                
                if ($affected_rows > 0) {
                    echo json_encode([
                        'success' => true,
                        'message' => 'Chapter deleted successfully'
                    ]);
                } else {
                    http_response_code(404);
                    echo json_encode([
                        'success' => false,
                        'error' => 'Chapter not found'
                    ]);
                }
            } else {
                $error = $stmt->errorInfo();
                error_log("Chapters API - Delete error: " . json_encode($error));
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'error' => 'Failed to delete chapter: ' . $error[2]
                ]);
            }
        } catch (Exception $e) {
            error_log("Chapters API - Delete exception: " . $e->getMessage());
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
