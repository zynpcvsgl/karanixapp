require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const morgan = require('morgan');

// Alarm sistemi için gerekli Model
const Operation = require('./models/Operation'); 

const app = express();
const server = http.createServer(app);

// Morgan logging (development)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

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
  
  // Yönetici odasına katıl (Alarm için)
  socket.on('join_admin', () => {
    socket.join('ops_managers');
    console.log(`📡 Socket ${socket.id} joined ops_managers`);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// MongoDB Bağlantısı (GÜNCELLENDİ)
// .env'den gelen veya varsayılan bağlantı dizesini doğru formatta işler
const MONGODB_URI = process.env.MONGO_URL 
  ? (process.env.MONGO_URL.includes('?') 
      ? process.env.MONGO_URL.replace('?', `/${process.env.DB_NAME || 'karanix'}?`) 
      : `${process.env.MONGO_URL}/${process.env.DB_NAME || 'karanix'}`)
  : 'mongodb+srv://zeynep:zeynep123@karanix.rwiuhri.mongodb.net/karanix?appName=karanix';

mongoose.connect(MONGODB_URI)
  .then(() => {
    // Güvenlik için logda şifreyi gizle
    const safeURI = MONGODB_URI.replace(/:([^:@]{1,})@/, ':****@');
    console.log('✅ MongoDB Connected:', safeURI);
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
      auth: '/api/auth',
      operations: '/api/operations',
      vehicles: '/api/vehicles',
      passengers: '/api/pax',
      customers: '/api/customers',
      locations: '/api/locations'
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

// ALARM SİSTEMİ: Her 60 saniyede bir kontrol et (CRON BENZERİ YAPI)
setInterval(async () => {
  try {
    // Aktif operasyonları bul
    const activeOps = await Operation.find({ status: 'active' });
    
    activeOps.forEach(async (op) => {
      // Gerçek senaryoda: start_time + 15dk kontrolü yapılır.
      // Demo için basit mantık: Aktif operasyonun check-in oranı düşükse uyar.
      
      const ratio = op.total_pax > 0 ? op.checked_in_count / op.total_pax : 0;
      
      // Eşik değer: %70
      if (ratio < 0.7) {
        // Yönetici odasına uyarı gönder
        io.to('ops_managers').emit('alert', {
          type: 'low_attendance',
          message: `DİKKAT: ${op.tour_name} operasyonunda katılım oranı düşük (%${Math.round(ratio*100)})!`,
          operation_id: op.id,
          timestamp: new Date()
        });
        console.log(`⚠️ ALARM: ${op.tour_name} düşük katılım (%${Math.round(ratio*100)}) tespit edildi.`);
      }
    });
  } catch (error) {
    console.error('Alarm kontrol hatası:', error);
  }
}, 60000); // 1 dakika arayla çalışır

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
  console.log(`🗄️  MongoDB: ${MONGODB_URI.replace(/:([^:@]{1,})@/, ':****@')}`);
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