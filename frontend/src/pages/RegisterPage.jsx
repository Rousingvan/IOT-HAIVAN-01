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

/**
 * ==============================================================================
 * TRANG: RegisterPage (Đăng Ký Tài Khoản Sinh Viên)
 * CHỨC NĂNG CHÍNH:
 * - Đăng ký tài khoản mới cho sinh viên: Họ tên, Mã SV, Lớp, Username, Password.
 * - Form Validation mạnh mẽ của Ant Design:
 *     + Bắt buộc nhập đầy đủ các trường (required).
 *     + Độ dài tối thiểu Username (3 ký tự), Password (6 ký tự).
 *     + Khớp mật khẩu xác nhận (Custom validator so sánh password và confirmPassword).
 * - Tự động đăng nhập và chuyển hướng vào Dashboard (`/dashboard`) sau khi đăng ký thành công.
 * 
 * GỢI Ý CÁC TÙY CHỈNH THẦY CÔ CÓ THỂ YÊU CẦU:
 * 1. Thêm trường Email / Số điện thoại vào form.
 * 2. Thay đổi độ dài mật khẩu tối thiểu: sửa min: 6 thành min: 8.
 * 3. Chuyển về trang Đăng nhập sau khi tạo tài khoản thay vì tự động vào Dashboard.
 * ==============================================================================
 */
export default function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // Handler khi submit form đăng ký thành công và hợp lệ
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
      navigate('/dashboard'); // Chuyển thẳng vào trang Dashboard
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
          maxWidth: 480, // Chiều rộng tối đa 480px
          borderRadius: 12,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
          border: '1px solid #EAECF0',
          background: '#FFFFFF',
        }}
        bodyStyle={{ padding: '32px 28px' }}
      >
        {/* PHẦN 1: HEADER TRANG ĐĂNG KÝ */}
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

        {/* PHẦN 2: FORM ĐĂNG KÝ THÔNG TIN */}
        <Form
          form={form}
          name="register_form"
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          {/* Ô nhập Họ và tên */}
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

          {/* Hàng 2 cột: Mã sinh viên + Lớp */}
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

          {/* Ô nhập Tên đăng nhập */}
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

          {/* Hàng 2 cột: Mật khẩu + Xác nhận mật khẩu */}
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
                dependencies={['password']} // Lắng nghe trường 'password' để đối chiếu
                rules={[
                  { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                  ({ getFieldValue }) => ({
                    // Validator kiểm tra 2 mật khẩu có khớp nhau không
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

          {/* Nút Đăng ký tài khoản */}
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

        {/* PHẦN 3: FOOTER CHUYỂN SANG ĐĂNG NHẬP */}
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
