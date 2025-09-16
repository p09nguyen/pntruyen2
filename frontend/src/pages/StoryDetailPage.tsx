import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { bookmarksApi } from '../services/api';
import { useParams, Link } from 'react-router-dom';
import { storiesApi, chaptersApi, Story, Chapter } from '../services/api';
import './StoryDetailPage.css';

const StoryDetailPage: React.FC = () => {
  const { user } = useAuth();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [bookmarkId, setBookmarkId] = useState<number | null>(null);

  const { id, slug } = useParams<{ id?: string; slug?: string }>();
  const [story, setStory] = useState<Story | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [latestChapters, setLatestChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const chaptersPerPage = 50;
  const [totalChapters, setTotalChapters] = useState<number>(0);
  const [chapterRangeOptions, setChapterRangeOptions] = useState<{start: number, end: number}[]>([]);

  // Hàm lấy tổng số chương và tạo các lựa chọn phân đoạn
  const setupChapterRanges = (total: number) => {
    const ranges = [];
    for (let i = 1; i <= total; i += chaptersPerPage) {
      ranges.push({ start: i, end: Math.min(i + chaptersPerPage - 1, total) });
    }
    setChapterRangeOptions(ranges);
  };

  useEffect(() => {
    if (slug) {
      loadStoryDataBySlug(slug);
    } else if (id) {
      loadStoryDataById(parseInt(id));
    }
  }, [id, slug]);

  // Check bookmark status when story or user changes
  useEffect(() => {
    if (!user || !story) {
      setIsBookmarked(false);
      setBookmarkId(null);
      return;
    }
    const fetchBookmark = async () => {
      try {
        const res = await bookmarksApi.getAll();
        const bookmarks = res.data.data || [];
        const found = bookmarks.find((bm: any) => bm.story_id === story.id && bm.user_id === user.id);
        setIsBookmarked(!!found);
        setBookmarkId(found ? found.id : null);
      } catch {
        setIsBookmarked(false);
        setBookmarkId(null);
      }
    };
    fetchBookmark();
  }, [user, story]);

  const loadStoryDataBySlug = async (storySlug: string) => {
    setLoading(true);
    try {
      const storyResponse = await storiesApi.getBySlug(storySlug);
      
      if (storyResponse.data.success) {
        const storyData = storyResponse.data.data;
        setStory(storyData);
        
        // Load chapters by story ID, chỉ lấy 50 chương đầu tiên (ASC mặc định)
        const chaptersResponse = await chaptersApi.getByStoryId(storyData.id, 1, 50);
        if (chaptersResponse.data.success) {
          setChapters(chaptersResponse.data.data);
          setTotalChapters(chaptersResponse.data.pagination?.total || 0);
          setupChapterRanges(chaptersResponse.data.pagination?.total || 0);
        }

        // Load 3 chương mới nhất (DESC) để hiển thị "Chương mới nhất"
        try {
          const latestRes = await chaptersApi.getByStoryId(storyData.id, 1, 3, { sort: 'desc' });
          if (latestRes.data?.success) {
            setLatestChapters(latestRes.data.data);
          }
        } catch {}
      }
    } catch (error) {
      console.error('Error loading story data by slug:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStoryDataById = async (storyId: number) => {
    setLoading(true);
    try {
      const [storyResponse, chaptersResponse, latestRes] = await Promise.all([
        storiesApi.getById(storyId),
        chaptersApi.getByStoryId(storyId, 1, 50),
        chaptersApi.getByStoryId(storyId, 1, 3, { sort: 'desc' })
      ]);

      if (storyResponse.data.success) {
        setStory(storyResponse.data.data);
      }

      if (chaptersResponse.data.success) {
        setChapters(chaptersResponse.data.data);
        setTotalChapters(chaptersResponse.data.pagination?.total || 0);
        setupChapterRanges(chaptersResponse.data.pagination?.total || 0);
      }

      if (latestRes.data?.success) {
        setLatestChapters(latestRes.data.data);
      }
    } catch (error) {
      console.error('Error loading story data by ID:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ongoing': return 'Đang ra';
      case 'completed': return 'Hoàn thành';
      case 'paused': return 'Tạm dừng';
      default: return status;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'ongoing': return 'status-ongoing';
      case 'completed': return 'status-completed';
      case 'paused': return 'status-paused';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Đang tải thông tin truyện...</p>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="error">
        <h2>Không tìm thấy truyện</h2>
        <Link to="/" className="back-link">← Về trang chủ</Link>
      </div>
    );
  }

  return (
    <div className="story-detail-page">


      <div className="container">
        <div style={{display:'flex'}} className="breadcrumb">
          <Link to="/">Trang chủ</Link> /  <span><h1 style={{fontSize: '14px',color:'#666'}}>{story.title}</h1></span>
        </div>

        <div className="story-header">
          <div className="story-cover">
            {story.cover_image ? (
              <img src={story.cover_image} alt={story.title} />
            ) : (
              <div className="no-cover">📖</div>
            )}
          </div>

          <div className="story-info">
            <h1 style={{fontSize: '24px'}} className="story-title">{story.title}</h1>
            <div className="story-meta">
              <p><strong>Tác giả:</strong> {story.author}</p>
              <p><strong>Thể loại:</strong> {story.category_name}</p>
              <p><strong>Tình trạng:</strong> 
                <span className={`status ${getStatusClass(story.status)}`}>
                  {getStatusText(story.status)}
                </span>
              </p>
              <p><strong>Số chương:</strong> {chapters.length}</p>
              <p><strong>Lượt xem:</strong> {story.view_count?.toLocaleString()}</p>
            </div>

            <div className="story-description2">
              
              <div className="description-content">
                {story.description ? (
                  <p>{story.description}</p>
                ) : (
                  <p className="no-description">Chưa có giới thiệu cho truyện này.</p>
                )}
              </div>
            </div>

            <div className="action-buttons">
              {chapters.length > 0 && (
                <Link to={story?.slug && chapters[0]?.slug ? `/truyen/${story.slug}/${chapters[0].slug}` : `/chapter/${chapters[0]?.id}`} className="read-btn">
                  📖 Đọc từ đầu
                </Link>
              )}
              {user ? (
                <button className={`bookmark-btn${isBookmarked ? ' bookmarked' : ''}`} disabled={bookmarkLoading} onClick={async () => {
                  if (!story) return;
                  setBookmarkLoading(true);
                  try {
                    if (isBookmarked) {
                      await bookmarksApi.delete(story.id);
                      setIsBookmarked(false);
                      setBookmarkId(null);
                    } else {
                      await bookmarksApi.create({ story_id: story.id });
                      setIsBookmarked(true);
                    }
                  } catch (e) {
                    alert('Có lỗi khi cập nhật bookmark!');
                  } finally {
                    setBookmarkLoading(false);
                  }
                }}>
                  {isBookmarked ? '⭐ Đã đánh dấu' : '⭐ Đánh dấu'}
                </button>
              ) : (
                <button className="bookmark-btn" disabled>⭐ Đánh dấu (đăng nhập)</button>
              )}
            </div>
          </div>
        </div>
        {latestChapters.length > 0 && (
                <div className="latest-chapters" style={{margin: '12px 0 16px 0'}}>
                  <h3 style={{margin: '0 0 8px 0'}}>Chương mới nhất</h3>
                  <div className="latest-list" style={{display: 'flex', flexDirection: 'column', gap: 8}}>
                    {latestChapters.map(ch => (
                      <Link
                        key={ch.id}
                        to={story?.slug && ch.slug ? `/truyen/${story.slug}/${ch.slug}` : `/chapter/${ch.id}`}
                        className="chapter-item"
                        style={{padding: '10px 12px', border: '1px solid #eee', borderRadius: 6}}
                      >
                        <div className="chapter-info">
                          <div className="chapter-header2">
                            <span className="chapter-number">Chương {ch.chapter_number}</span>
                            <div className="chapnameopt">{ch.title}</div>
                          </div>
                        </div>
                        <div className="chapter-date">
                          {new Date(ch.created_at).toLocaleDateString('vi-VN')}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
        <div className="chapters-section">
          <h3>📑 Danh sách chương ({totalChapters || chapters.length})</h3>

          {/* Chọn phân đoạn chương nếu tổng số chương > 50 */}
          {totalChapters > chaptersPerPage && (
            <div className="chapter-range-select" style={{margin: '16px 0'}}>
              <span>Hiển thị chương:&nbsp;</span>
              <select
                value={currentPage}
                onChange={async (e) => {
                  const selectedPage = Number(e.target.value);
                  setCurrentPage(selectedPage);
                  setLoading(true);
                  try {
                    const chaptersResponse = await chaptersApi.getByStoryId(story.id, selectedPage, chaptersPerPage);
                    if (chaptersResponse.data.success) {
                      setChapters(chaptersResponse.data.data);
                    }
                  } catch (e) {
                    setChapters([]);
                  } finally {
                    setLoading(false);
                  }
                }}
                style={{padding: '6px 12px', fontSize: '16px', borderRadius: 4, border: '1px solid #ccc', marginRight: 8}}
              >
                {chapterRangeOptions.map((range, idx) => (
                  <option key={idx} value={idx + 1}>
                    {range.start}-{range.end}
                  </option>
                ))}
              </select>
            </div>
          )}
          {chapters.length === 0 ? (
            <div className="no-chapters">
              <p>Truyện này chưa có chương nào.</p>
            </div>
          ) : (
            <>
              {/* Pagination Controls */}
              {Math.ceil(chapters.length / chaptersPerPage) > 1 && (
                <div className="pagination-controls">
                  {Array.from({ length: Math.ceil(chapters.length / chaptersPerPage) }, (_, index) => {
                    const pageNum = index + 1;
                    const startChapter = (pageNum - 1) * chaptersPerPage + 1;
                    const endChapter = Math.min(pageNum * chaptersPerPage, chapters.length);
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`page-btn ${currentPage === pageNum ? 'active' : ''}`}
                      >
                        {startChapter}-{endChapter}
                      </button>
                    );
                  })}
                </div>
              )}
              
              {/* Chapters Grid */}
              {/* Newest Chapters */}


              {/* Chapters Grid */}
              <div className="chapters-grid">
                {chapters.map(chapter => (
                    <Link
                      key={chapter.id}
                      to={story?.slug && chapter.slug ? `/truyen/${story.slug}/${chapter.slug}` : `/chapter/${chapter.id}`}
                      className="chapter-item"
                    >
                      <div className="chapter-info">
                        <div className="chapter-header2">
                          <span className="chapter-number">Chương {chapter.chapter_number}</span>
                          <div className="chapnameopt">{chapter.title}</div>
                        </div>
                        
                      </div>
                      <div className="chapter-date">
                        {new Date(chapter.created_at).toLocaleDateString('vi-VN')}
                      </div>
                    </Link>
                  ))
                }
              </div>
              <div className="chapter-range-select" style={{margin: '16px 0'}}>
              <span>Hiển thị chương:&nbsp;</span>
              <select
                value={currentPage}
                onChange={async (e) => {
                  const selectedPage = Number(e.target.value);
                  setCurrentPage(selectedPage);
                  setLoading(true);
                  try {
                    const chaptersResponse = await chaptersApi.getByStoryId(story.id, selectedPage, chaptersPerPage);
                    if (chaptersResponse.data.success) {
                      setChapters(chaptersResponse.data.data);
                    }
                  } catch (e) {
                    setChapters([]);
                  } finally {
                    setLoading(false);
                  }
                }}
                style={{padding: '6px 12px', fontSize: '16px', borderRadius: 4, border: '1px solid #ccc', marginRight: 8}}
              >
                {chapterRangeOptions.map((range, idx) => (
                  <option key={idx} value={idx + 1}>
                    {range.start}-{range.end}
                  </option>
                ))}
              </select>
            </div>
              {/* Pagination Controls */}
              {Math.ceil(chapters.length / chaptersPerPage) > 1 && (
                <div className="pagination-controls">
                  {Array.from({ length: Math.ceil(chapters.length / chaptersPerPage) }, (_, index) => {
                    const pageNum = index + 1;
                    const startChapter = (pageNum - 1) * chaptersPerPage + 1;
                    const endChapter = Math.min(pageNum * chaptersPerPage, chapters.length);
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`page-btn ${currentPage === pageNum ? 'active' : ''}`}
                      >
                        {startChapter}-{endChapter}
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoryDetailPage;
