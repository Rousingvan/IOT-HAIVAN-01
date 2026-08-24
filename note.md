# 📚 Sổ Tay Ghi Chép & Giải Thích Dự Án IoT PTIT (note.md)

Tài liệu này lưu trữ lại toàn bộ các câu hỏi thắc mắc, phân tích kiến trúc và câu trả lời chi tiết trong suốt quá trình phát triển dự án.

---

## 📌 Mục Lục Câu Hỏi
- [Câu hỏi 1: Mối quan hệ giữa server.js, controllers và routes trong bức tranh toàn cảnh](#câu-hỏi-1-mối-quan-hệ-giữa-serverjs-các-file-ở-folder-controllers-và-routes-tại-sao-họ-lại-đặt-tên-như-vậy)
- [Câu hỏi 2: Kết nối Database MongoDB Atlas (Cloud) với Backend và cơ chế nạp dữ liệu mẫu (Seeder)](#câu-hỏi-2-kết-nối-database-mongodb-atlas-cloud-với-backend-và-cơ-chế-nạp-dữ-liệu-mẫu-seeder)
- [Câu hỏi 3: Tại sao Frontend chạy cổng 3000, Backend chạy cổng 5000? Có bị sai không?](#câu-hỏi-3-tại-sao-frontend-chạy-cổng-3000-backend-chạy-cổng-5000-có-bị-sai-không)
- [Câu hỏi 4: Phân biệt Schema và Model trong Mongoose (MongoDB)](#câu-hỏi-4-phân-biệt-schema-và-model-trong-mongoose-mongodb)

---

## ❓ Câu hỏi 1: Mối quan hệ giữa server.js, các file ở folder controllers và routes? Tại sao họ lại đặt tên như vậy?

### 1. Bức tranh toàn cảnh: Mô hình phân lớp (Layered Architecture / MVC)

Trong phát triển Backend với NodeJS/Express, dự án áp dụng nguyên lý **Separation of Concerns (SoC - Phân tách mối quan tâm)**. Hệ thống chia thành các tầng rõ ràng:

```mermaid
graph LR
    Client[Client: Frontend / Postman] -->|1. Gửi HTTP Request| Server[server.js: Cổng vào Entrypoint]
    Server -->|2. Chuyển tiếp /api| Router[api.routes.js: Người chỉ đường]
    Router -->|3. Điều hướng hàm xử lý| Controller[*.controller.js: Người xử lý nghiệp vụ]
    Controller -->|4. Đọc / Ghi| DB[(MongoDB / Database)]
    Controller -->|5. Trả dữ liệu Response| Client
```

---

### 2. Vai trò cụ thể của từng thành phần & Liên kết file

#### 🚪 1. [backend/src/server.js](file:///d:/Giaotrinh/PTIT/07_Ky_1_Nam_4/Iot/backend/src/server.js) — *Cổng vào & Tổng quản lý hệ thống (Entry Point)*
- **Nhiệm vụ**:
  - Khởi tạo Express App, HTTP Server và Socket.io.
  - Cấu hình các Middleware toàn cục (CORS, `express.json()`).
  - Kết nối Database ([database.js](file:///d:/Giaotrinh/PTIT/07_Ky_1_Nam_4/Iot/backend/src/config/database.js)) và khởi động dịch vụ MQTT ([mqtt.service.js](file:///d:/Giaotrinh/PTIT/07_Ky_1_Nam_4/Iot/backend/src/services/mqtt.service.js)).
  - Gắn tiền tố đường dẫn chung: `app.use('/api', apiRoutes)`.
  - Mở cổng `PORT` (mặc định 5000) để lắng nghe request.

#### 🧭 2. [backend/src/routes/api.routes.js](file:///d:/Giaotrinh/PTIT/07_Ky_1_Nam_4/Iot/backend/src/routes/api.routes.js) — *Bản đồ chỉ đường (Routing Layer)*
- **Nhiệm vụ**:
  - Xác định các endpoint URL (`/auth/login`, `/devices`, `/sensor-data`, v.v.) và phương thức HTTP (`GET`, `POST`, `PUT`, `DELETE`).
  - **Không xử lý logic tính toán hay DB** ở đây. Nó chỉ đóng vai trò "người trực ban": Khi có khách bấm chuông ở địa chỉ nào, nó sẽ gọi đúng người phụ trách (Controller tương ứng).

#### 🧠 3. Thư mục [backend/src/controllers/](file:///d:/Giaotrinh/PTIT/07_Ky_1_Nam_4/Iot/backend/src/controllers) — *Bộ não xử lý nghiệp vụ (Business Logic)*
Mỗi file controller phụ trách 1 nhóm chức năng cụ thể:
- [auth.controller.js](file:///d:/Giaotrinh/PTIT/07_Ky_1_Nam_4/Iot/backend/src/controllers/auth.controller.js): Xử lý đăng ký, đăng nhập, mã hóa mật khẩu bcrypt, tạo JWT token.
- [device.controller.js](file:///d:/Giaotrinh/PTIT/07_Ky_1_Nam_4/Iot/backend/src/controllers/device.controller.js): Lấy danh sách thiết bị, gửi lệnh bật/tắt thiết bị qua MQTT và ghi log lịch sử.
- [sensor.controller.js](file:///d:/Giaotrinh/PTIT/07_Ky_1_Nam_4/Iot/backend/src/controllers/sensor.controller.js): Lấy dữ liệu cảm biến mới nhất và lịch sử phục vụ biểu đồ realtime (AreaChart).
- [sensorData.controller.js](file:///d:/Giaotrinh/PTIT/07_Ky_1_Nam_4/Iot/backend/src/controllers/sensorData.controller.js): Tìm kiếm, lọc dữ liệu cảm biến theo khoảng thời gian (Timestamp Filter) & phân trang.
- [actionHistory.controller.js](file:///d:/Giaotrinh/PTIT/07_Ky_1_Nam_4/Iot/backend/src/controllers/actionHistory.controller.js): Tìm kiếm, tra cứu lịch sử bật/tắt thiết bị theo thời gian.
- [profile.controller.js](file:///d:/Giaotrinh/PTIT/07_Ky_1_Nam_4/Iot/backend/src/controllers/profile.controller.js): Lấy thông tin cá nhân của sinh viên / tác giả.

---

### 3. Tại sao họ lại đặt tên như vậy? (Quy ước & Nguồn gốc)

1. **`server.js`**:
   - Tên truyền thống đại diện cho file kịch bản chính tạo ra máy chủ (Web Server).
2. **Hậu tố `.routes.js` (Route = Tuyến đường)**:
   - Bắt nguồn từ thuật ngữ mạng/web routing. Một "Route" là định tuyến ánh xạ giữa một URL + HTTP Method đến một hàm xử lý.
3. **Hậu tố `.controller.js` (Controller = Bộ điều khiển)**:
   - Bắt nguồn từ mẫu thiết kế kinh điển **MVC (Model - View - Controller)**. Controller là nơi "điều khiển" luồng dữ liệu: nhận request từ người dùng, tương tác với Model/Database, xử lý logic và trả về kết quả.
4. **Lợi ích của cách đặt tên này**:
   - **Tường minh**: Nhìn vào đuôi file `auth.controller.js` hay `api.routes.js` là biết ngay vai trò kỹ thuật của file mà không cần mở code ra đọc.
   - **Dễ tìm kiếm & Bảo trì**: Khi muốn sửa đường dẫn API -> vào `routes/`. Khi muốn sửa logic tính toán / validate dữ liệu -> vào `controllers/`.

---

### 4. Ví dụ 1 vòng đời Request thực tế (End-to-End Walkthrough)

Khi người dùng nhấn **"Đăng nhập"** trên màn hình [LoginPage.jsx](file:///d:/Giaotrinh/PTIT/07_Ky_1_Nam_4/Iot/frontend/src/pages/LoginPage.jsx):

1. **Frontend**: Gửi `POST http://localhost:5000/api/auth/login` kèm body `{ email, password }`.
2. **[server.js](file:///d:/Giaotrinh/PTIT/07_Ky_1_Nam_4/Iot/backend/src/server.js)**: Nhận request tại cổng 5000 -> Chuyển vào router với tiền tố `/api`.
3. **[api.routes.js](file:///d:/Giaotrinh/PTIT/07_Ky_1_Nam_4/Iot/backend/src/routes/api.routes.js)**: So khớp endpoint `/auth/login` với phương thức `POST` -> Kích hoạt hàm `login()` trong controller.
4. **[auth.controller.js](file:///d:/Giaotrinh/PTIT/07_Ky_1_Nam_4/Iot/backend/src/controllers/auth.controller.js)**: 
   - Kiểm tra email trong MongoDB.
   - So khớp mật khẩu với hàm băm `bcrypt.compare()`.
   - Sinh JWT Token và gửi phản hồi: `res.json({ token, user })`.
5. **Frontend**: Nhận kết quả và chuyển hướng vào Dashboard.

---

## ❓ Câu hỏi 2: Kết nối Database MongoDB Atlas (Cloud) với Backend và cơ chế nạp dữ liệu mẫu (Seeder)

### 1. Chuỗi kết nối MongoDB Atlas & Cấu hình môi trường ([backend/.env](file:///d:/Giaotrinh/PTIT/07_Ky_1_Nam_4/Iot/backend/.env))
- Chuỗi kết nối dạng ReplicaSet đến cụm máy chủ MongoDB Cloud:
  ```env
  MONGODB_URI=mongodb://van22052k5_db_user:qQlvpgKhJhNs6Jvl@ac-zx6m30j-shard-00-00.u4lk66h.mongodb.net:27017,ac-zx6m30j-shard-00-01.u4lk66h.mongodb.net:27017,ac-zx6m30j-shard-00-02.u4lk66h.mongodb.net:27017/iot_ptit_db?ssl=true&replicaSet=atlas-okq9px-shard-0&authSource=admin&appName=Cluster0
  ```
- **Ý nghĩa các tham số**:
  - `van22052k5_db_user:qQlvpgKhJhNs6Jvl`: Tài khoản & mật khẩu Database User.
  - `ac-zx6m30j-shard-00-xx`: Danh sách 3 node shard trong cụm ReplicaSet của MongoDB Atlas để đảm bảo High Availability (Tính sẵn sàng cao).
  - `/iot_ptit_db`: Tên cơ sở dữ liệu sẽ tự động được khởi tạo trên Atlas.
  - `ssl=true`: Bắt buộc mã hóa đường truyền TLS/SSL khi kết nối lên Cloud.
  - `authSource=admin`: Nơi lưu trữ thông tin xác thực người dùng quản trị.

### 2. Cấu trúc Data Models ([backend/src/models/](file:///d:/Giaotrinh/PTIT/07_Ky_1_Nam_4/Iot/backend/src/models))
Các mô hình dữ liệu Mongoose được đặt thống nhất tại backend để tránh lỗi đa instance của singleton Mongoose:
- [User.model.js](file:///d:/Giaotrinh/PTIT/07_Ky_1_Nam_4/Iot/backend/src/models/User.model.js): Người dùng hệ thống, mã SV, lớp, quyền ADMIN/STUDENT.
- [Device.model.js](file:///d:/Giaotrinh/PTIT/07_Ky_1_Nam_4/Iot/backend/src/models/Device.model.js): Quản lý 4 thiết bị (Đèn 01, Đèn 02, Quạt 01, Quạt 02) và trạng thái kết nối phần cứng.
- [Sensor.model.js](file:///d:/Giaotrinh/PTIT/07_Ky_1_Nam_4/Iot/backend/src/models/Sensor.model.js): 3 cảm biến (Nhiệt độ, Độ ẩm, Ánh sáng) và chân GPIO ESP32.
- [SensorData.model.js](file:///d:/Giaotrinh/PTIT/07_Ky_1_Nam_4/Iot/backend/src/models/SensorData.model.js): Bản ghi chỉ số môi trường theo mốc thời gian (có đánh index `measured_at: -1`).
- [ActionHistory.model.js](file:///d:/Giaotrinh/PTIT/07_Ky_1_Nam_4/Iot/backend/src/models/ActionHistory.model.js): Lịch sử điều khiển bật/tắt thiết bị kèm thời gian độ trễ `latency_ms`.

### 3. Nạp dữ liệu mẫu (Seeder Script: [run-all-seeds.js](file:///d:/Giaotrinh/PTIT/07_Ky_1_Nam_4/Iot/database/seeders/run-all-seeds.js))
Khi chạy lệnh `npm run seed` trong thư mục `database/`:
1. Kết nối trực tiếp tới MongoDB Atlas Cloud.
2. Dọn sạch dữ liệu cũ (`deleteMany({})`).
3. Tạo tài khoản Admin mặc định:
   - **Tài khoản**: `admin`
   - **Mật khẩu**: `admin123`
   - **Họ tên**: `Lương Hải Vân`
   - **Mã SV**: `B23DCAT332`
   - **Lớp**: `D23CQAT02-B`
4. Tạo 3 cảm biến + 4 thiết bị + 100 bản ghi lịch sử đo môi trường + 10 bản ghi lịch sử điều khiển.

---

## ❓ Câu hỏi 3: Tại sao Frontend chạy cổng 3000, Backend chạy cổng 5000? Có bị sai không?

**Trả lời ngắn gọn**: **Hoàn toàn KHÔNG SAI, mà đây là điều BẮT BUỘC trong lập trình web!**

### 1. Bản chất của "Port" (Cổng mạng) là gì?
Hãy tưởng tượng máy tính của bạn (`localhost` / `127.0.0.1`) giống như **một tòa chung cư**, còn **Port (Cổng)** chính là **số phòng**:
- **Một phòng chỉ có thể cho 1 người thuê tại một thời điểm**: Trên cùng 1 máy tính, hai chương trình/ứng dụng **không thể** cùng lắng nghe trên 1 cổng. Nếu cả Frontend và Backend đều cố tình chạy cổng `5000`, hệ điều hành sẽ báo lỗi ngay lập tức: `Error: listen EADDRINUSE: address already in use :::5000`.
- Do đó:
  - **Frontend** nhận "phòng" `3000` (`http://localhost:3000`).
  - **Backend** nhận "phòng" `5000` (`http://localhost:5000`).

### 2. Frontend và Backend là 2 tiến trình độc lập phục vụ 2 mục đích khác nhau

| Tiêu chí | [Frontend (React + Vite)](file:///d:/Giaotrinh/PTIT/07_Ky_1_Nam_4/Iot/frontend/vite.config.js) | [Backend (Node.js Express)](file:///d:/Giaotrinh/PTIT/07_Ky_1_Nam_4/Iot/backend/src/server.js) |
| :--- | :--- | :--- |
| **Port mặc định** | `3000` (hoặc `5173`) | `5000` |
| **Vai trò** | Phục vụ giao diện người dùng (HTML, CSS, JavaScript, React components, Biểu đồ, Icon...). | Phục vụ dữ liệu & logic (Đọc/ghi MongoDB, lắng nghe MQTT ESP32, xác thực JWT...). |
| **Đối tượng truy cập** | **Bạn / Người dùng** mở trên trình duyệt web. | **Frontend** gửi request ngầm (HTTP Ajax/Fetch) để xin dữ liệu. |

### 3. Hai cổng khác nhau thì chúng "nói chuyện" với nhau kiểu gì?

Vì khác cổng, làm sao Frontend ở cổng `3000` lấy được dữ liệu từ Backend ở cổng `5000`? Dự án xử lý bằng 2 cách:

1. **Cấu hình Proxy trong [frontend/vite.config.js](file:///d:/Giaotrinh/PTIT/07_Ky_1_Nam_4/Iot/frontend/vite.config.js#L10-L15)**:
   ```javascript
   // Khi Frontend gọi '/api/...', Vite tự động chuyển tiếp sang Backend ở cổng 5000
   proxy: {
     '/api': {
       target: 'http://localhost:5000',
       changeOrigin: true,
     },
   }
   ```
2. **Cấu hình CORS trong [backend/src/server.js](file:///d:/Giaotrinh/PTIT/07_Ky_1_Nam_4/Iot/backend/src/server.js#L24)**:
   ```javascript
   app.use(cors()); // Cho phép Frontend từ cổng khác gọi API vào Backend mà không bị trình duyệt chặn
   ```

---

## ❓ Câu hỏi 4: Phân biệt Schema và Model trong Mongoose (MongoDB)

Khi làm việc với MongoDB thông qua thư viện **Mongoose**, hai khái niệm **Schema** và **Model** luôn đi liền với nhau nhưng đảm nhận hai vai trò hoàn toàn khác biệt:

```mermaid
graph LR
    Schema[1. Schema: Bản vẽ thiết kế Blueprint] -->|Được truyền vào mongoose.model| Model[2. Model: Công cụ thao tác Constructor]
    Model -->|CRUD: find, create, update, delete| DB[(MongoDB Collection)]
```

### 1. Schema (Bản thiết kế / Khuôn đúc - Blueprint)
- **Bản chất**: Schema là nơi định nghĩa **cấu trúc** của một Document trong MongoDB.
- **Nhiệm vụ**:
  - Khai báo các trường dữ liệu (`fields`) và kiểu dữ liệu (`String`, `Number`, `Boolean`, `Date`...).
  - Thiết lập quy tắc kiểm tra tính hợp lệ (Validation): `required`, `default`, `enum`, `min`, `max`, `trim`.
  - Định nghĩa chỉ mục tìm kiếm (Indexing): ví dụ `index({ measured_at: -1 })` để tăng tốc độ lọc thời gian.
- **Lưu ý quan trọng**: Schema **chỉ là một đối tượng cấu hình trừu tượng trên code**. Bản thân Schema **không thể** trực tiếp kết nối cơ sở dữ liệu hay thực hiện các thao tác CRUD (`find`, `create`, `delete`).

Ví dụ trong [User.model.js](file:///d:/Giaotrinh/PTIT/07_Ky_1_Nam_4/Iot/backend/src/models/User.model.js#L3-L37):
```javascript
// ĐÂY LÀ SCHEMA: Định nghĩa người dùng gồm các trường nào
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String, default: 'Lương Hải Vân' },
  studentCode: { type: String, default: 'B23DCAT332' },
  role: { type: String, enum: ['ADMIN', 'STUDENT'], default: 'STUDENT' }
}, { timestamps: true });
```

---

### 2. Model (Đối tượng thực thi / Bộ điều khiển dữ liệu - Constructor Wrapper)
- **Bản chất**: Model là một **Class (Constructor)** được Mongoose tạo ra từ Schema thông qua hàm `mongoose.model('ModelName', schema)`.
- **Nhiệm vụ**:
  - Đại diện cho một **Collection** thực tế trong MongoDB (Mongoose tự động chuyển tên Model thành dạng số nhiều viết thường, ví dụ: `'User'` ➔ collection `users`, `'Device'` ➔ collection `devices`).
  - Cung cấp toàn bộ các phương thức giao tiếp và thao tác CRUD với MongoDB: `.find()`, `.findOne()`, `.create()`, `.updateOne()`, `.deleteMany()`, `.countDocuments()`...
  - Mỗi một instance của Model được gọi là một **Document** (bản ghi).

Ví dụ trong [auth.controller.js](file:///d:/Giaotrinh/PTIT/07_Ky_1_Nam_4/Iot/backend/src/controllers/auth.controller.js#L26-L35):
```javascript
// 1. Khởi tạo Model từ Schema:
export const User = mongoose.model('User', userSchema);

// 2. Dùng Model để thao tác dữ liệu thực tế:
const user = await User.findOne({ username: 'admin' }); // Tìm kiếm
const newUser = await User.create({ username, password, fullName }); // Thêm mới
```

---

### 3. Bảng so sánh tổng hợp trực quan

| Tiêu chí | 📐 Schema (Bản thiết kế) | 🏗️ Model (Công cụ thực thi) |
| :--- | :--- | :--- |
| **Ẩn dụ đời sống** | **Bản vẽ thiết kế** ngôi nhà trên giấy | **Ngôi nhà thật** đã xây xong để ở và sử dụng |
| **Ẩn dụ OOP** | Định nghĩa cấu trúc lớp (Type Definition / Interface) | Lớp thực thi (Class) chứa các static methods để gọi DB |
| **Cú pháp khởi tạo** | `new mongoose.Schema({ ... })` | `mongoose.model('TenModel', schema)` |
| **Chức năng chính** | Định nghĩa thuộc tính, kiểu dữ liệu, ràng buộc validation, index | Cung cấp hàm CRUD (`.find()`, `.create()`, `.deleteOne()`) |
| **Tương tác với DB?** | ❌ Không thể tương tác trực tiếp với Database | ✅ Trực tiếp đọc/ghi dữ liệu vào MongoDB Collection |
| **Ánh xạ MongoDB** | Không đại diện cho cái gì trên DB | Tương ứng trực tiếp với 1 **Collection** trên MongoDB |

---

### 4. Danh sách các file Model/Schema trong dự án:
- [User.model.js](file:///d:/Giaotrinh/PTIT/07_Ky_1_Nam_4/Iot/backend/src/models/User.model.js) — Quản lý tài khoản, mã sinh viên.
- [Device.model.js](file:///d:/Giaotrinh/PTIT/07_Ky_1_Nam_4/Iot/backend/src/models/Device.model.js) — Quản lý danh sách thiết bị và trạng thái kết nối phần cứng.
- [Sensor.model.js](file:///d:/Giaotrinh/PTIT/07_Ky_1_Nam_4/Iot/backend/src/models/Sensor.model.js) — Quản lý danh mục 3 cảm biến.
- [SensorData.model.js](file:///d:/Giaotrinh/PTIT/07_Ky_1_Nam_4/Iot/backend/src/models/SensorData.model.js) — Lưu trữ dữ liệu đo nhiệt độ, độ ẩm, ánh sáng theo thời gian.
- [ActionHistory.model.js](file:///d:/Giaotrinh/PTIT/07_Ky_1_Nam_4/Iot/backend/src/models/ActionHistory.model.js) — Lưu trữ lịch sử bật/tắt thiết bị và độ trễ phản hồi.
