# TỔNG HỢP MÃ NGUỒN PLANTUML SEQUENCE DIAGRAM (USE CASE 01 - 05)

> **Dự án:** Hệ thống Giám sát Môi trường & Điều khiển Thiết bị IoT PTIT  
> **Định dạng:** PlantUML Sequence Diagram (`@startuml` ... `@enduml`)  
> **Cấu hình style:** `skinparam style strictuml`, `skinparam sequenceMessageAlign center`  

---

## 1. UC01.1: Đăng Nhập Hệ Thống (Login)

```plantuml
@startuml UC01_1_Login
skinparam style strictuml
skinparam sequenceMessageAlign center

title UC01.1: Đăng Nhập Hệ Thống (User Authentication)

actor "User" as User
participant "Frontend (React)" as FE
participant "Backend (Express)" as BE
database "Database (MongoDB)" as DB

User -> FE: 1. Nhập username, password & bấm "Đăng nhập"
activate FE
FE -> BE: 2. HTTP POST /api/auth/login { username, password }
activate BE
BE -> DB: 3. User.findOne({ username })
activate DB
DB --> BE: 4. Trả về thông tin User (chứa mật khẩu băm)
deactivate DB

alt Mật khẩu băm không trùng khớp (Bcrypt so sánh thất bại)
    BE --> FE: 5.1. HTTP 401 Unauthorized { message: "Tên đăng nhập hoặc mật khẩu không chính xác" }
    FE --> User: 5.2. Hiển thị thông báo lỗi trên giao diện
else Mật khẩu hợp lệ (Bcrypt so sánh thành công)
    BE -> BE: 6. Ký JSON Web Token (jwt.sign)
    BE --> FE: 7. HTTP 200 OK { success: true, token, user }
    deactivate BE
    FE -> FE: 8. Lưu JWT token vào localStorage
    FE --> User: 9. Hiển thị thông báo thành công & Chuyển hướng Dashboard
    deactivate FE
end
@enduml
```

---

## 2. UC01.2: Đăng Ký Tài Khoản Sinh Viên (Register)

```plantuml
@startuml UC01_2_Register
skinparam style strictuml
skinparam sequenceMessageAlign center

title UC01.2: Đăng Ký Tài Khoản Sinh Viên (User Registration)

actor "User" as User
participant "Frontend (React)" as FE
participant "Backend (Express)" as BE
database "Database (MongoDB)" as DB

User -> FE: 1. Nhập username, password, fullName, studentCode, className
activate FE
User -> FE: 2. Nhấn nút "Tạo tài khoản"
FE -> BE: 3. HTTP POST /api/auth/register { username, password, fullName, studentCode, className }
activate BE
BE -> DB: 4. User.findOne({ username })
activate DB
DB --> BE: 5. Trả về kết quả kiểm tra trùng lặp
deactivate DB

alt Tên đăng nhập đã tồn tại
    BE --> FE: 6.1. HTTP 400 Bad Request { message: "Tên đăng nhập đã được sử dụng" }
    FE --> User: 6.2. Hiển thị cảnh báo trùng lặp tài khoản
else Dữ liệu hợp lệ & Chưa tồn tại
    BE -> BE: 7. Băm mật khẩu (bcrypt.hash với 10 Salt Rounds)
    BE -> DB: 8. User.create({ username, password: hashedPassword, fullName, ... })
    activate DB
    DB --> BE: 9. Xác nhận lưu bản ghi thành công
    deactivate DB
    BE -> BE: 10. Tạo JWT Token đăng nhập tức thời
    BE --> FE: 11. HTTP 201 Created { success: true, token, user }
    deactivate BE
    FE -> FE: 12. Lưu token vào localStorage
    FE --> User: 13. Hiển thị Toast thông báo thành công & Chuyển hướng Dashboard
    deactivate FE
end
@enduml
```

---

## 3. UC01.3: Xem Hồ Sơ Sinh Viên & Tài Nguyên Đồ Án (Profile)

```plantuml
@startuml UC01_3_Profile
skinparam style strictuml
skinparam sequenceMessageAlign center

title UC01.3: Xem Hồ Sơ Sinh Viên & Liên Kết Tài Nguyên Đồ Án

actor "User" as User
participant "Frontend (React)" as FE
participant "Backend (Express)" as BE
database "Database (MongoDB)" as DB

User -> FE: 1. Truy cập màn hình Hồ sơ cá nhân (/profile)
activate FE
FE -> BE: 2. HTTP GET /api/profile
activate BE
BE -> DB: 3. Lấy thông tin sinh viên thực hiện & cấu hình đồ án
activate DB
DB --> BE: 4. Trả về thông tin sinh viên & danh sách liên kết
deactivate DB
BE --> FE: 5. HTTP 200 OK { fullName, studentCode, className, email, links }
deactivate BE
FE -> FE: 6. Render Thẻ sinh viên & 4 nút liên kết (GitHub, Figma, Swagger, PDF)
FE --> User: 7. Hiển thị giao diện hồ sơ hoàn chỉnh
deactivate FE

opt Người dùng mở liên kết tài nguyên
    User -> FE: 8. Nhấp chọn "Xem GitHub" / "Figma" / "Swagger" / "Báo cáo PDF"
    activate FE
    FE -> FE: 9. Mở đường dẫn trong tab trình duyệt mới (window.open)
    FE --> User: 10. Chuyển hướng sang trang tài nguyên bên ngoài
    deactivate FE
end
@enduml
```

