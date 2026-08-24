# TÀI LIỆU ĐỌC HIỂU & BẢO VỆ CÔNG NGHỆ HỆ THỐNG IOT PTIT (docHieu.md)

> **Học viện Công nghệ Bưu chính Viễn thông (PTIT)**  
> **Học phần:** Lập trình thiết bị IoT & Hệ thống Nhúng  
> **Mục tiêu tài liệu:** Giải thích chi tiết, dễ hiểu, bản chất và lý do lựa chọn từng công nghệ trong kiến trúc toàn trình của đồ án. Dùng làm tài liệu ôn tập vấn đáp và đưa vào báo cáo môn học.

---

## 🗺️ TỔNG QUAN KIẾN TRÚC 5 TẦNG & SỰ PHỐI HỢP CÔNG NGHỆ

```
[ 1. FRONTEND ]        React.js + Ant Design + Vite (Giao diện Web Dashboard)
      ↕  (HTTP REST API / WebSocket - Socket.io)
[ 2. BACKEND ]         Node.js + Express.js (Xử lý nghiệp vụ, Định tuyến, Xác thực)
      ↕  (Mongoose Driver / TCP)                 ↕  (MQTT Protocol / Port 1883)
[ 3. DATABASE ]        MongoDB Atlas               [ 4. BROKER ] Mosquitto MQTT Broker
                                                         ↕  (WiFi 802.11 b/g/n)
                                                   [ 5. HARDWARE ] ESP32 + DHT22 + LDR + Relay
```

---

# CHI TIẾT TỪNG THÀNH PHẦN CÔNG NGHỆ ĐƯỢC LỰA CHỌN

---

## 1. 📟 ESP32 NodeMCU (Vi Điều Khiển Trung Tâm Tầng Phần Cứng)

### 📌 Nó là gì?
* **ESP32 NodeMCU** là một vi điều khiển (Microcontroller Unit - MCU) 32-bit hiệu năng cao do hãng Espressif Systems sản xuất. Nó tích hợp sẵn chip vi xử lý lõi kép (Dual-core Tensilica Xtensa 240MHz), bộ nhớ RAM 520KB và đặc biệt là **tích hợp sẵn module kết nối WiFi 802.11 b/g/n và Bluetooth BLE**.

### ⚙️ Công dụng trong hệ thống:
1. **Thu thập tín hiệu:** Đóng vai trò làm bộ não tại trạm đo phần cứng, đọc tín hiệu số từ chân GPIO cảm biến DHT22 và đọc tín hiệu điện áp tương tự (ADC 12-bit) từ Quang trở LDR.
2. **Xử lý & Đóng gói dữ liệu:** Chuyển đổi dữ liệu thô (raw ADC / bit stream) thành số liệu chuẩn (°C, %, Lux), đóng gói thành định dạng JSON bằng thư viện `ArduinoJson`.
3. **Truyền thông không dây:** Kết nối vào mạng WiFi phòng lab, đóng vai trò là **MQTT Client** thực hiện:
   * *Publish* dữ liệu cảm biến lên topic `esp32/telemetry` định kỳ mỗi 3 - 5 giây.
   * *Subscribe* lắng nghe topic `esp32/device/command` để nhận lệnh điều khiển.
   * *Publish* gói tin xác nhận lên topic `esp32/device/ack` sau khi kích hoạt thiết bị.
4. **Điều khiển cơ cấu chấp hành (Actuators):** Xuất mức điện áp Logic (HIGH/LOW) ra chân GPIO 26 và GPIO 27 để đóng/ngắt các mạch Rơ-le điều khiển Đèn (`LAMP_01`) và Quạt (`FAN_01`).

