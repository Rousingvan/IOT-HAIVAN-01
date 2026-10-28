import React, { useState, useEffect } from 'react';
import { Card, Typography, InputNumber, Tag, Space, Button, Tooltip, message } from 'antd';
import {
  BulbFilled,
  AlertOutlined,
  AlertFilled,
  SettingOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';

const { Title, Text } = Typography;

/**
 * ==============================================================================
 * COMPONENT: LightAlertBox (Cảnh Báo Ánh Sáng Vượt Ngưỡng - Nhấp Nháy 2s)
 * ==============================================================================
 * CƠ CHẾ:
 * 1. Khi ánh sáng đo được <= ngưỡng X: Đèn cảnh báo TẮT (An toàn), không nháy.
 * 2. Khi ánh sáng đo được > ngưỡng X: Đèn cảnh báo NHẤP NHÁY LIÊN TỤC CHU KỲ 2 GIÂY.
 * 3. Hỗ trợ thay đổi ngưỡng X linh hoạt ngay trên giao diện.
 * ==============================================================================
 */
export default function LightAlertBox({ currentLight = 0 }) {
  const navigate = useNavigate();

  // 1. Ngưỡng ánh sáng X (Lux)
  const [threshold, setThreshold] = useState(() => {
    return Number(localStorage.getItem('iot_light_threshold_x') || 600);
  });

  const [saving, setSaving] = useState(false);

  // 2. Tải cấu hình ngưỡng từ Backend
  useEffect(() => {
    const fetchThreshold = async () => {
      try {
        const val = await apiService.getAlertThreshold();
        if (typeof val === 'number') {
          setThreshold(val);
          localStorage.setItem('iot_light_threshold_x', String(val));
        }
      } catch (e) {
        // Fallback giữ nguyên từ localStorage
      }
    };
    fetchThreshold();
  }, []);

  // 3. Cập nhật ngưỡng X
  const handleSaveThreshold = async (value) => {
    const num = Number(value);
    if (isNaN(num) || num < 0) {
      message.error('Vui lòng nhập ngưỡng ánh sáng hợp lệ (>= 0 Lux)!');
      return;
    }
    setSaving(true);
    try {
      await apiService.updateAlertThreshold(num);
      setThreshold(num);
      message.success(`Đã cập nhật ngưỡng cảnh báo X = ${num} Lux`);
    } catch {
      setThreshold(num);
      message.success(`Đã lưu ngưỡng X = ${num} Lux vào LocalStorage!`);
    } finally {
      setSaving(false);
    }
  };

  // 4. Kiểm tra điều kiện vượt ngưỡng
  const isAlerting = Number(currentLight) > Number(threshold);

  return (
    <>
      {/* Khai báo CSS Animation: Nhấp nháy đúng chu kỳ 2 giây (1s Sáng / 1s Mờ) */}
      <style>
        {`
          @keyframes alertBlinkCycle2s {
            0%, 100% {
              opacity: 1;
              transform: scale(1);
              box-shadow: 0 0 16px 4px rgba(239, 68, 68, 0.75);
            }
            50% {
              opacity: 0.25;
              transform: scale(0.96);
              box-shadow: 0 0 2px 0 rgba(239, 68, 68, 0.1);
            }
          }
          .alert-blinking-2s {
            animation: alertBlinkCycle2s 2s infinite ease-in-out;
          }
        `}
      </style>

      <Card
        style={{
          borderRadius: 12,
          background: '#FFFFFF',
          border: isAlerting ? '1.5px solid #EF4444' : '1px solid #EAECF0',
          boxShadow: isAlerting
            ? '0 4px 14px rgba(239, 68, 68, 0.18)'
            : '0 1px 3px rgba(0, 0, 0, 0.04)',
          transition: 'all 0.3s ease',
        }}
        bodyStyle={{ padding: '16px 18px' }}
      >
        {/* Header: Tiêu đề + Tag trạng thái */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
            flexWrap: 'wrap',
            gap: 6,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isAlerting ? (
              <AlertFilled style={{ fontSize: 18, color: '#DC2626' }} />
            ) : (
              <BulbFilled style={{ fontSize: 18, color: '#D97706' }} />
            )}
            <Title level={4} style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#1F2937' }}>
              THEO DÕI ÁNH SÁNG
            </Title>
          </div>

          <Tag
            color={isAlerting ? 'error' : 'success'}
            style={{ fontWeight: 600, fontSize: 12, padding: '2px 8px', borderRadius: 6 }}
          >
            {isAlerting ? '🚨 NHÁY CẢNH BÁO (2s)' : 'ỔN ĐỊNH'}
          </Tag>
        </div>

        {/* Ô Setting ngưỡng X */}
        <div
          style={{
            background: '#F9FAFB',
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid #EAECF0',
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <SettingOutlined style={{ color: '#E05318' }} />
            <Text style={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>
              Cài đặt ngưỡng cảnh báo:
            </Text>
          </div>

          <Space size="small">
            <InputNumber
              size="small"
              min={0}
              max={3000}
              step={50}
              value={threshold}
              onChange={(val) => val !== null && handleSaveThreshold(val)}
              addonAfter="Lux"
              style={{ width: 130 }}
            />
          </Space>
        </div>

        {/* BOX ĐÈN CẢNH BÁO: KHI ÁNH SÁNG > X THÌ NHẤP NHÁY 2S LIÊN TỤC */}
        <div
          style={{
            borderRadius: 10,
            padding: '12px 14px',
            background: isAlerting ? '#FEF2F2' : '#F0FDF4',
            border: isAlerting ? '1.5px solid #FCA5A5' : '1px solid #86EFAC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            transition: 'all 0.3s ease',
          }}
        >
          {/* Cụm Icon LED (Nhấp nháy chu kỳ 2s khi vượt ngưỡng) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
            <div
              className={isAlerting ? 'alert-blinking-2s' : ''}
              style={{
                width: 44,
                height: 44,
                minWidth: 44,
                borderRadius: '50%',
                background: isAlerting ? '#EF4444' : '#22C55E',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isAlerting
                  ? '0 0 16px rgba(239, 68, 68, 0.8)'
                  : '0 0 8px rgba(34, 197, 94, 0.4)',
                transition: 'all 0.3s ease',
              }}
            >
              <BulbFilled style={{ fontSize: 24, color: '#FFFFFF' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
              {/* 1. Trường: Trạng thái đèn */}
              <div
                style={{
                  fontSize: 13,
                  color: isAlerting ? '#991B1B' : '#166534',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ fontWeight: 500 }}>Trạng thái đèn cảnh báo:</span>
                <strong style={{ fontWeight: 700 }}>
                  {isAlerting ? 'CẢNH BÁO' : 'TẮT'}
                </strong>
              </div>

              {/* 2. Trường: Giá trị hiện tại */}
              <div
                style={{
                  fontSize: 12,
                  color: isAlerting ? '#B91C1C' : '#374151',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ fontWeight: 500 }}>Giá trị hiện tại:</span>
                <strong style={{ fontSize: 13, color: isAlerting ? '#DC2626' : '#111827' }}>
                  {currentLight} Lux
                </strong>
                <span style={{ fontSize: 11, color: isAlerting ? '#DC2626' : '#6B7280' }}>
                  {isAlerting ? `(> Ngưỡng ${threshold} Lux)` : `(≤ Ngưỡng ${threshold} Lux)`}
                </span>
              </div>
            </div>
          </div>

          {/* Nút Xem Lịch Sử */}
          <Tooltip title="Xem toàn bộ nhật ký các lần ánh sáng vượt ngưỡng cảnh báo">
            <Button
              size="small"
              type={isAlerting ? 'primary' : 'default'}
              danger={isAlerting}
              icon={<HistoryOutlined />}
              onClick={() => navigate('/action-history?deviceCode=ALERT_LED')}
              style={{ fontSize: 11, borderRadius: 6, flexShrink: 0, whiteSpace: 'nowrap' }}
            >
              Xem Lịch Sử
            </Button>
          </Tooltip>
        </div>
      </Card>
    </>
  );
}
