import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { storiesApi, categoriesApi, Category } from '../../services/api';
import Toast from '../../components/Toast';
import './AdminStoryForm.css';

const AdminStoryForm: React.FC = () => {
  console.log('AdminStoryForm component rendering...');
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  console.log('Component params:', { id, isEdit });

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error'; visible: boolean}>({message: '', type: 'success', visible: false});
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    status: 'ongoing',
    category_id: '',
    category_ids: [] as string[],
    cover_image: '',
    show_on_home: false // Luôn mặc định là false khi tạo mới
  });
  

  // Toast helper để dùng mọi nơi
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2500);
  };

  useEffect(() => {
    const initializeForm = async () => {
      try {
        await loadCategories();
        if (isEdit && id) {
          await loadStory(parseInt(id));
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Error initializing form:', err);
        setError('Có lỗi xảy ra khi khởi tạo form.');
        setLoading(false);
      }
    };
    
    initializeForm();
  }, [isEdit, id]);
  
  const loadCategories = async () => {
    try {
      const response = await categoriesApi.getAll();
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadStory = async (storyId: number) => {
    try {
      console.log('Loading story with ID:', storyId);
      const response = await storiesApi.getById(storyId);
      console.log('Story API response:', response.data);
      
      if (response.data.success) {
        const story = response.data.data;
        console.log('Story data:', story);
        setFormData({
          title: story.title || '',
          author: story.author || '',
          description: story.description || '',
          status: story.status || 'ongoing',
          category_id: story.category_id ? String(story.category_id) : (story.categories && story.categories.length > 0 ? String(story.categories[0].id) : ''),
          category_ids: story.categories ? story.categories.map((cat: any) => String(cat.id)) : [],
          cover_image: story.cover_image || '',
          show_on_home: Number(story.show_on_home) === 1 // Đúng chuẩn: chỉ tick nếu là 1
        });
      } else {
        console.error('API returned error:', response.data);
        alert('Không tìm thấy truyện hoặc có lỗi xảy ra.');
      }
    } catch (error) {
      console.error('Error loading story:', error);
      showToast('Có lỗi xảy ra khi tải thông tin truyện.', 'error');
    } finally {
      setLoading(false);
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
        show_on_home: formData.show_on_home ? 1 : 0,
        // Nếu category_id rỗng, tự lấy phần tử đầu của category_ids (nếu có)
        category_id: formData.category_id
          ? parseInt(formData.category_id)
          : (formData.category_ids.length > 0 ? parseInt(formData.category_ids[0]) : undefined),
        category_ids: Array.isArray(formData.category_ids) ? formData.category_ids.map(id => parseInt(id)) : [],
        status: formData.status as 'ongoing' | 'completed' | 'paused',
        cover_image: formData.cover_image || 'https://via.placeholder.com/300x400'
      };

      if (isEdit && id) {
        const response = await storiesApi.update(parseInt(id), submitData);
        if (response.data.success) {
          showToast('Cập nhật truyện thành công!', 'success');
          setTimeout(() => navigate('/admin/stories'), 1200);
        } else {
          showToast('Có lỗi xảy ra khi cập nhật truyện.', 'error');
        }
      } else {
        const response = await storiesApi.create(submitData);
        if (response.data.success) {
          showToast('Thêm truyện thành công!', 'success');
          setTimeout(() => navigate('/admin/stories'), 1200);
        } else {
          showToast('Có lỗi xảy ra khi thêm truyện.', 'error');
        }
      }
    } catch (error) {
      console.error('Error saving story:', error);
      showToast('Có lỗi xảy ra. Vui lòng thử lại.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  const { name, value, type } = e.target;
  // Xử lý chọn nhiều thể loại
  if (name === 'category_ids' && (e.target as HTMLSelectElement).multiple) {
    const options = (e.target as HTMLSelectElement).options;
    const selected = Array.from(options)
      .filter(option => option.selected)
      .map(option => option.value);
    setFormData(prev => ({
      ...prev,
      category_ids: selected
    }));
  } else if (type === 'checkbox') {
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({ ...prev, [name]: checked }));
  } else {
    setFormData(prev => ({ ...prev, [name]: value }));
  }
};

  if (loading) {
    return (
      <div className="admin-story-form">
        <div className="loading">
          <div className="spinner"></div>
          <p>Đang tải thông tin truyện...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-story-form">
        <div className="error">
          <h2>❌ Lỗi</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>🔄 Tải lại trang</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-story-form">
      <div className="page-header">
        <h1 className="page-title">
          {isEdit ? '✏️ Chỉnh sửa truyện' : '➕ Thêm truyện mới'}
        </h1>
        <div className="page-actions">
          <button 
            onClick={() => navigate('/admin/stories')} 
            className="btn-admin btn-secondary"
          >
            ← Quay lại
          </button>
        </div>
      </div>

      <div className="admin-card">
        <form onSubmit={handleSubmit} className="story-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="title">Tên truyện *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Nhập tên truyện"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="author">Tác giả *</label>
              <input
                type="text"
                id="author"
                name="author"
                value={formData.author}
                onChange={handleChange}
                required
                placeholder="Nhập tên tác giả"
                className="form-input"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category_ids">Thể loại *</label>
              <select
                id="category_ids"
                name="category_ids"
                multiple
                value={formData.category_ids}
                onChange={handleChange}
                required
                className="form-select"
                style={{ minHeight: '100px' }}
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <small>Giữ Ctrl (Windows) hoặc Command (Mac) để chọn nhiều thể loại</small>
            </div>

            <div className="form-group">
              <label htmlFor="status">Trạng thái</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="form-select"
              >
                <option value="ongoing">Đang ra</option>
                <option value="completed">Hoàn thành</option>
                <option value="paused">Tạm dừng</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label style={{display: 'flex'}} className='hienthitrangchu'>
              <span>Hiển thị truyện này trên trang chủ</span>
              <input
                type="checkbox"
                name="show_on_home"
                checked={!!formData.show_on_home}
                onChange={handleChange}
              />
              
            </label>
          </div>

          <div className="form-group">
            <label htmlFor="cover_image">URL ảnh bìa</label>
            <input
              type="url"
              id="cover_image"
              name="cover_image"
              value={formData.cover_image}
              onChange={handleChange}
              placeholder="https://example.com/cover.jpg"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Mô tả truyện</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={6}
              placeholder="Nhập mô tả nội dung truyện..."
              className="form-textarea"
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/admin/stories')}
              className="btn-admin btn-secondary"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
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

export default AdminStoryForm;
