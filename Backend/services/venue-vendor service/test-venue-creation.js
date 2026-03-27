// Test script to validate venue creation
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'eventzen-venue-vendor-super-secret-jwt-key-2024-secure';

// Create a test admin token
const testUser = {
  userId: 'test-admin-123',
  email: 'admin@eventzen.com',
  role: 'admin',
  permissions: ['create_venue', 'manage_venues', 'admin_access']
};

const token = jwt.sign(testUser, JWT_SECRET, { expiresIn: '24h' });

console.log('🔑 Test Admin JWT Token:');
console.log(token);
console.log('');
console.log('📋 Test Venue Data:');
const testVenueData = {
  venue_name: "Test Venue Form",
  address: "123 Test Street",
  city: "Mumbai",
  state: "Maharashtra",
  country: "India",
  postal_code: "400001",
  location: {
    type: "Point",
    coordinates: [72.8777, 19.0760]
  },
  capacity: 300,
  price_per_day: 25000,
  description: "A test venue created from the form",
  venue_type: "banquet_hall",
  amenities: ["parking", "wifi", "ac"],
  contact_info: {
    phone: "+91-9876543210",
    email: "test@venue.com",
    manager_name: "Test Manager"
  },
  cancellation_policy: "moderate",
  status: "active"
};

console.log(JSON.stringify(testVenueData, null, 2));

console.log('');
console.log('🧪 Test Commands:');
console.log('');
console.log('# Test token validity:');
console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:3001/api/v1/venues`);
console.log('');
console.log('# Test venue creation:');
console.log(`curl -X POST http://localhost:3001/api/v1/venues \\`);
console.log(`  -H "Content-Type: application/json" \\`);
console.log(`  -H "Authorization: Bearer ${token}" \\`);
console.log(`  -d '${JSON.stringify(testVenueData)}'`);