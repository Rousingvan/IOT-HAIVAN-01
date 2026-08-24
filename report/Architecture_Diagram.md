# KIẾN TRÚC TỔNG THỂ HỆ THỐNG IOT (SYSTEM ARCHITECTURE DIAGRAM)

> **Hệ thống:** Giám sát Môi trường & Điều khiển Thiết bị Thông minh  
> **Kiến trúc phân tầng:** 5 khối chức năng chính (Frontend $\leftrightarrow$ Backend $\leftrightarrow$ Database $\leftrightarrow$ MQTT Broker $\leftrightarrow$ Hardware)

---

## 1. Biểu Đồ Kiến Trúc Hệ Thống (Mermaid Diagram)

```mermaid
flowchart TB
    %% ==========================================
    %% 1. TẦNG GIAO DIỆN NGƯỜI DÙNG (FRONTEND)
    %% ==========================================
    subgraph FE_Layer ["FRONTEND LAYER - REACT"]
        direction LR
        UI_Monitor["📊 Giám sát Cảm biến & Biểu đồ"]
        UI_Control["⚡ Bảng Điều khiển Thiết bị"]
        UI_Query["🔍 Tra cứu Dữ liệu & Lịch sử"]
        UI_Auth["👤 Quản lý Xác thực & Hồ sơ"]
    end

    %% ==========================================
    %% 2. TẦNG MÁY CHỦ XỬ LÝ (BACKEND)
    %% ==========================================
    subgraph BE_Layer ["🧠 TẦNG DỊCH VỤ XỬ LÝ (BACKEND LAYER - NODE.JS)"]
        direction TB
        subgraph BE_Core ["Dịch vụ cốt lõi"]
            API_Gateway["🌐 RESTful API Gateway"]
            Auth_Service["🔒 Xác thực & Bảo mật (JWT / Bcrypt)"]
        end
        subgraph BE_IoT ["Xử lý IoT & Realtime"]
            WS_Engine["⚡ WebSocket Server (Socket.io)"]
            MQTT_Handler["⚙️ MQTT Ingestion & Command Handler"]
            ACK_Manager["⏱️ ACK & Timeout Manager (5s)"]
        end
    end

    %% ==========================================
    %% 3. TẦNG CƠ SỞ DỮ LIỆU (DATABASE)
    %% ==========================================
    subgraph DB_Layer ["🗄️ TẦNG CƠ SỞ DỮ LIỆU (DATABASE LAYER - MONGODB)"]
        direction LR
        DB_Sensors[("📦 Sensor Data<br/>(Dữ liệu đo đạc)")]
        DB_Devices[("📦 Devices<br/>(Trạng thái thiết bị)")]
        DB_History[("📦 Action History<br/>(Nhật ký & Độ trễ)")]
        DB_Users[("📦 Users<br/>(Tài khoản người dùng)")]
    end

    %% ==========================================
    %% 4. TẦNG TRUNG GIAN TRUYỀN THÔNG (MQTT BROKER)
    %% ==========================================
    subgraph MQTT_Layer ["📡 TẦNG TRUNG GIAN TRUYỀN THÔNG (MQTT BROKER)"]
        direction TB
        Broker["Mosquitto MQTT Broker"]
        subgraph Topics ["Topics"]
            T_Telem["esp32/telemetry"]
            T_Cmd["esp32/device/command"]
            T_Ack["esp32/device/ack"]
        end
        Broker --- T_Telem
        Broker --- T_Cmd
        Broker --- T_Ack
    end

    %% ==========================================
    %% 5. TẦNG THIẾT BỊ PHẦN CỨNG (HARDWARE)
    %% ==========================================
    subgraph HW_Layer ["📟 TẦNG THIẾT BỊ PHẦN CỨNG (HARDWARE LAYER - ESP32)"]
        direction LR
        HW_Sensors["📡 Cảm biến<br/>(Nhiệt độ, Độ ẩm, Ánh sáng)"]
        HW_MCU["🧠 Vi điều khiển<br/>(ESP32 NodeMCU)"]
        HW_Actuators["⚡ Bộ chấp hành / Rơ-le<br/>(Đèn, Quạt)"]

        HW_Sensors -->|"Đọc tín hiệu"| HW_MCU
        HW_MCU -->|"Kích đóng/ngắt"| HW_Actuators
    end

    %% ==========================================
    %% LIÊN KẾT GIAO TIẾP GIỮA CÁC TẦNG
    %% ==========================================
    FE_Layer <==>|"HTTP / REST API (JSON)"| API_Gateway
    WS_Engine -.->|"WebSocket Events Push (Realtime)"| FE_Layer

    BE_Core <==>|"Truy vấn & Cập nhật"| DB_Layer
    MQTT_Handler -->|"Lưu dữ liệu cảm biến & Nhật ký"| DB_Layer

    MQTT_Handler <-->|"Đồng bộ sự kiện"| WS_Engine
    MQTT_Handler <-->|"Kiểm soát Timeout"| ACK_Manager

    MQTT_Handler -->|"Publish Command"| T_Cmd
    T_Cmd -->|"Gửi lệnh điều khiển"| HW_MCU

    HW_MCU -->|"Publish Telemetry (5s)"| T_Telem
    T_Telem -->|"Đẩy dữ liệu đo"| MQTT_Handler

    HW_MCU -->|"Publish ACK (Phản hồi)"| T_Ack
    T_Ack -->|"Đẩy xác nhận ACK"| MQTT_Handler

    %% Tác nhân Người dùng
    User((👤 Người dùng)) <--> FE_Layer

    %% ==========================================
    %% STYLING
    %% ==========================================
    classDef feStyle fill:#FFF3E0,stroke:#E65100,stroke-width:2px,color:#1F2937;
    classDef beStyle fill:#F3E5F5,stroke:#7B1FA2,stroke-width:2px,color:#1F2937;
    classDef dbStyle fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px,color:#1F2937;
    classDef mqttStyle fill:#E1F5FE,stroke:#0277BD,stroke-width:2px,color:#1F2937;
    classDef hwStyle fill:#FBE9E7,stroke:#BF360C,stroke-width:2px,color:#1F2937;

    class FE_Layer,UI_Monitor,UI_Control,UI_Query,UI_Auth feStyle;
    class BE_Layer,BE_Core,BE_IoT,API_Gateway,Auth_Service,WS_Engine,MQTT_Handler,ACK_Manager beStyle;
    class DB_Layer,DB_Sensors,DB_Devices,DB_History,DB_Users dbStyle;
    class MQTT_Layer,Broker,Topics,T_Telem,T_Cmd,T_Ack mqttStyle;
    class HW_Layer,HW_Sensors,HW_MCU,HW_Actuators hwStyle;
```

