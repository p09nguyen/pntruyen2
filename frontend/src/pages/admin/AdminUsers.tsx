import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersApi } from '../../services/api';
import Toast from '../../components/Toast';
import './AdminUsers.css';

interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
  last_login?: string;
  status: 'active' | 'inactive';
}

const AdminUsers: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [toast, setToast] = useState<{message: string, type: 'success'|'error'|'info', isVisible: boolean}>({message: '', type: 'success', isVisible: false});

  const showToast = (message: string, type: 'success'|'error'|'info' = 'success') => {
    setToast({ message, type, isVisible: true });
    setTimeout(() => setToast(t => ({...t, isVisible: false})), 2000);
  }

  useEffect(() => {
    loadUsers();
  }, [currentPage, searchTerm, roleFilter, statusFilter]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await usersApi.getAll({
        page: currentPage,
        limit: 10,
        search: searchTerm,
        role: roleFilter,
        status: statusFilter
      });
      const data = res.data?.data || {};
      setUsers(Array.isArray(data.users) ? data.users : []);
      setTotalPages(Math.max(1, Math.ceil((data.total || 0) / (data.limit || 10))));
    } catch (error) {
      setUsers([]);
      setTotalPages(1);
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowModal(true);
  };

  const handleDeleteUser = async (userId: number) => {
  if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
    try {
      const response = await usersApi.delete(userId);
      if (response.data && response.data.success) {
        showToast('Đã xóa người dùng!', 'success');
        loadUsers();
      } else {
        showToast('Xóa thất bại: ' + (response.data?.error || 'Lỗi không xác định'), 'error');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      showToast('Có lỗi xảy ra khi xóa!', 'error');
    }
  }
};

  const handleToggleStatus = async (userId: number, currentStatus: string) => {
  try {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const res = await usersApi.update(userId, { status: newStatus });
    if (res.data && res.data.success) {
      loadUsers();
      showToast(`Đã ${newStatus === 'active' ? 'kích hoạt' : 'vô hiệu hóa'} tài khoản!`, 'success');
    } else {
      showToast('Cập nhật trạng thái thất bại!', 'error');
    }
  } catch (error) {
    console.error('Error toggling user status:', error);
    showToast('Có lỗi xảy ra.', 'error');
  }
};

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const getRoleText = (role: string) => {
    return role === 'admin' ? 'Quản trị viên' : 'Người dùng';
  };

  const getStatusText = (status: string) => {
    return status === 'active' ? 'Hoạt động' : 'Vô hiệu hóa';
  };

  return (
    <div className="admin-users">
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast(t => ({...t, isVisible: false}))}
      />
      <div className="page-header">
        <h1 className="page-title">👥 Quản lý người dùng</h1>
        <div className="page-actions">
          <button 
            onClick={() => {
              setEditingUser(null);
              setShowModal(true);
            }}
            className="btn-admin btn-primary"
          >
            ➕ Thêm người dùng
          </button>
        </div>
      </div>

      <div className="admin-card">
        <div className="users-filters">
          <div className="search-box">
            <input
              type="text"
              placeholder="🔍 Tìm kiếm theo tên hoặc email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-group">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">Tất cả vai trò</option>
              <option value="admin">Quản trị viên</option>
              <option value="user">Người dùng</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Vô hiệu hóa</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading">Đang tải...</div>
        ) : (
          <>
            <div className="users-table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tên đăng nhập</th>
                    <th>Email</th>
                    <th>Vai trò</th>
                    <th>Trạng thái</th>
                    <th>Ngày tạo</th>
                    <th>Đăng nhập cuối</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>
                        <div className="user-info">
                          <strong>{user.username}</strong>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`role-badge ${user.role}`}>
                          {getRoleText(user.role)}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${user.status}`}>
                          {getStatusText(user.status)}
                        </span>
                      </td>
                      <td>{formatDate(user.created_at)}</td>
                      <td>{user.last_login ? formatDate(user.last_login) : 'Chưa đăng nhập'}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="btn-action btn-edit"
                            title="Chỉnh sửa"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleToggleStatus(user.id, user.status)}
                            className={`btn-action ${user.status === 'active' ? 'btn-disable' : 'btn-enable'}`}
                            title={user.status === 'active' ? 'Vô hiệu hóa' : 'Kích hoạt'}
                          >
                            {user.status === 'active' ? '🚫' : '✅'}
                          </button>
                          {user.role !== 'admin' && (
                            <button
                              onClick={async () => {
                                if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
                                  try {
                                    await usersApi.delete(user.id);
                                    alert('Đã xóa người dùng!');
                                    loadUsers();
                                  } catch (err) {
                                    alert('Có lỗi khi xóa người dùng!');
                                  }
                                }
                              }}
                              className="btn-action btn-delete"
                              title="Xóa"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  ← Trước
                </button>
                <span className="pagination-info">
                  Trang {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="pagination-btn"
                >
                  Sau →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {showModal && (
        <UserModal
          user={editingUser}
          onClose={() => {
            setShowModal(false);
            setEditingUser(null);
          }}
          onSave={() => {
            setShowModal(false);
            setEditingUser(null);
            loadUsers();
          }}
        />
      )}
    </div>
  );
};

interface UserModalProps {
  user: User | null;
  onClose: () => void;
  onSave: () => void;
}

const UserModal: React.FC<UserModalProps> = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    role: user?.role || 'user',
    status: user?.status || 'active',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
            if (user) {
        // Update user
        await usersApi.update(user.id, {
          username: formData.username,
          email: formData.email,
          role: formData.role,
          status: formData.status
        });
        alert('Cập nhật người dùng thành công!');
      } else {
        // Create user
        await usersApi.create({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          status: formData.status
        });
        alert('Thêm người dùng thành công!');
      }
      onSave();
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Có lỗi xảy ra.');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{user ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}</h2>
          <button onClick={onClose} className="modal-close">×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="user-form">
          <div className="form-group">
            <label>Tên đăng nhập *</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
              className="form-input"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Vai trò</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value as 'admin' | 'user'})}
                className="form-select"
              >
                <option value="user">Người dùng</option>
                <option value="admin">Quản trị viên</option>
              </select>
            </div>

            <div className="form-group">
              <label>Trạng thái</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value as 'active' | 'inactive'})}
                className="form-select"
              >
                <option value="active">Hoạt động</option>
                <option value="inactive">Vô hiệu hóa</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>{user ? 'Mật khẩu mới (để trống nếu không đổi)' : 'Mật khẩu *'}</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required={!user}
              className="form-input"
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-admin btn-secondary">
              Hủy
            </button>
            <button type="submit" className="btn-admin btn-primary">
              {user ? 'Cập nhật' : 'Thêm mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminUsers;
