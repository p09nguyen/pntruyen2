import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ConfirmModal from '../components/ConfirmModal';
import './AuthPages.css';

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
const [lockedModal, setLockedModal] = useState<{open: boolean, message: string, support?: string}>({open: false, message: '', support: ''});
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const success = await login(formData.username, formData.password);
      if (success) {
        navigate('/');
      } else {
        // Kiểm tra lỗi tài khoản bị khóa từ AuthContext nếu có
        if ((window as any).lastLoginError && (window as any).lastLoginError.code === 'ACCOUNT_DISABLED') {
          setLockedModal({
            open: true,
            message: (window as any).lastLoginError.error,
            support: (window as any).lastLoginError.support
          });
        } else {
          setError('Tên đăng nhập hoặc mật khẩu không đúng');
        }
      }
    } catch (error) {
      setError('Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>🔐 Đăng nhập</h2>
            <p>Đăng nhập để đánh dấu truyện yêu thích</p>
          </div>

          <div style={{ width: '100%', marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
            <GoogleLogin
              onSuccess={async credentialResponse => {
                if (credentialResponse.credential) {
                  const res = await fetch('/api/google-login.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ token: credentialResponse.credential }),
                  });
                  const data = await res.json();
                  if (data.success) {
                    // Có thể lưu user vào context hoặc localStorage nếu muốn
                    window.location.href = '/';
                  } else {
                    if (data.code === 'ACCOUNT_DISABLED') {
                      setLockedModal({
                        open: true,
                        message: data.error,
                        support: data.support
                      });
                    } else {
                      alert(data.error || 'Đăng nhập Google thất bại!');
                    }
                  }
                }
              }}
              onError={() => {
                alert('Đăng nhập Google thất bại!');
              }}
              width="100%"
            />
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="error-message">{error}</div>}
            
            <div className="form-group">
              <label htmlFor="username">Tên đăng nhập hoặc Email</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                placeholder="Nhập tên đăng nhập hoặc email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Mật khẩu</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Nhập mật khẩu"
              />
            </div>

            <button 
              type="submit" 
              className="auth-btn"
              disabled={loading}
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
            <div style={{marginTop: 12, textAlign: 'right'}}>
              <Link to="/forgot-password" className="forgot-link" style={{fontSize: 14, color: '#1976d2'}}>Quên mật khẩu?</Link>
            </div>
          </form>

          <div className="auth-footer">
            <p>
             
              <Link to="/register" className="auth-link"> <span style={{color: 'black'}}>Chưa có tài khoản?</span> <span style={{color: '#667eea'}}>đăng ký ngay</span></Link>
            </p>
          </div>

          
        </div>
      </div>
      {/* Modal tài khoản bị khóa */}
      <ConfirmModal
        isOpen={lockedModal.open}
        title="Tài khoản bị khóa"
        message={
          <>
            <div style={{fontWeight: 500, color: '#d32f2f', marginBottom: 8}}>
              {lockedModal.message}
            </div>
            {lockedModal.support && (
              <div style={{fontSize: 14, color: '#666'}}>{lockedModal.support}</div>
            )}
          </>
        }
        confirmText="Liên hệ hỗ trợ"
        cancelText="Đóng"
        type="danger"
        onConfirm={() => {
          window.open('mailto:admin@yourdomain.com', '_blank');
          setLockedModal({open: false, message: ''});
        }}
        onCancel={() => setLockedModal({open: false, message: ''})}
      />
    </div>
  );
};

export default LoginPage;
