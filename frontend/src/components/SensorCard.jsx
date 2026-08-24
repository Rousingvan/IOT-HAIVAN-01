import React from 'react';
import { Card, Typography, Badge } from 'antd';

const { Text, Title } = Typography;

export default function SensorCard({
  title,
  value,
  unit,
  icon,
  color,
  bgColor,
  borderColor,
  isAlert = false,
  statusText = 'Bình thường',
}) {
  return (
    <Card
      hoverable
      style={{
        borderRadius: 12,
        background: bgColor || '#FFFFFF',
        border: `1px solid ${isAlert ? '#CF1322' : (borderColor || '#EAECF0')}`,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        transition: 'all 0.2s ease',
      }}
      bodyStyle={{ padding: '18px 20px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Text style={{ fontSize: 13, fontWeight: 500, color: '#4B5563' }}>{title}</Text>
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <Title
              level={2}
              style={{
                margin: 0,
                color: isAlert ? '#CF1322' : color,
                fontWeight: 700,
                fontSize: 32,
              }}
            >
              {value !== undefined && value !== null ? value : '--'}
            </Title>
            <Text style={{ fontSize: 15, color: '#6B7280', fontWeight: 500 }}>{unit}</Text>
          </div>
        </div>

        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            color: color,
            border: `1px solid ${borderColor || '#F2F4F7'}`,
          }}
        >
          {icon}
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <Badge
          status={isAlert ? 'error' : 'success'}
          text={
            <Text style={{ fontSize: 12, color: isAlert ? '#CF1322' : '#389E0D', fontWeight: 500 }}>
              {isAlert ? 'Vượt ngưỡng an toàn' : statusText}
            </Text>
          }
        />
      </div>
    </Card>
  );
}
