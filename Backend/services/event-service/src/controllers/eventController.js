import { Event } from '../models/index.js';
import { asyncHandler } from '../middleware/index.js';
import { fetchVenueById, fetchVendorById } from '../services/venueVendorClient.js';
import { normalizeBudgetPayload } from '../validators/index.js';

const isAdminUser = (user) => {
  const roles = [user?.role, ...(user?.roles || [])]
    .filter(Boolean)
    .map((role) => String(role).toLowerCase().replace(/^role_/, ''));
  return roles.includes('admin') || roles.includes('super_admin');
};

const isAvailableResource = (resource) =>
  String(resource?.status || '').toLowerCase() === 'available';

const formatVenueSnapshot = (venue) => ({
  venue_id: venue.venue_id,
  venue_name: venue.venue_name,
  city: venue.city,
  state: venue.state,
  address: venue.address,
  capacity: venue.capacity,
  price_per_day: venue.price_per_day,
  venue_type: venue.venue_type,
  status: venue.status
});

const formatVendorSnapshot = (vendor) => ({
  vendor_id: vendor.vendor_id,
  vendor_name: vendor.vendor_name,
  business_name: vendor.business_name,
  service_type: vendor.service_type,
  city: vendor.address?.city,
  state: vendor.address?.state,
  price_per_day: vendor.pricing?.price_per_day ?? vendor.pricing?.base_price_range?.min,
  currency: vendor.pricing?.currency ?? vendor.pricing?.base_price_range?.currency ?? 'INR',
  status: vendor.status
});

const getValidatedAssignments = async (req, assignments) => {
  const { venue_id: venueId, vendor_id: vendorId } = assignments;

  const [venue, vendor] = await Promise.all([
    fetchVenueById(venueId, req),
    fetchVendorById(vendorId, req)
  ]);

  if (!venue) {
    return {
      error: {
        status: 404,
        body: {
          success: false,
          error: 'VENUE_NOT_FOUND',
          message: 'Selected venue was not found'
        }
      }
    };
  }

  if (!vendor) {
    return {
      error: {
        status: 404,
        body: {
          success: false,
          error: 'VENDOR_NOT_FOUND',
          message: 'Selected vendor was not found'
        }
      }
    };
  }

  if (!isAvailableResource(venue)) {
    return {
      error: {
        status: 409,
        body: {
          success: false,
          error: 'VENUE_UNAVAILABLE',
          message: 'Selected venue is not currently available'
        }
      }
    };
  }

  if (!isAvailableResource(vendor)) {
    return {
      error: {
        status: 409,
        body: {
          success: false,
          error: 'VENDOR_UNAVAILABLE',
          message: 'Selected vendor is not currently available'
        }
      }
    };
  }

  return { venue, vendor };
};

export const getEvents = asyncHandler(async (req, res) => {
  const filter = { is_deleted: false };
  const adminUser = isAdminUser(req.user);

  if (!adminUser) {
    filter.status = { $ne: 'draft' };
  }

  if (req.query.event_type) {
    filter.event_type = req.query.event_type;
  }

  if (req.query.status && (adminUser || req.query.status !== 'draft')) {
    filter.status = req.query.status;
  }

  if (req.query.venue_id) {
    filter['assignments.venue_id'] = req.query.venue_id;
  }

  if (req.query.vendor_id) {
    filter['assignments.vendor_id'] = req.query.vendor_id;
  }

  if (req.query.created_by) {
    if (!adminUser) {
      if (!req.user?.userId) {
        return res.status(401).json({
          success: false,
          error: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication is required to filter events by creator'
        });
      }

      if (req.query.created_by !== req.user.userId) {
        return res.status(403).json({
          success: false,
          error: 'UNAUTHORIZED_ACCESS',
          message: 'You can only view your own events with this filter'
        });
      }
    }

    filter.created_by = req.query.created_by;
  }

  if (req.query.upcoming_only) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    filter.event_date = { $gte: startOfToday };
  }

  if (req.query.search) {
    filter.$text = { $search: req.query.search };
  }

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 12;
  const skip = (page - 1) * limit;
  const sort = req.query.sort || '-event_date';

  const [events, total] = await Promise.all([
    Event.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select('-is_deleted'),
    Event.countDocuments(filter)
  ]);

  res.status(200).json({
    success: true,
    message: 'Events retrieved successfully',
    data: {
      events,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    }
  });
});

