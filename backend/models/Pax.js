const mongoose = require('mongoose');

const paxSchema = new mongoose.Schema({
  pax_id: { type: String, required: true, unique: true },
  operation_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Operation', required: true },
  name: { type: String, required: true },
  phone: String,
  pickup_point: {
    lat: Number,
    lng: Number,
    address: String
  },
  seat_no: String,
  status: { type: String, enum: ['waiting', 'checked_in', 'no_show'], default: 'waiting' },
  reservation_id: String,
  notes: String,
  checkin_details: {
    method: { type: String, enum: ['qr', 'manual'] },
    gps: {
      lat: Number,
      lng: Number
    },
    photoUrl: String,
    timestamp: Date,
    event_id: String
  },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Pax', paxSchema);