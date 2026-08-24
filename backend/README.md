# BACKEND API & SOCKET.IO SERVICE - IOT PTIT 2026

## 1. Tính Năng Chính
- **RESTful API:** 5 nhóm Endpoints tương ứng 5 Use Cases.
- **Time Range Parser:** Mở rộng khoảng thời gian $[start, end)$ đa độ chính xác theo đặc tả `timestamp.md`.
- **MQTT Bridge & ACK Handler:** Điều phối gói tin command tới ESP32, xử lý cơ chế Pending Command Map và timeout 5 giây.
- **WebSocket Socket.io:** Bắn dữ liệu Telemetry cảm biến và thay đổi trạng thái thiết bị thời gian thực.
- **Extensible Module:** Kiểm tra `is_connected` trước khi gửi lệnh, sẵn sàng mở rộng thêm thiết bị mới chỉ bằng cấu hình DB.

## 2. Hướng Dẫn Chạy
```bash
npm install
# Khởi chạy server
npm start
```
Mặc định server lắng nghe tại cổng `http://localhost:5000`.
