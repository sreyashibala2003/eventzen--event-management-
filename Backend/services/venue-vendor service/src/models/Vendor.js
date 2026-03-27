import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const VendorSchema = new mongoose.Schema({
  vendor_id: {
    type: String,
    default: uuidv4,
    unique: true,
    required: true
  },
  vendor_name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  business_name: {
    type: String,
    trim: true,
    maxlength: 200
  },
  service_type: {
    type: String,
    required: true,
    enum: [
      'catering',
      'decoration',
      'photography',
      'videography',
      'music_dj',
      'live_band',
      'lighting',
      'sound_system',
      'security',
      'transport',
      'florist',
      'cake_bakery',
      'event_planning',
      'mc_host',
      'entertainment',
      'rental_equipment',
      'makeup_artist',
      'mehendi_artist',
      'cleaning_services'
    ],
    index: true
  },
  service_subcategory: [String],

  contact_info: {
    primary_email: {
      type: String,
      required: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    primary_phone: {
      type: String,
      required: true,
      match: /^\+?[\d\s\-\(\)]{10,15}$/
    },
    website: String
  },

  address: {
    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      index: true
    },
    state: String,
    country: {
      type: String,
      default: 'India'
    }
  },

  pricing: {
    price_per_day: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR'
    }
  },

  status: {
    type: String,
    required: true,
    enum: ['available', 'unavailable'],
    default: 'available',
    index: true
  },
  created_by: {
    type: String,
    required: true
  },
  updated_by: String,
  created_at: {
    type: Date,
    default: Date.now,
    index: true
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for performance
VendorSchema.index({ service_type: 1, 'address.city': 1 });
VendorSchema.index({ 'contact_info.primary_email': 1 });
VendorSchema.index({ vendor_name: 'text', business_name: 'text' });
VendorSchema.index({ 'pricing.price_per_day': 1 });
VendorSchema.index({ status: 1, created_at: -1 });

// Pre-save middleware
VendorSchema.pre('save', function(next) {
  const pricePerDay = this.pricing?.price_per_day;

  if (typeof pricePerDay !== 'number' || isNaN(pricePerDay)) {
    const error = new Error('Price per day must be a valid number');
    error.statusCode = 400;
    return next(error);
  }

  if (pricePerDay < 0) {
    const error = new Error('Price per day must be a positive number');
    error.statusCode = 400;
    return next(error);
  }

  if (this.isModified() && !this.isNew) {
    this.updated_at = new Date();
  }

  next();
});

export default mongoose.model('Vendor', VendorSchema);
