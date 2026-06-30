import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { NotificationDropdown } from '../NotificationDropdown/NotificationDropdown';
import Swal from 'sweetalert2';
import api from '../../utils/api';
import './PresetsPage.css';

interface Preset {
  id: string;
  name: string;
  tempMin?: number;
  tempMax?: number;
  humidityMin?: number;
  humidityMax?: number;
  soilMoistureMin: number;
  soilMoistureMax: number;
  createdAt: string;
}

export const PresetsPage: React.FC = () => {
  const { logout, user } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [soilMin, setSoilMin] = useState<number>(30);
  const [soilMax, setSoilMax] = useState<number>(70);
  const [tempMin, setTempMin] = useState<string>('');
  const [tempMax, setTempMax] = useState<string>('');
  const [humMin, setHumMin] = useState<string>('');
  const [humMax, setHumMax] = useState<string>('');

  const fetchPresets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/presets');
      if (res.data.success) {
        setPresets(res.data.data);
      }
    } catch (err: any) {
      console.error('Lỗi khi tải danh sách preset:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPresets();
  }, []);

  const handleLogout = async () => {
    await logout();
    Swal.fire({
      icon: 'success',
      title: 'Đăng xuất thành công',
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const resetForm = () => {
    setName('');
    setSoilMin(30);
    setSoilMax(70);
    setTempMin('');
    setTempMax('');
    setHumMin('');
    setHumMax('');
    setEditingPresetId(null);
    setIsFormOpen(false);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleOpenEdit = (preset: Preset) => {
    setEditingPresetId(preset.id);
    setName(preset.name);
    setSoilMin(preset.soilMoistureMin);
    setSoilMax(preset.soilMoistureMax);
    setTempMin(preset.tempMin !== undefined ? String(preset.tempMin) : '');
    setTempMax(preset.tempMax !== undefined ? String(preset.tempMax) : '');
    setHumMin(preset.humidityMin !== undefined ? String(preset.humidityMin) : '');
    setHumMax(preset.humidityMax !== undefined ? String(preset.humidityMax) : '');
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      Swal.fire('Thất bại', 'Vui lòng nhập tên cấu hình', 'error');
      return;
    }

    if (soilMin > soilMax) {
      Swal.fire('Thất bại', 'Độ ẩm đất tối thiểu không thể lớn hơn tối đa', 'error');
      return;
    }

    const payload: any = {
      name,
      soilMoistureMin: soilMin,
      soilMoistureMax: soilMax,
    };

    if (tempMin !== '') payload.tempMin = Number(tempMin);
    if (tempMax !== '') payload.tempMax = Number(tempMax);
    if (humMin !== '') payload.humidityMin = Number(humMin);
    if (humMax !== '') payload.humidityMax = Number(humMax);

    if (payload.tempMin !== undefined && payload.tempMax !== undefined && payload.tempMin > payload.tempMax) {
      Swal.fire('Thất bại', 'Nhiệt độ tối thiểu không thể lớn hơn tối đa', 'error');
      return;
    }

    if (payload.humidityMin !== undefined && payload.humidityMax !== undefined && payload.humidityMin > payload.humidityMax) {
      Swal.fire('Thất bại', 'Độ ẩm không khí tối thiểu không thể lớn hơn tối đa', 'error');
      return;
    }

    try {
      if (editingPresetId) {
        const res = await api.put(`/presets/${editingPresetId}`, payload);
        if (res.data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Đã cập nhật cấu hình',
            timer: 1500,
            showConfirmButton: false
          });
          fetchPresets();
          resetForm();
        }
      } else {
        const res = await api.post('/presets', payload);
        if (res.data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Đã thêm cấu hình mới',
            timer: 1500,
            showConfirmButton: false
          });
          fetchPresets();
          resetForm();
        }
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Thất bại',
        text: err.response?.data?.message || 'Có lỗi xảy ra.'
      });
    }
  };

  const handleDelete = async (id: string, presetName: string) => {
    const confirm = await Swal.fire({
      title: 'Xóa cấu hình?',
      text: `Bạn có chắc chắn muốn xóa "${presetName}"? Các thiết bị đang sử dụng cấu hình này sẽ tự động chuyển sang chế độ điều khiển thủ công.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Đồng ý xóa',
      cancelButtonText: 'Hủy bỏ',
      confirmButtonColor: 'var(--db-error, #ba1a1a)',
    });

    if (confirm.isConfirmed) {
      try {
        const res = await api.delete(`/presets/${id}`);
        if (res.data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Đã xóa thành công',
            timer: 1500,
            showConfirmButton: false
          });
          fetchPresets();
        }
      } catch (err: any) {
        Swal.fire({
          icon: 'error',
          title: 'Thất bại',
          text: err.response?.data?.message || 'Không thể xóa cấu hình.'
        });
      }
    }
  };

  return (
    <div className={`dashboard-page ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar
        activeId="presets"
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <main className="dashboard-main min-w-0">
        <header className="dashboard-header">
          <div className="header-left">
            <span className="header-label" style={{ fontWeight: 600, fontSize: '18px' }}>Cấu hình điều khiển tự động</span>
          </div>
          <div className="header-right">
            <div className="header-right-links">
              <NotificationDropdown />
              <button type="button" className="header-link-item" title="Đăng xuất" onClick={handleLogout}>
                <span className="material-symbols-outlined header-link-icon">logout</span>
              </button>
            </div>
            <div className="user-profile-widget">
              <div className="user-avatar-initials">
                {user?.username ? user.username.charAt(0).toUpperCase() : 'N'}
              </div>
              <div className="user-profile-info">
                <span className="user-profile-name">{user?.username || 'Người dùng'}</span>
                <span className="user-profile-role">Nhà nông</span>
              </div>
            </div>
          </div>
        </header>

        <div className="dashboard-content custom-scrollbar" style={{ overflowY: 'auto', flex: 1, height: 'calc(100vh - 64px)' }}>
          
          <div className="houses-header-actions">
            <div className="houses-title-wrapper">
              <h2>Preset Điều khiển Máy Bơm</h2>
              <p>Quản lý các kịch bản bật/tắt bơm tự động dựa trên độ ẩm đất và các điều kiện môi trường.</p>
            </div>
            {!isFormOpen && (
              <button type="button" className="add-house-btn" onClick={handleOpenCreate}>
                <span className="material-symbols-outlined">add</span>
                Tạo cấu hình mới
              </button>
            )}
          </div>

          <div className="presets-metrics-grid" style={{ marginBottom: '24px' }}>
            <div className="presets-metrics-card">
              <div className="metrics-card-header">
                <div className="metrics-icon-wrapper primary">
                  <span className="material-symbols-outlined">tune</span>
                </div>
              </div>
              <p className="metrics-title">Tổng số cấu hình</p>
              <p className="metrics-value">{presets.length}</p>
            </div>
          </div>

          {isFormOpen && (
            <div className="form-card-container">
              <div className="form-card-header">
                <h3>{editingPresetId ? 'Chỉnh sửa cấu hình' : 'Tạo cấu hình preset mới'}</h3>
                <button type="button" className="close-form-btn" onClick={resetForm}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="preset-form">
                <div className="form-group-row">
                  <div className="form-group">
                    <label>Tên cấu hình (Ví dụ: Trồng Nấm Kim Châm)</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Tên kịch bản..."
                      required
                    />
                  </div>
                </div>

                <h4 className="section-subtitle">Chỉ số Độ ẩm Đất (Bắt buộc)</h4>
                <div className="form-group-row col-2">
                  <div className="form-group">
                    <label>Độ ẩm đất tối thiểu (%) - Bật bơm khi dưới mức này</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={soilMin}
                      onChange={(e) => setSoilMin(Number(e.target.value))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Độ ẩm đất tối đa (%) - Ngắt bơm khi đạt mức này</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={soilMax}
                      onChange={(e) => setSoilMax(Number(e.target.value))}
                      required
                    />
                  </div>
                </div>

                <h4 className="section-subtitle">Chỉ số Nhiệt độ & Độ ẩm không khí (Tùy chọn)</h4>
                <div className="form-group-row col-4">
                  <div className="form-group">
                    <label>Nhiệt độ Min (°C)</label>
                    <input
                      type="number"
                      value={tempMin}
                      onChange={(e) => setTempMin(e.target.value)}
                      placeholder="Tùy chọn"
                    />
                  </div>
                  <div className="form-group">
                    <label>Nhiệt độ Max (°C)</label>
                    <input
                      type="number"
                      value={tempMax}
                      onChange={(e) => setTempMax(e.target.value)}
                      placeholder="Tùy chọn"
                    />
                  </div>
                  <div className="form-group">
                    <label>Độ ẩm KK Min (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={humMin}
                      onChange={(e) => setHumMin(e.target.value)}
                      placeholder="Tùy chọn"
                    />
                  </div>
                  <div className="form-group">
                    <label>Độ ẩm KK Max (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={humMax}
                      onChange={(e) => setHumMax(e.target.value)}
                      placeholder="Tùy chọn"
                    />
                  </div>
                </div>

                <div className="form-actions-row">
                  <button type="button" className="cancel-btn" onClick={resetForm}>Hủy bỏ</button>
                  <button type="submit" className="submit-btn">
                    {editingPresetId ? 'Cập nhật cấu hình' : 'Tạo cấu hình'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="presets-list-grid">
            {loading ? (
              <p style={{ textAlign: 'center', gridColumn: 'span 3', padding: '40px' }}>Đang tải cấu hình...</p>
            ) : presets.length === 0 ? (
              <div className="no-presets-card" style={{ gridColumn: 'span 3' }}>
                <span className="material-symbols-outlined no-presets-icon">tune</span>
                <p>Chưa có cấu hình preset nào được tạo. Hãy nhấn "Tạo cấu hình mới" để bắt đầu thiết lập tự động tưới nước.</p>
              </div>
            ) : (
              presets.map((preset) => (
                <div className="preset-item-card" key={preset.id}>
                  <div className="preset-card-header">
                    <h4>{preset.name}</h4>
                    <div className="preset-card-actions">
                      <button type="button" className="action-icon-btn edit" onClick={() => handleOpenEdit(preset)} title="Chỉnh sửa">
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                      <button type="button" className="action-icon-btn delete" onClick={() => handleDelete(preset.id, preset.name)} title="Xóa">
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  </div>

                  <div className="preset-card-body">
                    <div className="metric-limit-row">
                      <span className="material-symbols-outlined metric-icon opacity-icon">opacity</span>
                      <div className="metric-limit-info">
                        <span className="metric-lbl">Ngưỡng độ ẩm đất</span>
                        <span className="metric-val">{preset.soilMoistureMin}% - {preset.soilMoistureMax}%</span>
                      </div>
                    </div>

                    {(preset.tempMin !== undefined || preset.tempMax !== undefined) && (
                      <div className="metric-limit-row">
                        <span className="material-symbols-outlined metric-icon temp-icon">thermostat</span>
                        <div className="metric-limit-info">
                          <span className="metric-lbl">Giới hạn nhiệt độ</span>
                          <span className="metric-val">
                            {preset.tempMin !== undefined ? `${preset.tempMin}°C` : '--'} - {preset.tempMax !== undefined ? `${preset.tempMax}°C` : '--'}
                          </span>
                        </div>
                      </div>
                    )}

                    {(preset.humidityMin !== undefined || preset.humidityMax !== undefined) && (
                      <div className="metric-limit-row">
                        <span className="material-symbols-outlined metric-icon hum-icon">humidity_percentage</span>
                        <div className="metric-limit-info">
                          <span className="metric-lbl">Giới hạn độ ẩm không khí</span>
                          <span className="metric-val">
                            {preset.humidityMin !== undefined ? `${preset.humidityMin}%` : '--'} - {preset.humidityMax !== undefined ? `${preset.humidityMax}%` : '--'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </main>
    </div>
  );
};

export default PresetsPage;
