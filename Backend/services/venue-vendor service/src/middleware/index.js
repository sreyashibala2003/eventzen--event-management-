import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import config from '../config/index.js';

/**
 * CORS Middleware Configuration
 */
export const corsMiddleware = cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials,
  optionsSuccessStatus: config.cors.optionsSuccessStatus,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'X-API-Key'
  ]
});

/**
 * Security Headers Middleware
 */
export const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
});

/**
 * Compression Middleware
 */
export const compressionMiddleware = compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6,
  threshold: 1024 // Only compress responses larger than 1KB
});

/**
 * Basic Rate Limiting Middleware
 */
export const basicRateLimit = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    message: config.rateLimit.message,
    retryAfter: config.rateLimit.windowMs / 1000
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP address
    return req.user?.userId || req.ip;
  }
});

/**
 * Admin Endpoints Rate Limiting
 */
export const adminRateLimit = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.adminMax,
  message: {
    success: false,
    error: 'ADMIN_RATE_LIMIT_EXCEEDED',
    message: 'Too many admin requests from this user, please try again later.',
    retryAfter: config.rateLimit.windowMs / 1000
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.userId || req.ip
});

/**
 * Pre-configured Rate Limiters for Different User Roles
 * Created at app initialization to avoid creation during request handling
 */
const rateLimiters = {
  anonymous: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Anonymous users: 100 req/15min
    message: {
      success: false,
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Rate limit exceeded for anonymous users',
      retryAfter: 15 * 60, // 15 minutes in seconds
      userRole: 'anonymous'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user?.userId || req.ip
  }),

  admin: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5000, // Admin: 5000 req/15min
    message: {
      success: false,
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Rate limit exceeded for admin users',
      retryAfter: 15 * 60,
      userRole: 'admin'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user?.userId || req.ip
  }),

  organizer: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 2000, // Organizer: 2000 req/15min
    message: {
      success: false,
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Rate limit exceeded for organizer users',
      retryAfter: 15 * 60,
      userRole: 'organizer'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user?.userId || req.ip
  }),

  vendor: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1500, // Vendor: 1500 req/15min
    message: {
      success: false,
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Rate limit exceeded for vendor users',
      retryAfter: 15 * 60,
      userRole: 'vendor'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user?.userId || req.ip
  }),

  user: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Regular users: 1000 req/15min
    message: {
      success: false,
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Rate limit exceeded for regular users',
      retryAfter: 15 * 60,
      userRole: 'user'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user?.userId || req.ip
  })
};

/**
 * Dynamic Rate Limiting Based on User Role
 * Selects pre-configured rate limiter based on user role
 */
export const dynamicRateLimit = (req, res, next) => {
  let selectedLimiter;

  if (!req.user) {
    selectedLimiter = rateLimiters.anonymous;
  } else {
    const userRole = req.user.role?.toLowerCase();
    switch (userRole) {
      case 'admin':
      case 'super_admin':
        selectedLimiter = rateLimiters.admin;
        break;
      case 'organizer':
        selectedLimiter = rateLimiters.organizer;
        break;
      case 'vendor':
        selectedLimiter = rateLimiters.vendor;
        break;
      default:
        selectedLimiter = rateLimiters.user;
        break;
    }
  }

  return selectedLimiter(req, res, next);
};

/**
 * Request Logging Middleware
 */
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Log request start
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${req.ip} - User: ${req.user?.userId || 'Anonymous'}`);

  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(body) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);

    return originalJson.call(this, body);
  };

  next();
};

/**
 * Request ID Middleware
 * Adds unique request ID for tracking
 */
export const requestId = (req, res, next) => {
  req.requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  res.setHeader('X-Request-ID', req.requestId);
  next();
};

/**
 * Body Size Limiter Middleware
 */
export const bodyLimiter = (limit = '10mb') => {
  return (req, res, next) => {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      const contentLength = parseInt(req.headers['content-length']);
      const limitBytes = parseLimit(limit);

      if (contentLength && contentLength > limitBytes) {
        return res.status(413).json({
          success: false,
          error: 'PAYLOAD_TOO_LARGE',
          message: `Request body too large. Maximum allowed size: ${limit}`,
          receivedSize: formatBytes(contentLength),
          maxSize: limit
        });
      }
    }
    next();
  };
};

/**
 * API Response Time Middleware
 */
export const responseTime = (req, res, next) => {
  const startTime = process.hrtime();

  // Override res.end to calculate and set response time before headers are sent
  const originalEnd = res.end;
  res.end = function(...args) {
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const duration = seconds * 1000 + nanoseconds / 1000000; // Convert to milliseconds

    // Only set header if response hasn't been sent yet
    if (!res.headersSent) {
      res.setHeader('X-Response-Time', `${duration.toFixed(2)}ms`);
    }

    originalEnd.apply(this, args);
  };

  next();
};

/**
 * API Version Middleware
 */
export const apiVersion = (version = 'v1') => {
  return (req, res, next) => {
    req.apiVersion = version;
    res.setHeader('X-API-Version', version);
    next();
  };
};

/**
 * Health Check Middleware
 */
export const healthCheck = (req, res, next) => {
  if (req.path === '/health' || req.path === '/api/health') {
    return res.status(200).json({
      success: true,
      message: 'Venue & Vendor Service is healthy',
      timestamp: new Date().toISOString(),
      service: 'eventzen-venue-vendor-service',
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      environment: config.env
    });
  }
  next();
};

/**
 * Not Found Middleware
 */
export const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    error: 'ENDPOINT_NOT_FOUND',
    message: `The endpoint ${req.method} ${req.path} was not found`,
    availableEndpoints: {
      venues: 'GET /api/v1/venues',
      vendors: 'GET /api/v1/vendors',
      health: 'GET /health'
    },
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
};

/**
 * Global Error Handler Middleware
 */
export const errorHandler = (error, req, res, next) => {
  // Log error for debugging
  console.error(`[${new Date().toISOString()}] Error in ${req.method} ${req.path}:`, {
    error: error.message,
    stack: error.stack,
    user: req.user?.userId,
    requestId: req.requestId
  });

  // Default error response
  let statusCode = 500;
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let message = 'An internal server error occurred';

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = error.message;
  } else if (error.name === 'CastError') {
    statusCode = 400;
    errorCode = 'INVALID_ID_FORMAT';
    message = 'Invalid ID format provided';
  } else if (error.code === 11000) {
    statusCode = 409;
    errorCode = 'DUPLICATE_RESOURCE';
    message = 'Resource already exists';
  } else if (error.name === 'MongoNetworkError') {
    statusCode = 503;
    errorCode = 'DATABASE_CONNECTION_ERROR';
    message = 'Database connection error';
  } else if (error.statusCode) {
    statusCode = error.statusCode;
    errorCode = error.code || 'API_ERROR';
    message = error.message;
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: errorCode,
    message: message,
    ...(config.env === 'development' && {
      stack: error.stack,
      details: error
    }),
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
};

/**
 * Async Error Handler Wrapper
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Helper functions
function parseLimit(limit) {
  if (typeof limit === 'number') return limit;

  const units = { b: 1, kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024 };
  const match = limit.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);

  if (!match) throw new Error('Invalid limit format');

  const value = parseFloat(match[1]);
  const unit = match[2] || 'b';

  return Math.floor(value * units[unit]);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default {
  corsMiddleware,
  securityMiddleware,
  compressionMiddleware,
  basicRateLimit,
  adminRateLimit,
  dynamicRateLimit,
  requestLogger,
  requestId,
  bodyLimiter,
  responseTime,
  apiVersion,
  healthCheck,
  notFound,
  errorHandler,
  asyncHandler
};