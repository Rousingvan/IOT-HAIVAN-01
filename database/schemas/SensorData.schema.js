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

// Index phục vụ bộ lọc thời gian đa mức độ và truy vấn 20 điểm biểu đồ
sensorDataSchema.index({ measured_at: -1 });

export const SensorData = mongoose.model('SensorData', sensorDataSchema);
