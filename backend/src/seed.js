require('dotenv').config();
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const Customer = require('./models/Customer');
const Location = require('./models/Location');
const Vehicle = require('./models/Vehicle');
const Operation = require('./models/Operation');
const Passenger = require('./models/Passenger');
const User = require('./models/User');

const MONGODB_URI = process.env.MONGO_URL 
  ? `${process.env.MONGO_URL}/${process.env.DB_NAME || 'karanix_demo'}`
  : 'mongodb://localhost:27017/karanix_demo';

const istanbulLocations = [
  { name: 'Sultanahmet', lat: 41.0082, lng: 28.9784, address: 'Sultanahmet Meydanı, Fatih' },
  { name: 'Taksim', lat: 41.0369, lng: 28.9850, address: 'Taksim Meydanı, Beyoğlu' },
  { name: 'Galata Kulesi', lat: 41.0256, lng: 28.9744, address: 'Galata Kulesi, Beyoğlu' },
  { name: 'Kapalıçarşı', lat: 41.0106, lng: 28.9680, address: 'Kapalıçarşı, Fatih' },
  { name: 'Ortaköy', lat: 41.0553, lng: 29.0266, address: 'Ortaköy Meydanı, Beşiktaş' },
  { name: 'Dolmabahçe Sarayı', lat: 41.0391, lng: 29.0003, address: 'Dolmabahçe Cd., Beşiktaş' },
  { name: 'Topkapı Sarayı', lat: 41.0115, lng: 28.9833, address: 'Topkapı Sarayı, Fatih' },
  { name: 'Mısır Çarşısı', lat: 41.0166, lng: 28.9706, address: 'Mısır Çarşısı, Eminönü' }
];

const turkishNames = [
  'Ahmet Yılmaz', 'Mehmet Kaya', 'Ayşe Demir', 'Fatma Şahin', 'Mustafa Çelik',
  'Emine Yıldız', 'Ali Aydın', 'Zeynep Öztürk', 'Hüseyin Arslan', 'Hatice Doğan',
  'İbrahim Kılıç', 'Elif Aslan', 'Hasan Çetin', 'Meryem Kara', 'Süleyman Koç',
  'Rabia Şen', 'Osman Kurt', 'Rukiye Özdemir', 'Yusuf Özkan', 'Şule Güneş'
];

