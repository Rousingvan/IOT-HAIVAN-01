import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, message, Row, Col } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  IdcardOutlined,
  BookOutlined,
  SmileOutlined,
  ThunderboltFilled,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/api';

const { Title, Text } = Typography;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await apiService.register({
        username: values.username,
        password: values.password,
        fullName: values.fullName,
        studentCode: values.studentCode,
        className: values.className,
      });
      message.success('Đăng ký tài khoản thành công! Đang chuyển hướng vào hệ thống...');
      navigate('/dashboard');
    } catch (err) {
      message.error(err.message || 'Đăng ký thất bại!');
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
        padding: '32px 16px',
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 480,
          borderRadius: 12,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
          border: '1px solid #EAECF0',
          background: '#FFFFFF',
        }}
        bodyStyle={{ padding: '32px 28px' }}
      >
        {/* Header */}
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
            ĐĂNG KÝ TÀI KHOẢN SINH VIÊN
          </Title>
          <Text style={{ color: '#6B7280', fontSize: 13 }}>
            Tạo tài khoản để giám sát và tra cứu dữ liệu hệ thống IoT PTIT
          </Text>
        </div>

        {/* Form Đăng ký */}
        <Form
          form={form}
          name="register_form"
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            label="Họ và tên sinh viên"
            name="fullName"
            rules={[{ required: true, message: 'Vui lòng nhập họ và tên!' }]}
          >
            <Input
              prefix={<SmileOutlined style={{ color: '#9CA3AF' }} />}
              placeholder="Ví dụ: Lương Hải Vân"
              size="large"
            />
          </Form.Item>

          <Row gutter={12}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Mã sinh viên"
                name="studentCode"
                rules={[{ required: true, message: 'Vui lòng nhập mã sinh viên!' }]}
              >
                <Input
                  prefix={<IdcardOutlined style={{ color: '#9CA3AF' }} />}
                  placeholder="Ví dụ: B23DCAT332"
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Lớp sinh hoạt"
                name="className"
                rules={[{ required: true, message: 'Vui lòng nhập lớp!' }]}
              >
                <Input
                  prefix={<BookOutlined style={{ color: '#9CA3AF' }} />}
                  placeholder="Ví dụ: D23CQAT02-B"
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Tên đăng nhập"
            name="username"
            rules={[
              { required: true, message: 'Vui lòng nhập tên đăng nhập!' },
              { min: 3, message: 'Tên đăng nhập tối thiểu 3 ký tự!' },
            ]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#9CA3AF' }} />}
              placeholder="vanluong"
              size="large"
            />
          </Form.Item>

          <Row gutter={12}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Mật khẩu"
                name="password"
                rules={[
                  { required: true, message: 'Vui lòng nhập mật khẩu!' },
                  { min: 6, message: 'Mật khẩu tối thiểu 6 ký tự!' },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#9CA3AF' }} />}
                  placeholder="••••••••"
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Xác nhận mật khẩu"
                name="confirmPassword"
                dependencies={['password']}
                rules={[
                  { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#9CA3AF' }} />}
                  placeholder="••••••••"
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginTop: 12, marginBottom: 16 }}>
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
              Đăng ký tài khoản
            </Button>
          </Form.Item>
        </Form>

        {/* Chuyển sang trang Đăng nhập */}
        <div style={{ textAlign: 'center', marginTop: 16, paddingTop: 16, borderTop: '1px solid #F3F4F6' }}>
          <Text style={{ fontSize: 13, color: '#6B7280' }}>
            Đã có tài khoản?{' '}
            <Link to="/login" style={{ color: '#E05318', fontWeight: 600 }}>
              Đăng nhập ngay
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
