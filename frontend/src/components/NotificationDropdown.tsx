import React, { useEffect, useRef } from 'react';
import { notificationsApi, NotificationGroup, chaptersApi } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import styles from './NotificationDropdown.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  notifications: NotificationGroup[]; // group theo truyện
  onMarkRead: (id: number) => void;
  onMarkAllRead: () => void;
  onDelete: (id: number) => void;
}

const NotificationDropdown: React.FC<Props> = ({ open, onClose, notifications, onMarkRead, onMarkAllRead, onDelete }) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, onClose]);

  return (
    <div ref={dropdownRef} className={styles.dropdown + (open ? ' ' + styles.open : '')}>
      <div className={styles.header}>
        <span style={{color: '#000000'}}>Thông báo</span>
        <button className={styles.markAllBtn} onClick={onMarkAllRead}>Đánh dấu đã đọc tất cả</button>
      </div>
      <div className={styles.list}>
        {notifications.length === 0 ? (
          <div className={styles.empty}>Không có thông báo mới</div>
        ) : (
          notifications.map((group) => (
            <div key={group.story_id} className={styles.groupBlock}>
              <div className={styles.storyTitle}>{group.story_title}</div>
              <div className={styles.chapterList}>
                {group.chapters.map((chap) => (
                  <div key={chap.id} className={styles.item + (!chap.is_read ? ' ' + styles.unread : '')}>
                    <Link
                      to="#"
                      className={styles.link}
                      onClick={async (e) => {
                        e.preventDefault();
                        onMarkRead(chap.id);
                        // If we already have slugs, navigate directly
                        if (chap.slug && group.story_slug) {
                          navigate(`/truyen/${group.story_slug}/${chap.slug}`);
                          onClose();
                          return;
                        }
                        // Resolve via API
                        try {
                          const res = await chaptersApi.getById(chap.id);
                          if (res.data?.success && res.data?.data) {
                            const c = res.data.data;
                            if (c.story_slug && c.slug) {
                              navigate(`/truyen/${c.story_slug}/${c.slug}`);
                              onClose();
                              return;
                            }
                          }
                        } catch {}
                        // Fallback to id route
                        navigate(`/chapter/${chap.id}`);
                        onClose();
                      }}
                    >
                      <div className={styles.chapterInfo}>Chương {chap.chapter_number}: {chap.chapter_title}</div>
                      <div className={styles.time}>{new Date(chap.created_at).toLocaleString('vi-VN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
                    </Link>
                    <button className={styles.deleteBtn} onClick={() => onDelete(chap.id)}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;
