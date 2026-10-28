import { TOPICS, initMQTT } from '../config/mqtt.js';
import { SensorData } from '../models/SensorData.model.js';
import { ackService } from './ack.service.js';

let mqttClient = null;
let socketIo = null;

export const startMQTTService = (io) => {
  socketIo = io;
  mqttClient = initMQTT(async (topic, data) => {
    // 1. Nhận dữ liệu đo cảm biến định kỳ
    if (topic === TOPICS.TELEMETRY) {
      const { temperature, humidity, light, timestamp } = data;
      // Nếu timestamp từ ESP32 là millis() (số nhỏ), dùng new Date() thời gian thực của Server
      const measuredAt = (timestamp && Number(timestamp) > 1000000000000) 
        ? new Date(Number(timestamp)) 
        : new Date();

      const point = {
        temperature: Number(temperature),
        humidity: Number(humidity),
        light: Number(light),
        measured_at: measuredAt,
      };

      try {
        await SensorData.create(point);
        console.log(`💾 [MongoDB] Đã lưu: ${point.temperature}°C | ${point.humidity}% | ${point.light} Lux lúc ${measuredAt.toLocaleTimeString()}`);
      } catch (err) {
        console.warn('⚠️ Không thể ghi SensorData vào DB:', err.message);
      }

      // Phát realtime qua Socket.io
      if (socketIo) {
        socketIo.emit('telemetry', point);
      }
    }

    // 2. Nhận gói tin ACK từ ESP32
    else if (topic === TOPICS.DEVICE_ACK) {
      await ackService.handleAckMessage(data, socketIo);
    }
  });

  return mqttClient;
};

export const sendDeviceCommand = async (deviceCode, deviceName, action) => {
  if (!mqttClient || !mqttClient.connected) {
    throw new Error('MQTT Broker chưa kết nối. Không thể gửi lệnh tới phần cứng.');
  }

  const requestId = `REQ_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const payload = {
    requestId,
    deviceCode,
    action,
    timestamp: new Date().toISOString(),
  };

  // Publish lệnh tới topic esp32/device/command
  mqttClient.publish(TOPICS.DEVICE_COMMAND, JSON.stringify(payload));
  console.log(`📤 Đã gửi MQTT command [${TOPICS.DEVICE_COMMAND}]:`, payload);

  // Đăng ký chờ ACK phản hồi trong vòng 5s
  return await ackService.registerCommand(
    requestId,
    {
      deviceCode,
      deviceName,
      action,
      commandTime: new Date(),
    },
    5000
  );
};
