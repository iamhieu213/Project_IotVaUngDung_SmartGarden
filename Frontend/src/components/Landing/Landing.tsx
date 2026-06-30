import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Landing.css';

export const Landing: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mistUnitActive, setMistUnitActive] = useState(true);
  const [tempUnitActive, setTempUnitActive] = useState(false);
  const [fanUnitActive, setFanUnitActive] = useState(true);

  const revealsRef = useRef<NodeListOf<HTMLElement> | null>(null);

  // Monitor scroll for navbar styles
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection Observer for scroll-triggered reveal animations
  useEffect(() => {
    const observerOptions = {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px',
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.reveal');
    revealsRef.current = revealElements as NodeListOf<HTMLElement>;
    revealElements.forEach((el) => observer.observe(el));

    // Handle initial reveal for elements in viewport on load
    const triggerInitialReveal = () => {
      revealElements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight) {
          el.classList.add('active');
        }
      });
    };

    // Small timeout to allow DOM to render
    const timeoutId = setTimeout(triggerInitialReveal, 100);

    return () => {
      clearTimeout(timeoutId);
      revealElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <div className="landing-page-body">
      {/* Top Navigation Bar */}
      <nav className={`landing-nav ${isScrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <Link to="/" className="nav-logo">
            <span className="material-symbols-outlined">hub</span>
            <span className="nav-logo-text">Mycelium</span>
          </Link>
          <div className="nav-links hidden-md">
            <a className="nav-link active" href="#platform">Nền tảng</a>
            <a className="nav-link" href="#hardware">Thiết bị</a>
            <a className="nav-link" href="#ecosystem">Hệ sinh thái</a>
            <a className="nav-link" href="#pricing">Bảng giá</a>
          </div>
          <div className="nav-actions">
            <Link className="btn-signin" to="/login">Đăng nhập</Link>
            <button className="btn-getstarted">Bắt đầu ngay</button>
          </div>
        </div>
      </nav>

      <main style={{ paddingTop: '64px', overflow: 'hidden' }}>
        {/* Hero Section */}
        <section id="platform" className="hero-gradient section-py">
          <div className="hero-container">
            <div className="reveal">
              <div className="hero-tag">
                <span className="material-symbols-outlined">auto_awesome</span>
                Nền Tảng Canh Tác Thế Hệ Mới
              </div>
              <h1 className="hero-title">
                Nông nghiệp chính xác cho <span className="text-primary">Người Trồng Hiện Đại</span>
              </h1>
              <p className="hero-desc">
                Khai thác sức mạnh của cảm biến IoT độ chính xác cao và số liệu viễn đo thời gian thực để tối ưu hóa mọi chu kỳ canh tác. Mycelium Intelligence chuyển đổi dữ liệu môi trường thô thành các phân tích trực quan hành động cho trồng nấm chuyên nghiệp.
              </p>
              <div className="hero-actions">
                <Link className="hero-btn-primary" to="/login">
                  Vào hệ thống
                  <span className="material-symbols-outlined">arrow_forward</span>
                </Link>
                <button className="hero-btn-secondary">
                  Xem bản thử nghiệm
                </button>
              </div>
              <div className="hero-trust">
                <div className="trust-avatars">
                  <div className="trust-avatar trust-avatar-1">JD</div>
                  <div className="trust-avatar trust-avatar-2">MK</div>
                  <div className="trust-avatar trust-avatar-3">AL</div>
                </div>
                <p className="trust-text">Được tin dùng bởi hơn <span className="font-bold">500+</span> trang trại nấm công nghiệp toàn cầu.</p>
              </div>
            </div>

            <div className="hero-image-wrapper reveal">
              <div className="animate-float">
                <div className="hero-image-container">
                  <img
                    alt="Cơ sở trồng nấm công nghệ cao"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAGd2MDfD1IOKABKcunS9qXlkmtIv_1inAAxBnAMY6uIi9CeENkB_Go2S5SFmQsykJ1JV9UqBdOYeh7yd8BMZpIs9vJ-q0kQDc2n7rqiujhCnVa9jadf29gVOjO1qhAiaY7f7XSU7-8n4GS6eOQWAEJKMQenQVjq3hzmaLiI9peqWAyFqCHu7TbPUZG2jBGgBIb7cIJbkFknLZXY99rtDPwTTboQMPYvyqLLDjQhqmjxaeZp76h5Q7Lm7XapKKXvj331C-5lolWDRmP"
                  />
                </div>
                {/* Floating Glass KPI Card */}
                <div className="floating-kpi-card glass-card">
                  <div className="kpi-header">
                    <div className="kpi-icon-box">
                      <span className="material-symbols-outlined">thermostat</span>
                    </div>
                    <div className="kpi-title-wrapper">
                      <p className="kpi-title">Kiểm soát khí hậu</p>
                      <p className="kpi-value">Tối ưu</p>
                    </div>
                  </div>
                  <div className="kpi-slider-group">
                    <div className="kpi-slider-label-row">
                      <span>Độ ẩm</span>
                      <span style={{ fontWeight: 700 }}>94.2%</span>
                    </div>
                    <div className="kpi-slider-bar-bg">
                      <div className="kpi-slider-bar-fill"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature 1: 3D Farm Monitoring */}
        <section className="section-py feature-bg-surface reveal">
          <div className="section-container">
            <div className="grid-two-cols">
              <div className="order-mobile-2">
                <div className="isometric-view-container hover-card-effect">
                  <img
                    alt="Mô hình buồng trồng nấm 3D"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAl3Kr9fSVeeG16ZKGHVuAS35xY7zx95Ci11o7U9UHRvZ0W0jxW9v4NOeKUWF0ybMQd6hgx1sAXh1obF7PqL9wrdVDFwmgygLgCn8_rAfHkLHn6tjnPjU9HMYuryrtREayBvTAX716-4qHOOzlnH-Oi_zIG_jpVxscex0gwMK3mCM-b4w_joYR3WYNKEP0XJD0xzfwefuejQhNTKY15yZQnMONnAEc9WXszDeFnLhQIygKtewEDldCLyb8VA0FE_R2_20EMoukTfbKm"
                  />
                  <div className="isometric-gradient-overlay" />
                  <div className="spatial-badge">
                    <span className="material-symbols-outlined">view_in_ar</span>
                    Bản đồ không gian
                  </div>
                </div>
              </div>
              <div className="order-mobile-1">
                <h2 className="feature-title">Giám Sát Trang Trại 3D</h2>
                <p className="feature-desc">
                  Trải nghiệm trang trại của bạn trực quan hơn bao giờ hết với bản đồ không gian 3D. Hệ thống của chúng tôi số hóa các buồng trồng thực tế thành bản sao kỹ thuật số (digital twin) chính xác.
                </p>
                <ul className="checklist">
                  <li className="checklist-item">
                    <span className="material-symbols-outlined">check_circle</span>
                    <p className="checklist-text">Đồng bộ hóa bản sao kỹ thuật số với hệ thống kệ trồng thực tế</p>
                  </li>
                  <li className="checklist-item">
                    <span className="material-symbols-outlined">check_circle</span>
                    <p className="checklist-text">Trực quan hóa bản đồ nhiệt độ, khí CO2 và độ ẩm trong buồng trồng</p>
                  </li>
                </ul>
                <button className="btn-feature-explore">
                  Khám phá tính năng không gian
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Feature 2: Real-time Telemetry (Bento Grid Style) */}
        <section className="section-py section-bg-lowest reveal">
          <div className="section-container">
            <div className="text-center-wrapper">
              <h2>Số Liệu Viễn Đo Thời Gian Thực</h2>
              <p>
                Dòng truyền dữ liệu tần suất cao đảm bảo bạn không bao giờ bỏ lỡ các ngưỡng thông số quan trọng. Giám sát các chỉ số sinh trưởng sinh động qua trang dashboard kính mờ.
              </p>
            </div>
            
            <div className="bento-grid">
              {/* Main Chart Card */}
              <div className="bento-card bento-card-main-chart hover-card-effect">
                <div className="chart-header">
                  <div>
                    <h3 className="chart-title">Phân Tích Môi Trường</h3>
                    <p className="chart-subtitle">Đang đo đạc: Chu kỳ sinh trưởng 048-A</p>
                  </div>
                  <span className="live-badge">TRỰC TIẾP</span>
                </div>
                <div className="mock-bar-chart">
                  <div className="mock-bar" style={{ height: '40%' }}></div>
                  <div className="mock-bar" style={{ height: '65%' }}></div>
                  <div className="mock-bar" style={{ height: '50%' }}></div>
                  <div className="mock-bar" style={{ height: '85%' }}></div>
                  <div className="mock-bar" style={{ height: '75%' }}></div>
                  <div className="mock-bar" style={{ height: '95%' }}></div>
                  <div className="mock-bar" style={{ height: '60%' }}></div>
                  <div className="mock-bar" style={{ height: '45%' }}></div>
                  <div className="mock-bar" style={{ height: '55%' }}></div>
                  <div className="mock-bar" style={{ height: '80%' }}></div>
                </div>
              </div>

              {/* KPI Card 1: CO2 */}
              <div className="bento-card bento-card-co2 hover-card-effect">
                <span className="material-symbols-outlined">co2</span>
                <div>
                  <p className="kpi-large-num">840 ppm</p>
                  <p className="kpi-subtext">Nồng độ khí CO2</p>
                </div>
              </div>

              {/* KPI Card 2: Air Flow */}
              <div className="bento-card bento-card-airflow hover-card-effect">
                <div>
                  <div className="airflow-header">
                    <span className="material-symbols-outlined">waves</span>
                    <span className="airflow-label">Tốc độ gió</span>
                  </div>
                  <p className="airflow-value">1.2 m/s</p>
                </div>
                <div className="airflow-trend">
                  <span className="material-symbols-outlined">trending_up</span>
                  +5% so với chu kỳ trước
                </div>
              </div>

              {/* KPI Card 3: System Alerts */}
              <div className="bento-card bento-card-alerts hover-card-effect">
                <h4 className="alerts-title">Cảnh Báo Hệ Thống</h4>
                <div className="alert-list">
                  <div className="alert-item-error">
                    <span className="material-symbols-outlined">warning</span>
                    <div className="alert-content">
                      <p className="alert-content-title">Mực nước bể chứa thấp</p>
                      <p className="alert-content-desc">Bể chứa chính C-3</p>
                    </div>
                    <span className="alert-time">2 phút trước</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature 3: IoT Fleet Management */}
        <section id="hardware" className="section-py feature-bg-surface reveal">
          <div className="section-container">
            <div className="fleet-grid">
              <div>
                <h2 className="feature-title">Quản Lý Thiết Bị IoT</h2>
                <p className="feature-desc">
                  Kiểm soát tập trung toàn diện. Từ các vòi phun sương đơn lẻ cho đến các hệ thống HVAC công nghiệp, quản lý toàn bộ hệ thống phần cứng của bạn tại một nơi duy nhất.
                </p>
                <div className="sub-features-grid">
                  <div className="sub-feature-card">
                    <span className="material-symbols-outlined">router</span>
                    <h4 className="sub-feature-title">Kết nối Hub</h4>
                    <p className="sub-feature-desc">Mạng lưới kết nối Mesh độ trễ thấp độc quyền.</p>
                  </div>
                  <div className="sub-feature-card">
                    <span className="material-symbols-outlined">settings_remote</span>
                    <h4 className="sub-feature-title">Cấu hình từ xa</h4>
                    <p className="sub-feature-desc">Cập nhật firmware cảm biến từ xa qua mạng (OTA).</p>
                  </div>
                </div>
                <button className="btn-fleet-specs">
                  Xem chi tiết phần cứng
                </button>
              </div>

              <div className="reveal">
                <div className="device-container-card hover-card-effect">
                  <div className="device-list">
                    {/* Device 1 */}
                    <div className="device-item">
                      <div className="device-item-left">
                        <div className="device-icon-box">
                          <span className="material-symbols-outlined">sensors</span>
                        </div>
                        <div className="device-info-wrapper">
                          <p className="device-name">MIST_UNIT_72 (Vòi Phun Sương)</p>
                          <p className="device-status">Đang hoạt động • Độ trễ: 4ms</p>
                        </div>
                      </div>
                      <div
                        className={`toggle-switch ${mistUnitActive ? 'active' : ''}`}
                        onClick={() => setMistUnitActive(!mistUnitActive)}
                      >
                        <div className="toggle-switch-handle" />
                      </div>
                    </div>

                    {/* Device 2 */}
                    <div className="device-item">
                      <div className="device-item-left">
                        <div className="device-icon-box" style={{ backgroundColor: 'rgba(0,101,145,0.2)', color: 'var(--secondary)' }}>
                          <span className="material-symbols-outlined">thermostat</span>
                        </div>
                        <div className="device-info-wrapper">
                          <p className="device-name">TEMP_SENSOR_04 (Cảm biến nhiệt)</p>
                          <p className="device-status">Ngoại tuyến • Lần cuối: 10p trước</p>
                        </div>
                      </div>
                      <div
                        className={`toggle-switch ${tempUnitActive ? 'active' : ''}`}
                        onClick={() => setTempUnitActive(!tempUnitActive)}
                      >
                        <div className="toggle-switch-handle" />
                      </div>
                    </div>

                    {/* Device 3 */}
                    <div className="device-item">
                      <div className="device-item-left">
                        <div className="device-icon-box" style={{ backgroundColor: 'rgba(164,58,58,0.2)', color: 'var(--tertiary)' }}>
                          <span className="material-symbols-outlined">mode_fan</span>
                        </div>
                        <div className="device-info-wrapper">
                          <p className="device-name">FAN_SYSTEM_A (Hệ thống quạt)</p>
                          <p className="device-status">Đang hoạt động • Tốc độ: 100%</p>
                        </div>
                      </div>
                      <div
                        className={`toggle-switch ${fanUnitActive ? 'active' : ''}`}
                        onClick={() => setFanUnitActive(!fanUnitActive)}
                      >
                        <div className="toggle-switch-handle" />
                      </div>
                    </div>
                  </div>
                  <div className="device-card-grid-dots" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Final Section */}
        <section id="pricing" className="cta-section">
          <div className="cta-container reveal">
            <h2 className="cta-title">Sẵn Sàng Mở Rộng Quy Mô Trồng Trọt?</h2>
            <p className="cta-desc">
              Tham gia cùng hàng nghìn nhà vườn đang đạt năng suất thu hoạch cao hơn tới 30% bằng giải pháp Mycelium Intelligence.
            </p>
            <div className="cta-actions">
              <Link className="cta-btn-primary" to="/login">Dùng thử miễn phí</Link>
              <button className="cta-btn-secondary">Liên hệ kinh doanh</button>
            </div>
          </div>
          <div className="cta-glow-left" />
          <div className="cta-glow-right" />
        </section>
      </main>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-grid">
          <div className="footer-brand-col">
            <Link to="/" className="footer-logo">
              <span className="material-symbols-outlined">hub</span>
              <span className="footer-logo-text">Mycelium</span>
            </Link>
            <p className="footer-brand-desc">Nông nghiệp chính xác cho người trồng hiện đại.</p>
          </div>
          <div>
            <h4 className="footer-heading">Sản phẩm</h4>
            <ul className="footer-links-list">
              <li className="footer-link-item"><a href="#hardware">Thiết bị phần cứng</a></li>
              <li className="footer-link-item"><a href="#platform">Nền tảng giám sát</a></li>
            </ul>
          </div>
          <div>
            <h4 className="footer-heading">Tài nguyên</h4>
            <ul className="footer-links-list">
              <li className="footer-link-item"><a href="#docs">Tài liệu kỹ thuật</a></li>
              <li className="footer-link-item"><a href="#support">Hỗ trợ khách hàng</a></li>
            </ul>
          </div>
          <div>
            <h4 className="footer-heading">Pháp lý</h4>
            <ul className="footer-links-list">
              <li className="footer-link-item"><a href="#privacy">Chính sách bảo mật</a></li>
              <li className="footer-link-item"><a href="#terms">Điều khoản sử dụng</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-copyright">
          © {new Date().getFullYear()} Mycelium Intelligence Systems. Bảo lưu mọi quyền.
        </div>
      </footer>
    </div>
  );
};
