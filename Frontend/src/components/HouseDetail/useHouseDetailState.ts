import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';
import api from '../../utils/api';
import { io } from 'socket.io-client';
import {
  triggerAddDeviceAlert,
  triggerDeleteDeviceAlert,
  triggerRenameSensorAlert,
  triggerLocateDeviceAlert,
} from './houseDetailDialogs';

export const useHouseDetailState = () => {
  const { logout } = useAuth();
  const { id: houseId } = useParams<{ id: string }>();

  const [houseName, setHouseName] = useState<string>('Đang tải...');
  const [houseInfo, setHouseInfo] = useState<any>(null);
  const [devices, setDevices] = useState<any[]>([]);
  const [expandedDevices, setExpandedDevices] = useState<Record<string, boolean>>({});
  const [selectedSensor, setSelectedSensor] = useState<{ deviceId: string; sensorKey: string } | null>(null);
  const [presetsList, setPresetsList] = useState<any[]>([]);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);

  // Collapsed Sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  // Collapsed Right Status Panel state
  const [isStatusPanelCollapsed, setIsStatusPanelCollapsed] = useState(false);

  // HUD & Isometric state
  const [zoom, setZoom] = useState(1.0);
  const [rotation, setRotation] = useState(-45);
  const [showSensors, setShowSensors] = useState(true);
  const [show3dOverlay, setShow3dOverlay] = useState(true);

  // States cho tính năng Bố trí thiết bị
  const [isPlacementMode, setIsPlacementMode] = useState<boolean>(false);
  const [selectedDeviceForPlacement, setSelectedDeviceForPlacement] = useState<string | null>(null);
  const [selectedSensorType, setSelectedSensorType] = useState<string | null>(null);

  // States và Ref hỗ trợ Kéo thả (Drag & Drop) cảm biến
  const mapRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [draggedSensor, setDraggedSensor] = useState<{ deviceId: string; sensorKey: string } | null>(null);

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

  const fetchHouseDetail = async () => {
    if (!houseId) return;
    try {
      const response = await api.get(`/houses/${houseId}`);
      if (response.data.success) {
        setHouseName(response.data.data.name);
        setHouseInfo(response.data.data);
      }
    } catch (err: any) {
      console.error('Lỗi khi tải chi tiết nhà nấm:', err);
    }
  };

  const fetchDevices = async () => {
    if (!houseId) return;
    try {
      const response = await api.get(`/devices/house/${houseId}`);
      if (response.data.success) {
        setDevices(response.data.data);
      }
    } catch (err: any) {
      console.error('Lỗi khi tải danh sách thiết bị:', err);
    }
  };

  const fetchPresetsList = async () => {
    try {
      const response = await api.get('/presets');
      if (response.data.success) {
        setPresetsList(response.data.data);
      }
    } catch (err: any) {
      console.error('Lỗi khi tải danh sách preset:', err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchHouseDetail(), fetchDevices(), fetchPresetsList()]);
    };
    loadData();
  }, [houseId]);

  useEffect(() => {
    // Kết nối tới Backend Socket.io
    const socket = io('http://localhost:3000');

    // Lắng nghe sự kiện cập nhật thiết bị
    socket.on('device_update', (updatedDevice: any) => {
      if (updatedDevice.house === houseId) {
        setDevices((prevDevices) => {
          const oldDevice = prevDevices.find(d => d.id === updatedDevice.id);
          
          if (oldDevice) {
            const oldKeys = oldDevice.sensorPositions ? Object.keys(oldDevice.sensorPositions) : [];
            const newKeys = updatedDevice.sensorPositions ? Object.keys(updatedDevice.sensorPositions) : [];
            const newlyDetectedSensors = newKeys.filter(key => !oldKeys.includes(key));
            
            if (newlyDetectedSensors.length > 0) {
              const sensorNames = newlyDetectedSensors.join(', ');
              Swal.fire({
                icon: 'info',
                title: 'Phát hiện cảm biến mới',
                text: `Thiết bị "${updatedDevice.name}" vừa cắm thêm cảm biến: ${sensorNames}. Hãy mở danh sách bên phải để kéo thả!`,
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 6000,
                timerProgressBar: true,
              });
            }
          }

          return prevDevices.map((d) =>
            d.id === updatedDevice.id
              ? {
                  ...d,
                  ...updatedDevice,
                  sensorPositions: updatedDevice.sensorPositions || d.sensorPositions
                }
              : d
          );
        });
      }
    });

    // Ngắt kết nối khi chuyển trang
    return () => {
      socket.disconnect();
    };
  }, [houseId]);

  // Dialog wrappers
  const handleAddDevice = () => {
    if (!houseId) return;
    triggerAddDeviceAlert(houseId, fetchDevices);
  };

  const handleDeleteDevice = (id: string, name: string) => {
    triggerDeleteDeviceAlert(id, name, fetchDevices);
  };

  const handleSensorDoubleClick = async (
    e: React.MouseEvent | null,
    deviceId: string,
    sensorKey: string,
    currentName: string,
    spaceX: number,
    spaceY: number
  ) => {
    if (e) e.stopPropagation();
    triggerRenameSensorAlert(deviceId, sensorKey, currentName, spaceX, spaceY, (newName) => {
      setDevices((prevDevices) =>
        prevDevices.map((d) =>
          d.id === deviceId
            ? {
                ...d,
                sensorPositions: {
                  ...(d.sensorPositions || {}),
                  [sensorKey]: { 
                    ...(d.sensorPositions?.[sensorKey] || {}), 
                    displayName: newName 
                  }
                }
              }
            : d
        )
      );
    });
  };

  const handleDeleteSensorPosition = async (deviceId: string, sensorKey: string) => {
    const result = await Swal.fire({
      title: 'Xác nhận xóa cảm biến?',
      text: 'Hành động này sẽ xóa cấu hình vị trí của cảm biến này khỏi thiết bị.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Đồng ý xóa',
      cancelButtonText: 'Hủy bỏ'
    });

    if (result.isConfirmed) {
      try {
        const response = await api.delete(`/devices/${deviceId}/sensor-position/${sensorKey}`);
        if (response.data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Đã xóa cảm biến',
            text: 'Cấu hình vị trí cảm biến đã được gỡ bỏ.',
            timer: 1500,
            showConfirmButton: false
          });
          await fetchDevices();
        }
      } catch (err: any) {
        Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: err.response?.data?.message || 'Có lỗi xảy ra khi xóa cảm biến.'
        });
      }
    }
  };

  const handleLocateDeviceClick = (device: any) => {
    const SENSOR_LABELS: Record<string, string> = {
      temperature: 'Nhiệt độ',
      humidity: 'Độ ẩm không khí',
      soilMoisture: 'Độ ẩm đất',
      lightIntensity: 'Cường độ ánh sáng',
    };
    triggerLocateDeviceAlert(device, (sensorType) => {
      setIsPlacementMode(true);
      setSelectedDeviceForPlacement(device.id);
      setSelectedSensorType(sensorType);

      Swal.fire({
        icon: 'info',
        title: 'Chế độ định vị',
        text: `Vui lòng click vào một điểm bất kỳ trên bản đồ 3D để đặt vị trí cho cảm biến "${SENSOR_LABELS[sensorType] || sensorType}".`,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 4500,
      });
    });
  };

  // Drag and Drop
  const handleSensorMouseDown = (e: React.MouseEvent, deviceId: string, sensorKey: string) => {
    e.stopPropagation();
    e.preventDefault();
    setDragStartPos({ x: e.clientX, y: e.clientY });
    setDraggedSensor({ deviceId, sensorKey });
  };

  const handleStartDragNewSensor = (e: React.MouseEvent, deviceId: string, sensorKey: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDraggedSensor({ deviceId, sensorKey });

    setDevices((prevDevices) =>
      prevDevices.map((d) =>
        d.id === deviceId
          ? {
              ...d,
              sensorPositions: {
                ...(d.sensorPositions || {}),
                [sensorKey]: {
                  spaceX: 50,
                  spaceY: 50,
                  displayName: d.sensorPositions?.[sensorKey]?.displayName || ''
                }
              }
            }
          : d
      )
    );
  };

  const toggleDeviceExpand = (deviceId: string) => {
    setExpandedDevices((prev) => ({
      ...prev,
      [deviceId]: !prev[deviceId],
    }));
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedSensor && mapRef.current) {
      if (!isDragging && dragStartPos) {
        const dist = Math.sqrt(Math.pow(e.clientX - dragStartPos.x, 2) + Math.pow(e.clientY - dragStartPos.y, 2));
        if (dist > 5) {
          setIsDragging(true);
        }
      }

      if (isDragging) {
        const rect = mapRef.current.getBoundingClientRect();
        
        let spaceX = ((e.clientX - rect.left) / rect.width) * 100;
        let spaceY = ((e.clientY - rect.top) / rect.height) * 100;

        spaceX = Math.max(0, Math.min(100, spaceX));
        spaceY = Math.max(0, Math.min(100, spaceY));

        setDevices((prevDevices) =>
          prevDevices.map((d) =>
            d.id === draggedSensor.deviceId
              ? {
                  ...d,
                  sensorPositions: {
                    ...(d.sensorPositions || {}),
                    [draggedSensor.sensorKey]: {
                      ...(d.sensorPositions?.[draggedSensor.sensorKey] || {}),
                      spaceX,
                      spaceY
                    }
                  }
                }
              : d
          )
        );
      }
    }
  };

  const handleMouseUp = async () => {
    if (!draggedSensor) return;

    if (!isDragging) {
      setSelectedSensor((prev) => 
        prev?.deviceId === draggedSensor.deviceId && prev?.sensorKey === draggedSensor.sensorKey
          ? null
          : { deviceId: draggedSensor.deviceId, sensorKey: draggedSensor.sensorKey }
      );
    } else {
      const device = devices.find((d) => d.id === draggedSensor.deviceId);
      const pos = device?.sensorPositions?.[draggedSensor.sensorKey];

      if (pos) {
        try {
          await api.put(`/devices/${draggedSensor.deviceId}/sensor-position`, {
            sensorType: draggedSensor.sensorKey,
            spaceX: pos.spaceX,
            spaceY: pos.spaceY,
          });
        } catch (err: any) {
          console.error('Lỗi khi cập nhật tọa độ kéo thả cảm biến:', err);
        }
      }
    }

    setIsDragging(false);
    setDraggedSensor(null);
    setDragStartPos(null);
  };

  const handleMapClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPlacementMode || !selectedDeviceForPlacement || !selectedSensorType) {
      setSelectedSensor(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const spaceX = ((e.clientX - rect.left) / rect.width) * 100;
    const spaceY = ((e.clientY - rect.top) / rect.height) * 100;

    try {
      const response = await api.put(`/devices/${selectedDeviceForPlacement}/sensor-position`, {
        sensorType: selectedSensorType,
        spaceX,
        spaceY,
      });

      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Định vị thành công',
          text: 'Vị trí cảm biến đã được cập nhật cố định.',
          timer: 1500,
          showConfirmButton: false,
        });

        setDevices((prevDevices) =>
          prevDevices.map((d) =>
            d.id === selectedDeviceForPlacement
              ? {
                  ...d,
                  sensorPositions: {
                    ...(d.sensorPositions || {}),
                    [selectedSensorType]: { spaceX, spaceY }
                  }
                }
              : d
          )
        );
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật tọa độ.',
      });
    } finally {
      setIsPlacementMode(false);
      setSelectedDeviceForPlacement(null);
      setSelectedSensorType(null);
    }
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.1, 2.0));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.1, 0.5));
  };

  const handleRotate = () => {
    setRotation((prev) => prev + 90);
  };

  const countSensors = (type: string) => {
    return devices.reduce((acc, device) => {
      if (device.sensorPositions) {
        let count = 0;
        Object.keys(device.sensorPositions).forEach((key) => {
          if (key === type || key.startsWith(type)) {
            count++;
          }
        });
        return acc + count;
      }
      return acc;
    }, 0);
  };

  const activeCount = devices.filter(d => d.status === 'online').length;
  const inactiveCount = devices.filter(d => d.status === 'offline').length;
  const isFlatView = isDragging || isPlacementMode;

  const activeDevicesWithTelemetry = devices.filter((d: any) => d.status === 'online' && d.latestTelemetry);

  let totalHumidity = 0;
  let humidityCount = 0;
  let totalTemperature = 0;
  let temperatureCount = 0;

  activeDevicesWithTelemetry.forEach((d: any) => {
    const telemetry = d.latestTelemetry || {};
    Object.keys(telemetry).forEach((key) => {
      const val = telemetry[key];
      if (typeof val === 'number') {
        if (key.startsWith('humidity')) {
          totalHumidity += val;
          humidityCount++;
        } else if (key.startsWith('temperature')) {
          totalTemperature += val;
          temperatureCount++;
        }
      }
    });
  });

  const averageHumidity = humidityCount > 0
    ? Math.round(totalHumidity / humidityCount)
    : null;

  const averageTemperature = temperatureCount > 0
    ? (totalTemperature / temperatureCount).toFixed(1)
    : null;

  const handleTogglePump = async (deviceId: string, currentAction: 'on' | 'off') => {
    const nextAction = currentAction === 'on' ? 'off' : 'on';
    const actionText = nextAction === 'on' ? 'bật' : 'tắt';

    try {
      const response = await api.post(`/devices/${deviceId}/control`, {
        type: 'pump',
        action: nextAction
      });

      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: `Đã gửi lệnh ${actionText} máy bơm`,
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
        });

        setDevices((prev) =>
          prev.map((d) =>
            d.id === deviceId ? { ...d, pumpState: nextAction } : d
          )
        );
      }
    } catch (err: any) {
      console.error(`Lỗi khi ${actionText} máy bơm:`, err);
      Swal.fire({
        icon: 'error',
        title: `Điều khiển máy bơm thất bại`,
        text: err.response?.data?.message || err.message,
      });
    }
  };

  return {
    houseName,
    houseInfo,
    devices,
    expandedDevices,
    selectedSensor,
    setSelectedSensor,
    dragStartPos,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    zoom,
    rotation,
    showSensors,
    setShowSensors,
    show3dOverlay,
    setShow3dOverlay,
    isPlacementMode,
    selectedDeviceForPlacement,
    selectedSensorType,
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
    averageHumidity,
    averageTemperature,
    isStatusPanelCollapsed,
    setIsStatusPanelCollapsed,
    handleTogglePump,
    presetsList,
    handleAssignPreset: async (deviceId: string, presetId: string | null) => {
      try {
        const response = await api.put(`/devices/${deviceId}/preset`, { presetId });
        if (response.data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Cập nhật preset thành công',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true,
          });

          // Cập nhật state thiết bị ở local
          setDevices((prev) =>
            prev.map((d) =>
              d.id === deviceId ? { ...d, activePreset: presetId } : d
            )
          );
        }
      } catch (err: any) {
        console.error('Lỗi khi gán preset:', err);
        Swal.fire({
          icon: 'error',
          title: 'Gán preset thất bại',
          text: err.response?.data?.message || err.message,
        });
      }
    },
  };
};
