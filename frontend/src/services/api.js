/**
 * ==============================================================================
 * TẦNG DỊCH VỤ: API Service (api.js)
 * MỤC ĐÍCH:
 * - Trung tâm điều phối và xử lý toàn bộ các yêu cầu giao tiếp mạng (HTTP Requests)
 *   giữa giao diện Frontend (React) và máy chủ Backend (Node.js / Express).
 *
 * KIẾN TRÚC DỰ PHÒNG LINH HOẠT (Dual-Mode / Resilient Fallback):
 * 1. Chế độ Trực tuyến (Online Mode):
 *    - Gửi request HTTP qua Axios tới Backend (`http://localhost:5000/api`).
 * 2. Chế độ Giả lập Dự phòng (Offline / Mock Fallback Mode):
 *    - Khi máy chủ Backend chưa bật hoặc kết nối mạng bị gián đoạn, khối `catch`
 *      sẽ tự động kích hoạt chế độ Mock Data chạy trên bộ nhớ RAM trình duyệt và LocalStorage.
 *    - Đảm bảo ứng dụng KHÔNG BAO GIỜ bị sập giao diện (Crash/White Screen) khi báo cáo hoặc demo.
 * ==============================================================================
 */

import axios from 'axios';
import dayjs from 'dayjs';

// Địa chỉ gốc của Backend API (ưu tiên biến môi trường VITE_API_URL từ file .env)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Cấu hình Axios Instance dùng chung trong toàn bộ ứng dụng:
 * - baseURL: Địa chỉ gốc của máy chủ API.
 * - timeout: 4000ms (4 giây) - Nếu Backend không phản hồi trong 4s sẽ ngắt để chuyển Fallback.
 * - headers: Định dạng gửi và nhận dữ liệu là JSON.
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 7000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ==============================================================================
// PHẦN 1: DỮ LIỆU GIẢ LẬP TRONG BỘ NHỚ CLIENT (MOCK DATABASE IN-MEMORY)
// Phục vụ chạy Demo khi Backend chưa khởi động
// ==============================================================================

/**
 * Danh sách thiết bị mẫu trong hệ thống:
 * - device_code: Mã định danh thiết bị theo quy chuẩn {Mã_Phòng}_{Loại_Thiết_Bị}_{Số_Thứ_Tự}
 * - device_name: Tên hiển thị thân thiện với người dùng
 * - device_type: Loại thiết bị (LAMP: Đèn, FAN: Quạt)
 * - room: Tên phòng thực hành lắp đặt
 * - location: Vị trí cụ thể trong phòng
 * - pin_relay: Chân GPIO điều khiển Relay tương ứng trên bo mạch ESP32
 * - is_connected: Trạng thái kết nối phần cứng thực tế (true: Đã cắm mạch, false: Module mở rộng dự phòng)
 * - current_state: Trạng thái hiện tại của thiết bị (ON: Đang bật, OFF: Đang tắt)
 */
let mockDevices = [
  {
    device_code: 'P201_LAMP_01',
    device_name: 'Đèn Chiếu Sáng 01',
    device_type: 'LAMP',
    room: 'Phòng Thực Hành IoT 201 - Nhà A2',
    location: 'Đèn trần dãy giữa bàn 3-4',
    pin_relay: 26,           // Nối với chân GPIO 26 trên ESP32
    is_connected: true,      // Đã lắp phần cứng thực tế
    current_state: 'ON',     // Mặc định đang bật
    updated_at: new Date().toISOString(),
  },
  {
    device_code: 'P201_LAMP_02',
    device_name: 'Đèn Chiếu Sáng 02',
    device_type: 'LAMP',
    room: 'Phòng Thực Hành IoT 201 - Nhà A2',
    location: 'Đèn trần góc bảng viết',
    pin_relay: 25,           // Nối với chân GPIO 25 trên ESP32
    is_connected: true,      // Đã lắp phần cứng thực tế
    current_state: 'OFF',    // Mặc định đang tắt
    updated_at: new Date().toISOString(),
  },
  {
    device_code: 'P201_LAMP_03',
    device_name: 'Đèn Chiếu Sáng 03',
    device_type: 'LAMP',
    room: 'Phòng Thực Hành IoT 201 - Nhà A2',
    location: 'Đèn trần khu vực cửa chính',
    pin_relay: 33,           // Nối với chân GPIO 33 trên ESP32
    is_connected: true,      // Đã lắp phần cứng thực tế
    current_state: 'OFF',    // Mặc định đang tắt
    updated_at: new Date().toISOString(),
  },
  /*
  // Tạm thời comment thiết bị quạt phục vụ bài demo tập trung vào hệ thống đèn chiếu sáng
  {
    device_code: 'P201_FAN_01',
    device_name: 'Quạt Làm Mát 01',
    device_type: 'FAN',
    room: 'Phòng Thực Hành IoT 201 - Nhà A2',
    location: 'Quạt thông gió cửa sổ hướng Tây',
    pin_relay: 27,
    is_connected: false,     // Chưa kết nối (Module mở rộng)
    current_state: 'OFF',
    updated_at: new Date().toISOString(),
  },
  {
    device_code: 'P201_FAN_02',
    device_name: 'Quạt Làm Mát 02',
    device_type: 'FAN',
    room: 'Phòng Thực Hành IoT 201 - Nhà A2',
    location: 'Quạt treo tường cửa ra vào',
    pin_relay: 14,
    is_connected: false,
    current_state: 'OFF',
    updated_at: new Date().toISOString(),
  },
  */
];

