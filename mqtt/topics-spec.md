# ĐẶC TẢ CHI TIẾT CÁC TOPIC MQTT - IOT PTIT 2026

Hệ thống giao tiếp giữa ESP32 và Server thông qua 4 Topic MQTT chính với payload JSON chuẩn hóa:

---

## 1. Topic: `esp32/telemetry` (ESP32 $\rightarrow$ Backend Server)
* **Mục đích:** ESP32 gửi chuỗi dữ liệu đo đạc cảm biến định kỳ mỗi 2-5 giây.
* **QoS:** `0` hoặc `1`.
* **Payload JSON Format:**
```json
{
  "deviceId": "ESP32_DEV_KIT_V1",
  "temperature": 28.5,
  "humidity": 68.2,
  "light": 520,
  "timestamp": "2026-08-17T12:00:00.000Z"
}
```

---

## 2. Topic: `esp32/device/command` (Backend Server $\rightarrow$ ESP32)
* **Mục đích:** Backend gửi lệnh yêu cầu bật hoặc tắt Relay tới vi điều khiển.
* **QoS:** `1` (Đảm bảo lệnh đến nơi).
* **Payload JSON Format:**
```json
{
  "requestId": "REQ_1723891234567_a1b2c",
  "deviceCode": "LAMP_01",
  "action": "ON",
  "timestamp": "2026-08-17T12:00:00.000Z"
}
```

---

## 3. Topic: `esp32/device/ack` (ESP32 $\rightarrow$ Backend Server)
* **Mục đích:** Sau khi gạt chân GPIO Relay thành công, ESP32 phản hồi ngay gói tin xác nhận kèm `requestId` gốc.
* **QoS:** `1`.
* **Payload JSON Format:**
```json
{
  "requestId": "REQ_1723891234567_a1b2c",
  "deviceCode": "LAMP_01",
  "status": "SUCCESS",
  "currentState": "ON",
  "timestamp": "2026-08-17T12:00:00.320Z"
}
```

---

## 4. Topic: `esp32/status` (ESP32 $\leftrightarrow$ Backend Server)
* **Mục đích:** Giám sát trạng thái Online/Offline của thiết bị bằng MQTT Last Will and Testament (LWT).
* **Payload JSON Format:**
```json
{
  "deviceId": "ESP32_DEV_KIT_V1",
  "status": "ONLINE",
  "ipAddress": "192.168.1.105",
  "rssi": -58
}
```
*(Khi mất nguồn đột ngột, Broker tự động publish `{"status": "OFFLINE"}`).*
