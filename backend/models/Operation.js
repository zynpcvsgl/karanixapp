const mongoose = require('mongoose');

const operationSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  code: {
    type: String,
    required: true,
    unique: true
  },
  tour_name: {
    type: String,
    required: true
  },
  date: {
    type: String, // YYYY-MM-DD format
    required: true
  },
  start_time: {
    type: String, // HH:MM format
    required: true
  },
  vehicle_id: {
    type: String,
    required: true,
    ref: 'Vehicle'
  },
  driver_id: {
    type: String,
    required: true
  },
  guide_id: {
    type: String,
    required: true
  },
  total_pax: {
    type: Number,
    required: true,
    default: 0
  },
  checked_in_count: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['planned', 'active', 'completed', 'cancelled'],
    default: 'planned'
  },
  // DÜZELTME: Seed.js içindeki yapıya ({ lat, lng }) uygun hale getirildi
  route: [{
    lat: Number,
    lng: Number
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

// Performans İndeksleri
operationSchema.index({ date: 1, status: 1 });
operationSchema.index({ vehicle_id: 1 });
// NOT: 'code' alanı yukarıda unique: true olduğu için buradaki manuel index kaldırıldı.

module.exports = mongoose.model('Operation', operationSchema);