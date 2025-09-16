import React, { useEffect, useState } from 'react';
import { commentsApi, Comment } from '../../services/api';
import styles from './AdminComments.module.css';

const AdminComments: React.FC = () => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalComments, setTotalComments] = useState(0);
  const PAGE_SIZE = 20;

  const fetchComments = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await commentsApi.getAll({ page, limit: PAGE_SIZE });
      setComments(res.data.comments || []);
      setCurrentPage(res.data.pagination.page);
      setTotalPages(res.data.pagination.pages);
      setTotalComments(res.data.pagination.total);
    } catch (e) {
      setError('Không tải được bình luận');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments(1);
  }, []);

  const handleDelete = (id: number) => {
    if (window.confirm('Xóa bình luận này?')) {
      commentsApi.delete(id).then(() => fetchComments(currentPage));
    }
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      fetchComments(page);
    }
  };

  const filtered = comments.filter(c =>
    c.content.toLowerCase().includes(search.toLowerCase()) ||
    (c.full_name || c.username).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.adminComments}>
      <h2>Quản lý bình luận</h2>
      <input
        className={styles.searchBox}
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Tìm theo tên hoặc nội dung..."
      />
      {loading ? (
        <div>Đang tải...</div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : (
        <>
          <table className={styles.commentTable}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Người bình luận</th>
              <th>Nội dung</th>
              <th>Chương</th>
              <th>Thời gian</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => {
              // Link đọc chương: ưu tiên slug, fallback id
              let chapterUrl = c.story_slug && c.chapter_slug
                ? `/truyen/${c.story_slug}/${c.chapter_slug}`
                : c.chapter_id ? `/chapter/${c.chapter_id}` : '#';
              return (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td>{c.full_name || c.username}</td>
                  <td>{c.content}</td>
                  <td>
                    <a href={chapterUrl} target="_blank" rel="noopener noreferrer">
                      {c.story_title ? `${c.story_title} - ` : ''}{c.chapter_title || 'Chương ?'}
                    </a>
                  </td>
                  <td>{new Date(c.created_at).toLocaleString('vi-VN')}</td>
                  <td>
                    <button className={styles.deleteBtn} onClick={() => handleDelete(c.id)}>
                      Xóa
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
            <span>Tổng: {totalComments} bình luận</span>
            <div>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={styles.pageBtn}
              >
                &lt;
              </button>
              <span style={{ margin: '0 8px' }}>
                Trang {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={styles.pageBtn}
              >
                &gt;
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminComments;
