import express from 'express';
import config from './src/config/index.js';

console.log('🚀 Starting minimal test server...');

const app = express();

app.use(express.json());

// Simple health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'EventZen Venue & Vendor Service (Test Mode)',
    timestamp: new Date().toISOString(),
    environment: config.env,
    port: config.port
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'EventZen Venue & Vendor Service - Test Mode',
    endpoints: {
      health: '/health'
    }
  });
});

// Start without MongoDB connection
const server = app.listen(config.port, () => {
  console.log(`
✅ Test Server Started Successfully!

📋 Service Information:
   • Environment: ${config.env}
   • Port: ${config.port}
   • Mode: Testing (No Database)

🌐 Available Endpoints:
   • Health Check: http://localhost:${config.port}/health
   • Root: http://localhost:${config.port}

📝 To stop the service, press Ctrl+C
  `);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down test server...');
  server.close(() => {
    console.log('✅ Test server closed');
    process.exit(0);
  });
});

export default app;