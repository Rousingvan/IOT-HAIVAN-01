import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
      default: 'Lương Hải Vân',
    },
    studentCode: {
      type: String,
      required: true,
      default: 'B23DCAT332',
    },
    className: {
      type: String,
      default: 'D23CQAT02-B',
    },
    role: {
      type: String,
      enum: ['ADMIN', 'STUDENT', 'GUEST'],
      default: 'STUDENT',
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model('User', userSchema);
