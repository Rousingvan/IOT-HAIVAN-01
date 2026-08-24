# HARDWARE & FIRMWARE ESP32 - IOT PTIT 2026

## 1. Sơ Đồ Chân GPIO
Xem chi tiết tại [hardware/schematics/pin-mapping.md](./schematics/pin-mapping.md).
- **`GPIO 4`:** DHT22 (Nhiệt độ, Độ ẩm)
- **`GPIO 34`:** LDR (Ánh sáng)
- **`GPIO 26`:** Relay 1 - Đèn (`LAMP_01`) [Đã Lắp Đặt Thực Tế]
- **`GPIO 27`:** Relay 2 - Quạt (`FAN_01`) [Cổng Mở Rộng Dự Phòng]

## 2. Hướng Dẫn Nạp Code Arduino IDE
1. Cài đặt board **ESP32** trong Arduino IDE (`Board Manager`).
2. Cài đặt các thư viện:
   - `PubSubClient`
   - `ArduinoJson` (v6 hoặc v7)
   - `DHT sensor library`
3. Mở file [iot_ptit_firmware.ino](./firmware/iot_ptit_firmware/iot_ptit_firmware.ino), chỉnh lại thông tin WiFi và IP Broker trong `config.h`.
4. Chọn đúng Board `ESP32 Dev Module`, chọn đúng Cổng COM và bấm **Upload**!
