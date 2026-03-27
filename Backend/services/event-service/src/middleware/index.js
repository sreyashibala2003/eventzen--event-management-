import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import config from '../config/index.js';

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

export const securityMiddleware = helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
});

export const compressionMiddleware = compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6,
  threshold: 1024
});

export const basicRateLimit = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    message: config.rateLimit.message
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.userId || req.ip
});

export const adminRateLimit = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.adminMax,
  message: {
    success: false,
    error: 'ADMIN_RATE_LIMIT_EXCEEDED',
    message: 'Too many admin requests from this user, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.userId || req.ip
});

export const requestLogger = (req, res, next) => {
  const startedAt = Date.now();
  const originalJson = res.json;

  res.json = function json(body) {
    const duration = Date.now() - startedAt;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
    return originalJson.call(this, body);
  };

  next();
};

export const requestId = (req, res, next) => {
  req.requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  res.setHeader('X-Request-ID', req.requestId);
  next();
};

export const responseTime = (req, res, next) => {
  const startedAt = process.hrtime();
  const originalEnd = res.end;

  res.end = function end(...args) {
    const [seconds, nanoseconds] = process.hrtime(startedAt);
    const duration = seconds * 1000 + (nanoseconds / 1000000);
    if (!res.headersSent) {
      res.setHeader('X-Response-Time', `${duration.toFixed(2)}ms`);
    }
    originalEnd.apply(this, args);
  };

  next();
};

export const apiVersion = (version = 'v1') => (req, res, next) => {
  req.apiVersion = version;
  res.setHeader('X-API-Version', version);
  next();
};

export const healthCheck = (req, res, next) => {
  if (req.path === '/health' || req.path === '/api/health') {
    return res.status(200).json({
      success: true,
      message: 'Event service is healthy',
      service: 'eventzen-event-service',
      environment: config.env,
      timestamp: new Date().toISOString()
    });
  }
  return next();
};

export const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    error: 'ENDPOINT_NOT_FOUND',
    message: `The endpoint ${req.method} ${req.path} was not found`,
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
};

export const errorHandler = (error, req, res, next) => {
  void next;
  console.error(`[${new Date().toISOString()}] Error in ${req.method} ${req.path}:`, error);

  let statusCode = 500;
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let message = 'An internal server error occurred';

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
  } else if (error.response?.status) {
    statusCode = error.response.status;
    errorCode = 'UPSTREAM_SERVICE_ERROR';
    message = error.response.data?.message || 'Upstream service request failed';
  } else if (error.statusCode) {
    statusCode = error.statusCode;
    errorCode = error.code || 'API_ERROR';
    message = error.message;
  }

  res.status(statusCode).json({
    success: false,
    error: errorCode,
    message,
    ...(config.env === 'development' && { details: error.message, stack: error.stack }),
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
};

export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
