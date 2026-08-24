# HƯỚNG DẪN TÙY BIẾN GIAO DIỆN & THÔNG SỐ HỆ THỐNG IOT PTIT

Tài liệu này giúp sinh viên nhanh chóng cá nhân hóa đồ án cho nhóm/cá nhân mình:

---

## 1. Thay Đổi Thông Tin Cá Nhân (Họ Tên, MSSV, Lớp)
* **Frontend:** Mở file [frontend/src/services/api.js](file:///d:/Giaotrinh/PTIT/07_Ky_1_Nam_4/Iot/frontend/src/services/api.js) $\rightarrow$ Sửa hàm `getProfile()`.
* **Database:** Mở file [database/seeders/run-all-seeds.js](file:///d:/Giaotrinh/PTIT/07_Ky_1_Nam_4/Iot/database/seeders/run-all-seeds.js) $\rightarrow$ Sửa thông tin tài khoản admin.
* **Backend:** Mở file [backend/src/controllers/profile.controller.js](file:///d:/Giaotrinh/PTIT/07_Ky_1_Nam_4/Iot/backend/src/controllers/profile.controller.js) $\rightarrow$ Sửa thông tin sinh viên & link GitHub/Figma.

---

## 2. Thay Đổi Màu Sắc Chủ Đạo (Theme Color)
* Mở file [frontend/src/theme/themeConfig.js](file:///d:/Giaotrinh/PTIT/07_Ky_1_Nam_4/Iot/frontend/src/theme/themeConfig.js) $\rightarrow$ Đổi mã màu `colorPrimary` từ Cam `#FA541C` sang màu khác (VD: Xanh dương `#1890FF`, Xanh lá `#52C41A`, Tím `#722ED1`). Toàn bộ giao diện Ant Design sẽ tự động đổi màu theo chỉ với 1 dòng code!

---

## 3. Thay Đổi Ngưỡng Cảnh Báo Nhiệt Độ
* Mở file [frontend/src/pages/DashboardPage.jsx](file:///d:/Giaotrinh/PTIT/07_Ky_1_Nam_4/Iot/frontend/src/pages/DashboardPage.jsx) $\rightarrow$ Tìm giá trị `35` để đổi thành ngưỡng nhiệt độ mong muốn (VD: `38`°C hoặc `40`°C).

---

## 4. Chuyển Đổi Trạng Thái Quạt Sang "Đã Kết Nối" (Khi Lắp Thêm Phần Cứng)
* Mở file [database/seeders/run-all-seeds.js](file:///d:/Giaotrinh/PTIT/07_Ky_1_Nam_4/Iot/database/seeders/run-all-seeds.js) $\rightarrow$ Đổi `is_connected: false` của `FAN_01` thành `true`.
* Chạy lại `npm run seed` $\rightarrow$ Công tắc Quạt trên giao diện sẽ tự động mở khóa (Enable)!
