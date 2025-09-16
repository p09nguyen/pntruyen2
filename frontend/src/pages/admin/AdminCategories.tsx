import React, { useState, useEffect } from 'react';
import { categoriesApi, Category } from '../../services/api';
import Toast from '../../components/Toast';
import './AdminCategories.css';

const AdminCategories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    names: '' // nhiều tên, mỗi dòng 1 tên
  });
  const [showDeleteModal, setShowDeleteModal] = useState<{open: boolean, id?: number}>({open: false});
  const [toast, setToast] = useState<{message: string, type: 'success'|'error'|'info', isVisible: boolean}>({message: '', type: 'success', isVisible: false});
  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;

  const showToast = (message: string, type: 'success'|'error'|'info' = 'success') => {
    setToast({ message, type, isVisible: true });
    setTimeout(() => setToast(t => ({...t, isVisible: false})), 2000);
  }

  useEffect(() => {
    loadCategories(currentPage);
    // eslint-disable-next-line
  }, [currentPage]);

  const loadCategories = async (page = 1) => {
    setLoading(true);
    try {
      const response = await categoriesApi.getAll(page, pageSize);
      if (response.data.success) {
        setCategories(response.data.data);
        setCurrentPage(response.data.pagination.page);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (editingCategory) {
    // TODO: Implement update API
    console.log('Update category:', editingCategory.id, formData);
    return;
  }
  // Thêm nhiều thể loại cùng lúc
  const names = formData.names.split('\n').map(n => n.trim()).filter(n => n);
  if (names.length === 0) return;
  let success = 0, fail = 0;
  for (const name of names) {
    try {
      const response = await categoriesApi.create({ name });
      if (response.data.success) success++;
      else fail++;
    } catch {
      fail++;
    }
  }
  loadCategories(1);
  setShowModal(false);
  setFormData({ names: '' });
  if (success > 0) showToast(`Đã thêm ${success} thể loại!`, 'success');
  if (fail > 0) showToast(`${fail} thể loại bị lỗi!`, 'error');
};

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({ names: category.name });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
  try {
    const response = await categoriesApi.delete(id);
    if (response.data.success) {
      // Nếu xóa hết trang hiện tại thì lùi về trang trước nếu có
      if (categories.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        loadCategories(currentPage);
      }
      showToast('Đã xóa thể loại!', 'success');
    } else {
      showToast('Xóa thất bại: ' + (response.data.error || 'Lỗi không xác định'), 'error');
    }
  } catch (error) {
    console.error('Error deleting category:', error);
    showToast('Có lỗi xảy ra khi xóa!', 'error');
  }
  setShowDeleteModal({open: false});
};

  const openAddModal = () => {
    setEditingCategory(null);
    setFormData({ names: '' });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({ names: '' });
  };

  return (
    <div className="admin-categories">
      <div className="page-header">
        <h1 className="page-title">🏷️ Quản lý thể loại</h1>
        <div className="page-actions">
          <button onClick={openAddModal} className="btn-admin btn-primary">
            ➕ Thêm thể loại
          </button>
        </div>
      </div>

      <div className="admin-card">
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Đang tải danh sách thể loại...</p>
          </div>
        ) : (
          <>
          <div className="categories-grid">
            {categories.length === 0 ? (
              <div className="no-data">
                <p>Chưa có thể loại nào.</p>
              </div>
            ) : (
              categories.map(category => (
                <div key={category.id} className="category-card">
                  <div className="category-info">
                    <h3>{category.name}</h3>
                    <p className="category-slug">/{category.slug}</p>
                    <p className="category-date">
                      Tạo: {new Date(category.created_at).toLocaleString('vi-VN', {hour:'2-digit',minute:'2-digit',hour12:false,day:'2-digit',month:'2-digit',year:'numeric'})}
                    </p>
                  </div>
                  <div className="category-actions">
                    <button
                      onClick={() => handleEdit(category)}
                      className="btn-admin btn-warning btn-sm"
                    >
                      ✏️ Sửa
                    </button>
                    <button
                      onClick={() => setShowDeleteModal({open: true, id: category.id})}
                      className="btn-admin btn-danger btn-sm"
                    >
                      🗑️ Xóa
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          {/* Pagination controls */}
          <div className="pagination-controls" style={{marginTop: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16}}>
            <button
              className="btn-admin btn-secondary"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              ← Trang trước
            </button>
            <span style={{minWidth: 80}}>
              Trang {currentPage} / {totalPages}
            </span>
            <button
              className="btn-admin btn-secondary"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Trang sau →
            </button>
          </div>
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {editingCategory ? '✏️ Chỉnh sửa thể loại' : '➕ Thêm thể loại mới'}
              </h2>
              <button onClick={closeModal} className="modal-close">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
  <div className="form-group">
    <label htmlFor="names">Tên thể loại (có thể nhập nhiều, mỗi dòng 1 tên)</label>
    <textarea
      id="names"
      value={formData.names}
      onChange={(e) => setFormData({ ...formData, names: e.target.value })}
      required
      placeholder="Ví dụ:\nKiếm hiệp\nNgôn tình\nTrinh thám"
      className="form-input"
      rows={5}
    />
  </div>

              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="btn-admin btn-secondary">
                  Hủy
                </button>
                <button type="submit" className="btn-admin btn-primary">
                  {editingCategory ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    {/* Xác nhận xóa */}
    {showDeleteModal.open && (
      <div className="modal-overlay" onClick={() => setShowDeleteModal({open: false})}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Xác nhận xóa</h2>
            <button onClick={() => setShowDeleteModal({open: false})} className="modal-close">✕</button>
          </div>
          <div style={{padding: '16px 0', textAlign: 'center'}}>
            <p>Bạn có chắc chắn muốn xóa thể loại này không?</p>
          </div>
          <div className="modal-actions">
            <button className="btn-admin btn-secondary" onClick={() => setShowDeleteModal({open: false})}>Hủy</button>
            <button className="btn-admin btn-danger" onClick={() => handleDelete(showDeleteModal.id!)}>Xóa</button>
          </div>
        </div>
      </div>
    )}

    {/* Toast notification */}
    <Toast
      message={toast.message}
      type={toast.type}
      isVisible={toast.isVisible}
      onClose={() => setToast(t => ({...t, isVisible: false}))}
    />
  </div>
  );
};

export default AdminCategories;
