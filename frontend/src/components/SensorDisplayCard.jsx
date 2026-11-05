import React from 'react';
import { Card, Typography, Progress, Tag } from 'antd';

const { Text, Title } = Typography;

/**
 * Component Thẻ Hiển Thị Giá Trị Cảm Biến (Hàng trên - 3 Box)
 * - Tự động nhấp nháy đỏ khi vượt ngưỡng > 50%
 * - Nhãn cảnh báo gọn: chỉ hiện "CẢNH BÁO" (không kèm phần trăm bên cạnh)
 * - Đã bỏ hiển thị ngưỡng ở dòng cuối
 */
export default function SensorDisplayCard({
  name,
  rangeLabel,
  max,
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
      {/* 1. Header: Tên + Dải đo + Trạng thái (chỉ hiện CẢNH BÁO, không kèm %) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Text strong style={{ fontSize: 16, color: '#111827' }}>
            {name}
          </Text>
          {rangeLabel && (
            <Tag style={{ fontSize: 12, borderRadius: 4 }}>
              {rangeLabel}
            </Tag>
          )}
        </div>
        {isAlert ? (
          <Tag color="error" style={{ fontWeight: 600, fontSize: 12, padding: '2px 10px' }}>
            CẢNH BÁO
          </Tag>
        ) : (
          <Tag color="success" style={{ fontSize: 12, padding: '2px 10px' }}>
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

      {/* 4. Dòng cuối: Chỉ hiện Tối thiểu và Tối đa (Đã bỏ dòng ngưỡng 50%) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <Text type="secondary" style={{ fontSize: 11 }}>
          Tối thiểu: 0
        </Text>
        <Text type="secondary" style={{ fontSize: 11 }}>
          Tối đa: {max}
        </Text>
      </div>
    </Card>
  );
}
