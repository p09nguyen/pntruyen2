import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from '../components/ConfirmModal';
import './AuthPages.css';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<{open: boolean, message: string}>({open: false, message: ''});
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/forgot-password.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      setModal({open: true, message: data.message || 'Nếu email tồn tại, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.'});
    } catch (error) {
      setModal({open: true, message: 'Có lỗi xảy ra, vui lòng thử lại.'});
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>🔑 Quên mật khẩu</h2>
            <p>Nhập email đã đăng ký để nhận hướng dẫn đặt lại mật khẩu.</p>
          </div>
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="Nhập email đăng ký"
              />
            </div>
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Đang gửi...' : 'Gửi hướng dẫn'}
            </button>
          </form>
        </div>
      </div>
      <ConfirmModal
        isOpen={modal.open}
        title="Quên mật khẩu"
        message={<div style={{color:'#222',fontWeight:500}}>{modal.message}</div>}
        confirmText="OK"
        cancelText="Đóng"
        type="info"
        onConfirm={() => {
          setModal({open:false, message:''});
          navigate('/login');
        }}
        onCancel={() => setModal({open:false, message:''})}
      />
    </div>
  );
};

export default ForgotPasswordPage;
