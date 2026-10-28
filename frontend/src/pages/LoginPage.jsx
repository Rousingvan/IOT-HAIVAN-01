import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, message, Alert } from 'antd';
import { UserOutlined, LockOutlined, ThunderboltFilled } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/api';

const { Title, Text } = Typography;

/**
 * ==============================================================================
 * TRANG: LoginPage (Đăng Nhập Hệ Thống)
 * CHỨC NĂNG CHÍNH:
 * - Xác thực người dùng bằng Tên đăng nhập và Mật khẩu.
 * - Điền sẵn tài khoản mặc định (initialValues: admin / admin123) để demo báo cáo nhanh.
 * - Lưu session vào LocalStorage và chuyển hướng vào Dashboard (`/dashboard`).
 * - Có liên kết chuyển sang trang Đăng ký sinh viên (`/register`).
 * 
 * GỢI Ý CÁC TÙY CHỈNH THẦY CÔ CÓ THỂ YÊU CẦU:
 * 1. Đổi tài khoản demo mặc định: sửa initialValues={{ username: '...', password: '...' }}.
 * 2. Thêm checkbox "Ghi nhớ đăng nhập" (Remember me).
 * 3. Thay đổi giao diện nền: chỉnh background: '#F5F7FA' thành ảnh nền hoặc gradient.
 * 4. Thêm kiểm tra độ dài mật khẩu tối thiểu.
 * ==============================================================================
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Handler khi submit form đăng nhập thành công
  const onFinish = async (values) => {
    setLoading(true);
    try {
      // Gọi API đăng nhập từ apiService
      await apiService.login(values.username, values.password);
      message.success('Đăng nhập thành công!');
      navigate('/dashboard'); // Chuyển hướng vào trang chính Dashboard
    } catch (err) {
      message.error(err.message || 'Đăng nhập thất bại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    // Khung bao toàn màn hình căn giữa Form (minHeight: 100vh, flex center)
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F5F7FA',
        padding: 20,
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 400, // Chiều rộng tối đa 400px
          borderRadius: 12,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
          border: '1px solid #EAECF0',
          background: '#FFFFFF',
        }}
        bodyStyle={{ padding: '32px 28px' }}
      >
        {/* PHẦN 1: HEADER LOGO HỆ THỐNG */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          {/* Icon tia sét màu cam */}
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 10,
              background: '#E05318',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontSize: 24,
              marginBottom: 12,
            }}
          >
            <ThunderboltFilled />
          </div>
          <Title level={3} style={{ margin: 0, color: '#111827', fontWeight: 700, fontSize: 20 }}>
            HỆ THỐNG IOT PTIT
          </Title>
          <Text style={{ color: '#6B7280', fontSize: 11 }}>
            Đăng nhập hệ thống giám sát và điều khiển
          </Text>
        </div>

        {/* PHẦN 2: FORM ĐĂNG NHẬP ANT DESIGN */}
        <Form
          name="login_form"
          layout="vertical"
          initialValues={{ username: 'admin', password: 'admin123' }} // Tài khoản demo sẵn
          onFinish={onFinish}
        >
          {/* Ô nhập Tên đăng nhập */}
          <Form.Item
            label="Tên đăng nhập"
            name="username"
            rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#9CA3AF' }} />}
              placeholder="admin"
              size="large"
            />
          </Form.Item>

          {/* Ô nhập Mật khẩu (dạng ẩn Password) */}
          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#9CA3AF' }} />}
              placeholder="admin123"
              size="large"
            />
          </Form.Item>

          {/* Nút bấm Đăng nhập */}
          <Form.Item style={{ marginTop: 24, marginBottom: 16 }}>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
              style={{
                background: '#E05318',
                borderColor: '#E05318',
                fontWeight: 600,
                height: 42,
                borderRadius: 6,
              }}
            >
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>

        {/* PHẦN 3: FOOTER CHUYỂN SANG ĐĂNG KÝ */}
        <div style={{ textAlign: 'center', marginTop: 16, paddingTop: 16, borderTop: '1px solid #F3F4F6' }}>
          <Text style={{ fontSize: 13, color: '#6B7280' }}>
            Chưa có tài khoản?{' '}
            <Link to="/register" style={{ color: '#E05318', fontWeight: 600 }}>
              Đăng ký tài khoản sinh viên
            </Link>
          </Text>
        </div>

        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <Text style={{ fontSize: 12, color: '#9CA3AF' }}>
            Học viện Công nghệ Bưu chính Viễn thông
          </Text>
        </div>
      </Card>
    </div>
  );
}
