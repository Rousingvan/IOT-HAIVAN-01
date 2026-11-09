import React from 'react';
import { Card, Typography, Tag } from 'antd';
import { BulbFilled, BulbOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

/**
 * Component Thẻ Đèn Cảnh Báo (Tối giản)
 * - Tên: Đèn 1, Đèn 2, Đèn 3 (không thông tin thừa)
 * - Khi vượt ngưỡng (> 50%): Đèn và cả box nhấp nháy đỏ đồng bộ với thẻ cảm biến
 * - Khi bình thường (<= 50%): Đèn TẮT, box tĩnh
 */
export default function LedIndicatorCard({
  name,
  isAlert = false,
}) {
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
      {/* 1. Dòng trên: Tên Đèn + Tag trạng thái */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <Text strong style={{ fontSize: 16, color: '#111827' }}>
          {name}
        </Text>
        {isAlert ? (
          <Tag color="error" style={{ fontWeight: 600, fontSize: 12, padding: '2px 10px', margin: 0 }}>
            CẢNH BÁO
          </Tag>
        ) : (
          <Tag style={{ fontSize: 12, padding: '2px 10px', color: '#6b7280', background: '#f3f4f6', margin: 0 }}>
            Tắt
          </Tag>
        )}
      </div>

      {/* 2. Trung tâm: Icon bóng đèn + Chữ trạng thái */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '6px 0' }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: isAlert ? '#fff1f0' : '#f5f5f5',
            border: isAlert ? '2px solid #ff4d4f' : '1px solid #e5e7eb',
            transition: 'all 0.3s ease',
          }}
        >
          {isAlert ? (
            <BulbFilled className="alert-bulb-blink" style={{ fontSize: 28, color: '#ff4d4f' }} />
          ) : (
            <BulbOutlined style={{ fontSize: 26, color: '#9ca3af' }} />
          )}
        </div>

        <Title
          level={4}
          style={{
            margin: 0,
            fontWeight: 700,
            color: isAlert ? '#cf1322' : '#4b5563',
            fontSize: 18,
          }}
        >
          {isAlert ? 'CẢNH BÁO' : 'TẮT'}
        </Title>
      </div>
    </Card>
  );
}
