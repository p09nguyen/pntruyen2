<?php
class SlugHelper {
    
    /**
     * Tạo slug từ tiếng Việt
     */
    public static function createSlug($text) {
        // Chuyển về lowercase
        $text = mb_strtolower($text, 'UTF-8');
        
        // Mảng chuyển đổi ký tự tiếng Việt
        $vietnamese = array(
            'à', 'á', 'ạ', 'ả', 'ã', 'â', 'ầ', 'ấ', 'ậ', 'ẩ', 'ẫ', 'ă', 'ằ', 'ắ', 'ặ', 'ẳ', 'ẵ',
            'è', 'é', 'ẹ', 'ẻ', 'ẽ', 'ê', 'ề', 'ế', 'ệ', 'ể', 'ễ',
            'ì', 'í', 'ị', 'ỉ', 'ĩ',
            'ò', 'ó', 'ọ', 'ỏ', 'õ', 'ô', 'ồ', 'ố', 'ộ', 'ổ', 'ỗ', 'ơ', 'ờ', 'ớ', 'ợ', 'ở', 'ỡ',
            'ù', 'ú', 'ụ', 'ủ', 'ũ', 'ư', 'ừ', 'ứ', 'ự', 'ử', 'ữ',
            'ỳ', 'ý', 'ỵ', 'ỷ', 'ỹ',
            'đ'
        );
        
        $english = array(
            'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a',
            'e', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'e',
            'i', 'i', 'i', 'i', 'i',
            'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o',
            'u', 'u', 'u', 'u', 'u', 'u', 'u', 'u', 'u', 'u', 'u',
            'y', 'y', 'y', 'y', 'y',
            'd'
        );
        
        // Thay thế ký tự tiếng Việt
        $text = str_replace($vietnamese, $english, $text);
        
        // Loại bỏ ký tự đặc biệt, chỉ giữ lại chữ cái, số và khoảng trắng
        $text = preg_replace('/[^a-z0-9\s]/', '', $text);
        
        // Thay thế khoảng trắng bằng dấu gạch ngang
        $text = preg_replace('/\s+/', '-', $text);
        
        // Loại bỏ dấu gạch ngang ở đầu và cuối
        $text = trim($text, '-');
        
        return $text;
    }
    
    /**
     * Tạo slug unique cho story
     */
    public static function createUniqueStorySlug($db, $title, $excludeId = null) {
        $baseSlug = self::createSlug($title);
        $slug = $baseSlug;
        $counter = 1;
        
        while (self::slugExists($db, 'stories', $slug, $excludeId)) {
            $slug = $baseSlug . '-' . $counter;
            $counter++;
        }
        
        return $slug;
    }
    
    /**
     * Tạo slug unique cho chapter trong story
     */
    public static function createUniqueChapterSlug($db, $storyId, $chapterNumber, $excludeId = null) {
        $slug = 'chuong-' . $chapterNumber;
        
        // Kiểm tra xem slug đã tồn tại trong story này chưa
        $query = "SELECT id FROM chapters WHERE story_id = :story_id AND slug = :slug";
        if ($excludeId) {
            $query .= " AND id != :exclude_id";
        }
        
        $stmt = $db->prepare($query);
        $stmt->bindValue(':story_id', $storyId);
        $stmt->bindValue(':slug', $slug);
        if ($excludeId) {
            $stmt->bindValue(':exclude_id', $excludeId);
        }
        $stmt->execute();
        
        if ($stmt->fetch()) {
            // Nếu đã tồn tại, thêm suffix
            $counter = 1;
            do {
                $newSlug = $slug . '-' . $counter;
                $stmt = $db->prepare($query);
                $stmt->bindValue(':story_id', $storyId);
                $stmt->bindValue(':slug', $newSlug);
                if ($excludeId) {
                    $stmt->bindValue(':exclude_id', $excludeId);
                }
                $stmt->execute();
                $counter++;
            } while ($stmt->fetch());
            
            return $newSlug;
        }
        
        return $slug;
    }
    
    /**
     * Kiểm tra slug có tồn tại không
     */
    private static function slugExists($db, $table, $slug, $excludeId = null) {
        $query = "SELECT id FROM {$table} WHERE slug = :slug";
        if ($excludeId) {
            $query .= " AND id != :exclude_id";
        }
        
        $stmt = $db->prepare($query);
        $stmt->bindValue(':slug', $slug);
        if ($excludeId) {
            $stmt->bindValue(':exclude_id', $excludeId);
        }
        $stmt->execute();
        
        return $stmt->fetch() !== false;
    }
}
?>
