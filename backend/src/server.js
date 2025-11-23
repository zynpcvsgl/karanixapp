require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);

// CORS yapılandırması
app.use(cors({
  origin: process.env.CORS_ORIGINS || '*',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Socket.IO yapılandırması
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGINS || '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket.IO'yu app'e ekle (route'larda kullanmak için)
app.set('io', io);

// Socket.IO Connection Handler
io.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);

  // Join operation room
  socket.on('join_operation', (operationId) => {
    socket.join(`operation:${operationId}`);
    console.log(`📡 Socket ${socket.id} joined operation:${operationId}`);
  });

  // Join vehicle room
  socket.on('join_vehicle', (vehicleId) => {
    socket.join(`vehicle:${vehicleId}`);
    console.log(`📡 Socket ${socket.id} joined vehicle:${vehicleId}`);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// MongoDB Bağlantısı
const MONGODB_URI = process.env.MONGO_URL 
  ? `${process.env.MONGO_URL}/${process.env.DB_NAME || 'karanix_demo'}`
  : 'mongodb://localhost:27017/karanix_demo';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB Connected:', MONGODB_URI);
  })
  .catch((error) => {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  });

// Health Check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'Karanix API Server',
    version: '1.0.0',
    endpoints: {
      operations: '/api/operations',
      vehicles: '/api/vehicles',
      passengers: '/api/pax',
      customers: '/api/customers',
      locations: '/api/locations',
      auth: '/api/auth'
    }
  });
});

// Routes
const authRoutes = require('./routes/auth');
const operationsRoutes = require('./routes/operations');
const passengersRoutes = require('./routes/passengers');
const vehiclesRoutes = require('./routes/vehicles');
const customersRoutes = require('./routes/customers');
const locationsRoutes = require('./routes/locations');

app.use('/api/auth', authRoutes);
app.use('/api/operations', operationsRoutes);
app.use('/api/pax', passengersRoutes);
app.use('/api/vehicles', vehiclesRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/locations', locationsRoutes);

// Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start Server
const PORT = process.env.PORT || 8001;

server.listen(PORT, () => {
  console.log('\n🚀 Karanix Backend Server');
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`📡 WebSocket: ws://localhost:${PORT}`);
  console.log(`🗄️  MongoDB: ${MONGODB_URI}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

module.exports = { app, server, io };