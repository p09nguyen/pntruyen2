import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './FeaturedStories.module.css';

// Định nghĩa kiểu dữ liệu truyện nổi bật
interface FeaturedStory {
  id: number;
  story_id: number;
  sort_order: number;
  large_image?: string;
  title: string;
  author: string;
  cover_image: string;
  slug: string;
  description: string;
  status: string;
  category_id: number;
}

// Tạm thởi mock data nếu chưa có API
const mockFeaturedStories: FeaturedStory[] = [
  {
    id: 1,
    story_id: 1,
    sort_order: 1,
    large_image: 'https://example.com/large-image-1.jpg',
    title: 'Bí Kíp Luyện Rồng',
    author: 'Cressida Cowell',
    cover_image: 'https://cdn.popsww.com/blog/sites/2/2023/07/top-20-truyen-tien-hiep-hay-nhat.jpg',
    slug: 'bi-kip-luyen-rong',
    description: 'Câu chuyện về một chàng trai trẻ và rồng...',
    status: 'completed',
    category_id: 1,
  },
  {
    id: 2,
    story_id: 2,
    sort_order: 2,
    large_image: 'https://example.com/large-image-2.jpg',
    title: 'Xuyên Không Tây Du',
    author: 'Nguyễn Văn A',
    cover_image: 'https://i.imgur.com/4M34hi2.jpg',
    slug: 'xuyen-khong-tay-du',
    description: 'Một hành trình kỳ lạ đến Tây Du...',
    status: 'ongoing',
    category_id: 2,
  },
  {
    id: 3,
    story_id: 3,
    sort_order: 3,
    large_image: 'https://example.com/large-image-3.jpg',
    title: 'Xuyên Không Tây Du',
    author: 'Nguyễn Văn A',
    cover_image: 'https://i.imgur.com/4M34hi2.jpg',
    slug: 'xuyen-khong-tay-du',
    description: 'Một hành trình kỳ lạ đến Tây Du...',
    status: 'ongoing',
    category_id: 2,
  },
  {
    id: 4,
    story_id: 4,
    sort_order: 4,
    large_image: 'https://example.com/large-image-4.jpg',
    title: 'Xuyên Không Tây Du',
    author: 'Nguyễn Văn A',
    cover_image: 'https://i.imgur.com/4M34hi2.jpg',
    slug: 'xuyen-khong-tay-du',
    description: 'Một hành trình kỳ lạ đến Tây Du...',
    status: 'ongoing',
    category_id: 2,
  },
  // Thêm các truyện khác nếu muốn
];

const FeaturedStories: React.FC = () => {
  const [featuredStories, setFeaturedStories] = useState<FeaturedStory[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const thumbnailsRef = useRef<HTMLDivElement>(null);
  const [scrollThumb, setScrollThumb] = useState({ left: 0, width: 0 });

  useEffect(() => {
    // Fetch từ API thực tế
    import('../services/api').then(({ featuredStoriesApi }) => {
      featuredStoriesApi.getAll()
        .then(res => {
          if (res.data && res.data.success && Array.isArray(res.data.data)) {
            setFeaturedStories(res.data.data);
          } else {
            setFeaturedStories([]);
          }
        })
        .catch(() => setFeaturedStories([]));
    });
  }, []);

  // Logic update thumb vị trí/chiều rộng
  useEffect(() => {
    const el = thumbnailsRef.current;
    if (!el) return;
    const updateThumb = () => {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      const ratio = clientWidth / scrollWidth;
      setScrollThumb({
        left: (scrollLeft / scrollWidth) * clientWidth,
        width: ratio * clientWidth,
      });
    };
    updateThumb();
    el.addEventListener('scroll', updateThumb);
    window.addEventListener('resize', updateThumb);
    return () => {
      el.removeEventListener('scroll', updateThumb);
      window.removeEventListener('resize', updateThumb);
    };
  }, [featuredStories.length]);

  // Logic kéo-thả thanh scrollbar giả
  useEffect(() => {
    const el = thumbnailsRef.current;
    if (!el) return;
    let dragging = false;
    let startX = 0;
    let startScroll = 0;
    const onMouseDown = (e: MouseEvent) => {
      dragging = true;
      startX = e.clientX;
      startScroll = el.scrollLeft;
      document.body.style.userSelect = 'none';
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging) return;
      const { scrollWidth, clientWidth } = el;
      const maxScroll = scrollWidth - clientWidth;
      const scrollArea = clientWidth - scrollThumb.width;
      if (scrollArea <= 0) return;
      const dx = e.clientX - startX;
      const deltaScroll = (dx / scrollArea) * maxScroll;
      el.scrollLeft = Math.min(Math.max(startScroll + deltaScroll, 0), maxScroll);
    };
    const onMouseUp = () => {
      dragging = false;
      document.body.style.userSelect = '';
    };
    // Gắn sự kiện vào thumb
    const thumb = document.getElementById('custom-scrollbar-thumb');
    if (thumb) {
      thumb.addEventListener('mousedown', onMouseDown);
    }
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      if (thumb) thumb.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [scrollThumb.width]);

  if (featuredStories.length === 0) return null;
  const activeStory = featuredStories[activeIndex];

  return (
    <div className={styles['featured-wrapper']}>
      <div
        className={styles['featured-main']}
        style={{ backgroundImage: `url(${activeStory.large_image || activeStory.cover_image})` }}
      >
        <div className={styles['featured-info']}>
          <h2 className={styles['featured-title']}>{activeStory.title}</h2>
          <div className={styles['featured-meta']}>
            <span>Tác giả: {activeStory.author}</span>
            {activeStory.status && <span> | Tình trạng: {activeStory.status === 'completed' ? 'Hoàn thành' : 'Đang ra'}</span>}
          </div>
          <p className={styles['featured-desc']}>{activeStory.description}</p>
          <Link to={`/truyen/${activeStory.slug}`} className={styles['featured-read-btn']}>
            Đọc
          </Link>
        </div>
        <div className={styles['featured-thumbnails']} ref={thumbnailsRef}>
          {featuredStories.map((story, idx) => (
            <div
              key={`${story.id}-${idx}`}
              className={styles['thumbnail'] + (idx === activeIndex ? ' ' + styles['active'] : '')}
              onClick={() => setActiveIndex(idx)}
              style={{ backgroundImage: `url(${story.cover_image})` }}
              title={story.title}
            />
          ))}
          <div className={styles['custom-scrollbar']}>
            <div
              id="custom-scrollbar-thumb"
              className={styles['custom-scrollbar-thumb']}
              style={{ left: scrollThumb.left, width: scrollThumb.width, cursor: 'pointer' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturedStories;
