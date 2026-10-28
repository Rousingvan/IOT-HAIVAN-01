import React from 'react';
import { Card, Typography, Badge } from 'antd';

const { Text, Title } = Typography;

/**
 * ==============================================================================
 * COMPONENT: SensorCard
 * CHỨC NĂNG:
 * - Thẻ hiển thị chỉ số đo lường của 1 cảm biến (Nhiệt độ, Độ ẩm, Ánh sáng).
 * - Tự động đổi màu viền, màu số đo sang ĐỎ rực khi có cờ cảnh báo `isAlert = true`.
 * - Tự động hiển thị fallback '--' khi mất tín hiệu cảm biến hoặc dữ liệu rỗng.
 * - Có đèn trạng thái Badge nhấp nháy phát sáng (processing) dưới chân thẻ.
 * 
 * PROPS:
 * @param {string} title - Tên đại lượng (VD: "Nhiệt độ phòng", "Độ ẩm không khí")
 * @param {number|string} value - Giá trị đo thực tế (VD: 28.5, 68, 520)
 * @param {string} unit - Đơn vị đo (VD: "°C", "%", "Lux")
 * @param {ReactNode} icon - Component Icon đại diện ở góc phải
 * @param {string} color - Mã màu chủ đạo của cảm biến (Cam, Xanh, Vàng...)
 * @param {string} bgColor - Màu nền thẻ Card
 * @param {string} borderColor - Màu viền thẻ khi ở trạng thái bình thường
 * @param {boolean} isAlert - Cờ bật cảnh báo nguy hiểm (Mặc định: false)
 * @param {string} statusText - Chữ hiển thị trạng thái khi an toàn (Mặc định: "Bình thường")
 * 
 * GỢI Ý CÁC TÙY CHỈNH THẦY CÔ CÓ THỂ YÊU CẦU:
 * 1. Đổi màu chữ tiêu đề: Chỉnh style của <Text> ở dòng title (color: color hoặc mã màu mới).
 * 2. Đổi kích thước / hình dạng hộp icon: Sửa width/height (VD: 50x50), borderRadius: '50%' (hình tròn).
 * 3. Chỉnh kích thước chấm tròn nhấp nháy: Thêm style={{ transform: 'scale(1.3)' }} vào <Badge>.
 * 4. Đổi vị trí đơn vị đo: Có thể đưa đơn vị lên trên đầu hoặc sang phải.
 * ==============================================================================
 */
export default function SensorCard({
  title,
  value,
  unit,
  icon,
  color,
  bgColor,
  borderColor,
  isAlert = false,
  statusText = 'Bình thường',
}) {
  return (
    // Khung thẻ Card chính của Ant Design
    <Card
      hoverable // Hiệu ứng con trỏ chuột pointer và đổ bóng nhẹ khi hover
      style={{
        borderRadius: 12, // Bo góc thẻ 12px
        background: bgColor || '#FFFFFF', // Màu nền nhận từ prop hoặc dùng màu trắng mặc định
        border: `1px solid ${isAlert ? '#CF1322' : (borderColor || '#EAECF0')}`, // Đổi viền ĐỎ nếu có cảnh báo
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)', // Đổ bóng nhẹ phía dưới
        transition: 'all 0.2s ease', // Chuyển màu viền/bóng mượt mà 0.2s
      }}
    //bodyStyle={{ padding: '26px 28px' }} // Khoảng cách đệm từ viền vào nội dung
    >
      {/* Hàng trên: Cụm số liệu bên Trái + Hộp Icon bên Phải */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        {/* Cột trái: Tiêu đề + Giá trị số đo + Đơn vị */}
        <div>
          {/* Tên cảm biến (Gợi ý: đổi color: color để chữ cùng màu với icon) */}
          <Text style={{ fontSize: 13, fontWeight: 500, color: '#4B5563' }}>{title}</Text>

          {/* Khối chứa con số và đơn vị đo - Căn chân chữ bằng alignItems: 'baseline' */}
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', gap: 6 }}>
            {/* Con số đo lường kích thước lớn 32px, bold 700 */}
            <Title
              level={2}
              style={{
                margin: 0,
                color: isAlert ? '#CF1322' : color, // Nếu cảnh báo thì số đỏ, bình thường dùng màu riêng của cảm biến
                fontWeight: 700,
                fontSize: 32, // Cỡ chữ số đo
              }}
            >
              {/* Fallback hiển thị '--' nếu dữ liệu null hoặc chưa nhận được từ MQTT */}
              {value !== undefined && value !== null ? value : '--'}
            </Title>

            {/* Đơn vị đo đạc (°C, %, Lux) */}
            <Text style={{ fontSize: 15, color: '#6B7280', fontWeight: 500 }}>{unit}</Text>
          </div>
        </div>

        {/* Cột phải: Hộp vuông bo tròn chứa Icon cảm biến (Kích thước 44x44px) */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 10, // Bo góc hộp icon 10px (Gợi ý: đổi thành '50%' để thành hình tròn hoàn toàn)
            background: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center', // Căn tâm tuyệt đối 2 chiều cho icon SVG
            fontSize: 22, // Cỡ icon
            color: color, // Màu của icon
            border: `1px solid ${borderColor || '#F2F4F7'}`,
          }}
        >
          {icon}
        </div>
      </div>

      {/* Hàng dưới (Chân thẻ): Đèn báo trạng thái Badge */}
      <div style={{ marginTop: 14 }}>
        <Badge
          // status="error": Chấm đỏ cảnh báo | status="processing": Chấm xanh dương nhấp nháy phát sáng
          status={isAlert ? 'error' : 'processing'}
          text={
            <Text style={{ fontSize: 12, color: isAlert ? '#CF1322' : '#389E0D', fontWeight: 500 }}>
              {isAlert ? 'Vượt ngưỡng an toàn' : statusText}
            </Text>
          }
        />
      </div>
    </Card>
  );
}
