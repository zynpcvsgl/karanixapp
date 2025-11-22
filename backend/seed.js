const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const Operation = require('./models/Operation');
const Passenger = require('./models/Passenger');
const Vehicle = require('./models/Vehicle');
const Customer = require('./models/Customer');
const Location = require('./models/Location');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      dbName: process.env.DB_NAME || 'karanix_demo'
    });
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Clear existing data
const clearData = async () => {
  try {
    await Operation.deleteMany({});
    await Passenger.deleteMany({});
    await Vehicle.deleteMany({});
    await Customer.deleteMany({});
    await Location.deleteMany({});
    console.log('🗑️  Cleared existing data');
  } catch (error) {
    console.error('Error clearing data:', error);
  }
};

// Seed data
const seedData = async () => {
  try {
    // Get today and tomorrow dates
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const formatDate = (date) => {
      return date.toISOString().split('T')[0];
    };
    
    // Create Customers
    const customer1 = new Customer({
      customer_id: uuidv4(),
      name: 'Acme Corporation',
      email: 'contact@acme.com',
      phone: '+90 532 123 4567',
      company: 'Acme Corp'
    });
    await customer1.save();
    
    const customer2 = new Customer({
      customer_id: uuidv4(),
      name: 'TechStart Ltd',
      email: 'info@techstart.com',
      phone: '+90 533 987 6543',
      company: 'TechStart'
    });
    await customer2.save();
    
    console.log('✅ Created customers');
    
    // Create Locations
    const locations = [
      {
        location_id: uuidv4(),
        name: 'Taksim Square',
        address: 'Taksim, Beyoğlu, Istanbul',
        lat: 41.0369,
        lng: 28.9850,
        customer_id: customer1.customer_id
      },
      {
        location_id: uuidv4(),
        name: 'Sultanahmet',
        address: 'Sultanahmet, Fatih, Istanbul',
        lat: 41.0086,
        lng: 28.9802,
        customer_id: customer1.customer_id
      },
      {
        location_id: uuidv4(),
        name: 'Levent Business District',
        address: 'Levent, Beşiktaş, Istanbul',
        lat: 41.0814,
        lng: 29.0092,
        customer_id: customer2.customer_id
      },
      {
        location_id: uuidv4(),
        name: 'Kadıköy Port',
        address: 'Kadıköy, Istanbul',
        lat: 40.9930,
        lng: 29.0236,
        customer_id: customer2.customer_id
      }
    ];
    
    for (const loc of locations) {
      const location = new Location(loc);
      await location.save();
      
      // Add to customer's locations
      await Customer.findOneAndUpdate(
        { customer_id: loc.customer_id },
        { $push: { locations: loc.location_id } }
      );
    }
    
    console.log('✅ Created locations');
    
    // Create Vehicles
    const vehicles = [
      {
        vehicle_id: uuidv4(),
        plate_number: '34 ABC 123',
        model: 'Mercedes Sprinter',
        capacity: 16,
        status: 'in_service',
        driver_id: 'driver-001',
        last_ping: {
          lat: 41.0082,
          lng: 28.9784,
          heading: 45,
          speed: 20,
          timestamp: new Date()
        }
      },
      {
        vehicle_id: uuidv4(),
        plate_number: '34 XYZ 789',
        model: 'Ford Transit',
        capacity: 14,
        status: 'available',
        driver_id: 'driver-002'
      },
      {
        vehicle_id: uuidv4(),
        plate_number: '06 DEF 456',
        model: 'Mercedes Vito',
        capacity: 8,
        status: 'in_service',
        driver_id: 'driver-003',
        last_ping: {
          lat: 41.0814,
          lng: 29.0092,
          heading: 180,
          speed: 35,
          timestamp: new Date()
        }
      }
    ];
    
    const savedVehicles = [];
    for (const veh of vehicles) {
      const vehicle = new Vehicle(veh);
      await vehicle.save();
      savedVehicles.push(vehicle);
    }
    
    console.log('✅ Created vehicles');
    
    // Create Operations for Today
    const operation1 = new Operation({
      id: uuidv4(),
      code: `OPS-${formatDate(today)}-001`,
      tour_name: 'Istanbul City Tour',
      date: formatDate(today),
      start_time: '09:00',
      vehicle_id: savedVehicles[0].vehicle_id,
      driver_id: 'driver-001',
      guide_id: 'guide-001',
      total_pax: 0, // Will be updated when passengers are added
      checked_in_count: 0,
      status: 'active',
      route: [
        [28.9784, 41.0082], // Sultanahmet
        [28.9850, 41.0369], // Taksim
        [29.0092, 41.0814]  // Levent
      ]
    });
    await operation1.save();
    
    const operation2 = new Operation({
      id: uuidv4(),
      code: `OPS-${formatDate(today)}-002`,
      tour_name: 'Bosphorus Cruise Tour',
      date: formatDate(today),
      start_time: '14:00',
      vehicle_id: savedVehicles[2].vehicle_id,
      driver_id: 'driver-003',
      guide_id: 'guide-002',
      total_pax: 0,
      checked_in_count: 0,
      status: 'planned',
      route: [
        [29.0092, 41.0814], // Levent
        [29.0236, 40.9930], // Kadıköy
        [28.9784, 41.0082]  // Sultanahmet
      ]
    });
    await operation2.save();
    
    // Create Operations for Tomorrow
    const operation3 = new Operation({
      id: uuidv4(),
      code: `OPS-${formatDate(tomorrow)}-001`,
      tour_name: 'Prince Islands Tour',
      date: formatDate(tomorrow),
      start_time: '08:30',
      vehicle_id: savedVehicles[1].vehicle_id,
      driver_id: 'driver-002',
      guide_id: 'guide-003',
      total_pax: 0,
      checked_in_count: 0,
      status: 'planned',
      route: [
        [28.9850, 41.0369], // Taksim
        [29.0236, 40.9930], // Kadıköy
        [29.1067, 40.8553]  // Büyükada (Prince Islands)
      ]
    });
    await operation3.save();
    
    console.log('✅ Created operations');
    
    // Create Passengers for Operation 1 (Today - Active)
    const op1Passengers = [
      { name: 'Ahmet Yılmaz', phone: '+90 532 111 1111', seat_no: 'A1', pickup: locations[0], status: 'checked_in' },
      { name: 'Ayşe Demir', phone: '+90 533 222 2222', seat_no: 'A2', pickup: locations[0], status: 'checked_in' },
      { name: 'Mehmet Kaya', phone: '+90 534 333 3333', seat_no: 'B1', pickup: locations[1], status: 'checked_in' },
      { name: 'Fatma Çelik', phone: '+90 535 444 4444', seat_no: 'B2', pickup: locations[1], status: 'waiting' },
      { name: 'Ali Öztürk', phone: '+90 536 555 5555', seat_no: 'C1', pickup: locations[2], status: 'waiting' },
      { name: 'Zeynep Arslan', phone: '+90 537 666 6666', seat_no: 'C2', pickup: locations[2], status: 'waiting' },
    ];
    
    let checkedInCount = 0;
    for (const paxData of op1Passengers) {
      const passenger = new Passenger({
        pax_id: uuidv4(),
        operation_id: operation1.id,
        name: paxData.name,
        phone: paxData.phone,
        pickup_point: {
          lat: paxData.pickup.lat,
          lng: paxData.pickup.lng,
          address: paxData.pickup.address
        },
        seat_no: paxData.seat_no,
        status: paxData.status,
        reservation_id: `RES-${uuidv4().substring(0, 8)}`,
        checked_in_at: paxData.status === 'checked_in' ? new Date() : null,
        checkin_method: paxData.status === 'checked_in' ? 'manual' : null
      });
      await passenger.save();
      
      if (paxData.status === 'checked_in') {
        checkedInCount++;
      }
    }
    
    operation1.total_pax = op1Passengers.length;
    operation1.checked_in_count = checkedInCount;
    await operation1.save();
    
    // Create Passengers for Operation 2 (Today - Planned)
    const op2Passengers = [
      { name: 'Can Yıldız', phone: '+90 538 777 7777', seat_no: 'A1', pickup: locations[2] },
      { name: 'Elif Şahin', phone: '+90 539 888 8888', seat_no: 'A2', pickup: locations[3] },
      { name: 'Burak Aydın', phone: '+90 541 999 9999', seat_no: 'B1', pickup: locations[3] },
    ];
    
    for (const paxData of op2Passengers) {
      const passenger = new Passenger({
        pax_id: uuidv4(),
        operation_id: operation2.id,
        name: paxData.name,
        phone: paxData.phone,
        pickup_point: {
          lat: paxData.pickup.lat,
          lng: paxData.pickup.lng,
          address: paxData.pickup.address
        },
        seat_no: paxData.seat_no,
        status: 'waiting',
        reservation_id: `RES-${uuidv4().substring(0, 8)}`
      });
      await passenger.save();
    }
    
    operation2.total_pax = op2Passengers.length;
    await operation2.save();
    
    // Create Passengers for Operation 3 (Tomorrow)
    const op3Passengers = [
      { name: 'Deniz Koç', phone: '+90 542 100 0000', seat_no: 'A1', pickup: locations[0] },
      { name: 'Ece Yavuz', phone: '+90 543 200 0000', seat_no: 'A2', pickup: locations[1] },
      { name: 'Fikret Polat', phone: '+90 544 300 0000', seat_no: 'B1', pickup: locations[2] },
      { name: 'Gamze Ünal', phone: '+90 545 400 0000', seat_no: 'B2', pickup: locations[3] },
    ];
    
    for (const paxData of op3Passengers) {
      const passenger = new Passenger({
        pax_id: uuidv4(),
        operation_id: operation3.id,
        name: paxData.name,
        phone: paxData.phone,
        pickup_point: {
          lat: paxData.pickup.lat,
          lng: paxData.pickup.lng,
          address: paxData.pickup.address
        },
        seat_no: paxData.seat_no,
        status: 'waiting',
        reservation_id: `RES-${uuidv4().substring(0, 8)}`
      });
      await passenger.save();
    }
    
    operation3.total_pax = op3Passengers.length;
    await operation3.save();
    
    console.log('✅ Created passengers');
    console.log('');
    console.log('📊 SEED SUMMARY:');
    console.log(`   Customers: 2`);
    console.log(`   Locations: ${locations.length}`);
    console.log(`   Vehicles: ${vehicles.length}`);
    console.log(`   Operations Today: 2`);
    console.log(`   Operations Tomorrow: 1`);
    console.log(`   Total Passengers: ${op1Passengers.length + op2Passengers.length + op3Passengers.length}`);
    console.log('');
    console.log('✅ Database seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await clearData();
  await seedData();
  await mongoose.connection.close();
  console.log('🔌 Database connection closed');
  process.exit(0);
};

main();
