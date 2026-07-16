import { seedUsers } from './users';

export async function seedDatabase() {
  try {
    await seedUsers();
    console.log('🎉 Database seeding completed successfully');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
