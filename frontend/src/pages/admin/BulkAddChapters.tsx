import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { chaptersApi, storiesApi, Story } from '../../services/api';
import ConfirmModal from '../../components/ConfirmModal';
import Toast from '../../components/Toast';
import { useToast } from '../../hooks/useToast';
import './BulkAddChapters.css';

interface ChapterData {
  id: string;
  title: string;
  content: string;
  chapter_number: number;
}

const BulkAddChapters: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast, showSuccess, showError, hideToast } = useToast();
  
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(false);
  const [storyId, setStoryId] = useState('');
  
  const [chapters, setChapters] = useState<ChapterData[]>([
    { id: '1', title: '', content: '', chapter_number: 1 }
  ]);
  
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: ''
  });

  useEffect(() => {
    loadStories();
    const urlStoryId = searchParams.get('story_id');
    if (urlStoryId) {
      setStoryId(urlStoryId);
    }
  }, [searchParams]);

  useEffect(() => {
    if (storyId && stories.length > 0) {
      const story = stories.find(s => String(s.id) === String(storyId));
      setSelectedStory(story || null);

      // Khi đổi truyện, reset lại mảng chapters về 1 phần tử với số chương đúng
      if (story) {
        // Ép kiểu về number để tránh lỗi cộng chuỗi
        const chapterCount = Number(story.chapter_count) || 0;
        const startingNumber = chapterCount + 1;
        setChapters([
          { id: Date.now().toString(), title: '', content: '', chapter_number: startingNumber }
        ]);
      }
    }
  }, [storyId, stories]);

  const loadStories = async () => {
    try {
      const response = await storiesApi.getAll({ limit: 100 });
      if (response.data.success) {
        setStories(response.data.data);
      }
    } catch (error) {
      console.error('Error loading stories:', error);
      showError('Không thể tải danh sách truyện');
    }
  };

  const addChapter = () => {
    const newChapterNumber = chapters.length > 0 
      ? Math.max(...chapters.map(c => c.chapter_number)) + 1
      : (selectedStory?.chapter_count || 0) + 1;
    
    const newChapter: ChapterData = {
      id: Date.now().toString(),
      title: '',
      content: '',
      chapter_number: newChapterNumber
    };
    
    setChapters(prev => [...prev, newChapter]);
  };

  const removeChapter = (id: string) => {
    if (chapters.length <= 1) {
      showError('Phải có ít nhất một chương');
      return;
    }
    setChapters(prev => prev.filter(chapter => chapter.id !== id));
  };

  const updateChapter = (id: string, field: keyof ChapterData, value: string | number) => {
    setChapters(prev => prev.map(chapter => 
      chapter.id === id ? { ...chapter, [field]: value } : chapter
    ));
  };

  const validateChapters = (): boolean => {
    if (!storyId) {
      showError('Vui lòng chọn truyện');
      return false;
    }

    for (const chapter of chapters) {
      if (!chapter.title.trim()) {
        showError('Vui lòng nhập tên cho tất cả các chương');
        return false;
      }
      if (!chapter.content.trim()) {
        showError('Vui lòng nhập nội dung cho tất cả các chương');
        return false;
      }
    }

    // Check for duplicate chapter numbers
    const chapterNumbers = chapters.map(c => c.chapter_number);
    const duplicates = chapterNumbers.filter((num, index) => chapterNumbers.indexOf(num) !== index);
    if (duplicates.length > 0) {
      showError('Số chương không được trùng lặp');
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    if (!validateChapters()) return;
    
    setConfirmModal({
      isOpen: true,
      title: 'Xác nhận thêm chương',
      message: `Bạn có chắc muốn thêm ${chapters.length} chương vào truyện "${selectedStory?.title}"?`
    });
  };

  const confirmSubmit = async () => {
    setConfirmModal({ isOpen: false, title: '', message: '' });
    setLoading(true);

    try {
      const promises = chapters.map(chapter => 
        chaptersApi.create({
          story_id: parseInt(storyId),
          title: chapter.title,
          content: chapter.content,
          chapter_number: chapter.chapter_number
        })
      );

      const results = await Promise.all(promises);
      const successCount = results.filter(result => result.data.success).length;
      const failCount = results.length - successCount;

      if (successCount === results.length) {
        showSuccess(`Thêm thành công ${successCount} chương!`);
        navigate(`/admin/chapters?story_id=${storyId}`);
      } else if (successCount > 0) {
        showError(`Thêm thành công ${successCount} chương, ${failCount} chương thất bại`);
      } else {
        showError('Không thể thêm chương nào. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Error adding chapters:', error);
      showError('Có lỗi xảy ra khi thêm chương');
    } finally {
      setLoading(false);
    }
  };

  const cancelSubmit = () => {
    setConfirmModal({ isOpen: false, title: '', message: '' });
  };

  return (
    <div className="bulk-add-chapters">
      <div className="page-header">
        <h1 className="page-title">📚 Thêm nhiều chương</h1>
        <div className="page-actions">
          <button 
            onClick={() => navigate('/admin/chapters')} 
            className="btn-admin btn-secondary"
          >
            ← Quay lại
          </button>
        </div>
      </div>

      <div className="admin-card">
        <div className="story-selector">
          <label htmlFor="story-select">Chọn truyện:</label>
          <select
            id="story-select"
            value={storyId}
            onChange={(e) => setStoryId(e.target.value)}
            className="story-select"
            disabled={loading}
          >
            <option value="">-- Chọn truyện --</option>
            {stories.map(story => (
              <option key={story.id} value={story.id}>
                {story.title} ({story.chapter_count || 0} chương)
              </option>
            ))}
          </select>
        </div>

        {selectedStory && (
          <div className="story-info">
            <h3>📖 {selectedStory.title}</h3>
            <p>Số chương hiện tại: {Number(selectedStory.chapter_count) || 0}</p>
            <p>Chương tiếp theo sẽ bắt đầu từ số: {(Number(selectedStory.chapter_count) || 0) + 1}</p>
          </div>
        )}

        <div className="chapters-form">
          {chapters.map((chapter, index) => (
            <div key={chapter.id} className="chapter-form-item">
              <div className="chapter-header">
                <h4>Chương {chapter.chapter_number}</h4>
                {chapters.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeChapter(chapter.id)}
                    className="btn-remove"
                    disabled={loading}
                  >
                    🗑️
                  </button>
                )}
              </div>
              
              <div className="form-group">
                <label>Số chương:</label>
                <input
                  type="number"
                  value={chapter.chapter_number}
                  onChange={(e) => updateChapter(chapter.id, 'chapter_number', parseInt(e.target.value) || 1)}
                  className="form-input"
                  min="1"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>Tên chương:</label>
                <input
                  type="text"
                  value={chapter.title}
                  onChange={(e) => updateChapter(chapter.id, 'title', e.target.value)}
                  className="form-input"
                  placeholder="Nhập tên chương..."
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>Nội dung:</label>
                <textarea
                  value={chapter.content}
                  onChange={(e) => updateChapter(chapter.id, 'content', e.target.value)}
                  className="form-textarea"
                  placeholder="Nhập nội dung chương..."
                  rows={8}
                  disabled={loading}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={handleSubmit}
            className="btn-admin btn-success"
            disabled={loading || !storyId || chapters.length === 0}
          >
            {loading ? '⏳ Đang xử lý...' : `💾 Lưu ${chapters.length} chương`}
          </button>
          <button
            type="button"
            onClick={addChapter}
            className="btn-admin btn-primary"
            disabled={loading}
            style={{ marginLeft: 16 }}
          >
            ➕ Thêm chương
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Xác nhận"
        cancelText="Hủy"
        onConfirm={confirmSubmit}
        onCancel={cancelSubmit}
        type="info"
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

export default BulkAddChapters;
