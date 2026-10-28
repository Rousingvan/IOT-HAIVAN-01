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

// Cấu hình cảnh báo nhấp nháy chu kỳ 2s trên chân D22 (PIN_LED_ALERT = GPIO 22)
int lightAlertThreshold = 600;        // Ngưỡng ánh sáng X (mặc định 600 Lux, đồng bộ từ Web)
bool isLightAlerting = false;         // Cờ báo vượt ngưỡng
unsigned long lastBlinkTime = 0;      // Mốc thời gian chớp tắt LED
bool alertLedState = false;           // Trạng thái chân LED nháy

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
    digitalWrite(PIN_LED_ALERT, LOW); // Mặc định TẮT đèn cảnh báo chân D22
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

  // Tìm kiếm thiết bị trong bảng cấu hình Relay
  bool found = false;
  for (int i = 0; i < NUM_DEVICES; i++) {
    if (strcmp(DEVICES[i].deviceCode, deviceCode) == 0) {
      found = true;

      // 1. Gạt chân GPIO Relay
      bool isOn = (strcmp(action, "ON") == 0);
      int pinVal = DEVICES[i].activeLow ? (isOn ? LOW : HIGH) : (isOn ? HIGH : LOW);
      digitalWrite(DEVICES[i].pin, pinVal);

      Serial.printf("🔌 Đã gạt GPIO %d sang mức %s\n", DEVICES[i].pin, isOn ? "ON" : "OFF");

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

  // Cấu hình chân LED trạng thái (D2) và LED cảnh báo (D22)
  pinMode(PIN_LED_STATUS, OUTPUT);
  digitalWrite(PIN_LED_STATUS, LOW);

  pinMode(PIN_LED_ALERT, OUTPUT);
  digitalWrite(PIN_LED_ALERT, LOW); // Mặc định ban đầu TẮT đèn cảnh báo chân D22

  // Khởi tạo chân GPIO cho 3 Relay điều khiển (18, 19, 21)
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

  // ĐỀ 1: Khi ánh sáng vượt ngưỡng X -> Nhấp nháy LED cảnh báo chân D22 liên tục chu kỳ 2s (1s BẬT / 1s TẮT)
  if (isLightAlerting) {
    if (now - lastBlinkTime >= 1000) { // Cứ 1000ms đổi trạng thái 1 lần = chu kỳ 2s (1000ms ON / 1000ms OFF)
      lastBlinkTime = now;
      alertLedState = !alertLedState;
      digitalWrite(PIN_LED_ALERT, alertLedState ? HIGH : LOW);
    }
  } else {
    // Khi KHÔNG cảnh báo (ánh sáng <= ngưỡng X) -> TẮT HẲN đèn cảnh báo chân D22
    if (alertLedState || digitalRead(PIN_LED_ALERT) == HIGH) {
      alertLedState = false;
      digitalWrite(PIN_LED_ALERT, LOW);
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

    // Nếu vừa mới thoát khỏi trạng thái cảnh báo -> Tắt ngay lập tức
    if (prevAlerting && !isLightAlerting) {
      alertLedState = false;
      digitalWrite(PIN_LED_ALERT, LOW);
      Serial.println("☀️ Ánh sáng đã về mức an toàn -> TẮT LED cảnh báo D22");
    } else if (!prevAlerting && isLightAlerting) {
      lastBlinkTime = now;
      alertLedState = true;
      digitalWrite(PIN_LED_ALERT, HIGH);
      Serial.println("🚨 Ánh sáng vượt ngưỡng -> BẬT chế độ nhấp nháy 2s LED D22");
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
