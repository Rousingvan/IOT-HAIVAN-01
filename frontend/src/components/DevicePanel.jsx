import React, { useState, useMemo } from 'react';
import { Card, Typography, Switch, Tag, Tooltip, Space, Button, Modal, notification, Descriptions } from 'antd';
import {
  BulbOutlined,
  BulbFilled,
  SyncOutlined,
  CheckCircleFilled,
  InfoCircleOutlined,
  DisconnectOutlined,
  EnvironmentOutlined,
  AppstoreOutlined,
  AlertOutlined,
  AlertFilled,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

/**
 * ==============================================================================
 * COMPONENT: DevicePanel
 * CHỨC NĂNG:
 * - Bảng điều khiển và giám sát trạng thái thiết bị thời gian thực (Đèn, Quạt, Đèn Cảnh Báo...).
 * - Kiểm tra phân quyền RBAC (Chỉ tài khoản ADMIN mới được gạt công tắc bật/tắt).
 * - Hiển thị trực tiếp danh sách tất cả các thiết bị trong hệ thống (Đèn 1, Đèn 2, Đèn 3, Đèn Cảnh Báo).
 * - Hoạt ảnh trực quan: Quạt xoay 360 độ liên tục khi BẬT (spin={true}).
 * - Chống Spam click: Vòng quay loading trên từng nút switch trong lúc chờ xác nhận từ ESP32.
 * - 2 Hộp thoại Modal: Modal xem vị trí phòng/chân GPIO và Modal báo thành công.
 * ==============================================================================
 */
export default function DevicePanel({ devices = [], onToggleDevice, loadingMap = {} }) {
  const navigate = useNavigate();

  // 1. Kiểm tra quyền hạn người dùng từ LocalStorage
  const user = JSON.parse(localStorage.getItem('iot_user') || '{"role":"ADMIN"}');
  const isAdmin = user.role === 'ADMIN';

  // 2. State quản lý Modal xem chi tiết thiết bị (khi click nút dấu !)
  const [detailModal, setDetailModal] = useState({ open: false, device: null });

  // 3. State quản lý Modal thông báo thành công sau khi gạt công tắc
  const [successModal, setSuccessModal] = useState({ open: false, device: null, action: '' });

  // 4. Danh sách hiển thị: Chỉ giữ các đèn bật/tắt thủ công (Đèn 1, Đèn 2). 
  // Đèn 3 đã chuyển thành Đèn Cảnh Báo tự động theo ngưỡng ánh sáng (nhấp nháy 2s)
  const allDevices = useMemo(() => {
    return devices.filter(
      (d) =>
        d.device_code !== 'ALERT_LED' &&
        d.device_code !== 'P201_LAMP_04' &&
        d.device_code !== 'P201_LAMP_03' &&
        d.device_code !== 'LAMP_03'
    );
  }, [devices]);

  // 5. Hàm render Icon tương ứng cho từng loại thiết bị và trạng thái hoạt động
  const renderDeviceIcon = (type, state, isConnected) => {
    // Nếu thiết bị chưa cắm phần cứng -> Hiện icon mất kết nối màu xám
    if (!isConnected) {
      return <DisconnectOutlined style={{ fontSize: 22, color: '#9CA3AF' }} />;
    }
    // Nếu là Đèn Cảnh Báo (ALERT / ALERT_LED)
    if (type === 'ALERT' || type === 'ALERT_LED') {
      return state === 'ON' ? (
        <AlertFilled style={{ fontSize: 24, color: '#DC2626' }} /> // Đèn cảnh báo sáng màu đỏ
      ) : (
        <AlertOutlined style={{ fontSize: 24, color: '#6B7280' }} /> // Đèn cảnh báo tắt
      );
    }
    // Nếu là Đèn (LAMP)
    if (type === 'LAMP') {
      return state === 'ON' ? (
        <BulbFilled style={{ fontSize: 24, color: '#E05318' }} /> // Đèn sáng màu cam
      ) : (
        <BulbOutlined style={{ fontSize: 24, color: '#6B7280' }} /> // Đèn tắt màu xám viền
      );
    }
    // Nếu là Quạt (FAN): Sử dụng spin={true} để quạt tự xoay tròn khi bật ON
    return (
      <SyncOutlined
        spin={state === 'ON'} // Xoay 360 độ liên tục khi BẬT
        style={{ fontSize: 24, color: state === 'ON' ? '#0891B2' : '#6B7280' }}
      />
    );
  };

  // 6. Hàm xử lý khi người dùng gạt công tắc Switch
  const handleSwitchChange = async (device, checked) => {
    // Chặn thao tác nếu tài khoản là Sinh viên (không có quyền Admin)
    if (!isAdmin) {
      notification.warning({
        message: 'Hạn chế quyền hạn (Chỉ xem)',
        description: 'Tài khoản Sinh viên không có quyền thêm, sửa, xóa hay điều khiển thiết bị. Hãy đăng nhập tài khoản Quản trị viên (ADMIN)!',
      });
      return;
    }

    // Chặn thao tác nếu thiết bị chưa kết nối phần cứng thực tế
    if (!device.is_connected) {
      notification.warning({
        message: 'Thiết bị chưa kết nối',
        description: 'Module này chưa gắn vào mạch thực tế.',
      });
      return;
    }

    const action = checked ? 'ON' : 'OFF';
    try {
      // Gọi hàm onToggleDevice từ DashboardPage để gửi request POST xuống Backend
      await onToggleDevice(device.device_code, action);
      // Mở modal thông báo thành công
      setSuccessModal({ open: true, device, action });
    } catch (err) {
      // Thông báo lỗi nếu sau 5s không nhận được gói tin xác nhận (ACK) từ ESP32
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
      {/* Header Panel: Tiêu đề + Tag Admin/View Only + Bộ đếm tổng số */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 6 }}>
          <Title level={4} style={{ margin: 0, color: '#1F2937', fontWeight: 600, fontSize: 16 }}>
            Bảng điều khiển thiết bị
          </Title>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Tag hiển thị quyền hạn */}
            <Tag color={isAdmin ? 'volcano' : 'default'} style={{ margin: 0, fontSize: 11 }}>
              {isAdmin ? 'Admin' : 'View Only'}
            </Tag>
            <Text style={{ fontSize: 12, color: '#6B7280' }}>
              Tổng: <strong>{allDevices.length}</strong>
            </Text>
          </div>
        </div>

        {/* Thanh cảnh báo nhỏ nếu đang ở chế độ Sinh viên (Chỉ xem) */}
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
      </div>

      {/* Danh sách tất cả các thiết bị (hỗ trợ hiển thị đủ Đèn 1, 2, 3 và Đèn Cảnh Báo) */}
      <div
        style={{
          maxHeight: 460,
          overflowY: 'auto', // Tự động bật scroll dọc khi vượt quá chiều cao
          paddingRight: 4,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {/* Trường hợp chưa có thiết bị nào */}
        {allDevices.length === 0 ? (
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
            Không có thiết bị nào trong hệ thống
          </div>
        ) : (
          // Duyệt qua danh sách tất cả thiết bị để render từng hàng điều khiển
          allDevices.map((device) => {
            const isLoading = !!loadingMap[device.device_code]; // Đang chờ lệnh bật/tắt của riêng thiết bị này
            const isOnline = device.is_connected; // Có cắm phần cứng hay không
            const isOn = device.current_state === 'ON'; // Đang BẬT hay TẮT
            const isAlertDevice = device.device_type === 'ALERT' || device.device_code === 'ALERT_LED';

            return (
              <div
                key={device.device_code}
                style={{
                  borderRadius: 10,
                  padding: '12px 14px',
                  // Đổi màu nền cam nhạt nếu đang BẬT, đỏ nhạt nếu là đèn cảnh báo BẬT, trắng nếu TẮT
                  background: isOnline
                    ? isOn
                      ? isAlertDevice
                        ? '#FEF2F2'
                        : '#FFF7ED'
                      : '#FFFFFF'
                    : '#F9FAFB',
                  border: isOnline
                    ? isOn
                      ? isAlertDevice
                        ? '1px solid #FCA5A5'
                        : '1px solid #FDBA74'
                      : '1px solid #E5E7EB'
                    : '1px dashed #D1D5DB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Phần bên Trái: Hộp Icon + Tên thiết bị + Nút dấu ! xem vị trí */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {/* Hộp vuông 40x40px chứa icon */}
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

                  {/* Thông tin tên và mã định danh */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Text strong style={{ fontSize: 14, color: isOnline ? (isAlertDevice && isOn ? '#DC2626' : '#1F2937') : '#9CA3AF' }}>
                        {device.device_name}
                      </Text>
                      {isAlertDevice && (
                        <Tag color="error" style={{ fontSize: 10, padding: '0 4px', lineHeight: '18px', margin: 0 }}>
                          Cảnh báo
                        </Tag>
                      )}
                      {/* Nút bấm dấu ! mở popup chi tiết phòng & chân GPIO */}
                      <Tooltip title="Xem chi tiết mã phòng, vị trí lắp đặt">
                        <Button
                          type="text"
                          shape="circle"
                          size="small"
                          icon={<InfoCircleOutlined style={{ color: isAlertDevice ? '#DC2626' : '#E05318', fontSize: 13 }} />}
                          onClick={() => setDetailModal({ open: true, device })}
                          style={{ width: 22, height: 22 }}
                        />
                      </Tooltip>
                    </div>
                    {/* Mã code và nhãn trạng thái chữ nhỏ */}
                    <div style={{ fontSize: 11, color: '#6B7280' }}>
                      <code>{device.device_code}</code>
                      {' · '}
                      <span style={{ color: isOnline ? (isOn ? (isAlertDevice ? '#DC2626' : '#389E0D') : '#6B7280') : '#9CA3AF', fontWeight: 500 }}>
                        {isOnline ? (isOn ? 'Đang bật' : 'Đang tắt') : 'Chưa kết nối'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Phần bên Phải: Công tắc gạt Switch */}
                <div>
                  {!isAdmin ? (
                    // Nếu là Sinh viên -> Khóa công tắc
                    <Tooltip title="Chỉ tài khoản Admin mới có quyền thêm/sửa/xóa hoặc điều khiển thiết bị!">
                      <Switch checked={isOn} disabled={true} size="small" />
                    </Tooltip>
                  ) : !isOnline ? (
                    // Nếu chưa cắm phần cứng -> Khóa công tắc
                    <Tooltip title="Thiết bị chưa được kết nối phần cứng">
                      <Switch checked={false} disabled={true} size="small" />
                    </Tooltip>
                  ) : (
                    // Nếu là Admin & Đã kết nối -> Cho phép gạt công tắc
                    <Switch
                      checked={isOn}
                      loading={isLoading} // Hiện xoay tròn loading khi đang chờ ESP32 phản hồi
                      disabled={isLoading} // Khóa nút chống bấm spam liên tục
                      size="small"
                      style={{ backgroundColor: isOn ? (isAlertDevice ? '#DC2626' : '#E05318') : undefined }}
                      onChange={(checked) => handleSwitchChange(device, checked)}
                    />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL 1: POPUP CHI TIẾT THÔNG TIN THIẾT BỊ KHI BẤM DẤU ! */}
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
                {detailModal.device.location || 'Khu vực phòng thực hành'}
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

      {/* MODAL 2: POPUP BÁO THÀNH CÔNG VÀ CHUYỂN TRANG SANG LỊCH SỬ THAO TÁC */}
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
              navigate('/action-history'); // Chuyển trang sang Lịch sử điều khiển
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
