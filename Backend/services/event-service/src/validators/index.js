import Joi from 'joi';

const budgetLabelMap = {
  'Under Rs. 50,000': { min_amount: 0, max_amount: 50000 },
  'Rs. 50,000 - Rs. 1,00,000': { min_amount: 50000, max_amount: 100000 },
  'Rs. 1,00,000 - Rs. 3,00,000': { min_amount: 100000, max_amount: 300000 },
  'Rs. 3,00,000 - Rs. 5,00,000': { min_amount: 300000, max_amount: 500000 },
  'Above Rs. 5,00,000': { min_amount: 500000, max_amount: null }
};

const commonSchemas = {
  uuid: Joi.string().uuid().required(),
  phone: Joi.string().pattern(/^\+?[\d\s\-()]{10,20}$/).required()
};

export const budgetRanges = Object.keys(budgetLabelMap);

export const eventSchemas = {
  create: Joi.object({
    event_type: Joi.string().min(2).max(100).required(),
    event_date: Joi.date().iso().required(),
    start_time: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
    end_time: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
    guest_count: Joi.number().integer().min(1).max(100000).required(),
    ticket_price: Joi.number().min(0).default(0),
    budget: Joi.object({
      label: Joi.string().valid(...budgetRanges).required(),
      min_amount: Joi.number().min(0).allow(null),
      max_amount: Joi.number().min(0).allow(null),
      currency: Joi.string().default('INR')
    }).required(),
    description: Joi.string().min(10).max(4000).required(),
    organizer: Joi.object({
      name: Joi.string().min(2).max(150).required(),
      email: Joi.string().email().required(),
      phone: commonSchemas.phone,
      organization: Joi.string().allow('').max(200).optional()
    }).required(),
    assignments: Joi.object({
      venue_id: commonSchemas.uuid,
      vendor_id: commonSchemas.uuid
    }).required(),
    status: Joi.string().valid('draft', 'confirmed', 'cancelled').default('confirmed')
  }),
  replace: Joi.object({
    event_type: Joi.string().min(2).max(100).required(),
    event_date: Joi.date().iso().required(),
    start_time: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
    end_time: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
    guest_count: Joi.number().integer().min(1).max(100000).required(),
    ticket_price: Joi.number().min(0).default(0),
    budget: Joi.object({
      label: Joi.string().valid(...budgetRanges).required(),
      min_amount: Joi.number().min(0).allow(null),
      max_amount: Joi.number().min(0).allow(null),
      currency: Joi.string().default('INR')
    }).required(),
    description: Joi.string().min(10).max(4000).required(),
    organizer: Joi.object({
      name: Joi.string().min(2).max(150).required(),
      email: Joi.string().email().required(),
      phone: commonSchemas.phone,
      organization: Joi.string().allow('').max(200).optional()
    }).required(),
    assignments: Joi.object({
      venue_id: commonSchemas.uuid,
      vendor_id: commonSchemas.uuid
    }).required(),
    status: Joi.string().valid('draft', 'confirmed', 'cancelled').default('confirmed')
  }),
  update: Joi.object({
    status: Joi.string().valid('draft', 'confirmed', 'cancelled').required()
  }),
  search: Joi.object({
    event_type: Joi.string().max(100).optional(),
    status: Joi.string().valid('draft', 'confirmed', 'cancelled').optional(),
    venue_id: Joi.string().uuid().optional(),
    vendor_id: Joi.string().uuid().optional(),
    created_by: Joi.string().optional(),
    search: Joi.string().max(200).optional(),
    upcoming_only: Joi.boolean().truthy('true').falsy('false').default(false),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(12),
    sort: Joi.string().default('-event_date')
  })
};

export const normalizeBudgetPayload = (budget) => {
  const mappedRange = budgetLabelMap[budget.label];
  if (!mappedRange) {
    return budget;
  }

  return {
    currency: budget.currency || 'INR',
    label: budget.label,
    min_amount: typeof budget.min_amount === 'number' ? budget.min_amount : mappedRange.min_amount,
    max_amount: budget.max_amount === null || typeof budget.max_amount === 'number'
      ? budget.max_amount
      : mappedRange.max_amount
  };
};

export const validate = (schema, property = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[property], {
    abortEarly: false,
    stripUnknown: true,
    allowUnknown: false
  });

  if (error) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details: error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type
      }))
    });
  }

  req[property] = value;
  return next();
};

export default {
  commonSchemas,
  eventSchemas,
  budgetRanges,
  normalizeBudgetPayload,
  validate
};