### 💡 Tại sao chọn ESP32 thay vì Arduino Uno / ESP8266?
* **So với Arduino Uno:** Arduino Uno chạy chip 8-bit chậm (16MHz), không có WiFi tích hợp (phải mua thêm module ESP8266 rời rất cồng kềnh và dễ mất ổn định), RAM chỉ 2KB không đủ parse chuỗi JSON phức tạp.
* **So với ESP8266:** ESP32 mạnh hơn gấp nhiều lần (Lõi kép 240MHz vs 1 lõi 80MHz), nhiều chân GPIO hơn, bộ chuyển đổi ADC độ phân giải cao hơn (12-bit 4096 mức vs 10-bit 1024 mức), hỗ trợ Bluetooth và xử lý đa nhiệm ổn định hơn.

---

## 2. 🌡️ DHT22 & 💡 LDR (Cảm Biến Nhiệt Độ, Độ Ẩm & Quang Trở Ánh Sáng)

### 📌 Chúng là gì?
* **DHT22 (AM2302):** Là module cảm biến kỹ thuật số dùng để đo đồng thời **Nhiệt độ môi trường** và **Độ ẩm không khí**. Bên trong tích hợp sẵn một cảm biến độ ẩm điện dung, một nhiệt điện trở NTC và một vi mạch xử lý tín hiệu số chuyển đổi 1-Wire.
* **LDR (Light Dependent Resistor / Quang trở):** Là linh kiện bán dẫn có giá trị điện trở thay đổi phụ thuộc vào cường độ ánh sáng chiếu vào bề mặt (Trời càng sáng thì điện trở càng giảm, điện áp ngõ ra thay đổi).

### ⚙️ Công dụng trong hệ thống:
1. **DHT22 (Kết nối chân GPIO 4):** Cung cấp 2 thông số môi trường quan trọng:
   * Nhiệt độ: Dải đo từ -40°C đến 80°C (Độ chính xác $\pm 0.5^\circ\text{C}$).
   * Độ ẩm: Dải đo từ 0% đến 100% RH (Độ chính xác $\pm 2\%$).
2. **LDR (Kết nối chân Analog ADC1 - GPIO 34):** Cung cấp thông số Cường độ ánh sáng:
   * Đo điện áp biến thiên trên mạch cầu phân áp.
   * ESP32 đọc giá trị ADC từ `0` đến `4095`, sau đó dùng thuật toán ánh xạ `map()` chuyển đổi sang đơn vị Lux tương đối (`0 - 1000 Lux`) phục vụ giám sát độ rọi sáng phòng học/phòng lab.

### 💡 Tại sao chọn DHT22 thay vì DHT11?
* DHT11 chỉ đo nhiệt độ từ 0-50°C ($\pm 2^\circ\text{C}$) và độ ẩm từ 20-80% ($\pm 5\%$), tốc độ phản hồi chậm và sai số lớn.
* **DHT22 có dải đo rộng hơn, độ nhạy cao hơn và độ chính xác vượt trội**, thích hợp cho các đồ án yêu cầu độ chuẩn xác cao.

---

## 3. 📡 MQTT Protocol & Mosquitto Broker (Tầng Trung Gian Truyền Thông)

### 📌 Nó là gì?
* **MQTT (Message Queuing Telemetry Transport):** Là giao thức truyền thông mạng tầng ứng dụng hoạt động theo cơ chế **Publish / Subscribe (Xuất bản / Đăng ký nhận tin)** chạy trên nền TCP/IP.
* **Mosquitto:** Là một phần mềm máy chủ đóng vai trò **MQTT Broker trung tâm**, có nhiệm vụ tiếp nhận mọi thông điệp từ các bên gửi (Publisher), lọc theo tên Topic và phân phối chính xác tới các bên đã đăng ký nhận (Subscriber).

