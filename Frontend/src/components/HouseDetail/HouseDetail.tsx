import React from 'react';
import Sidebar from '../Sidebar/Sidebar';
import './HouseDetail.css';
import { Thermometer, Droplets, Sun, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { NotificationDropdown } from '../NotificationDropdown/NotificationDropdown';
import { useAuth } from '../../context/AuthContext';
// Import sub-components
import { SensorStatsBar } from './SensorStatsBar';
import { FarmHudControls } from './FarmHudControls';
import { SensorCard } from './SensorCard';
import { RightStatusPanel } from './RightStatusPanel';

// Import custom hook
import { useHouseDetailState } from './useHouseDetailState';

const getSensorLucideIcon = (sensorKey: string) => {
  const size = 14;
  const getBaseSensorKey = (key: string) => {
    if (key.startsWith('temperature')) return 'temperature';
    if (key.startsWith('humidity')) return 'humidity';
    if (key.startsWith('soilMoisture')) return 'soilMoisture';
    if (key.startsWith('lightIntensity')) return 'lightIntensity';
    if (key.startsWith('waterLevel')) return 'waterLevel';
    return key;
  };

  const baseKey = getBaseSensorKey(sensorKey);
  switch (baseKey) {
    case 'temperature':
      return <Thermometer size={size} style={{ color: '#ef4444' }} />;
    case 'humidity':
      return <Droplets size={size} style={{ color: '#3b82f6' }} />;
    case 'soilMoisture':
      return <Droplets size={size} style={{ color: '#4f46e5' }} />;
    case 'lightIntensity':
      return <Sun size={size} style={{ color: '#d97706' }} />;
    case 'waterLevel':
      return <Droplets size={size} style={{ color: '#a855f7' }} />;
    default:
      return <HelpCircle size={size} style={{ color: '#6b7280' }} />;
  }
};

export const HouseDetail: React.FC = () => {
  const { user } = useAuth();
  const {
    houseName,
    houseInfo,
    devices,
    expandedDevices,
    selectedSensor,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    zoom,
    rotation,
    showSensors,
    show3dOverlay,
    isPlacementMode,
    selectedDeviceForPlacement,
    mapRef,
    isDragging,
    draggedSensor,
    handleLogout,
    handleAddDevice,
    handleDeleteDevice,
    handleSensorDoubleClick,
    handleDeleteSensorPosition,
    handleLocateDeviceClick,
    handleSensorMouseDown,
    handleStartDragNewSensor,
    toggleDeviceExpand,
    handleMouseMove,
    handleMouseUp,
    handleMapClick,
    handleZoomIn,
    handleZoomOut,
    handleRotate,
    countSensors,
    activeCount,
    inactiveCount,
    isFlatView,
    isStatusPanelCollapsed,
    setIsStatusPanelCollapsed,
    handleTogglePump,
    presetsList,
    handleAssignPreset,
  } = useHouseDetailState();

  return (
    <div className={`dashboard-page ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Sidebar Navigation */}
      <Sidebar
        activeId="mushroom-houses"
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Workspace */}
      <main className="dashboard-main overflow-hidden relative">
        {/* TopNavBar */}
        <header className="dashboard-header">
          <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link to="/houses" style={{ display: 'flex', alignItems: 'center', color: 'var(--db-on-surface-variant)', textDecoration: 'none' }} title="Quay lại danh sách nhà nấm">
              <span className="material-symbols-outlined" style={{ fontSize: '20px', cursor: 'pointer' }}>arrow_back</span>
            </Link>
            <div style={{ width: '1px', backgroundColor: 'var(--db-outline-variant)', height: '16px', margin: '0 4px' }}></div>
            <h1 className="header-title" style={{ fontSize: '18px', margin: 0 }}>{houseName}</h1>
            <div style={{ width: '1px', backgroundColor: 'var(--db-outline-variant)', height: '16px', margin: '0 8px' }}></div>
            <span className="zone-tab active" style={{ fontSize: '14px' }}>
              {houseInfo?.address || 'Khu vực nuôi trồng'}
            </span>
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

        {/* Content Area: 3D Isometric Map + Sidebar */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', height: 'calc(100vh - 64px)' }}>
          {/* Interactive 3D Farm Layout Map */}
          <div
            className="isometric-scene flex-1 relative farm-grid overflow-hidden"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Thanh thống kê cảm biến trên đầu sơ đồ */}
            <SensorStatsBar
              activeCount={activeCount}
              inactiveCount={inactiveCount}
              countSensors={countSensors}
            />

            {/* Zoom & Control HUD */}
            <FarmHudControls
              handleZoomIn={handleZoomIn}
              handleZoomOut={handleZoomOut}
              handleRotate={handleRotate}
            />


            {/* 3D Base Layout */}
            <div
              className="isometric-base"
              ref={mapRef}
              onClick={handleMapClick}
              style={{
                transform: isFlatView ? `scale(${zoom})` : `scale(${zoom}) rotateX(60deg) rotateZ(${rotation}deg)`,
                cursor: isDragging ? 'grabbing' : isPlacementMode ? 'crosshair' : 'default',
              }}
            >
              {/* Main Grid Base with Axes */}
              <div style={{ position: 'absolute', inset: 0, border: '1px dashed rgba(108, 122, 113, 0.3)' }}></div>
              <div className="axis-label-x" style={{ transform: 'rotateZ(45deg) rotateX(-60deg) translateY(30px) translateX(-50px)', color: 'var(--db-error)', fontWeight: 'bold' }}>
                {houseInfo?.height !== undefined && houseInfo?.height !== null ? `${houseInfo.height} m` : '200 m'}
              </div>
              <div className="axis-label-y" style={{ transform: 'rotateZ(45deg) rotateX(-60deg) translateX(30px) translateY(-50px)', color: 'var(--db-error)', fontWeight: 'bold' }}>
                {houseInfo?.width !== undefined && houseInfo?.width !== null ? `${houseInfo.width} m` : '250 m'}
              </div>

              {/* Zones Grid */}
              <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 48px 1fr 1fr', gap: '8px' }}>
                <div className="farm-zone"></div>
                <div className="farm-zone"></div>
                <div className="path-road"></div>
                <div className="farm-zone"></div>
                <div className="farm-zone"></div>
                <div className="farm-zone"></div>
                <div className="farm-zone"></div>
              </div>

              {/* Render động các cảm biến thành phần */}
              {showSensors && devices.map((device) => {
                const isOnline = device.status === 'online';
                const telemetry = device.latestTelemetry;
                const positions = device.sensorPositions || {};

                const getBaseSensorKey = (key: string) => {
                  if (key.startsWith('temperature')) return 'temperature';
                  if (key.startsWith('humidity')) return 'humidity';
                  if (key.startsWith('soilMoisture')) return 'soilMoisture';
                  if (key.startsWith('lightIntensity')) return 'lightIntensity';
                  if (key.startsWith('waterLevel')) return 'waterLevel';
                  return key;
                };

                const SENSOR_ICONS: Record<string, string> = {
                  temperature: 'thermostat',
                  humidity: 'humidity_percentage',
                  soilMoisture: 'opacity',
                  lightIntensity: 'light_mode',
                  waterLevel: 'water_drop',
                };

                const getSensorValueStr = (key: string) => {
                  if (!isOnline || !telemetry || telemetry[key] === undefined) return '--';
                  const val = telemetry[key];
                  if (val === -127 || val === -999 || val === -1 || String(val).toLowerCase() === 'nan' || (key.startsWith('soilMoisture') && val < 0)) {
                    return '⚠️ ERR';
                  }
                  const base = getBaseSensorKey(key);
                  if (base === 'temperature') return `${val}°C`;
                  if (base === 'humidity') return `${val}%`;
                  if (base === 'soilMoisture') return `${val}%`;
                  if (base === 'lightIntensity') return `${val} lx`;
                  if (base === 'waterLevel') return `${val}mm`;
                  return String(val);
                };

                return Object.entries(positions)
                  .map(([sensorKey, pos]: [string, any]) => {
                    if (pos.spaceX === undefined || pos.spaceY === undefined) return null;

                  const baseKey = getBaseSensorKey(sensorKey);
                  const icon = SENSOR_ICONS[baseKey] || 'sensors';
                  const valStr = getSensorValueStr(sensorKey);
                  const isSensorError = valStr === '⚠️ ERR';
                  const isSensorOnline = isOnline && !isSensorError;
                  const isSelected = selectedSensor?.deviceId === device.id && selectedSensor?.sensorKey === sensorKey;
                  const SENSOR_LABELS: Record<string, string> = {
                    temperature: 'Nhiệt độ',
                    humidity: 'Độ ẩm không khí',
                    soilMoisture: 'Độ ẩm đất',
                    lightIntensity: 'Cường độ ánh sáng',
                    waterLevel: 'Mực nước',
                  };
                  const suffix = sensorKey.replace(baseKey, '');
                  const defaultLabel = `${SENSOR_LABELS[baseKey] || baseKey}${suffix ? ' ' + suffix : ''}`;
                  const labelText = pos.displayName || defaultLabel;

                  return (
                    <SensorCard
                      key={`sensor-${device.id}-${sensorKey}`}
                      device={device}
                      sensorKey={sensorKey}
                      pos={pos}
                      valStr={valStr}
                      isSensorOnline={isSensorOnline}
                      icon={icon}
                      rotation={rotation}
                      isFlatView={isFlatView}
                      isDragging={isDragging}
                      draggedSensor={draggedSensor}
                      isSelected={isSelected}
                      labelText={labelText}
                      handleSensorMouseDown={handleSensorMouseDown}
                      handleSensorDoubleClick={handleSensorDoubleClick}
                    />
                  );
                });
              })}

              {/* Central Control Post */}
              {show3dOverlay && (
                <div className="central-control-post isometric-card">
                  <div className="control-pillar">
                    <span className="material-symbols-outlined">sensors</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Side Status Panel */}
          <RightStatusPanel
            devices={devices}
            expandedDevices={expandedDevices}
            toggleDeviceExpand={toggleDeviceExpand}
            selectedDeviceForPlacement={selectedDeviceForPlacement}
            handleLocateDeviceClick={handleLocateDeviceClick}
            handleDeleteDevice={handleDeleteDevice}
            handleStartDragNewSensor={handleStartDragNewSensor}
            handleSensorDoubleClick={handleSensorDoubleClick}
            handleDeleteSensorPosition={handleDeleteSensorPosition}
            handleAddDevice={handleAddDevice}
            getSensorLucideIcon={getSensorLucideIcon}
            isCollapsed={isStatusPanelCollapsed}
            onToggleCollapse={() => setIsStatusPanelCollapsed(!isStatusPanelCollapsed)}
            handleTogglePump={handleTogglePump}
            presetsList={presetsList}
            handleAssignPreset={handleAssignPreset}
          />
        </div>
      </main>
    </div>
  );
};

export default HouseDetail;
