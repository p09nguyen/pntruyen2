import React, { useEffect, useState } from 'react';
import { storiesApi, chaptersApi, usersApi, categoriesApi } from '../../services/api';
import { Bar, Pie, Line } from 'react-chartjs-2';
import 'chart.js/auto';
import './AdminStats.css';

import { useRef } from 'react';

const AdminStats: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStories: 0,
    totalChapters: 0,
    totalUsers: 0,
    totalCategories: 0,
    totalViews: 0,
    storiesPerCategory: [] as { name: string, count: number }[],
    chaptersPerDay: [] as { date: string, count: number }[],
    userRoles: [] as { role: string, count: number }[],
  });
  const [fromDate, setFromDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [topStories, setTopStories] = useState<any[]>([]);
  const [topViewed, setTopViewed] = useState<{ id: number; title: string; slug?: string; views: number }[]>([]);

  useEffect(() => {
    loadStats();
    // eslint-disable-next-line
  }, [fromDate, toDate]);

  const loadStats = async () => {
    setLoading(true);
    try {
      // Lấy tổng số liệu từ API stats.php?action=global
      const statsRes = await fetch('https://pntruyen.online/api/stats.php?action=global').then(res => res.json());
      let globalStats = {
        totalStories: 0,
        totalChapters: 0,
        totalUsers: 0,
        totalCategories: 0,
      };
      if (statsRes.success && statsRes.data) {
        globalStats = statsRes.data;
      }
      // Lấy dữ liệu chi tiết cho chart/bảng
      const [storiesRes, usersRes, categoriesRes, popularRes, viewsGlobalRes, viewsByStoryRes] = await Promise.all([
        storiesApi.getAll({ limit: 1000 }),
        usersApi.getAll({ limit: 1000 }),
        categoriesApi.getAll(1, 100),
        fetch('https://pntruyen.online/api/story-views-stats.php?limit=5').then(res => res.json()),
        fetch('https://pntruyen.online/api/stats.php?action=views_global').then(res => res.json()).catch(() => ({ success: false })),
        fetch('https://pntruyen.online/api/stats.php?action=views_by_story&limit=8').then(res => res.json()).catch(() => ({ success: false, data: [] })),
      ]);
      const stories = storiesRes.data.data || [];
      const users = Array.isArray(usersRes.data.data) ? usersRes.data.data : [];
      const categories = categoriesRes.data.data || [];
      const topStories = Array.isArray(popularRes.data) ? popularRes.data : [];
      const totalViews = viewsGlobalRes && viewsGlobalRes.success ? (viewsGlobalRes.data?.totalViews || 0) : 0;
      const topViewedData = viewsByStoryRes && viewsByStoryRes.success ? (viewsByStoryRes.data || []) : [];

      // Thống kê số truyện theo thể loại (nhiều thể loại)
      const storiesPerCategory: { name: string, count: number }[] = categories.map((cat: any) => ({
        name: cat.name,
        count: stories.filter((s: any) => Array.isArray(s.categories) && s.categories.some((c: any) => c.id === cat.id)).length
      }));
      // Thống kê số chương theo ngày (theo filter)
      const from = fromDate;
      const to = toDate;
      const daysArr = [];
      let d = new Date(from);
      const end = new Date(to);
      while (d <= end) {
        daysArr.push(d.toISOString().slice(0, 10));
        d.setDate(d.getDate() + 1);
      }
      let chaptersPerDay: { date: string, count: number }[] = [];
      try {
        const res = await fetch(`https://pntruyen.online/api/stats.php?action=chapters_per_day&from=${from}&to=${to}`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          chaptersPerDay = daysArr.map(date => {
            const found = json.data.find((d: any) => d.date === date);
            return { date, count: found ? Number(found.count) : 0 };
          });
        } else {
          chaptersPerDay = daysArr.map(date => ({ date, count: 0 }));
        }
      } catch {
        chaptersPerDay = daysArr.map(date => ({ date, count: 0 }));
      }
      // Thống kê user theo role
      const roleMap = new Map<string, number>();
      users.forEach((u: any) => {
        if (u.role) roleMap.set(u.role, (roleMap.get(u.role) || 0) + 1);
      });
      const userRoles = Array.from(roleMap.entries()).map(([role, count]) => ({ role, count }));
      setStats({
        totalStories: globalStats.totalStories,
        totalChapters: globalStats.totalChapters,
        totalUsers: globalStats.totalUsers,
        totalCategories: globalStats.totalCategories,
        totalViews,
        storiesPerCategory,
        chaptersPerDay,
        userRoles,
      });
      setTopStories(topStories);
      setTopViewed(topViewedData);
      console.log('Stats state:', {
        totalStories: globalStats.totalStories,
        totalChapters: globalStats.totalChapters,
        totalUsers: globalStats.totalUsers,
        totalCategories: globalStats.totalCategories,
        storiesPerCategory,
        chaptersPerDay,
        userRoles,
      });
    } catch (e) {
      // eslint-disable-next-line
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="admin-stats"><div className="admin-card">Đang tải thống kê...</div></div>;
  if (!stats || (!stats.totalStories && !stats.totalChapters && !stats.totalUsers)) {
    return <div className="admin-stats"><div className="admin-card">Không có dữ liệu thống kê hoặc dữ liệu rỗng.</div></div>;
  }

  return (
    <div className="admin-stats">
      <h2 className="stats-header">Thống kê tổng quan</h2>
      <div className="stats-summary">
        <div><span>{stats.totalStories}</span><br />Truyện</div>
        <div><span>{stats.totalChapters}</span><br />Chương</div>
        <div><span>{stats.totalUsers}</span><br />Người dùng</div>
        <div><span>{stats.totalCategories}</span><br />Thể loại</div>
        <div><span>{stats.totalViews}</span><br />Tổng lượt xem</div>
      </div>
      <div className="stats-filters" style={{ margin: '20px 0', display: 'flex', gap: 16, alignItems: 'center' }}>
        <label>
          Từ ngày:
          <input type="date" value={fromDate} max={toDate} onChange={e => setFromDate(e.target.value)} />
        </label>
        <label>
          Đến ngày:
          <input type="date" value={toDate} min={fromDate} max={new Date().toISOString().slice(0,10)} onChange={e => setToDate(e.target.value)} />
        </label>
      </div>
      <div className="stats-charts">
        <div>
          <h3>Truyện theo thể loại</h3>
          <div className="chart-container">
            <Bar
              data={{
                labels: stats.storiesPerCategory.map(c => c.name),
                datasets: [{
                  label: 'Số truyện',
                  data: stats.storiesPerCategory.map(c => c.count),
                  backgroundColor: '#52a9ff',
                }],
              }}
              options={{
                plugins: { legend: { display: false } },
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true } }
              }}
              height={260}
            />
          </div>
        </div>
        <div>
          <h3>Top truyện theo lượt xem</h3>
          <div className="chart-container">
            <Bar
              data={{
                labels: topViewed.map(s => s.title?.length > 16 ? s.title.slice(0, 16) + '…' : s.title),
                datasets: [{
                  label: 'Lượt xem',
                  data: topViewed.map(s => s.views),
                  backgroundColor: '#f59e0b',
                }],
              }}
              options={{
                plugins: { legend: { display: false } },
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true } }
              }}
              height={260}
            />
          </div>
        </div>
        <div>
          <h3>Số chương đăng theo ngày</h3>
          <div className="chart-container">
            <Line
              data={{
                labels: stats.chaptersPerDay.map(d => d.date),
                datasets: [{
                  label: 'Số chương',
                  data: stats.chaptersPerDay.map(d => d.count),
                  borderColor: '#1976d2',
                  backgroundColor: 'rgba(25,118,210,0.15)',
                  tension: 0.35,
                  fill: true,
                }],
              }}
              options={{
                plugins: { legend: { display: false } },
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true } }
              }}
              height={260}
            />
          </div>
        </div>
        <div>
          <h3>Tỉ lệ vai trò tài khoản</h3>
          <div className="chart-container">
            <Pie
              data={{
                labels: stats.userRoles.map(r => r.role === 'admin' ? 'Quản trị viên' : 'Người dùng'),
                datasets: [{
                  data: stats.userRoles.map(r => r.count),
                  backgroundColor: ['#1976d2', '#52a9ff'],
                }],
              }}
              options={{
                plugins: { legend: { position: 'bottom' } },
                responsive: true,
                maintainAspectRatio: false,
              }}
              height={260}
            />
          </div>
        </div>
        {/* Bảng Top truyện nhiều lượt đọc nhất */}
        <div className="top-stories-table" style={{ marginTop: 32 }}>
          <h3>Top truyện nhiều lượt đọc nhất</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8, boxShadow: '0 1px 8px #eee' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: 8, border: '1px solid #eee' }}>#</th>
                <th style={{ padding: 8, border: '1px solid #eee' }}>Tên truyện</th>
                <th style={{ padding: 8, border: '1px solid #eee' }}>Tác giả</th>
                <th style={{ padding: 8, border: '1px solid #eee' }}>Lượt đọc</th>
                <th style={{ padding: 8, border: '1px solid #eee' }}>Số chương</th>
              </tr>
            </thead>
            <tbody>
              {topStories.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 16 }}>Không có dữ liệu</td></tr>
              ) : (
                topStories.map((story, idx) => (
                  <tr key={story.id}>
                    <td style={{ padding: 8, border: '1px solid #eee', textAlign: 'center' }}>{idx+1}</td>
                    <td style={{ padding: 8, border: '1px solid #eee' }}>{story.title}</td>
                    <td style={{ padding: 8, border: '1px solid #eee' }}>{story.author}</td>
                    <td style={{ padding: 8, border: '1px solid #eee', textAlign: 'right' }}>{story.view_count}</td>
                    <td style={{ padding: 8, border: '1px solid #eee', textAlign: 'right' }}>{story.chapter_count}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminStats;
