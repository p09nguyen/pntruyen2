import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AuthGoogleCallback: React.FC = () => {
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth() as any;

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      // Gửi code về backend để xác thực và lấy user info
      loginWithGoogle(code).then((success: boolean) => {
        if (success) {
          navigate('/');
        } else {
          alert('Đăng nhập Google thất bại!');
          navigate('/login');
        }
      });
    } else {
      alert('Không nhận được mã code từ Google!');
      navigate('/login');
    }
  }, [navigate, loginWithGoogle]);

  return <div>Đang xác thực với Google...</div>;
};

export default AuthGoogleCallback;