---

## 2. Biểu Đồ Kiến Trúc Hệ Thống (PlantUML Component Diagram)

```plantuml
@startuml System_Architecture_HighLevel
skinparam componentStyle uml2
skinparam packageStyle rectangle
skinparam roundcorner 10
skinparam shadowing true
skinparam defaultFontName "Arial"
skinparam defaultFontSize 12

title KIẾN TRÚC TỔNG THỂ HỆ THỐNG IOT PTIT

' 1. FRONTEND LAYER
package "1. Tầng Giao Diện (Frontend - React)" as Layer_FE #FFF3E0 {
    [Giám sát Cảm biến & Biểu đồ] as UI_Monitor
    [Bảng Điều khiển Thiết bị] as UI_Control
    [Tra cứu Dữ liệu & Lịch sử] as UI_Query
    [Quản lý Xác thực & Hồ sơ] as UI_Auth
}

' 2. BACKEND LAYER
package "2. Tầng Dịch Vụ Xử Lý (Backend - Node.js)" as Layer_BE #F3E5F5 {
    [RESTful API Gateway] as BE_API
    [Xác thực & Bảo mật (JWT/Bcrypt)] as BE_Auth
    [WebSocket Server (Socket.io)] as BE_WS
    [MQTT Ingestion & Command Handler] as BE_MQTT
    [ACK & Timeout Manager (5s)] as BE_ACK

    BE_MQTT <-> BE_ACK
    BE_MQTT -> BE_WS : Đẩy sự kiện realtime
}

' 3. DATABASE LAYER
package "3. Tầng Cơ Sở Dữ Liệu (Database - MongoDB)" as Layer_DB #E8F5E9 {
    database "MongoDB" {
        [Sensor Data (Dữ liệu đo đạc)] as DB_Sensors
        [Devices (Trạng thái thiết bị)] as DB_Devices
        [Action History (Nhật ký & Độ trễ)] as DB_History
        [Users (Tài khoản người dùng)] as DB_Users
    }
}

' 4. MQTT BROKER LAYER
package "4. Tầng Trung Gian Truyền Thông (MQTT Broker)" as Layer_MQTT #E1F5FE {
    queue "Topic: esp32/telemetry" as Topic_Telem
    queue "Topic: esp32/device/command" as Topic_Cmd
    queue "Topic: esp32/device/ack" as Topic_Ack
}

' 5. HARDWARE LAYER
package "5. Tầng Thiết Bị Phần Cứng (Hardware - ESP32)" as Layer_HW #FBE9E7 {
    [Cảm biến (Nhiệt độ, Độ ẩm, Ánh sáng)] as HW_Sensors
    [Vi điều khiển (ESP32 NodeMCU)] as HW_MCU
    [Bộ chấp hành / Rơ-le (Đèn, Quạt)] as HW_Actuators

    HW_Sensors --> HW_MCU : Đọc tín hiệu
    HW_MCU --> HW_Actuators : Điều khiển bật/tắt
}

' LIÊN KẾT GIAO TIẾP
actor "Người dùng" as User
User <--> Layer_FE

Layer_FE <==> BE_API : HTTP / REST API (JSON)
BE_WS -.-> Layer_FE : WebSocket Realtime Push

BE_API <--> Layer_DB : Truy vấn & Cập nhật
BE_MQTT --> Layer_DB : Lưu dữ liệu đo & Nhật ký

BE_MQTT --> Topic_Cmd : Publish Command
Topic_Cmd --> HW_MCU : Nhận lệnh điều khiển

HW_MCU --> Topic_Telem : Publish Telemetry (5s)
Topic_Telem --> BE_MQTT : Đẩy dữ liệu cảm biến

HW_MCU --> Topic_Ack : Publish ACK
Topic_Ack --> BE_MQTT : Xác nhận phản hồi

@enduml
```

