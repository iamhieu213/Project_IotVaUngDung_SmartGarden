import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import './Houses.css';
import Swal from 'sweetalert2';
import api from '../../utils/api';

interface House {
  id: string;
  name: string;
  address?: string;
  width: number;
  height: number;
  deviceCount: number;
  status: 'ACTIVE' | 'MAINTENANCE' | 'OFFLINE';
  imageUrl?: string;
  metricLabel?: string;
  metricValue?: string;
  chartData?: number[];
  theme?: 'primary' | 'tertiary' | 'empty';
}

export const Houses: React.FC = () => {
  const navigate = useNavigate();


  // State to hold houses from API
  const [houses, setHouses] = useState<House[]>([]);

  // Collapsed Sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'MAINTENANCE' | 'OFFLINE'>('ALL');

  // Fetch houses from backend
  const fetchHouses = async () => {
    try {
      const response = await api.get('/houses');
      if(response.data.success) {
        const houseData = response.data.data;

        //Goi API lay thiet bi cua tung nha nha nam song song
        const mappedHouses: House[] = await Promise.all(
          houseData.map(async (h : any, index: number) => {
            let deviceCount = 0;
            try {
              const deviceRes = await api.get(`/devices/house/${h.id}`);
              if (deviceRes.data.success) {
                deviceCount = deviceRes.data.data.length; // Số lượng thiết bị
              }
            }catch(deviceErr) {
              console.error(`Lỗi khi tải thiết bị cho nhà nấm ${h.id}:`, deviceErr);
            }

            const MUSHROOM_HOUSE_IMAGES = [
              '/mushroom_house_1.png',
              '/mushroom_house_2.png',
            ];

            return {
              id: h.id,
              name: h.name,
              address: h.address || '',
              width: h.width || 0,
              height : h.height || 0,
              deviceCount : deviceCount,
              status : 'ACTIVE',
              imageUrl: h.imageUrl || MUSHROOM_HOUSE_IMAGES[index % MUSHROOM_HOUSE_IMAGES.length],
              metricLabel: 'TRẠNG THÁI',
              metricValue: 'SẴN SÀNG',
              chartData: [45, 60, 85, 50, 75, 90, 65],
              theme: (index % 2 === 0) ? 'primary' : 'tertiary',
            }
          })
        );
        setHouses(mappedHouses);
      }

    }catch(err: any) {
      console.error('Lỗi khi tải danh sách nhà nấm:', err);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi tải dữ liệu',
        text: err.response?.data?.message || 'Không thể lấy dữ liệu nhà nấm từ máy chủ.',
      });
    }
  }

  useEffect(() => {
    fetchHouses();
  }, []);

  // Handle adding new house
  const handleAddHouse = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Thêm nhà nấm mới',
      html: `
        <style>
          .swal-form-container {
            display: flex;
            flex-direction: column;
            gap: 16px;
            padding: 10px 0;
            font-family: 'Inter', sans-serif;
          }
          .swal-form-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
            text-align: left;
            width: 100%;
            box-sizing: border-box;
          }
          .swal-form-label {
            font-size: 11px;
            font-weight: 600;
            color: var(--db-on-surface-variant);
            display: flex;
            align-items: center;
            gap: 6px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .swal-form-label .material-symbols-outlined {
            font-size: 16px;
            color: var(--db-primary);
          }
          .swal-form-input {
            width: 100%;
            padding: 12px 14px;
            border: 1px solid var(--db-outline-variant);
            border-radius: 8px;
            font-size: 14px;
            box-sizing: border-box;
            outline: none;
            background-color: var(--db-surface-container-low);
            color: var(--db-on-surface);
            transition: all 0.2s ease;
          }
          .swal-form-input:focus {
            border-color: var(--db-primary);
            background-color: var(--db-surface-container-lowest);
            box-shadow: 0 0 0 3px rgba(0, 108, 73, 0.15);
          }
          .swal-form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            width: 100%;
            box-sizing: border-box;
          }
          .custom-swal-popup {
            border-radius: 16px !important;
            background-color: var(--db-surface-container-lowest) !important;
            border: 1px solid var(--db-outline-variant) !important;
            padding: 24px !important;
          }
          .custom-swal-confirm-btn {
            background-color: var(--db-primary) !important;
            color: #ffffff !important;
            border: none !important;
            padding: 10px 24px !important;
            border-radius: 8px !important;
            font-size: 14px !important;
            font-weight: 500 !important;
            cursor: pointer !important;
            margin-left: 8px !important;
            transition: all 0.2s ease !important;
          }
          .custom-swal-confirm-btn:hover {
            opacity: 0.9 !important;
          }
          .custom-swal-cancel-btn {
            background-color: transparent !important;
            color: var(--db-on-surface-variant) !important;
            border: 1px solid var(--db-outline-variant) !important;
            padding: 10px 24px !important;
            border-radius: 8px !important;
            font-size: 14px !important;
            font-weight: 500 !important;
            cursor: pointer !important;
            transition: all 0.2s ease !important;
          }
          .custom-swal-cancel-btn:hover {
            background-color: var(--db-surface-container-low) !important;
          }
        </style>
        <div class="swal-form-container">
          <div class="swal-form-group">
            <label class="swal-form-label">
              <span class="material-symbols-outlined">badge</span> Tên nhà nấm
            </label>
            <input id="swal-input-name" class="swal-form-input" placeholder="Ví dụ: Nhà nấm Sò Alpha">
          </div>
          <div class="swal-form-group">
            <label class="swal-form-label">
              <span class="material-symbols-outlined">location_on</span> Địa chỉ lắp đặt
            </label>
            <input id="swal-input-address" class="swal-form-input" placeholder="Ví dụ: Khu A, Trại Củ Chi, TP.HCM">
          </div>
          <div class="swal-form-grid">
            <div class="swal-form-group">
              <label class="swal-form-label">
                <span class="material-symbols-outlined">straighten</span> Rộng (mét)
              </label>
              <input id="swal-input-width" type="number" class="swal-form-input" min="0" placeholder="Ví dụ: 12">
            </div>
            <div class="swal-form-group">
              <label class="swal-form-label">
                <span class="material-symbols-outlined">straighten</span> Dài (mét)
              </label>
              <input id="swal-input-height" type="number" class="swal-form-input" min="0" placeholder="Ví dụ: 24">
            </div>
          </div>
        </div>
      `,
      customClass: {
        popup: 'custom-swal-popup',
        confirmButton: 'custom-swal-confirm-btn',
        cancelButton: 'custom-swal-cancel-btn',
      },
      buttonsStyling: false,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Tạo mới',
      cancelButtonText: 'Hủy',
      preConfirm: () => {
        const name = (document.getElementById('swal-input-name') as HTMLInputElement).value;
        const address = (document.getElementById('swal-input-address') as HTMLInputElement).value;
        const width = (document.getElementById('swal-input-width') as HTMLInputElement).value;
        const height = (document.getElementById('swal-input-height') as HTMLInputElement).value;

        if (!name || !address) {
          Swal.showValidationMessage('Vui lòng nhập đầy đủ tên và địa chỉ nhà nấm');
          return false;
        }
        return {
          name,
          address,
          width: Number(width) || 0,
          height: Number(height) || 0,
        };
      },
    });

    if (formValues) {
      try {
        const response = await api.post('/houses/create', formValues);
        if (response.data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Thành công',
            text: 'Đã tạo nhà nấm mới thành công!',
            timer: 1500,
            showConfirmButton: false,
          });
          fetchHouses();
        }
      } catch (err: any) {
        Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: err.response?.data?.message || 'Có lỗi xảy ra khi tạo nhà nấm mới.',
        });
      }
    }
  };

  // Handle editing house info
  const handleEditHouse = async (house: House) => {
    const { value: formValues } = await Swal.fire({
      title: 'Chỉnh sửa nhà nấm',
      html: `
        <style>
          .swal-form-container {
            display: flex;
            flex-direction: column;
            gap: 16px;
            padding: 10px 0;
            font-family: 'Inter', sans-serif;
          }
          .swal-form-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
            text-align: left;
            width: 100%;
            box-sizing: border-box;
          }
          .swal-form-label {
            font-size: 11px;
            font-weight: 600;
            color: var(--db-on-surface-variant);
            display: flex;
            align-items: center;
            gap: 6px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .swal-form-label .material-symbols-outlined {
            font-size: 16px;
            color: var(--db-primary);
          }
          .swal-form-input {
            width: 100%;
            padding: 12px 14px;
            border: 1px solid var(--db-outline-variant);
            border-radius: 8px;
            font-size: 14px;
            box-sizing: border-box;
            outline: none;
            background-color: var(--db-surface-container-low);
            color: var(--db-on-surface);
            transition: all 0.2s ease;
          }
          .swal-form-input:focus {
            border-color: var(--db-primary);
            background-color: var(--db-surface-container-lowest);
            box-shadow: 0 0 0 3px rgba(0, 108, 73, 0.15);
          }
          .swal-form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            width: 100%;
            box-sizing: border-box;
          }
          .custom-swal-popup {
            border-radius: 16px !important;
            background-color: var(--db-surface-container-lowest) !important;
            border: 1px solid var(--db-outline-variant) !important;
            padding: 24px !important;
          }
          .custom-swal-confirm-btn {
            background-color: var(--db-primary) !important;
            color: #ffffff !important;
            border: none !important;
            padding: 10px 24px !important;
            border-radius: 8px !important;
            font-size: 14px !important;
            font-weight: 500 !important;
            cursor: pointer !important;
            margin-left: 8px !important;
            transition: all 0.2s ease !important;
          }
          .custom-swal-confirm-btn:hover {
            opacity: 0.9 !important;
          }
          .custom-swal-cancel-btn {
            background-color: transparent !important;
            color: var(--db-on-surface-variant) !important;
            border: 1px solid var(--db-outline-variant) !important;
            padding: 10px 24px !important;
            border-radius: 8px !important;
            font-size: 14px !important;
            font-weight: 500 !important;
            cursor: pointer !important;
            transition: all 0.2s ease !important;
          }
          .custom-swal-cancel-btn:hover {
            background-color: var(--db-surface-container-low) !important;
          }
        </style>
        <div class="swal-form-container">
          <div class="swal-form-group">
            <label class="swal-form-label">
              <span class="material-symbols-outlined">badge</span> Tên nhà nấm
            </label>
            <input id="swal-input-name" class="swal-form-input" placeholder="Ví dụ: Nhà nấm Sò Alpha" value="${house.name}">
          </div>
          <div class="swal-form-group">
            <label class="swal-form-label">
              <span class="material-symbols-outlined">location_on</span> Địa chỉ lắp đặt
            </label>
            <input id="swal-input-address" class="swal-form-input" placeholder="Ví dụ: Khu A, Trại Củ Chi, TP.HCM" value="${house.address || ''}">
          </div>
          <div class="swal-form-grid">
            <div class="swal-form-group">
              <label class="swal-form-label">
                <span class="material-symbols-outlined">straighten</span> Rộng (mét)
              </label>
              <input id="swal-input-width" type="number" class="swal-form-input" min="0" placeholder="Ví dụ: 12" value="${house.width}">
            </div>
            <div class="swal-form-group">
              <label class="swal-form-label">
                <span class="material-symbols-outlined">straighten</span> Dài (mét)
              </label>
              <input id="swal-input-height" type="number" class="swal-form-input" min="0" placeholder="Ví dụ: 24" value="${house.height}">
            </div>
          </div>
        </div>
      `,
      customClass: {
        popup: 'custom-swal-popup',
        confirmButton: 'custom-swal-confirm-btn',
        cancelButton: 'custom-swal-cancel-btn',
      },
      buttonsStyling: false,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Cập nhật',
      cancelButtonText: 'Hủy',
      preConfirm: () => {
        const name = (document.getElementById('swal-input-name') as HTMLInputElement).value;
        const address = (document.getElementById('swal-input-address') as HTMLInputElement).value;
        const width = (document.getElementById('swal-input-width') as HTMLInputElement).value;
        const height = (document.getElementById('swal-input-height') as HTMLInputElement).value;

        if (!name || !address) {
          Swal.showValidationMessage('Vui lòng nhập đầy đủ tên và địa chỉ nhà nấm');
          return false;
        }
        return {
          name,
          address,
          width: Number(width) || 0,
          height: Number(height) || 0,
        };
      },
    });

    if (formValues) {
      try {
        const response = await api.put(`/houses/${house.id}`, formValues);
        if (response.data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Thành công',
            text: 'Đã cập nhật thông tin nhà nấm thành công!',
            timer: 1500,
            showConfirmButton: false,
          });
          fetchHouses();
        }
      } catch (err: any) {
        Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật nhà nấm.',
        });
      }
    }
  };

  // Dynamic 3D tilt micro-interaction on mouse move
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget as HTMLDivElement;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = (y - centerY) / 20;
    const rotateY = (centerX - x) / 20;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget as HTMLDivElement;
    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
  };

  // Filter & Search Logic
  const filteredHouses = houses.filter((house) => {
    const matchesSearch = house.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      activeFilter === 'ALL' ||
      (activeFilter === 'ACTIVE' && house.status === 'ACTIVE') ||
      (activeFilter === 'MAINTENANCE' && house.status === 'MAINTENANCE') ||
      (activeFilter === 'OFFLINE' && house.status === 'OFFLINE');

    return matchesSearch && matchesFilter;
  });

  return (
    <div className={`dashboard-page ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Sidebar Navigation */}
      <Sidebar
        activeId="mushroom-houses"
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Workspace Content */}
        <div className="dashboard-content">
          {/* Header & Actions Row */}
          <div className="houses-header-actions">
            <div className="houses-title-wrapper">
              <h2>Quản lý Nhà nấm</h2>
              <p>Giám sát và quản lý môi trường nuôi trồng và các nút IoT đang hoạt động.</p>
            </div>
            <div className="search-add-wrapper">
              <div className="search-box-wrapper">
                <span className="material-symbols-outlined search-icon">search</span>
                <input
                  type="text"
                  placeholder="Tìm kiếm nhà nấm..."
                  className="search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button type="button" className="add-house-btn" onClick={handleAddHouse}>
                <span className="material-symbols-outlined">add</span>
                Thêm nhà nấm
              </button>
            </div>
          </div>

          {/* Filter Controls Row */}
          <div className="filter-controls">
            <button
              type="button"
              className={`filter-btn ${activeFilter === 'ALL' ? 'active' : 'inactive'}`}
              onClick={() => setActiveFilter('ALL')}
            >
              Tất cả ({houses.length})
            </button>
            <button
              type="button"
              className={`filter-btn ${activeFilter === 'ACTIVE' ? 'active' : 'inactive'}`}
              onClick={() => setActiveFilter('ACTIVE')}
            >
              Đang hoạt động ({houses.filter((h) => h.status === 'ACTIVE').length})
            </button>
            <button
              type="button"
              className={`filter-btn ${activeFilter === 'MAINTENANCE' ? 'active' : 'inactive'}`}
              onClick={() => setActiveFilter('MAINTENANCE')}
            >
              Bảo trì ({houses.filter((h) => h.status === 'MAINTENANCE').length})
            </button>
            <button
              type="button"
              className={`filter-btn ${activeFilter === 'OFFLINE' ? 'active' : 'inactive'}`}
              onClick={() => setActiveFilter('OFFLINE')}
            >
              Ngoại tuyến ({houses.filter((h) => h.status === 'OFFLINE').length})
            </button>
            <div style={{ width: '1px', backgroundColor: 'var(--db-outline-variant)', height: '24px', margin: '0 8px' }}></div>
            <button type="button" className="filter-more-btn">
              <span className="material-symbols-outlined">filter_list</span>
              Lọc thêm
            </button>
          </div>

          {/* Bento Grid Layout of House Cards */}
          <div className="houses-grid">
            {filteredHouses.map((house) => {
              const isActive = house.status === 'ACTIVE';
              const isMaintenance = house.status === 'MAINTENANCE';

              return (
                <div
                  key={house.id}
                  className={`house-card ${house.theme === 'empty' ? 'border-dashed' : ''}`}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                >
                  {/* Card Header Image or Placeholder */}
                  {house.imageUrl ? (
                    <div className="card-image-wrapper">
                      <img alt={house.name} src={house.imageUrl} className="house-image" />
                      <div className={`card-status-badge ${isMaintenance ? 'maintenance' : ''}`}>
                        {isActive && <span className="badge-pulse"></span>}
                        {isActive ? 'ĐANG HOẠT ĐỘNG' : 'BẢO TRÌ'}
                      </div>
                    </div>
                  ) : (
                    <div className="house-card-placeholder">
                      <span className="material-symbols-outlined house-placeholder-icon">meeting_room</span>
                    </div>
                  )}

                  {/* Card Information */}
                  <div className="house-card-body">
                    <div className="card-title-row">
                      <div>
                        <h3 className="card-house-title">{house.name}</h3>
                        <p className="card-house-size">
                          <span className="material-symbols-outlined">straighten</span>
                          {house.width}m x {house.height}m
                        </p>
                      </div>
                      <div className="card-device-count-wrapper">
                        <span
                          className={`card-device-count ${
                            isMaintenance ? 'maintenance-theme' : house.theme === 'empty' ? 'empty-theme' : ''
                          }`}
                        >
                          {house.deviceCount < 10 && house.deviceCount > 0
                            ? `0${house.deviceCount}`
                            : house.deviceCount}
                        </span>
                        <span className="card-device-label">THIẾT BỊ</span>
                      </div>
                    </div>

                    {/* Sparkline / Environmental Metrics Preview */}
                    {house.theme !== 'empty' && house.metricLabel ? (
                      <div className="card-metric-preview">
                        <div className="card-metric-info">
                          <span className="card-metric-label">{house.metricLabel}</span>
                          <span className="card-metric-value">{house.metricValue}</span>
                        </div>
                        <div className={`card-metric-chart ${isMaintenance ? 'maintenance-theme' : ''}`}>
                          {house.chartData?.map((val, idx) => (
                            <div
                              key={idx}
                              className={`chart-bar ${isMaintenance ? 'warning-bar' : ''} ${
                                idx === 2 ? 'highlight' : ''
                              }`}
                              style={{ height: `${val}%` }}
                            ></div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="empty-state-notice">
                        <p>Đang chờ thiết lập phần cứng...</p>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="card-actions-row">
                      {house.theme !== 'empty' ? (
                        <>
                          <button
                            type="button"
                            className="card-action-btn border-outline"
                            onClick={() => navigate(`/houses/${house.id}`)}
                          >
                            <span className="material-symbols-outlined">visibility</span>
                            Xem
                          </button>
                           <button 
                            type="button" 
                            className="card-action-btn border-outline"
                            onClick={() => handleEditHouse(house)}
                          >
                            <span className="material-symbols-outlined">edit</span>
                            Sửa
                          </button>
                        </>
                      ) : (
                        <>
                          <button type="button" className="card-action-btn primary-btn">
                            <span className="material-symbols-outlined">add_circle</span>
                            Thiết lập
                          </button>
                          <button type="button" className="card-action-btn border-outline">
                            <span className="material-symbols-outlined">delete</span>
                            Xóa
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Row */}
          <div className="houses-pagination">
            <p>Hiển thị {filteredHouses.length} trên {houses.length} Nhà nấm</p>
            <div className="pagination-btn-group">
              <button type="button" className="pagination-btn" disabled title="Trang trước">
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button type="button" className="pagination-number-btn active">
                1
              </button>
              <button type="button" className="pagination-number-btn">
                2
              </button>
              <button type="button" className="pagination-number-btn">
                3
              </button>
              <button type="button" className="pagination-btn" title="Trang sau">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Houses;
