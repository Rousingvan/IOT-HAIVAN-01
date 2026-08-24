# HỆ THỐNG GIÁM SÁT & ĐIỀU KHIỂN IOT SMART - PTIT 2026

Hệ thống IoT hoàn chỉnh phục vụ đồ án môn học **Lập Trình Thiết Bị IoT - Học viện Công nghệ Bưu chính Viễn thông (PTIT)**.

---

## 🏛️ Cấu Trúc Hệ Thống

```
iot-ptit/
├── frontend/             # Giao diện React + Vite + Ant Design (Tone Cam - Trắng)
│   └── figma-design/     # File Tokens, Guide & HTML Wireframe Mockup
├── database/             # MongoDB Mongoose Schemas & Bộ Seed Data
├── backend/              # Node.js + Express + Socket.io + MQTT Client & ACK Handler
├── mqtt/                 # Cấu hình Mosquitto Broker & Trình giả lập ESP32 Telemetry/ACK
├── hardware/             # Sơ đồ GPIO & Firmware ESP32 Arduino C++
└── docs/                 # Tài liệu đặc tả kỹ thuật, timestamp.md, hướng dẫn customize & vấn đáp
```

---

## 🚀 5 Màn Hình Tương Ứng 5 Use Cases Chuẩn

1. **UC01 - Authentication & Profile:** Trang Đăng nhập (`LoginPage.jsx`) và Trang Hồ sơ sinh viên (`ProfilePage.jsx`) tích hợp 4 liên kết trọng tâm: *GitHub, Figma, Swagger, Báo cáo PDF*.
2. **UC02 - Realtime Telemetry:** Dashboard hiển thị 3 Thẻ chỉ số cảm biến (Nhiệt độ, Độ ẩm, Ánh sáng) kèm Biểu đồ **AreaChart Gradient** tự động reload mỗi 5 giây độc lập.
3. **UC03 - Sensor Data Query:** Tra cứu dữ liệu đo đạc với bộ lọc thời gian đa mức độ chính xác (**Variable Time Range Filter** theo đặc tả `timestamp.md`: Day $\rightarrow$ Hour $\rightarrow$ Minute $\rightarrow$ Second) kèm phân trang Ant Design Table.
4. **UC04 - Device Control:** Bảng điều khiển `DevicePanel` điều khiển Relay qua MQTT. **Đèn (`LAMP_01`)** đã kết nối phần cứng, switch có loading chờ ACK; **Quạt (`FAN_01`)** ở trạng thái *Chưa kết nối* (Switch disabled) sẵn sàng cho kịch bản module mở rộng.
5. **UC05 - Action History:** Nhật ký lịch sử điều khiển chi tiết, ghi nhận thời gian gửi lệnh, thời gian nhận phản hồi, độ trễ `latency_ms` và trạng thái `SUCCESS/TIMEOUT/FAILED`.

---

## ⚡ Hướng Dẫn Khởi Chạy Nhanh

### 1. Chạy Giao Diện Frontend (Có thể chạy ngay với Mock Data):
```bash
cd frontend
npm install
npm run dev
```
Truy cập: `http://localhost:3000` (Đăng nhập mặc định: `admin / admin123`).

### 2. Chạy Backend & Cơ Sở Dữ Liệu:
```bash
# Nạp dữ liệu mẫu
cd database
npm install && npm run seed

# Khởi chạy Backend Server
cd ../backend
npm install && npm start
```

### 3. Chạy Giả Lập ESP32 (Khi chưa có mạch thật):
```bash
cd mqtt/mock-simulator
npm install && npm run all
```
*(Nếu dùng mạch thật: Mở file `hardware/firmware/iot_ptit_firmware/config.h` điền WiFi + IP rồi nạp code vào ESP32).*