/**
 * Danh sách lịch sử điều khiển thiết bị mẫu (Action History Mock)
 * Ghi nhận các lệnh gửi điều khiển, thời gian phản hồi và độ trễ xác nhận từ ESP32
 */
let mockActionHistory = [
  {
    id: 'ACT_001',
    device_code: 'P201_LAMP_01',
    device_name: 'Đèn Chiếu Sáng 01',
    action: 'ON',
    command_time: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    response_time: new Date(Date.now() - 1000 * 60 * 15 + 320).toISOString(),
    status: 'SUCCESS',
    user_id: 'admin',
  },
  {
    id: 'ACT_002',
    device_code: 'P201_LAMP_01',
    device_name: 'Đèn Chiếu Sáng 01',
    action: 'OFF',
    command_time: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    response_time: new Date(Date.now() - 1000 * 60 * 5 + 280).toISOString(),
    status: 'SUCCESS',
    user_id: 'admin',
  },
];

/**
 * Hàm sinh tự động 60 bản ghi đo đạc cảm biến mẫu
 * Sử dụng hàm lượng giác sin/cos kết hợp số ngẫu nhiên để tạo dao động tự nhiên theo chu kỳ
 */
const generateMockSensorData = () => {
  const data = [];
  const now = Date.now();
  for (let i = 0; i < 60; i++) {
    const time = new Date(now - (59 - i) * 10000); // Mỗi điểm cách nhau 10 giây
    data.push({
      id: `DATA_${i + 1}`,
      temperature: +(25 + Math.sin(i / 6) * 4 + (Math.random() * 0.8)).toFixed(1), // Nhiệt độ: 25 - 29°C
      humidity: +(62 + Math.cos(i / 5) * 8 + (Math.random() * 1.2)).toFixed(1),    // Độ ẩm: 54 - 70%
      light: Math.floor(420 + Math.sin(i / 4) * 180 + Math.random() * 40),          // Ánh sáng: 240 - 640 Lux
      measured_at: time.toISOString(),
    });
  }
  return data;
};

// Khởi tạo mảng dữ liệu lịch sử cảm biến mẫu trong bộ nhớ
let mockSensorHistory = generateMockSensorData();

