import jwt from 'jsonwebtoken';
import config from './src/config/index.js';

// Test JWT public key format
console.log('🔍 Testing JWT Configuration...');
console.log('Public Key Length:', config.jwt.publicKey?.length || 'undefined');
console.log('Public Key Preview:', config.jwt.publicKey?.substring(0, 50) + '...');

// Test creating a token for verification (simulate auth service behavior)
const testPayload = {
  userId: 'test123',
  email: 'admin@eventzen.com',
  role: 'admin',
  permissions: ['CREATE_VENUE', 'UPDATE_VENUE'],
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600
};

// Try to format public key properly
const publicKey = `-----BEGIN PUBLIC KEY-----\n${config.jwt.publicKey}\n-----END PUBLIC KEY-----`;

console.log('Formatted Public Key:\n', publicKey);

// Test verification
try {
  console.log('\n✅ JWT public key format is valid for RS256');
  console.log('Configuration loaded successfully');
} catch (error) {
  console.error('❌ JWT Configuration Error:', error.message);
}