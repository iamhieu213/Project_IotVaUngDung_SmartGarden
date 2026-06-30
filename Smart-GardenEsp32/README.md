# Smart Garden ESP32 Firmware

Thư mục này chứa mã nguồn nhúng viết bằng ngôn ngữ **C++ (Arduino)** dành cho vi điều khiển **ESP32**. ESP32 đóng vai trò là thiết bị phần cứng tại thực địa, có nhiệm vụ đọc dữ liệu từ các cảm biến môi trường để gửi lên máy chủ (qua MQTT) và nhận lệnh bật/tắt thiết bị ngoại vi (Relay điều khiển máy bơm).

---

## 🔌 Sơ Đồ Cấu Hình Chân Thiết Bị (Pinout)

Các chân kết nối cảm biến và thiết bị được định nghĩa tập trung trong file [pins.h](file:///d:/2025.2/Iot%20va%20ung%20dung/Project/Smart-GardenEsp32/smart-garden-esp32/config/pins.h):

* **Cảm Biến Nhiệt Độ & Độ Ẩm Không Khí (DHT22 / DHT11):**
  - Cảm biến chính (DHT 1): Chân **GPIO 4**
  - Cảm biến phụ (DHT 2): Chân **GPIO 18**
* **Cảm Biến Độ Ẩm Đất (Soil Moisture Sensor - ADC):**
  - Cảm biến chính (Soil 1): Chân **GPIO 34** (ADC1)
  - Cảm biến phụ (Soil 2): Chân **GPIO 33** (ADC1) *(Có thể tắt bằng cờ `HAS_SOIL_2` trong file main)*
* **Cảm Biến Mực Nước Bể (Water Level Sensor - ADC):**
  - Cảm biến chính (Water 1): Chân **GPIO 35** (ADC1)
* **Cảm Biến Cường Độ Ánh Sáng (BH1750 - Giao tiếp I2C):**
  - Chân SDA: Chân **GPIO 21**
  - Chân SCL: Chân **GPIO 22**
* **Điều Khiển Máy Bơm (Relay Bơm Nước):**
  - Máy bơm chính (Pump): Chân **GPIO 25**

---

## 📂 Cấu Trúc Thư Mục Firmware

```text
smart-garden-esp32/
├── smart-garden-esp32.ino    # File chính chứa hàm setup(), loop(), kết nối mạng và logic gửi nhận dữ liệu
├── config/                   # Thư mục lưu trữ tệp tin cấu hình hệ thống
│   ├── wifi.h                # Cấu hình SSID và Mật khẩu mạng Wi-Fi
│   ├── mqtt.h                # Cấu hình IP Host Broker, Port, Tài khoản MQTT
│   └── pins.h                # Định nghĩa sơ đồ chân các GPIO kết nối phần cứng
├── sensors/                  # Lớp thư viện con đọc dữ liệu từ các cảm biến chuyên biệt
│   ├── dht_sensor.h          # Đọc nhiệt độ và độ ẩm không khí từ DHT
│   ├── light_sensor.h        # Đọc cường độ ánh sáng Lux từ cảm biến BH1750
│   ├── soil_sensor.h         # Đọc độ ẩm đất thô (Analog) từ cảm biến
│   └── water_sensor.h        # Đọc mực nước bể chứa phục vụ bảo vệ máy bơm
└── models/                   # Chứa định nghĩa cấu trúc dữ liệu hoặc mô hình thiết bị
```

---

## 📡 MQTT Topics & Định Dạng Dữ Liệu

Mạch ESP32 sử dụng MAC Address (định dạng viết liền, không dấu hai chấm) để tự định danh duy nhất trên Server. Ví dụ MAC: `240AC4XXXXXX`.

### 1. Xuất Bản Dữ Liệu Cảm Biến (`smartgarden/devices/<MAC>/data`)
Định kỳ gửi dữ liệu cảm biến dạng JSON lên Server (mặc định mỗi 10 giây trong chế độ kiểm tra thử nghiệm, hoặc 5 phút trong chế độ thực tế):
```json
{
  "temperature1": 27.5,
  "humidity1": 68.0,
  "temperature2": 26.8,
  "humidity2": 71.0,
  "soilMoisture1": 1950,
  "waterLevel1": 420,
  "lightIntensity1": 150.0
}
```

### 2. Báo Cáo Trạng Thái Kết Nối (`smartgarden/devices/<MAC>/status`)
* Khi bật nguồn kết nối thành công: Gửi tin nhắn chuỗi `"online"` kèm giữ lại (Retained Message).
* Khi đột ngột mất kết nối/mất nguồn: Server tự nhận biết chuỗi `"offline"` nhờ cơ chế **LWT (Last Will and Testament)** được thiết lập lúc kết nối.

### 3. Đăng Ký Lệnh Điều Khiển (`smartgarden/devices/<MAC>/control`)
ESP32 lắng nghe lệnh bật/tắt máy bơm từ Server:
* Bật máy bơm: Nhận tin nhắn chứa cụm từ `"pump":1` -> Chuyển chân `PUMP_PIN` lên mức HIGH.
* Tắt máy bơm: Nhận tin nhắn chứa cụm từ `"pump":0` -> Chuyển chân `PUMP_PIN` xuống mức LOW.

> [!IMPORTANT]
> **Cơ Chế Bảo Vệ Máy Bơm Chống Cháy (Chống cạn bể):**
> ESP32 tích hợp logic bảo vệ phần cứng trực tiếp. Trước khi thực hiện lệnh bật máy bơm từ Server, mạch sẽ đọc cảm biến mực nước bể chứa (`WATER_SENSOR_PIN_1`). Nếu mực nước đo được nhỏ hơn ngưỡng cạn nước an toàn (`< 200`), mạch sẽ chủ động ngắt bơm ngay lập tức để bảo vệ động cơ không bị chạy khô sinh nhiệt gây cháy, đồng thời ghi cảnh báo ra cổng Serial.

---

## 🛠️ Hướng Dẫn Nạp Chương Trình

### 1. Chuẩn Bị Công Cụ
* Tải và cài đặt **Arduino IDE** (phiên bản v2.x trở lên).
* Cài đặt gói hỗ trợ chip ESP32 (ESP32 Board Package) trong Arduino IDE: Vào *File -> Preferences*, thêm URL: `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json` vào mục *Additional Boards Manager URLs*. Sau đó vào *Tools -> Board -> Boards Manager* và cài đặt gói **esp32** của Espressif.

### 2. Cài Đặt Các Thư Viện Cần Thiết
Vào *Sketch -> Include Library -> Manage Libraries* và cài đặt các thư viện sau:
* **PubSubClient** (by Nick O'Leary) - Dùng cho giao thức MQTT.
* **DHT sensor library** (by Adafruit) - Đọc cảm biến nhiệt độ DHT.
* **Adafruit Unified Sensor** (by Adafruit) - Thư viện lõi hỗ trợ cảm biến DHT.
* **BH1750** (by Christopher Laws) - Đọc cường độ ánh sáng qua giao tiếp I2C.

### 3. Cấu Hình Thông Số Môi Trường
1. Mở file [wifi.h](file:///d:/2025.2/Iot%20va%20ung%20dung/Project/Smart-GardenEsp32/smart-garden-esp32/config/wifi.h) và sửa tên WiFi cũng như mật khẩu tại nhà của bạn:
   ```cpp
   #define WIFI_SSID "Tên_WiFi_Của_Bạn"
   #define WIFI_PASSWORD "Mật_Khẩu_WiFi"
   ```
2. Mở file [mqtt.h](file:///d:/2025.2/Iot%20va%20ung%20dung/Project/Smart-GardenEsp32/smart-garden-esp32/config/mqtt.h) và sửa địa chỉ IP của máy tính đang chạy MQTT Broker (Mosquitto/EMQX) cùng tài khoản kết nối:
   ```cpp
   #define MQTT_SERVER "192.168.x.x" // Địa chỉ IP LAN máy tính chạy Broker
   #define MQTT_PORT 1883
   #define MQTT_USER "tài_khoản_mqtt"
   #define MQTT_PASS "mật_khẩu_mqtt"
   ```

### 4. Nạp Mã Nguồn
1. Kết nối kit ESP32 với máy tính bằng cáp MicroUSB hoặc Type-C truyền dữ liệu.
2. Chọn Board phù hợp (VD: *ESP32 Dev Module* hoặc *DOIT ESP32 DEVKIT V1*) và cổng COM tương ứng tại mục *Tools -> Board* và *Tools -> Port*.
3. Bấm nút **Upload** (Mũi tên chỉ sang phải) trên thanh công cụ để tiến hành biên dịch và nạp code xuống chip.
4. Mở **Serial Monitor** (Tốc độ truyền `115200 baud`) để theo dõi nhật ký kết nối WiFi, MQTT và dữ liệu cảm biến gửi đi.
