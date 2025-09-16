import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { categoriesApi, Category } from '../services/api';
import './Header.css';
import { notificationsApi, NotificationGroup } from '../services/api';
import NotificationDropdown from './NotificationDropdown';
import bellIcon from '../assets/notification-bell.svg';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationGroup[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const notifBtnRef = useRef<HTMLButtonElement>(null);

  // Fetch notifications
  useEffect(() => {
    if (!user) return setNotifications([]);
    fetchNotifications();
    // Optionally, poll every 60s
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchNotifications = async () => {
    setNotifLoading(true);
    try {
      const res = await notificationsApi.getAll();
      setNotifications(res.data.data || []);
    } catch (err) {
      setNotifications([]);
    } finally {
      setNotifLoading(false);
    }
  };

  const handleNotifBellClick = () => {
    setNotifOpen((open) => !open);
  };
  const handleNotifClose = () => setNotifOpen(false);

  const handleMarkRead = async (id: number) => {
    await notificationsApi.markRead(id);
    fetchNotifications();
  };
  const handleMarkAllRead = async () => {
    await notificationsApi.markAllRead();
    fetchNotifications();
  };
  const handleDeleteNotif = async (id: number) => {
    await notificationsApi.delete(id);
    fetchNotifications();
  };

  // Tổng số chương chưa đọc (từ tất cả group)
  const unreadCount = notifications.reduce((sum, group) => sum + (group.unread_count || 0), 0);

  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await categoriesApi.getAll();
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const [isCategoryClicked, setIsCategoryClicked] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownContentRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && 
          !dropdownRef.current.contains(event.target as Node) &&
          dropdownContentRef.current && 
          !dropdownContentRef.current.contains(event.target as Node)) {
        setIsCategoryOpen(false);
        setIsCategoryClicked(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCategoryHover = (isHovering: boolean) => {
    if (window.innerWidth > 768) {
      if (!isCategoryClicked) {
        setIsCategoryOpen(isHovering);
      }
    }
  };

  const toggleCategory = (e: React.MouseEvent) => {
    const isMobile = window.innerWidth <= 768;
    e.preventDefault();
    e.stopPropagation();
    
    if (isMobile) {
      const willOpen = !isCategoryOpen;
      setIsCategoryOpen(willOpen);
      
      // Mobile behavior
      const dropdown = e.currentTarget.closest('.dropdown');
      if (dropdown) {
        const content = dropdown.querySelector('.dropdown-content');
        if (content) {
          content.getBoundingClientRect();
          
          if (!willOpen) {
            setTimeout(() => {
              if (!content.classList.contains('open')) {
                (content as HTMLElement).style.maxHeight = '0';
              }
            }, 300);
          }
        }
      }
    } else {
      // Desktop behavior - toggle clicked state and keep open if clicked
      const newClickedState = !isCategoryClicked;
      setIsCategoryClicked(newClickedState);
      setIsCategoryOpen(newClickedState);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-top">
          <div className="header-left">
            
            <Link to="/" className="logo">
              <div style={{display: 'flex', alignItems: 'center'}}>
                <img style={{width: '60px', height: '50px', marginRight: '10px'}} src="https://ik.imagekit.io/egmjm2yv6/logopn%20(2).png?updatedAt=1754027343904" alt="" />
                <h1>PNTruyen</h1>
              </div>
            </Link>
          </div>
          
          <form className="search-form" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Tìm kiếm truyện..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-btn"><img style={{width: '20px', height: '20px'}} src="https://ik.imagekit.io/egmjm2yv6/search-interface-symbol.png?updatedAt=1754027343284" alt="" /></button>
          </form>
          {/* Notification bell */}
          {user && (
             <div style={{ position: 'relative'}}>
               <button
                 ref={notifBtnRef}
                 className="notification-bell"
                 onClick={handleNotifBellClick}
               >
                 <img style={{width: '20px', height: '20px'}} src='https://ik.imagekit.io/egmjm2yv6/icons8-notification.svg?updatedAt=1754032208699' alt="Thông báo" />
                 {unreadCount > 0 && <span className="notification-badge notification-badge-red">{unreadCount}</span>}
               </button>
               <NotificationDropdown
                 open={notifOpen}
                 onClose={handleNotifClose}
                 notifications={notifications}
                 onMarkRead={handleMarkRead}
                 onMarkAllRead={handleMarkAllRead}
                 onDelete={handleDeleteNotif}
               />
             </div>
           )}
          <button className="mobile-menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              ☰
            </button>
           
           <div className="user-menu">
             {user ? (
               <div className="user-info">
                <button onClick={() => { setIsMenuOpen(false); window.location.href = '/profile'; }}><img style={{width: '30px', height: '30px'}} src="/logoname.png" alt="" /><span>{user.full_name}</span></button>
                {user.role === 'admin' && (
                  <Link to="/admin" className="admin-link">
                    🛠️ Admin
                  </Link>
                )}
                <button onClick={handleLogout} className="logout-btn">
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div className="auth-links">
                <Link to="/login" className="auth-link">Đăng nhập</Link>
                <Link to="/register" className="auth-link">Đăng ký</Link>
              </div>
            )}
          </div>
        </div>

        <div className={`mobile-menu-overlay ${isMenuOpen ? 'active' : ''}`}></div>
        <nav className={`nav-menu ${isMenuOpen ? 'active' : ''}`} ref={menuRef}>
          <div className="mobile-menu-header">
            <button className="close-menu-btn" onClick={() => setIsMenuOpen(false)}>✕</button>
          </div>
          <Link to="/" className="nav-link" onClick={() => setIsMenuOpen(false)}>Trang chủ</Link>
          <div 
            ref={dropdownRef}
            className="dropdown" 
            onMouseEnter={() => handleCategoryHover(true)}
            onMouseLeave={() => handleCategoryHover(false)}
          >
            <span 
              style={{padding: "0px"}} 
              className="nav-link dropdown-toggle" 
              onClick={toggleCategory}
            >
              Thể loại
              <span className="dropdown-arrow">{isCategoryOpen ? '▲' : '▼'}</span>
            </span>
            <div 
              ref={dropdownContentRef}
              className={`dropdown-content ${isCategoryOpen ? 'open' : ''}`}
              onMouseEnter={() => window.innerWidth > 768 && setIsCategoryOpen(true)}
              onMouseLeave={() => window.innerWidth > 768 && !isCategoryClicked && setIsCategoryOpen(false)}
            >
              <div className="category-grid">
                {categories.map(category => (
                  <span
  key={category.id}
  className="dropdown-link"
  style={{ cursor: 'pointer' }}
  onClick={() => {
    setIsMenuOpen(false);
    setIsCategoryOpen(false);
    navigate(`/?category=${category.id}`);
  }}
>
  {category.name}
</span>
                ))}
              </div>
            </div>
          </div>
          <Link to="/completed" className="nav-link" onClick={() => setIsMenuOpen(false)}>Truyện hoàn thành</Link>
          <Link to="/updating" className="nav-link" onClick={() => setIsMenuOpen(false)}>Đang cập nhật</Link>
          <Link to="/feedback" className="nav-link" onClick={() => setIsMenuOpen(false)}>Cải thiện web, yêu cầu dịch truyện</Link>
          <a 
            href="https://youtube.com/@pnsub?si=QDMSt7G99T8hdjct" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="nav-link"
            onClick={() => setIsMenuOpen(false)}
          >
            Xem phim tại đây
          </a>
          
          {user ? (
            <div className="mobile-user-menu">
              <div className="user-info">
                <button onClick={() => { setIsMenuOpen(false); window.location.href = '/profile'; }}>
                  <span style={{color: 'white'}}><img style={{width: '30px', height: '30px'}} src="/logoname.png" alt="" />{user.full_name}</span>
                </button>
                {user.role === 'admin' && (
                  <Link to="/admin" className="admin-link" onClick={() => setIsMenuOpen(false)}>
                    🛠️ Admin
                  </Link>
                )}
                <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="logout-btn">
                  Đăng xuất
                </button>
              </div>
            </div>
          ) : (
            <div className="mobile-auth-links">
              <Link 
                to="/login" 
                className="mobile-auth-link login-link" 
                onClick={() => setIsMenuOpen(false)}
              >
                Đăng nhập
              </Link>
              <Link 
                to="/register" 
                className="mobile-auth-link register-link hp:hover"
                onClick={() => setIsMenuOpen(false)}
              >
                Đăng ký
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
