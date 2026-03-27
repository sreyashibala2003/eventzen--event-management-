import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const VenueSchema = new mongoose.Schema({
  venue_id: {
    type: String,
    default: uuidv4,
    unique: true,
    required: true
  },
  venue_name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  address: {
    type: String,
    required: true,
    maxlength: 500
  },
  city: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
    index: true
  },
  state: {
    type: String,
    trim: true,
    maxlength: 100
  },
  country: {
    type: String,
    required: true,
    default: 'India',
    maxlength: 100
  },
  postal_code: {
    type: String,
    maxlength: 20
  },
  capacity: {
    type: Number,
    required: true,
    min: 1,
    max: 50000,
    index: true
  },
  price_per_day: {
    type: Number,
    required: true,
    min: 0,
    index: true
  },
  description: {
    type: String,
    maxlength: 2000
  },
  amenities: [{
    type: String,
    enum: ['parking', 'wifi', 'catering_kitchen', 'sound_system', 'projector', 'ac', 'handicap_accessible', 'security', 'valet_parking', 'photo_booth_area']
  }],
  venue_type: {
    type: String,
    required: true,
    enum: ['banquet_hall', 'conference_center', 'outdoor_space', 'hotel', 'restaurant', 'community_center', 'resort', 'garden', 'auditorium'],
    index: true
  },
  images: [{
    url: String,
    caption: String,
    is_primary: {
      type: Boolean,
      default: false
    }
  }],
  contact_info: {
    phone: {
      type: String,
      required: true,
      match: /^\+?[\d\s\-\(\)]{10,15}$/
    },
    email: {
      type: String,
      required: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    website: String,
    manager_name: String
  },
  status: {
    type: String,
    required: true,
    enum: ['available', 'unavailable'],
    default: 'available',
    index: true
  },
  cancellation_policy: {
    type: String,
    enum: ['flexible', 'moderate', 'strict'],
    default: 'moderate'
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
VenueSchema.index({ city: 1, venue_type: 1 });
VenueSchema.index({ capacity: 1, price_per_day: 1 });
VenueSchema.index({ venue_name: 'text', description: 'text' }); // Text search
VenueSchema.index({ created_at: -1 });

// Pre-save middleware
VenueSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.updated_at = new Date();
  }
  next();
});

export default mongoose.model('Venue', VenueSchema);
