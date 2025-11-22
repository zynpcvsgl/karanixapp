# Karanix Demo Case - Backend

Real-time operation tracking system with GPS heartbeat and passenger check-in functionality.

## 🚀 Tech Stack

- **Node.js** with Express
- **Socket.IO** for real-time WebSocket communication
- **MongoDB** with Mongoose ODM
- **JWT** for authentication

## 📦 Installation

```bash
cd /app/backend
yarn install
```

## ⚙️ Environment Variables

Create a `.env` file in the backend directory:

```env
# MongoDB Configuration
MONGO_URL=mongodb://localhost:27017
DB_NAME=karanix_demo

# Server Configuration
PORT=8001
NODE_ENV=development

# CORS
CORS_ORIGINS=*

# JWT Secret
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d

# Alert Configuration
ALERT_CHECK_IN_THRESHOLD=0.7
ALERT_TIME_BUFFER_MINUTES=15
```

## 🗄️ Database Setup

### Seed Sample Data

```bash
yarn seed
```

This will populate the database with:
- 2 Customers
- 4 Locations (pickup points)
- 3 Vehicles
- 3 Operations (2 for today, 1 for tomorrow)
- 13 Passengers with various check-in statuses

## 🏃 Running the Server

```bash
# Development mode
yarn start

# Or with nodemon (auto-restart)
yarn dev
```

Server will run on `http://localhost:8001`

## 📡 API Endpoints

### Operations

#### Get Operations
```http
GET /api/operations?date=YYYY-MM-DD&status=active|planned
```

Query Parameters:
- `date`: Filter by date (YYYY-MM-DD format)
- `status`: Filter by status (planned, active, completed, cancelled)

#### Get Operation Detail
```http
GET /api/operations/:id
```

Returns operation with passengers and vehicle info.

#### Start Operation
```http
POST /api/operations/:id/start
```

Changes operation status to "active" and broadcasts event via WebSocket.

#### Create Operation
```http
POST /api/operations
Content-Type: application/json

{
  "code": "OPS-2025-001",
  "tour_name": "Istanbul City Tour",
  "date": "2025-01-15",
  "start_time": "09:00",
  "vehicle_id": "vehicle-uuid",
  "driver_id": "driver-001",
  "guide_id": "guide-001",
  "status": "planned"
}
```

### Vehicles

#### GPS Heartbeat
```http
POST /api/vehicles/:id/heartbeat
Content-Type: application/json

{
  "lat": 41.0082,
  "lng": 28.9784,
  "heading": 45,
  "speed": 20,
  "timestamp": "2025-01-15T10:30:00Z"
}
```

**Real-time Broadcasting:**
- Saves to vehicle's `last_ping`
- Stores in history collection
- Broadcasts to `vehicle:{vehicleId}` WebSocket channel
- If vehicle has active operation, broadcasts to `operation:{operationId}` channel

#### Get Vehicles
```http
GET /api/vehicles
```

#### Get Vehicle Detail
```http
GET /api/vehicles/:id
```

#### Get Vehicle History
```http
GET /api/vehicles/:id/history?limit=100&from=2025-01-15T00:00:00Z&to=2025-01-15T23:59:59Z
```

### Passengers (Pax)

#### Check-in Passenger
```http
POST /api/pax/:id/checkin
Content-Type: application/json

{
  "method": "qr",
  "gps": {
    "lat": 41.0082,
    "lng": 28.9784
  },
  "photoUrl": "https://...",
  "event_id": "optional-uuid-for-idempotency"
}
```

**Actions:**
- Updates passenger status to "checked_in"
- Increments operation's `checked_in_count`
- Creates event log
- Broadcasts `pax_checked_in` event via WebSocket
- Checks and triggers alert if check-in rate < 70% after start time + 15 minutes

#### Get Passengers
```http
GET /api/pax?operation_id=xxx&status=waiting
```

#### Create Passenger
```http
POST /api/pax
Content-Type: application/json

{
  "operation_id": "operation-uuid",
  "name": "Ahmet Yılmaz",
  "phone": "+90 532 111 1111",
  "pickup_point": {
    "lat": 41.0369,
    "lng": 28.9850,
    "address": "Taksim Square"
  },
  "seat_no": "A1",
  "reservation_id": "RES-12345"
}
```

### Customers

#### CRUD Operations
```http
GET    /api/customers
GET    /api/customers/:id
POST   /api/customers
PUT    /api/customers/:id
DELETE /api/customers/:id
```

### Locations

#### CRUD Operations
```http
GET    /api/locations
GET    /api/locations/:id
POST   /api/locations
PUT    /api/locations/:id
DELETE /api/locations/:id
```

## 🔌 WebSocket Events

### Client → Server

```javascript
// Join operation room
socket.emit('join_operation', 'operation-uuid');

// Join vehicle room
socket.emit('join_vehicle', 'vehicle-uuid');
```

### Server → Client

#### Vehicle Position Update
```javascript
socket.on('vehicle_position', (data) => {
  // data = {
  //   operation_id: 'xxx',
  //   vehicle_id: 'yyy',
  //   lat: 41.0082,
  //   lng: 28.9784,
  //   heading: 45,
  //   speed: 20,
  //   timestamp: '2025-01-15T10:30:00Z'
  // }
});
```

