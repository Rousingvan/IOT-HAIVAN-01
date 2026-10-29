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
    // Tìm kiếm linh hoạt: khớp chính xác, hoặc có tiền tố P201_, hoặc khớp đuôi (không phân biệt hoa/thường)
    const device = await Device.findOne({
      $or: [
        { device_code: deviceCode },
        { device_code: `P201_${deviceCode}` },
        { device_code: { $regex: new RegExp(`${deviceCode}$`, 'i') } },
      ],
    });

    if (!device) {
      return res.status(404).json({ message: `Không tìm thấy thiết bị có mã ${deviceCode}` });
    }

    // Kiểm tra kết nối phần cứng (Module mở rộng)
    if (!device.is_connected) {
      return res.status(400).json({
        message: `Thiết bị ${device.device_name} (${device.device_code}) chưa được kết nối phần cứng. Đây là module mở rộng dự phòng.`,
      });
    }

    // Chuẩn hóa mã gửi xuống MQTT: Firmware ESP32 so khớp với "LAMP_01", "LAMP_02"
    const hardwareCode = device.device_code.replace(/^P\d+_/, '');

    // Gửi lệnh qua MQTT và chờ phản hồi ACK trong 5 giây
    const result = await sendDeviceCommand(hardwareCode, device.device_name, action, device.device_code);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
