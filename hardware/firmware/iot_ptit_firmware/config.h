#ifndef CONFIG_H
#define CONFIG_H

// =========================================================================
// 1. CẤU HÌNH KẾT NỐI WIFI PHÒNG LAB / NHÀ RIÊNG
// =========================================================================
#define WIFI_SSID "Rous"         // <-- Thay tên WiFi của bạn tại đây
#define WIFI_PASSWORD "88888888" // <-- Thay mật khẩu WiFi

// =========================================================================
// 2. CẤU HÌNH MQTT BROKER
// =========================================================================
// Nhập địa chỉ IP máy tính đang chạy Backend / Mosquitto trong mạng LAN
#define MQTT_SERVER "10.204.124.222"
#define MQTT_PORT 18883
#define MQTT_CLIENT_ID "ESP32_IOT_PTIT_NODE_01"
#define MQTT_USER "esp32_device"
#define MQTT_PASS "ptit2026"

// Các Topic giao tiếp MQTT
#define TOPIC_TELEMETRY "esp32/telemetry"
#define TOPIC_DEVICE_COMMAND "esp32/device/command"
#define TOPIC_DEVICE_ACK "esp32/device/ack"
#define TOPIC_STATUS "esp32/status"

// =========================================================================
// 3. CẤU HÌNH CHÂN GPIO
// =========================================================================
#define PIN_DHT22 4 // Chân cảm biến DHT22 (Nhiệt độ & Độ ẩm)
#define DHTTYPE DHT22
#define PIN_LDR 34       // Chân Analog ADC1 cảm biến Quang trở Ánh sáng
#define PIN_LED_STATUS 2 // LED onboard báo trạng thái kết nối

// Định nghĩa mảng cấu hình thiết bị Relay (Kiến trúc mở rộng Plug-and-Play)
struct DeviceMapping {
  const char *deviceCode;
  int pin;
  bool isConnected;
  bool activeLow; // Relay kích mức thấp (LOW = ON) hay kích mức cao (HIGH = ON)
};

// Khai báo danh sách thiết bị:
// - LAMP_01: Đèn LED 1 trên chân GPIO 18
// - LAMP_02: Đèn LED 2 trên chân GPIO 19
// - LAMP_03: Đèn LED 3 trên chân GPIO 21
// - LAMP_04: Đèn LED 4 trên chân GPIO 22 (Đề 1)
// - LED_ONBOARD: Đèn LED trên bo ESP32 (GPIO 2)
const DeviceMapping DEVICES[] = {{"LAMP_01", 18, true, false},
                                 {"LAMP_02", 19, true, false},
                                 {"LAMP_03", 21, true, false},
                                 {"LAMP_04", 22, true, false},
                                 {"LED_ONBOARD", 2, true, false}};

const int NUM_DEVICES = sizeof(DEVICES) / sizeof(DEVICES[0]);

#endif
