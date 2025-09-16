# Novel Reader - Trang Web Đọc Truyện Tiểu Thuyết

## Tech Stack
- **Frontend**: React.js + TypeScript
- **Backend**: PHP + MySQL
- **Database**: MySQL (phpMyAdmin)

## Cấu trúc dự án
```
pntruyen2/
├── frontend/          # React app
├── backend/           # PHP API
├── database/          # SQL files
└── README.md
```

## Cài đặt và chạy

### Backend (PHP)
1. Copy folder `backend/` vào `D:\xampp\htdocs\pntruyen2\`
2. Mở phpMyAdmin: http://localhost/phpmyadmin
3. Import file `database/novel_reader.sql`
4. Test API: http://localhost/pntruyen2/api/categories

### Frontend (React)
```bash
cd frontend
npm install
npm start
```

## Database Schema
- **stories**: id, title, author, cover_image, description, status, category_id, created_at
- **chapters**: id, story_id, title, content, chapter_number, created_at  
- **users**: id, username, email, password_hash, role, created_at
- **categories**: id, name
- **bookmarks**: id, user_id, story_id, chapter_id

## Features
- Trang chủ với danh sách truyện mới
- Lọc theo thể loại, tình trạng
- Chi tiết truyện và đọc chương
- Hệ thống tài khoản và bookmark
- Admin panel quản lý truyện
