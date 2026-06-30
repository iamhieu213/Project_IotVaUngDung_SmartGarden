import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import './NotificationDropdown.css';

export const NotificationDropdown: React.FC = () => {
  const { activeAlerts, resolveAlert } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleAlertClick = (houseId: string) => {
    setIsOpen(false);
    navigate(`/houses/${houseId}`);
  };

  const handleViewAll = () => {
    setIsOpen(false);
    navigate('/alerts');
  };

  return (
    <div className="notification-dropdown-container" ref={dropdownRef}>
      {/* Bell Button with Badge */}
      <button
        type="button"
        className="notification-bell-btn"
        onClick={handleToggle}
        title="Thông báo cảnh báo"
      >
        <span className="material-symbols-outlined bell-icon">notifications</span>
        {activeAlerts.length > 0 && (
          <span className="notification-badge-count">
            {activeAlerts.length > 9 ? '9+' : activeAlerts.length}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="notification-dropdown-menu">
          <div className="notification-dropdown-header">
            <h4>Cảnh báo hoạt động ({activeAlerts.length})</h4>
            {activeAlerts.length > 0 && (
              <span className="notification-status-dot pulse"></span>
            )}
          </div>

          <div className="notification-dropdown-list custom-scrollbar">
            {activeAlerts.length === 0 ? (
              <div className="notification-empty-state">
                Không có cảnh báo nào chưa xử lý.
              </div>
            ) : (
              activeAlerts.map((alert) => {
                const timeStr = new Date(alert.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const isCritical = alert.type === 'critical';

                return (
                  <div
                    key={alert.id}
                    className={`notification-item ${isCritical ? 'critical' : 'warning'}`}
                    onClick={() => handleAlertClick(alert.houseId)}
                  >
                    <div className="notification-item-content">
                      <div className="notification-item-title-row">
                        <span className="notification-item-title">{alert.title}</span>
                        <span className="notification-item-time">{timeStr}</span>
                      </div>
                      <p className="notification-item-msg">{alert.message}</p>
                      <span className="notification-item-device">
                        Mạch: {alert.deviceName}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="notification-item-resolve-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        resolveAlert(alert.id);
                      }}
                      title="Xác nhận đã xử lý"
                    >
                      <span className="material-symbols-outlined">done</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <div className="notification-dropdown-footer">
            <button
              type="button"
              className="view-all-alerts-btn"
              onClick={handleViewAll}
            >
              Xem tất cả nhật ký cảnh báo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
