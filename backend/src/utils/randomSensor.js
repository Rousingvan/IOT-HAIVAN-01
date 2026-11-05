/**
 * Cấu hình dải giá trị và ngưỡng cảnh báo cho 3 cảm biến ngẫu nhiên (Đề 3)
 * Range: Lấy cả 2 đầu
 * S1: [0, 11] -> 50% = 5.5 -> > 50% là >= 6
 * S2: [0, 101] -> 50% = 50.5 -> > 50% là >= 51
 * S3: [0, 1001] -> 500.5 -> > 50% là >= 501
 */
export const RANDOM_SENSOR_CONFIG = {
  s1: { min: 0, max: 11, threshold: 5.5, name: 'Cảm biến 1', unit: 'idx' },
  s2: { min: 0, max: 101, threshold: 50.5, name: 'Cảm biến 2', unit: 'ppm' },
  s3: { min: 0, max: 1001, threshold: 500.5, name: 'Cảm biến 3', unit: 'ppb' },
};

/**
 * Kiểm tra giá trị có vượt 50% dải đo hay không
 * @param {number} value
 * @param {number} max
 * @returns {boolean}
 */
export const isOverHalf = (value, max) => {
  if (value === undefined || value === null || isNaN(value)) return false;
  return Number(value) > max / 2;
};

/**
 * Kẹp giá trị vào khoảng [0, max] và làm tròn thành số nguyên
 * @param {number} val
 * @param {number} max
 * @returns {number}
 */
export const clampSensorValue = (val, max) => {
  const num = Number(val);
  if (isNaN(num)) return 0;
  const rounded = Math.round(num);
  return Math.max(0, Math.min(max, rounded));
};

/**
 * Chuẩn hóa payload nhận từ ESP32 / Mock thành điểm dữ liệu lưu CSDL
 * @param {object} payload
 * @param {Date} [fallbackTime]
 * @returns {object}
 */
export const buildRandomSensorPoint = (payload = {}, fallbackTime = new Date()) => {
  const s1 = clampSensorValue(payload.s1 ?? 0, RANDOM_SENSOR_CONFIG.s1.max);
  const s2 = clampSensorValue(payload.s2 ?? 0, RANDOM_SENSOR_CONFIG.s2.max);
  const s3 = clampSensorValue(payload.s3 ?? 0, RANDOM_SENSOR_CONFIG.s3.max);

  let measuredAt = fallbackTime;
  if (payload.timestamp) {
    const parsed = new Date(payload.timestamp);
    if (!isNaN(parsed.getTime())) {
      measuredAt = parsed;
    }
  }

  return {
    s1,
    s2,
    s3,
    alert_s1: isOverHalf(s1, RANDOM_SENSOR_CONFIG.s1.max),
    alert_s2: isOverHalf(s2, RANDOM_SENSOR_CONFIG.s2.max),
    alert_s3: isOverHalf(s3, RANDOM_SENSOR_CONFIG.s3.max),
    measured_at: measuredAt,
  };
};
