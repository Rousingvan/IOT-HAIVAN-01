import React, { useState, useEffect, useRef } from 'react';
import {
  Row,
  Col,
  Typography,
  Space,
  Switch,
  Tag,
  message,
  Card,
} from 'antd';
import { apiService } from '../services/api';
import { getSocket } from '../services/socket';
import SensorDisplayCard from '../components/SensorDisplayCard';
import SensorControlBox from '../components/SensorControlBox';

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

  // 3. Xử lý gạt công tắc chuyển đổi chế độ Manual / Auto
  const handleToggleMode = async (checked) => {
    const targetMode = checked ? 'MANUAL' : 'AUTO';
    setActionLoading(true);
    try {
      const current = latestRef.current;
      await apiService.triggerRandomSensorsManualTest({
        mode: targetMode,
        s1: current.s1,
        s2: current.s2,
        s3: current.s3,
      });
      setLatest((prev) => ({ ...prev, mode: targetMode }));
      message.success(
        checked
          ? 'Đã BẬT Chế độ Thủ công (Manual). Bạn có thể chỉnh tay 3 box bên dưới.'
          : 'Đã BẬT Chế độ Tự động (Auto). ESP32 tự sinh số ngẫu nhiên.'
      );
    } catch (err) {
      message.error(err.message || 'Lỗi chuyển đổi chế độ');
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Xử lý đặt giá trị chỉnh tay cho từng cảm biến
  const handleSetManual = async (sensorKey, val) => {
    if (val === undefined || val === null) {
      message.warning('Vui lòng nhập giá trị hợp lệ');
      return;
    }
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
      message.success(`Đã cập nhật ${sensorKey.toUpperCase()} = ${val} tới ESP32`);
    } catch (err) {
      message.error(err.message || 'Lỗi gửi lệnh kiểm thử');
    } finally {
      setActionLoading(false);
    }
  };

  const isManual = latest.mode === 'MANUAL';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 1. Thanh tiêu đề & Công tắc bật/tắt chế độ Manual */}
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

          {/* Cụm công tắc Switch chuyển chế độ */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#f9fafb', padding: '8px 16px', borderRadius: 8, border: '1px solid #f3f4f6' }}>
            <Text strong style={{ fontSize: 13, color: '#374151' }}>
              Chế độ Manual:
            </Text>
            <Switch
              checked={isManual}
              loading={actionLoading}
              onChange={handleToggleMode}
              checkedChildren="BẬT"
              unCheckedChildren="TẮT"
            />
            {/* <Tag color={isManual ? 'orange' : 'blue'} style={{ fontSize: 12, padding: '2px 8px', margin: 0 }}>
              {isManual ? 'Thủ công' : 'Tự động'}
            </Tag> */}
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
              // rangeLabel="Dải 0 – 11"
              max={11}
              threshold={5.5}
              value={latest.s1}
              isAlert={latest.alert_s1}
            />
          </Col>

          <Col xs={24} md={8}>
            <SensorDisplayCard
              name="Cảm biến 2"
              // rangeLabel="Dải 0 – 101"
              max={101}
              threshold={50.5}
              value={latest.s2}
              isAlert={latest.alert_s2}
            />
          </Col>

          <Col xs={24} md={8}>
            <SensorDisplayCard
              name="Cảm biến 3"
              // rangeLabel="Dải 0 – 1001"
              max={1001}
              threshold={500.5}
              value={latest.s3}
              isAlert={latest.alert_s3}
            />
          </Col>
        </Row>
      </div>

      {/* 3. HÀNG DƯỚI: 3 Box chỉnh cho từng cảm biến */}
      <div>
        <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Text strong style={{ fontSize: 14, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Bảng chỉnh giá trị:
          </Text>
          {!isManual && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              (Bật công tắc Manual phía trên để mở khóa các ô chỉnh cảm biến)
            </Text>
          )}
        </div>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <SensorControlBox
              sensorKey="s1"
              name="Cảm biến 1"
              max={11}
              value={latest.s1}
              isManualMode={isManual}
              onSetManual={handleSetManual}
              loading={actionLoading}
            />
          </Col>

          <Col xs={24} md={8}>
            <SensorControlBox
              sensorKey="s2"
              name="Cảm biến 2"
              max={101}
              value={latest.s2}
              isManualMode={isManual}
              onSetManual={handleSetManual}
              loading={actionLoading}
            />
          </Col>

          <Col xs={24} md={8}>
            <SensorControlBox
              sensorKey="s3"
              name="Cảm biến 3"
              max={1001}
              value={latest.s3}
              isManualMode={isManual}
              onSetManual={handleSetManual}
              loading={actionLoading}
            />
          </Col>
        </Row>
      </div>
    </div>
  );
}
