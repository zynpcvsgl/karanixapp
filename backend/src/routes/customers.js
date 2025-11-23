const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Customer = require('../models/Customer');
const Location = require('../models/Location');
const { optionalAuth } = require('../middleware/auth');

// GET /api/customers - Get all customers
router.get('/', optionalAuth, async (req, res) => {
  try {
    // DÜZELTME: .populate('locations') kaldırıldı.
    // Çünkü locations dizisi UUID stringleri içeriyor, ObjectId değil.
    const customers = await Customer.find();
    
    res.json({
      success: true,
      count: customers.length,
      data: customers
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/customers/:id - Get customer details
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const customer = await Customer.findOne({ customer_id: req.params.id });
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    // Müşterinin lokasyonlarını manuel olarak çekiyoruz (Bu kısım zaten doğruydu)
    const locations = await Location.find({ customer_id: customer.customer_id });
    
    res.json({
      success: true,
      data: {
        ...customer.toObject(),
        locations
      }
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/customers - Create new customer
router.post('/', optionalAuth, async (req, res) => {
  try {
    const customerData = {
      customer_id: uuidv4(),
      ...req.body
    };
    
    const customer = new Customer(customerData);
    await customer.save();
    
    res.status(201).json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/customers/:id - Update customer
router.put('/:id', optionalAuth, async (req, res) => {
  try {
    const customer = await Customer.findOneAndUpdate(
      { customer_id: req.params.id },
      { ...req.body, updated_at: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/customers/:id - Delete customer
router.delete('/:id', optionalAuth, async (req, res) => {
  try {
    const customer = await Customer.findOneAndDelete({ customer_id: req.params.id });
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    // Also delete customer's locations
    await Location.deleteMany({ customer_id: req.params.id });
    
    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;