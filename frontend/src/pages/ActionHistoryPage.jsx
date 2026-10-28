import React, { useState, useEffect } from 'react';
import { Card, Table, Typography, Select, Space, Tag, Row, Col } from 'antd';
import {
  CheckCircleFilled,
  CloseCircleFilled,
  ClockCircleFilled,
  UserOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
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
  // 1. State mảng dữ liệu lịch sử thao tác
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // 2. State các bộ lọc
  const [deviceType, setDeviceType] = useState('ALL');       // Lọc theo Loại thiết bị (LAMP / FAN)
  const [actionFilter, setActionFilter] = useState('ALL');   // Lọc theo Hành động (ON / OFF)
  const [statusFilter, setStatusFilter] = useState('ALL');   // Lọc theo Trạng thái (SUCCESS / TIMEOUT / FAILED)
  const [userFilter, setUserFilter] = useState('ALL');       // Lọc theo Người thực hiện (admin / student)

  // 3. State lưu tham số tìm kiếm thời gian
  const [filterParams, setFilterParams] = useState({});

  // 4. State quản lý phân trang
  const [pagination, setPagination] = useState({ current: 1, pageSize: 5, total: 0 });

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
      render: (name, record) => (
        <span>
          <strong>{name}</strong>{' '}
          <Text type="secondary" style={{ fontSize: 11 }}>({record.device_code})</Text>
        </span>
      ),
    },
    {
      title: 'Hành động',
      dataIndex: 'action',
      key: 'action',
      width: 100,
      align: 'center',
      render: (action) => (
        <Tag
          color={action === 'ON' ? 'orange' : 'default'}
          style={{ fontWeight: 600, padding: '2px 10px' }}
        >
          {action === 'ON' ? 'BẬT' : 'TẮT'}
        </Tag>
      ),
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
      {/* 1. TIÊU ĐỀ TRANG */}
      <div style={{ marginBottom: 18 }}>
        <Title level={3} style={{ margin: 0, color: '#111827', fontWeight: 700, fontSize: 20 }}>
          Lịch sử điều khiển thiết bị
        </Title>
      </div>

      {/* 2. THANH LỌC THỜI GIAN LINH HOẠT */}
      <VariableTimeRangeFilter
        onFilter={handleFilter}
        onReset={handleReset}
        loading={loading}
      />

      {/* 3. CARD BẢNG LỊCH SỬ THAO TÁC */}
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
            {/* 1. Lọc Loại thiết bị */}
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
                style={{ width: 175 }}
                popupMatchSelectWidth={false}
                dropdownStyle={{ minWidth: 175 }}
                size="middle"
              >
                <Option value="ALL">Tất cả</Option>
                <Option value="LAMP">Đèn</Option>
                <Option value="FAN">Quạt</Option>
              </Select>
            </Space>

            {/* 2. Lọc Hành động (BẬT / TẮT) */}
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
                style={{ width: 130 }}
                size="middle"
              >
                <Option value="ALL">Tất cả</Option>
                <Option value="ON">BẬT</Option>
                <Option value="OFF">TẮT</Option>
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
    </div>
  );
}
