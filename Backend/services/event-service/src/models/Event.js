import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const VenueSnapshotSchema = new mongoose.Schema({
  venue_id: { type: String, required: true },
  venue_name: { type: String, required: true },
  city: { type: String, required: true },
  state: String,
  address: String,
  capacity: Number,
  price_per_day: Number,
  venue_type: String,
  status: String
}, { _id: false });

const VendorSnapshotSchema = new mongoose.Schema({
  vendor_id: { type: String, required: true },
  vendor_name: { type: String, required: true },
  business_name: String,
  service_type: { type: String, required: true },
  city: String,
  state: String,
  price_per_day: Number,
  currency: String,
  status: String
}, { _id: false });

const EventSchema = new mongoose.Schema({
  event_id: {
    type: String,
    default: uuidv4,
    unique: true,
    required: true
  },
  event_type: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
    index: true
  },
  event_date: {
    type: Date,
    required: true,
    index: true
  },
  start_time: {
    type: String,
    required: true,
    match: /^([01]\d|2[0-3]):([0-5]\d)$/
  },
  end_time: {
    type: String,
    required: true,
    match: /^([01]\d|2[0-3]):([0-5]\d)$/
  },
  guest_count: {
    type: Number,
    required: true,
    min: 1,
    max: 100000
  },
  ticket_price: {
    type: Number,
    min: 0,
    default: 0
  },
  budget: {
    label: { type: String, required: true },
    min_amount: { type: Number, min: 0 },
    max_amount: { type: Number, min: 0 },
    currency: { type: String, default: 'INR' }
  },
  description: {
    type: String,
    required: true,
    maxlength: 4000
  },
  organizer: {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    organization: { type: String, trim: true, maxlength: 200 }
  },
  assignments: {
    venue_id: { type: String, required: true, index: true },
    vendor_id: { type: String, required: true, index: true }
  },
  venue_snapshot: {
    type: VenueSnapshotSchema,
    required: true
  },
  vendor_snapshot: {
    type: VendorSnapshotSchema,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'confirmed', 'cancelled'],
    default: 'confirmed',
    index: true
  },
  created_by: {
    type: String,
    required: true,
    index: true
  },
  created_by_role: {
    type: String,
    default: 'user'
  },
  updated_by: String,
  is_deleted: {
    type: Boolean,
    default: false,
    index: true
  },
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
  collection: 'events',
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      void doc;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

EventSchema.virtual('event_name').get(function eventName() {
  return `${this.event_type} at ${this.venue_snapshot?.venue_name || 'Venue'}`;
});

EventSchema.index({ event_type: 'text', description: 'text', 'organizer.name': 'text', 'venue_snapshot.venue_name': 'text' });
EventSchema.index({ created_by: 1, event_date: -1 });
EventSchema.index({ 'assignments.venue_id': 1, event_date: 1 });
EventSchema.index({ 'assignments.vendor_id': 1, event_date: 1 });

EventSchema.pre('save', function preSave(next) {
  if (this.isModified('start_time') || this.isModified('end_time')) {
    const [startHours, startMinutes] = this.start_time.split(':').map(Number);
    const [endHours, endMinutes] = this.end_time.split(':').map(Number);
    const startTotal = (startHours * 60) + startMinutes;
    const endTotal = (endHours * 60) + endMinutes;

    if (endTotal <= startTotal) {
      const error = new Error('Event end time must be later than start time');
      error.statusCode = 400;
      return next(error);
    }
  }

  if (
    this.budget?.min_amount != null &&
    this.budget?.max_amount != null &&
    this.budget.max_amount < this.budget.min_amount
  ) {
    const error = new Error('Budget maximum amount must be greater than minimum amount');
    error.statusCode = 400;
    return next(error);
  }

  return next();
});

export default mongoose.model('Event', EventSchema);
