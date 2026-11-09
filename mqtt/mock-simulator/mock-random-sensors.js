import mqtt from 'mqtt';

const BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://localhost:18883';
const RANDOM_TOPIC = 'esp32/random-sensors';
const SET_TOPIC = 'esp32/random-sensors/set';
const USERNAME = process.env.MQTT_USERNAME || 'esp32_device';
const PASSWORD = process.env.MQTT_PASSWORD || 'ptit2026';

console.log(`🚀 Khởi động Trình Giả Lập 3 Cảm Biến Ngẫu Nhiên (Đề 3) tới: ${BROKER_URL}...`);
const client = mqtt.connect(BROKER_URL, {
  clientId: 'mock_esp32_random_sensors_generator',
  username: USERNAME,
  password: PASSWORD,
});

let isManualMode = false;
let currentS1 = 5;
let currentS2 = 45;
let currentS3 = 450;

client.on('connect', () => {
  console.log(`✅ Mock ESP32 Random Sensors đã kết nối Broker!`);
  
  // Lắng nghe topic set giá trị thủ công
  client.subscribe(SET_TOPIC, (err) => {
    if (err) console.error('❌ Lỗi subscribe SET topic:', err.message);
    else console.log(`👂 Đang lắng nghe lệnh kiểm thử tại: ${SET_TOPIC}`);
  });

  // Bắn dữ liệu định kỳ mỗi 2 giây
  let count = 0;
  setInterval(() => {
    count++;
    if (!isManualMode) {
      // Random lấy cả 2 đầu: 0..11, 0..101, 0..1001
      currentS1 = Math.floor(Math.random() * 12);
      currentS2 = Math.floor(Math.random() * 102);
      currentS3 = Math.floor(Math.random() * 1002);
    }

    const alert1 = currentS1 > 5.5;
    const alert2 = currentS2 > 50.5;
    const alert3 = currentS3 > 500.5;

    const payload = {
      deviceId: 'MOCK_ESP32_RANDOM_NODE_01',
      s1: currentS1,
      s2: currentS2,
      s3: currentS3,
      alert1,
      alert2,
      alert3,
      mode: isManualMode ? 'MANUAL' : 'AUTO',
      timestamp: new Date().toISOString(),
    };

    client.publish(RANDOM_TOPIC, JSON.stringify(payload));
    console.log(
      `🎲 [#${count}] S1: ${currentS1}/11 (${alert1 ? '🚨ALERT' : 'OK'}) | S2: ${currentS2}/101 (${alert2 ? '🚨ALERT' : 'OK'}) | S3: ${currentS3}/1001 (${alert3 ? '🚨ALERT' : 'OK'}) [${isManualMode ? 'MANUAL' : 'AUTO'}]`
    );
  }, 2000);
});

client.on('message', (topic, message) => {
  if (topic === SET_TOPIC) {
    try {
      const cmd = JSON.parse(message.toString());
      console.log('📥 [Nhận lệnh Test Thủ Công]:', cmd);

      if (cmd.mode === 'AUTO') {
        isManualMode = false;
        console.log('🔄 Đã chuyển về chế độ RANDOM TỰ ĐỘNG.');
      } else {
        isManualMode = true;
        if (cmd.s1 !== undefined) currentS1 = Math.max(0, Math.min(11, Number(cmd.s1)));
        if (cmd.s2 !== undefined) currentS2 = Math.max(0, Math.min(101, Number(cmd.s2)));
        if (cmd.s3 !== undefined) currentS3 = Math.max(0, Math.min(1001, Number(cmd.s3)));
        console.log(`🛠️ Đã chốt giá trị thủ công: S1=${currentS1}, S2=${currentS2}, S3=${currentS3}`);
      }
    } catch (e) {
      console.error('❌ Lỗi parse lệnh test:', e.message);
    }
  }
});

client.on('error', (err) => {
  console.error('❌ Lỗi kết nối MQTT Mock Random Sensors:', err.message);
});

