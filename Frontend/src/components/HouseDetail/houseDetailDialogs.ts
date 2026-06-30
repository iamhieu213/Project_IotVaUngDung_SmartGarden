import Swal from 'sweetalert2';
import api from '../../utils/api';

export const triggerAddDeviceAlert = async (houseId: string, fetchDevices: () => void) => {
  try {
    const res = await api.get('/devices/unregistered');
    const unregisteredList: string[] = res.data.success ? res.data.data : [];

    const selectOptions = unregisteredList.map(
      id => `<option value="${id}">${id}</option>`
    ).join('');

    const { value: formValues } = await Swal.fire({
      title: 'Đăng ký thiết bị mới',
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
          .swal-form-input, .swal-form-select {
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
          .swal-form-input:focus, .swal-form-select:focus {
            border-color: var(--db-primary);
            background-color: var(--db-surface-container-lowest);
            box-shadow: 0 0 0 3px rgba(0, 108, 73, 0.15);
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
              <span class="material-symbols-outlined">wifi_find</span> Thiết bị phát hiện được
            </label>
            ${unregisteredList.length > 0
              ? `<select id="swal-input-device-id" class="swal-form-select">
                        ${selectOptions}
                       </select>`
              : `<input id="swal-input-device-id" class="swal-form-input" placeholder="Nhập mã thiết bị (deviceId/MAC)">
                       <div style="font-size: 11px; color: var(--db-on-surface-variant); margin-top: 4px;">
                         Không phát hiện thiết bị nào trong hàng chờ Redis. Bạn có thể tự nhập thủ công.
                       </div>`
            }
          </div>
          <div class="swal-form-group">
            <label class="swal-form-label">
              <span class="material-symbols-outlined">badge</span> Tên thiết bị
            </label>
            <input id="swal-input-name" class="swal-form-input" placeholder="Ví dụ: Cảm biến khu trung tâm">
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
      confirmButtonText: 'Đăng ký',
      cancelButtonText: 'Hủy',
      preConfirm: () => {
        const deviceId = (document.getElementById('swal-input-device-id') as HTMLInputElement | HTMLSelectElement).value;
        const name = (document.getElementById('swal-input-name') as HTMLInputElement).value;

        if (!deviceId || !name) {
          Swal.showValidationMessage('Vui lòng chọn/nhập mã thiết bị và tên thiết bị');
          return false;
        }
        return {
          deviceId,
          name,
          houseId,
        };
      },
    });

    if (formValues) {
      try {
        const response = await api.post('/devices/create', formValues);
        if (response.data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Thành công',
            text: 'Đã liên kết thiết bị vào nhà nấm thành công!',
            timer: 1500,
            showConfirmButton: false,
          });
          fetchDevices();
        }
      } catch (err: any) {
        Swal.fire({
          icon: 'error',
          title: 'Lỗi đăng ký',
          text: err.response?.data?.message || 'Có lỗi xảy ra khi liên kết thiết bị.',
        });
      }
    }
  } catch (err) {
    console.error('Lỗi khi lấy danh sách thiết bị chưa đăng ký:', err);
  }
};

