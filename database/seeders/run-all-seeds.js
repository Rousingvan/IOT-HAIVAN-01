import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from '../schemas/User.schema.js';
import { Sensor } from '../schemas/Sensor.schema.js';
import { SensorData } from '../schemas/SensorData.schema.js';
import { Device } from '../schemas/Device.schema.js';
import { ActionHistory } from '../schemas/ActionHistory.schema.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/iot_ptit_db';

async function seedDatabase() {
  try {
    console.log('🔄 Đang kết nối tới MongoDB:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Kết nối MongoDB thành công!');

    // 1. Xóa dữ liệu cũ
    await Promise.all([
      User.deleteMany({}),
      Sensor.deleteMany({}),
      SensorData.deleteMany({}),
      Device.deleteMany({}),
      ActionHistory.deleteMany({}),
    ]);
    console.log('🧹 Đã dọn dẹp các collection cũ.');

    // 2. Tạo tài khoản Admin
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await User.create({
      username: 'admin',
      password: hashedPassword,
      fullName: 'Lương Hải Vân',
      studentCode: 'B23DCAT332',
      className: 'D23CQAT02-B',
      role: 'ADMIN',
    });
    console.log('👤 Đã tạo User Admin: admin / admin123');

    // 3. Tạo 3 Cảm Biến
    await Sensor.insertMany([
      { sensor_code: 'TEMP_01', sensor_name: 'Cảm biến Nhiệt độ', sensor_type: 'TEMP', unit: '°C', pin_location: 'GPIO 4' },
      { sensor_code: 'HUMID_01', sensor_name: 'Cảm biến Độ ẩm', sensor_type: 'HUMID', unit: '%', pin_location: 'GPIO 4' },
      { sensor_code: 'LIGHT_01', sensor_name: 'Cảm biến Ánh sáng', sensor_type: 'LIGHT', unit: 'Lux', pin_location: 'GPIO 34 (ADC1)' },
    ]);
    console.log('🌡️ Đã tạo 3 Cảm biến (Nhiệt độ, Độ ẩm, Ánh sáng).');

    // 4. Tạo Danh mục Thiết bị: Đèn (Đã kết nối) & Quạt (Chưa kết nối)
    await Device.insertMany([
      {
        device_code: 'P201_LAMP_01',
        device_name: 'Đèn Chiếu Sáng 01',
        device_type: 'LAMP',
        pin_relay: 26,
        is_connected: true,    // Đèn đã lắp thực tế
        current_state: 'ON',
      },
      {
        device_code: 'P201_LAMP_02',
        device_name: 'Đèn Chiếu Sáng 02',
        device_type: 'LAMP',
        pin_relay: 25,
        is_connected: true,
        current_state: 'OFF',
      },
      {
        device_code: 'P201_FAN_01',
        device_name: 'Quạt Làm Mát 01',
        device_type: 'FAN',
        pin_relay: 27,
        is_connected: false,   // Quạt là cổng dự phòng mở rộng
        current_state: 'OFF',
      },
      {
        device_code: 'P201_FAN_02',
        device_name: 'Quạt Làm Mát 02',
        device_type: 'FAN',
        pin_relay: 14,
        is_connected: false,   // Quạt là cổng dự phòng mở rộng
        current_state: 'OFF',
      },
    ]);
    console.log('💡 Đã tạo Thiết bị: Đèn (Đã kết nối) và Quạt (Chưa kết nối).');

    // 5. Tạo 100 bản ghi dữ liệu cảm biến đo đạc
    const sensorRecords = [];
    const now = Date.now();
    for (let i = 0; i < 100; i++) {
      const measuredTime = new Date(now - (99 - i) * 5000); // Cách nhau 5 giây
      sensorRecords.push({
        temperature: +(25 + Math.sin(i / 6) * 7 + Math.random()).toFixed(1),
        humidity: +(60 + Math.cos(i / 5) * 15 + Math.random()).toFixed(1),
        light: Math.floor(400 + Math.sin(i / 4) * 300 + Math.random() * 50),
        measured_at: measuredTime,
      });
    }
    await SensorData.insertMany(sensorRecords);
    console.log('📈 Đã tạo 100 bản ghi SensorData.');

    // 6. Tạo 10 bản ghi lịch sử thao tác
    const actionRecords = [];
    for (let i = 1; i <= 10; i++) {
      const cmdTime = new Date(now - i * 1000 * 60 * 10);
      const latency = Math.floor(250 + Math.random() * 150);
      actionRecords.push({
        device_code: 'P201_LAMP_01',
        device_name: 'Đèn Chiếu Sáng 01',
        action: i % 2 === 0 ? 'ON' : 'OFF',
        command_time: cmdTime,
        response_time: new Date(cmdTime.getTime() + latency),
        latency_ms: latency,
        status: 'SUCCESS',
        user_id: 'admin',
      });
    }
    await ActionHistory.insertMany(actionRecords);
    console.log('📋 Đã tạo 10 bản ghi ActionHistory.');

    console.log('🎉 TOÀN BỘ DỮ LIỆU ĐÃ ĐƯỢC SEED THÀNH CÔNG!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi khi seed dữ liệu:', err);
    process.exit(1);
  }
}

seedDatabase();
