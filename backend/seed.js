require('dotenv').config();
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Customer = require('../models/Customer');
const Location = require('../models/Location');
const Vehicle = require('../models/Vehicle');
const Operation = require('../models/Operation');
const Pax = require('../models/Pax');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/karanix';

// Istanbul landmarks for realistic data
const istanbulLocations = [
  { name: 'Sultanahmet', lat: 41.0082, lng: 28.9784, address: 'Sultanahmet Meydanı, Fatih' },
  { name: 'Taksim', lat: 41.0369, lng: 28.9850, address: 'Taksim Meydanı, Beyoğlu' },
  { name: 'Galata Tower', lat: 41.0256, lng: 28.9744, address: 'Galata Kulesi, Beyoğlu' },
  { name: 'Grand Bazaar', lat: 41.0106, lng: 28.9680, address: 'Kapalıçarşı, Fatih' },
  { name: 'Ortaköy', lat: 41.0553, lng: 29.0266, address: 'Ortaköy Meydanı, Beşiktaş' },
  { name: 'Dolmabahçe Palace', lat: 41.0391, lng: 29.0003, address: 'Dolmabahçe Cd., Beşiktaş' },
  { name: 'Topkapı Palace', lat: 41.0115, lng: 28.9833, address: 'Topkapı Sarayı, Fatih' },
  { name: 'Spice Bazaar', lat: 41.0166, lng: 28.9706, address: 'Mısır Çarşısı, Eminönü' }
];

