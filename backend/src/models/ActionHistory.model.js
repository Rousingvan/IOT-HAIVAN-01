import mongoose from 'mongoose';

const actionHistorySchema = new mongoose.Schema(
  {
    device_code: {
      type: String,
      required: true,
      index: true,
    },
    device_name: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      enum: ['ON', 'OFF', 'ALERT', 'WARNING'],
      required: true,
    },
    command_time: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    response_time: {
      type: Date,
    },
    latency_ms: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'TIMEOUT', 'FAILED'],
      default: 'SUCCESS',
      index: true,
    },
    user_id: {
      type: String,
      default: 'admin',
    },
  },
  {
    timestamps: true,
  }
);

actionHistorySchema.index({ command_time: -1 });

export const ActionHistory = mongoose.model('ActionHistory', actionHistorySchema);