---

## 4. UC02: Giám Sát Cảm Biến Thời Gian Thực (Realtime Telemetry)

```plantuml
@startuml UC02_Realtime_Telemetry
skinparam style strictuml
skinparam sequenceMessageAlign center

title UC02: Giám Sát Cảm Biến Thời Gian Thực Qua MQTT & WebSocket

actor "User" as User
participant "Frontend" as FE
participant "Backend" as BE
database "Database" as DB
participant "MQTT Broker" as MQTT
participant "Hardware" as HW

== LUỒNG 1: THU THẬP VÀ PHÁT REALTIME (PUSH STREAM - CHU KỲ 5S) ==
loop Chu kỳ 5 giây đo cảm biến
    HW -> HW: 1. Đọc GPIO 4 (DHT22) & ADC 34 (LDR)
    activate HW
    HW -> MQTT: 2. Publish topic "esp32/telemetry" { temperature, humidity, light, timestamp }
    deactivate HW
    activate MQTT
    MQTT -> BE: 3. Chuyển tiếp gói tin Telemetry
    deactivate MQTT
    activate BE
    BE -> DB: 4. db.sensor_data.insertOne(point)
    activate DB
    DB --> BE: 5. Xác nhận lưu CSDL thành công
    deactivate DB
    BE -> FE: 6. Phát sự kiện realtime qua WebSocket (socket.emit 'telemetry')
    deactivate BE
    activate FE
    FE -> FE: 7. Cập nhật số liệu trên 3 Card chỉ số & Nạp điểm vào biểu đồ
    FE --> User: 8. Hiển thị thông số môi trường tức thời
    deactivate FE
end

== LUỒNG 2: TẢI DỮ LIỆU BAN ĐẦU KHI MỞ TRANG (PULL STREAM) ==
User -> FE: 9. Mở màn hình Giám sát
activate FE
FE -> BE: 10. HTTP GET /api/sensors/latest
activate BE
BE -> DB: 11. db.sensor_data.findOne().sort({ measured_at: -1 })
activate DB
DB --> BE: 12. Trả về bản ghi đo đạc mới nhất
deactivate DB
BE --> FE: 13. HTTP 200 OK
deactivate BE

FE -> BE: 14. HTTP GET /api/sensors/history?limit=20
activate BE
BE -> DB: 15. db.sensor_data.find().sort({ measured_at: -1 }).limit(20)
activate DB
DB --> BE: 16. Trả về danh sách 20 điểm đo gần nhất
deactivate DB
BE --> FE: 17. HTTP 200 OK
deactivate BE
FE -> FE: 18. Khởi tạo 3 Card chỉ số & Vẽ biểu đồ AreaChart
FE --> User: 19. Hiển thị Dashboard hoàn chỉnh
deactivate FE
@enduml
```

---

## 5. UC03: Tra Cứu & Lọc Dữ Liệu Cảm Biến (Sensor Data Query)

```plantuml
@startuml UC03_Sensor_Data_Query
skinparam style strictuml
skinparam sequenceMessageAlign center

title UC03: Tra Cứu & Lọc Dữ Liệu Cảm Biến (Time String Search)

actor "User" as User
participant "Frontend" as FE
participant "Backend" as BE
database "Database" as DB

User -> FE: 1. Nhập chuỗi mốc thời gian (VD: "19/08/2026", "15:30") & Chọn cột thông số
activate FE
User -> FE: 2. Nhấn nút "Lọc" hoặc nhấn phím Enter
FE -> BE: 3. HTTP GET /api/sensor-data?searchTime=19/08/2026&page=1&pageSize=10
activate BE
BE -> BE: 4. Phân tích chuỗi khớp định dạng DD/MM/YYYY HH:mm:ss ($dateToString)

BE -> DB: 5. db.sensor_data.find(query).sort({ measured_at: -1 }).skip(0).limit(10)
activate DB
DB --> BE: 6. Trả về danh sách bản ghi phân trang
deactivate DB

BE -> DB: 7. db.sensor_data.countDocuments(query)
activate DB
DB --> BE: 8. Trả về tổng số lượng bản ghi (total)
deactivate DB

BE --> FE: 9. HTTP 200 OK { data: [...], total, page: 1, pageSize: 10 }
deactivate BE
FE -> FE: 10. Render Ant Design Table & Cập nhật thanh phân trang
FE --> User: 11. Hiển thị bảng dữ liệu đo đạc theo kết quả tìm kiếm
deactivate FE
@enduml
```

---

## 6. UC04: Điều Khiển Thiết Bị Qua MQTT & Phản Hồi ACK (Device Control)

