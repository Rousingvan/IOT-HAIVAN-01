import { SensorData } from '../models/SensorData.model.js';

export const getLatestSensorData = async (req, res) => {
  try {
    const latest = await SensorData.findOne().sort({ measured_at: -1 });
    if (!latest) {
      return res.json({
        temperature: 28.5,
        humidity: 68.0,
        light: 520,
        measured_at: new Date(),
      });
    }
    return res.json(latest);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getSensorHistory = async (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  try {
    const history = await SensorData.find()
      .sort({ measured_at: -1 })
      .limit(limit);
    return res.json(history.reverse());
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
