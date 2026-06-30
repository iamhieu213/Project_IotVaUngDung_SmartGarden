// src/context/NotificationContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { io } from 'socket.io-client';
import api from '../utils/api';
import Swal from 'sweetalert2';

export interface AlertItem {
  id: string;
  houseId: string;
  deviceId: string;
  deviceName: string;
  title: string;
  message: string;
  type: 'critical' | 'warning';
  resolved: boolean;
  createdAt: string;
}

interface NotificationContextType {
  activeAlerts: AlertItem[];
  fetchActiveAlerts: () => Promise<void>;
  resolveAlert: (alertId: string) => Promise<void>;
  loading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [activeAlerts, setActiveAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchActiveAlerts = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const housesRes = await api.get('/houses');
      if (housesRes.data.success) {
        const houses = housesRes.data.data;
        const alertsPromises = houses.map((house: any) =>
          api.get(`/alerts/house/${house.id}`)
        );
        const results = await Promise.all(alertsPromises);
        const allAlerts: AlertItem[] = [];
        results.forEach((res) => {
          if (res.data.success) {
            allAlerts.push(...res.data.data);
          }
        });
        
        // Lọc ra các cảnh báo chưa xử lý và sắp xếp mới nhất lên đầu
        const active = allAlerts
          .filter((a) => !a.resolved)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setActiveAlerts(active);
      }
    } catch (err) {
      console.error('Lỗi khi lấy danh sách cảnh báo chủ động:', err);
    } finally {
      setLoading(false);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const response = await api.put(`/alerts/${alertId}/resolve`);
      if (response.data.success) {
        setActiveAlerts((prev) => prev.filter((a) => a.id !== alertId));
        Swal.fire({
          icon: 'success',
          title: 'Thành công',
          text: 'Đã xác nhận xử lý cảnh báo này',
          timer: 1500,
          showConfirmButton: false,
        });
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: err.response?.data?.message || 'Không thể cập nhật trạng thái cảnh báo.',
      });
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setActiveAlerts([]);
      return;
    }

    fetchActiveAlerts();

    // Kết nối tới Backend Socket.io
    const socket = io('http://localhost:3000');

    // Lắng nghe sự cố mới
    socket.on('new_alert', (newAlert: AlertItem) => {
      setActiveAlerts((prev) => {
        if (prev.some((a) => a.id === newAlert.id)) return prev;
        return [newAlert, ...prev];
      });

      // Bắn Toast thông báo góc trên bên phải (không chứa emoji)
      Swal.fire({
        icon: newAlert.type === 'critical' ? 'error' : 'warning',
        title: newAlert.title,
        text: newAlert.message,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 5000,
        timerProgressBar: true,
      });
    });

    // Lắng nghe sự cố được khôi phục
    socket.on('alert_resolved', (resolvedData: { id: string; message: string }) => {
      setActiveAlerts((prev) => prev.filter((a) => a.id !== resolvedData.id));

      // Bắn Toast báo khôi phục thành công (không chứa emoji)
      Swal.fire({
        icon: 'success',
        title: 'Khôi phục cảnh báo',
        text: resolvedData.message,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 4500,
        timerProgressBar: true,
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated]);

  return (
    <NotificationContext.Provider value={{ activeAlerts, fetchActiveAlerts, resolveAlert, loading }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications phải được bọc trong NotificationProvider');
  return context;
};
