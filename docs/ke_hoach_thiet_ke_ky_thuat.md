# KẾ HOẠCH THIẾT KẾ KỸ THUẬT HỆ THỐNG IOT PTIT (BƯỚC 10 → BƯỚC 6)

> **Căn cứ tài liệu:** `SPEC-IOT-PTIT-2026` ([2026-08-16-iot-system-ptit-spec.md](./superpowers/specs/2026-08-16-iot-system-ptit-spec.md)) & `TIMESTAMP-SPEC` ([timestamp.md](./timestamp.md))  
> **Thứ tự thực hiện:** `10. Thiết kế Frontend` $\rightarrow$ `9. Thiết kế Database` $\rightarrow$ `8. Thiết kế Backend / API` $\rightarrow$ `7. Thiết kế MQTT / Communication` $\rightarrow$ `6. Thiết kế Hardware`  
> **Tone màu chủ đạo:** **Cam - Trắng (Orange - White)**: Tương phản cao, thân thiện, sáng sủa, dễ nhìn.

---

## 1. TỔNG QUAN CẤU TRÚC THƯ MỤC HỆ THỐNG DỰ KIẾN

```
iot-ptit/
├── docs/                                  # Toàn bộ tài liệu kỹ thuật, đặc tả, báo cáo
│   ├── superpowers/specs/                 # SRS & BA Specs
│   ├── timestamp.md                       # Đặc tả bộ lọc thời gian đa độ chính xác
│   ├── ke_hoach_thiet_ke_ky_thuat.md      # Bản kế hoạch thiết kế kỹ thuật chi tiết (file này)
│   ├── huong_dan_customize.md             # Hướng dẫn tùy biến thông số & giao diện
│   └── prompt_dong_bo_hardware.md         # Bộ prompt đồng bộ cấu hình cứng - mềm & mở rộng thiết bị
│
├── frontend/                              # [BƯỚC 10] React + Vite + Ant Design (Cam - Trắng)
│   ├── src/
│   │   ├── components/                    # SensorCard, AreaChart, DevicePanel, VariableTimeRangeFilter
│   │   ├── pages/                         # 5 Pages tương ứng 5 Use Cases
│   │   ├── services/                      # Axios API & Socket.io client
│   │   └── theme/                         # Cấu hình Ant Design theme (Orange/White)
│   ├── figma-design/                      # File tokens & hướng dẫn import Figma
│   └── README.md
│
├── database/                              # [BƯỚC 9] MongoDB Mongoose Schemas & Seeders
│   ├── schemas/                           # 5 Mongoose Schemas (Hỗ trợ Dynamic Devices)
│   ├── seeders/                           # Script tạo dữ liệu mẫu kiểm thử
│   └── README.md
│
├── backend/                               # [BƯỚC 8] Node.js + Express + Socket.io + MQTT Client
│   ├── src/
│   │   ├── controllers/                   # Xử lý nghiệp vụ 5 Use Cases & Range Filter Parser
│   │   ├── routes/                        # RESTful API endpoints
│   │   ├── services/                      # MQTT service, Socket service, Timeout ACK service
│   │   └── config/                        # Cấu hình DB, MQTT (có chú thích đổi IP/Broker)
│   └── README.md
│
├── mqtt/                                  # [BƯỚC 7] Cấu hình Broker & Mock Simulator
│   ├── broker-config/                     # Mosquitto / EMQX Docker compose & config
│   ├── mock-simulator/                    # Giả lập ESP32 gửi dữ liệu & phản hồi ACK
│   └── README.md
│
└── hardware/                              # [BƯỚC 6] Firmware ESP32 (Thực hiện sau cùng)
    ├── firmware/                          # Source code Arduino C++ (.ino)
    ├── schematics/                        # Sơ đồ nguyên lý: Đèn (Thật) + Quạt (Chân mở rộng)
    └── README.md
```

---

## 2. CHI TIẾT TỪNG BƯỚC THIẾT KẾ KỸ THUẬT

---

### 🎨 BƯỚC 10. THIẾT KẾ FRONTEND (React + Vite + Ant Design + Recharts)

