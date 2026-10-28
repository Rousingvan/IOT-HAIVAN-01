/**
 * ==============================================================================
 * SCRIPT: run-all-seeds.js
 * MỤC ĐÍCH:
 * - Khởi tạo toàn bộ dữ liệu mẫu (Seeder) cho Database MongoDB của dự án IoT PTIT.
 * - Đảm bảo hệ thống có đầy đủ dữ liệu demo ngay sau khi cài đặt hoặc reset:
 *     1. Dọn dẹp sạch sẽ các collection cũ để tránh trùng lặp dữ liệu.
 *     2. Tạo tài khoản Quản trị viên (Admin) mặc định với mật khẩu đã mã hóa Bcrypt.
 *     3. Tạo danh mục 3 cảm biến chuẩn (Nhiệt độ, Độ ẩm, Ánh sáng) kèm vị trí chân GPIO.
 *     4. Tạo danh mục các thiết bị điều khiển (3 Đèn LED gắn Relay GPIO 26, 25, 33).
 *     5. Tạo 100 bản ghi dữ liệu cảm biến lịch sử đo đạc định kỳ (chu kỳ 5 giây/lần).
 *     6. Tạo 10 bản ghi lịch sử bật/tắt thiết bị (ActionHistory) kèm độ trễ phản hồi (ms).
 *
 * CÁCH CHẠY:
 * - Chạy lệnh: node database/seeders/run-all-seeds.js
 * - Hoặc: npm run seed
 * ==============================================================================
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Import các Mongoose Schema định nghĩa cấu trúc bảng trong CSDL
import { User } from '../schemas/User.schema.js';
import { Sensor } from '../schemas/Sensor.schema.js';
import { SensorData } from '../schemas/SensorData.schema.js';
import { Device } from '../schemas/Device.schema.js';
import { ActionHistory } from '../schemas/ActionHistory.schema.js';

// Tải các biến môi trường từ file .env (nếu có)
dotenv.config();

// Chuỗi kết nối MongoDB (Mặc định kết nối CSDL cục bộ port 27017)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/iot_ptit_db';

/**
 * Hàm chính thực thi toàn bộ quy trình nạp dữ liệu mẫu
 */
