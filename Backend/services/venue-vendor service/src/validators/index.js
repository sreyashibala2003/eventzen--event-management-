import Joi from 'joi';

/**
 * Common validation schemas
 */
const commonSchemas = {
  id: Joi.string().uuid().required().messages({
    'string.uuid': 'ID must be a valid UUID',
    'any.required': 'ID is required'
  }),

  optionalId: Joi.string().uuid().optional().messages({
    'string.uuid': 'ID must be a valid UUID'
  }),

  email: Joi.string().email().required().messages({
    'string.email': 'Must be a valid email address',
    'any.required': 'Email is required'
  }),

  phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]{10,15}$/).required().messages({
    'string.pattern.base': 'Phone number must be 10-15 digits',
    'any.required': 'Phone number is required'
  }),

  dateRange: Joi.object({
    start_date: Joi.date().iso().required(),
    end_date: Joi.date().iso().min(Joi.ref('start_date')).required()
  }).messages({
    'date.min': 'End date must be after start date'
  }),

  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string().valid('created_at', 'updated_at', '-created_at', '-updated_at').default('-created_at')
  }),

  pricePerDay: Joi.object({
    price_per_day: Joi.number().min(0).required(),
    currency: Joi.string().length(3).default('INR')
  })
};

/**
 * Venue Validation Schemas
 */
export const venueSchemas = {
  create: Joi.object({
    venue_name: Joi.string().min(3).max(200).required(),
    address: Joi.string().min(10).max(500).required(),
    city: Joi.string().min(2).max(100).required(),
    state: Joi.string().max(100).optional(),
    country: Joi.string().max(100).default('India'),
    postal_code: Joi.string().max(20).optional(),
    capacity: Joi.number().integer().min(1).max(50000).required(),
    price_per_day: Joi.number().min(0).required(),
    description: Joi.string().max(2000).optional(),
    amenities: Joi.array().items(
      Joi.string().valid('parking', 'wifi', 'catering_kitchen', 'sound_system', 'projector', 'ac', 'handicap_accessible', 'security', 'valet_parking', 'photo_booth_area')
    ).optional(),
    venue_type: Joi.string().valid('banquet_hall', 'conference_center', 'outdoor_space', 'hotel', 'restaurant', 'community_center', 'resort', 'garden', 'auditorium').required(),
    images: Joi.array().items(Joi.object({
      url: Joi.string().uri().required(),
      caption: Joi.string().max(200).optional(),
      is_primary: Joi.boolean().default(false)
    })).optional(),
    contact_info: Joi.object({
      phone: commonSchemas.phone,
      email: commonSchemas.email,
      website: Joi.string().uri().optional(),
      manager_name: Joi.string().max(100).optional()
    }).required(),
    cancellation_policy: Joi.string().valid('flexible', 'moderate', 'strict').default('moderate')
  }),

  update: Joi.object({
    venue_name: Joi.string().min(3).max(200).optional(),
    address: Joi.string().min(10).max(500).optional(),
    city: Joi.string().min(2).max(100).optional(),
    state: Joi.string().max(100).optional(),
    country: Joi.string().max(100).optional(),
    postal_code: Joi.string().max(20).optional(),
    capacity: Joi.number().integer().min(1).max(50000).optional(),
    price_per_day: Joi.number().min(0).optional(),
    description: Joi.string().max(2000).optional(),
    amenities: Joi.array().items(
      Joi.string().valid('parking', 'wifi', 'catering_kitchen', 'sound_system', 'projector', 'ac', 'handicap_accessible', 'security', 'valet_parking', 'photo_booth_area')
    ).optional(),
    venue_type: Joi.string().valid('banquet_hall', 'conference_center', 'outdoor_space', 'hotel', 'restaurant', 'community_center', 'resort', 'garden', 'auditorium').optional(),
    images: Joi.array().items(Joi.object({
      url: Joi.string().uri().required(),
      caption: Joi.string().max(200).optional(),
      is_primary: Joi.boolean().default(false)
    })).optional(),
    contact_info: Joi.object({
      phone: commonSchemas.phone.optional(),
      email: commonSchemas.email.optional(),
      website: Joi.string().uri().optional(),
      manager_name: Joi.string().max(100).optional()
    }).optional(),
    status: Joi.string().valid('available', 'unavailable').optional(),
    cancellation_policy: Joi.string().valid('flexible', 'moderate', 'strict').optional()
  }).min(1),

  search: Joi.object({
    city: Joi.string().max(100).optional(),
    venue_type: Joi.string().valid('banquet_hall', 'conference_center', 'outdoor_space', 'hotel', 'restaurant', 'community_center', 'resort', 'garden', 'auditorium').optional(),
    status: Joi.string().valid('available', 'unavailable').optional(),
    min_capacity: Joi.number().integer().min(1).optional(),
    max_capacity: Joi.number().integer().min(1).optional(),
    min_price: Joi.number().min(0).optional(),
    max_price: Joi.number().min(0).optional(),
    amenities: Joi.array().items(Joi.string()).optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string().valid('created_at', 'updated_at', 'price_per_day', 'capacity', '-created_at', '-updated_at', '-price_per_day', '-capacity').default('-created_at')
  })
};