function getDateString(daysOffset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split('T')[0];
}

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB bağlantısı başarılı');

    console.log('🗑️  Mevcut veriler temizleniyor...');
    await Promise.all([
      Customer.deleteMany({}),
      Location.deleteMany({}),
      Vehicle.deleteMany({}),
      Operation.deleteMany({}),
      Passenger.deleteMany({}),
      User.deleteMany({})
    ]);
    console.log('✅ Veriler temizlendi');

    console.log('👤 Kullanıcılar oluşturuluyor...');
    const users = await User.create([
      {
        user_id: 'user-001',
        username: 'admin',
        password: 'admin123',
        name: 'Sistem Yöneticisi',
        role: 'ops_manager'
      },
      {
        user_id: 'user-002',
        username: 'guide1',
        password: 'guide123',
        name: 'Mehmet Rehber',
        role: 'guide'
      },
      {
        user_id: 'user-003',
        username: 'driver1',
        password: 'driver123',
        name: 'Ali Sürücü',
        role: 'driver'
      }
    ]);
    console.log(`✅ ${users.length} kullanıcı oluşturuldu`);

    console.log('🏢 Müşteriler oluşturuluyor...');
    const customers = await Customer.create([
      {
        customer_id: uuidv4(),
        name: 'Grand Turizm Ltd. Şti.',
        email: 'iletisim@grandtours.com',
        phone: '+90 212 555 0101',
        company: 'Grand Turizm'
      },
      {
        customer_id: uuidv4(),
        name: 'İstanbul Maceraları A.Ş.',
        email: 'bilgi@istanbuladventures.com',
        phone: '+90 212 555 0102',
        company: 'İstanbul Maceraları'
      }
    ]);
    console.log(`✅ ${customers.length} müşteri oluşturuldu`);

    console.log('📍 Lokasyonlar oluşturuluyor...');
    const locations = [];
    for (let i = 0; i < istanbulLocations.length; i++) {
      const loc = istanbulLocations[i];
      const location = await Location.create({
        location_id: uuidv4(),
        name: loc.name,
        address: loc.address,
        lat: loc.lat,
        lng: loc.lng,
        customer_id: customers[i % customers.length].customer_id
      });
      locations.push(location);
      
      await Customer.findOneAndUpdate(
        { customer_id: customers[i % customers.length].customer_id },
        { $push: { locations: location.location_id } }
      );
    }
    console.log(`✅ ${locations.length} lokasyon oluşturuldu`);

    console.log('🚗 Araçlar oluşturuluyor...');
    const vehicles = await Vehicle.create([
      {
        vehicle_id: uuidv4(),
        plate_number: '34 ABC 123',
        model: 'Mercedes Sprinter',
        capacity: 20,
        status: 'in_service',
        driver_id: 'user-003',
        last_ping: {
          lat: 41.0082,
          lng: 28.9784,
          heading: 90,
          speed: 0,
          timestamp: new Date()
        }
      },
      {
        vehicle_id: uuidv4(),
        plate_number: '34 DEF 456',
        model: 'Iveco Daily',
        capacity: 18,
        status: 'available'
      },
      {
        vehicle_id: uuidv4(),
        plate_number: '34 GHI 789',
        model: 'Ford Transit',
        capacity: 16,
        status: 'maintenance'
      }
    ]);
    console.log(`✅ ${vehicles.length} araç oluşturuldu`);

    console.log('📋 Operasyonlar oluşturuluyor...');
    const today = getDateString(0);
    const tomorrow = getDateString(1);
    
    const operations = await Operation.create([
      {
        id: uuidv4(),
        code: `OPS-${Date.now()}-1`,
        tour_name: 'Boğaz ve Saraylar Turu',
        date: today,
        start_time: '10:00',
        vehicle_id: vehicles[0].vehicle_id,
        driver_id: 'user-003',
        guide_id: 'user-002',
        total_pax: 15,
        checked_in_count: 3,
        status: 'active',
        route: [
          { lat: 41.0369, lng: 28.9850 },
          { lat: 41.0391, lng: 29.0003 },
          { lat: 41.0553, lng: 29.0266 }
        ]
      },
      {
        id: uuidv4(),
        code: `OPS-${Date.now()}-2`,
        tour_name: 'Tarihi Yarımada Yürüyüş Turu',
        date: today,
        start_time: '14:00',
        vehicle_id: vehicles[1].vehicle_id,
        driver_id: 'user-003',
        guide_id: 'user-002',
        total_pax: 12,
        checked_in_count: 0,
        status: 'planned',
        route: [
          { lat: 41.0082, lng: 28.9784 },
          { lat: 41.0256, lng: 28.9744 },
          { lat: 41.0166, lng: 28.9706 }
        ]
      },
      {
        id: uuidv4(),
        code: `OPS-${Date.now()}-3`,
        tour_name: 'Anadolu Yakası Keşfi',
        date: tomorrow,
        start_time: '09:30',
        vehicle_id: vehicles[1].vehicle_id,
        driver_id: 'user-003',
        guide_id: 'user-002',
        total_pax: 10,
        checked_in_count: 0,
        status: 'planned',
        route: []
      }
    ]);
    console.log(`✅ ${operations.length} operasyon oluşturuldu`);

    console.log('👥 Yolcular oluşturuluyor...');
    let totalPax = 0;
    
    for (const operation of operations) {
      const passengers = [];
      const numPax = operation.total_pax;
      
      for (let i = 0; i < numPax; i++) {
        const location = locations[i % locations.length];
        const isCheckedIn = operation.status === 'active' && i < operation.checked_in_count;
        
        passengers.push({
          pax_id: uuidv4(),
          operation_id: operation.id,
          name: turkishNames[i % turkishNames.length],
          phone: `+90 5${Math.floor(Math.random() * 100000000).toString().padStart(9, '0')}`,
          pickup_point: {
            lat: location.lat,
            lng: location.lng,
            address: location.address
          },
          seat_no: `${String.fromCharCode(65 + Math.floor(i / 4))}${(i % 4) + 1}`,
          status: isCheckedIn ? 'checked_in' : 'waiting',
          reservation_id: `REZ-${uuidv4().substring(0, 8).toUpperCase()}`,
          notes: i % 5 === 0 ? 'Vejetaryen yemek talebi' : '',
          ...(isCheckedIn && {
            checked_in_at: new Date(),
            checkin_method: 'manual',
            last_checkin_event_id: uuidv4()
          })
        });
      }
      
      await Passenger.create(passengers);
      totalPax += passengers.length;
    }
    console.log(`✅ ${totalPax} yolcu oluşturuldu`);

    console.log('\n🎉 Seed işlemi tamamlandı!\n');
    console.log('📊 Özet:');
    console.log(`   - Kullanıcılar: ${users.length}`);
    console.log(`   - Müşteriler: ${customers.length}`);
    console.log(`   - Lokasyonlar: ${locations.length}`);
    console.log(`   - Araçlar: ${vehicles.length}`);
    console.log(`   - Operasyonlar: ${operations.length}`);
    console.log(`   - Yolcular: ${totalPax}`);
    console.log('\n🔑 Demo Kullanıcılar:');
    console.log('   - Admin: admin / admin123');
    console.log('   - Rehber: guide1 / guide123');
    console.log('   - Sürücü: driver1 / driver123');
    console.log('\n');

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Seed hatası:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seed();