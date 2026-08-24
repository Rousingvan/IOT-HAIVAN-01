import { ActionHistory } from '../models/ActionHistory.model.js';
import { buildTimeStringQuery, buildTimeRangeQuery } from '../utils/timeRangeHelper.js';

export const queryActionHistory = async (req, res) => {
  const { deviceCode, searchTime, startTime, endTime, granularity, page = 1, pageSize = 10 } = req.query;

  let query = {};
  if (deviceCode && deviceCode !== 'ALL') {
    query.device_code = deviceCode;
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

