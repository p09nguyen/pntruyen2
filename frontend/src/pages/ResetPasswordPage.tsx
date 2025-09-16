import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ConfirmModal from '../components/ConfirmModal';
import './AuthPages.css';

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<{open: boolean, message: string, success?: boolean}>({open: false, message: ''});
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setModal({open:true, message:'Token không hợp lệ!', success:false});
      return;
    }
    if (password.length < 6) {
      setModal({open:true, message:'Mật khẩu phải có ít nhất 6 ký tự.', success:false});
      return;
    }
    if (password !== confirm) {
      setModal({open:true, message:'Mật khẩu xác nhận không khớp.', success:false});
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/reset-password.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token, password })
      });
      const data = await res.json();
      setModal({open:true, message:data.message || 'Đặt lại mật khẩu thành công!', success:data.success});
    } catch (error) {
      setModal({open:true, message:'Có lỗi xảy ra, vui lòng thử lại.', success:false});
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>🔒 Đặt lại mật khẩu</h2>
            <p>Nhập mật khẩu mới cho tài khoản của bạn.</p>
          </div>
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="password">Mật khẩu mới</label>
              <input
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Nhập mật khẩu mới"
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirm">Xác nhận mật khẩu</label>
              <input
                type="password"
                id="confirm"
                name="confirm"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                minLength={6}
                placeholder="Nhập lại mật khẩu mới"
              />
            </div>
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
            </button>
          </form>
        </div>
      </div>
      <ConfirmModal
        isOpen={modal.open}
        title={modal.success ? 'Thành công' : 'Thông báo'}
        message={<div style={{color:modal.success ? 'green' : '#d32f2f', fontWeight:500}}>{modal.message}</div>}
        confirmText={modal.success ? 'Đăng nhập' : 'OK'}
        cancelText="Đóng"
        type={modal.success ? 'info' : 'danger'}
        onConfirm={() => {
          setModal({open:false, message:''});
          if (modal.success) navigate('/login');
        }}
        onCancel={() => setModal({open:false, message:''})}
      />
    </div>
  );
};

export default ResetPasswordPage;
