import React, { useEffect, useState } from 'react';
import { Comment, commentsApi } from '../services/api';
import './CommentSection.css';

interface CommentSectionProps {
  chapterId: number;
  currentUser?: { id: number; username: string } | null;
}

const CommentSection: React.FC<CommentSectionProps> = ({ chapterId, currentUser }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await commentsApi.getByChapterId(chapterId);
      setComments(res.data.comments || []);
    } catch (e) {
      setError('Không tải được bình luận');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
    // eslint-disable-next-line
  }, [chapterId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await commentsApi.create({
        chapter_id: chapterId,
        user_id: currentUser!.id,
        content: content.trim(),
      });
      setContent('');
      fetchComments();
    } catch (e) {
      setError('Gửi bình luận thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="comment-section">
      <h3>Bình luận chương này</h3>
      {loading ? (
        <div>Đang tải bình luận...</div>
      ) : (
        <div className="comments-list">
          {comments.length === 0 ? (
            <div>Chưa có bình luận nào.</div>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="comment-item">
                <div className="comment-meta" style={{display:'flex',alignItems:'center',gap:8}}>
                  <img src={c.avatar_url || '/logoname.png'} alt="avatar" style={{width:32,height:32,borderRadius:'50%',objectFit:'cover',border:'1px solid #eee',background:'#fff'}} />
                  <span className="comment-author">{c.full_name || c.username}</span>
                  <span className="comment-date">{
  (() => {
    const d = new Date(c.created_at);
    const pad = (n: number) => n.toString().padStart(2,'0');
    return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  })()
}</span>
                </div>
                <div className="comment-content">{c.content}
                  {currentUser && c.user_id === currentUser.id && (
                    <button
                      className="comment-delete-btn"
                      title="Xóa bình luận"
                      onClick={() => {
                        if (window.confirm('Bạn có chắc muốn xóa bình luận này?')) {
                          commentsApi.delete(c.id).then(fetchComments);
                        }
                      }}
                    >
                      Xóa
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
      {currentUser ? (
        <form className="comment-form" onSubmit={handleSubmit}>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Nhập bình luận..."
            rows={3}
            disabled={submitting}
          />
          <button type="submit" disabled={submitting || !content.trim()}>
            {submitting ? 'Đang gửi...' : 'Gửi bình luận'}
          </button>
        </form>
      ) : (
        <div className="comment-login-msg">Bạn cần <a href="/login">đăng nhập</a> để bình luận.</div>
      )}
      {error && <div className="comment-error">{error}</div>}
    </div>
  );
};

export default CommentSection;
