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

const { Title, Text } = Typography;

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
        <div style={{ fontWeight: 600, color: '#374151', marginBottom: 4 }}>
          {label}
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
};

export default function SensorAreaChart({ data = [], loading = false }) {
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
        <Space size="small">
          <Tag color="orange" style={{ margin: 0 }}>Nhiệt độ (°C)</Tag>
          <Tag color="blue" style={{ margin: 0 }}>Độ ẩm (%)</Tag>
          <Tag color="gold" style={{ margin: 0 }}>Ánh sáng (Lux)</Tag>
        </Space>
      </div>

      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={formattedData}
            margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
          >
            <defs>
              <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#E05318" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#E05318" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="humidGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0284C7" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#0284C7" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="lightGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D97706" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#D97706" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
            <XAxis dataKey="time" stroke="#9CA3AF" fontSize={11} tickLine={false} />
            <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={32} />

            <Area
              type="monotone"
              dataKey="Nhiệt độ"
              stroke="#E05318"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#tempGradient)"
              activeDot={{ r: 5 }}
            />
            <Area
              type="monotone"
              dataKey="Độ ẩm"
              stroke="#0284C7"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#humidGradient)"
              activeDot={{ r: 5 }}
            />
            <Area
              type="monotone"
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
