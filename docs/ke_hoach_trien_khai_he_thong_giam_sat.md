# Kế hoạch triển khai chi tiết: Hệ thống giám sát và điều khiển thiết bị trong phòng

Tài liệu này đóng vai trò là tài liệu BA chuẩn (SRS - Software Requirements Specification) và kế hoạch triển khai chi tiết nhằm đáp ứng toàn bộ các yêu cầu của giảng viên, đặc biệt là các kịch bản live demo và giao tiếp cứng - mềm.

## 1. Tổng quan hệ thống
Hệ thống IoT cho phép người dùng giám sát các chỉ số môi trường (nhiệt độ, độ ẩm, ánh sáng) theo thời gian thực và điều khiển các thiết bị trong phòng (quạt, đèn). Trọng tâm của hệ thống là tính thời gian thực, độ tin cậy trong điều khiển (phản hồi trạng thái), và khả năng tra cứu dữ liệu linh hoạt.

## 2. Lựa chọn Công nghệ & Kiến trúc
- **Phần cứng (Hardware):** Sử dụng vi điều khiển ESP32 hoặc ESP8266, lập trình bằng **Arduino IDE**. Cảm biến: DHT11/22 (Nhiệt độ, độ ẩm), Quang trở (Ánh sáng). Thiết bị chấp hành: Relay đóng ngắt Đèn, Quạt.
- **Giao thức kết nối:** **MQTT** (Message Queuing Telemetry Transport). Sử dụng trạm trung chuyển tin nhắn (Broker) như Mosquitto hoặc HiveMQ.
- **Phần mềm (Software):**
  - **Frontend:** ReactJS hoặc VueJS (cho Web) kết hợp Socket.io-client hoặc MQTT.js để hiển thị dữ liệu real-time.
  - **Backend:** NodeJS (Express) hoặc Python, kết nối với MQTT Broker để xử lý logic, tính toán độ trễ, và lưu trữ.
  - **Database:** MySQL hoặc MongoDB để lưu lịch sử cảm biến và lịch sử điều khiển.

## 3. Đặc tả Yêu cầu Chức năng (Use Cases)
Hệ thống được thiết kế với **6 Use Cases (UC)** chính:

### UC1: Đăng nhập / Đăng ký
- Người dùng cần có tài khoản để truy cập hệ thống nhằm bảo mật thông tin điều khiển.

### UC2: Màn hình Dashboard (Monitoring thời gian thực)
- **Sidebar:** Menu điều hướng bên trái.
- **Top bar:** Hiển thị số liệu thời gian thực của các cảm biến (Nhiệt độ, Độ ẩm, Ánh sáng).
- **Biểu đồ:** Nằm bên dưới Top bar, vẽ biểu đồ dạng đường (Line chart) thể hiện sự dao động của các cảm biến trên theo thời gian thực.
- **Điều khiển (Góc phải):** Khu vực chứa các thiết bị (Quạt, Bóng đèn). 
  - **Yêu cầu UI/UX:** Khi bấm bật/tắt phải có **hiệu ứng loading**. Trạng thái chỉ thay đổi khi nhận được gói tin phản hồi từ phần cứng (để chắc chắn thiết bị đã được bật/tắt thành công).

### UC3: Màn hình Data Sensor (Tra cứu dữ liệu cảm biến)
- **Chức năng tìm kiếm (Top):**
  - Dropdown list chọn loại dữ liệu: Tất cả, Nhiệt độ, Độ ẩm, Ánh sáng. Nếu chọn "Nhiệt độ", bảng dưới chỉ hiện dữ liệu nhiệt độ.
  - Input tìm kiếm theo thời gian: Hỗ trợ tìm chính xác (Giờ:Phút:Giây). Nếu người dùng xóa phần giây -> tìm theo Phút; xóa Phút -> tìm theo Giờ; xóa Giờ -> tìm theo Ngày.
