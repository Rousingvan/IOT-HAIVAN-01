import { Router } from 'express';
import { login, register } from '../controllers/auth.controller.js';
import { getProfile } from '../controllers/profile.controller.js';
import { getLatestSensorData, getSensorHistory } from '../controllers/sensor.controller.js';
import { querySensorData } from '../controllers/sensorData.controller.js';
import { getDevices, toggleDevice } from '../controllers/device.controller.js';
import {
  queryActionHistory,
  getDustAlertStats,
  getDustThresholdApi,
  updateDustThresholdApi,
} from '../controllers/actionHistory.controller.js';

const router = Router();

// UC01: Auth & Profile
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/profile', getProfile);

// UC02: Realtime Sensor Data & History for AreaChart (5s)
router.get('/sensors/latest', getLatestSensorData);
router.get('/sensors/history', getSensorHistory);

// UC03: Search Sensor Data with Time Range Filter (timestamp.md)
router.get('/sensor-data', querySensorData);

// UC04: Device List & Toggle Control
router.get('/devices', getDevices);
router.post('/devices/:deviceCode/toggle', toggleDevice);

// UC05: Search Action History with Time Range Filter (timestamp.md)
router.get('/action-history', queryActionHistory);

// ĐỀ 2: Thống kê số lượng cảnh báo độ bụi theo Ngày & Tháng và Cấu hình ngưỡng bụi
router.get('/action-history/alert-stats', getDustAlertStats);
router.get('/alerts/dust-threshold', getDustThresholdApi);
router.post('/alerts/dust-threshold', updateDustThresholdApi);

export default router;
