import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Typography, Space, Avatar, Tag } from 'antd';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  DashboardOutlined,
  DatabaseOutlined,
  HistoryOutlined,
  UserOutlined,
  LogoutOutlined,
  HomeFilled,
} from '@ant-design/icons';

const { Sider } = Layout;
const { Text } = Typography;

/**
 * ==============================================================================
 * COMPONENT: Sidebar
 * CHỨC NĂNG:
 * - Thanh điều hướng dọc (Navigation Sider) cố định bên trái toàn bộ ứng dụng.
 * - Hiển thị Logo thương hiệu "IoT PTIT" và hệ thống menu chuyển trang (React Router).
 * - Tự động đồng bộ ảnh đại diện sinh viên (Avatar) khi người dùng cập nhật trong Profile.
 * - Khối chân trang (Footer) hiển thị Tên, Quyền hạn (Admin/Sinh viên) và nút Đăng xuất.
 * 
 * GỢI Ý CÁC TÙY CHỈNH THẦY CÔ CÓ THỂ YÊU CẦU:
 * 1. Đổi chiều rộng Sidebar: sửa width={240} thành width={260} hoặc 200.
 * 2. Đổi màu Logo / Theme nền tối (Dark mode): đổi background: '#001529' và theme="dark" trong <Menu>.
 * 3. Thêm mục Menu mới: thêm phần tử vào mảng navItems (VD: Trang Cài đặt / Báo cáo).
 * 4. Đổi icon menu: thay thế các icon Ant Design trong navItems.
 * ==============================================================================
 */
export default function Sidebar() {
  const location = useLocation(); // Lấy đường dẫn URL hiện tại để active đúng mục menu
  const navigate = useNavigate(); // Hook chuyển trang

  // State lưu trữ URL ảnh đại diện sinh viên lấy từ LocalStorage
  const [avatar, setAvatar] = useState(localStorage.getItem('iot_student_avatar') || '');

  // Đọc thông tin người dùng đang đăng nhập từ LocalStorage
  const user = JSON.parse(
    localStorage.getItem('iot_user') || '{"fullName":"Lương Hải Vân","studentCode":"B23DCAT332","role":"ADMIN"}'
  );

  // useEffect: Lắng nghe sự kiện custom 'avatar_updated' để cập nhật avatar tức thời khi đổi ảnh ở trang Profile
  useEffect(() => {
    const handleAvatarUpdate = () => {
      setAvatar(localStorage.getItem('iot_student_avatar') || '');
    };
    window.addEventListener('avatar_updated', handleAvatarUpdate);
    return () => window.removeEventListener('avatar_updated', handleAvatarUpdate);
  }, []);

  // Hàm xử lý đăng xuất: Xóa session khỏi LocalStorage và chuyển về trang /login
  const handleLogout = () => {
    localStorage.removeItem('iot_user');
    navigate('/login');
  };

  // Danh sách các mục điều hướng Menu chính
  const navItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined style={{ fontSize: 16 }} />,
      label: <Link to="/dashboard">Tổng quan</Link>,
    },
    {
      key: '/sensor-data',
      icon: <DatabaseOutlined style={{ fontSize: 16 }} />,
      label: <Link to="/sensor-data">Tra cứu dữ liệu</Link>,
    },
    {
      key: '/action-history',
      icon: <HistoryOutlined style={{ fontSize: 16 }} />,
      label: <Link to="/action-history">Lịch sử điều khiển</Link>,
    },
    {
      key: '/profile',
      icon: <UserOutlined style={{ fontSize: 16 }} />,
      label: <Link to="/profile">Hồ sơ sinh viên</Link>,
    },
  ];

  const isAdmin = user.role === 'ADMIN';

  return (
    // Sider: Thanh cột trái của Ant Design Layout
    <Sider
      width={280} // Chiều rộng cố định 240px
      style={{
        background: '#FFFFFF',
        borderRight: '1px solid #EAECF0',
        height: '100vh', // Chiều cao toàn màn hình
        position: 'sticky', // Cố định vị trí khi cuộn trang
        top: 0,
        left: 0,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '1px 0 6px rgba(0, 0, 0, 0.03)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '16px 12px' }}>
        {/* PHẦN 1: HEADER LOGO THƯƠNG HIỆU */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 12px 20px 12px',
            borderBottom: '1px solid #F2F4F7',
            marginBottom: 16,
          }}
        >
          {/* Icon tia sét màu cam nền vuông */}
          <div
            style={{
              width: 68,
              height: 48,
              borderRadius: 8,
              background: '#E05318',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontSize: 18,
            }}
          >
            <HomeFilled />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1F2937', lineHeight: 1.2 }}>
              IoT PTIT
            </div>
            <div style={{ fontSize: 11, color: '#6B7280' }}>Hệ thống giám sát thiết bị trong phòng</div>
          </div>
        </div>

        {/* PHẦN 2: DANH SÁCH MENU ĐIỀU HƯỚNG */}
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]} // Tự động làm sáng mục menu tương ứng với URL hiện tại
          items={navItems}
          style={{
            borderRight: 'none',
            flex: 1, // Chiếm toàn bộ khoảng trống ở giữa
            fontWeight: 500,
            fontSize: 16,
          }}
        />

        {/* PHẦN 3: FOOTER THÔNG TIN NGƯỜI DÙNG & NÚT ĐĂNG XUẤT */}
        <div
          style={{
            padding: '12px',
            background: '#F9FAFB',
            borderRadius: 8,
            border: '1px solid #EAECF0',
            marginTop: 'auto', // Đẩy footer xuống sát đáy Sidebar
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
              {/* Avatar người dùng: Nếu có ảnh thì hiện ảnh, chưa có thì hiện icon User */}
              <Avatar
                size={34}
                src={avatar || undefined}
                icon={!avatar && <UserOutlined />}
                style={{ background: '#E05318', flexShrink: 0, objectFit: 'cover' }}
              />
              <div style={{ overflow: 'hidden' }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#1F2937',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                  }}
                >
                  {user.fullName}
                </div>
                {/* Tag quyền hạn Admin hoặc Sinh viên */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <Tag
                    color={isAdmin ? 'volcano' : 'blue'}
                    style={{ margin: 0, fontSize: 10, lineHeight: '16px', padding: '0 4px', borderRadius: 3 }}
                  >
                    {isAdmin ? 'Admin' : 'Sinh viên'}
                  </Tag>
                </div>
              </div>
            </div>
            {/* Nút icon đăng xuất màu đỏ */}
            <Button
              type="text"
              size="small"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              title="Đăng xuất"
              danger
            />
          </div>
        </div>
      </div>
    </Sider>
  );
}
