import React from 'react';
import { Alert, Typography, Button, Space } from 'antd';
import { AlertFilled, WarningFilled } from '@ant-design/icons';

const { Text } = Typography;

/**
 * ==============================================================================
 * COMPONENT: AlertBanner
 * CHỨC NĂNG:
 * - Hiển thị thanh Banner cảnh báo đỏ nổi bật ở đầu trang Dashboard khi nhiệt độ
 *   vượt ngưỡng an toàn (> 35°C).
 * - Có nút bấm "Đã hiểu" để người dùng tạm thời tắt thông báo cảnh báo.
 * 
 * PROPS:
 * @param {number} temperature - Nhiệt độ hiện tại đo được từ cảm biến (VD: 38.5)
 * @param {boolean} isAlert - Cờ kích hoạt hiển thị (true: hiện banner, false: ẩn)
 * @param {Function} onClose - Callback được gọi khi người dùng bấm nút "Đã hiểu"
 * 
 * CÁC TÙY CHỈNH CÓ THỂ THẦY CÔ YÊU CẦU:
 * 1. Đổi ngưỡng nhiệt độ trong văn bản: sửa dòng chữ '35°C' thành ngưỡng mới.
 * 2. Đổi màu sắc banner sang cảnh báo vàng: đổi type="warning", background: "#FFFBE6", border: "1px solid #FFE58F".
 * 3. Thêm icon âm thanh / còi hú nhấp nháy.
 * ==============================================================================
 */
export default function AlertBanner({ temperature, isAlert = false, onClose }) {
  // Nếu không có cảnh báo (isAlert = false) -> không render gì ra màn hình
  if (!isAlert) return null;

  return (
    // Khung bao ngoài tạo khoảng cách đệm 20px với tiêu đề Dashboard phía dưới
    <div style={{ marginBottom: 20 }}>
      <Alert
        message={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            {/* Cụm thông tin bên trái: Icon chuông cảnh báo + Nội dung chữ */}
            <Space align="center">
              {/* Icon chuông cảnh báo màu đỏ (Gợi ý: có thể đổi sang WarningFilled hoặc SoundFilled) */}
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

            {/* Nút bấm bên phải: Nút "Đã hiểu" để đóng cảnh báo */}
            {onClose && (
              <Button size="small" danger onClick={onClose} style={{ borderRadius: 6 }}>
                Đã hiểu
              </Button>
            )}
          </div>
        }
        type="error" // Kiểu lỗi màu đỏ của Ant Design
        showIcon={false} // Tắt icon mặc định của Antd vì đã dùng icon tùy biến bên trên
        style={{
          borderRadius: 10, // Bo tròn góc banner 10px
          border: '1.5px solid #FFA39E', // Viền đỏ hồng
          background: '#FFF1F0', // Màu nền đỏ nhạt dịu mắt
          boxShadow: '0 4px 14px rgba(255, 77, 79, 0.15)', // Đổ bóng phát sáng đỏ
        }}
      />
    </div>
  );
}
