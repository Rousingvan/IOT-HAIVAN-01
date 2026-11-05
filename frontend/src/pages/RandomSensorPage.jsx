import React, { useState, useEffect, useRef } from 'react';
import {
  Row,
  Col,
  Typography,
  Space,
  Button,
  Tag,
  message,
} from 'antd';
import { apiService } from '../services/api';
import { getSocket } from '../services/socket';
import IntegratedSensorCard from '../components/IntegratedSensorCard';

const { Title, Text } = Typography;

export default function RandomSensorPage() {
  // State cảm biến mới nhất
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

  const [actionLoading, setActionLoading] = useState(false);
  const latestRef = useRef(latest);
  latestRef.current = latest;

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

  // 2. Lắng nghe dữ liệu thời gian thực qua Socket.io
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

  // 3. Xử lý gửi lệnh test thủ công từng cảm biến
  const handleSetManual = async (sensorKey, val) => {
    setActionLoading(true);
    try {
      const current = latestRef.current;
      const body = {
        mode: 'MANUAL',
        s1: sensorKey === 's1' ? val : current.s1,
        s2: sensorKey === 's2' ? val : current.s2,
        s3: sensorKey === 's3' ? val : current.s3,
      };

      await apiService.triggerRandomSensorsManualTest(body);
      message.success(`Đã gửi lệnh đặt ${sensorKey.toUpperCase()} = ${val} tới ESP32`);
    } catch (err) {
      message.error(err.message || 'Lỗi gửi lệnh kiểm thử');
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Xử lý đặt lại chế độ Random tự động
  const handleResetAuto = async () => {
    setActionLoading(true);
    try {
      await apiService.triggerRandomSensorsManualTest({ mode: 'AUTO' });
      message.success('Đã khôi phục chế độ Random tự động trên ESP32');
    } catch (err) {
      message.error(err.message || 'Lỗi khôi phục tự động');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 1. Header Trang */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <Title level={3} style={{ margin: 0, fontWeight: 700, color: '#111827', fontSize: 20 }}>
            Giám sát 3 Cảm biến Ngẫu nhiên & LED Cảnh báo
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Đề 3: Random phần cứng ESP32 (0–11, 0–101, 0–1001) | LED nháy 500ms khi &gt; 50% trên chân D25, D33, D32
          </Text>
        </div>

        <Space size="middle">
          <Tag color={latest.mode === 'MANUAL' ? 'orange' : 'blue'} style={{ fontSize: 13, padding: '4px 12px' }}>
            Chế độ: {latest.mode === 'MANUAL' ? 'Thủ công (Manual)' : 'Tự động (ESP32 Random)'}
          </Tag>
          {latest.mode === 'MANUAL' && (
            <Button
              type="primary"
              onClick={handleResetAuto}
              loading={actionLoading}
              size="middle"
            >
              Khôi phục Random Tự động
            </Button>
          )}
        </Space>
      </div>

      {/* 2. 3 Thẻ Cảm Biến Tích Hợp (Kèm Panel Kiểm Thử Ngay Dưới Mỗi Thẻ) */}
      <Row gutter={[20, 20]}>
        <Col xs={24} md={8}>
          <IntegratedSensorCard
            sensorKey="s1"
            name="Cảm biến 1"
            rangeLabel="Dải 0 – 11"
            max={11}
            threshold={5.5}
            value={latest.s1}
            isAlert={latest.alert_s1}
            mode={latest.mode}
            quickOverVal={8}
            quickSafeVal={3}
            onSetManual={handleSetManual}
            onResetAuto={handleResetAuto}
            loading={actionLoading}
          />
        </Col>

        <Col xs={24} md={8}>
          <IntegratedSensorCard
            sensorKey="s2"
            name="Cảm biến 2"
            rangeLabel="Dải 0 – 101"
            max={101}
            threshold={50.5}
            value={latest.s2}
            isAlert={latest.alert_s2}
            mode={latest.mode}
            quickOverVal={75}
            quickSafeVal={25}
            onSetManual={handleSetManual}
            onResetAuto={handleResetAuto}
            loading={actionLoading}
          />
        </Col>

        <Col xs={24} md={8}>
          <IntegratedSensorCard
            sensorKey="s3"
            name="Cảm biến 3"
            rangeLabel="Dải 0 – 1001"
            max={1001}
            threshold={500.5}
            value={latest.s3}
            isAlert={latest.alert_s3}
            mode={latest.mode}
            quickOverVal={800}
            quickSafeVal={200}
            onSetManual={handleSetManual}
            onResetAuto={handleResetAuto}
            loading={actionLoading}
          />
        </Col>
      </Row>
    </div>
  );
}
