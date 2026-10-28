import mongoose from 'mongoose';

const sensorDataSchema = new mongoose.Schema(
  {
    temperature: {
      type: Number,
      required: true,
    },
    humidity: {
      type: Number,
      required: true,
    },
    light: {
      type: Number,
      required: true,
    },
    // ĐỀ 2: Cảm biến độ bụi (Dust Sensor) - Đơn vị mg/m3 (0.00 -> 1.00)
    dust: {
      type: Number,
      required: false,
      default: 0,
    },
    measured_at: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

sensorDataSchema.index({ measured_at: -1 });

export const SensorData = mongoose.model('SensorData', sensorDataSchema);
