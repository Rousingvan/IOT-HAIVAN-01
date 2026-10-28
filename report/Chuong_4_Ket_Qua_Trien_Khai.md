# CHƯƠNG 4: KẾT QUẢ TRIỂN KHAI VÀ KIỂM THỬ HỆ THỐNG

---

## 4.1. Cấu trúc thư mục dự án

Dự án được tổ chức theo mô hình **Monorepo** phân tách rõ ràng 6 phân hệ độc lập, giúp dễ dàng bảo trì, mở rộng và triển khai:

```text
iot-ptit-2026/
├── hardware/                   # Phân hệ Phần cứng & Nhúng (ESP32)
│   ├── firmware/
│   │   └── iot_ptit_firmware/  # Mã nguồn C/C++ (iot_ptit_firmware.ino, config.h)
│   └── schematics/             # Sơ đồ đấu nối chân GPIO & mô phỏng Wokwi
├── mqtt/                       # Phân hệ MQTT Broker & Giả lập thiết bị
│   ├── broker-config/          # Docker Compose, mosquitto.conf, passwords.txt
│   └── mock-simulator/         # Script giả lập Telemetry & phản hồi ACK
├── database/                   # Phân hệ Cơ sở dữ liệu (MongoDB)
│   ├── schemas/                # Định nghĩa 5 Schema chuẩn (User, Sensor, SensorData, Device, ActionHistory)
│   └── seeders/                # Script khởi tạo dữ liệu mẫu (run-all-seeds.js)
├── backend/                    # Phân hệ Máy chủ (Node.js + Express + Socket.io)
│   └── src/
│       ├── config/             # Cấu hình kết nối MongoDB, MQTT Client, Swagger UI
│       ├── controllers/        # Xử lý nghiệp vụ RESTful API (Auth, Profile, Sensor, Device, History)
│       ├── models/             # Mongoose Models tương tác Database
│       ├── routes/             # Định tuyến API (/api/*)
│       ├── services/           # Dịch vụ lắng nghe MQTT & kiểm soát đồng bộ ACK/Timeout
│       ├── utils/              # Bộ phân tích chuỗi tìm kiếm thời gian đa năng (timeRangeHelper.js)
│       └── server.js           # Entry point khởi chạy HTTP Server & WebSocket
├── frontend/                   # Phân hệ Giao diện người dùng (React + Vite + Ant Design)
│   └── src/
│       ├── components/         # Component tái sử dụng (SensorCard, SensorAreaChart, DevicePanel, Filter...)
│       ├── pages/              # 5 màn hình chính (Dashboard, DataSensor, ActionHistory, Profile, Login/Register)
│       ├── services/           # Cấu hình Axios (api.js) & Socket.io Client (socket.js)
│       └── App.jsx             # Định tuyến Client-side (React Router)
└── postman/                    # Bộ kịch bản kiểm thử tự động API (Postman Collection)
```

---

## 4.2. Kết quả triển khai phần cứng

Hệ thống phần cứng sử dụng vi điều khiển trung tâm **ESP32 NodeMCU (30 chân)** kết hợp cảm biến môi trường và các ngõ ra điều khiển thiết bị.

### 1. Bảng đấu nối chân GPIO (Pin Mapping)

| Thành phần phần cứng | Chân ESP32 | Chế độ hoạt động | Chức năng thực tế |
| :--- | :---: | :---: | :--- |
| **Cảm biến DHT22** | `GPIO 4` | Digital Input | Đo Nhiệt độ ($^\circ\text{C}$) và Độ ẩm ($\%$) định kỳ 2 giây/lần. |
| **Quang trở LDR** | `GPIO 34` | Analog Input (`ADC1`) | Đọc giá trị ADC (0–4095) và quy đổi sang cường độ sáng ($\text{Lux}$). |
| **Đèn 1 (`LAMP_01`)** | `GPIO 18` | Digital Output | Điều khiển bật/tắt Đèn 1 (Active High). |
| **Đèn 2 (`LAMP_02`)** | `GPIO 19` | Digital Output | Điều khiển bật/tắt Đèn 2 (Active High). |
| **Đèn 3 (`LAMP_03`)** | `GPIO 21` | Digital Output | Điều khiển bật/tắt Đèn 3 (Active High). |
| **LED Onboard** | `GPIO 2` | Digital Output | Đèn tích hợp trên mạch báo trạng thái kết nối & kiểm thử nhanh. |

