const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  location_id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  lat: {
    type: Number,
    required: true
  },
  lng: {
    type: Number,
    required: true
  },
  customer_id: {
    type: String,
    required: true,
    ref: 'Customer'
  },
  notes: {
    type: String,
    default: ''
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes
locationSchema.index({ location_id: 1 });
locationSchema.index({ customer_id: 1 });

module.exports = mongoose.model('Location', locationSchema);
