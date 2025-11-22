const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Passenger = require('../models/Passenger');
const Operation = require('../models/Operation');
const EventLog = require('../models/EventLog');
const { optionalAuth } = require('../middleware/auth');

// GET /api/pax - Get all passengers (with optional filters)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { operation_id, status } = req.query;
    
    let filter = {};
    if (operation_id) filter.operation_id = operation_id;
    if (status) filter.status = status;
    
    const passengers = await Passenger.find(filter);
    
    res.json({
      success: true,
      count: passengers.length,
      data: passengers
    });
  } catch (error) {
    console.error('Error fetching passengers:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/pax/:id - Get passenger details
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const passenger = await Passenger.findOne({ pax_id: req.params.id });
    
    if (!passenger) {
      return res.status(404).json({ error: 'Passenger not found' });
    }
    
    res.json({
      success: true,
      data: passenger
    });
  } catch (error) {
    console.error('Error fetching passenger:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/pax/:id/checkin - Check-in passenger
router.post('/:id/checkin', async (req, res) => {
  try {
    const { method, gps, photoUrl, event_id } = req.body;
    
    // Check for idempotency using event_id
    if (event_id) {
      const existingEvent = await EventLog.findOne({ event_id });
      if (existingEvent) {
        return res.status(200).json({
          success: true,
          message: 'Check-in already processed (idempotent)',
          data: existingEvent.data
        });
      }
    }
    
    // Find passenger
    const passenger = await Passenger.findOne({ pax_id: req.params.id });
    
    if (!passenger) {
      return res.status(404).json({ error: 'Passenger not found' });
    }
    
    if (passenger.status === 'checked_in') {
      return res.status(400).json({ error: 'Passenger already checked in' });
    }
    
    // Update passenger status
    passenger.status = 'checked_in';
    passenger.checked_in_at = new Date();
    passenger.checkin_method = method || 'manual';
    
    if (gps) {
      passenger.checkin_gps = gps;
    }
    
    if (photoUrl) {
      passenger.checkin_photo_url = photoUrl;
    }
    
    await passenger.save();
    
    // Update operation checked_in_count
    const operation = await Operation.findOne({ id: passenger.operation_id });
    
    if (operation) {
      operation.checked_in_count += 1;
      await operation.save();
      
      // Create event log
      const eventLogData = {
        event_id: event_id || uuidv4(),
        event_type: 'pax_checkin',
        operation_id: operation.id,
        pax_id: passenger.pax_id,
        message: `Passenger ${passenger.name} checked in`,
        data: {
          passenger_name: passenger.name,
          method: method || 'manual',
          checked_in_count: operation.checked_in_count,
          total_pax: operation.total_pax
        }
      };
      
      const eventLog = new EventLog(eventLogData);
      await eventLog.save();
      
      // Broadcast via WebSocket
      const io = req.app.get('io');
      io.to(`operation:${operation.id}`).emit('pax_checked_in', {
        operation_id: operation.id,
        pax_id: passenger.pax_id,
        passenger_name: passenger.name,
        checked_in_count: operation.checked_in_count,
        total_pax: operation.total_pax,
        timestamp: passenger.checked_in_at
      });
      
      // Check if alert should be triggered
      await checkAndTriggerAlert(operation, io);
    }
    
    res.json({
      success: true,
      message: 'Passenger checked in successfully',
      data: {
        passenger,
        operation: operation ? {
          id: operation.id,
          checked_in_count: operation.checked_in_count,
          total_pax: operation.total_pax
        } : null
      }
    });
  } catch (error) {
    console.error('Error checking in passenger:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/pax - Create new passenger
router.post('/', optionalAuth, async (req, res) => {
  try {
    const passengerData = {
      pax_id: uuidv4(),
      ...req.body
    };
    
    const passenger = new Passenger(passengerData);
    await passenger.save();
    
    // Update operation total_pax count
    if (passenger.operation_id) {
      await Operation.findOneAndUpdate(
        { id: passenger.operation_id },
        { $inc: { total_pax: 1 } }
      );
    }
    
    res.status(201).json({
      success: true,
      data: passenger
    });
  } catch (error) {
    console.error('Error creating passenger:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to check and trigger alert
async function checkAndTriggerAlert(operation, io) {
  try {
    // Parse start time (format: HH:MM)
    const [hours, minutes] = operation.start_time.split(':').map(Number);
    const startDateTime = new Date(operation.date);
    startDateTime.setHours(hours, minutes, 0, 0);
    
    // Add buffer time (15 minutes)
    const alertThresholdMinutes = parseInt(process.env.ALERT_TIME_BUFFER_MINUTES) || 15;
    const alertTime = new Date(startDateTime.getTime() + alertThresholdMinutes * 60000);
    
    const now = new Date();
    
    // Check if we're past alert time
    if (now >= alertTime) {
      const checkInRatio = operation.checked_in_count / operation.total_pax;
      const threshold = parseFloat(process.env.ALERT_CHECK_IN_THRESHOLD) || 0.7;
      
      if (checkInRatio < threshold) {
        // Create alert event
        const alertEvent = new EventLog({
          event_id: uuidv4(),
          event_type: 'alert',
          operation_id: operation.id,
          message: `Low check-in rate alert for operation ${operation.code}`,
          data: {
            checked_in_count: operation.checked_in_count,
            total_pax: operation.total_pax,
            check_in_ratio: checkInRatio,
            threshold: threshold,
            alert_time: alertTime
          }
        });
        await alertEvent.save();
        
        // Broadcast alert
        io.to(`operation:${operation.id}`).emit('check_in_alert', {
          operation_id: operation.id,
          code: operation.code,
          checked_in_count: operation.checked_in_count,
          total_pax: operation.total_pax,
          check_in_ratio: checkInRatio,
          message: `Only ${Math.round(checkInRatio * 100)}% passengers checked in`,
          timestamp: new Date()
        });
      }
    }
  } catch (error) {
    console.error('Error checking alert conditions:', error);
  }
}

module.exports = router;
