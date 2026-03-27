import express from 'express';
import config from './config/index.js';
import database from './config/database.js';
import routes from './routes/index.js';
import {
  corsMiddleware,
  securityMiddleware,
  compressionMiddleware,
  requestLogger,
  requestId,
  responseTime,
  apiVersion,
  healthCheck,
  notFound,
  errorHandler
} from './middleware/index.js';

// Create Express application
const app = express();

// Trust proxy (for rate limiting and IP detection)
app.set('trust proxy', 1);

// Global Middleware Stack
app.use(requestId);              // Add unique request ID
app.use(responseTime);           // Add response time header
app.use(requestLogger);          // Log all requests
app.use(securityMiddleware);     // Security headers
app.use(corsMiddleware);         // CORS configuration
app.use(compressionMiddleware);  // Gzip compression

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API version middleware
app.use('/api', apiVersion('v1'));

// Global health check (before routes)
app.use(healthCheck);

// API Routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'EventZen Venue & Vendor Service',
    version: '1.0.0',
    environment: config.env,
    timestamp: new Date().toISOString(),
    endpoints: {
      api: '/api',
      health: '/health',
      docs: '/api'
    }
  });
});

// Handle 404 for all other routes
app.use('*', notFound);

// Global error handler (must be last)
app.use(errorHandler);

// Graceful Shutdown Handler
const gracefulShutdown = (signal) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

  // Use global.server instead of server
  if (!global.server) {
    console.log('⚠️ No server instance to close');
    process.exit(0);
  }

  // Close HTTP server
  global.server.close(async (err) => {
    if (err) {
      console.error('❌ Error during server shutdown:', err);
      process.exit(1);
    }

    console.log('✅ HTTP server closed');

    // Close database connection
    try {
      await database.disconnect();
      console.log('✅ Database disconnected');
    } catch (error) {
      console.error('❌ Error disconnecting database:', error);
    }

    console.log('👋 Graceful shutdown completed');
    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error('❌ Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

// Start Server
const startServer = async () => {
  try {
    console.log('🚀 Starting EventZen Venue & Vendor Service...');

    // Start HTTP server first (non-blocking)
    const server = app.listen(config.port, () => {
      console.log(`
🚀 EventZen Venue & Vendor Service Started Successfully!

📋 Service Information:
   • Environment: ${config.env}
   • Port: ${config.port}
   • Database: 🔄 Connecting...
   • API Version: v1

🌐 Available Endpoints:
   • Health Check: http://localhost:${config.port}/health
   • API Docs: http://localhost:${config.port}/api
   • Venues: http://localhost:${config.port}/api/v1/venues
   • Vendors: http://localhost:${config.port}/api/v1/vendors

🔧 Configuration:
   • Node.js: ${process.version}
   • Environment: ${process.env.NODE_ENV}
   • Memory Usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB
   • Uptime: ${Math.round(process.uptime())} seconds

📝 To stop the service, press Ctrl+C
      `);
    });

    // Export server for graceful shutdown
    global.server = server;

    // Setup graceful shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught Exception:', error);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

    // Connect to database asynchronously (non-blocking)
    database.connect()
      .then(() => {
        console.log('✅ Database connected successfully - Full functionality enabled');
      })
      .catch((error) => {
        console.error('❌ Database connection failed, running in limited mode:', error.message);
        console.log('⚠️ Service will continue running with limited functionality');
        console.log('💡 Database-dependent endpoints may not work until connection is restored');
      });

    return server;
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server if this file is run directly (Windows-compatible module detection)
const isMainModule = import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` ||
                    import.meta.url.includes(process.argv[1]) ||
                    process.argv[1].includes('server.js');

if (isMainModule) {
  startServer().catch((error) => {
    console.error('💥 Server startup failed:', error);
    process.exit(1);
  });
}

export default app;
export { startServer };