const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGINS || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGINS || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Make io accessible to routes
app.set('io', io);

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      dbName: process.env.DB_NAME || 'karanix_demo'
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

connectDB();

// Socket.IO Connection Handling
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  // Join operation room
  socket.on('join_operation', (operationId) => {
    socket.join(`operation:${operationId}`);
    console.log(`📍 Socket ${socket.id} joined operation:${operationId}`);
  });

  // Join vehicle room
  socket.on('join_vehicle', (vehicleId) => {
    socket.join(`vehicle:${vehicleId}`);
    console.log(`🚍 Socket ${socket.id} joined vehicle:${vehicleId}`);
  });

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// Routes
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Karanix Demo Case API',
    version: '1.0.0',
    status: 'running'
  });
});

// Import and use route modules
const operationsRouter = require('./routes/operations');
const vehiclesRouter = require('./routes/vehicles');
const passengersRouter = require('./routes/passengers');
const customersRouter = require('./routes/customers');
const locationsRouter = require('./routes/locations');

app.use('/api/operations', operationsRouter);
app.use('/api/vehicles', vehiclesRouter);
app.use('/api/pax', passengersRouter);
app.use('/api/customers', customersRouter);
app.use('/api/locations', locationsRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 8001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready`);
});

module.exports = { app, io };
