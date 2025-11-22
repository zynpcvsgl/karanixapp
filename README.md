# Karanix Demo Case - Real-time Operation Tracking System

A full-stack real-time operation tracking system built with **Node.js**, **React**, **MongoDB**, and **Socket.IO**. Features GPS heartbeat tracking, passenger check-in management, and live map visualization.

## 📚 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [WebSocket Events](#-websocket-events)
- [Testing](#-testing)
- [Google Maps Setup](#-google-maps-setup)
- [Acceptance Criteria](#-acceptance-criteria)

## 🎯 Features

### Backend
- ✅ **Node.js + Express** REST API
- ✅ **Socket.IO** for real-time WebSocket communication
- ✅ **MongoDB** with Mongoose ODM
- ✅ **GPS Heartbeat System** - Real-time vehicle tracking
- ✅ **Passenger Check-in** with idempotency support
- ✅ **Alert System** - Automatic low check-in rate alerts
- ✅ **JWT Authentication** (optional, not enforced in demo)
- ✅ **Database Seeding** with sample data

### Frontend
- ✅ **React** with modern hooks
- ✅ **Google Maps Integration** with real-time vehicle tracking
- ✅ **WebSocket Client** for live updates
- ✅ **Responsive Dashboard** with Tailwind CSS
- ✅ **Operation Management** (Today/Tomorrow filtering)
- ✅ **Passenger Manifest** with check-in functionality
- ✅ **Real-time Notifications**

## 🛠️ Tech Stack

### Backend
- Node.js 18+
- Express.js
- Socket.IO 4.x
- MongoDB 5.x
- Mongoose ODM
- JWT for authentication

### Frontend
- React 19
- React Router v7
- Socket.IO Client
- @react-google-maps/api
- Tailwind CSS
- Axios for HTTP requests
- Lucide React (icons)
- date-fns

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and Yarn
- MongoDB running on localhost:27017

### Installation

```bash
# Install backend dependencies
cd /app/backend
yarn install

# Install frontend dependencies
cd /app/frontend
yarn install
```

### Setup Environment Variables

**Backend** (`/app/backend/.env`):
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=karanix_demo
PORT=8001
NODE_ENV=development
CORS_ORIGINS=*
JWT_SECRET=karanix_demo_secret_key_2024
JWT_EXPIRES_IN=7d
ALERT_CHECK_IN_THRESHOLD=0.7
ALERT_TIME_BUFFER_MINUTES=15
```

**Frontend** (`/app/frontend/.env`):
```env
REACT_APP_BACKEND_URL=http://localhost:8001
REACT_APP_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY
```

### Seed Database

```bash
cd /app/backend
yarn seed
```

This creates: 2 Customers, 4 Locations, 3 Vehicles, 3 Operations, 13 Passengers

### Run Services

```bash
# Start backend
cd /app/backend
yarn start

# Start frontend (in another terminal)
cd /app/frontend
yarn start
```

### Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8001/api
- **WebSocket**: ws://localhost:8001

## 📁 Project Structure

```
/app/
├── backend/
│   ├── models/              # Mongoose models
│   ├── routes/              # API routes
│   ├── middleware/          # JWT auth
│   ├── server.js            # Express + Socket.IO
│   ├── seed.js              # Database seeding
│   ├── test_heartbeat.js    # GPS simulator
│   └── README.md
│
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   └── services/        # API & WebSocket clients
│   └── package.json
│
└── README.md (this file)
```

## 📡 API Documentation

### Operations

```http
GET /api/operations?date=YYYY-MM-DD&status=active
GET /api/operations/:id
POST /api/operations/:id/start
```

### Vehicles

```http
POST /api/vehicles/:id/heartbeat
{
  "lat": 41.0082,
  "lng": 28.9784,
  "heading": 45,
  "speed": 25
}
```

### Passengers

```http
POST /api/pax/:id/checkin
{
  "method": "qr",
  "gps": {"lat": 41.0082, "lng": 28.9784}
}
```

Full API docs: See `/app/backend/README.md`

## 🔌 WebSocket Events

### Client → Server
```javascript
socket.emit('join_operation', 'operation-uuid');
socket.emit('join_vehicle', 'vehicle-uuid');
```

### Server → Client
```javascript
socket.on('vehicle_position', (data) => { ... });
socket.on('pax_checked_in', (data) => { ... });
socket.on('check_in_alert', (data) => { ... });
```

## 🧪 Testing

### Test Backend API
```bash
curl http://localhost:8001/api
curl "http://localhost:8001/api/operations?date=$(date +%Y-%m-%d)"
```

### Simulate GPS Heartbeat
```bash
cd /app/backend
node test_heartbeat.js
```

Sends GPS heartbeat every 5 seconds, simulating vehicle movement.

### Test Check-in
```bash
PAX_ID="<from-database>"
curl -X POST http://localhost:8001/api/pax/$PAX_ID/checkin \
  -H "Content-Type: application/json" \
  -d '{"method": "manual", "gps": {"lat": 41.0082, "lng": 28.9784}}'
```

## 🗺️ Google Maps Setup

1. Get API key from [Google Cloud Console](https://console.cloud.google.com/)
2. Enable **Maps JavaScript API**
3. Add to `/app/frontend/.env`:
   ```
   REACT_APP_GOOGLE_MAPS_API_KEY=AIza...your_key_here
   ```
4. Restart frontend

## ✅ Acceptance Criteria

### ✅ Backend
1. Server runs: `curl http://localhost:8001/api`
2. Operations API returns data
3. Heartbeat saves to DB and broadcasts via WebSocket
4. Check-in updates status and increments count

### ✅ Frontend
1. Dashboard loads at http://localhost:3000
2. Operations list filters by Today/Tomorrow
3. Operation detail shows map with markers
4. Real-time updates work (heartbeat + check-in)

### ✅ Real-time System
1. WebSocket connects successfully
2. GPS heartbeat → DB → WebSocket → Map updates
3. Check-in → Status updated → WebSocket → UI updates

## 📝 Notes

- **Alert System**: Triggers when check-in < 70% after start time + 15 min
- **Data Models**: All use UUID (no MongoDB ObjectId)
- **Security**: CORS allows all origins (change for production)
- **History**: Vehicle history auto-deletes after 7 days

---

**Karanix Software Solutions - Technical Evaluation Demo**  
Version 1.0.0
