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
