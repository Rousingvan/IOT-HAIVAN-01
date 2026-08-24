import React, { useState, useMemo } from 'react';
import { Card, Typography, Switch, Tag, Tooltip, Space, Button, Modal, Segmented, notification, Descriptions } from 'antd';
import {
  BulbOutlined,
  BulbFilled,
  SyncOutlined,
  CheckCircleFilled,
  InfoCircleOutlined,
  DisconnectOutlined,
  EnvironmentOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

export default function DevicePanel({ devices = [], onToggleDevice, loadingMap = {} }) {
  const navigate = useNavigate();

  // Kiểm tra quyền hạn người dùng hiện tại
  const user = JSON.parse(localStorage.getItem('iot_user') || '{"role":"ADMIN"}');
  const isAdmin = user.role === 'ADMIN';

  // Tab lọc thiết bị: Mặc định là 'ACTIVE' (Các thiết bị đang BẬT)
  const [filterTab, setFilterTab] = useState('ACTIVE');
  // Modal hiển thị chi tiết khi bấm vào dấu !
  const [detailModal, setDetailModal] = useState({ open: false, device: null });
  // Modal báo thành công sau khi toggle
  const [successModal, setSuccessModal] = useState({ open: false, device: null, action: '' });

  // Lọc danh sách thiết bị theo tab được chọn
  const filteredDevices = useMemo(() => {
    switch (filterTab) {
      case 'ACTIVE':
        return devices.filter((d) => d.current_state === 'ON' && d.is_connected);
      case 'LAMP':
        return devices.filter((d) => d.device_type === 'LAMP');
      case 'FAN':
        return devices.filter((d) => d.device_type === 'FAN');
      case 'ALL':
      default:
        return devices;
    }
  }, [devices, filterTab]);

  const renderDeviceIcon = (type, state, isConnected) => {
    if (!isConnected) {
      return <DisconnectOutlined style={{ fontSize: 22, color: '#9CA3AF' }} />;
    }
    if (type === 'LAMP') {
      return state === 'ON' ? (
        <BulbFilled style={{ fontSize: 24, color: '#E05318' }} />
      ) : (
        <BulbOutlined style={{ fontSize: 24, color: '#6B7280' }} />
      );
    }
    return (
      <SyncOutlined
        spin={state === 'ON'}
        style={{ fontSize: 24, color: state === 'ON' ? '#0891B2' : '#6B7280' }}
      />
    );
  };

  const handleSwitchChange = async (device, checked) => {
    if (!isAdmin) {
      notification.warning({
        message: 'Hạn chế quyền hạn (Chỉ xem)',
        description: 'Tài khoản Sinh viên không có quyền thêm, sửa, xóa hay điều khiển thiết bị. Hãy đăng nhập tài khoản Quản trị viên (ADMIN)!',
      });
      return;
    }

    if (!device.is_connected) {
      notification.warning({
        message: 'Thiết bị chưa kết nối',
        description: 'Module này chưa gắn vào mạch thực tế.',
      });
      return;
    }

    const action = checked ? 'ON' : 'OFF';
    try {
      await onToggleDevice(device.device_code, action);
      setSuccessModal({ open: true, device, action });
    } catch (err) {
      notification.error({
        message: 'Điều khiển thất bại / Timeout',
        description: err.message || 'Không nhận được gói tin phản hồi (ACK) từ ESP32 sau 5s',
      });
    }
  };

  return (
    <Card
      style={{
        borderRadius: 12,
        background: '#FFFFFF',
        border: '1px solid #EAECF0',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
      }}
      bodyStyle={{ padding: '18px 20px' }}
    >
      {/* Header Panel */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 6 }}>
          <Title level={4} style={{ margin: 0, color: '#1F2937', fontWeight: 600, fontSize: 16 }}>
            Bảng điều khiển thiết bị
          </Title>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Tag color={isAdmin ? 'volcano' : 'default'} style={{ margin: 0, fontSize: 11 }}>
              {isAdmin ? 'Admin' : 'View Only'}
            </Tag>
            <Text style={{ fontSize: 12, color: '#6B7280' }}>
              Tổng: <strong>{filteredDevices.length}</strong>
            </Text>
          </div>
        </div>

        {/* Cảnh báo phân quyền cho tài khoản Sinh viên */}
        {!isAdmin && (
          <div
            style={{
              padding: '6px 10px',
              background: '#F0F9FF',
              border: '1px solid #BAE6FD',
              borderRadius: 6,
              fontSize: 11,
              color: '#0369A1',
              marginBottom: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <InfoCircleOutlined style={{ color: '#0284C7' }} />
            <span>Chế độ Sinh viên: Không có quyền thêm, sửa, xóa hoặc đổi trạng thái thiết bị.</span>
          </div>
        )}

        {/* Thanh chọn loại thiết bị (Mặc định: Đang bật) */}
        <Segmented
          block
          value={filterTab}
          onChange={(val) => setFilterTab(val)}
          options={[
            { label: 'Đang bật', value: 'ACTIVE' },
            { label: 'Tất cả', value: 'ALL' },
            { label: 'Đèn', value: 'LAMP' },
            { label: 'Quạt', value: 'FAN' },
          ]}
          style={{ background: '#F3F4F6', padding: 3, borderRadius: 8 }}
        />
      </div>

      {/* Danh sách thiết bị có cơ chế cuộn Scroll khi nhiều */}
      <div
        style={{
          maxHeight: 380,
          overflowY: 'auto',
          paddingRight: 4,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {filteredDevices.length === 0 ? (
          <div
            style={{
              padding: '32px 16px',
              textAlign: 'center',
              color: '#9CA3AF',
              background: '#F9FAFB',
              borderRadius: 8,
              border: '1px dashed #E5E7EB',
            }}
          >
            <AppstoreOutlined style={{ fontSize: 24, marginBottom: 8, display: 'block' }} />
            {filterTab === 'ACTIVE'
              ? 'Hiện không có thiết bị nào đang bật'
              : 'Không có thiết bị thuộc nhóm này'}
          </div>
        ) : (
          filteredDevices.map((device) => {
            const isLoading = !!loadingMap[device.device_code];
            const isOnline = device.is_connected;
            const isOn = device.current_state === 'ON';

            return (
              <div
                key={device.device_code}
                style={{
                  borderRadius: 10,
                  padding: '12px 14px',
                  background: isOnline
                    ? isOn
                      ? '#FFF7ED'
                      : '#FFFFFF'
                    : '#F9FAFB',
                  border: isOnline
                    ? isOn
                      ? '1px solid #FDBA74'
                      : '1px solid #E5E7EB'
                    : '1px dashed #D1D5DB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Left: Icon & Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      background: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid #F3F4F6',
                    }}
                  >
                    {renderDeviceIcon(device.device_type, device.current_state, isOnline)}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Text strong style={{ fontSize: 14, color: isOnline ? '#1F2937' : '#9CA3AF' }}>
                        {device.device_name}
                      </Text>
                      {/* Nút bấm vào dấu ! để xem popup chi tiết */}
                      <Tooltip title="Xem chi tiết mã phòng, vị trí lắp đặt">
                        <Button
                          type="text"
                          shape="circle"
                          size="small"
                          icon={<InfoCircleOutlined style={{ color: '#E05318', fontSize: 13 }} />}
                          onClick={() => setDetailModal({ open: true, device })}
                          style={{ width: 22, height: 22 }}
                        />
                      </Tooltip>
                    </div>
                    <div style={{ fontSize: 11, color: '#6B7280' }}>
                      <code>{device.device_code}</code>
                      {' · '}
                      <span style={{ color: isOnline ? (isOn ? '#389E0D' : '#6B7280') : '#9CA3AF', fontWeight: 500 }}>
                        {isOnline ? (isOn ? 'Đang bật' : 'Đang tắt') : 'Chưa kết nối'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Switch Control */}
                <div>
                  {!isAdmin ? (
                    <Tooltip title="Chỉ tài khoản Admin mới có quyền thêm/sửa/xóa hoặc điều khiển thiết bị!">
                      <Switch checked={isOn} disabled={true} size="small" />
                    </Tooltip>
                  ) : !isOnline ? (
                    <Tooltip title="Thiết bị chưa được kết nối phần cứng">
                      <Switch checked={false} disabled={true} size="small" />
                    </Tooltip>
                  ) : (
                    <Switch
                      checked={isOn}
                      loading={isLoading}
                      disabled={isLoading}
                      style={{ backgroundColor: isOn ? '#E05318' : undefined }}
                      onChange={(checked) => handleSwitchChange(device, checked)}
                    />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* POPUP CHI TIẾT THÔNG TIN THIẾT BỊ KHI BẤM DẤU ! */}
      <Modal
        title={
          <Space>
            <InfoCircleOutlined style={{ color: '#E05318' }} />
            <span>Thông tin chi tiết thiết bị</span>
          </Space>
        }
        open={detailModal.open}
        onCancel={() => setDetailModal({ open: false, device: null })}
        footer={[
          <Button
            key="close"
            type="primary"
            style={{ background: '#E05318' }}
            onClick={() => setDetailModal({ open: false, device: null })}
          >
            Đóng
          </Button>,
        ]}
      >
        {detailModal.device && (
          <Descriptions bordered size="small" column={1} style={{ marginTop: 12 }}>
            <Descriptions.Item label="Mã định danh">
              <Tag color="volcano" style={{ fontWeight: 600, fontSize: 13 }}>
                {detailModal.device.device_code}
              </Tag>
            </Descriptions.Item>

            <Descriptions.Item label="Tên thiết bị">
              <strong>{detailModal.device.device_name}</strong>
            </Descriptions.Item>

            <Descriptions.Item label="Phòng lắp đặt">
              <Space>
                <EnvironmentOutlined style={{ color: '#E05318' }} />
                <span>{detailModal.device.room || 'Phòng Thực Hành IoT 201 - Nhà A2'}</span>
              </Space>
            </Descriptions.Item>

            <Descriptions.Item label="Vị trí trong phòng">
              <span style={{ color: '#1F2937', fontWeight: 500 }}>
                {detailModal.device.location || 'Đèn trần dãy giữa bàn 3-4'}
              </span>
            </Descriptions.Item>

            <Descriptions.Item label="Chân GPIO (ESP32)">
              <code>GPIO {detailModal.device.pin_relay}</code>
            </Descriptions.Item>

            <Descriptions.Item label="Trạng thái kết nối">
              {detailModal.device.is_connected ? (
                <Tag color="success">Đã kết nối phần cứng</Tag>
              ) : (
                <Tag color="default">Chưa kết nối (Cổng mở rộng dự phòng)</Tag>
              )}
            </Descriptions.Item>

            <Descriptions.Item label="Trạng thái hoạt động">
              <Tag color={detailModal.device.current_state === 'ON' ? 'orange' : 'default'}>
                {detailModal.device.current_state === 'ON' ? 'ĐANG BẬT' : 'ĐANG TẮT'}
              </Tag>
            </Descriptions.Item>

            <Descriptions.Item label="Quyền thao tác">
              {isAdmin ? (
                <Tag color="volcano">ADMIN</Tag>
              ) : (
                <Tag color="default">SINH VIÊN (Chế độ chỉ xem)</Tag>
              )}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* MODAL BÁO THÀNH CÔNG */}
      <Modal
        title={
          <Space>
            <CheckCircleFilled style={{ color: '#389E0D', fontSize: 18 }} />
            <span>Điều khiển thành công</span>
          </Space>
        }
        open={successModal.open}
        onCancel={() => setSuccessModal({ open: false, device: null, action: '' })}
        footer={[
          <Button
            key="history"
            onClick={() => {
              setSuccessModal({ open: false, device: null, action: '' });
              navigate('/action-history');
            }}
          >
            Xem lịch sử điều khiển
          </Button>,
          <Button
            key="ok"
            type="primary"
            style={{ background: '#E05318' }}
            onClick={() => setSuccessModal({ open: false, device: null, action: '' })}
          >
            Xong
          </Button>,
        ]}
      >
        <div style={{ padding: '10px 0', fontSize: 14 }}>
          Đã gửi lệnh <strong>{successModal.action === 'ON' ? 'BẬT' : 'TẮT'}</strong> tới thiết bị{' '}
          <strong style={{ color: '#E05318' }}>{successModal.device?.device_name}</strong> (
          <code>{successModal.device?.device_code}</code>) và nhận được xác nhận từ ESP32.
        </div>
      </Modal>
    </Card>
  );
}
