import { TOPICS, initMQTT } from '../config/mqtt.js';
import { SensorData } from '../models/SensorData.model.js';
import { RandomSensorData } from '../models/RandomSensorData.model.js';
import { buildRandomSensorPoint } from '../utils/randomSensor.js';
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

    // 2. Nhận dữ liệu 3 cảm biến ngẫu nhiên (Đề 3)
    else if (topic === TOPICS.RANDOM_SENSORS) {
      try {
        const point = buildRandomSensorPoint(data);
        if (data.mode) {
          point.mode = data.mode;
        }

        const saved = await RandomSensorData.create(point);
        console.log(`🎲 [RandomSensors] S1: ${point.s1}/11 (${point.alert_s1 ? 'ALERT' : 'OK'}) | S2: ${point.s2}/101 (${point.alert_s2 ? 'ALERT' : 'OK'}) | S3: ${point.s3}/1001 (${point.alert_s3 ? 'ALERT' : 'OK'})`);

        if (socketIo) {
          socketIo.emit('random_sensors', {
            id: saved._id,
            ...point,
            measured_at: point.measured_at.toISOString(),
          });
        }
      } catch (err) {
        console.warn('⚠️ Lỗi lưu RandomSensorData:', err.message);
      }
    }

    // 3. Nhận gói tin ACK từ ESP32
    else if (topic === TOPICS.DEVICE_ACK) {
      await ackService.handleAckMessage(data, socketIo);
    }
  });

  return mqttClient;
};

/**
 * Gửi lệnh test thủ công 3 cảm biến ngẫu nhiên xuống ESP32
 * @param {object} param0 { s1, s2, s3, mode }
 */
export const sendRandomSensorsCommand = async ({ s1, s2, s3, mode = 'MANUAL' }) => {
  if (!mqttClient || !mqttClient.connected) {
    throw new Error('MQTT Broker chưa kết nối. Không thể gửi lệnh tới ESP32.');
  }

  const payload = {
    mode,
    s1: s1 !== undefined ? Number(s1) : undefined,
    s2: s2 !== undefined ? Number(s2) : undefined,
    s3: s3 !== undefined ? Number(s3) : undefined,
    timestamp: new Date().toISOString(),
  };

  mqttClient.publish(TOPICS.RANDOM_SENSORS_SET, JSON.stringify(payload));
  console.log(`📤 Đã gửi lệnh kiểm thử [${TOPICS.RANDOM_SENSORS_SET}]:`, payload);
  return { success: true, payload };
};

export const sendDeviceCommand = async (deviceCode, deviceName, action, fullDeviceCode) => {
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

  // Đăng ký chờ ACK phản hồi trong vòng 5000ms
  return await ackService.registerCommand(
    requestId,
    {
      deviceCode,
      fullDeviceCode: fullDeviceCode || deviceCode,
      deviceName,
      action,
      commandTime: new Date(),
    },
    5000,
    socketIo
  );
};
