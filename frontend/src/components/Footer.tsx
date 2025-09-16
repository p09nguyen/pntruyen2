import React from 'react';
import './Footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
        

          {/* Thông tin pháp lý */}
          <div className="footer-section">
 
            <h5>Contact: pnreview0901@gmail.com</h5>
          </div>
        </div>

        {/* Thông tin bản quyền */}
        <div className="footer-bottom">
          <div className="footer-copyright">
            <p>&copy; 2025 PNTruyện. Tất cả quyền được bảo lưu.</p>
            <p>
              Website chỉ mang tính chất tham khảo, nghiêm cấm mọi hành vi sao chép nội dung khi chưa được sự đồng ý của chúng tôi.
            </p>
          </div>
          
        </div>
      </div>
    </footer>
  );
};

export default Footer;
