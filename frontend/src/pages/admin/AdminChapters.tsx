import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { chaptersApi, storiesApi, Chapter, Story } from "../../services/api";
import ConfirmModal from "../../components/ConfirmModal";
import Toast from "../../components/Toast";
import { useToast } from "../../hooks/useToast";
import "./AdminChapters.css";

const AdminChapters: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast, showSuccess, showError, hideToast } = useToast();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    chapterId: number | null;
    chapterTitle: string;
  }>({ isOpen: false, chapterId: null, chapterTitle: "" });
  const [storySearch, setStorySearch] = useState("");
  const [filteredStories, setFilteredStories] = useState<Story[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(20);

  useEffect(() => {
    loadData();
  }, [searchParams]);

  useEffect(() => {
    if (storySearch.trim() === "") {
      setFilteredStories(stories);
    } else {
      const filtered = stories.filter(
        (story) =>
          story.title.toLowerCase().includes(storySearch.toLowerCase()) ||
          story.author?.toLowerCase().includes(storySearch.toLowerCase()),
      );
      setFilteredStories(filtered);
    }
  }, [storySearch, stories]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load stories for dropdown
      const storiesResponse = await storiesApi.getAll({ limit: 100 });
      if (storiesResponse.data.success) {
        // Normalize ID to number to avoid strict-equality mismatch
        const storyList: Story[] = (storiesResponse.data.data || []).map((s: any) => ({
          ...s,
          id: Number(s.id),
        }));
        setStories(storyList);
        setFilteredStories(storyList);

        // If story_id in URL params, load chapters for that story
        const storyId = searchParams.get("story_id");
        if (storyId) {
          const story = storyList.find((s: any) => Number(s.id) === Number(storyId));
          if (story) {
            setSelectedStory(story);
            await loadChapters(parseInt(storyId));
          }
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadChapters = async (storyId: number, page = 1) => {
    setLoading(true);
    try {
      const response = await chaptersApi.getByStoryId(storyId, page, pageSize, { admin: 1 });
      if (response.data.success) {
        const chapters = response.data.data.map((c: any) => ({
          ...c,
          id: Number(c.id),
          chapter_number: Number(c.chapter_number),
          story_id: Number(c.story_id),
        }));
        setChapters(chapters);
        if (response.data.pagination) {
          setCurrentPage(response.data.pagination.page);
          setTotalPages(response.data.pagination.pages);
        } else {
          setCurrentPage(1);
          setTotalPages(1);
        }
        console.log("Chapters loaded:", chapters);
      }
    } catch (error) {
      console.error("Error loading chapters:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStorySelect = (storyId: string) => {
    if (storyId) {
      const story = stories.find((s) => String(s.id) === storyId);
      setSelectedStory(story || null);
      setCurrentPage(1);
      loadChapters(Number(storyId), 1);
    } else {
      setSelectedStory(null);
      setChapters([]);
      setCurrentPage(1);
      setTotalPages(1);
    }
  };

  const handleDelete = (id: number) => {
    const chapter = chapters.find((c) => c.id === id);
    setConfirmModal({
      isOpen: true,
      chapterId: id,
      chapterTitle: chapter?.title || "chương này",
    });
  };

  const confirmDelete = async () => {
    if (!confirmModal.chapterId) return;

    try {
      const response = await chaptersApi.delete(confirmModal.chapterId);
      if (response.data.success) {
        showSuccess("Xóa chương thành công!");
        if (selectedStory) {
          // Nếu xóa hết trang hiện tại thì lùi về trang trước nếu có
          let nextPage = currentPage;
          if (chapters.length === 1 && currentPage > 1) {
            nextPage = currentPage - 1;
          }
          loadChapters(selectedStory.id, nextPage);
        }
      } else {
        showError("Lỗi: " + response.data.error);
      }
    } catch (error) {
      console.error("Error deleting chapter:", error);
      showError("Có lỗi xảy ra khi xóa chương!");
    } finally {
      setConfirmModal({ isOpen: false, chapterId: null, chapterTitle: "" });
    }
  };

  const cancelDelete = () => {
    setConfirmModal({ isOpen: false, chapterId: null, chapterTitle: "" });
  };

  const handleEdit = (chapterId: number) => {
    navigate(`/admin/chapters/edit/${chapterId}`);
  };

  return (
    <div className="admin-chapters">
      <div className="page-header">
        <h1 className="page-title">📑 Quản lý chương</h1>
        <div className="page-actions">
          <button
            onClick={() => {
              const storyId =
                selectedStory?.id || (stories.length > 0 ? stories[0].id : "");
              navigate(`/admin/chapters/bulk-add?story_id=${storyId}`);
            }}
            className="btn-admin btn-success"
            disabled={!selectedStory && stories.length === 0}
          >
            📚 Thêm nhiều chương
          </button>
          <button
            onClick={() => {
              const storyId =
                selectedStory?.id || (stories.length > 0 ? stories[0].id : "");
              navigate(`/admin/chapters/new?story_id=${storyId}`);
            }}
            className="btn-admin btn-primary"
            disabled={!selectedStory && stories.length === 0}
          >
            ➕ Thêm chương mới
          </button>
        </div>
      </div>

      <div className="admin-card">
        <div className="story-selector">
          <div className="story-search-section">
            <label htmlFor="story-search">Tìm kiếm truyện:</label>
            <input
              type="text"
              id="story-search"
              placeholder="Nhập tên truyện hoặc tác giả..."
              value={storySearch}
              onChange={(e) => setStorySearch(e.target.value)}
              className="story-search-input"
            />
          </div>

          <div className="story-select-section">
            <label htmlFor="story-select">Chọn truyện để quản lý chương:</label>
            <select
              id="story-select"
              value={selectedStory ? String(selectedStory.id) : ""}
              onChange={(e) => handleStorySelect(e.target.value)}
              className="story-select"
            >
              <option value="">-- Chọn truyện --</option>
              {filteredStories.map((story) => (
                <option key={story.id} value={String(story.id)}>
                  {story.title} ({story.chapter_count || 0} chương)
                </option>
              ))}
            </select>
            {storySearch && filteredStories.length === 0 && (
              <div className="no-results">
                Không tìm thấy truyện nào phù hợp.
              </div>
            )}
            {storySearch && filteredStories.length > 0 && (
              <div className="search-results-info">
                Tìm thấy {filteredStories.length} truyện
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Đang tải danh sách chương...</p>
          </div>
        ) : selectedStory ? (
          <>
            <div className="story-info">
              <h3>📚 {selectedStory.title}</h3>
              <p>
                Tác giả: {selectedStory.author} | Tổng số chương:{" "}
                {chapters.length}
              </p>
            </div>

            {chapters.length === 0 ? (
              <div className="no-data">
                <p>Truyện này chưa có chương nào.</p>
                <Link
                  to={`/admin/chapters/new?story_id=${selectedStory.id}`}
                  className="btn-admin btn-primary"
                >
                  ➕ Thêm chương đầu tiên
                </Link>
              </div>
            ) : (
              <>
                <div className="chapters-table">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Số chương</th>
                        <th>Tiêu đề</th>
                        <th>Ngày tạo</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chapters.map((chapter) => (
                        <tr key={chapter.id}>
                          <td>
                            <span className="chapter-number">
                              Chương {chapter.chapter_number}
                            </span>
                          </td>
                          <td>
                            <div className="chapter-title">
                              <Link
                                to={`/chapter/${chapter.id}`}
                                target="_blank"
                                className="chapter-link"
                              >
                                {chapter.title}
                              </Link>
                            </div>
                          </td>
                          <td>
                            {new Date(chapter.created_at).toLocaleDateString(
                              "vi-VN",
                            )}
                          </td>
                          <td>
                            <div className="action-buttons">
                              <Link
                                to={`/admin/chapters/${chapter.id}/edit`}
                                className="btn-admin btn-warning btn-sm"
                              >
                                ✏️
                              </Link>
                              <Link
                                to={`/chapter/${chapter.id}`}
                                target="_blank"
                                className="btn-admin btn-primary btn-sm"
                              >
                                👁️
                              </Link>
                              <button
                                onClick={() => handleDelete(chapter.id)}
                                className="btn-admin btn-danger btn-sm"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Pagination controls */}
                <div className="pagination-controls">
                  <button
                    className="btn-admin btn-secondary"
                    onClick={() => {
                      if (selectedStory && currentPage > 1) {
                        loadChapters(selectedStory.id, currentPage - 1);
                      }
                    }}
                    disabled={currentPage === 1}
                  >
                    ← Trang trước
                  </button>
                  <span style={{ margin: "0 12px" }}>
                    Trang {currentPage} / {totalPages}
                  </span>
                  <button
                    className="btn-admin btn-secondary"
                    onClick={() => {
                      if (selectedStory && currentPage < totalPages) {
                        loadChapters(selectedStory.id, currentPage + 1);
                      }
                    }}
                    disabled={currentPage === totalPages}
                  >
                    Trang sau →
                  </button>
                </div>
              </>
            )}
          </>
        ) : (
          <div className="no-story-selected">
            <p>Vui lòng chọn truyện để xem danh sách chương.</p>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Xác nhận xóa chương"
        message={`Bạn có chắc muốn xóa chương "${confirmModal.chapterTitle}"? Hành động này không thể khôi phục.`}
        confirmText="Xóa"
        cancelText="Hủy"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        type="danger"
      />

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  );
};

export default AdminChapters;
