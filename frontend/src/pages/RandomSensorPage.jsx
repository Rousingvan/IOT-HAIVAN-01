import React, { useState, useEffect, useRef } from 'react';
import {
  Row,
  Col,
  Card,
  Typography,
  Space,
  Button,
  Tag,
  Table,
  Input,
  Tooltip,
  message,
} from 'antd';
import {
  ReloadOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import dayjs from 'dayjs';
import { apiService } from '../services/api';
import { getSocket } from '../services/socket';
import IntegratedSensorCard from '../components/IntegratedSensorCard';

const { Title, Text } = Typography;

export default function RandomSensorPage() {
  // State cảm biến mới nhất
  const [latest, setLatest] = useState({
    s1: 0,
    s2: 0,
    s3: 0,
    alert_s1: false,
    alert_s2: false,
    alert_s3: false,
    mode: 'AUTO',
    measured_at: new Date().toISOString(),
  });

  // State lịch sử điểm đo vẽ biểu đồ (30 điểm)
  const [chartData, setChartData] = useState([]);

  // State bảng lịch sử từ MongoDB
  const [tableData, setTableData] = useState([]);
  const [tableTotal, setTableTotal] = useState(0);
  const [loadingTable, setLoadingTable] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [searchTime, setSearchTime] = useState('');

  const [actionLoading, setActionLoading] = useState(false);
  const latestRef = useRef(latest);
  latestRef.current = latest;

  // 1. Tải dữ liệu ban đầu
  const fetchInitialData = async () => {
    try {
      const [latestRes, historyRes] = await Promise.all([
        apiService.getRandomSensorsLatest(),
        apiService.getRandomSensorsHistory(30),
      ]);

      if (latestRes) {
        setLatest(latestRes);
      }

      if (Array.isArray(historyRes)) {
        const formatted = historyRes.map((p) => ({
          time: dayjs(p.measured_at).format('HH:mm:ss'),
          s1_val: p.s1,
          s2_val: p.s2,
          s3_val: p.s3,
          s1_pct: Math.min(100, +((p.s1 / 11) * 100).toFixed(1)),
          s2_pct: Math.min(100, +((p.s2 / 101) * 100).toFixed(1)),
          s3_pct: Math.min(100, +((p.s3 / 1001) * 100).toFixed(1)),
        }));
        setChartData(formatted);
      }
    } catch (err) {
      console.warn('Lỗi tải dữ liệu ban đầu:', err.message);
    }
  };

  // 2. Tải bảng lịch sử từ CSDL
  const fetchTableData = async (page = 1, pageSize = 10, search = '') => {
    setLoadingTable(true);
    try {
      const params = {
        page,
        pageSize,
      };
      if (search && search.trim()) {
        params.searchTime = search.trim();
      }

      const res = await apiService.queryRandomSensorsData(params);
      setTableData(res.data || []);
      setTableTotal(res.total || 0);
      setPagination({ current: page, pageSize });
    } catch (err) {
      console.warn('Lỗi tải bảng lịch sử:', err.message);
    } finally {
      setLoadingTable(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
    fetchTableData(1, 10, '');
  }, []);

  // 3. Lắng nghe dữ liệu thời gian thực qua Socket.io
  useEffect(() => {
    const socket = getSocket();

    const handleRealtimeData = (point) => {
      setLatest({
        s1: point.s1,
        s2: point.s2,
        s3: point.s3,
        alert_s1: point.alert_s1,
        alert_s2: point.alert_s2,
        alert_s3: point.alert_s3,
        mode: point.mode || 'AUTO',
        measured_at: point.measured_at || new Date().toISOString(),
      });

      // Cập nhật biểu đồ
      const newPoint = {
        time: dayjs(point.measured_at).format('HH:mm:ss'),
        s1_val: point.s1,
        s2_val: point.s2,
        s3_val: point.s3,
        s1_pct: Math.min(100, +((point.s1 / 11) * 100).toFixed(1)),
        s2_pct: Math.min(100, +((point.s2 / 101) * 100).toFixed(1)),
        s3_pct: Math.min(100, +((point.s3 / 1001) * 100).toFixed(1)),
      };

      setChartData((prev) => [...prev.slice(-29), newPoint]);

      // Cập nhật bảng nếu đang ở trang 1 và không có bộ lọc tìm kiếm
      if (pagination.current === 1 && !searchTime.trim()) {
        setTableData((prev) => [
          {
            id: point.id || `RT_${Date.now()}`,
            s1: point.s1,
            s2: point.s2,
            s3: point.s3,
            alert_s1: point.alert_s1,
            alert_s2: point.alert_s2,
            alert_s3: point.alert_s3,
            mode: point.mode || 'AUTO',
            measured_at: point.measured_at || new Date().toISOString(),
          },
          ...prev.slice(0, 9),
        ]);
        setTableTotal((prev) => prev + 1);
      }
    };

    socket.on('random_sensors', handleRealtimeData);
    return () => {
      socket.off('random_sensors', handleRealtimeData);
    };
  }, [pagination.current, searchTime]);

  // 4. Xử lý gửi lệnh test thủ công từng cảm biến
  const handleSetManual = async (sensorKey, val) => {
    setActionLoading(true);
    try {
      const current = latestRef.current;
      const body = {
        mode: 'MANUAL',
        s1: sensorKey === 's1' ? val : current.s1,
        s2: sensorKey === 's2' ? val : current.s2,
        s3: sensorKey === 's3' ? val : current.s3,
      };

      await apiService.triggerRandomSensorsManualTest(body);
      message.success(`Đã gửi lệnh đặt ${sensorKey.toUpperCase()} = ${val} tới ESP32`);
    } catch (err) {
      message.error(err.message || 'Lỗi gửi lệnh kiểm thử');
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Xử lý đặt lại chế độ Random tự động
  const handleResetAuto = async () => {
    setActionLoading(true);
    try {
      await apiService.triggerRandomSensorsManualTest({ mode: 'AUTO' });
      message.success('Đã khôi phục chế độ Random tự động trên ESP32');
    } catch (err) {
      message.error(err.message || 'Lỗi khôi phục tự động');
    } finally {
      setActionLoading(false);
    }
  };

  // Cấu hình các cột của Bảng Lịch sử CSDL
  const columns = [
    {
      title: 'STT',
      key: 'stt',
      width: 60,
      align: 'center',
      render: (_, __, idx) => (pagination.current - 1) * pagination.pageSize + idx + 1,
    },
    {
      title: 'Cảm biến 1 (0–11)',
      dataIndex: 's1',
      key: 's1',
      align: 'center',
      render: (val, record) => (
        <Space size={4}>
          <Text strong style={{ color: record.alert_s1 ? '#cf1322' : '#111827' }}>
            {val}
          </Text>
          {record.alert_s1 && <Tag color="error">Vượt &gt; 5.5</Tag>}
        </Space>
      ),
    },
    {
      title: 'Cảm biến 2 (0–101)',
      dataIndex: 's2',
      key: 's2',
      align: 'center',
      render: (val, record) => (
        <Space size={4}>
          <Text strong style={{ color: record.alert_s2 ? '#cf1322' : '#111827' }}>
            {val}
          </Text>
          {record.alert_s2 && <Tag color="error">Vượt &gt; 50.5</Tag>}
        </Space>
      ),
    },
    {
      title: 'Cảm biến 3 (0–1001)',
      dataIndex: 's3',
      key: 's3',
      align: 'center',
      render: (val, record) => (
        <Space size={4}>
          <Text strong style={{ color: record.alert_s3 ? '#cf1322' : '#111827' }}>
            {val}
          </Text>
          {record.alert_s3 && <Tag color="error">Vượt &gt; 500.5</Tag>}
        </Space>
      ),
    },
    {
      title: 'Trạng thái cảnh báo',
      key: 'alerts',
      render: (_, record) => {
        const alerts = [];
        if (record.alert_s1) alerts.push('CB1 (D25)');
        if (record.alert_s2) alerts.push('CB2 (D26)');
        if (record.alert_s3) alerts.push('CB3 (D27)');

        if (alerts.length === 0) {
          return <Tag color="success">An toàn</Tag>;
        }
        return (
          <Space size={4} wrap>
            {alerts.map((a) => (
              <Tag color="error" key={a}>
                {a}
              </Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: 'Chế độ',
      dataIndex: 'mode',
      key: 'mode',
      width: 100,
      align: 'center',
      render: (mode) => (
        <Tag color={mode === 'MANUAL' ? 'orange' : 'blue'}>
          {mode === 'MANUAL' ? 'Thủ công' : 'Tự động'}
        </Tag>
      ),
    },
    {
      title: 'Thời gian đo',
      dataIndex: 'measured_at',
      key: 'measured_at',
      render: (time) => {
        const timeStr = time ? dayjs(time).format('DD/MM/YYYY HH:mm:ss') : '--';
        return (
          <Space size={6}>
            <Text style={{ fontSize: 13 }}>{timeStr}</Text>
            <Tooltip title="Sao chép mốc thời gian">
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined style={{ fontSize: 13, color: '#1890ff' }} />}
                style={{ padding: 0, width: 22, height: 22 }}
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(timeStr);
                  message.success(`Đã sao chép: ${timeStr}`);
                }}
              />
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 1. Header Trang */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <Title level={3} style={{ margin: 0, fontWeight: 700, color: '#111827', fontSize: 20 }}>
            Giám sát 3 Cảm biến Ngẫu nhiên & LED Cảnh báo
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Đề 3: Random phần cứng ESP32 (0–11, 0–101, 0–1001) | LED nháy 500ms khi &gt; 50% trên chân D25, D26, D27
          </Text>
        </div>

        <Space size="middle">
          <Tag color={latest.mode === 'MANUAL' ? 'orange' : 'blue'} style={{ fontSize: 12, padding: '4px 10px' }}>
            Chế độ: {latest.mode === 'MANUAL' ? 'Thủ công' : 'Tự động (ESP32)'}
          </Tag>
          {latest.mode === 'MANUAL' && (
            <Button
              type="primary"
              onClick={handleResetAuto}
              loading={actionLoading}
              size="middle"
            >
              Khôi phục Random Tự động
            </Button>
          )}
        </Space>
      </div>

      {/* 2. Hàng 1: 3 Thẻ Cảm Biến Tích Hợp (Kèm Panel Kiểm Thử Ngay Dưới Mỗi Thẻ) */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <IntegratedSensorCard
            sensorKey="s1"
            name="Cảm biến 1"
            rangeLabel="Dải 0 – 11"
            max={11}
            threshold={5.5}
            value={latest.s1}
            isAlert={latest.alert_s1}
            mode={latest.mode}
            quickOverVal={8}
            quickSafeVal={3}
            onSetManual={handleSetManual}
            onResetAuto={handleResetAuto}
            loading={actionLoading}
          />
        </Col>

        <Col xs={24} md={8}>
          <IntegratedSensorCard
            sensorKey="s2"
            name="Cảm biến 2"
            rangeLabel="Dải 0 – 101"
            max={101}
            threshold={50.5}
            value={latest.s2}
            isAlert={latest.alert_s2}
            mode={latest.mode}
            quickOverVal={75}
            quickSafeVal={25}
            onSetManual={handleSetManual}
            onResetAuto={handleResetAuto}
            loading={actionLoading}
          />
        </Col>

        <Col xs={24} md={8}>
          <IntegratedSensorCard
            sensorKey="s3"
            name="Cảm biến 3"
            rangeLabel="Dải 0 – 1001"
            max={1001}
            threshold={500.5}
            value={latest.s3}
            isAlert={latest.alert_s3}
            mode={latest.mode}
            quickOverVal={800}
            quickSafeVal={200}
            onSetManual={handleSetManual}
            onResetAuto={handleResetAuto}
            loading={actionLoading}
          />
        </Col>
      </Row>

      {/* 3. Hàng 2: Biểu đồ Diễn biến Tỷ lệ (%) 3 Cảm biến với Đường Ngưỡng 50% */}
      <Card
        style={{
          borderRadius: 10,
          border: '1px solid #e5e7eb',
          background: '#ffffff',
        }}
        bodyStyle={{ padding: '16px 20px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text strong style={{ fontSize: 14, color: '#111827' }}>
            Biểu đồ diễn biến tỷ lệ (%) 3 cảm biến theo thời gian
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Đường đứt nét đỏ biểu thị ngưỡng cảnh báo 50%
          </Text>
        </div>

        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="time" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
              <RechartsTooltip
                formatter={(val, name, item) => {
                  if (name === 'CB1 (%)') return [`${val}% (Giá trị: ${item.payload.s1_val}/11)`, name];
                  if (name === 'CB2 (%)') return [`${val}% (Giá trị: ${item.payload.s2_val}/101)`, name];
                  if (name === 'CB3 (%)') return [`${val}% (Giá trị: ${item.payload.s3_val}/1001)`, name];
                  return [val, name];
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <ReferenceLine y={50} stroke="#ff4d4f" strokeDasharray="5 5" label={{ value: 'Ngưỡng 50%', fill: '#ff4d4f', fontSize: 11 }} />
              <Line type="monotone" dataKey="s1_pct" name="CB1 (%)" stroke="#1890ff" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="s2_pct" name="CB2 (%)" stroke="#52c41a" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="s3_pct" name="CB3 (%)" stroke="#fa8c16" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* 4. Hàng 3: Bảng Dữ Liệu Lưu CSDL MongoDB */}
      <Card
        style={{
          borderRadius: 10,
          border: '1px solid #e5e7eb',
          background: '#ffffff',
        }}
        bodyStyle={{ padding: '16px 20px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <Text strong style={{ fontSize: 14, color: '#111827' }}>
            Dữ liệu cảm biến lưu trữ trong CSDL (MongoDB)
          </Text>

          <Space size="middle">
            <Input.Search
              placeholder="Tìm theo mốc thời gian (VD: 05/11/2026)..."
              value={searchTime}
              onChange={(e) => setSearchTime(e.target.value)}
              onSearch={(val) => fetchTableData(1, pagination.pageSize, val)}
              style={{ width: 280 }}
              allowClear
              size="middle"
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                setSearchTime('');
                fetchTableData(1, pagination.pageSize, '');
              }}
              size="middle"
            >
              Làm mới
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={tableData}
          rowKey={(r) => r.id || r.measured_at}
          loading={loadingTable}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: tableTotal,
            showSizeChanger: true,
            pageSizeOptions: ['5', '10', '20', '50'],
            showTotal: (total) => `Tổng số: ${total} bản ghi`,
            onChange: (page, pageSize) => fetchTableData(page, pageSize, searchTime),
          }}
          size="middle"
        />
      </Card>
    </div>
  );
}
