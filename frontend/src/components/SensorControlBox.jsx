import React, { useState, useEffect } from 'react';
import { Card, Typography, Space, InputNumber, Button, Tag } from 'antd';

const { Text } = Typography;

/**
 * Component Box Chỉnh Tay Giá Trị Cảm Biến (Hàng dưới - 3 Box)
 * - Có trạng thái Disable khi đang ở chế độ Tự Động (Auto)
 * - Cho phép nhập số cụ thể và có nút test nhanh vượt ngưỡng/an toàn
 */
export default function SensorControlBox({
  sensorKey,
  name,
  max,
  value = 0,
  isManualMode = false,
  quickOverVal,
  quickSafeVal,
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
      {/* 1. Tiêu đề box điều khiển */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text strong style={{ fontSize: 14, color: isManualMode ? '#111827' : '#8c8c8c' }}>
          Chỉnh tay {name}
        </Text>
        <Tag color={isManualMode ? 'orange' : 'default'} style={{ fontSize: 11, margin: 0 }}>
          {isManualMode ? 'Cho phép chỉnh' : 'Khóa (Tự động)'}
        </Tag>
      </div>

      {/* 2. Ô nhập số + Nút áp dụng */}
      <Space.Compact style={{ width: '100%', marginBottom: 12 }}>
        <InputNumber
          min={0}
          max={max}
          value={inputValue}
          onChange={(val) => setInputValue(val)}
          placeholder={`Nhập 0 - ${max}`}
          disabled={!isManualMode}
          style={{ width: '65%' }}
          size="middle"
        />
        <Button
          type="primary"
          style={{ width: '35%' }}
          size="middle"
          loading={loading}
          disabled={!isManualMode}
          onClick={() => onSetManual(sensorKey, inputValue)}
        >
          Đặt số
        </Button>
      </Space.Compact>

      {/* 3. Hai nút bấm nhanh */}
      <div style={{ display: 'flex', gap: 8 }}>
        <Button
          danger
          disabled={!isManualMode}
          style={{ flex: 1, fontSize: 12 }}
          size="middle"
          onClick={() => onSetManual(sensorKey, quickOverVal)}
        >
          Test vượt ({quickOverVal})
        </Button>
        <Button
          disabled={!isManualMode}
          style={{ flex: 1, fontSize: 12 }}
          size="middle"
          onClick={() => onSetManual(sensorKey, quickSafeVal)}
        >
          Test an toàn ({quickSafeVal})
        </Button>
      </div>
    </Card>
  );
}
