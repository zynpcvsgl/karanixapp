const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true // Gerçekte hashlenmiş (bcrypt) saklanmalı
  },
  name: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['ops_manager', 'guide', 'driver'],
    required: true
  },
  api_token: { // Basit token auth için
    type: String
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);