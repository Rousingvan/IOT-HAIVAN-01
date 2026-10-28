import React, { useState, useEffect, useMemo } from 'react';
import { Card, Table, Typography, Space, Tag, Select, Input, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { apiService } from '../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

/**
 * ==============================================================================
 * TRANG: DataSensorPage (Tra Cứu Dữ Liệu Cảm Biến)
 * BẢNG DỮ LIỆU ĐÃ ĐƯỢC CHUẨN HÓA THEO MẪU:
 * 1. ID: Mã định danh bản ghi đo đạc
 * 2. Tên cảm biến: Tag (Nhiệt độ, Độ ẩm, Ánh sáng)
 * 3. Giá trị: Giá trị đo kèm đơn vị (Ví dụ: 322.6 Lux, 68.0 %, 29.8 °C)
 * 4. Thời gian: Định dạng HH:mm:ss DD/MM/YYYY
 * 
 * BỘ LỌC ĐẶT CẠNH Ô TÌM KIẾM:
 * - Dropdown chọn: Tất cả / Thời gian / Nhiệt độ / Độ ẩm / Ánh sáng
 * - Ô nhập: "Nhập giá trị tìm kiếm..."
 * - Nút "Làm mới" với icon reload
 * ==============================================================================
 */

export default function DataSensorPage() {
  // State mảng dữ liệu gốc từ Backend
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(false);

  // State bộ lọc (Tất cả / Thời gian / Nhiệt độ / Độ ẩm / Ánh sáng)
  const [filterType, setFilterType] = useState('ALL');

  // State chuỗi tìm kiếm
  const [searchValue, setSearchValue] = useState('');

  // State quản lý phân trang
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  // Hàm gọi API lấy dữ liệu từ Backend
  const fetchData = async (params = {}) => {
    setLoading(true);
    try {
      const apiParams = { ...params };
      if (filterType === 'TIME' && searchValue.trim()) {
        apiParams.searchTime = searchValue.trim();
      }
      const res = await apiService.querySensorData(apiParams);
      setRawData(res.data || []);
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
        ? dayjs(item.measured_at).format('HH:mm:ss DD/MM/YYYY')
        : '';
      const isoTime = item.measured_at ? item.measured_at.toLowerCase() : '';

      // Khởi tạo đối tượng từng dòng cảm biến
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

      // 1. KHI CHƯA NHẬP GIÁ TRỊ TÌM KIẾM (query rỗng):
      // Dù dropdown đang chọn loại nào (Nhiệt độ, Độ ẩm, Ánh sáng, Thời gian),
      // dữ liệu CHƯA BỊ LỌC NGAY, hiển thị đầy đủ tất cả các dòng cảm biến.
      if (!query) {
        rows.push(lightRow, humidRow, tempRow);
        return;
      }

      // 2. KHI ĐÃ NHẬP GIÁ TRỊ VÀO Ô TÌM KIẾM:
      // Thực hiện lọc kết hợp theo cả Loại cảm biến (filterType) và Giá trị (query)
      const matchTime = formattedTime.toLowerCase().includes(query) || isoTime.includes(query);

      const tempValStr = item.temperature !== undefined && item.temperature !== null ? `${item.temperature}` : '';
      const matchTempVal =
        tempValStr.includes(query) ||
        `${tempValStr} °c`.toLowerCase().includes(query) ||
        `${tempValStr}°c`.toLowerCase().includes(query) ||
        `${tempValStr} c`.toLowerCase().includes(query);

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
      } else if (filterType === 'TIME') {
        if (matchTime) {
          rows.push(lightRow, humidRow, tempRow);
        }
      } else if (filterType === 'TEMP') {
        if (matchTempVal) {
          rows.push(tempRow);
        }
      } else if (filterType === 'HUMID') {
        if (matchHumidVal) {
          rows.push(humidRow);
        }
      } else if (filterType === 'LIGHT') {
        if (matchLightVal) {
          rows.push(lightRow);
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
          <span style={{ fontWeight: 700, color: '#2F54EB', fontSize: 14 }}>
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
      render: (time, record) => (
        <span style={{ color: '#1F2937', fontWeight: 500, fontSize: 13 }}>
          {record.formattedTime || (time ? dayjs(time).format('HH:mm:ss DD/MM/YYYY') : '--')}
        </span>
      ),
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
        {/* CỤM BỘ CHỌN LỌC CẠNH Ô TÌM GIÁ TRỊ VÀ NÚT LÀM MỚI (THEO ĐÚNG MẪU) */}
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
          <Space.Compact style={{ width: 520, maxWidth: '100%' }}>
            <Select
              value={filterType}
              onChange={(val) => {
                setFilterType(val);
                setPagination((prev) => ({ ...prev, current: 1 }));
              }}
              style={{ width: 165 }}
              popupMatchSelectWidth={false}
              dropdownStyle={{ minWidth: 165 }}
              size="middle"
            >
              <Option value="ALL">Tất cả</Option>
              <Option value="TIME">Thời gian</Option>
              <Option value="TEMP">Nhiệt độ</Option>
              <Option value="HUMID">Độ ẩm</Option>
              <Option value="LIGHT">Ánh sáng</Option>
            </Select>

            <Input
              placeholder={
                filterType === 'TEMP'
                  ? 'Nhập giá trị nhiệt độ (VD: 30)...'
                  : filterType === 'HUMID'
                  ? 'Nhập giá trị độ ẩm (VD: 70)...'
                  : filterType === 'LIGHT'
                  ? 'Nhập giá trị ánh sáng (VD: 300)...'
                  : filterType === 'TIME'
                  ? 'Nhập thời gian tìm kiếm...'
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

          {/* Nút Làm mới với icon reload xanh nhạt theo mẫu */}
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

        {/* BẢNG DỮ LIỆU THEO YÊU CẦU: ID, Tên cảm biến, Giá trị, Thời gian */}
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
