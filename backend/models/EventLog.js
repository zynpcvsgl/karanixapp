const mongoose = require('mongoose');

const eventLogSchema = new mongoose.Schema({
  event_id: {
    type: String,
    required: true,
    unique: true
  },
  event_type: {
    type: String,
    required: true,
    enum: ['operation_start', 'operation_complete', 'pax_checkin', 'alert', 'vehicle_heartbeat']
  },
  operation_id: {
    type: String,
    ref: 'Operation'
  },
  vehicle_id: {
    type: String,
    ref: 'Vehicle'
  },
  pax_id: {
    type: String,
    ref: 'Passenger'
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  message: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false
});

// Indexes
eventLogSchema.index({ event_id: 1 });
eventLogSchema.index({ operation_id: 1, timestamp: -1 });
eventLogSchema.index({ event_type: 1 });

module.exports = mongoose.model('EventLog', eventLogSchema);
