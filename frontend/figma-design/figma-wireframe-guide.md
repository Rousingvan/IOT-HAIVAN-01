# HƯỚNG DẪN THIẾT KẾ VÀ IMPORT FIGMA (5 MÀN HÌNH BTL IOT PTIT)

Tài liệu này hướng dẫn sinh viên tạo bản thiết kế Figma hoàn chỉnh nộp bài tập lớn và thuyết minh đồ án IoT.

---

## 1. THÔNG SỐ KHUNG THIẾT KẾ (FRAMES)
* **Kích thước chuẩn:** `Desktop 1440 x 900 px`
* **Hệ thống lưới (Layout Grid):**
  - Columns: 12 cột, Gutter: 24px, Margin: 80px.
* **Màu sắc chủ đạo (Orange - White):**
  - Primary Orange: `#FA541C` (Mã màu thương hiệu PTIT)
  - Secondary Light Orange: `#FFF7E6`
  - Accent Yellow (Light): `#FAAD14`
  - Accent Blue (Humid): `#1890FF`
  - Base Background: `#F8F9FA`
  - Card Background: `#FFFFFF`
  - Text: `#262626` (Tiêu đề), `#8C8C8C` (Phụ đề)

---

## 2. DANH SÁCH 5 FRAME TƯƠNG ỨNG 5 USE CASES

### Frame 1: `LoginPage (UC01)`
* **Vị trí:** Căn giữa màn hình (Center Modal Card: 420 x 480 px).
* **Thành phần:**
  - Logo PTIT icon tia sét cam gradient.
  - Form: Input Username (`admin`), Password (`admin123`).
  - Button Submit: Cam `#FA541C` bo góc 8px.
  - Box ghi chú demo tài khoản.

### Frame 2: `DashboardPage (UC02 & UC04)`
* **Header Bar:** Cao 64px, Logo bên trái, Menu ở giữa, User info + Badge "Sẵn Sàng" bên phải.
* **Khối Top (3 Thẻ Cảm Biến):**
  - Thẻ 1: Nhiệt độ 28.5°C (Nền `#FFF7E6`, Border `#FFD591`, Icon Lửa cam).
  - Thẻ 2: Độ ẩm 68.2% (Nền `#E6F7FF`, Border `#91D5FF`, Icon Mây xanh).
  - Thẻ 3: Ánh sáng 520 Lux (Nền `#FFFBE6`, Border `#FFE58F`, Icon Mặt trời vàng).
* **Khối Dưới (Tỉ lệ 2/3 - 1/3):**
  - **Trái (2/3):** Biểu đồ AreaChart Gradient 3 đường sóng mượt mà (Cam, Xanh, Vàng).
  - **Phải (1/3):** Bảng điều khiển `DevicePanel`:
    - Row 1: **Đèn Chiếu Sáng (`LAMP_01`)** - Tag "Đã kết nối (GPIO 26)", Switch ON/OFF cam hoạt động.
    - Row 2: **Quạt Làm Mát (`FAN_01`)** - Tag "Chưa kết nối", Switch disabled màu xám (Cổng mở rộng).

### Frame 3: `DataSensorPage (UC03)`
* **Bộ lọc Variable Time Range Filter (`timestamp.md`):**
  - Start Time: `[ DatePicker ]` `[ Giờ ]` `[ Phút ]` `[ Giây ]`
  - End Time: `[ DatePicker ]` `[ Giờ ]` `[ Phút ]` `[ Giây ]`
  - Nút `[ Lọc Dữ Liệu ]` và `[ Xóa Bộ Lọc ]`.
* **Bảng dữ liệu (Table 6 cột):** STT, Mã Bản Ghi, Nhiệt Độ, Độ Ẩm, Ánh Sáng, Thời Gian Đo Đạc, Phân trang 10/20/50.

### Frame 4: `ActionHistoryPage (UC05)`
* **Bộ lọc thời gian + Dropdown chọn thiết bị (All / Đèn / Quạt).**
* **Bảng lịch sử điều khiển:** STT, Mã Lệnh, Thiết Bị, Hành Động (BẬT/TẮT), Thời Gian Gửi, Thời Gian Nhận ACK, Độ Trễ (`320ms`), Trạng Thái (Badge xanh lá `SUCCESS`).

### Frame 5: `ProfilePage (UC01)`
* **Trái (Card 360px):** Avatar tròn, Họ tên sinh viên, MSSV `B22DCCN001`, Lớp `D22CQCN01-B`, Môn học.
* **Phải (Card 600px):** 4 Khối nút liên kết:
  1. GitHub Repo
  2. Figma Design File
  3. Swagger API Docs
  4. Báo Cáo Đồ Án (PDF)
* **Banner Vàng Cam:** Kịch bản 4 bước mở rộng thêm thiết bị mới khi giảng viên kiểm tra.

---

## 3. CÁCH IMPORT NHANH VÀO FIGMA
1. Mở Figma $\rightarrow$ Tạo file thiết kế mới.
2. Cài đặt plugin **Tokens Studio for Figma** $\rightarrow$ Import file `tokens.json`.
3. Hoặc cài đặt plugin **HTML to Design** $\rightarrow$ Kéo thả file `figma-ui-kit.html` để tự động tạo 5 Frame chuẩn vector pixel-perfect!
