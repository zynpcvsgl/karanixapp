require('dotenv').config();
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const Customer = require('./models/Customer');
const Location = require('./models/Location');
const Vehicle = require('./models/Vehicle');
const Operation = require('./models/Operation');
const Passenger = require('./models/Passenger');
const User = require('./models/User');

// --- GÜVENLİ MONGODB BAĞLANTI AYARI ---
let MONGODB_URI = process.env.MONGO_URL || 'mongodb+srv://zeynep:zeynep123@karanix.rwiuhri.mongodb.net/karanix?appName=karanix';
const DB_NAME = process.env.DB_NAME || 'karanix';

// Veritabanı adı URL'de yoksa ekle
if (!MONGODB_URI.includes(DB_NAME)) {
  if (MONGODB_URI.includes('?')) {
    // Query parametreleri varsa, ondan önce ekle
    MONGODB_URI = MONGODB_URI.replace(/\/?\?/, `/${DB_NAME}?`);
  } else {
    // Yoksa sona ekle
    MONGODB_URI = MONGODB_URI.endsWith('/') ? `${MONGODB_URI}${DB_NAME}` : `${MONGODB_URI}/${DB_NAME}`;
  }
}
// Çift slash (//) temizliği (.net//karanix gibi hataları önler)
MONGODB_URI = MONGODB_URI.replace(/([^:])\/\//g, '$1/');
// --------------------------------------

const istanbulLocations = [
  { name: 'Sultanahmet', lat: 41.0082, lng: 28.9784, address: 'Sultanahmet Meydanı, Fatih' },
  { name: 'Taksim', lat: 41.0369, lng: 28.9850, address: 'Taksim Meydanı, Beyoğlu' },
  { name: 'Galata Kulesi', lat: 41.0256, lng: 28.9744, address: 'Galata Kulesi, Beyoğlu' },
  { name: 'Kapalıçarşı', lat: 41.0106, lng: 28.9680, address: 'Kapalıçarşı, Fatih' },
  { name: 'Ortaköy', lat: 41.0553, lng: 29.0266, address: 'Ortaköy Meydanı, Beşiktaş' },
  { name: 'Dolmabahçe Sarayı', lat: 41.0391, lng: 29.0003, address: 'Dolmabahçe Cd., Beşiktaş' },
  { name: 'Topkapı Sarayı', lat: 41.0115, lng: 28.9833, address: 'Topkapı Sarayı, Fatih' },
  { name: 'Mısır Çarşısı', lat: 41.0166, lng: 28.9706, address: 'Mısır Çarşısı, Eminönü' },
  { name: 'Pierre Loti', lat: 41.0544, lng: 28.9343, address: 'Eyüpsultan, İstanbul' },
  { name: 'Kız Kulesi', lat: 41.0211, lng: 29.0041, address: 'Üsküdar, İstanbul' },
  { name: 'Hagia Sophia', lat: 41.0086, lng: 28.9802, address: 'Ayasofya Meydanı, Fatih' },
  { name: 'Bebek Sahil', lat: 41.0760, lng: 29.0430, address: 'Bebek, Beşiktaş' }
];

// GENİŞLETİLMİŞ İSİM LİSTESİ (50+ İsim)
const turkishNames = [
  'Ahmet Yılmaz', 'Mehmet Kaya', 'Ayşe Demir', 'Fatma Şahin', 'Mustafa Çelik',
  'Emine Yıldız', 'Ali Aydın', 'Zeynep Öztürk', 'Hüseyin Arslan', 'Hatice Doğan',
  'İbrahim Kılıç', 'Elif Aslan', 'Hasan Çetin', 'Meryem Kara', 'Süleyman Koç',
  'Rabia Şen', 'Osman Kurt', 'Rukiye Özdemir', 'Yusuf Özkan', 'Şule Güneş',
  'Burak Yılmaz', 'Ceren Yılmaz', 'Deniz Kaya', 'Eren Demir', 'Gizem Şahin',
  'Selin Aksoy', 'Murat Polat', 'Gamze Koçak', 'Onur Çevik', 'Buse Aras',
  'Berkant Yılmaz', 'Cansu Demir', 'Doruk Şahin', 'Ece Çelik', 'Furkan Yıldız',
  'Gözde Aydın', 'Hakan Öztürk', 'Işıl Arslan', 'Kaan Doğan', 'Lara Kılıç',
  'Mert Aslan', 'Nazlı Çetin', 'Ozan Kara', 'Pelin Koç', 'Rüzgar Şen',
  'Sarp Kurt', 'Tuana Özdemir', 'Umut Özkan', 'Yağmur Güneş', 'Zafer Yılmaz',
  'Kemal Sunal', 'Adile Naşit', 'Münir Özkul', 'Tarık Akan', 'Halit Akçatepe',
  'Zeki Alasya', 'Metin Akpınar', 'Filiz Akın', 'Türkan Şoray', 'Hülya Koçyiğit'
];

const tourNames = [
  'Boğaz ve Saraylar Turu',
  'Tarihi Yarımada Yürüyüş Turu',
  'Anadolu Yakası Keşfi',
  'Haliç ve Pierre Loti Turu',
  'Prens Adaları Tekne Turu',
  'Bursa Uludağ Günübirlik',
  'Kapadokya Balon Turu',
  'Ayasofya ve Sultanahmet',
  'Mısır Çarşısı ve Galata',
  'Dolmabahçe ve Ortaköy',
  'İstanbul Gece Turu',
  'Lezzet Durakları Gurme Turu',
  'Polonezköy Doğa Yürüyüşü',
  'Şile & Ağva Kaçamağı'
];

// BAŞLANGIÇ TARİHİ: 24 Kasım 2025
function getDateString(daysOffset = 0) {
  const baseDate = new Date('2025-11-24'); 
  baseDate.setDate(baseDate.getDate() + daysOffset);
  return baseDate.toISOString().split('T')[0];
}

async function seed() {
  try {
    console.log('🔌 MongoDB\'ye bağlanılıyor:', MONGODB_URI.replace(/:([^:@]{1,})@/, ':****@'));
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

    // 1. KULLANICILAR
    console.log('👤 Kullanıcılar oluşturuluyor...');
    const users = await User.create([
      { user_id: 'user-001', username: 'admin', password: 'admin123', name: 'Sistem Yöneticisi', role: 'ops_manager' },
      { user_id: 'user-002', username: 'guide1', password: 'guide123', name: 'Mehmet Rehber', role: 'guide' },
      { user_id: 'user-003', username: 'driver1', password: 'driver123', name: 'Ali Sürücü', role: 'driver' }
    ]);
    console.log(`✅ ${users.length} kullanıcı oluşturuldu`);

    // 2. MÜŞTERİLER
    console.log('🏢 Müşteriler oluşturuluyor...');
    const customers = await Customer.create([
      { customer_id: uuidv4(), name: 'Grand Turizm Ltd. Şti.', email: 'iletisim@grandtours.com', phone: '+90 212 555 0101', company: 'Grand Turizm' },
      { customer_id: uuidv4(), name: 'İstanbul Maceraları A.Ş.', email: 'bilgi@istanbuladventures.com', phone: '+90 212 555 0102', company: 'İstanbul Maceraları' },
      { customer_id: uuidv4(), name: 'Anadolu Turizm Seyahat', email: 'info@anadoluturizm.com', phone: '+90 212 555 0103', company: 'Anadolu Turizm' },
      { customer_id: uuidv4(), name: 'Boğaziçi VIP Transfer', email: 'contact@bogazicivip.com', phone: '+90 212 555 0104', company: 'Boğaziçi VIP' },
      { customer_id: uuidv4(), name: 'Kapadokya Balon Tur', email: 'rezervasyon@kapadokyatur.com', phone: '+90 384 555 0105', company: 'Kapadokya Tur' }
    ]);
    console.log(`✅ ${customers.length} müşteri oluşturuldu`);

    // 3. LOKASYONLAR
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

    // 4. ARAÇLAR
    console.log('🚗 Araçlar oluşturuluyor...');
    const vehicles = await Vehicle.create([
      { vehicle_id: uuidv4(), plate_number: '34 ABC 123', model: 'Mercedes Sprinter', capacity: 19, status: 'in_service', driver_id: 'user-003', last_ping: { lat: 41.0082, lng: 28.9784, heading: 90, speed: 25, timestamp: new Date() } },
      { vehicle_id: uuidv4(), plate_number: '34 DEF 456', model: 'Iveco Daily', capacity: 18, status: 'available' },
      { vehicle_id: uuidv4(), plate_number: '34 GHI 789', model: 'Ford Transit', capacity: 16, status: 'maintenance' },
      { vehicle_id: uuidv4(), plate_number: '34 JKL 012', model: 'Volkswagen Crafter', capacity: 19, status: 'in_service', last_ping: { lat: 41.0553, lng: 29.0266, heading: 180, speed: 40, timestamp: new Date() } },
      { vehicle_id: uuidv4(), plate_number: '34 MNO 345', model: 'Mercedes Vito (VIP)', capacity: 8, status: 'available' }
    ]);
    console.log(`✅ ${vehicles.length} araç oluşturuldu`);

    // 5. OPERASYONLAR (1 Hafta Boyunca Günde 2 Adet)
    console.log('📋 Operasyonlar oluşturuluyor (1 haftalık plan)...');
    
    const operationsData = [];
    
    // 7 gün boyunca döngü
    for (let i = 0; i < 7; i++) { 
        const date = getDateString(i);
        
        // Günün 1. Operasyonu (Sabah)
        operationsData.push({
            id: uuidv4(),
            code: `OPS-${Date.now()}-${i}-1`,
            tour_name: tourNames[i % tourNames.length], // Sırayla farklı tur isimleri
            date: date,
            start_time: '09:30',
            vehicle_id: vehicles[i % vehicles.length].vehicle_id, // Araçları sırayla ata
            driver_id: 'user-003',
            guide_id: 'user-002',
            total_pax: 15 + (i % 5), // 15 ile 19 arası yolcu
            checked_in_count: 0,
            status: i === 0 ? 'active' : 'planned', // Sadece ilk gün aktif
            route: i === 0 ? [{ lat: 41.0082, lng: 28.9784 }, { lat: 41.0115, lng: 28.9833 }] : []
        });

        // Günün 2. Operasyonu (Öğleden Sonra)
        operationsData.push({
            id: uuidv4(),
            code: `OPS-${Date.now()}-${i}-2`,
            tour_name: tourNames[(i + 5) % tourNames.length], // Farklı tur kombinasyonu
            date: date,
            start_time: '14:00',
            vehicle_id: vehicles[(i + 1) % vehicles.length].vehicle_id,
            driver_id: 'user-003',
            guide_id: 'user-002',
            total_pax: 10 + (i % 4), // 10 ile 13 arası yolcu
            checked_in_count: 0,
            status: 'planned',
            route: []
        });
    }

    // Ekstra Operasyonlar (Daha yoğun günler için)
    operationsData.push({
        id: uuidv4(),
        code: `OPS-EXTRA-1`,
        tour_name: 'İstanbul Gece Turu',
        date: getDateString(0), // Bugün Akşam
        start_time: '20:00',
        vehicle_id: vehicles[4].vehicle_id,
        driver_id: 'user-003',
        guide_id: 'user-002',
        total_pax: 6,
        checked_in_count: 0,
        status: 'planned',
        route: []
    });

    // Özel Durum: Bugünün ilk operasyonu (Aktif ve check-in yapılmış)
    operationsData[0].checked_in_count = 10; // Makul sayıda check-in
    
    // Özel Durum: Bugünün ikinci operasyonu (Düşük Katılım Alarmı Testi İçin)
    operationsData[1].status = 'active'; // Bunu da aktif yapalım
    operationsData[1].total_pax = 20;
    operationsData[1].checked_in_count = 1; // Çok düşük katılım -> Alarm vermeli

    const createdOperations = await Operation.create(operationsData);
    console.log(`✅ ${createdOperations.length} operasyon oluşturuldu (1 haftalık + ekstra)`);

    // 6. YOLCULAR
    console.log('👥 Yolcular oluşturuluyor...');
    let totalPax = 0;
    
    for (const operation of createdOperations) {
      const passengers = [];
      const numPax = operation.total_pax;
      
      for (let i = 0; i < numPax; i++) {
        const location = locations[i % locations.length];
        // Sadece aktif turlarda ve check-in sayısına kadar olanları "checked_in" yap
        const isCheckedIn = operation.status === 'active' && i < operation.checked_in_count;
        
        passengers.push({
          pax_id: uuidv4(),
          operation_id: operation.id,
          name: turkishNames[(totalPax + i) % turkishNames.length], // İsimleri sürekli döndür
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
    console.log(`✅ Toplam ${totalPax} yolcu oluşturuldu`);

    console.log('\n🎉 Seed işlemi başarıyla tamamlandı!');
    console.log('📊 Özet:');
    console.log(`   - Tarih Aralığı: 24 Kasım - 30 Kasım`);
    console.log(`   - Operasyon Sayısı: ${createdOperations.length}`);
    console.log(`   - Toplam Yolcu: ${totalPax}`);
    console.log('\n🔑 Demo Giriş Bilgileri:');
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