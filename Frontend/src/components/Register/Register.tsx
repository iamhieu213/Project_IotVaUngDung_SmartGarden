// src/components/Register/Register.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import './Register.css';
import { useRegister } from '../../hooks/useRegister';

interface RegisterProps {
  onRegisterSuccess?: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onRegisterSuccess }) => {
  const {
    username, setUsername,
    email, setEmail,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    agreeTerms, setAgreeTerms,
    isOtpStep, setIsOtpStep,
    otpCode, setOtpCode,
    resendCountdown,
    status,
    errorMsg,
    focusedField, setFocusedField,
    ripples,
    handleButtonClick,
    handleRegisterSubmit,
    handleVerifyOtpSubmit,
    handleResendOtp
  } = useRegister(onRegisterSuccess);

  return (
    <div className="register-page-body">
      <main className="register-container">
        {/* Nút quay lại trang chủ ở góc trái */}
        <Link to="/" className="btn-back-home">
          <span className="material-symbols-outlined">arrow_back</span>
          Trang chủ
        </Link>
        {/* Left Side: Visual/Branding */}
        <section className="branding-section">
          <div className="branding-bg-dots" />
          
          <div className="branding-content-wrapper">
            <div className="branding-glass-card glass-card">
              <img
                alt="Công nghệ nuôi trồng nấm"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA0CZoq81D6oUrKjpz2iUdonPf2gsoxZV7CTyWAGuqEzuZHnIeSg4DCNVm3uIz52X1E0bV2vwxt7eadvFdDevHE1ONib6mb1l4qqWlqY9gcf3lgnWGWWAbKiAVoAYu_hEjqeejvs5_ZOO5h7ohkwAldZ5aZlix1d1ZOp4UlxBy8MBsNghnTRaZVp_B32fOLv64ZJTbQe3DrNLvRjqrCDfCmWYoAqSZfasztlSZvmyTrdw1GdS3m6izzIogqJ2NzXFXQtucIJJu1q9Fo"
              />
              <h1 className="branding-title">Canh Tác Chính Xác.</h1>
              <p className="branding-desc">
                Tham gia mạng lưới IoT nấm tiên tiến nhất thế giới. Giám sát độ ẩm, nồng độ CO2 và chu kỳ sinh trưởng với độ chính xác thời gian thực từ mọi thiết bị.
              </p>
            </div>
            
            <div className="stats-grid">
              <div className="stat-card glass-card">
                <span className="material-symbols-outlined">analytics</span>
                <div className="stat-number">99.9%</div>
                <div className="stat-label">Thời gian hoạt động</div>
              </div>
              <div className="stat-card glass-card">
                <span className="material-symbols-outlined">memory</span>
                <div className="stat-number">12k+</div>
                <div className="stat-label">Cảm biến kết nối</div>
              </div>
            </div>
          </div>
          
          <div className="glow-bottom-left" />
          <div className="glow-top-right" />
        </section>

        {/* Right Side: Registration Form */}
        <section className="register-form-section">
          <div className="form-wrapper">
            {/* Header & Logo */}
            <div className="logo-header">
              <div className="logo-box">
                <div className="logo-icon-box">
                  <span className="material-symbols-outlined">potted_plant</span>
                </div>
                <span className="logo-text">Smart Garden</span>
              </div>
              <div className="header-texts">
                <h2>{isOtpStep ? 'Xác thực tài khoản' : 'Tạo tài khoản của bạn'}</h2>
                <p>
                  {isOtpStep 
                    ? `Nhập mã xác thực OTP 6 số đã được gửi tới Gmail: ${email}` 
                    : 'Bắt đầu tối ưu hóa năng suất nấm của bạn ngay hôm nay.'}
                </p>
              </div>
            </div>

            {/* Alert Error */}
            {errorMsg && (
              <div className="register-error-alert" style={{ color: '#ba1a1a', backgroundColor: '#ffdad6', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* BƯỚC 1: NHẬP THÔNG TIN ĐĂNG KÝ */}
            {!isOtpStep ? (
              <form className="register-form" onSubmit={handleRegisterSubmit}>
                {/* Username */}
                <div className="input-group">
                  <label className="input-label" htmlFor="username">
                    Tên đăng nhập
                  </label>
                  <div className={`input-wrapper ${focusedField === 'username' ? 'scaled' : ''}`}>
                    <span className="material-symbols-outlined input-icon">person</span>
                    <input
                      className="form-input"
                      id="username"
                      name="username"
                      type="text"
                      placeholder="johndoe"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onFocus={() => setFocusedField('username')}
                      onBlur={() => setFocusedField(null)}
                      disabled={status !== 'idle'}
                      autoComplete="username"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="input-group">
                  <label className="input-label" htmlFor="email">
                    Địa chỉ Email
                  </label>
                  <div className={`input-wrapper ${focusedField === 'email' ? 'scaled' : ''}`}>
                    <span className="material-symbols-outlined input-icon">mail</span>
                    <input
                      className="form-input"
                      id="email"
                      name="email"
                      type="email"
                      placeholder="ten@congty.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      disabled={status !== 'idle'}
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Password & Confirm Password Grid */}
                <div className="password-grid">
                  <div className="input-group">
                    <label className="input-label" htmlFor="password">
                      Mật khẩu
                    </label>
                    <div className={`input-wrapper ${focusedField === 'password' ? 'scaled' : ''}`}>
                      <span className="material-symbols-outlined input-icon">lock</span>
                      <input
                        className="form-input"
                        id="password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                        disabled={status !== 'idle'}
                        autoComplete="new-password"
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label className="input-label" htmlFor="confirm_password">
                      Xác nhận mật khẩu
                    </label>
                    <div className={`input-wrapper ${focusedField === 'confirm_password' ? 'scaled' : ''}`}>
                      <span className="material-symbols-outlined input-icon">enhanced_encryption</span>
                      <input
                        className="form-input"
                        id="confirm_password"
                        name="confirm_password"
                        type="password"
                        placeholder="••••••••"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onFocus={() => setFocusedField('confirm_password')}
                        onBlur={() => setFocusedField(null)}
                        disabled={status !== 'idle'}
                        autoComplete="new-password"
                      />
                    </div>
                  </div>
                </div>

                {/* Agreement */}
                <div className="agreement-row">
                  <input
                    className="agreement-checkbox"
                    id="terms"
                    name="terms"
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    disabled={status !== 'idle'}
                  />
                  <label className="agreement-label" htmlFor="terms">
                    Tôi đồng ý với{' '}
                    <a href="#terms-link" onClick={(e) => e.preventDefault()}>
                      Điều khoản dịch vụ
                    </a>{' '}
                    và{' '}
                    <a href="#privacy-link" onClick={(e) => e.preventDefault()}>
                      Chính sách bảo mật
                    </a>
                    .
                  </label>
                </div>

                {/* CTA Action button with ripples */}
                <button
                  className={`btn-submit ${status === 'submitting' ? 'submitting' : ''}`}
                  type="submit"
                  onClick={handleButtonClick}
                  disabled={status !== 'idle'}
                >
                  {status === 'idle' && 'Tạo tài khoản'}
                  {status === 'submitting' && (
                    <>
                      <span className="material-symbols-outlined animate-spin">progress_activity</span>
                      Đang gửi yêu cầu...
                    </>
                  )}
                  {ripples.map((ripple) => (
                    <span
                      key={ripple.id}
                      className="ripple active"
                      style={{ left: ripple.x, top: ripple.y }}
                    />
                  ))}
                </button>
              </form>
            ) : (
              // BƯỚC 2: NHẬP XÁC THỰC MÃ OTP
              <form className="register-form" onSubmit={handleVerifyOtpSubmit}>
                <div className="input-group">
                  <label className="input-label" htmlFor="otpCode">
                    Mã OTP (6 chữ số)
                  </label>
                  <div className={`input-wrapper ${focusedField === 'otpCode' ? 'scaled' : ''}`}>
                    <span className="material-symbols-outlined input-icon">pin</span>
                    <input
                      className="form-input"
                      id="otpCode"
                      name="otpCode"
                      type="text"
                      maxLength={6}
                      placeholder="123456"
                      required
                      style={{ letterSpacing: '6px', fontSize: '18px', textAlign: 'center', fontWeight: 'bold' }}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))} // Chỉ nhập số
                      onFocus={() => setFocusedField('otpCode')}
                      onBlur={() => setFocusedField(null)}
                      disabled={status === 'submitting'}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <button
                    type="button"
                    className="btn-submit"
                    style={{ backgroundColor: '#eeeeee', color: '#333333' }}
                    onClick={() => setIsOtpStep(false)}
                    disabled={status === 'submitting'}
                  >
                    Quay lại
                  </button>
                  <button
                    className={`btn-submit ${status === 'submitting' ? 'submitting' : ''}`}
                    type="submit"
                    onClick={handleButtonClick}
                    disabled={status === 'submitting'}
                  >
                    {status === 'submitting' ? 'Đang xác thực...' : 'Xác thực OTP'}
                    {ripples.map((ripple) => (
                      <span
                        key={ripple.id}
                        className="ripple active"
                        style={{ left: ripple.x, top: ripple.y }}
                      />
                    ))}
                  </button>
                </div>

                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCountdown > 0}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: resendCountdown > 0 ? '#999999' : '#4CAF50',
                      cursor: resendCountdown > 0 ? 'not-allowed' : 'pointer',
                      fontSize: '13px',
                      textDecoration: 'underline'
                    }}
                  >
                    {resendCountdown > 0 
                      ? `Gửi lại mã OTP sau (${resendCountdown}s)` 
                      : 'Gửi lại mã OTP qua Gmail'}
                  </button>
                </div>
              </form>
            )}

            {/* Divider */}
            <div className="divider-container">
              <div className="divider-line" />
              <div className="divider-text-wrapper">Thiết lập bảo mật</div>
            </div>

            {/* Footer Link */}
            <p className="footer-text">
              Bạn đã có tài khoản?
              <Link className="signin-link" to="/login" style={{ fontWeight: 700, marginLeft: '6px' }}>
                Đăng nhập
              </Link>
            </p>
          </div>

          <div className="mobile-security-badge">
            <span className="material-symbols-outlined">verified_user</span>
            <span className="material-symbols-outlined">shield</span>
            <span className="material-symbols-outlined">lock</span>
          </div>
        </section>
      </main>
    </div>
  );
};

