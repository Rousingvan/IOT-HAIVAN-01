# 2.6. MQTT TOPICS & KIẾN TRÚC TRUYỀN THÔNG HỆ THỐNG IOT PTIT

> Chi tiết đặc tả kỹ thuật đầy đủ: Xem tại [2.6_MQTT_topics.md](./2.6_MQTT_topics.md)

---

## 1. BẢNG TỔNG HỢP CÁC MQTT TOPICS ĐÃ ĐỐI SOÁT CHÍNH XÁC VỚI CODEBASE

| Topic Chuẩn Hóa | Topic Triển Khai Thực Tế | Bên Gửi (Pub) | Bên Nhận (Sub) | QoS | Retain | Tần Suất / Kích Hoạt | Vai Trò & Mục Đích Nghiệp Vụ |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| `device/{deviceId}/telemetry` | `esp32/telemetry` | **ESP32** | **Backend** | 0 / 1 | `false` | Định kỳ **3 - 5s** (`TELEMETRY_INTERVAL`) | **Sensor data:** Đẩy dữ liệu đo Nhiệt độ (°C), Độ ẩm (%), Cường độ sáng (Lux) về Backend để lưu CSDL MongoDB (`sensor_data`) và phát realtime lên UI qua Socket.io. |
| `device/{deviceId}/command` | `esp32/device/command` | **Backend** | **ESP32** | 1 | `false` | Khi người dùng click công tắc trên Web | **ON/OFF command:** Hạ lệnh điều khiển Bật (`ON`) / Tắt (`OFF`) Relay từ Web UI xuống ESP32 kèm mã `requestId` duy nhất; khởi động bộ đếm Timeout 5000ms. |
| `device/{deviceId}/ack` | `esp32/device/ack` | **ESP32** | **Backend** | 1 | `false` | Ngay sau khi ESP32 kích hoạt chân Relay | **Command ACK:** Phản hồi xác nhận phần cứng thực thi thành công, hủy Timeout 5s, tính độ trễ mạng `latency_ms`, lưu vào `action_histories` và chốt trạng thái Switch trên UI. |
| `device/{deviceId}/status` | `esp32/status` | **ESP32 / Broker LWT** | **Backend** | 1 | `true` | Khi ESP32 kết nối / mất kết nối (LWT) | **Heartbeat & LWT:** Quản lý trạng thái sống (`ONLINE` / `OFFLINE`) của vi điều khiển. |

---

## 2. TÓM TẮT CƠ CHẾ GIAO TIẾP KHÉP KÍN 3 BƯỚC

1. **Thu thập dữ liệu (Telemetry Loop):**
   $$\text{ESP32 (Sensors)} \xrightarrow{\text{MQTT Telemetry}} \text{Backend} \xrightarrow{} \text{MongoDB} \xrightarrow{\text{Socket.io}} \text{React Dashboard (AreaChart 5s)}$$
2. **Hạ lệnh điều khiển (Command Loop):**
   $$\text{User Click} \xrightarrow{\text{HTTP POST}} \text{Backend (Tạo requestId, bật Timer 5s)} \xrightarrow{\text{MQTT Command (QoS 1)}} \text{ESP32 (Kích GPIO 26 Relay)}$$
3. **Xác nhận phản hồi & Đo độ trễ (ACK Loop):**
   $$\text{ESP32 (Relay ON)} \xrightarrow{\text{MQTT ACK}} \text{Backend (Hủy Timer 5s, tính Latency, lưu DB)} \xrightarrow{\text{Socket.io}} \text{React UI (Chốt Switch ON, tắt Loading)}$$

> Toàn bộ sơ đồ Mermaid, Payload JSON Schema chi tiết và cơ chế xử lý Timeout xem tại [2.6_MQTT_topics.md](./2.6_MQTT_topics.md).
