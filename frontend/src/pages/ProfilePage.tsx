import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { bookmarksApi, commentsApi } from '../services/api';
import { Link } from 'react-router-dom';
import styles from './ProfilePage.module.css';



interface Comment {
  id: number;
  story_id?: number;
  chapter_id?: number;
  content: string;
  created_at: string;
  story_title?: string;
  chapter_title?: string;
}

const BOOKMARKS_PER_PAGE = 5;
const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [readingHistory, setReadingHistory] = useState<any[]>([]);
  const [bookmarkPage, setBookmarkPage] = useState(1);
  const [comments, setComments] = useState<Comment[]>([]);
  // Pagination state
  const [readingPage, setReadingPage] = useState(1);
  const [commentsPage, setCommentsPage] = useState(1);
  const ITEMS_PER_PAGE = 5;
  const [inputUrl, setInputUrl] = useState('');
// State đổi mật khẩu
const [showChangePw, setShowChangePw] = useState(false);
const [oldPassword, setOldPassword] = useState('');
const [newPassword, setNewPassword] = useState('');
const [confirmPassword, setConfirmPassword] = useState('');
const [pwMessage, setPwMessage] = useState('');
const [pwLoading, setPwLoading] = useState(false);

  // Dev-only logging helpers to keep production console clean
  const isDev = process.env.NODE_ENV !== 'production';
  const debug = (...args: any[]) => { if (isDev) console.log(...args); };
  const debugError = (...args: any[]) => { if (isDev) console.error(...args); };

  useEffect(() => {
    debug('ProfilePage useEffect: user =', user);
    loadBookmarks();
    loadReadingHistory();
    if (user) {
      debug('Calling loadComments for user:', user.id);
      loadComments();
    } else {
      debug('User is null, not calling loadComments');
    }
  }, [user]);

  const loadBookmarks = async () => {
    try {
      const res = await bookmarksApi.getAll();
      setBookmarks(res.data.data || []);
    } catch {
      setBookmarks([]);
    }
  };

  const loadReadingHistory = () => {
    try {
      const saved = localStorage.getItem('readingHistory');
      if (saved) setReadingHistory(JSON.parse(saved));
    } catch {}
  };

  const loadComments = async () => {
    if (!user) return;
    try {
      const res = await commentsApi.getByUserId(user.id);
      debug('User comments API result:', res.data);
      setComments(res.data.data || []);
    } catch (err) {
      setComments([]);
      debugError('Error loading user comments:', err);
    }
  };


  if (!user) return <div className="container"><h2>Vui lòng đăng nhập</h2></div>;

  // Stats
  const statList = [
    { icon: 'https://cdn-icons-png.flaticon.com/512/3031/3031121.png', label: 'Đã bookmark', value: bookmarks.length },
    { icon: 'https://cdn-icons-png.freepik.com/512/2961/2961948.png', label: 'Lịch sử đọc', value: readingHistory.length },
    { icon: 'https://cdn-icons-png.flaticon.com/512/2497/2497827.png', label: 'Bình luận', value: comments.length },
  ];

  return (
    <div className={styles.profilePageContainer}>
      <div className={styles.profileHeader}>
        <div className={styles.ProfilePage_avatar_}>
          <img
            src={user.avatar_url && user.avatar_url.trim() !== '' ? user.avatar_url : "https://cdn-icons-png.flaticon.com/512/456/456212.png"}
            alt="avatar"
            style={{width:72,height:72,borderRadius:'50%',background:'#e0e7ff',objectFit:'cover'}}
          />
        </div>
        <div className={styles.userInfo}>
          <div className={styles.userName}>{user.full_name || user.username}
            <span className={styles.userRole} style={{background:user.role==='admin'?'#e0e7ff':'#f1f5f9',color:user.role==='admin'?'#d97706':'#6366f1'}}>
              {user.role==='admin'?'Quản trị viên':'Thành viên'}
            </span>
          </div>
          <div style={{color:'#555',marginBottom:4}}>@{user.username}</div>
          <div style={{color:'#888',fontSize:'1rem'}}>{user.email}</div>
        </div>
      </div>

      {/* Đổi avatar */}
      <div style={{marginTop:16,marginBottom:16}}>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!inputUrl) return;
            try {
              const res = await fetch(`/api/users.php?id=${user.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ avatar_url: inputUrl, _method: 'PUT' })
              });
              const data = await res.json();
              if (data.success) {
                window.location.reload(); // reload để lấy avatar mới
              } else {
                alert('Lỗi: ' + data.error);
              }
            } catch (err) {
              alert('Có lỗi xảy ra khi đổi avatar');
            }
          }}
          style={{display:'flex',gap:8,alignItems:'center'}}
        >
          <input
            type="url"
            placeholder="Nhập URL hình ảnh avatar..."
            style={{padding:4,borderRadius:4,border:'1px solid #ccc',width:260}}
            value={typeof inputUrl !== 'undefined' ? inputUrl : ''}
            onChange={e => setInputUrl(e.target.value)}
            required
          />
          <button type="submit" style={{padding:'4px 12px',borderRadius:4,background:'#667eea',color:'#fff',border:'none'}}>Đổi avatar</button>
<button type="button" style={{padding:'4px 12px',borderRadius:4,background:'#f59e42',color:'#fff',border:'none',marginLeft:8}} onClick={()=>setShowChangePw(v=>!v)}>Đổi mật khẩu</button>
        </form>
      </div>

      {showChangePw && (
  <form style={{margin:'16px 0',display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}} onSubmit={async e => {
    e.preventDefault();
    setPwMessage('');
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPwMessage('Vui lòng nhập đủ thông tin'); return;
    }
    if (newPassword !== confirmPassword) {
      setPwMessage('Mật khẩu mới không khớp'); return;
    }
    setPwLoading(true);
    try {
      const res = await fetch(`/api/users.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          _method: 'CHANGE_PASSWORD',
          user_id: user.id,
          old_password: oldPassword,
          new_password: newPassword
        })
      });
      const data = await res.json();
      if (data.success) {
        setPwMessage('Đổi mật khẩu thành công!');
        setShowChangePw(false);
        setOldPassword(''); setNewPassword(''); setConfirmPassword('');
      } else {
        setPwMessage(data.message || 'Đổi mật khẩu thất bại');
      }
    } catch (err) {
      setPwMessage('Có lỗi xảy ra, thử lại sau');
    }
    setPwLoading(false);
  }}>
    <input type="password" placeholder="Mật khẩu cũ" value={oldPassword} onChange={e=>setOldPassword(e.target.value)} style={{padding:4,borderRadius:4,border:'1px solid #ccc'}} required />
    <input type="password" placeholder="Mật khẩu mới" value={newPassword} onChange={e=>setNewPassword(e.target.value)} style={{padding:4,borderRadius:4,border:'1px solid #ccc'}} required />
    <input type="password" placeholder="Xác nhận mật khẩu mới" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} style={{padding:4,borderRadius:4,border:'1px solid #ccc'}} required />
    <button type="submit" style={{padding:'4px 12px',borderRadius:4,background:'#f59e42',color:'#fff',border:'none'}} disabled={pwLoading}>{pwLoading?'Đang đổi...':'Xác nhận'}</button>
    {pwMessage && <span style={{color:pwMessage.includes('thành công')?'green':'red',marginLeft:8}}>{pwMessage}</span>}
  </form>
)}

