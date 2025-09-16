# 🚀 Hướng dẫn Setup Novel Reader

## Bước 1: Setup Database
1. **Khởi động XAMPP**
   - Mở XAMPP Control Panel
   - Start Apache và MySQL

2. **Tạo Database**
   - Mở phpMyAdmin: http://localhost/phpmyadmin
   - Tạo database mới tên `novel_reader`
   - Import file `database/novel_reader.sql`

## Bước 2: Test Backend API
1. **Mở trang demo**: 
   ```
   file:///d:/webtruyen/pntruyen2/demo.html
   ```
   
2. **Test các API**:
   - Categories: http://localhost/pntruyen2/api/categories
   - Stories: http://localhost/pntruyen2/api/stories
   - Chapters: http://localhost/pntruyen2/api/chapters?story_id=1

## Bước 3: Setup Frontend (React)
```bash
cd frontend
npm install
npm start
```

## Sample Data
- **Admin login**: admin / admin123
- **Categories**: Tiên Hiệp, Đô Thị, Huyền Huyễn, v.v.
- **Stories**: 3 truyện mẫu với chapters

## Troubleshooting
- **404 Error**: Kiểm tra Apache đã start chưa
- **Database Error**: Import lại file SQL
- **CORS Error**: Kiểm tra frontend chạy trên port 3000

## Next Steps
1. ✅ Database + Backend API
2. ⏳ React Frontend (đang tạo...)
3. 🔄 Integration Testing
4. 🎨 UI/UX Polish
