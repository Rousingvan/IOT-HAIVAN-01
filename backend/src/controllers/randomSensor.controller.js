import { RandomSensorData } from '../models/RandomSensorData.model.js';
import { buildRandomSensorPoint } from '../utils/randomSensor.js';
import { buildTimeStringQuery, buildTimeRangeQuery } from '../utils/timeRangeHelper.js';
import { sendRandomSensorsCommand } from '../services/mqtt.service.js';

/**
 * Lấy số đo 3 cảm biến ngẫu nhiên mới nhất
 */
export const getLatestRandomSensorData = async (req, res) => {
  try {
    const latest = await RandomSensorData.findOne().sort({ measured_at: -1 });
    if (!latest) {
      return res.json({
        s1: 0,
        s2: 0,
        s3: 0,
        alert_s1: false,
        alert_s2: false,
        alert_s3: false,
        mode: 'AUTO',
        measured_at: new Date().toISOString(),
      });
    }
    return res.json(latest);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Lấy danh sách lịch sử đo gần nhất để vẽ biểu đồ (sắp xếp tăng dần theo thời gian)
 */
export const getRandomSensorHistory = async (req, res) => {
  const limit = Math.min(100, Math.max(5, parseInt(req.query.limit) || 30));
  try {
    const history = await RandomSensorData.find()
      .sort({ measured_at: -1 })
      .limit(limit);

    // Đảo ngược thứ tự để biểu đồ vẽ từ cũ tới mới
    return res.json(history.reverse());
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Tra cứu bảng lịch sử 3 cảm biến ngẫu nhiên có phân trang và lọc theo thời gian (DD/MM/YYYY HH:mm:ss)
 */
export const queryRandomSensorData = async (req, res) => {
  const { searchTime, startTime, endTime, granularity, page = 1, pageSize = 10 } = req.query;

  let query = {};
  if (searchTime) {
    const timeQuery = buildTimeStringQuery(searchTime, 'measured_at');
    if (timeQuery) {
      query = { ...query, ...timeQuery };
    }
  } else {
    const timeQuery = buildTimeRangeQuery(startTime, endTime, granularity);
    if (timeQuery) {
      query.measured_at = timeQuery;
    }
  }

  const p = Math.max(1, parseInt(page));
  const ps = Math.max(1, parseInt(pageSize));

  try {
    const [data, total] = await Promise.all([
      RandomSensorData.find(query)
        .sort({ measured_at: -1 })
        .skip((p - 1) * ps)
        .limit(ps),
      RandomSensorData.countDocuments(query),
    ]);

    return res.json({
      data: data.map((d) => ({
        id: d._id,
        s1: d.s1,
        s2: d.s2,
        s3: d.s3,
        alert_s1: d.alert_s1,
        alert_s2: d.alert_s2,
        alert_s3: d.alert_s3,
        mode: d.mode,
        measured_at: d.measured_at,
      })),
      total,
      page: p,
      pageSize: ps,
      searchTime: searchTime || '',
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Gửi lệnh kiểm thử thủ công giá trị cảm biến xuống ESP32 và lưu CSDL
 */
export const triggerManualTest = async (req, res) => {
  const { s1, s2, s3, mode = 'MANUAL' } = req.body;

  try {
    // 1. Gửi lệnh MQTT xuống ESP32
    await sendRandomSensorsCommand({ s1, s2, s3, mode });

    // 2. Nếu ở chế độ MANUAL, chuẩn hóa và lưu luôn 1 bản ghi vào DB để Web cập nhật ngay
    let savedPoint = null;
    if (mode === 'MANUAL' && (s1 !== undefined || s2 !== undefined || s3 !== undefined)) {
      const point = buildRandomSensorPoint({ s1, s2, s3, timestamp: new Date().toISOString() });
      point.mode = 'MANUAL';
      savedPoint = await RandomSensorData.create(point);
    }

    return res.json({
      success: true,
      message: mode === 'MANUAL' ? 'Đã gửi lệnh kiểm thử thủ công tới ESP32!' : 'Đã khôi phục chế độ Random tự động!',
      data: savedPoint,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
