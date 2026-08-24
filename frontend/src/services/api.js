import axios from 'axios';
import dayjs from 'dayjs';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';


const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 4000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Mock Database mẫu trong bộ nhớ Client với định dạng Mã phòng_Mã thiết bị và vị trí cụ thể
let mockDevices = [
  {
    device_code: 'P201_LAMP_01',
    device_name: 'Đèn Chiếu Sáng 01',
    device_type: 'LAMP',
    room: 'Phòng Thực Hành IoT 201 - Nhà A2',
    location: 'Đèn trần dãy giữa bàn 3-4',
    pin_relay: 26,
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
    pin_relay: 25,
    is_connected: true,
    current_state: 'OFF',
    updated_at: new Date().toISOString(),
  },
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
];

let mockActionHistory = [
  {
    id: 'ACT_001',
    device_code: 'P201_LAMP_01',
    device_name: 'Đèn Chiếu Sáng 01',
    action: 'ON',
    command_time: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    response_time: new Date(Date.now() - 1000 * 60 * 15 + 320).toISOString(),
    status: 'SUCCESS',
  },
  {
    id: 'ACT_002',
    device_code: 'P201_LAMP_01',
    device_name: 'Đèn Chiếu Sáng 01',
    action: 'OFF',
    command_time: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    response_time: new Date(Date.now() - 1000 * 60 * 5 + 280).toISOString(),
    status: 'SUCCESS',
  },
];

// Tạo 60 bản ghi dữ liệu cảm biến mẫu
const generateMockSensorData = () => {
  const data = [];
  const now = Date.now();
  for (let i = 0; i < 60; i++) {
    const time = new Date(now - (59 - i) * 10000);
    data.push({
      id: `DATA_${i + 1}`,
      temperature: +(25 + Math.sin(i / 6) * 4 + (Math.random() * 0.8)).toFixed(1),
      humidity: +(62 + Math.cos(i / 5) * 8 + (Math.random() * 1.2)).toFixed(1),
      light: Math.floor(420 + Math.sin(i / 4) * 180 + Math.random() * 40),
      measured_at: time.toISOString(),
    });
  }
  return data;
};

let mockSensorHistory = generateMockSensorData();

