import { Vendor } from '../models/index.js';
import { asyncHandler } from '../middleware/index.js';

/**
 * @desc    Get all vendors with filtering and pagination
 * @route   GET /api/v1/vendors
 * @access  Private (JWT required)
 */
export const getVendors = asyncHandler(async (req, res) => {
  const userRoles = [req.user?.role, ...(req.user?.roles || [])]
    .filter(Boolean)
    .map((role) => role.toLowerCase().replace(/^role_/, ''));
  const isAdminUser = userRoles.includes('admin') || userRoles.includes('super_admin');

  const baseFilter = {};

  // Non-admin users should still be limited to available vendors.
  // Admins can see all current availability states.
  if (!isAdminUser) {
    baseFilter.status = 'available';
  }

  let query = Vendor.find(baseFilter);

  // Apply filters
  if (req.query.service_type) {
    query = query.where('service_type').equals(req.query.service_type);
  }

  if (isAdminUser && req.query.status) {
    query = query.where('status').equals(req.query.status);
  }

  if (req.query.city) {
    query = query.where('address.city').regex(new RegExp(req.query.city, 'i'));
  }

  if (req.query.min_price) {
    query = query.where('pricing.price_per_day').gte(parseFloat(req.query.min_price));
  }

  if (req.query.max_price) {
    query = query.where('pricing.price_per_day').lte(parseFloat(req.query.max_price));
  }

  if (req.query.service_subcategory) {
    const subcategories = Array.isArray(req.query.service_subcategory)
      ? req.query.service_subcategory
      : [req.query.service_subcategory];
    query = query.where('service_subcategory').in(subcategories);
  }

  // Text search
  if (req.query.search) {
    query = query.where({ $text: { $search: req.query.search } });
  }

  // Get total count for pagination
  const totalVendors = await Vendor.countDocuments(query.getFilter());

  // Pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  // Sort
  let sortBy = '-created_at';
  if (req.query.sort) {
    sortBy = req.query.sort;
  }

  // Execute query
  const vendors = await query
    .sort(sortBy)
    .skip(skip)
    .limit(limit)
    .select('-__v');

  res.status(200).json({
    success: true,
    message: 'Vendors retrieved successfully',
    data: {
      vendors,
      pagination: {
        total: totalVendors,
        page,
        limit,
        pages: Math.ceil(totalVendors / limit),
        hasNext: page < Math.ceil(totalVendors / limit),
        hasPrev: page > 1
      }
    }
  });
});

/**
 * @desc    Get single vendor by ID
 * @route   GET /api/v1/vendors/:id
 * @access  Private (JWT required)
 */
export const getVendor = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findOne({
    vendor_id: req.params.id
  }).select('-__v');

  if (!vendor) {
    return res.status(404).json({
      success: false,
      error: 'VENDOR_NOT_FOUND',
      message: 'Vendor not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Vendor retrieved successfully',
    data: { vendor }
  });
});

/**
 * @desc    Create/onboard new vendor
 * @route   POST /api/v1/vendors
 * @access  Private (Admin only)
 */
export const createVendor = asyncHandler(async (req, res) => {
  // Check if vendor with same email already exists
  const existingVendor = await Vendor.findOne({
    'contact_info.primary_email': req.body.contact_info.primary_email
  });

  if (existingVendor) {
    return res.status(409).json({
      success: false,
      error: 'VENDOR_ALREADY_EXISTS',
      message: 'Vendor with this email already exists'
    });
  }

  const vendorData = {
    ...req.body,
    created_by: req.user.userId,
    status: req.body.status || 'available'
  };

  const vendor = await Vendor.create(vendorData);

  res.status(201).json({
    success: true,
    message: 'Vendor created successfully',
    data: { vendor }
  });
});

/**
 * @desc    Update vendor
 * @route   PUT /api/v1/vendors/:id
 * @access  Private (Admin or Vendor owner)
 */
export const updateVendor = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findOne({
    vendor_id: req.params.id
  });

  if (!vendor) {
    return res.status(404).json({
      success: false,
      error: 'VENDOR_NOT_FOUND',
      message: 'Vendor not found'
    });
  }

  // Check ownership if not admin
  if (!['admin', 'super_admin'].includes(req.user.role?.toLowerCase())) {
    if (vendor.created_by !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: 'UNAUTHORIZED_ACCESS',
        message: 'You can only update your own vendor profile'
      });
    }
  }

  const updateData = { ...req.body, updated_by: req.user.userId };

  // Update vendor data
  Object.assign(vendor, updateData);
  await vendor.save();

  res.status(200).json({
    success: true,
    message: 'Vendor updated successfully',
    data: { vendor }
  });
});

/**
 * @desc    Delete vendor permanently from database
 * @route   DELETE /api/v1/vendors/:id
 * @access  Private (Admin only)
 */
export const deleteVendor = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findOneAndDelete({
    vendor_id: req.params.id
  });

  if (!vendor) {
    return res.status(404).json({
      success: false,
      error: 'VENDOR_NOT_FOUND',
      message: 'Vendor not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Vendor deleted permanently from database',
    data: {
      vendor_id: req.params.id
    }
  });
});

export default {
  getVendors,
  getVendor,
  createVendor,
  updateVendor,
  deleteVendor
};
