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
          // Ghi nhận lịch sử thất bại do Timeout khi mất kết nối ESP32
          const now = new Date();
          const cmdTime = new Date(commandInfo.commandTime);
          await ActionHistory.create({
            device_code: commandInfo.deviceCode,
            device_name: commandInfo.deviceName,
            action: commandInfo.action,
            command_time: cmdTime,
            response_time: now,
            latency_ms: timeoutMs,
            status: 'FAILED', // Ghi rõ thất bại
          });
        } catch (e) {
          console.warn('Lỗi ghi ActionHistory timeout:', e.message);
        }

        reject(new Error(`Không thể kết nối tới mạch ESP32! Quá thời gian phản hồi (Timeout ${timeoutMs / 1000}s). Vui lòng kiểm tra nguồn điện hoặc kết nối mạng của ESP32.`));
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
      const updatedDevice = await Device.findOneAndUpdate(
        {
          $or: [
            { device_code: deviceCode },
            { device_code: `P201_${deviceCode}` },
            { device_code: { $regex: new RegExp(`${deviceCode}$`, 'i') } },
          ],
        },
        { current_state: currentState || commandInfo.action },
        { new: true }
      );

      const savedCode = updatedDevice ? updatedDevice.device_code : deviceCode;

      // 2. Lưu lịch sử ActionHistory thành công
      await ActionHistory.create({
        device_code: savedCode,
        device_name: commandInfo.deviceName,
        action: commandInfo.action,
        command_time: cmdTime,
        response_time: now,
        latency_ms: latency,
        status: status === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
      });

      // 3. Bắn WebSocket báo cho Frontend cập nhật UI
      if (io && updatedDevice) {
        io.emit('device_state_changed', updatedDevice);
      }
    } catch (err) {
      console.warn('Lỗi cập nhật DB khi nhận ACK:', err.message);
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
