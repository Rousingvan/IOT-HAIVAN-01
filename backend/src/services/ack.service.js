import { ActionHistory } from '../models/ActionHistory.model.js';
import { Device } from '../models/Device.model.js';

// Map lưu các yêu cầu đang chờ phản hồi từ ESP32: requestId -> { resolve, reject, timer, commandInfo, historyId }
const pendingCommands = new Map();

export const ackService = {
  /**
   * Đăng ký lệnh chờ ACK từ ESP32 (Tạo ngay bản ghi LOADING, quá 5000ms không phản hồi thì chuyển sang FAILED)
   */
  registerCommand: async (requestId, commandInfo, timeoutMs = 5000, io = null) => {
    const cmdTime = new Date(commandInfo.commandTime || Date.now());
    let historyDoc = null;

    // 1. Tạo ngay bản ghi ở trạng thái LOADING khi người dùng bấm BẬT/TẮT
    try {
      historyDoc = await ActionHistory.create({
        device_code: commandInfo.fullDeviceCode || commandInfo.deviceCode,
        device_name: commandInfo.deviceName,
        action: commandInfo.action,
        command_time: cmdTime,
        status: 'LOADING',
      });

      if (io) {
        io.emit('action_history_updated', historyDoc);
      }
    } catch (e) {
      console.warn('Lỗi tạo ActionHistory LOADING:', e.message);
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(async () => {
        // Quá 5000ms không nhận được ACK -> Cập nhật từ LOADING sang FAILED
        pendingCommands.delete(requestId);

        try {
          const now = new Date();
          if (historyDoc && historyDoc._id) {
            const updatedHistory = await ActionHistory.findByIdAndUpdate(
              historyDoc._id,
              {
                response_time: now,
                latency_ms: timeoutMs,
                status: 'FAILED',
              },
              { new: true }
            );
            if (io && updatedHistory) {
              io.emit('action_history_updated', updatedHistory);
            }
          } else {
            const createdFailed = await ActionHistory.create({
              device_code: commandInfo.fullDeviceCode || commandInfo.deviceCode,
              device_name: commandInfo.deviceName,
              action: commandInfo.action,
              command_time: cmdTime,
              response_time: now,
              latency_ms: timeoutMs,
              status: 'FAILED',
            });
            if (io && createdFailed) {
              io.emit('action_history_updated', createdFailed);
            }
          }
        } catch (e) {
          console.warn('Lỗi cập nhật ActionHistory sang FAILED sau 5000ms:', e.message);
        }

        reject(
          new Error(
            `Không thể kết nối tới mạch ESP32! Quá ${timeoutMs}ms không nhận được phản hồi. Trạng thái đã chuyển sang THẤT BẠI.`
          )
        );
      }, timeoutMs);

      pendingCommands.set(requestId, {
        resolve,
        reject,
        timer,
        commandInfo,
        historyId: historyDoc?._id,
      });
    });
  },

  /**
   * Xử lý khi nhận được gói tin ACK từ topic esp32/device/ack trong vòng 5000ms
   */
  handleAckMessage: async (ackData, io) => {
    const { requestId, deviceCode, status, currentState } = ackData;
    if (!requestId || !pendingCommands.has(requestId)) {
      return;
    }

    const { resolve, timer, commandInfo, historyId } = pendingCommands.get(requestId);
    clearTimeout(timer);
    pendingCommands.delete(requestId);

    const now = new Date();
    const cmdTime = new Date(commandInfo.commandTime);
    const latency = Math.max(1, now.getTime() - cmdTime.getTime());

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

      const savedCode = updatedDevice
        ? updatedDevice.device_code
        : commandInfo.fullDeviceCode || deviceCode;

      const finalStatus = status === 'SUCCESS' ? 'SUCCESS' : 'FAILED';

      // 2. Cập nhật bản ghi LOADING sang SUCCESS (hoặc FAILED)
      let updatedHistory = null;
      if (historyId) {
        updatedHistory = await ActionHistory.findByIdAndUpdate(
          historyId,
          {
            device_code: savedCode,
            response_time: now,
            latency_ms: latency,
            status: finalStatus,
          },
          { new: true }
        );
      } else {
        updatedHistory = await ActionHistory.create({
          device_code: savedCode,
          device_name: commandInfo.deviceName,
          action: commandInfo.action,
          command_time: cmdTime,
          response_time: now,
          latency_ms: latency,
          status: finalStatus,
        });
      }

      // 3. Bắn WebSocket báo cho Frontend cập nhật UI
      if (io && updatedDevice) {
        io.emit('device_state_changed', updatedDevice);
      }
      if (io && updatedHistory) {
        io.emit('action_history_updated', updatedHistory);
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
