import React, { useEffect, useState, useRef } from 'react';
import { Row, Col, Typography } from 'antd';
import {
  FireFilled,
  CloudFilled,
  SunFilled,
  CloudTwoTone,
  UnderlineOutlined,
} from '@ant-design/icons';
import SensorCard from '../components/SensorCard';
import SensorAreaChart from '../components/SensorAreaChart';
import DevicePanel from '../components/DevicePanel';
import AlertBanner from '../components/AlertBanner';
import { apiService } from '../services/api';
import { getSocket } from '../services/socket';

const { Title, Text } = Typography;

/**gu
 * ==============================================================================
 * TRANG: DashboardPage (Tổng Quan Hệ Thống)
 * CHỨC NĂNG CHÍNH:
 * - Trung tâm điều phối dữ liệu thời gian thực (Realtime Core) của ứng dụng.
 * - Tải dữ liệu ban đầu song song qua Promise.all (Lịch sử 20 bản ghi + Danh sách thiết bị).
 * - Mở kết nối Socket.IO nhận dữ liệu cảm biến mới nhất và cập nhật tức thời (Push model).
 * - Render 4 khối giao diện:
 *     1. AlertBanner: Thanh cảnh báo đỏ khi nhiệt độ > 35°C.
 *     2. 3 Thẻ SensorCard: Nhiệt độ, Độ ẩm, Ánh sáng.
 *     3. SensorAreaChart: Biểu đồ sóng 20 điểm đo gần nhất.
 *     4. DevicePanel: Bảng công tắc điều khiển bật/tắt thiết bị.
 * 
 * ==============================================================================
 */
export default function DashboardPage() {
  // 1. State lưu trữ giá trị đo mới nhất của cảm biến (Dùng cho 3 thẻ SensorCard)
  const [telemetry, setTelemetry] = useState({
    temperature: 28.5,
    humidity: 68.2,
    light: 520,
    measured_at: new Date().toISOString(),
  });

  // 2. State mảng 20 bản ghi gần nhất (Dùng để vẽ đồ thị sóng SensorAreaChart)
  const [history, setHistory] = useState([]);

  // 3. State danh sách thiết bị kèm trạng thái ON/OFF (Dùng cho DevicePanel)
  const [devices, setDevices] = useState([]);

  // 4. State cờ loading biểu đồ khi vừa vào trang
  const [loadingChart, setLoadingChart] = useState(false);

  // 5. State quản lý loading riêng cho từng nút gạt thiết bị { LED1: true, FAN: false }
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
        // Gọi API tối ưu thời gian tải trang
        const [devs, hist] = await Promise.all([
          apiService.getDevices(),
          apiService.getTelemetryHistory(20), // Tải 20 bản ghi gần nhất
        ]);
        setDevices(devs);
        setHistory(hist);

        // Lấy bản ghi mới nhất trong lịch sử làm giá trị hiển thị ban đầu
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

    // C. Lắng nghe sự kiện trạng thái thiết bị thay đổi (khi có người khác bật/tắt thiết bị)
    socket.on('device_state_changed', (updatedDevice) => {
      setDevices((prev) =>
        prev.map((d) => (d.device_code === updatedDevice.device_code ? updatedDevice : d))
      );
    });

    // D. Cleanup function: Hủy đăng ký listener khi rời khỏi trang để chống rò rỉ bộ nhớ (Memory Leak)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      socket.off('telemetry');
      socket.off('device_state_changed');
    };
  }, []);

  // Hàm xử lý gửi lệnh bật/tắt thiết bị xuống Backend
  const handleToggleDevice = async (deviceCode, action) => {
    setLoadingMap((prev) => ({ ...prev, [deviceCode]: true })); // Bật loading riêng cho nút đó
    try {
      const res = await apiService.toggleDevice(deviceCode, action);
      // Cập nhật trạng thái tức thời lên giao diện (Optimistic UI)
      setDevices((prev) =>
        prev.map((d) => (d.device_code === deviceCode ? { ...d, current_state: action } : d))
      );
      return res;
    } catch (err) {
      throw err;
    } finally {
      setLoadingMap((prev) => ({ ...prev, [deviceCode]: false })); // Tắt loading
    }
  };

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
        <Title level={3} style={{ margin: 0, textShadow: '2px 2px 2px black', textAlign: 'left', color: '#f55d04ff', fontWeight: 700, fontSize: 40 }}>
          Dashboard
        </Title>
      </div>

      {/* 3. HÀNG 3 THẺ CẢM BIẾN (Responsive: sm={8} chia 3 cột trên PC, xs={24} xếp chồng trên Mobile) */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {/* Thẻ 1: Nhiệt độ phòng (Có cảnh báo đỏ khi > 35°C) */}
        <Col xs={24} sm={8}>
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
        <Col xs={24} sm={8}>
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
        <Col xs={24} sm={8}>
          <SensorCard
            title="Cường độ ánh sáng "
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

      {/* 4. HÀNG BIỂU ĐỒ (Trái - lg={16}) + BẢNG ĐIỀU KHIỂN THIẾT BỊ (Phải - lg={8}) */}
      <Row gutter={[16, 16]}>
        {/* Cột trái: Biểu đồ Recharts chiếm 16/24 phần (~66.7%) */}
        <Col xs={24} lg={16}>
          <SensorAreaChart data={history} loading={loadingChart} />
        </Col>

        {/* Cột phải: Bảng điều khiển thiết bị chiếm 8/24 phần (~33.3%) */}
        <Col xs={24} lg={8}>
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
