import mqtt from 'mqtt';

const BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://localhost:18883';
const COMMAND_TOPIC = 'esp32/device/command';
const ACK_TOPIC = 'esp32/device/ack';
const USERNAME = process.env.MQTT_USERNAME || 'esp32_device';
const PASSWORD = process.env.MQTT_PASSWORD || 'ptit2026';

console.log(`🚀 Khởi động Trình Giả Lập ESP32 ACK Responder tới: ${BROKER_URL}...`);
const client = mqtt.connect(BROKER_URL, {
  clientId: 'mock_esp32_ack_responder',
  username: USERNAME,
  password: PASSWORD,
});

// Trạng thái thiết bị giả lập trong bộ nhớ ESP32
const mockHardwareState = {
  LAMP_01: 'OFF',
  FAN_01: 'OFF',
};

client.on('connect', () => {
  console.log('✅ Mock ESP32 ACK Responder đã kết nối Broker!');
  client.subscribe(COMMAND_TOPIC, (err) => {
    if (err) console.error('❌ Không thể subscribe topic command:', err);
    else console.log(`👂 Đang lắng nghe lệnh điều khiển tại topic: ${COMMAND_TOPIC}`);
  });
});

client.on('message', (topic, message) => {
  if (topic === COMMAND_TOPIC) {
    try {
      const command = JSON.parse(message.toString());
      console.log('📥 [ESP32 Nhận Lệnh]:', command);

      const { requestId, deviceCode, action } = command;

      // Giả lập độ trễ điều khiển phần cứng thực tế (300ms)
      setTimeout(() => {
        // Cập nhật trạng thái phần cứng giả lập
        mockHardwareState[deviceCode] = action;

        const ackPayload = {
          requestId,
          deviceCode,
          status: 'SUCCESS',
          currentState: action,
          timestamp: new Date().toISOString(),
        };

        client.publish(ACK_TOPIC, JSON.stringify(ackPayload));
        console.log(`📤 [ESP32 Bắn ACK] -> ${ACK_TOPIC}:`, ackPayload);
      }, 300);
    } catch (err) {
      console.error('❌ Lỗi xử lý lệnh MQTT:', err.message);
    }
  }
});

client.on('error', (err) => {
  console.error('❌ Lỗi kết nối MQTT Mock ACK:', err.message);
});
