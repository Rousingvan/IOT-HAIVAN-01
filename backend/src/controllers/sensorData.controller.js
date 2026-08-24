import { SensorData } from '../models/SensorData.model.js';
import { buildTimeStringQuery, buildTimeRangeQuery } from '../utils/timeRangeHelper.js';

export const querySensorData = async (req, res) => {
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
      SensorData.find(query)
        .sort({ measured_at: -1 })
        .skip((p - 1) * ps)
        .limit(ps),
      SensorData.countDocuments(query),
    ]);

    return res.json({
      data: data.map((d) => ({
        id: d._id,
        temperature: d.temperature,
        humidity: d.humidity,
        light: d.light,
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

