import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Typography, Space, Avatar, Tag } from 'antd';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  DashboardOutlined,
  DatabaseOutlined,
  HistoryOutlined,
  UserOutlined,
  LogoutOutlined,
  ThunderboltFilled,
} from '@ant-design/icons';

const { Sider } = Layout;
const { Text } = Typography;

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [avatar, setAvatar] = useState(localStorage.getItem('iot_student_avatar') || '');
  const user = JSON.parse(
    localStorage.getItem('iot_user') || '{"fullName":"Lương Hải Vân","studentCode":"B23DCAT332","role":"ADMIN"}'
  );

  useEffect(() => {
    const handleAvatarUpdate = () => {
      setAvatar(localStorage.getItem('iot_student_avatar') || '');
    };
    window.addEventListener('avatar_updated', handleAvatarUpdate);
    return () => window.removeEventListener('avatar_updated', handleAvatarUpdate);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('iot_user');
    navigate('/login');
  };

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
    <Sider
      width={240}
      style={{
        background: '#FFFFFF',
        borderRight: '1px solid #EAECF0',
        height: '100vh',
        position: 'sticky',
        top: 0,
        left: 0,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '1px 0 6px rgba(0, 0, 0, 0.03)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '16px 12px' }}>
        {/* Brand Logo Header */}
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
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: '#E05318',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontSize: 18,
            }}
          >
            <ThunderboltFilled />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1F2937', lineHeight: 1.2 }}>
              IoT PTIT
            </div>
            <div style={{ fontSize: 11, color: '#6B7280' }}>Hệ thống giám sát thiết bị trong phòng</div>
          </div>
        </div>

        {/* Menu Navigation */}
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={navItems}
          style={{
            borderRight: 'none',
            flex: 1,
            fontWeight: 500,
            fontSize: 14,
          }}
        />

        {/* User Info & Logout Footer inside Sidebar */}
        <div
          style={{
            padding: '12px',
            background: '#F9FAFB',
            borderRadius: 8,
            border: '1px solid #EAECF0',
            marginTop: 'auto',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
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
