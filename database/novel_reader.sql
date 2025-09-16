-- Novel Reader Database Schema
-- Tạo database và tables cho trang web đọc truyện

-- Tạo database
CREATE DATABASE IF NOT EXISTS `novel_reader` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `novel_reader`;

-- Bảng categories (thể loại truyện)
CREATE TABLE `categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng users (người dùng)
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('user','admin') NOT NULL DEFAULT 'user',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng stories (truyện)
CREATE TABLE `stories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `author` varchar(100) NOT NULL,
  `cover_image` varchar(255) DEFAULT NULL,
  `description` text,
  `status` enum('ongoing','completed','paused') NOT NULL DEFAULT 'ongoing',
  `category_id` int(11) NOT NULL,
  `view_count` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`),
  KEY `status` (`status`),
  FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng chapters (chương truyện)
CREATE TABLE `chapters` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `story_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` longtext NOT NULL,
  `chapter_number` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `story_id` (`story_id`),
  KEY `chapter_number` (`chapter_number`),
  FOREIGN KEY (`story_id`) REFERENCES `stories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng bookmarks (đánh dấu)
CREATE TABLE `bookmarks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `story_id` int(11) NOT NULL,
  `chapter_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_story` (`user_id`, `story_id`),
  KEY `story_id` (`story_id`),
  KEY `chapter_id` (`chapter_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`story_id`) REFERENCES `stories` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`chapter_id`) REFERENCES `chapters` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data
-- Categories
INSERT INTO `categories` (`name`, `slug`) VALUES
('Tiên Hiệp', 'tien-hiep'),
('Đô Thị', 'do-thi'),
('Huyền Huyễn', 'huyen-huyen'),
('Kiếm Hiệp', 'kiem-hiep'),
('Ngôn Tình', 'ngon-tinh'),
('Trinh Thám', 'trinh-tham'),
('Khoa Huyễn', 'khoa-huyen'),
('Lịch Sử', 'lich-su');

-- Admin user (password: admin123)
INSERT INTO `users` (`username`, `email`, `password_hash`, `role`) VALUES
('admin', 'admin@novelreader.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Sample stories
INSERT INTO `stories` (`title`, `author`, `description`, `status`, `category_id`, `view_count`) VALUES
('Đấu Phá Thương Khung', 'Thiên Tằm Thổ Đậu', 'Thiếu niên tài năng bị tước đoạt sức mạnh, quyết tâm trở lại đỉnh cao võ đạo...', 'completed', 1, 15420),
('Toàn Chức Pháp Sư', 'Loạn', 'Thế giới ma pháp kỳ thú, nơi pháp sư là nghề nghiệp cao quý nhất...', 'ongoing', 3, 8750),
('Thần Võ Thiên Hạ', 'Tịnh Vô Nguyệt', 'Võ đạo thịnh hành, thiên tài võ học xuất hiện như vũ bão...', 'ongoing', 1, 12300);

-- Sample chapters for story 1
INSERT INTO `chapters` (`story_id`, `title`, `content`, `chapter_number`) VALUES
(1, 'Chương 1: Thiên tài sa cơ', 'Nội dung chương 1 của Đấu Phá Thương Khung...', 1),
(1, 'Chương 2: Gặp gỡ Dược Lão', 'Nội dung chương 2 của Đấu Phá Thương Khung...', 2),
(1, 'Chương 3: Bắt đầu tu luyện', 'Nội dung chương 3 của Đấu Phá Thương Khung...', 3);

-- Sample chapters for story 2  
INSERT INTO `chapters` (`story_id`, `title`, `content`, `chapter_number`) VALUES
(2, 'Chương 1: Thức tỉnh ma pháp', 'Nội dung chương 1 của Toàn Chức Pháp Sư...', 1),
(2, 'Chương 2: Học viện ma pháp', 'Nội dung chương 2 của Toàn Chức Pháp Sư...', 2);

-- Sample chapters for story 3
INSERT INTO `chapters` (`story_id`, `title`, `content`, `chapter_number`) VALUES  
(3, 'Chương 1: Võ đạo khởi đầu', 'Nội dung chương 1 của Thần Võ Thiên Hạ...', 1);
