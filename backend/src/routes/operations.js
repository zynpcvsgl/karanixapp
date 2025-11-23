const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Operation = require('../models/Operation');
const Passenger = require('../models/Passenger');
const Vehicle = require('../models/Vehicle');
const EventLog = require('../models/EventLog');
const { optionalAuth } = require('../middleware/auth');

// GET /api/operations?date=YYYY-MM-DD&status=active|planned
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { date, status } = req.query;
    
    let filter = {};
    if (date) filter.date = date;
    if (status) filter.status = status;
    
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

// GET /api/operations/:id
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const operation = await Operation.findOne({ id: req.params.id });
    
    if (!operation) {
      return res.status(404).json({ error: 'Operation not found' });
    }
    
    const passengers = await Passenger.find({ operation_id: operation.id });
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

// POST /api/operations/:id/start
router.post('/:id/start', optionalAuth, async (req, res) => {
  try {
    const operation = await Operation.findOne({ id: req.params.id });
    
    if (!operation) {
      return res.status(404).json({ error: 'Operation not found' });
    }
    
    if (operation.status === 'active') {
      return res.status(400).json({ error: 'Operation already started' });
    }
    
    operation.status = 'active';
    operation.updated_at = new Date();
    await operation.save();
    
    const eventLog = new EventLog({
      event_id: uuidv4(),
      event_type: 'operation_start',
      operation_id: operation.id,
      vehicle_id: operation.vehicle_id,
      message: `Operation ${operation.code} started`,
      data: { tour_name: operation.tour_name }
    });
    await eventLog.save();
    
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

// POST /api/operations - Create new operation (ARAÇ SEÇİMİ EKLENDİ)
router.post('/', optionalAuth, async (req, res) => {
  try {
    // vehicle_id parametresini de alıyoruz
    const { tour_name, date, start_time, total_pax, vehicle_id } = req.body;

    const newOperation = await Operation.create({
      id: uuidv4(),
      code: `OPS-${Date.now().toString().slice(-6)}`,
      tour_name,
      date,
      start_time,
      total_pax: parseInt(total_pax) || 10,
      vehicle_id: vehicle_id || null, // Araç seçildiyse kaydet
      checked_in_count: 0,
      status: 'planned',
      route: []
    });
    
    res.status(201).json({
      success: true,
      data: newOperation
    });
  } catch (error) {
    console.error('Error creating operation:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;