* **Phong cách UI/UX:** Màu chủ đạo **Cam năng động (`#FA541C` / `#FF7A45`)** kết hợp nền **Trắng sáng (`#FFFFFF`)** và xám nhạt (`#F5F5F5`), điểm nhấn badge xanh lá (`#52C41A`) khi thiết bị ON. Giao diện thoáng đãng, phân chia khối rõ ràng, dễ nhìn cho thầy chấm điểm.

#### Danh sách File & Thư mục Frontend:

1. **`frontend/src/theme/themeConfig.js`**:
   - *Mục đích:* Cấu hình Design Token của Ant Design (Primary Color = Cam `#FA541C`, Background = `#FAFAFA`, Border Radius = `8px`, Font chữ Inter).
   - *Customize:* Dễ dàng đổi mã màu `#FA541C` sang mã màu khác chỉ bằng 1 dòng code.

2. **`frontend/src/components/`**:
   - `DevicePanel.jsx` (**UC02 & UC04**):
     - **Đèn (`LAMP_01`):** Trạng thái *Đã kết nối (Online)*. Switch Bật/Tắt hoạt động đầy đủ, có spin loading chờ ACK từ MQTT, popup xác nhận thành công và nút "Xem chi tiết" dẫn sang UC05.
     - **Quạt (`FAN_01`):** Trạng thái *Chưa kết nối (Disconnected)* với Tag màu xám/vàng nhạt. Switch ở trạng thái `disabled`, hover hiển thị Tooltip: *"Thiết bị chưa được kết nối phần cứng - Module mở rộng sẵn sàng"*.
     - **Tính mở rộng:** Render dynamic từ API (`devices.map(...)`), tự động render icon tương ứng (`FAN`, `LAMP`, `PUMP`, `AC`...).
   - `VariableTimeRangeFilter.jsx` (**UC03 & UC05 - Căn cứ `timestamp.md`**):
     - Bộ lọc thời gian hai mốc: `Start Time` và `End Time`.
     - Mỗi mốc gồm 4 ô nhập: `[ Date ]` (bắt buộc), `[ Hour ]`, `[ Minute ]`, `[ Second ]` (3 ô này có thể để trống).
     - **Quy tắc tính liên tục:** Nếu nhập Giây bắt buộc phải có Phút và Giờ; nếu nhập Phút bắt buộc phải có Giờ.
     - Tự động xác định `granularity` (`DAY`, `HOUR`, `MINUTE`, `SECOND`) gửi kèm API khi bấm nút `[ Cập nhật / Lọc ]`. Không tự động điền "00" vào ô trống.
     - Kiểm tra điều kiện hợp lệ `Start Time <= End Time`.

3. **`frontend/src/pages/` (5 Màn hình theo chuẩn 5 Use Cases):**
   - `LoginPage.jsx` (**UC01**): Form đăng nhập chuẩn UX, kiểm tra tài khoản, hiển thị thông báo lỗi.
   - `ProfilePage.jsx` (**UC01**): Thẻ Card sinh viên (Avatar, Họ tên, MSSV, Lớp) kèm 4 nút liên kết chính: *GitHub Repo, Figma Design, Swagger API Docs, Báo cáo PDF*.
   - `DashboardPage.jsx` (**UC02 & UC04**):
     - **Top/Left (2/3 màn hình):** 3 Card chỉ số cảm biến (Nhiệt độ - Cam đỏ, Độ ẩm - Xanh dương nhạt, Ánh sáng - Vàng cam) + Biểu đồ **AreaChart Gradient** tự động reload mỗi 5s độc lập (không reload toàn trang).
     - **Right (1/3 màn hình):** `DevicePanel` chứa danh sách thiết bị (Đèn hoạt động, Quạt disabled chưa kết nối).
     - **Notification/Alert:** Popup cảnh báo màu đỏ khi nhiệt độ > 35°C hoặc mất kết nối phần cứng.
   - `DataSensorPage.jsx` (**UC03**): Bộ lọc đa năng kết hợp chọn Loại cảm biến (All/Nhiệt độ/Độ ẩm/Ánh sáng) + `VariableTimeRangeFilter` + Phân trang Ant Design Table.
   - `ActionHistoryPage.jsx` (**UC05**): Bảng lịch sử điều khiển chi tiết (ID, Tên thiết bị, Hành động Bật/Tắt, Thời gian gửi lệnh, Thời gian nhận phản hồi, Trạng thái Thành công/Thất bại/Timeout) tích hợp `VariableTimeRangeFilter`.

