import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

export interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  path?: string; // Optional path for React Router navigation
}

interface SidebarProps {
  activeId?: string;
  onItemSelect?: (id: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeId,
  onItemSelect,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  
  const mainItems: SidebarItem[] = [
    { id: 'dashboard', label: 'Tổng quan', icon: 'dashboard', path: '/dashboard' },
    { id: 'mushroom-houses', label: 'Nhà nấm', icon: 'home_work', path: '/houses' },
    { id: 'devices', label: 'Thiết bị', icon: 'memory', path: '/devices' },
    { id: 'presets', label: 'Cấu hình bơm', icon: 'tune', path: '/presets' },
    { id: 'analytics', label: 'Phân tích', icon: 'analytics', path: '/analytics' },
    { id: 'alerts', label: 'Cảnh báo', icon: 'notifications_active', path: '/alerts' },
  ];

  

  const renderItem = (item: SidebarItem) => {
    const isSelected = activeId === item.id;
    const iconSpan = (
      <span className="material-symbols-outlined sidebar-item-icon">
        {item.icon}
      </span>
    );
    const labelSpan = <span className="sidebar-item-label">{item.label}</span>;

    // If a path is provided and react-router is active, we use NavLink
    if (item.path) {
      return (
        <NavLink
          key={item.id}
          to={item.path}
          className={({ isActive }) =>
            `sidebar-link ${isActive || isSelected ? 'active' : ''}`
          }
          onClick={() => onItemSelect?.(item.id)}
          title={isCollapsed ? item.label : undefined}
        >
          {iconSpan}
          {!isCollapsed && labelSpan}
        </NavLink>
      );
    }

    // Otherwise, render as a button with state callback
    return (
      <button
        key={item.id}
        type="button"
        className={`sidebar-link ${isSelected ? 'active' : ''}`}
        onClick={() => onItemSelect?.(item.id)}
        title={isCollapsed ? item.label : undefined}
      >
        {iconSpan}
        {!isCollapsed && labelSpan}
      </button>
    );
  };

  return (
    <aside className={`smart-sidebar ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Sidebar Brand / Header */}
      <div className="sidebar-header">
        {!isCollapsed && (
          <div className="sidebar-brand-wrapper">
            <h1 className="sidebar-title">Smart Garden</h1>
            <p className="sidebar-subtitle">IoT Trồng Nấm</p>
          </div>
        )}
        <button
          type="button"
          className="collapse-toggle-btn"
          onClick={onToggleCollapse}
          title={isCollapsed ? "Mở rộng" : "Thu gọn"}
        >
          <span className="material-symbols-outlined">
            {isCollapsed ? 'chevron_right' : 'chevron_left'}
          </span>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        {mainItems.map(renderItem)}
        <div className="sidebar-divider"></div>
      </nav>

      {/* System Status Footer Card */}
      <div className="sidebar-footer">
        <div className="system-status">
          <div className="status-icon-wrapper">
            <span className="material-symbols-outlined status-icon">
              potted_plant
            </span>
          </div>
          {!isCollapsed && (
            <div className="status-info">
              <p className="status-label">Trạng thái hệ thống</p>
              <p className="status-value">Tất cả hệ thống tối ưu</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
