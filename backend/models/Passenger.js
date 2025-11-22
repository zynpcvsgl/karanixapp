const mongoose = require('mongoose');

const passengerSchema = new mongoose.Schema({
  pax_id: {
    type: String,
    required: true,
    unique: true
  },
  operation_id: {
    type: String, // veya mongoose.Schema.Types.ObjectId
    required: true,
    ref: 'Operation'
  },
  // Opsiyonel: Merkezi lokasyon yönetimi için referans
  location_id: {
    type: String,
    ref: 'Location',
    default: null
  },
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  pickup_point: {
    lat: {
      type: Number,
      required: true
    },
    lng: {
      type: Number,
      required: true
    },
    address: {
      type: String,
      required: true
    }
  },
  seat_no: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['waiting', 'checked_in', 'no_show'],
    default: 'waiting'
  },
  reservation_id: {
    type: String,
    required: true
  },
  notes: {
    type: String,
    default: ''
  },
  checked_in_at: {
    type: Date,
    default: null
  },
  checkin_method: {
    type: String,
    enum: ['qr', 'manual', null],
    default: null
  },
  checkin_gps: {
    lat: Number,
    lng: Number
  },
  checkin_photo_url: {
    type: String,
    default: null
  },
  // --- EKLENEN KRİTİK ALAN ---
  // PDF Gereksinimi: Çevrimdışı senkronizasyon ve Idempotency için
  last_checkin_event_id: {
    type: String,
    default: null,
    description: "Çift check-in'i önlemek için kullanılan benzersiz olay ID'si (UUID)"
  },
  // ---------------------------
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
passengerSchema.index({ operation_id: 1 });
passengerSchema.index({ pax_id: 1 });
passengerSchema.index({ status: 1 });
// Idempotency kontrolü için index eklemek performansı artırır
passengerSchema.index({ last_checkin_event_id: 1 }); 

module.exports = mongoose.model('Passenger', passengerSchema);