import React, { useState } from 'react';
import { Card, Typography, Space, Tag, Radio } from 'antd';
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
        {payload.map((item, index) => {
          let unit = '';
          if (item.name === 'Nhiệt độ') unit = '°C';
          else if (item.name === 'Độ ẩm') unit = '%';
          else if (item.name === 'Ánh sáng') unit = 'Lux';
          else if (item.name === 'Độ bụi') unit = 'mg/m³';

          return (
            <div key={index} style={{ color: item.color, margin: '2px 0', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <span>{item.name}: </span>
              <span style={{ fontWeight: 600 }}>
                {item.value} {unit}
              </span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

/**
 * Component SensorAreaChart: Biểu đồ thời gian thực (hỗ trợ hiển thị Độ Bụi Đề 2)
 */
export default function SensorAreaChart({ data = [], loading = false }) {
  // Chế độ xem: 'ALL' (Tất cả), 'ENV' (Nhiệt/Ẩm/Sáng), 'DUST' (Độ bụi riêng biệt)
  const [chartMode, setChartMode] = useState('ALL');

  const formattedData = data.map((item) => ({
    time: item.measured_at ? dayjs(item.measured_at).format('HH:mm:ss') : item.time || '',
    'Nhiệt độ': item.temperature,
    'Độ ẩm': item.humidity,
    'Ánh sáng': item.light,
    'Độ bụi': item.dust !== undefined ? item.dust : 0,
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
            Biểu đồ biến động cảm biến (Realtime)
          </Title>
          <Text style={{ fontSize: 12, color: '#6B7280' }}>
            20 chu kỳ đo đạc gần nhất
          </Text>
        </div>

        {/* Bộ chọn chế độ hiển thị & Tag chú giải */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Radio.Group
            size="small"
            value={chartMode}
            onChange={(e) => setChartMode(e.target.value)}
            buttonStyle="solid"
          >
            <Radio.Button value="ALL">Tất cả</Radio.Button>
            <Radio.Button value="DUST">Độ Bụi (Đề 2)</Radio.Button>
            <Radio.Button value="ENV">Môi trường</Radio.Button>
          </Radio.Group>

          <Space size="small">
            {(chartMode === 'ALL' || chartMode === 'ENV') && (
              <>
                <Tag color="orange" style={{ margin: 0 }}>Nhiệt độ (°C)</Tag>
                <Tag color="blue" style={{ margin: 0 }}>Độ ẩm (%)</Tag>
                <Tag color="gold" style={{ margin: 0 }}>Ánh sáng (Lux)</Tag>
              </>
            )}
            {(chartMode === 'ALL' || chartMode === 'DUST') && (
              <Tag color="purple" style={{ margin: 0 }}>Độ bụi (mg/m³)</Tag>
            )}
          </Space>
        </div>
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

              {/* Gradient Độ Bụi (Màu tím #8B5CF6) */}
              <linearGradient id="dustGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
            <XAxis dataKey="time" stroke="#9CA3AF" fontSize={11} tickLine={false} />
            
            {/* Trục Y */}
            {chartMode === 'DUST' ? (
              <YAxis domain={[0, 1.0]} stroke="#8B5CF6" fontSize={11} tickLine={false} axisLine={false} />
            ) : (
              <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
            )}

            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={32} />

            {/* Các đường hiển thị theo mode */}
            {(chartMode === 'ALL' || chartMode === 'ENV') && (
              <>
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
              </>
            )}

            {/* Đường biểu đồ Độ Bụi */}
            {(chartMode === 'ALL' || chartMode === 'DUST') && (
              <Area
                type="monotone"
                dataKey="Độ bụi"
                stroke="#8B5CF6"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#dustGradient)"
                activeDot={{ r: 6 }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
