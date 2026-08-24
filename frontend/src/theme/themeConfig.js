/**
 * Ant Design Theme Configuration
 * Tone màu tinh giản, trang nhã, hiện đại, chuẩn project sinh viên
 */
export const customTheme = {
  token: {
    colorPrimary: '#E05318',         // Cam đất nhã nhặn, không bị chói
    colorSuccess: '#389E0D',         // Xanh lá dịu
    colorWarning: '#D48806',         // Vàng cam
    colorError: '#CF1322',           // Đỏ cảnh báo
    colorInfo: '#096DD9',            // Xanh dương
    colorBgBase: '#FFFFFF',          // Nền trắng
    colorBgLayout: '#F5F7FA',        // Nền layout xám sáng dịu mắt
    colorTextBase: '#1F2937',        // Chữ xám đậm dễ đọc
    borderRadius: 8,                 // Bo góc vừa phải
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  components: {
    Card: {
      headerBg: '#FFFFFF',
      boxShadowSecondary: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
      borderRadiusLG: 10,
    },
    Button: {
      borderRadius: 6,
      controlHeight: 36,
      fontWeight: 500,
    },
    Table: {
      headerBg: '#FAFAFA',
      headerColor: '#374151',
      rowHoverBg: '#F9FAFB',
      borderRadiusLG: 8,
    },
    Menu: {
      itemSelectedColor: '#E05318',
      itemSelectedBg: '#FFF2E8',
      itemHoverColor: '#E05318',
      itemBorderRadius: 6,
    },
  },
};
