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
    const uri = config.env === 'test' ? config.database.testUri : config.database.uri;

    try {
      logger.info('Connecting to MongoDB for event service');

      await mongoose.connect(uri, {
        ...config.database.options,
        connectTimeoutMS: 10000
      });

      this.isConnected = true;
      logger.info(`MongoDB connected successfully to ${uri}`);

      mongoose.connection.on('error', (error) => {
        logger.error(`MongoDB connection error: ${error.message}`);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected');
        this.isConnected = true;
      });
    } catch (error) {
      logger.error(`MongoDB connection failed: ${error.message}`);
      throw error;
    }
  }

  async disconnect() {
    await mongoose.connection.close();
    this.isConnected = false;
    logger.info('MongoDB disconnected successfully');
  }

  isHealthy() {
    return this.isConnected && mongoose.connection.readyState === 1;
  }
}

const database = new Database();
export default database;