#### Passenger Check-in
```javascript
socket.on('pax_checked_in', (data) => {
  // data = {
  //   operation_id: 'xxx',
  //   pax_id: 'yyy',
  //   passenger_name: 'Ahmet Yılmaz',
  //   checked_in_count: 5,
  //   total_pax: 10,
  //   timestamp: '2025-01-15T10:30:00Z'
  // }
});
```

#### Operation Started
```javascript
socket.on('operation_started', (data) => {
  // data = {
  //   operation_id: 'xxx',
  //   code: 'OPS-2025-001',
  //   status: 'active',
  //   timestamp: '2025-01-15T09:00:00Z'
  // }
});
```

#### Check-in Alert
```javascript
socket.on('check_in_alert', (data) => {
  // data = {
  //   operation_id: 'xxx',
  //   code: 'OPS-2025-001',
  //   checked_in_count: 3,
  //   total_pax: 10,
  //   check_in_ratio: 0.3,
  //   message: 'Only 30% passengers checked in',
  //   timestamp: '2025-01-15T09:20:00Z'
  // }
});
```

## 🧪 Testing

### Test Scenarios

#### 1. Get Today's Operations
```bash
curl http://localhost:8001/api/operations?date=2025-01-15
```

#### 2. Simulate GPS Heartbeat
```bash
# Get vehicle ID from seed data first
VEHICLE_ID="<from-database>"

curl -X POST http://localhost:8001/api/vehicles/$VEHICLE_ID/heartbeat \
  -H "Content-Type: application/json" \
  -d '{
    "lat": 41.0100,
    "lng": 28.9800,
    "heading": 90,
    "speed": 25
  }'
```

#### 3. Check-in Passenger
```bash
# Get passenger ID from operation detail
PAX_ID="<from-database>"

curl -X POST http://localhost:8001/api/pax/$PAX_ID/checkin \
  -H "Content-Type: application/json" \
  -d '{
    "method": "manual",
    "gps": {
      "lat": 41.0082,
      "lng": 28.9784
    }
  }'
```

#### 4. WebSocket Testing
Use frontend or Socket.IO client:

```javascript
const io = require('socket.io-client');
const socket = io('http://localhost:8001');

socket.on('connect', () => {
  console.log('Connected');
  socket.emit('join_operation', 'operation-uuid');
});

socket.on('vehicle_position', (data) => {
  console.log('Vehicle moved:', data);
});
```

## 🗂️ Data Models

### Operation
- `id`: UUID
- `code`: Unique operation code
- `tour_name`: Tour name
- `date`: YYYY-MM-DD
- `start_time`: HH:MM
- `vehicle_id`: Reference to Vehicle
- `driver_id`: Driver ID
- `guide_id`: Guide ID
- `total_pax`: Total passengers
- `checked_in_count`: Checked-in count
- `status`: planned | active | completed | cancelled
- `route`: Array of [lng, lat] coordinates

### Passenger
- `pax_id`: UUID
- `operation_id`: Reference to Operation
- `name`: Passenger name
- `phone`: Phone number
- `pickup_point`: { lat, lng, address }
- `seat_no`: Seat number
- `status`: waiting | checked_in | no_show
- `reservation_id`: Reservation ID
- `checked_in_at`: Check-in timestamp
- `checkin_method`: qr | manual

### Vehicle
- `vehicle_id`: UUID
- `plate_number`: License plate
- `model`: Vehicle model
- `capacity`: Passenger capacity
- `last_ping`: { lat, lng, heading, speed, timestamp }
- `status`: available | in_service | maintenance | offline
- `driver_id`: Current driver

### VehicleHistory
- `vehicle_id`: Reference to Vehicle
- `lat`, `lng`: GPS coordinates
- `heading`: Direction (0-360)
- `speed`: Speed in km/h
- `timestamp`: Record time
- **TTL**: Auto-deletes after 7 days

## 🚨 Alerts

Alert is triggered when:
- Current time > `start_time + 15 minutes`
- Check-in ratio < 70% (configurable via `ALERT_CHECK_IN_THRESHOLD`)

Broadcast via WebSocket `check_in_alert` event.

## 📝 Notes

- All IDs use UUID format (no MongoDB ObjectId)
- WebSocket channels use format: `operation:{id}` and `vehicle:{id}`
- Vehicle history auto-expires after 7 days (TTL index)
- Passenger check-in supports idempotency via `event_id`
- CORS is configured for all origins (change in production)

## 🔐 Authentication

JWT authentication middleware is available but **not enforced** in demo mode.

To use:
```javascript
const { authMiddleware, generateToken } = require('./middleware/auth');

// Protected route
router.get('/protected', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// Generate token
const token = generateToken({ userId: '123', role: 'admin' });
```

## ✅ Acceptance Criteria

1. ✅ Backend runs with `yarn install && yarn start`
2. ✅ `GET /api/operations?date=YYYY-MM-DD` returns operations
3. ✅ Vehicle heartbeat saves to DB and broadcasts via WebSocket
4. ✅ Passenger check-in updates status, increments count, and broadcasts
5. ✅ WebSocket real-time events work correctly
6. ✅ Seed script populates demo data
7. ✅ API documentation provided

---

**Karanix Software Solutions - Backend Demo Case**
