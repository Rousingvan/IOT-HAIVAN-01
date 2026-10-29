import dayjs from 'dayjs';

/**
 * Helper tìm kiếm theo chuỗi ký tự thời gian (String search) theo format hiển thị bảng thống kê: DD/MM/YYYY HH:mm:ss
 * @param {string} searchTime - Chuỗi thời gian người dùng nhập (VD: '19/08/2026', '15:30', '19/08/2026 15:30:20')
 * @param {string} fieldName - Tên trường thời gian trong MongoDB (mặc định 'measured_at')
 * @returns {object} Mongo query object hoặc null
 */
export const buildTimeStringQuery = (searchTime, fieldName = 'measured_at') => {
  if (!searchTime || typeof searchTime !== 'string' || !searchTime.trim()) {
    return null;
  }

  const raw = searchTime.trim();
  const regexPatterns = [raw];

  // Nếu người dùng nhập dạng YYYY-MM-DD (VD: 2026-08-19) -> thêm biến thể DD/MM/YYYY để match đúng format bảng
  const isoDateMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})(.*)$/);
  if (isoDateMatch) {
    const [, yyyy, mm, dd, rest] = isoDateMatch;
    regexPatterns.push(`${dd}/${mm}/${yyyy}${rest}`);
  }

  // Nếu người dùng nhập dạng DD/MM/YYYY (VD: 19/08/2026) -> thêm biến thể YYYY-MM-DD
  const vnDateMatch = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})(.*)$/);
  if (vnDateMatch) {
    const [, dd, mm, yyyy, rest] = vnDateMatch;
    regexPatterns.push(`${yyyy}-${mm}-${dd}${rest}`);
  }

  // Nếu người dùng nhập dạng HH:mm:ss DD/MM/YYYY -> tự động đảo lại thành DD/MM/YYYY HH:mm:ss
  const timeFirstMatch = raw.match(/^(\d{1,2}:\d{2}(?::\d{2})?)\s+(\d{2}\/\d{2}\/\d{4})$/);
  if (timeFirstMatch) {
    const [, timePart, datePart] = timeFirstMatch;
    regexPatterns.push(`${datePart} ${timePart}`);
  }

  // Escape ký tự đặc biệt cho regex và nối OR
  const escapedPatterns = regexPatterns
    .map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');

  return {
    $expr: {
      $regexMatch: {
        input: {
          $dateToString: {
            format: '%d/%m/%Y %H:%M:%S',
            date: `$${fieldName}`,
            timezone: '+07:00',
          },
        },
        regex: escapedPatterns,
        options: 'i',
      },
    },
  };
};

/**
 * Helper phân tích và mở rộng khoảng thời gian theo đặc tả cũ
 * @param {string} startTime - Chuỗi thời gian bắt đầu
 * @param {string} endTime - Chuỗi thời gian kết thúc
 * @param {string} granularity - 'DAY' | 'HOUR' | 'MINUTE' | 'SECOND'
 * @returns {object} { $gte: Date, $lte: Date } hoặc null
 */
export const buildTimeRangeQuery = (startTime, endTime, granularity = 'DAY') => {
  if (!startTime && !endTime) return null;

  let queryStart = null;
  let queryEnd = null;

  if (startTime) {
    const s = dayjs(startTime);
    if (s.isValid()) {
      switch (granularity) {
        case 'DAY':
          queryStart = s.startOf('day').toDate();
          break;
        case 'HOUR':
          queryStart = s.startOf('hour').toDate();
          break;
        case 'MINUTE':
          queryStart = s.startOf('minute').toDate();
          break;
        case 'SECOND':
        default:
          queryStart = s.startOf('second').toDate();
          break;
      }
    }
  }

  if (endTime) {
    const e = dayjs(endTime);
    if (e.isValid()) {
      switch (granularity) {
        case 'DAY':
          queryEnd = e.endOf('day').toDate();
          break;
        case 'HOUR':
          queryEnd = e.endOf('hour').toDate();
          break;
        case 'MINUTE':
          queryEnd = e.endOf('minute').toDate();
          break;
        case 'SECOND':
        default:
          queryEnd = e.endOf('second').toDate();
          break;
      }
    }
  } else if (startTime) {
    const s = dayjs(startTime);
    switch (granularity) {
      case 'DAY':
        queryEnd = s.endOf('day').toDate();
        break;
      case 'HOUR':
        queryEnd = s.endOf('hour').toDate();
        break;
      case 'MINUTE':
        queryEnd = s.endOf('minute').toDate();
        break;
      case 'SECOND':
      default:
        queryEnd = s.endOf('second').toDate();
        break;
    }
  }

  const filter = {};
  if (queryStart) filter.$gte = queryStart;
  if (queryEnd) filter.$lte = queryEnd;

  return Object.keys(filter).length > 0 ? filter : null;
};