### ⚙️ Công dụng trong hệ thống:
1. **Làm cầu nối trung gian bất đồng bộ:** Giúp phần cứng ESP32 và máy chủ Backend Node.js giao tiếp với nhau mà không cần biết IP trực tiếp của nhau.
2. **Quản lý phân luồng Topic:**
   * `esp32/telemetry`: Thu nhận dữ liệu cảm biến 5s/lần từ ESP32 chuyển tiếp cho Backend.
   * `esp32/device/command`: Tiếp nhận lệnh Bật/Tắt từ Backend đẩy tức thời xuống ESP32.
   * `esp32/device/ack`: Tiếp nhận gói tin xác nhận hoàn thành từ ESP32 đẩy ngược về Backend.
   * `esp32/status`: Quản lý trạng thái sống còn (Heartbeat & LWT - Last Will).
3. **Đảm bảo chất lượng dịch vụ (QoS 1):** Đảm bảo lệnh điều khiển bật/tắt và gói tin xác nhận ACK không bị rơi rụng trên đường truyền WiFi.

### 💡 Tại sao chọn MQTT thay vì HTTP truyền thống cho phần cứng?
* **HTTP:** Là mô hình Request/Response nặng nề (Header HTTP chiếm cả kilobyte), kết nối ngắn hạn (mỗi lần gửi dữ liệu phải bắt tay TCP lại từ đầu), và máy chủ **không thể chủ động bắn lệnh xuống ESP32** nếu không dùng cơ chế kéo dữ liệu (Polling) liên tục gây tốn tài nguyên và nóng chip.
* **MQTT:** Header siêu nhẹ (chỉ từ 2 bytes), duy trì 1 kết nối TCP liên tục (Keep-Alive), cho phép truyền nhận dữ liệu 2 chiều realtime với độ trễ chỉ tính bằng mili-giây.

---

## 4. ⚡ WebSocket & Socket.io (Tầng Truyền Dữ Liệu Thời Gian Thực Frontend ↔ Backend)

### 📌 Nó là gì?
* **WebSocket:** Là giao thức mạng chuẩn cung cấp kênh truyền thông **song công toàn phần (Full-duplex)** qua một kết nối TCP duy nhất tồn tại lâu dài giữa Trình duyệt (Browser) và Máy chủ (Server).
* **Socket.io:** Là thư viện JavaScript phổ biến nhất hiện nay xây dựng trên nền WebSocket, bổ sung cơ chế tự động kết nối lại (Auto-reconnection), hỗ trợ dự phòng (Fallback to HTTP Long-polling) và phân chia sự kiện (Event-based messaging).

### ⚙️ Công dụng trong hệ thống:
1. **Đẩy dữ liệu cảm biến Realtime lên Web:** Ngay khi Backend nhận được dữ liệu từ MQTT, nó phát sự kiện `socketIo.emit('telemetry', data)`. Trình duyệt React bắt sự kiện này và tự động thêm điểm dữ liệu mới vào biểu đồ AreaChart và thẻ thông số mà người dùng không cần F5/tải lại trang.
2. **Đồng bộ trạng thái thiết bị tức thời:** Khi có gói tin ACK từ phần cứng, Backend phát sự kiện `device_state_changed`, giúp công tắc trên Dashboard tự động tắt biểu tượng chờ (Spin Loading) và chốt vị trí ON/OFF ngay lập tức.

### 💡 Tại sao dùng cả MQTT và WebSocket trong cùng 1 dự án?
* **ESP32 $\leftrightarrow$ Backend dùng MQTT:** Vì MQTT tối ưu hóa cao độ cho thiết bị nhúng phần cứng tài nguyên yếu và mạng không dây chập chờn.
* **Backend $\leftrightarrow$ Frontend React dùng WebSocket:** Vì các trình duyệt Web hiện đại hỗ trợ native WebSocket rất mạnh mẽ và bảo mật, trong khi trình duyệt không thể trực tiếp chạy TCP socket thô của MQTT nếu không thông qua WebSockets bridge.

---

## 5. 🧠 Node.js & Express.js (Tầng Dịch Vụ Máy Chủ Xử Lý - Backend Core)

