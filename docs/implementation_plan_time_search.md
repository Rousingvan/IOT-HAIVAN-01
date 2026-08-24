# Kế hoạch chuyển đổi bộ lọc thời gian: Từ 2 mốc (Start/End) sang 1 ô String Search duy nhất

Tài liệu này trình bày kế hoạch tái cấu trúc tính năng tra cứu thời gian cho dữ liệu cảm biến (UC03) và lịch sử thao tác (UC05). Thay vì sử dụng bộ lọc phức tạp gồm 2 mốc bắt đầu (`Start Time`) và kết thúc (`End Time`) với các dropdown giờ/phút/giây, hệ thống sẽ chuyển sang **1 ô Input nhập chuỗi ký tự (String) duy nhất** khớp với định dạng hiển thị trong bảng thống kê (`DD/MM/YYYY HH:mm:ss` hoặc `YYYY-MM-DD HH:mm:ss`).

---

## 1. Đánh giá mức độ ảnh hưởng đến hệ thống tổng quan

> [!NOTE]
> **Mức độ ảnh hưởng tổng quan: THẤP / CỤC BỘ (LOW / ISOLATED IMPACT)**
> Thay đổi này chỉ tác động đến **tính năng tra cứu lịch sử** (UC03 và UC05). Toàn bộ luồng phần cứng IoT, MQTT Telemetry, Realtime Socket.io, Điều khiển thiết bị và Xác thực tài khoản **hoàn toàn không bị ảnh hưởng**.

### Bảng phân tích phạm vi ảnh hưởng

| Phân hệ / Tính năng | Mức độ ảnh hưởng | Chi tiết tác động |
| :--- | :---: | :--- |
| **Phần cứng ESP32 & MQTT Broker** | **KHÔNG** (0%) | Vẫn gửi telemetry định kỳ và nhận lệnh bật/tắt thiết bị bình thường qua MQTT. |
| **Realtime Dashboard & Biểu đồ diện tích (UC02)** | **KHÔNG** (0%) | Vẫn nhận sự kiện WebSocket và hiển thị 3 Card chỉ số + AreaChart 20 điểm gần nhất. |
| **Điều khiển thiết bị Relay (UC04)** | **KHÔNG** (0%) | Vẫn gửi HTTP POST toggle và nhận phản hồi ACK như cũ. |
| **Xác thực & Hồ sơ cá nhân (UC01)** | **KHÔNG** (0%) | Luồng Login, Register, Profile không liên quan đến bộ lọc. |
| **Tra cứu Dữ liệu cảm biến (UC03)** | **TRỰC TIẾP** (100%) | Đơn giản hóa giao diện: Thay 8 ô chọn thành 1 ô Input String. |
| **Tra cứu Lịch sử điều khiển (UC05)** | **TRỰC TIẾP** (100%) | Đơn giản hóa giao diện: Đồng bộ dùng chung 1 ô Input String. |
| **Backend Query API & Database Helper** | **TRỰC TIẾP** (Vừa phải) | Cập nhật hàm phân tích chuỗi tìm kiếm thời gian sang MongoDB query. |

---

## 2. Danh sách các file cần chỉnh sửa

### 2.1. Backend (Node.js & MongoDB)
1. **[MODIFY] `backend/src/utils/timeRangeHelper.js`** (hoặc tạo thêm `timeSearchHelper.js`):
   - Thay thế/Bổ sung hàm `buildTimeStringQuery(searchTime)`:
     - Tiếp nhận chuỗi `searchTime` (ví dụ: `"2026-08-19"`, `"19/08/2026"`, `"15:30"`, `"19/08/2026 15:30:25"`, `"2026-08"`).
     - Hỗ trợ cả 2 cơ chế linh hoạt:
       1. **Tìm kiếm theo định dạng chuỗi (String Regex via `$dateToString` MongoDB Aggregation / `$expr`)**: Khớp chuỗi trực tiếp trên định dạng hiển thị `DD/MM/YYYY HH:mm:ss` (múi giờ `+07:00`).
       2. **Parse mốc thời gian tự động sang khoảng `$gte` - `$lte`**: Nếu chuỗi là định dạng chuẩn (ngày, ngày + giờ, ngày + giờ + phút, full giây) thì sinh khoảng Date tương ứng để tối ưu index.
2. **[MODIFY] `backend/src/controllers/sensorData.controller.js`**:
   - Nhận query params: `const { searchTime, page = 1, pageSize = 10 } = req.query;`
   - Gọi `buildTimeStringQuery(searchTime)` áp dụng vào `measured_at`.
3. **[MODIFY] `backend/src/controllers/actionHistory.controller.js`**:
   - Nhận query params: `const { deviceCode, searchTime, page = 1, pageSize = 10 } = req.query;`
   - Gọi `buildTimeStringQuery(searchTime)` áp dụng vào `command_time`.

### 2.2. Frontend (React & Ant Design)
1. **[MODIFY / NEW] `frontend/src/components/VariableTimeRangeFilter.jsx`** (hoặc đổi tên thành `TimeSearchFilter.jsx`):
   - Đơn giản hóa toàn bộ UI:
     - Gồm 1 ô `Input.Search` (hoặc `Input` + nút `Lọc / Tìm kiếm` + nút `Làm mới`).
     - Placeholder rõ ràng: `VD: 19/08/2026, 15:30, 2026-08-19 15:30:20...`
     - Xóa bỏ các Select giờ, phút, giây và DatePicker 2 mốc phức tạp.
