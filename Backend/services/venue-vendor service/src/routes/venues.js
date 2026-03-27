import express from 'express';
import {
  getVenues,
  getVenue,
  createVenue,
  updateVenue,
  deleteVenue
} from '../controllers/venueController.js';
import {
  authenticate,
  optionalAuth,
  requireAdmin
} from '../middleware/auth.js';
import {
  basicRateLimit,
  adminRateLimit
} from '../middleware/index.js';
import {
  validate,
  venueSchemas
} from '../validators/index.js';

const router = express.Router();

/**
 * Public Routes
 */

// @route   GET /api/v1/venues
// @desc    Get all venues with filtering and pagination
// @access  Public
router.get(
  '/',
  optionalAuth,
  basicRateLimit,
  validate(venueSchemas.search, 'query'),
  getVenues
);

// @route   GET /api/v1/venues/:id
// @desc    Get single venue by ID
// @access  Public
router.get(
  '/:id',
  basicRateLimit,
  getVenue
);

/**
 * Admin Routes
 */

// @route   POST /api/v1/venues
// @desc    Create new venue
// @access  Private (Admin only)
router.post(
  '/',
  authenticate,
  requireAdmin,
  adminRateLimit,
  validate(venueSchemas.create),
  createVenue
);

// @route   PUT /api/v1/venues/:id
// @desc    Update venue
// @access  Private (Admin only)
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  adminRateLimit,
  validate(venueSchemas.update),
  updateVenue
);

// @route   DELETE /api/v1/venues/:id
// @desc    Delete venue permanently from database
// @access  Private (Admin only)
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  adminRateLimit,
  deleteVenue
);

export default router;