### 📌 Chúng là gì?
* **Node.js:** Là môi trường thực thi mã JavaScript phía máy chủ (Server-side runtime environment) xây dựng trên nền tảng V8 JavaScript Engine của Google Chrome. Node.js hoạt động theo mô hình **Đơn luồng, Hướng sự kiện và Bất đồng bộ không chặn (Single-threaded, Event-driven, Non-blocking I/O)**.
* **Express.js:** Là **Web Framework tiêu chuẩn, nhỏ gọn (Minimalist) và linh hoạt (Unopinionated) hàng đầu cho Node.js**. Nó hoạt động như một tầng trừu tượng (Abstraction Layer) bao bọc lấy HTTP Module cấp thấp của Node.js, cung cấp hệ thống **Định tuyến (Routing)** và **Hàng đợi Middleware (Middleware Pipeline)** cực kỳ mạnh mẽ để xây dựng các RESTful API.

---

### 🔍 GIẢI THÍCH CHUYÊN SÂU VỀ EXPRESS.JS: "ĐỊNH TUYẾN" & "MIDDLEWARE"

#### 1. Tại sao cần Express.js mà không dùng Node.js thuần (Vanilla Node.js)?
* Nếu dùng Node.js thuần (`http.createServer`), việc xử lý một request rất phức tạp: phải tự viết mã phân tích chuỗi URL, tự đọc từng mẩu nhị phân (Buffer Stream) để ghép thành JSON Body, tự cấu hình header HTTP, tự bắt lỗi CORS... khiến mã nguồn dài dòng, dễ lỗi và khó bảo trì.
* **Express.js giải quyết triệt để vấn đề này:** Đơn giản hóa toàn bộ việc cấu hình Server chỉ trong vài dòng mã, cung cấp sẵn các hàm tiện ích (`req.body`, `req.params`, `req.query`, `res.json()`, `res.status()`).

---

#### 2. Hệ Thống Định Tuyến (Routing System) Là Gì & Hoạt Động Như Thế Nào?
* **Định nghĩa:** **Routing (Định tuyến)** là cơ chế **tiếp nhận, phân loại và điều hướng** các yêu cầu HTTP từ Client gửi lên (gồm *HTTP Method: GET, POST, PUT, DELETE* kết hợp với *Đường dẫn URL Endpoint*) đến chính xác hàm xử lý nghiệp vụ tương ứng (Controller Handler).
* **Ứng dụng thực tế trong đồ án thông qua `express.Router()`:**
  Hệ thống tách biệt rõ ràng các phân hệ thành từng file Router độc lập, giúp kiến trúc rõ ràng, dễ mở rộng:
  ```
  Client Request ──► [ server.js ]
                          ├──► /api/auth    ──► [ auth.routes.js ]   ──► Đăng ký / Đăng nhập / JWT
                          ├──► /api/sensors ──► [ sensor.routes.js ] ──► Lấy dữ liệu đo & Lọc thời gian
                          ├──► /api/devices ──► [ device.routes.js ] ──► Danh sách thiết bị & Toggle Relay
                          └──► /api/actions ──► [ action.routes.js ] ──► Nhật ký điều khiển & Độ trễ
  ```
* **Khả năng xử lý tham số động (Dynamic Route Parameters) & Query String:**
  * Endpoint điều khiển thiết bị: `/api/devices/:deviceCode/toggle` $\rightarrow$ Express tự động trích xuất mã thiết bị thông qua biến `req.params.deviceCode` (ví dụ: `LAMP_01`).
  * Endpoint tra cứu lịch sử: `/api/sensors/history?page=1&limit=10&sensor_type=temperature` $\rightarrow$ Express tự động phân tích thành Object `req.query` để thực hiện phân trang và lọc MongoDB.

---

