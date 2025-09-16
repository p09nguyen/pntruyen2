import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import styles from './AdminFeedback.module.css';
import axios from 'axios';

interface FeedbackItem {
  id: number;
  user_id: number | null;
  type: string;
  content: string;
  status: string;
  created_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
}

const typeLabels: Record<string, string> = {
  feedback: 'Đóng góp cải thiện',
  request: 'Yêu cầu dịch truyện/phim',
};

const statusLabels: Record<string, string> = {
  pending: 'Chờ duyệt',
  reviewed: 'Đã xử lý',
  rejected: 'Từ chối',
};

const AdminFeedback: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/user_feedback.php');
      setFeedbacks(res.data.data || []);
    } catch (e: any) {
      setError(e.message || 'Lỗi tải dữ liệu');
    }
    setLoading(false);
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await axios.patch(`/api/user_feedback.php`, { id, status: newStatus });
      fetchFeedbacks();
    } catch (e: any) {
      alert('Lỗi cập nhật trạng thái');
    }
  };

  const filtered = feedbacks.filter(f => {
    return (filterType === 'all' || f.type === filterType) && (filterStatus === 'all' || f.status === filterStatus);
  });

  return (
    <div className={styles.container}>
        <h2>Quản lý góp ý &amp; yêu cầu dịch truyện/phim</h2>
        <div className={styles.filters}>
          <select value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="all">Tất cả loại</option>
            <option value="feedback">Đóng góp cải thiện</option>
            <option value="request">Yêu cầu dịch</option>
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ duyệt</option>
            <option value="reviewed">Đã xử lý</option>
            <option value="rejected">Từ chối</option>
          </select>
        </div>
        {loading ? (
          <div>Đang tải...</div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Loại</th>
                <th>Nội dung</th>
                <th>Người gửi</th>
                <th>Thời gian</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(f => (
                <tr key={f.id}>
                  <td>{f.id}</td>
                  <td>{typeLabels[f.type] || f.type}</td>
                  <td className={styles.content}>{f.content}</td>
                  <td>{f.user_id || 'Khách'}</td>
                  <td>{new Date(f.created_at).toLocaleString()}</td>
                  <td>{statusLabels[f.status] || f.status}</td>
                  <td>
                    {f.status === 'pending' && (
                      <>
                        <button className={styles.btn} onClick={() => handleStatusChange(f.id, 'reviewed')}>Duyệt</button>
                        <button className={styles.btnReject} onClick={() => handleStatusChange(f.id, 'rejected')}>Từ chối</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
  );
  
};

export default AdminFeedback;
