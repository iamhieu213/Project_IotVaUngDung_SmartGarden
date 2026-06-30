import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';

interface RightStatusPanelProps {
  devices: any[];
  expandedDevices: Record<string, boolean>;
  toggleDeviceExpand: (deviceId: string) => void;
  selectedDeviceForPlacement: string | null;
  handleLocateDeviceClick: (device: any) => void;
  handleDeleteDevice: (id: string, name: string) => void;
  handleStartDragNewSensor: (e: React.MouseEvent, deviceId: string, sensorKey: string) => void;
  handleSensorDoubleClick: (e: React.MouseEvent | null, deviceId: string, sensorKey: string, currentName: string, spaceX: number, spaceY: number) => void;
  handleDeleteSensorPosition?: (deviceId: string, sensorKey: string) => void;
  handleAddDevice: () => void;
  getSensorLucideIcon: (sensorKey: string) => React.ReactNode;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  handleTogglePump: (deviceId: string, currentAction: 'on' | 'off') => void;
  presetsList?: any[];
  handleAssignPreset?: (deviceId: string, presetId: string | null) => void;
}

export const RightStatusPanel: React.FC<RightStatusPanelProps> = ({
  devices,
  expandedDevices,
  toggleDeviceExpand,
  selectedDeviceForPlacement,
  handleLocateDeviceClick,
  handleDeleteDevice,
  handleStartDragNewSensor,
  handleSensorDoubleClick,
  handleDeleteSensorPosition,
  handleAddDevice,
  getSensorLucideIcon,
  isCollapsed,
  onToggleCollapse,
  handleTogglePump,
  presetsList = [],
  handleAssignPreset,
}) => {
  return (
    <aside className={`status-panel ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Toggle Button */}
      <button
        type="button"
        className="status-panel-toggle-btn"
        onClick={onToggleCollapse}
        title={isCollapsed ? "Mở danh sách thiết bị" : "Thu gọn danh sách thiết bị"}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
          {isCollapsed ? 'chevron_left' : 'chevron_right'}
        </span>
      </button>
      {/* Device Registry list */}
      <div className="registry-list-section custom-scrollbar">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 className="registry-section-title" style={{ margin: 0 }}>Danh sách thiết bị</h3>
          <button
            type="button"
            onClick={handleAddDevice}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: 'var(--db-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'opacity 0.2s ease',
            }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
            onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
            Thêm thiết bị
          </button>
        </div>

        <div className="device-rows-container">
          {devices.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--db-on-surface-variant)', fontSize: '13px' }}>
              Chưa có thiết bị nào trong nhà nấm này.
            </div>
          ) : (
            devices.map((device) => {
              const isOnline = device.status === 'online';
              const lastSeenStr = device.lastSeen
                ? `Ping cuối: ${new Date(device.lastSeen).toLocaleTimeString()}`
                : 'Chưa hoạt động';

              return (
                <div 
                  key={device.id} 
                  className={`device-row ${!isOnline ? 'error-theme' : ''}`}
                  onClick={() => toggleDeviceExpand(device.id)}
                  style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '8px' }}
                >
                  <div className="device-row-content">
                    <div className={`device-icon-wrapper ${!isOnline ? 'error-theme' : ''}`}>
                      <span className="material-symbols-outlined">sensors</span>
                    </div>
                    <div className="device-info">
                      <div className="device-name-row">
                        <span className="device-name">{device.name}</span>
                        <span className={`device-status ${isOnline ? 'online' : 'error'}`}>
                          {isOnline ? 'ONLINE' : 'OFFLINE'}
                        </span>
                      </div>
                      <div className="device-details">ID: {device.deviceId} | {lastSeenStr}</div>
                    </div>
                    <div className="device-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        className={`device-locate-btn ${selectedDeviceForPlacement === device.id ? 'active' : ''}`}
                        title="Bố trí cảm biến trên sơ đồ 3D"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLocateDeviceClick(device);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: selectedDeviceForPlacement === device.id
                            ? 'var(--db-primary)'
                            : (device.sensorPositions && Object.keys(device.sensorPositions).length > 0)
                              ? 'var(--db-primary)'
                              : 'var(--db-on-surface-variant)',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '20px', fontVariationSettings: (device.sensorPositions && Object.keys(device.sensorPositions).length > 0) ? "'FILL' 1" : "'FILL' 0" }}>
                          location_on
                        </span>
                      </button>

                      <button
                        type="button"
                        className="device-delete-btn"
                        title="Xóa thiết bị"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDevice(device.id, device.name);
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>delete</span>
                      </button>
                      
                      {expandedDevices[device.id] ? (
                        <span className="material-symbols-outlined device-arrow" style={{ fontSize: '20px' }}>
                          expand_less
                        </span>
                      ) : (
                        <span className="material-symbols-outlined device-arrow" style={{ fontSize: '20px' }}>
                          expand_more
                        </span>
                      )}
                    </div>
                  </div>

                  {(() => {
                    const isExpanded = expandedDevices[device.id];
                    if (!isExpanded) return null;

                    const isOnline = device.status === 'online';
                    const telemetryKeys = device.latestTelemetry
                      ? Object.keys(device.latestTelemetry).filter((k: string) => k !== 'createdAt' && k !== 'pumpState' && k !== 'pump')
                      : [];
                    const positionedKeys = device.sensorPositions
                      ? Object.keys(device.sensorPositions).filter((k: string) => k !== 'pumpState' && k !== 'pump')
                      : [];
                    const availableSensors = Array.from(new Set([...telemetryKeys, ...positionedKeys]));

                    if (availableSensors.length === 0 && !isOnline) return null;

                    return (
                      <div className="device-sub-sensors" style={{
                        marginLeft: '56px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        borderLeft: '1px dashed var(--db-outline-variant)',
                        paddingLeft: '12px',
                        paddingBottom: '4px'
                      }} onClick={(e) => e.stopPropagation()}>
                        {availableSensors.map((sensorKey) => {
                          const pos = device.sensorPositions?.[sensorKey];
                          const isPositioned = pos && pos.spaceX !== undefined && pos.spaceY !== undefined;
                          
                          const getBaseSensorKey = (key: string) => {
                            if (key.startsWith('temperature')) return 'temperature';
                            if (key.startsWith('humidity')) return 'humidity';
                            if (key.startsWith('soilMoisture')) return 'soilMoisture';
                            if (key.startsWith('lightIntensity')) return 'lightIntensity';
                            if (key.startsWith('waterLevel')) return 'waterLevel';
                            return key;
                          };

                          const baseKey = getBaseSensorKey(sensorKey);
                          const SENSOR_LABELS: Record<string, string> = {
                            temperature: 'Nhiệt độ',
                            humidity: 'Độ ẩm KK',
                            soilMoisture: 'Độ ẩm đất',
                            lightIntensity: 'Ánh sáng',
                            waterLevel: 'Mực nước',
                          };
                          
                          const suffix = sensorKey.replace(baseKey, '');
                          const defaultLabel = `${SENSOR_LABELS[baseKey] || baseKey}${suffix ? ' ' + suffix : ''}`;
                          const labelText = pos?.displayName || defaultLabel;

                          return (
                            <div key={sensorKey} style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              fontSize: '11px',
                              color: 'var(--db-on-surface-variant)',
                              padding: '4px 0'
                            }}>
                              <div 
                                style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: '6px',
                                  cursor: isPositioned ? 'default' : 'grab'
                                }}
                                onMouseDown={(e) => {
                                  if (!isPositioned) {
                                    handleStartDragNewSensor(e, device.id, sensorKey);
                                  }
                                }}
                                title={isPositioned ? "Cảm biến đã định vị" : "Nhấn giữ và kéo thả cảm biến này vào bản đồ"}
                              >
                                {getSensorLucideIcon(sensorKey)}
                                <span style={{ 
                                  fontWeight: pos?.displayName ? 600 : 400, 
                                  color: isPositioned ? 'var(--db-on-surface)' : 'var(--db-primary)',
                                  textDecoration: isPositioned ? 'none' : 'underline dashed'
                                }}>
                                  {labelText} {!isPositioned && ' (Kéo thả)'}
                                </span>
                              </div>
                              
                              {isPositioned && (
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSensorDoubleClick(null, device.id, sensorKey, pos?.displayName || '', pos.spaceX, pos.spaceY);
                                    }}
                                    title="Đổi tên cảm biến"
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: 'var(--db-primary)',
                                      cursor: 'pointer',
                                      padding: '2px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      borderRadius: '4px',
                                      transition: 'background-color 0.2s'
                                    }}
                                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0, 108, 73, 0.08)')}
                                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                  >
                                    <Pencil size={11} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteSensorPosition?.(device.id, sensorKey);
                                    }}
                                    title="Xóa cảm biến khỏi thiết bị"
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: 'var(--db-error, #ef4444)',
                                      cursor: 'pointer',
                                      padding: '2px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      borderRadius: '4px',
                                      transition: 'background-color 0.2s'
                                    }}
                                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)')}
                                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Widget điều khiển máy bơm */}
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          padding: '8px 0',
                          marginTop: '8px',
                          borderTop: '1px solid var(--db-outline-variant)',
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--db-primary)' }}>water_drop</span>
                              <span style={{ fontSize: '11px', fontWeight: 600 }}>Máy bơm nước</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                if (isOnline) {
                                  handleTogglePump(device.id, device.pumpState || 'off');
                                }
                              }}
                              disabled={!isOnline}
                              style={{
                                padding: '4px 12px',
                                fontSize: '11px',
                                fontWeight: 600,
                                backgroundColor: !isOnline 
                                  ? '#94a3b8' 
                                  : device.pumpState === 'on' 
                                    ? '#ef4444' 
                                    : 'var(--db-primary)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: isOnline ? 'pointer' : 'not-allowed',
                                transition: 'opacity 0.2s',
                                opacity: isOnline ? 1 : 0.7
                              }}
                              onMouseOver={(e) => {
                                if (isOnline) e.currentTarget.style.opacity = '0.9';
                              }}
                              onMouseOut={(e) => {
                                if (isOnline) e.currentTarget.style.opacity = '1';
                              }}
                              title={!isOnline ? "Thiết bị đang ngoại tuyến, không thể điều khiển bằng tay" : ""}
                            >
                              {!isOnline ? 'OFFLINE' : device.pumpState === 'on' ? 'TẮT BƠM' : 'BẬT BƠM'}
                            </button>
                          </div>
                          
                          {/* Dropdown chọn Preset */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '10px', fontWeight: 600, color: 'var(--db-on-surface-variant)' }}>Chế độ tự động (Preset):</label>
                            <select
                              value={device.activePreset || ''}
                              onChange={(e) => handleAssignPreset?.(device.id, e.target.value || null)}
                              style={{
                                width: '100%',
                                padding: '6px 8px',
                                fontSize: '11px',
                                borderRadius: '4px',
                                border: '1px solid var(--db-outline-variant)',
                                backgroundColor: 'var(--db-surface-container-lowest)',
                                color: 'var(--db-on-surface)',
                                outline: 'none',
                                boxSizing: 'border-box'
                              }}
                            >
                              <option value="">Điều khiển thủ công (Không tự động)</option>
                              {presetsList.map((p: any) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="panel-footer-controls">
        <button type="button" className="system-control-btn">
          <span className="material-symbols-outlined">settings_suggest</span>
          Điều khiển hệ thống
        </button>
      </div>
    </aside>
  );
};