### 2. Kết quả xử lý trên Firmware ESP32
- **Cơ chế Non-blocking (`millis()`):** Không sử dụng `delay()` làm treo vi điều khiển, đảm bảo ESP32 vừa gửi dữ liệu cảm biến mỗi 2 giây vừa nhận lệnh điều khiển tức thời.
- **Tự động kết nối lại (Auto-Reconnect):** Tự động khôi phục kết nối Wi-Fi và MQTT Broker khi mất mạng, đồng thời hỗ trợ **Last Will and Testament (LWT)** báo trạng thái `OFFLINE` ngay khi mất nguồn đột ngột.
- **Phản hồi xác nhận phần cứng (Hardware ACK):** Khi nhận lệnh điều khiển tại topic `esp32/device/command`, ESP32 thực thi kích chân GPIO, đọc lại trạng thái chân vật lý (`digitalRead`) và gửi gói tin xác nhận kèm `reqId` lên topic `esp32/device/ack`.

---

## 4.3. Kết quả triển khai Broker và dịch vụ Backend

### 1. Triển khai MQTT Broker (Eclipse Mosquitto)
- **Đóng gói qua Docker Compose:** Chạy dịch vụ `eclipse-mosquitto:2` độc lập, dễ triển khai trên mọi môi trường.
- **Bảo mật xác thực:** Tắt kết nối ẩn danh (`allow_anonymous false`), bắt buộc xác thực bằng tài khoản/mật khẩu được mã hóa băm trong `passwords.txt` trên cổng `18883` (MQTT TCP) và `9001` (WebSockets).
- **Quy hoạch 4 Topic chuẩn:**
  1. `esp32/telemetry`: ESP32 gửi dữ liệu Nhiệt độ, Độ ẩm, Ánh sáng lên Server.
  2. `esp32/device/command`: Backend phát lệnh điều khiển xuống ESP32.
  3. `esp32/device/ack`: ESP32 gửi xác nhận kết quả thực thi lệnh về Backend.
  4. `esp32/status`: Cập nhật trạng thái kết nối `ONLINE` / `OFFLINE` (Retained Message).

### 2. Triển khai dịch vụ Backend (Node.js & Express)
- **Cầu nối thời gian thực (MQTT $\leftrightarrow$ Socket.io):** Dịch vụ `mqtt.service.js` lắng nghe gói tin từ Broker, lưu vào MongoDB (`SensorData`) và phát sự kiện WebSocket (`telemetry_update`, `device_state_changed`, `sensor_alert`) xuống Frontend với độ trễ $< 50\text{ ms}$.
- **Cơ chế đồng bộ lệnh 2 chiều (ACK & Timeout 5000ms):**
  - Khi người dùng bấm nút bật/tắt, Backend sinh mã `reqId` duy nhất, lưu bản ghi `ActionHistory` ở trạng thái chờ và đặt bộ đếm `ack.service.js` (5 giây).
  - Nếu nhận được ACK từ ESP32 trước 5 giây: Cập nhật trạng thái thiết bị, tính độ trễ `latency_ms` và ghi nhận `SUCCESS`.
  - Nếu quá 5 giây không phản hồi: Tự động hủy chờ, ghi nhận `TIMEOUT` và thông báo lỗi về giao diện.
- **Tài liệu hóa API:** Tích hợp **Swagger UI** trực quan tại đường dẫn `/api-docs`.

---

## 4.4. Kết quả xây dựng giao diện người dùng Frontend

Giao diện được xây dựng bằng **React 18 (Vite)** kết hợp thư viện **Ant Design 5** và **Recharts**, gồm 4 phân hệ màn hình chính:

