import dotenv from 'dotenv';

dotenv.config();

const config = {
  // Server Configuration
  port: process.env.PORT || 3001,
  env: process.env.NODE_ENV || 'development',

  // Database Configuration
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/eventzen_venues',
    testUri: process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/eventzen_venues_test',
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }
  },

  // JWT Configuration
  jwt: {
    publicKey: process.env.JWT_PUBLIC_KEY || 'your-super-secret-jwt-key-for-eventzen-venues',
    expiresIn: process.env.JWT_EXPIRE_TIME || '24h',
    // Development should accept auth-service tokens even before a shared RSA
    // public key is wired through every service.
    skipVerification:
      (process.env.NODE_ENV || 'development') === 'development' &&
      process.env.JWT_SKIP_VERIFICATION !== 'false'
  },

  // Rate Limiting Configuration
  rateLimit: {
    windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // 15 minutes
    max: process.env.RATE_LIMIT_MAX_REQUESTS || 1000, // limit each IP to 1000 requests per windowMs
    adminMax: process.env.RATE_LIMIT_ADMIN_MAX_REQUESTS || 5000, // higher limit for admin endpoints
    message: 'Too many requests from this IP, please try again later.'
  },

  // CORS Configuration
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    optionsSuccessStatus: 200
  },

  // External Services
  services: {
    apiGateway: process.env.API_GATEWAY_URL || 'http://localhost:8080',
    eventService: process.env.EVENT_SERVICE_URL || 'http://localhost:3002',
    authService: process.env.AUTH_SERVICE_URL || 'http://localhost:3003',
    notificationService: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004'
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableMongoLogging: process.env.ENABLE_MONGODB_LOGGING === 'true'
  },

  // Cache Configuration
  cache: {
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    ttl: process.env.CACHE_TTL || 300 // 5 minutes
  }
};

export default config;
