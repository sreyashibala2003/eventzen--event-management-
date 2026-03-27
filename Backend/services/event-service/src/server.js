import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config/index.js';
import database from './config/database.js';
import routes from './routes/index.js';
import {
  apiVersion,
  compressionMiddleware,
  corsMiddleware,
  errorHandler,
  healthCheck,
  notFound,
  requestId,
  requestLogger,
  responseTime,
  securityMiddleware
} from './middleware/index.js';

const app = express();

app.set('trust proxy', 1);

app.use(requestId);
app.use(responseTime);
app.use(requestLogger);
app.use(securityMiddleware);
app.use(corsMiddleware);
app.use(compressionMiddleware);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api', apiVersion('v1'));
app.use(healthCheck);
app.use('/api', routes);

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'EventZen Event Service',
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

app.use('*', notFound);
app.use(errorHandler);

const gracefulShutdown = async (signal) => {
  console.log(`Received ${signal}. Starting graceful shutdown.`);

  if (global.server) {
    global.server.close(async () => {
      try {
        await database.disconnect();
      } finally {
        process.exit(0);
      }
    });
  } else {
    process.exit(0);
  }
};

export const startServer = async () => {
  const server = app.listen(config.port, () => {
    console.log(`EventZen Event Service listening on port ${config.port}`);
  });

  global.server = server;

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  database.connect().catch((error) => {
    console.error('Database connection failed, service running in limited mode:', error.message);
  });

  return server;
};

const isMainModule = (() => {
  if (!process.argv[1]) return false;

  const currentFilePath = fileURLToPath(import.meta.url);
  return path.resolve(process.argv[1]) === path.resolve(currentFilePath);
})();

if (isMainModule) {
  startServer().catch((error) => {
    console.error('Server startup failed:', error);
    process.exit(1);
  });
}

export default app;
