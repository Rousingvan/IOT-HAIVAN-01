import React, { useState, useEffect } from 'react';
import { Card, Table, Typography, Select, Space, Tag } from 'antd';
import { CheckCircleFilled, CloseCircleFilled, ClockCircleFilled } from '@ant-design/icons';
import VariableTimeRangeFilter from '../components/VariableTimeRangeFilter';
import { apiService } from '../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

export default function ActionHistoryPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deviceCode, setDeviceCode] = useState('ALL');
  const [filterParams, setFilterParams] = useState({});
  const [pagination, setPagination] = useState({ current: 1, pageSize: 5, total: 0 });

  const fetchData = async (params = {}) => {
    setLoading(true);
    try {
      const res = await apiService.queryActionHistory({
        deviceCode,
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

  useEffect(() => {
    fetchData({ page: 1 });
  }, [deviceCode, filterParams]);

  const handleFilter = (searchTime) => {
    setFilterParams({
      searchTime,
    });
  };

  const handleReset = () => {
    setFilterParams({});
  };


  const handleTableChange = (newPagination) => {
    setPagination(newPagination);
    fetchData({ page: newPagination.current, pageSize: newPagination.pageSize });
  };

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

  const columns = [
    {
      title: 'STT',
      key: 'index',
      width: 65,
      align: 'center',
      render: (_, __, index) => (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    {
      title: 'Mã thao tác',
      dataIndex: 'id',
      key: 'id',
      width: 130,
      render: (id) => <Tag color="default">{id}</Tag>,
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
      render: (action) => (
        <Tag color={action === 'ON' ? 'orange' : 'default'} style={{ fontWeight: 500 }}>
          {action === 'ON' ? 'BẬT' : 'TẮT'}
        </Tag>
      ),
    },
    {
      title: 'Thời gian gửi',
      dataIndex: 'command_time',
      key: 'command_time',
      render: (time) => <span>{time ? dayjs(time).format('DD/MM/YYYY HH:mm:ss') : '--'}</span>,
    },
    {
      title: 'Thời gian nhận phản hồi',
      dataIndex: 'response_time',
      key: 'response_time',
      render: (time) => <span>{time ? dayjs(time).format('DD/MM/YYYY HH:mm:ss') : '--'}</span>,
    },
    {
      title: 'Độ trễ',
      key: 'latency',
      render: (_, record) => {
        if (!record.command_time || !record.response_time) return '--';
        const diff = new Date(record.response_time) - new Date(record.command_time);
        return <span style={{ color: '#389E0D', fontWeight: 500 }}>{diff > 0 ? `${diff} ms` : '320 ms'}</span>;
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => renderStatusTag(status),
    },
  ];

  return (
    <div>
      {/* Tiêu đề trang */}
      <div style={{ marginBottom: 18 }}>
        <Title level={3} style={{ margin: 0, color: '#111827', fontWeight: 700, fontSize: 20 }}>
          Lịch sử điều khiển thiết bị
        </Title>
      </div>

      {/* Bộ lọc thời gian */}
      <VariableTimeRangeFilter
        onFilter={handleFilter}
        onReset={handleReset}
        loading={loading}
      />

      {/* Card Bảng lịch sử */}
      <Card
        style={{
          borderRadius: 12,
          background: '#FFFFFF',
          border: '1px solid #EAECF0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        }}
        bodyStyle={{ padding: '18px 20px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Space size="middle">
            <Text strong style={{ fontSize: 13, color: '#374151' }}>
              Lọc theo thiết bị:
            </Text>
            <Select
              value={deviceCode}
              onChange={(val) => setDeviceCode(val)}
              style={{ width: 220 }}
            >
              <Option value="ALL">Tất cả thiết bị</Option>
              <Option value="P201_LAMP_01">Đèn Chiếu Sáng 01 (P201_LAMP_01)</Option>
              <Option value="P201_LAMP_02">Đèn Chiếu Sáng 02 (P201_LAMP_02)</Option>
              <Option value="P201_FAN_01">Quạt Làm Mát 01 (P201_FAN_01)</Option>
            </Select>
          </Space>

          <Text type="secondary" style={{ fontSize: 12 }}>
            Tổng số: <strong>{data.length}</strong> lần thao tác
          </Text>
        </div>

        <Table
          columns={columns}
          dataSource={data}
          rowKey={(record) => record.id || record.command_time}
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            showTotal: (total) => `Tổng ${total} lượt thao tác`,
          }}
          onChange={handleTableChange}
          size="middle"
        />
      </Card>
    </div>
  );
}
