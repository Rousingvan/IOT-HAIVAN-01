import React from 'react';
import { Card, Typography, Progress, Tag } from 'antd';

const { Text, Title } = Typography;

/**
 * Component Thẻ Hiển Thị Giá Trị Cảm Biến (Hàng trên - 3 Box)
 * - Tự động nhấp nháy đỏ khi vượt ngưỡng > 50%
 */
export default function SensorDisplayCard({
  name,
  rangeLabel,
  max,
  threshold,
  value = 0,
  isAlert = false,
}) {
  const percent = Math.min(100, Math.max(0, +((value / max) * 100).toFixed(1)));

  return (
    <Card
      className={isAlert ? 'alert-card-blink' : ''}
      style={{
        borderRadius: 10,
        border: isAlert ? '2px solid #ff4d4f' : '1px solid #e5e7eb',
        background: '#ffffff',
        transition: 'all 0.3s ease',
        height: '100%',
      }}
      bodyStyle={{ padding: '18px 20px' }}
    >
      {/* 1. Header: Tên + Dải đo + Trạng thái */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Text strong style={{ fontSize: 16, color: '#111827' }}>
            {name}
          </Text>
          <Tag style={{ fontSize: 12, borderRadius: 4 }}>
            {rangeLabel}
          </Tag>
        </div>
        {isAlert ? (
          <Tag color="error" style={{ fontWeight: 600, fontSize: 12, padding: '2px 8px' }}>
            CẢNH BÁO ({percent}%)
          </Tag>
        ) : (
          <Tag color="success" style={{ fontSize: 12, padding: '2px 8px' }}>
            Bình thường
          </Tag>
        )}
      </div>

      {/* 2. Giá trị hiển thị lớn */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
        <Title level={2} style={{ margin: 0, fontWeight: 700, color: isAlert ? '#cf1322' : '#1d39c4' }}>
          {value}
        </Title>
        <Text type="secondary" style={{ fontSize: 15 }}>
          / {max}
        </Text>
        <Text style={{ marginLeft: 'auto', fontWeight: 600, color: '#4b5563', fontSize: 14 }}>
          {percent}%
        </Text>
      </div>

      {/* 3. Tiến trình % */}
      <Progress
        percent={percent}
        status={isAlert ? 'exception' : 'normal'}
        showInfo={false}
        strokeColor={isAlert ? '#ff4d4f' : '#1890ff'}
        size={['100%', 8]}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <Text type="secondary" style={{ fontSize: 11 }}>
          Tối thiểu: 0
        </Text>
        <Text type="secondary" style={{ fontSize: 11, color: isAlert ? '#cf1322' : '#6b7280', fontWeight: isAlert ? 600 : 400 }}>
          Ngưỡng 50%: &gt; {threshold}
        </Text>
        <Text type="secondary" style={{ fontSize: 11 }}>
          Tối đa: {max}
        </Text>
      </div>
    </Card>
  );
}
