import React, { useState, useEffect } from 'react';
import { Card, Typography, Space, InputNumber, Button } from 'antd';

const { Text } = Typography;

/**
 * Component Box Chỉnh Cảm Biến (Hàng dưới - 3 Box)
 * - Đã bỏ chữ "tay" -> Chỉ hiện "Chỉnh cảm biến 1/2/3"
 * - Đã bỏ tag "Cho phép chỉnh / Khóa"
 * - Có trạng thái Disable khi ở chế độ Tự Động (Auto)
 */
export default function SensorControlBox({
  sensorKey,
  name,
  max,
  value = 0,
  isManualMode = false,
  onSetManual,
  loading = false,
}) {
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  return (
    <Card
      style={{
        borderRadius: 10,
        border: isManualMode ? '1px solid #ffbb96' : '1px dashed #d9d9d9',
        background: isManualMode ? '#ffffff' : '#fafafa',
        transition: 'all 0.3s ease',
        height: '100%',
      }}
      bodyStyle={{ padding: '16px 18px' }}
    >
      {/* 1. Tiêu đề box điều khiển: "Chỉnh Cảm biến 1/2/3" (bỏ chữ "tay", bỏ tag "Cho phép chỉnh") */}
      <div style={{ marginBottom: 12 }}>
        <Text strong style={{ fontSize: 14, color: isManualMode ? '#111827' : '#8c8c8c' }}>
          Chỉnh {name}
        </Text>
      </div>

      {/* 2. Ô nhập số + Nút áp dụng */}
      <Space.Compact style={{ width: '100%' }}>
        <InputNumber
          min={0}
          max={max}
          value={inputValue}
          onChange={(val) => setInputValue(val)}
          placeholder={`Nhập 0 - ${max}`}
          disabled={!isManualMode}
          style={{ width: '68%' }}
          size="middle"
        />
        <Button
          type="primary"
          style={{ width: '32%' }}
          size="middle"
          loading={loading}
          disabled={!isManualMode}
          onClick={() => onSetManual(sensorKey, inputValue)}
        >
          Đặt số
        </Button>
      </Space.Compact>
    </Card>
  );
}