1. **Trang Tổng quan (Dashboard - `DashboardPage.jsx`):**
   - **3 Thẻ cảm biến (`SensorCard`):** Hiển thị trực quan Nhiệt độ, Độ ẩm, Ánh sáng theo thời gian thực kèm cảnh báo đổi màu và Banner cảnh báo (`AlertBanner`) khi vượt ngưỡng an toàn.
   - **Biểu đồ vùng thời gian thực (`SensorAreaChart`):** Tự động nối điểm dữ liệu mới qua Socket.io, hỗ trợ bật/tắt từng đường biểu đồ và chọn khoảng thời gian xem.
   - **Bảng điều khiển thiết bị (`DevicePanel`):** Các công tắc (Switch) điều khiển Đèn 1, Đèn 2, Đèn 3. Khi bấm sẽ hiển thị hiệu ứng xoay chờ (`Loading Spinner`) cho đến khi nhận được phản hồi ACK thực tế từ ESP32.
2. **Trang Lịch sử Cảm biến (`DataSensorPage.jsx`):**
   - Bảng dữ liệu phân trang phía Server (Server-side Pagination) và sắp xếp tăng/giảm dần theo từng cột.
   - Bộ lọc thông số (Tất cả / Nhiệt độ / Độ ẩm / Ánh sáng) và **thanh tìm kiếm thời gian thông minh** (`VariableTimeRangeFilter`) cho phép nhập linh hoạt theo giây, phút, giờ, ngày hoặc khoảng thời gian (`DD/MM/YYYY HH:mm:ss`).
3. **Trang Lịch sử Điều khiển (`ActionHistoryPage.jsx`):**
   - Ghi lại chi tiết mọi thao tác bật/tắt thiết bị: Thời gian gửi lệnh, thiết bị, hành động (`ON`/`OFF`), trạng thái thực thi (`SUCCESS`, `TIMEOUT`, `FAILED`) và độ trễ phản hồi (`latency_ms`).
4. **Trang Hồ sơ cá nhân (`ProfilePage.jsx`):**
   - Hiển thị thông tin sinh viên thực hiện, hỗ trợ cập nhật ảnh đại diện (tải ảnh hoặc dán URL) và cung cấp 4 liên kết tài liệu đồ án: **GitHub Repository, Figma Design, Swagger API Docs, Báo cáo PDF**.

---

## 4.5. Đánh giá thử nghiệm và kiểm thử hệ thống

Hệ thống đã được kiểm thử toàn diện qua **Postman Collection**, kịch bản giả lập và mạch phần cứng thực tế:

| STT | Hạng mục kiểm thử | Kịch bản thực hiện | Kết quả thực tế | Đánh giá |
| :-: | :--- | :--- | :--- | :---: |
| **1** | **Thu thập dữ liệu Realtime** | ESP32 gửi gói tin JSON mỗi 2 giây lên `esp32/telemetry`. | Lưu DB chính xác, giao diện Dashboard & biểu đồ cập nhật tức thì qua Socket.io (độ trễ $< 100\text{ ms}$). | **Đạt** |
| **2** | **Điều khiển thiết bị (Có mạng)** | Bấm bật/tắt Đèn 1, Đèn 2, Đèn 3 trên Web khi ESP32 đang kết nối. | LED trên mạch sáng/tắt ngay lập tức; nhận ACK thành công với `latency_ms` trung bình $45\text{ ms} - 180\text{ ms}$. | **Đạt** |
| **3** | **Xử lý lỗi mất kết nối (Timeout)** | Ngắt nguồn ESP32, sau đó bấm bật/tắt thiết bị trên Web. | Nút bấm quay Loading trong đúng 5 giây, sau đó hoàn tác trạng thái cũ, báo lỗi Timeout và lưu lịch sử `TIMEOUT`. | **Đạt** |
| **4** | **Tìm kiếm & Phân trang lớn** | Truy vấn lịch sử với $> 1.000$ bản ghi, lọc theo chuỗi thời gian bất kỳ. | Phản hồi API $< 50\text{ ms}$ nhờ đánh Index trên trường `timestamp`; kết quả khớp chính xác theo múi giờ Việt Nam. | **Đạt** |
| **5** | **Bảo mật MQTT & API** | Kết nối MQTT không mật khẩu hoặc gọi API không kèm JWT Token. | Broker từ chối kết nối (`Not Authorized`); Backend trả mã lỗi `401 Unauthorized`. | **Đạt** |

