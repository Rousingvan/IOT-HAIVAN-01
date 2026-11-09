import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Typography,
  Card,
  Badge,
} from 'antd';
import { apiService } from '../services/api';
import { getSocket } from '../services/socket';
import SensorDisplayCard from '../components/SensorDisplayCard';
import LedIndicatorCard from '../components/LedIndicatorCard';

const { Title, Text } = Typography;

export default function RandomSensorPage() {
  // State cảm biến mới nhất nhận từ ESP32 qua WebSocket
  const [latest, setLatest] = useState({
    s1: 0,
    s2: 0,
    s3: 0,
    alert_s1: false,
    alert_s2: false,
    alert_s3: false,
    mode: 'AUTO',
    measured_at: new Date().toISOString(),
  });

  // 1. Tải số liệu mới nhất khi vào trang
  const fetchInitialData = async () => {
    try {
      const latestRes = await apiService.getRandomSensorsLatest();
      if (latestRes) {
        setLatest(latestRes);
      }
    } catch (err) {
      console.warn('Lỗi tải dữ liệu ban đầu:', err.message);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // 2. Lắng nghe dữ liệu thời gian thực từ phần cứng ESP32 qua Socket.io
  useEffect(() => {
    const socket = getSocket();

    const handleRealtimeData = (point) => {
      setLatest({
        s1: point.s1,
        s2: point.s2,
        s3: point.s3,
        alert_s1: point.alert_s1,
        alert_s2: point.alert_s2,
        alert_s3: point.alert_s3,
        mode: point.mode || 'AUTO',
        measured_at: point.measured_at || new Date().toISOString(),
      });
    };

    socket.on('random_sensors', handleRealtimeData);
    return () => {
      socket.off('random_sensors', handleRealtimeData);
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 1. Thanh tiêu đề */}
      <Card
        style={{
          borderRadius: 10,
          background: '#ffffff',
          border: '1px solid #e5e7eb',
        }}
        bodyStyle={{ padding: '16px 20px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <Title level={3} style={{ margin: 0, fontWeight: 700, color: '#111827', fontSize: 20 }}>
              Giám sát 3 Cảm biến Ngẫu nhiên & LED Cảnh báo
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Đề 3: Random phần cứng ESP32 (0–11, 0–101, 0–1001) | LED nháy 500ms khi &gt; 50% trên chân D25, D33, D32
            </Text>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Badge status="processing" color="#52c41a" text="Dữ liệu thời gian thực" />
          </div>
        </div>
      </Card>

      {/* 2. HÀNG TRÊN: 3 Thẻ hiển thị giá trị cảm biến */}
      <div>
        <div style={{ marginBottom: 10 }}>
          <Text strong style={{ fontSize: 14, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Giá trị đo thời gian thực:
          </Text>
        </div>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <SensorDisplayCard
              name="Cảm biến 1"
              max={11}
              threshold={5.5}
              value={latest.s1}
              isAlert={latest.alert_s1}
            />
          </Col>

          <Col xs={24} md={8}>
            <SensorDisplayCard
              name="Cảm biến 2"
              max={101}
              threshold={50.5}
              value={latest.s2}
              isAlert={latest.alert_s2}
            />
          </Col>

          <Col xs={24} md={8}>
            <SensorDisplayCard
              name="Cảm biến 3"
              max={1001}
              threshold={500.5}
              value={latest.s3}
              isAlert={latest.alert_s3}
            />
          </Col>
        </Row>
      </div>

      {/* 3. HÀNG DƯỚI: 3 Box Đèn Cảnh Báo tinh gọn */}
      <div>
        <div style={{ marginBottom: 10 }}>
          <Text strong style={{ fontSize: 14, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Đèn cảnh báo:
          </Text>
        </div>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <LedIndicatorCard
              name="Đèn 1"
              isAlert={latest.alert_s1}
            />
          </Col>

          <Col xs={24} md={8}>
            <LedIndicatorCard
              name="Đèn 2"
              isAlert={latest.alert_s2}
            />
          </Col>

          <Col xs={24} md={8}>
            <LedIndicatorCard
              name="Đèn 3"
              isAlert={latest.alert_s3}
            />
          </Col>
        </Row>
      </div>
    </div>
  );
}
