# 📘 TÀI LIỆU KIẾN TRÚC & HƯỚNG DẪN PHÁT TRIỂN FRONTEND (IoT PTIT)

> **Hệ thống Giám sát Môi trường & Điều khiển Thiết bị IoT**  
> Học phần: *IoT và Ứng dụng* – Học viện Công nghệ Bưu chính Viễn thông (PTIT)  
> Công nghệ: **React 18 + Vite + Ant Design 5 + Recharts + Axios + Socket.io**  
> 💡 *Mẹo: Bạn có thể giữ phím `Ctrl` (hoặc `Cmd` trên macOS) và click chuột vào bất kỳ tên file nào dưới đây để mở file đó trực tiếp trong trình soạn thảo.*

---

## 🧭 1. Bức Tranh Toàn Cảnh Của Hệ Thống (Big Picture)

Trong kiến trúc tổng thể của hệ sinh thái IoT 3 tầng:

```
┌────────────────────────────────────────────────────────┐
│ 1. HARDWARE LAYER (ESP32 + DHT22 + LDR + Relay + Fan)   │
└──────────────────────────┬─────────────────────────────┘
                           │ (MQTT / HTTP / Serial)
┌──────────────────────────▼─────────────────────────────┐
│ 2. BACKEND LAYER (Node.js / Express / Socket.io / DB)  │
└──────────────────────────┬─────────────────────────────┘
                           │ (RESTful API & WebSockets)
┌──────────────────────────▼─────────────────────────────┐
│ 3. FRONTEND LAYER (React + Vite + Ant Design) [Ở ĐÂY]  │
└────────────────────────────────────────────────────────┘
```

Frontend đóng vai trò là **Giao diện Trực quan hóa (Dashboard UI)** và **Trung tâm Điều khiển (Control Hub)** cho người dùng cuối và quản trị viên:
1. **Hiển thị Telemetry thời gian thực:** Nhận dữ liệu Nhiệt độ (°C), Độ ẩm (%), Ánh sáng (Lux) từ ESP32 qua WebSocket/Socket.io và cập nhật tức thì lên biểu đồ & thẻ đo.
2. **Cảnh báo an toàn (Safety Alert):** Tự động phát tín hiệu cảnh báo trực quan khi phát hiện nhiệt độ vượt ngưỡng an toàn (ví dụ: > 35°C).
3. **Phân quyền người dùng (Role-Based Access Control - RBAC):**
   - 👑 **Quản trị viên (`ADMIN`):** Toàn quyền giám sát, điều khiển BẬT/TẮT và thêm / sửa / xóa / cấu hình thiết bị.
   - 🎓 **Sinh viên (`STUDENT`):** Được tra cứu dữ liệu cảm biến, xem lịch sử, xem hồ sơ đồ án nhưng **bị hạn chế quyền thêm/sửa/xóa hoặc điều khiển thiết bị**.
4. **Điều khiển thiết bị & Phản hồi ACK:** Gửi lệnh BẬT/TẮT tới Relay phần cứng, theo dõi trạng thái phản hồi và tính toán độ trễ (Latency ms).
5. **Tra cứu & Phân tích chuyên sâu:** Hỗ trợ bộ lọc thời gian đa cấp độ (Ngày/Giờ/Phút/Giây), chọn lọc thông số đo đạc động, phân trang dữ liệu và vẽ biểu đồ biến động theo lịch sử.
6. **Hồ sơ đồ án & Minh chứng:** Trưng bày thông tin sinh viên thực hiện, liên kết mã nguồn GitHub, bản vẽ Figma, tài liệu Swagger và báo cáo BTL.

---

## 📁 2. Cấu Trúc Thư Mục & Ý Nghĩa Chi Tiết Từng File

*(Click chuột kèm giữ phím `Ctrl` để mở nhanh file tương ứng)*

### 🎨 Thư mục Thiết kế UI/UX (`figma-design/`)
- [**`figma-design/figma-ui-kit.html`**](./figma-design/figma-ui-kit.html) — Giao diện HTML xem nhanh bộ UI Kit, bảng màu sắc và typography tiêu chuẩn.
- [**`figma-design/figma-wireframe-guide.md`**](./figma-design/figma-wireframe-guide.md) — Tài liệu hướng dẫn Wireframe, hệ thống lưới bố cục và luồng trải nghiệm người dùng.
- [**`figma-design/tokens.json`**](./figma-design/tokens.json) — Bộ Design Tokens dạng JSON chứa mã màu HSL/HEX, kích thước khoảng cách, bo góc.

