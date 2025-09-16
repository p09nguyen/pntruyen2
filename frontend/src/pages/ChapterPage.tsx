import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { chaptersApi, Chapter } from '../services/api';
import './ChapterPage.css';
import CommentSection from '../components/CommentSection';
import ReportChapterModal from '../components/ReportChapterModal';
import { useAuth } from '../contexts/AuthContext';

const ChapterPage: React.FC = () => {
  const [showControls, setShowControls] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  const scheduleAutoHide = () => {
    // If at top, do not auto-hide
    if (window.scrollY <= 0) {
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
      return;
    }
    // Clear any existing hide timer
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
    }
    // Auto-hide after 3 seconds of inactivity
    hideTimerRef.current = window.setTimeout(() => {
      // Only hide if not at very top
      if (window.scrollY > 0) setShowControls(false);
    }, 3000);
  };

  useEffect(() => {
    let lastY = window.scrollY;
    let lastShow = true;
    let lastDirection: 'up' | 'down' | null = null;

    const handleScroll = () => {
      const currentY = window.scrollY;
      const deltaY = currentY - lastY;
      const direction = deltaY > 0 ? 'down' : deltaY < 0 ? 'up' : lastDirection;

      // If at top, always show and never auto-hide
      if (currentY <= 0) {
        setShowControls(true);
        lastShow = true;
        if (hideTimerRef.current) {
          window.clearTimeout(hideTimerRef.current);
          hideTimerRef.current = null;
        }
      } else {
        // Only show on strong scroll up; keep hidden on scroll down
        if (direction === 'up' && deltaY < -40) {
          setShowControls(true);
          lastShow = true;
          scheduleAutoHide();
        } else if (direction === 'down' && deltaY > 0) {
          setShowControls(false);
          lastShow = false;
        }
      }

      lastY = currentY;
      lastDirection = direction;
      setLastScrollY(currentY);
      setScrollDirection(direction);
    };
    window.addEventListener('scroll', handleScroll);
    // Do not auto-hide on initial load if at top
    if (window.scrollY > 0) {
      scheduleAutoHide();
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    };
  }, []);
  // ...
  const [showReportModal, setShowReportModal] = useState(false);
  const { id, storySlug, chapterSlug } = useParams<{ id?: string; storySlug?: string; chapterSlug?: string }>();
  const navigate = useNavigate();
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [fontSize, setFontSize] = useState(16);
  const [theme, setTheme] = useState('light');
  const { user: currentUser } = useAuth();

  useEffect(() => {
    if (storySlug && chapterSlug) {
      loadChapterBySlug(storySlug, chapterSlug);
    } else if (id) {
      loadChapterById(parseInt(id));
    }
  }, [id, storySlug, chapterSlug]);

  useEffect(() => {
    if (chapter) {
      saveReadingHistory(chapter);
      window.scrollTo({ top: 0, behavior: 'smooth' }); // Đảm bảo cuộn lên đầu khi chapter thay đổi
    }
  }, [chapter]);

  const loadChapterBySlug = async (storySlug: string, chapterSlug: string) => {
    setLoading(true);
    try {
      const response = await chaptersApi.getBySlug(storySlug, chapterSlug);
      if (response.data.success) {
        setChapter(response.data.data);
      }
    } catch (error) {
      console.error('Error loading chapter by slug:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChapterById = async (chapterId: number) => {
    setLoading(true);
    try {
      const response = await chaptersApi.getById(chapterId);
      if (response.data.success) {
        setChapter(response.data.data);
      }
    } catch (error) {
      console.error('Error loading chapter by ID:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveReadingHistory = (chapter: Chapter) => {
    try {
      const historyItem = {
        storyId: chapter.story_id,
        storyTitle: chapter.story_title,
        storySlug: storySlug,
        chapterId: chapter.id,
        chapterNumber: chapter.chapter_number,
        chapterTitle: chapter.title,
        chapterSlug: chapterSlug,
        readAt: new Date().toISOString(),
      };

      // Get existing history
      const saved = localStorage.getItem('readingHistory');
      let history = saved ? JSON.parse(saved) : [];

      // Remove existing entry for this story if exists
      history = history.filter((item: any) => item.storyId !== chapter.story_id);

      // Add new entry at the beginning
      history.unshift(historyItem);

      // Keep only last 50 items
      history = history.slice(0, 50);

      // Save back to localStorage
      localStorage.setItem('readingHistory', JSON.stringify(history));
    } catch (error) {
      console.error('Error saving reading history:', error);
    }
  };

  const handlePrevChapter = () => {
    if (chapter?.story_slug && chapter?.prev_chapter_slug) {
      navigate(`/truyen/${chapter.story_slug}/${chapter.prev_chapter_slug}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (chapter?.prev_chapter_id) {
      navigate(`/chapter/${chapter.prev_chapter_id}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextChapter = () => {
    if (chapter?.story_slug && chapter?.next_chapter_slug) {
      navigate(`/truyen/${chapter.story_slug}/${chapter.next_chapter_slug}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (chapter?.next_chapter_id) {
      navigate(`/chapter/${chapter.next_chapter_id}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Đang tải chương...</p>
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="error">
        <h2>Không tìm thấy chương</h2>
        <Link to="/" className="back-link">← Về trang chủ</Link>
      </div>
    );
  }

  return (
    <div className={`chapter-page theme-${theme}`}>

      <div className="chapter-controls" style={{
        transition: 'transform 0.3s, opacity 0.3s',
        transform: showControls ? 'translateY(0)' : 'translateY(-100%)',
        opacity: showControls ? 1 : 0,
        pointerEvents: showControls ? 'auto' : 'none',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>

        <div className="container">
          <div className="controls-left">
            <Link to={storySlug ? `/truyen/${storySlug}` : `/story/${chapter.story_id}`} className="back-to-story">
            <h1 style={{fontSize: '14px',color:'#666'}}>← {chapter.story_title}</h1>
            </Link>
          </div>
          
          <div className="controls-center">
            <button
              onClick={handlePrevChapter}
              disabled={!chapter.prev_chapter_id}
              className="nav-btn"
            >
              Chương trước
            </button>
            <span className="chapter-info">
              Chương {chapter.chapter_number}
            </span>
            <button
              onClick={handleNextChapter}
              disabled={!chapter.next_chapter_id}
              className="nav-btn"
            >
              Chương sau
            </button>
          </div>

          <div className="controls-right">
            <div className="reading-settings">
              <div className="font-size-control">
                <button onClick={() => setFontSize(Math.max(12, fontSize - 2))}>A-</button>
                <span>{fontSize}px</span>
                <button onClick={() => setFontSize(Math.min(24, fontSize + 2))}>A+</button>
              </div>
              <div className="theme-control">
                <button
                  onClick={() => setTheme('light')}
                  className={theme === 'light' ? 'active' : ''}
                >
                  ☀️
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={theme === 'dark' ? 'active' : ''}
                >
                  🌙
                </button>
                <button
                  onClick={() => setTheme('sepia')}
                  className={theme === 'sepia' ? 'active' : ''}
                >
                  📜
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="chapter-content">
        <div className="container">
          <div className="chapter-header, fontbig">
            <h1 className="chapter-title2"><span>Chương {chapter.chapter_number}</span><span>{chapter.title}</span></h1>
            <div className="chapter-meta"  >
              
              <span>•</span>
              <span>{new Date(chapter.created_at).toLocaleDateString('vi-VN')}</span>
            </div>
          </div>

          <div 
            className="chapter-text"
            style={{ fontSize: `${fontSize}px` }}
            dangerouslySetInnerHTML={{ 
              __html: chapter.content.replace(/\n/g, '<br>') 
            }}
          />

          <div className="chapter-navigation">
            <button
              onClick={handlePrevChapter}
              disabled={!chapter.prev_chapter_id}
              className="nav-btn large"
            >
              Chương trước
            </button>
            <Link 
              to={chapter.story_slug ? `/truyen/${chapter.story_slug}` : `/story/${chapter.story_id}`} 
              className="back-to-story-btn"
            >
              Mục Lục
            </Link>
            <button
              onClick={handleNextChapter}
              disabled={!chapter.next_chapter_id}
              className="nav-btn large"
            >
              Chương sau
            </button>
          </div>
          {showReportModal && (
  <ReportChapterModal
    chapterId={chapter.id}
    userId={currentUser?.id}
    onClose={() => setShowReportModal(false)}
  />
)}
<div style={{marginBottom: 12, textAlign: 'right',display:'flex',justifyContent:'center' }}>
  <button onClick={() => setShowReportModal(true)} className="report-chapter-btn">
    🚩 Báo lỗi chương này
  </button>
</div>
<CommentSection chapterId={chapter.id} currentUser={currentUser} />
        </div>
      </div>
    </div>
  );
};

export default ChapterPage;
