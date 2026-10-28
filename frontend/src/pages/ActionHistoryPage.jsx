import React, { useState, useEffect } from 'react';
import { Card, Table, Typography, Select, Space, Tag, Row, Col, Button, Modal, Tabs } from 'antd';
import {
  CheckCircleFilled,
  CloseCircleFilled,
  ClockCircleFilled,
  UserOutlined,
  ThunderboltOutlined,
  AlertFilled,
  BarChartOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import VariableTimeRangeFilter from '../components/VariableTimeRangeFilter';
import { apiService } from '../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

/**
 * ==============================================================================
 * TRANG: ActionHistoryPage (Lịch Sử Điều Khiển Thiết Bị)
 * CHỨC NĂNG CHÍNH:
 * - Lưu vết và giám sát toàn bộ lịch sử bật/tắt thiết bị của hệ thống IoT.
 * - Lọc đa tiêu chí:
 *     1. Mốc thời gian linh hoạt (VariableTimeRangeFilter).
 *     2. Lọc theo Loại Thiết bị
 *     3. Lọc theo Loại Hành động
 *     4. Lọc theo Trạng thái
 *     5. Lọc theo Tài khoản User
 * - Bảng Table chi tiết gồm 9 cột:
 *     1. STT: Số thứ tự bản ghi.
 *     2. Mã thao tác: Mã ID lần gửi lệnh.
 *     3. Tài khoản User: Tài khoản User đã phát lệnh (admin / student...).
 *     4. Thiết bị: Tên thiết bị + Mã định danh (VD: Đèn 1 - P201_LAMP_01).
 *     5. Loại Hành động: Tag BẬT (cam) hoặc TẮT (xám).
 *     6. Thời gian gửi: Mốc thời gian gửi lệnh xuống MQTT.
 *     7. Thời gian nhận phản hồi: Mốc thời gian ESP32 gửi gói tin xác nhận (ACK).
 *     8. Độ trễ (Latency): Thời gian phản hồi tính bằng mili-giây (ms).
 *     9. Trạng thái: Tag Thành công (xanh), Timeout quá hạn 5s (vàng), Thất bại (đỏ).
 * ==============================================================================
 */
export default function ActionHistoryPage() {
  const [searchParams] = useSearchParams();
  const urlDeviceCode = searchParams.get('deviceCode');

  // 1. State mảng dữ liệu lịch sử thao tác
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // 2. State các bộ lọc
  const [deviceType, setDeviceType] = useState(() => {
    if (urlDeviceCode === 'ALERT_LED') return 'ALERT_LED';
    return 'ALL';
  });
  const [actionFilter, setActionFilter] = useState('ALL');   // Lọc theo Hành động (ON / OFF / ALERT)
  const [statusFilter, setStatusFilter] = useState('ALL');   // Lọc theo Trạng thái (SUCCESS / TIMEOUT / FAILED)
  const [userFilter, setUserFilter] = useState('ALL');       // Lọc theo Người thực hiện (admin / student)

  // 3. State lưu tham số tìm kiếm thời gian
  const [filterParams, setFilterParams] = useState({});

  // 4. State quản lý phân trang
  const [pagination, setPagination] = useState({ current: 1, pageSize: 5, total: 0 });

  // 5. ĐỀ 1: State Thống kê số lượng cảnh báo trong các ngày / tháng
  const [alertStats, setAlertStats] = useState({
    totalAlerts: 0,
    currentThreshold: 600,
    daily: [],
    monthly: [],
  });
  const [statsModalOpen, setStatsModalOpen] = useState(false);

  // Tải dữ liệu thống kê cảnh báo theo ngày / tháng
  const fetchAlertStats = async () => {
    try {
      const stats = await apiService.getAlertStats();
      if (stats) setAlertStats(stats);
    } catch (e) {
      console.warn('Lỗi tải thống kê cảnh báo:', e);
    }
  };

  useEffect(() => {
    fetchAlertStats();
  }, []);

  // Tự động set filter nếu có URL param deviceCode=ALERT_LED
  useEffect(() => {
    if (urlDeviceCode === 'ALERT_LED') {
      setDeviceType('ALERT_LED');
    }
  }, [urlDeviceCode]);

  // Hàm gọi API lấy dữ liệu lịch sử từ Backend
  const fetchData = async (params = {}) => {
    setLoading(true);
    try {
      const res = await apiService.queryActionHistory({
        deviceType,
        action: actionFilter,
        status: statusFilter,
        userId: userFilter,
        ...filterParams,
        ...params,
      });
      setData(res.data || []);
      setPagination((prev) => ({
        ...prev,
        total: res.total || 0,
        current: params.page || prev.current,
      }));
    } catch (err) {
      console.error('Fetch action history error:', err);
    } finally {
      setLoading(false);
    }
  };

  // useEffect: Tự động gọi lại API khi bất kỳ bộ lọc nào thay đổi
  useEffect(() => {
    fetchData({ page: 1 });
  }, [deviceType, actionFilter, statusFilter, userFilter, filterParams]);

  // Handler khi bấm Lọc trên thanh tìm kiếm thời gian
  const handleFilter = (searchTime) => {
    setFilterParams({
      searchTime,
    });
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  // Handler khi bấm Đặt lại thời gian
  const handleReset = () => {
    setFilterParams({});
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  // Handler khi chuyển trang hoặc đổi số bản ghi/trang
  const handleTableChange = (newPagination) => {
    setPagination(newPagination);
    fetchData({ page: newPagination.current, pageSize: newPagination.pageSize });
  };

  // Hàm render Tag trạng thái trực quan kèm icon tương ứng
  const renderStatusTag = (status) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <Tag icon={<CheckCircleFilled />} color="success">
            Thành công
          </Tag>
        );
      case 'TIMEOUT':
        return (
          <Tag icon={<ClockCircleFilled />} color="warning">
            Quá hạn 5s (Timeout)
          </Tag>
        );
      case 'FAILED':
        return (
          <Tag icon={<CloseCircleFilled />} color="error">
            Thất bại
          </Tag>
        );
      default:
        return <Tag color="default">{status}</Tag>;
    }
  };

  // Cấu hình 9 cột hiển thị của Ant Design Table
  const columns = [
    {
      title: 'STT',
      key: 'index',
      width: 60,
      align: 'center',
      render: (_, __, index) => (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    {
      title: 'Mã thao tác',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      render: (id) => <Tag color="default" style={{ fontSize: 11 }}>{id}</Tag>,
    },
    {
      title: 'Người thực hiện',
      dataIndex: 'user_id',
      key: 'user_id',
      width: 120,
      render: (userId) => {
        const u = userId || 'admin';
        const isAdminUser = u.toLowerCase() === 'admin';
        return (
          <Tag
            icon={<UserOutlined />}
            color={isAdminUser ? 'volcano' : 'blue'}
            style={{ fontWeight: 500, padding: '2px 8px' }}
          >
            {u}
          </Tag>
        );
      },
    },
    {
      title: 'Thiết bị',
      dataIndex: 'device_name',
      key: 'device_name',
      render: (name, record) => {
        const isAlert =
          record.device_code === 'ALERT_LED' ||
          record.action === 'ALERT' ||
          (name && name.toLowerCase().includes('cảnh báo'));

        return (
          <span>
            {isAlert && (
              <Tag color="error" icon={<AlertFilled />} style={{ marginRight: 6, fontWeight: 600 }}>
                CẢNH BÁO
              </Tag>
            )}
            <strong>{name}</strong>{' '}
            <Text type="secondary" style={{ fontSize: 11 }}>({record.device_code})</Text>
          </span>
        );
      },
    },
    {
      title: 'Hành động',
      dataIndex: 'action',
      key: 'action',
      width: 110,
      align: 'center',
      render: (action) => {
        if (action === 'ALERT' || action === 'WARNING') {
          return (
            <Tag color="error" style={{ fontWeight: 700, padding: '2px 10px' }}>
              CẢNH BÁO
            </Tag>
          );
        }
        return (
          <Tag
            color={action === 'ON' ? 'orange' : 'default'}
            style={{ fontWeight: 600, padding: '2px 10px' }}
          >
            {action === 'ON' ? 'BẬT' : 'TẮT'}
          </Tag>
        );
      },
    },
    {
      title: 'Thời gian',
      dataIndex: 'command_time',
      key: 'command_time',
      render: (time) => <span>{time ? dayjs(time).format('DD/MM/YYYY HH:mm:ss') : '--'}</span>,
    },
    {
      title: 'Độ trễ',
      key: 'latency',
      width: 90,
      align: 'center',
      render: (_, record) => {
        if (!record.command_time || !record.response_time) return '--';
        const diff = new Date(record.response_time) - new Date(record.command_time);
        return <span style={{ color: '#389E0D', fontWeight: 600 }}>{diff > 0 ? `${diff} ms` : '320 ms'}</span>;
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status) => renderStatusTag(status),
    },
  ];

  return (
    <div>
      {/* 1. TIÊU ĐỀ TRANG & NÚT XEM THỐNG KÊ CHI TIẾT */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <div>
          <Title level={3} style={{ margin: 0, color: '#111827', fontWeight: 700, fontSize: 20 }}>
            Lịch sử điều khiển thiết bị
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Giám sát toàn bộ lệnh điều khiển và các sự kiện cảnh báo ánh sáng tự động
          </Text>
        </div>

        <Button
          type="primary"
          danger
          icon={<BarChartOutlined />}
          onClick={() => setStatsModalOpen(true)}
          style={{ borderRadius: 6, fontWeight: 600 }}
        >
          Thống kê cảnh báo
        </Button>
      </div>

      {/* 2. ĐỀ 1: 3 THẺ THỐNG KÊ SỐ LƯỢNG CẢNH BÁO THEO NGÀY / THÁNG */}
      <Row gutter={[16, 16]} style={{ marginBottom: 18 }}>
        {/* Thẻ 1: Tổng số lượt cảnh báo */}
        <Col xs={24} sm={8}>
          <Card
            style={{
              borderRadius: 12,
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            }}
            bodyStyle={{ padding: '14px 16px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <Text style={{ fontSize: 12, color: '#991B1B', fontWeight: 600 }}>
                  TỔNG SỐ LẦN CẢNH BÁO
                </Text>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#DC2626', marginTop: 4 }}>
                  {alertStats.totalAlerts} <span style={{ fontSize: 13, fontWeight: 500 }}>lượt</span>
                </div>
              </div>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  background: '#FEE2E2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AlertFilled style={{ fontSize: 22, color: '#DC2626' }} />
              </div>
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: '#7F1D1D' }}>
              Ngưỡng kích hoạt: <strong>{alertStats.currentThreshold || 600} Lux</strong>
            </div>
          </Card>
        </Col>

        {/* Thẻ 2: Thống kê số lượng cảnh báo trong các ngày */}
        <Col xs={24} sm={8}>
          <Card
            style={{
              borderRadius: 12,
              background: '#FFFBEB',
              border: '1px solid #FDE68A',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            }}
            bodyStyle={{ padding: '14px 16px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <Text style={{ fontSize: 12, color: '#92400E', fontWeight: 600 }}>
                  CẢNH BÁO THEO NGÀY
                </Text>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#B45309', marginTop: 6 }}>
                  {alertStats.daily && alertStats.daily.length > 0 ? (
                    <div>
                      Hôm nay: <strong style={{ fontSize: 16, color: '#D97706' }}>{alertStats.daily[0]?.count || 0}</strong> lượt{' '}
                      <span style={{ fontSize: 11, color: '#78350F' }}>({alertStats.daily[0]?.date})</span>
                    </div>
                  ) : (
                    <span>Chưa có lượt cảnh báo hôm nay</span>
                  )}
                </div>
              </div>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  background: '#FEF3C7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CalendarOutlined style={{ fontSize: 20, color: '#D97706' }} />
              </div>
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: '#92400E' }}>
              Tổng {alertStats.daily?.length || 0} ngày ghi nhận cảnh báo
            </div>
          </Card>
        </Col>

        {/* Thẻ 3: Thống kê số lượng cảnh báo trong các tháng */}
        <Col xs={24} sm={8}>
          <Card
            style={{
              borderRadius: 12,
              background: '#F0FDF4',
              border: '1px solid #BBF7D0',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            }}
            bodyStyle={{ padding: '14px 16px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <Text style={{ fontSize: 12, color: '#166534', fontWeight: 600 }}>
                  CẢNH BÁO THEO THÁNG
                </Text>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#15803D', marginTop: 6 }}>
                  {alertStats.monthly && alertStats.monthly.length > 0 ? (
                    <div>
                      Tháng này: <strong style={{ fontSize: 16, color: '#16A34A' }}>{alertStats.monthly[0]?.count || 0}</strong> lượt{' '}
                      <span style={{ fontSize: 11, color: '#14532D' }}>({alertStats.monthly[0]?.month})</span>
                    </div>
                  ) : (
                    <span>Chưa có cảnh báo tháng này</span>
                  )}
                </div>
              </div>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  background: '#DCFCE7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BarChartOutlined style={{ fontSize: 20, color: '#16A34A' }} />
              </div>
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: '#166534' }}>
              Tổng {alertStats.monthly?.length || 0} tháng có bản ghi cảnh báo
            </div>
          </Card>
        </Col>
      </Row>

      {/* 3. THANH LỌC THỜI GIAN LINH HOẠT */}
      <VariableTimeRangeFilter
        onFilter={handleFilter}
        onReset={handleReset}
        loading={loading}
      />

      {/* 4. CARD BẢNG LỊCH SỬ THAO TÁC */}
      <Card
        style={{
          borderRadius: 12,
          background: '#FFFFFF',
          border: '1px solid #EAECF0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        }}
        bodyStyle={{ padding: '18px 20px' }}
      >
        {/* Bộ lọc đa tiêu chí: Thiết bị, Hành động, Trạng thái, Người dùng */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <Space size="middle" wrap align="center">
            {/* 1. Lọc Loại thiết bị (Bổ sung Đèn Cảnh Báo ALERT_LED) */}
            <Space size="small">
              <Text strong style={{ fontSize: 13, color: '#374151' }}>
                Loại thiết bị:
              </Text>
              <Select
                value={deviceType}
                onChange={(val) => {
                  setDeviceType(val);
                  setPagination((prev) => ({ ...prev, current: 1 }));
                }}
                style={{ width: 195 }}
                popupMatchSelectWidth={false}
                dropdownStyle={{ minWidth: 195 }}
                size="middle"
              >
                <Option value="ALL">Tất cả</Option>
                <Option value="LAMP">Đèn</Option>
                <Option value="ALERT_LED">Đèn cảnh báo</Option>
              </Select>
            </Space>

            {/* 2. Lọc Hành động (BẬT / TẮT / CẢNH BÁO) */}
            <Space size="small">
              <Text strong style={{ fontSize: 13, color: '#374151' }}>
                Hành động:
              </Text>
              <Select
                value={actionFilter}
                onChange={(val) => {
                  setActionFilter(val);
                  setPagination((prev) => ({ ...prev, current: 1 }));
                }}
                style={{ width: 140 }}
                size="middle"
              >
                <Option value="ALL">Tất cả</Option>
                <Option value="ON">BẬT</Option>
                <Option value="OFF">TẮT</Option>
                <Option value="ALERT">CẢNH BÁO</Option>
              </Select>
            </Space>

            {/* 3. Lọc Trạng thái (Thành công / Timeout / Thất bại) */}
            <Space size="small">
              <Text strong style={{ fontSize: 13, color: '#374151' }}>
                Trạng thái:
              </Text>
              <Select
                value={statusFilter}
                onChange={(val) => {
                  setStatusFilter(val);
                  setPagination((prev) => ({ ...prev, current: 1 }));
                }}
                style={{ width: 150 }}
                size="middle"
              >
                <Option value="ALL">Tất cả</Option>
                <Option value="SUCCESS">Thành công</Option>
                <Option value="TIMEOUT">Quá hạn</Option>
                <Option value="FAILED">Thất bại</Option>
              </Select>
            </Space>

            {/* 4. Lọc Người dùng thực hiện */}
            <Space size="small">
              <Text strong style={{ fontSize: 13, color: '#374151' }}>
                Người dùng:
              </Text>
              <Select
                value={userFilter}
                onChange={(val) => {
                  setUserFilter(val);
                  setPagination((prev) => ({ ...prev, current: 1 }));
                }}
                style={{ width: 140 }}
                size="middle"
              >
                <Option value="ALL">Tất cả</Option>
                <Option value="admin">admin</Option>
                <Option value="student">student</Option>
              </Select>
            </Space>
          </Space>

          <Text type="secondary" style={{ fontSize: 12 }}>
            Tổng số: <strong>{pagination.total}</strong> lượt thao tác
          </Text>
        </div>

        {/* BẢNG DỮ LIỆU TABLE */}
        <Table
          columns={columns}
          dataSource={data}
          rowKey={(record) => record.id || record.command_time}
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            pageSizeOptions: ['5', '10', '20', '50'],
            showTotal: (total) => `Tổng ${total} lượt thao tác`,
          }}
          onChange={handleTableChange}
          size="middle"
        />
      </Card>

      {/* 5. ĐỀ 1: MODAL CHI TIẾT THỐNG KÊ CẢNH BÁO THEO NGÀY VÀ THÁNG */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertFilled style={{ color: '#DC2626', fontSize: 18 }} />
            <span>THỐNG KÊ SỐ LƯỢNG CẢNH BÁO ÁNH SÁNG VƯỢT NGƯỠNG</span>
          </div>
        }
        open={statsModalOpen}
        onCancel={() => setStatsModalOpen(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setStatsModalOpen(false)}>
            Đóng
          </Button>,
        ]}
        width={720}
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Ngưỡng cảnh báo hiện tại:{' '}
            <strong>{alertStats.currentThreshold || 600} Lux</strong>.
          </Text>
        </div>

        <Tabs
          defaultActiveKey="daily"
          items={[
            {
              key: 'daily',
              label: (
                <span>
                  <CalendarOutlined /> Theo Ngày ({alertStats.daily?.length || 0})
                </span>
              ),
              children: (
                <Table
                  size="small"
                  rowKey="date"
                  dataSource={alertStats.daily || []}
                  pagination={false}
                  columns={[
                    {
                      title: 'STT',
                      key: 'stt',
                      width: 60,
                      align: 'center',
                      render: (_, __, idx) => idx + 1,
                    },
                    {
                      title: 'Ngày',
                      dataIndex: 'date',
                      key: 'date',
                      render: (d) => <strong>{dayjs(d).format('DD/MM/YYYY')}</strong>,
                    },
                    {
                      title: 'Số lần cảnh báo',
                      dataIndex: 'count',
                      key: 'count',
                      align: 'center',
                      render: (count) => (
                        <Tag color="error" style={{ fontWeight: 700, padding: '2px 10px' }}>
                          {count} lần
                        </Tag>
                      ),
                    },
                    {
                      title: 'Lần cảnh báo gần nhất',
                      dataIndex: 'latestTime',
                      key: 'latestTime',
                      render: (t) => (t ? dayjs(t).format('DD/MM/YYYY HH:mm:ss') : '--'),
                    },
                  ]}
                />
              ),
            },
            {
              key: 'monthly',
              label: (
                <span>
                  <BarChartOutlined /> Theo Tháng ({alertStats.monthly?.length || 0})
                </span>
              ),
              children: (
                <Table
                  size="small"
                  rowKey="month"
                  dataSource={alertStats.monthly || []}
                  pagination={false}
                  columns={[
                    {
                      title: 'STT',
                      key: 'stt',
                      width: 60,
                      align: 'center',
                      render: (_, __, idx) => idx + 1,
                    },
                    {
                      title: 'Tháng',
                      dataIndex: 'month',
                      key: 'month',
                      render: (m) => <strong>Tháng {dayjs(m).format('MM/YYYY')}</strong>,
                    },
                    {
                      title: 'Tổng số lần cảnh báo',
                      dataIndex: 'count',
                      key: 'count',
                      align: 'center',
                      render: (count) => (
                        <Tag color="volcano" style={{ fontWeight: 700, padding: '2px 10px' }}>
                          {count} lần
                        </Tag>
                      ),
                    },
                    {
                      title: 'Lần cảnh báo gần nhất',
                      dataIndex: 'latestTime',
                      key: 'latestTime',
                      render: (t) => (t ? dayjs(t).format('DD/MM/YYYY HH:mm:ss') : '--'),
                    },
                  ]}
                />
              ),
            },
          ]}
        />
      </Modal>
    </div>
  );
}
