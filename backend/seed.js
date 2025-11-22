const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Modelleri import et
const Operation = require('./models/Operation');
const Passenger = require('./models/Passenger');
const Vehicle = require('./models/Vehicle');
const User = require('./models/User'); // YENİ: User modelini ekledik
const Location = require('./models/Location'); // Eğer varsa

// MongoDB Bağlantısı
const MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/karanix_demo';

mongoose.connect(MONGO_URL)
  .then(async () => {
    console.log("🌱 Seeding process started...");

    // 1. Önceki verileri temizle
    console.log("🧹 Cleaning DB...");
    await Operation.deleteMany({});
    await Passenger.deleteMany({});
    await Vehicle.deleteMany({});
    await User.deleteMany({});
    if (mongoose.models.Location) await Location.deleteMany({});

    // 2. KULLANICILARI OLUŞTUR (Login olabilmek için)
    console.log("👤 Creating Users...");
    const users = await User.insertMany([
      {
        user_id: uuidv4(),
        username: 'admin',
        password: '123', // Demo için basit şifre
        name: 'Operasyon Müdürü',
        role: 'ops_manager'
      },
      {
        user_id: uuidv4(),
        username: 'guide1',
        password: '123',
        name: 'Ahmet Rehber',
        role: 'guide'
      },
      {
        user_id: uuidv4(),
        username: 'driver1',
        password: '123',
        name: 'Mehmet Şoför',
        role: 'driver'
      }
    ]);
    
    const driverUser = users.find(u => u.role === 'driver');
    const guideUser = users.find(u => u.role === 'guide');

    // 3. ARAÇ OLUŞTUR
    console.log("bus Creating Vehicle...");
    const vehicle1 = await Vehicle.create({
      vehicle_id: uuidv4(),
      plate_number: "34 KRN 99",
      model: "Mercedes Sprinter",
      capacity: 16,
      driver_id: driverUser.user_id, // Şoför kullanıcısını atadık
      status: "available",
      last_ping: {
        lat: 38.4237,
        lng: 27.1428, // İzmir Konak
        heading: 90,
        speed: 0,
        timestamp: new Date()
      }
    });

    // 4. OPERASYON OLUŞTUR
    console.log("📋 Creating Operations...");
    // Yarın için tarih
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    const op1 = await Operation.create({
      id: uuidv4(),
      code: "OPS-TEST-001",
      tour_name: "İzmir Şehir Turu (Demo)",
      date: dateStr,
      start_time: "09:30",
      vehicle_id: vehicle1.vehicle_id,
      driver_id: driverUser.user_id,
      guide_id: guideUser.user_id,
      total_pax: 3,
      checked_in_count: 0,
      status: "planned",
      route: [
        { lat: 38.4192, lng: 27.1287 }, // Saat Kulesi
        { lat: 38.4321, lng: 27.1400 }, // Kordon
        { lat: 38.4450, lng: 27.1520 }  // Alsancak
      ]
    });

    // 5. YOLCU (PAX) OLUŞTUR
    console.log("ticket Creating Passengers...");
    await Passenger.insertMany([
      {
        pax_id: uuidv4(),
        operation_id: op1.id,
        name: "Ali Yılmaz",
        phone: "+90 555 111 2233",
        pickup_point: { lat: 38.4330, lng: 27.1410, address: "Swissotel Büyük Efes" },
        seat_no: "1A",
        status: "waiting",
        reservation_id: "RES-001"
      },
      {
        pax_id: uuidv4(),
        operation_id: op1.id,
        name: "Ayşe Demir",
        phone: "+90 555 444 5566",
        pickup_point: { lat: 38.4340, lng: 27.1415, address: "Mövenpick Hotel" },
        seat_no: "1B",
        status: "waiting",
        reservation_id: "RES-002"
      },
      {
        pax_id: uuidv4(),
        operation_id: op1.id,
        name: "John Smith",
        phone: "+1 555 0199",
        pickup_point: { lat: 38.4200, lng: 27.1300, address: "Anemon Otel" },
        seat_no: "2A",
        status: "waiting",
        reservation_id: "RES-003"
      }
    ]);

    console.log("✅ Seed Completed Successfully!");
    console.log("🔑 Test Users created:");
    console.log("   👉 Admin:  admin / 123");
    console.log("   👉 Guide:  guide1 / 123");
    console.log("   👉 Driver: driver1 / 123");

    process.exit(0);
  })
  .catch(err => {
    console.error("❌ Seed Error:", err);
    process.exit(1);
  });