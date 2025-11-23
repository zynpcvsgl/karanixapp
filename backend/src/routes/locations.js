const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Location = require('../src/models/Location');
const Customer = require('../src/models/Customer');
const { optionalAuth } = require('../middleware/auth');

// GET /api/locations - Get all locations
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { customer_id } = req.query;
    
    let filter = {};
    if (customer_id) {
      filter.customer_id = customer_id;
    }
    
    const locations = await Location.find(filter);
    
    res.json({
      success: true,
      count: locations.length,
      data: locations
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/locations/:id - Get location details
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const location = await Location.findOne({ location_id: req.params.id });
    
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }
    
    res.json({
      success: true,
      data: location
    });
  } catch (error) {
    console.error('Error fetching location:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/locations - Create new location
router.post('/', optionalAuth, async (req, res) => {
  try {
    const locationData = {
      location_id: uuidv4(),
      ...req.body
    };
    
    const location = new Location(locationData);
    await location.save();
    
    // Add location to customer's locations array
    if (location.customer_id) {
      await Customer.findOneAndUpdate(
        { customer_id: location.customer_id },
        { $addToSet: { locations: location.location_id } }
      );
    }
    
    res.status(201).json({
      success: true,
      data: location
    });
  } catch (error) {
    console.error('Error creating location:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/locations/:id - Update location
router.put('/:id', optionalAuth, async (req, res) => {
  try {
    const location = await Location.findOneAndUpdate(
      { location_id: req.params.id },
      { ...req.body, updated_at: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }
    
    res.json({
      success: true,
      data: location
    });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/locations/:id - Delete location
router.delete('/:id', optionalAuth, async (req, res) => {
  try {
    const location = await Location.findOneAndDelete({ location_id: req.params.id });
    
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }
    
    // Remove location from customer's array
    if (location.customer_id) {
      await Customer.findOneAndUpdate(
        { customer_id: location.customer_id },
        { $pull: { locations: location.location_id } }
      );
    }
    
    res.json({
      success: true,
      message: 'Location deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting location:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
