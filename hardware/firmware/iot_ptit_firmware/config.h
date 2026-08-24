#ifndef CONFIG_H
#define CONFIG_H

// =========================================================================
// 1. CẤU HÌNH KẾT NỐI WIFI PHÒNG LAB / NHÀ RIÊNG
// =========================================================================
#define WIFI_SSID     "PTIT_STUDENT_WIFI"    // <-- Thay tên WiFi của bạn tại đây
#define WIFI_PASSWORD "ptit@2026"             // <-- Thay mật khẩu WiFi

// =========================================================================
// 2. CẤU HÌNH MQTT BROKER
// =========================================================================
// Nhập địa chỉ IP máy tính đang chạy Backend / Mosquitto trong mạng LAN
#define MQTT_SERVER   "192.168.1.100"        // <-- Thay IP máy tính của bạn (Dùng lệnh 'ipconfig' trên Windows)
#define MQTT_PORT     1883
#define MQTT_CLIENT_ID "ESP32_IOT_PTIT_NODE_01"

// Các Topic giao tiếp MQTT
#define TOPIC_TELEMETRY       "esp32/telemetry"
#define TOPIC_DEVICE_COMMAND  "esp32/device/command"
#define TOPIC_DEVICE_ACK      "esp32/device/ack"
#define TOPIC_STATUS          "esp32/status"

// =========================================================================
// 3. CẤU HÌNH CHÂN GPIO
// =========================================================================
#define PIN_DHT22     4     // Chân cảm biến DHT22 (Nhiệt độ & Độ ẩm)
#define DHTTYPE       DHT22
#define PIN_LDR       34    // Chân Analog ADC1 cảm biến Quang trở Ánh sáng
#define PIN_LED_STATUS 2    // LED onboard báo trạng thái kết nối

// Định nghĩa mảng cấu hình thiết bị Relay (Kiến trúc mở rộng Plug-and-Play)
struct DeviceMapping {
  const char* deviceCode;
  int pin;
  bool isConnected;
  bool activeLow; // Relay kích mức thấp (LOW = ON) hay kích mức cao (HIGH = ON)
};

// Khai báo danh sách thiết bị:
// - LAMP_01: Đèn đã lắp đặt thực tế trên chân GPIO 26
// - FAN_01:  Quạt ở cổng mở rộng dự phòng trên chân GPIO 27
const DeviceMapping DEVICES[] = {
  { "LAMP_01", 26, true,  true },
  { "FAN_01",  27, false, true }
};

const int NUM_DEVICES = sizeof(DEVICES) / sizeof(DEVICES[0]);

#endif
