import React, { useEffect, useState, useRef } from 'react';
import { Row, Col, Typography } from 'antd';
import {
  FireFilled,
  CloudFilled,
  SunFilled,
} from '@ant-design/icons';
import SensorCard from '../components/SensorCard';
import SensorAreaChart from '../components/SensorAreaChart';
import DevicePanel from '../components/DevicePanel';
import AlertBanner from '../components/AlertBanner';
import { apiService } from '../services/api';
import { getSocket } from '../services/socket';

const { Title, Text } = Typography;

export default function DashboardPage() {
  const [telemetry, setTelemetry] = useState({
    temperature: 28.5,
    humidity: 68.2,
    light: 520,
    measured_at: new Date().toISOString(),
  });
  const [history, setHistory] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loadingChart, setLoadingChart] = useState(false);
  const [loadingMap, setLoadingMap] = useState({});
  const [showAlert, setShowAlert] = useState(false);

  const timerRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoadingChart(true);
      try {
        const [devs, hist] = await Promise.all([
          apiService.getDevices(),
          apiService.getTelemetryHistory(20),
        ]);
        setDevices(devs);
        setHistory(hist);
        if (hist.length > 0) {
          const latest = hist[hist.length - 1];
          setTelemetry(latest);
          if (latest.temperature > 35) setShowAlert(true);
        }
      } catch (err) {
        console.error('Fetch dashboard error:', err);
      } finally {
        setLoadingChart(false);
      }
    };
    fetchData();

    // Chu kỳ cập nhật dữ liệu
    timerRef.current = setInterval(async () => {
      try {
        const now = new Date();
        const newTemp = +(25 + Math.sin(now.getSeconds() / 10) * 8 + Math.random()).toFixed(1);
        const newHumid = +(60 + Math.cos(now.getSeconds() / 10) * 15 + Math.random()).toFixed(1);
        const newLight = Math.floor(400 + Math.sin(now.getSeconds() / 5) * 300 + Math.random() * 20);

        const newPoint = {
          temperature: newTemp,
          humidity: newHumid,
          light: newLight,
          measured_at: now.toISOString(),
        };

        setTelemetry(newPoint);
        setHistory((prev) => [...prev.slice(-19), newPoint]);

        if (newTemp > 35) {
          setShowAlert(true);
        }
      } catch (err) {
        console.error('Interval poll error:', err);
      }
    }, 5000);

    const socket = getSocket();
    socket.on('telemetry', (data) => {
      setTelemetry(data);
      setHistory((prev) => [...prev.slice(-19), data]);
      if (data.temperature > 35) setShowAlert(true);
    });

    socket.on('device_state_changed', (updatedDevice) => {
      setDevices((prev) =>
        prev.map((d) => (d.device_code === updatedDevice.device_code ? updatedDevice : d))
      );
    });

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      socket.off('telemetry');
      socket.off('device_state_changed');
    };
  }, []);

  const handleToggleDevice = async (deviceCode, action) => {
    setLoadingMap((prev) => ({ ...prev, [deviceCode]: true }));
    try {
      const res = await apiService.toggleDevice(deviceCode, action);
      setDevices((prev) =>
        prev.map((d) => (d.device_code === deviceCode ? { ...d, current_state: action } : d))
      );
      return res;
    } finally {
      setLoadingMap((prev) => ({ ...prev, [deviceCode]: false }));
    }
  };

  return (
    <div>
      {/* Cảnh báo nhiệt độ */}
      <AlertBanner
        temperature={telemetry.temperature}
        isAlert={showAlert || telemetry.temperature > 35}
        onClose={() => setShowAlert(false)}
      />

      {/* Tiêu đề trang - Không có UC */}
      <div style={{ marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0, color: '#f55d04ff', fontWeight: 700, fontSize: 40 }}>
          Dashboard
        </Title>
      </div>

      {/* 3 Thẻ chỉ số */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={8}>
          <SensorCard
            title="Nhiệt độ phòng (DHT22)"
            value={telemetry.temperature}
            unit="°C"
            icon={<FireFilled />}
            color="#E05318"
            bgColor="#FFF7ED"
            borderColor="#FFEDD5"
            isAlert={telemetry.temperature > 35}
            statusText={telemetry.temperature > 35 ? 'Nhiệt độ cao' : 'Ổn định'}
          />
        </Col>
        <Col xs={24} sm={8}>
          <SensorCard
            title="Độ ẩm không khí (DHT22)"
            value={telemetry.humidity}
            unit="%"
            icon={<CloudFilled />}
            color="#0284C7"
            bgColor="#F0F9FF"
            borderColor="#E0F2FE"
            statusText={telemetry.humidity > 80 ? 'Độ ẩm cao' : 'Ổn định'}
          />
        </Col>
        <Col xs={24} sm={8}>
          <SensorCard
            title="Cường độ ánh sáng (LDR)"
            value={telemetry.light}
            unit="Lux"
            icon={<SunFilled />}
            color="#D97706"
            bgColor="#FFFBEB"
            borderColor="#FEF3C7"
            statusText={telemetry.light > 600 ? 'Sáng mạnh' : 'Bình thường'}
          />
        </Col>
      </Row>

      {/* Biểu đồ + Bảng điều khiển */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={15}>
          <SensorAreaChart data={history} loading={loadingChart} />
        </Col>
        <Col xs={24} lg={9}>
          <DevicePanel
            devices={devices}
            onToggleDevice={handleToggleDevice}
            loadingMap={loadingMap}
          />
        </Col>
      </Row>
    </div>
  );
}
