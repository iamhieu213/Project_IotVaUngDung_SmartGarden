import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { NotificationDropdown } from '../NotificationDropdown/NotificationDropdown';
import Swal from 'sweetalert2';
import api from '../../utils/api';
import './Analytics.css';

interface House {
  id: string;
  name: string;
  width: number;
  height: number;
}

interface TelemetryPoint {
  time: string;
  [key: string]: any;
}

interface ComparisonData {
  houseId: string;
  houseName: string;
  averageTemperature: number | null;
  averageHumidity: number | null;
}

export const Analytics: React.FC = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  // Collapsed Sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Filter States
  const [houses, setHouses] = useState<House[]>([]);
  const [selectedHouseId, setSelectedHouseId] = useState<string>('');
  const [range, setRange] = useState<'24h' | '7d' | '30d'>('24h');

  // Data States
  const [historyData, setHistoryData] = useState<TelemetryPoint[]>([]);
  const [comparisonData, setComparisonData] = useState<ComparisonData[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingComparison, setLoadingComparison] = useState(false);

  // Dynamic Metric Visibilities (Toggles in Legend)
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});

  // Helper to extract active keys from historyData (excluding 'time')
  const getActiveKeys = () => {
    if (historyData.length === 0) return [];
    const keys = new Set<string>();
    historyData.forEach((d) => {
      Object.keys(d).forEach((k) => {
        if (k !== 'time' && typeof d[k] === 'number') {
          keys.add(k);
        }
      });
    });
    return Array.from(keys);
  };

  // Helper to map dynamic key name to config (scale, color, label, unit, etc.)
  const getSensorConfig = (key: string) => {
    if (key.startsWith('temperature')) {
      const index = key.replace('temperature', '') || '1';
      return {
        label: `Nhiệt độ ${index} (°C)`,
        color: '#ff5722',
        scale: 50,
        gradId: 'tempGrad',
        unit: '°C'
      };
    }
    if (key.startsWith('humidity')) {
      const index = key.replace('humidity', '') || '1';
      return {
        label: `Độ ẩm khí ${index} (%)`,
        color: '#2196f3',
        scale: 100,
        gradId: 'humGrad',
        unit: '%'
      };
    }
    if (key.startsWith('soilMoisture')) {
      const index = key.replace('soilMoisture', '') || '1';
      return {
        label: `Độ ẩm đất ${index} (%)`,
        color: '#4caf50',
        scale: 100,
        gradId: 'soilGrad',
        unit: '%'
      };
    }
    if (key.startsWith('waterLevel')) {
      const index = key.replace('waterLevel', '') || '1';
      return {
        label: `Mực nước ${index} (cm)`,
        color: '#9c27b0',
        scale: 100,
        gradId: 'waterGrad',
        unit: 'cm'
      };
    }
    if (key.startsWith('lightIntensity') || key.startsWith('lightLevel')) {
      const index = key.replace('lightIntensity', '').replace('lightLevel', '') || '1';
      return {
        label: `Ánh sáng ${index} (Lux)`,
        color: '#ffc107',
        scale: 2000,
        gradId: 'lightGrad',
        unit: 'lux'
      };
    }
    return {
      label: key,
      color: '#64748b',
      scale: 100,
      gradId: 'defaultGrad',
      unit: ''
    };
  };

  // Auto-initialize key visibilities when historyData updates
  useEffect(() => {
    if (historyData.length > 0) {
      const keys = getActiveKeys();
      setVisibleKeys((prev) => {
        const next = { ...prev };
        keys.forEach((k) => {
          if (next[k] === undefined) {
            next[k] = true;
          }
        });
        return next;
      });
    }
  }, [historyData]);

  // Line Chart Hover State
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Bar Chart Hover State
  const [hoveredBar, setHoveredBar] = useState<{
    houseIdx: number;
    type: 'temp' | 'hum';
    value: number | null;
    x: number;
    y: number;
  } | null>(null);

  // Handle Logout
  const handleLogout = async () => {
    await logout();
    Swal.fire({
      icon: 'success',
      title: 'Đăng xuất thành công',
      text: 'Hẹn gặp lại bạn!',
      timer: 1500,
      showConfirmButton: false,
    });
    navigate('/login');
  };

  // Fetch initial houses
  const fetchHouses = async () => {
    try {
      const response = await api.get('/houses');
      if (response.data.success) {
        const housesList = response.data.data;
        setHouses(housesList);
        if (housesList.length > 0 && !selectedHouseId) {
          setSelectedHouseId(housesList[0].id);
        }
      }
    } catch (err: any) {
      console.error('Lỗi khi tải danh sách nhà nấm:', err);
    }
  };

  // Fetch comparison data between all houses
  const fetchComparison = async () => {
    setLoadingComparison(true);
    try {
      const response = await api.get('/devices/houses/comparison');
      if (response.data.success) {
        setComparisonData(response.data.data);
      }
    } catch (err: any) {
      console.error('Lỗi khi tải dữ liệu so sánh nhà nấm:', err);
    } finally {
      setLoadingComparison(false);
    }
  };

  // Fetch telemetry history when selection changes
  const fetchHistory = async () => {
    if (!selectedHouseId) return;
    setLoadingHistory(true);
    try {
      const response = await api.get(`/devices/house/${selectedHouseId}/telemetry-history?range=${range}`);
      if (response.data.success) {
        setHistoryData(response.data.data);
      }
    } catch (err: any) {
      console.error('Lỗi khi tải lịch sử môi trường:', err);
      setHistoryData([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHouses();
    fetchComparison();
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [selectedHouseId, range]);

  // Dimension settings for the interactive SVG Line Chart
  const lineChartWidth = 720;
  const lineChartHeight = 320;
  const linePaddingLeft = 50;
  const linePaddingRight = 30;
  const linePaddingTop = 30;
  const linePaddingBottom = 40;

  const activeWidth = lineChartWidth - linePaddingLeft - linePaddingRight;
  const activeHeight = lineChartHeight - linePaddingTop - linePaddingBottom;

  // Maximum scales for normalization
  const scaleTemp = 50; // Temp: 0 - 50°C
  const scaleHum = 100; // Hum: 0 - 100%
  // const scaleSoil = 100; // Soil: 0 - 100%
  // const scaleLight = 2000; // Light: 0 - 2000 lux

  // Helper to calculate Y coordinates on SVG
  const getY = (val: number, maxVal: number) => {
    const y = linePaddingTop + activeHeight - (val / maxVal) * activeHeight;
    return Math.max(linePaddingTop, Math.min(linePaddingTop + activeHeight, y));
  };

  // Generate SVG path for lines
  const generateLinePath = (key: string, maxVal: number) => {
    if (historyData.length < 2) return '';
    return historyData
      .map((d, i) => {
        const x = linePaddingLeft + (i * activeWidth) / (historyData.length - 1);
        const y = getY(d[key] || 0, maxVal);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  };

  // Generate SVG path for filled area under lines
  const generateAreaPath = (key: string, maxVal: number) => {
    if (historyData.length < 2) return '';
    const points = historyData.map((d, i) => {
      const x = linePaddingLeft + (i * activeWidth) / (historyData.length - 1);
      const y = getY(d[key] || 0, maxVal);
      return `${x},${y}`;
    });

    const startX = linePaddingLeft;
    const endX = linePaddingLeft + activeWidth;
    const baseY = linePaddingTop + activeHeight;

    return `M ${startX} ${baseY} L ${points.join(' L ')} L ${endX} ${baseY} Z`;
  };

  // Handle hover telemetry point detection
  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (historyData.length < 2) return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * lineChartWidth;
    const mouseY = ((e.clientY - rect.top) / rect.height) * lineChartHeight;

    if (mouseX >= linePaddingLeft && mouseX <= linePaddingLeft + activeWidth) {
      const xPercent = (mouseX - linePaddingLeft) / activeWidth;
      const rawIdx = xPercent * (historyData.length - 1);
      const idx = Math.round(rawIdx);

      if (idx >= 0 && idx < historyData.length) {
        setHoveredIndex(idx);
        // Position tooltip card next to mouse
        setTooltipPos({
          x: mouseX > lineChartWidth - 180 ? mouseX - 190 : mouseX + 15,
          y: Math.max(10, Math.min(lineChartHeight - 160, mouseY - 50)),
        });
      }
    } else {
      setHoveredIndex(null);
      setTooltipPos(null);
    }
  };

  const handleSvgMouseLeave = () => {
    setHoveredIndex(null);
    setTooltipPos(null);
  };

  // Bar Chart Dimensions
  const barChartWidth = 650;
  const barChartHeight = 280;
  const barPaddingLeft = 50;
  const barPaddingRight = 20;
  const barPaddingTop = 30;
  const barPaddingBottom = 45;

  const bWidth = barChartWidth - barPaddingLeft - barPaddingRight;
  const bHeight = barChartHeight - barPaddingTop - barPaddingBottom;

  return (
    <div className={`dashboard-page ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Sidebar Component */}
      <Sidebar
        activeId="analytics"
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Content Area */}
      <main className="dashboard-main">
        {/* Top Header Bar */}
        <header className="dashboard-header">
          {/* Mushroom House dynamic dropdown selection */}
          <div className="header-left">
            <span className="header-label">Lựa chọn nhà nấm</span>
            <div className="house-select-container">
              <span className="material-symbols-outlined house-select-icon">meeting_room</span>
              <select
                className="house-select"
                value={selectedHouseId}
                onChange={(e) => setSelectedHouseId(e.target.value)}
              >
                {houses.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="header-right">
            <div className="header-right-links">
              <button type="button" className="header-link-item" title="Trợ giúp">
                <span className="material-symbols-outlined header-link-icon">help_outline</span>
                Trợ giúp
              </button>
              <button type="button" className="header-link-item" title="Góp ý">
                <span className="material-symbols-outlined header-link-icon">favorite_border</span>
                Góp ý
              </button>
              <NotificationDropdown />
              <button type="button" className="header-link-item" title="Đăng xuất" onClick={handleLogout}>
                <span className="material-symbols-outlined header-link-icon">logout</span>
              </button>
            </div>

            {/* Profile Widget */}
            <div className="user-profile-widget">
              <div className="user-avatar-initials">
                {user?.username ? user.username.charAt(0).toUpperCase() : 'N'}
              </div>
              <div className="user-profile-info">
                <span className="user-profile-name">{user?.username || 'Nguyễn Phương Nam'}</span>
                <span className="user-profile-role">Nhân viên</span>
              </div>
            </div>
          </div>
        </header>

        {/* Analytics Workspace */}
        <div className="dashboard-content">
          <div className="analytics-header-row">
            <div className="analytics-title-group">
              <h2 className="page-title">Phân tích chuyên sâu</h2>
              <p className="page-subtitle">
                Theo dõi biến động và so sánh các thông số môi trường của nhà nấm qua các thời kỳ.
              </p>
            </div>

            {/* Time Range Filter Buttons */}
            <div className="range-selector-buttons">
              <button
                type="button"
                className={`range-btn ${range === '24h' ? 'active' : ''}`}
                onClick={() => setRange('24h')}
              >
                24 Giờ
              </button>
              <button
                type="button"
                className={`range-btn ${range === '7d' ? 'active' : ''}`}
                onClick={() => setRange('7d')}
              >
                7 Ngày
              </button>
              <button
                type="button"
                className={`range-btn ${range === '30d' ? 'active' : ''}`}
                onClick={() => setRange('30d')}
              >
                30 Ngày
              </button>
            </div>
          </div>

          {houses.length === 0 ? (
            <div className="analytics-empty-state">
              <span className="material-symbols-outlined empty-icon">analytics</span>
              <h3>Không tìm thấy dữ liệu nhà nấm</h3>
              <p>Bạn cần tạo nhà nấm và gán thiết bị trước để hệ thống bắt đầu vẽ biểu đồ phân tích.</p>
              <button type="button" className="go-to-houses-btn" onClick={() => navigate('/houses')}>
                Quản lý Nhà nấm
              </button>
            </div>
          ) : (
            <div className="analytics-bento-grid">
              {/* Section 1: Telemetry History Chart */}
              <div className="solid-card history-chart-card">
                <div className="card-header-with-actions">
                  <div className="card-header-info">
                    <span className="material-symbols-outlined header-icon">timeline</span>
                    <div>
                      <h3 className="card-section-title">Biến động chỉ số môi trường</h3>
                      <p className="card-section-subtitle">
                        Đồ thị diễn biến chi tiết các chỉ số đo được trong thời gian lọc.
                      </p>
                    </div>
                  </div>

                  {/* Interactive Legend / Toggle buttons */}
                  <div className="chart-legend-selectors">
                    {getActiveKeys().map((key) => {
                      const conf = getSensorConfig(key);
                      const isVisible = visibleKeys[key] !== false;
                      return (
                        <button
                          key={key}
                          type="button"
                          className={`legend-tag ${isVisible ? 'selected' : 'disabled'}`}
                          style={{
                            borderColor: conf.color,
                            backgroundColor: isVisible ? `${conf.color}15` : 'transparent',
                            color: isVisible ? '#1e293b' : '#94a3b8'
                          }}
                          onClick={() => {
                            setVisibleKeys(prev => ({
                              ...prev,
                              [key]: !isVisible
                            }));
                          }}
                        >
                          <span className="legend-bullet" style={{ backgroundColor: conf.color }}></span>
                          {conf.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="chart-wrapper">
                  {loadingHistory ? (
                    <div className="chart-loading-overlay">
                      <span className="material-symbols-outlined animate-spin">sync</span>
                      <p>Đang tải dữ liệu lịch sử...</p>
                    </div>
                  ) : historyData.length === 0 ? (
                    <div className="chart-empty-overlay">
                      <span className="material-symbols-outlined">query_stats</span>
                      <p>Không có dữ liệu telemetry trong khoảng thời gian này.</p>
                    </div>
                  ) : (
                    <div className="svg-container">
                      <svg
                        viewBox={`0 0 ${lineChartWidth} ${lineChartHeight}`}
                        className="interactive-svg-chart"
                        onMouseMove={handleSvgMouseMove}
                        onMouseLeave={handleSvgMouseLeave}
                      >
                        {/* Gradients definitions */}
                        <defs>
                          <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ff5722" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#ff5722" stopOpacity="0.0" />
                          </linearGradient>
                          <linearGradient id="humGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#2196f3" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#2196f3" stopOpacity="0.0" />
                          </linearGradient>
                          <linearGradient id="soilGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#4caf50" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#4caf50" stopOpacity="0.0" />
                          </linearGradient>
                          <linearGradient id="lightGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ffc107" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#ffc107" stopOpacity="0.0" />
                          </linearGradient>
                          <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#9c27b0" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#9c27b0" stopOpacity="0.0" />
                          </linearGradient>
                          <linearGradient id="defaultGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#64748b" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#64748b" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {/* Y-Axis Gridlines */}
                        {[0, 25, 50, 75, 100].map((percent, idx) => {
                          const y = linePaddingTop + (activeHeight * (100 - percent)) / 100;
                          return (
                            <g key={idx}>
                              <line
                                x1={linePaddingLeft}
                                y1={y}
                                x2={linePaddingLeft + activeWidth}
                                y2={y}
                                stroke="#f1f5f9"
                                strokeWidth="1"
                              />
                              <text
                                x={linePaddingLeft - 10}
                                y={y + 4}
                                fill="#94a3b8"
                                fontSize="10"
                                textAnchor="end"
                              >
                                {percent}%
                              </text>
                            </g>
                          );
                        })}

                        {/* X-Axis labels */}
                        {historyData.map((d, i) => {
                          // Display labels for every alternative point to avoid cluttering
                          const interval = Math.max(1, Math.round(historyData.length / 8));
                          if (i % interval !== 0 && i !== historyData.length - 1) return null;
                          const x = linePaddingLeft + (i * activeWidth) / (historyData.length - 1);
                          return (
                            <text
                              key={i}
                              x={x}
                              y={linePaddingTop + activeHeight + 20}
                              fill="#94a3b8"
                              fontSize="10"
                              textAnchor="middle"
                            >
                              {d.time}
                            </text>
                          );
                        })}

                        {/* Background Areas under Lines */}
                        {getActiveKeys().map((key) => {
                          const conf = getSensorConfig(key);
                          if (visibleKeys[key] === false) return null;
                          return (
                            <path
                              key={`area-${key}`}
                              d={generateAreaPath(key, conf.scale)}
                              fill={`url(#${conf.gradId})`}
                              style={{ transition: 'all 0.3s ease' }}
                            />
                          );
                        })}

                        {/* Telemetry Lines */}
                        {getActiveKeys().map((key) => {
                          const conf = getSensorConfig(key);
                          if (visibleKeys[key] === false) return null;
                          return (
                            <path
                              key={`line-${key}`}
                              d={generateLinePath(key, conf.scale)}
                              fill="none"
                              stroke={conf.color}
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              style={{ transition: 'all 0.3s ease' }}
                            />
                          );
                        })}

                        {/* Interactive vertical hover lines and points */}
                        {hoveredIndex !== null && (
                          <g>
                            {/* Vertical Line */}
                            <line
                              x1={linePaddingLeft + (hoveredIndex * activeWidth) / (historyData.length - 1)}
                              y1={linePaddingTop}
                              x2={linePaddingLeft + (hoveredIndex * activeWidth) / (historyData.length - 1)}
                              y2={linePaddingTop + activeHeight}
                              stroke="#cbd5e1"
                              strokeWidth="1.5"
                              strokeDasharray="4 4"
                            />
                            {/* Dots */}
                            {getActiveKeys().map((key) => {
                              const conf = getSensorConfig(key);
                              if (visibleKeys[key] === false) return null;
                              const val = historyData[hoveredIndex][key] ?? 0;
                              return (
                                <circle
                                  key={`dot-${key}`}
                                  cx={linePaddingLeft + (hoveredIndex * activeWidth) / (historyData.length - 1)}
                                  cy={getY(val, conf.scale)}
                                  r="5.5"
                                  fill={conf.color}
                                  stroke="#ffffff"
                                  strokeWidth="2.5"
                                />
                              );
                            })}
                          </g>
                        )}
                      </svg>

                      {/* Floating Tooltip Div */}
                      {hoveredIndex !== null && tooltipPos && (
                        <div
                          className="chart-tooltip"
                          style={{
                            left: `${tooltipPos.x}px`,
                            top: `${tooltipPos.y}px`,
                          }}
                        >
                          <div className="tooltip-header">{historyData[hoveredIndex].time}</div>
                          <div className="tooltip-body">
                            {getActiveKeys().map((key) => {
                              const conf = getSensorConfig(key);
                              if (visibleKeys[key] === false) return null;
                              const val = historyData[hoveredIndex][key];
                              if (val === undefined || val === null) return null;
                              return (
                                <div key={`tooltip-row-${key}`} className="tooltip-row">
                                  <span className="indicator-dot" style={{ backgroundColor: conf.color }}></span>
                                  <span className="tooltip-label">{conf.label.split(' (')[0]}:</span>
                                  <span className="tooltip-val">
                                    {val} {conf.unit}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Section 2: Comparison Bar Chart */}
              <div className="solid-card comparison-chart-card">
                <div className="card-header-with-actions">
                  <div className="card-header-info">
                    <span className="material-symbols-outlined header-icon">bar_chart</span>
                    <div>
                      <h3 className="card-section-title">So sánh giữa các nhà nấm</h3>
                      <p className="card-section-subtitle">
                        Biểu đồ so sánh nhiệt độ và độ ẩm trung bình 7 ngày qua của các nhà nấm.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="chart-wrapper">
                  {loadingComparison ? (
                    <div className="chart-loading-overlay">
                      <span className="material-symbols-outlined animate-spin">sync</span>
                      <p>Đang tải dữ liệu so sánh...</p>
                    </div>
                  ) : comparisonData.length === 0 ? (
                    <div className="chart-empty-overlay">
                      <span className="material-symbols-outlined">bar_chart</span>
                      <p>Chưa có dữ liệu so sánh nào giữa các nhà nấm.</p>
                    </div>
                  ) : (
                    <div className="svg-container">
                      <svg
                        viewBox={`0 0 ${barChartWidth} ${barChartHeight}`}
                        className="interactive-svg-chart"
                      >
                        {/* Grid Lines */}
                        {[0, 25, 50, 75, 100].map((percent, idx) => {
                          const y = barPaddingTop + (bHeight * (100 - percent)) / 100;
                          return (
                            <g key={idx}>
                              <line
                                x1={barPaddingLeft}
                                y1={y}
                                x2={barPaddingLeft + bWidth}
                                y2={y}
                                stroke="#f1f5f9"
                                strokeWidth="1"
                              />
                              <text
                                x={barPaddingLeft - 10}
                                y={y + 4}
                                fill="#94a3b8"
                                fontSize="10"
                                textAnchor="end"
                              >
                                {percent}%
                              </text>
                            </g>
                          );
                        })}

                        {/* Rendering Bars */}
                        {comparisonData.map((item, idx) => {
                          const sectionWidth = bWidth / comparisonData.length;
                          const barWidth = 18;
                          const spacing = 4;

                          // Temp values mapped
                          const tempVal = item.averageTemperature || 0;
                          const barHeightTemp = (tempVal / scaleTemp) * bHeight;
                          const yTemp = barPaddingTop + bHeight - barHeightTemp;
                          const xTemp =
                            barPaddingLeft +
                            idx * sectionWidth +
                            (sectionWidth - (barWidth * 2 + spacing)) / 2;

                          // Hum values mapped
                          const humVal = item.averageHumidity || 0;
                          const barHeightHum = (humVal / scaleHum) * bHeight;
                          const yHum = barPaddingTop + bHeight - barHeightHum;
                          const xHum = xTemp + barWidth + spacing;

                          // Label position centered under the bars
                          const xText = barPaddingLeft + idx * sectionWidth + sectionWidth / 2;

                          return (
                            <g key={item.houseId}>
                              {/* Temperature Bar */}
                              {item.averageTemperature !== null ? (
                                <rect
                                  x={xTemp}
                                  y={yTemp}
                                  width={barWidth}
                                  height={barHeightTemp}
                                  fill="#ff5722"
                                  rx="3"
                                  className="svg-bar"
                                  onMouseEnter={() => {
                                    setHoveredBar({
                                      houseIdx: idx,
                                      type: 'temp',
                                      value: tempVal,
                                      x: xTemp + barWidth / 2,
                                      y: yTemp - 10,
                                    });
                                  }}
                                  onMouseLeave={() => setHoveredBar(null)}
                                />
                              ) : (
                                <text
                                  x={xTemp + barWidth / 2}
                                  y={barPaddingTop + bHeight - 10}
                                  fill="#cbd5e1"
                                  fontSize="9"
                                  textAnchor="middle"
                                >
                                  N/A
                                </text>
                              )}

                              {/* Humidity Bar */}
                              {item.averageHumidity !== null ? (
                                <rect
                                  x={xHum}
                                  y={yHum}
                                  width={barWidth}
                                  height={barHeightHum}
                                  fill="#2196f3"
                                  rx="3"
                                  className="svg-bar"
                                  onMouseEnter={() => {
                                    setHoveredBar({
                                      houseIdx: idx,
                                      type: 'hum',
                                      value: humVal,
                                      x: xHum + barWidth / 2,
                                      y: yHum - 10,
                                    });
                                  }}
                                  onMouseLeave={() => setHoveredBar(null)}
                                />
                              ) : (
                                <text
                                  x={xHum + barWidth / 2}
                                  y={barPaddingTop + bHeight - 10}
                                  fill="#cbd5e1"
                                  fontSize="9"
                                  textAnchor="middle"
                                >
                                  N/A
                                </text>
                              )}

                              {/* House Name label */}
                              <text
                                x={xText}
                                y={barPaddingTop + bHeight + 20}
                                fill="#475569"
                                fontSize="11"
                                fontWeight="500"
                                textAnchor="middle"
                              >
                                {item.houseName}
                              </text>
                            </g>
                          );
                        })}

                        {/* Bar Hover Value Flag */}
                        {hoveredBar && (
                          <g>
                            {/* Small background tag */}
                            <rect
                              x={hoveredBar.x - 22}
                              y={hoveredBar.y - 20}
                              width="44"
                              height="18"
                              fill="#1e293b"
                              rx="4"
                            />
                            <text
                              x={hoveredBar.x}
                              y={hoveredBar.y - 8}
                              fill="#ffffff"
                              fontSize="9.5"
                              fontWeight="bold"
                              textAnchor="middle"
                            >
                              {hoveredBar.value}
                              {hoveredBar.type === 'temp' ? '°C' : '%'}
                            </text>
                            {/* Small line to point at bar */}
                            <line
                              x1={hoveredBar.x}
                              y1={hoveredBar.y - 2}
                              x2={hoveredBar.x}
                              y2={hoveredBar.y + 8}
                              stroke="#1e293b"
                              strokeWidth="1.5"
                            />
                          </g>
                        )}
                      </svg>

                      {/* Bar Legend */}
                      <div className="bar-legend-container">
                        <div className="bar-legend-item">
                          <span className="legend-box temp"></span>
                          <span>Nhiệt độ TB 7 ngày (°C)</span>
                        </div>
                        <div className="bar-legend-item">
                          <span className="legend-box hum"></span>
                          <span>Độ ẩm TB 7 ngày (%)</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
