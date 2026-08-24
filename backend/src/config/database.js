import mongoose from 'mongoose';

export const connectDatabase = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/iot_ptit_db';
  try {
    await mongoose.connect(uri);
    console.log('✅ Kết nối cơ sở dữ liệu MongoDB thành công!');
  } catch (err) {
    console.warn('⚠️ Không thể kết nối MongoDB:', err.message);
    console.warn('💡 Hệ thống sẽ chạy với cảnh báo kết nối DB.');
  }
};