export const triggerDeleteDeviceAlert = async (id: string, name: string, fetchDevices: () => void) => {
  try {
    const result = await Swal.fire({
      title: 'Xóa thiết bị?',
      text: `Bạn có chắc chắn muốn xóa thiết bị "${name}" khỏi nhà nấm này? Thao tác này cũng sẽ xóa token và dữ liệu liên quan.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Có, xóa ngay!',
      cancelButtonText: 'Hủy',
      customClass: {
        popup: 'custom-swal-popup',
        confirmButton: 'custom-swal-delete-btn',
        cancelButton: 'custom-swal-cancel-btn',
      },
      buttonsStyling: false,
    });

    if (result.isConfirmed) {
      const response = await api.delete(`/devices/${id}`);
      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Đã xóa',
          text: 'Thiết bị đã được xóa thành công khỏi nhà nấm!',
          timer: 1500,
          showConfirmButton: false,
        });
        fetchDevices();
      }
    }
  } catch (err: any) {
    console.error('Lỗi khi xóa thiết bị:', err);
    Swal.fire({
      icon: 'error',
      title: 'Lỗi',
      text: err.response?.data?.message || 'Có lỗi xảy ra khi xóa thiết bị.',
    });
  }
};

export const triggerRenameSensorAlert = async (
  deviceId: string,
  sensorKey: string,
  currentName: string,
  spaceX: number,
  spaceY: number,
  onSuccess: (newName: string) => void
) => {
  const SENSOR_LABELS: Record<string, string> = {
    temperature: 'Nhiệt độ',
    humidity: 'Độ ẩm không khí',
    soilMoisture: 'Độ ẩm đất',
    lightIntensity: 'Cường độ ánh sáng',
  };

  const sensorLabel = SENSOR_LABELS[sensorKey] || sensorKey;

  const { value: newName } = await Swal.fire({
    title: 'Đặt tên cho cảm biến',
    input: 'text',
    inputLabel: `Loại cảm biến: ${sensorLabel} (${sensorKey})`,
    inputValue: currentName,
    inputPlaceholder: 'Ví dụ: Cảm biến luống dâu A',
    showCancelButton: true,
    confirmButtonText: 'Lưu tên',
    cancelButtonText: 'Hủy',
    customClass: {
      popup: 'custom-swal-popup',
      confirmButton: 'custom-swal-confirm-btn',
      cancelButton: 'custom-swal-cancel-btn',
    },
    buttonsStyling: false,
    inputValidator: (value) => {
      if (!value.trim()) {
        return 'Tên cảm biến không được để trống!';
      }
      return null;
    }
  });

  if (newName !== undefined) {
    try {
      const response = await api.put(`/devices/${deviceId}/sensor-position`, {
        sensorType: sensorKey,
        spaceX,
        spaceY,
        displayName: newName.trim(),
      });

      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Đã đổi tên',
          text: `Đổi tên cảm biến thành "${newName.trim()}" thành công.`,
          timer: 1500,
          showConfirmButton: false,
        });
        onSuccess(newName.trim());
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: err.response?.data?.message || 'Có lỗi xảy ra khi đổi tên cảm biến.',
      });
    }
  }
};

export const triggerLocateDeviceAlert = async (
  device: any,
  onConfirm: (sensorType: string) => void
) => {
  const telemetryKeys = device.latestTelemetry 
    ? Object.keys(device.latestTelemetry).filter((k: string) => k !== 'createdAt') 
    : [];
  
  const availableSensors = telemetryKeys.length > 0 
    ? telemetryKeys 
    : ['temperature', 'humidity', 'soilMoisture', 'lightIntensity'];

  const SENSOR_LABELS: Record<string, string> = {
    temperature: 'Nhiệt độ',
    humidity: 'Độ ẩm không khí',
    soilMoisture: 'Độ ẩm đất',
    lightIntensity: 'Cường độ ánh sáng',
  };

  const optionsHtml = availableSensors
    .map(key => `<option value="${key}">${SENSOR_LABELS[key] || key}</option>`)
    .join('');

  const { value: sensorType } = await Swal.fire({
    title: 'Chọn cảm biến bố trí',
    html: `
      <div style="text-align: left; padding: 10px 0; font-family: 'Inter', sans-serif;">
        <p style="font-size: 13px; color: var(--db-on-surface-variant); margin-bottom: 12px;">
          Nhà nấm phát hiện thiết bị <strong>${device.name}</strong> hỗ trợ các cảm biến sau. Chọn loại cảm biến bạn muốn đặt vị trí:
        </p>
        <select id="swal-select-sensor" class="swal-form-select" style="width: 100%; padding: 12px; border: 1px solid var(--db-outline-variant); border-radius: 8px; font-size: 14px; outline: none; background: var(--db-surface-container-low); color: var(--db-on-surface);">
          ${optionsHtml}
        </select>
      </div>
    `,
    customClass: {
      popup: 'custom-swal-popup',
      confirmButton: 'custom-swal-confirm-btn',
      cancelButton: 'custom-swal-cancel-btn',
    },
    buttonsStyling: false,
    showCancelButton: true,
    confirmButtonText: 'Xác nhận đặt vị trí',
    cancelButtonText: 'Hủy',
    preConfirm: () => {
      const select = document.getElementById('swal-select-sensor') as HTMLSelectElement;
      return select.value;
    }
  });

  if (sensorType) {
    onConfirm(sensorType);
  }
};