async function seedDatabase() {
  try {
    console.log('Đang kết nối tới MongoDB:', MONGODB_URI);
    // Thiết lập kết nối bất đồng bộ tới máy chủ MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Kết nối MongoDB thành công!');

    // ============================================================================
    // BƯỚC 1: DỌN DẸP TOÀN BỘ DỮ LIỆU CŨ
    // Sử dụng Promise.all để xóa đồng thời trên 5 collection, tối ưu thời gian chạy
    // ============================================================================
    await Promise.all([
      User.deleteMany({}),          // Xóa toàn bộ người dùng cũ
      Sensor.deleteMany({}),        // Xóa danh mục cảm biến cũ
      SensorData.deleteMany({}),    // Xóa toàn bộ số đo cảm biến cũ
      Device.deleteMany({}),        // Xóa danh mục thiết bị cũ
      ActionHistory.deleteMany({}), // Xóa toàn bộ lịch sử thao tác cũ
    ]);
    console.log('🧹 Đã dọn dẹp các collection cũ.');

    // ============================================================================
    // BƯỚC 2: TẠO TÀI KHOẢN QUẢN TRỊ VIÊN (ADMIN) MẶC ĐỊNH
    // Mật khẩu 'admin123' được băm bằng thuật toán Bcrypt với salt round = 10
    // ============================================================================
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await User.create({
      username: 'admin',
      password: hashedPassword,
      fullName: 'Lương Hải Vân',
      studentCode: 'B23DCAT332',
      className: 'D23CQAT02-B',
      role: 'ADMIN', // Quyền Quản trị viên: Toàn quyền bật/tắt thiết bị và quản lý hệ thống
    });
    console.log('👤 Đã tạo User Admin: admin / admin123');

    // ============================================================================
    // BƯỚC 3: TẠO DANH MỤC 3 CẢM BIẾN CHÍNH
    // Khai báo mã cảm biến, tên hiển thị, đơn vị và chân cắm phần cứng trên ESP32
    // ============================================================================
    await Sensor.insertMany([
      {
        sensor_code: 'TEMP_01',
        sensor_name: 'Cảm biến Nhiệt độ',
        sensor_type: 'TEMP',
        unit: '°C',
        pin_location: 'GPIO 4', // Cảm biến DHT22 đọc qua chân digital GPIO 4
      },
      {
        sensor_code: 'HUMID_01',
        sensor_name: 'Cảm biến Độ ẩm',
        sensor_type: 'HUMID',
        unit: '%',
        pin_location: 'GPIO 4', // Chung chân GPIO 4 với cảm biến nhiệt độ DHT22
      },
      {
        sensor_code: 'LIGHT_01',
        sensor_name: 'Cảm biến Ánh sáng',
        sensor_type: 'LIGHT',
        unit: 'Lux',
        pin_location: 'GPIO 34 (ADC1)', // Quang trở (LDR) đọc qua chân Analog ADC1
      },
    ]);
    console.log('Đã tạo 3 Cảm biến (Nhiệt độ, Độ ẩm, Ánh sáng).');

    // ============================================================================
    // BƯỚC 4: TẠO DANH MỤC THIẾT BỊ ĐIỀU KHIỂN (ĐÈN CHIẾU SÁNG & QUẠT)
    // Quy chuẩn mã thiết bị: {Mã_Phòng}_{Loại_Thiết_Bị}_{Số_Thứ_Tự} (VD: P201_LAMP_01)
    // ============================================================================
    await Device.insertMany([
      {
        device_code: 'P201_LAMP_01',
        device_name: 'Đèn Chiếu Sáng 01',
        device_type: 'LAMP',
        pin_relay: 26,         // Nối vào Relay kích hoạt chân GPIO 26
        is_connected: true,    // Đã đấu nối phần cứng thực tế
        current_state: 'ON',   // Trạng thái ban đầu: Đang BẬT
      },
      {
        device_code: 'P201_LAMP_02',
        device_name: 'Đèn Chiếu Sáng 02',
        device_type: 'LAMP',
        pin_relay: 25,         // Nối vào Relay kích hoạt chân GPIO 25
        is_connected: true,    // Đã đấu nối phần cứng thực tế
        current_state: 'OFF',  // Trạng thái ban đầu: Đang TẮT
      },
      {
        device_code: 'P201_LAMP_03',
        device_name: 'Đèn Chiếu Sáng 03',
        device_type: 'LAMP',
        pin_relay: 33,         // Nối vào Relay kích hoạt chân GPIO 33
        is_connected: true,    // Đã đấu nối phần cứng thực tế
        current_state: 'OFF',  // Trạng thái ban đầu: Đang TẮT
      },
      {
        device_code: 'P201_LAMP_04',
        device_name: 'Đèn Chiếu Sáng 04',
        device_type: 'LAMP',
        pin_relay: 22,         // Nối vào Relay kích hoạt chân GPIO 22 (Đề 1)
        is_connected: true,    // Đã đấu nối phần cứng thực tế
        current_state: 'OFF',  // Trạng thái ban đầu: Đang TẮT
      },
      {
        device_code: 'ALERT_LED',
        device_name: 'Đèn Cảnh Báo Ánh Sáng',
        device_type: 'ALERT',
        pin_relay: 2,
        is_connected: true,
        current_state: 'OFF',
      },
      /*
      // Tạm thời comment thiết bị quạt theo yêu cầu thực hành/demo
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
      */
    ]);
    console.log('Đã tạo Thiết bị: 4 Đèn Chiếu Sáng (Đã kết nối).');

    // ============================================================================
    // BƯỚC 5: TẠO 100 BẢN GHI DỮ LIỆU ĐO ĐẠC CỦA CẢM BIẾN (SENSORDATA)
    // Sử dụng hàm toán học sin/cos kết hợp số ngẫu nhiên để tạo dao động tự nhiên:
    // - Nhiệt độ dao động quanh 25 - 32°C
    // - Độ ẩm dao động quanh 55 - 75%
    // - Ánh sáng dao động quanh 350 - 700 Lux
    // Các mốc thời gian cách đều nhau 5 giây tính ngược từ hiện tại
    // ============================================================================
    const sensorRecords = [];
    const now = Date.now();
    for (let i = 0; i < 100; i++) {
      // Tính mốc thời gian: Bản ghi thứ 100 là hiện tại, lùi dần 5 giây mỗi chu kỳ
      const measuredTime = new Date(now - (99 - i) * 5000);
      sensorRecords.push({
        temperature: +(25 + Math.sin(i / 6) * 7 + Math.random()).toFixed(1),
        humidity: +(60 + Math.cos(i / 5) * 15 + Math.random()).toFixed(1),
        light: Math.floor(400 + Math.sin(i / 4) * 300 + Math.random() * 50),
        measured_at: measuredTime,
      });
    }
    // Chèn hàng loạt 100 bản ghi vào CSDL
    await SensorData.insertMany(sensorRecords);
    console.log('Đã tạo 100 bản ghi SensorData.');

    // ============================================================================
    // BƯỚC 6: TẠO 10 BẢN GHI LỊCH SỬ ĐIỀU KHIỂN THIẾT BỊ (ACTIONHISTORY)
    // Lưu vết các lần người dùng bấm công tắc bật/tắt thiết bị qua giao diện Web:
    // - Ghi nhận thời gian gửi lệnh (command_time)
    // - Thời gian nhận gói tin ACK phản hồi từ ESP32 (response_time)
    // - Độ trễ mạng (latency_ms) ngẫu nhiên từ 250ms - 400ms mô phỏng thực tế
    // ============================================================================
    const actionRecords = [];
    for (let i = 1; i <= 10; i++) {
      const cmdTime = new Date(now - i * 1000 * 60 * 10); // Cách nhau mỗi 10 phút
      const latency = Math.floor(250 + Math.random() * 150); // Độ trễ từ 250 - 400ms
      actionRecords.push({
        device_code: 'P201_LAMP_01',
        device_name: 'Đèn Chiếu Sáng 01',
        action: i % 2 === 0 ? 'ON' : 'OFF', // Xen kẽ BẬT và TẮT
        command_time: cmdTime,
        response_time: new Date(cmdTime.getTime() + latency),
        latency_ms: latency,
        status: 'SUCCESS', // Trạng thái thành công
        user_id: 'admin',  // Do tài khoản Admin thao tác
      });
    }
    // Chèn hàng loạt 10 bản ghi lịch sử vào CSDL
    await ActionHistory.insertMany(actionRecords);
    console.log('Đã tạo 10 bản ghi ActionHistory.');

    console.log('TOÀN BỘ DỮ LIỆU ĐÃ ĐƯỢC SEED THÀNH CÔNG!');
    process.exit(0); // Kết thúc tiến trình thành công với mã 0
  } catch (err) {
    console.error('Lỗi khi seed dữ liệu:', err);
    process.exit(1); // Thoát tiến trình kèm mã lỗi 1 nếu thất bại
  }
}

// Kích hoạt hàm khởi tạo dữ liệu
seedDatabase();