#### 3. Cơ Chế Middleware (Middleware Chain / Pipeline) Là Gì & Đóng Vai Trò Gì?
* **Định nghĩa:** **Middleware** là các **hàm trung gian** nằm trên đường đi giữa lúc máy chủ **Nhận Request** và lúc máy chủ **Trả về Response**.
  
  $$\text{Client Request} \longrightarrow \boxed{\text{Middleware 1}} \longrightarrow \boxed{\text{Middleware 2}} \longrightarrow \boxed{\text{Controller Handler}} \longrightarrow \text{Response JSON}$$

* **Cấu trúc hàm Middleware:** Mỗi middleware có chữ ký hàm chuẩn `(req, res, next)`. Nó có 3 quyền năng:
  1. Thực thi bất kỳ đoạn mã logic nào (kiểm tra quyền, ghi log, đo thời gian).
  2. Thay đổi hoặc gắn thêm dữ liệu vào đối tượng `req` (ví dụ: gắn thông tin `req.user` sau khi giải mã token).
  3. Quyết định gọi hàm `next()` để chuyển giao sang Middleware/Controller kế tiếp, HOẶC ngắt luôn luồng xử lý và trả về lỗi (`res.status(401).json(...)`) mà không cho phép đi tiếp.

* **Các loại Middleware thực tế được áp dụng trong đồ án:**
  * **Middleware Tích hợp & Bên thứ ba (Third-party Middleware):**
    * `cors()`: Xử lý chính sách Cross-Origin Resource Sharing, cho phép Frontend React (chạy tại `http://localhost:5173`) gọi API sang Backend Node.js (chạy tại `http://localhost:5000`) mà không bị trình duyệt chặn.
    * `express.json()`: Tự động giải mã (parse) chuỗi JSON trong phần thân (Body) của Request thành Javascript Object `req.body`.
  * **Middleware Xác thực & Phân quyền (Authentication Middleware - `verifyToken`):**
    * Đứng trước các Endpoint nhạy cảm (như điều khiển thiết bị). Middleware này chặn Request lại, kiểm tra chuỗi JWT Token trong header `Authorization: Bearer <token>`.
    * Nếu Token hợp lệ: Giải mã `userId`, gắn vào `req.user` và gọi `next()` cho vào Controller.
    * Nếu không có Token hoặc Token hết hạn: Chặn đứng ngay lập tức, trả về mã HTTP `401 Unauthorized`.
  * **Middleware Xử lý Lỗi Tập trung (Centralized Error Handler):**
    * Đặt ở cuối chuỗi định tuyến với 4 tham số `(err, req, res, next)`. Bất kỳ lỗi logic nào xảy ra ở Controller chỉ cần gọi `next(err)`, middleware này sẽ tự động bắt lấy, in log lỗi và trả về phản hồi JSON chuẩn `{ success: false, message: err.message }` với status code `500`.

---

#### 4. Ý Nghĩa Của Tính "Nhỏ Gọn" (Minimalist) & "Linh Hoạt" (Unopinionated):
* **Nhỏ gọn (Minimalist):** Express không bị nhồi nhét sẵn các công cụ cồng kềnh mà chỉ giữ lại bộ khung cốt lõi (Core Routing + Middleware), giúp server khởi động nhanh trong vài mili-giây và chiếm cực ít RAM.
* **Linh hoạt (Unopinionated):** Không áp đặt cấu trúc thư mục cứng nhắc (như NestJS hay Spring Boot). Cho phép lập trình viên tự do kết hợp đa giao thức trong cùng một ứng dụng: **vừa phục vụ RESTful API (Express), vừa làm MQTT Client tiếp nhận gói tin từ ESP32, vừa làm WebSocket Server (Socket.io) đẩy dữ liệu lên React**.

---

### ⚙️ Công dụng tổng hợp trong hệ thống:
1. **RESTful API Gateway:** Cung cấp đầy đủ các đầu mối giao tiếp chuẩn mực cho Web Frontend.
2. **Tích hợp dịch vụ đa giao thức (Multi-protocol Hub):** Kết nối đồng bộ giữa HTTP Server, MQTT Handler và Socket.io Engine.
3. **Quản lý cơ chế ACK & Timeout 5000ms (`ack.service.js`):** Sinh mã `requestId`, theo dõi trạng thái phản hồi của ESP32, hủy bộ đếm khi có ACK hoặc tự động ghi nhận trạng thái `TIMEOUT` nếu quá 5 giây.

