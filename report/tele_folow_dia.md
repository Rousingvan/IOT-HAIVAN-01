@startuml Flow_Telemetry
skinparam style strictuml
skinparam sequenceMessageAlign center
skinparam defaultFontName "Arial"

skinparam SequenceActorFontSize 14
skinparam SequenceParticipantFontSize 14
skinparam SequenceMessageFontSize 14
skinparam SequenceNoteFontSize 14
skinparam maxMessageSize 250 

skinparam shadowing false
skinparam sequenceArrowThickness 1
skinparam sequenceActorBackgroundColor #2ecc71
skinparam sequenceParticipantBackgroundColor #3498db
skinparam sequenceMessageBackgroundColor #ffffff
skinparam sequenceNoteBackgroundColor #f1c40f
skinparam SequenceArrowColor #2c3e50
skinparam defaultTextAlignment center

title 2.3. Flow Thu Thập Dữ Liệu Cảm Biến

participant "ESP32" as ESP32
participant "MQTT Broker" as MQTT
participant "Backend\n(Node.js)" as BE
database "Database\n(MongoDB)" as DB
participant "Frontend\n(React)" as FE

== 1. ĐO ĐẠC VÀ ĐÓNG GÓI DỮ LIỆU ==
activate ESP32
ESP32 -> ESP32: 1. Đọc dữ liệu GPIO/ADC từ Sensors & Đóng gói JSON Payload

== 2. TRUYỀN THÔNG QUA MQTT BROKER ==
ESP32 -> MQTT: 2. Publish topic "esp32/telemetry" { temperature, humidity, light, timestamp }
deactivate ESP32
activate MQTT
MQTT -> BE: 3. Chuyển tiếp message tới Backend (MQTT Service)
deactivate MQTT
activate BE

== 3. KIỂM TRA TÍNH HỢP LỆ VÀ LƯU CSDL ==
BE -> BE: 4. Validate dữ liệu (Device, Sensor, Value, Timestamp)
BE -> DB: 5. INSERT DataSensor (Lưu bản ghi vào sensor_data)
activate DB
DB --> BE: 6. Xác nhận ghi CSDL thành công
deactivate DB

== 4. ĐỒNG BỘ HIỂN THỊ LÊN GIAO DIỆN ==
alt Push dữ liệu thời gian thực
    BE -> FE: 7.1. Push Realtime Event qua WebSocket (socket.emit 'telemetry')
    activate FE
else Lấy dữ liệu khởi tạo khi mở trang
    FE -> BE: 7.2. HTTP GET /api/sensors/latest
    BE --> FE: 7.3. HTTP 200 OK (Dữ liệu tức thời)
    deactivate BE
end

FE -> FE: 9. Cập nhật số liệu trên 3 Card chỉ số & Nạp điểm vẽ biểu 
deactivate FE

@enduml

-----
@startuml Flow_Command
skinparam style strictuml
skinparam sequenceMessageAlign center
skinparam defaultFontName "Arial"

skinparam SequenceActorFontSize 14
skinparam SequenceParticipantFontSize 14
skinparam SequenceMessageFontSize 14
skinparam SequenceNoteFontSize 14
skinparam maxMessageSize 250 

skinparam shadowing false
skinparam sequenceArrowThickness 1
skinparam sequenceActorBackgroundColor #2ecc71
skinparam sequenceParticipantBackgroundColor #3498db
skinparam sequenceMessageBackgroundColor #ffffff
skinparam sequenceNoteBackgroundColor #f1c40f
skinparam SequenceArrowColor #2c3e50
skinparam defaultTextAlignment center

title 2.4. Flow Điều Khiển Thiết Bị & Phản Hồi ACK

actor "User" as User
participant "Frontend\n(React)" as FE
participant "Backend\n(Node.js)" as BE
database "Database\n(MongoDB)" as DB
participant "MQTT Broker" as MQTT
participant "ESP32 Node" as ESP32

== 1. NGƯỜI DÙNG THAO TÁC & GỬI YÊU CẦU ==
User -> FE: 1. Click gạt công tắc ON/OFF
activate FE
FE -> FE: 2. Hiển thị trạng thái Spin Loading
FE -> BE: 3. HTTP POST /api/devices/toggle { device_code, action: "ON" }
activate BE

== 2. XÁC THỰC, KIỂM TRA THIẾT BỊ & GHI NHẬT KÝ BAN ĐẦU ==
BE -> BE: 4. Authenticate & Authorize 
BE -> DB: 5. Kiểm tra thiết bị trong database 
activate DB
DB --> BE: 6. Xác nhận thiết bị hợp lệ
deactivate DB

BE -> DB: 7. Ghi History với command_time vào bảng action_histories
activate DB
DB --> BE: 8. Xác nhận tạo bản ghi nhật ký
deactivate DB

== 3. GỬI LỆNH MQTT & PHẦN CỨNG THỰC THI ==
BE -> MQTT: 9. Publish topic "esp32/device/command" { requestId, deviceCode, action }
activate MQTT
MQTT -> ESP32: 10. Chuyển tiếp command xuống ESP32
activate ESP32
deactivate MQTT

ESP32 -> ESP32: 11. Nhận command & Điều khiển Relay (digitalWrite)
ESP32 -> MQTT: 12. Publish topic "esp32/device/ack" { requestId, status: "SUCCESS" }
deactivate ESP32
activate MQTT
MQTT -> BE: 13. Chuyển tiếp gói tin ACK về Backend
deactivate MQTT

== 4. CẬP NHẬT KẾT QUẢ & HIỂN THỊ TRẠNG THÁI THỰC TẾ ==
BE -> DB: 14. Cập nhật response_time, latency_ms & status = SUCCESS
activate DB
DB --> BE: 15. Xác nhận cập nhật nhật ký
deactivate DB

BE -> DB: 16. Cập nhật trạng thái thiết bị hiện tại (current_state = 'ON')
activate DB
DB --> BE: 17. Xác nhận cập nhật thiết bị
deactivate DB

BE --> FE: 18. HTTP 200 OK { success: true, latency: 120ms }
deactivate BE
FE -> FE: 19. Tắt Spin Loading, chốt vị trí Switch thực tế
FE --> User: 20. Hiển thị trạng thái thực tế & Thông báo thành công
deactivate FE

@enduml
