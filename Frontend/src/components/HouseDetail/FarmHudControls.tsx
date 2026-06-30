import React from 'react';

interface FarmHudControlsProps {
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handleRotate: () => void;
}

export const FarmHudControls: React.FC<FarmHudControlsProps> = ({
  handleZoomIn,
  handleZoomOut,
  handleRotate,
}) => {
  return (
    <div className="hud-controls-wrapper">
      <div className="hud-button-group">
        <button
          type="button"
          className="hud-btn"
          onClick={handleZoomIn}
          title="Phóng to"
        >
          <span className="material-symbols-outlined">add</span>
        </button>
        <div style={{ height: '1px', backgroundColor: 'var(--db-outline-variant)' }}></div>
        <button
          type="button"
          className="hud-btn"
          onClick={handleZoomOut}
          title="Thu nhỏ"
        >
          <span className="material-symbols-outlined">remove</span>
        </button>
      </div>
      <div className="hud-button-group">
        <button
          type="button"
          className="hud-btn active"
          title="Công cụ chọn"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            near_me
          </span>
        </button>
        <button
          type="button"
          className="hud-btn"
          onClick={handleRotate}
          title="Xoay góc nhìn"
        >
          <span className="material-symbols-outlined">refresh</span>
        </button>
        <button
          type="button"
          className="hud-btn"
          title="Góc nhìn 3D"
        >
          <span className="material-symbols-outlined">view_in_ar</span>
        </button>
      </div>
    </div>
  );
};