---

## 4.6. Triển khai hệ thống

Quy trình khởi chạy và vận hành toàn bộ hệ thống trên môi trường thực tế gồm 4 bước tuần tự:

### Bước 1: Khởi chạy MQTT Broker (Docker)
```bash
cd mqtt/broker-config
docker compose up -d
```
*(Khởi tạo Mosquitto Broker lắng nghe tại cổng `18883` với xác thực tài khoản mật khẩu).*

### Bước 2: Khởi tạo CSDL & Chạy dịch vụ Backend
```bash
# Khởi tạo dữ liệu mẫu (Tài khoản, danh sách cảm biến & thiết bị)
cd database && npm run seed

# Khởi chạy máy chủ Backend tại cổng 5000
cd ../backend
npm install
npm run dev
```

### Bước 3: Khởi chạy giao diện Frontend
```bash
cd frontend
npm install
npm run dev
```
*(Truy cập ứng dụng Web tại `http://localhost:5173` và tài liệu Swagger tại `http://localhost:5000/api-docs`).*

### Bước 4: Nạp Firmware cho mạch ESP32
1. Mở file `hardware/firmware/iot_ptit_firmware/config.h`, cấu hình thông tin `WIFI_SSID`, `WIFI_PASSWORD` và địa chỉ IP LAN của máy chạy MQTT Broker (`MQTT_SERVER`).
2. Sử dụng **Arduino IDE** biên dịch và nạp chương trình xuống bo mạch **ESP32 DevKit V1** qua cổng USB (Baudrate `115200`).
3. Ngay khi ESP32 kết nối thành công, hệ thống tự động đồng bộ trạng thái `ONLINE` và bắt đầu luồng giám sát – điều khiển thời gian thực.


---

# CHƯƠNG 5: KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN

---

## 5.1. Kết luận

Đề tài **"Hệ thống Giám sát Môi trường và Điều khiển Thiết bị Thông minh (IoT Smart Home)"** đã hoàn thành đầy đủ các mục tiêu đề ra, xây dựng thành công một hệ thống IoT khép kín từ tầng phần cứng nhúng (ESP32) đến tầng giao tiếp (MQTT Broker), xử lý trung tâm (Backend/Database) và giao diện người dùng (Frontend):

1. **Về mặt kỹ thuật & kiến trúc:**
   - Thiết kế và triển khai thành công luồng truyền nhận dữ liệu thời gian thực 2 chiều thông qua giao thức **MQTT** (giữa ESP32 và Backend) kết hợp **Socket.io** (giữa Backend và Frontend) với độ trễ thấp ($< 100\text{ ms}$).
   - Giải quyết triệt để bài toán đồng bộ trạng thái thiết bị thực tế bằng **cơ chế xác nhận lệnh 2 chiều (Hardware ACK) và kiểm soát Timeout 5000ms**, đảm bảo trạng thái hiển thị trên Web luôn phản ánh đúng trạng thái vật lý của mạch.
   - Đảm bảo tính an toàn và bảo mật cơ bản ở cả hai tầng: Xác thực tài khoản/mật khẩu trên **Mosquitto MQTT Broker** và xác thực **JWT (JSON Web Token)** kèm mã hóa mật khẩu `bcrypt` trên RESTful API.