4. **`frontend/figma-design/` (Tài nguyên Import lên Figma):**
   - `tokens.json`: Chứa bộ màu sắc, typography, khoảng cách (Spacing) để import trực tiếp qua plugin *Tokens Studio for Figma*.
   - `figma-wireframe-guide.md`: Hướng dẫn chi tiết tạo 5 Frame chuẩn 1440x900px, vị trí các component để làm báo cáo BTL.
   - `figma-ui-kit.html` (hoặc SVG bundle): File HTML/SVG chứa trọn bộ layout 5 màn hình để copy/paste nhanh vào Figma qua plugin *HTML to Design*.

---

### 🗄️ BƯỚC 9. THIẾT KẾ DATABASE (MongoDB + Mongoose)

* **Mục đích:** Lưu trữ phi cấu trúc hiệu năng cao, tối ưu cho chuỗi dữ liệu thời gian (Time-Series) của IoT và thiết kế dynamic mở rộng thiết bị.

#### Danh sách File & Schema:

1. **`database/schemas/User.schema.js`**: Lưu tài khoản, mật khẩu băm bcrypt, họ tên sinh viên, MSSV.
2. **`database/schemas/Sensor.schema.js`**: Danh mục cảm biến (`sensor_code`, `sensor_type`, `unit`, `pin_location`).
3. **`database/schemas/SensorData.schema.js`**: Dữ liệu đo đạc (`sensor_type`, `value`, `measured_at`). Có Index `{ sensor_type: 1, measured_at: -1 }` để tối ưu truy vấn bộ lọc và biểu đồ.
4. **`database/schemas/Device.schema.js` (Mở rộng cho Plug-and-Play):**
   - `device_code`: String, unique (VD: `LAMP_01`, `FAN_01`, `PUMP_01`).
   - `device_name`: String (VD: "Đèn chiếu sáng", "Quạt làm mát").
   - `device_type`: String, enum: `['LAMP', 'FAN', 'PUMP', 'AC', 'OTHER']`.
   - `pin_relay`: Number (GPIO pin trên ESP32).
   - `is_connected`: Boolean (Mặc định `true` cho Đèn, `false` cho Quạt).
   - `current_state`: String, enum: `['ON', 'OFF']`.
   - `is_active`: Boolean.
5. **`database/schemas/ActionHistory.schema.js`**: Nhật ký điều khiển (`user_id`, `device_code`, `action`, `command_time`, `response_time`, `status: SUCCESS/FAILED/TIMEOUT`).
6. **`database/seeders/run-all-seeds.js`**: Script nạp sẵn:
   - Đèn `LAMP_01` (`is_connected: true`).
   - Quạt `FAN_01` (`is_connected: false`).
   - ~100 bản ghi đo đạc mẫu để dev Frontend và Backend chạy ngay mà không cần Hardware.

---

### ⚙️ BƯỚC 8. THIẾT KẾ BACKEND / API (Node.js + Express + Socket.io)

* **Mục đích:** Cung cấp RESTful API cho Frontend, quản lý kết nối WebSocket thời gian thực, điều phối lệnh MQTT động, xử lý parser bộ lọc thời gian mở rộng `[start, end)`.

#### Danh sách File & Cấu trúc:

1. **`backend/src/config/mqtt.js`** & **`database.js`**:
   - *Comment hướng dẫn:* Ghi rõ vị trí thay đổi `MQTT_BROKER_URL`, `MONGODB_URI` khi chuyển từ môi trường giả lập (Mock) sang phần cứng thật.
