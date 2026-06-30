import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import './Dashboard.css';
import { useAuth } from '../../context/AuthContext';
import { NotificationDropdown } from '../NotificationDropdown/NotificationDropdown';
import Swal from 'sweetalert2';
import api from '../../utils/api';
import { io } from 'socket.io-client';

interface Device {
  id: string;
  name: string;
  deviceId: string;
  status: 'online' | 'offline';
  sensorPositions?: Record<string, { spaceX: number; spaceY: number; displayName?: string }>;
  latestTelemetry?: Record<string, any>;
}

interface House {
  id: string;
  name: string;
  width: number;
  height: number;
}

interface Alert {
  _id: string;
  title: string;
  message: string;
  critical: string;
  resolved: boolean;
  createdAt: string;
  deviceId: string;
  deviceName: string;
}

export const Dashboard: React.FC = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  // Collapsed Sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Houses & selection states
  const [houses, setHouses] = useState<House[]>([]);
  const [selectedHouseId, setSelectedHouseId] = useState<string>('');

  // Devices & Alerts states for selected house
  const [devices, setDevices] = useState<Device[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // Temperature chart history state
  const [tempHistory, setTempHistory] = useState<{ time: string; temp: number }[]>([]);

  // Handle user logout
  const handleLogout = async () => {
    await logout();
    Swal.fire({
      icon: 'success',
      title: 'Đăng xuất thành công',
      text: 'Hẹn gặp lại bạn!',
      timer: 1500,
      showConfirmButton: false,
    });
  };

  // Fetch mushroom houses list initially
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
    } catch (err) {
      console.error('Lỗi khi tải danh sách nhà nấm:', err);
    }
  };

  useEffect(() => {
    fetchHouses();
  }, []);

  // Fetch devices and alerts when selectedHouseId changes
  useEffect(() => {
    if (!selectedHouseId) return;

    const fetchHouseDetails = async () => {
      try {
        const devRes = await api.get(`/devices/house/${selectedHouseId}`);
        if (devRes.data.success) {
          setDevices(devRes.data.data);
        }

        const alertRes = await api.get(`/alerts/house/${selectedHouseId}`);
        if (alertRes.data.success) {
          setAlerts(alertRes.data.data);
        }
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu chi tiết nhà nấm:', err);
      }
    };

    fetchHouseDetails();
  }, [selectedHouseId]);

  // Socket.io for real-time synchronization
  useEffect(() => {
    if (!selectedHouseId) return;

    const socket = io('http://localhost:3000');

    socket.on('device_update', (updatedDevice: any) => {
      // Check if updated device belongs to the selected house
      const deviceHouseId = typeof updatedDevice.house === 'object'
        ? updatedDevice.house?._id || updatedDevice.house?.id
        : updatedDevice.house;

      if (deviceHouseId === selectedHouseId) {
        setDevices((prevDevices) => {
          const isExist = prevDevices.some((d) => d.id === updatedDevice.id);
          if (isExist) {
            return prevDevices.map((d) => (d.id === updatedDevice.id ? { ...d, ...updatedDevice } : d));
          } else {
            return [...prevDevices, updatedDevice];
          }
        });
      }
    });

    socket.on('new_alert', (newAlert: any) => {
      const alertHouseId = typeof newAlert.house === 'object'
        ? newAlert.house?._id || newAlert.house?.id
        : newAlert.house;

      if (alertHouseId === selectedHouseId) {
        setAlerts((prevAlerts) => [newAlert, ...prevAlerts]);
      }
    });

    socket.on('alert_resolved', (resolvedAlert: any) => {
      setAlerts((prevAlerts) =>
        prevAlerts.map((a) => (a._id === resolvedAlert._id ? { ...a, resolved: true } : a))
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedHouseId]);

  // Aggregate sensor statistics
  const onlineTelemetryDevices = devices.filter((d) => d.status === 'online' && d.latestTelemetry);

  let avgTemp: number | null = null;
  let avgHum: number | null = null;
  let avgSoil: number | null = null;
  let avgLight: number | null = null;

  if (onlineTelemetryDevices.length > 0) {
    let tempSum = 0, tempCount = 0;
    let humSum = 0, humCount = 0;
    let soilSum = 0, soilCount = 0;
    let lightSum = 0, lightCount = 0;

    onlineTelemetryDevices.forEach((d) => {
      const t = d.latestTelemetry;
      if (!t) return;

      Object.entries(t).forEach(([key, val]) => {
        if (typeof val !== 'number') return;

        if (key.startsWith('temperature')) {
          if (val !== -127 && val !== -999) {
            tempSum += val;
            tempCount++;
          }
        } else if (key.startsWith('humidity')) {
          if (val > 0 && val <= 100) {
            humSum += val;
            humCount++;
          }
        } else if (key.startsWith('soilMoisture')) {
          if (val >= 0 && val <= 100) {
            soilSum += val;
            soilCount++;
          }
        } else if (key.startsWith('lightIntensity')) {
          if (val >= 0) {
            lightSum += val;
            lightCount++;
          }
        }
      });
    });

    if (tempCount > 0) avgTemp = Math.round((tempSum / tempCount) * 100) / 100;
    if (humCount > 0) avgHum = Math.round((humSum / humCount) * 100) / 100;
    if (soilCount > 0) avgSoil = Math.round((soilSum / soilCount) * 100) / 100;
    if (lightCount > 0) avgLight = Math.round((lightSum / lightCount) * 100) / 100;
  }

  // Helper to count physical components in Dashboard (Hướng B)
  const getPhysicalCounts = () => {
    let pumpCount = 0;
    let dhtCount = 0;
    let soilCount = 0;
    let lightCount = 0;
    let waterCount = 0;
    let otherCount = 0;

    devices.forEach((dev) => {
      const lowerName = dev.name.toLowerCase();
      const lowerId = dev.deviceId.toLowerCase();
      
      const telemetry = dev.latestTelemetry || {};
      const positions = dev.sensorPositions || {};

      // 1. Kiểm tra máy bơm độc lập:
      // Mặc định các mạch điều khiển (trừ khi được đặt tên là quạt/đèn chuyên biệt) đều quản lý 1 bơm nước.
      const isNotPumpActuator = lowerName.includes('quạt') || lowerName.includes('fan') || lowerId.includes('fan') ||
                                lowerName.includes('đèn') || lowerName.includes('led') || lowerId.includes('led');
      if (!isNotPumpActuator) {
        pumpCount++;
      } else {
        otherCount++;
      }

      // 2. Kiểm tra các cảm biến vật lý đi kèm độc lập:
      // Check for DHT 1
      const hasDht1 = (telemetry.temperature !== undefined || telemetry.temperature1 !== undefined || telemetry.humidity !== undefined || telemetry.humidity1 !== undefined) ||
                      (positions.temperature !== undefined || positions.temperature1 !== undefined || positions.humidity !== undefined || positions.humidity1 !== undefined);
      if (hasDht1) dhtCount++;

      // Check for DHT 2
      const hasDht2 = (telemetry.temperature2 !== undefined || telemetry.humidity2 !== undefined) ||
                      (positions.temperature2 !== undefined || positions.humidity2 !== undefined);
      if (hasDht2) dhtCount++;

      // Check for Soil 1
      const hasSoil1 = (telemetry.soilMoisture !== undefined || telemetry.soilMoisture1 !== undefined) ||
                       (positions.soilMoisture !== undefined || positions.soilMoisture1 !== undefined);
      if (hasSoil1) soilCount++;

      // Check for Soil 2
      const hasSoil2 = telemetry.soilMoisture2 !== undefined || positions.soilMoisture2 !== undefined;
      if (hasSoil2) soilCount++;

      // Check for Water 1
      const hasWater1 = (telemetry.waterLevel !== undefined || telemetry.waterLevel1 !== undefined) ||
                        (positions.waterLevel !== undefined || positions.waterLevel1 !== undefined);
      if (hasWater1) waterCount++;

      // Check for Water 2
      const hasWater2 = telemetry.waterLevel2 !== undefined || positions.waterLevel2 !== undefined;
      if (hasWater2) waterCount++;

      // Check for Light 1
      const hasLight1 = (telemetry.lightIntensity !== undefined || telemetry.lightIntensity1 !== undefined) ||
                        (positions.lightIntensity !== undefined || positions.lightIntensity1 !== undefined);
      if (hasLight1) lightCount++;

      // Check for Light 2
      const hasLight2 = telemetry.lightIntensity2 !== undefined || positions.lightIntensity2 !== undefined;
      if (hasLight2) lightCount++;
    });

    const total = pumpCount + dhtCount + soilCount + lightCount + waterCount + otherCount;
    return { total, pumpCount, dhtCount, soilCount, lightCount, waterCount, otherCount };
  };

  const stats = getPhysicalCounts();

  // Check alert conditions for sensor cards
  const activeAlertsForHouse = alerts.filter((a) => !a.resolved);
  const hasTempAlert = activeAlertsForHouse.some(
    (a) => a.title.toLowerCase().includes('nhiệt độ') || a.message.toLowerCase().includes('nhiệt độ')
  );
  const hasHumAlert = activeAlertsForHouse.some(
    (a) => a.title.toLowerCase().includes('độ ẩm không khí') || a.title.toLowerCase().includes('độ ẩm kk') || a.message.toLowerCase().includes('độ ẩm không khí')
  );
  const hasSoilAlert = activeAlertsForHouse.some(
    (a) => a.title.toLowerCase().includes('độ ẩm giá thể') || a.title.toLowerCase().includes('độ ẩm đất') || a.message.toLowerCase().includes('độ ẩm đất')
  );
  const hasLightAlert = activeAlertsForHouse.some(
    (a) => a.title.toLowerCase().includes('ánh sáng') || a.message.toLowerCase().includes('ánh sáng')
  );

  // Initialize temperature chart history once house changes or avgTemp goes online
  useEffect(() => {
    if (avgTemp === null) {
      setTempHistory([]);
      return;
    }
    const baseTemp = avgTemp;
    const now = new Date();
    const history = [];
    for (let i = 8; i >= 0; i--) {
      const timeStr = new Date(now.getTime() - i * 6000).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      // Mock historical offset values matching mockup look
      const offset = [-0.8, -0.7, -0.75, -0.5, -0.4, -0.2, -0.25, -0.35, 0][8 - i];
      history.push({
        time: timeStr,
        temp: Math.round((baseTemp + offset) * 100) / 100
      });
    }
    setTempHistory(history);
  }, [selectedHouseId, avgTemp === null]);

  // Periodically add new point to the chart
  useEffect(() => {
    if (avgTemp === null) return;
    const interval = setInterval(() => {
      const currentTemp = avgTemp;
      const timeStr = new Date().toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      setTempHistory((prev) => {
        if (prev.length === 0) return prev;
        const next = [...prev, { time: timeStr, temp: currentTemp }];
        if (next.length > 10) {
          next.shift();
        }
        return next;
      });
    }, 6000); // 6 seconds interval

    return () => clearInterval(interval);
  }, [avgTemp]);

  // SVG Chart rendering helper calculations
  const renderSVGChart = () => {
    if (tempHistory.length === 0) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: 'var(--db-text-secondary)',
          fontSize: '13px',
          fontWeight: 500,
          border: '1px dashed var(--db-border)',
          borderRadius: '8px',
          backgroundColor: '#fafafa',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          Không có dữ liệu đo nhiệt độ
        </div>
      );
    }

    const temps = tempHistory.map((h) => h.temp);
    const minTemp = Math.min(...temps, 20.0) - 0.2;
    const maxTemp = Math.max(...temps, 21.2) + 0.2;
    const range = maxTemp - minTemp || 1;

    const width = 450;
    const height = 150;
    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 20;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Map points to SVG coordinates
    const points = tempHistory.map((h, i) => {
      const x = paddingLeft + (i * chartWidth) / (tempHistory.length - 1);
      const y = paddingTop + chartHeight - ((h.temp - minTemp) / range) * chartHeight;
      return { x, y };
    });

    // Generate Cubic Bezier Path (Smooth spline curve)
    let pathD = '';
    if (points.length > 0) {
      pathD = `M ${points[0].x} ${points[0].y}`;
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
        const cpX1 = p0.x + (p1.x - p0.x) / 2;
        const cpY1 = p0.y;
        const cpX2 = p0.x + (p1.x - p0.x) / 2;
        const cpY2 = p1.y;
        pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
      }
    }

    // Gradient Area below line
    const areaD = pathD ? `${pathD} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z` : '';

    // Y Axis Grid lines values (4 lines)
    const gridYValues = [0, 0.25, 0.5, 0.75, 1];

    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a73e8" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#1a73e8" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {gridYValues.map((val, idx) => {
          const y = paddingTop + chartHeight * val;
          const gridVal = maxTemp - val * range;
          return (
            <g key={idx}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="#f1f3f4"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={paddingLeft - 8}
                y={y + 4}
                fill="#9aa0a6"
                fontSize="9"
                textAnchor="end"
              >
                {gridVal.toFixed(1).replace('.', ',')}
              </text>
            </g>
          );
        })}

        {/* Gradient Fill under the line */}
        {areaD && <path d={areaD} fill="url(#chart-area-grad)" />}

        {/* Temperature Line */}
        {pathD && (
          <path
            d={pathD}
            fill="none"
            stroke="#1a73e8"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Interactive node circles */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="4"
            fill="#ffffff"
            stroke="#1a73e8"
            strokeWidth="2"
          />
        ))}

        {/* X Axis Time Labels */}
        {tempHistory.map((h, i) => {
          // Display labels for every alternative point to avoid cluttering
          if (i % 2 !== 0 && i !== tempHistory.length - 1) return null;
          const x = paddingLeft + (i * chartWidth) / (tempHistory.length - 1);
          return (
            <text
              key={i}
              x={x}
              y={height - 2}
              fill="#9aa0a6"
              fontSize="9"
              textAnchor="middle"
            >
              {h.time}
            </text>
          );
        })}
      </svg>
    );
  };

  // Donut SVG Arc calculation helper using Hướng B physical counts
  const renderSVGDonut = () => {
    const total = stats.total;
    if (total === 0) {
      return (
        <svg width="100%" height="100%" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="25" fill="none" stroke="#e0e0e0" strokeWidth="8" />
        </svg>
      );
    }

    const segments = [
      { count: stats.pumpCount, color: '#4285f4', label: 'Máy bơm' },
      { count: stats.dhtCount, color: '#ea4335', label: 'Cảm biến nhiệt ẩm' },
      { count: stats.soilCount, color: '#fbcb05', label: 'Cảm biến độ ẩm đất' },
      { count: stats.lightCount, color: '#34a853', label: 'Cảm biến ánh sáng' },
      { count: stats.waterCount || 0, color: '#9333ea', label: 'Cảm biến mực nước' },
      { count: stats.otherCount, color: '#9aa0a6', label: 'Thiết bị khác' }
    ].filter((s) => s.count > 0);

    const radius = 25;
    const circumference = 2 * Math.PI * radius; // 157.08
    let accumulatedPercent = 0;

    return (
      <svg width="100%" height="100%" viewBox="0 0 80 80">
        {segments.map((seg, idx) => {
          const percent = (seg.count / total) * 100;
          const strokeDashoffset = circumference - (circumference * percent) / 100;
          const rotationAngle = -90 + (accumulatedPercent * 360) / 100;
          accumulatedPercent += percent;

          return (
            <circle
              key={idx}
              cx="40"
              cy="40"
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{
                transform: `rotate(${rotationAngle}deg)`,
                transformOrigin: '40px 40px',
                transition: 'stroke-dashoffset 0.5s ease'
              }}
            />
          );
        })}
      </svg>
    );
  };

  // Helper formatting for dates
  const formatAlertTime = (timeStr: string) => {
    try {
      const d = new Date(timeStr);
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const seconds = String(d.getSeconds()).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${hours}:${minutes}:${seconds} ${day}-${month}-${year}`;
    } catch {
      return timeStr;
    }
  };

  return (
    <div className={`dashboard-page ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Sidebar Component */}
      <Sidebar
        activeId="dashboard"
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
            {/* Notification Menu */}
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

        {/* Dashboard Content */}
        <div className="dashboard-content">
          <h2 className="page-title">Tổng quan</h2>

          {/* Upper Section */}
          <div className="dashboard-top-row">
            {/* Sensor cards grid (2x2) */}
            <div className="sensors-2x2-grid">
              {/* Card 1: Temperature */}
              <div className="sensor-solid-card">
                <div className="sensor-card-left">
                  <span className="sensor-card-title">Nhiệt độ (°C)</span>
                  <p className="sensor-card-value">
                    {avgTemp !== null ? `${avgTemp.toFixed(2).replace('.', ',')} °C` : '--'}
                  </p>
                  <span className={`sensor-card-status ${hasTempAlert ? 'warning' : 'stable'}`}>
                    {hasTempAlert ? 'Cảnh báo vượt ngưỡng' : 'Trạng thái ổn định'}
                  </span>
                </div>
                <div className={`sensor-card-icon-circle ${hasTempAlert ? 'warning' : ''}`}>
                  <span className="material-symbols-outlined">thermostat</span>
                </div>
              </div>

              {/* Card 2: Humidity */}
              <div className="sensor-solid-card">
                <div className="sensor-card-left">
                  <span className="sensor-card-title">Độ ẩm (%)</span>
                  <p className="sensor-card-value">
                    {avgHum !== null ? `${avgHum.toFixed(2).replace('.', ',')} %` : '--'}
                  </p>
                  <span className={`sensor-card-status ${hasHumAlert ? 'warning' : 'stable'}`}>
                    {hasHumAlert ? 'Cảnh báo vượt ngưỡng' : 'Trạng thái ổn định'}
                  </span>
                </div>
                <div className={`sensor-card-icon-circle ${hasHumAlert ? 'warning' : ''}`}>
                  <span className="material-symbols-outlined">opacity</span>
                </div>
              </div>

              {/* Card 3: Soil Moisture */}
              <div className="sensor-solid-card">
                <div className="sensor-card-left">
                  <span className="sensor-card-title">Độ ẩm đất (%)</span>
                  <p className="sensor-card-value">
                    {avgSoil !== null ? `${avgSoil.toFixed(2).replace('.', ',')} %` : '--'}
                  </p>
                  <span className={`sensor-card-status ${hasSoilAlert ? 'warning' : 'stable'}`}>
                    {hasSoilAlert ? 'Cảnh báo vượt ngưỡng' : 'Trạng thái ổn định'}
                  </span>
                </div>
                <div className={`sensor-card-icon-circle ${hasSoilAlert ? 'warning' : ''}`}>
                  <span className="material-symbols-outlined">opacity</span>
                </div>
              </div>

              {/* Card 4: Light Intensity */}
              <div className="sensor-solid-card">
                <div className="sensor-card-left">
                  <span className="sensor-card-title">Ánh sáng (lux)</span>
                  <p className="sensor-card-value">
                    {avgLight !== null ? `${avgLight.toFixed(2).replace('.', ',')} lux` : '--'}
                  </p>
                  <span className={`sensor-card-status ${hasLightAlert ? 'warning' : 'stable'}`}>
                    {hasLightAlert ? 'Cảnh báo vượt ngưỡng' : 'Trạng thái ổn định'}
                  </span>
                </div>
                <div className={`sensor-card-icon-circle ${hasLightAlert ? 'warning' : ''}`}>
                  <span className="material-symbols-outlined">wb_sunny</span>
                </div>
              </div>
            </div>

            {/* Temperature line chart */}
            <div className="solid-card">
              <div className="chart-card-title-group">
                <h4 className="chart-title">Thống kê nhiệt độ (°C)</h4>
                <span className="chart-value">
                  {avgTemp !== null ? avgTemp.toFixed(1).replace('.', ',') : '--'}
                </span>
              </div>
              <div className="chart-container">{renderSVGChart()}</div>
            </div>
          </div>

          {/* Lower Section */}
          <div className="dashboard-bottom-row">
            {/* Col 1: Device status table */}
            <div className="solid-card">
              <h4 className="table-title">Trạng thái thiết bị</h4>
              <div className="custom-table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Thiết bị</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {devices.map((d, index) => (
                      <tr key={d.id || (d as any)._id || index}>
                        <td>{d.name}</td>
                        <td>
                          <span className={`status-text ${d.status === 'online' ? 'active' : 'inactive'}`}>
                            {d.status === 'online' ? 'Hoạt động' : 'Tắt'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {devices.length === 0 && (
                      <tr>
                        <td colSpan={2} style={{ textAlign: 'center', color: 'var(--db-text-secondary)', padding: '20px' }}>
                          Chưa có thiết bị nào được cài đặt.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Col 2: Alert history list */}
            <div className="solid-card">
              <h4 className="table-title">Lịch sử thông báo</h4>
              <div className="custom-table-container alert-table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nội dung</th>
                      <th>Thời gian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.slice(0, 10).map((a, index) => (
                      <tr key={a._id || index}>
                        <td style={{ fontWeight: 'bold' }}>{a.deviceId.substring(0, 6).toUpperCase()}</td>
                        <td className="alert-message-text">{a.message}</td>
                        <td className="alert-time-text">{formatAlertTime(a.createdAt)}</td>
                      </tr>
                    ))}
                    {alerts.length === 0 && (
                      <tr>
                        <td colSpan={3} style={{ textAlign: 'center', color: 'var(--db-text-secondary)', padding: '20px' }}>
                          Hệ thống hoạt động bình thường, không có cảnh báo nào.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Col 3: Donut chart statistics */}
            <div className="solid-card">
              <h4 className="table-title">Thống kê thiết bị</h4>
              <div className="donut-chart-wrapper">
                <div className="donut-chart-container">
                  {renderSVGDonut()}
                  <div className="donut-center-text">
                    <span className="donut-center-num">{stats.total}</span>
                    <span className="donut-center-lbl">Thiết bị</span>
                  </div>
                </div>

                <div className="donut-chart-legend">
                  {/* Item 1: Pump */}
                  <div className="legend-item">
                    <div className="legend-label-group">
                      <span className="legend-color-dot" style={{ backgroundColor: '#4285f4' }}></span>
                      <span>Máy bơm</span>
                    </div>
                    <span className="legend-value">{stats.pumpCount}</span>
                  </div>

                  {/* Item 2: DHT */}
                  <div className="legend-item">
                    <div className="legend-label-group">
                      <span className="legend-color-dot" style={{ backgroundColor: '#ea4335' }}></span>
                      <span>Cảm biến nhiệt ẩm</span>
                    </div>
                    <span className="legend-value">{stats.dhtCount}</span>
                  </div>

                  {/* Item 3: Soil Moisture */}
                  <div className="legend-item">
                    <div className="legend-label-group">
                      <span className="legend-color-dot" style={{ backgroundColor: '#fbcb05' }}></span>
                      <span>Cảm biến độ ẩm đất</span>
                    </div>
                    <span className="legend-value">{stats.soilCount}</span>
                  </div>

                  {/* Item 4: Light */}
                  <div className="legend-item">
                    <div className="legend-label-group">
                      <span className="legend-color-dot" style={{ backgroundColor: '#34a853' }}></span>
                      <span>Cảm biến ánh sáng</span>
                    </div>
                    <span className="legend-value">{stats.lightCount}</span>
                  </div>

                  {/* Item 4.5: Water */}
                  <div className="legend-item">
                    <div className="legend-label-group">
                      <span className="legend-color-dot" style={{ backgroundColor: '#9333ea' }}></span>
                      <span>Cảm biến mực nước</span>
                    </div>
                    <span className="legend-value">{stats.waterCount || 0}</span>
                  </div>

                  {/* Item 5: Others */}
                  <div className="legend-item">
                    <div className="legend-label-group">
                      <span className="legend-color-dot" style={{ backgroundColor: '#9aa0a6' }}></span>
                      <span>Thiết bị khác</span>
                    </div>
                    <span className="legend-value">{stats.otherCount}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Action Button for adding device */}
      <button type="button" className="fab-btn" title="Thêm thiết bị" onClick={() => navigate('/devices')}>
        <span className="fab-icon">add</span>
      </button>
    </div>
  );
};

export default Dashboard;
