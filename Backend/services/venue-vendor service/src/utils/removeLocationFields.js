import mongoose from 'mongoose';
import config from '../config/index.js';
import { Venue, Vendor } from '../models/index.js';

const run = async () => {
  const uri = config.env === 'test' ? config.database.testUri : config.database.uri;

  await mongoose.connect(uri, {
    ...config.database.options,
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000
  });

  const venueResult = await Venue.updateMany(
    { location: { $exists: true } },
    { $unset: { location: 1 } }
  );

  const vendorResult = await Vendor.updateMany(
    { 'address.location': { $exists: true } },
    { $unset: { 'address.location': 1 } }
  );

  try {
    await Venue.collection.dropIndex('location_2dsphere');
  } catch (error) {
    if (error.codeName !== 'IndexNotFound') {
      throw error;
    }
  }

  try {
    await Vendor.collection.dropIndex('address.location_2dsphere');
  } catch (error) {
    if (error.codeName !== 'IndexNotFound') {
      throw error;
    }
  }

  console.log(
    JSON.stringify(
      {
        success: true,
        venuesUpdated: venueResult.modifiedCount,
        vendorsUpdated: vendorResult.modifiedCount
      },
      null,
      2
    )
  );

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error('Failed to remove location fields:', error);
  await mongoose.disconnect();
  process.exit(1);
});