### 💡 Tại sao chọn Node.js + Express?
* Hệ thống IoT có đặc thù là số lượng kết nối mạng vào/ra (I/O) cực kỳ dày đặc (cảm biến gửi 5s/lần, người dùng thao tác liên tục). Mô hình Non-blocking I/O của Node.js xử lý hàng nghìn kết nối đồng thời với mức tiêu tốn tài nguyên cực thấp so với các mô hình đa luồng truyền thống.

---

## 6. 🗄️ MongoDB Atlas (Tầng Cơ Sở Dữ Liệu - Database Layer)

### 📌 Nó là gì?
* **MongoDB:** Là hệ quản trị cơ sở dữ liệu phi quan hệ (NoSQL Document Database) mã nguồn mở hàng đầu. Dữ liệu được lưu trữ dưới dạng các tài liệu linh hoạt tương tự JSON (gọi là BSON - Binary JSON).
* **Mongoose:** Thư viện Object Data Modeling (ODM) cho Node.js giúp quản lý Schema, Validation và quan hệ dữ liệu chặt chẽ.

### ⚙️ Công dụng trong hệ thống:
Lưu trữ toàn bộ 4 tập thực thể (Collections) của đồ án:
1. **`sensor_data`:** Lưu chuỗi thời gian đo đạc (`temperature`, `humidity`, `light`, `measured_at`). Có đánh chỉ mục Index trên `measured_at` để tối ưu tốc độ lọc dữ liệu theo khoảng thời gian.
2. **`devices`:** Quản lý thông tin phần cứng (`device_code`, `device_name`, `pin_relay`, `is_connected`, `current_state`, `is_active`).
3. **`action_histories`:** Nhật ký kiểm toán điều khiển (`device_code`, `action`, `command_time`, `response_time`, `latency_ms`, `status`).
4. **`users`:** Quản lý tài khoản người dùng, mã hóa mật khẩu bằng thuật toán Bcrypt.

### 💡 Tại sao chọn MongoDB thay vì MySQL / PostgreSQL?
* **Tính tương thích JSON tự nhiên:** Từ ESP32 gửi JSON $\rightarrow$ MQTT mang JSON $\rightarrow$ Backend parse JSON $\rightarrow$ Lưu thẳng vào MongoDB dưới dạng Document mà không cần ánh xạ quan hệ phức tạp (ORM).
* **Tối ưu cho dữ liệu chuỗi thời gian (Time-series Sensor Data):** Dữ liệu cảm biến tăng theo từng giây, MongoDB có tốc độ ghi chèn (Insert Throughput) cực nhanh và dễ dàng mở rộng dung lượng linh hoạt.

---

## 7. 🖥️ React.js + Ant Design (AntD) + Vite (Tầng Giao Diện Người Dùng - Frontend UI)

### 📌 Chúng là gì?
* **React.js:** Thư viện JavaScript nổi tiếng của Meta dùng để xây dựng giao diện người dùng theo kiến trúc Single Page Application (SPA) và cơ chế Virtual DOM tối ưu tốc độ render.
* **Ant Design (AntD):** Bộ thư viện thành phần giao diện (UI Component Library) chuẩn doanh nghiệp hàng đầu cho React, cung cấp sẵn các component cao cấp (Table, Switch, Spin, Card, DatePicker, Notification, Modal,...).
* **Vite:** Công cụ xây dựng và đóng gói mã nguồn (Frontend Build Tool) thế hệ mới siêu nhanh, thay thế hoàn toàn Create-React-App cũ kỹ.

