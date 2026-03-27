import express from 'express';
import {
  createEvent,
  deleteEvent,
  getEvent,
  getEvents,
  updateEvent,
  updateEventStatus
} from '../controllers/eventController.js';
import {
  authenticate,
  optionalAuth,
  requireAdmin,
  requireOwnershipOrAdmin
} from '../middleware/auth.js';
import {
  adminRateLimit,
  basicRateLimit
} from '../middleware/index.js';
import {
  eventSchemas,
  validate
} from '../validators/index.js';

const router = express.Router();

router.get(
  '/',
  optionalAuth,
  basicRateLimit,
  validate(eventSchemas.search, 'query'),
  getEvents
);

router.get(
  '/admin/all',
  authenticate,
  requireAdmin,
  adminRateLimit,
  validate(eventSchemas.search, 'query'),
  getEvents
);

router.get(
  '/health',
  (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Event routes are healthy',
    timestamp: new Date().toISOString()
  });
});

router.get(
  '/:id',
  optionalAuth,
  basicRateLimit,
  getEvent
);

router.post(
  '/',
  authenticate,
  basicRateLimit,
  validate(eventSchemas.create),
  createEvent
);

router.put(
  '/:id',
  authenticate,
  requireOwnershipOrAdmin('created_by'),
  basicRateLimit,
  validate(eventSchemas.replace),
  updateEvent
);

router.put(
  '/:id/status',
  authenticate,
  requireOwnershipOrAdmin('created_by'),
  basicRateLimit,
  validate(eventSchemas.update),
  updateEventStatus
);

router.delete(
  '/:id',
  authenticate,
  requireOwnershipOrAdmin('created_by'),
  basicRateLimit,
  deleteEvent
);

export default router;
