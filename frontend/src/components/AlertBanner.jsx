import React from 'react';
import { Alert, Typography, Button, Space } from 'antd';
import { AlertFilled, WarningFilled } from '@ant-design/icons';

const { Text } = Typography;

export default function AlertBanner({ temperature, isAlert = false, onClose }) {
  if (!isAlert) return null;

  return (
    <div style={{ marginBottom: 20 }}>
      <Alert
        message={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <Space align="center">
              <AlertFilled style={{ color: '#FF4D4F', fontSize: 20 }} />
              <div>
                <Text strong style={{ color: '#CF1322', fontSize: 15 }}>
                  CẢNH BÁO NGUY HIỂM: Nhiệt độ phòng đạt mức cao ({temperature}°C)!
                </Text>
                <div style={{ fontSize: 12, color: '#820014' }}>
                  Nhiệt độ đã vượt ngưỡng cảnh báo 35°C. Hãy kiểm tra phòng thí nghiệm hoặc bật hệ thống thông gió.
                </div>
              </div>
            </Space>
            {onClose && (
              <Button size="small" danger onClick={onClose}>
                Đã hiểu
              </Button>
            )}
          </div>
        }
        type="error"
        showIcon={false}
        style={{
          borderRadius: 10,
          border: '1.5px solid #FFA39E',
          background: '#FFF1F0',
          boxShadow: '0 4px 14px rgba(255, 77, 79, 0.15)',
        }}
      />
    </div>
  );
}
