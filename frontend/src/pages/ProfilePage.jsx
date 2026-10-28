import React, { useEffect, useState, useRef } from 'react';
import { Card, Typography, Avatar, Row, Col, Button, Tag, Space, Divider, message, Modal, Input, Tooltip } from 'antd';
import {
  UserOutlined,
  GithubOutlined,
  FilePdfOutlined,
  ApiOutlined,
  LayoutOutlined,
  IdcardOutlined,
  BookOutlined,
  CheckCircleOutlined,
  CameraOutlined,
  LinkOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { apiService } from '../services/api';

const { Title, Text } = Typography;

/**
 * ==============================================================================
 * TRANG: ProfilePage (Hồ Sơ Sinh Viên & Tài Liệu Đồ Án)
 * CHỨC NĂNG CHÍNH:
 * - Trình bày thông tin sinh viên thực hiện: Họ tên, Mã SV, Lớp, Học phần, Giảng viên.
 * - Quản lý ảnh đại diện sinh viên (Avatar) linh hoạt:
 *     + Tải ảnh từ máy tính (hỗ trợ chuyển thành Base64 lưu vào LocalStorage).
 *     + Dán link URL ảnh trực tiếp qua Modal.
 *     + Xóa ảnh về icon mặc định.
 *     + Phát sự kiện custom `avatar_updated` để đồng bộ Avatar tức thời với Sidebar.
 * - Cung cấp 4 liên kết tài liệu đồ án chuẩn:
 *     1. GitHub Repository: Mã nguồn toàn bộ hệ thống.
 *     2. Figma Design: Thiết kế giao diện UI/UX.
 *     3. Swagger API Docs: Tài liệu API RESTful.
 *     4. Báo Cáo BTL (PDF): Bản báo cáo thuyết minh đồ án.
 * 
 * GỢI Ý CÁC TÙY CHỈNH THẦY CÔ CÓ THỂ YÊU CẦU:
 * 1. Đổi kích thước Avatar: Sửa size={100} thành 120 hoặc 80.
 * 2. Thay đổi đường link GitHub/Figma/Swagger/PDF: Chỉnh sửa dữ liệu trả về từ apiService.getProfile().
 * 3. Thêm trường thông tin mới (VD: Số điện thoại, Email): Thêm khối <div style={{ display: 'flex' ... }}>.
 * ==============================================================================
 */
export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // State lưu trữ dữ liệu ảnh đại diện (Base64 hoặc URL)
  const [avatar, setAvatar] = useState(localStorage.getItem('iot_student_avatar') || '');

  // State mở/đóng Modal dán URL ảnh
  const [urlModalOpen, setUrlModalOpen] = useState(false);
  const [inputUrl, setInputUrl] = useState('');

  // Ref trỏ tới thẻ <input type="file"> ẩn
  const fileInputRef = useRef(null);

  // useEffect: Gọi API lấy thông tin profile sinh viên từ Backend
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await apiService.getProfile();
        setProfile(data);
        if (data.avatar && !avatar) {
          setAvatar(data.avatar);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Handler khi người dùng chọn file ảnh từ máy tính
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Kiểm tra định dạng file ảnh
    if (!file.type.startsWith('image/')) {
      message.error('Vui lòng chọn file hình ảnh (JPG, PNG, GIF, WebP)!');
      return;
    }

    // Giới hạn dung lượng tối đa 5MB
    if (file.size > 5 * 1024 * 1024) {
      message.error('Dung lượng ảnh tối đa là 5MB!');
      return;
    }

    // Dùng FileReader để chuyển ảnh thành chuỗi Base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target.result;
      setAvatar(base64Data);
      localStorage.setItem('iot_student_avatar', base64Data);
      // Phát sự kiện avatar_updated để Sidebar tự cập nhật ngay lập tức
      window.dispatchEvent(new Event('avatar_updated'));
      message.success('Đã cập nhật ảnh đại diện sinh viên thành công!');
    };
    reader.readAsDataURL(file);
  };

  // Handler khi dán URL ảnh từ Modal
  const handleSaveUrl = () => {
    if (!inputUrl.trim()) {
      message.warning('Vui lòng nhập đường dẫn URL ảnh!');
      return;
    }
    setAvatar(inputUrl.trim());
    localStorage.setItem('iot_student_avatar', inputUrl.trim());
    window.dispatchEvent(new Event('avatar_updated'));
    setUrlModalOpen(false);
    setInputUrl('');
    message.success('Đã cập nhật ảnh đại diện từ URL thành công!');
  };

  // Handler xóa ảnh đại diện về icon mặc định
  const handleRemoveAvatar = () => {
    setAvatar('');
    localStorage.removeItem('iot_student_avatar');
    window.dispatchEvent(new Event('avatar_updated'));
    message.info('Đã xóa ảnh đại diện, trở về icon mặc định.');
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      {/* 1. TIÊU ĐỀ TRANG */}
      <div style={{ marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0, color: '#111827', fontWeight: 700, fontSize: 20 }}>
          Hồ sơ sinh viên & Tài liệu đồ án
        </Title>
      </div>

      <Row gutter={[20, 20]}>
        {/* CỘT TRÁI (md={9}): THÔNG TIN SINH VIÊN & AVATAR */}
        <Col xs={24} md={15}>
          <Card
            loading={loading}
            style={{
              borderRadius: 12,
              background: '#FFFFFF',
              border: '1px solid #EAECF0',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              textAlign: 'center',
            }}
            bodyStyle={{ padding: '28px 20px' }}
          >
            {/* Vùng hiển thị Avatar */}
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 14 }}>
              <Avatar
                size={140}
                src={avatar || undefined}
                icon={!avatar && <UserOutlined style={{ fontSize: 48 }} />}
                style={{
                  background: avatar ? '#FFFFFF' : '#E05318',
                  color: '#FFFFFF',
                  border: '3px solid #FFD8BF',
                  boxShadow: '0 4px 12px rgba(224, 83, 24, 0.2)',
                  objectFit: 'cover',
                }}
              />

              {/* Input file ẩn, được kích hoạt khi bấm nút "Tải ảnh lên" */}
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>

            {/* Các nút thao tác Avatar */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
              <Tooltip title="Tải ảnh từ máy tính (JPG, PNG, WebP)">
                <Button
                  size="small"
                  icon={<CameraOutlined />}
                  onClick={() => fileInputRef.current?.click()}
                  style={{ fontSize: 12 }}
                >
                  Tải ảnh lên
                </Button>
              </Tooltip>

              <Tooltip title="Dán link đường dẫn ảnh trực tiếp">
                <Button
                  size="small"
                  icon={<LinkOutlined />}
                  onClick={() => setUrlModalOpen(true)}
                  style={{ fontSize: 12 }}
                >
                  Dán link ảnh
                </Button>
              </Tooltip>

              {avatar && (
                <Tooltip title="Xóa ảnh về mặc định">
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={handleRemoveAvatar}
                  />
                </Tooltip>
              )}
            </div>

            {/* Tên sinh viên */}
            <Title level={4} style={{ margin: 0, color: '#111827', fontWeight: 600, fontSize: 17 }}>
              {profile?.fullName || 'Lương Hải Vân'}
            </Title>
            <Tag color="orange" style={{ marginTop: 6, fontSize: 12, borderRadius: 4 }}>
              Sinh viên thực hiện
            </Tag>

            <Divider style={{ margin: '18px 0' }} />

            {/* Thông tin học vụ chi tiết */}
            <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <IdcardOutlined style={{ color: '#E05318', fontSize: 16 }} />
                <div>
                  <Text type="secondary" style={{ fontSize: 11 }}>Mã sinh viên:</Text>
                  <div style={{ fontWeight: 600, color: '#1F2937' }}>{profile?.studentCode || 'B23DCAT332'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <BookOutlined style={{ color: '#E05318', fontSize: 16 }} />
                <div>
                  <Text type="secondary" style={{ fontSize: 11 }}>Lớp sinh hoạt:</Text>
                  <div style={{ fontWeight: 600, color: '#1F2937' }}>{profile?.className || 'D23CQAT02-B'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircleOutlined style={{ color: '#389E0D', fontSize: 16 }} />
                <div>
                  <Text type="secondary" style={{ fontSize: 11 }}>Học phần & Giảng viên:</Text>
                  <div style={{ fontWeight: 600, color: '#1F2937' }}>
                    {profile?.subject || 'IoT và Ứng dụng'} - {profile?.instructor || 'TS. Nguyễn Quốc Uy'}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </Col>

        {/* CỘT PHẢI (md={15}): 4 LIÊN KẾT TÀI LIỆU ĐỒ ÁN */}
        <Col xs={24} md={15}>
          <Card
            title={<span style={{ fontSize: 15, fontWeight: 600 }}>Liên kết tài liệu đồ án</span>}
            style={{
              borderRadius: 12,
              background: '#FFFFFF',
              border: '1px solid #EAECF0',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            }}
            bodyStyle={{ padding: '16px 20px' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* 1. Link GitHub Repository */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  background: '#F9FAFB',
                  borderRadius: 8,
                  border: '1px solid #EAECF0',
                }}
              >
                <Space size="middle">
                  <GithubOutlined style={{ fontSize: 22, color: '#24292E' }} />
                  <div>
                    <div style={{ fontWeight: 600, color: '#1F2937', fontSize: 13 }}>1. GitHub Repository</div>
                    <Text type="secondary" style={{ fontSize: 11 }}>Toàn bộ mã nguồn Frontend, Backend và Firmware ESP32</Text>
                  </div>
                </Space>
                <Button
                  size="small"
                  href={profile?.links?.github || '#'}
                  target="_blank"
                >
                  Mở Repo
                </Button>
              </div>

              {/* 2. Link Figma Design */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  background: '#F9FAFB',
                  borderRadius: 8,
                  border: '1px solid #EAECF0',
                }}
              >
                <Space size="middle">
                  <LayoutOutlined style={{ fontSize: 22, color: '#F24E1E' }} />
                  <div>
                    <div style={{ fontWeight: 600, color: '#1F2937', fontSize: 13 }}>2. Figma Design</div>
                    <Text type="secondary" style={{ fontSize: 11 }}>Bản thiết kế giao diện UI/UX và Wireframe</Text>
                  </div>
                </Space>
                <Button
                  size="small"
                  href={profile?.links?.figma || '#'}
                  target="_blank"
                >
                  Xem Figma
                </Button>
              </div>

              {/* 3. Link Swagger API Docs */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  background: '#F9FAFB',
                  borderRadius: 8,
                  border: '1px solid #EAECF0',
                }}
              >
                <Space size="middle">
                  <ApiOutlined style={{ fontSize: 22, color: '#096DD9' }} />
                  <div>
                    <div style={{ fontWeight: 600, color: '#1F2937', fontSize: 13 }}>3. Swagger API Docs</div>
                    <Text type="secondary" style={{ fontSize: 11 }}>Tài liệu đặc tả các RESTful API endpoints</Text>
                  </div>
                </Space>
                <Button
                  size="small"
                  href={profile?.links?.swagger || '#'}
                  target="_blank"
                >
                  Tài liệu API
                </Button>
              </div>

              {/* 4. Link PDF Report */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  background: '#F9FAFB',
                  borderRadius: 8,
                  border: '1px solid #EAECF0',
                }}
              >
                <Space size="middle">
                  <FilePdfOutlined style={{ fontSize: 22, color: '#CF1322' }} />
                  <div>
                    <div style={{ fontWeight: 600, color: '#1F2937', fontSize: 13 }}>4. Báo Cáo BTL (PDF)</div>
                    <Text type="secondary" style={{ fontSize: 11 }}>Bản báo cáo thuyết minh đồ án chuẩn PTIT</Text>
                  </div>
                </Space>
                <Button
                  size="small"
                  href={profile?.links?.pdfReport || '#'}
                  target="_blank"
                >
                  Tải Báo Cáo
                </Button>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* MODAL DÁN LINK URL ẢNH */}
      <Modal
        title="Chèn ảnh đại diện từ đường dẫn URL"
        open={urlModalOpen}
        onOk={handleSaveUrl}
        onCancel={() => setUrlModalOpen(false)}
        okText="Lưu ảnh"
        cancelText="Hủy"
        okButtonProps={{ style: { background: '#E05318' } }}
      >
        <div style={{ padding: '12px 0' }}>
          <Text style={{ fontSize: 13, marginBottom: 8, display: 'block' }}>
            Nhập đường dẫn trực tiếp tới hình ảnh (ví dụ: https://... hoặc /avatar.png):
          </Text>
          <Input
            placeholder="https://example.com/anh-sinh-vien.jpg"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onPressEnter={handleSaveUrl}
          />
          {inputUrl && (
            <div style={{ marginTop: 12, textAlign: 'center' }}>
              <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 6 }}>Xem trước:</Text>
              <Avatar size={64} src={inputUrl} />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
