import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import './Alerts.css';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';
import api from '../../utils/api';
import { io } from 'socket.io-client';
import { NotificationDropdown } from '../NotificationDropdown/NotificationDropdown';

interface House {
  id: string;
  name: string;
  width: number;
  height: number;
}

interface AlertItem {
  id: string;
  houseId: string;
  deviceId: string;
  deviceName: string;
  title: string;
  message: string;
  type: 'critical' | 'warning';
  resolved: boolean;
  createdAt: string;
}

export const Alerts: React.FC = () => {
  const { logout, user } = useAuth();

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

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [houses, setHouses] = useState<House[]>([]);
  const [selectedHouseId, setSelectedHouseId] = useState<string>('');
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'RESOLVED'>('ALL');
  const [loading, setLoading] = useState(false);

  // Fetch list of houses
  const fetchHouses = async () => {
    try {
      const response = await api.get('/houses');
      if (response.data.success) {
        const housesData = response.data.data;
        setHouses(housesData);
        if (housesData.length > 0) {
          setSelectedHouseId(housesData[0].id);
        }
      }
    } catch (err: any) {
      console.error('Lỗi khi tải danh sách nhà nấm:', err);
    }
  };

  // Fetch alerts for the selected house
  const fetchAlerts = async (houseId: string) => {
    if (!houseId) return;
    setLoading(true);
    try {
      const response = await api.get(`/alerts/house/${houseId}`);
      if (response.data.success) {
        setAlerts(response.data.data);
      }
    } catch (err: any) {
      console.error('Lỗi khi tải danh sách cảnh báo:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHouses();
  }, []);

  useEffect(() => {
    if (selectedHouseId) {
      fetchAlerts(selectedHouseId);
    }
  }, [selectedHouseId]);

  // Socket.io for real-time alert updates
  useEffect(() => {
    const socket = io('http://localhost:3000');

    socket.on('new_alert', (newAlert: AlertItem) => {
      if (newAlert.houseId === selectedHouseId) {
        setAlerts((prev) => {
          // Avoid duplicate alerts
          if (prev.some((a) => a.id === newAlert.id)) return prev;
          return [newAlert, ...prev];
        });
      }
    });

    socket.on('alert_resolved', (resolvedData: { id: string; houseId: string; deviceId: string; message: string }) => {
      if (resolvedData.houseId === selectedHouseId) {
        setAlerts((prev) =>
          prev.map((a) => (a.id === resolvedData.id ? { ...a, resolved: true } : a))
        );
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedHouseId]);

  // Handle manual resolve
  const handleResolveAlert = async (alertId: string) => {
    try {
      const response = await api.put(`/alerts/${alertId}/resolve`);
      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Thành công',
          text: 'Đã xác nhận xử lý cảnh báo này',
          timer: 1500,
          showConfirmButton: false,
        });
        setAlerts((prev) =>
          prev.map((a) => (a.id === alertId ? { ...a, resolved: true } : a))
        );
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: err.response?.data?.message || 'Không thể cập nhật trạng thái cảnh báo.',
      });
    }
  };

  // Filter alerts by search query and status filter
  const filteredAlerts = alerts.filter((alert) => {
    const matchesSearch =
      alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.deviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.deviceId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && !alert.resolved) ||
      (statusFilter === 'RESOLVED' && alert.resolved);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className={`dashboard-page ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Sidebar Navigation */}
      <Sidebar
        activeId="alerts"
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Workspace */}
      <main className="dashboard-main min-w-0">
        {/* TopNavBar */}
        <header className="dashboard-header">
          <div className="header-left">
            <h2 className="header-title">Cảnh báo</h2>
            <div className="header-zones">
              <span className="zone-tab active">Danh sách sự cố</span>
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

        {/* Page Content Canvas */}
        <div className="dashboard-content custom-scrollbar" style={{ overflowY: 'auto', flex: 1, height: 'calc(100vh - 64px)' }}>
          {/* Header Row */}
          <div className="houses-header-actions">
            <div className="houses-title-wrapper">
              <h2>Nhật ký cảnh báo môi trường</h2>
              <p>Giám sát các chỉ số vượt ngưỡng an toàn và xử lý kịp thời.</p>
            </div>
            <div className="search-add-wrapper">
              <div className="select-house-wrapper">
                <select
                  value={selectedHouseId}
                  onChange={(e) => setSelectedHouseId(e.target.value)}
                  className="house-select-dropdown"
                >
                  {houses.map((house) => (
                    <option key={house.id} value={house.id}>
                      {house.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="search-box-wrapper">
                <span className="material-symbols-outlined search-icon">search</span>
                <input
                  type="text"
                  placeholder="Tìm kiếm cảnh báo..."
                  className="search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Filter Controls Row */}
          <div className="filter-controls">
            <button
              type="button"
              className={`filter-btn ${statusFilter === 'ALL' ? 'active' : 'inactive'}`}
              onClick={() => setStatusFilter('ALL')}
            >
              Tất cả ({alerts.length})
            </button>
            <button
              type="button"
              className={`filter-btn ${statusFilter === 'ACTIVE' ? 'active' : 'inactive'}`}
              onClick={() => setStatusFilter('ACTIVE')}
            >
              Chưa xử lý ({alerts.filter((a) => !a.resolved).length})
            </button>
            <button
              type="button"
              className={`filter-btn ${statusFilter === 'RESOLVED' ? 'active' : 'inactive'}`}
              onClick={() => setStatusFilter('RESOLVED')}
            >
              Đã xử lý ({alerts.filter((a) => a.resolved).length})
            </button>
          </div>

          {/* Alerts Content Area */}
          <div className="alerts-container">
            {loading ? (
              <div className="alerts-empty-state">Đang tải danh sách cảnh báo...</div>
            ) : filteredAlerts.length === 0 ? (
              <div className="alerts-empty-state">
                Không tìm thấy cảnh báo nào phù hợp.
              </div>
            ) : (
              <div className="alerts-grid">
                {filteredAlerts.map((alert) => {
                  const alertTime = new Date(alert.createdAt).toLocaleString();
                  const isCritical = alert.type === 'critical';

                  return (
                    <div
                      key={alert.id}
                      className={`alert-card-item ${alert.resolved ? 'resolved' : isCritical ? 'critical' : 'warning'}`}
                    >
                      <div className="alert-card-header">
                        <div className="alert-type-badge">
                          {alert.resolved ? 'Đã xử lý' : isCritical ? 'Nguy hiểm' : 'Cảnh báo'}
                        </div>
                        <span className="alert-time-text">{alertTime}</span>
                      </div>
                      <div className="alert-card-body">
                        <h4 className="alert-card-title">{alert.title}</h4>
                        <p className="alert-card-msg">{alert.message}</p>
                        <div className="alert-card-device-info">
                          <span>Thiết bị: {alert.deviceName}</span>
                          <span className="divider-dot">•</span>
                          <span className="device-id-mono">ID: {alert.deviceId}</span>
                        </div>
                      </div>
                      {!alert.resolved && (
                        <div className="alert-card-actions">
                          <button
                            type="button"
                            className="resolve-action-btn"
                            onClick={() => handleResolveAlert(alert.id)}
                          >
                            Xác nhận đã xử lý
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Alerts;
