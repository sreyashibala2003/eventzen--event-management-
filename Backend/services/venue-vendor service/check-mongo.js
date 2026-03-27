#!/usr/bin/env node

import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb://localhost:27017/eventzen_venues';

async function checkMongoDB() {
  console.log('🔍 Checking MongoDB connection...');
  console.log('📍 Connection URI:', MONGODB_URI);

  try {
    const client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 3000, // Timeout after 3s instead of 30s
      socketTimeoutMS: 3000,
    });

    console.log('⏳ Attempting to connect...');
    await client.connect();

    console.log('✅ MongoDB is running and accessible!');

    // Test database operations
    const db = client.db();
    const adminDb = db.admin();
    const status = await adminDb.serverStatus();

    console.log(`📊 MongoDB version: ${status.version}`);
    console.log(`💾 Database: ${db.databaseName}`);

    await client.close();
    console.log('🔌 Connection closed successfully');

  } catch (error) {
    console.error('❌ MongoDB connection failed:');
    console.error('   Error:', error.message);
    console.log('');
    console.log('💡 To fix this issue:');
    console.log('');
    console.log('🟦 Option 1: Install & Start MongoDB');
    console.log('   • Windows: Download from https://www.mongodb.com/try/download/community');
    console.log('   • macOS: brew install mongodb-community && brew services start mongodb/brew/mongodb-community');
    console.log('   • Linux: sudo systemctl start mongod');
    console.log('');
    console.log('🐳 Option 2: Use Docker');
    console.log('   docker run -d -p 27017:27017 --name mongodb-eventzen mongo:7');
    console.log('');
    console.log('☁️ Option 3: Use MongoDB Atlas (Cloud)');
    console.log('   • Create free cluster at https://cloud.mongodb.com');
    console.log('   • Update MONGODB_URI in .env file');
    console.log('');
    process.exit(1);
  }
}

checkMongoDB();