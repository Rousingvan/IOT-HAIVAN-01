import React, { useState, useEffect, useRef } from 'react';
import { Card, Input, Button, Space, Typography } from 'antd';
import { SearchOutlined, ReloadOutlined, ClockCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

/**
 * ==============================================================================
 * COMPONENT: VariableTimeRangeFilter (Co Gọn & Lọc Tự Động)
 * CHỨC NĂNG:
 * - Thanh tìm kiếm mốc thời gian co gọn trên 1 hàng ngang duy nhất.
 * - Tự động lọc tức thời khi người dùng nhập từ khóa (Debounce 300ms).
 * - Không cần nhấn phím Enter, không cần nút [Lọc].
 * - Nút [x] và nút [Đặt lại] giúp khôi phục dữ liệu ban đầu nhanh chóng.
 * ==============================================================================
 */
export default function VariableTimeRangeFilter({ onFilter, onReset, value = '' }) {
  // State lưu trữ chuỗi thời gian người dùng đang nhập trong ô Input
  const [searchString, setSearchString] = useState(value || '');
  const debounceTimer = useRef(null);

  // Xử lý dọn dẹp timer khi component unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  // Xử lý tự động lọc khi người dùng gõ phím (Realtime Search on Type)
  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearchString(val);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Nếu xóa sạch ô input -> Reset về danh sách gốc ngay lập tức
    if (!val || !val.trim()) {
      onReset && onReset();
      return;
    }

    // Đợi 300ms sau khi người dùng dừng gõ rồi mới tự động kích hoạt lọc
    debounceTimer.current = setTimeout(() => {
      onFilter && onFilter(val.trim());
    }, 300);
  };

  // Hàm xử lý khi bấm nút "Đặt lại" (Reset)
  const handleReset = () => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    setSearchString('');
    onReset && onReset();
  };

  return (
    <Card
      style={{
        borderRadius: 10,
        background: '#FFFFFF',
        border: '1px solid #EAECF0',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        marginBottom: 14,
      }}
      bodyStyle={{ padding: '10px 16px' }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        {/* Tiêu đề ngắn gọn kèm icon đồng hồ */}
        <Space size="small" style={{ flexShrink: 0 }}>
          <ClockCircleOutlined style={{ color: '#E05318', fontSize: 15 }} />
          <Text strong style={{ color: '#1F2937', fontSize: 13 }}>
            Tìm kiếm theo mốc thời gian:
          </Text>
        </Space>

        {/* Ô Input tự động lọc, co gọn chiều rộng vừa phải */}
        <Input
          placeholder="Nhập mốc thời gian (VD: 19/08/2026, 15:30...)"
          value={searchString}
          onChange={handleInputChange}
          allowClear
          size="middle"
          prefix={<SearchOutlined style={{ color: '#9CA3AF' }} />}
          style={{
            maxWidth: 420,
            flex: 1,
            borderRadius: 6,
          }}
        />

        {/* Nút Đặt lại nhỏ gọn */}
        <Button
          icon={<ReloadOutlined />}
          onClick={handleReset}
          style={{
            borderRadius: 6,
            fontWeight: 500,
          }}
          size="middle"
        >
          Đặt lại
        </Button>
      </div>
    </Card>
  );
}
