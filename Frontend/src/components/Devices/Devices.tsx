import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import './Devices.css';
import { useAuth } from '../../context/AuthContext';
import { NotificationDropdown } from '../NotificationDropdown/NotificationDropdown';
import Swal from 'sweetalert2';
import api from '../../utils/api';
import { io } from 'socket.io-client';

interface House {
  id: string;
  name: string;
}

interface ComponentItem {
  id: string; // unique ID: parentId + '-' + typeKey
  parentId: string; // Mongoose ID of parent ESP32
  parentDeviceId: string; // MAC / hardware ID of ESP32
  parentName: string; // Name of ESP32 board
  name: string; // e.g. "Cảm biến Nhiệt độ (Node A)"
  type: string; // e.g. "Nhiệt độ (°C)"
  iconName: string;
  value: string; // current reading value
  houseName: string;
  status: boolean; // parent online status
  lastUpdate: string;
  isOffline: boolean;
  rawTelemetry?: any;
}

// Format last update helper
const formatLastUpdate = (lastSeen?: string | Date, isOffline?: boolean) => {
  if (!lastSeen) return isOffline ? 'Ngoại tuyến' : 'Chưa cập nhật';
  const date = new Date(lastSeen);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  
  return date.toLocaleDateString('vi-VN');
};

export const Devices: React.FC = () => {
  const { logout, user } = useAuth();

  // State management
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedComponent, setSelectedComponent] = useState<ComponentItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [houses, setHouses] = useState<House[]>([]);
  const [selectedHouseId, setSelectedHouseId] = useState<string>('');
  const [rawDevices, setRawDevices] = useState<any[]>([]);
  const [unregisteredIds, setUnregisteredIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [presetsList, setPresetsList] = useState<any[]>([]);

  // Transform physical ESP32 boards to individual sensor and actuator component items
  const getComponentItems = (deviceList: any[]): ComponentItem[] => {
    const items: ComponentItem[] = [];

    deviceList.forEach((dev) => {
      const houseObj = houses.find((h) => h.id === dev.house);
      const houseName = houseObj ? houseObj.name : 'Chưa gán';
      const status = dev.status === 'online';
      const isOffline = dev.status === 'offline';
      const lastUpdate = formatLastUpdate(dev.lastSeen, isOffline);

      const lowerName = dev.name.toLowerCase();
      const lowerId = dev.deviceId.toLowerCase();
      
      const isSensorNode = lowerName.includes('cảm biến') || lowerName.includes('sens') || lowerId.includes('sens') || (dev.sensorPositions && Object.keys(dev.sensorPositions).length > 0);

      if (isSensorNode) {
        const telemetry = dev.latestTelemetry;
        const positions = dev.sensorPositions || {};

        const baseSensors = [
          {
            key: 'temperature',
            name: 'Cảm biến Nhiệt độ',
            type: 'Nhiệt độ (°C)',
            icon: 'thermostat',
            unit: '°C'
          },
          {
            key: 'humidity',
            name: 'Cảm biến Độ ẩm khí',
            type: 'Độ ẩm khí (%)',
            icon: 'humidity_percentage',
            unit: '%'
          },
          {
            key: 'soilMoisture',
            name: 'Cảm biến Độ ẩm đất',
            type: 'Độ ẩm đất (%)',
            icon: 'opacity',
            unit: '%'
          },
          {
            key: 'lightIntensity',
            name: 'Cảm biến Ánh sáng',
            type: 'Ánh sáng (lux)',
            icon: 'light_mode',
            unit: 'lux'
          },
          {
            key: 'waterLevel',
            name: 'Cảm biến Mực nước',
            type: 'Mực nước (mm)',
            icon: 'water_drop',
            unit: 'mm'
          }
        ];

        baseSensors.forEach((spec) => {
          // 1. Kiểm tra cảm biến số 1 (key thường hoặc key có số 1)
          const key1 = (telemetry && telemetry[spec.key] !== undefined) 
            ? spec.key 
            : (positions && positions[spec.key] !== undefined)
              ? spec.key
              : `${spec.key}1`;
          const has1 = (telemetry && telemetry[key1] !== undefined) || (positions && positions[key1] !== undefined);

          if (has1) {
            const customName = positions[key1]?.displayName || `${spec.name} 1 (${dev.name})`;
            const rawVal = telemetry ? telemetry[key1] : undefined;
            const isUnplugged = (rawVal === undefined || rawVal === -127 || rawVal === -999);
            const valStr = !isUnplugged 
              ? (spec.key === 'lightIntensity' || spec.key === 'waterLevel')
                ? `${Math.round(rawVal)} ${spec.unit}`
                : `${rawVal.toFixed(1).replace('.', ',')} ${spec.unit}`
              : '--';

            const compOffline = isOffline || isUnplugged;

            items.push({
              id: `${dev.id}-${key1}`,
              parentId: dev.id,
              parentDeviceId: dev.deviceId,
              parentName: dev.name,
              name: customName,
              type: `${spec.name} 1 (${spec.unit})`,
              iconName: spec.icon,
              value: valStr,
              houseName,
              status: !compOffline,
              lastUpdate,
              isOffline: compOffline,
              rawTelemetry: telemetry
            });
          }

          // 2. Kiểm tra cảm biến số 2 (key có số 2)
          const key2 = `${spec.key}2`;
          const has2 = (telemetry && telemetry[key2] !== undefined) || positions[key2] !== undefined;

          if (has2) {
            const customName = positions[key2]?.displayName || `${spec.name} 2 (${dev.name})`;
            const rawVal = telemetry ? telemetry[key2] : undefined;
            const isUnplugged = (rawVal === undefined || rawVal === -127 || rawVal === -999);
            const valStr = !isUnplugged 
              ? (spec.key === 'lightIntensity' || spec.key === 'waterLevel')
                ? `${Math.round(rawVal)} ${spec.unit}`
                : `${rawVal.toFixed(1).replace('.', ',')} ${spec.unit}`
              : '--';

            const compOffline = isOffline || isUnplugged;

            items.push({
              id: `${dev.id}-${key2}`,
              parentId: dev.id,
              parentDeviceId: dev.deviceId,
              parentName: dev.name,
              name: customName,
              type: `${spec.name} 2 (${spec.unit})`,
              iconName: spec.icon,
              value: valStr,
              houseName,
              status: !compOffline,
              lastUpdate,
              isOffline: compOffline,
              rawTelemetry: telemetry
            });
          }
        });
      } else {
        // Actuator node (Pump, Fan, Led)
        let actuatorType = 'Thiết bị khác';
        let actuatorIcon = 'device_hub';
        let valueStr = status ? 'Đang chạy' : 'Tắt / Ngoại tuyến';

        if (lowerName.includes('bơm') || lowerName.includes('pump') || lowerId.includes('pump')) {
          actuatorType = 'Máy bơm';
          actuatorIcon = 'water_drop';
        } else if (lowerName.includes('quạt') || lowerName.includes('fan') || lowerId.includes('fan')) {
          actuatorType = 'Động cơ';
          actuatorIcon = 'toys_fan';
        } else if (lowerName.includes('đèn') || lowerName.includes('led') || lowerName.includes('light') || lowerId.includes('led')) {
          actuatorType = 'Hệ đèn LED';
          actuatorIcon = 'light_mode';
        }

        items.push({
          id: dev.id,
          parentId: dev.id,
          parentDeviceId: dev.deviceId,
          parentName: dev.name,
          name: dev.name,
          type: actuatorType,
          iconName: actuatorIcon,
          value: valueStr,
          houseName,
          status,
          lastUpdate,
          isOffline,
          rawTelemetry: dev.latestTelemetry
        });
      }
    });

    return items;
  };

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

  // Fetch devices by house
  const fetchDevices = async (houseId: string) => {
    if (!houseId) return;
    setLoading(true);
    try {
      const res = await api.get(`/devices/house/${houseId}`);
      if (res.data.success) {
        setRawDevices(res.data.data);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách thiết bị:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch unregistered devices list
  const fetchUnregistered = async () => {
    try {
      const res = await api.get('/devices/unregistered');
      if (res.data.success) {
        setUnregisteredIds(res.data.data);
      }
    } catch (err) {
      console.error('Lỗi khi tải hàng chờ thiết bị chưa đăng ký:', err);
    }
  };

  const fetchPresetsList = async () => {
    try {
      const res = await api.get('/presets');
      if (res.data.success) {
        setPresetsList(res.data.data);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách preset:', err);
    }
  };

  // Initial load
  useEffect(() => {
    const init = async () => {
      try {
        const res = await api.get('/houses');
        if (res.data.success) {
          const housesList = res.data.data;
          setHouses(housesList);
          if (housesList.length > 0) {
            setSelectedHouseId(housesList[0].id);
            await fetchDevices(housesList[0].id);
          }
        }
      } catch (err) {
        console.error('Lỗi khi khởi tạo danh sách nhà nấm:', err);
      }
      fetchUnregistered();
      fetchPresetsList();
    };
    init();
  }, []);

  // Reload devices when selecting a different house
  useEffect(() => {
    if (selectedHouseId) {
      fetchDevices(selectedHouseId);
    }
  }, [selectedHouseId]);

  // Real-time synchronization
  useEffect(() => {
    const socket = io('http://localhost:3000');

    socket.on('device_update', (updatedDevice: any) => {
      const devHouseId = typeof updatedDevice.house === 'object'
        ? updatedDevice.house?._id || updatedDevice.house?.id
        : updatedDevice.house;

      if (selectedHouseId && devHouseId === selectedHouseId) {
        setRawDevices((prevDevices) => {
          const isExist = prevDevices.some((d) => d.id === updatedDevice.id);
          if (isExist) {
            return prevDevices.map((d) => (d.id === updatedDevice.id ? updatedDevice : d));
          } else {
            return [...prevDevices, updatedDevice];
          }
        });
      }
    });

    socket.on('new_unregistered_device', (deviceId: string) => {
      setUnregisteredIds((prev) => {
        if (prev.includes(deviceId)) return prev;
        return [...prev, deviceId];
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedHouseId]);

  // Update selected component dynamically in drawer if telemetry changes
  useEffect(() => {
    if (selectedComponent) {
      const parentDevice = rawDevices.find((d) => d.id === selectedComponent.parentId);
      if (parentDevice) {
        const expandedComponents = getComponentItems([parentDevice]);
        const matched = expandedComponents.find((c) => c.id === selectedComponent.id);
        if (matched) {
          setSelectedComponent(matched);
        }
      }
    }
  }, [rawDevices]);

  // Handle Add Device
  const handleAddDevice = async () => {
    const houseOptions = houses.map((h) => `<option value="${h.id}">${h.name}</option>`).join('');
    const idOptions = unregisteredIds.map((id) => `<option value="${id}">${id}</option>`).join('');
    
    const selectIdHtml = unregisteredIds.length > 0 
      ? `
        <div style="margin-bottom: 15px; text-align: left;">
          <label style="font-weight: 500; font-size: 14px; margin-bottom: 6px; display: block; color: var(--db-on-surface);">Chọn ID phát hiện tự động</label>
          <select id="swal-device-id-select" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--db-outline-variant); font-size: 14px; box-sizing: border-box;">
            <option value="">-- Nhập thủ công --</option>
            ${idOptions}
          </select>
        </div>
      `
      : '';

    const { value: formValues } = await Swal.fire({
      title: 'Thêm thiết bị ESP32 mới',
      html: `
        <div style="text-align: left;">
          ${selectIdHtml}
          <div style="margin-bottom: 15px;">
            <label style="font-weight: 500; font-size: 14px; margin-bottom: 6px; display: block; color: var(--db-on-surface);">Mã ID Thiết bị (MAC Address)</label>
            <input id="swal-device-id" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--db-outline-variant); font-size: 14px; box-sizing: border-box;" placeholder="Ví dụ: SG-PUMP-001 hoặc địa chỉ MAC">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="font-weight: 500; font-size: 14px; margin-bottom: 6px; display: block; color: var(--db-on-surface);">Tên thiết bị hiển thị</label>
            <input id="swal-device-name" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--db-outline-variant); font-size: 14px; box-sizing: border-box;" placeholder="Ví dụ: ESP32 Khu vực A">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="font-weight: 500; font-size: 14px; margin-bottom: 6px; display: block; color: var(--db-on-surface);">Thuộc nhà nấm</label>
            <select id="swal-device-house" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--db-outline-variant); font-size: 14px; box-sizing: border-box;">
              ${houseOptions}
            </select>
          </div>
        </div>
      `,
      didOpen: () => {
        const select = document.getElementById('swal-device-id-select') as HTMLSelectElement;
        const input = document.getElementById('swal-device-id') as HTMLInputElement;
        if (select && input) {
          select.addEventListener('change', () => {
            if (select.value) {
              input.value = select.value;
              input.disabled = true;
            } else {
              input.value = '';
              input.disabled = false;
            }
          });
        }
      },
      preConfirm: () => {
        const selectEl = document.getElementById('swal-device-id-select') as HTMLSelectElement;
        const idInput = document.getElementById('swal-device-id') as HTMLInputElement;
        const nameInput = document.getElementById('swal-device-name') as HTMLInputElement;
        const houseInput = document.getElementById('swal-device-house') as HTMLSelectElement;

        const deviceId = selectEl && selectEl.value ? selectEl.value : idInput.value;
        const name = nameInput.value;
        const houseId = houseInput.value;

        if (!deviceId || !name) {
          Swal.showValidationMessage('Vui lòng nhập đầy đủ Mã ID và Tên thiết bị');
          return false;
        }

        return { deviceId, name, houseId };
      }
    });

    if (formValues) {
      try {
        const res = await api.post('/devices/create', formValues);
        if (res.data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Thành công',
            text: 'Đăng ký thiết bị thành công!',
            timer: 1500,
            showConfirmButton: false
          });
          
          fetchDevices(selectedHouseId);
          fetchUnregistered();
        }
      } catch (err: any) {
        Swal.fire({
          icon: 'error',
          title: 'Thất bại',
          text: err.response?.data?.message || 'Có lỗi xảy ra khi tạo thiết bị.'
        });
      }
    }
  };


  const handleOpenDrawer = (comp: ComponentItem) => {
    setSelectedComponent(comp);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  // Get expanded list of components
  const componentItems = getComponentItems(rawDevices);

  // Filter based on search query
  const filteredComponents = componentItems.filter((comp) =>
    comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    comp.parentDeviceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    comp.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Hàm tính toán số lượng cảm biến vật lý thực tế cắm vào (DHT22 tính là 1)
  const getPhysicalSensorStats = (deviceList: any[]) => {
    let total = 0;
    let offline = 0;

    deviceList.forEach((dev) => {
      const telemetry = dev.latestTelemetry;
      const positions = dev.sensorPositions || {};
      const isDeviceOffline = dev.status === 'offline';

      const checkSensor = (keys: string[]) => {
        // Tìm xem có bất kỳ key nào tồn tại trong telemetry hoặc positions
        const exists = keys.some(k => 
          (telemetry && telemetry[k] !== undefined) || (positions && positions[k] !== undefined)
        );
        if (!exists) return null;

        // Nếu tồn tại cảm biến vật lý đó, kiểm tra xem nó có bị offline/rút dây không
        const isOffline = isDeviceOffline || keys.every(k => {
          const rawVal = telemetry ? telemetry[k] : undefined;
          return rawVal === undefined || rawVal === -127 || rawVal === -999;
        });

        return { isOffline };
      };

      // 1. DHT 1
      const dht1 = checkSensor(['temperature', 'temperature1', 'humidity', 'humidity1']);
      if (dht1) {
        total++;
        if (dht1.isOffline) offline++;
      }

      // 2. DHT 2
      const dht2 = checkSensor(['temperature2', 'humidity2']);
      if (dht2) {
        total++;
        if (dht2.isOffline) offline++;
      }

      // 3. Soil 1
      const soil1 = checkSensor(['soilMoisture', 'soilMoisture1']);
      if (soil1) {
        total++;
        if (soil1.isOffline) offline++;
      }

      // 4. Soil 2
      const soil2 = checkSensor(['soilMoisture2']);
      if (soil2) {
        total++;
        if (soil2.isOffline) offline++;
      }

      // 5. Water 1
      const water1 = checkSensor(['waterLevel', 'waterLevel1']);
      if (water1) {
        total++;
        if (water1.isOffline) offline++;
      }

      // 6. Water 2
      const water2 = checkSensor(['waterLevel2']);
      if (water2) {
        total++;
        if (water2.isOffline) offline++;
      }

      // 7. Light 1
      const light1 = checkSensor(['lightIntensity', 'lightIntensity1', 'lightLevel']);
      if (light1) {
        total++;
        if (light1.isOffline) offline++;
      }

      // 8. Light 2
      const light2 = checkSensor(['lightIntensity2']);
      if (light2) {
        total++;
        if (light2.isOffline) offline++;
      }
    });

    return { total, offline };
  };

  // Tính toán số lượng dựa trên thiết bị vật lý thực tế cắm vào (Hướng B)
  const sensorStats = getPhysicalSensorStats(rawDevices);
  const totalSensorsCount = sensorStats.total;
  const offlineSensorsCount = sensorStats.offline;
  const onlineSensorsCount = totalSensorsCount - offlineSensorsCount;
  const activePercentage = totalSensorsCount > 0 ? Math.round((onlineSensorsCount / totalSensorsCount) * 100) : 0;

  return (
    <div className={`dashboard-page ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Sidebar Navigation */}
      <Sidebar
        activeId="devices"
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Workspace */}
      <main className="dashboard-main min-w-0">
        {/* TopNavBar */}
        <header className="dashboard-header">
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
          {/* Dashboard Header & Actions */}
          <div className="houses-header-actions">
            <div className="houses-title-wrapper">
              <h2>Quản lý Cảm biến & Thiết bị</h2>
              <p>Danh sách các cảm biến đo lường và thiết bị chấp hành đang hoạt động.</p>
            </div>
            <div className="search-add-wrapper">
              <div className="search-box-wrapper">
                <span className="material-symbols-outlined search-icon">search</span>
                <input
                  type="text"
                  placeholder="Tìm cảm biến, loại, địa chỉ MAC..."
                  className="search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button
                type="button"
                className="add-house-btn"
                style={{ height: '44px' }}
                onClick={handleAddDevice}
              >
                <span className="material-symbols-outlined">add</span>
                Thêm thiết bị ESP32
              </button>
            </div>
          </div>

          {/* Metrics Overview (Bento Style) */}
          <div className="devices-metrics-grid">
            <div className="devices-metrics-card">
              <div className="metrics-card-header">
                <div className="metrics-icon-wrapper primary">
                  <span className="material-symbols-outlined">sensors</span>
                </div>
                <span className="metrics-badge primary">Hoạt động {activePercentage}%</span>
              </div>
              <p className="metrics-title">Tổng số cảm biến vật lý</p>
              <p className="metrics-value">{totalSensorsCount}</p>
            </div>
            <div className="devices-metrics-card">
              <div className="metrics-card-header">
                <div className="metrics-icon-wrapper secondary">
                  <span className="material-symbols-outlined">hub</span>
                </div>
                <span className="metrics-badge secondary">{houses.length} Đang hoạt động</span>
              </div>
              <p className="metrics-title">Số nhà nấm</p>
              <p className="metrics-value">{houses.length}</p>
            </div>
            <div className="devices-metrics-card">
              <div className="metrics-card-header">
                <div className="metrics-icon-wrapper error">
                  <span className="material-symbols-outlined">report_problem</span>
                </div>
                <span className="metrics-badge error">Ngoại tuyến</span>
              </div>
              <p className="metrics-title">Cảm biến vật lý ngoại tuyến</p>
              <p className="metrics-value error">{offlineSensorsCount}</p>
            </div>
          </div>

          {/* Main Device Table */}
          <div className="device-table-card">
            {loading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--db-text-secondary)' }}>
                <p>Đang tải danh sách cảm biến...</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="device-table">
                  <thead>
                    <tr>
                      <th>Tên cảm biến / Thiết bị</th>
                      <th>Loại chỉ số</th>
                      <th>Thiết bị ESP32 (MAC)</th>
                      <th>Nhà nấm</th>
                      <th>Giá trị hiện tại</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredComponents.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: 'var(--db-text-secondary)' }}>
                          Không tìm thấy cảm biến hay thiết bị nào
                        </td>
                      </tr>
                    ) : (
                      filteredComponents.map((comp) => (
                        <tr key={comp.id} onClick={() => handleOpenDrawer(comp)}>
                          <td>
                            <div className="device-name-cell">
                              <span
                                className={`device-status-indicator ${comp.isOffline ? 'offline' : 'online'}`}
                              ></span>
                              <span className="device-name-text">{comp.name}</span>
                            </div>
                          </td>
                          <td>
                            <div className="device-type-cell">
                              <span className="material-symbols-outlined device-type-icon">{comp.iconName}</span>
                              <span className="text-sm">{comp.type}</span>
                            </div>
                          </td>
                          <td className="device-id-mono">{comp.parentDeviceId}</td>
                          <td className="text-sm" style={{ color: 'var(--db-on-surface-variant)' }}>
                            {comp.houseName}
                          </td>
                          <td className={`text-sm ${comp.value === '--' ? 'text-error' : ''}`} style={{ fontWeight: 600, color: comp.value === '--' ? 'var(--db-error)' : 'var(--db-primary)' }}>
                            {comp.value}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Footer */}
            <div className="houses-pagination" style={{ borderTop: '1px solid var(--db-outline-variant)', padding: '16px 24px' }}>
              <p>Hiển thị {filteredComponents.length} cảm biến & thiết bị</p>
            </div>
          </div>
        </div>
      </main>

      {/* Details Side Drawer Overlay (Hidden by default) */}
      <div
        className={`drawer-backdrop ${isDrawerOpen ? 'drawer-open' : ''}`}
        onClick={handleCloseDrawer}
      ></div>

      {/* Side Drawer Panel */}
      <div className={`side-drawer ${isDrawerOpen ? 'drawer-open' : ''}`}>
        {selectedComponent && (
          <>
            <div className="drawer-header">
              <div className="drawer-header-left">
                <div className="drawer-header-icon-wrapper">
                  <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {selectedComponent.iconName}
                  </span>
                </div>
                <div>
                  <h4 className="drawer-device-title">{selectedComponent.name}</h4>
                  <p className="drawer-device-subtitle">
                    {selectedComponent.type} • {!selectedComponent.isOffline ? 'Hoạt động' : 'Ngoại tuyến'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="drawer-close-btn"
                onClick={handleCloseDrawer}
                title="Đóng bảng"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="drawer-content custom-scrollbar">
              {/* Live Sensor Value Card */}
              <div className="drawer-section">
                <h5 className="drawer-section-title">Giá trị đo lường hiện tại</h5>
                <div style={{
                  padding: '24px',
                  backgroundColor: 'var(--db-surface-container-lowest)',
                  borderRadius: '12px',
                  border: '1px solid var(--db-outline-variant)',
                  textAlign: 'center',
                  marginTop: '12px'
                }}>
                  <p style={{ margin: 0, fontSize: '14px', color: 'var(--db-on-surface-variant)' }}>Chỉ số cảm biến</p>
                  <p style={{ margin: '8px 0 0', fontSize: '32px', fontWeight: 700, color: 'var(--db-primary)' }}>
                    {selectedComponent.value}
                  </p>
                  <p style={{ margin: '8px 0 0', fontSize: '12px', color: 'var(--db-on-surface-variant)' }}>
                    Cập nhật cuối: {selectedComponent.lastUpdate}
                  </p>
                </div>
              </div>

              {/* Parent ESP32 Device Configuration */}
              <div className="drawer-section">
                <h5 className="drawer-section-title" style={{ marginBottom: '16px' }}>Thiết bị ESP32 trực thuộc</h5>
                <div className="drawer-config-grid">
                  <div className="config-item-box">
                    <p className="config-item-lbl">Tên mạch điều khiển</p>
                    <p className="config-item-val">{selectedComponent.parentName}</p>
                  </div>
                  <div className="config-item-box">
                    <p className="config-item-lbl">Trạng thái mạch</p>
                    <p className={`config-item-val ${selectedComponent.isOffline ? 'text-error' : 'signal-green'}`}>
                      {!selectedComponent.isOffline ? 'Trực tuyến (Online)' : 'Ngoại tuyến (Offline)'}
                    </p>
                  </div>
                  <div className="config-item-box" style={{ gridColumn: 'span 2' }}>
                    <p className="config-item-lbl">Địa chỉ MAC (Device ID)</p>
                    <p className="config-item-val" style={{ fontFamily: 'monospace' }}>{selectedComponent.parentDeviceId}</p>
                  </div>
                  {(() => {
                    const parentDevice = rawDevices.find((d) => d.id === selectedComponent.parentId);
                    const currentPresetId = parentDevice?.activePreset || '';
                    return (
                      <div className="config-item-box" style={{ gridColumn: 'span 2' }}>
                        <p className="config-item-lbl">Cấu hình tự động (Preset)</p>
                        <select
                          value={currentPresetId}
                          onChange={async (e) => {
                            const val = e.target.value;
                            try {
                              const res = await api.put(`/devices/${selectedComponent.parentId}/preset`, { presetId: val || null });
                              if (res.data.success) {
                                Swal.fire({
                                  icon: 'success',
                                  title: 'Cập nhật thành công',
                                  text: 'Đã gán cấu hình tự động cho thiết bị.',
                                  timer: 1500,
                                  showConfirmButton: false
                                });
                                setRawDevices(prev => prev.map(d => d.id === selectedComponent.parentId ? { ...d, activePreset: val || null } : d));
                              }
                            } catch (err: any) {
                              Swal.fire({
                                icon: 'error',
                                title: 'Thất bại',
                                text: err.response?.data?.message || 'Có lỗi xảy ra khi gán preset.'
                              });
                            }
                          }}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid var(--db-outline-variant)',
                            marginTop: '6px',
                            fontSize: '13px',
                            backgroundColor: 'var(--db-surface-container-lowest)',
                            color: 'var(--db-on-surface)',
                            boxSizing: 'border-box'
                          }}
                        >
                          <option value="">Điều khiển thủ công (Không tự động)</option>
                          {presetsList.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Drawer Actions */}
            <div className="drawer-footer-actions">
              <button
                type="button"
                className="drawer-footer-btn border-outline"
                onClick={() => {
                  Swal.fire({
                    icon: 'info',
                    title: 'Khởi động lại',
                    text: `Đang gửi lệnh reboot tới board điều khiển ${selectedComponent.parentName}...`,
                    timer: 1500,
                    showConfirmButton: false
                  });
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  settings_remote
                </span>
                Reboot Board
              </button>
              <button
                type="button"
                className="drawer-footer-btn primary-btn"
                onClick={() => {
                  Swal.fire({
                    icon: 'info',
                    title: 'Đang hiệu chuẩn',
                    text: 'Đang khởi động chế độ hiệu chuẩn cảm biến...',
                    timer: 1500,
                    showConfirmButton: false
                  });
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  tune
                </span>
                Hiệu chuẩn
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Devices;
