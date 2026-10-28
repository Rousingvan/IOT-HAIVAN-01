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
import DustAlertBox from '../components/DustAlertBox';
import { apiService } from '../services/api';
import { getSocket } from '../services/socket';

const { Title } = Typography;

/**
 * ==============================================================================
 * TRANG: DashboardPage (ĐỀ SỐ 2: CẢM BIẾN ĐỘ BỤI + CẢNH BÁO >= 0.70 mg/m3)
 * ==============================================================================
 * HÀNG 4 THẺ CẢM BIẾN:
 * 1. Nhiệt độ (°C)
 * 2. Độ ẩm (%)
 * 3. Ánh sáng (Lux)
 * 4. Độ bụi (mg/m3) - ĐỀ 2
 * ==============================================================================
 */
export default function DashboardPage() {
  // 1. State lưu trữ giá trị đo mới nhất của cảm biến (4 đại lượng)
  const [telemetry, setTelemetry] = useState({
    temperature: 28.5,
    humidity: 68.2,
    light: 520,
    dust: 0.25,
    measured_at: new Date().toISOString(),
  });

  // 2. State mảng 20 bản ghi gần nhất (Dùng để vẽ đồ thị sóng SensorAreaChart)
  const [history, setHistory] = useState([]);

  // 3. State danh sách thiết bị kèm trạng thái ON/OFF (Dùng cho DevicePanel)
  const [devices, setDevices] = useState([]);

  // 4. State cờ loading biểu đồ khi vừa vào trang
  const [loadingChart, setLoadingChart] = useState(false);

  // 5. State quản lý loading riêng cho từng nút gạt thiết bị
  const [loadingMap, setLoadingMap] = useState({});

  // 6. State bật/tắt thanh banner cảnh báo nhiệt độ cao
  const [showAlert, setShowAlert] = useState(false);

  const timerRef = useRef(null);

  // VÒNG ĐỜI COMPONENT (useEffect): Tải dữ liệu ban đầu & Đăng ký Socket.IO
  useEffect(() => {
    // A. Hàm tải dữ liệu ban đầu qua REST API
    const fetchData = async () => {
      setLoadingChart(true);
      try {
        const [devs, hist] = await Promise.all([
          apiService.getDevices(),
          apiService.getTelemetryHistory(20), // Tải 20 bản ghi gần nhất
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

    // B. Lắng nghe dữ liệu cảm biến thời gian thực từ ESP32 phát qua Socket.io
    const socket = getSocket();
    socket.on('telemetry', (data) => {
      setTelemetry(data);
      // Cơ chế FIFO: Giữ lại 19 điểm cũ + nối thêm 1 điểm mới = 20 điểm trôi mượt mà
      setHistory((prev) => [...prev.slice(-19), data]);
      if (data.temperature > 35) setShowAlert(true);
      else setShowAlert(false);
    });

    // C. Lắng nghe sự kiện trạng thái thiết bị thay đổi
    socket.on('device_state_changed', (updatedDevice) => {
      setDevices((prev) =>
        prev.map((d) =>
          d.device_code === updatedDevice.device_code
            ? { ...d, current_state: updatedDevice.current_state }
            : d
        )
      );
    });

    return () => {
      socket.off('telemetry');
      socket.off('device_state_changed');
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Xử lý khi người dùng gạt công tắc trên DevicePanel
  const handleToggleDevice = async (deviceCode, action) => {
    setLoadingMap((prev) => ({ ...prev, [deviceCode]: true }));
    try {
      const res = await apiService.toggleDevice(deviceCode, action);
      setDevices((prev) =>
        prev.map((d) =>
          d.device_code === deviceCode ? { ...d, current_state: res.currentState || action } : d
        )
      );
    } catch (err) {
      console.error('Toggle error:', err);
    } finally {
      setLoadingMap((prev) => ({ ...prev, [deviceCode]: false }));
    }
  };

  const isDustDanger = Number(telemetry.dust || 0) >= 0.70;

  return (
    <div>
      {/* 1. THANH BANNER CẢNH BÁO NGUY HIỂM (Hiện khi nhiệt độ > 35°C) */}
      <AlertBanner
        temperature={telemetry.temperature}
        isAlert={showAlert || telemetry.temperature > 35}
        onClose={() => setShowAlert(false)}
      />

      {/* 2. TIÊU ĐỀ TRANG DASHBOARD */}
      <div style={{ marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0, textShadow: '2px 2px 2px black', textAlign: 'left', color: '#f55d04ff', fontWeight: 700, fontSize: 36 }}>
          Hệ Thống Giám Sát & Điều Khiển IoT (Đề 2: Độ Bụi)
        </Title>
      </div>

      {/* 3. HÀNG 4 THẺ CẢM BIẾN (Responsive: lg={6} md={12} xs={24}) */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {/* Thẻ 1: Nhiệt độ phòng */}
        <Col xs={24} sm={12} lg={6}>
          <SensorCard
            title="Nhiệt độ phòng"
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

        {/* Thẻ 2: Độ ẩm không khí */}
        <Col xs={24} sm={12} lg={6}>
          <SensorCard
            title="Độ ẩm không khí"
            value={telemetry.humidity}
            unit="%"
            icon={<CloudFilled />}
            color="#0284C7"
            bgColor="#F0F9FF"
            borderColor="#E0F2FE"
            statusText={telemetry.humidity > 80 ? 'Độ ẩm cao' : 'Ổn định'}
          />
        </Col>

        {/* Thẻ 3: Cường độ ánh sáng */}
        <Col xs={24} sm={12} lg={6}>
          <SensorCard
            title="Cường độ ánh sáng"
            value={telemetry.light}
            unit="Lux"
            icon={<SunFilled />}
            color="#D97706"
            bgColor="#FFFBEB"
            borderColor="#FEF3C7"
            statusText={telemetry.light > 600 ? 'Sáng mạnh' : 'Bình thường'}
          />
        </Col>

        {/* Thẻ 4: Cảm biến độ bụi (ĐỀ 2) */}
        <Col xs={24} sm={12} lg={6}>
          <SensorCard
            title="Độ bụi (Dust)"
            value={telemetry.dust !== undefined ? telemetry.dust : '--'}
            unit="mg/m³"
            icon={<CloudFilled />}
            color="#8B5CF6"
            bgColor="#F5F3FF"
            borderColor="#DDD6FE"
            isAlert={isDustDanger}
            statusText={isDustDanger ? 'Bụi vượt ngưỡng (≥0.7)' : 'Không khí sạch'}
          />
        </Col>
      </Row>

      {/* 4. HÀNG BIỂU ĐỒ (Trái - lg={16}) + BẢNG CẢNH BÁO BỤI & ĐIỀU KHIỂN (Phải - lg={8}) */}
      <Row gutter={[16, 16]}>
        {/* Cột trái: Biểu đồ Recharts chiếm 16/24 phần (~66.7%) */}
        <Col xs={24} lg={16}>
          <SensorAreaChart data={history} loading={loadingChart} />
        </Col>

        {/* Cột phải: Box Cảnh Báo Độ Bụi (Đề 2) + Bảng điều khiển thiết bị */}
        <Col xs={24} lg={8}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Box Đèn Cảnh Báo Độ Bụi (Đề 2) */}
            <DustAlertBox currentDust={telemetry.dust || 0} />

            {/* Bảng điều khiển công tắc Relay (Đèn 1, 2, 3, 4) */}
            <DevicePanel
              devices={devices}
              onToggleDevice={handleToggleDevice}
              loadingMap={loadingMap}
            />
          </div>
        </Col>
      </Row>
    </div>
  );
}
