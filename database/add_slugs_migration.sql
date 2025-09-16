-- Migration: Add slugs to stories and chapters
-- Thêm slug cho stories và chapters để có URL thân thiện

USE `novel_reader`;

-- Thêm cột slug cho bảng stories
ALTER TABLE `stories` ADD COLUMN `slug` varchar(255) NOT NULL AFTER `title`;
ALTER TABLE `stories` ADD UNIQUE KEY `slug` (`slug`);

-- Thêm cột slug cho bảng chapters  
ALTER TABLE `chapters` ADD COLUMN `slug` varchar(255) NOT NULL AFTER `title`;
ALTER TABLE `chapters` ADD UNIQUE KEY `story_chapter_slug` (`story_id`, `slug`);

-- Function để tạo slug từ tiếng Việt
DELIMITER $$
CREATE FUNCTION create_slug(input_text VARCHAR(255)) 
RETURNS VARCHAR(255)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE result VARCHAR(255);
    
    -- Chuyển về lowercase
    SET result = LOWER(input_text);
    
    -- Thay thế ký tự tiếng Việt
    SET result = REPLACE(result, 'à', 'a');
    SET result = REPLACE(result, 'á', 'a');
    SET result = REPLACE(result, 'ạ', 'a');
    SET result = REPLACE(result, 'ả', 'a');
    SET result = REPLACE(result, 'ã', 'a');
    SET result = REPLACE(result, 'â', 'a');
    SET result = REPLACE(result, 'ầ', 'a');
    SET result = REPLACE(result, 'ấ', 'a');
    SET result = REPLACE(result, 'ậ', 'a');
    SET result = REPLACE(result, 'ẩ', 'a');
    SET result = REPLACE(result, 'ẫ', 'a');
    SET result = REPLACE(result, 'ă', 'a');
    SET result = REPLACE(result, 'ằ', 'a');
    SET result = REPLACE(result, 'ắ', 'a');
    SET result = REPLACE(result, 'ặ', 'a');
    SET result = REPLACE(result, 'ẳ', 'a');
    SET result = REPLACE(result, 'ẵ', 'a');
    
    SET result = REPLACE(result, 'è', 'e');
    SET result = REPLACE(result, 'é', 'e');
    SET result = REPLACE(result, 'ẹ', 'e');
    SET result = REPLACE(result, 'ẻ', 'e');
    SET result = REPLACE(result, 'ẽ', 'e');
    SET result = REPLACE(result, 'ê', 'e');
    SET result = REPLACE(result, 'ề', 'e');
    SET result = REPLACE(result, 'ế', 'e');
    SET result = REPLACE(result, 'ệ', 'e');
    SET result = REPLACE(result, 'ể', 'e');
    SET result = REPLACE(result, 'ễ', 'e');
    
    SET result = REPLACE(result, 'ì', 'i');
    SET result = REPLACE(result, 'í', 'i');
    SET result = REPLACE(result, 'ị', 'i');
    SET result = REPLACE(result, 'ỉ', 'i');
    SET result = REPLACE(result, 'ĩ', 'i');
    
    SET result = REPLACE(result, 'ò', 'o');
    SET result = REPLACE(result, 'ó', 'o');
    SET result = REPLACE(result, 'ọ', 'o');
    SET result = REPLACE(result, 'ỏ', 'o');
    SET result = REPLACE(result, 'õ', 'o');
    SET result = REPLACE(result, 'ô', 'o');
    SET result = REPLACE(result, 'ồ', 'o');
    SET result = REPLACE(result, 'ố', 'o');
    SET result = REPLACE(result, 'ộ', 'o');
    SET result = REPLACE(result, 'ổ', 'o');
    SET result = REPLACE(result, 'ỗ', 'o');
    SET result = REPLACE(result, 'ơ', 'o');
    SET result = REPLACE(result, 'ờ', 'o');
    SET result = REPLACE(result, 'ớ', 'o');
    SET result = REPLACE(result, 'ợ', 'o');
    SET result = REPLACE(result, 'ở', 'o');
    SET result = REPLACE(result, 'ỡ', 'o');
    
    SET result = REPLACE(result, 'ù', 'u');
    SET result = REPLACE(result, 'ú', 'u');
    SET result = REPLACE(result, 'ụ', 'u');
    SET result = REPLACE(result, 'ủ', 'u');
    SET result = REPLACE(result, 'ũ', 'u');
    SET result = REPLACE(result, 'ư', 'u');
    SET result = REPLACE(result, 'ừ', 'u');
    SET result = REPLACE(result, 'ứ', 'u');
    SET result = REPLACE(result, 'ự', 'u');
    SET result = REPLACE(result, 'ử', 'u');
    SET result = REPLACE(result, 'ữ', 'u');
    
    SET result = REPLACE(result, 'ỳ', 'y');
    SET result = REPLACE(result, 'ý', 'y');
    SET result = REPLACE(result, 'ỵ', 'y');
    SET result = REPLACE(result, 'ỷ', 'y');
    SET result = REPLACE(result, 'ỹ', 'y');
    
    SET result = REPLACE(result, 'đ', 'd');
    
    -- Thay thế khoảng trắng và ký tự đặc biệt bằng dấu gạch ngang
    SET result = REGEXP_REPLACE(result, '[^a-z0-9]+', '-');
    
    -- Loại bỏ dấu gạch ngang ở đầu và cuối
    SET result = TRIM(BOTH '-' FROM result);
    
    RETURN result;
END$$
DELIMITER ;

-- Cập nhật slug cho stories hiện có
UPDATE `stories` SET `slug` = create_slug(title) WHERE `slug` = '' OR `slug` IS NULL;

-- Cập nhật slug cho chapters hiện có (dạng: chuong-1, chuong-2, ...)
UPDATE `chapters` SET `slug` = CONCAT('chuong-', chapter_number) WHERE `slug` = '' OR `slug` IS NULL;

-- Kiểm tra kết quả
SELECT id, title, slug FROM stories;
SELECT id, story_id, title, slug, chapter_number FROM chapters ORDER BY story_id, chapter_number;
