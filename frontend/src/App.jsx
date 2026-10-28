import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, Layout } from 'antd';
import { customTheme } from './theme/themeConfig';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import DashboardPage from './pages/DashboardPage';
import DataSensorPage from './pages/DataSensorPage';
import ActionHistoryPage from './pages/ActionHistoryPage';

const { Content } = Layout;

/**
 * ==============================================================================
 * COMPONENT: MainLayout
 * CHỨC NĂNG:
 * - Layout khung chuẩn của ứng dụng: Bên trái là thanh điều hướng cố định (Sidebar),
 *   bên phải là vùng hiển thị nội dung các trang (Content).
 * - Sử dụng màu nền xám nhẹ hiện đại `#F5F7FA` đồng bộ toàn hệ thống.
 * ==============================================================================
 */
function MainLayout({ children }) {
  return (
    <Layout style={{ minHeight: '100vh', background: '#F5F7FA' }}>
      {/* Sidebar điều hướng bên trái */}
      <Sidebar />
      {/* Khung nội dung chính bên phải */}
      <Layout style={{ background: '#F5F7FA' }}>
        <Content style={{ padding: '24px 28px', minHeight: '100vh', overflowY: 'auto' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}

/**
 * ==============================================================================
 * COMPONENT: App (Root Application Component)
 * CHỨC NĂNG CHÍNH:
 * - Điểm cấu hình trung tâm của toàn bộ ứng dụng Frontend:
 *     1. ConfigProvider: Cung cấp bộ Theme màu sắc cam chủ đạo PTIT (themeConfig).
 *     2. React Router (BrowserRouter): Định tuyến và phân phối URL cho 6 trang:
 *        - /login: Trang đăng nhập
 *        - /register: Trang đăng ký sinh viên
 *        - /dashboard: Trang tổng quan giám sát & điều khiển
 *        - /sensor-data: Trang tra cứu dữ liệu cảm biến
 *        - /action-history: Trang lịch sử bật/tắt thiết bị
 *        - /profile: Trang hồ sơ sinh viên & tài liệu
 *        - *: Fallback tự động điều hướng về /dashboard
 * 
 * GỢI Ý CÁC TÙY CHỈNH THẦY CÔ CÓ THỂ YÊU CẦU:
 * 1. Thêm trang Route mới (VD: /analytics): Thêm <Route path="/analytics" element={<MainLayout><AnalyticsPage /></MainLayout>} />.
 * 2. Bảo vệ Route (Protected Route / PrivateRoute): Bọc component kiểm tra localStorage.getItem('iot_user'), nếu chưa đăng nhập thì redirect về /login.
 * 3. Đổi trang mặc định khi vào web: Sửa Navigate to="/dashboard" thành Navigate to="/login".
 * ==============================================================================
 */
export default function App() {
  return (
    // ConfigProvider: Nạp theme giao diện tùy biến cho toàn bộ Ant Design
    <ConfigProvider theme={customTheme}>
      <Router>
        <Routes>
          {/* Nhóm 1: Trang xác thực không dùng MainLayout */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Nhóm 2: Các trang nghiệp vụ chính có Sidebar */}
          <Route
            path="/dashboard"
            element={
              <MainLayout>
                <DashboardPage />
              </MainLayout>
            }
          />
          <Route
            path="/sensor-data"
            element={
              <MainLayout>
                <DataSensorPage />
              </MainLayout>
            }
          />
          <Route
            path="/action-history"
            element={
              <MainLayout>
                <ActionHistoryPage />
              </MainLayout>
            }
          />
          <Route
            path="/profile"
            element={
              <MainLayout>
                <ProfilePage />
              </MainLayout>
            }
          />

          {/* Nhóm 3: Đường dẫn không tồn tại -> Tự động chuyển về Dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </ConfigProvider>
  );
}
