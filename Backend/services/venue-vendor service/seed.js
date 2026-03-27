import { seedDatabase } from './src/utils/seedData.js';

console.log('🌱 Starting database seeding...\n');

seedDatabase()
  .then((result) => {
    console.log('\n✅ Seeding completed successfully!');
    console.log('📊 Summary:', result);
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seeding failed:', error.message);
    process.exit(1);
  });