2. **[MODIFY] `frontend/src/pages/DataSensorPage.jsx`**:
   - Cập nhật state `filterParams`: lưu `{ searchTime }`.
   - Cập nhật hàm `handleFilter(searchTime)` và `handleReset()`.
   - Biểu đồ minh họa bên dưới và bảng Ant Table vẫn đồng bộ hiển thị dữ liệu trả về từ API.
3. **[MODIFY] `frontend/src/pages/ActionHistoryPage.jsx`**:
   - Tương tự `DataSensorPage.jsx`, tích hợp ô tìm kiếm thời gian dạng string kèm bộ lọc `deviceCode`.
4. **[MODIFY] `frontend/src/services/api.js`**:
   - Cập nhật hàm `querySensorData` và `queryActionHistory` (truyền param `searchTime`).
   - Cập nhật logic lọc client-side trên mock data: Lọc chuỗi con trên `dayjs(item.measured_at).format('DD/MM/YYYY HH:mm:ss')` và `item.measured_at`.

### 2.3. Tài liệu báo cáo & Đặc tả (Docs & Reports)
1. **[MODIFY] `report/UC03_Sensor_Data_Query/UC03_Tra_Cuu_Loc_Du_Lieu_Cam_Bien.md`**:
   - Cập nhật mục 3 Mô tả luồng nghiệp vụ (bảng bước 5 & 7 từ nhập 2 mốc sang nhập chuỗi thời gian).
   - Cập nhật Sequence Diagram và tham số query API (`searchTime`).
2. **[MODIFY] `report/UC05_Action_History/UC05_Tra_Cuu_Lich_Su_Dieu_Khien.md`**:
   - Cập nhật đặc tả Use Case tương ứng.
3. **[MODIFY] `report/API_Specification.md`**:
   - Cập nhật tài liệu API endpoint `/api/sensor-data` và `/api/action-history`.

---

## 3. Thiết kế giải pháp kỹ thuật chi tiết

### 3.1. Phân tích chuỗi tìm kiếm thời gian (Backend)

Khi người dùng nhập chuỗi thời gian vào 1 ô duy nhất, hệ thống hỗ trợ 2 trường hợp:

#### Trường hợp 1: Nhập ngày/giờ/phút/giây có thể parse được (Ví dụ: `19/08/2026`, `2026-08-19 14:30`)
- Tự động nhận diện mức độ chi tiết (Granularity):
  - Nhập ngày `DD/MM/YYYY` hoặc `YYYY-MM-DD` $\rightarrow$ Query từ `00:00:00` đến `23:59:59` của ngày đó.
  - Nhập ngày + giờ `19/08/2026 14` $\rightarrow$ Query từ `14:00:00` đến `14:59:59`.
  - Nhập ngày + giờ + phút `19/08/2026 14:30` $\rightarrow$ Query từ `14:30:00` đến `14:30:59`.
  - Nhập đủ giây `19/08/2026 14:30:25` $\rightarrow$ Query từ `14:30:25.000` đến `14:30:25.999`.

#### Trường hợp 2: Nhập chuỗi con bất kỳ (Ví dụ: `14:30`, `08/2026`, `2026`)
- Dùng MongoDB `$expr` kết hợp `$dateToString` và `$regexMatch`:
```javascript
{
  $expr: {
    $regexMatch: {
      input: {
        $dateToString: {
          format: "%d/%m/%Y %H:%M:%S",
          date: "$measured_at",
          timezone: "+07:00"
        }
      },
      regex: searchTime.trim(),
      options: "i"
    }
  }
}
```
> Cách tiếp cận này đáp ứng hoàn hảo yêu cầu: **"format hiển thị ở trong bảng thống kê như thế nào thì tìm kiếm khớp chuỗi theo đúng format đó"**.

---

## 4. Kế hoạch kiểm thử & Xác thực (Verification Plan)

### Kiểm thử thủ công (Manual Verification)
1. **Test Case 1 - Tìm kiếm theo ngày**: Nhập `19/08/2026` hoặc `2026-08-19` $\rightarrow$ Bảng trả về toàn bộ dữ liệu trong ngày 19/08/2026.
2. **Test Case 2 - Tìm kiếm theo giờ/phút**: Nhập `15:30` $\rightarrow$ Bảng trả về các bản ghi đo vào lúc 15:30 của bất kỳ ngày nào (hoặc kèm ngày).
3. **Test Case 3 - Tìm kiếm chính xác đến giây**: Nhập chuỗi đầy đủ `19/08/2026 15:30:45` $\rightarrow$ Trả về đúng bản ghi khớp thời gian.
4. **Test Case 4 - Tìm kiếm không khớp**: Nhập chuỗi không tồn tại $\rightarrow$ Trả về bảng rỗng (`total: 0`), hiển thị thông báo "Không tìm thấy dữ liệu".
5. **Test Case 5 - Phân trang**: Chuyển sang trang 2 hoặc đổi kích thước trang (20, 50 bản ghi) $\rightarrow$ Kết quả vẫn giữ nguyên từ khóa tìm kiếm thời gian.
6. **Test Case 6 - Nút Làm mới / Xóa từ khóa**: Nhấn Xóa/Làm mới $\rightarrow$ Bảng tự động tải lại toàn bộ bản ghi mới nhất.
