// src/components/ForgotPassword/ForgotPassword.tsx
import React from 'react';
import './ForgotPassword.css';
import { Link } from 'react-router-dom';
import { useForgotPassword } from '../../hooks/useForgotPassword';

export const ForgotPassword: React.FC = () => {
  const {
    email,
    setEmail,
    status,
    message,
    handleSubmit,
  } = useForgotPassword();

  return (
    <div className="forgot-password-container">
      <main className="main-layout">
        
        {/* Left Side: Immersive Imagery (Chỉ hiển thị trên màn hình lớn) */}
        <section className="imagery-section">
          <div className="background-wrapper">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDwKoj7nvDdh8o9yi9G_HepW-a_yxYTmtkmxGXOJnU0fHiZN4M_WaImPVJcp6FrIRLEu07Tl1ek1HP0FiJdC7LMGvkYeh68YJMwE9RkJ1Me9rydx7X8QYYOCwORKjj5xdqOCDZJk8ObuYZmJI-rTL8xX9az6tUeM6vSDbVO7-09EB5nPKNQNatZ5BH9b-gNcK-tbeYpE1D0IDIABhyMFAAiifMcw670ZmAmChXnbFHFBtRJN2dFpbpx4DkoLOEH_TB_qFer1Jx7N1KC" 
              alt="Smart Mushroom Farm" 
              className="bg-image"
            />
            <div className="gradient-overlay"></div>
          </div>
          
          {/* Glassmorphism Overlays */}
          <div className="glass-overlays-container">
            <div className="glass-card">
              <div className="glass-card-header">
                <div className="icon-wrapper primary-icon">
                  <span className="material-symbols-outlined">monitoring</span>
                </div>
                <h3 className="card-title">Phản Hồi Sinh Học Thời Gian Thực</h3>
              </div>
              <p className="card-description">
                Cảm biến độ chính xác cao giám sát CO2, độ ẩm và nhiệt độ mỗi 4 giây để đảm bảo sợi nấm phát triển tối ưu và đạt năng suất thu hoạch tốt nhất.
              </p>
            </div>

            <div className="glass-card self-end">
              <div className="glass-card-header">
                <div className="icon-wrapper secondary-icon">
                  <span className="material-symbols-outlined">psychology</span>
                </div>
                <h3 className="card-title">Tối Ưu Hóa Tăng Trưởng Bằng AI</h3>
              </div>
              <p className="card-description">
                Thuật toán AI dự đoán thời điểm nấm ra quả thể với độ chính xác 99.4%, giảm thiểu lãng phí và tối đa hóa lợi nhuận trang trại.
              </p>
            </div>
          </div>

          {/* Branding Anchor */}
          <div className="branding-anchor">
            <div className="branding-logo">
              <span className="material-symbols-outlined fill-icon">spa</span>
            </div>
            <span className="branding-text">Mycelium Intelligence</span>
          </div>
        </section>

        {/* Right Side: Interface */}
        <section className="form-section">
          <div className="form-content">
            
            {/* Mobile Logo */}
            <div className="mobile-logo">
              <span className="material-symbols-outlined logo-icon">spa</span>
              <span className="logo-text">Mycelium Intelligence</span>
            </div>

            <div className="header-text">
              <h1 className="main-title">Quên Mật Khẩu</h1>
              <p className="subtitle">
                Nhập địa chỉ email của bạn để nhận mã xác thực OTP khôi phục mật khẩu tài khoản trang trại của bạn.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="form-fields">
              <div className="form-group">
                <label className="input-label" htmlFor="email">Địa chỉ Email</label>
                <div className="input-relative">
                  <div className="input-icon-wrapper">
                    <span className="material-symbols-outlined">mail</span>
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    disabled={status === 'loading' || status === 'success'}
                    placeholder="name@farm-mycelium.ai"
                    className="form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Error Alert */}
              {status === 'error' && (
                <div className="alert-message error-alert">
                  <span className="material-symbols-outlined">error</span>
                  <span>{message}</span>
                </div>
              )}

              {/* Success Toast */}
              {status === 'success' && (
                <div className="alert-message success-alert">
                  <span className="material-symbols-outlined">check_circle</span>
                  <div>
                    <p className="font-semibold">Đã gửi mã OTP thành công!</p>
                    <p className="text-xs mt-1">
                      Hãy kiểm tra Gmail của bạn để lấy mã OTP đặt lại mật khẩu.
                    </p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'loading' || status === 'success'}
                className={`submit-button ${status === 'success' ? 'btn-success' : ''}`}
              >
                {status === 'loading' ? (
                  <>
                    <svg className="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="spinner-bg" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="spinner-path" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Đang gửi mã...</span>
                  </>
                ) : status === 'success' ? (
                  <>
                    <span className="material-symbols-outlined">check_circle</span>
                    <span>Đã Gửi OTP</span>
                  </>
                ) : (
                  <>
                    <span>Gửi mã xác thực OTP</span>
                    <span className="material-symbols-outlined arrow-icon">arrow_forward</span>
                  </>
                )}
              </button>
            </form>

            <div className="bottom-navigation">
              <Link to="/login" className="back-link">
                <span className="material-symbols-outlined arrow-back">arrow_back</span>
                Quay lại Đăng nhập
              </Link>
            </div>

            {/* Footer Support */}
            <div className="support-footer">
              <p className="footer-title">Hệ Thống Mạng Lưới Toàn Cầu</p>
              <div className="footer-links">
                <a href="#doc" className="footer-link">Tài liệu hướng dẫn</a>
                <span className="bullet">•</span>
                <a href="#support" className="footer-link">Hỗ trợ kỹ thuật</a>
              </div>
            </div>

          </div>
        </section>

      </main>
    </div>
  );
};

export default ForgotPassword;