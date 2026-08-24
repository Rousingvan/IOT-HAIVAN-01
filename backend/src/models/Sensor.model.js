import mongoose from 'mongoose';

const sensorSchema = new mongoose.Schema(
  {
    sensor_code: {
      type: String,
      required: true,
      unique: true,
    },
    sensor_name: {
      type: String,
      required: true,
    },
    sensor_type: {
      type: String,
      required: true,
      enum: ['TEMP', 'HUMID', 'LIGHT'],
    },
    unit: {
      type: String,
      required: true,
    },
    pin_location: {
      type: String,
      required: true,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Sensor = mongoose.model('Sensor', sensorSchema);