2. **Về mặt chức năng ứng dụng:**
   - Hoàn thiện 4 phân hệ màn hình trực quan: **Dashboard thời gian thực** (thẻ chỉ số, cảnh báo vượt ngưỡng, biểu đồ vùng tự động cập nhật, bảng công tắc điều khiển), **Lịch sử cảm biến** (lọc đa tiêu chí, tìm kiếm chuỗi thời gian linh hoạt, phân trang phía Server), **Lịch sử điều khiển** (theo dõi trạng thái `SUCCESS`/`TIMEOUT` và độ trễ `latency_ms`) và **Hồ sơ cá nhân** (tích hợp tài liệu Swagger, GitHub, Figma, Báo cáo).

---

## 5.2. Các hạn chế còn tồn tại

Bên cạnh những kết quả đạt được, hệ thống hiện tại vẫn còn một số điểm hạn chế cần khắc phục khi đưa vào môi trường thực tế quy mô lớn:

1. **Cấu hình mạng trên phần cứng còn cố định (Hardcoded):** Thông tin Wi-Fi (`WIFI_SSID`, `WIFI_PASSWORD`) và địa chỉ IP của MQTT Broker đang được khai báo trực tiếp trong file `config.h`, gây bất tiện khi thay đổi môi trường mạng mà không nạp lại code.
2. **Đường truyền chưa mã hóa TLS/SSL:** Giao tiếp giữa ESP32 và MQTT Broker hiện chạy trên nền TCP thuần (cổng `18883`), mới chỉ xác thực bằng Username/Password mà chưa mã hóa gói tin bằng chứng chỉ MQTTS (TLS/SSL).
3. **Chưa có bộ nhớ đệm ngoại tuyến (Offline Buffering) trên ESP32:** Khi mất kết nối Wi-Fi hoặc Broker tạm thời, dữ liệu cảm biến đọc được trong khoảng thời gian đứt kết nối sẽ bị bỏ qua thay vì lưu tạm vào bộ nhớ Flash (SPIFFS/LittleFS) để đồng bộ bù.
4. **Chưa có kịch bản tự động hóa (Rule Engine):** Hệ thống hiện phát cảnh báo khi nhiệt độ, độ ẩm hoặc ánh sáng vượt ngưỡng nhưng chưa tự động kích hoạt thiết bị (ví dụ: tự động bật quạt khi nhiệt độ $> 35^\circ\text{C}$ hoặc tự bật đèn khi trời tối).

---

## 5.3. Hướng phát triển trong tương lai

Để hoàn thiện sản phẩm thành một hệ thống IoT thương mại, đề tài hướng tới các cải tiến trọng tâm sau:

1. **Tích hợp WiFiManager & Cập nhật phần mềm từ xa (OTA):**
   - Bổ sung cổng cấu hình Captive Portal (`WiFiManager`) giúp người dùng nhập Wi-Fi và IP Broker qua điện thoại mà không cần nạp lại code.
   - Tích hợp **OTA (Over-The-Air)** để nâng cấp Firmware cho ESP32 trực tiếp qua mạng Wi-Fi.
2. **Xây dựng bộ quy tắc điều khiển tự động (Automation Rule Engine):**
   - Cho phép người dùng cấu hình ngưỡng tự động ngay trên giao diện Web (VD: *Nếu Ánh sáng $< 100\text{ Lux}$ $\rightarrow$ Tự động bật `LAMP_01`*; *Hẹn giờ bật/tắt thiết bị theo lịch trình*).
3. **Nâng cấp bảo mật và mở rộng đa Node thiết bị:**
   - Triển khai **MQTTS (MQTT over TLS)** và phân quyền truy cập theo từng topic (ACL - Access Control List).
   - Mở rộng kiến trúc quản lý nhiều bo mạch ESP32 theo từng phòng (Phòng khách, Phòng ngủ, Phòng Lab) và triển khai lên hạ tầng đám mây (Docker/VPS/Cloud) để điều khiển từ xa qua Internet.
4. **Đa dạng hóa kênh cảnh báo & Ứng dụng di động:**
   - Tích hợp gửi thông báo tức thời qua **Telegram Bot / Email / Push Notification** khi phát hiện chỉ số môi trường vượt ngưỡng nguy hiểm hoặc khi thiết bị mất kết nối (`OFFLINE`).
