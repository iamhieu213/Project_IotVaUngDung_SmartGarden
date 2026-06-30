import React from 'react';

interface SensorStatsBarProps {
  activeCount: number;
  inactiveCount: number;
  countSensors: (type: string) => number;
}

export const SensorStatsBar: React.FC<SensorStatsBarProps> = ({
  activeCount,
  inactiveCount,
  countSensors,
}) => {
  return (
    <div className="sensor-stats-bar" style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '24px',
      padding: '12px 24px',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(8px)',
      borderBottom: '1px solid var(--db-outline-variant)',
      zIndex: 30,
      fontFamily: "'Inter', sans-serif",
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
      boxSizing: 'border-box'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', fontWeight: 600 }}>
        <span style={{ color: 'var(--db-on-surface)' }}>Thiết bị:</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 6px #10b981' }}></span>
          <span style={{ fontSize: '12px', color: 'var(--db-on-surface-variant)', fontWeight: 500 }}>Hoạt động: <strong>{activeCount}</strong></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#ef4444', boxShadow: '0 0 6px #ef4444' }}></span>
          <span style={{ fontSize: '12px', color: 'var(--db-on-surface-variant)', fontWeight: 500 }}>Tắt: <strong>{inactiveCount}</strong></span>
        </div>
      </div>
      
      <div style={{ width: '1px', backgroundColor: 'var(--db-outline-variant)', height: '16px' }}></div>
      
      {/* Thống kê các cảm biến */}
      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--db-on-surface-variant)' }}>
          <span className="material-symbols-outlined" style={{ color: '#ef4444', fontSize: '20px' }}>thermostat</span>
          <span>Số lượng: <strong>{countSensors('temperature')}</strong></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--db-on-surface-variant)' }}>
          <span className="material-symbols-outlined" style={{ color: '#3b82f6', fontSize: '20px' }}>humidity_percentage</span>
          <span>Số lượng: <strong>{countSensors('humidity')}</strong></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--db-on-surface-variant)' }}>
          <span className="material-symbols-outlined" style={{ color: '#4f46e5', fontSize: '20px' }}>opacity</span>
          <span>Số lượng: <strong>{countSensors('soilMoisture')}</strong></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--db-on-surface-variant)' }}>
          <span className="material-symbols-outlined" style={{ color: '#9333ea', fontSize: '20px' }}>water_drop</span>
          <span>Số lượng: <strong>{countSensors('waterLevel')}</strong></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--db-on-surface-variant)' }}>
          <span className="material-symbols-outlined" style={{ color: '#d97706', fontSize: '20px' }}>light_mode</span>
          <span>Số lượng: <strong>{countSensors('lightIntensity')}</strong></span>
        </div>
      </div>
    </div>
  );
};
