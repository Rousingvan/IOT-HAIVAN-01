import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, message, Alert } from 'antd';
import { UserOutlined, LockOutlined, ThunderboltFilled } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/api';

const { Title, Text } = Typography;

export default function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await apiService.login(values.username, values.password);
      message.success('Đăng nhập thành công!');
      navigate('/dashboard');
    } catch (err) {
      message.error(err.message || 'Đăng nhập thất bại!');
    } finally {
      setLoading(false);
    }
  };

  return (
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
          maxWidth: 400,
          borderRadius: 12,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
          border: '1px solid #EAECF0',
          background: '#FFFFFF',
        }}
        bodyStyle={{ padding: '32px 28px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
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
            Đăng nhập
          </Text>
        </div>

        <Form
          name="login_form"
          layout="vertical"
          initialValues={{ username: 'admin', password: 'admin123' }}
          onFinish={onFinish}
        >
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

        {/* Chuyển sang Đăng ký */}
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
