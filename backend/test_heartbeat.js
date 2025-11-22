#!/usr/bin/env node

/**
 * GPS Heartbeat Simulator
 * Simulates vehicle GPS heartbeat for testing real-time tracking
 */

const axios = require('axios');

const API_URL = 'http://localhost:8001/api';

// Istanbul coordinates for simulation
const route = [
  { lat: 41.0082, lng: 28.9784, name: 'Sultanahmet' },
  { lat: 41.0150, lng: 28.9850, name: 'Sirkeci' },
  { lat: 41.0250, lng: 28.9950, name: 'Karaköy' },
  { lat: 41.0369, lng: 28.9850, name: 'Taksim' },
  { lat: 41.0500, lng: 29.0000, name: 'Şişli' },
  { lat: 41.0700, lng: 29.0050, name: 'Mecidiyeköy' },
  { lat: 41.0814, lng: 29.0092, name: 'Levent' }
];

let currentIndex = 0;
let vehicleId = null;

const getVehicle = async () => {
  try {
    const response = await axios.get(`${API_URL}/vehicles`);
    const vehicles = response.data.data || [];
    
    if (vehicles.length === 0) {
      console.error('❌ No vehicles found in database. Please run seed first: yarn seed');
      process.exit(1);
    }
    
    // Get first vehicle
    vehicleId = vehicles[0].vehicle_id;
    console.log(`🚗 Using vehicle: ${vehicles[0].plate_number} (${vehicleId})`);
    return vehicleId;
  } catch (error) {
    console.error('❌ Error fetching vehicles:', error.message);
    process.exit(1);
  }
};

const sendHeartbeat = async () => {
  const position = route[currentIndex];
  const heading = currentIndex < route.length - 1 ? 
    calculateHeading(position, route[currentIndex + 1]) : 0;
  
  const heartbeatData = {
    lat: position.lat,
    lng: position.lng,
    heading: heading,
    speed: Math.floor(Math.random() * 30) + 20, // Random speed 20-50 km/h
    timestamp: new Date().toISOString()
  };
  
  try {
    const response = await axios.post(
      `${API_URL}/vehicles/${vehicleId}/heartbeat`,
      heartbeatData
    );
    
    console.log(`📍 Heartbeat sent: ${position.name} (${position.lat}, ${position.lng}) - Speed: ${heartbeatData.speed} km/h`);
    
    // Move to next position
    currentIndex = (currentIndex + 1) % route.length;
    
  } catch (error) {
    console.error('❌ Error sending heartbeat:', error.message);
  }
};

// Calculate heading between two points
const calculateHeading = (from, to) => {
  const dLng = to.lng - from.lng;
  const y = Math.sin(dLng) * Math.cos(to.lat);
  const x = Math.cos(from.lat) * Math.sin(to.lat) -
    Math.sin(from.lat) * Math.cos(to.lat) * Math.cos(dLng);
  const heading = Math.atan2(y, x) * (180 / Math.PI);
  return (heading + 360) % 360;
};

const startSimulation = async () => {
  console.log('🚀 Starting GPS Heartbeat Simulator...');
  console.log('📡 Sending heartbeat every 5 seconds');
  console.log('Press Ctrl+C to stop\n');
  
  await getVehicle();
  
  // Send first heartbeat immediately
  await sendHeartbeat();
  
  // Continue sending every 5 seconds
  setInterval(sendHeartbeat, 5000);
};

// Start simulation
startSimulation().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
