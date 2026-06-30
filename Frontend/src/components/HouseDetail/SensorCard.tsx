import React from 'react';

interface SensorCardProps {
  device: any;
  sensorKey: string;
  pos: any;
  valStr: string;
  isSensorOnline: boolean;
  icon: string;
  rotation: number;
  isFlatView: boolean;
  isDragging: boolean;
  draggedSensor: any;
  isSelected: boolean;
  labelText: string;
  handleSensorMouseDown: (e: React.MouseEvent, deviceId: string, sensorKey: string) => void;
  handleSensorDoubleClick: (e: React.MouseEvent | null, deviceId: string, sensorKey: string, currentName: string, spaceX: number, spaceY: number) => void;
}

export const SensorCard: React.FC<SensorCardProps> = ({
  device,
  sensorKey,
  pos,
  valStr,
  isSensorOnline,
  icon,
  rotation,
  isFlatView,
  isDragging,
  draggedSensor,
  isSelected,
  labelText,
  handleSensorMouseDown,
  handleSensorDoubleClick,
}) => {
  const getBaseSensorKey = (key: string) => {
    if (key.startsWith('temperature')) return 'temperature';
    if (key.startsWith('humidity')) return 'humidity';
    if (key.startsWith('soilMoisture')) return 'soilMoisture';
    if (key.startsWith('lightIntensity')) return 'lightIntensity';
    if (key.startsWith('waterLevel')) return 'waterLevel';
    return key;
  };

  return (
    <div
      key={`sensor-${device.id}-${sensorKey}`}
      className="isometric-card"
      style={{
        position: 'absolute',
        left: `${pos.spaceX}%`,
        top: `${pos.spaceY}%`,
        transform: isFlatView 
          ? 'translate(-50%, -100%)' 
          : `translate(-50%, -100%) translateZ(40px) rotateZ(${-rotation}deg) rotateX(-60deg)`,
        zIndex: isSelected ? 100 : 50,
      }}
    >
      {/* Bong bóng Tooltip hiển thị đầy đủ thông tin khi được click chọn */}
      {isSelected && (
        <div className="sensor-tooltip-bubble" style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%) translateY(-10px)',
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(4px)',
          color: '#ffffff',
          padding: '8px 12px',
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -4px rgba(0, 0, 0, 0.3)',
          fontSize: '11px',
          whiteSpace: 'nowrap',
          zIndex: 101,
          border: '1px solid rgba(255, 255, 255, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          pointerEvents: 'auto',
          fontFamily: "'Inter', sans-serif"
        }}>
          <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#10b981' }}>
            {labelText}
          </div>
          <div style={{ opacity: 0.9, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>Giá trị:</span>
            <strong style={{ color: '#34d399', fontSize: '12px' }}>{valStr}</strong>
          </div>
          <div style={{ fontSize: '9px', opacity: 0.6, borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '4px', marginTop: '2px' }}>
            Mạch: {device.name} ({device.deviceId})
          </div>
          {/* Mũi tên nhỏ ở dưới cùng tooltip */}
          <div style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '6px solid rgba(15, 23, 42, 0.95)'
          }}></div>
        </div>
      )}

      <div 
        className={`floating-3d-card theme-${getBaseSensorKey(sensorKey)} ${!isSensorOnline ? 'alert-border' : ''}`}
        onMouseDown={(e) => handleSensorMouseDown(e, device.id, sensorKey)}
        onDoubleClick={(e) => handleSensorDoubleClick(e, device.id, sensorKey, pos.displayName || '', pos.spaceX, pos.spaceY)}
        style={{
          cursor: isDragging && draggedSensor?.deviceId === device.id && draggedSensor?.sensorKey === sensorKey ? 'grabbing' : 'grab',
          userSelect: 'none'
        }}
      >
        {/* Chấm tròn trạng thái nhô lên ở đỉnh giữa card */}
        <span className={`status-dot ${isSensorOnline ? 'active' : 'error animate-pulse'}`}></span>
        
        {/* Giá trị hiển thị ở trên đầu */}
        <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--db-on-surface)', lineHeight: 1, marginTop: '2px', zIndex: 2, whiteSpace: 'nowrap' }}>
          {valStr}
        </span>

        {/* Icon cảm biến ở dưới */}
        <span className="material-symbols-outlined" style={{ fontSize: '24px', margin: '2px 0' }}>{icon}</span>
        
        {/* Tên thiết bị ở dưới cùng (ưu tiên displayName) */}
        <span style={{ fontSize: '7px', opacity: 0.6, textTransform: 'uppercase', display: 'block', maxWidth: '48px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={pos.displayName || `${device.name} (${sensorKey})`}>
          {pos.displayName || device.name}
        </span>
      </div>
    </div>
  );
};
