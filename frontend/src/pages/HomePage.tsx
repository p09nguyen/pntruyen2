import React, { useState, useEffect } from "react";
import { Link, useSearchParams, useLocation } from "react-router-dom";
import {
  storiesApi,
  Story,
  popularStoriesApi,
  allStoriesApi,
} from "../services/api";
import FeaturedStories from "../components/FeaturedStories";
import useDragScroll from "../hooks/useDragScroll";
import { useRef } from "react";
import "./HomePage.css";



interface ReadingHistory {
  storyId: number;
  storyTitle: string;
  storySlug?: string;
  chapterId: number;
  chapterNumber: number;
  chapterTitle: string;
  chapterSlug?: string;
  // Some pages stored this as lastRead, ChapterPage stores as readAt
  lastRead?: string;
  readAt?: string;
}

const HomePage: React.FC = () => {
  const storiesGridRef = useDragScroll<HTMLDivElement>();
  // ...existing states...
  const [allStories, setAllStories] = useState<Story[]>([]);
  const [loadingAllStories, setLoadingAllStories] = useState(true);

  useEffect(() => {
    loadAllStories();
  }, []);

  const loadAllStories = async () => {
    setLoadingAllStories(true);
    try {
      const data = await allStoriesApi.getAll();
      setAllStories(data);
    } catch (e) {
      setAllStories([]);
    } finally {
      setLoadingAllStories(false);
    }
  };

  const [popularStories, setPopularStories] = useState<Story[]>([]);

  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [readingHistory, setReadingHistory] = useState<ReadingHistory[]>([]);
  const [searchParams] = useSearchParams();
  const location = useLocation();

  useEffect(() => {
    loadStories();
    loadReadingHistory();
    loadPopularStories();
  }, [searchParams, location.pathname, currentPage]);

  const loadPopularStories = async () => {
    try {
      const res = await popularStoriesApi.getAll(8);
      if (res.data.success) setPopularStories(res.data.data);
    } catch (e) {
      setPopularStories([]);
    }
  };

  const loadReadingHistory = () => {
    try {
      const saved = localStorage.getItem("readingHistory");
      if (saved) {
        const history: ReadingHistory[] = JSON.parse(saved);
        // Normalize timestamp field and sort by most recent
        const getTs = (item: ReadingHistory) => item.lastRead || item.readAt || "";
        const sortedHistory = history
          .filter((h) => !!getTs(h))
          .sort(
            (a, b) =>
              new Date(getTs(b)).getTime() - new Date(getTs(a)).getTime(),
          );
        setReadingHistory(sortedHistory.slice(0, 10)); // Show only last 10
      } else {
        // Add sample data if no history exists
        const sampleHistory: ReadingHistory[] = [];
        setReadingHistory(sampleHistory);
        localStorage.setItem("readingHistory", JSON.stringify(sampleHistory));
      }
    } catch (error) {
      console.error("Error loading reading history:", error);
    }
  };

  const loadStories = async () => {
    setLoading(true);
    try {
      // Determine status filter from pathname shortcuts or query string
      const pathname = location.pathname;
      const statusFromPath = pathname === "/completed" ? "completed" : pathname === "/updating" ? "ongoing" : undefined;

      const params = {
        page: currentPage,
        limit: 12,
        category_id: searchParams.get("category")
          ? parseInt(searchParams.get("category")!)
          : undefined,
        status: statusFromPath || searchParams.get("status") || undefined,
        search: searchParams.get("search") || undefined,
      };

      const response = await storiesApi.getAll(params);
      if (process.env.NODE_ENV !== 'production') {
        console.log("Stories API response:", response.data);
      }
      if (response.data.success) {
        setStories(response.data.data);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (error) {
      console.error("Error loading stories:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "ongoing":
        return "Đang ra";
      case "completed":
        return "Hoàn thành";
      case "paused":
        return "Tạm dừng";
      default:
        return status;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "ongoing":
        return "status-ongoing";
      case "completed":
        return "status-completed";
      case "paused":
        return "status-paused";
      default:
        return "";
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Đang tải truyện...</p>
      </div>
    );
  }

  return (
    <div className="home-page">
      <div className="container">
        <h1 style={{display: 'none',color:'#666'}}>Đọc truyện online miễn phí, truyện tranh, tiểu thuyết mới nhất tại pntruyen.shop</h1>
        <FeaturedStories />
        <div className="home-layout">
          {/* Reading History - Mobile: Top, Desktop: Sidebar */}
          <div className="sidebar">
            <div className="reading-history">
              <h3>📖 Truyện đang đọc</h3>
              {readingHistory.length === 0 ? (
                <div className="no-history">
                  <p>Chưa có lịch sử đọc truyện</p>
                </div>
              ) : (
                <div className="history-list">
                  {readingHistory.slice(0, 2).map((item, index) => (
                    <div
                      key={`${item.storyId}-${item.chapterId}`}
                      className="history-item"
                    >
                      <Link
                        to={
                          item.storySlug && item.chapterSlug
                            ? `/truyen/${item.storySlug}/${item.chapterSlug}`
                            : `/chapter/${item.chapterId}`
                        }
                        className="history-link"
                      >
                        <div className="history-story">
                          <h4>{item.storyTitle}</h4>
                          <p>
                            Chương {item.chapterNumber}: {item.chapterTitle}
                          </p>
                        </div>
                        <div className="history-time">
                          {(() => {
                            const ts = item.lastRead || item.readAt;
                            const d = ts ? new Date(ts) : null;
                            return d && !isNaN(d.getTime())
                              ? d.toLocaleString("vi-VN", { hour12: false })
                              : "Chưa xác định";
                          })()}
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="main-content">
            {searchParams.get("search") && (
              <p className="search-info">
                Kết quả tìm kiếm cho: "{searchParams.get("search")}"
              </p>
            )}
            <div style={{ marginBottom: "0px" }} className="page-header">
              <h2>Truyện mới cập nhật</h2>
            </div>

            {stories.length === 0 ? (
              <div className="no-stories">
                <p>Không tìm thấy truyện nào.</p>
              </div>
            ) : (
              <>
                <div className="stories-grid" ref={storiesGridRef}>
                {stories
                .filter(story => Number(story.show_on_home) === 1)
                .map((story) => (
                    <div key={story.id} className="story-card">
                      <Link
                        to={
                          story.slug
                            ? `/truyen/${story.slug}`
                            : `/story/${story.id}`
                        }
                        className="story-link"
                      >
                        <div className="story-cover">
                          {story.cover_image ? (
                            <img src={story.cover_image} alt={story.title} />
                          ) : (
                            <div className="no-cover">📖</div>
                          )}
                        </div>
                        <div className="story-info2">
                          <h3 className="story-title">{story.title}</h3>
                          <p className="story-author">
                            Tác giả: {story.author}
                          </p>
                          <p className="story-category">
                            {story.category_name}
                          </p>
                          <div className="story-meta">
                            <span
                              className={`story-status ${getStatusClass(story.status)}`}
                            >
                              {getStatusText(story.status)}
                            </span>
                            <span className="chapter-count">
                              {story.chapter_count || 0} chương
                            </span>
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
                {/* --- Truyện nổi bật --- */}
                <div className="popular-stories2">
                  <h3 className="popular-stories-title">Truyện nổi bật</h3>
                  <div className="popular-stories-grid stories-grid">
                    {popularStories.length === 0 ? (
                      <div className="no-stories">Không có truyện nổi bật</div>
                    ) : (
                      popularStories.filter(story => Number(story.show_on_home) === 1).slice(0, 8).map((story) => (
                        <div className="story-card" key={story.id}>
                          <Link
                            to={
                              story.slug
                                ? `/truyen/${story.slug}`
                                : `/story/${story.id}`
                            }
                            className="story-link"
                          >
                            <div className="story-cover">
                              {story.cover_image ? (
                                <img
                                  src={story.cover_image}
                                  alt={story.title}
                                />
                              ) : (
                                <div className="no-cover">📖</div>
                              )}
                            </div>
                            <div className="story-info2">
                              <h3 className="story-title">{story.title}</h3>
                              {/* Có thể thêm các info khác ở đây nếu muốn giống phần trên */}
                            </div>
                            <div
                              className="popular-story-views"
                              style={{ textAlign: "center", marginTop: 4 }}
                            >
                              👁 {story.total_views || 0}
                            </div>
                          </Link>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                {totalPages > 1 && (
                  <div className="pagination">
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={currentPage === 1}
                      className="page-btn"
                    >
                      ← Trước
                    </button>

                    <span className="page-info">
                      Trang {currentPage} / {totalPages}
                    </span>

                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="page-btn"
                    >
                      Sau →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        {/* --- Tất cả truyện --- */}
        <div className="all-stories-section">
          <h3 className="all-stories-title">Tất cả truyện</h3>
          {loadingAllStories ? (
            <div className="loading">Đang tải...</div>
          ) : (
            <div className="all-stories-list-wrapper">
              {allStories.length === 0 ? (
                <div className="no-stories">Không có truyện nào</div>
              ) : (
                <table className="all-stories-list">
                  <thead>
                    <tr>
                      <th>Tên truyện</th>
                      <th>Thể loại</th>
                      <th>Số chương</th>
                      <th>Cập nhật mới nhất</th>
                    </tr>
                  </thead>
                  <tbody>
                  {allStories
                  .filter(story => Number(story.show_on_home) === 1)
                  .map((story) => (
                      <tr key={story.id}>
                        <td>
                          <Link
                            to={
                              story.slug
                                ? `/truyen/${story.slug}`
                                : `/story/${story.id}`
                            }
                          >
                            {story.title}
                          </Link>
                        </td>
                        <td>{story.category_name || "-"}</td>
                        <td style={{ textAlign: "center" }}>
                          {story.chapter_count}
                        </td>
                        <td>
                          {story.latest_chapter_update
                            ? new Date(
                                story.latest_chapter_update,
                              ).toLocaleString("vi-VN")
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
