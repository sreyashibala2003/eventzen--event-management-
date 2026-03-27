import { Venue, Vendor } from '../models/index.js';
import database from '../config/database.js';

const sampleVenues = [
  {
    venue_name: 'Grand Palace Convention Center',
    address: '123 Business District, Sector 5, Gurgaon',
    city: 'Gurgaon',
    state: 'Haryana',
    country: 'India',
    postal_code: '122001',
    capacity: 2000,
    price_per_day: 150000,
    description: 'A luxury convention center perfect for corporate events and large conferences.',
    amenities: ['parking', 'wifi', 'sound_system', 'projector', 'ac', 'security'],
    venue_type: 'conference_center',
    contact_info: {
      phone: '+91-9876543210',
      email: 'info@grandpalace.com',
      website: 'https://grandpalace.com',
      manager_name: 'Rajesh Kumar'
    },
    images: [
      {
        url: 'https://example.com/images/grand-palace-1.jpg',
        caption: 'Main Hall',
        is_primary: true
      }
    ],
    status: 'available',
    created_by: 'admin-seed-user'
  },
  {
    venue_name: 'Bloom Garden Resort',
    address: '456 Garden Lane, New Friends Colony, New Delhi',
    city: 'New Delhi',
    state: 'Delhi',
    country: 'India',
    postal_code: '110025',
    capacity: 500,
    price_per_day: 75000,
    description: 'Beautiful garden resort ideal for weddings and outdoor celebrations.',
    amenities: ['parking', 'catering_kitchen', 'photo_booth_area', 'handicap_accessible'],
    venue_type: 'garden',
    contact_info: {
      phone: '+91-9876543211',
      email: 'bookings@bloomgarden.com',
      manager_name: 'Priya Sharma'
    },
    status: 'available',
    created_by: 'admin-seed-user'
  },
  {
    venue_name: 'Elite Banquet Hall',
    address: '789 CP Metro Station, Connaught Place, New Delhi',
    city: 'New Delhi',
    state: 'Delhi',
    country: 'India',
    postal_code: '110001',
    capacity: 300,
    price_per_day: 50000,
    description: 'Premium banquet hall in the heart of Delhi, perfect for celebrations.',
    amenities: ['wifi', 'sound_system', 'ac', 'valet_parking'],
    venue_type: 'banquet_hall',
    contact_info: {
      phone: '+91-9876543212',
      email: 'events@elitebanquet.com',
      manager_name: 'Amit Singh'
    },
    status: 'available',
    created_by: 'admin-seed-user'
  }
];

const sampleVendors = [
  {
    vendor_name: 'Delicious Delights Catering',
    business_name: 'Delicious Delights Pvt. Ltd.',
    service_type: 'catering',
    service_subcategory: ['indian', 'chinese', 'continental'],
    contact_info: {
      primary_email: 'orders@deliciousdelights.com',
      primary_phone: '+91-9876543220',
      website: 'https://deliciousdelights.com'
    },
    address: {
      city: 'New Delhi',
      state: 'Delhi',
      country: 'India'
    },
    pricing: {
      price_per_day: 800,
      currency: 'INR'
    },
    status: 'available',
    created_by: 'admin-seed-user'
  },
  {
    vendor_name: 'Capture Memories Photography',
    service_type: 'photography',
    service_subcategory: ['wedding', 'corporate', 'event'],
    contact_info: {
      primary_email: 'bookings@capturememories.com',
      primary_phone: '+91-9876543221'
    },
    address: {
      city: 'Gurgaon',
      state: 'Haryana',
      country: 'India'
    },
    pricing: {
      price_per_day: 25000,
      currency: 'INR'
    },
    status: 'available',
    created_by: 'admin-seed-user'
  },
  {
    vendor_name: 'Elegant Decor Solutions',
    service_type: 'decoration',
    service_subcategory: ['wedding', 'corporate', 'birthday'],
    contact_info: {
      primary_email: 'designs@elegantdecor.com',
      primary_phone: '+91-9876543222'
    },
    address: {
      city: 'New Delhi',
      state: 'Delhi',
      country: 'India'
    },
    pricing: {
      price_per_day: 15000,
      currency: 'INR'
    },
    status: 'available',
    created_by: 'admin-seed-user'
  }
];

export const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');

    if (!database.isHealthy()) {
      await database.connect();
    }

    console.log('Clearing existing data...');
    await Venue.deleteMany({});
    await Vendor.deleteMany({});

    console.log('Seeding venues...');
    const createdVenues = await Venue.insertMany(sampleVenues);
    console.log(`Created ${createdVenues.length} venues`);

    console.log('Seeding vendors...');
    const createdVendors = await Vendor.insertMany(sampleVendors);
    console.log(`Created ${createdVendors.length} vendors`);

    console.log('Database seeding completed successfully');

    return {
      venues: createdVenues.length,
      vendors: createdVendors.length
    };
  } catch (error) {
    console.error('Database seeding failed:', error);
    throw error;
  }
};

export const clearDatabase = async () => {
  try {
    console.log('Clearing database...');
    await Venue.deleteMany({});
    await Vendor.deleteMany({});
    console.log('Database cleared successfully');
  } catch (error) {
    console.error('Database clearing failed:', error);
    throw error;
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => {
      console.log('Seeding script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding script failed:', error);
      process.exit(1);
    });
}

export default { seedDatabase, clearDatabase };
