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
#define TOPIC_RANDOM_SENSORS "esp32/random-sensors"
#define TOPIC_RANDOM_SENSORS_SET "esp32/random-sensors/set"

// =========================================================================
// 3. CẤU HÌNH CHÂN GPIO
// =========================================================================
#define PIN_DHT22 4 // Chân cảm biến DHT22 (Nhiệt độ & Độ ẩm)
#define DHTTYPE DHT22
#define PIN_LDR 34       // Chân Analog ADC1 cảm biến Quang trở Ánh sáng
#define PIN_LED_STATUS 2 // LED onboard báo trạng thái kết nối

// Chân 3 LED cảnh báo cho 3 cảm biến ngẫu nhiên (Đề 3)
#define PIN_ALERT_S1 25  // LED cảnh báo Cảm biến 1 (0-11) - Chân D25
#define PIN_ALERT_S2 33  // LED cảnh báo Cảm biến 2 (0-101) - Chân D33
#define PIN_ALERT_S3 32  // LED cảnh báo Cảm biến 3 (0-1001) - Chân D32

// Cấu hình dải đo & tốc độ nháy
#define S1_MAX 11
#define S2_MAX 101
#define S3_MAX 1001
#define ALERT_BLINK_MS 500 // Tốc độ nháy 500ms theo yêu cầu Đề 3

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
// - LED_ONBOARD: Đèn LED trên bo ESP32 (GPIO 2)
const DeviceMapping DEVICES[] = {{"LAMP_01", 18, true, false},
                                 {"LAMP_02", 19, true, false},
                                 {"LAMP_03", 21, true, false},
                                 {"LED_ONBOARD", 2, true, false}};

const int NUM_DEVICES = sizeof(DEVICES) / sizeof(DEVICES[0]);

#endif
