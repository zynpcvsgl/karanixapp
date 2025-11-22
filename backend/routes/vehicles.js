const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Vehicle = require('../models/Vehicle');
const VehicleHistory = require('../models/VehicleHistory');
const Operation = require('../models/Operation');
const EventLog = require('../models/EventLog');
const { optionalAuth } = require('../middleware/auth');

// GET /api/vehicles - Get all vehicles
router.get('/', optionalAuth, async (req, res) => {
  try {
    const vehicles = await Vehicle.find();
    
    res.json({
      success: true,
      count: vehicles.length,
      data: vehicles
    });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/vehicles/:id - Get vehicle details
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ vehicle_id: req.params.id });
    
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    
    res.json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/vehicles/:id/heartbeat - GPS heartbeat from driver device
router.post('/:id/heartbeat', async (req, res) => {
  try {
    const { lat, lng, heading, speed, timestamp } = req.body;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }
    
    // Find vehicle
    const vehicle = await Vehicle.findOne({ vehicle_id: req.params.id });
    
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    
    // Update vehicle last_ping
    vehicle.last_ping = {
      lat,
      lng,
      heading: heading || 0,
      speed: speed || 0,
      timestamp: timestamp ? new Date(timestamp) : new Date()
    };
    vehicle.status = 'in_service';
    await vehicle.save();
    
    // Save to history
    const historyEntry = new VehicleHistory({
      vehicle_id: vehicle.vehicle_id,
      lat,
      lng,
      heading: heading || 0,
      speed: speed || 0,
      timestamp: timestamp ? new Date(timestamp) : new Date()
    });
    await historyEntry.save();
    
    // Find active operation for this vehicle
    const operation = await Operation.findOne({
      vehicle_id: vehicle.vehicle_id,
      status: 'active'
    });
    
    // Broadcast via WebSocket
    const io = req.app.get('io');
    
    // Broadcast to vehicle channel
    io.to(`vehicle:${vehicle.vehicle_id}`).emit('vehicle_position', {
      vehicle_id: vehicle.vehicle_id,
      lat,
      lng,
      heading: heading || 0,
      speed: speed || 0,
      timestamp: vehicle.last_ping.timestamp
    });
    
    // If vehicle has active operation, broadcast to operation channel
    if (operation) {
      io.to(`operation:${operation.id}`).emit('vehicle_position', {
        operation_id: operation.id,
        vehicle_id: vehicle.vehicle_id,
        lat,
        lng,
        heading: heading || 0,
        speed: speed || 0,
        timestamp: vehicle.last_ping.timestamp
      });
    }
    
    res.json({
      success: true,
      message: 'Heartbeat received',
      data: {
        vehicle_id: vehicle.vehicle_id,
        position: vehicle.last_ping
      }
    });
  } catch (error) {
    console.error('Error processing heartbeat:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/vehicles - Create new vehicle
router.post('/', optionalAuth, async (req, res) => {
  try {
    const vehicleData = {
      vehicle_id: uuidv4(),
      ...req.body
    };
    
    const vehicle = new Vehicle(vehicleData);
    await vehicle.save();
    
    res.status(201).json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    console.error('Error creating vehicle:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/vehicles/:id/history - Get vehicle location history
router.get('/:id/history', optionalAuth, async (req, res) => {
  try {
    const { limit = 100, from, to } = req.query;
    
    let filter = { vehicle_id: req.params.id };
    
    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = new Date(from);
      if (to) filter.timestamp.$lte = new Date(to);
    }
    
    const history = await VehicleHistory.find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error) {
    console.error('Error fetching vehicle history:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
