import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { storiesApi, categoriesApi, Story, Category } from '../../services/api';
import ConfirmModal from '../../components/ConfirmModal';
import Toast from '../../components/Toast';
import { useToast } from '../../hooks/useToast';
import './AdminStories.css';

const AdminStories: React.FC = () => {
  const navigate = useNavigate();
  const { toast, showSuccess, showError, hideToast } = useToast();
  const [stories, setStories] = useState<Story[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    category_id: '',
    status: '',
    search: ''
  });
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    storyId: number | null;
    storyTitle: string;
  }>({ isOpen: false, storyId: null, storyTitle: '' });

  useEffect(() => {
    loadData();
  }, [currentPage, filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [storiesResponse, categoriesResponse] = await Promise.all([
        storiesApi.getAll({
          page: currentPage,
          limit: 10,
          category_id: filters.category_id ? parseInt(filters.category_id) : undefined,
          status: filters.status || undefined,
          search: filters.search || undefined
        }),
        categoriesApi.getAll()
      ]);

      if (storiesResponse.data.success) {
        setStories(storiesResponse.data.data);
        setTotalPages(storiesResponse.data.pagination.pages);
      }

      if (categoriesResponse.data.success) {
        setCategories(categoriesResponse.data.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleDelete = (id: number) => {
    const story = stories.find(s => s.id === id);
    setConfirmModal({
      isOpen: true,
      storyId: id,
      storyTitle: story?.title || 'truyện này'
    });
  };

  const confirmDelete = async () => {
    if (!confirmModal.storyId) return;
    
    try {
      const response = await storiesApi.delete(confirmModal.storyId);
      if (response.data.success) {
        showSuccess('Xóa truyện thành công!');
        loadData(); // Reload the list
      } else {
        showError('Lỗi: ' + response.data.error);
      }
    } catch (error) {
      console.error('Error deleting story:', error);
      showError('Có lỗi xảy ra khi xóa truyện!');
    } finally {
      setConfirmModal({ isOpen: false, storyId: null, storyTitle: '' });
    }
  };

  const cancelDelete = () => {
    setConfirmModal({ isOpen: false, storyId: null, storyTitle: '' });
  };

  const handleEdit = (storyId: number) => {
    navigate(`/admin/stories/edit/${storyId}`);
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ongoing': return 'Đang ra';
      case 'completed': return 'Hoàn thành';
      case 'paused': return 'Tạm dừng';
      default: return status;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'ongoing': return 'status-ongoing';
      case 'completed': return 'status-completed';
      case 'paused': return 'status-paused';
      default: return '';
    }
  };

  return (
    <div className="admin-stories">
      <div className="page-header">
        <h1 className="page-title">📚 Quản lý truyện</h1>
        <div className="page-actions">
          <button 
            onClick={() => navigate('/admin/stories/new')}
            className="btn-admin btn-primary"
          >
            ➕ Thêm truyện mới
          </button>
        </div>
      </div>

      <div className="admin-card">
        <div className="filters">
          <div className="filter-group">
            <input
              type="text"
              placeholder="Tìm kiếm truyện..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="filter-input"
            />
          </div>
          
          <div className="filter-group">
            <select
              value={filters.category_id}
              onChange={(e) => handleFilterChange('category_id', e.target.value)}
              className="filter-select"
            >
              <option value="">Tất cả thể loại</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="filter-select"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="ongoing">Đang ra</option>
              <option value="completed">Hoàn thành</option>
              <option value="paused">Tạm dừng</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Đang tải danh sách truyện...</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tên truyện</th>
                    <th>Tác giả</th>
                    <th>Thể loại</th>
                    <th>Trạng thái</th>
                    <th>Số chương</th>
                    <th>Lượt xem</th>
                    <th>Hiển thị trang chủ</th>
                    <th>Cập nhật</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {stories.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="no-data">
                        Không tìm thấy truyện nào.
                      </td>
                    </tr>
                  ) : (
                    stories.map(story => (
                      <tr key={story.id}>
                        <td>{story.id}</td>
                        <td>
                          <div className="story-title">
                            <Link to={story.slug ? `/truyen/${story.slug}` : `/story/${story.id}`} target="_blank">
                              {story.title}
                            </Link>
                          </div>
                        </td>
                        <td>{story.author}</td>
                        <td>{story.category_name}</td>
                        <td>
                          <span className={`status ${getStatusClass(story.status)}`}>
                            {getStatusText(story.status)}
                          </span>
                        </td>
                        <td>{story.chapter_count || 0}</td>
                        <td>{story.view_count?.toLocaleString()}</td>
                        <td style={{textAlign: 'center'}}>
                          {Number(story.show_on_home) === 1 ? '✅' : '❌'}
                        </td>
                        <td>
                          {new Date(story.updated_at).toLocaleDateString('vi-VN')}
                        </td>
                        <td>
                          <div className="action-buttons">
                            <Link
                              to={`/admin/stories/${story.id}/edit`}
                              className="btn-admin btn-warning btn-sm"
                            >
                              ✏️
                            </Link>
                            <Link
                              to={`/admin/chapters?story_id=${story.id}`}
                              className="btn-admin btn-primary btn-sm"
                            >
                              📑
                            </Link>
                            <button
                              onClick={() => handleDelete(story.id)}
                              className="btn-admin btn-danger btn-sm"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="btn-admin btn-primary"
                >
                  ← Trước
                </button>
                
                <span className="page-info">
                  Trang {currentPage} / {totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="btn-admin btn-primary"
                >
                  Sau →
                </button>
              </div>
            )}
          </>
        )}
      </div>
      
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Xác nhận xóa truyện"
        message={`Bạn có chắc muốn xóa truyện "${confirmModal.storyTitle}"? Tất cả chương của truyện cũng sẽ bị xóa và không thể khôi phục.`}
        confirmText="Xóa"
        cancelText="Hủy"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        type="danger"
      />
      
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  );
};

export default AdminStories;
