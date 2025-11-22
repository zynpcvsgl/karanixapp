const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  vehicle_id: {
    type: String,
    required: true,
    unique: true
  },
  plate_number: {
    type: String,
    required: true,
    unique: true
  },
  model: {
    type: String,
    required: true
  },
  capacity: {
    type: Number,
    required: true
  },
  last_ping: {
    lat: {
      type: Number,
      default: null
    },
    lng: {
      type: Number,
      default: null
    },
    heading: {
      type: Number,
      default: 0
    },
    speed: {
      type: Number,
      default: 0
    },
    timestamp: {
      type: Date,
      default: null
    }
  },
  status: {
    type: String,
    enum: ['available', 'in_service', 'maintenance', 'offline'],
    default: 'available'
  },
  driver_id: {
    type: String,
    default: null
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
vehicleSchema.index({ vehicle_id: 1 });
vehicleSchema.index({ status: 1 });

module.exports = mongoose.model('Vehicle', vehicleSchema);
