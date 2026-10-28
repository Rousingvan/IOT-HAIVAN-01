/**
 * =========================================================================
 * ĐỒ ÁN MÔN HỌC: LẬP TRÌNH THIẾT BỊ IOT - PTIT 2026
 * FIRMWARE ĐIỀU KHIỂN & GIÁM SÁT THỜI GIAN THỰC (ESP32)
 * =========================================================================
 * Thư viện yêu cầu cài đặt trong Arduino IDE:
 * 1. PubSubClient (by Nick O'Leary)
 * 2. ArduinoJson (by Benoit Blanchon - version 6.x hoặc 7.x)
 * 3. DHT sensor library (by Adafruit)
 * 4. Adafruit Unified Sensor
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "DHT.h"
#include "config.h"

// Khởi tạo đối tượng cảm biến và giao tiếp mạng
DHT dht(PIN_DHT22, DHTTYPE);
WiFiClient espClient;
PubSubClient mqttClient(espClient);

unsigned long lastTelemetryTime = 0;
const unsigned long TELEMETRY_INTERVAL = 2000; // Chu kỳ gửi dữ liệu cảm biến: 2 giây

// Cấu hình cảnh báo nhấp nháy chu kỳ 2s trên chân D21
int lightAlertThreshold = 600;        // Ngưỡng ánh sáng X (mặc định 600 Lux, đồng bộ từ Web)
bool isLightAlerting = false;         // Cờ báo vượt ngưỡng ánh sáng
unsigned long lastBlinkTime = 0;      // Mốc thời gian chớp tắt LED
bool alertLedState = false;           // Trạng thái nháy

// Trạng thái công tắc thủ công của Đèn 4 (chân GPIO 21) từ Web
bool lamp04ManualState = false;

// =========================================================================
// HÀM KẾT NỐI WIFI
// =========================================================================
void setupWiFi() {
  delay(100);
  Serial.println();
  Serial.print("📡 Đang kết nối tới WiFi: ");
  Serial.println(WIFI_SSID);

  // Xóa kết nối dở dang để tránh lỗi "wifi:sta is connecting, cannot set config"
  WiFi.disconnect(true);
  delay(500);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int retry = 0;
  while (WiFi.status() != WL_CONNECTED && retry < 30) {
    delay(500);
    Serial.print(".");
    retry++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi đã kết nối thành công!");
    Serial.print("📍 Địa chỉ IP ESP32: ");
    Serial.println(WiFi.localIP());
    digitalWrite(PIN_LED_STATUS, LOW);
    digitalWrite(PIN_LED_ALERT, LOW); // Mặc định TẮT đèn chân 21
  } else {
    Serial.println("\n⚠️ Không thể kết nối WiFi. Hãy kiểm tra lại SSID/Password/2.4GHz.");
    WiFi.disconnect(true);
    delay(1000);
  }
}

// =========================================================================
// HÀM XỬ LÝ NHẬN LỆNH ĐIỀU KHIỂN & PHẢN HỒI GÓI TIN ACK
// =========================================================================
void onMqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.print("📥 Nhận thông điệp tại topic [");
  Serial.print(topic);
  Serial.println("]");

  // Parse JSON từ payload
  StaticJsonDocument<256> doc;
  DeserializationError error = deserializeJson(doc, payload, length);

  if (error) {
    Serial.print("❌ Lỗi parse JSON: ");
    Serial.println(error.f_str());
    return;
  }

  // 1. Nếu là gói tin đồng bộ ngưỡng cảnh báo ánh sáng X từ Web gửi xuống
  if (doc.containsKey("threshold")) {
    lightAlertThreshold = doc["threshold"].as<int>();
    Serial.printf("⚙️ Đã cập nhật ngưỡng cảnh báo ánh sáng X = %d Lux từ Web!\n", lightAlertThreshold);
    return;
  }

  const char* requestId = doc["requestId"];
  const char* deviceCode = doc["deviceCode"];
  const char* action = doc["action"];

  if (!deviceCode || !action) return;

  Serial.printf("⚡ Lệnh nhận: RequestId=%s, Device=%s, Action=%s\n", requestId ? requestId : "N/A", deviceCode, action);

  // Tìm kiếm thiết bị trong bảng cấu hình Relay (Đèn 1: 18, Đèn 2: 19, Đèn 3: 22, Đèn 4: 21)
  bool found = false;
  for (int i = 0; i < NUM_DEVICES; i++) {
    if (strcmp(DEVICES[i].deviceCode, deviceCode) == 0) {
      found = true;

      bool isOn = (strcmp(action, "ON") == 0);

      // Nếu điều khiển LAMP_04 (chân GPIO 21): lưu lại trạng thái thủ công
      if (strcmp(deviceCode, "LAMP_04") == 0) {
        lamp04ManualState = isOn;
        // Nếu không có cảnh báo vượt ngưỡng thì áp dụng ngay trạng thái thủ công
        if (!isLightAlerting) {
          int pinVal = DEVICES[i].activeLow ? (isOn ? LOW : HIGH) : (isOn ? HIGH : LOW);
          digitalWrite(DEVICES[i].pin, pinVal);
        }
      } else {
        // Các đèn 1, 2, 3 điều khiển bình thường
        int pinVal = DEVICES[i].activeLow ? (isOn ? LOW : HIGH) : (isOn ? HIGH : LOW);
        digitalWrite(DEVICES[i].pin, pinVal);
      }

      Serial.printf("🔌 Đã gạt %s (GPIO %d) sang mức %s\n", deviceCode, DEVICES[i].pin, isOn ? "ON" : "OFF");

      // 2. Lập tức phản hồi gói tin ACK tới Server
      StaticJsonDocument<256> ackDoc;
      ackDoc["requestId"] = requestId;
      ackDoc["deviceCode"] = deviceCode;
      ackDoc["status"] = "SUCCESS";
      ackDoc["currentState"] = action;
      ackDoc["timestamp"] = millis();

      char ackBuffer[256];
      serializeJson(ackDoc, ackBuffer);
      mqttClient.publish(TOPIC_DEVICE_ACK, ackBuffer);

      Serial.print("📤 Đã bắn gói tin ACK: ");
      Serial.println(ackBuffer);
      break;
    }
  }

  if (!found) {
    Serial.printf("⚠️ Không tìm thấy thiết bị có mã: %s\n", deviceCode);
  }
}

// =========================================================================
// HÀM KẾT NỐI MQTT BROKER
// =========================================================================
void reconnectMQTT() {
  while (!mqttClient.connected()) {
    Serial.print("🔄 Đang kết nối tới MQTT Broker (");
    Serial.print(MQTT_SERVER);
    Serial.print(")...");

    // Last Will and Testament (LWT) kèm xác thực Username/Password
    if (mqttClient.connect(MQTT_CLIENT_ID, MQTT_USER, MQTT_PASS, TOPIC_STATUS, 1, true, "{\"status\":\"OFFLINE\"}")) {
      Serial.println(" ✅ Đã kết nối MQTT Broker (Authenticated)!");

      // Báo trạng thái Online
      mqttClient.publish(TOPIC_STATUS, "{\"status\":\"ONLINE\"}", true);

      // Lắng nghe topic điều khiển
      mqttClient.subscribe(TOPIC_DEVICE_COMMAND);
      Serial.printf("👂 Đã subscribe topic: %s\n", TOPIC_DEVICE_COMMAND);
    } else {
      Serial.print(" ❌ Thất bại, rc=");
      Serial.print(mqttClient.state());
      Serial.println(". Thử lại sau 3 giây...");
      delay(3000);
    }
  }
}

// =========================================================================
// SETUP
// =========================================================================
void setup() {
  Serial.begin(115200);

  // Cấu hình chân LED trạng thái (D2)
  pinMode(PIN_LED_STATUS, OUTPUT);
  digitalWrite(PIN_LED_STATUS, LOW);

  // Cấu hình chân LED Cảnh báo / Đèn 4 (chân GPIO 21)
  pinMode(PIN_LED_ALERT, OUTPUT);
  digitalWrite(PIN_LED_ALERT, LOW);

  // Khởi tạo chân GPIO cho các Relay đèn điều khiển (Đèn 1: 18, Đèn 2: 19, Đèn 3: 22, Đèn 4: 21)
  for (int i = 0; i < NUM_DEVICES; i++) {
    pinMode(DEVICES[i].pin, OUTPUT);
    digitalWrite(DEVICES[i].pin, DEVICES[i].activeLow ? HIGH : LOW);
  }

  // Khởi động cảm biến DHT22
  dht.begin();
  Serial.println("🌡️ Cảm biến DHT22 đã sẵn sàng.");

  // Kết nối WiFi & cấu hình MQTT Client
  setupWiFi();
  mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
  mqttClient.setCallback(onMqttCallback);
}

// =========================================================================
// MAIN LOOP
// =========================================================================
void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    setupWiFi();
  }

  if (!mqttClient.connected()) {
    reconnectMQTT();
  }
  mqttClient.loop();

  unsigned long now = millis();

  // ĐỀ 1: LOGIC ĐÈN CHÂN 21 (ĐÈN CẢNH BÁO + ĐÈN 4):
  // 1. Khi ánh sáng vượt ngưỡng X: Ưu tiên chế độ cảnh báo -> Nhấp nháy 2s (1s BẬT / 1s TẮT) liên tục
  if (isLightAlerting) {
    if (now - lastBlinkTime >= 1000) { // Chu kỳ 2000ms (1000ms ON / 1000ms OFF)
      lastBlinkTime = now;
      alertLedState = !alertLedState;
      digitalWrite(PIN_LED_ALERT, alertLedState ? HIGH : LOW);
    }
  } else {
    // 2. Khi KHÔNG có cảnh báo (ánh sáng <= X): Hoạt động như Đèn 4 theo công tắc gạt thủ công từ Web
    if (lamp04ManualState) {
      if (digitalRead(PIN_LED_ALERT) != HIGH) {
        digitalWrite(PIN_LED_ALERT, HIGH);
      }
    } else {
      if (digitalRead(PIN_LED_ALERT) != LOW) {
        digitalWrite(PIN_LED_ALERT, LOW);
      }
    }
  }

  // Đọc và gửi dữ liệu cảm biến định kỳ
  if (now - lastTelemetryTime >= TELEMETRY_INTERVAL) {
    lastTelemetryTime = now;

    // Đọc nhiệt độ và độ ẩm từ DHT22
    float temp = dht.readTemperature();
    float humid = dht.readHumidity();

    // Đọc ánh sáng từ LDR (Chân Analog ADC1: 0 - 4095)
    int rawLdr = analogRead(PIN_LDR);
    // Chuyển đổi sang đơn vị Lux tương đối (0 - 1000 Lux)
    int lightLux = map(rawLdr, 0, 4095, 1000, 0);

    // Kiểm tra vượt ngưỡng để cập nhật cờ isLightAlerting
    bool prevAlerting = isLightAlerting;
    isLightAlerting = (lightLux > lightAlertThreshold);

    // Nếu vừa mới thoát khỏi cảnh báo -> Trả lại trạng thái công tắc thủ công của Đèn 4
    if (prevAlerting && !isLightAlerting) {
      alertLedState = false;
      digitalWrite(PIN_LED_ALERT, lamp04ManualState ? HIGH : LOW);
      Serial.printf("☀️ Ánh sáng %d Lux <= Ngưỡng %d Lux -> Trả Đèn 4 về trạng thái thủ công: %s\n", 
                    lightLux, lightAlertThreshold, lamp04ManualState ? "ON" : "OFF");
    } else if (!prevAlerting && isLightAlerting) {
      lastBlinkTime = now;
      alertLedState = true;
      digitalWrite(PIN_LED_ALERT, HIGH);
      Serial.printf("🚨 Ánh sáng %d Lux > Ngưỡng %d Lux -> Kích hoạt chế độ CẢNH BÁO NHẤP NHÁY 2s (GPIO 21)\n", 
                    lightLux, lightAlertThreshold);
    }

    // Kiểm tra tính hợp lệ của số liệu DHT22
    if (isnan(temp) || isnan(humid)) {
      Serial.println("⚠️ Lỗi đọc cảm biến DHT22!");
      temp = 28.0;
      humid = 65.0;
    }

    // Đóng gói JSON gửi vào topic esp32/telemetry
    StaticJsonDocument<256> telemetryDoc;
    telemetryDoc["deviceId"] = MQTT_CLIENT_ID;
    telemetryDoc["temperature"] = round(temp * 10) / 10.0;
    telemetryDoc["humidity"] = round(humid * 10) / 10.0;
    telemetryDoc["light"] = lightLux;
    telemetryDoc["timestamp"] = millis();

    char telemetryBuffer[256];
    serializeJson(telemetryDoc, telemetryBuffer);
    mqttClient.publish(TOPIC_TELEMETRY, telemetryBuffer);

    Serial.print("📡 [Telemetry gửi]: ");
    Serial.println(telemetryBuffer);
  }
}
