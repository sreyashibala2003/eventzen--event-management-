import winston from 'winston';
import 'winston-mongodb';
import config from '../config/index.js';

// Define log levels and colors
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(logColors);

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, service = 'venue-vendor-service', requestId, ...meta } = info;

    let logMessage = `[${timestamp}] ${level}: ${message}`;

    if (service) {
      logMessage = `[${service}] ${logMessage}`;
    }

    if (requestId) {
      logMessage += ` [${requestId}]`;
    }

    const metaString = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return logMessage + metaString;
  })
);

// Custom format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create transports array
const transports = [
  // Console transport
  new winston.transports.Console({
    level: config.env === 'development' ? 'debug' : 'info',
    format: consoleFormat,
  }),

  // File transport for all logs
  new winston.transports.File({
    filename: 'logs/venue-vendor-service.log',
    level: 'info',
    format: fileFormat,
    maxsize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
    tailable: true,
  }),

  // File transport for error logs only
  new winston.transports.File({
    filename: 'logs/venue-vendor-error.log',
    level: 'error',
    format: fileFormat,
    maxsize: 5 * 1024 * 1024, // 5MB
    maxFiles: 3,
    tailable: true,
  }),
];

// Add MongoDB transport if enabled
if (config.logging.enableMongoLogging && config.env !== 'test') {
  try {
    transports.push(
      new winston.transports.MongoDB({
        db: config.database.uri,
        collection: 'service_logs',
        level: 'info',
        options: {
          useUnifiedTopology: true,
        },
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
          winston.format.metadata()
        ),
      })
    );
  } catch (error) {
    console.warn('Failed to initialize MongoDB logging transport:', error.message);
  }
}

// Create the logger
const logger = winston.createLogger({
  levels: logLevels,
  level: config.logging.level,
  format: winston.format.combine(
    winston.format.errors({ stack: true }),
    winston.format.metadata()
  ),
  transports,
  exceptionHandlers: [
    new winston.transports.File({
      filename: 'logs/venue-vendor-exceptions.log',
      format: fileFormat
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: 'logs/venue-vendor-rejections.log',
      format: fileFormat
    })
  ],
  exitOnError: false,
});

// Enhanced logging methods
class Logger {
  constructor(service = 'venue-vendor-service') {
    this.service = service;
    this.logger = logger;
  }

  // Create child logger with additional metadata
  child(metadata) {
    return {
      ...this,
      defaultMeta: { ...this.defaultMeta, ...metadata }
    };
  }

  // Log with request context
  logWithContext(level, message, meta = {}, req = null) {
    const logMeta = {
      service: this.service,
      ...this.defaultMeta,
      ...meta
    };

    // Add request context if available
    if (req) {
      logMeta.requestId = req.requestId;
      logMeta.method = req.method;
      logMeta.url = req.originalUrl || req.url;
      logMeta.userAgent = req.get('User-Agent');
      logMeta.ip = req.ip;

      if (req.user) {
        logMeta.userId = req.user.userId;
        logMeta.userRole = req.user.role;
      }
    }

    this.logger.log(level, message, logMeta);
  }

  // Standard log methods
  error(message, meta = {}, req = null) {
    this.logWithContext('error', message, meta, req);
  }

  warn(message, meta = {}, req = null) {
    this.logWithContext('warn', message, meta, req);
  }

  info(message, meta = {}, req = null) {
    this.logWithContext('info', message, meta, req);
  }

  http(message, meta = {}, req = null) {
    this.logWithContext('http', message, meta, req);
  }

  debug(message, meta = {}, req = null) {
    this.logWithContext('debug', message, meta, req);
  }

  // API-specific logging methods
  logApiCall(req, res, responseTime) {
    const statusCode = res.statusCode;
    const level = statusCode >= 400 ? 'error' : statusCode >= 300 ? 'warn' : 'info';

    this.logWithContext(level, `${req.method} ${req.originalUrl || req.url}`, {
      statusCode,
      responseTime: `${responseTime}ms`,
      contentLength: res.get('Content-Length') || 0,
    }, req);
  }

  logDatabaseOperation(operation, collection, meta = {}, req = null) {
    this.logWithContext('debug', `Database ${operation}`, {
      operation,
      collection,
      ...meta
    }, req);
  }

  logAuthentication(event, userId, meta = {}, req = null) {
    this.logWithContext('info', `Authentication: ${event}`, {
      event,
      userId,
      ...meta
    }, req);
  }

  logBusinessLogic(event, meta = {}, req = null) {
    this.logWithContext('info', `Business Logic: ${event}`, meta, req);
  }

  logExternalService(service, operation, meta = {}, req = null) {
    this.logWithContext('info', `External Service: ${service} - ${operation}`, {
      externalService: service,
      operation,
      ...meta
    }, req);
  }

  // Performance logging
  logPerformance(operation, duration, meta = {}, req = null) {
    const level = duration > 5000 ? 'warn' : duration > 2000 ? 'info' : 'debug';

    this.logWithContext(level, `Performance: ${operation}`, {
      operation,
      duration: `${duration}ms`,
      ...meta
    }, req);
  }

  // Security logging
  logSecurityEvent(event, severity = 'info', meta = {}, req = null) {
    this.logWithContext(severity, `Security: ${event}`, {
      securityEvent: event,
      ...meta
    }, req);
  }

  // Validation logging
  logValidationError(field, error, meta = {}, req = null) {
    this.logWithContext('warn', `Validation Error: ${field}`, {
      field,
      validationError: error,
      ...meta
    }, req);
  }
}

// Create default logger instance
const serviceLogger = new Logger('venue-vendor-service');

// Express middleware for request logging
export const requestLoggingMiddleware = (req, res, next) => {
  const startTime = Date.now();

  // Log incoming request
  serviceLogger.http('Incoming request', {
    method: req.method,
    url: req.originalUrl || req.url,
    userAgent: req.get('User-Agent'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length') || 0
  }, req);

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const responseTime = Date.now() - startTime;

    // Log API call completion
    serviceLogger.logApiCall(req, res, responseTime);

    // Call original end method
    originalEnd.call(res, chunk, encoding);
  };

  next();
};

// Error logging middleware
export const errorLoggingMiddleware = (error, req, res, next) => {
  serviceLogger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    statusCode: error.statusCode || 500,
  }, req);

  next(error);
};

export default serviceLogger;
export { Logger };