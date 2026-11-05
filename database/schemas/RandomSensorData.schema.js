import mongoose from 'mongoose';

const randomSensorDataSchema = new mongoose.Schema(
  {
    s1: {
      type: Number,
      required: true,
      min: 0,
      max: 11,
    },
    s2: {
      type: Number,
      required: true,
      min: 0,
      max: 101,
    },
    s3: {
      type: Number,
      required: true,
      min: 0,
      max: 1001,
    },
    alert_s1: {
      type: Boolean,
      default: false,
      index: true,
    },
    alert_s2: {
      type: Boolean,
      default: false,
      index: true,
    },
    alert_s3: {
      type: Boolean,
      default: false,
      index: true,
    },
    mode: {
      type: String,
      enum: ['AUTO', 'MANUAL'],
      default: 'AUTO',
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

randomSensorDataSchema.index({ measured_at: -1 });

export const RandomSensorData = mongoose.model('RandomSensorData', randomSensorDataSchema);
