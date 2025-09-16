import React, { useEffect, useState } from 'react';
import styles from './AdminFeaturedStories.module.css';
import { storiesApi, featuredStoriesApi } from '../../services/api';
import { Story } from '../../services/api';

interface FeaturedStory {
  id: number; // id của featured_stories
  story_id: number;
  sort_order: number;
  story: Story;
}

const AdminFeaturedStories: React.FC = () => {
  const [featured, setFeatured] = useState<FeaturedStory[]>([]);
  const [allStories, setAllStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedStory, setSelectedStory] = useState<number|null>(null);
  const [error, setError] = useState<string|null>(null);
  const [largeImageUrl, setLargeImageUrl] = useState<string>('');

  useEffect(() => {
    fetchFeatured();
    fetchStories();
  }, []);

  const fetchFeatured = async () => {
    setLoading(true);
    try {
      const res = await featuredStoriesApi.getAll();
      const arr = Array.isArray(res.data.data) ? res.data.data : [];
      setFeatured(
        arr.map((item: any) => ({
          id: item.id,
          story_id: item.story_id,
          sort_order: item.sort_order,
          story: {
            id: item.story_id,
            title: item.title,
            author: item.author,
            cover_image: item.cover_image,
            slug: item.slug,
            description: item.description,
            status: item.status,
            category_id: item.category_id,
          }
        }))
      );
    } catch (err) {
      setError('Không thể tải danh sách truyện nổi bật');
    }
    setLoading(false);
  };

  const fetchStories = async () => {
    try {
      const res = await storiesApi.getAll();
      setAllStories(res.data.data);
    } catch {}
  };

  const handleAdd = async () => {
    if (!selectedStory) return;
    setLoading(true);
    setError(null);
    try {
      const res = await featuredStoriesApi.add(selectedStory, largeImageUrl);
      if (res.data && !res.data.success) {
        setError(res.data.message || 'Không thể thêm truyện');
        setLoading(false);
        return;
      }
      setShowAdd(false);
      setSelectedStory(null);
      setLargeImageUrl('');
      fetchFeatured();
    } catch (err: any) {
      setError('Không thể thêm truyện');
    }
    setLoading(false);
  };

  const handleRemove = async (fid: number) => {
    setLoading(true);
    try {
      await featuredStoriesApi.remove(fid);
      fetchFeatured();
    } catch {
      setError('Không thể xóa truyện');
    }
    setLoading(false);
  };

  const handleMove = async (fid: number, direction: 'up'|'down') => {
    setLoading(true);
    try {
      await featuredStoriesApi.move(fid, direction);
      fetchFeatured();
    } catch {
      setError('Không thể sắp xếp');
    }
    setLoading(false);
  };

  return (
    <div className={styles.wrapper}>
      <h2>Quản lý Truyện Nổi Bật (Featured Stories)</h2>
      {error && <div className={styles.error}>{error}</div>}
      <button onClick={() => setShowAdd(true)}>+ Thêm truyện nổi bật</button>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>STT</th>
            <th>Ảnh bìa</th>
            <th>Tên truyện</th>
            <th>Tác giả</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(featured) && featured.map((item, idx) => (
            <tr key={item.id}>
              <td>{idx+1}</td>
              <td><img src={item.story.cover_image} alt={item.story.title} width={48} /></td>
              <td>{item.story.title}</td>
              <td>{item.story.author}</td>
              <td>
                <button onClick={() => handleMove(item.id, 'up')} disabled={idx===0}>↑</button>
                <button onClick={() => handleMove(item.id, 'down')} disabled={idx===featured.length-1}>↓</button>
                <button onClick={() => handleRemove(item.id)}>Xóa</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {showAdd && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Chọn truyện để thêm</h3>
{error && <div className={styles.error}>{error}</div>}
            <select value={selectedStory||''} onChange={e => setSelectedStory(Number(e.target.value))}>
              <option value="">--Chọn truyện--</option>
              {allStories.filter(s => !featured.some(f => f.story_id === s.id)).map(story => (
                <option value={story.id} key={story.id}>{story.title}</option>
              ))}
            </select>
            <label style={{marginTop:8,display:'block'}}>URL ảnh lớn (nền):
              <input type="text" value={largeImageUrl} onChange={e => setLargeImageUrl(e.target.value)} placeholder="https://..." style={{width:'100%'}} />
            </label>
            <button onClick={handleAdd} disabled={!selectedStory}>Thêm</button>
            <button onClick={() => { setShowAdd(false); setLargeImageUrl(''); }}>Đóng</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFeaturedStories;