export const apiService = {
  // Auth & Profile
  register: async (userData) => {
    try {
      const res = await apiClient.post('/auth/register', userData);
      if (res.data?.user) {
        localStorage.setItem('iot_user', JSON.stringify(res.data.user));
      }
      return res.data;
    } catch {
      // Fallback Mock Register khi backend offline
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
        role: 'STUDENT',
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

  login: async (username, password) => {
    try {
      const res = await apiClient.post('/auth/login', { username, password });
      if (res.data?.user) {
        localStorage.setItem('iot_user', JSON.stringify(res.data.user));
      }
      return res.data;
    } catch {
      // 1. Kiểm tra tài khoản Admin mặc định
      if (username === 'admin' && password === 'admin123') {
        const user = {
          username: 'admin',
          fullName: 'Lương Hải Vân',
          studentCode: 'B23DCAT332',
          className: 'D23CQAT02-B',
          role: 'ADMIN',
        };
        localStorage.setItem('iot_user', JSON.stringify(user));
        return { success: true, token: 'mock_jwt_admin_token', user };
      }

      // 2. Kiểm tra tài khoản sinh viên đã đăng ký trong bộ nhớ Local
      const registeredList = JSON.parse(localStorage.getItem('iot_registered_users') || '[]');
      const found = registeredList.find((u) => u.username === username && u.password === password);
      if (found) {
        const user = {
          username: found.username,
          fullName: found.fullName,
          studentCode: found.studentCode,
          className: found.className,
          role: 'STUDENT',
        };
        localStorage.setItem('iot_user', JSON.stringify(user));
        return { success: true, token: 'mock_jwt_student_token', user };
      }

      throw new Error('Sai tên đăng nhập hoặc mật khẩu (Mặc định Admin: admin / admin123)');
    }
  },

  getProfile: async () => {
    try {
      const res = await apiClient.get('/profile');
      return res.data;
    } catch {
      return {
        fullName: 'Lương Hải Vân',
        studentCode: 'B23DCAT332',
        className: 'D23CQAT02-B',
        subject: 'IoT và Ứng dụng',
        instructor: 'TS. Nguyễn Quốc Uy',
        academicYear: '2026-2027',
        avatar: localStorage.getItem('iot_student_avatar') || '',
        links: {
          github: 'https://github.com/ptit-iot/smart-home-2026',
          figma: 'https://figma.com/@ptit_iot_design',
          swagger: 'http://localhost:5000/api-docs',
          pdfReport: '/docs/bao_cao_btl_iot.pdf',
        },
      };
    }
  },

  // Telemetry & Dashboard
  getLatestTelemetry: async () => {
    try {
      const res = await apiClient.get('/sensors/latest');
      return res.data;
    } catch {
      return mockSensorHistory[mockSensorHistory.length - 1];
    }
  },

  getTelemetryHistory: async (limit = 20) => {
    try {
      const res = await apiClient.get(`/sensors/history?limit=${limit}`);
      return res.data;
    } catch {
      return mockSensorHistory.slice(-limit);
    }
  },

  getDevices: async () => {
    try {
      const res = await apiClient.get('/devices');
      return res.data;
    } catch {
      return mockDevices;
    }
  },

  toggleDevice: async (deviceCode, action) => {
    try {
      const res = await apiClient.post(`/devices/${deviceCode}/toggle`, { action });
      return res.data;
    } catch {
      const dev = mockDevices.find((d) => d.device_code === deviceCode);
      if (!dev) throw new Error('Không tìm thấy thiết bị');
      if (!dev.is_connected) {
        throw new Error('Thiết bị chưa được kết nối phần cứng. Không thể điều khiển.');
      }
      dev.current_state = action;
      dev.updated_at = new Date().toISOString();

      mockActionHistory.unshift({
        id: `ACT_${Date.now()}`,
        device_code: dev.device_code,
        device_name: dev.device_name,
        action,
        command_time: new Date().toISOString(),
        response_time: new Date(Date.now() + 320).toISOString(),
        status: 'SUCCESS',
      });

      return {
        success: true,
        device: dev,
        message: `Điều khiển ${dev.device_name} (${dev.device_code}) ${action} thành công!`,
      };
    }
  },

  // Sensor Data Query
  querySensorData: async (params) => {
    try {
      const res = await apiClient.get('/sensor-data', { params });
      return res.data;
    } catch {
      let filtered = [...mockSensorHistory];
      const { searchTime, startTime, endTime } = params || {};

      if (searchTime) {
        const keyword = searchTime.toLowerCase().trim();
        filtered = filtered.filter((item) => {
          const formatted = dayjs(item.measured_at).format('DD/MM/YYYY HH:mm:ss').toLowerCase();
          const iso = item.measured_at ? item.measured_at.toLowerCase() : '';
          return formatted.includes(keyword) || iso.includes(keyword);
        });
      } else if (startTime && endTime) {
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

  // Action History Query
  queryActionHistory: async (params) => {
    try {
      const res = await apiClient.get('/action-history', { params });
      return res.data;
    } catch {
      let filtered = [...mockActionHistory];
      const { deviceCode, searchTime, startTime, endTime } = params || {};

      if (deviceCode && deviceCode !== 'ALL') {
        filtered = filtered.filter((item) => item.device_code === deviceCode);
      }

      if (searchTime) {
        const keyword = searchTime.toLowerCase().trim();
        filtered = filtered.filter((item) => {
          const formatted = dayjs(item.command_time).format('DD/MM/YYYY HH:mm:ss').toLowerCase();
          const iso = item.command_time ? item.command_time.toLowerCase() : '';
          return formatted.includes(keyword) || iso.includes(keyword);
        });
      } else if (startTime && endTime) {
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
};

