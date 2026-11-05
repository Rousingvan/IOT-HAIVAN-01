import React, { useState, useEffect } from 'react';
import { Card, Typography, Progress, Tag, Space, InputNumber, Button, Divider } from 'antd';

const { Text, Title } = Typography;

/**
 * Component Thẻ Cảm Biến Tích Hợp (Đề 3)
 * - Tự động nhấp nháy viền/nền khi vượt ngưỡng > 50%
 * - Tích hợp Panel kiểm thử thủ công ngay bên dưới thẻ
 * - Giao diện tối giản, kỹ thuật, không dùng icon trang trí AI
 */
export default function IntegratedSensorCard({
  sensorKey,
  name,
  rangeLabel,
  max,
  threshold,
  value = 0,
  isAlert = false,
  mode = 'AUTO',
  quickOverVal,
  quickSafeVal,
  onSetManual,
  onResetAuto,
  loading = false,
}) {
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const percent = Math.min(100, Math.max(0, +((value / max) * 100).toFixed(1)));

  return (
    <Card
      className={isAlert ? 'alert-card-blink' : ''}
      style={{
        borderRadius: 10,
        border: isAlert ? '2px solid #ff4d4f' : '1px solid #e5e7eb',
        background: '#ffffff',
        transition: 'all 0.3s ease',
      }}
      bodyStyle={{ padding: '16px 18px' }}
    >
      {/* 1. Header thẻ: Tên cảm biến + Dải đo + Trạng thái */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Space size={8}>
          <Text strong style={{ fontSize: 16, color: '#111827' }}>
            {name}
          </Text>
          <Tag style={{ fontSize: 12, borderRadius: 4 }}>
            {rangeLabel}
          </Tag>
        </Space>
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

      {/* 2. Giá trị hiển thị lớn + Tiến trình */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
          <Title level={2} style={{ margin: 0, fontWeight: 700, color: isAlert ? '#cf1322' : '#1d39c4' }}>
            {value}
          </Title>
          <Text type="secondary" style={{ fontSize: 14 }}>
            / {max}
          </Text>
          <Text style={{ marginLeft: 'auto', fontWeight: 600, color: '#4b5563', fontSize: 13 }}>
            {percent}%
          </Text>
        </div>

        <Progress
          percent={percent}
          status={isAlert ? 'exception' : 'normal'}
          showInfo={false}
          strokeColor={isAlert ? '#ff4d4f' : '#1890ff'}
          size={['100%', 8]}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <Text type="secondary" style={{ fontSize: 11 }}>
            Tối thiểu: 0
          </Text>
          <Text type="secondary" style={{ fontSize: 11, color: isAlert ? '#cf1322' : '#6b7280' }}>
            Ngưỡng 50%: &gt; {threshold}
          </Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            Tối đa: {max}
          </Text>
        </div>
      </div>

      <Divider style={{ margin: '12px 0 10px 0' }} />

      {/* 3. Panel Kiểm thử thủ công tích hợp ngay bên dưới thẻ */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text strong style={{ fontSize: 12, color: '#374151' }}>
            Kiểm thử thủ công:
          </Text>
          {mode === 'MANUAL' && (
            <Tag color="warning" style={{ fontSize: 11, margin: 0 }}>
              Đang cố định
            </Tag>
          )}
        </div>

        <Space.Compact style={{ width: '100%', marginBottom: 8 }}>
          <InputNumber
            min={0}
            max={max}
            value={inputValue}
            onChange={(val) => setInputValue(val)}
            placeholder={`0 - ${max}`}
            style={{ width: '65%' }}
            size="small"
          />
          <Button
            type="primary"
            size="small"
            style={{ width: '35%' }}
            loading={loading}
            onClick={() => onSetManual(sensorKey, inputValue)}
          >
            Đặt số
          </Button>
        </Space.Compact>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Button
            size="small"
            danger
            style={{ flex: 1, fontSize: 11 }}
            onClick={() => onSetManual(sensorKey, quickOverVal)}
          >
            Test vượt ({quickOverVal})
          </Button>
          <Button
            size="small"
            style={{ flex: 1, fontSize: 11 }}
            onClick={() => onSetManual(sensorKey, quickSafeVal)}
          >
            Test an toàn ({quickSafeVal})
          </Button>
          {mode === 'MANUAL' && (
            <Button
              size="small"
              type="dashed"
              style={{ width: '100%', fontSize: 11, marginTop: 4 }}
              onClick={onResetAuto}
            >
              Khôi phục tự động
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
