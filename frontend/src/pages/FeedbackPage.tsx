import React, { useState } from 'react';
import axios from 'axios';
import styles from './FeedbackPage.module.css';
import { useAuth } from '../contexts/AuthContext';

const API_URL = '/api';

const FeedbackPage: React.FC = () => {
  const { user } = useAuth();
  const [type, setType] = useState<'feedback' | 'request'>('feedback');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);
    setError(null);
    try {
      const res = await axios.post(`${API_URL}/user_feedback.php`, {
        type,
        content,
        user_id: user?.id || null
      });
      if (res.data.success) {
        setSuccess('Gửi thành công! Cảm ơn bạn đã đóng góp.');
        setContent('');
      } else {
        setError(res.data.message || 'Có lỗi xảy ra!');
      }
    } catch (err) {
      setError('Không thể gửi. Vui lòng thử lại sau.');
    }
    setLoading(false);
  };

  return (
    <div className={styles.feedbackPageWrapper}>
      <h2 className={styles.feedbackTitle}>Đóng góp ý kiến & Yêu cầu dịch truyện</h2>
      <form onSubmit={handleSubmit}>
        <div className={styles.feedbackTypeGroup}>
          <label>
            <input type="radio" name="type" value="feedback" checked={type==='feedback'} onChange={()=>setType('feedback')} /> Đóng góp ý kiến
          </label>
          <label>
            <input type="radio" name="type" value="request" checked={type==='request'} onChange={()=>setType('request')} /> Yêu cầu dịch truyện
          </label>
        </div>
        <textarea
          className={styles.feedbackTextarea}
          value={content}
          onChange={e=>setContent(e.target.value)}
          placeholder={type==='feedback' ? 'Nhập ý kiến đóng góp cải thiện web...' : 'Nhập truyện bạn muốn yêu cầu dịch (hoặc tên phim, có thể là ở kênh khác)...'}
          rows={6}
          required
        />
        <button type="submit" disabled={loading || !content.trim()} className={styles.feedbackSubmitBtn}>
          {loading ? 'Đang gửi...' : 'Gửi'}
        </button>
      </form>
      {success && <div className={styles.feedbackSuccess}>{success}</div>}
      {error && <div className={styles.feedbackError}>{error}</div>}
    </div>
  );
};

export default FeedbackPage;
