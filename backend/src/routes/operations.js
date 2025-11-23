const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Operation = require('../src/models/Operation');
const Passenger = require('../src/models/Passenger');
const Vehicle = require('../src/models/Vehicle');
const EventLog = require('../src/models/EventLog');
const { optionalAuth } = require('../middleware/auth');

// GET /api/operations?date=YYYY-MM-DD&status=active|planned
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { date, status } = req.query;
    
    let filter = {};
    
    if (date) {
      filter.date = date;
    }
    
    if (status) {
      filter.status = status;
    }
    
    const operations = await Operation.find(filter)
      .sort({ date: 1, start_time: 1 });
    
    res.json({
      success: true,
      count: operations.length,
      data: operations
    });
  } catch (error) {
    console.error('Error fetching operations:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/operations/:id - Get operation detail with passengers
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const operation = await Operation.findOne({ id: req.params.id });
    
    if (!operation) {
      return res.status(404).json({ error: 'Operation not found' });
    }
    
    // Get passengers for this operation
    const passengers = await Passenger.find({ operation_id: operation.id });
    
    // Get vehicle info
    const vehicle = await Vehicle.findOne({ vehicle_id: operation.vehicle_id });
    
    res.json({
      success: true,
      data: {
        ...operation.toObject(),
        passengers,
        vehicle
      }
    });
  } catch (error) {
    console.error('Error fetching operation:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/operations/:id/start - Start an operation
router.post('/:id/start', optionalAuth, async (req, res) => {
  try {
    const operation = await Operation.findOne({ id: req.params.id });
    
    if (!operation) {
      return res.status(404).json({ error: 'Operation not found' });
    }
    
    if (operation.status === 'active') {
      return res.status(400).json({ error: 'Operation already started' });
    }
    
    // Update operation status
    operation.status = 'active';
    operation.updated_at = new Date();
    await operation.save();
    
    // Create event log
    const eventLog = new EventLog({
      event_id: uuidv4(),
      event_type: 'operation_start',
      operation_id: operation.id,
      vehicle_id: operation.vehicle_id,
      message: `Operation ${operation.code} started`,
      data: { tour_name: operation.tour_name }
    });
    await eventLog.save();
    
    // Broadcast via WebSocket
    const io = req.app.get('io');
    io.to(`operation:${operation.id}`).emit('operation_started', {
      operation_id: operation.id,
      code: operation.code,
      status: 'active',
      timestamp: new Date()
    });
    
    res.json({
      success: true,
      message: 'Operation started',
      data: operation
    });
  } catch (error) {
    console.error('Error starting operation:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/operations - Create new operation
router.post('/', optionalAuth, async (req, res) => {
  try {
    const operationData = {
      id: uuidv4(),
      ...req.body
    };
    
    const operation = new Operation(operationData);
    await operation.save();
    
    res.status(201).json({
      success: true,
      data: operation
    });
  } catch (error) {
    console.error('Error creating operation:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
