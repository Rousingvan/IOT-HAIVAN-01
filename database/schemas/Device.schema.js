import mongoose from 'mongoose';

const deviceSchema = new mongoose.Schema(
  {
    device_code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    device_name: {
      type: String,
      required: true,
    },
    device_type: {
      type: String,
      required: true,
      enum: ['LAMP', 'FAN', 'PUMP', 'AC', 'OTHER'],
      default: 'LAMP',
    },
    pin_relay: {
      type: Number,
      required: true,
    },
    is_connected: {
      type: Boolean,
      required: true,
      default: true,
      description: 'true: đã gắn linh kiện thực tế | false: cổng mở rộng chưa gắn linh kiện',
    },
    current_state: {
      type: String,
      enum: ['ON', 'OFF'],
      default: 'OFF',
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

export const Device = mongoose.model('Device', deviceSchema);
