import { Device } from '../models/Device.model.js';
import { sendDeviceCommand } from '../services/mqtt.service.js';

export const getDevices = async (req, res) => {
  try {
    const devices = await Device.find({ is_active: true });
    return res.json(devices);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const toggleDevice = async (req, res) => {
  const { deviceCode } = req.params;
  const { action } = req.body;

  if (!action || !['ON', 'OFF'].includes(action)) {
    return res.status(400).json({ message: 'Hành động không hợp lệ (Chỉ chấp nhận ON hoặc OFF)' });
  }

  try {
    const device = await Device.findOne({ device_code: deviceCode });
    if (!device) {
      return res.status(404).json({ message: `Không tìm thấy thiết bị có mã ${deviceCode}` });
    }

    // Kiểm tra kết nối phần cứng (Module mở rộng)
    if (!device.is_connected) {
      return res.status(400).json({
        message: `Thiết bị ${device.device_name} (${device.device_code}) chưa được kết nối phần cứng. Đây là module mở rộng dự phòng.`,
      });
    }

    // Gửi lệnh qua MQTT và chờ phản hồi ACK trong 5 giây
    const result = await sendDeviceCommand(device.device_code, device.device_name, action);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
