import { seedGeographic } from './geographic';
import { seedOrganization } from './organization';
import { seedAnak } from './anak';
import { seedUsers } from './users';
import { seedSdm } from './sdm';

export async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    await seedGeographic();
    await seedOrganization();
    await seedSdm();
    await seedAnak();
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
