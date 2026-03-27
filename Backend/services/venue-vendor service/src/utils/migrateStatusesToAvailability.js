import mongoose from 'mongoose';
import config from '../config/index.js';
import { Venue, Vendor } from '../models/index.js';

const normalizeStatus = (status) => {
  if (status === 'available' || status === 'unavailable') {
    return status;
  }

  return status === 'active' ? 'available' : 'unavailable';
};

const run = async () => {
  const uri = config.env === 'test' ? config.database.testUri : config.database.uri;

  await mongoose.connect(uri, {
    ...config.database.options,
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000
  });

  const venueAvailable = await Venue.updateMany(
    { status: 'active' },
    { $set: { status: 'available' } }
  );
  const venueUnavailable = await Venue.updateMany(
    { status: { $nin: ['active', 'available', 'unavailable'] } },
    { $set: { status: 'unavailable' } }
  );

  const vendorAvailable = await Vendor.updateMany(
    { status: 'active' },
    { $set: { status: 'available' } }
  );
  const vendorUnavailable = await Vendor.updateMany(
    { status: { $nin: ['active', 'available', 'unavailable'] } },
    { $set: { status: 'unavailable' } }
  );

  const venuesUpdated =
    venueAvailable.modifiedCount + venueUnavailable.modifiedCount;
  const vendorsUpdated =
    vendorAvailable.modifiedCount + vendorUnavailable.modifiedCount;

  console.log(
    JSON.stringify(
      {
        success: true,
        venuesUpdated,
        vendorsUpdated
      },
      null,
      2
    )
  );

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error('Failed to migrate statuses:', error);
  await mongoose.disconnect();
  process.exit(1);
});