2. **`backend/src/services/ack.service.js` (Xử lý Timeout & ACK):**
   - Quản lý Map các lệnh đang chờ (Pending Command Map).
   - Khi nhận lệnh từ Frontend $\rightarrow$ tạo `requestId`, gửi MQTT topic `esp32/device/command`, kích hoạt timer 3-5 giây.
   - Nếu nhận ACK từ MQTT `esp32/device/ack` trước 5s $\rightarrow$ Lưu `ActionHistory` (status: `SUCCESS`), bắn Socket.io sang Frontend $\rightarrow$ Switch chuyển màu.
   - Nếu quá 5s không có ACK $\rightarrow$ Lưu `ActionHistory` (status: `TIMEOUT`), bắn Socket.io lỗi $\rightarrow$ Frontend rollback switch và báo lỗi.
3. **`backend/src/utils/timeRangeHelper.js` (Căn cứ `timestamp.md`):**
   - Nhận `startTime`, `endTime`, `granularity` (`DAY`, `HOUR`, `MINUTE`, `SECOND`).
   - Mở rộng thành khoảng thời gian chuẩn MongoDB `$gte` / `$lt` theo interval `[start, end)`:
     - `DAY`: từ `00:00:00.000` ngày bắt đầu đến `23:59:59.999` ngày kết thúc.
     - `HOUR`: từ `HH:00:00.000` đến `HH:59:59.999`.
     - `MINUTE`: từ `HH:mm:00.000` đến `HH:mm:59.999`.
     - `SECOND`: chính xác đến giây `HH:mm:ss.000` $\rightarrow$ `HH:mm:ss.999`.
4. **`backend/src/routes/` & `controllers/`**:
   - `/api/auth`: Login, Token verification.
   - `/api/profile`: Lấy thông tin sinh viên & link tài liệu.
   - `/api/sensors`: Lấy dữ liệu mới nhất (`/latest`) và lịch sử 20 điểm (`/history` cho AreaChart 5s).
   - `/api/sensor-data`: Phân trang, tìm kiếm theo khoảng giá trị, lọc ngày/giờ theo chuẩn `timestamp.md`.
   - `/api/devices`: Danh sách thiết bị (trả về cả `is_connected`), endpoint `/api/devices/:device_code/toggle` (chặn lệnh nếu `is_connected == false`).
   - `/api/action-history`: Phân trang & lọc lịch sử hoạt động theo `timestamp.md`.

---

### 📡 BƯỚC 7. THIẾT KẾ MQTT / COMMUNICATION

* **Mục đích:** Chuẩn hóa giao thức truyền thông điệp nhẹ (Lightweight Messaging) giữa Backend và Phần cứng với Payload động.

#### Danh sách File & Đặc tả:

1. **`mqtt/broker-config/docker-compose.yml`**: Khởi chạy Eclipse Mosquitto Broker local qua 1 câu lệnh Docker (hoặc hướng dẫn dùng HiveMQ Cloud Free).
2. **`mqtt/mock-simulator/` (Trình giả lập ESP32):**
   - `mock-telemetry.js`: Tự động bắn dữ liệu Nhiệt độ (20-38°C), Độ ẩm (40-90%), Ánh sáng (100-900 Lux) mỗi 2-3s vào topic `esp32/telemetry`.
   - `mock-ack-responder.js`: Lắng nghe lệnh từ topic `esp32/device/command`, giả lập độ trễ 300ms rồi publish gói tin xác nhận vào `esp32/device/ack`.
3. **`mqtt/topics-spec.md`**: Bảng đặc tả chi tiết 4 Topic:
   - Command Payload chuẩn động:
     ```json
     { "requestId": "req_12345", "deviceCode": "LAMP_01", "action": "ON", "timestamp": "2026-08-17T12:00:00Z" }
     ```
   - ACK Payload chuẩn:
     ```json
     { "requestId": "req_12345", "deviceCode": "LAMP_01", "status": "SUCCESS", "currentState": "ON", "timestamp": "2026-08-17T12:00:00.350Z" }
     ```

---

### 🔌 BƯỚC 6. THIẾT KẾ HARDWARE (ESP32 + DHT22/LDR + Relay)

* **Mục đích:** Sơ đồ đấu nối và Firmware nạp vào vi điều khiển ESP32 khi hoàn thiện phần cứng vật lý.

