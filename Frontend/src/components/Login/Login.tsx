import React, { useState, useEffect, useRef } from 'react';
import './Login.css';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import Swal from 'sweetalert2';

interface LoginProps {
  onLoginSuccess?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesContainerRef = useRef<HTMLDivElement>(null);
  const animationFrameId = useRef<number | null>(null);

  // Background particle animation
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = particlesContainerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = container.offsetWidth;
    let height = container.offsetHeight;
    canvas.width = width;
    canvas.height = height;

    interface Particle {
      x: number;
      y: number;
      size: number;
      speedY: number;
      opacity: number;
    }

    let particles: Particle[] = [];

    const initParticles = () => {
      width = container.offsetWidth;
      height = container.offsetHeight;
      canvas.width = width;
      canvas.height = height;
      particles = [];
      for (let i = 0; i < 50; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 2 + 1,
          speedY: Math.random() * 0.3 + 0.1,
          opacity: Math.random() * 0.5 + 0.1,
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#6ffbbe'; // bright green matching --primary-fixed

      particles.forEach((p) => {
        ctx.globalAlpha = p.opacity;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        p.y -= p.speedY;
        if (p.y < -10) p.y = height + 10;
      });

      animationFrameId.current = requestAnimationFrame(animate);
    };

    initParticles();
    animate();

    const handleResize = () => {
      initParticles();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status !== 'idle') return;

    setStatus('submitting');
    setErrorMsg('');
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.success) {
        const { accessToken, refreshToken, user } = response.data.data;

        login(accessToken, refreshToken, user);

        setStatus('success');

        await Swal.fire({
          icon: 'success',
          title: 'Đăng nhập thành công',
          text: `Xin chào ${user.username}!`,
          timer: 1500,
          showConfirmButton: false,
        });

        navigate('/dashboard');
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      }
    } catch (err: any) {
      setStatus('idle');
      const message =
        err.response?.data?.message ||
        'Email hoặc mật khẩu không chính xác.';

      setErrorMsg(message);

      Swal.fire({
        icon: 'error',
        title: 'Đăng nhập thất bại',
        text: message,
        confirmButtonText: 'Đóng',
      });
    }
  };

  const togglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="login-page-body">
      <main className="login-container">
        {/* Nút quay lại trang chủ ở góc trái */}
        <Link to="/" className="btn-back-home">
          <span className="material-symbols-outlined">arrow_back</span>
          Trang chủ
        </Link>
        {/* Left Side: Visual Branding (Hidden on Mobile) */}
        <section className="branding-section">
          <div className="branding-bg-wrapper">
            <img
              alt="Trang trại nấm trong nhà hiện đại"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAABFFzVeqkfDElm1Ecv7_KiCSj49CYiFT8SwkHRDgovf0gCeBtuPoTxDLH_k3yT6qllkkFFdWnUXdtFpFI6H4evaW28e7GW17d26exnxOYvqNl3AjVSdAjN8SjjFA9b3NkVekRF_mWxgG20ymVdHkAbtDYLdz7Ct5B-rKo7R1VdcmBPF220qsC82h0rNSQl_gbcMn5r8S-PyAPJW5cvdTGTopXAzHVVSMo0YBUS_lzaIvbXGE1c71BeLHM6SeboFUrfJszcvTYeARS"
            />
          </div>

          {/* Glassmorphism Branding Card */}
          <div className="branding-card glass-overlay">
            <div className="branding-header">
              <div className="logo-icon-box">
                <span className="material-symbols-outlined">energy_savings_leaf</span>
              </div>
              <div className="branding-header-text">
                <h1 className="branding-title">Smart Garden</h1>
                <p className="branding-tag">IoT Nấm</p>
              </div>
            </div>
            <h2 className="branding-heading">Hệ Thống Trí Tuệ Sợi Nấm</h2>
            <p className="branding-desc">
              Khai thác sức mạnh của cảm biến độ chính xác cao và dòng dữ liệu thời gian thực để tối ưu hóa chu kỳ canh tác và tối đa hóa năng suất cho người trồng hiện đại.
            </p>
            <div className="growers-trust">
              <div className="avatar-group">
                <div className="avatar avatar-1"></div>
                <div className="avatar avatar-2"></div>
                <div className="avatar avatar-3"></div>
              </div>
              <span className="growers-text">Được tin dùng bởi hơn 2.000 người trồng</span>
            </div>
          </div>

          {/* Particle effect container */}
          <div ref={particlesContainerRef} id="particles" className="particles-container">
            <canvas ref={canvasRef} />
          </div>
        </section>

        {/* Right Side: Login Form */}
        <section className="login-form-section">
          <div className="form-wrapper">
            {/* Mobile Branding (Only Visible on Small Screens) */}
            <div className="mobile-branding">
              <div className="logo-icon-box">
                <span className="material-symbols-outlined">energy_savings_leaf</span>
              </div>
              <span className="mobile-logo-text">Smart Garden</span>
            </div>

            <div className="form-header">
              <h3>Chào Mừng Quay Trở Lại</h3>
              <p className="form-subtext">Đăng nhập để giám sát các khu vực canh tác của bạn.</p>
            </div>

            {/* Login Form */}
            <form className="login-form" onSubmit={handleSubmit}>
              {errorMsg && (
                <div className="login-error-alert" style={{ color: '#ba1a1a', backgroundColor: '#ffdad6', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>error</span>
                  <span>{errorMsg}</span>
                </div>
              )}
              {/* Email Field */}
              <div className="input-group">
                <label className="input-label" htmlFor="email">
                  Email hoặc Tên đăng nhập
                </label>
                <div className="input-wrapper">
                  <span className="material-symbols-outlined input-icon">mail</span>
                  <input
                    className="form-input"
                    id="email"
                    name="email"
                    type="text"
                    placeholder="nguoitrong@smartgarden.io"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={status !== 'idle'}
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="input-group">
                <div className="input-label-row">
                  <label className="input-label" htmlFor="password">
                    Mật khẩu
                  </label>
                  <Link className="forgot-password-link" to="/forgot-password">
                    Quên mật khẩu?
                  </Link>
                </div>
                <div className="input-wrapper">
                  <span className="material-symbols-outlined input-icon">lock</span>
                  <input
                    className="form-input form-input-password"
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={status !== 'idle'}
                    autoComplete="current-password"
                  />
                  <button
                    className="password-toggle-btn"
                    onClick={togglePassword}
                    type="button"
                    tabIndex={-1}
                  >
                    <span className="material-symbols-outlined">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="remember-me-container">
                <input
                  className="remember-me-checkbox"
                  id="remember"
                  name="remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={status !== 'idle'}
                />
                <label className="remember-me-label" htmlFor="remember">
                  Ghi nhớ đăng nhập trong 30 ngày
                </label>
              </div>

              {/* Primary Action Button */}
              <button
                className={`btn btn-primary ${status === 'submitting' ? 'submitting' : ''} ${status === 'success' ? 'success' : ''}`}
                type="submit"
                disabled={status !== 'idle'}
              >
                {status === 'idle' && (
                  <>
                    Đăng Nhập
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </>
                )}
                {status === 'submitting' && (
                  <>
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    Đang xác thực...
                  </>
                )}
                {status === 'success' && (
                  <>
                    <span className="material-symbols-outlined">check_circle</span>
                    Thành công
                  </>
                )}
              </button>
            </form>

            {/* Footer Link */}
            <p className="footer-text">
              Bạn mới sử dụng hệ thống?{' '}
              <Link to='/register'>Tạo tài khoản mới</Link>
            </p>

            {/* Micro-interaction indicator */}
            <div className="security-badges">
              <div className="badge-item">
                <span className="material-symbols-outlined">verified_user</span>
                <span className="badge-text">Mã hóa đầu cuối</span>
              </div>
              <div className="badge-item">
                <span className="material-symbols-outlined">cloud_done</span>
                <span className="badge-text">Đồng bộ đám mây hoạt động</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
