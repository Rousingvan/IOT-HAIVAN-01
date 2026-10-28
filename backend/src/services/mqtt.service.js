import { TOPICS, initMQTT } from '../config/mqtt.js';
import { SensorData } from '../models/SensorData.model.js';
import { ActionHistory } from '../models/ActionHistory.model.js';
import { ackService } from './ack.service.js';

let mqttClient = null;
let socketIo = null;

// Cấu hình ngưỡng cảnh báo độ bụi Y (Đề 2, mặc định 0.70 mg/m3)
let currentDustThreshold = 0.70;
let lastAlertTime = 0;

export const getDustThreshold = () => currentDustThreshold;

export const setDustThreshold = (val) => {
  const num = Number(val);
  if (!isNaN(num) && num >= 0) {
    currentDustThreshold = Number(num.toFixed(2));
    console.log(`🌫️ [Alert Config] Đã cập nhật ngưỡng độ bụi Y = ${currentDustThreshold} mg/m3`);
    if (socketIo) {
      socketIo.emit('dust_threshold_changed', { threshold: currentDustThreshold });
    }
    // Gửi đồng bộ xuống ESP32 qua topic esp32/device/command
    if (mqttClient && mqttClient.connected) {
      mqttClient.publish(
        TOPICS.DEVICE_COMMAND,
        JSON.stringify({ dustThreshold: currentDustThreshold })
      );
      console.log(`📤 Đã đồng bộ ngưỡng bụi Y = ${currentDustThreshold} mg/m3 xuống ESP32`);
    }
  }
  return currentDustThreshold;
};

export const startMQTTService = (io) => {
  socketIo = io;
  mqttClient = initMQTT(async (topic, data) => {
    // 1. Nhận dữ liệu đo cảm biến định kỳ
    if (topic === TOPICS.TELEMETRY) {
      const { temperature, humidity, light, dust, timestamp } = data;
      // Nếu timestamp từ ESP32 là millis() (số nhỏ), dùng new Date() thời gian thực của Server
      const measuredAt = (timestamp && Number(timestamp) > 1000000000000) 
        ? new Date(Number(timestamp)) 
        : new Date();

      // ĐỀ 2: Đảm bảo trường dust được làm tròn 2 chữ số thập phân (0.00 -> 1.00)
      const dustVal = (dust !== undefined && !isNaN(Number(dust)))
        ? Number(Number(dust).toFixed(2))
        : 0;

      const point = {
        temperature: Number(temperature),
        humidity: Number(humidity),
        light: Number(light),
        dust: dustVal,
        measured_at: measuredAt,
      };

      try {
        await SensorData.create(point);
        console.log(`💾 [MongoDB] Đã lưu: ${point.temperature}°C | ${point.humidity}% | ${point.light} Lux | Bụi: ${point.dust} mg/m3 lúc ${measuredAt.toLocaleTimeString()}`);
      } catch (err) {
        console.warn('⚠️ Không thể ghi SensorData vào DB:', err.message);
      }

      // Phát realtime qua Socket.io
      if (socketIo) {
        socketIo.emit('telemetry', point);
      }

      // ĐỀ 2: Kiểm tra cảnh báo Độ Bụi >= 0.7 (hoặc >= currentDustThreshold)
      if (point.dust >= currentDustThreshold) {
        const nowMs = Date.now();
        // Cooldown 5s giữa các lần ghi log ActionHistory để tránh spam DB
        if (nowMs - lastAlertTime >= 5000) {
          lastAlertTime = nowMs;
          try {
            await ActionHistory.create({
              device_code: 'DUST_ALERT',
              device_name: 'Cảnh Báo Độ Bụi Vượt Ngưỡng',
              action: 'ALERT',
              command_time: measuredAt,
              response_time: measuredAt,
              latency_ms: 10,
              status: 'SUCCESS',
              user_id: 'SYSTEM_ALERT',
            });
            console.log(`🚨 [CẢNH BÁO BỤI] Độ bụi ${point.dust} mg/m3 >= Ngưỡng ${currentDustThreshold} -> Đã lưu ActionHistory DUST_ALERT`);
          } catch (e) {
            console.warn('Lỗi ghi ActionHistory cho DUST_ALERT:', e.message);
          }
        }

        // Bắn Socket cảnh báo tức thì về client
        if (socketIo) {
          socketIo.emit('dust_alert', {
            dust: point.dust,
            threshold: currentDustThreshold,
            time: measuredAt,
          });
        }
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
