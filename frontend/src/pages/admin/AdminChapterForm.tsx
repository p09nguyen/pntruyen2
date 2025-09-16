import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { chaptersApi, storiesApi, Story } from '../../services/api';
import Toast from '../../components/Toast';
import './AdminChapterForm.css';

const AdminChapterForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isEdit = Boolean(id);

  const [stories, setStories] = useState<Story[]>([]);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error'; visible: boolean}>({message: '', type: 'success', visible: false});
  const [formData, setFormData] = useState({
    story_id: '',
    title: '',
    content: '',
    chapter_number: 1
  });

  // Hàm lấy số chương lớn nhất của truyện và set chapter_number + 1
  const loadMaxChapterNumber = async (storyId: string) => {
    try {
      const res = await chaptersApi.getByStoryId(Number(storyId));
      if (res.data.success) {
        const chapters = res.data.data;
        const maxChapter = chapters.length > 0
          ? Math.max(...chapters.map((c: any) => Number(c.chapter_number)))
          : 0;
        setFormData(prev => ({
          ...prev,
          chapter_number: maxChapter + 1
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          chapter_number: 1
        }));
      }
    } catch (err) {
      setFormData(prev => ({
        ...prev,
        chapter_number: 1
      }));
    }
  };

  useEffect(() => {
    loadStories();
    if (isEdit && id) {
      loadChapter(parseInt(id));
    } else {
      // If creating new chapter, get story_id from URL params
      const storyId = searchParams.get('story_id');
      if (storyId) {
        setFormData(prev => ({ ...prev, story_id: storyId }));
        // Nếu có sẵn story_id và không phải edit, tự động lấy số chương tiếp theo
        if (!isEdit) {
          loadMaxChapterNumber(storyId);
        }
      }
    }
  }, [isEdit, id, searchParams]);

  useEffect(() => {
    if (formData.story_id && stories.length > 0) {
      const story = stories.find(s => s.id === parseInt(formData.story_id));
      setSelectedStory(story || null);
      // Không set chapter_number ở đây nữa, đã xử lý ở handleChange và init
    }
  }, [formData.story_id, stories, isEdit]);

  const loadStories = async () => {
    try {
      const response = await storiesApi.getAll({ limit: 100 });
      if (response.data.success) {
        setStories(response.data.data);
      }
    } catch (error) {
      console.error('Error loading stories:', error);
    }
  };

  const loadChapter = async (chapterId: number) => {
    try {
      const response = await chaptersApi.getById(chapterId);
      if (response.data.success) {
        const chapter = response.data.data;
        setFormData({
          story_id: chapter.story_id.toString(),
          title: chapter.title,
          content: chapter.content,
          chapter_number: chapter.chapter_number
        });
      }
    } catch (error) {
      console.error('Error loading chapter:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const showToast = (message: string, type: 'success' | 'error') => {
      setToast({ message, type, visible: true });
      setTimeout(() => setToast(t => ({ ...t, visible: false })), 2500);
    };

    try {
      const submitData = {
        ...formData,
        story_id: parseInt(formData.story_id),
        chapter_number: parseInt(formData.chapter_number.toString())
      };

      if (isEdit && id) {
        const response = await chaptersApi.update(parseInt(id), submitData);
        if (response.data.success) {
          showToast('Cập nhật chương thành công!', 'success');
          setTimeout(() => navigate(`/admin/chapters?story_id=${formData.story_id}`), 1200);
        } else {
          showToast('Có lỗi xảy ra khi cập nhật chương.', 'error');
        }
      } else {
        const response = await chaptersApi.create(submitData);
        if (response.data.success) {
          showToast('Thêm chương thành công!', 'success');
          setTimeout(() => navigate(`/admin/chapters?story_id=${formData.story_id}`), 1200);
        } else {
          showToast('Có lỗi xảy ra khi thêm chương.', 'error');
        }
      }
    } catch (error) {
      console.error('Error saving chapter:', error);
      showToast('Có lỗi xảy ra khi lưu chương.', 'error');
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Nếu chọn truyện mới và không phải edit, tự động lấy số chương tiếp theo
    if (name === "story_id" && !isEdit) {
      loadMaxChapterNumber(value);
    }
  };


  return (
    <div className="admin-chapter-form">
      <div className="page-header">
        <h1 className="page-title">
          {isEdit ? '✏️ Chỉnh sửa chương' : '➕ Thêm chương mới'}
        </h1>
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
        <form onSubmit={handleSubmit} className="chapter-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="story_id">Truyện *</label>
              <select
                id="story_id"
                name="story_id"
                value={formData.story_id}
                onChange={handleChange}
                required
                className="form-select"
                disabled={isEdit}
              >
                <option value="">-- Chọn truyện --</option>
                {stories.map(story => (
                  <option key={story.id} value={story.id}>
                    {story.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="chapter_number">Số chương *</label>
              <input
                type="number"
                id="chapter_number"
                name="chapter_number"
                value={formData.chapter_number}
                onChange={handleChange}
                required
                min="1"
                className="form-input"
              />
            </div>
          </div>

          {selectedStory && (
            <div className="story-info">
              <h3>📚 {selectedStory.title}</h3>
              <p>Tác giả: {selectedStory.author} | Số chương hiện tại: {selectedStory.chapter_count || 0}</p>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="title">Tiêu đề chương *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Nhập tiêu đề chương"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="content">Nội dung chương *</label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              required
              rows={20}
              placeholder="Nhập nội dung chương..."
              className="form-textarea"
            />
            <div className="content-info">
              <small>Số ký tự: {formData.content.length}</small>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/admin/chapters')}
              className="btn-admin btn-secondary"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || !formData.story_id}
              className="btn-admin btn-primary"
            >
              {loading ? 'Đang lưu...' : (isEdit ? 'Cập nhật' : 'Thêm mới')}
            </button>
          </div>
        </form>
      </div>
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.visible}
        onClose={() => setToast(t => ({ ...t, visible: false }))}
      />
    </div>
  );
};

export default AdminChapterForm;
