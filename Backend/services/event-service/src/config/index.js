import dotenv from 'dotenv';

dotenv.config();

const config = {
  port: process.env.PORT || 3002,
  env: process.env.NODE_ENV || 'development',
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/eventzen_events',
    testUri: process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/eventzen_events_test',
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    }
  },
  jwt: {
    publicKey: process.env.JWT_PUBLIC_KEY || 'your-super-secret-jwt-key-for-eventzen-events',
    skipVerification:
      (process.env.NODE_ENV || 'development') === 'development' &&
      process.env.JWT_SKIP_VERIFICATION !== 'false'
  },
  rateLimit: {
    windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000,
    max: process.env.RATE_LIMIT_MAX_REQUESTS || 1000,
    adminMax: process.env.RATE_LIMIT_ADMIN_MAX_REQUESTS || 5000,
    message: 'Too many requests from this IP, please try again later.'
  },
  cors: {
    origin:
      process.env.ALLOWED_ORIGINS?.split(',') || [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:3000'
      ],
    credentials: true,
    optionsSuccessStatus: 200
  },
  services: {
    venueVendor: process.env.VENUE_VENDOR_SERVICE_URL || 'http://localhost:3001/api/v1',
    authService: process.env.AUTH_SERVICE_URL || 'http://localhost:8081/api/v1'
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  }
};

export default config;