const turkishNames = [
  'Ahmet Yılmaz', 'Mehmet Kaya', 'Ayşe Demir', 'Fatma Şahin', 'Mustafa Çelik',
  'Emine Yıldız', 'Ali Aydın', 'Zeynep Öztürk', 'Hüseyin Arslan', 'Hatice Doğan',
  'İbrahim Kılıç', 'Elif Aslan', 'Hasan Çetin', 'Meryem Kara', 'Süleyman Koç',
  'Rabia Şen', 'Osman Kurt', 'Rukiye Özdemir', 'Yusuf Özkan', 'Şule Güneş'
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      Customer.deleteMany({}),
      Location.deleteMany({}),
      Vehicle.deleteMany({}),
      Operation.deleteMany({}),
      Pax.deleteMany({})
    ]);
    console.log('🗑️  Cleared existing data');

    // Create Customers
    const customers = await Customer.create([
      {
        name: 'Grand Tours Ltd.',
        email: 'contact@grandtours.com',
        phone: '+90 212 555 0101',
        company: 'Grand Tours',
        active: true
      },
      {
        name: 'Istanbul Adventures',
        email: 'info@istanbuladventures.com',
        phone: '+90 212 555 0102',
        company: 'Istanbul Adventures',
        active: true
      },
      {
        name: 'Bosphorus Cruises',
        email: 'booking@bosphoruscruises.com',
        phone: '+90 212 555 0103',
        company: 'Bosphorus Cruises',
        active: true
      }
    ]);
    console.log(`✅ Created ${customers.length} customers`);

    // Create Locations
    const locations = await Location.create(
      istanbulLocations.map((loc, idx) => ({
        name: loc.name,
        coordinates: { lat: loc.lat, lng: loc.lng },
        address: loc.address,
        customer_id: customers[idx % customers.length]._id,
        type: 'pickup'
      }))
    );
    console.log(`✅ Created ${locations.length} locations`);

    // Assign locations to customers
    for (let i = 0; i < customers.length; i++) {
      const customerLocations = locations.filter((_, idx) => idx % customers.length === i);
      customers[i].locations = customerLocations.map(l => l._id);
      await customers[i].save();
    }

    // Create Vehicles
    const vehicles = await Vehicle.create([
      {
        vehicle_id: 'VEH001',
        plate: '34 ABC 123',
        model: 'Mercedes Sprinter',
        capacity: 20,
        status: 'in_service',
        last_ping: {
          lat: 41.0082,
          lng: 28.9784,
          heading: 90,
          speed: 0,
          timestamp: new Date()
        }
      },
      {
        vehicle_id: 'VEH002',
        plate: '34 DEF 456',
        model: 'Iveco Daily',
        capacity: 18,
        status: 'available'
      },
      {
        vehicle_id: 'VEH003',
        plate: '34 GHI 789',
        model: 'Mercedes Sprinter',
        capacity: 20,
        status: 'in_service'
      },
      {
        vehicle_id: 'VEH004',
        plate: '34 JKL 012',
        model: 'Ford Transit',
        capacity: 16,
        status: 'available'
      },
      {
        vehicle_id: 'VEH005',
        plate: '34 MNO 345',
        model: 'Mercedes Vito',
        capacity: 8,
        status: 'maintenance'
      }
    ]);
    console.log(`✅ Created ${vehicles.length} vehicles`);

    // Create Operations (Yesterday, Today, Tomorrow)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const operations = await Operation.create([
      {
        code: 'OPS-' + Date.now() + '-1',
        tour_name: 'Classic Istanbul Tour',
        date: yesterday,
        start_time: '09:00',
        vehicle_id: vehicles[0]._id,
        driver_id: 'DRV001',
        guide_id: 'GDE001',
        total_pax: 18,
        checked_in_count: 18,
        status: 'completed',
        customer_id: customers[0]._id,
        route: [
          { lat: 41.0082, lng: 28.9784 },
          { lat: 41.0106, lng: 28.9680 },
          { lat: 41.0115, lng: 28.9833 }
        ]
      },
      {
        code: 'OPS-' + Date.now() + '-2',
        tour_name: 'Bosphorus & Palaces',
        date: today,
        start_time: '10:00',
        vehicle_id: vehicles[0]._id,
        driver_id: 'DRV001',
        guide_id: 'GDE002',
        total_pax: 20,
        checked_in_count: 5,
        status: 'active',
        customer_id: customers[1]._id,
        route: [
          { lat: 41.0369, lng: 28.9850 },
          { lat: 41.0391, lng: 29.0003 },
          { lat: 41.0553, lng: 29.0266 }
        ]
      },
      {
        code: 'OPS-' + Date.now() + '-3',
        tour_name: 'Old City Walking Tour',
        date: today,
        start_time: '14:00',
        vehicle_id: vehicles[2]._id,
        driver_id: 'DRV002',
        guide_id: 'GDE003',
        total_pax: 15,
        checked_in_count: 0,
        status: 'planned',
        customer_id: customers[2]._id,
        route: [
          { lat: 41.0082, lng: 28.9784 },
          { lat: 41.0256, lng: 28.9744 },
          { lat: 41.0166, lng: 28.9706 }
        ]
      },
      {
        code: 'OPS-' + Date.now() + '-4',
        tour_name: 'Asian Side Discovery',
        date: tomorrow,
        start_time: '09:30',
        vehicle_id: vehicles[1]._id,
        driver_id: 'DRV003',
        guide_id: 'GDE001',
        total_pax: 16,
        checked_in_count: 0,
        status: 'planned',
        customer_id: customers[0]._id,
        route: []
      }
    ]);
    console.log(`✅ Created ${operations.length} operations`);

    // Create Passengers for each operation
    let paxCount = 0;
    for (const operation of operations) {
      const numPax = operation.total_pax;
      const passengers = [];

      for (let i = 0; i < numPax; i++) {
        const location = locations[i % locations.length];
        const status = operation.status === 'completed' ? 'checked_in' : 
                       (operation.status === 'active' && i < 5) ? 'checked_in' : 
                       'waiting';

        passengers.push({
          pax_id: `PAX${operation.code}-${i + 1}`,
          operation_id: operation._id,
          name: turkishNames[i % turkishNames.length],
          phone: `+90 5${Math.floor(Math.random() * 100000000).toString().padStart(9, '0')}`,
          pickup_point: {
            lat: location.coordinates.lat,
            lng: location.coordinates.lng,
            address: location.address
          },
          seat_no: `${i + 1}`,
          status,
          reservation_id: `RES-${uuidv4().substring(0, 8)}`,
          notes: i % 3 === 0 ? 'Vegetarian meal requested' : '',
          ...(status === 'checked_in' && {
            checkin_details: {
              method: 'manual',
              gps: {
                lat: location.coordinates.lat,
                lng: location.coordinates.lng
              },
              timestamp: new Date(),
              event_id: uuidv4()
            }
          })
        });
      }

      await Pax.create(passengers);
      paxCount += passengers.length;
    }
    console.log(`✅ Created ${paxCount} passengers`);

    console.log('\n🎉 Seed completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Customers: ${customers.length}`);
    console.log(`   - Locations: ${locations.length}`);
    console.log(`   - Vehicles: ${vehicles.length}`);
    console.log(`   - Operations: ${operations.length}`);
    console.log(`   - Passengers: ${paxCount}`);
    console.log('\n🔑 Demo Token: demo-token-123');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}