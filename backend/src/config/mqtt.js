import mqtt from 'mqtt';

/**
 * CẤU HÌNH KẾT NỐI MQTT BROKER
 * - Khi chạy Local: Dùng Mosquitto Docker (mqtt://localhost:1883)
 * - Khi đem đi thi phòng Lab PTIT: Đổi sang IP mạng LAN máy tính của bạn (VD: mqtt://192.168.1.10:1883)
 * - Hoặc dùng Broker đám mây miễn phí: mqtt://broker.hivemq.com:1883 hoặc broker.emqx.io
 */
const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://localhost:18883';
const CLIENT_ID = process.env.MQTT_CLIENT_ID || `backend_server_${Math.random().toString(16).slice(2, 8)}`;
const MQTT_USERNAME = process.env.MQTT_USERNAME || undefined;
const MQTT_PASSWORD = process.env.MQTT_PASSWORD || undefined;

export const TOPICS = {
  TELEMETRY: 'esp32/telemetry',       // ESP32 gửi dữ liệu cảm biến định kỳ
  DEVICE_COMMAND: 'esp32/device/command', // Backend gửi lệnh Bật/Tắt tới ESP32
  DEVICE_ACK: 'esp32/device/ack',     // ESP32 gửi gói tin xác nhận thực thi
  STATUS: 'esp32/status',             // Trạng thái sống (LWT / Online / Offline)
  RANDOM_SENSORS: 'esp32/random-sensors',     // ESP32 gửi dữ liệu 3 cảm biến ngẫu nhiên (Đề 3)
  RANDOM_SENSORS_SET: 'esp32/random-sensors/set', // Backend gửi lệnh test thủ công xuống ESP32
};

export const initMQTT = (onMessageReceived) => {
  console.log(`🔄 Đang kết nối tới MQTT Broker: ${MQTT_BROKER_URL}...`);
  const connectOptions = {
    clientId: CLIENT_ID,
    clean: true,
    reconnectPeriod: 3000,
    connectTimeout: 5000,
  };

  if (MQTT_USERNAME) {
    connectOptions.username = MQTT_USERNAME;
    connectOptions.password = MQTT_PASSWORD;
  }

  const client = mqtt.connect(MQTT_BROKER_URL, connectOptions);

  client.on('connect', () => {
    console.log('✅ MQTT Client đã kết nối Broker thành công!');
    // Subscribe các topic cần lắng nghe
    client.subscribe([TOPICS.TELEMETRY, TOPICS.DEVICE_ACK, TOPICS.STATUS, TOPICS.RANDOM_SENSORS], (err) => {
      if (err) console.error('❌ Lỗi subscribe MQTT topics:', err);
      else console.log('📡 Đã subscribe các topic: Telemetry, Device ACK, Status, Random Sensors.');
    });
  });

  client.on('message', (topic, payload) => {
    try {
      const data = JSON.parse(payload.toString());
      if (onMessageReceived) onMessageReceived(topic, data);
    } catch {
      console.warn(`⚠️ Nhận MQTT message không phải JSON tại [${topic}]:`, payload.toString());
    }
  });

  client.on('error', (err) => {
    console.warn('⚠️ Lỗi kết nối MQTT Client:', err.message);
  });

  return client;
};
