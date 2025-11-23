const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Pax = require('../models/Pax');
const Operation = require('../models/Operation');
const { broadcastToOperation } = require('../services/websocket');

router.get('/', async (req, res) => {
  try {
    const { operation_id } = req.query;
    const query = operation_id ? { operation_id } : {};
    
    const passengers = await Pax.find(query);
    res.json({ success: true, data: passengers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/checkin', async (req, res) => {
  try {
    const { method, gps, photoUrl } = req.body;
    const eventId = uuidv4();

    const existingCheckin = await Pax.findOne({
      _id: req.params.id,
      'checkin_details.event_id': eventId
    });

    if (existingCheckin) {
      return res.json({ 
        success: true, 
        message: 'Already checked in',
        data: existingCheckin 
      });
    }

    const pax = await Pax.findByIdAndUpdate(
      req.params.id,
      {
        status: 'checked_in',
        checkin_details: {
          method,
          gps,
          photoUrl,
          timestamp: new Date(),
          event_id: eventId
        }
      },
      { new: true }
    );

    if (!pax) {
      return res.status(404).json({ error: 'Passenger not found' });
    }

    const operation = await Operation.findByIdAndUpdate(
      pax.operation_id,
      { $inc: { checked_in_count: 1 } },
      { new: true }
    );

    broadcastToOperation(pax.operation_id.toString(), {
      type: 'checkin_update',
      data: {
        operationId: pax.operation_id.toString(),
        paxId: pax._id.toString(),
        paxName: pax.name,
        checked_in_count: operation.checked_in_count,
        total_pax: operation.total_pax,
        timestamp: new Date()
      }
    });

    res.json({ success: true, data: pax });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;