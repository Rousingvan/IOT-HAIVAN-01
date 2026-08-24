# DATABASE MODULE - IOT PTIT 2026

Module quản lý cấu trúc dữ liệu MongoDB và Mongoose Schemas.

## 1. Cấu Trúc Schemas
- `User.schema.js`: Tài khoản sinh viên và mật khẩu băm bcrypt.
- `Sensor.schema.js`: Danh mục cảm biến (Nhiệt độ, Độ ẩm, Ánh sáng).
- `SensorData.schema.js`: Dữ liệu đo đạc chuỗi thời gian (Index `{ measured_at: -1 }`).
- `Device.schema.js`: Danh mục thiết bị hỗ trợ mở rộng cắm và chạy (`is_connected`).
- `ActionHistory.schema.js`: Lịch sử điều khiển Bật/Tắt và độ trễ phản hồi ACK.

## 2. Hướng Dẫn Nạp Dữ Liệu Mẫu (Seed Data)
```bash
npm install
npm run seed
```
Mặc định kết nối tới MongoDB Local `mongodb://localhost:27017/iot_ptit_db` (hoặc cấu hình qua biến môi trường `MONGODB_URI` trong file `.env`).