#### Danh sách File & Sơ đồ GPIO:

1. **`hardware/schematics/pin-mapping.md`**:
   - `GPIO 4`: Cảm biến DHT22 (Nhiệt độ, Độ ẩm) - kèm điện trở kéo lên 10kΩ.
   - `GPIO 34` (ADC1): Quang trở LDR (Cường độ ánh sáng).
   - `GPIO 26`: **Relay 1 - Đèn (`LAMP_01`) [ĐÃ LẮP THỰC TẾ]**.
   - `GPIO 27`: **Relay 2 - Quạt (`FAN_01`) [CHÂN MỞ RỘNG DỰ PHÒNG - RESERVED]**.
   - `GPIO 2`: LED onboard báo trạng thái kết nối MQTT.
2. **`hardware/firmware/iot_ptit_firmware/`**:
   - `config.h`: Khai báo WiFi SSID, Password, MQTT Broker IP, Cổng 1883, Topic constants & Mảng cấu hình chân thiết bị (`DeviceConfig devices[]`).
   - `iot_ptit_firmware.ino`: Đọc cảm biến định kỳ gửi MQTT, xử lý ngắt nhận lệnh JSON điều khiển Relay và phản hồi gói tin ACK ngay lập tức.
3. **`docs/prompt_dong_bo_hardware.md`**: Hướng dẫn kịch bản vấn đáp BTL: *"Quy trình 4 bước khi thêm thiết bị mới vào hệ thống"*.

---

## 3. CHUYÊN ĐỀ VẤN ĐÁP: "NẾU MUỐN THÊM THIẾT BỊ MỚI THÌ LÀM THẾ NÀO?"

Khi giảng viên đặt câu hỏi mở rộng, sinh viên trình bày quy trình 4 bước module hóa:

1. **Bước 1 (Phần cứng ESP32):** Nối chân điều khiển Relay của thiết bị mới vào một chân GPIO trống (VD: `GPIO 27` cho Quạt, `GPIO 25` cho Máy bơm). Khai báo thêm 1 dòng trong mảng `devices[]` của Firmware.
2. **Bước 2 (Cơ sở dữ liệu):** Thêm 1 bản ghi vào bảng `devices` trong MongoDB (VD: `{ device_code: "FAN_01", device_name: "Quạt", device_type: "FAN", pin_relay: 27, is_connected: true }`).
3. **Bước 3 (Backend & MQTT):** Backend tự động lấy danh sách thiết bị từ DB và điều hướng topic `esp32/device/command` với `deviceCode` tương ứng mà không cần sửa code logic.
4. **Bước 4 (Frontend UI):** `DevicePanel` tự động fetch danh sách từ API `/api/devices` và render ra Card điều khiển mới với Switch hoạt động bình thường.

---

## 4. THỨ TỰ THỰC HIỆN VÀ GIAI ĐOẠN

| Bước | Thành phần | Đầu ra chính | Có thể chạy độc lập không cần Phần cứng? |
| :--- | :--- | :--- | :--- |
| **Bước 10** | **Frontend (React)** | 5 màn hình Cam-Trắng, `DevicePanel` (Quạt disabled), `VariableTimeRangeFilter`, Figma UI kit | ✅ Có (qua Mock API / mock data) |
| **Bước 9** | **Database (MongoDB)** | 5 Mongoose Schemas (`is_connected`), Bộ Seed data mẫu | ✅ Có (chạy local hoặc Atlas) |
| **Bước 8** | **Backend / API (Node.js)** | RESTful API + Socket.io + Service xử lý ACK/Timeout + Time Range Parser | ✅ Có (kết nối Mock MQTT) |
| **Bước 7** | **MQTT / Communication** | Mosquitto Config + Trình giả lập Mock ESP32 | ✅ Có (tự động phát & phản hồi ACK) |
| **Bước 6** | **Hardware (ESP32)** | Sơ đồ GPIO (Đèn thật + Quạt dự phòng) + Firmware `.ino` | ⏳ Thực hiện sau cùng khi có linh kiện |

---
*Tài liệu được cập nhật ngày 2026-08-17 phục vụ đồ án IoT PTIT.*