### ⚙️ Công dụng trong hệ thống:
1. **Màn hình Dashboard Giám sát:** Hiển thị 3 Card chỉ số cảm biến đổi màu trực quan theo ngưỡng nhiệt/ẩm/sáng; vẽ biểu đồ AreaChart cập nhật trơn tru mỗi 5 giây.
2. **Bảng Điều khiển Thiết bị (Device Panel):** Cung cấp các Switch bật/tắt. Tích hợp hiệu ứng Spin Loading trong lúc chờ gói tin ACK và tự động khôi phục vị trí nếu bị lỗi Timeout.
3. **Màn hình Tra cứu & Phân trang Dữ liệu:** Bảng dữ liệu AntD Table hỗ trợ lọc theo chuỗi thời gian (`DD/MM/YYYY HH:mm:ss`), chọn loại cảm biến, sắp xếp và xuất dữ liệu.
4. **Màn hình Lịch sử Hành động & Quản lý Hồ sơ:** Tra cứu chi tiết từng lần gạt công tắc, hiển thị Tag màu trạng thái `SUCCESS` (Xanh lá) hoặc `TIMEOUT` (Đỏ) kèm độ trễ phản hồi chi tiết.

### 💡 Tại sao chọn React + AntD + Vite?
* **Trải nghiệm người dùng mượt mà:** SPA giúp chuyển đổi giữa 5 phân hệ màn hình ngay lập tức mà không bị chớp trắng tải lại trang.
* **Thẩm mỹ chuyên nghiệp:** Ant Design mang lại giao diện tinh tế, đồng bộ màu sắc và các thành phần tương tác đạt tiêu chuẩn sản phẩm thương mại.
* **Hiệu năng phát triển:** Vite khởi động môi trường dev trong vài mili-giây với tính năng Hot Module Replacement (HMR).

---

## 📊 BẢNG TỔNG HỢP SO SÁNH & VỊ TRÍ CỦA TỪNG CÔNG NGHỆ

| Công Nghệ | Phân Tầng Kiến Trúc | Vai Trò Cốt Lõi | Giao Thức / Chuẩn Sử Dụng | Ưu Điểm Quyết Định |
| :--- | :--- | :--- | :--- | :--- |
| **ESP32 NodeMCU** | 5. Hardware Layer | Đọc cảm biến, kích Rơ-le, gửi nhận MQTT | GPIO, ADC, WiFi 802.11 b/g/n | Tích hợp sẵn WiFi, Lõi kép 240MHz, RAM lớn, giá rẻ |
| **DHT22 & LDR** | 5. Hardware Layer | Cảm biến Nhiệt độ, Độ ẩm & Ánh sáng | 1-Wire Digital / Analog ADC | Độ chính xác cao, dải đo rộng, ổn định |
| **Mosquitto MQTT** | 4. Broker Layer | Trung gian phân phối tin Pub/Sub | MQTT v3.1.1 (Port 1883) | Nhẹ, bất đồng bộ, đẩy dữ liệu 2 chiều realtime |
| **Node.js + Express** | 2. Backend Layer | REST API, MQTT Handler, ACK Manager | HTTP/JSON, MQTT, TCP/IP | Non-blocking I/O, xử lý kết nối đồng thời cực tốt |
| **MongoDB Atlas** | 3. Database Layer | Lưu trữ dữ liệu cảm biến & lịch sử | NoSQL / BSON Documents | Ghi chèn Time-series siêu nhanh, tương thích JSON |
| **Socket.io** | 1 & 2. FE $\leftrightarrow$ BE | Truyền số liệu cảm biến Realtime lên Web | WebSocket / TCP | Song công 2 chiều, tự kết nối lại, độ trễ <100ms |
| **React + AntD + Vite** | 1. Frontend Layer | Giao diện giám sát, điều khiển & tra cứu | Single Page App (SPA) | UI đẹp mắt, biểu đồ động, build siêu nhanh |
