import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const initSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      console.log('✅ Socket.io connected to server:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket.io disconnected');
    });
  }
  return socket;
};

export const getSocket = () => socket || initSocket();