- **Bảng dữ liệu (Table):** Gồm các cột: ID, Loại cảm biến, Giá trị, Thời gian.

### UC4: Màn hình Action History (Lịch sử hành động)
- **Chức năng tìm kiếm (Top):** Bộ lọc tìm kiếm theo thời gian.
- **Bảng dữ liệu (Table):** Gồm các cột: ID, Tên thiết bị, Action (Đang bật hay tắt), Status (Kết quả hành động - Thành công/Thất bại), Time (Gồm thời gian gửi lệnh và thời gian phần cứng phản hồi).
- **Mục đích:** Quản trị viên biết chính xác thiết bị được điều khiển lúc nào và trạng thái cuối cùng ra sao.

### UC5: Màn hình Profile
- Hiển thị thông tin cá nhân: Ảnh đại diện, Họ tên, Mã sinh viên.
- Các liên kết dự án:
  - Link Github (Giảng viên có thể check lịch sử commit).
  - Link Figma (Thiết kế UI/UX).
  - Link API Docs (Postman Collection hoặc Swagger).
  - Link PDF Báo cáo cuối kỳ.

## 4. Kế hoạch thiết kế luồng dữ liệu (Data Flow) & Giao tiếp Cứng - Mềm
Để chứng minh hệ thống hoạt động thực tế và đáp ứng yêu cầu "biết thiết bị thành công hay chưa", data flow được thiết kế như sau:
1. **Thu thập dữ liệu:** ESP32 đọc cảm biến -> `publish` lên topic `sensor/data`. Backend nhận, lưu DB và báo Frontend cập nhật (Top bar & Biểu đồ).
2. **Điều khiển thiết bị:**
   - Người dùng bấm nút trên Web -> Giao diện xoay **Loading**.
   - Frontend gọi API tới Backend -> Backend `publish` lệnh `{device: "light", action: "ON"}` lên topic `device/control`.
   - ESP32 nhận lệnh, kích Relay bật đèn -> Đọc trạng thái chân Digital -> `publish` kết quả lên topic `device/status`.
   - Backend nhận kết quả, lưu lịch sử (lưu cả time gửi và time nhận để ra độ trễ) -> Báo Frontend qua Socket.
   - Frontend tắt **Loading**, đổi màu nút (Xanh = Bật, Xám = Tắt).

## 5. Kịch bản thực hành (Live Demo / HW)
Chuẩn bị sẵn các kịch bản để trả lời vấn đáp của giảng viên:
- **Kịch bản "Rút phần cứng ra":** Backend hoặc Frontend cần có cơ chế Timeout/Heartbeat (ping phần cứng mỗi 5s). Nếu rút điện, sau 5s Frontend phải bật cảnh báo màu đỏ: "Không có tín hiệu kết nối từ phần cứng".
- **Kịch bản "Che cảm biến":** Lấy tay che cảm biến ánh sáng (Quang trở). Do data flow là real-time, biểu đồ trên Dashboard phải cắm đầu đi xuống (down) ngay lập tức.
- **Kịch bản "Đổi Port trong 30s":** Trong source code Backend và Hardware, không hardcode Port mà dùng biến cấu hình hoặc `.env`. Khi thầy yêu cầu đổi port broker hoặc web, chỉ cần sửa `.env` và restart lại nhanh chóng.
- **Kịch bản "Hiệu ứng Loading":** Đã tích hợp ở UC2, chứng minh luồng feedback khép kín.
- **Live Code (Chuẩn bị trước logic):**
  - *Chỉnh hiển thị cảnh báo:* Chuẩn bị sẵn một state `isWarning` trên UI.
  - *Thống kê số lần vượt ngưỡng:* Viết sẵn 1 câu SQL hoặc logic Backend `SELECT COUNT(*) FROM sensor_data WHERE value > threshold`.
  - *Thống kê thiết bị:* Viết sẵn 1 câu SQL nhóm theo tên thiết bị trong bảng Action History `GROUP BY device_name`.
