import React, { useState } from "react";
import axios from "axios";
import  './ReportChapterModal.css';
interface ReportChapterModalProps {
  chapterId: number;
  userId?: number;
  onClose: () => void;
}

const ReportChapterModal: React.FC<ReportChapterModalProps> = ({ chapterId, userId, onClose }) => {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError("Vui lòng nhập nội dung lỗi.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await axios.post("/api/chapter_reports.php", {
        chapter_id: chapterId,
        user_id: userId,
        report_content: content,
      });
      setSuccess(true);
    } catch (err) {
      setError("Gửi báo lỗi thất bại. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="modal-overlay">
        <div className="modal report-modal">
          <h3>Báo lỗi chương</h3>
          <p style={{ color: "green" }}>Cảm ơn bạn đã báo lỗi! Quản trị viên sẽ kiểm tra sớm.</p>
          <button onClick={onClose}>Đóng</button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal report-modal">
        <h3>Báo lỗi chương</h3>
        <form onSubmit={handleSubmit}>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={4}
            placeholder="Nhập nội dung lỗi chương này..."
            required
            style={{ marginBottom: 8 }}
          />
          {error && <div style={{ color: "red", marginBottom: 8 }}>{error}</div>}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button type="button" onClick={onClose} disabled={loading}>Hủy</button>
            <button type="submit" disabled={loading}>{loading ? "Đang gửi..." : "Gửi báo lỗi"}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportChapterModal;
