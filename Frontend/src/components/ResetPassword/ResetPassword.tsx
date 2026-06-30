// src/components/ResetPassword/ResetPassword.tsx
import React from 'react';
import './ResetPassword.css';
import { Link } from 'react-router-dom';
import { useResetPassword } from '../../hooks/useResetPassword';

export const ResetPassword: React.FC = () => {
  const {
    email, setEmail,
    otp, setOtp,
    resetToken,
    newPassword, setNewPassword,
    confirmPassword, setConfirmPassword,
    showNewPassword, setShowNewPassword,
    showConfirmPassword, setShowConfirmPassword,
    status,
    message,
    setFocusedField,
    strength,
    handleVerifyOtp,
    handleResetPassword,
  } = useResetPassword();

  return (
    <div className="reset-password-container">
      <main className="main-layout">
        
        {/* Left Side: Immersive Imagery */}
        <section className="imagery-section">
          <img 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCDwN9XhVB2jMBqw7MWPMK6HSUSOt4u3tpHC4P9LZcpPy_KLArp6BR2TypxPT9ngwC_5IpWAAvRDqaKj0RhsC7ba50-Su4T6h_ZrLTtDkjx09McNjjEY6dT1eQ6uxFxrevV0OTtd1oC82fAQFMrkq7WwqtF5mVmy1jhe1boxN9G-mVrQ2V90AXC3zOXRaD6cJHOjSyhAwxJ1OMtdRvYSY7YqEoLRfoFNWqmOdw2_dYRC1FITak9mSO2IGcfRu23GFdRHGzqTNdjfhAn" 
            alt="Smart Farm Monitoring" 
            className="bg-image"
          />
          <div className="gradient-overlay"></div>
          <div className="branding-content">
            <div className="glass-panel">
              <h2 className="branding-title">Nâng Tầm Trí Tuệ Trang Trại.</h2>
              <p className="branding-subtitle">
                Hệ thống tự động hóa và độ chính xác cao của chúng tôi đảm bảo năng suất của bạn được tối ưu hóa thông qua dữ liệu nấm và điều phối môi trường thời gian thực.
              </p>
            </div>
          </div>
        </section>

        {/* Right Side: Reset Password Form */}
        <section className="form-section">
          <div className="form-content">
            
            <div className="brand-header">
              <div className="brand-logo-group">
                <span className="material-symbols-outlined logo-icon">grid_view</span>
                <span className="brand-name">Mycelium Intelligence</span>
              </div>
              <h1 className="form-title">Đặt lại mật khẩu</h1>
              <p className="form-subtitle">
                {!resetToken 
                  ? 'Vui lòng xác minh mã OTP được gửi về email trước khi đặt mật khẩu mới.'
                  : 'Mã OTP chính xác. Hãy tạo một mật khẩu mới an toàn cho tài khoản của bạn.'}
              </p>
            </div>

            {/* BƯỚC 1: XÁC THỰC MÃ OTP (CHƯA CÓ RESET TOKEN) */}
            {!resetToken ? (
              <form onSubmit={handleVerifyOtp} className="form-fields">
                <div className="form-group">
                  <label className="input-label" htmlFor="email">Địa chỉ Email</label>
                  <div className="input-relative">
                    <span className="material-symbols-outlined input-icon">mail</span>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="name@farm-mycelium.ai"
                      className="form-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      disabled={status === 'loading'}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="input-label" htmlFor="otp">Mã xác thực OTP</label>
                  <div className="input-relative">
                    <span className="material-symbols-outlined input-icon">pin</span>
                    <input
                      id="otp"
                      name="otp"
                      type="text"
                      maxLength={6}
                      required
                      placeholder="Nhập 6 số OTP"
                      style={{ letterSpacing: '4px', fontWeight: 'bold' }}
                      className="form-input"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      onFocus={() => setFocusedField('otp')}
                      onBlur={() => setFocusedField(null)}
                      disabled={status === 'loading'}
                    />
                  </div>
                </div>

                {status === 'error' && (
                  <div className="alert-box error-alert">
                    <span className="material-symbols-outlined">error</span>
                    <span>{message}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="submit-btn"
                >
                  {status === 'loading' ? (
                    <>
                      <span className="material-symbols-outlined spinner-rotate">progress_activity</span>
                      <span>Đang xác thực...</span>
                    </>
                  ) : (
                    <>
                      <span>Xác thực OTP</span>
                      <span className="material-symbols-outlined">verified</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              // BƯỚC 2: NHẬP MẬT KHẨU MỚI (ĐÃ CÓ RESET TOKEN HỢP LỆ)
              <form onSubmit={handleResetPassword} className="form-fields">
                
                {/* Email (Disabled để xem lại) */}
                <div className="form-group">
                  <label className="input-label">Tài khoản đặt lại mật khẩu</label>
                  <div className="input-relative">
                    <span className="material-symbols-outlined input-icon" style={{ color: '#999999' }}>mail</span>
                    <input
                      type="email"
                      disabled
                      className="form-input"
                      style={{ backgroundColor: '#eeeeee', color: '#666666', cursor: 'not-allowed' }}
                      value={email}
                    />
                  </div>
                </div>

                {/* Mật khẩu mới */}
                <div className="form-group">
                  <label className="input-label" htmlFor="new-password">Mật khẩu mới</label>
                  <div className="input-relative">
                    <span className="material-symbols-outlined input-icon">lock</span>
                    <input
                      id="new-password"
                      name="new-password"
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      className="form-input"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      onFocus={() => setFocusedField('new-password')}
                      onBlur={() => setFocusedField(null)}
                      autoComplete="new-password"
                      disabled={status === 'loading'}
                    />
                    <button
                      type="button"
                      className="eye-button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      <span className="material-symbols-outlined">
                        {showNewPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                  
                  <div className="strength-bars-container">
                    <div className={`strength-bar ${strength.score >= 1 ? strength.colorClass : ''}`}></div>
                    <div className={`strength-bar ${strength.score >= 2 ? strength.colorClass : ''}`}></div>
                    <div className={`strength-bar ${strength.score >= 3 ? strength.colorClass : ''}`}></div>
                    <div className={`strength-bar ${strength.score >= 4 ? strength.colorClass : ''}`}></div>
                  </div>
                  <p className="strength-text">
                    Mức độ bảo mật: <span className={`strength-label ${strength.colorClass}`}>{strength.label}</span>
                  </p>
                </div>

                {/* Xác nhận mật khẩu mới */}
                <div className="form-group">
                  <label className="input-label" htmlFor="confirm-password">Xác nhận mật khẩu mới</label>
                  <div className="input-relative">
                    <span className="material-symbols-outlined input-icon">lock_reset</span>
                    <input
                      id="confirm-password"
                      name="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      className="form-input"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onFocus={() => setFocusedField('confirm-password')}
                      onBlur={() => setFocusedField(null)}
                      autoComplete="new-password"
                      disabled={status === 'loading'}
                    />
                    <button
                      type="button"
                      className="eye-button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <span className="material-symbols-outlined">
                        {showConfirmPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="requirements-card">
                  <p className="requirements-title">YÊU CẦU MẬT KHẨU BẮT BUỘC:</p>
                  <ul className="requirements-list">
                    <li className={`requirement-item ${strength.requirements.length ? 'valid' : ''}`}>
                      <span className="material-symbols-outlined">
                        {strength.requirements.length ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      <span>Có tối thiểu 8 ký tự</span>
                    </li>
                    <li className={`requirement-item ${strength.requirements.specialOrNumber ? 'valid' : ''}`}>
                      <span className="material-symbols-outlined">
                        {strength.requirements.specialOrNumber ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      <span>Có ít nhất 1 số hoặc ký tự đặc biệt (!@#...)</span>
                    </li>
                  </ul>
                </div>

                {status === 'error' && (
                  <div className="alert-box error-alert">
                    <span className="material-symbols-outlined">error</span>
                    <span>{message}</span>
                  </div>
                )}

                {status === 'success' && (
                  <div className="alert-box success-alert">
                    <span className="material-symbols-outlined">check_circle</span>
                    <span>{message} Đang về trang đăng nhập...</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === 'loading' || status === 'success'}
                  className="submit-btn"
                >
                  {status === 'loading' ? (
                    <>
                      <span className="material-symbols-outlined spinner-rotate">progress_activity</span>
                      <span>Đang cập nhật...</span>
                    </>
                  ) : (
                    <>
                      <span>Cập nhật mật khẩu</span>
                      <span className="material-symbols-outlined">sync</span>
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="back-navigation">
              <Link to="/login" className="back-to-signin-link">Quay lại Đăng nhập</Link>
            </div>

            {/* Support Footer Nội bộ */}
            <div className="support-footer" style={{ marginTop: '32px', paddingTop: '16px', borderTop: '1px solid rgba(187, 202, 191, 0.2)' }}>
              <p className="footer-copyright" style={{ fontSize: '12px', color: 'var(--text-on-surface-variant)', textAlign: 'center', marginBottom: '8px' }}>
                © 2026 Mycelium Intelligence Systems
              </p>
              <div className="footer-links" style={{ display: 'flex', justifyContent: 'center', gap: '12px', fontSize: '12px' }}>
                <a href="#support" className="footer-link" style={{ color: 'var(--text-on-surface-variant)', textDecoration: 'none' }}>Hỗ trợ</a>
                <span style={{ color: 'var(--text-on-surface-variant)' }}>•</span>
                <a href="#privacy" className="footer-link" style={{ color: 'var(--text-on-surface-variant)', textDecoration: 'none' }}>Bảo mật</a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};