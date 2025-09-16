import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { storiesApi, categoriesApi } from '../../services/api';
import './AdminDashboard.css';

interface DashboardStats {
  totalStories: number;
  totalCategories: number;
  totalChapters: number;
  totalUsers: number;
  totalViews: number;
  recentStories: any[];
  topViewed: { id: number; title: string; slug?: string; views: number }[];
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalStories: 0,
    totalCategories: 0,
    totalChapters: 0,
    totalUsers: 0,
    totalViews: 0,
    recentStories: [],
    topViewed: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [storiesResponse, categoriesResponse, globalRes, viewsGlobalRes, viewsByStoryRes] = await Promise.all([
        storiesApi.getAll({ limit: 5 }),
        categoriesApi.getAll(),
        fetch('/api/stats.php?action=global').then(r => r.json()).catch(() => ({ success: false })),
        fetch('/api/stats.php?action=views_global').then(r => r.json()).catch(() => ({ success: false })),
        fetch('/api/stats.php?action=views_by_story&limit=5').then(r => r.json()).catch(() => ({ success: false, data: [] })),
      ]);

      const totalStories = storiesResponse?.data?.pagination?.total || 0;
      const totalCategories = categoriesResponse?.data?.data?.length || 0;
      const totals = globalRes && globalRes.success ? globalRes.data : { totalChapters: 0, totalUsers: 0 };
      const totalViews = viewsGlobalRes && viewsGlobalRes.success ? (viewsGlobalRes.data?.totalViews || 0) : 0;
      const topViewed = viewsByStoryRes && viewsByStoryRes.success ? (viewsByStoryRes.data || []) : [];

      setStats({
        totalStories,
        totalCategories,
        totalChapters: totals.totalChapters || 0,
        totalUsers: totals.totalUsers || 0,
        totalViews,
        recentStories: storiesResponse?.data?.data || [],
        topViewed,
      });
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Đang tải dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="page-header">
        <h1 className="page-title">📊 Dashboard</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <h3>{stats.totalStories}</h3>
            <p>Tổng số truyện</p>
          </div>
          <Link to="/admin/stories" className="stat-link">Xem chi tiết →</Link>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🏷️</div>
          <div className="stat-content">
            <h3>{stats.totalCategories}</h3>
            <p>Thể loại</p>
          </div>
          <Link to="/admin/categories" className="stat-link">Quản lý →</Link>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📑</div>
          <div className="stat-content">
            <h3>{stats.totalChapters}</h3>
            <p>Tổng chương</p>
          </div>
          <Link to="/admin/chapters" className="stat-link">Xem chi tiết →</Link>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{stats.totalUsers}</h3>
            <p>Người dùng</p>
          </div>
          <Link to="/admin/users" className="stat-link">Quản lý →</Link>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👁️</div>
          <div className="stat-content">
            <h3>{stats.totalViews}</h3>
            <p>Tổng lượt xem</p>
          </div>
          <Link to="/admin/stories" className="stat-link">Top view →</Link>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>-</h3>
            <p>Bình luận</p>
          </div>
          <Link to="/admin/comments" className="stat-link">Quản lý →</Link>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="recent-stories">
          <div className="admin-card">
            <h2>📚 Truyện mới cập nhật</h2>
            {stats.recentStories.length === 0 ? (
              <p className="no-data">Chưa có truyện nào.</p>
            ) : (
              <div className="stories-list">
                {stats.recentStories.map(story => (
                  <div key={story.id} className="story-item">
                    <div className="story-info">
                      <h4>{story.title}</h4>
                      <p>Tác giả: {story.author}</p>
                      <span className={`status status-${story.status}`}>
                        {story.status === 'ongoing' ? 'Đang ra' : 
                         story.status === 'completed' ? 'Hoàn thành' : 'Tạm dừng'}
                      </span>
                    </div>
                    <div className="story-actions">
                      <Link to={`/admin/stories/${story.id}`} className="btn-admin btn-primary btn-sm">
                        Chỉnh sửa
                      </Link>
                      <Link to={story.slug ? `/truyen/${story.slug}` : `/story/${story.id}`} className="btn-admin btn-success btn-sm">
                        Xem
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="card-footer">
              <Link to="/admin/stories" className="view-all">Xem tất cả truyện →</Link>
            </div>
          </div>
        </div>

        
        <div className="recent-stories">
          <div className="admin-card">
            <h2>🔥 Top truyện theo lượt xem</h2>
            {(!stats.topViewed || stats.topViewed.length === 0) ? (
              <p className="no-data">Chưa có dữ liệu.</p>
            ) : (
              <div className="stories-list">
                {stats.topViewed.map(item => (
                  <div key={item.id} className="story-item">
                    <div className="story-info">
                      <h4>{item.title}</h4>
                      <p>Lượt xem: {item.views}</p>
                    </div>
                    <div className="story-actions">
                      <Link to={item.slug ? `/truyen/${item.slug}` : `/story/${item.id}`} className="btn-admin btn-success btn-sm">
                        Xem
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="card-footer">
              <Link to="/admin/stats" className="view-all">Xem thống kê chi tiết →</Link>
            </div>
          </div>
        </div>

        <div className="quick-actions">
          <div className="admin-card">
            <h2>⚡ Thao tác nhanh</h2>
            <div className="actions-grid">
              <Link to="/admin/stories/new" className="action-item">
                <div className="action-icon">➕</div>
                <div className="action-content">
                  <h4>Thêm truyện mới</h4>
                  <p>Tạo truyện mới</p>
                </div>
              </Link>

              <Link to="/admin/categories" className="action-item">
                <div className="action-icon">🏷️</div>
                <div className="action-content">
                  <h4>Quản lý thể loại</h4>
                  <p>Thêm/sửa thể loại</p>
                </div>
              </Link>

              <Link to="/admin/chapters" className="action-item">
                <div className="action-icon">📝</div>
                <div className="action-content">
                  <h4>Thêm chương mới</h4>
                  <p>Cập nhật nội dung</p>
                </div>
              </Link>

              <Link to="/admin/users" className="action-item">
                <div className="action-icon">👤</div>
                <div className="action-content">
                  <h4>Quản lý user</h4>
                  <p>Xem danh sách</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
