export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Hệ thống Giám sát Môi trường & Điều khiển Thiết bị IoT (Smart PTIT)',
    version: '1.0.0',
    description:
      'Tài liệu đặc tả toàn bộ RESTful API của Đồ án IoT PTIT (B23DCAT332 - Lương Hải Vân). Hệ thống bao gồm 5 Use Case chính kết nối phần cứng ESP32, MQTT Broker Mosquitto, cơ sở dữ liệu MongoDB Atlas và giao diện thời gian thực.',
    contact: {
      name: 'Lương Hải Vân - B23DCAT332',
      email: 'van22052k5@gmail.com',
      url: 'https://github.com/ptit-iot/smart-home-2026',
    },
    license: {
      name: 'PTIT Academic License 2026',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Máy chủ Backend cục bộ (Local Server)',
    },
  ],
  tags: [
    { name: '01_Auth_Profile', description: 'UC01: Quản lý Xác thực & Hồ sơ Sinh viên' },
    { name: '02_Sensors_Realtime', description: 'UC02: Giám sát Dữ liệu Cảm biến Thời gian thực' },
    { name: '03_Sensor_Data_Search', description: 'UC03: Tra cứu & Lọc Dữ liệu Cảm biến Chuỗi Thời gian' },
    { name: '04_Device_Control', description: 'UC04: Điều khiển Thiết bị & Phản hồi ACK từ Phần cứng ESP32' },
    { name: '05_Action_History', description: 'UC05: Tra cứu & Lọc Lịch sử Bật/Tắt Thiết bị' },
    { name: '06_Random_Sensors', description: 'UC06: 3 Cảm Biến Ngẫu Nhiên & 3 LED Cảnh Báo (Đề 3)' },
  ],
  paths: {
    '/api/auth/register': {
      post: {
        tags: ['01_Auth_Profile'],
        summary: 'Đăng ký tài khoản sinh viên mới',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'password'],
                properties: {
                  username: { type: 'string', example: 'student01' },
                  password: { type: 'string', example: '123456' },
                  fullName: { type: 'string', example: 'Nguyễn Văn A' },
                  studentCode: { type: 'string', example: 'B23DCAT001' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Đăng ký thành công' },
          400: { description: 'Tài khoản đã tồn tại hoặc thiếu tham số' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['01_Auth_Profile'],
        summary: 'Đăng nhập hệ thống & lấy JWT Access Token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'password'],
                properties: {
                  username: { type: 'string', example: 'admin' },
                  password: { type: 'string', example: 'admin123' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Đăng nhập thành công, trả về JWT Token và thông tin người dùng',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                    user: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        username: { type: 'string', example: 'admin' },
                        fullName: { type: 'string', example: 'Lương Hải Vân' },
                        role: { type: 'string', example: 'ADMIN' },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Sai tên đăng nhập hoặc mật khẩu' },
        },
      },
    },
    '/api/profile': {
      get: {
        tags: ['01_Auth_Profile'],
        summary: 'Lấy thông tin cá nhân sinh viên & 4 liên kết đồ án (GitHub, Figma, Swagger, PDF)',
        responses: {
          200: {
            description: 'Lấy thông tin hồ sơ thành công',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    fullName: { type: 'string', example: 'Lương Hải Vân' },
                    studentCode: { type: 'string', example: 'B23DCAT332' },
                    className: { type: 'string', example: 'D23CQAT02-B' },
                    subject: { type: 'string', example: 'IoT và Ứng dụng' },
                    instructor: { type: 'string', example: 'TS. Nguyễn Quốc Uy' },
                    links: {
                      type: 'object',
                      properties: {
                        github: { type: 'string', example: 'https://github.com/ptit-iot/smart-home-2026' },
                        figma: { type: 'string', example: 'https://figma.com/@ptit_iot_design' },
                        swagger: { type: 'string', example: 'http://localhost:5000/api-docs' },
                        pdfReport: { type: 'string', example: '/docs/bao_cao_btl_iot.pdf' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/sensors/latest': {
      get: {
        tags: ['02_Sensors_Realtime'],
        summary: 'Lấy dữ liệu cảm biến tức thời mới nhất (Nhiệt độ, Độ ẩm, Ánh sáng)',
        responses: {
          200: {
            description: 'Bản ghi cảm biến mới nhất từ ESP32 lưu trong MongoDB',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    temperature: { type: 'number', example: 29.5 },
                    humidity: { type: 'number', example: 65.2 },
                    light: { type: 'number', example: 520 },
                    measured_at: { type: 'string', example: '2026-10-24T06:00:00.000Z' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/sensors/history': {
      get: {
        tags: ['02_Sensors_Realtime'],
        summary: 'Lấy chuỗi lịch sử đo đạc cảm biến gần nhất để vẽ biểu đồ AreaChart',
        parameters: [
          {
            name: 'limit',
            in: 'query',
            description: 'Số điểm dữ liệu cần lấy (mặc định 20)',
            schema: { type: 'integer', default: 20 },
          },
        ],
        responses: {
          200: {
            description: 'Mảng danh sách các điểm đo theo thứ tự thời gian tăng dần',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      temperature: { type: 'number' },
                      humidity: { type: 'number' },
                      light: { type: 'number' },
                      measured_at: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/sensor-data': {
      get: {
        tags: ['03_Sensor_Data_Search'],
        summary: 'Tra cứu, lọc theo chuỗi thời gian & phân trang dữ liệu cảm biến',
        parameters: [
          {
            name: 'searchTime',
            in: 'query',
            description: 'Tìm kiếm tự do chuỗi thời gian (VD: "2026-10-24", "14:30")',
            schema: { type: 'string' },
          },
          {
            name: 'startTime',
            in: 'query',
            description: 'Mốc thời gian bắt đầu (ISO 8601)',
            schema: { type: 'string' },
          },
          {
            name: 'endTime',
            in: 'query',
            description: 'Mốc thời gian kết thúc (ISO 8601)',
            schema: { type: 'string' },
          },
          {
            name: 'granularity',
            in: 'query',
            description: 'Độ chi tiết lọc: second, minute, hour, day, month, year',
            schema: { type: 'string', enum: ['second', 'minute', 'hour', 'day', 'month', 'year'] },
          },
          {
            name: 'page',
            in: 'query',
            description: 'Trang hiện tại (bắt đầu từ 1)',
            schema: { type: 'integer', default: 1 },
          },
          {
            name: 'pageSize',
            in: 'query',
            description: 'Số bản ghi trên mỗi trang',
            schema: { type: 'integer', default: 10 },
          },
        ],
        responses: {
          200: {
            description: 'Danh sách bản ghi đo kèm tổng số lượng phục vụ phân trang',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { type: 'object' } },
                    total: { type: 'integer', example: 100 },
                    page: { type: 'integer', example: 1 },
                    pageSize: { type: 'integer', example: 10 },
                    searchTime: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/devices': {
      get: {
        tags: ['04_Device_Control'],
        summary: 'Lấy danh sách tất cả thiết bị điều khiển và trạng thái ON/OFF hiện tại',
        responses: {
          200: {
            description: 'Danh sách thiết bị (Đèn 01, Đèn 02, Quạt...)',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      device_code: { type: 'string', example: 'P201_LAMP_01' },
                      device_name: { type: 'string', example: 'Đèn Chiếu Sáng 01' },
                      device_type: { type: 'string', example: 'LAMP' },
                      pin_relay: { type: 'integer', example: 18 },
                      is_connected: { type: 'boolean', example: true },
                      current_state: { type: 'string', example: 'ON' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/devices/{deviceCode}/toggle': {
      post: {
        tags: ['04_Device_Control'],
        summary: 'Bật / Tắt thiết bị qua MQTT và chờ phản hồi ACK từ phần cứng ESP32 trong 5s',
        description:
          'Hỗ trợ cả mã chuẩn phòng học (ví dụ: P201_LAMP_01, P201_LAMP_02) lẫn mã rút gọn phần cứng (LAMP_01, LAMP_02). Lệnh được xuất bản qua topic MQTT `esp32/device/command`, ESP32 gạt chân Relay và gửi gói ACK xác nhận vào topic `esp32/device/ack`.',
        parameters: [
          {
            name: 'deviceCode',
            in: 'path',
            required: true,
            description: 'Mã thiết bị cần điều khiển (VD: P201_LAMP_01 hoặc LAMP_01)',
            schema: {
              type: 'string',
              enum: ['P201_LAMP_01', 'LAMP_01', 'P201_LAMP_02', 'LAMP_02', 'P201_LAMP_03', 'LAMP_03', 'P201_LAMP_04', 'LAMP_04'],
              example: 'P201_LAMP_01',
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['action'],
                properties: {
                  action: {
                    type: 'string',
                    enum: ['ON', 'OFF'],
                    description: 'Hành động mong muốn (ON = Bật, OFF = Tắt)',
                    example: 'ON',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Điều khiển thành công, phần cứng đã thực thi và gửi ACK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    requestId: { type: 'string', example: 'REQ_1713940000000_abc12' },
                    deviceCode: { type: 'string', example: 'LAMP_01' },
                    action: { type: 'string', example: 'ON' },
                    latency: { type: 'integer', example: 315 },
                    status: { type: 'string', example: 'SUCCESS' },
                  },
                },
              },
            },
          },
          400: { description: 'Hành động không hợp lệ hoặc thiết bị chưa cắm phần cứng' },
          404: { description: 'Không tìm thấy mã thiết bị' },
          500: { description: 'Timeout không nhận được gói tin ACK từ ESP32 sau 5s hoặc MQTT broker ngắt' },
        },
      },
    },
    '/api/action-history': {
      get: {
        tags: ['05_Action_History'],
        summary: 'Tra cứu, lọc và phân trang lịch sử thao tác bật/tắt thiết bị',
        parameters: [
          {
            name: 'searchTime',
            in: 'query',
            description: 'Tìm kiếm chuỗi thời gian điều khiển',
            schema: { type: 'string' },
          },
          {
            name: 'deviceCode',
            in: 'query',
            description: 'Lọc theo mã thiết bị (VD: P201_LAMP_01)',
            schema: { type: 'string' },
          },
          {
            name: 'status',
            in: 'query',
            description: 'Lọc theo trạng thái: SUCCESS, FAILED, TIMEOUT',
            schema: { type: 'string', enum: ['SUCCESS', 'FAILED', 'TIMEOUT'] },
          },
          {
            name: 'page',
            in: 'query',
            description: 'Trang hiện tại (mặc định 1)',
            schema: { type: 'integer', default: 1 },
          },
          {
            name: 'pageSize',
            in: 'query',
            description: 'Số bản ghi trên trang (mặc định 10)',
            schema: { type: 'integer', default: 10 },
          },
        ],
        responses: {
          200: {
            description: 'Danh sách lịch sử điều khiển kèm độ trễ phản hồi (ms)',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { type: 'object' } },
                    total: { type: 'integer', example: 10 },
                    page: { type: 'integer', example: 1 },
                    pageSize: { type: 'integer', example: 10 },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/random-sensors/latest': {
      get: {
        tags: ['06_Random_Sensors'],
        summary: 'Lấy số đo 3 cảm biến ngẫu nhiên mới nhất',
        responses: {
          200: {
            description: 'Bản ghi cảm biến mới nhất kèm cờ cảnh báo',
          },
        },
      },
    },
    '/api/random-sensors/history': {
      get: {
        tags: ['06_Random_Sensors'],
        summary: 'Lấy danh sách điểm đo gần nhất để vẽ biểu đồ',
        parameters: [
          {
            name: 'limit',
            in: 'query',
            description: 'Số điểm đo cần lấy (mặc định 30)',
            schema: { type: 'integer', default: 30 },
          },
        ],
        responses: {
          200: {
            description: 'Mảng điểm đo sắp xếp tăng dần theo thời gian',
          },
        },
      },
    },
    '/api/random-sensors': {
      get: {
        tags: ['06_Random_Sensors'],
        summary: 'Tra cứu bảng lịch sử 3 cảm biến ngẫu nhiên có phân trang và lọc thời gian',
        parameters: [
          {
            name: 'searchTime',
            in: 'query',
            description: 'Chuỗi tìm kiếm thời gian (VD: 05/11/2026 hoặc 08:00:00)',
            schema: { type: 'string' },
          },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 },
          },
          {
            name: 'pageSize',
            in: 'query',
            schema: { type: 'integer', default: 10 },
          },
        ],
        responses: {
          200: {
            description: 'Danh sách bản ghi có phân trang',
          },
        },
      },
    },
    '/api/random-sensors/manual-test': {
      post: {
        tags: ['06_Random_Sensors'],
        summary: 'Gửi giá trị kiểm thử thủ công xuống ESP32',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  mode: { type: 'string', enum: ['AUTO', 'MANUAL'], example: 'MANUAL' },
                  s1: { type: 'integer', example: 8 },
                  s2: { type: 'integer', example: 75 },
                  s3: { type: 'integer', example: 800 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Đã gửi lệnh kiểm thử tới ESP32' },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Đăng nhập tại /api/auth/login để lấy Token, nhập dạng: Bearer <token>',
      },
    },
  },
};
