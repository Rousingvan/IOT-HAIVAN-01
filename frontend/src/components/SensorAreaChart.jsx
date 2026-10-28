import React from 'react';
import { Card, Typography, Space, Tag } from 'antd';
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
import dayjs from 'dayjs';
import { BellTwoTone } from '@ant-design/icons';

const { Title, Text } = Typography;

/**
 * Component CustomTooltip: Tùy biến hộp thoại hiển thị dữ liệu khi rê chuột (hover) vào từng điểm trên biểu đồ
 * @param {boolean} active - Cờ tự động bật true khi chuột nằm trên 1 điểm đo
 * @param {Array} payload - Mảng chứa thông số dữ liệu của các đường (Nhiệt độ, Độ ẩm, Ánh sáng) tại điểm hover
 * @param {string} label - Giá trị của trục X tại điểm hover (mốc thời gian HH:mm:ss)
 */
const CustomTooltip = ({ active, payload, label }) => {
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
        {/* Tiêu đề Tooltip: Hiển thị mốc thời gian đo */}
        <div style={{ fontWeight: 600, color: '#374151', marginBottom: 4 }}>
          {label}
        </div>

        {/* Lặp qua mảng payload để in từng giá trị đo kèm đơn vị tương ứng */}
        {payload
          //.filter((item) => item.name !== 'Ánh sáng')
          .map((item, index) => (
            <div key={index} style={{ color: item.color, margin: '2px 0', display: 'flex', justifyItems: 'space-between', gap: 12 }}>
              {/* Dấu chấm tròn cùng màu với đường sóng */}
              {/* <span style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: item.color, display: 'inline-block' }} /> */}
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
};

/**
 * Component SensorAreaChart: Vẽ biểu đồ miền biến động cảm biến theo thời gian thực (20 điểm gần nhất)
 * @param {Array} data - Mảng dữ liệu lịch sử cảm biến truyền từ DashboardPage
 * @param {boolean} loading - Cờ bật hiệu ứng chờ tải (Skeleton loading) của Ant Design Card
 */
export default function SensorAreaChart({ data = [], loading = false }) {
  // Chuẩn hóa dữ liệu thô: Format lại chuỗi thời gian sang HH:mm:ss và gán tên tiếng Việt
  const formattedData = data.map((item) => ({
    time: item.measured_at ? dayjs(item.measured_at).format('HH:mm:ss') : item.time || '',
    'Nhiệt độ': item.temperature,
    'Độ ẩm': item.humidity,
    'Ánh sáng': item.light,
  }));

  return (
    <Card
      loading={loading}
      style={{
        borderRadius: 12,
        background: '#FFFFFF',
        border: '1px solid #EAECF0',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
      }}
      bodyStyle={{ padding: '18px 20px' }}
    >
      {/* Header Biểu đồ: Tiêu đề bên trái và các Tag màu chú giải đơn vị bên phải */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div>
          <Title level={4} style={{ margin: 0, color: '#111827', fontWeight: 600, fontSize: 16 }}>
            Biểu đồ biến động cảm biến
          </Title>
          <Text style={{ fontSize: 12, color: '#6B7280' }}>
            20 chu kỳ đo đạc gần nhất
          </Text>
        </div>

        {/* Nhãn phân biệt màu sắc và đơn vị đo */}
        <Space size="small">
          <Tag color="orange" style={{ margin: 0 }}>Nhiệt độ (°C)</Tag>
          <Tag color="blue" style={{ margin: 0 }}>Độ ẩm (%)</Tag>
          <Tag color="gold" style={{ margin: 0 }}>Ánh sáng (Lux)</Tag>
        </Space>
      </div>

      {/* Khung chứa biểu đồ với chiều cao cố định 320px */}
      <div style={{ width: '100%', height: 320 }}>
        {/* ResponsiveContainer: Tự động co giãn 100% chiều rộng & chiều cao theo màn hình */}
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={formattedData}
            margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
          >
            {/* defs: Định nghĩa hiệu ứng chuyển sắc Gradient SVG cho màu nền dưới các đường sóng */}
            <defs>
              {/* Gradient Nhiệt độ (Màu cam #E05318) */}
              <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#E05318" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#E05318" stopOpacity={0.0} />
              </linearGradient>

              {/* Gradient Độ ẩm (Màu xanh dương #0284C7) */}
              <linearGradient id="humidGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0284C7" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#0284C7" stopOpacity={0.0} />
              </linearGradient>

              {/* Gradient Ánh sáng (Màu vàng hổ phách #D97706) */}
              <linearGradient id="lightGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D97706" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#D97706" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            {/* CartesianGrid: Kẻ lưới đứt nét ngang (vertical={false} ẩn đường kẻ dọc giúp biểu đồ thoáng) */}
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />

            {/* XAxis: Trục hoành hiển thị mốc thời gian (time) */}
            <XAxis dataKey="time" stroke="#9CA3AF" fontSize={11} tickLine={false} />

            {/* YAxis: Trục tung hiển thị thang giá trị đo */}
            <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />

            {/* Tooltip: Hộp thông tin chi tiết khi hover chuột vào điểm */}
            <Tooltip content={<CustomTooltip />} />

            {/* Legend: Chú thích tên các đường biểu đồ ở phía trên */}
            <Legend verticalAlign="top" height={32} />

            {/* Area Nhiệt độ: Đường sóng màu cam cong mượt (type="monotone") */}
            <Area
              type="linear"
              dataKey="Nhiệt độ"
              stroke="#E05318"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#tempGradient)"
              activeDot={{ r: 5 }}
            />

            {/* Area Độ ẩm: Đường sóng màu xanh dương */}
            <Area
              type="linear"
              dataKey="Độ ẩm"
              stroke="#0284C7"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#humidGradient)"
              activeDot={{ r: 5 }}
            />

            {/* Area Ánh sáng: Đường sóng màu vàng hổ phách */}
            <Area
              type="linear"
              dataKey="Ánh sáng"
              stroke="#D97706"
              strokeWidth={1.5}
              fillOpacity={1}
              fill="url(#lightGradient)"
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
