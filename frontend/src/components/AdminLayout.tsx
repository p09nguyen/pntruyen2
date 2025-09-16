import React, { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from 'contexts/AuthContext';
// Using simple text instead of icons to avoid dependency issues
import './AdminLayout.css';

interface AdminLayoutProps {
  children?: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Đóng menu khi chuyển trang
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="admin-access-denied">
        <h2>🚫 Truy cập bị từ chối</h2>
        <p>Bạn cần quyền admin để truy cập trang này.</p>
        <Link to="/" className="back-home">← Về trang chủ</Link>
      </div>
    );
  }

  const menuItems = [
    { path: '/admin', label: '📊 Dashboard', exact: true },
    { path: '/admin/stats', label: '📈 Thống kê' },
    { path: '/admin/stories', label: '📚 Quản lý truyện' },
    { path: '/admin/chapters', label: '📑 Quản lý chương' },
    { path: '/admin/feedback', label: '💌 Đóng góp & yêu cầu dịch' },
    { path: '/admin/chapter-reports', label: '🚩 Báo lỗi chương' },
    { path: '/admin/categories', label: '🏷️ Thể loại' },
    { path: '/admin/users', label: '👥 Người dùng' },
    { path: '/admin/featured-stories', label: '🔳 Banner' },
    { path: '/admin/comments', label: '📋 Bình Luận' },
  ];

  return (
    <div className="admin-layout">
      <div className="admin-sidebar">
        <div className="admin-header">
          <h2>🛠️ Admin Panel</h2>
          <button className="menu-toggle" onClick={toggleMenu}>
            {isMenuOpen ? '✕' : '☰'}
          </button>
        </div>
        <div className="admin-user">
          <span>Xin chào, {user.username}</span>
          <button onClick={logout} className="logout-btn">Đăng xuất</button>
        </div>
        <nav className={`admin-nav ${isMenuOpen ? 'show' : ''}`}>
          {menuItems.map(item => {
            // Lấy subpath sau /admin/, chỉ lấy phần đầu tiên (ví dụ: feedback, chapters, chapter-reports)
            const itemSubPath = item.path.replace('/admin/', '').split('/')[0];
            const currentSubPath = location.pathname.replace('/admin/', '').split('/')[0];
            const isActive = item.exact
              ? location.pathname === item.path
              : itemSubPath === currentSubPath;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item${isActive ? ' active' : ''}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="admin-footer">
          <Link to="/" className="back-to-site">
            🏠 Về trang chủ
          </Link>
        </div>
      </div>

      <div className="admin-content">
        {children ? children : <Outlet />}
      </div>
    </div>
  );
};

export default AdminLayout;
