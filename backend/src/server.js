import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database.js';
import { startMQTTService } from './services/mqtt.service.js';
import apiRoutes from './routes/api.routes.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Cấu hình Socket.io Server
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'IoT PTIT Backend is Running', timestamp: new Date() });
});

// Socket.io Connection
io.on('connection', (socket) => {
  console.log(`🔌 Client đã kết nối Socket.io: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`🔌 Client đã ngắt kết nối Socket.io: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;

// Khởi chạy hệ thống
const startServer = async () => {
  // 1. Kết nối MongoDB
  await connectDatabase();

  // 2. Khởi chạy MQTT Client lắng nghe Telemetry & ACK
  startMQTTService(io);

  // 3. Khởi động Web Server
  server.listen(PORT, () => {
    console.log(`🚀 IoT PTIT Backend Server đang chạy tại: http://localhost:${PORT}`);
    console.log(`📡 WebSocket Socket.io sẵn sàng lắng nghe realtime.`);
    console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
  });
};

startServer();