/**
 * Vendor Validation Schemas
 */
export const vendorSchemas = {
  create: Joi.object({
    vendor_name: Joi.string().min(3).max(200).required(),
    business_name: Joi.string().max(200).optional(),
    service_type: Joi.string().valid(
      'catering', 'decoration', 'photography', 'videography', 'music_dj', 'live_band',
      'lighting', 'sound_system', 'security', 'transport', 'florist', 'cake_bakery',
      'event_planning', 'mc_host', 'entertainment', 'rental_equipment', 'makeup_artist',
      'mehendi_artist', 'cleaning_services'
    ).required(),
    contact_info: Joi.object({
      primary_email: commonSchemas.email,
      primary_phone: commonSchemas.phone,
      website: Joi.string().uri().optional()
    }).required(),
    address: Joi.object({
      city: Joi.string().min(2).max(100).required(),
      state: Joi.string().optional(),
      country: Joi.string().default('India')
    }).required(),
    pricing: commonSchemas.pricePerDay.required()
  }),

  update: Joi.object({
    vendor_name: Joi.string().min(3).max(200).optional(),
    business_name: Joi.string().max(200).optional(),
    service_type: Joi.string().valid(
      'catering', 'decoration', 'photography', 'videography', 'music_dj', 'live_band',
      'lighting', 'sound_system', 'security', 'transport', 'florist', 'cake_bakery',
      'event_planning', 'mc_host', 'entertainment', 'rental_equipment', 'makeup_artist',
      'mehendi_artist', 'cleaning_services'
    ).optional(),
    contact_info: Joi.object({
      primary_email: commonSchemas.email.optional(),
      primary_phone: commonSchemas.phone.optional(),
      website: Joi.string().uri().optional()
    }).optional(),
    address: Joi.object({
      city: Joi.string().min(2).max(100).optional(),
      state: Joi.string().optional(),
      country: Joi.string().optional()
    }).optional(),
    pricing: Joi.object({
      price_per_day: Joi.number().min(0).optional(),
      currency: Joi.string().length(3).optional()
    }).optional(),
    status: Joi.string().valid('available', 'unavailable').optional()
  }).min(1),

  search: Joi.object({
    service_type: Joi.string().valid(
      'catering', 'decoration', 'photography', 'videography', 'music_dj', 'live_band',
      'lighting', 'sound_system', 'security', 'transport', 'florist', 'cake_bakery',
      'event_planning', 'mc_host', 'entertainment', 'rental_equipment', 'makeup_artist',
      'mehendi_artist', 'cleaning_services'
    ).optional(),
    status: Joi.string().valid('available', 'unavailable').optional(),
    city: Joi.string().max(100).optional(),
    min_price: Joi.number().min(0).optional(),
    max_price: Joi.number().min(0).optional(),
    service_subcategory: Joi.array().items(Joi.string()).optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string().valid('created_at', 'updated_at', 'service_type', 'pricing.price_per_day', '-created_at', '-updated_at', '-service_type', '-pricing.price_per_day').default('-created_at')
  })
};

/**
 * Validation Middleware Factory
 */
export const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type
      }));

      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: errorDetails
      });
    }

    // Replace the request property with validated and sanitized data
    req[property] = value;
    next();
  };
};

export default {
  venueSchemas,
  vendorSchemas,
  validate,
  commonSchemas
};