---

### 🧩 Thư mục Thành Phần Giao Diện Dùng Chung (`src/components/`)
- [**`src/components/AlertBanner.jsx`**](./src/components/AlertBanner.jsx) — Banner cảnh báo đỏ nổi bật xuất hiện ở đầu Dashboard khi nhiệt độ phòng vượt mức an toàn (> 35°C).
- [**`src/components/DevicePanel.jsx`**](./src/components/DevicePanel.jsx) — Bảng điều khiển công tắc Relay (Bật/Tắt Đèn, Quạt), hỗ trợ phân loại tab, phân quyền ADMIN vs Sinh viên, popup chi tiết vị trí phòng và modal xác nhận thành công.
- [**`src/components/SensorAreaChart.jsx`**](./src/components/SensorAreaChart.jsx) — Biểu đồ miền diện tích (AreaChart Recharts) trực quan hóa biến động 3 thông số cảm biến theo thời gian thực (20 chu kỳ đo đạc gần nhất).
- [**`src/components/SensorCard.jsx`**](./src/components/SensorCard.jsx) — Thẻ đo hiển thị giá trị số lớn của Nhiệt độ (°C), Độ ẩm (%), Ánh sáng (Lux) cùng badge trạng thái và đổi màu cảnh báo.
- [**`src/components/Sidebar.jsx`**](./src/components/Sidebar.jsx) — Thanh điều hướng cố định bên trái màn hình (Brand Logo, Menu chuyển trang, thông tin người dùng, Tag quyền hạn `ADMIN`/`STUDENT` và nút Đăng xuất).
- [**`src/components/VariableTimeRangeFilter.jsx`**](./src/components/VariableTimeRangeFilter.jsx) — Thanh công cụ lọc thời gian đa cấp độ chuẩn `timestamp.md` (chọn ngày, giờ, phút, giây kèm kiểm tra tính liên tục và tính toán granularity).

---

### 📄 Thư mục Các Màn Hình Chính (`src/pages/`)
- [**`src/pages/DashboardPage.jsx`**](./src/pages/DashboardPage.jsx) — Trang tổng quan thời gian thực: phối hợp 3 thẻ SensorCard, biểu đồ SensorAreaChart, DevicePanel điều khiển và AlertBanner.
- [**`src/pages/DataSensorPage.jsx`**](./src/pages/DataSensorPage.jsx) — Trang tra cứu lịch sử đo cảm biến: tích hợp bộ lọc thời gian, checkbox lọc loại thông số (Temp/Humid/Light), bảng phân trang và biểu đồ xu hướng theo bộ lọc.
- [**`src/pages/ActionHistoryPage.jsx`**](./src/pages/ActionHistoryPage.jsx) — Trang nhật ký thao tác thiết bị: tra cứu lệnh Bật/Tắt, theo dõi thời gian gửi, thời gian nhận phản hồi, độ trễ ACK và trạng thái thành công/timeout.
- [**`src/pages/ProfilePage.jsx`**](./src/pages/ProfilePage.jsx) — Trang hồ sơ sinh viên: hiển thị thông tin học phần, tải ảnh đại diện từ máy / dán link URL và 4 nút liên kết trực tiếp tới GitHub Repo, Figma Design, Swagger API Docs và File Báo cáo BTL (PDF).
- [**`src/pages/LoginPage.jsx`**](./src/pages/LoginPage.jsx) — Trang đăng nhập hệ thống hỗ trợ cả tài khoản Admin mặc định và tài khoản Sinh viên đã đăng ký.
- [**`src/pages/RegisterPage.jsx`**](./src/pages/RegisterPage.jsx) — Trang đăng ký tài khoản sinh viên với form validation đầy đủ các trường (Họ tên, Mã SV, Lớp, Tên đăng nhập, Mật khẩu).

---

