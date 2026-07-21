import { config } from 'dotenv';
config({ path: '.env.local' });

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set in .env.local');
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

import { seedGeographic } from './geographic';
import { seedOrganization } from './organization';
import { seedAnak } from './anak';
import { seedUsers } from './users';
import { seedSdm } from './sdm';
import { seedSemester } from './semester';
import { seedDonatur } from './donatur';

export async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    const geographicData = await seedGeographic(db);
    const organizationData = await seedOrganization(db, geographicData.desa);
    const sdmData = await seedSdm(db, organizationData);
    await seedAnak(db, geographicData, organizationData, sdmData);
    await seedUsers(db, organizationData);
    await seedSemester();
    await seedDonatur();

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
