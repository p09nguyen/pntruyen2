<?php
// Handle CORS first (shared)
require_once(__DIR__ . '/config/cors.php');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}
require_once(__DIR__ . '/config/database.php');
require_once(__DIR__ . '/utils/SlugHelper.php');

$database = new Database();
$db = $database->getConnection();

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        try {
            // Get query parameters
            $category_id = isset($_GET['category_id']) ? $_GET['category_id'] : null;
            $status = isset($_GET['status']) ? $_GET['status'] : null;
            $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 12;
            $search = isset($_GET['search']) ? $_GET['search'] : null;
            $story_identifier = isset($_GET['id']) ? $_GET['id'] : null;
            $story_slug = isset($_GET['slug']) ? $_GET['slug'] : null;
            
            $offset = ($page - 1) * $limit;
            
            // If getting single story by ID or slug
            if ($story_identifier || $story_slug) {
                $query = "SELECT s.*, c.name as category_name, c.slug as category_slug,
                         (SELECT COUNT(*) FROM chapters WHERE story_id = s.id) as chapter_count
                         FROM stories s 
                         LEFT JOIN categories c ON s.category_id = c.id 
                         WHERE "; // show_on_home đã nằm trong s.*
                
                if ($story_slug) {
                    $query .= "s.slug = :slug";
                    $stmt = $db->prepare($query);
                    file_put_contents(
    __DIR__ . '/debug.log',
    date('c') . " - GET: " . json_encode($_GET) .
    (isset($story_identifier) ? " - story_identifier: $story_identifier" : "") .
    (isset($story_slug) ? " - story_slug: $story_slug" : "") .
    PHP_EOL,
    FILE_APPEND
);
                    $stmt->bindValue(':slug', $story_slug);
                } else {
                    // Kiểm tra xem identifier là số (ID) hay string (slug)
                    if (is_numeric($story_identifier)) {
                        $query .= "s.id = :story_id";
                        $stmt = $db->prepare($query);
                        file_put_contents(
    __DIR__ . '/debug.log',
    date('c') . " - GET: " . json_encode($_GET) .
    (isset($story_identifier) ? " - story_identifier: $story_identifier" : "") .
    (isset($story_slug) ? " - story_slug: $story_slug" : "") .
    PHP_EOL,
    FILE_APPEND
);
                        $stmt->bindValue(':story_id', $story_identifier);
                    } else {
                        $query .= "s.slug = :slug";
                        $stmt = $db->prepare($query);
                        file_put_contents(
    __DIR__ . '/debug.log',
    date('c') . " - GET: " . json_encode($_GET) .
    (isset($story_identifier) ? " - story_identifier: $story_identifier" : "") .
    (isset($story_slug) ? " - story_slug: $story_slug" : "") .
    PHP_EOL,
    FILE_APPEND
);
                        $stmt->bindValue(':slug', $story_identifier);
                    }
                }
                
                $stmt->execute();
                
                $story = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($story) {
                    // Lấy mảng categories cho 1 truyện
                    $cat_stmt = $db->prepare("SELECT c.id, c.name FROM story_categories sc JOIN categories c ON sc.category_id = c.id WHERE sc.story_id = ?");
                    $cat_stmt->execute([$story['id']]);
                    $story['categories'] = $cat_stmt->fetchAll(PDO::FETCH_ASSOC);

                    echo json_encode([
                        'success' => true,
                        'data' => $story
                    ]);
                } else {
                    http_response_code(404);
                    echo json_encode([
                        'success' => false,
                        'error' => 'Story not found'
                    ]);
                }
                break;
            }
            
            // Build query for multiple stories
            $where_conditions = [];
            $params = [];
            
            if ($category_id) {
                $where_conditions[] = "EXISTS (SELECT 1 FROM story_categories sc WHERE sc.story_id = s.id AND sc.category_id = :category_id)";
                $params[':category_id'] = $category_id;
            }
            
            if ($status) {
                $where_conditions[] = "s.status = :status";
                $params[':status'] = $status;
            }
            
            if ($search) {
                $where_conditions[] = "(s.title LIKE :search_title OR s.author LIKE :search_author)";
            }
            
            $where_clause = !empty($where_conditions) ? 'WHERE ' . implode(' AND ', $where_conditions) : '';
            
            // Get total count
            $count_query = "SELECT COUNT(*) as total FROM stories s $where_clause";
            $count_stmt = $db->prepare($count_query);
            if ($category_id) $count_stmt->bindValue(':category_id', $category_id);
            if ($status) $count_stmt->bindValue(':status', $status);
            if ($search) {
                $count_stmt->bindValue(':search_title', '%' . $search . '%');
                $count_stmt->bindValue(':search_author', '%' . $search . '%');
            }
            $count_stmt->execute();
            $total = $count_stmt->fetch(PDO::FETCH_ASSOC)['total'];
            
            // Get stories
            $query = "SELECT s.*, c.name as category_name,
                     (SELECT COUNT(*) FROM chapters WHERE story_id = s.id) as chapter_count
                     FROM stories s 
                     LEFT JOIN categories c ON s.category_id = c.id 
                     $where_clause
                     ORDER BY s.updated_at DESC, s.created_at DESC 
                     LIMIT :limit OFFSET :offset"; // show_on_home đã nằm trong s.*
            
            $stmt = $db->prepare($query);
            file_put_contents(
    __DIR__ . '/debug.log',
    date('c') . " - GET: " . json_encode($_GET) .
    (isset($story_identifier) ? " - story_identifier: $story_identifier" : "") .
    (isset($story_slug) ? " - story_slug: $story_slug" : "") .
    PHP_EOL,
    FILE_APPEND
);
            if ($category_id) $stmt->bindValue(':category_id', $category_id);
            if ($status) $stmt->bindValue(':status', $status);
            if ($search) {
                $stmt->bindValue(':search_title', '%' . $search . '%');
                $stmt->bindValue(':search_author', '%' . $search . '%');
            }
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();
            
            $stories = [];
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                // Lấy mảng categories cho mỗi truyện
                $cat_stmt = $db->prepare("SELECT c.id, c.name FROM story_categories sc JOIN categories c ON sc.category_id = c.id WHERE sc.story_id = ?");
                $cat_stmt->execute([$row['id']]);
                $row['categories'] = $cat_stmt->fetchAll(PDO::FETCH_ASSOC);
                $stories[] = $row;
            }
            
            echo json_encode([
                'success' => true,
                'data' => $stories,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => (int)$total,
                    'pages' => ceil($total / $limit)
                ]
            ]);
        } catch (Exception $e) {
            error_log('Stories API ERROR: ' . $e->getMessage());
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
            
            // Debug: Log received data
            error_log("Stories API POST - Received data: " . json_encode($data));
            error_log("Stories API POST - GET params: " . json_encode($_GET));
            
            // Check if this is actually a PUT request using _method parameter
            if (isset($data['_method']) && $data['_method'] === 'PUT') {
                error_log("Stories API - Handling PUT request via _method");
                
                // Handle PUT request (update)
                $story_id = isset($_GET['id']) ? $_GET['id'] : null;
                if (!$story_id) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'error' => 'Story ID is required'
                    ]);
                    exit;
                }
                
                error_log("Stories API - Updating story ID: " . $story_id);
                
                // Remove _method from data
                unset($data['_method']);
                
                // Validate required fields for update
                $allowed_fields = ['title', 'author', 'description', 'status', 'category_id', 'cover_image', 'show_on_home'];
                $update_data = [];
                
                foreach ($allowed_fields as $field) {
                    if (isset($data[$field])) {
                        $update_data[$field] = $data[$field];
                    }
                }
                
                error_log("Stories API - Update data: " . json_encode($update_data));
                
                if (empty($update_data)) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'error' => 'No valid fields to update'
                    ]);
                    exit;
                }
                
                // Build update query
                $set_clauses = [];
                foreach ($update_data as $field => $value) {
                    $set_clauses[] = "$field = :$field";
                }
                $set_clauses[] = "updated_at = :updated_at";
                
                $query = "UPDATE stories SET " . implode(', ', $set_clauses) . " WHERE id = :id";
                error_log("Stories API - Update query: " . $query);
                
                $stmt = $db->prepare($query);
                file_put_contents(
    __DIR__ . '/debug.log',
    date('c') . " - GET: " . json_encode($_GET) .
    (isset($story_identifier) ? " - story_identifier: $story_identifier" : "") .
    (isset($story_slug) ? " - story_slug: $story_slug" : "") .
    PHP_EOL,
    FILE_APPEND
);
                
                // Bind parameters
                foreach ($update_data as $field => $value) {
                    $stmt->bindValue(":$field", $value);
                }
                $stmt->bindValue(':id', $story_id);
                $stmt->bindValue(':updated_at', date('Y-m-d H:i:s'));
                
                if ($stmt->execute()) {
                    $affected_rows = $stmt->rowCount();
                    error_log("Stories API - Update successful, affected rows: " . $affected_rows);
                    // Update story_categories (many-to-many)
                    $category_ids = $data['category_ids'] ?? [];
                    if (!empty($category_ids) && is_array($category_ids)) {
                        file_put_contents(__DIR__ . '/debug.log', date('c') . " - Update categories for story_id: " . $story_id . " - category_ids: " . json_encode($category_ids) . PHP_EOL, FILE_APPEND);
                        $del_stmt = $db->prepare("DELETE FROM story_categories WHERE story_id = ?");
                        if (!$del_stmt->execute([$story_id])) {
                            file_put_contents(__DIR__ . '/debug.log', date('c') . " - DEL ERROR: " . json_encode($del_stmt->errorInfo()) . PHP_EOL, FILE_APPEND);
                        } else {
                            file_put_contents(__DIR__ . '/debug.log', date('c') . " - DEL OK for story_id: " . $story_id . PHP_EOL, FILE_APPEND);
                        }
                        $ins_stmt = $db->prepare("INSERT INTO story_categories (story_id, category_id) VALUES (?, ?)");
                        foreach ($category_ids as $cat_id) {
                            if (!$ins_stmt->execute([$story_id, $cat_id])) {
                                file_put_contents(__DIR__ . '/debug.log', date('c') . " - INS ERROR: story_id=$story_id, cat_id=$cat_id - " . json_encode($ins_stmt->errorInfo()) . PHP_EOL, FILE_APPEND);
                            } else {
                                file_put_contents(__DIR__ . '/debug.log', date('c') . " - INS OK: story_id=$story_id, cat_id=$cat_id" . PHP_EOL, FILE_APPEND);
                            }
                        }
                    }
                    echo json_encode([
                        'success' => true,
                        'message' => 'Story updated successfully',
                        'affected_rows' => $affected_rows
                    ]);
                } else {
                    $error_info = $stmt->errorInfo();
                    error_log("Stories API - Update failed: " . json_encode($error_info));
                    
                    http_response_code(500);
                    echo json_encode([
                        'success' => false,
                        'error' => 'Failed to update story',
                        'debug' => $error_info
                    ]);
                }
            } else {
                // Handle normal POST request (create)
                $required_fields = ['title', 'author', 'category_id'];
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
                
                // Tạo slug unique cho story
                $slug = SlugHelper::createUniqueStorySlug($db, $data['title']);
                
                $query = "INSERT INTO stories (title, slug, author, description, status, category_id, cover_image, show_on_home, created_at, updated_at) 
                         VALUES (:title, :slug, :author, :description, :status, :category_id, :cover_image, :show_on_home, :created_at, :updated_at)";
                $stmt = $db->prepare($query);
                file_put_contents(
    __DIR__ . '/debug.log',
    date('c') . " - GET: " . json_encode($_GET) .
    (isset($story_identifier) ? " - story_identifier: $story_identifier" : "") .
    (isset($story_slug) ? " - story_slug: $story_slug" : "") .
    PHP_EOL,
    FILE_APPEND
);
                $stmt->bindValue(':title', $data['title']);
                $stmt->bindValue(':slug', $slug);
                $stmt->bindValue(':author', $data['author']);
                $stmt->bindValue(':description', $data['description'] ?? '');
                $stmt->bindValue(':status', $data['status'] ?? 'ongoing');
                $stmt->bindValue(':category_id', $data['category_id']);
                $stmt->bindValue(':cover_image', $data['cover_image'] ?? '');
                $stmt->bindValue(':show_on_home', isset($data['show_on_home']) ? (int)$data['show_on_home'] : 0);
                $stmt->bindValue(':created_at', date('Y-m-d H:i:s'));
                $stmt->bindValue(':updated_at', date('Y-m-d H:i:s'));
                
                if ($stmt->execute()) {
                    $story_id = $db->lastInsertId();
                    // Lưu các category_ids vào story_categories
                    $category_ids = $data['category_ids'] ?? [];
                    if (!empty($category_ids) && is_array($category_ids)) {
                        file_put_contents(__DIR__ . '/debug.log', date('c') . " - Update categories for story_id: " . $story_id . " - category_ids: " . json_encode($category_ids) . PHP_EOL, FILE_APPEND);
                        $del_stmt = $db->prepare("DELETE FROM story_categories WHERE story_id = ?");
                        if (!$del_stmt->execute([$story_id])) {
                            file_put_contents(__DIR__ . '/debug.log', date('c') . " - DEL ERROR: " . json_encode($del_stmt->errorInfo()) . PHP_EOL, FILE_APPEND);
                        } else {
                            file_put_contents(__DIR__ . '/debug.log', date('c') . " - DEL OK for story_id: " . $story_id . PHP_EOL, FILE_APPEND);
                        }
                        $ins_stmt = $db->prepare("INSERT INTO story_categories (story_id, category_id) VALUES (?, ?)");
                        foreach ($category_ids as $cat_id) {
                            if (!$ins_stmt->execute([$story_id, $cat_id])) {
                                file_put_contents(__DIR__ . '/debug.log', date('c') . " - INS ERROR: story_id=$story_id, cat_id=$cat_id - " . json_encode($ins_stmt->errorInfo()) . PHP_EOL, FILE_APPEND);
                            } else {
                                file_put_contents(__DIR__ . '/debug.log', date('c') . " - INS OK: story_id=$story_id, cat_id=$cat_id" . PHP_EOL, FILE_APPEND);
                            }
                        }
                    }
                    echo json_encode([
                        'success' => true,
                        'message' => 'Story created successfully',
                        'id' => $story_id
                    ]);
                } else {
                    throw new Exception('Failed to create story');
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
            $story_id = isset($_GET['id']) ? $_GET['id'] : null;
            if (!$story_id) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Story ID is required'
                ]);
                exit;
            }
            
            $data = json_decode(file_get_contents("php://input"), true);
            if (!$data) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Invalid JSON data'
                ]);
                exit;
            }
            
            error_log("Stories API - Updating story ID: " . $story_id);
            error_log("Stories API - Update data: " . json_encode($data));
            
            $required_fields = ['title', 'author', 'category_id'];
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
            
            // Tạo slug mới nếu title thay đổi
            $slug = SlugHelper::createUniqueStorySlug($db, $data['title'], $story_id);
            
            $query = "UPDATE stories SET title = :title, slug = :slug, author = :author, description = :description, category_id = :category_id, status = :status, cover_image = :cover_image, updated_at = :updated_at WHERE id = :id";
            error_log("Stories API - Update query: " . $query);
            
            $stmt = $db->prepare($query);
            file_put_contents(
    __DIR__ . '/debug.log',
    date('c') . " - GET: " . json_encode($_GET) .
    (isset($story_identifier) ? " - story_identifier: $story_identifier" : "") .
    (isset($story_slug) ? " - story_slug: $story_slug" : "") .
    PHP_EOL,
    FILE_APPEND
);
            $stmt->bindValue(':id', $story_id);
            $stmt->bindValue(':title', $data['title']);
            $stmt->bindValue(':slug', $slug);
            $stmt->bindValue(':author', $data['author']);
            $stmt->bindValue(':description', $data['description'] ?? '');
            $stmt->bindValue(':category_id', $data['category_id']);
            $stmt->bindValue(':status', $data['status'] ?? 'ongoing');
            $stmt->bindValue(':cover_image', $data['cover_image'] ?? '');
            
            if ($stmt->execute()) {
                // Lưu các category_ids vào story_categories khi update
                $category_ids = $data['category_ids'] ?? [];
                if (!empty($category_ids) && is_array($category_ids)) {
                    file_put_contents(__DIR__ . '/debug.log', date('c') . " - Update categories for story_id: " . $story_id . " - category_ids: " . json_encode($category_ids) . PHP_EOL, FILE_APPEND);
                    $del_stmt = $db->prepare("DELETE FROM story_categories WHERE story_id = ?");
                    if (!$del_stmt->execute([$story_id])) {
                        file_put_contents(__DIR__ . '/debug.log', date('c') . " - DEL ERROR: " . json_encode($del_stmt->errorInfo()) . PHP_EOL, FILE_APPEND);
                    } else {
                        file_put_contents(__DIR__ . '/debug.log', date('c') . " - DEL OK for story_id: " . $story_id . PHP_EOL, FILE_APPEND);
                    }
                    $ins_stmt = $db->prepare("INSERT INTO story_categories (story_id, category_id) VALUES (?, ?)");
                    foreach ($category_ids as $cat_id) {
                        if (!$ins_stmt->execute([$story_id, $cat_id])) {
                            file_put_contents(__DIR__ . '/debug.log', date('c') . " - INS ERROR: story_id=$story_id, cat_id=$cat_id - " . json_encode($ins_stmt->errorInfo()) . PHP_EOL, FILE_APPEND);
                        } else {
                            file_put_contents(__DIR__ . '/debug.log', date('c') . " - INS OK: story_id=$story_id, cat_id=$cat_id" . PHP_EOL, FILE_APPEND);
                        }
                    }
                }
                $affected_rows = $stmt->rowCount();
                error_log("Stories API - Update successful, affected rows: " . $affected_rows);
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Story updated successfully',
                    'affected_rows' => $affected_rows
                ]);
            } else {
                $error_info = $stmt->errorInfo();
                error_log("Stories API - Update failed: " . json_encode($error_info));
                
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'error' => 'Failed to update story',
                    'debug' => $error_info
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
        
    case 'DELETE':
        try {
            $story_id = isset($_GET['id']) ? $_GET['id'] : null;
            if (!$story_id) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Story ID is required'
                ]);
                exit;
            }
            
            error_log("Stories API - Deleting story ID: " . $story_id);
            
            // First, delete all chapters of this story
            $delete_chapters = "DELETE FROM chapters WHERE story_id = :story_id";
            $chapters_stmt = $db->prepare($delete_chapters);
            $chapters_stmt->bindValue(':story_id', $story_id);
            $chapters_deleted = $chapters_stmt->execute();
            
            if ($chapters_deleted) {
                $chapters_count = $chapters_stmt->rowCount();
                error_log("Stories API - Deleted " . $chapters_count . " chapters");
            }
            
            // Then delete the story
            $delete_story = "DELETE FROM stories WHERE id = :id";
            $story_stmt = $db->prepare($delete_story);
            $story_stmt->bindValue(':id', $story_id);
            
            if ($story_stmt->execute()) {
                $affected_rows = $story_stmt->rowCount();
                error_log("Stories API - Delete successful, affected rows: " . $affected_rows);
                
                if ($affected_rows > 0) {
                    echo json_encode([
                        'success' => true,
                        'message' => 'Story and related chapters deleted successfully'
                    ]);
                } else {
                    http_response_code(404);
                    echo json_encode([
                        'success' => false,
                        'error' => 'Story not found'
                    ]);
                }
            } else {
                $error = $story_stmt->errorInfo();
                error_log("Stories API - Delete error: " . json_encode($error));
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'error' => 'Failed to delete story: ' . $error[2]
                ]);
            }
        } catch (Exception $e) {
            error_log("Stories API - Delete exception: " . $e->getMessage());
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