### ⚙️ Thư mục Dịch Vụ & Kết Nối Backend (`src/services/`)
- [**`src/services/api.js`**](./src/services/api.js) — Cấu hình Axios Client, khai báo toàn bộ hàm gọi REST API (`/auth/login`, `/auth/register`, `/devices`, `/sensors`, `/action-history`) cùng bộ dữ liệu giả lập (Mock Database) khi chạy độc lập không cần Backend.
- [**`src/services/socket.js`**](./src/services/socket.js) — Khởi tạo kết nối Socket.io Client với máy chủ WebSocket để nhận dữ liệu telemetry và sự kiện trạng thái thiết bị thời gian thực.

---

### 🎨 Thư mục Cấu Hình Giao Diện (`src/theme/`)
- [**`src/theme/themeConfig.js`**](./src/theme/themeConfig.js) — Khai báo Ant Design Theme Token: màu cam đất chủ đạo (`#E05318`), font chữ Inter, màu nền layout, bo góc và tùy biến giao diện Table, Card, Button, Menu.

---

### 🌐 Các File Cấu Hình & Điểm Khởi Chạy Gốc
- [**`src/App.jsx`**](./src/App.jsx) — Khung điều hướng trung tâm (React Router), bố cục `MainLayout` (gồm Sidebar cố định) và bọc `ConfigProvider` giao diện.
- [**`src/main.jsx`**](./src/main.jsx) — Điểm khởi chạy React DOM, gắn ứng dụng vào `#root`.
- [**`src/index.css`**](./src/index.css) — CSS toàn cục: reset style, định nghĩa thanh cuộn custom scrollbar, hiệu ứng hover, shadow và glassmorphism.
- [**`index.html`**](./index.html) — HTML template gốc: khai báo tiêu đề trang, Favicon và nhúng Google Fonts Inter.
- [**`package.json`**](./package.json) — Quản lý danh sách thư viện phụ thuộc (Antd, Recharts, Axios, Dayjs, Socket.io...) và các script chạy lệnh (`dev`, `build`, `preview`).
- [**`vite.config.js`**](./vite.config.js) — Cấu hình trình biên dịch Vite và plugin React.

---

## 🛠️ 3. Cẩm Nang Tra Cứu: "Muốn Chỉnh Gì - Sửa Ở Đâu?"

Bảng tra cứu giúp bạn tìm ngay file cần chỉnh sửa chỉ bằng thao tác **`Ctrl + Click`** vào tên file:

