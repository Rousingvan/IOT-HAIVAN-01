import React, { useState, useEffect, useMemo } from 'react';
import { Card, Table, Typography, Space, Tag, Select, Input, Button, Tooltip, message } from 'antd';
import { ReloadOutlined, CopyOutlined } from '@ant-design/icons';
import { apiService } from '../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

/**
 * ==============================================================================
 * TRANG: DataSensorPage (Tra Cứu Dữ Liệu Cảm Biến)
 * BẢNG DỮ LIỆU ĐÃ ĐƯỢC CHUẨN HÓA VÀ BỔ SUNG CẢ 3 CẢM BIẾN MỚI TỪ DATABASE:
 * 1. Nhiệt độ (°C)
 * 2. Độ ẩm (%)
 * 3. Ánh sáng (Lux)
 * 4. Cảm biến 1 (0–11)
 * 5. Cảm biến 2 (0–101)
 * 6. Cảm biến 3 (0–1001)
 * ==============================================================================
 */

export default function DataSensorPage() {
  // State mảng dữ liệu gốc từ Backend (SensorData + RandomSensorData)
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(false);

  // State bộ lọc (Tất cả / Thời gian / Nhiệt độ / Độ ẩm / Ánh sáng / CB1 / CB2 / CB3)
  const [filterType, setFilterType] = useState('ALL');

  // State chuỗi tìm kiếm
  const [searchValue, setSearchValue] = useState('');

  // State quản lý phân trang
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  // Hàm gọi API lấy dữ liệu song song từ cả SensorData và RandomSensorData trong MongoDB
  const fetchData = async (params = {}) => {
    setLoading(true);
    try {
      const apiParams = { ...params };
      if (filterType === 'TIME' && searchValue.trim()) {
        apiParams.searchTime = searchValue.trim();
      }

      // Gọi đồng thời 2 nguồn dữ liệu trong CSDL MongoDB
      const [resSensor, resRandom] = await Promise.all([
        apiService.querySensorData({ ...apiParams, pageSize: 50 }),
        apiService.queryRandomSensorsData({ ...apiParams, pageSize: 50 }),
      ]);

      const sensorList = (resSensor.data || []).map((item) => ({
        ...item,
        _type: 'ENVIRONMENT',
      }));

      const randomList = (resRandom.data || []).map((item) => ({
        ...item,
        _type: 'RANDOM',
      }));

      // Hợp nhất 2 danh sách và sắp xếp giảm dần theo thời gian đo
      const combined = [...sensorList, ...randomList].sort((a, b) => {
        return new Date(b.measured_at || 0) - new Date(a.measured_at || 0);
      });

      setRawData(combined);
    } catch (err) {
      console.error('Fetch sensor data error:', err);
    } finally {
      setLoading(false);
    }
  };

  // useEffect: Gọi API khi tải trang
  useEffect(() => {
    fetchData();
  }, []);

  // Handler khi bấm nút Làm mới
  const handleReset = () => {
    setFilterType('ALL');
    setSearchValue('');
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchData();
  };

  // Handler khi chuyển trang hoặc đổi số dòng/trang
  const handleTableChange = (newPagination) => {
    setPagination(newPagination);
  };

  // Chuyển đổi dữ liệu và thực hiện lọc theo filterType + searchValue
  const tableData = useMemo(() => {
    const rows = [];
    const query = searchValue.trim().toLowerCase();

    rawData.forEach((item, itemIdx) => {
      const formattedTime = item.measured_at
        ? dayjs(item.measured_at).format('DD/MM/YYYY HH:mm:ss')
        : '';
      const legacyTime = item.measured_at
        ? dayjs(item.measured_at).format('HH:mm:ss DD/MM/YYYY')
        : '';
      const isoTime = item.measured_at ? item.measured_at.toLowerCase() : '';

      const matchTime =
        formattedTime.toLowerCase().includes(query) ||
        legacyTime.toLowerCase().includes(query) ||
        isoTime.includes(query);

      // 1. Nếu bản ghi chứa dữ liệu Môi trường (Nhiệt độ, Độ ẩm, Ánh sáng)
      if (item._type === 'ENVIRONMENT' || item.temperature !== undefined) {
        const lightRow = {
          key: `${item.id || itemIdx}_LIGHT`,
          rawId: item.id,
          sensorType: 'LIGHT',
          sensorName: 'Ánh sáng',
          value: item.light,
          unit: 'Lux',
          color: '#D97706',
          tagColor: 'gold',
          measured_at: item.measured_at,
          formattedTime,
        };

        const humidRow = {
          key: `${item.id || itemIdx}_HUMID`,
          rawId: item.id,
          sensorType: 'HUMID',
          sensorName: 'Độ ẩm',
          value: item.humidity,
          unit: '%',
          color: '#0284C7',
          tagColor: 'blue',
          measured_at: item.measured_at,
          formattedTime,
        };

        const tempRow = {
          key: `${item.id || itemIdx}_TEMP`,
          rawId: item.id,
          sensorType: 'TEMP',
          sensorName: 'Nhiệt độ',
          value: item.temperature,
          unit: '°C',
          color: '#E05318',
          tagColor: 'orange',
          measured_at: item.measured_at,
          formattedTime,
        };

        if (!query) {
          if (filterType === 'ALL' || filterType === 'LIGHT') rows.push(lightRow);
          if (filterType === 'ALL' || filterType === 'HUMID') rows.push(humidRow);
          if (filterType === 'ALL' || filterType === 'TEMP') rows.push(tempRow);
        } else {
          const tempValStr = item.temperature !== undefined && item.temperature !== null ? `${item.temperature}` : '';
          const matchTempVal =
            tempValStr.includes(query) ||
            `${tempValStr} °c`.toLowerCase().includes(query) ||
            `${tempValStr}°c`.toLowerCase().includes(query);

          const humidValStr = item.humidity !== undefined && item.humidity !== null ? `${item.humidity}` : '';
          const matchHumidVal =
            humidValStr.includes(query) ||
            `${humidValStr} %`.includes(query) ||
            `${humidValStr}%`.includes(query);

          const lightValStr = item.light !== undefined && item.light !== null ? `${item.light}` : '';
          const matchLightVal =
            lightValStr.includes(query) ||
            `${lightValStr} lux`.toLowerCase().includes(query) ||
            `${lightValStr}lux`.toLowerCase().includes(query);

          if (filterType === 'ALL') {
            if (matchLightVal || matchTime || 'ánh sáng'.includes(query)) rows.push(lightRow);
            if (matchHumidVal || matchTime || 'độ ẩm'.includes(query)) rows.push(humidRow);
            if (matchTempVal || matchTime || 'nhiệt độ'.includes(query)) rows.push(tempRow);
          } else if (filterType === 'TIME' && matchTime) {
            rows.push(lightRow, humidRow, tempRow);
          } else if (filterType === 'TEMP' && matchTempVal) {
            rows.push(tempRow);
          } else if (filterType === 'HUMID' && matchHumidVal) {
            rows.push(humidRow);
          } else if (filterType === 'LIGHT' && matchLightVal) {
            rows.push(lightRow);
          }
        }
      }

      // 2. Nếu bản ghi chứa dữ liệu 3 Cảm biến ngẫu nhiên (Cảm biến 1, 2, 3)
      if (item._type === 'RANDOM' || item.s1 !== undefined) {
        const s1Row = {
          key: `${item.id || itemIdx}_S1`,
          rawId: item.id,
          sensorType: 'S1',
          sensorName: 'Cảm biến 1',
          value: item.s1,
          unit: 'idx',
          color: '#722ED1',
          tagColor: 'purple',
          measured_at: item.measured_at,
          formattedTime,
          isAlert: item.alert_s1,
        };

        const s2Row = {
          key: `${item.id || itemIdx}_S2`,
          rawId: item.id,
          sensorType: 'S2',
          sensorName: 'Cảm biến 2',
          value: item.s2,
          unit: 'ppm',
          color: '#13C2C2',
          tagColor: 'cyan',
          measured_at: item.measured_at,
          formattedTime,
          isAlert: item.alert_s2,
        };

        const s3Row = {
          key: `${item.id || itemIdx}_S3`,
          rawId: item.id,
          sensorType: 'S3',
          sensorName: 'Cảm biến 3',
          value: item.s3,
          unit: 'ppb',
          color: '#EB2F96',
          tagColor: 'magenta',
          measured_at: item.measured_at,
          formattedTime,
          isAlert: item.alert_s3,
        };

        if (!query) {
          if (filterType === 'ALL' || filterType === 'S1') rows.push(s1Row);
          if (filterType === 'ALL' || filterType === 'S2') rows.push(s2Row);
          if (filterType === 'ALL' || filterType === 'S3') rows.push(s3Row);
        } else {
          const s1ValStr = item.s1 !== undefined && item.s1 !== null ? `${item.s1}` : '';
          const matchS1 = s1ValStr === query || s1ValStr.includes(query) || 'cảm biến 1'.includes(query);

          const s2ValStr = item.s2 !== undefined && item.s2 !== null ? `${item.s2}` : '';
          const matchS2 = s2ValStr === query || s2ValStr.includes(query) || 'cảm biến 2'.includes(query);

          const s3ValStr = item.s3 !== undefined && item.s3 !== null ? `${item.s3}` : '';
          const matchS3 = s3ValStr === query || s3ValStr.includes(query) || 'cảm biến 3'.includes(query);

          if (filterType === 'ALL') {
            if (matchS1 || matchTime) rows.push(s1Row);
            if (matchS2 || matchTime) rows.push(s2Row);
            if (matchS3 || matchTime) rows.push(s3Row);
          } else if (filterType === 'TIME' && matchTime) {
            rows.push(s1Row, s2Row, s3Row);
          } else if (filterType === 'S1' && matchS1) {
            rows.push(s1Row);
          } else if (filterType === 'S2' && matchS2) {
            rows.push(s2Row);
          } else if (filterType === 'S3' && matchS3) {
            rows.push(s3Row);
          }
        }
      }
    });

    // Gán ID tuần tự chuẩn xác cho từng dòng hiển thị
    return rows.map((r, idx) => ({
      ...r,
      id: idx + 1,
    }));
  }, [rawData, filterType, searchValue]);

  // Cấu hình các cột hiển thị theo mẫu (ID, Tên cảm biến, Giá trị, Thời gian)
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: '10%',
      align: 'center',
      sorter: (a, b) => a.id - b.id,
      render: (id, _, index) => (
        <span style={{ fontWeight: 500, color: '#374151' }}>
          {id || (pagination.current - 1) * pagination.pageSize + index + 1}
        </span>
      ),
    },
    {
      title: 'Tên cảm biến',
      dataIndex: 'sensorName',
      key: 'sensorName',
      width: '24%',
      render: (name, record) => (
        <Space size={6}>
          <Tag
            color={record.tagColor}
            style={{
              fontSize: 13,
              fontWeight: 500,
              padding: '2px 10px',
              borderRadius: 6,
            }}
          >
            {name}
          </Tag>
          {record.isAlert && <Tag color="error">Cảnh báo</Tag>}
        </Space>
      ),
    },
    {
      title: 'Giá trị',
      dataIndex: 'value',
      key: 'value',
      width: '28%',
      sorter: (a, b) => a.value - b.value,
      render: (val, record) => {
        return (
          <span style={{ fontWeight: 700, color: record.isAlert ? '#CF1322' : '#2F54EB', fontSize: 14 }}>
            {val} {record.unit}
          </span>
        );
      },
    },
    {
      title: 'Thời gian',
      dataIndex: 'measured_at',
      key: 'measured_at',
      width: '38%',
      sorter: (a, b) => new Date(a.measured_at) - new Date(b.measured_at),
      render: (time, record) => {
        const timeStr = record.formattedTime || (time ? dayjs(time).format('DD/MM/YYYY HH:mm:ss') : '');
        if (!timeStr) return '--';
        return (
          <Space size={6}>
            <span style={{ color: '#1F2937', fontWeight: 500, fontSize: 13 }}>
              {timeStr}
            </span>
            <Tooltip title="Sao chép mốc thời gian & dán vào ô tìm kiếm">
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined style={{ color: '#2F54EB', fontSize: 13 }} />}
                style={{ width: 22, height: 22, padding: 0 }}
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(timeStr);
                  setSearchValue(timeStr);
                  setFilterType('TIME');
                  message.success(`Đã sao chép & lọc mốc: ${timeStr}`);
                }}
              />
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      {/* 1. TIÊU ĐỀ TRANG */}
      <div style={{ marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0, color: '#111827', fontWeight: 700, fontSize: 20 }}>
          Tra cứu dữ liệu cảm biến
        </Title>
      </div>

      {/* 2. CARD BẢNG DỮ LIỆU CẢM BIẾN & BỘ LỌC TÌM KIẾM LIỀN KỀ */}
      <Card
        style={{
          borderRadius: 12,
          background: '#FFFFFF',
          border: '1px solid #EAECF0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        }}
        bodyStyle={{ padding: '18px 20px' }}
      >
        {/* CỤM BỘ CHỌN LỌC CẠNH Ô TÌM GIÁ TRỊ VÀ NÚT LÀM MỚI */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center',
            marginBottom: 16,
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          {/* Nhóm Select và Input liền nhau (Space.Compact) */}
          <Space.Compact style={{ width: 560, maxWidth: '100%' }}>
            <Select
              value={filterType}
              onChange={(val) => {
                setFilterType(val);
                setPagination((prev) => ({ ...prev, current: 1 }));
              }}
              style={{ width: 190 }}
              popupMatchSelectWidth={false}
              dropdownStyle={{ minWidth: 190 }}
              size="middle"
            >
              <Option value="ALL">Tất cả cảm biến</Option>
              <Option value="TIME">Thời gian</Option>
              <Option value="TEMP">Nhiệt độ (°C)</Option>
              <Option value="HUMID">Độ ẩm (%)</Option>
              <Option value="LIGHT">Ánh sáng (Lux)</Option>
              <Option value="S1">Cảm biến 1 (0–11)</Option>
              <Option value="S2">Cảm biến 2 (0–101)</Option>
              <Option value="S3">Cảm biến 3 (0–1001)</Option>
            </Select>

            <Input
              placeholder={
                filterType === 'TEMP'
                  ? 'Nhập nhiệt độ (VD: 30)...'
                  : filterType === 'HUMID'
                  ? 'Nhập độ ẩm (VD: 70)...'
                  : filterType === 'LIGHT'
                  ? 'Nhập ánh sáng (VD: 300)...'
                  : filterType === 'S1'
                  ? 'Nhập giá trị Cảm biến 1 (0-11)...'
                  : filterType === 'S2'
                  ? 'Nhập giá trị Cảm biến 2 (0-101)...'
                  : filterType === 'S3'
                  ? 'Nhập giá trị Cảm biến 3 (0-1001)...'
                  : filterType === 'TIME'
                  ? 'Nhập thời gian (VD: 29/10/2026)...'
                  : 'Nhập giá trị tìm kiếm...'
              }
              value={searchValue}
              onChange={(e) => {
                setSearchValue(e.target.value);
                setPagination((prev) => ({ ...prev, current: 1 }));
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  fetchData();
                }
              }}
              allowClear
              size="middle"
            />
          </Space.Compact>

          {/* Nút Làm mới */}
          <Button
            icon={<ReloadOutlined style={{ color: '#1677FF' }} />}
            onClick={handleReset}
            style={{
              backgroundColor: '#EFF6FF',
              borderColor: '#BFDBFE',
              color: '#1677FF',
              fontWeight: 500,
              borderRadius: 6,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
            size="middle"
          >
            Làm mới
          </Button>

          {/* Hiển thị tổng số kết quả ở bên phải */}
          <div style={{ marginLeft: 'auto' }}>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Tổng số: <strong>{tableData.length}</strong> kết quả
            </Text>
          </div>
        </div>

        {/* BẢNG DỮ LIỆU CẢM BIẾN */}
        <Table
          columns={columns}
          dataSource={tableData}
          loading={loading}
          pagination={{
            ...pagination,
            total: tableData.length,
            showSizeChanger: true,
            pageSizeOptions: ['5', '10', '20', '50'],
            showTotal: (total) => `Tổng ${total} bản ghi`,
          }}
          onChange={handleTableChange}
          size="middle"
        />
      </Card>
    </div>
  );
}
