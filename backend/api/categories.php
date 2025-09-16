<?php
// Handle CORS first (shared)
require_once(__DIR__ . '/config/cors.php');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once(__DIR__ . '/config/database.php');
$database = new Database();
$db = $database->getConnection();

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
    try {
        // Lấy tham số phân trang
        $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
        $limit = isset($_GET['limit']) ? max(1, intval($_GET['limit'])) : 20;
        $offset = ($page - 1) * $limit;

        // Đếm tổng số categories
        $count_stmt = $db->prepare("SELECT COUNT(*) FROM categories");
        $count_stmt->execute();
        $total = (int)$count_stmt->fetchColumn();
        $pages = $limit > 0 ? ceil($total / $limit) : 1;

        // Lấy data phân trang - mới nhất lên đầu
        $query = "SELECT * FROM categories ORDER BY created_at DESC, id DESC LIMIT :offset, :limit";
        $stmt = $db->prepare($query);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        $categories = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $categories[] = $row;
        }
        echo json_encode([
            'success' => true,
            'data' => $categories,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => $pages
            ]
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
            
            if (!isset($data['name']) || empty($data['name'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Category name is required'
                ]);
                break;
            }
            
            function vn_to_slug($str) {
                $str = mb_strtolower($str, 'UTF-8');
                $str = preg_replace([
                    '/[áàảãạăắằẳẵặâấầẩẫậ]/u','/[éèẻẽẹêếềểễệ]/u','/[íìỉĩị]/u',
                    '/[óòỏõọôốồổỗộơớờởỡợ]/u','/[úùủũụưứừửữự]/u','/[ýỳỷỹỵ]/u',
                    '/[đ]/u'
                ], [
                    'a','e','i','o','u','y','d'
                ], $str);
                $str = preg_replace('/[^a-z0-9\s-]/', '', $str);
                $str = preg_replace('/[\s-]+/', '-', $str);
                $str = trim($str, '-');
                return $str;
            }

            $slug = vn_to_slug($data['name']);
            
            $query = "INSERT INTO categories (name, slug, created_at) VALUES (:name, :slug, :created_at)";
            $stmt = $db->prepare($query);
            $stmt->bindValue(':name', $data['name']);
            $stmt->bindValue(':slug', $slug);
            $stmt->bindValue(':created_at', date('Y-m-d H:i:s'));
            
            if ($stmt->execute()) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Category created successfully',
                    'id' => $db->lastInsertId()
                ]);
            } else {
                throw new Exception('Failed to create category');
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
        // Lấy ID từ query string (?id=xxx)
        $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
        if (!$id) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => 'Missing category ID'
            ]);
            break;
        }
        try {
            // Nếu có bảng liên kết (story_categories), xóa liên kết trước
            $del_links = $db->prepare("DELETE FROM story_categories WHERE category_id = ?");
            $del_links->execute([$id]);

            // Xóa thể loại
            $del_cat = $db->prepare("DELETE FROM categories WHERE id = ?");
            $del_cat->execute([$id]);

            echo json_encode([
                'success' => true,
                'message' => 'Category deleted successfully'
            ]);
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