export const getEvent = asyncHandler(async (req, res) => {
  const event = await Event.findOne({
    event_id: req.params.id,
    is_deleted: false
  }).select('-is_deleted');

  if (!event) {
    return res.status(404).json({
      success: false,
      error: 'EVENT_NOT_FOUND',
      message: 'Event not found'
    });
  }

  if (
    event.status === 'draft' &&
    !isAdminUser(req.user) &&
    event.created_by !== req.user?.userId
  ) {
    return res.status(404).json({
      success: false,
      error: 'EVENT_NOT_FOUND',
      message: 'Event not found'
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Event retrieved successfully',
    data: { event }
  });
});

export const createEvent = asyncHandler(async (req, res) => {
  const assignmentResult = await getValidatedAssignments(req, req.body.assignments);

  if (assignmentResult.error) {
    return res.status(assignmentResult.error.status).json(assignmentResult.error.body);
  }

  const { venue, vendor } = assignmentResult;

  const event = await Event.create({
    ...req.body,
    budget: normalizeBudgetPayload(req.body.budget),
    venue_snapshot: formatVenueSnapshot(venue),
    vendor_snapshot: formatVendorSnapshot(vendor),
    created_by: req.user.userId,
    created_by_role: req.user.role || req.user.roles?.[0] || 'user'
  });

  return res.status(201).json({
    success: true,
    message: 'Event created successfully',
    data: { event }
  });
});

export const updateEvent = asyncHandler(async (req, res) => {
  const event = await Event.findOne({
    event_id: req.params.id,
    is_deleted: false
  });

  if (!event) {
    return res.status(404).json({
      success: false,
      error: 'EVENT_NOT_FOUND',
      message: 'Event not found'
    });
  }

  if (!isAdminUser(req.user) && req.requireOwnershipCheck && event[req.requireOwnershipCheck.field] !== req.requireOwnershipCheck.userId) {
    return res.status(403).json({
      success: false,
      error: 'UNAUTHORIZED_ACCESS',
      message: 'You can only update your own event'
    });
  }

  const assignmentResult = await getValidatedAssignments(req, req.body.assignments);

  if (assignmentResult.error) {
    return res.status(assignmentResult.error.status).json(assignmentResult.error.body);
  }

  const { venue, vendor } = assignmentResult;

  Object.assign(event, {
    ...req.body,
    budget: normalizeBudgetPayload(req.body.budget),
    venue_snapshot: formatVenueSnapshot(venue),
    vendor_snapshot: formatVendorSnapshot(vendor),
    updated_by: req.user.userId
  });

  await event.save();

  return res.status(200).json({
    success: true,
    message: 'Event updated successfully',
    data: { event }
  });
});

export const updateEventStatus = asyncHandler(async (req, res) => {
  const event = await Event.findOne({
    event_id: req.params.id,
    is_deleted: false
  });

  if (!event) {
    return res.status(404).json({
      success: false,
      error: 'EVENT_NOT_FOUND',
      message: 'Event not found'
    });
  }

  if (!isAdminUser(req.user) && req.requireOwnershipCheck && event[req.requireOwnershipCheck.field] !== req.requireOwnershipCheck.userId) {
    return res.status(403).json({
      success: false,
      error: 'UNAUTHORIZED_ACCESS',
      message: 'You can only update your own event'
    });
  }

  event.status = req.body.status;
  event.updated_by = req.user.userId;
  await event.save();

  return res.status(200).json({
    success: true,
    message: 'Event updated successfully',
    data: { event }
  });
});

export const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findOne({
    event_id: req.params.id,
    is_deleted: false
  });

  if (!event) {
    return res.status(404).json({
      success: false,
      error: 'EVENT_NOT_FOUND',
      message: 'Event not found'
    });
  }

  if (!isAdminUser(req.user) && req.requireOwnershipCheck && event[req.requireOwnershipCheck.field] !== req.requireOwnershipCheck.userId) {
    return res.status(403).json({
      success: false,
      error: 'UNAUTHORIZED_ACCESS',
      message: 'You can only delete your own event'
    });
  }

  await Event.deleteOne({ _id: event._id });

  return res.status(200).json({
    success: true,
    message: 'Event deleted successfully'
  });
});
