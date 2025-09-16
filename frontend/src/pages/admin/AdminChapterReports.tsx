import React, { useEffect, useState } from "react";
import axios from "axios";


interface Report {
  id: number;
  chapter_id: number;
  user_id: number | null;
  report_content: string;
  created_at: string;
  status: string;
  username?: string;
  chapter_title?: string;
  story_id?: number;
  story_title?: string;
}

const statusColors: Record<string, string> = {
  pending: "#ff9800",
  reviewed: "#4caf50",
  ignored: "#aaa",
};

const AdminChapterReports: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/chapter_reports.php?all=1");
      setReports(res.data.reports);
      setError(null);
    } catch (err) {
      setError("Không tải được danh sách báo lỗi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const updateStatus = async (id: number, status: string) => {
    setActionLoading(id);
    try {
      await axios.patch(`/api/chapter_reports.php?id=${id}`, { status });
      setReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      );
    } catch {
      alert("Cập nhật trạng thái thất bại!");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="admin-page">
      <h2>Quản lý báo lỗi chương</h2>
        {loading ? (
          <div>Đang tải...</div>
        ) : error ? (
          <div style={{ color: "red" }}>{error}</div>
        ) : reports.length === 0 ? (
          <div>Không có báo lỗi nào.</div>
        ) : (
          <table className="admin-table" style={{ fontSize: 15, width: "100%" }}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Truyện</th>
                <th>Chương</th>
                <th>Người báo</th>
                <th>Nội dung</th>
                <th>Thời gian</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id} style={{ background: r.status === "pending" ? "#fffbe6" : undefined }}>
                  <td>{r.id}</td>
                  <td>
                    {r.story_title ? (
                      <a href={`/story/${r.story_id}`} target="_blank" rel="noopener noreferrer">{r.story_title}</a>
                    ) : r.story_id}
                  </td>
                  <td>
                    {r.chapter_title ? (
                      <a href={`/chapter/${r.chapter_id}`} target="_blank" rel="noopener noreferrer">{r.chapter_title}</a>
                    ) : r.chapter_id}
                  </td>
                  <td>{r.username || <span style={{ color: '#888' }}>Khách</span>}</td>
                  <td style={{ maxWidth: 240, whiteSpace: "pre-line", overflowWrap: "break-word" }}>{r.report_content}</td>
                  <td>{new Date(r.created_at).toLocaleString("vi-VN")}</td>
                  <td>
                    <span style={{ color: statusColors[r.status] || '#555', fontWeight: 600 }}>
                      {r.status === 'pending' ? 'Chờ xử lý' : r.status === 'reviewed' ? 'Đã xử lý' : 'Bỏ qua'}
                    </span>
                  </td>
                  <td>
                    {r.status === 'pending' && (
                      <>
                        <button
                          style={{ marginRight: 6 }}
                          disabled={actionLoading === r.id}
                          onClick={() => updateStatus(r.id, 'reviewed')}
                        >
                          Đã xử lý
                        </button>
                        <button
                          disabled={actionLoading === r.id}
                          onClick={() => updateStatus(r.id, 'ignored')}
                        >
                          Bỏ qua
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

  );
};

export default AdminChapterReports;