// ==============================================================================
// PHẦN 2: ĐỐI TƯỢNG apiService - CÁC HÀM GỌI API CHO TOÀN BỘ ỨNG DỤNG
// ==============================================================================
export const apiService = {

  // ----------------------------------------------------------------------------
  // NHÓM 1: XÁC THỰC NGƯỜI DÙNG & THÔNG TIN CÁ NHÂN (AUTH & PROFILE)
  // ----------------------------------------------------------------------------

  /**
   * Đăng ký tài khoản sinh viên mới
   * @param {Object} userData - Thông tin người dùng { username, password, fullName, studentCode, className }
   */
  register: async (userData) => {
    try {
      const res = await apiClient.post('/auth/register', userData);
      if (res.data?.user) {
        localStorage.setItem('iot_user', JSON.stringify(res.data.user));
      }
      return res.data;
    } catch {
      // Fallback: Lưu tài khoản mới vào LocalStorage nếu backend offline
      const registeredList = JSON.parse(localStorage.getItem('iot_registered_users') || '[]');
      const exists = registeredList.some((u) => u.username === userData.username);
      if (exists || userData.username === 'admin') {
        throw new Error('Tên đăng nhập đã tồn tại! Vui lòng chọn tên đăng nhập khác.');
      }

      const newUser = {
        username: userData.username,
        password: userData.password,
        fullName: userData.fullName,
        studentCode: userData.studentCode,
        className: userData.className,
        role: 'STUDENT', // Phân quyền mặc định là Sinh viên (Chỉ xem)
      };
      registeredList.push(newUser);
      localStorage.setItem('iot_registered_users', JSON.stringify(registeredList));

      const sessionUser = {
        username: newUser.username,
        fullName: newUser.fullName,
        studentCode: newUser.studentCode,
        className: newUser.className,
        role: 'STUDENT',
      };
      localStorage.setItem('iot_user', JSON.stringify(sessionUser));
      return { success: true, token: 'mock_jwt_student_token', user: sessionUser };
    }
  },

  /**
   * Đăng nhập vào hệ thống
   * @param {string} username - Tên đăng nhập
   * @param {string} password - Mật khẩu
   */
  login: async (username, password) => {
    try {
      const res = await apiClient.post('/auth/login', { username, password });
      if (res.data?.user) {
        localStorage.setItem('iot_user', JSON.stringify(res.data.user));
      }
      return res.data;
    } catch {
      // Fallback 1: Kiểm tra tài khoản Quản trị viên (Admin) mặc định
      if (username === 'admin' && password === 'admin123') {
        const user = {
          username: 'admin',
          fullName: 'Lương Hải Vân',
          studentCode: 'B23DCAT332',
          className: 'D23CQAT02-B',
          role: 'ADMIN', // Có quyền điều khiển thiết bị
        };
        localStorage.setItem('iot_user', JSON.stringify(user));
        return { success: true, token: 'mock_jwt_admin_token', user };
      }

      // Fallback 2: Kiểm tra tài khoản sinh viên đã đăng ký trong LocalStorage
      const registeredList = JSON.parse(localStorage.getItem('iot_registered_users') || '[]');
      const found = registeredList.find((u) => u.username === username && u.password === password);
      if (found) {
        const user = {
          username: found.username,
          fullName: found.fullName,
          studentCode: found.studentCode,
          className: found.className,
          role: 'STUDENT', // Chỉ có quyền xem
        };
        localStorage.setItem('iot_user', JSON.stringify(user));
        return { success: true, token: 'mock_jwt_student_token', user };
      }

      throw new Error('Sai tên đăng nhập hoặc mật khẩu (Mặc định Admin: admin / admin123)');
    }
  },

  /**
   * Lấy thông tin hồ sơ tác giả đề tài sinh viên
   */
  getProfile: async () => {
    try {
      const res = await apiClient.get('/profile');
      return res.data;
    } catch {
      // Fallback: Trả về thông tin sinh viên nghiên cứu đề tài
      return {
        fullName: 'Lương Hải Vân',
        studentCode: 'B23DCAT332',
        className: 'D23CQAT02-B',
        subject: 'IoT và Ứng dụng',
        instructor: 'TS. Nguyễn Quốc Uy',
        academicYear: '2026-2027',
        avatar: localStorage.getItem('iot_student_avatar') || '',
        links: {
          github: 'https://github.com/Rousingvan/IOT-HAIVAN-01',
          figma: 'https://www.figma.com/design/L0E1y6JcOK4M4DQPgc4jud/IoT-B23DCAT332?node-id=0-1&t=8RONHZNqQErP8w67-1',
          swagger: 'http://localhost:5000/api-docs',
          pdfReport: '/docs/Bao_cao_IOT_Luong_Hai_Van.pdf',
        },
      };
    }
  },

  // ----------------------------------------------------------------------------
  // NHÓM 2: DỮ LIỆU CẢM BIẾN & TỔNG QUAN DASHBOARD (TELEMETRY)
  // ----------------------------------------------------------------------------

  /**
   * Lấy số đo cảm biến mới nhất (phục vụ hiển thị trên 3 thẻ SensorCard)
   */
  getLatestTelemetry: async () => {
    try {
      const res = await apiClient.get('/sensors/latest');
      return res.data;
    } catch {
      // Lấy bản ghi cuối cùng trong mảng lịch sử làm giá trị mới nhất
      return mockSensorHistory[mockSensorHistory.length - 1];
    }
  },

  /**
   * Lấy danh sách lịch sử đo gần nhất để vẽ biểu đồ đường sóng
   * @param {number} limit - Số bản ghi cần lấy (Mặc định: 20 điểm đo)
   */
  getTelemetryHistory: async (limit = 20) => {
    try {
      const res = await apiClient.get(`/sensors/history?limit=${limit}`);
      return res.data;
    } catch {
      // Lấy N bản ghi cuối cùng của mảng giả lập
      return mockSensorHistory.slice(-limit);
    }
  },

  // ----------------------------------------------------------------------------
  // NHÓM 3: QUẢN LÝ & ĐIỀU KHIỂN THIẾT BỊ (DEVICES CONTROL)
  // ----------------------------------------------------------------------------

  /**
   * Lấy danh sách tất cả các thiết bị trong hệ thống
   */
  getDevices: async () => {
    try {
      const res = await apiClient.get('/devices');
      return res.data;
    } catch {
      return mockDevices;
    }
  },

  /**
   * Gửi lệnh bật/tắt thiết bị xuống ESP32
   * @param {string} deviceCode - Mã định danh thiết bị (VD: P201_LAMP_01)
   * @param {string} action - Hành động điều khiển ('ON' hoặc 'OFF')
   */
  /**
   * Gửi lệnh bật/tắt thiết bị xuống ESP32
   * @param {string} deviceCode - Mã định danh thiết bị (VD: P201_LAMP_01)
   * @param {string} action - Hành động điều khiển ('ON' hoặc 'OFF')
   */
  toggleDevice: async (deviceCode, action) => {
    try {
      const res = await apiClient.post(`/devices/${deviceCode}/toggle`, { action });
      return res.data;
    } catch (err) {
      // Nếu Backend trả về lỗi (Timeout hoặc không kết nối)
      const errorMsg = err.response?.data?.message || err.message || 'Lỗi giao tiếp với thiết bị';
      
      // Ghi nhận bản ghi FAILED/TIMEOUT vào Mock ActionHistory nếu đang chạy Offline
      const dev = mockDevices.find((d) => d.device_code === deviceCode);
      if (dev) {
        mockActionHistory.unshift({
          id: `ACT_${Date.now()}`,
          device_code: dev.device_code,
          device_name: dev.device_name,
          action,
          command_time: new Date().toISOString(),
          response_time: new Date().toISOString(),
          status: 'FAILED',
        });
      }

      // Ném lỗi ra để giao diện Dashboard/DevicePanel bắt được và báo thất bại
      throw new Error(errorMsg);
    }
  },

  // ----------------------------------------------------------------------------
  // NHÓM 4: TRA CỨU & LỌC DỮ LIỆU CẢM BIẾN (SENSOR DATA QUERY)
  // ----------------------------------------------------------------------------

  /**
   * Tra cứu và lọc danh sách đo đạc của cảm biến
   * @param {Object} params - Tham số lọc { searchTime, startTime, endTime, page, pageSize }
   */
  querySensorData: async (params) => {
    try {
      const res = await apiClient.get('/sensor-data', { params });
      return res.data;
    } catch {
      let filtered = [...mockSensorHistory];
      const { searchTime, startTime, endTime } = params || {};

      // 1. Lọc theo từ khóa thời gian linh hoạt (DD/MM/YYYY hoặc Giờ/Phút/Giây)
      if (searchTime) {
        const keyword = searchTime.toLowerCase().trim();
        filtered = filtered.filter((item) => {
          const formatted = dayjs(item.measured_at).format('DD/MM/YYYY HH:mm:ss').toLowerCase();
          const iso = item.measured_at ? item.measured_at.toLowerCase() : '';
          return formatted.includes(keyword) || iso.includes(keyword);
        });
      }
      // 2. Lọc theo khoảng ngày giờ bắt đầu và kết thúc
      else if (startTime && endTime) {
        const start = new Date(startTime).getTime();
        const end = new Date(endTime).getTime();
        filtered = filtered.filter((item) => {
          const t = new Date(item.measured_at).getTime();
          return t >= start && t <= end;
        });
      }

      return {
        data: filtered,
        total: filtered.length,
        page: params?.page || 1,
        pageSize: params?.pageSize || 10,
      };
    }
  },

  // ----------------------------------------------------------------------------
  // NHÓM 5: TRA CỨU & LỌC LỊCH SỬ THAO TÁC THIẾT BỊ (ACTION HISTORY QUERY)
  // ----------------------------------------------------------------------------

  /**
   * Tra cứu lịch sử điều khiển bật/tắt thiết bị với đa bộ lọc
   * @param {Object} params - Tham số { deviceType, deviceCode, action, status, userId, searchTime, startTime, endTime, page, pageSize }
   */
  queryActionHistory: async (params) => {
    try {
      const res = await apiClient.get('/action-history', { params });
      return res.data;
    } catch {
      let filtered = [...mockActionHistory];
      const { deviceCode, deviceType, action, status, userId, user, searchTime, startTime, endTime } = params || {};

      // 1. Lọc theo Loại thiết bị (Đèn hoặc Quạt)
      if (deviceType && deviceType !== 'ALL') {
        filtered = filtered.filter((item) => {
          const code = (item.device_code || '').toUpperCase();
          const name = (item.device_name || '').toLowerCase();
          if (deviceType === 'LAMP') {
            return code.includes('LAMP') || name.includes('đèn');
          }
          if (deviceType === 'FAN') {
            return code.includes('FAN') || name.includes('quạt');
          }
          return code.includes(deviceType.toUpperCase());
        });
      }
      // 2. Lọc theo từng Mã thiết bị cụ thể (VD: P201_LAMP_01)
      else if (deviceCode && deviceCode !== 'ALL') {
        filtered = filtered.filter((item) => item.device_code === deviceCode);
      }

      // 3. Lọc theo Hành động (ON hoặc OFF)
      if (action && action !== 'ALL') {
        filtered = filtered.filter((item) => item.action === action);
      }

      // 4. Lọc theo Trạng thái (SUCCESS, TIMEOUT, FAILED)
      if (status && status !== 'ALL') {
        filtered = filtered.filter((item) => item.status === status);
      }

      // 5. Lọc theo Người dùng thực hiện lệnh (admin, student)
      const u = userId || user;
      if (u && u !== 'ALL') {
        filtered = filtered.filter((item) => item.user_id === u);
      }

      // 6. Lọc theo chuỗi từ khóa thời gian
      if (searchTime) {
        const keyword = searchTime.toLowerCase().trim();
        filtered = filtered.filter((item) => {
          const formatted = dayjs(item.command_time).format('DD/MM/YYYY HH:mm:ss').toLowerCase();
          const iso = item.command_time ? item.command_time.toLowerCase() : '';
          return formatted.includes(keyword) || iso.includes(keyword);
        });
      }
      // 7. Lọc theo khoảng thời gian bắt đầu và kết thúc
      else if (startTime && endTime) {
        const start = new Date(startTime).getTime();
        const end = new Date(endTime).getTime();
        filtered = filtered.filter((item) => {
          const t = new Date(item.command_time).getTime();
          return t >= start && t <= end;
        });
      }

      return {
        data: filtered,
        total: filtered.length,
        page: params?.page || 1,
        pageSize: params?.pageSize || 10,
      };
    }
  },

  // ----------------------------------------------------------------------------
  // NHÓM 6: 3 CẢM BIẾN NGẪU NHIÊN & LED CẢNH BÁO (ĐỀ 3)
  // ----------------------------------------------------------------------------

  /**
   * Lấy số đo 3 cảm biến ngẫu nhiên mới nhất
   */
  getRandomSensorsLatest: async () => {
    try {
      const res = await apiClient.get('/random-sensors/latest');
      return res.data;
    } catch {
      return {
        s1: 5,
        s2: 45,
        s3: 450,
        alert_s1: false,
        alert_s2: false,
        alert_s3: false,
        mode: 'AUTO',
        measured_at: new Date().toISOString(),
      };
    }
  },

  /**
   * Lấy lịch sử đo gần nhất để vẽ biểu đồ
   */
  getRandomSensorsHistory: async (limit = 30) => {
    try {
      const res = await apiClient.get('/random-sensors/history', { params: { limit } });
      return res.data;
    } catch {
      return [];
    }
  },

  /**
   * Tra cứu bảng lịch sử 3 cảm biến có lọc theo thời gian và phân trang
   */
  queryRandomSensorsData: async (params = {}) => {
    try {
      const res = await apiClient.get('/random-sensors', { params });
      return res.data;
    } catch {
      return {
        data: [],
        total: 0,
        page: params.page || 1,
        pageSize: params.pageSize || 10,
      };
    }
  },

  /**
   * Gửi lệnh kiểm thử thủ công giá trị cảm biến xuống ESP32
   */
  triggerRandomSensorsManualTest: async (body) => {
    try {
      const res = await apiClient.post('/random-sensors/manual-test', body);
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || err.message || 'Lỗi gửi lệnh kiểm thử thủ công');
    }
  },
};
