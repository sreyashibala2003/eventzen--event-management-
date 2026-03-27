import express from 'express';
import {
  getVendors,
  getVendor,
  createVendor,
  updateVendor,
  deleteVendor
} from '../controllers/vendorController.js';
import {
  authenticate,
  requireAdmin,
  requireOwnershipOrAdmin
} from '../middleware/auth.js';
import {
  adminRateLimit,
  dynamicRateLimit
} from '../middleware/index.js';
import {
  validate,
  vendorSchemas
} from '../validators/index.js';

const router = express.Router();

/**
 * Protected Routes (JWT Required)
 */

// @route   GET /api/v1/vendors
// @desc    Get all vendors with filtering and pagination
// @access  Private (JWT required)
router.get(
  '/',
  authenticate,
  dynamicRateLimit,
  validate(vendorSchemas.search, 'query'),
  getVendors
);

// @route   GET /api/v1/vendors/:id
// @desc    Get single vendor by ID
// @access  Private (JWT required)
router.get(
  '/:id',
  authenticate,
  dynamicRateLimit,
  getVendor
);

/**
 * Vendor Routes
 */

// @route   PUT /api/v1/vendors/:id
// @desc    Update vendor (Admin or Vendor owner)
// @access  Private (Admin or Vendor owner)
router.put(
  '/:id',
  authenticate,
  requireOwnershipOrAdmin(),
  dynamicRateLimit,
  validate(vendorSchemas.update),
  updateVendor
);

/**
 * Admin Routes
 */

// @route   POST /api/v1/vendors
// @desc    Create/onboard new vendor
// @access  Private (Admin only)
router.post(
  '/',
  authenticate,
  requireAdmin,
  adminRateLimit,
  validate(vendorSchemas.create),
  createVendor
);

// @route   DELETE /api/v1/vendors/:id
// @desc    Delete vendor permanently from database
// @access  Private (Admin only)
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  adminRateLimit,
  deleteVendor
);

export default router;