---

## 3. Bảng Tóm Tắt Chức Năng & Giao Tiếp Giữa Các Tầng

| Tầng Kiến Trúc | Thành Phần Chức Năng Chính | Giao Thức / Cơ Chế Giao Tiếp | Luồng Dữ Liệu Tương Tác |
| :--- | :--- | :--- | :--- |
| **1. Frontend Layer** | Giám sát Realtime, Bảng điều khiển, Tra cứu lịch sử, Xác thực tài khoản | HTTP / REST API & WebSocket | - Gửi yêu cầu truy vấn / điều khiển qua REST API.<br>- Nhận dữ liệu cảm biến & trạng thái thiết bị tức thời qua WebSocket. |
| **2. Backend Layer** | REST API Gateway, WebSocket Server, MQTT Handler, ACK & Timeout Manager, Auth | HTTP, WebSocket, MQTT, TCP/IP | - Xử lý nghiệp vụ, xác thực JWT, phân quyền.<br>- Thu thập gói tin Telemetry, gửi lệnh điều khiển và quản lý Timeout 5s. |
| **3. Database Layer** | Collections: `sensor_data`, `devices`, `action_histories`, `users` | MongoDB WiredTiger Engine / TCP | - Lưu trữ bền vững dữ liệu đo đạc, nhật ký thao tác và tài khoản. |
| **4. MQTT Broker** | Mosquitto Broker (Topics: `telemetry`, `command`, `ack`) | MQTT Protocol (Port 1883 / QoS 0 & QoS 1) | - Trung gian phân phối thông điệp bất đồng bộ giữa Phần cứng và Backend. |
| **5. Hardware Layer** | Cảm biến môi trường, Vi điều khiển ESP32, Bộ chấp hành Rơ-le | GPIO, ADC, WiFi 802.11 b/g/n | - Đọc định kỳ cảm biến (5s), đóng ngắt rơ-le thiết bị và phát bản tin ACK. |
