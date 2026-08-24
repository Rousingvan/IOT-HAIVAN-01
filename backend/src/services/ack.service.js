import { ActionHistory } from '../models/ActionHistory.model.js';
import { Device } from '../models/Device.model.js';

// Map lưu các yêu cầu đang chờ phản hồi từ ESP32: requestId -> { resolve, reject, timer, commandInfo }
const pendingCommands = new Map();

export const ackService = {
  /**
   * Đăng ký lệnh chờ ACK từ ESP32
   */
  registerCommand: (requestId, commandInfo, timeoutMs = 5000) => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(async () => {
        // Quá hạn không nhận được ACK -> TIMEOUT
        pendingCommands.delete(requestId);

        try {
          // Ghi nhận lịch sử thất bại do Timeout
          await ActionHistory.create({
            device_code: commandInfo.deviceCode,
            device_name: commandInfo.deviceName,
            action: commandInfo.action,
            command_time: commandInfo.commandTime,
            status: 'TIMEOUT',
          });
        } catch (e) {
          console.warn('Lỗi ghi ActionHistory timeout:', e.message);
        }

        reject(new Error(`Timeout: Không nhận được gói tin ACK từ ESP32 sau ${timeoutMs / 1000}s`));
      }, timeoutMs);

      pendingCommands.set(requestId, { resolve, reject, timer, commandInfo });
    });
  },

  /**
   * Xử lý khi nhận được gói tin ACK từ topic esp32/device/ack
   */
  handleAckMessage: async (ackData, io) => {
    const { requestId, deviceCode, status, currentState } = ackData;
    if (!requestId || !pendingCommands.has(requestId)) {
      return;
    }

    const { resolve, timer, commandInfo } = pendingCommands.get(requestId);
    clearTimeout(timer);
    pendingCommands.delete(requestId);

    const now = new Date();
    const cmdTime = new Date(commandInfo.commandTime);
    const latency = now.getTime() - cmdTime.getTime();

    // 1. Cập nhật trạng thái thiết bị trong DB
    try {
      await Device.findOneAndUpdate(
        { device_code: deviceCode },
        { current_state: currentState || commandInfo.action }
      );

      // 2. Lưu lịch sử ActionHistory thành công
      await ActionHistory.create({
        device_code: deviceCode,
        device_name: commandInfo.deviceName,
        action: commandInfo.action,
        command_time: cmdTime,
        response_time: now,
        latency_ms: latency,
        status: status === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
      });
    } catch (err) {
      console.warn('Lỗi cập nhật DB khi nhận ACK:', err.message);
    }

    // 3. Bắn WebSocket báo cho Frontend cập nhật UI
    if (io) {
      io.emit('device_state_changed', {
        device_code: deviceCode,
        current_state: currentState || commandInfo.action,
      });
    }

    resolve({
      success: true,
      requestId,
      deviceCode,
      latency,
      message: 'ESP32 đã thực thi và phản hồi ACK thành công!',
    });
  },
};