| Nhu Cầu / Tính Năng Cần Thay Đổi | File Cần Mở Chỉnh Sửa | Hướng Dẫn Chi Tiết |
| :--- | :--- | :--- |
| **Đổi màu chủ đạo, font chữ, bo góc toàn hệ thống** | [**`src/theme/themeConfig.js`**](./src/theme/themeConfig.js) | Sửa thuộc tính `colorPrimary` (mặc định `#E05318`), `fontFamily`, `borderRadius` hoặc component token cho Card, Table, Menu. |
| **Đổi URL Server Backend hoặc WebSocket** | [**`src/services/api.js`**](./src/services/api.js)<br>[**`src/services/socket.js`**](./src/services/socket.js) | Chỉnh sửa hằng số `API_BASE_URL` (`http://localhost:5000/api`) và `SOCKET_URL` (`http://localhost:5000`) hoặc qua biến môi trường `.env`. |
| **Chỉnh sửa form đăng ký tài khoản sinh viên** | [**`src/pages/RegisterPage.jsx`**](./src/pages/RegisterPage.jsx) | Thêm/sửa các trường nhập liệu trong Form (Họ tên, Mã SV, Lớp, Mật khẩu) và các rule validation. |
| **Thay đổi quy tắc phân quyền (Admin vs Sinh viên)** | [**`src/components/DevicePanel.jsx`**](./src/components/DevicePanel.jsx)<br>[**`src/components/Sidebar.jsx`**](./src/components/Sidebar.jsx) | Kiểm tra `user.role === 'ADMIN'` để khóa/mở các tính năng điều khiển, thêm/sửa/xóa thiết bị hoặc hiển thị Tag tương ứng. |
| **Thêm / Bớt / Đổi tên thiết bị Relay (Đèn, Quạt, Bơm...)** | [**`src/services/api.js`**](./src/services/api.js)<br>[**`src/components/DevicePanel.jsx`**](./src/components/DevicePanel.jsx) | Sửa mảng `mockDevices` (mã `device_code`, vị trí phòng, chân GPIO, trạng thái `is_connected`) và sửa icon tương ứng trong `renderDeviceIcon`. |
| **Thay đổi ngưỡng cảnh báo nhiệt độ (Alert)** | [**`src/pages/DashboardPage.jsx`**](./src/pages/DashboardPage.jsx)<br>[**`src/components/AlertBanner.jsx`**](./src/components/AlertBanner.jsx) | Sửa điều kiện so sánh `temperature > 35` thành ngưỡng bạn mong muốn và sửa câu thông báo trong `AlertBanner.jsx`. |
| **Đổi chu kỳ giả lập / Polling dữ liệu cảm biến** | [**`src/pages/DashboardPage.jsx`**](./src/pages/DashboardPage.jsx) | Sửa số milliseconds trong hàm `setInterval(..., 5000)` (mặc định 5000ms = 5 giây). |
| **Thêm / Xóa / Đổi thứ tự MenuItem trên Sidebar** | [**`src/components/Sidebar.jsx`**](./src/components/Sidebar.jsx) | Chỉnh sửa danh sách đối tượng trong mảng `navItems` (key route, icon Antd, tiêu đề link). |
| **Thêm một Trang (Route) mới vào hệ thống** | [**`src/App.jsx`**](./src/App.jsx) | Import component trang mới và thêm thẻ `<Route path="/duong-dan" element={<MainLayout><TrangMoi /></MainLayout>} />`. |
| **Sửa thông tin sinh viên, lớp, thầy hướng dẫn, link đồ án** | [**`src/services/api.js`**](./src/services/api.js)<br>[**`src/pages/ProfilePage.jsx`**](./src/pages/ProfilePage.jsx) | Sửa dữ liệu trả về trong hàm `getProfile` (Họ tên, Mã SV, Lớp, đường dẫn GitHub, Figma, Swagger, File Báo cáo). |
| **Chỉnh sửa các cột hoặc cách tính toán trên Bảng Cảm Biến** | [**`src/pages/DataSensorPage.jsx`**](./src/pages/DataSensorPage.jsx) | Chỉnh sửa mảng `columns` trong `useMemo` (thêm sorter, tùy biến cách render số thập phân hoặc icon). |
| **Thay đổi quy tắc lọc thời gian (Ngày/Giờ/Phút/Giây)** | [**`src/components/VariableTimeRangeFilter.jsx`**](./src/components/VariableTimeRangeFilter.jsx) | Tùy biến hàm `calculateGranularity` hoặc logic kiểm tra tính liên tục của mốc thời gian bắt đầu và kết thúc. |
| **Tùy chỉnh biểu đồ Recharts (Màu dải Gradient, chiều cao)** | [**`src/components/SensorAreaChart.jsx`**](./src/components/SensorAreaChart.jsx)<br>[**`src/pages/DataSensorPage.jsx`**](./src/pages/DataSensorPage.jsx) | Sửa các thẻ `<Area>`, `<linearGradient>`, mã màu stroke, fillOpacity hoặc chiều cao của `<ResponsiveContainer>`. |
| **Tùy chỉnh CSS Scrollbar, hiệu ứng Hover, Glassmorphism** | [**`src/index.css`**](./src/index.css) | Chỉnh sửa các class CSS như `.glass-card`, `::-webkit-scrollbar`, `.glow-active`. |

---

## 🚀 4. Hướng Dẫn Cài Đặt & Khởi Chạy

### Yêu cầu môi trường
- **Node.js**: Phiên bản 18.x trở lên.
- **npm** hoặc **yarn** / **pnpm**.

### Các lệnh thực thi

```bash
# 1. Di chuyển vào thư mục frontend
cd frontend

# 2. Cài đặt các gói thư viện phụ thuộc
npm install

# 3. Khởi chạy môi trường phát triển (Development Server)
npm run dev

# 4. Đóng gói ứng dụng cho môi trường Production
npm run build

# 5. Xem trước bản đóng gói Production
npm run preview
```

Ứng dụng sẽ chạy tại địa chỉ mặc định: `http://localhost:5173/` (hoặc cổng hiển thị trên Terminal).

### Tài khoản trải nghiệm:
- **Tài khoản Quản trị viên (Toàn quyền):**
  - Username: `admin`
  - Password: `admin123`
- **Tài khoản Sinh viên (Chế độ chỉ xem):**
  - Bạn có thể bấm vào link **"Đăng ký tài khoản sinh viên"** tại trang Đăng nhập để tạo tài khoản mới.
