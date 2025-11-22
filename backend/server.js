const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid'); // Background job için gerekli
require('dotenv').config();

// Modeller (Background job için)
const Operation = require('./models/Operation');
const EventLog = require('./models/EventLog');

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

// Import route modules
const authRouter = require('./routes/auth'); // YENİ: Auth rotası
const operationsRouter = require('./routes/operations');
const vehiclesRouter = require('./routes/vehicles');
const passengersRouter = require('./routes/passengers');
const customersRouter = require('./routes/customers');
const locationsRouter = require('./routes/locations');

// Use routes
app.use('/api/auth', authRouter); // YENİ: Auth endpoint'i aktif edildi
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

// --- BACKGROUND JOB: Otomatik Uyarı Sistemi ---
// Her 60 saniyede bir çalışır
setInterval(async () => {
  try {
    const now = new Date();
    // Bugünün aktif veya planlanmış operasyonlarını bul
    const activeOps = await Operation.find({ 
      date: now.toISOString().split('T')[0],
      status: { $in: ['planned', 'active'] } 
    });

    for (const op of activeOps) {
       // Başlangıç saatini parse et
       const [hours, minutes] = op.start_time.split(':').map(Number);
       const startDateTime = new Date(op.date);
       startDateTime.setHours(hours, minutes, 0, 0);

       // 15 dk tolerans (buffer)
       const alertThresholdMinutes = 15;
       const alertTime = new Date(startDateTime.getTime() + alertThresholdMinutes * 60000);

       // Eğer zaman geçtiyse ve check-in oranı düşükse
       if (now >= alertTime && op.total_pax > 0) {
         const checkInRatio = op.checked_in_count / op.total_pax;
         const threshold = 0.7;

         if (checkInRatio < threshold) {
           // Bu operasyon için son 30 dakikada atılmış bir alert var mı kontrol et (Spam önleme)
           const recentAlert = await EventLog.findOne({
             operation_id: op.id,
             event_type: 'alert',
             timestamp: { $gte: new Date(now.getTime() - 30 * 60000) }
           });

           if (!recentAlert) {
             console.log(`⚠️ Alert Triggered for Operation ${op.code}`);
             
             // Alert Log Oluştur
             await EventLog.create({
               event_id: uuidv4(),
               event_type: 'alert',
               operation_id: op.id,
               message: `Low check-in rate alert: ${(checkInRatio * 100).toFixed(1)}%`,
               data: { ratio: checkInRatio, threshold }
             });

             // WebSocket Yayını
             io.to(`operation:${op.id}`).emit('check_in_alert', {
               operation_id: op.id,
               message: `DİKKAT: Operasyon ${op.code} için check-in oranı düşük!`,
               ratio: checkInRatio
             });
           }
         }
       }
    }
  } catch (err) {
    console.error('Background Job Error:', err);
  }
}, 60000);

// Start server
const PORT = process.env.PORT || 8001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready`);
});

module.exports = { app, io };