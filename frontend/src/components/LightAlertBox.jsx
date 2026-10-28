import React, { useState, useEffect } from 'react';
import { Card, Typography, InputNumber, Tag, Space, Button, Tooltip, message } from 'antd';
import {
  BulbFilled,
  AlertOutlined,
  AlertFilled,
  SettingOutlined,
  HistoryOutlined,
  CheckCircleFilled,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';

const { Title, Text } = Typography;

/**
 * ==============================================================================
 * COMPONENT: LightAlertBox (Box Đèn Cảnh Báo Ánh Sáng & Setting Ngưỡng X - ĐỀ 1)
 * ==============================================================================
 * YÊU CẦU ĐỀ 1:
 * 1. Thêm 1 box led cảnh báo trên giao diện.
 * 2. Có chỗ setting ngưỡng X (Lux).
 * 3. Khi ánh sáng > X thì cảnh báo: nháy box LED (CSS Animation) / nháy LED hardware.
 * 4. Nút bấm xem sự kiện lịch sử cảnh báo trên màn History.
 * ==============================================================================
 */
export default function LightAlertBox({ currentLight = 0 }) {
  const navigate = useNavigate();

  // 1. State lưu trữ ngưỡng ánh sáng X (mặc định lấy từ localStorage hoặc 600)
  const [threshold, setThreshold] = useState(() => {
    return Number(localStorage.getItem('iot_light_threshold_x') || 600);
  });

  const [saving, setSaving] = useState(false);

  // 2. Tải cấu hình ngưỡng từ Backend khi khởi tạo (nếu có)
  useEffect(() => {
    const fetchThreshold = async () => {
      try {
        const val = await apiService.getAlertThreshold();
        if (typeof val === 'number') {
          setThreshold(val);
          localStorage.setItem('iot_light_threshold_x', String(val));
        }
      } catch (e) {
        // Fallback giữ nguyên state từ localStorage
      }
    };
    fetchThreshold();
  }, []);

  // 3. Hàm lưu cấu hình ngưỡng X mới
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

  // 4. Kiểm tra điều kiện cảnh báo: ánh sáng đo được > ngưỡng X
  const isAlerting = Number(currentLight) > Number(threshold);

  return (
    <>
      {/* Khai báo CSS Animation nhấp nháy cho Box LED khi vượt ngưỡng */}
      <style>
        {`
          @keyframes alertPulseGlow {
            0% {
              transform: scale(1);
              box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
            }
            50% {
              transform: scale(1.03);
              box-shadow: 0 0 20px 8px rgba(239, 68, 68, 0.55);
            }
            100% {
              transform: scale(1);
              box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
            }
          }
          .alert-blinking-box {
            animation: alertPulseGlow 0.9s infinite ease-in-out;
          }
        `}
      </style>

      <Card
        style={{
          borderRadius: 12,
          background: '#FFFFFF',
          border: isAlerting ? '1.5px solid #EF4444' : '1px solid #EAECF0',
          boxShadow: isAlerting
            ? '0 4px 12px rgba(239, 68, 68, 0.15)'
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
              Đèn Cảnh Báo Ánh Sáng (Đề 1)
            </Title>
          </div>

          <Tag
            color={isAlerting ? 'error' : 'success'}
            style={{ fontWeight: 600, fontSize: 12, padding: '2px 8px', borderRadius: 6 }}
          >
            {isAlerting ? '🚨 ĐANG CẢNH BÁO!' : 'ỔN ĐỊNH'}
          </Tag>
        </div>

        {/* Khu vực ô Setting ngưỡng X */}
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
              Cài đặt ngưỡng <strong>X</strong>:
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

        {/* BOX LED CẢNH BÁO VẬT LÝ / TRỰC QUAN (NHẤP NHÁY KHI VƯỢT NGƯỠNG) */}
        <div
          className={isAlerting ? 'alert-blinking-box' : ''}
          style={{
            borderRadius: 10,
            padding: '14px',
            background: isAlerting ? '#FEE2E2' : '#F0FDF4',
            border: isAlerting ? '2px solid #DC2626' : '1px solid #86EFAC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'all 0.3s ease',
          }}
        >
          {/* Cụm Icon LED tròn */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: isAlerting ? '#EF4444' : '#22C55E',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isAlerting
                  ? '0 0 14px rgba(239, 68, 68, 0.8)'
                  : '0 0 8px rgba(34, 197, 94, 0.4)',
                transition: 'all 0.3s ease',
              }}
            >
              <BulbFilled style={{ fontSize: 24, color: '#FFFFFF' }} />
            </div>

            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: isAlerting ? '#991B1B' : '#166534',
                }}
              >
                {isAlerting ? 'ĐÈN CẢNH BÁO: BẬT (NHÁY)' : 'ĐÈN CẢNH BÁO: TẮT'}
              </div>
              <div style={{ fontSize: 11, color: isAlerting ? '#B91C1C' : '#4B5563', marginTop: 2 }}>
                Đo được: <strong>{currentLight} Lux</strong> {isAlerting ? '>' : '≤'} Ngưỡng:{' '}
                <strong>{threshold} Lux</strong>
              </div>
            </div>
          </div>

          {/* Nút Xem Lịch Sử Cảnh Báo chuyển hướng nhanh */}
          <Tooltip title="Xem toàn bộ nhật ký các lần đèn cảnh báo kích hoạt">
            <Button
              size="small"
              type={isAlerting ? 'primary' : 'default'}
              danger={isAlerting}
              icon={<HistoryOutlined />}
              onClick={() => navigate('/action-history?deviceCode=ALERT_LED')}
              style={{ fontSize: 11, borderRadius: 6 }}
            >
              Xem Lịch Sử
            </Button>
          </Tooltip>
        </div>
      </Card>
    </>
  );
}
