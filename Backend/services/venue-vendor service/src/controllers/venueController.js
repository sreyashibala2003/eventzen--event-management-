import { Venue } from '../models/index.js';
import { asyncHandler } from '../middleware/index.js';

/**
 * @desc    Get all venues with filtering and pagination
 * @route   GET /api/v1/venues
 * @access  Public
 */
export const getVenues = asyncHandler(async (req, res) => {
  const userRoles = [req.user?.role, ...(req.user?.roles || [])]
    .filter(Boolean)
    .map((role) => role.toLowerCase().replace(/^role_/, ''));
  const isAdminUser = userRoles.includes('admin') || userRoles.includes('super_admin');

  const baseFilter = {};
  if (!isAdminUser) {
    baseFilter.status = 'available';
  }

  let query = Venue.find(baseFilter);

  // Apply filters
  if (req.query.city) {
    query = query.where('city').regex(new RegExp(req.query.city, 'i'));
  }

  if (req.query.venue_type) {
    query = query.where('venue_type').equals(req.query.venue_type);
  }

  if (isAdminUser && req.query.status) {
    query = query.where('status').equals(req.query.status);
  }

  if (req.query.min_capacity) {
    query = query.where('capacity').gte(parseInt(req.query.min_capacity));
  }

  if (req.query.max_capacity) {
    query = query.where('capacity').lte(parseInt(req.query.max_capacity));
  }

  if (req.query.min_price) {
    query = query.where('price_per_day').gte(parseFloat(req.query.min_price));
  }

  if (req.query.max_price) {
    query = query.where('price_per_day').lte(parseFloat(req.query.max_price));
  }

  if (req.query.amenities) {
    const amenities = Array.isArray(req.query.amenities) ? req.query.amenities : [req.query.amenities];
    query = query.where('amenities').in(amenities);
  }

  // Text search
  if (req.query.search) {
    query = query.where({ $text: { $search: req.query.search } });
  }

  // Get total count for pagination
  const totalVenues = await Venue.countDocuments(query.getFilter());

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
  const venues = await query
    .sort(sortBy)
    .skip(skip)
    .limit(limit)
    .select('-__v');

  res.status(200).json({
    success: true,
    message: 'Venues retrieved successfully',
    data: {
      venues,
      pagination: {
        total: totalVenues,
        page,
        limit,
        pages: Math.ceil(totalVenues / limit),
        hasNext: page < Math.ceil(totalVenues / limit),
        hasPrev: page > 1
      }
    }
  });
});

/**
 * @desc    Get single venue by ID
 * @route   GET /api/v1/venues/:id
 * @access  Public
 */
export const getVenue = asyncHandler(async (req, res) => {
  const venue = await Venue.findOne({
    venue_id: req.params.id
  });

  if (!venue) {
    return res.status(404).json({
      success: false,
      error: 'VENUE_NOT_FOUND',
      message: 'Venue not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Venue retrieved successfully',
    data: { venue }
  });
});

/**
 * @desc    Create new venue
 * @route   POST /api/v1/venues
 * @access  Private (Admin only)
 */
export const createVenue = asyncHandler(async (req, res) => {
  const venueData = {
    ...req.body,
    created_by: req.user.userId
  };

  const venue = await Venue.create(venueData);

  res.status(201).json({
    success: true,
    message: 'Venue created successfully',
    data: { venue }
  });
});

/**
 * @desc    Update venue
 * @route   PUT /api/v1/venues/:id
 * @access  Private (Admin only)
 */
export const updateVenue = asyncHandler(async (req, res) => {
  const venue = await Venue.findOne({
    venue_id: req.params.id
  });

  if (!venue) {
    return res.status(404).json({
      success: false,
      error: 'VENUE_NOT_FOUND',
      message: 'Venue not found'
    });
  }

  // Update venue data
  const updateData = { ...req.body, updated_by: req.user.userId };
  Object.assign(venue, updateData);
  await venue.save();

  res.status(200).json({
    success: true,
    message: 'Venue updated successfully',
    data: { venue }
  });
});

/**
 * @desc    Delete venue permanently from database
 * @route   DELETE /api/v1/venues/:id
 * @access  Private (Admin only)
 */
export const deleteVenue = asyncHandler(async (req, res) => {
  const venue = await Venue.findOneAndDelete({
    venue_id: req.params.id
  });

  if (!venue) {
    return res.status(404).json({
      success: false,
      error: 'VENUE_NOT_FOUND',
      message: 'Venue not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Venue deleted permanently from database',
    data: {
      venue_id: req.params.id
    }
  });
});

export default {
  getVenues,
  getVenue,
  createVenue,
  updateVenue,
  deleteVenue
};
