const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateToken } = require('../middleware/auth'); 

// POST /api/auth/login - Giriş Yapma
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Kullanıcıyı bul
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Geçersiz kullanıcı adı veya şifre' });
    }

    // Şifre kontrolü (Demo için düz metin, prod'da bcrypt kullanın)
    if (user.password !== password) {
      return res.status(401).json({ error: 'Geçersiz kullanıcı adı veya şifre' });
    }

    // Token oluştur
    const token = generateToken({ 
      id: user._id, 
      user_id: user.user_id, 
      role: user.role,
      name: user.name 
    });

    res.json({ 
      success: true,
      token, 
      user: { 
        user_id: user.user_id, 
        name: user.name, 
        role: user.role 
      } 
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// POST /api/auth/register - Yeni Kullanıcı (Test amaçlı)
router.post('/register', async (req, res) => {
  try {
    // Basit validasyon
    if (!req.body.username || !req.body.password || !req.body.role) {
        return res.status(400).json({ error: "Username, password ve role zorunludur." });
    }

    const user = new User(req.body);
    await user.save();
    
    // Token da dönelim ki hemen giriş yapabilsin
    const token = generateToken({ 
        id: user._id, 
        user_id: user.user_id, 
        role: user.role,
        name: user.name 
    });

    res.status(201).json({ 
        success: true, 
        message: 'Kullanıcı oluşturuldu', 
        token,
        user 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;