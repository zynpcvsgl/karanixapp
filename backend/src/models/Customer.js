const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  customer_id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  company: {
    type: String,
    default: ''
  },
  locations: [{
    type: String,
    ref: 'Location'
  }],
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
customerSchema.index({ customer_id: 1 });
customerSchema.index({ email: 1 });

module.exports = mongoose.model('Customer', customerSchema);
