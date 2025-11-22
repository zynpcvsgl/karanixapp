const mongoose = require('mongoose');

const vehicleHistorySchema = new mongoose.Schema({
  vehicle_id: {
    type: String,
    required: true,
    ref: 'Vehicle'
  },
  lat: {
    type: Number,
    required: true
  },
  lng: {
    type: Number,
    required: true
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
    default: Date.now
  }
}, {
  timestamps: false
});

// Indexes for querying history
vehicleHistorySchema.index({ vehicle_id: 1, timestamp: -1 });

// TTL index to auto-delete old records after 7 days
vehicleHistorySchema.index({ timestamp: 1 }, { expireAfterSeconds: 604800 });

module.exports = mongoose.model('VehicleHistory', vehicleHistorySchema);
