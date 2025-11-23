const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./src/config/db');
const { PORT } = require('./src/config/env');
const { initWebSocket } = require('./services/websocket');
const auth = require('./src/middleware/auth');

// Routes
const operationsRouter = require('./src/routes/operations');
const paxRouter = require('./src/routes/pax');
const vehiclesRouter = require('./src/routes/vehicles');
const locationsRouter = require('./src/routes/locations');
const customersRouter = require('./src/routes/customers');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Connect to MongoDB
connectDB();

// Initialize WebSocket
initWebSocket(io);

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Protected routes
app.use('/api/operations', auth, operationsRouter);
app.use('/api/pax', auth, paxRouter);
app.use('/api/vehicles', auth, vehiclesRouter);
app.use('/api/locations', auth, locationsRouter);
app.use('/api/customers', auth, customersRouter);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket ready on ws://localhost:${PORT}`);
});