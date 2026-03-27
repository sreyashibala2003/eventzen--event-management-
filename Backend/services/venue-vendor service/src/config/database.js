import mongoose from 'mongoose';
import winston from 'winston';
import config from './index.js';

const logger = winston.createLogger({
  level: config.logging.level,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

class Database {
  constructor() {
    this.isConnected = false;
  }

  async connect() {
    try {
      const uri = config.env === 'test' ? config.database.testUri : config.database.uri;

      logger.info('🔄 Connecting to MongoDB...');
      logger.info(`📍 Database URI: ${uri.replace(/\/\/.*@/, '//<credentials>@')}`);

      await mongoose.connect(uri, {
        ...config.database.options,
        serverSelectionTimeoutMS: 5000, // Fail fast if MongoDB is not available
        connectTimeoutMS: 10000 // Maximum time to wait for a connection to be established
      });

      this.isConnected = true;
      logger.info(`✅ MongoDB connected successfully to ${uri}`);

      // Handle connection events
      mongoose.connection.on('error', (error) => {
        logger.error('❌ MongoDB connection error:', error);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('⚠️ MongoDB disconnected');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('🔄 MongoDB reconnected');
        this.isConnected = true;
      });

      // Graceful shutdown
      process.on('SIGINT', async () => {
        await this.disconnect();
        process.exit(0);
      });

      process.on('SIGTERM', async () => {
        await this.disconnect();
        process.exit(0);
      });

    } catch (error) {
      logger.error('❌ MongoDB connection failed:', error.message);

      if (error.name === 'MongoServerSelectionError') {
        logger.error('💡 MongoDB is not running or not accessible. Please:');
        logger.error('   1. Start MongoDB service: sudo systemctl start mongod');
        logger.error('   2. Or install MongoDB: https://docs.mongodb.com/manual/installation/');
        logger.error('   3. Or use Docker: docker run -d -p 27017:27017 --name mongodb mongo:7');
        logger.error(`   4. Verify connection string: ${uri}`);
      }

      throw error;
    }
  }

  async disconnect() {
    try {
      await mongoose.connection.close();
      this.isConnected = false;
      logger.info('✅ MongoDB disconnected successfully');
    } catch (error) {
      logger.error('❌ MongoDB disconnection error:', error);
      throw error;
    }
  }

  async clearDatabase() {
    if (config.env !== 'test') {
      throw new Error('clearDatabase can only be used in test environment');
    }

    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }

  isHealthy() {
    return this.isConnected && mongoose.connection.readyState === 1;
  }
}

const database = new Database();
export default database;