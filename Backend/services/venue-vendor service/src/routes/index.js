import express from 'express';
import venueRoutes from './venues.js';
import vendorRoutes from './vendors.js';

const router = express.Router();

// API Version 1 Routes
router.use('/v1/venues', venueRoutes);
router.use('/v1/vendors', vendorRoutes);

// API v1 Health Check (for frontend compatibility)
router.get('/v1/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'EventZen Venue & Vendor Service API is healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      venues: '/api/v1/venues',
      vendors: '/api/v1/vendors'
    }
  });
});

// API Health Check (legacy)
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'EventZen Venue & Vendor Service API is healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      venues: '/api/v1/venues',
      vendors: '/api/v1/vendors'
    }
  });
});

// API Documentation Route
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to EventZen Venue & Vendor Service API',
    version: '1.0.0',
    documentation: {
      venues: {
        'GET /api/v1/venues': 'List all venues',
        'GET /api/v1/venues/:id': 'Get venue by ID',
        'POST /api/v1/venues': 'Create venue (Admin)',
        'PUT /api/v1/venues/:id': 'Update venue (Admin)',
        'DELETE /api/v1/venues/:id': 'Delete venue (Admin)'
      },
      vendors: {
        'GET /api/v1/vendors': 'List all vendors',
        'GET /api/v1/vendors/:id': 'Get vendor by ID',
        'POST /api/v1/vendors': 'Create vendor (Admin)',
        'PUT /api/v1/vendors/:id': 'Update vendor (Admin/Owner)',
        'DELETE /api/v1/vendors/:id': 'Delete vendor (Admin)'
      }
    },
    authentication: {
      type: 'Bearer JWT',
      header: 'Authorization: Bearer <token>',
      roles: ['admin', 'organizer', 'vendor']
    }
  });
});

export default router;
