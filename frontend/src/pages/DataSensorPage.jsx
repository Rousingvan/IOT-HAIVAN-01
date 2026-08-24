import React, { useState, useEffect, useMemo } from 'react';
import { Card, Table, Typography, Space, Tag, Checkbox, Row, Col } from 'antd';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import VariableTimeRangeFilter from '../components/VariableTimeRangeFilter';
import { apiService } from '../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const sensorOptions = [
  { label: 'Nhiệt độ (°C)', value: 'TEMP', color: '#E05318' },
  { label: 'Độ ẩm (%)', value: 'HUMID', color: '#0284C7' },
  { label: 'Ánh sáng (Lux)', value: 'LIGHT', color: '#D97706' },
];

export default function DataSensorPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  // Đa lựa chọn loại thông số: Mặc định chọn cả 3 loại ['TEMP', 'HUMID', 'LIGHT']
  const [selectedSensors, setSelectedSensors] = useState(['TEMP', 'HUMID', 'LIGHT']);
  const [filterParams, setFilterParams] = useState({});
  const [pagination, setPagination] = useState({ current: 1, pageSize: 5, total: 0 });

  const fetchData = async (params = {}) => {
    setLoading(true);
    try {
      const res = await apiService.querySensorData({
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
      console.error('Fetch sensor data error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData({ page: 1 });
  }, [filterParams]);

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

  // Xử lý chọn loại cảm biến (có tùy chọn Tất cả hoặc 1, 2, 3 loại)
  const handleSensorTypeChange = (checkedValues) => {
    if (checkedValues.length === 0) {
      // Đảm bảo luôn có ít nhất 1 loại được chọn
      setSelectedSensors(['TEMP']);
    } else {
      setSelectedSensors(checkedValues);
    }
  };

  // Cấu hình các cột hiển thị ĐỘNG theo loại được chọn
  const columns = useMemo(() => {
    const cols = [
      {
        title: 'STT',
        key: 'index',
        width: 65,
        align: 'center',
        render: (_, __, index) => (pagination.current - 1) * pagination.pageSize + index + 1,
      },
      {
        title: 'Mã bản ghi',
        dataIndex: 'id',
        key: 'id',
        width: 120,
        render: (id) => <Tag color="default">{id}</Tag>,
      },
    ];

    if (selectedSensors.includes('TEMP')) {
      cols.push({
        title: 'Nhiệt độ (°C)',
        dataIndex: 'temperature',
        key: 'temperature',
        sorter: (a, b) => a.temperature - b.temperature,
        render: (val) => (
          <span style={{ fontWeight: 600, color: val > 35 ? '#CF1322' : '#E05318' }}>
            {val} °C {val > 35 && '🔥'}
          </span>
        ),
      });
    }

    if (selectedSensors.includes('HUMID')) {
      cols.push({
        title: 'Độ ẩm (%)',
        dataIndex: 'humidity',
        key: 'humidity',
        sorter: (a, b) => a.humidity - b.humidity,
        render: (val) => <span style={{ fontWeight: 600, color: '#0284C7' }}>{val} %</span>,
      });
    }

    if (selectedSensors.includes('LIGHT')) {
      cols.push({
        title: 'Ánh sáng (Lux)',
        dataIndex: 'light',
        key: 'light',
        sorter: (a, b) => a.light - b.light,
        render: (val) => <span style={{ fontWeight: 600, color: '#D97706' }}>{val} Lux</span>,
      });
    }

    cols.push({
      title: 'Thời gian đo đạc',
      dataIndex: 'measured_at',
      key: 'measured_at',
      sorter: (a, b) => new Date(a.measured_at) - new Date(b.measured_at),
      render: (time) => (
        <span>{time ? dayjs(time).format('DD/MM/YYYY HH:mm:ss') : '--'}</span>
      ),
    });

    return cols;
  }, [selectedSensors, pagination]);

  // Format dữ liệu cho biểu đồ tra cứu bên dưới
  const chartData = useMemo(() => {
    // Sắp xếp thời gian tăng dần để vẽ biểu đồ
    return [...data]
      .reverse()
      .map((item) => ({
        time: item.measured_at ? dayjs(item.measured_at).format('HH:mm:ss') : '',
        fullTime: item.measured_at ? dayjs(item.measured_at).format('DD/MM/YYYY HH:mm:ss') : '',
        'Nhiệt độ': selectedSensors.includes('TEMP') ? item.temperature : undefined,
        'Độ ẩm': selectedSensors.includes('HUMID') ? item.humidity : undefined,
        'Ánh sáng': selectedSensors.includes('LIGHT') ? item.light : undefined,
      }));
  }, [data, selectedSensors]);

  return (
    <div>
      {/* Tiêu đề trang */}
      <div style={{ marginBottom: 18 }}>
        <Title level={3} style={{ margin: 0, color: '#111827', fontWeight: 700, fontSize: 20 }}>
          Tra cứu dữ liệu cảm biến
        </Title>
      </div>

      {/* Bộ lọc thời gian chuẩn timestamp.md */}
      <VariableTimeRangeFilter
        onFilter={handleFilter}
        onReset={handleReset}
        loading={loading}
      />

      {/* Card Bảng dữ liệu */}
      <Card
        style={{
          borderRadius: 12,
          background: '#FFFFFF',
          border: '1px solid #EAECF0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          marginBottom: 20,
        }}
        bodyStyle={{ padding: '18px 20px' }}
      >
        {/* Bộ lọc đa lựa chọn loại thông số */}
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
          <Space size="middle" align="center">
            <Text strong style={{ fontSize: 13, color: '#374151' }}>
              Hiển thị thông số:
            </Text>
            <Checkbox.Group
              options={sensorOptions}
              value={selectedSensors}
              onChange={handleSensorTypeChange}
            />
          </Space>

          <Text type="secondary" style={{ fontSize: 12 }}>
            Tổng số bản ghi: <strong>{data.length}</strong>
          </Text>
        </div>

        {/* Bảng dữ liệu tự động thay đổi cột */}
        <Table
          columns={columns}
          dataSource={data}
          rowKey={(record) => record.id || record.measured_at}
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            showTotal: (total) => `Tổng ${total} bản ghi`,
          }}
          onChange={handleTableChange}
          size="middle"
        />
      </Card>

      {/* BIỂU ĐỒ MINH HỌA BIẾN ĐỘNG TRONG KHOẢNG THỜI GIAN TRA CỨU */}
      <Card
        style={{
          borderRadius: 12,
          background: '#FFFFFF',
          border: '1px solid #EAECF0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        }}
        bodyStyle={{ padding: '18px 20px' }}
      >
        <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={4} style={{ margin: 0, color: '#111827', fontWeight: 600, fontSize: 15 }}>
              Biểu đồ biến động theo kết quả tra cứu
            </Title>
          </div>
          <Space>
            {selectedSensors.includes('TEMP') && <Tag color="orange">Nhiệt độ (°C)</Tag>}
            {selectedSensors.includes('HUMID') && <Tag color="blue">Độ ẩm (%)</Tag>}
            {selectedSensors.includes('LIGHT') && <Tag color="gold">Ánh sáng (Lux)</Tag>}
          </Space>
        </div>

        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="qTempGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E05318" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#E05318" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="qHumidGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284C7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0284C7" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="qLightGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D97706" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#D97706" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="time" stroke="#9CA3AF" fontSize={11} tickLine={false} />
              <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div
                        style={{
                          background: '#FFFFFF',
                          padding: '8px 12px',
                          borderRadius: 6,
                          border: '1px solid #E5E7EB',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                          fontSize: 12,
                        }}
                      >
                        <div style={{ fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                          ⏱️ {payload[0]?.payload?.fullTime || label}
                        </div>
                        {payload.map((item, index) => (
                          <div key={index} style={{ color: item.color, margin: '2px 0' }}>
                            <span>{item.name}: </span>
                            <span style={{ fontWeight: 600 }}>
                              {item.value} {item.name === 'Nhiệt độ' ? '°C' : item.name === 'Độ ẩm' ? '%' : 'Lux'}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend verticalAlign="top" height={30} />

              {selectedSensors.includes('TEMP') && (
                <Area
                  type="monotone"
                  dataKey="Nhiệt độ"
                  stroke="#E05318"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#qTempGrad)"
                />
              )}
              {selectedSensors.includes('HUMID') && (
                <Area
                  type="monotone"
                  dataKey="Độ ẩm"
                  stroke="#0284C7"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#qHumidGrad)"
                />
              )}
              {selectedSensors.includes('LIGHT') && (
                <Area
                  type="monotone"
                  dataKey="Ánh sáng"
                  stroke="#D97706"
                  strokeWidth={1.5}
                  fillOpacity={1}
                  fill="url(#qLightGrad)"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