<div className={styles.statsRow}>
        {statList.map((stat, idx) => (
          <div className={styles.statCard} key={stat.label}>
            <img src={stat.icon} alt={stat.label} style={{width:22, height:22, marginBottom:4, filter:'drop-shadow(0 1px 2px #6366f133)'}} />
            <div className={styles.statNumber}>{stat.value}</div>
            <div style={{fontSize:'1rem',color:'#555'}}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div className={styles.sectionTitle}>Truyện đã đánh dấu</div>
      {bookmarks.length === 0 ? (
        <div style={{color:'#888',marginBottom:16}}>Chưa có truyện nào</div>
      ) : (
        <>
          <div className={styles.bookmarkGrid}>
            {bookmarks.slice((bookmarkPage-1)*BOOKMARKS_PER_PAGE, bookmarkPage*BOOKMARKS_PER_PAGE).map(bm => (
              <div className={styles.bookmarkCard} key={bm.id}>
                <img className={styles.bookmarkCover} src={bm.cover_image || '/default-cover.jpg'} alt={bm.story_title} />
                <div className={styles.bookmarkInfo}>
                  <Link className={styles.bookmarkTitle} to={bm.story_slug ? `/truyen/${bm.story_slug}` : `/story/${bm.story_id}`}>{bm.story_title}</Link>
                  {bm.chapter_id && (
                    <Link className={styles.bookmarkContinue} to={`/chapter/${bm.chapter_id}`}>Đọc tiếp chương {bm.chapter_number}</Link>
                  )}
                </div>
              </div>
            ))}
          </div>
          {/* Pagination Controls */}
          {bookmarks.length > BOOKMARKS_PER_PAGE && (
            <div style={{display:'flex',justifyContent:'center',gap:8,margin:'16px 0'}}>
              <button onClick={()=>setBookmarkPage(p=>Math.max(1,p-1))} disabled={bookmarkPage===1}>Trước</button>
              <span style={{alignSelf:'center'}}>Trang {bookmarkPage} / {Math.ceil(bookmarks.length/BOOKMARKS_PER_PAGE)}</span>
              <button onClick={()=>setBookmarkPage(p=>p<Math.ceil(bookmarks.length/BOOKMARKS_PER_PAGE)?p+1:p)} disabled={bookmarkPage===Math.ceil(bookmarks.length/BOOKMARKS_PER_PAGE)}>Sau</button>
            </div>
          )}
        </>
      )}

      <div className={styles.sectionTitle}>Lịch sử đọc gần nhất</div>
      {readingHistory.length === 0 ? (
        <div style={{color:'#888',marginBottom:16}}>Chưa có dữ liệu</div>
      ) : (
        <>
          <ul style={{marginBottom:16}}>
            {readingHistory.slice((readingPage-1)*ITEMS_PER_PAGE, readingPage*ITEMS_PER_PAGE).map((item, idx) => (
              <li key={idx} style={{marginBottom:6}}>
                <Link to={item.storySlug ? `/truyen/${item.storySlug}` : `/story/${item.storyId}`}>{item.storyTitle}</Link>
                {item.chapterId && (
                  <> - <Link to={`/chapter/${item.chapterId}`}>Chương {item.chapterNumber}</Link></>
                )}
                <span style={{marginLeft:8, color:'#888'}}>{item.lastRead ? new Date(item.lastRead).toLocaleString('vi-VN') : ''}</span>
              </li>
            ))}
          </ul>
          <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginBottom:16}}>
            <button onClick={()=>setReadingPage(p=>Math.max(1,p-1))} disabled={readingPage===1}>Trước</button>
            <span>Trang {readingPage} / {Math.ceil(readingHistory.length/ITEMS_PER_PAGE)}</span>
            <button onClick={()=>setReadingPage(p=>p<Math.ceil(readingHistory.length/ITEMS_PER_PAGE)?p+1:p)} disabled={readingPage>=Math.ceil(readingHistory.length/ITEMS_PER_PAGE)}>Sau</button>
          </div>
        </>
      )}

      <div className={styles.sectionTitle}>Bình luận của bạn</div>
      {comments.length === 0 ? (
        <div style={{color:'#888'}}>Bạn chưa bình luận truyện nào</div>
      ) : (
        <>
          <ul>
            {comments.slice((commentsPage-1)*ITEMS_PER_PAGE, commentsPage*ITEMS_PER_PAGE).map(c => (
              <li key={c.id} style={{marginBottom:6}}>
                {c.story_title && <Link to={`/truyen/${c.story_id}`}>{c.story_title}</Link>}
                {c.chapter_id && c.chapter_title && (
                  <> - <Link to={`/chapter/${c.chapter_id}`}>{c.chapter_title}</Link></>
                )}
                : {c.content}
                <span style={{marginLeft:8, color:'#888'}}>{new Date(c.created_at).toLocaleString('vi-VN')}</span>
              </li>
            ))}
          </ul>
          <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginBottom:16}}>
            <button onClick={()=>setCommentsPage(p=>Math.max(1,p-1))} disabled={commentsPage===1}>Trước</button>
            <span>Trang {commentsPage} / {Math.ceil(comments.length/ITEMS_PER_PAGE)}</span>
            <button onClick={()=>setCommentsPage(p=>p<Math.ceil(comments.length/ITEMS_PER_PAGE)?p+1:p)} disabled={commentsPage>=Math.ceil(comments.length/ITEMS_PER_PAGE)}>Sau</button>
          </div>
        </>
      )}
    </div>
  );
};

export default ProfilePage;
