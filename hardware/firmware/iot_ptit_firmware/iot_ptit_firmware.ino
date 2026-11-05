/**
 * =========================================================================
 * ĐỒ ÁN MÔN HỌC: LẬP TRÌNH THIẾT BỊ IOT - PTIT 2026
 * FIRMWARE ĐIỀU KHIỂN & GIÁM SÁT THỜI GIAN THỰC (ESP32)
 * BỔ SUNG ĐỀ 3: 3 CẢM BIẾN NGẪU NHIÊN VÀ 3 LED CẢNH BÁO (> 50%)
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

// Quản lý chu kỳ gửi dữ liệu
unsigned long lastTelemetryTime = 0;
const unsigned long TELEMETRY_INTERVAL = 2000; // Chu kỳ gửi dữ liệu: 2 giây

// Quản lý 3 cảm biến ngẫu nhiên (Đề 3)
int currentS1 = 0;
int currentS2 = 0;
int currentS3 = 0;
bool alertS1 = false;
bool alertS2 = false;
bool alertS3 = false;
bool isManualMode = false;

// Quản lý nháy LED 500ms không chặn code (Non-blocking Blink)
unsigned long lastBlinkTime = 0;
bool ledBlinkState = false;

// =========================================================================
// HÀM KẾT NỐI WIFI
// =========================================================================
void setupWiFi() {
  delay(100);
  Serial.println();
  Serial.print("📡 Đang kết nối tới WiFi: ");
  Serial.println(WIFI_SSID);

  WiFi.disconnect(true);
  delay(500);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int retry = 0;
  while (WiFi.status() != WL_CONNECTED && retry < 30) {
    delay(500);
    Serial.print(".");
    digitalWrite(PIN_LED_STATUS, !digitalRead(PIN_LED_STATUS));
    retry++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi đã kết nối thành công!");
    Serial.print("📍 Địa chỉ IP ESP32: ");
    Serial.println(WiFi.localIP());
    digitalWrite(PIN_LED_STATUS, HIGH);
  } else {
    Serial.println("\n⚠️ Không thể kết nối WiFi. Hãy kiểm tra lại SSID/Password/2.4GHz.");
    WiFi.disconnect(true);
    delay(1000);
  }
}

// =========================================================================
// HÀM CẬP NHẬT TRẠNG THÁI NHÁY 3 LED CẢNH BÁO (Chu kỳ 500ms)
// =========================================================================
void updateAlertLeds() {
  unsigned long now = millis();
  if (now - lastBlinkTime >= ALERT_BLINK_MS) {
    lastBlinkTime = now;
    ledBlinkState = !ledBlinkState;
  }

  // LED 1 (Chân 25) - Cảm biến 1
  if (alertS1) {
    digitalWrite(PIN_ALERT_S1, ledBlinkState ? HIGH : LOW);
  } else {
    digitalWrite(PIN_ALERT_S1, LOW);
  }

  // LED 2 (Chân 26) - Cảm biến 2
  if (alertS2) {
    digitalWrite(PIN_ALERT_S2, ledBlinkState ? HIGH : LOW);
  } else {
    digitalWrite(PIN_ALERT_S2, LOW);
  }

  // LED 3 (Chân 27) - Cảm biến 3
  if (alertS3) {
    digitalWrite(PIN_ALERT_S3, ledBlinkState ? HIGH : LOW);
  } else {
    digitalWrite(PIN_ALERT_S3, LOW);
  }
}

// =========================================================================
// HÀM PHÁT GÓI TIN 3 CẢM BIẾN NGẪU NHIÊN LÊN MQTT
// =========================================================================
void publishRandomSensorsData() {
  StaticJsonDocument<256> doc;
  doc["deviceId"] = MQTT_CLIENT_ID;
  doc["s1"] = currentS1;
  doc["s2"] = currentS2;
  doc["s3"] = currentS3;
  doc["alert1"] = alertS1;
  doc["alert2"] = alertS2;
  doc["alert3"] = alertS3;
  doc["mode"] = isManualMode ? "MANUAL" : "AUTO";
  doc["timestamp"] = millis();

  char buffer[256];
  serializeJson(doc, buffer);
  mqttClient.publish(TOPIC_RANDOM_SENSORS, buffer);

  Serial.printf("🎲 [RandomSensors] S1=%d(%s) | S2=%d(%s) | S3=%d(%s) [%s]\n",
                currentS1, alertS1 ? "ALERT" : "SAFE",
                currentS2, alertS2 ? "ALERT" : "SAFE",
                currentS3, alertS3 ? "ALERT" : "SAFE",
                isManualMode ? "MANUAL" : "AUTO");
}

// =========================================================================
// HÀM XỬ LÝ NHẬN LỆNH ĐIỀU KHIỂN & LỆNH KIỂM THỬ THỦ CÔNG
// =========================================================================
void onMqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.print("📥 Nhận thông điệp tại topic [");
  Serial.print(topic);
  Serial.println("]");

  StaticJsonDocument<384> doc;
  DeserializationError error = deserializeJson(doc, payload, length);
  if (error) {
    Serial.print("❌ Lỗi parse JSON: ");
    Serial.println(error.f_str());
    return;
  }

  // 1. Lệnh điều khiển rơ-le / đèn thông thường
  if (strcmp(topic, TOPIC_DEVICE_COMMAND) == 0) {
    const char* requestId = doc["requestId"];
    const char* deviceCode = doc["deviceCode"];
    const char* action = doc["action"];

    Serial.printf("⚡ Lệnh nhận: RequestId=%s, Device=%s, Action=%s\n", requestId, deviceCode, action);

    bool found = false;
    for (int i = 0; i < NUM_DEVICES; i++) {
      if (strcmp(DEVICES[i].deviceCode, deviceCode) == 0) {
        found = true;
        bool isOn = (strcmp(action, "ON") == 0);
        int pinVal = DEVICES[i].activeLow ? (isOn ? LOW : HIGH) : (isOn ? HIGH : LOW);
        digitalWrite(DEVICES[i].pin, pinVal);

        Serial.printf("🔌 Đã gạt GPIO %d sang mức %s\n", DEVICES[i].pin, isOn ? "ON" : "OFF");

        StaticJsonDocument<256> ackDoc;
        ackDoc["requestId"] = requestId;
        ackDoc["deviceCode"] = deviceCode;
        ackDoc["status"] = "SUCCESS";
        ackDoc["currentState"] = action;
        ackDoc["timestamp"] = millis();

        char ackBuffer[256];
        serializeJson(ackDoc, ackBuffer);
        mqttClient.publish(TOPIC_DEVICE_ACK, ackBuffer);
        Serial.printf("📤 Đã bắn gói tin ACK: %s\n", ackBuffer);
        break;
      }
    }
    if (!found) {
      Serial.printf("⚠️ Không tìm thấy thiết bị có mã: %s\n", deviceCode);
    }
  }

  // 2. Lệnh kiểm thử thủ công 3 cảm biến ngẫu nhiên (Đề 3)
  else if (strcmp(topic, TOPIC_RANDOM_SENSORS_SET) == 0) {
    const char* mode = doc["mode"] | "MANUAL";
    if (strcmp(mode, "AUTO") == 0) {
      isManualMode = false;
      Serial.println("🔄 ESP32 chuyển về chế độ RANDOM TỰ ĐỘNG!");
    } else {
      isManualMode = true;
      if (doc.containsKey("s1")) currentS1 = constrain((int)doc["s1"], 0, S1_MAX);
      if (doc.containsKey("s2")) currentS2 = constrain((int)doc["s2"], 0, S2_MAX);
      if (doc.containsKey("s3")) currentS3 = constrain((int)doc["s3"], 0, S3_MAX);

      alertS1 = (currentS1 * 2 > S1_MAX);
      alertS2 = (currentS2 * 2 > S2_MAX);
      alertS3 = (currentS3 * 2 > S3_MAX);

      Serial.printf("🛠️ ESP32 nhận lệnh SET THỦ CÔNG: S1=%d, S2=%d, S3=%d\n", currentS1, currentS2, currentS3);
    }

    // Bắn lại trạng thái ngay lập tức
    publishRandomSensorsData();
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

    if (mqttClient.connect(MQTT_CLIENT_ID, MQTT_USER, MQTT_PASS, TOPIC_STATUS, 1, true, "{\"status\":\"OFFLINE\"}")) {
      Serial.println(" ✅ Đã kết nối MQTT Broker (Authenticated)!");

      mqttClient.publish(TOPIC_STATUS, "{\"status\":\"ONLINE\"}", true);

      // Subscribe topic điều khiển thiết bị
      mqttClient.subscribe(TOPIC_DEVICE_COMMAND);
      Serial.printf("👂 Đã subscribe: %s\n", TOPIC_DEVICE_COMMAND);

      // Subscribe topic nhận lệnh test thủ công (Đề 3)
      mqttClient.subscribe(TOPIC_RANDOM_SENSORS_SET);
      Serial.printf("👂 Đã subscribe: %s\n", TOPIC_RANDOM_SENSORS_SET);
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
  pinMode(PIN_LED_STATUS, OUTPUT);
  digitalWrite(PIN_LED_STATUS, LOW);

  // Khởi tạo 3 chân LED cảnh báo (Đề 3: D25, D26, D27)
  pinMode(PIN_ALERT_S1, OUTPUT);
  pinMode(PIN_ALERT_S2, OUTPUT);
  pinMode(PIN_ALERT_S3, OUTPUT);
  digitalWrite(PIN_ALERT_S1, LOW);
  digitalWrite(PIN_ALERT_S2, LOW);
  digitalWrite(PIN_ALERT_S3, LOW);

  // Khởi tạo chân GPIO cho các Relay
  for (int i = 0; i < NUM_DEVICES; i++) {
    pinMode(DEVICES[i].pin, OUTPUT);
    digitalWrite(DEVICES[i].pin, DEVICES[i].activeLow ? HIGH : LOW);
  }

  // Khởi tạo bộ sinh số ngẫu nhiên từ phần cứng ESP32
  randomSeed(esp_random());

  // Khởi động cảm biến DHT22
  dht.begin();
  Serial.println("🌡️ Cảm biến DHT22 đã sẵn sàng.");
  Serial.println("🚨 Hệ thống 3 LED cảnh báo (D25, D26, D27) đã sẵn sàng.");

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

  // Luôn cập nhật nháy LED 500ms không gián đoạn
  updateAlertLeds();

  // Chu kỳ gửi dữ liệu mỗi 2 giây
  unsigned long now = millis();
  if (now - lastTelemetryTime >= TELEMETRY_INTERVAL) {
    lastTelemetryTime = now;

    // 1. Đọc và gửi dữ liệu cảm biến môi trường DHT22 + LDR
    float temp = dht.readTemperature();
    float humid = dht.readHumidity();
    int rawLdr = analogRead(PIN_LDR);
    int lightLux = map(rawLdr, 0, 4095, 1000, 0);

    if (isnan(temp) || isnan(humid)) {
      temp = 28.0;
      humid = 65.0;
    }

    StaticJsonDocument<256> telemetryDoc;
    telemetryDoc["deviceId"] = MQTT_CLIENT_ID;
    telemetryDoc["temperature"] = round(temp * 10) / 10.0;
    telemetryDoc["humidity"] = round(humid * 10) / 10.0;
    telemetryDoc["light"] = lightLux;
    telemetryDoc["timestamp"] = millis();

    char telemetryBuffer[256];
    serializeJson(telemetryDoc, telemetryBuffer);
    mqttClient.publish(TOPIC_TELEMETRY, telemetryBuffer);

    // 2. Xử lý 3 cảm biến ngẫu nhiên (Đề 3)
    if (!isManualMode) {
      // Random lấy cả 2 đầu: 0..11, 0..101, 0..1001
      currentS1 = random(0, S1_MAX + 1);
      currentS2 = random(0, S2_MAX + 1);
      currentS3 = random(0, S3_MAX + 1);

      // Ngưỡng > 50%
      alertS1 = (currentS1 * 2 > S1_MAX);
      alertS2 = (currentS2 * 2 > S2_MAX);
      alertS3 = (currentS3 * 2 > S3_MAX);
    }

    // Bắn dữ liệu 3 cảm biến lên MQTT
    publishRandomSensorsData();
  }
}
