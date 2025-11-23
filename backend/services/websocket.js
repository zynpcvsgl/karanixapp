let io;

const initWebSocket = (socketIO) => {
  io = socketIO;

  io.on('connection', (socket) => {
    console.log(`✅ Client connected: ${socket.id}`);

    socket.on('subscribe:operation', (operationId) => {
      socket.join(`operation:${operationId}`);
      console.log(`📡 Subscribed to operation:${operationId}`);
    });

    socket.on('subscribe:vehicle', (vehicleId) => {
      socket.join(`vehicle:${vehicleId}`);
      console.log(`📡 Subscribed to vehicle:${vehicleId}`);
    });

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });
};

const broadcastToOperation = (operationId, message) => {
  if (io) {
    io.to(`operation:${operationId}`).emit('message', message);
  }
};

const broadcastToVehicle = (vehicleId, message) => {
  if (io) {
    io.to(`vehicle:${vehicleId}`).emit('message', message);
  }
};

module.exports = {
  initWebSocket,
  broadcastToOperation,
  broadcastToVehicle
};