```plantuml
@startuml UC04_Device_Control
skinparam style strictuml
skinparam sequenceMessageAlign center

title UC04: Điều Khiển Thiết Bị & Phản Hồi Xác Nhận Hai Chiều 

actor "User" as User
participant "Frontend" as FE
participant "Backend" as BE
database "Database" as DB
participant "MQTT Broker" as MQTT
participant "Hardware" as HW

User -> FE: 1. Gạt công tắc Switch sang ON
activate FE
FE -> FE: 2. Hiển thị trạng thái Spin Loading
FE -> BE: 3. HTTP POST /api/devices/toggle { action: "ON" }
activate BE

BE -> DB: 4. Kiểm tra trạng thái thiết bị
activate DB
DB --> BE: Xác nhận thiết bị hợp lệ 
deactivate DB

BE -> BE: 6. Tạo requestId & Khởi tạo bộ hẹn giờ Timeout 5000ms
BE -> MQTT: 7. Publish topic "esp32/device/command" { requestId, deviceCode: "LAMP_01", action: "ON" }
activate MQTT
MQTT -> HW: 8. Chuyển tiếp bản tin điều khiển xuống ESP32
activate HW
deactivate MQTT

alt ESP32 THỰC THI & PHẢN HỒI ACK THÀNH CÔNG 
    HW -> HW: 9. digitalWrite(PIN_RELAY_26, LOW) -> Đóng Relay, Đèn bật sáng
    HW -> MQTT: 10. Publish topic "esp32/device/ack" { requestId, deviceCode: "LAMP_01", status: "SUCCESS" }
    deactivate HW
    activate MQTT
    MQTT -> BE: 11. Chuyển tiếp gói tin ACK về Backend
    deactivate MQTT
    
    BE -> BE: 12. Hủy Timeout & Tính toán độ trễ phản hồi 
    BE -> DB: 13. UPDATE devices SET current_state = 'ON' cho thiết bị vừa bật
    activate DB
    DB --> BE: Xác nhận cập nhật trạng thái thiết bị
    deactivate DB
    BE -> DB: 14. INSERT INTO action_histories (device_code, action, status, latency_ms)
    activate DB
    DB --> BE: Xác nhận lưu nhật ký điều khiển
    deactivate DB
    
    BE -> FE: 15. Phát sự kiện đồng bộ qua WebSocket
    BE --> FE: 16. HTTP 200 OK { success: true, latency: 120ms, message: "Bật thiết bị thành công" }
    deactivate BE
    FE -> FE: 17. Tắt Spin Loading, chốt vị trí Switch ON
    FE --> User: 18. Hiển thị Toast thông báo thành công (Độ trễ: 120ms)
    deactivate FE

else KỊCH BẢN 2: TIMEOUT SAU 5000MS (ESP32 MẤT NGUỒN / MẤT SÓNG)
    activate BE
    BE -> BE: 21. Bộ hẹn giờ 5000ms kích hoạt (Hết thời gian chờ ACK)
    BE -> DB: 22. INSERT INTO action_histories (device_code, action, status: "TIMEOUT")
    activate DB
    DB --> BE: 23. Xác nhận lưu nhật ký timeout
    deactivate DB
    BE --> FE: 24. HTTP 500 Internal Error { message: "Timeout: Không nhận được ACK sau 5s" }
    deactivate BE
    activate FE
    FE -> FE: 25. Tắt Spin Loading, tự động gạt Switch trở lại OFF
    FE --> User: 26. Hiển thị cảnh báo lỗi màu đỏ: "Thiết bị không phản hồi"
    deactivate FE
end
@enduml
```

---

## 7. UC05: Tra Cứu Nhật Ký Lịch Sử Điều Khiển (Action History Query)

```plantuml
@startuml UC05_Action_History
skinparam style strictuml
skinparam sequenceMessageAlign center

title UC05: Tra Cứu Nhật Ký Lịch Sử Điều Khiển Thiết Bị

actor "User" as User
participant "Frontend " as FE
participant "Backend " as BE
database "Database" as DB

User -> FE: 1. Chọn Thiết bị lọc (VD: "LAMP_01") & Nhập chuỗi mốc thời gian (VD: "19/08/2026")
activate FE
User -> FE: 2. Nhấn nút "Lọc" hoặc nhấn phím Enter
FE -> BE: 3. HTTP GET /api/action-history?deviceCode=LAMP_01&searchTime=19/08/2026&page=1&pageSize=10
activate BE
BE -> BE: 4. Phân tích điều kiện lọc thiết bị và chuỗi thời gian command_time

BE -> DB: 5. db.action_histories.find(query).sort({ command_time: -1 }).skip(0).limit(10)
activate DB
DB --> BE: 6. Trả về danh sách bản ghi lịch sử điều khiển
deactivate DB

BE -> DB: 7. db.action_histories.countDocuments(query)
activate DB
DB --> BE: 8. Trả về tổng số lượng bản ghi (total)
deactivate DB

BE --> FE: 9. HTTP 200 OK { data: [...], total, page: 1, pageSize: 10 }
deactivate BE
FE -> FE: 10. Render Ant Design Table (Gắn Tag màu trạng thái & Badge độ trễ latency_ms)
FE --> User: 11. Hiển thị bảng nhật ký lịch sử điều khiển hoàn chỉnh
deactivate FE
@enduml
```
