import { ActionHistory } from '../models/ActionHistory.model.js';
import { buildTimeStringQuery, buildTimeRangeQuery } from '../utils/timeRangeHelper.js';
import { getLightThreshold, setLightThreshold } from '../services/mqtt.service.js';

export const queryActionHistory = async (req, res) => {
  const { deviceCode, deviceType, action, status, userId, user, searchTime, startTime, endTime, granularity, page = 1, pageSize = 10 } = req.query;

  let query = {};
  if (deviceType && deviceType !== 'ALL') {
    query.device_code = { $regex: deviceType, $options: 'i' };
  } else if (deviceCode && deviceCode !== 'ALL') {
    query.device_code = deviceCode;
  }

  if (action && action !== 'ALL') {
    query.action = action;
  }

  if (status && status !== 'ALL') {
    query.status = status;
  }

  const u = userId || user;
  if (u && u !== 'ALL') {
    query.user_id = u;
  }

  if (searchTime) {
    const timeQuery = buildTimeStringQuery(searchTime, 'command_time');
    if (timeQuery) {
      query = { ...query, ...timeQuery };
    }
  } else {
    const timeQuery = buildTimeRangeQuery(startTime, endTime, granularity);
    if (timeQuery) {
      query.command_time = timeQuery;
    }
  }

  const p = Math.max(1, parseInt(page));
  const ps = Math.max(1, parseInt(pageSize));

  try {
    const [data, total] = await Promise.all([
      ActionHistory.find(query)
        .sort({ command_time: -1 })
        .skip((p - 1) * ps)
        .limit(ps),
      ActionHistory.countDocuments(query),
    ]);

    return res.json({
      data: data.map((d) => ({
        id: d._id,
        device_code: d.device_code,
        device_name: d.device_name,
        action: d.action,
        command_time: d.command_time,
        response_time: d.response_time,
        latency_ms: d.latency_ms,
        status: d.status,
        user_id: d.user_id || 'admin',
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
 * ĐỀ 1: API Thống kê số lượng cảnh báo ánh sáng gom theo Ngày và Tháng
 */
export const getAlertStats = async (req, res) => {
  try {
    const alertFilter = {
      $or: [
        { device_code: 'ALERT_LED' },
        { action: 'ALERT' },
        { device_code: { $regex: 'ALERT', $options: 'i' } },
      ],
    };

    const [daily, monthly, totalAlerts] = await Promise.all([
      // Gom nhóm theo ngày (YYYY-MM-DD theo giờ VN)
      ActionHistory.aggregate([
        { $match: alertFilter },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$command_time',
                timezone: '+07:00',
              },
            },
            count: { $sum: 1 },
            latestTime: { $max: '$command_time' },
          },
        },
        { $sort: { _id: -1 } },
        { $limit: 15 },
      ]),
      // Gom nhóm theo tháng (YYYY-MM theo giờ VN)
      ActionHistory.aggregate([
        { $match: alertFilter },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m',
                date: '$command_time',
                timezone: '+07:00',
              },
            },
            count: { $sum: 1 },
            latestTime: { $max: '$command_time' },
          },
        },
        { $sort: { _id: -1 } },
        { $limit: 12 },
      ]),
      ActionHistory.countDocuments(alertFilter),
    ]);

    return res.json({
      totalAlerts,
      currentThreshold: getLightThreshold(),
      daily: daily.map((d) => ({ date: d._id, count: d.count, latestTime: d.latestTime })),
      monthly: monthly.map((m) => ({ month: m._id, count: m.count, latestTime: m.latestTime })),
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getAlertThreshold = async (req, res) => {
  return res.json({ threshold: getLightThreshold() });
};

export const updateAlertThreshold = async (req, res) => {
  const { threshold } = req.body;
  if (threshold === undefined || isNaN(Number(threshold))) {
    return res.status(400).json({ message: 'Ngưỡng ánh sáng không hợp lệ' });
  }
  const updated = setLightThreshold(threshold);
  return res.json({ success: true, threshold: updated });
};


