import { io } from 'socket.io-client';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

let socket = null;

export const initSocket = () => {
  if (!socket) {
    socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });
    
    socket.on('connect', () => {
      console.log('🔌 WebSocket connected:', socket.id);
    });
    
    socket.on('disconnect', () => {
      console.log('🔌 WebSocket disconnected');
    });
    
    socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
    });
  }
  
  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initSocket();
  }
  return socket;
};

export const joinOperationRoom = (operationId) => {
  const sock = getSocket();
  sock.emit('join_operation', operationId);
  console.log(`📍 Joined operation room: ${operationId}`);
};

export const joinVehicleRoom = (vehicleId) => {
  const sock = getSocket();
  sock.emit('join_vehicle', vehicleId);
  console.log(`🚍 Joined vehicle room: ${vehicleId}`);
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default {
  initSocket,
  getSocket,
  joinOperationRoom,
  joinVehicleRoom,
  disconnectSocket
};
