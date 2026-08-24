# 3.4. API Specification (Đặc tả API Hệ thống)

> **Dự án:** Hệ thống Giám sát Môi trường & Điều khiển Thiết bị IoT  
> **Giao thức:** RESTful HTTP / JSON  
> **Xác thực (Auth):** Bearer Token (JSON Web Token - JWT)  

---

## 1. Bảng Tổng Hợp Đặc Tả API Toàn Bộ 5 Use Case (Chuẩn Mẫu Báo Cáo)

| API | Method | Auth | Mục đích |
| :--- | :--- | :--- | :--- |
| `/api/auth/register` | POST | No | Đăng ký tài khoản người dùng mới (Register) |
| `/api/auth/login` | POST | No | Đăng nhập hệ thống & cấp JWT Token (Login/Token) |
| `/api/profile` *(hoặc `/api/users/me`)* | GET | Yes | Lấy thông tin hồ sơ người dùng & 4 liên kết đồ án (Profile) |
| `/api/sensors/latest` | GET | Yes | Lấy dữ liệu cảm biến tức thời mới nhất (Latest readings) |
| `/api/sensors/history` | GET | Yes | Lấy dữ liệu cảm biến chuỗi thời gian vẽ biểu đồ (Chart history) |
| `/api/sensor-data` | GET | Yes | Tra cứu, lọc theo mốc thời gian & phân trang dữ liệu cảm biến (Search/Filter) |
| `/api/devices` | GET | Yes | Lấy danh sách thiết bị và trạng thái hiện tại (Device list) |
| `/api/devices/:id/toggle` *(hoặc `/api/devices/{id}/commands`)* | POST | Yes | Gửi lệnh điều khiển bật/tắt thiết bị & chờ phản hồi ACK (ON/OFF command) |
| `/api/action-history` | GET | Yes | Tra cứu, lọc và phân trang lịch sử thao tác điều khiển thiết bị (Action History) |

---

## 2. Bảng Tổng Hợp Chi Tiết Theo Từng Use Case

| STT | Use Case | API Endpoint | Method | Auth | Mục đích chi tiết |
| :---: | :--- | :--- | :---: | :---: | :--- |
| **1** | **UC01: Quản lý Xác thực & Hồ sơ** | `/api/auth/register` | `POST` | **No** | Đăng ký tài khoản sinh viên mới, mã hóa mật khẩu bcrypt |
| | | `/api/auth/login` | `POST` | **No** | Xác thực tài khoản, trả về JWT Access Token & thông tin người dùng |
| | | `/api/profile` | `GET` | **Yes** | Truy xuất hồ sơ cá nhân và 4 liên kết dự án (GitHub, Figma, Swagger, PDF) |
| **2** | **UC02: Giám sát Cảm biến Realtime** | `/api/sensors/latest` | `GET` | **Yes** | Lấy gói tin đo đạc mới nhất (Nhiệt độ, Độ ẩm, Ánh sáng) khi vừa tải trang |
| | | `/api/sensors/history` | `GET` | **Yes** | Lấy 10 - 20 điểm dữ liệu gần nhất để khởi tạo biểu đồ AreaChart |
| **3** | **UC03: Tra cứu & Lọc Dữ liệu Cảm biến** | `/api/sensor-data` | `GET` | **Yes** | Tìm kiếm theo chuỗi thời gian (Time String Search), chọn loại cảm biến, sắp xếp và phân trang dữ liệu đo đạc |
| **4** | **UC04: Điều khiển Thiết bị & Phản hồi ACK** | `/api/devices` | `GET` | **Yes** | Lấy danh sách trạng thái Relay (Đèn, Quạt) phòng Lab |
| | | `/api/devices/:deviceCode/toggle` | `POST` | **Yes** | Xuất bản lệnh MQTT, thiết lập Timer 5000ms chờ gói tin ACK từ ESP32 |
| **5** | **UC05: Lịch sử Điều khiển Thiết bị** | `/api/action-history` | `GET` | **Yes** | Tra cứu nhật ký bật/tắt thiết bị theo chuỗi thời gian & thiết bị, ghi nhận độ trễ (latency) và trạng thái |


---

## 3. Ghi Chú Kỹ Thuật (Technical Notes)
1. **Header Authentication**: Với các endpoint yêu cầu `Auth: Yes`, Client phải đính kèm Header:
   ```http
   Authorization: Bearer <jwt_token>
   ```
2. **Quy chuẩn mã phản hồi (HTTP Status Codes)**:
   - `200 OK`: Yêu cầu thực thi thành công.
   - `201 Created`: Tạo mới tài nguyên thành công (Đăng ký tài khoản).
   - `400 Bad Request`: Dữ liệu đầu vào không hợp lệ hoặc thiếu tham số.
   - `401 Unauthorized`: Chưa đăng nhập hoặc Token hết hạn/không hợp lệ.
   - `404 Not Found`: Không tìm thấy tài nguyên yêu cầu.
   - `500 Internal Server Error`: Lỗi máy chủ / timeout xử lý phần cứng.
