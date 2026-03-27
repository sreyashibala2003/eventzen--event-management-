import express from 'express';
import eventRoutes from './events.js';

const router = express.Router();

router.use('/v1/events', eventRoutes);

router.get('/v1/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Event service API is healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      events: '/api/v1/events'
    }
  });
});

router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to EventZen Event Service API',
    version: '1.0.0',
    documentation: {
      events: {
        'GET /api/v1/events': 'List events',
        'GET /api/v1/events/:id': 'Get event by ID',
        'POST /api/v1/events': 'Create event',
        'PUT /api/v1/events/:id/status': 'Update event status',
        'DELETE /api/v1/events/:id': 'Delete event'
      }
    }
  });
});

export default router;
