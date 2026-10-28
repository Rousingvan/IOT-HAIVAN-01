import mqtt from 'mqtt';

const BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://localhost:18883';
const TELEMETRY_TOPIC = 'esp32/telemetry';
const USERNAME = process.env.MQTT_USERNAME || 'esp32_device';
const PASSWORD = process.env.MQTT_PASSWORD || 'ptit2026';

console.log(`🚀 Khởi động Trình Giả Lập ESP32 Telemetry tới: ${BROKER_URL}...`);
const client = mqtt.connect(BROKER_URL, {
  clientId: 'mock_esp32_telemetry_generator',
  username: USERNAME,
  password: PASSWORD,
});

client.on('connect', () => {
  console.log(`✅ Mock ESP32 đã kết nối Broker! Bắt đầu phát dữ liệu cảm biến (Nhiệt độ, Độ ẩm, Ánh sáng, Độ Bụi) mỗi 3 giây...`);

  let count = 0;
  setInterval(() => {
    count++;
    // Sinh số liệu ngẫu nhiên thực tế
    const temp = +(26 + Math.sin(count / 5) * 5 + (Math.random() * 0.8)).toFixed(1);
    const humid = +(65 + Math.cos(count / 4) * 12 + (Math.random() * 1.5)).toFixed(1);
    const light = Math.floor(480 + Math.sin(count / 3) * 220 + Math.random() * 30);
    // ĐỀ 2: Hardware random 1 cảm biến Dust (100 đơn vị: 0.00 -> 1.00 mg/m3)
    const dust = Number((Math.floor(Math.random() * 101) / 100).toFixed(2));

    const payload = {
      deviceId: 'ESP32_DEV_KIT_V1',
      temperature: temp,
      humidity: humid,
      light: light,
      dust: dust,
      timestamp: new Date().toISOString(),
    };

    client.publish(TELEMETRY_TOPIC, JSON.stringify(payload));
    console.log(`📡 [Mock Telemetry #${count}] -> ${TELEMETRY_TOPIC}:`, payload);
  }, 3000);
});

client.on('error', (err) => {
  console.error('❌ Lỗi kết nối MQTT Mock Telemetry:', err.message);
});
