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

// Layout chính với Sidebar bên trái, không có Footer
function MainLayout({ children }) {
  return (
    <Layout style={{ minHeight: '100vh', background: '#F5F7FA' }}>
      <Sidebar />
      <Layout style={{ background: '#F5F7FA' }}>
        <Content style={{ padding: '24px 28px', minHeight: '100vh', overflowY: 'auto' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}

export default function App() {
  return (
    <ConfigProvider theme={customTheme}>
      <Router>
        <Routes>
          {/* Đăng nhập & Đăng ký */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Các trang chính */}
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

          {/* Mặc định */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </ConfigProvider>
  );
}
